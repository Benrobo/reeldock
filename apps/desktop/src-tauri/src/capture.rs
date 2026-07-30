use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[derive(Serialize, Deserialize)]
pub struct CaptureSource {
    pub id: String,
    #[serde(rename = "uniqueId")]
    pub unique_id: String,
    pub label: String,
    pub kind: String,
    pub state: String,
    #[serde(rename = "hasAudio", skip_serializing_if = "Option::is_none")]
    pub has_audio: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<u32>,
}

extern "C" {
    // Swift owns the AVFoundation device discovery because that API is native to macOS.
    // Rust calls these C-shaped functions and receives JSON strings describing devices.
    // Returned strings are allocated by Swift, so Rust must call reeldock_free_string after reading.
    fn reeldock_prepare_capture();
    fn reeldock_copy_capture_sources_json() -> *mut c_char;
    fn reeldock_copy_all_devices_json() -> *mut c_char;
    fn reeldock_start_microphone_meter_json(unique_id: *const c_char) -> *mut c_char;
    fn reeldock_stop_microphone_meter_json() -> *mut c_char;
    fn reeldock_copy_microphone_meter_json() -> *mut c_char;
    fn reeldock_free_string(pointer: *mut c_char);
}

fn take_json_string(pointer: *mut c_char) -> String {
    if pointer.is_null() {
        return "[]".to_string();
    }
    // Convert the Swift C string pointer into an owned Rust String immediately.
    // Then free the Swift allocation so repeated device scans do not leak memory.
    // The rest of Rust only handles normal safe String/JSON values after this point.
    unsafe {
        let json = CStr::from_ptr(pointer).to_string_lossy().into_owned();
        reeldock_free_string(pointer);
        json
    }
}

pub fn prepare() {
    unsafe { reeldock_prepare_capture() }
}

pub fn list_capture_sources() -> Vec<CaptureSource> {
    let json = take_json_string(unsafe { reeldock_copy_capture_sources_json() });
    serde_json::from_str(&json).unwrap_or_default()
}

pub fn list_all_devices() -> serde_json::Value {
    let json = take_json_string(unsafe { reeldock_copy_all_devices_json() });
    serde_json::from_str(&json).unwrap_or(serde_json::Value::Array(Vec::new()))
}

pub fn start_microphone_meter(unique_id: String) -> Result<serde_json::Value, String> {
    let unique_id = CString::new(unique_id).map_err(|error| error.to_string())?;
    let json =
        take_json_string(unsafe { reeldock_start_microphone_meter_json(unique_id.as_ptr()) });
    Ok(serde_json::from_str(&json).unwrap_or(serde_json::json!({
        "ok": false,
        "error": "Could not read microphone meter response."
    })))
}

pub fn stop_microphone_meter() -> serde_json::Value {
    let json = take_json_string(unsafe { reeldock_stop_microphone_meter_json() });
    serde_json::from_str(&json).unwrap_or(serde_json::json!({ "ok": true }))
}

pub fn microphone_meter() -> serde_json::Value {
    let json = take_json_string(unsafe { reeldock_copy_microphone_meter_json() });
    serde_json::from_str(&json).unwrap_or(serde_json::json!({
        "active": false,
        "level": 0,
        "peak": 0,
        "uniqueId": null
    }))
}
