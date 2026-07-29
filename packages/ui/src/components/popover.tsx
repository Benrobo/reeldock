import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

export type PopoverSide = "top" | "bottom" | "left" | "right";

type Position = {
  x: number;
  y: number;
  side: PopoverSide;
  arrow: number;
};

const OPPOSITE: Record<PopoverSide, PopoverSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const ORIGIN: Record<PopoverSide, string> = {
  top: "bottom center",
  bottom: "top center",
  left: "right center",
  right: "left center",
};

const VIEWPORT_PADDING = 12;
const ANCHOR_GAP = 11;
const ARROW_INSET = 18;

const arrowSideClass: Record<PopoverSide, string> = {
  top: "border-b border-r bg-popover-bottom",
  bottom: "border-l border-t bg-popover-top",
  left: "border-r border-t bg-popover-arrow-side",
  right: "border-b border-l bg-popover-arrow-side",
};

type PopoverProps = {
  children: ReactNode;
  content: ReactNode;
  side?: PopoverSide;
  className?: string;
};

export function Popover({ children, content, side = "bottom", className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const popover = popoverRef.current;
    const anchor = anchorRef.current;
    if (!popover || !anchor) return;

    const a = anchor.getBoundingClientRect();
    const r = popover.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const fits: Record<PopoverSide, boolean> = {
      top: a.top - ANCHOR_GAP - h >= VIEWPORT_PADDING,
      bottom: a.bottom + ANCHOR_GAP + h <= viewportHeight - VIEWPORT_PADDING,
      left: a.left - ANCHOR_GAP - w >= VIEWPORT_PADDING,
      right: a.right + ANCHOR_GAP + w <= viewportWidth - VIEWPORT_PADDING,
    };

    let resolved = side;
    if (!fits[resolved] && fits[OPPOSITE[resolved]]) resolved = OPPOSITE[resolved];

    let x: number;
    let y: number;
    let arrow: number;

    if (resolved === "top" || resolved === "bottom") {
      y = resolved === "top" ? a.top - ANCHOR_GAP - h : a.bottom + ANCHOR_GAP;
      x = Math.max(
        VIEWPORT_PADDING,
        Math.min(viewportWidth - VIEWPORT_PADDING - w, a.left + a.width / 2 - w / 2)
      );
      arrow = Math.max(ARROW_INSET, Math.min(w - ARROW_INSET, a.left + a.width / 2 - x));
    } else {
      x = resolved === "left" ? a.left - ANCHOR_GAP - w : a.right + ANCHOR_GAP;
      y = Math.max(
        VIEWPORT_PADDING,
        Math.min(viewportHeight - VIEWPORT_PADDING - h, a.top + a.height / 2 - h / 2)
      );
      arrow = Math.max(ARROW_INSET, Math.min(h - ARROW_INSET, a.top + a.height / 2 - y));
    }

    setPosition((current) =>
      current &&
      current.x === x &&
      current.y === y &&
      current.side === resolved &&
      current.arrow === arrow
        ? current
        : { x, y, side: resolved, arrow }
    );
  }, [side]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const close = () => {
      setOpen(false);
      setPosition(null);
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const resolvedSide = position?.side ?? side;
  const offset = position ? position.arrow - 6 : 0;

  return (
    <>
      <span
        className="inline-flex"
        onClick={() => {
          setOpen((current) => !current);
          setPosition(null);
        }}
        ref={anchorRef}
      >
        {children}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "border-popover-line bg-linear-to-b from-popover-top to-popover-bottom shadow-popover ease-glide fixed z-[90] rounded-[12px] border transition-[opacity,transform] duration-[180ms]",
                position ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
                className
              )}
              ref={popoverRef}
              style={{
                left: position ? position.x : -9999,
                top: position ? position.y : -9999,
                transformOrigin: ORIGIN[resolvedSide],
              }}
            >
              {position ? (
                <div
                  className={cn(
                    "border-popover-line absolute size-3 rotate-45 rounded-[2px]",
                    arrowSideClass[resolvedSide]
                  )}
                  style={
                    resolvedSide === "top" || resolvedSide === "bottom"
                      ? {
                          left: offset,
                          [resolvedSide === "top" ? "bottom" : "top"]: -6,
                        }
                      : {
                          top: offset,
                          [resolvedSide === "left" ? "right" : "left"]: -6,
                        }
                  }
                />
              ) : null}
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex min-w-[216px] flex-col gap-px p-1.5", className)}>
      {children}
    </div>
  );
}

type MenuItemProps = {
  children: ReactNode;
  shortcut?: ReactNode;
  danger?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function MenuItem({
  children,
  shortcut,
  danger = false,
  onSelect,
  className,
}: MenuItemProps) {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-6 rounded-[7px] border border-transparent bg-transparent px-2.5 py-[7px] text-left text-[12.5px] font-medium transition-colors hover:bg-white/[6%]",
        danger ? "text-rec-danger" : "text-fg-menu",
        className
      )}
      onClick={onSelect}
      type="button"
    >
      <span>{children}</span>
      {shortcut ? <span className="font-ui-mono text-fg-key text-[11px]">{shortcut}</span> : null}
    </button>
  );
}

type PopoverInfoProps = {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PopoverInfo({ title, children, actions, className }: PopoverInfoProps) {
  return (
    <div className={cn("relative w-[300px] p-4", className)}>
      <div className="text-fg text-[13.5px] font-semibold">{title}</div>
      <div className="text-fg-2 mt-[7px] text-pretty text-[12.5px] leading-[1.55]">{children}</div>
      {actions ? <div className="mt-3.5 flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function PopoverTip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-fg-menu relative max-w-[220px] px-3 py-[9px] text-[12px] leading-[1.5]",
        className
      )}
    >
      {children}
    </div>
  );
}
