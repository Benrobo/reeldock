import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "@reeldock/ui";
import { DEFAULT_PHONE_ASPECT } from "@/constants/preview";
import { backgroundCss, stageGeometry, useProject } from "@/modules/project";
import { CameraBubble } from "./camera-bubble";
import { DeviceFrame, deviceFrameMetrics } from "./device-frame";
import { useNativePreview } from "../hooks/use-native-preview";

type CanvasStageProps = {
  size: { w: number; h: number };
  phoneSource?: RecordedMediaSource;
  webcamSource?: RecordedMediaSource;
  microphoneSource?: RecordedMediaSource;
  phoneUniqueId?: string;
  webcamUniqueId?: string;
  phoneAspect?: number;
  className?: string;
  time?: number;
  playing?: boolean;
  seekVersion?: number;
  onPlaybackEnded?: () => void;
  onPlaybackTimeChange?: (time: number) => void;
  onSelectElement?: (element: "phone" | "camera") => void;
};

type RecordedMediaSource = {
  filePath: string | null;
  startOffsetMs: number;
  durationMs: number;
};

type MediaSlot = {
  key: MediaSlotKey;
  element: HTMLMediaElement | null;
  source?: RecordedMediaSource;
  assetUrl: string | null;
};

type ActiveMediaSlot = MediaSlot & {
  element: HTMLMediaElement;
  source: RecordedMediaSource;
  assetUrl: string;
};

type MediaSlotKey = "microphone" | "phone" | "webcam";

const PLAYHEAD_PUBLISH_INTERVAL_MS = 100;

