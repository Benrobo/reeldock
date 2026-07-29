import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type WindowChromeProps = {
  title: ReactNode;
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function WindowChrome({ title, children, leading, trailing, className }: WindowChromeProps) {
  return (
    <div className={cn("bg-window shadow-window overflow-hidden rounded-[12px]", className)}>
      <div className="border-titlebar-line bg-titlebar relative flex h-[38px] items-center gap-3.5 border-b px-3.5">
        <div className="flex gap-2">
          <span className="bg-traffic-close size-3 rounded-full" />
          <span className="bg-traffic-minimize size-3 rounded-full" />
          <span className="bg-traffic-zoom size-3 rounded-full" />
        </div>
        {leading}
        <div className="text-fg-2 pointer-events-none absolute inset-x-0 text-center text-[12.5px] font-semibold tracking-[0.01em]">
          {title}
        </div>
        <div className="ml-auto flex items-center gap-2">{trailing}</div>
      </div>
      {children}
    </div>
  );
}
