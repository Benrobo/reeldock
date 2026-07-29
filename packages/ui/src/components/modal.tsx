import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type ModalProps = {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

export function Modal({
  open,
  title,
  subtitle,
  children,
  actions,
  onDismiss,
  className,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="bg-scrim z-999 absolute inset-0 flex items-center justify-center"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        aria-modal
        className={cn(
          "border-raised-line bg-modal shadow-modal w-[720px] overflow-hidden rounded-[14px] border",
          className
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="px-7 pt-6">
          <div className="text-[19px] font-semibold tracking-[-0.018em]">{title}</div>
          {subtitle ? <div className="text-fg-3 mt-[5px] text-[13px]">{subtitle}</div> : null}
        </div>
        {children}
        {actions ? (
          <div className="flex items-center gap-2.5 px-7 pb-6 pt-[22px]">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
