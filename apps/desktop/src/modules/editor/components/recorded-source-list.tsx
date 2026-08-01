import {
  CameraVideoIcon,
  Mic01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { ActivitySpinner, cn } from "@reeldock/ui";
import type { ColorIconTone } from "@/components/color-icon";
import { ColorIcon } from "@/components/color-icon";
import {
  trackFileLabel,
  trackStateLabel,
  trackTone,
  type TrackLoadState,
  type TracksByKind,
} from "../lib/source-tracks";

const sourceRows = [
  ["phone", "Phone", SmartPhone01Icon, "phone"],
  ["webcam", "Webcam", CameraVideoIcon, "camera"],
  ["microphone", "Microphone", Mic01Icon, "microphone"],
] as const;

type RecordedSourceListProps = {
  loadState: TrackLoadState;
  tracksByKind: TracksByKind;
};

export function RecordedSourceList({ loadState, tracksByKind }: RecordedSourceListProps) {
  return (
    <div className="mb-3 grid gap-2">
      <div className="text-fg-hint text-[11px] font-semibold uppercase tracking-[0.11em]">
        Recorded sources
      </div>
      {loadState === "loading" ? (
        <div className="text-fg-3 flex items-center gap-2 text-xs">
          <ActivitySpinner size={14} />
          Loading tracks
        </div>
      ) : (
        sourceRows.map(([kind, label, icon, tone]) => {
          const track = tracksByKind[kind];
          const statusTone = trackTone(track);

          return (
            <div
              className="border-raised-alt-line bg-raised-alt-bottom flex min-w-0 items-center gap-2 rounded-[8px] border px-2.5 py-2"
              key={kind}
            >
              <ColorIcon icon={icon} size={15} tone={tone as ColorIconTone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg-2 text-[12px] font-semibold">{label}</span>
                  <span className="font-ui-mono text-fg-value text-[10.5px]">
                    {trackStateLabel(track)}
                  </span>
                </div>
                <div className="text-fg-faint mt-0.5 truncate text-[10.5px]">
                  {trackFileLabel(track)}
                </div>
              </div>
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  statusTone === "ok"
                    ? "bg-ok"
                    : statusTone === "rec"
                      ? "bg-rec"
                      : statusTone === "warn"
                        ? "bg-warn"
                        : "bg-fg-key"
                )}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
