import type { ReactNode } from "react";
import {
  CameraVideoIcon,
  Mic01Icon,
  SmartPhone01Icon,
  VolumeHighIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import { cn, GroupLabel, Meter, PopupSelect, Switch } from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import type { ColorIconTone } from "@/components/color-icon";
import type { CaptureSource } from "@/modules/capture";

const sourceIcons = {
  phone: SmartPhone01Icon,
  webcam: CameraVideoIcon,
  microphone: Mic01Icon,
} as const;

const sourceTones = {
  phone: "phone",
  webcam: "camera",
  microphone: "microphone",
} as const satisfies Record<keyof typeof sourceIcons, ColorIconTone>;

const sourceKindLabels = {
  phone: "phone",
  webcam: "webcam",
  microphone: "microphone",
} as const satisfies Record<CaptureSource["kind"], string>;

const phoneAudioCaptureAvailable = false;

type OptionalSourceKind = Extract<CaptureSource["kind"], "webcam" | "microphone">;

function sourceMeta(source: CaptureSource) {
  if (source.state === "permission-required") return "permission needed";
  if (source.state === "unavailable") return "unavailable";
  if (source.kind === "phone") return "USB";
  if (source.kind === "webcam" && source.width && source.height) {
    return `${source.width} x ${source.height}`;
  }
  return sourceKindLabels[source.kind];
}

type SetupSourceControlsProps = {
  phoneSources: CaptureSource[];
  webcamSources: CaptureSource[];
  microphoneSources: CaptureSource[];
  phoneSourceId?: string;
  webcamSourceId?: string;
  microphoneSourceId?: string;
  microphoneMeterActive?: boolean;
  microphoneMeterLevel?: number;
  hasPhone: boolean;
  webcamRecordingEnabled: boolean;
  microphoneRecordingEnabled: boolean;
  disabled?: boolean;
  onSelectSource: (source: CaptureSource) => void;
  onWebcamRecordingEnabledChange: (enabled: boolean) => void;
  onMicrophoneRecordingEnabledChange: (enabled: boolean) => void;
};

export function SetupSourceControls({
  phoneSources,
  webcamSources,
  microphoneSources,
  phoneSourceId,
  webcamSourceId,
  microphoneSourceId,
  microphoneMeterActive = false,
  microphoneMeterLevel = 0,
  hasPhone,
  webcamRecordingEnabled,
  microphoneRecordingEnabled,
  disabled = false,
  onSelectSource,
  onWebcamRecordingEnabledChange,
  onMicrophoneRecordingEnabledChange,
}: SetupSourceControlsProps) {
  const phoneSource = phoneSources.find((source) => source.id === phoneSourceId) ?? phoneSources[0];
  const webcamSource =
    webcamSources.find((source) => source.id === webcamSourceId) ?? webcamSources[0];
  const microphoneSource =
    microphoneSources.find((source) => source.id === microphoneSourceId) ?? microphoneSources[0];
  const phoneAudioDetected = Boolean(phoneSource?.hasAudio);

  return (
    <section>
      <GroupLabel className="mb-2.5">Sources</GroupLabel>
      <div className="border-surface-line bg-surface shadow-panel rounded-[12px] border">
        <PhoneSourceRow hasPhone={hasPhone} source={phoneSource} />
        <SelectableSourceRow
          enabled={webcamRecordingEnabled}
          emptyLabel="No camera found"
          kind="webcam"
          label="Camera"
          locked={disabled}
          onEnabledChange={onWebcamRecordingEnabledChange}
          onSelectSource={onSelectSource}
          selectedSource={webcamSource}
          sources={webcamSources}
        />
        <SelectableSourceRow
          enabled={microphoneRecordingEnabled}
          emptyLabel="No microphone found"
          kind="microphone"
          label="Mic"
          locked={disabled}
          meterActive={microphoneMeterActive}
          meterLevel={microphoneMeterLevel}
          onEnabledChange={onMicrophoneRecordingEnabledChange}
          onSelectSource={onSelectSource}
          selectedSource={microphoneSource}
          sources={microphoneSources}
        />
        <PhoneAudioSourceRow hasPhone={hasPhone} phoneAudioDetected={phoneAudioDetected} />
      </div>
    </section>
  );
}

type SourceRoleRowProps = {
  kind: CaptureSource["kind"] | "sound";
  label: string;
  active: boolean;
  children: ReactNode;
  action: ReactNode;
};

function SourceRoleRow({ kind, label, active, children, action }: SourceRoleRowProps) {
  const icon = kind === "sound" ? VolumeHighIcon : sourceIcons[kind];
  const tone = kind === "sound" ? "phone" : sourceTones[kind];

  return (
    <div className="border-divider relative flex items-center gap-2.5 border-b px-3 py-[11px] last:border-b-0">
      <div
        className={cn(
          "flex w-[84px] shrink-0 items-center gap-2",
          active ? "text-fg" : "text-fg-faint"
        )}
      >
        <ColorIcon icon={icon} size={14} tone={tone} />
        <span className="truncate text-[12.5px] font-semibold">{label}</span>
      </div>
      {children}
      {action}
    </div>
  );
}

type PhoneSourceRowProps = {
  hasPhone: boolean;
  source?: CaptureSource;
};

function PhoneSourceRow({ hasPhone, source }: PhoneSourceRowProps) {
  return (
    <SourceRoleRow
      action={
        <span className="font-ui-mono text-fg-key w-11 shrink-0 text-center text-[10.5px]">
          {hasPhone ? "always" : "needed"}
        </span>
      }
      active={hasPhone}
      kind="phone"
      label="Phone"
    >
      <div className="border-well-line bg-well shadow-well flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg border px-3">
        <StatusDot available={hasPhone} />
        <span className="text-fg min-w-0 flex-1 truncate text-[12.5px] font-semibold">
          {source?.label ?? "No iPhone connected"}
        </span>
        <span className="font-ui-mono text-fg-3 shrink-0 text-[10.5px]">
          {source ? sourceMeta(source) : "USB"}
        </span>
      </div>
    </SourceRoleRow>
  );
}

type SelectableSourceRowProps = {
  kind: OptionalSourceKind;
  label: string;
  sources: CaptureSource[];
  selectedSource?: CaptureSource;
  meterActive?: boolean;
  meterLevel?: number;
  enabled: boolean;
  locked: boolean;
  emptyLabel: string;
  onEnabledChange: (enabled: boolean) => void;
  onSelectSource: (source: CaptureSource) => void;
};

function SelectableSourceRow({
  kind,
  label,
  sources,
  selectedSource,
  meterActive = false,
  meterLevel = 0,
  enabled,
  locked,
  emptyLabel,
  onEnabledChange,
  onSelectSource,
}: SelectableSourceRowProps) {
  const hasSources = sources.length > 0;

  return (
    <SourceRoleRow
      action={
        <Switch
          checked={hasSources && enabled}
          disabled={!hasSources || locked}
          label={label}
          onChange={onEnabledChange}
        />
      }
      active={hasSources && enabled}
      kind={kind}
      label={label}
    >
      <PopupSelect
        ariaLabel={`${label} source`}
        className="min-w-0 flex-1"
        disabled={!hasSources || locked}
        onChange={(sourceId) => {
          const source = sources.find((item) => item.id === sourceId);
          if (source) onSelectSource(source);
        }}
        options={sources.map((source) => ({
          value: source.id,
          label: source.label,
          meta: sourceMeta(source),
          trailing:
            source.kind === "microphone" && source.id === selectedSource?.id ? (
              <MiniMeter active={meterActive && enabled} value={meterLevel} />
            ) : null,
          disabled: source.state !== "available",
        }))}
        placeholder={emptyLabel}
        value={selectedSource?.id}
      />
    </SourceRoleRow>
  );
}

type PhoneAudioSourceRowProps = {
  hasPhone: boolean;
  phoneAudioDetected: boolean;
};

function PhoneAudioSourceRow({ hasPhone, phoneAudioDetected }: PhoneAudioSourceRowProps) {
  const status = !hasPhone
    ? "Connect phone first"
    : phoneAudioDetected
      ? "Detected, recorder not wired yet"
      : "No phone audio stream detected";

  return (
    <SourceRoleRow
      action={
        <Switch
          checked={false}
          disabled={!phoneAudioCaptureAvailable || !hasPhone}
          label="Phone sound"
        />
      }
      active={phoneAudioDetected}
      kind="sound"
      label="Sound"
    >
      <div className="border-disabled-line bg-track text-fg-faint flex h-[34px] min-w-0 flex-1 items-center rounded-lg border px-3 text-[12.5px]">
        <span className="truncate">{status}</span>
      </div>
    </SourceRoleRow>
  );
}

function StatusDot({ available }: { available: boolean }) {
  return (
    <span className={cn("block size-1.5 shrink-0 rounded-full", available ? "bg-ok" : "bg-warn")} />
  );
}

function MiniMeter({ active, value }: { active: boolean; value: number }) {
  return (
    <Meter active={active} className="w-8 shrink-0" value={active ? value : 0} />
  );
}
