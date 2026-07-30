# Native Capture And Preview

This is the current native path for source detection and live preview.

## `src-tauri/src/capture.rs`

This is the Rust wrapper around the Swift capture module.

It exposes safe Rust functions for Tauri commands:

- `prepare()` calls Swift once at app startup so macOS exposes USB screen-capture devices.
- `list_capture_sources()` asks Swift for the current iPhone, webcam, and microphone list.
- `list_all_devices()` asks Swift for a broader debug list of AVFoundation devices.

Swift returns JSON through a C string pointer. Rust copies that string, frees the Swift-owned pointer through `reeldock_free_string`, and parses the JSON into `CaptureSource`.

The React app never receives video frames here. It only receives metadata such as source kind, label, unique ID, state, and optional video dimensions.

## `src-tauri/swift/capture.swift`

This is the macOS device discovery implementation.

It enables CoreMediaIO screen-capture devices with `kCMIOHardwarePropertyAllowScreenCaptureDevices`, then discovers:

- iPhone or iPad screen capture as a muxed/external AVFoundation device.
- Webcam as a normal video device.
- Microphone as a normal audio device.

For video-capable devices, Swift also returns the active format dimensions. React uses those dimensions to size the setup phone preview from the real capture aspect ratio instead of a fake iPhone mockup ratio. The setup UI normalizes those dimensions to portrait, because AVFoundation can report a landscape buffer for a portrait phone stream.

This file does not start preview or recording. It only discovers devices and returns JSON metadata to Rust.

## `src-tauri/src/preview.rs`

This is the Rust wrapper around native live preview.

It exposes three Tauri commands:

- `start_preview`
- `set_preview_frame`
- `stop_preview`

React passes a surface ID (`phone` or `webcam`), an AVFoundation `uniqueId`, a DOM rectangle, a corner radius, and mirror preference. Rust gets the current Tauri `NSWindow` handle and forwards the request to Swift through the C ABI.

The rectangle is metadata only. No video frames cross the Tauri command bridge.

## `src-tauri/swift/preview.swift`

This owns the live native preview surfaces.

For each surface, it creates:

- an `AVCaptureSession`
- an `AVCaptureDeviceInput`
- an `NSView` overlay
- an `AVCaptureVideoPreviewLayer`

The overlay is attached directly to the Tauri WebView so it shares the same coordinate space as `getBoundingClientRect()`. React measures the intended phone or webcam slot, sends that rectangle to Rust, and Swift positions the native preview view there.

The phone preview uses `.resizeAspect` so the mirrored screen is contained instead of crop-zoomed. The webcam uses `.resizeAspectFill` so the circular bubble is filled.

The radius sent from React is applied to the native overlay layer. For the phone, React renders only an invisible measuring element when a live device is connected; Swift clips the stream to that rounded native surface. React's `DeviceFrame` is only a fallback placeholder when no phone is detected. For the webcam, the radius makes the circular camera bubble.

## Important Boundary

React draws controls, layout, frame chrome, and placeholders. Swift draws the actual live camera and phone pixels. This keeps full-resolution media off the JavaScript bridge and makes the preview path match the native recording/export direction.
