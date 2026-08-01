use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Deserialize, Serialize)]
pub struct ExportTrackInput {
    pub kind: String,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "startOffsetMs")]
    pub start_offset_ms: i32,
    #[serde(rename = "durationMs")]
    pub duration_ms: i32,
}

#[derive(Deserialize, Serialize)]
pub struct ExportProjectInput {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "outputPath")]
    pub output_path: String,
    pub ratio: String,
    pub doc: serde_json::Value,
    pub tracks: Vec<ExportTrackInput>,
    #[serde(default, rename = "backgroundImagePath")]
    pub background_image_path: Option<String>,
}

extern "C" {
    fn reeldock_export_project_json_with_progress(
        input_json: *const c_char,
        progress: extern "C" fn(*const c_char),
    ) -> *mut c_char;
    fn reeldock_free_string(pointer: *mut c_char);
}

static EXPORT_PROGRESS_APP: OnceLock<Mutex<Option<AppHandle>>> = OnceLock::new();

extern "C" fn emit_export_progress(payload: *const c_char) {
    if payload.is_null() {
        return;
    }

    let json = unsafe { CStr::from_ptr(payload).to_string_lossy().into_owned() };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&json) else {
        return;
    };

    let Some(lock) = EXPORT_PROGRESS_APP.get() else {
        return;
    };
    let Ok(guard) = lock.lock() else {
        return;
    };
    let Some(app) = guard.as_ref() else {
        return;
    };

    let _ = app.emit("export-progress", value);
}

fn expand_path(path: &str) -> Result<String, String> {
    if let Some(rest) = path.strip_prefix("~/") {
        let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        return Ok(PathBuf::from(home)
            .join(rest)
            .to_string_lossy()
            .into_owned());
    }

    Ok(PathBuf::from(path).to_string_lossy().into_owned())
}

fn take_json_string(pointer: *mut c_char) -> Result<serde_json::Value, String> {
    if pointer.is_null() {
        return Err("Native export returned no response".to_string());
    }

    let json = unsafe {
        let value = CStr::from_ptr(pointer).to_string_lossy().into_owned();
        reeldock_free_string(pointer);
        value
    };
    let parsed: serde_json::Value =
        serde_json::from_str(&json).map_err(|error| error.to_string())?;

    if let Some(error) = parsed.get("error").and_then(|value| value.as_str()) {
        return Err(error.to_string());
    }

    Ok(parsed)
}

#[tauri::command]
pub async fn export_project(
    app: AppHandle,
    mut input: ExportProjectInput,
) -> Result<serde_json::Value, String> {
    input.output_path = expand_path(&input.output_path)?;
    for track in &mut input.tracks {
        if let Some(file_path) = &track.file_path {
            track.file_path = Some(expand_path(file_path)?);
        }
    }
    input.background_image_path = resolve_background_image_path(&app, &input.doc)?;

    let progress_app = EXPORT_PROGRESS_APP.get_or_init(|| Mutex::new(None));
    {
        let mut guard = progress_app.lock().map_err(|error| error.to_string())?;
        *guard = Some(app.clone());
    }

    let result = tauri::async_runtime::spawn_blocking(move || {
        let json = serde_json::to_string(&input).map_err(|error| error.to_string())?;
        let input = CString::new(json).map_err(|error| error.to_string())?;
        take_json_string(unsafe {
            reeldock_export_project_json_with_progress(input.as_ptr(), emit_export_progress)
        })
    })
    .await
    .map_err(|error| error.to_string())
    .and_then(|value| value);

    if let Ok(mut guard) = progress_app.lock() {
        *guard = None;
    }

    result
}

fn resolve_background_image_path(
    app: &AppHandle,
    doc: &serde_json::Value,
) -> Result<Option<String>, String> {
    if doc.get("bgKind").and_then(|value| value.as_str()) != Some("image") {
        return Ok(None);
    }

    let Some(value) = doc.get("bg").and_then(|value| value.as_str()) else {
        return Ok(None);
    };

    if let Some(relative_path) = value.strip_prefix("builtin:") {
        return resolve_builtin_background_path(app, relative_path).map(Some);
    }

    if let Some(file_path) = value.strip_prefix("file://") {
        return Ok(Some(expand_path(file_path)?));
    }

    if value.starts_with("~/") || PathBuf::from(value).is_absolute() {
        return Ok(Some(expand_path(value)?));
    }

    Ok(None)
}

fn resolve_builtin_background_path(app: &AppHandle, relative_path: &str) -> Result<String, String> {
    let relative_path = relative_path.trim_start_matches('/');
    let mut candidates = Vec::new();

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        let manifest_dir = PathBuf::from(manifest_dir);
        candidates.push(manifest_dir.join("../public").join(relative_path));
        candidates.push(manifest_dir.join("../dist").join(relative_path));
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join(relative_path));
        candidates.push(resource_dir.join("dist").join(relative_path));
    }

    for candidate in candidates {
        if candidate.exists() {
            return Ok(candidate.to_string_lossy().into_owned());
        }
    }

    Err(format!(
        "Could not find built-in background image at {}.",
        relative_path
    ))
}
