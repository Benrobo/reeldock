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
  ratio: CanvasRatio;
  state: ExportState;
  width?: number;
  height?: number;
  onDismiss: () => void;
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
  width,
  height,
  onDismiss,
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
        <ExportIdle readyTrackCount={readyTrackCount} ratio={ratio} width={width} height={height} />
      ) : null}

      {state === "running" ? <ExportRunning progress={progress} /> : null}

      {state === "done" ? (
        <ExportDone
          duration={duration}
          height={height}
          outputPath={outputPath}
          ratio={ratio}
          width={width}
        />
      ) : null}

      {state === "failed" ? <ExportFailed error={error} /> : null}
    </Modal>
  );
}

function ExportIdle({
  readyTrackCount,
  ratio,
  width,
  height,
}: {
  readyTrackCount: number;
  ratio: CanvasRatio;
  width?: number;
  height?: number;
}) {
  const resolution = canvasResolution(ratio, width, height);

  return (
    <div className="px-7 pt-[22px]">
      <SettingsList>
        <SettingsRow label="Canvas">
          <ValueChip>{ratio === "custom" ? "Custom" : ratio}</ValueChip>
        </SettingsRow>
        <SettingsRow label="Resolution">
          <ValueChip>{resolution}</ValueChip>
        </SettingsRow>
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
  height,
  outputPath,
  ratio,
  width,
}: {
  duration: number;
  height?: number;
  outputPath: string | null;
  ratio: CanvasRatio;
  width?: number;
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
            {canvasResolution(ratio, width, height)} - {timecode(duration)}
          </div>
        </div>
      </SurfaceRow>
    </div>
  );
}

function canvasResolution(ratio: CanvasRatio, width?: number, height?: number) {
  if (ratio === "custom") return `${width ?? 1600} × ${height ?? 1200}`;
  return RATIO_RESOLUTIONS[ratio] ?? ratio;
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
