# agent.md

Read [AGENTS.md](AGENTS.md) first. It is the universal agent entry point for ReelDock.

The short version:

- Start from [docs/ReelDock_PRD.md](docs/ReelDock_PRD.md).
- Keep the monorepo shape: `apps/*` for runnable apps, `packages/*` for shared TypeScript contracts.
- Keep capture sources independent until export.
- Use Bun only.
- Use Tailwind through `@reeldock/tailwind-config`.
- Do not add inline code comments unless a complicated constraint cannot be made clear through names or memory docs.
