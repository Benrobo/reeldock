# Conventions

## Tooling

- Bun is the package manager and script runner.
- Turborepo coordinates workspace tasks.
- TypeScript is strict by default.
- Tauri is the desktop runtime.
- Rust owns native coordination.
- Next.js owns the marketing surface.

## Files

- Apps live in `apps/*`.
- `apps/desktop` is the Tauri app.
- `apps/marketing` is the public landing page.
- Shared TypeScript packages live in `packages/*`.
- Product and planning docs live in `docs/`.
- Durable agent context lives in `memory/`.
- Package names use the `@reeldock/*` scope.
- Source files use kebab-case except React components, which use PascalCase.

## Comments

Do not add inline comments to code. Prefer clear names and small functions. When a non-obvious constraint must be preserved, use a short doc string above the exported declaration or add the explanation to `memory/`.

## Native Media

- Do not move raw full-resolution frames through ordinary Tauri command payloads.
- Use native timestamps for source alignment.
- Preserve source files independently until export.
- Treat disconnection and interrupted recording as first-class states.

## Git

- Default branch is `main`.
- Do not commit generated media, `.reeldock` folders, build output, or `.env` files.
- Keep changes small enough for focused review.
- Do not add AI agents as contributors in commits. Commit messages must not include `Co-authored-by`, `Generated-by`, or similar agent attribution trailers.

## Verification

Use the narrowest relevant checks:

```bash
bun run type-check
bun run build
bun run format:check
```

Native capture changes also need physical-device validation on macOS with a supported iPhone.
