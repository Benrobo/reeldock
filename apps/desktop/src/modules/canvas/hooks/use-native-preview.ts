import { useEffect, useRef, type RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { NATIVE_PREVIEW_Y_OFFSETS } from "@/constants/preview";
import { canUseLocalDb } from "@/db/local";

type PreviewRect = { x: number; y: number; width: number; height: number };

type NativePreviewOptions = {
  surface: string;
  uniqueId: string | undefined;
  enabled: boolean;
  radius?: number;
  mirror?: boolean;
  hostRef?: RefObject<HTMLElement | null>;
};

function rectOf(element: HTMLElement): PreviewRect {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };
}

function relativeRectOf(element: HTMLElement, host: HTMLElement, surface: string): PreviewRect {
  const bounds = element.getBoundingClientRect();
  const hostBounds = host.getBoundingClientRect();
  return {
    x: bounds.left - hostBounds.left,
    y: bounds.top - hostBounds.top + (NATIVE_PREVIEW_Y_OFFSETS[surface] ?? 0),
    width: bounds.width,
    height: bounds.height,
  };
}

export function useNativePreview<T extends HTMLElement>(options: NativePreviewOptions) {
  const { surface, uniqueId, enabled, radius, mirror = false, hostRef } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !uniqueId || !canUseLocalDb()) return;

    let frame = 0;
    let running = false;
    let started = false;
    let lastKey = "";

    const sync = async () => {
      const element = ref.current;
      if (!element) {
        frame = requestAnimationFrame(() => void sync());
        return;
      }

      const host = hostRef?.current;
      const hostRect = host ? rectOf(host) : undefined;
      const rect = host ? relativeRectOf(element, host, surface) : rectOf(element);
      const previewRadius = radius ?? nativeRadius(surface, rect);
      const hostKey = hostRect
        ? `${Math.round(hostRect.x)}:${Math.round(hostRect.y)}:${Math.round(hostRect.width)}:${Math.round(hostRect.height)}`
        : "";
      const key = `${hostKey}:${Math.round(rect.x)}:${Math.round(rect.y)}:${Math.round(rect.width)}:${Math.round(rect.height)}:${Math.round(previewRadius)}`;
      if (key !== lastKey && !running) {
        running = true;
        lastKey = key;
        try {
          if (started) {
            await invoke("set_preview_frame", {
              surface,
              rect,
              hostRect,
              radius: previewRadius,
            });
          } else {
            started = await invoke<boolean>("start_preview", {
              surface,
              uniqueId,
              rect,
              hostRect,
              radius: previewRadius,
              mirror,
            });
            if (!started) lastKey = "";
          }
        } catch (error) {
          lastKey = "";
          console.error(error);
        } finally {
          running = false;
        }
      }
      frame = requestAnimationFrame(() => void sync());
    };
    void sync();

    return () => {
      cancelAnimationFrame(frame);
      if (started) void invoke("stop_preview", { surface });
    };
  }, [surface, uniqueId, enabled, radius, mirror, hostRef]);

  return ref;
}

function nativeRadius(surface: string, rect: { width: number; height: number }, radius?: number) {
  if (radius !== undefined) return radius;
  if (surface === "phone") return Math.round(Math.min(rect.width, rect.height) * 0.14);
  return Math.round(Math.min(rect.width, rect.height) / 2);
}