export function CanvasStage({
  size,
  phoneSource,
  webcamSource,
  microphoneSource,
  phoneUniqueId,
  webcamUniqueId,
  phoneAspect = DEFAULT_PHONE_ASPECT,
  className,
  time = 0,
  playing = false,
  seekVersion = 0,
  onPlaybackEnded,
  onPlaybackTimeChange,
  onSelectElement,
}: CanvasStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const phoneNodeRef = useRef<HTMLDivElement>(null);
  const cameraNodeRef = useRef<HTMLDivElement>(null);
  const phoneVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const microphoneAudioRef = useRef<HTMLAudioElement>(null);
  const timeRef = useRef(time);
  const playbackEndedRef = useRef(onPlaybackEnded);
  const playbackTimeChangeRef = useRef(onPlaybackTimeChange);
  const lastTickRef = useRef<number | null>(null);
  const { activeProject, doc, update } = useProject();
  const geometry = stageGeometry(doc, size, phoneAspect);
  const phonePlaybackSource = playbackSource(phoneSource);
  const webcamPlaybackSource = playbackSource(webcamSource);
  const microphonePlaybackSource = playbackSource(microphoneSource);
  const phoneMetrics = deviceFrameMetrics(
    geometry.phoneWidth,
    geometry.phoneHeight,
    doc.frame,
    doc.radius
  );
  const phoneAssetUrl = useAssetUrl(phonePlaybackSource?.filePath);
  const webcamAssetUrl = useAssetUrl(webcamPlaybackSource?.filePath);
  const microphoneAssetUrl = useAssetUrl(microphonePlaybackSource?.filePath);
  const phoneVolume = volumePercentToGain(doc.phoneVol ?? 100);
  const webcamVolume = volumePercentToGain(doc.webcamVol ?? 100);
  const microphoneVolume = volumePercentToGain(doc.mic);
  // New webcam+mic recordings store the selected mic inside webcam.mov.
  // In that case the webcam video owns the voice playback; a second audio element would duplicate
  // the same recording and can drift against the speaker's mouth.
  const visibleWebcamCarriesMicrophoneAudio =
    geometry.hasCam &&
    Boolean(webcamAssetUrl && microphoneAssetUrl) &&
    webcamAssetUrl === microphoneAssetUrl;
  const visibleWebcamVolume = visibleWebcamCarriesMicrophoneAudio
    ? webcamVolume * microphoneVolume
    : webcamVolume;
  const visibleWebcamMuted =
    visibleWebcamVolume <= 0 || (visibleWebcamCarriesMicrophoneAudio && doc.muted);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    playbackEndedRef.current = onPlaybackEnded;
    playbackTimeChangeRef.current = onPlaybackTimeChange;
  }, [onPlaybackEnded, onPlaybackTimeChange]);

  const mediaSlots = (): Record<MediaSlotKey, MediaSlot> => ({
    microphone: {
      key: "microphone",
      element: microphoneAudioRef.current,
      source: microphonePlaybackSource,
      assetUrl: visibleWebcamCarriesMicrophoneAudio ? null : microphoneAssetUrl,
    },
    phone: {
      key: "phone",
      element: phoneVideoRef.current,
      source: phonePlaybackSource,
      assetUrl: phoneAssetUrl,
    },
    webcam: {
      key: "webcam",
      element: webcamVideoRef.current,
      source: webcamPlaybackSource,
      assetUrl: webcamAssetUrl,
    },
  });

  const activeSlots = (): ActiveMediaSlot[] => Object.values(mediaSlots()).filter(isActiveSlot);

  const syncSlotsToCurrentTime = (shouldPlay = playing) => {
    for (const slot of activeSlots()) {
      syncSlotToTimeline(slot, timeRef.current, shouldPlay);
    }
  };

  const updatePhonePosition = (_event: DraggableEvent, data: DraggableData) => {
    update({ phoneX: data.x / geometry.cw, phoneY: data.y / geometry.ch });
  };

  const updateCameraPosition = (_event: DraggableEvent, data: DraggableData) => {
    update({ camX: data.x / geometry.cw, camY: data.y / geometry.ch });
  };

  const phoneRef = useNativePreview<HTMLDivElement>({
    surface: "phone",
    uniqueId: phoneUniqueId,
    enabled: Boolean(phoneUniqueId) && !phoneAssetUrl,
    radius: phoneMetrics.outerRadius,
    hostRef,
  });

  const webcamRef = useNativePreview<HTMLDivElement>({
    surface: "webcam",
    uniqueId: webcamUniqueId,
    enabled: geometry.hasCam && Boolean(webcamUniqueId) && !webcamAssetUrl,
    radius: geometry.camRadius,
    mirror: doc.mirror,
    hostRef,
  });

  useEffect(() => {
    syncSlotsToCurrentTime(playing);
  }, [
    doc.dur,
    microphoneAssetUrl,
    microphonePlaybackSource?.durationMs,
    microphonePlaybackSource?.startOffsetMs,
    phoneAssetUrl,
    phonePlaybackSource?.durationMs,
    phonePlaybackSource?.startOffsetMs,
    playing,
    seekVersion,
    webcamAssetUrl,
    webcamPlaybackSource?.durationMs,
    webcamPlaybackSource?.startOffsetMs,
  ]);

  useEffect(() => {
    if (!playing) {
      for (const slot of activeSlots()) {
        slot.element.pause();
        slot.element.playbackRate = 1;
      }
      lastTickRef.current = null;
      return;
    }

    if (activeSlots().length === 0) {
      playbackEndedRef.current?.();
      return;
    }

    syncSlotsToCurrentTime(true);
    lastTickRef.current = performance.now();
    let timer = 0;

    const tick = () => {
      const now = performance.now();
      const slots = activeSlots();
      const master = masterSlotForTimeline(slots, timeRef.current);
      const elapsed = ((lastTickRef.current ? now - lastTickRef.current : 0) || 0) / 1000;
      const next = Math.min(doc.dur, master ? timelineTime(master) : timeRef.current + elapsed);
      lastTickRef.current = now;
      timeRef.current = next;
      playbackTimeChangeRef.current?.(next);
      updatePlaybackStates(slots, next);

      if (next >= doc.dur) {
        window.clearInterval(timer);
        for (const slot of slots) {
          slot.element.pause();
          slot.element.playbackRate = 1;
        }
        playbackEndedRef.current?.();
        return;
      }
    };

    timer = window.setInterval(tick, PLAYHEAD_PUBLISH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [
    doc.dur,
    microphonePlaybackSource?.durationMs,
    microphonePlaybackSource?.startOffsetMs,
    microphoneAssetUrl,
    phoneAssetUrl,
    phonePlaybackSource?.durationMs,
    phonePlaybackSource?.startOffsetMs,
    playing,
    webcamAssetUrl,
    webcamPlaybackSource?.durationMs,
    webcamPlaybackSource?.startOffsetMs,
  ]);

  return (
    <div
      className={cn("shadow-stage relative shrink-0 overflow-hidden rounded-[10px]", className)}
      ref={hostRef}
      style={{ width: geometry.cw, height: geometry.ch, background: backgroundCss(doc) }}
    >
      <Draggable
        defaultPosition={{ x: geometry.phoneLeft, y: geometry.phoneTop }}
        key={`phone-${activeProject?.id ?? "default"}-${geometry.cw}-${geometry.ch}`}
        nodeRef={phoneNodeRef}
        onStop={updatePhonePosition}
      >
        <div
          className="ease-glide absolute cursor-grab transition-[width,height] duration-300 active:cursor-grabbing"
          onPointerDown={() => onSelectElement?.("phone")}
          ref={phoneNodeRef}
          style={{
            width: geometry.phoneWidth,
            height: geometry.phoneHeight,
          }}
        >
          {phoneAssetUrl ? (
            <DeviceFrame
              bezel={doc.frame}
              height={geometry.phoneHeight}
              radius={doc.radius}
              width={geometry.phoneWidth}
            >
              <RecordedVideo
                className="h-full w-full"
                mediaRef={phoneVideoRef}
                muted={phoneVolume <= 0}
                src={phoneAssetUrl}
                startOffsetMs={phonePlaybackSource?.startOffsetMs}
                style={{ transform: `scale(${doc.zoom / 100})` }}
                time={time}
                volume={phoneVolume}
                onMetadata={() => syncSlotsToCurrentTime(playing)}
              />
            </DeviceFrame>
          ) : phoneUniqueId ? (
            <div className="h-full w-full" ref={phoneRef} />
          ) : (
            <DeviceFrame
              bezel={doc.frame}
              height={geometry.phoneHeight}
              radius={doc.radius}
              width={geometry.phoneWidth}
            />
          )}
        </div>
      </Draggable>

      {geometry.hasCam ? (
        <Draggable
          defaultPosition={{ x: geometry.camLeft, y: geometry.camTop }}
          key={`camera-${activeProject?.id ?? "default"}-${geometry.cw}-${geometry.ch}`}
          nodeRef={cameraNodeRef}
          onStop={updateCameraPosition}
        >
          <div
            className="ease-glide absolute cursor-grab transition-[width,height] duration-300 active:cursor-grabbing"
            onPointerDown={() => onSelectElement?.("camera")}
            ref={cameraNodeRef}
            style={{
              width: geometry.camWidth,
              height: geometry.camHeight,
            }}
          >
            <div className="h-full w-full" ref={webcamRef}>
              <CameraBubble
                crop={doc.crop}
                live={Boolean(webcamAssetUrl || webcamUniqueId)}
                mirrored={doc.mirror}
                radius={geometry.camRadius}
              >
                {webcamAssetUrl ? (
                  <RecordedVideo
                    className="h-full w-full"
                    mediaRef={webcamVideoRef}
                    muted={visibleWebcamMuted}
                    src={webcamAssetUrl}
                    startOffsetMs={webcamPlaybackSource?.startOffsetMs}
                    style={{ objectPosition: `${doc.crop}% 50%` }}
                    time={time}
                    volume={visibleWebcamVolume}
                    onMetadata={() => syncSlotsToCurrentTime(playing)}
                  />
                ) : null}
              </CameraBubble>
            </div>
          </div>
        </Draggable>
      ) : null}

      {microphoneAssetUrl && !visibleWebcamCarriesMicrophoneAudio ? (
        <RecordedAudio
          mediaRef={microphoneAudioRef}
          muted={doc.muted}
          src={microphoneAssetUrl}
          startOffsetMs={microphonePlaybackSource?.startOffsetMs}
          time={time}
          volume={microphoneVolume}
          onMetadata={() => syncSlotsToCurrentTime(playing)}
        />
      ) : null}
    </div>
  );
}

function useAssetUrl(filePath?: string | null) {
  return useMemo(() => {
    if (!filePath) return null;
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      return convertFileSrc(filePath);
    }
    return filePath;
  }, [filePath]);
}

