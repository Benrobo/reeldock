import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { StatusDot, type StatusTone } from "./status";

type PanelProps = {
  children: ReactNode;
  label?: ReactNode;
  className?: string;
};

export function Panel({ children, label, className }: PanelProps) {
  return (
    <div
      className={cn(
        "border-surface-line bg-surface shadow-panel rounded-[14px] border p-[22px]",
        className
      )}
    >
      {label ? <PanelLabel>{label}</PanelLabel> : null}
      {children}
    </div>
  );
}

export function PanelLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-fg-label text-[11px] font-semibold uppercase tracking-[0.12em]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-fg-hint text-[11px] font-semibold uppercase tracking-[0.13em]",
        className
      )}
    >
      {children}
    </div>
  );
}

type SurfaceRowProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

/* Rows gradient down from #2f2c28 to #282521 — the same recipe as a control,
   one step calmer. */
export function SurfaceRow({ children, tone, className }: SurfaceRowProps) {
  return (
    <div
      className={cn(
        "border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row flex items-center gap-3 rounded-[10px] border px-3.5 py-3",
        className
      )}
    >
      {tone ? <StatusDot size={7} tone={tone} /> : null}
      {children}
    </div>
  );
}

export type BannerTone = "warn" | "ok" | "rec";

const bannerClass: Record<BannerTone, string> = {
  warn: "border-warn/[32%] bg-warn/[12%] text-warn-banner-fg",
  ok: "border-ok/[32%] bg-ok/[12%] text-ok-fg",
  rec: "border-rec/[32%] bg-rec/[12%] text-rec-fg",
};

type BannerProps = {
  children: ReactNode;
  tone?: BannerTone;
  action?: ReactNode;
  className?: string;
};

/** Banners tint the whole row — no left accent bar. */
export function Banner({ children, tone = "warn", action, className }: BannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[10px] border px-3.5 py-3",
        bannerClass[tone],
        className
      )}
    >
      <StatusDot size={7} tone={tone} />
      <span className="flex-1 text-[12.5px]">{children}</span>
      {action}
    </div>
  );
}

type WellProps = {
  children: ReactNode;
  className?: string;
};

/** Recessed well — for read-only detail and checklists. */
export function Well({ children, className }: WellProps) {
  return (
    <div
      className={cn(
        "border-well-line bg-well text-fg-3 shadow-well-soft rounded-[10px] border px-[15px] py-[13px] text-[12px] leading-[1.5]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("font-ui-mono text-fg-faint text-[11px] leading-[1.7]", className)}>
      {children}
    </div>
  );
}

export function Timecode({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-ui-mono text-fg-value text-[13.5px]", className)}>{children}</span>
  );
}

export function Divider({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      className={cn(
        orientation === "horizontal" ? "bg-divider my-5 h-px" : "bg-surface-line mx-1 h-5 w-px",
        className
      )}
    />
  );
}

type SettingsListProps = {
  children: ReactNode;
  className?: string;
};

/* Hairlines are faked with a 1px flex gap over the group's own background, so
   rows stay square-cornered inside a rounded container. */
export function SettingsList({ children, className }: SettingsListProps) {
  return (
    <div
      className={cn(
        "border-group-line bg-group-line flex flex-col gap-px overflow-hidden rounded-[12px] border",
        className
      )}
    >
      {children}
    </div>
  );
}

type SettingsRowProps = {
  label: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function SettingsRow({ label, hint, children, className }: SettingsRowProps) {
  return (
    <div
      className={cn(
        "bg-surface flex items-center justify-between gap-4 px-[18px] py-[15px]",
        className
      )}
    >
      <div>
        <div className="text-[13.5px]">{label}</div>
        {hint ? <div className="text-fg-hint mt-[3px] text-[12px]">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

type ChecklistProps = {
  title?: ReactNode;
  items: ReactNode[];
  className?: string;
};

export function Checklist({ title, items, className }: ChecklistProps) {
  return (
    <div
      className={cn(
        "border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row rounded-[11px] border px-[15px] py-3.5",
        className
      )}
    >
      {title ? <div className="mb-[9px] text-[12.5px] font-semibold">{title}</div> : null}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div className="flex items-start gap-[9px]" key={index}>
            <span className="bg-bullet mt-1.5 block size-[5px] shrink-0 rounded-full" />
            <span className="text-fg-2 text-[12px] leading-[1.45]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre
      className={cn(
        "border-code-line bg-code font-ui-mono text-code-fg shadow-well-deep m-0 max-h-[260px] overflow-auto whitespace-pre rounded-[9px] border px-3 py-[11px] text-[10.5px] leading-[1.6]",
        className
      )}
    >
      {children}
    </pre>
  );
}

type EmptyStateProps = {
  glyph?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ glyph, title, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-dash bg-surface flex flex-col items-center justify-center gap-3.5 rounded-[10px] border border-dashed",
        className
      )}
    >
      {glyph ?? (
        <div className="border-dash-strong h-[76px] w-[46px] rounded-[10px] border-[1.5px]" />
      )}
      <div className="text-fg-control text-[15px] font-semibold">{title}</div>
      {children ? (
        <p className="text-fg-3 max-w-[280px] text-center text-[13px] leading-[1.5]">{children}</p>
      ) : null}
    </div>
  );
}

type DropZoneProps = {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
};

export function DropZone({ children, hint, className }: DropZoneProps) {
  return (
    <div
      className={cn(
        "bg-hatch border-dash-strong flex h-24 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed",
        className
      )}
    >
      <span className="text-fg-2 text-[12.5px]">{children}</span>
      {hint ? (
        <span className="font-ui-mono text-fg-faint text-[10px] uppercase tracking-[0.08em]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
