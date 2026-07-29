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
