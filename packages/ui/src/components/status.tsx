import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type StatusTone = "rec" | "ok" | "warn" | "neutral";

const dotClass: Record<StatusTone, string> = {
  rec: "bg-rec",
  ok: "bg-ok",
  warn: "bg-warn",
  neutral: "bg-fg-key",
};

const pillClass: Record<StatusTone, string> = {
  rec: "border-rec/[36%] bg-rec/[14%] text-rec-fg",
  ok: "border-ok/[36%] bg-ok/[14%] text-ok-fg",
  warn: "border-warn/[36%] bg-warn/[14%] text-warn-fg",
  neutral:
    "border-raised-line bg-linear-to-b from-raised-top to-raised-bottom font-medium text-fg-2 shadow-row-strong",
};

type StatusDotProps = {
  tone: StatusTone;
  size?: number;
  pulse?: boolean;
  className?: string;
};

export function StatusDot({ tone, size = 6, pulse = false, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "block shrink-0 rounded-full",
        dotClass[tone],
        pulse && "animate-pulse-dot",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusPill({ children, tone = "ok", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-[7px] rounded-lg border px-[11px] py-1.5 text-[12px] font-semibold",
        pillClass[tone],
        className
      )}
    >
      <StatusDot tone={tone} />
      <span>{children}</span>
    </span>
  );
}

type RecordingPillProps = {
  children?: ReactNode;
  className?: string;
};

export function RecordingPill({ children = "Recording", className }: RecordingPillProps) {
  return (
    <span
      className={cn(
        "border-rec/[42%] bg-rec/[16%] shadow-hairline flex items-center gap-2 rounded-lg border px-3 py-1.5",
        className
      )}
    >
      <StatusDot pulse size={8} tone="rec" />
      <span className="text-rec-fg text-[11.5px] font-semibold uppercase tracking-[0.08em]">
        {children}
      </span>
    </span>
  );
}

type SourceChipProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function SourceChip({ children, tone = "neutral", className }: SourceChipProps) {
  return (
    <span
      className={cn(
        "border-raised-alt-line bg-linear-to-b from-raised-alt-top to-raised-alt-bottom shadow-row flex items-center gap-2 rounded-lg border px-3 py-[7px]",
        className
      )}
    >
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

type TagProps = {
  children: ReactNode;
  className?: string;
};

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "border-chip-line bg-chip font-ui-mono text-fg-control rounded-[6px] border px-2 py-[3px] text-[10.5px]",
        className
      )}
    >
      {children}
    </span>
  );
}

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "border-accent/[40%] bg-accent/[18%] text-accent-fg rounded-[99px] border px-[9px] py-[3px] text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

type HelpBadgeProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function HelpBadge({ className, type = "button", ...props }: HelpBadgeProps) {
  return (
    <button
      aria-label="Help"
      className={cn(
        "rd-press border-help-line bg-help text-fg-3 flex size-4 cursor-pointer items-center justify-center rounded-full border p-0 text-[10px] font-bold leading-none",
        className
      )}
      type={type}
      {...props}
    >
      ?
    </button>
  );
}
