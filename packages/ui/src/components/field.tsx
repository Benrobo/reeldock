import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";

type FieldRowProps = {
  label: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FieldRow({ label, children, className }: FieldRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-fg-2 text-[12.5px]">{label}</span>
      {children}
    </div>
  );
}

type SelectButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function SelectButton({
  children,
  className,
  type = "button",
  ...props
}: SelectButtonProps) {
  return (
    <button
      className={cn(
        "rd-press border-control-line bg-linear-to-b from-control-top to-control-bottom text-fg shadow-control hover:from-control-hover-top hover:to-control-hover-bottom flex cursor-pointer items-center gap-2.5 rounded-lg border px-[11px] py-[7px] text-[12.5px] font-medium",
        className
      )}
      type={type}
      {...props}
    >
      {children}
      <span className="text-fg-3 text-[10px]">&#9662;</span>
    </button>
  );
}

type ValueChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Flat value display for settings rows — reads as a value, not as an action. */
export function ValueChip({ children, className, type = "button", ...props }: ValueChipProps) {
  return (
    <button
      className={cn(
        "rd-press border-value-chip-line bg-value-chip flex cursor-pointer items-center gap-[9px] rounded-lg border px-3 py-[7px] text-[12.5px] font-medium",
        className
      )}
      type={type}
      {...props}
    >
      {children}
      <span className="text-fg-hint text-[10px]">&#9662;</span>
    </button>
  );
}

type PathFieldProps = {
  value: string;
  action?: ReactNode;
  className?: string;
};

/* Wells invert the recipe: a darker fill and an inset shadow instead of a
   gradient and a drop shadow. */
export function PathField({ value, action, className }: PathFieldProps) {
  return (
    <div
      className={cn(
        "border-well-line bg-well shadow-well flex items-center gap-2.5 rounded-[9px] border px-3 py-[9px]",
        className
      )}
    >
      <span className="font-ui-mono text-fg-control flex-1 truncate text-[12px]">{value}</span>
      {action}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  trailing?: ReactNode;
  containerClassName?: string;
};

/** Focus adds a 3px ring at 22% accent on top of the well's inset shadow. */
export function TextField({ trailing, containerClassName, className, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "bg-well flex items-center gap-2.5 rounded-[9px] border px-3 py-[9px]",
        focused ? "border-accent shadow-focus" : "border-well-line shadow-well",
        containerClassName
      )}
    >
      <input
        className={cn(
          "text-fg w-full flex-1 border-none bg-transparent text-[12.5px] outline-none",
          className
        )}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        {...props}
      />
      {trailing ? <span className="text-fg-label text-[11.5px]">{trailing}</span> : null}
    </div>
  );
}
