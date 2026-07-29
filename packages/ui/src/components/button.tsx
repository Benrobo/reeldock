import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "bright" | "dark" | "accent" | "record" | "ghost";
export type ButtonSize = "md" | "sm" | "mini";

const variantClass: Record<ButtonVariant, string> = {
  bright:
    "bg-linear-to-b from-bright-top to-bright-bottom border-bright-line text-on-bright shadow-bright hover:from-bright-hover-top hover:to-bright-hover-bottom",
  dark: "bg-linear-to-b from-control-top to-control-bottom border-control-line text-fg shadow-control hover:from-control-hover-top hover:to-control-hover-bottom",
  accent:
    "bg-linear-to-b from-accent-top to-accent-bottom border-accent-line text-white shadow-accent hover:from-accent-hover-top hover:to-accent-hover-bottom",
  record:
    "gap-[9px] bg-linear-to-b from-rec-top to-rec-bottom border-rec-line text-white shadow-rec hover:from-rec-hover-top hover:to-rec-hover-bottom",
  ghost:
    "border-transparent bg-transparent px-[15px] font-medium text-fg-2 hover:bg-white/[5.5%] hover:text-fg",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "rounded-[9px] px-[17px] py-[9px] text-[13px]",
  sm: "rounded-[7px] px-3 py-1.5 text-[12px]",
  mini: "rounded-[6px] px-2.5 py-1 text-[11.5px]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Button({
  variant = "dark",
  size = "md",
  leading,
  trailing,
  className,
  children,
  disabled = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rd-press inline-flex items-center justify-center gap-2 border font-semibold",
        sizeClass[size],
        disabled
          ? "border-disabled-line bg-disabled text-disabled-fg cursor-not-allowed"
          : cn("cursor-pointer", variantClass[variant]),
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}

/** The white dot on the Record button — a filled circle inside a soft halo. */
export function RecordDot() {
  return <span className="shadow-record-dot block size-[9px] rounded-full bg-white" />;
}

type SplitButtonProps = {
  children: ReactNode;
  variant?: Exclude<ButtonVariant, "ghost">;
  onPress?: () => void;
  onExpand?: () => void;
  className?: string;
};

export function SplitButton({
  children,
  variant = "accent",
  onPress,
  onExpand,
  className,
}: SplitButtonProps) {
  return (
    <div className={cn("flex", className)}>
      <Button className="rounded-r-none px-[15px]" onClick={onPress} size="md" variant={variant}>
        {children}
      </Button>
      <Button
        aria-label="More options"
        className="rounded-l-none border-l-black/30 px-2.5 text-[11px]"
        onClick={onExpand}
        size="md"
        variant={variant}
      >
        &#9662;
      </Button>
    </div>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pressed?: boolean;
};

export function IconButton({
  children,
  pressed = false,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "rd-press flex size-[30px] cursor-pointer items-center justify-center rounded-lg border text-[12px]",
        pressed
          ? "bg-track text-fg shadow-track border-transparent"
          : "border-control-line bg-linear-to-b from-control-top to-control-bottom text-fg-control shadow-control hover:from-control-hover-top hover:to-control-hover-bottom",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Compact toolbar action with an explicit inert disabled fill. */
export function ToolButton({
  children,
  className,
  disabled = false,
  type = "button",
  ...props
}: ToolButtonProps) {
  return (
    <button
      className={cn(
        "rd-press rounded-[7px] border px-[11px] py-1.5 text-[11.5px] font-semibold",
        disabled
          ? "border-well-line bg-tool-disabled text-tool-disabled-fg cursor-not-allowed"
          : "border-control-line bg-linear-to-b from-control-top to-control-bottom text-fg-control shadow-control cursor-pointer",
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type TransportButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function TransportButton({
  children,
  className,
  type = "button",
  ...props
}: TransportButtonProps) {
  return (
    <button
      className={cn(
        "rd-press border-bright-line bg-linear-to-b from-bright-top to-bright-bottom text-on-bright shadow-bright flex size-[34px] cursor-pointer items-center justify-center rounded-full border text-[12px] font-bold",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function LinkButton({ children, className, type = "button", ...props }: LinkButtonProps) {
  return (
    <button
      className={cn(
        "text-fg-3 hover:text-fg cursor-pointer border-none bg-none p-0 text-[12.5px] transition-colors",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
