# Decisions

## Bun + Turbo

Use Bun and Turborepo because nearby projects use that pattern and it keeps workspace setup fast.

## macOS First

The MVP is macOS-only. Tauri provides the desktop shell, while native capture work targets Apple media APIs first.

## Native Capture Before Editor Depth

Do not build timeline-editor depth before proving iPhone USB capture, webcam capture, microphone capture, timestamps, and recovery.

## Independent Source Files

Record phone, webcam, and microphone to independent media files. Export is the point where sources become a composed MP4.

## Nonconcurrent Conductor Run Mode

The initial Tauri dev setup uses a fixed Vite dev URL, so Conductor run scripts are nonconcurrent until the desktop app supports per-workspace dev URLs.
