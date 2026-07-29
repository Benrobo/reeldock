import { Icon } from "@benrobo/iconary/react";
import type { IconData } from "@benrobo/iconary/core";
import { cn } from "@reeldock/ui";

export type ColorIconTone =
  | "back"
  | "camera"
  | "canvas"
  | "control"
  | "export"
  | "menu"
  | "microphone"
  | "phone"
  | "plug"
  | "record";

type ColorIconProps = {
  icon: IconData;
  tone: ColorIconTone;
  size?: number;
  badge?: boolean;
  className?: string;
  title?: string;
};

const toneClass: Record<ColorIconTone, string> = {
  back: "text-[#7dd3fc]",
  camera: "text-[#fbbf24]",
  canvas: "text-[#fb7185]",
  control: "text-[#a78bfa]",
  export: "text-[#34d399]",
  menu: "text-[#c4b5fd]",
  microphone: "text-[#c084fc]",
  phone: "text-[#38bdf8]",
  plug: "text-[#f59e0b]",
  record: "text-[#fb7185]",
};

const badgeClass: Record<ColorIconTone, string> = {
  back: "border-[#7dd3fc]/30 bg-[#7dd3fc]/12",
  camera: "border-[#fbbf24]/30 bg-[#fbbf24]/12",
  canvas: "border-[#fb7185]/30 bg-[#fb7185]/12",
  control: "border-[#a78bfa]/30 bg-[#a78bfa]/12",
  export: "border-[#34d399]/30 bg-[#34d399]/12",
  menu: "border-[#c4b5fd]/30 bg-[#c4b5fd]/12",
  microphone: "border-[#c084fc]/30 bg-[#c084fc]/12",
  phone: "border-[#38bdf8]/30 bg-[#38bdf8]/12",
  plug: "border-[#f59e0b]/30 bg-[#f59e0b]/12",
  record: "border-[#fb7185]/30 bg-[#fb7185]/12",
};

export function ColorIcon({
  icon,
  tone,
  size = 18,
  badge = false,
  className,
  title,
}: ColorIconProps) {
  if (!badge) {
    return (
      <Icon
        className={cn("shrink-0", toneClass[tone], className)}
        color="currentColor"
        icon={icon}
        size={size}
        title={title}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid size-[38px] shrink-0 place-items-center rounded-[12px] border",
        toneClass[tone],
        badgeClass[tone],
        className
      )}
    >
      <Icon color="currentColor" icon={icon} size={size} title={title} />
    </span>
  );
}
