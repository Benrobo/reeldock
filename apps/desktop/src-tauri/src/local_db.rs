use serde::Deserialize;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use std::path::PathBuf;
use std::str::FromStr;
use tauri::{AppHandle, Manager};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInsert {
    id: String,
    name: String,
    path: String,
    #[serde(default)]
    thumbnail: Option<String>,
    duration_seconds: i64,
    canvas_ratio: String,
    layout_id: String,
    status: String,
    doc_json: String,
    created_at: String,
    updated_at: String,
    last_opened_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceTrackInsert {
    id: String,
    project_id: String,
    kind: String,
    label: String,
    #[serde(default)]
    file_path: Option<String>,
    state: String,
    enabled: bool,
    start_offset_ms: i64,
    duration_ms: i64,
    created_at: String,
}

#[tauri::command]
pub async fn create_project_with_sources(
    app: AppHandle,
    project: ProjectInsert,
    sources: Vec<SourceTrackInsert>,
) -> Result<(), String> {
    // This command owns a real SQLite transaction on the Rust side.
    // We use it for multi-write workflows because the frontend Drizzle proxy cannot hold one connection.
    // If any project/source insert fails, commit is skipped and SQLite rolls the whole transaction back.
    let options = SqliteConnectOptions::from_str(&database_url(&app)?)
        .map_err(|error| error.to_string())?
        .create_if_missing(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .map_err(|error| error.to_string())?;

    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&pool)
        .await
        .map_err(|error| error.to_string())?;

    let mut transaction = pool.begin().await.map_err(|error| error.to_string())?;

    sqlx::query(
        "INSERT INTO projects (id, name, path, thumbnail, duration_seconds, canvas_ratio, layout_id, status, doc_json, created_at, updated_at, last_opened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&project.id)
    .bind(&project.name)
    .bind(&project.path)
    .bind(&project.thumbnail)
    .bind(project.duration_seconds)
    .bind(&project.canvas_ratio)
    .bind(&project.layout_id)
    .bind(&project.status)
    .bind(&project.doc_json)
    .bind(&project.created_at)
    .bind(&project.updated_at)
    .bind(&project.last_opened_at)
    .execute(&mut *transaction)
    .await
    .map_err(|error| error.to_string())?;

    for source in sources {
        sqlx::query(
            "INSERT INTO source_tracks (id, project_id, kind, label, file_path, state, enabled, start_offset_ms, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&source.id)
        .bind(&source.project_id)
        .bind(&source.kind)
        .bind(&source.label)
        .bind(&source.file_path)
        .bind(&source.state)
        .bind(source.enabled)
        .bind(source.start_offset_ms)
        .bind(source.duration_ms)
        .bind(&source.created_at)
        .execute(&mut *transaction)
        .await
        .map_err(|error| error.to_string())?;
    }

    transaction
        .commit()
        .await
        .map_err(|error| error.to_string())?;
    pool.close().await;
    Ok(())
}

#[tauri::command]
pub async fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    // Delete is also native because it touches dependent rows.
    // The project folder is removed before commit, so a filesystem failure rolls back the library delete.
    // This keeps SQLite and the on-disk .reeldock folder from drifting apart during normal failures.
    let options = SqliteConnectOptions::from_str(&database_url(&app)?)
        .map_err(|error| error.to_string())?
        .create_if_missing(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .map_err(|error| error.to_string())?;

    let mut transaction = pool.begin().await.map_err(|error| error.to_string())?;
    let project_path: Option<String> = sqlx::query_scalar("SELECT path FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| error.to_string())?;

    sqlx::query("DELETE FROM export_jobs WHERE project_id = ?")
        .bind(&project_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| error.to_string())?;

    sqlx::query("DELETE FROM source_tracks WHERE project_id = ?")
        .bind(&project_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| error.to_string())?;

    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(&project_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| error.to_string())?;

    if let Some(project_path) = project_path {
        tauri::async_runtime::spawn_blocking(move || remove_project_folder(&project_path))
            .await
            .map_err(|error| error.to_string())??;
    }

    transaction
        .commit()
        .await
        .map_err(|error| error.to_string())?;
    pool.close().await;
    Ok(())
}

fn database_url(app: &AppHandle) -> Result<String, String> {
    // Tauri stores app data under the per-app config directory on macOS.
    // The JS SQL plugin uses the same relative sqlite:reeldock.db path internally.
    // Building the absolute URL here lets direct sqlx commands hit the same database file.
    let mut app_path = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&app_path).map_err(|error| error.to_string())?;
    app_path.push("reeldock.db");
    Ok(format!("sqlite:{}", app_path.to_string_lossy()))
}

fn expand_project_path(path: &str) -> Result<PathBuf, String> {
    if let Some(relative_path) = path.strip_prefix("~/") {
        let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        return Ok(PathBuf::from(home).join(relative_path));
    }

    Ok(PathBuf::from(path))
}

fn remove_project_folder(path: &str) -> Result<(), String> {
    // Project paths in SQLite use ~/ for stable display across machines.
    // Rust must expand that to an absolute path before touching the filesystem.
    // Missing folders are treated as already deleted so stale DB rows can still be cleaned up.
    let project_dir = expand_project_path(path)?;
    if !project_dir.exists() {
        return Ok(());
    }

    std::fs::remove_dir_all(&project_dir).map_err(|error| {
        format!(
            "Could not delete project folder at {}: {}",
            project_dir.to_string_lossy(),
            error
        )
    })
}
