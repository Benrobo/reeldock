# Architecture

## Shape

```text
reeldock/
├── apps/
│   └── desktop/             Tauri + React desktop app (Swift capture module in src-tauri)
│   └── marketing/           Next.js landing page
├── packages/
│   ├── devtools/            Storage inspector UI
│   ├── project-schema/      Zod schema for project.json
│   ├── shared/              Shared constants and TypeScript types
│   ├── tailwind-config/     Design tokens and the single stylesheet
│   ├── ui/                  @reeldock/ui primitives
│   └── ui-preview/          Primitive gallery
├── docs/                    PRD and planning docs
├── memory/                  Agent-readable project context
└── .agents/                 Bundled agent skills
```

## Product Model

ReelDock records polished mobile-app demos. The MVP is complete when a user can connect an iPhone to a Mac, record phone video, webcam video, and microphone audio as separate synchronized sources, adjust the layout, and export a polished MP4 without using another editor.

The highest-risk technical area is native capture, not the React editor.

## Runtime Model

```text
React UI  (controls, layout, metadata only)
  |
Tauri commands and events
  |
Rust coordinator
  |
Swift capture module  (AVFoundation / CoreMediaIO, in-process, shares the app NSWindow)
```

The React layer owns workflow state and editing controls, and never touches raw media. There is no `getUserMedia` and no WebView `<video>` in the product path. The Rust layer owns project directories, command orchestration, error translation, and the capture-module lifecycle. All capture, preview, recording, and export are native.

Capture decisions (see PRD sections 12 and 13): the iPhone screen is a CoreMediaIO USB screen-capture device (`kCMIOHardwarePropertyAllowScreenCaptureDevices`), captured only over cable with the phone trusted. Live preview is a native `AVCaptureVideoPreviewLayer` layered over the Tauri window at the canvas rectangle, not a bridged frame stream. Export composes the independent tracks with `AVMutableComposition` + `AVMutableVideoComposition` to H.264 MP4.

The marketing app is separate from the desktop app so mainstream launch pages can evolve without pulling Tauri-only dependencies into the public web surface.

## Project File Model

Each recording should be saved as a `.reeldock` directory:

```text
demo.reeldock/
├── project.json
├── phone.mov
├── webcam.mov
├── microphone.mov
├── phone-audio.m4a
├── thumbnail.jpg
└── exports/
```

Missing media files are optional. When webcam and microphone recording are both enabled, the selected microphone audio is embedded in `webcam.mov` and the microphone source metadata points at that same file. A separate `microphone.mov` is only expected for microphone recording without webcam. `project.json` is versioned and validated by `packages/project-schema`.

## Milestone Order

1. Native iPhone USB detection and recording proof of concept.
2. Simultaneous webcam and microphone recording with timestamps.
3. Recoverable project folder writes.
4. Layout-first editor.
5. Local H.264 MP4 export.