function isActiveSlot(slot: MediaSlot): slot is ActiveMediaSlot {
  return Boolean(slot.assetUrl && slot.element && slot.source?.filePath);
}

function volumePercentToGain(value: number) {
  const normalized = Math.max(0, Math.min(100, value)) / 100;
  return normalized * normalized;
}

function playbackSource(source?: RecordedMediaSource): RecordedMediaSource | undefined {
  if (!source) return undefined;
  if (source.startOffsetMs === 0) return source;
  return { ...source, startOffsetMs: 0 };
}

function sourceStartSeconds(source: RecordedMediaSource) {
  return source.startOffsetMs / 1000;
}

function sourceMediaTime(time: number, startOffsetMs = 0) {
  return Math.max(0, time - startOffsetMs / 1000);
}

function elementDuration(element: HTMLMediaElement) {
  return Number.isFinite(element.duration) && element.duration > 0 ? element.duration : null;
}

function slotStartSeconds(slot: ActiveMediaSlot) {
  return sourceStartSeconds(slot.source);
}

function slotEndSeconds(slot: ActiveMediaSlot) {
  const duration = elementDuration(slot.element) ?? slot.source.durationMs / 1000;
  if (duration <= 0) return Number.POSITIVE_INFINITY;
  return slotStartSeconds(slot) + duration;
}

