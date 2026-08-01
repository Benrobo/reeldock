import { FolderExportIcon } from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Banner,
  Button,
  Modal,
  ProgressBar,
  SettingsList,
  SettingsRow,
  SurfaceRow,
  ValueChip,
  cn,
} from "@reeldock/ui";
import { RATIO_RESOLUTIONS, type CanvasRatio } from "@reeldock/shared";
import { ColorIcon } from "@/components/color-icon";
import { EXPORT_QUALITY_LABEL } from "@/constants/recording";
import { timecode } from "@/lib/format";
import type { ExportState } from "../hooks/use-editor-export";

type EditorExportModalProps = {
  duration: number;
  error: string | null;
  nativeExportAvailable: boolean;
  open: boolean;
  outputPath: string | null;
  progress: number;
  readyTrackCount: number;
  ratio: Exclude<CanvasRatio, "custom">;
  state: ExportState;
  onDismiss: () => void;
  onRatioChange: (ratio: Exclude<CanvasRatio, "custom">) => void;
  onReveal: () => void;
  onStart: () => void;
};

export function EditorExportModal({
  duration,
  error,
  nativeExportAvailable,
  open,
  outputPath,
  progress,
  readyTrackCount,
  ratio,
  state,
  onDismiss,
  onRatioChange,
  onReveal,
  onStart,
}: EditorExportModalProps) {
  return (
    <Modal
      actions={
        state === "idle" ? (
          <>
            <Button
              disabled={!nativeExportAvailable}
              leading={<ColorIcon icon={FolderExportIcon} size={16} tone="export" />}
              onClick={onStart}
              variant="bright"
            >
              Export video
            </Button>
            <Button onClick={onDismiss}>Cancel</Button>
            <div className="text-fg-hint ml-auto text-xs">Estimated 38 MB</div>
          </>
        ) : state === "running" ? (
          <Button onClick={onDismiss}>Cancel</Button>
        ) : state === "done" ? (
          <>
            <Button disabled={!outputPath} onClick={onReveal} variant="bright">
              Reveal in Finder
            </Button>
            <Button onClick={onDismiss}>Done</Button>
          </>
        ) : (
          <Button onClick={onDismiss}>Done</Button>
        )
      }
      onDismiss={onDismiss}
      open={open}
      subtitle="H.264 MP4, rendered on this Mac."
      title="Export"
    >
      {state === "idle" ? (
        <ExportIdle readyTrackCount={readyTrackCount} ratio={ratio} onRatioChange={onRatioChange} />
      ) : null}

      {state === "running" ? <ExportRunning progress={progress} /> : null}

      {state === "done" ? <ExportDone duration={duration} outputPath={outputPath} ratio={ratio} /> : null}

      {state === "failed" ? <ExportFailed error={error} /> : null}
    </Modal>
  );
}

function ExportIdle({
  readyTrackCount,
  ratio,
  onRatioChange,
}: {
  readyTrackCount: number;
  ratio: Exclude<CanvasRatio, "custom">;
  onRatioChange: (ratio: Exclude<CanvasRatio, "custom">) => void;
}) {
  return (
    <div className="px-7 pt-[22px]">
      <div className="text-fg-hint mb-3 text-[11px] font-semibold uppercase tracking-[0.11em]">
        Aspect ratio
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["16:9", "9:16", "1:1"] as const).map((item) => (
          <button
            className={cn(
              "rd-press border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row rounded-[10px] border p-3",
              ratio === item && "border-accent bg-accent/[12%]"
            )}
            key={item}
            onClick={() => onRatioChange(item)}
            type="button"
          >
            <span className="bg-well shadow-well mx-auto flex h-[132px] items-center justify-center rounded-[8px]">
              <span
                className="bg-screen relative block rounded"
                style={{
                  width: item === "9:16" ? 54 : item === "1:1" ? 92 : 128,
                  height: item === "9:16" ? 120 : item === "1:1" ? 92 : 72,
                }}
              >
                <span className="bg-window absolute left-[38%] top-[10%] h-[80%] w-[24%] rounded-[7px]" />
                <span className="bg-camera-mini absolute bottom-[18%] right-[14%] size-[24%] rounded-full" />
              </span>
            </span>
            <span className="mt-2.5 block text-[12.5px] font-semibold">{item}</span>
            <span className="font-ui-mono text-fg-3 mt-[3px] block text-[11px]">
              {RATIO_RESOLUTIONS[item]}
            </span>
          </button>
        ))}
      </div>
      <SettingsList className="mt-[22px]">
        <SettingsRow label="Tracks">
          <ValueChip>{readyTrackCount} ready</ValueChip>
        </SettingsRow>
        <SettingsRow label="Quality">
          <ValueChip>{EXPORT_QUALITY_LABEL}</ValueChip>
        </SettingsRow>
        <SettingsRow label="Frame rate">
          <ValueChip>30 fps</ValueChip>
        </SettingsRow>
        <SettingsRow label="Destination">
          <ValueChip>Project exports</ValueChip>
        </SettingsRow>
      </SettingsList>
      <Banner className="mt-4" tone={readyTrackCount > 0 ? "ok" : "warn"}>
        Export uses the saved project settings for layout, background, trims, and audio levels.
      </Banner>
    </div>
  );
}

function ExportRunning({ progress }: { progress: number }) {
  return (
    <div className="px-7 pt-[30px]">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-fg-control flex items-center gap-2 text-sm">
          <ActivitySpinner size={16} />
          Rendering composition
        </span>
        <span className="font-ui-mono text-sm">{progress}%</span>
      </div>
      <ProgressBar value={progress} />
      <div className="text-fg-3 mt-3 text-[12.5px]">
        {progress < 35
          ? "Reading phone and camera tracks"
          : progress < 75
            ? "Compositing sources and background"
            : "Mixing audio and writing MP4"}
      </div>
    </div>
  );
}

function ExportDone({
  duration,
  outputPath,
  ratio,
}: {
  duration: number;
  outputPath: string | null;
  ratio: Exclude<CanvasRatio, "custom">;
}) {
  return (
    <div className="px-7 pt-[30px]">
      <SurfaceRow tone="ok">
        <div>
          <div className="text-[15px] font-semibold">Export complete</div>
          <div className="font-ui-mono text-fg-2 mt-2 text-[12.5px]">
            {outputPath ?? "Project exports"}
          </div>
          <div className="text-fg-hint mt-1.5 text-[12.5px]">
            {RATIO_RESOLUTIONS[ratio]} - {timecode(duration)}
          </div>
        </div>
      </SurfaceRow>
    </div>
  );
}

function ExportFailed({ error }: { error: string | null }) {
  return (
    <div className="px-7 pt-[30px]">
      <SurfaceRow tone="rec">
        <div>
          <div className="text-[15px] font-semibold">Export not available</div>
          <div className="text-fg-2 mt-2 text-[13px] leading-[1.55]">
            {error ?? "Export could not start. Your recordings are untouched."}
          </div>
        </div>
      </SurfaceRow>
    </div>
  );
}
