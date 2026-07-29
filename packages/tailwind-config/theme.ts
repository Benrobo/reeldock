export const colors = {
  dock: {
    50: "oklch(97% 0.018 153)",
    100: "oklch(93% 0.045 153)",
    200: "oklch(86% 0.077 153)",
    300: "oklch(77% 0.11 153)",
    400: "oklch(68% 0.13 153)",
    500: "oklch(59% 0.12 153)",
    600: "oklch(49% 0.095 153)",
    700: "oklch(39% 0.07 153)",
    800: "oklch(29% 0.048 153)",
    900: "oklch(21% 0.032 153)",
  },
  ink: "oklch(20% 0.02 154)",
  paper: "oklch(98% 0.012 92)",
  muted: "oklch(52% 0.018 154)",
  panel: "oklch(100% 0.002 92)",
  panelWarm: "oklch(96.5% 0.018 92)",
  line: "oklch(87% 0.014 140)",
  night: "oklch(16% 0.028 162)",
  nightPanel: "oklch(21% 0.034 162)",
  coral: "oklch(68% 0.16 34)",
  gold: "oklch(78% 0.11 83)",
  aqua: "oklch(77% 0.09 179)",
  steel: "oklch(34% 0.04 224)",
  success: "oklch(63% 0.15 148)",
  warning: "oklch(76% 0.14 81)",
  danger: "oklch(61% 0.19 29)",
  info: "oklch(66% 0.12 232)",
} as const;

export const radii = {
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "999px",
} as const;

export type DockColor = keyof typeof colors.dock;
