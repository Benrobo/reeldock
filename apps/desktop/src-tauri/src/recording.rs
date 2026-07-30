use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::path::PathBuf;

#[derive(Deserialize, Serialize)]
pub struct RecordingSourceInput {
    pub kind: String,
    #[serde(rename = "uniqueId")]
    pub unique_id: String,
    pub enabled: bool,
}

#[derive(Deserialize, Serialize)]
pub struct RecordingFileInput {
    pub kind: String,
    pub path: String,
}

#[derive(Deserialize, Serialize)]
pub struct PrepareRecordingInput {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "projectPath")]
    pub project_path: String,
    pub sources: Vec<RecordingSourceInput>,
    pub files: Vec<RecordingFileInput>,
}

extern "C" {
    // Swift exposes these with @_cdecl so Rust can call them like plain C functions.
    // Values cross this boundary as raw C string pointers, not normal Rust or Swift strings.
    // Each recording function returns JSON text that Rust parses before Tauri sends it to JS.
    fn reeldock_prepare_recording_json(input_json: *const c_char) -> *mut c_char;
    fn reeldock_start_recording_json(project_id: *const c_char) -> *mut c_char;
    fn reeldock_stop_recording_json(project_id: *const c_char) -> *mut c_char;
    fn reeldock_free_string(pointer: *mut c_char);
}

fn expand_project_path(path: &str) -> Result<String, String> {
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
        return Err("Native recording returned no response".to_string());
    }

    // Swift allocates the returned JSON string, so Rust must free it after reading it.
    // CStr views the raw pointer as text, then reeldock_free_string releases Swift's buffer.
    // After this block we only keep an owned Rust String, never the unsafe raw pointer.
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

fn call_json(
    function: unsafe extern "C" fn(*const c_char) -> *mut c_char,
    value: &str,
) -> Result<serde_json::Value, String> {
    // Convert Rust input into a C-compatible string before calling Swift.
    // Swift returns JSON as another C string pointer, which take_json_string parses and frees.
    // Keeping this here contains the unsafe FFI pointer work in one small helper.
    let input = CString::new(value).map_err(|error| error.to_string())?;
    take_json_string(unsafe { function(input.as_ptr()) })
}

#[tauri::command]
pub fn prepare_recording(mut input: PrepareRecordingInput) -> Result<serde_json::Value, String> {
    input.project_path = expand_project_path(&input.project_path)?;
    for file in &mut input.files {
        file.path = expand_project_path(&file.path)?;
    }

    let json = serde_json::to_string(&input).map_err(|error| error.to_string())?;
    call_json(reeldock_prepare_recording_json, &json)
}

#[tauri::command]
pub fn start_recording(project_id: String) -> Result<serde_json::Value, String> {
    call_json(reeldock_start_recording_json, &project_id)
}

#[tauri::command]
pub async fn stop_recording(project_id: String) -> Result<serde_json::Value, String> {
    // Stopping waits for AVFoundation to finish writing media files.
    // Run that blocking finalization on Tauri's worker pool so the app window does not freeze.
    // The frontend still awaits the same JSON result once native finalization completes.
    tauri::async_runtime::spawn_blocking(move || {
        call_json(reeldock_stop_recording_json, &project_id)
    })
    .await
    .map_err(|error| error.to_string())?
}
