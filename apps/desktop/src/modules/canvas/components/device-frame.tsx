import type { ReactNode } from "react";
import { cn } from "@reeldock/ui";

export const PHONE_VIEWPORT = { width: 390, height: 844 } as const;

type DeviceFrameProps = {
  height: number;
  radius: number;
  bezel: boolean;
  children?: ReactNode;
};

export function DeviceFrame({ height, radius, bezel, children }: DeviceFrameProps) {
  const bezelWidth = Math.max(2, Math.round(height * 0.014));
  const outerRadius = Math.round(height * (radius / 400) + bezelWidth);
  const innerRadius = Math.max(1, outerRadius - bezelWidth);
  const innerHeight = height - bezelWidth * 2;

  const islandTop = Math.round(innerHeight * 0.016);
  const islandWidth = Math.round(innerHeight * 0.121);
  const islandHeight = Math.round(innerHeight * 0.0355);
  const scale = innerHeight / PHONE_VIEWPORT.height;

  return (
    <div
      className={cn(
        "absolute inset-0 box-border",
        bezel ? "bg-device-bezel shadow-device" : "bg-transparent"
      )}
      style={{ borderRadius: outerRadius, padding: bezel ? bezelWidth : 0 }}
    >
      <div
        className="bg-screen relative h-full w-full overflow-hidden"
        style={{ borderRadius: innerRadius }}
      >
        <div
          className="bg-screen text-screen-ink font-ui absolute left-1/2 top-1/2"
          style={{
            width: PHONE_VIEWPORT.width,
            height: PHONE_VIEWPORT.height,
            transform: `translate(-50%,-50%) scale(${scale})`,
          }}
        >
          {children}
        </div>
        {bezel ? (
          <div
            className="bg-device-bezel absolute left-1/2 -translate-x-1/2 rounded-[99px]"
            style={{ top: islandTop, width: islandWidth, height: islandHeight }}
          />
        ) : null}
      </div>
    </div>
  );
}
