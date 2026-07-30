use serde::Deserialize;
use std::ffi::{c_void, CString};
use std::os::raw::c_char;
use std::ptr;

#[derive(Deserialize)]
pub struct PreviewRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

extern "C" {
    // Preview surfaces must be AppKit/AVFoundation objects, so Swift owns their real work.
    // Rust passes the macOS NSWindow pointer plus CSS-measured rectangles from the React UI.
    // The Swift side converts those rectangles into native overlay views above the webview.
    fn reeldock_start_preview(
        surface: *const c_char,
        window: *mut c_void,
        unique_id: *const c_char,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        host_x: f64,
        host_y: f64,
        host_w: f64,
        host_h: f64,
        radius: f64,
        mirror: bool,
    ) -> bool;
    fn reeldock_set_preview_frame(
        surface: *const c_char,
        window: *mut c_void,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        host_x: f64,
        host_y: f64,
        host_w: f64,
        host_h: f64,
        radius: f64,
    );
    fn reeldock_stop_preview(surface: *const c_char);
    fn reeldock_set_preview_countdown(window: *mut c_void, value: *const c_char);
    fn reeldock_start_phone_audio_monitor(unique_id: *const c_char, volume: f32) -> bool;
    fn reeldock_stop_phone_audio_monitor();
}

#[tauri::command]
pub fn start_preview(
    window: tauri::WebviewWindow,
    surface: String,
    unique_id: String,
    rect: PreviewRect,
    host_rect: Option<PreviewRect>,
    radius: f64,
    mirror: bool,
) -> Result<bool, String> {
    // Tauri gives Rust the webview window, but Swift needs the underlying NSWindow pointer.
    // Strings are converted to CStrings because the Rust-to-Swift boundary is C-compatible.
    // host_rect is optional so old callers can still position previews against the full window.
    let ns_window = window.ns_window().map_err(|error| error.to_string())?;
    let surface = CString::new(surface).map_err(|error| error.to_string())?;
    let unique_id = CString::new(unique_id).map_err(|error| error.to_string())?;
    let host_rect = host_rect.unwrap_or(PreviewRect {
        x: 0.0,
        y: 0.0,
        width: 0.0,
        height: 0.0,
    });

    let started = unsafe {
        reeldock_start_preview(
            surface.as_ptr(),
            ns_window,
            unique_id.as_ptr(),
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            host_rect.x,
            host_rect.y,
            host_rect.width,
            host_rect.height,
            radius,
            mirror,
        )
    };
    Ok(started)
}

#[tauri::command]
pub fn set_preview_frame(
    window: tauri::WebviewWindow,
    surface: String,
    rect: PreviewRect,
    host_rect: Option<PreviewRect>,
    radius: f64,
) -> Result<(), String> {
    let ns_window = window.ns_window().map_err(|error| error.to_string())?;
    let surface = CString::new(surface).map_err(|error| error.to_string())?;
    let host_rect = host_rect.unwrap_or(PreviewRect {
        x: 0.0,
        y: 0.0,
        width: 0.0,
        height: 0.0,
    });

    unsafe {
        reeldock_set_preview_frame(
            surface.as_ptr(),
            ns_window,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            host_rect.x,
            host_rect.y,
            host_rect.width,
            host_rect.height,
            radius,
        );
    }
    Ok(())
}

#[tauri::command]
pub fn stop_preview(surface: String) -> Result<(), String> {
    let surface = CString::new(surface).map_err(|error| error.to_string())?;
    unsafe {
        reeldock_stop_preview(surface.as_ptr());
    }
    Ok(())
}

#[tauri::command]
pub fn set_preview_countdown(
    window: tauri::WebviewWindow,
    value: Option<String>,
) -> Result<(), String> {
    let ns_window = window.ns_window().map_err(|error| error.to_string())?;
    let value = value
        .map(CString::new)
        .transpose()
        .map_err(|error| error.to_string())?;
    let pointer = value.as_ref().map_or(ptr::null(), |value| value.as_ptr());
    unsafe {
        reeldock_set_preview_countdown(ns_window, pointer);
    }
    Ok(())
}

#[tauri::command]
pub fn start_phone_audio_monitor(unique_id: String, volume: f32) -> Result<bool, String> {
    // This command controls live monitoring only: iPhone audio -> Mac speakers/headphones.
    // Recording still happens through the separate phone.mov capture output in Swift.
    // A false result means the preview session is not ready yet, so the UI may retry.
    let unique_id = CString::new(unique_id).map_err(|error| error.to_string())?;
    Ok(unsafe { reeldock_start_phone_audio_monitor(unique_id.as_ptr(), volume) })
}

#[tauri::command]
pub fn stop_phone_audio_monitor() {
    // Stop live phone-audio playback without stopping the preview or recording session.
    // Swift removes only AVCaptureAudioPreviewOutput from the phone capture session.
    // The command is fire-and-forget because cleanup is idempotent.
    unsafe {
        reeldock_stop_phone_audio_monitor();
    }
}
