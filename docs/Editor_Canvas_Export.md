# Editor Canvas and Export

This document explains how the editor canvas, resize controls, backgrounds, layer order, and native export currently work.

The short version:

1. The editor saves every visual decision into `project.json` through `ProjectDoc`.
2. The React canvas previews that `ProjectDoc`.
3. Export sends the same `ProjectDoc` plus the recorded media tracks to Rust.
4. Rust resolves local paths and calls the Swift renderer.
5. Swift renders a silent video frame by frame, muxes audio, then returns the final MP4 path.

## Main Files

| Area | File |
| --- | --- |
| Shared constants | `packages/shared/src/index.ts` |
| Project schema | `apps/desktop/src/modules/project/types.ts` |
| Editor geometry | `apps/desktop/src/modules/project/lib/geometry.ts` |
| Background preview helpers | `apps/desktop/src/modules/project/lib/background.ts` |
| Canvas sidebar UI | `apps/desktop/src/modules/editor/components/editor-sidebar/canvas-section.tsx` |
| Canvas preview and resizing | `apps/desktop/src/modules/canvas/components/canvas-stage.tsx` |
| Export hook | `apps/desktop/src/modules/editor/hooks/use-editor-export.ts` |
| Tauri export bridge | `apps/desktop/src/modules/editor/lib/export-bridge.ts` |
| Rust export command | `apps/desktop/src-tauri/src/export.rs` |
| Swift renderer | `apps/desktop/src-tauri/swift/export.swift` |

## Project Data

The editor state lives in `ProjectDoc`, defined in:

`apps/desktop/src/modules/project/types.ts`

Important fields:

```ts
export const projectDocSchema = z.object({
  ratio: z.enum(["16:9", "9:16", "1:1", "4:5", "5:4", "4:3", "3:4", "21:9", "custom"]),
  phoneScale: z.number().min(PHONE_SCALE_MIN).max(PHONE_SCALE_MAX).default(PHONE_SCALE_DEFAULT),
  camScale: z.number().min(CAMERA_SIZE_MIN).max(CAMERA_SIZE_MAX).default(CAMERA_SIZE_DEFAULT),
  camScaleX: z.number().min(CAMERA_SIZE_MIN).max(CAMERA_SIZE_MAX).default(CAMERA_SIZE_DEFAULT),
  camScaleY: z.number().min(CAMERA_SIZE_MIN).max(CAMERA_SIZE_MAX).default(CAMERA_SIZE_DEFAULT),
  bg: z.string().min(1),
  bgKind: z.enum(["solid", "gradient", "pattern", "image"]),
  fit: z.enum(["cover", "contain"]),
  cw: z.number().int().min(320),
  chh: z.number().int().min(320),
  phoneX: normalizedPositionSchema,
  phoneY: normalizedPositionSchema,
  camX: normalizedPositionSchema,
  camY: normalizedPositionSchema,
  sourceOrder: sourceOrderSchema,
});
```

`phoneX`, `phoneY`, `camX`, and `camY` are normalized positions. That means `0.5` is 50% of the canvas width or height, not a pixel value. This keeps positions portable between editor preview sizes and export sizes.

`sourceOrder` is stored back-to-front. The default is:

```ts
export const DEFAULT_SOURCE_ORDER: SourceLayer[] = ["phone", "camera"];
```

That means the phone is behind the camera by default.

## Camera Scale Constants

These constants live in:

`packages/shared/src/index.ts`

```ts
export const CAMERA_SIZE_MIN = 10;
export const CAMERA_SIZE_MAX = 220;
export const CAMERA_SIZE_DEFAULT = 20;
export const CAMERA_SCALE_REFERENCE = 100;
export const CAMERA_ROUNDNESS_MIN = 0;
export const CAMERA_ROUNDNESS_MAX = 100;
export const CAMERA_ROUNDNESS_DEFAULT = 100;
```

The important one is `CAMERA_SCALE_REFERENCE`.

Camera scale is real percent math:

```ts
const camScaleX = (doc.camScaleX ?? doc.camScale) / CAMERA_SCALE_REFERENCE;
```

So:

| Value | Result |
| --- | --- |
| `10` | 10% of base camera size |
| `20` | 20% of base camera size |
| `100` | full base camera size |
| `220` | 220% of base camera size |

This is why `CAMERA_SIZE_MIN = 10` actually allows a small webcam.

## Geometry

Preview geometry is calculated in:

`apps/desktop/src/modules/project/lib/geometry.ts`

There are two geometry steps:

1. `compose()` calculates the base phone and camera layout inside the padded canvas.
2. `stageGeometry()` applies user scale and converts normalized values into pixels for the visible editor canvas.

The camera width and height are independent:

