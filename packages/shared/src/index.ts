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

export const MVP_PHASES = [
  "Native capture proof",
  "Recording MVP",
  "Composition editor",
  "Local export",
  "Elorah validation",
] as const;

export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];
export type MvpPhase = (typeof MVP_PHASES)[number];

export type CaptureSourceKind = "phone" | "webcam" | "microphone";
export type CaptureSourceState = "available" | "unavailable" | "permission-required";

export type CaptureSource = {
  id: string;
  label: string;
  kind: CaptureSourceKind;
  state: CaptureSourceState;
  hasAudio?: boolean;
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

export const CANVAS_PADDING_MIN = 0;
export const CANVAS_PADDING_MAX = 28;

export const ELEMENT_SIZES = ["S", "M", "L"] as const;
export type ElementSize = (typeof ELEMENT_SIZES)[number];
export const SIZE_LABELS: Record<ElementSize, string> = { S: "Small", M: "Medium", L: "Large" };
export const PHONE_ZOOM_MIN = 75;
export const PHONE_ZOOM_MAX = 130;
export const PHONE_ZOOM_DEFAULT = 100;

export const CAMERA_SHAPE_IDS = ["square", "horizontal", "vertical", "original", "circle"] as const;
export type CameraShape = (typeof CAMERA_SHAPE_IDS)[number];

export const CAMERA_SHAPES = [
  { id: "square", label: "Square", aspect: 1 },
  { id: "horizontal", label: "Horizontal", aspect: 16 / 9 },
  { id: "vertical", label: "Vertical", aspect: 9 / 16 },
  { id: "original", label: "Original", aspect: 16 / 9 },
  { id: "circle", label: "Circle", aspect: 1 },
] as const satisfies readonly { id: CameraShape; label: string; aspect: number }[];

export const CAMERA_SIZE_MIN = 40;
export const CAMERA_SIZE_MAX = 100;
export const CAMERA_SIZE_DEFAULT = 70;
export const CAMERA_ROUNDNESS_MIN = 0;
export const CAMERA_ROUNDNESS_MAX = 100;
export const CAMERA_ROUNDNESS_DEFAULT = 100;

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
