use serde::Serialize;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_capture_sources])
        .run(tauri::generate_context!())
        .expect("failed to run ReelDock");
}
