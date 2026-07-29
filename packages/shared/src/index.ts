export const APP_NAME = "ReelDock";

export const ASPECT_RATIOS = [
  {
    id: "16:9",
    label: "Landscape",
    width: 1920,
    height: 1080,
  },
  {
    id: "9:16",
    label: "Vertical",
    width: 1080,
    height: 1920,
  },
  {
    id: "1:1",
    label: "Square",
    width: 1080,
    height: 1080,
  },
] as const;

export const LAYOUT_PRESETS = [
  {
    id: "phone-focus",
    label: "Phone focus",
    description: "Centered phone with space for a polished background.",
  },
  {
    id: "side-by-side",
    label: "Side by side",
    description: "Phone and camera balanced for founder walkthroughs.",
  },
  {
    id: "picture-in-picture",
    label: "Picture in picture",
    description: "Large phone with a compact webcam overlay.",
  },
  {
    id: "vertical-demo",
    label: "Vertical demo",
    description: "Portrait-first framing for social clips.",
  },
] as const;

export const MVP_PHASES = [
  "Native capture proof",
  "Recording MVP",
  "Layout editor",
  "Local export",
  "Elorah validation",
] as const;

export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];
export type LayoutPresetId = (typeof LAYOUT_PRESETS)[number]["id"];
export type MvpPhase = (typeof MVP_PHASES)[number];

export type CaptureSourceKind = "phone" | "webcam" | "microphone";
export type CaptureSourceState = "available" | "unavailable" | "permission-required";

export type CaptureSource = {
  id: string;
  label: string;
  kind: CaptureSourceKind;
  state: CaptureSourceState;
};

export const CANVAS_BACKGROUNDS = [
  { id: "paper", label: "Paper", value: "#F4F2EC" },
  { id: "sand", label: "Sand", value: "#E8E2D6" },
  { id: "ink", label: "Ink", value: "#1C1B19" },
  { id: "pine", label: "Pine", value: "#2F4C46" },
  { id: "mist", label: "Mist", value: "#C4D4E0" },
] as const;

export type CanvasBackgroundId = (typeof CANVAS_BACKGROUNDS)[number]["id"];

export const CANVAS_RATIOS = ["16:9", "9:16", "1:1", "custom"] as const;
export type CanvasRatio = (typeof CANVAS_RATIOS)[number];

export const RATIO_RESOLUTIONS: Record<string, string> = {
  "16:9": "1920 × 1080",
  "9:16": "1080 × 1920",
  "1:1": "1080 × 1080",
};

export const LAYOUTS = {
  focus: { label: "Phone focus", cam: "bubble", anchors: true, swap: false, gap: false },
  side: { label: "Side by side", cam: "pane", anchors: false, swap: true, gap: true },
  pip: { label: "Picture in picture", cam: "bubble", anchors: true, swap: false, gap: false },
  presenter: { label: "Presenter focus", cam: "pane", anchors: false, swap: true, gap: true },
  vertical: { label: "Vertical demo", cam: "bubble", anchors: true, swap: false, gap: false },
} as const;

export type LayoutId = keyof typeof LAYOUTS;
export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export const LAYOUT_THUMBS: Record<
  LayoutId,
  {
    px: number;
    py: number;
    pw: number;
    ph: number;
    cx: number;
    cy: number;
    cw: number;
    ch: number;
    cr: number;
  }
> = {
  focus: { px: 39, py: 8, pw: 22, ph: 84, cx: 78, cy: 62, cw: 15, ch: 26, cr: 9 },
  side: { px: 7, py: 12, pw: 19, ph: 76, cx: 32, cy: 22, cw: 60, ch: 56, cr: 3 },
  pip: { px: 38, py: 5, pw: 23, ph: 90, cx: 70, cy: 60, cw: 20, ch: 34, cr: 11 },
  presenter: { px: 74, py: 20, pw: 16, ph: 60, cx: 7, cy: 16, cw: 60, ch: 68, cr: 3 },
  vertical: { px: 41, py: 15, pw: 18, ph: 70, cx: 62, cy: 9, cw: 16, ch: 28, cr: 9 },
};

export const ELEMENT_SIZES = ["S", "M", "L"] as const;
export type ElementSize = (typeof ELEMENT_SIZES)[number];
export const SIZE_LABELS: Record<ElementSize, string> = { S: "Small", M: "Medium", L: "Large" };

export const CAMERA_ANCHORS = [
  { id: "tl", label: "Top left", dx: 6, dy: 8 },
  { id: "tr", label: "Top right", dx: 68, dy: 8 },
  { id: "bl", label: "Bottom left", dx: 6, dy: 52 },
  { id: "br", label: "Bottom right", dx: 68, dy: 52 },
] as const;
export type CameraAnchor = (typeof CAMERA_ANCHORS)[number]["id"];

export const CAMERA_SHAPES = [
  { id: "circle", label: "Circle" },
  { id: "rect", label: "Rounded" },
] as const;
export type CameraShape = (typeof CAMERA_SHAPES)[number]["id"];

export const BACKGROUND_KINDS = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "pattern", label: "Pattern" },
  { id: "image", label: "Image" },
] as const;
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number]["id"];

export const CANVAS_FITS = [
  { id: "cover", label: "Cover" },
  { id: "contain", label: "Contain" },
] as const;
export type CanvasFit = (typeof CANVAS_FITS)[number]["id"];
