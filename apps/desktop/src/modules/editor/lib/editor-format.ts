import type { CanvasRatio } from "@reeldock/shared";

export function toRatio(value: string): CanvasRatio {
  return value === "Custom" ? "custom" : (value as CanvasRatio);
}

export function ratioLabel(value: CanvasRatio): string {
  return value === "custom" ? "Custom" : value;
}

export function percent(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}
