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
  {
    id: "4:5",
    label: "Portrait",
    width: 1080,
    height: 1350,
  },
  {
    id: "5:4",
    label: "Tall landscape",
    width: 1350,
    height: 1080,
  },
  {
    id: "4:3",
    label: "Classic",
    width: 1440,
    height: 1080,
  },
  {
    id: "3:4",
    label: "Classic portrait",
    width: 1080,
    height: 1440,
  },
  {
    id: "21:9",
    label: "Ultrawide",
    width: 2560,
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

export const CANVAS_RATIOS = [
  "16:9",
  "9:16",
  "1:1",
  "4:5",
  "5:4",
  "4:3",
  "3:4",
  "21:9",
  "custom",
] as const;
export type CanvasRatio = (typeof CANVAS_RATIOS)[number];

export const RATIO_RESOLUTIONS: Record<string, string> = {
  "16:9": "1920 × 1080",
  "9:16": "1080 × 1920",
  "1:1": "1080 × 1080",
  "4:5": "1080 × 1350",
  "5:4": "1350 × 1080",
  "4:3": "1440 × 1080",
  "3:4": "1080 × 1440",
  "21:9": "2560 × 1080",
};

export const CANVAS_PADDING_MIN = 0;
export const CANVAS_PADDING_MAX = 28;

export const ELEMENT_SIZES = ["S", "M", "L"] as const;
export type ElementSize = (typeof ELEMENT_SIZES)[number];
export const SIZE_LABELS: Record<ElementSize, string> = { S: "Small", M: "Medium", L: "Large" };
export const PHONE_ZOOM_MIN = 75;
export const PHONE_ZOOM_MAX = 130;
export const PHONE_ZOOM_DEFAULT = 100;
export const PHONE_SCALE_MIN = 40;
export const PHONE_SCALE_MAX = 160;
export const PHONE_SCALE_DEFAULT = 100;

export const CAMERA_SHAPE_IDS = ["square", "horizontal", "vertical", "original", "circle"] as const;
export type CameraShape = (typeof CAMERA_SHAPE_IDS)[number];

export const CAMERA_SHAPES = [
  { id: "square", label: "Square", aspect: 1 },
  { id: "horizontal", label: "Horizontal", aspect: 16 / 9 },
  { id: "vertical", label: "Vertical", aspect: 9 / 16 },
  { id: "original", label: "Original", aspect: 16 / 9 },
  { id: "circle", label: "Circle", aspect: 1 },
] as const satisfies readonly { id: CameraShape; label: string; aspect: number }[];

// Smallest camera scale the resize node can write. This is a real percent value, so 10 means 10%.
export const CAMERA_SIZE_MIN = 10;

// Largest camera scale the resize node can write. This allows users to make the camera larger than its base frame.
export const CAMERA_SIZE_MAX = 220;

// Initial camera scale for new projects. The setup layout starts compact beside the phone.
export const CAMERA_SIZE_DEFAULT = 20;

// Percent denominator for camera scaling. A value of 10 renders at 10%, 100 renders at full base size.
export const CAMERA_SCALE_REFERENCE = 100;

// Flattest camera corner setting. At 0, the camera uses square corners.
export const CAMERA_ROUNDNESS_MIN = 0;

// Roundest camera corner setting. At 100, the camera becomes fully rounded based on its current size.
export const CAMERA_ROUNDNESS_MAX = 100;

// Initial roundness for new projects. This keeps the default webcam as a circular bubble.
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
