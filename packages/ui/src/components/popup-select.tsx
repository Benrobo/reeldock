import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@benrobo/iconary/react";
import { ArrowUpDownIcon, Tick02Icon } from "@benrobo/iconary/core/duotone-rounded";
import { cn } from "../utils/cn";

export type PopupSelectOption = {
  value: string;
  label: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
};

type PopupSelectProps = {
  value?: string;
  options: PopupSelectOption[];
  placeholder?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  onChange: (value: string) => void;
};

export function PopupSelect({
  value,
  options,
  placeholder = "Select",
  disabled = false,
  ariaLabel,
  className,
  buttonClassName,
  menuClassName,
  onChange,
}: PopupSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const unavailable = disabled || !options.length;

  useEffect(() => {
    if (!open) return;

    const close = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative min-w-0", className)} ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "rd-press border-control-line bg-linear-to-b from-control-top to-control-bottom shadow-control flex h-[34px] w-full items-center gap-2.5 rounded-lg border px-3 text-left",
          unavailable ? "cursor-not-allowed text-fg-faint" : "cursor-pointer text-fg",
          open ? "border-control-line-strong from-control-hover-top to-control-hover-bottom" : "",
          buttonClassName
        )}
        disabled={unavailable}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
          {selected?.label ?? placeholder}
        </span>
        <Icon
          className="text-fg-3 shrink-0"
          color="currentColor"
          icon={ArrowUpDownIcon}
          size={12}
        />
      </button>

      {open ? (
        <div
          className={cn(
            "border-popover-line bg-linear-to-b from-popover-top to-popover-bottom shadow-popover absolute left-0 right-0 top-10 z-30 rounded-[11px] border p-1.5",
            menuClassName
          )}
          role="listbox"
        >
          {options.map((option) => {
            const selectedOption = option.value === value;
            return (
              <button
                aria-selected={selectedOption}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left",
                  selectedOption
                    ? "border-control-line-strong bg-control-bottom"
                    : "border-transparent bg-transparent hover:bg-white/[6%]",
                  option.disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"
                )}
                disabled={option.disabled}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <Icon
                  className={cn("shrink-0", selectedOption ? "text-accent" : "text-transparent")}
                  color="currentColor"
                  icon={Tick02Icon}
                  size={13}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-fg-menu block truncate text-[12.5px] font-medium">
                    {option.label}
                  </span>
                  {option.meta ? (
                    <span className="font-ui-mono text-fg-hint mt-0.5 block truncate text-[10.5px]">
                      {option.meta}
                    </span>
                  ) : null}
                </span>
                {option.trailing}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