```ts
export function cameraFrame(doc: ProjectDoc, phoneAspect = DEFAULT_PHONE_ASPECT): CameraFrame | null {
  const { cam } = compose(doc, phoneAspect);
  if (!cam) return null;

  const camScaleX = (doc.camScaleX ?? doc.camScale) / CAMERA_SCALE_REFERENCE;
  const camScaleY = (doc.camScaleY ?? doc.camScale) / CAMERA_SCALE_REFERENCE;
  const width = cam.w * camScaleX;
  const height = cam.h * camScaleY;

  return {
    x: doc.camX ?? cam.x + (cam.w - width) / 2,
    y: doc.camY ?? cam.y + (cam.h - height) / 2,
    w: width,
    h: height,
  };
}
```

The fallback `x` and `y` center the scaled camera around its base placement. This is why changing size should not push the camera left or right by itself.

## Resizing

Resize behavior lives in:

`apps/desktop/src/modules/canvas/components/canvas-stage.tsx`

The editor renders one resize node at the bottom-right of the selected source.

The resize session stores the element center at the moment resizing starts:

```ts
resizeSessionRef.current = {
  element,
  centerX,
  centerY,
  startDistance: Math.max(1, distance(pointer.x, pointer.y, centerX, centerY)),
  startScaleX: frame.width / frame.baseWidth,
  startScaleY: frame.height / frame.baseHeight,
  frame,
  pointerId: event.pointerId,
};
```

### Phone Resize

The phone resizes uniformly. Width and height keep the phone aspect ratio:

```ts
const scale = clamp(
  session.startScaleX * (nextDistance / session.startDistance),
  session.frame.minScale,
  session.frame.maxScale
);

const width = session.frame.baseWidth * scale;
const height = session.frame.baseHeight * scale;
const x = session.centerX - width / 2;
const y = session.centerY - height / 2;
```

The key point is this:

```ts
const x = session.centerX - width / 2;
const y = session.centerY - height / 2;
```

That keeps the source scaling around its center. The top-left position changes only because the box is getting bigger or smaller around the same center.

### Camera Resize

The camera can resize freely by width and height:

```ts
const scaleX = clamp(
  (Math.abs(pointer.x - session.centerX) * 2) / session.frame.baseWidth,
  session.frame.minScale,
  session.frame.maxScale
);

const scaleY = clamp(
  (Math.abs(pointer.y - session.centerY) * 2) / session.frame.baseHeight,
  session.frame.minScale,
  session.frame.maxScale
);
```

Then it saves independent values:

```ts
update(
  {
    camScale: Math.round((camScaleX + camScaleY) / 2),
    camScaleX,
    camScaleY,
    camX: x / geometry.cw,
    camY: y / geometry.ch,
  },
  quiet
);
```

`camScale` is kept as a compatibility average. The actual current resize behavior uses `camScaleX` and `camScaleY`.

## Dragging

Dragging also lives in:

`apps/desktop/src/modules/canvas/components/canvas-stage.tsx`

Dragging stores positions as normalized canvas values:

```ts
if (element === "phone") {
  update({ phoneX: data.x / geometry.cw, phoneY: data.y / geometry.ch });
} else {
  update({ camX: data.x / geometry.cw, camY: data.y / geometry.ch });
}
```

This lets export use the same placement even though export renders at a larger size, such as 1920 x 1080.

## Layer Order

Layer order UI lives in:

`apps/desktop/src/modules/editor/components/editor-sidebar/canvas-section.tsx`

The order section lets users move Phone or Camera forward/backward:

```tsx
<SourceOrderSection
  order={doc.sourceOrder}
  onChange={(sourceOrder) => onUpdate({ sourceOrder })}
/>
```

The preview uses the order for z-index:

`apps/desktop/src/modules/canvas/components/canvas-stage.tsx`

```ts
const sourceOrder = normalizeSourceOrder(doc.sourceOrder);
const sourceZIndex = (layer: SourceLayer) => 10 + sourceOrder.indexOf(layer);
```

Then each source uses that z-index:

```tsx
style={{
  width: phoneFrame.width,
  height: phoneFrame.height,
  zIndex: sourceZIndex("phone"),
}}
```

Export uses the same order, but draw order replaces z-index:

`apps/desktop/src-tauri/swift/export.swift`

```swift
for layer in sourceLayerOrder() {
  if layer == "phone", let phoneImage = visualSources["phone"]?.image(at: originalTime) {
    drawPhone(image: phoneImage, context: context, rect: geometry.phone.cgRect)
  }

  if layer == "camera",
    let cameraRect = geometry.camera?.cgRect,
    let webcamImage = visualSources["webcam"]?.image(at: originalTime)
  {
    drawRoundedImage(...)
  }
}
```

The first drawn layer is behind later layers.

## Backgrounds

Background preview helpers live in:

`apps/desktop/src/modules/project/lib/background.ts`

