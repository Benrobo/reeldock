export type EditorSection = "canvas" | "phone" | "camera" | "audio";

export const EDITOR_SECTIONS: {
  id: EditorSection;
  label: string;
  title: string;
  hint: string;
}[] = [
  {
    id: "canvas",
    label: "Canvas",
    title: "Canvas",
    hint: "Set output shape, background, padding, and spacing.",
  },
  {
    id: "phone",
    label: "Phone",
    title: "Phone",
    hint: "Tune the recorded device frame without rewriting footage.",
  },
  {
    id: "camera",
    label: "Camera",
    title: "Camera",
    hint: "Place the presenter track independently of the phone.",
  },
  {
    id: "audio",
    label: "Audio",
    title: "Audio",
    hint: "Balance recorded microphone audio before export.",
  },
];

export const FILMSTRIP_COLORS = [
  "var(--color-raised-top)",
  "var(--color-chip)",
  "var(--color-raised-alt-top)",
  "var(--color-control-bottom)",
] as const;

export const WAVEFORM_HEIGHTS = [
  9, 18, 30, 15, 36, 24, 12, 28, 34, 16, 10, 32, 22, 38, 14, 26, 30, 18,
] as const;

export const SOLID_BACKGROUNDS = [
  { label: "Paper", value: "var(--color-screen)" },
  { label: "Linen", value: "var(--color-screen-line)" },
  { label: "Ink", value: "var(--color-window)" },
  { label: "Pine", value: "var(--color-screen-accent)" },
  { label: "Mist", value: "var(--color-promo-lens-core)" },
  { label: "Clay", value: "var(--color-camera-a)" },
] as const;
