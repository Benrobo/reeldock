# Lessons

## Current Known Gaps

- The PRD originally existed only in the root checkout and has been copied into this workspace.
- Native capture is not implemented in this scaffold.
- Tauri dev is configured around a fixed local Vite port, so simultaneous desktop dev servers can conflict.

## Native Capture Risks

- iPhone capture behavior can vary across macOS and iOS versions.
- Source sync must use real media timestamps, not wall-clock assumptions from JavaScript.
- Cable disconnects must preserve recoverable source files when possible.
