import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "../utils/cn";

export type FillTone = "accent" | "ok";

const fillClass: Record<FillTone, string> = {
  accent: "from-fill-accent-top to-fill-accent-bottom",
  ok: "from-ok-top to-ok-bottom",
};

type SliderProps = {
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  tone?: FillTone;
  className?: string;
};

export function Slider({
  label,
  value,
  defaultValue = 50,
  onChange,
  tone = "ok",
  className,
}: SliderProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const trackRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const commit = useCallback(
    (clientX: number) => {
      const rect = rectRef.current;
      if (!rect) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const next = Math.round(ratio * 100);
      setInternal(next);
      onChange?.(next);
    },
    [onChange]
  );

  const dragging = useRef(false);

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      if (dragging.current) commit(event.clientX);
    };
    const end = () => {
      dragging.current = false;
      rectRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, [commit]);

  const start = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    rectRef.current = track.getBoundingClientRect();
    dragging.current = true;
    commit(event.clientX);
  };

  return (
    <div className={className}>
      <div className="mb-[9px] flex justify-between">
        <span className="text-fg-2 text-[12.5px]">{label}</span>
        <span className="font-ui-mono text-fg-value text-[11.5px]">{current}%</span>
      </div>
      <div className="flex h-6 cursor-pointer items-center" onPointerDown={start}>
        <div
          className="border-well-line bg-well shadow-well-thin relative box-border h-1.5 w-full rounded-[3px] border"
          ref={trackRef}
        >
          <div
            className={cn(
              "bg-linear-to-b absolute inset-y-0 left-0 rounded-[3px]",
              fillClass[tone]
            )}
            style={{ width: `${current}%` }}
          />
          <div
            className="border-knob-line bg-linear-to-b from-knob-top to-knob-sm-bottom shadow-knob-sm absolute top-1/2 -ml-2 -mt-2 size-4 rounded-full border"
            style={{ left: `${current}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function Meter({
  active = true,
  className,
  value,
}: {
  active?: boolean;
  className?: string;
  value?: number;
}) {
  const measured = value !== undefined;
  const width = measured ? `${Math.max(0, Math.min(1, value)) * 100}%` : undefined;

  return (
    <div
      className={cn(
        "border-well-line bg-well shadow-well-thin box-border h-[7px] overflow-hidden rounded-[4px] border",
        className
      )}
    >
      <div
        className={cn(
          "bg-linear-to-r from-ok to-ok-meter-end h-full transition-[width,opacity] duration-75",
          !measured && active && "animate-meter",
          !active && "opacity-35"
        )}
        style={measured ? { width } : undefined}
      />
    </div>
  );
}

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div
      className={cn(
        "border-well-line bg-well shadow-well-thin box-border h-[9px] overflow-hidden rounded-[5px] border",
        className
      )}
    >
      <div
        className="bg-linear-to-b from-fill-accent-top to-fill-accent-bottom h-full rounded-[4px] transition-[width] duration-[180ms] ease-linear"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
