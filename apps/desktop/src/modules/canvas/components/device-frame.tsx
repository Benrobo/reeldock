import { cn } from "@reeldock/ui";
import type { ReactNode, Ref } from "react";
import {
  DEVICE_FRAME_BORDER_RATIO,
  DEVICE_SCREEN_RADIUS_RATIO,
} from "@/constants/preview";

export function deviceFrameMetrics(
  width: number,
  height: number,
  bezel: boolean,
  radius?: number
) {
  const border = bezel
    ? Math.max(
        4,
        Math.round(Math.min(width, height) * DEVICE_FRAME_BORDER_RATIO)
      )
    : 0;
  const fallbackRadius = Math.round(
    Math.min(width, height) * DEVICE_SCREEN_RADIUS_RATIO
  );
  const innerRadius = Math.round(
    Math.min(radius ?? fallbackRadius, Math.min(width, height) / 2)
  );
  const outerRadius = innerRadius + border;
  return { border, innerRadius, outerRadius };
}

type DeviceFrameProps = {
  width: number;
  height: number;
  bezel: boolean;
  radius?: number;
  frameRef?: Ref<HTMLDivElement>;
  screenRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
};

export function DeviceFrame({
  width,
  height,
  bezel,
  radius,
  frameRef,
  screenRef,
  children,
}: DeviceFrameProps) {
  const { border, innerRadius, outerRadius } = deviceFrameMetrics(
    width,
    height,
    bezel,
    radius
  );

  return (
    <div
      className={cn(
        "absolute inset-0 box-border",
        bezel ? "bg-device-bezel" : ""
      )}
      ref={frameRef}
      style={{ borderRadius: outerRadius, padding: border }}
    >
      <div
        className="relative h-full w-full overflow-hidden"
        ref={screenRef}
        style={{ borderRadius: innerRadius }}
      >
        {children}
      </div>
    </div>
  );
}
