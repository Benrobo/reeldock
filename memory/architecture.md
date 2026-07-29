# Architecture

## Shape

```text
reeldock/
├── apps/
│   └── desktop/             Tauri + React desktop app
│   └── marketing/           Next.js landing page
├── packages/
│   ├── project-schema/      Zod schema for project.json
│   └── shared/              Shared constants and TypeScript types
├── docs/                    PRD and planning docs
├── memory/                  Agent-readable project context
└── .agents/                 Bundled agent skills
```

## Product Model

ReelDock records polished mobile-app demos. The MVP is complete when a user can connect an iPhone to a Mac, record phone video, webcam video, and microphone audio as separate synchronized sources, adjust the layout, and export a polished MP4 without using another editor.

The highest-risk technical area is native capture, not the React editor.

## Runtime Model

```text
React UI
  |
Tauri commands and events
  |
Rust coordinator
  |
Native macOS capture and export helpers
```

The React layer owns workflow state and editing controls. The Rust layer owns project directories, command orchestration, error translation, and native helper lifecycle. High-throughput media work stays native.

The marketing app is separate from the desktop app so mainstream launch pages can evolve without pulling Tauri-only dependencies into the public web surface.

## Project File Model

Each recording should be saved as a `.reeldock` directory:

```text
demo.reeldock/
├── project.json
├── phone.mov
├── webcam.mov
├── microphone.m4a
├── phone-audio.m4a
├── thumbnail.jpg
└── exports/
```

Missing media files are optional. `project.json` is versioned and validated by `packages/project-schema`.

## Milestone Order

1. Native iPhone USB detection and recording proof of concept.
2. Simultaneous webcam and microphone recording with timestamps.
3. Recoverable project folder writes.
4. Layout-first editor.
5. Local H.264 MP4 export.
