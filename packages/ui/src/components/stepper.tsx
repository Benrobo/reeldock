import { useState } from "react";
import { cn } from "../utils/cn";

type StepperProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  className?: string;
};

export function Stepper({
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (v) => String(v),
  className,
}: StepperProps) {
  const [internal, setInternal] = useState(defaultValue ?? min);
  const current = value ?? internal;

  const shift = (delta: number) => {
    const next = Math.max(min, Math.min(max, current + delta));
    setInternal(next);
    onChange?.(next);
  };

  const buttonClass =
    "h-7 w-[26px] cursor-pointer border-none bg-linear-to-b from-control-top to-control-bottom text-[13px] text-fg-control";

  return (
    <div
      className={cn(
        "border-control-line shadow-stepper inline-flex w-fit items-center overflow-hidden rounded-lg border",
        className
      )}
    >
      <button
        aria-label="Decrease"
        className={cn(buttonClass, "border-raised-line border-r")}
        onClick={() => shift(-step)}
        type="button"
      >
        &minus;
      </button>
      <span className="bg-track font-ui-mono text-fg min-w-14 px-1.5 text-center text-[12px] leading-7">
        {format(current)}
      </span>
      <button
        aria-label="Increase"
        className={cn(buttonClass, "border-raised-line border-l")}
        onClick={() => shift(step)}
        type="button"
      >
        +
      </button>
    </div>
  );
}
