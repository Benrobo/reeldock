# Patterns

## Tauri Command Calls

React calls native operations through small typed functions. Keep command payloads metadata-sized. Media bytes and frame streams belong in native surfaces or files, never on the JavaScript bridge and never in the WebView (`getUserMedia` and `<video>` are not used in the product path).

```ts
import { invoke } from "@tauri-apps/api/core";

type CaptureSource = {
  id: string;
  uniqueId: string;
  label: string;
  kind: "phone" | "webcam" | "microphone";
  state: "available" | "unavailable" | "permission-required";
};

export function listCaptureSources() {
  return invoke<CaptureSource[]>("list_capture_sources");
}
```

The native side discovers devices with `AVCaptureDeviceDiscoverySession` after enabling CoreMediaIO screen-capture devices, and returns this metadata list. Live preview is positioned by sending the canvas rectangle to native, not by streaming frames back.

## Project Schema

Every persisted project shape starts in `packages/project-schema`. UI and native code should conform to this contract rather than inventing separate ad hoc models.

## Recording State

Use explicit states:

```ts
type RecordingState =
  "idle" | "checking-permissions" | "ready" | "recording" | "recovering" | "failed";
```

Avoid booleans such as `isReady`, `isRecording`, and `hasFailed` when the product has mutually exclusive workflow states.

## Layout Values

Store positions and sizes as normalized values from `0` to `1` so exports can target 16:9, 9:16, and 1:1 from the same recording.

## Error Copy

Native errors should map to plain user-facing states:

| Native condition             | Product state                       |
| ---------------------------- | ----------------------------------- |
| Camera permission denied     | Camera permission denied            |
| Microphone permission denied | Microphone permission denied        |
| iPhone trust missing         | Phone not trusted                   |
| USB disconnect               | Phone disconnected during recording |
| Low disk space               | Insufficient disk space             |