Built-in background values use a `builtin:` prefix:

```ts
export function builtInBackgroundValue(src: string): string {
  return `${BUILTIN_BACKGROUND_PREFIX}${src}`;
}
```

The available built-in backgrounds are:

```ts
export const BUILT_IN_BACKGROUND_GROUPS = [
  {
    id: "mesh",
    label: "Mesh",
    backgrounds: Array.from({ length: 10 }, (_, index) => ({
      id: `mesh-${index + 1}`,
      label: `Mesh ${index + 1}`,
      src: `/images/backgrounds/mesh/mesh-${index + 1}.png`,
    })),
  },
  {
    id: "glass",
    label: "Glass",
    backgrounds: Array.from({ length: 11 }, (_, index) => ({
      id: `glass-${index + 1}`,
      label: `Glass ${index + 1}`,
      src: `/images/backgrounds/glass/glass-${index + 1}.jpg`,
    })),
  },
];
```

The actual image files are in:

```text
apps/desktop/public/images/backgrounds/mesh/
apps/desktop/public/images/backgrounds/glass/
```

The React preview uses CSS background strings:

```ts
export function backgroundCss(doc: ProjectDoc): string {
  if (doc.bgKind === "gradient") return GRADIENTS[doc.grad];
  if (doc.bgKind === "pattern") return PATTERNS[doc.pat].css;
  if (doc.bgKind === "image") {
    const imageUrl = backgroundImageUrl(doc.bg);
    if (!imageUrl) return IMAGE_PLACEHOLDER;
    return `url("${imageUrl}") center / ${doc.fit} no-repeat, var(--color-screen)`;
  }
  return doc.bg;
}
```

### Custom Images

Custom image upload/drop lives in:

`apps/desktop/src/modules/editor/components/editor-sidebar/canvas-section.tsx`

The image is read as a data URL and stored in `doc.bg`:

```ts
const useCustomImage = (file?: File | null) => {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") return;
    onUpdate({ bgKind: "image", bg: reader.result, fit: doc.fit || "cover" });
  });
  reader.readAsDataURL(file);
};
```

This makes custom images portable because the image data is inside `project.json`. The tradeoff is that large custom backgrounds can make `project.json` large.

## Export Flow

The export flow starts in:

`apps/desktop/src/modules/editor/hooks/use-editor-export.ts`

Before export, the latest `ProjectDoc` is saved:

```ts
const latestProject = await projectsService.find(activeProject.id);
const projectForExport = await projectsService.saveDoc(latestProject, doc);
job = await projectsService.createExport(projectForExport, doc.ratio);
```

Then it calls the Tauri bridge:

```ts
const result = await exportProject({
  projectId: projectForExport.id,
  outputPath: job.filePath,
  ratio: doc.ratio,
  doc,
  tracks: recordedTracks,
  onProgress: ({ progress }) => {
    setProgress(Math.round(progress));
  },
});
```

The bridge lives in:

`apps/desktop/src/modules/editor/lib/export-bridge.ts`

It listens for native progress events and invokes the Rust command:

```ts
const unlisten = onProgress
  ? await listen("export-progress", (event) => {
      const parsed = exportProgressSchema.safeParse(event.payload);
      if (!parsed.success || parsed.data.projectId !== input.projectId) return;
      onProgress(parsed.data);
    })
  : null;

const result = await invoke<unknown>("export_project", { input: commandInput });
```

## Rust Export Command

The Rust command lives in:

`apps/desktop/src-tauri/src/export.rs`

Rust does three main jobs:

1. Expands `~/...` and local track paths.
2. Resolves built-in background paths from `builtin:/images/...`.
3. Calls Swift through FFI and forwards progress events back to React.

Progress is emitted from Swift into Rust, then Rust emits a Tauri event:

```rust
extern "C" fn emit_export_progress(payload: *const c_char) {
    let json = unsafe { CStr::from_ptr(payload).to_string_lossy().into_owned() };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&json) else {
        return;
    };

    let _ = app.emit("export-progress", value);
}
```

Built-in backgrounds are resolved before calling Swift:

```rust
if let Some(relative_path) = value.strip_prefix("builtin:") {
    return resolve_builtin_background_path(app, relative_path).map(Some);
}
```

Then Rust calls Swift:

```rust
take_json_string(unsafe {
    reeldock_export_project_json_with_progress(input.as_ptr(), emit_export_progress)
})
```

## Swift Native Export

The renderer lives in:

`apps/desktop/src-tauri/swift/export.swift`

Swift receives:

- `projectId`
- `outputPath`
- `ratio`
- `doc`
- `tracks`
- `backgroundImagePath`

The main export method:

