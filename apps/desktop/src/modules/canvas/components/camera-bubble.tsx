import type { ReactNode } from "react";
import { cn } from "@reeldock/ui";

type CameraBubbleProps = {
  radius: number;
  crop?: number;
  mirrored?: boolean;
  live?: boolean;
  shadow?: boolean;
  label?: string;
  className?: string;
  children?: ReactNode;
};

export function CameraBubble({
  radius,
  crop = 50,
  mirrored = false,
  live = false,
  shadow = false,
  label = "Camera",
  className,
  children,
}: CameraBubbleProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden",
        shadow && "shadow-bubble",
        live ? "bg-transparent" : "bg-camera-hatch",
        mirrored && "-scale-x-100",
        className
      )}
      style={{ borderRadius: radius, backgroundPosition: `${crop}% 50%` }}
    >
      {children ??
        (live ? null : (
          <span className="font-ui-mono text-placeholder-fg text-[9.5px] uppercase tracking-[0.12em]">
            {label}
          </span>
        ))}
    </div>
  );
}
