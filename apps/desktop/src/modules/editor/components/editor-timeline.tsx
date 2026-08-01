import { PauseIcon, PlayIcon } from "@benrobo/iconary/core/duotone-rounded";
import { Divider, Timecode, ToolButton, TransportButton, cn } from "@reeldock/ui";
import type { Segment } from "@/modules/project";
import { timecode } from "@/lib/format";
import { ColorIcon } from "@/components/color-icon";
import { FILMSTRIP_COLORS, WAVEFORM_HEIGHTS } from "../data/editor-data";
import { percent } from "../lib/editor-format";

type EditorTimelineProps = {
  canRedo: boolean;
  canUndo: boolean;
  cutSummary: string;
  duration: number;
  keptDuration: number;
  playing: boolean;
  removed: { start: number; width: number }[];
  selectedSegment: number;
  segments: Segment[];
  time: number;
  stripRef: React.RefObject<HTMLDivElement | null>;
  onRedo: () => void;
  onRemove: () => void;
  onScrub: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSelectSegment: (index: number) => void;
  onSetPlaying: (playing: boolean) => void;
  onSetTime: (time: number) => void;
  onSplit: () => void;
  onUndo: () => void;
};

export function EditorTimeline({
  canRedo,
  canUndo,
  cutSummary,
  duration,
  keptDuration,
  playing,
  removed,
  selectedSegment,
  segments,
  time,
  stripRef,
  onRedo,
  onRemove,
  onScrub,
  onSelectSegment,
  onSetPlaying,
  onSetTime,
  onSplit,
  onUndo,
}: EditorTimelineProps) {
  return (
    <footer className="border-titlebar-line bg-titlebar flex h-44 flex-col gap-2.5 border-t px-5 py-3">
      <div className="flex items-center gap-2.5">
        <TransportButton onClick={() => onSetPlaying(!playing)}>
          <ColorIcon icon={playing ? PauseIcon : PlayIcon} size={15} tone="control" />
        </TransportButton>
        <Timecode>
          {timecode(time)} <span className="text-fg-key">/ {timecode(keptDuration)}</span>
        </Timecode>
        <Divider className="mx-1" orientation="vertical" />
        <ToolButton onClick={onSplit}>Split</ToolButton>
        <ToolButton disabled={segments.length < 2} onClick={onRemove}>
          Remove selection
        </ToolButton>
        <ToolButton disabled={!canUndo} onClick={onUndo}>
          Undo
        </ToolButton>
        <ToolButton disabled={!canRedo} onClick={onRedo}>
          Redo
        </ToolButton>
        <div className="flex-1" />
        <div className="text-fg-hint text-xs">{cutSummary}</div>
      </div>

      <div
        className="border-track-line bg-well shadow-well relative h-[92px] cursor-text overflow-hidden rounded-[9px] border"
        onPointerDown={onScrub}
        ref={stripRef}
      >
        <div className="absolute inset-x-0 top-0 flex h-[50px] gap-px">
          {Array.from({ length: 24 }, (_, index) => (
            <div
              className="bg-linear-to-b from-chip to-raised-bottom flex flex-1 items-center justify-center"
              key={index}
            >
              <div
                className="h-[70%] w-[22%] rounded-sm"
                style={{ background: FILMSTRIP_COLORS[index % FILMSTRIP_COLORS.length] }}
              />
            </div>
          ))}
        </div>
        <div className="bg-window border-titlebar-line absolute inset-x-0 bottom-0 flex h-[42px] items-center gap-0.5 border-t px-1.5">
          {Array.from({ length: 90 }, (_, index) => (
            <div
              className="bg-control-line-strong flex-1 rounded-[1px]"
              key={index}
              style={{ height: WAVEFORM_HEIGHTS[index % WAVEFORM_HEIGHTS.length] }}
            />
          ))}
        </div>
        {removed.map((region) => (
          <div
            className="border-dash-strong absolute inset-y-0 flex items-center justify-center border-x border-dashed bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-canvas)_86%,transparent)_0_6px,color-mix(in_oklab,var(--color-window)_86%,transparent)_6px_12px)]"
            key={`${region.start}-${region.width}`}
            style={{
              left: percent(region.start, duration),
              width: percent(region.width, duration),
            }}
          >
            <span className="font-ui-mono text-placeholder-fg text-[9.5px] uppercase tracking-[0.1em]">
              removed
            </span>
          </div>
        ))}
        {segments.map((segment, index) => (
          <button
            aria-label={`Segment ${index + 1}`}
            className={cn(
              "absolute top-0 z-[2] h-full cursor-pointer rounded-[6px] border",
              selectedSegment === index
                ? "border-accent bg-accent/[11%]"
                : "border-bright-top/10 bg-transparent"
            )}
            key={`${segment.start}-${segment.end}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelectSegment(index);
              onSetTime(Math.max(segment.start, Math.min(segment.end, time)));
            }}
            style={{
              left: percent(segment.start, duration),
              width: percent(segment.end - segment.start, duration),
            }}
            type="button"
          />
        ))}
        <div
          className="bg-fg pointer-events-none absolute inset-y-0 z-[3] w-0.5"
          style={{ left: percent(time, duration) }}
        >
          <div className="bg-fg absolute -left-[5px] top-0 h-2 w-3 rounded-sm" />
        </div>
      </div>
    </footer>
  );
}