```swift
func export() throws -> NativeExportResult {
  reportProgress(2, stage: "Preparing export")
  let spans = timelineSpans()
  let totalDuration = spans.reduce(0) { $0 + $1.duration }
  let renderSize = outputSize()
  let visualSources = try makeVisualSources()

  try renderSilentVideo(...)
  try muxAudio(...)

  reportProgress(100, stage: "Done")
  return NativeExportResult(ok: true, outputPath: input.outputPath, durationMs: max(1, Int(totalDuration * 1000)))
}
```

Swift renders video in two phases:

1. `renderSilentVideo()` creates the visual frames into a temporary `.mov`.
2. `muxAudio()` adds phone, webcam, and microphone audio into the final `.mp4`.

### Export Size

Export size is based on `doc.ratio`:

```swift
private func outputSize() -> CGSize {
  switch input.ratio {
  case "9:16":
    return CGSize(width: 1080, height: 1920)
  case "1:1":
    return CGSize(width: 1080, height: 1080)
  case "4:5":
    return CGSize(width: 1080, height: 1350)
  case "21:9":
    return CGSize(width: 2560, height: 1080)
  case "custom":
    return CGSize(width: evenDimension(input.doc.cw), height: evenDimension(input.doc.chh))
  default:
    return CGSize(width: 1920, height: 1080)
  }
}
```

Custom dimensions are clamped to `320...3840` and made even because H.264 encoders behave better with even dimensions.

### Export Geometry

Swift mirrors the same centered scaling logic used in React:

```swift
let phoneScale = CGFloat((input.doc.phoneScale ?? 100) / 100)
let phoneWidth = basePhoneWidth * phoneScale
let phoneHeight = basePhoneHeight * phoneScale
let defaultPhoneX = basePhoneX + (basePhoneWidth - phoneWidth) / 2
let defaultPhoneY = basePhoneY + (basePhoneHeight - phoneHeight) / 2
```

Camera width and height are independent:

```swift
let camScaleX = CGFloat((input.doc.camScaleX ?? input.doc.camScale) / Double(cameraScaleReference))
let camScaleY = CGFloat((input.doc.camScaleY ?? input.doc.camScale) / Double(cameraScaleReference))
let cameraWidth = baseCameraWidth * camScaleX
let cameraHeight = baseCameraHeight * camScaleY
let scaledDefaultCameraX = baseCameraX + (baseCameraWidth - cameraWidth) / 2
let scaledDefaultCameraY = baseCameraY + (baseCameraHeight - cameraHeight) / 2
```

If the user has manually dragged a source, Swift uses `doc.phoneX`, `doc.phoneY`, `doc.camX`, or `doc.camY`. If those are `null`, Swift uses the centered defaults.

### Background Rendering

Swift draws the background before drawing phone/camera:

```swift
private func drawBackground(context: CGContext, size: CGSize) {
  if input.doc.bgKind == "image", let image = backgroundImage() {
    drawBackgroundImage(image: image, context: context, size: size)
    return
  }

  if input.doc.bgKind == "gradient" {
    ...
    return
  }

  context.setFillColor(backgroundColor())
  context.fill(CGRect(origin: .zero, size: size))
}
```

Custom data URL images are decoded in Swift:

```swift
private func backgroundDataImage() -> CGImage? {
  guard input.doc.bg.hasPrefix("data:"),
    let comma = input.doc.bg.firstIndex(of: ",")
  else { return nil }

  let encoded = String(input.doc.bg[input.doc.bg.index(after: comma)...])
  guard let data = Data(base64Encoded: encoded),
    let source = CGImageSourceCreateWithData(data as CFData, nil)
  else { return nil }

  return CGImageSourceCreateImageAtIndex(source, 0, nil)
}
```

Built-in images are not data URLs. Rust resolves them into `backgroundImagePath`, and Swift loads them from disk.

## Playback Preview Detail

The editor keeps the last frame visible when playback ends.

This is in:

`apps/desktop/src/modules/canvas/components/canvas-stage.tsx`

```ts
function safeMediaTime(element: HTMLMediaElement, time: number) {
  const duration = elementDuration(element);
  if (!duration) return Math.max(0, time);
  return Math.max(0, Math.min(time, Math.max(0, duration - LAST_VISIBLE_FRAME_OFFSET)));
}
```

Without this clamp, seeking to exactly `video.duration` can make a browser video element paint blank.

## Important Rules For Future Changes

1. Any setting that must affect export must live in `ProjectDoc`.
2. React preview and Swift export must use the same math for geometry.
3. Positions should stay normalized, not pixels.
4. Built-in images should stay as `builtin:/images/...` values in `doc.bg`.
5. Custom images currently live as data URLs in `doc.bg`.
6. `sourceOrder` is back-to-front. React uses it for z-index; Swift uses it for draw order.
7. `camScaleX` and `camScaleY` are the real camera resize values. `camScale` is only kept for compatibility.
