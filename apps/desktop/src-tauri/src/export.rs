use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::path::PathBuf;

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
}

extern "C" {
    fn reeldock_export_project_json(input_json: *const c_char) -> *mut c_char;
    fn reeldock_free_string(pointer: *mut c_char);
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
pub async fn export_project(mut input: ExportProjectInput) -> Result<serde_json::Value, String> {
    input.output_path = expand_path(&input.output_path)?;
    for track in &mut input.tracks {
        if let Some(file_path) = &track.file_path {
            track.file_path = Some(expand_path(file_path)?);
        }
    }

    tauri::async_runtime::spawn_blocking(move || {
        let json = serde_json::to_string(&input).map_err(|error| error.to_string())?;
        let input = CString::new(json).map_err(|error| error.to_string())?;
        take_json_string(unsafe { reeldock_export_project_json(input.as_ptr()) })
    })
    .await
    .map_err(|error| error.to_string())?
}
