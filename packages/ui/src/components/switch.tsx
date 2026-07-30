import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
};

export function Switch({
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  label,
  className,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;

  return (
    <button
      aria-checked={on}
      aria-label={label}
      className={cn(
        "shadow-track ease-glide relative h-[26px] w-11 shrink-0 cursor-pointer rounded-[13px] border border-black/40 p-0 transition-[background] duration-[240ms]",
        on ? "bg-linear-to-b from-accent-top to-accent-bottom" : "bg-track",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className
      )}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setInternal(!on);
        onChange?.(!on);
      }}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "bg-linear-to-b from-knob-top to-knob-bottom shadow-knob ease-glide absolute left-0.5 top-0.5 block size-5 rounded-full transition-transform duration-[240ms]",
          on ? "translate-x-[18px]" : "translate-x-0"
        )}
      />
    </button>
  );
}

type SwitchRowProps = {
  label: string;
  hint?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

export function SwitchRow({
  label,
  hint,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  className,
}: SwitchRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {hint ? <div className="text-fg-label mt-0.5 text-[11.5px]">{hint}</div> : null}
      </div>
      <Switch
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        label={label}
        onChange={onChange}
      />
    </div>
  );
}
