import type { ProjectDoc } from "../types";

export const GRADIENTS = [
  "linear-gradient(160deg,var(--color-screen),var(--color-screen-line))",
  "linear-gradient(160deg,var(--color-screen-accent-soft),var(--color-camera-a))",
  "linear-gradient(160deg,var(--color-promo-lens-rim),var(--color-promo-phone))",
  "linear-gradient(160deg,var(--color-screen),var(--color-promo-lens-core))",
  "linear-gradient(160deg,var(--color-screen-accent),var(--color-promo-notch))",
  "linear-gradient(160deg,var(--color-bright-top),var(--color-screen-control))",
] as const;

export const PATTERNS = [
  {
    label: "Dots",
    css: "radial-gradient(var(--color-screen-control) 1.5px, transparent 1.6px) 0 0/14px 14px, var(--color-screen)",
  },
  {
    label: "Grid",
    css: "linear-gradient(var(--color-screen-line) 1px,transparent 1px) 0 0/22px 22px, linear-gradient(90deg,var(--color-screen-line) 1px,transparent 1px) 0 0/22px 22px, var(--color-screen)",
  },
  {
    label: "Lines",
    css: "repeating-linear-gradient(135deg,var(--color-screen-line) 0 9px,var(--color-screen) 9px 18px)",
  },
  {
    label: "Arcs",
    css: "radial-gradient(circle at 28% 26%, var(--color-screen-line) 0 40%, transparent 40.5%) 0 0/110px 110px, var(--color-screen)",
  },
] as const;

export const IMAGE_PLACEHOLDER =
  "repeating-linear-gradient(135deg,var(--color-camera-a) 0 11px,var(--color-camera-b) 11px 22px)";

export function backgroundCss(doc: ProjectDoc): string {
  if (doc.bgKind === "gradient") return GRADIENTS[doc.grad];
  if (doc.bgKind === "pattern") return PATTERNS[doc.pat].css;
  if (doc.bgKind === "image") return IMAGE_PLACEHOLDER;
  return doc.bg;
}
