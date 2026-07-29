# AGENTS.md

Universal instructions for AI coding agents working on ReelDock.

## You Are Working In

A Bun + Turbo monorepo for a macOS-first Tauri desktop app. The UI is React + Vite, Tauri hosts the Rust coordinator, and the capture/export path must stay native because the PRD depends on reliable iPhone, webcam, and microphone recording.

The product source of truth is [docs/ReelDock_PRD.md](docs/ReelDock_PRD.md). Repo-specific context is in [memory/](memory/).

## Read Before You Write

| Task type                | Files to read first                                                             |
| ------------------------ | ------------------------------------------------------------------------------- |
| First task in this repo  | `docs/ReelDock_PRD.md`, `memory/architecture.md`, `memory/conventions.md`       |
| Desktop UI work          | `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, `memory/patterns.md` |
| Marketing page work      | `apps/marketing/src/app/page.tsx`, `apps/marketing/src/app/globals.css`         |
| Project file changes     | `packages/project-schema/src/index.ts`, `memory/patterns.md`                    |
| Native capture work      | `docs/ReelDock_PRD.md` sections 10, 12, 13, 18, and 20                          |
| Adding or changing icons | `.agents/skills/benrobo-iconary/SKILL.md`, `memory/icons.md`                    |
| Conductor setup          | `.conductor/settings.toml`, `memory/conventions.md`                             |
| Adding skills            | `.agents/README.md`, `scripts/install-skills.sh`                                |

## Hard Rules

- No inline comments in code. Use clear names. If a complicated constraint needs prose, put it in `memory/` or a short doc string above the exported declaration.
- Bun is the package manager. Use `bun install`, `bun add`, `bun run`, and `bun --filter`. Do not use npm, pnpm, or yarn.
- Keep recording sources independent. Phone video, webcam video, microphone audio, and phone audio must remain separately addressable until export.
- Do not send raw full-resolution media frames through ordinary Tauri JavaScript commands. Use native preview surfaces, efficient buffers, or local media streams for high-throughput preview work.
- Treat iPhone capture as the riskiest milestone. Prove native detection, recording, timestamps, disconnection behavior, and sync before expanding the editor.
- Do not promise Android, cloud rendering, AI editing, captions, or a full timeline editor for MVP work unless the PRD changes.
- Do not commit recordings, exports, `.env` files, build output, or local `.reeldock` project folders.
- Do not use `lucide-react`, inline SVG, or local icon registries. Use `@benrobo/iconary`.
- Do not add AI agents as contributors in commits. No `Co-authored-by`, `Generated-by`, or similar agent attribution trailers.

## Icons

Icons come from `@benrobo/iconary`. Use the React renderer from `@benrobo/iconary/react` and icon data from `@benrobo/iconary/core/duotone-rounded`.

```tsx
import { Icon } from "@benrobo/iconary/react";
import { Home01Icon } from "@benrobo/iconary/core/duotone-rounded";

<Icon icon={Home01Icon} size={20} color="currentColor" />;
```

Verify exact export names before importing. The package is configured through the root `.npmrc` and requires `GITHUB_TOKEN` with access to GitHub Packages.

## Package Boundaries

| Location                  | Responsibility                                                              |
| ------------------------- | --------------------------------------------------------------------------- |
| `apps/desktop`            | Tauri app shell, React UI, Tauri command calls, desktop workflow            |
| `apps/marketing`          | Public Next.js landing page for mainstream launch testing                   |
| `packages/project-schema` | Versioned `.reeldock/project.json` validation and inferred TypeScript types |
| `packages/shared`         | Product constants, layout presets, source state types, phase metadata       |
| `docs`                    | Product requirements and planning docs                                      |
| `memory`                  | Agent-readable architecture, patterns, decisions, lessons, glossary         |

## Available Skills

Bundled skills live in `.agents/skills/`. Load the matching `SKILL.md` before acting when the task matches the skill description.

| Skill                 | Use when                                          |
| --------------------- | ------------------------------------------------- |
| `benrobo-iconary`     | Adding, changing, or reviewing icon usage         |
| `frontend-design`     | Building or improving the React desktop interface |
| `karpathy-guidelines` | Writing, reviewing, or refactoring code           |
| `web-perf`            | Auditing frontend runtime performance             |
| `find-skills`         | Looking for a missing skill                       |

## Working Style

Be concrete. Make the smallest useful change, verify it, and name the files touched. Prefer product-backed decisions from the PRD over generic desktop-app patterns.