function slotMediaTime(slot: ActiveMediaSlot, time: number) {
  return Math.max(0, time - slotStartSeconds(slot));
}

function timelineState(slot: ActiveMediaSlot, time: number) {
  if (time < slotStartSeconds(slot)) return "before";
  if (time > slotEndSeconds(slot)) return "after";
  return "active";
}

function seekSlot(slot: ActiveMediaSlot, time: number) {
  const next = slotMediaTime(slot, time);
  try {
    slot.element.currentTime = Number.isFinite(slot.element.duration)
      ? Math.min(next, slot.element.duration)
      : next;
  } catch {
    return;
  }
}

function timelineTime(slot: ActiveMediaSlot) {
  return slot.element.currentTime + slotStartSeconds(slot);
}

function seekMediaElement(element: HTMLMediaElement, time: number) {
  try {
    element.currentTime = Number.isFinite(element.duration)
      ? Math.min(time, element.duration)
      : time;
  } catch {
    return;
  }
}

function syncSlotToTimeline(slot: ActiveMediaSlot, time: number, playing: boolean) {
  const state = timelineState(slot, time);

  if (state === "before") {
    slot.element.pause();
    slot.element.playbackRate = 1;
    if (slot.element.currentTime > 0.03) seekMediaElement(slot.element, 0);
    return;
  }

  if (state === "after") {
    slot.element.pause();
    slot.element.playbackRate = 1;
    seekMediaElement(slot.element, elementDuration(slot.element) ?? slot.source.durationMs / 1000);
    return;
  }

  seekSlot(slot, time);
  slot.element.playbackRate = 1;

  if (playing) {
    void slot.element.play().catch(() => undefined);
  } else {
    slot.element.pause();
  }
}

function masterSlotForTimeline(slots: ActiveMediaSlot[], time: number) {
  const active = slots.filter(
    (slot) => timelineState(slot, time) === "active" && !slot.element.paused && !slot.element.ended
  );
  return (
    active.find((slot) => slot.key === "microphone") ??
    active.find((slot) => slot.key === "webcam") ??
    active.find((slot) => slot.key === "phone") ??
    null
  );
}

function updatePlaybackStates(slots: ActiveMediaSlot[], timeline: number) {
  for (const slot of slots) {
    const state = timelineState(slot, timeline);

    if (state !== "active") {
      syncSlotToTimeline(slot, timeline, false);
      continue;
    }

    if (slot.element.paused) {
      seekSlot(slot, timeline);
      slot.element.playbackRate = 1;
      void slot.element.play().catch(() => undefined);
    }
  }
}

function RecordedVideo({
  src,
  time,
  startOffsetMs = 0,
  mediaRef,
  muted,
  className,
  style,
  volume = 1,
  onMetadata,
}: {
  src: string;
  time: number;
  startOffsetMs?: number;
  mediaRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  className?: string;
  style?: CSSProperties;
  volume?: number;
  onMetadata?: () => void;
}) {
  const current = sourceMediaTime(time, startOffsetMs);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, volume));
  }, [mediaRef, volume]);

  return (
    <video
      className={cn("block object-cover", className)}
      draggable={false}
      muted={muted}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        video.currentTime = Math.min(current, video.duration || current);
        onMetadata?.();
      }}
      playsInline
      preload="auto"
      ref={mediaRef}
      src={src}
      style={style}
    />
  );
}

function RecordedAudio({
  src,
  time,
  startOffsetMs = 0,
  mediaRef,
  muted,
  volume,
  onMetadata,
}: {
  src: string;
  time: number;
  startOffsetMs?: number;
  mediaRef: React.RefObject<HTMLAudioElement | null>;
  muted: boolean;
  volume: number;
  onMetadata?: () => void;
}) {
  const current = sourceMediaTime(time, startOffsetMs);

  useEffect(() => {
    const audio = mediaRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [mediaRef, volume]);

  return (
    <audio
      muted={muted}
      onLoadedMetadata={(event) => {
        const audio = event.currentTarget;
        audio.currentTime = Math.min(current, audio.duration || current);
        onMetadata?.();
      }}
      preload="auto"
      ref={mediaRef}
      src={src}
    />
  );
}
