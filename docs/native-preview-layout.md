# Native Preview Layout Warning

This note exists so future work does not confuse preview calibration with the real layout system.

## What The Current Constants Do

`apps/desktop/src/constants/preview.ts` contains setup-preview tuning values.

The important ones are:

- `NATIVE_PREVIEW_Y_OFFSETS`
- `DEVICE_PREVIEW_TARGET_SIZE`
- `WEBCAM_PREVIEW_TARGET_SIZE`
- the live preview radius values

These values help the native AppKit preview layers line up with the React boxes in the current Tauri WebView. They are calibration values. They are not the product layout model.

## Who Should Own Layout

React should own layout.

Swift should not decide where the phone or webcam belongs. Swift should only receive a final rectangle and draw the native `AVCaptureVideoPreviewLayer` inside that rectangle.

The flow should stay:

```text
React layout state
  -> DOM box
  -> measured rectangle
  -> Tauri command
  -> Swift places native preview layer at that rectangle
```

## Future Drag And Resize

When users can move or resize the phone and webcam, store those values in project/editor state, not in constants.

Use normalized values so the same recording can export at different canvas sizes:

```ts
phone: { x: 0.08, y: 0.05, width: 0.36, height: 0.9 }
webcam: { x: 0.62, y: 0.2, width: 0.28, height: 0.28, shape: "circle" }
```

React should render drag handles from those values. When a user drags or resizes, React updates the state, measures the new DOM box, and sends the new rectangle to Swift.

## What Not To Do

Do not use constants as the future user layout system.

Do not add more Swift positioning rules for product layout.

Do not make Swift know about presets, editor controls, or where the user wants the webcam.

If a preview is slightly offset because of WebView/AppKit coordinate mismatch, tune the calibration constants. If a user moves or resizes something, store that in project/editor layout state.
