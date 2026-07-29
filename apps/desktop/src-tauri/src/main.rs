use serde::Serialize;
use std::path::PathBuf;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureSource {
    id: String,
    label: String,
    kind: CaptureSourceKind,
    state: CaptureSourceState,
}

#[derive(Serialize)]
#[serde(rename_all = "kebab-case")]
enum CaptureSourceKind {
    Phone,
    Webcam,
    Microphone,
}

#[derive(Serialize)]
#[serde(rename_all = "kebab-case")]
enum CaptureSourceState {
    Unavailable,
    PermissionRequired,
}

#[tauri::command]
fn list_capture_sources() -> Vec<CaptureSource> {
    vec![
        CaptureSource {
            id: "iphone-usb".into(),
            label: "iPhone USB capture".into(),
            kind: CaptureSourceKind::Phone,
            state: CaptureSourceState::Unavailable,
        },
        CaptureSource {
            id: "facetime-camera".into(),
            label: "Webcam".into(),
            kind: CaptureSourceKind::Webcam,
            state: CaptureSourceState::PermissionRequired,
        },
        CaptureSource {
            id: "default-microphone".into(),
            label: "Microphone".into(),
            kind: CaptureSourceKind::Microphone,
            state: CaptureSourceState::PermissionRequired,
        },
    ]
}

#[tauri::command]
fn write_project_document(path: String, doc_json: String) -> Result<(), String> {
    let project_dir = expand_project_path(&path)?;
    std::fs::create_dir_all(&project_dir).map_err(|error| error.to_string())?;
    std::fs::write(project_dir.join("project.json"), doc_json).map_err(|error| error.to_string())
}

#[tauri::command]
fn open_privacy_settings(requirement: String) -> Result<(), String> {
    let pane = match requirement.as_str() {
        "camera" => "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera",
        "microphone" => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
        }
        _ => return Err("Unsupported privacy requirement".to_string()),
    };

    std::process::Command::new("open")
        .arg(pane)
        .status()
        .map_err(|error| error.to_string())
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err("Could not open System Settings".to_string())
            }
        })
}

fn expand_project_path(path: &str) -> Result<PathBuf, String> {
    if let Some(rest) = path.strip_prefix("~/") {
        let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        return Ok(PathBuf::from(home).join(rest));
    }

    Ok(PathBuf::from(path))
}

fn main() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_reeldock_local_tables",
        sql: include_str!("../../src/db/local/migrations/0000_initial_reeldock.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:reeldock.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            list_capture_sources,
            open_privacy_settings,
            write_project_document
        ])
        .run(tauri::generate_context!())
        .expect("failed to run ReelDock");
}
