import { cn } from "@reeldock/ui";

type CameraBubbleProps = {
  radius: number;
  crop?: number;
  mirrored?: boolean;
  label?: string;
  className?: string;
};

export function CameraBubble({
  radius,
  crop = 50,
  mirrored = false,
  label = "Camera",
  className,
}: CameraBubbleProps) {
  return (
    <div
      className={cn(
        "bg-camera-hatch shadow-bubble flex h-full w-full items-center justify-center overflow-hidden",
        mirrored && "-scale-x-100",
        className
      )}
      style={{ borderRadius: radius, backgroundPosition: `${crop}% 50%` }}
    >
      <span className="font-ui-mono text-placeholder-fg text-[9.5px] uppercase tracking-[0.12em]">
        {label}
      </span>
    </div>
  );
}
