import { useState } from "react";
import { cn } from "../utils/cn";

export type SegmentedSize = "md" | "sm";

type SegmentedProps = {
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: SegmentedSize;
  className?: string;
};

export function Segmented({
  options,
  value,
  defaultValue,
  onChange,
  size = "md",
  className,
}: SegmentedProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]);
  const current = value ?? internal;
  const index = Math.max(0, options.indexOf(current));
  const count = options.length;

  return (
    <div
      className={cn(
        "border-track-line bg-track shadow-track relative flex border p-[3px]",
        size === "md" ? "rounded-[10px]" : "rounded-[9px]",
        className
      )}
    >
      <div
        className="border-thumb-line bg-linear-to-b from-thumb-top to-thumb-bottom shadow-thumb ease-glide absolute inset-y-[3px] rounded-[7px] border transition-[left] duration-[260ms]"
        style={{
          width: `calc((100% - 6px) / ${count})`,
          left: `calc(3px + (100% - 6px) * ${index} / ${count})`,
        }}
      />
      {options.map((option) => (
        <button
          className={cn(
            "relative flex-1 cursor-pointer rounded-[7px] border-none bg-transparent text-[12px] font-semibold transition-colors duration-200",
            size === "md" ? "py-2" : "py-[7px]",
            option === current ? "text-fg" : "text-fg-3"
          )}
          key={option}
          onClick={() => {
            setInternal(option);
            onChange?.(option);
          }}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

type TabsProps = {
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export function Tabs({ options, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]);
  const current = value ?? internal;

  return (
    <div className={cn("flex gap-1", className)}>
      {options.map((option) => (
        <button
          className={cn(
            "rd-press cursor-pointer rounded-lg border px-[15px] py-[7px] text-[12.5px] font-semibold",
            option === current
              ? "border-bright-line bg-linear-to-b from-bright-top to-bright-bottom text-on-bright shadow-bright-soft"
              : "text-fg-3 border-transparent bg-transparent"
          )}
          key={option}
          onClick={() => {
            setInternal(option);
            onChange?.(option);
          }}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
