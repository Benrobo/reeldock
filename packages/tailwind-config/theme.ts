/**
 * TypeScript mirror of the `@theme` tokens in globals.css. Values are ported
 * 1:1 from docs/ReelDock design specification — keep both files in step.
 */
export const colors = {
  canvas: "#131211",

  surface: "#24221f",
  surfaceLine: "#33302b",

  raisedTop: "#2f2c28",
  raisedBottom: "#282521",
  raisedLine: "#3a3630",
  raisedAltTop: "#2a2724",
  raisedAltBottom: "#232120",
  raisedAltLine: "#35312c",

  controlTop: "#3b3733",
  controlBottom: "#2e2b27",
  controlLine: "#47423b",
  controlLineStrong: "#4d473f",
  controlHoverTop: "#454039",
  controlHoverBottom: "#37332e",

  brightTop: "#fdfcfa",
  brightBottom: "#e8e4dc",
  brightLine: "#d5cfc4",
  brightHoverTop: "#ffffff",
  brightHoverBottom: "#f1eee8",
  onBright: "#16150f",

  accent: "oklch(0.63 0.16 252)",
  accentTop: "oklch(0.68 0.15 252)",
  accentBottom: "oklch(0.58 0.16 252)",
  accentLine: "oklch(0.48 0.14 252)",
  accentHoverTop: "oklch(0.72 0.15 252)",
  accentHoverBottom: "oklch(0.62 0.16 252)",
  accentLinkHover: "oklch(0.72 0.14 252)",
  fillAccentTop: "oklch(0.7 0.15 252)",
  fillAccentBottom: "oklch(0.6 0.16 252)",
  accentFg: "#cfdcf5",

  rec: "oklch(0.62 0.18 26)",
  recTop: "oklch(0.66 0.18 26)",
  recBottom: "oklch(0.56 0.19 26)",
  recLine: "oklch(0.46 0.16 26)",
  recHoverTop: "oklch(0.7 0.18 26)",
  recHoverBottom: "oklch(0.6 0.19 26)",
  recDanger: "oklch(0.68 0.16 26)",
  recFg: "#f0d9d3",

  ok: "oklch(0.68 0.14 155)",
  okTop: "oklch(0.74 0.14 155)",
  okBottom: "oklch(0.64 0.15 155)",
  okMeterEnd: "oklch(0.74 0.13 140)",
  okFg: "#cfe3d6",

  warn: "oklch(0.72 0.15 75)",
  warnFg: "#e8dcc6",
  warnBannerFg: "#efe7dc",

  track: "#211f1c",
  trackLine: "#302d29",

  thumbTop: "#403c37",
  thumbBottom: "#33302b",
  thumbLine: "#4a453e",

  well: "#1b1917",
  wellLine: "#302d29",

  knobTop: "#ffffff",
  knobBottom: "#e9e6e0",
  knobSmBottom: "#e6e2dc",
  knobLine: "#b9b4ac",

  disabled: "#2a2724",
  disabledLine: "#35312c",
  disabledFg: "#5f5b55",

  popoverTop: "#2f2c28",
  popoverBottom: "#262320",
  popoverLine: "#45403a",
  popoverArrowSide: "#2a2724",

  chip: "#332f2b",
  chipLine: "#403b35",

  swatchLine: "#3d3833",
  previewPhone: "#6d675f",
  previewCamera: "#4b4640",

  toolDisabled: "#26231f",
  toolDisabledFg: "#565049",

  window: "#1e1c1a",
  titlebar: "#2a2724",
  titlebarLine: "#201e1c",
  trafficClose: "#ed6a5e",
  trafficMinimize: "#f4bf4f",
  trafficZoom: "#61c554",

  modal: "#242220",
  scrim: "rgb(10 9 8 / 0.6)",

  divider: "#2e2b27",
  dash: "#443f39",
  dashStrong: "#4a443c",
  bullet: "#5c5852",

  groupLine: "#37332e",
  groupRow: "#2b2825",

  valueChip: "#302d29",
  valueChipLine: "#3d3833",

  help: "#332f2b",
  helpLine: "#423d37",

  code: "#191715",
  codeLine: "#2f2b27",
  codeFg: "#b5b0a8",

  fg: "#f2efea",
  fgValue: "#e7e3dd",
  fgMenu: "#dedad3",
  fgControl: "#c7c2ba",
  fg2: "#a6a19a",
  fg3: "#8d8880",
  fgHint: "#9a948c",
  fgLabel: "#736f69",
  fgKey: "#6b665f",
  fgFaint: "#5f5b55",
} as const;

export const easing = {
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  glide: "cubic-bezier(0.32, 0.72, 0, 1)",
} as const;

export type ReelDockColor = keyof typeof colors;
