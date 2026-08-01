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
  { label: "Paper", value: "#F4F2EC" },
  { label: "Linen", value: "#E8E2D6" },
  { label: "Pearl", value: "#F7F8F8" },
  { label: "Fog", value: "#D8DEE2" },
  { label: "Slate", value: "#AEB8C2" },
  { label: "Ink", value: "#1C1B19" },
  { label: "Graphite", value: "#24282C" },
  { label: "Charcoal", value: "#101113" },
  { label: "Coral", value: "#FF5A5F" },
  { label: "Tangerine", value: "#FF914D" },
  { label: "Gold", value: "#FFCF45" },
  { label: "Lime", value: "#C9D72E" },
  { label: "Fern", value: "#42C863" },
  { label: "Blush", value: "#F7A2A5" },
  { label: "Peach", value: "#FFC1A7" },
  { label: "Apricot", value: "#FFD3A1" },
  { label: "Lemon", value: "#FCFFA4" },
  { label: "Mint", value: "#BDF4B4" },
  { label: "Seafoam", value: "#BDF7D0" },
  { label: "Lagoon", value: "#419BA5" },
  { label: "Azure", value: "#238EC9" },
  { label: "Cobalt", value: "#4969B3" },
  { label: "Indigo", value: "#5C5BAE" },
  { label: "Plum", value: "#7653A4" },
  { label: "Rose", value: "#E8498F" },
  { label: "Aqua", value: "#AEE9DB" },
  { label: "Sky", value: "#A5D6E3" },
  { label: "Periwinkle", value: "#9DBDF1" },
  { label: "Lavender", value: "#B7A7F0" },
  { label: "Orchid", value: "#E8A8EA" },
  { label: "Petal", value: "#F4B8DA" },
  { label: "Pine", value: "#2F4C46" },
  { label: "Mist", value: "#C4D4E0" },
  { label: "Clay", value: "#B17457" },
] as const;
