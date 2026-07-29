import { cn } from "../utils/cn";

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
};

type LayoutPreviewProps = {
  phone: Rect;
  camera: Rect;
  className?: string;
};

export function LayoutPreview({ phone, camera, className }: LayoutPreviewProps) {
  return (
    <span
      className={cn(
        "bg-well shadow-well-deep relative block aspect-video w-full overflow-hidden rounded-[6px]",
        className
      )}
    >
      <span
        className="bg-preview-phone absolute block rounded-[2px]"
        style={{
          left: `${phone.x}%`,
          top: `${phone.y}%`,
          width: `${phone.w}%`,
          height: `${phone.h}%`,
        }}
      />
      <span
        className="bg-preview-camera absolute block"
        style={{
          left: `${camera.x}%`,
          top: `${camera.y}%`,
          width: `${camera.w}%`,
          height: `${camera.h}%`,
          borderRadius: camera.radius ?? 0,
        }}
      />
    </span>
  );
}

type ChoiceCardProps = {
  label: string;
  phone: Rect;
  camera: Rect;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function ChoiceCard({
  label,
  phone,
  camera,
  selected = false,
  onSelect,
  className,
}: ChoiceCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "rd-press cursor-pointer rounded-[10px] border p-[9px] text-left",
        selected
          ? "border-accent bg-linear-to-b from-accent/[18%] to-accent/[7%] text-fg shadow-selected"
          : "border-raised-line bg-linear-to-b from-raised-top to-raised-bottom text-fg-2 shadow-row",
        className
      )}
      onClick={onSelect}
      type="button"
    >
      <LayoutPreview camera={camera} phone={phone} />
      <span className="mt-2 block text-left text-[11.5px] font-semibold">{label}</span>
    </button>
  );
}

type SwatchProps = {
  color: string;
  selected?: boolean;
  onSelect?: () => void;
  label?: string;
  className?: string;
};

export function Swatch({ color, selected = false, onSelect, label, className }: SwatchProps) {
  return (
    <button
      aria-label={label ?? color}
      aria-pressed={selected}
      className={cn(
        "rd-press border-swatch-line size-[38px] cursor-pointer rounded-[10px] border p-0",
        selected ? "shadow-swatch" : "shadow-hairline-bright",
        className
      )}
      onClick={onSelect}
      style={{ background: color }}
      type="button"
    />
  );
}
