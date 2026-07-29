# ReelDock

ReelDock is a macOS desktop app for recording polished mobile-app demos from a connected phone, webcam, and microphone.

The MVP direction comes from [docs/ReelDock_PRD.md](docs/ReelDock_PRD.md). The first technical milestone is proving reliable iPhone capture, webcam capture, microphone capture, source timestamps, and manual sync before investing heavily in the editor.

## Stack

| Layer              | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Package manager    | Bun                                                |
| Monorepo runner    | Turborepo                                          |
| Desktop shell      | Tauri                                              |
| Interface          | React + Vite                                       |
| Native coordinator | Rust through Tauri commands and events             |
| Capture helper     | Native macOS helper to be proven with AVFoundation |
| Shared contracts   | TypeScript packages under `packages/`              |

## Layout

```text
reeldock/
├── apps/
│   └── desktop/          Tauri + React desktop shell
│   └── marketing/        Next.js landing page
├── packages/
│   ├── project-schema/   Zod schema for .reeldock project.json files
│   └── shared/           Product constants and shared types
├── docs/                 PRD and product notes
├── memory/               Agent-readable architecture, patterns, decisions
├── .agents/              Bundled skills for future coding agents
├── AGENTS.md             Universal agent instructions
├── agent.md              Short compatibility pointer
└── claude.md             Claude Code entry point
```

## Quick Start

```bash
bun install
bun run dev:desktop
```

Useful commands:

```bash
bun run type-check
bun run build
bun run format
bun run skills:install
```

Marketing site:

```bash
bun run dev:marketing
```

## Development Priorities

1. Prove iPhone USB detection and recording with native timestamps.
2. Record webcam and microphone as separate files on the same project timeline.
3. Persist recoverable `.reeldock` project folders.
4. Add the layout-first editor after capture reliability is proven.
5. Export H.264 MP4 for 16:9, 9:16, and 1:1 outputs.

## Conductor

Conductor setup lives in [.conductor/settings.toml](.conductor/settings.toml). The desktop dev script is marked nonconcurrent because Tauri's dev URL is fixed to the local Vite port in this initial scaffold.
