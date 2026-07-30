use serde::{Deserialize, Serialize};
use std::ffi::CStr;
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
    fn reeldock_prepare_capture();
    fn reeldock_copy_capture_sources_json() -> *mut c_char;
    fn reeldock_copy_all_devices_json() -> *mut c_char;
    fn reeldock_free_string(pointer: *mut c_char);
}

fn take_json_string(pointer: *mut c_char) -> String {
    if pointer.is_null() {
        return "[]".to_string();
    }
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
