import { cn } from "@reeldock/ui";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <img src="/icon.png" alt="ReelDock" className="size-10" />
      {compact ? null : <span className="text-[17px] font-black">ReelDock</span>}
    </div>
  );
}
