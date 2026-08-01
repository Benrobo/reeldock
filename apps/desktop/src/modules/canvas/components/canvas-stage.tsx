import {
  CAMERA_SCALE_REFERENCE,
  CAMERA_SIZE_MAX,
  CAMERA_SIZE_MIN,
  PHONE_SCALE_DEFAULT,
  PHONE_SCALE_MAX,
  PHONE_SCALE_MIN,
} from "@reeldock/shared";
import { cn } from "@reeldock/ui";
import { convertFileSrc } from "@tauri-apps/api/core";
import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import { DEFAULT_PHONE_ASPECT } from "@/constants/preview";
import {
  backgroundCss,
  compose,
  normalizeSourceOrder,
  stageGeometry,
  useProject,
  type SourceLayer,
} from "@/modules/project";
import { useNativePreview } from "../hooks/use-native-preview";
import { CameraBubble } from "./camera-bubble";
import { DeviceFrame, deviceFrameMetrics } from "./device-frame";

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
type CanvasElement = "phone" | "camera";
type CanvasPoint = { x: number; y: number };

type ResizeFrame = CanvasPoint & {
  baseWidth: number;
  baseHeight: number;
  width: number;
  height: number;
  radius: number;
  minScale: number;
  maxScale: number;
  scaleBase: number;
};

type ResizeSession = {
  element: CanvasElement;
  centerX: number;
  centerY: number;
  startDistance: number;
  startScaleX: number;
  startScaleY: number;
  frame: ResizeFrame;
  pointerId: number;
};

const PLAYHEAD_PUBLISH_INTERVAL_MS = 100;
const RESIZE_HANDLE_SIZE = 18;
const LAST_VISIBLE_FRAME_OFFSET = 1 / 30;

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
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [draftPositions, setDraftPositions] = useState<Partial<Record<CanvasElement, CanvasPoint>>>(
    {}
  );
  const { doc, update } = useProject();
  const geometry = stageGeometry(doc, size, phoneAspect);
  const basePlacement = compose(doc, phoneAspect);
  const sourceOrder = normalizeSourceOrder(doc.sourceOrder);
  const phoneBaseHeight = Math.round(basePlacement.phone.h * geometry.ch);
  const phoneBaseWidth = Math.round(phoneBaseHeight * phoneAspect);
  const cameraBaseWidth = basePlacement.cam ? Math.round(basePlacement.cam.w * geometry.cw) : 0;
  const cameraBaseHeight = basePlacement.cam ? Math.round(basePlacement.cam.h * geometry.ch) : 0;
  const phonePlaybackSource = playbackSource(phoneSource);
  const webcamPlaybackSource = playbackSource(webcamSource);
  const microphonePlaybackSource = playbackSource(microphoneSource);
  const phoneMetrics = deviceFrameMetrics(
    geometry.phoneWidth,
    geometry.phoneHeight,
    doc.frame,
    doc.radius
  );
  const phoneFrame: ResizeFrame = {
    x: geometry.phoneLeft,
    y: geometry.phoneTop,
    baseWidth: phoneBaseWidth,
    baseHeight: phoneBaseHeight,
    width: geometry.phoneWidth,
    height: geometry.phoneHeight,
    radius: phoneMetrics.outerRadius,
    minScale: PHONE_SCALE_MIN / PHONE_SCALE_DEFAULT,
    maxScale: PHONE_SCALE_MAX / PHONE_SCALE_DEFAULT,
    scaleBase: PHONE_SCALE_DEFAULT,
  };
  const cameraFrame: ResizeFrame = {
    x: geometry.camLeft,
    y: geometry.camTop,
    baseWidth: cameraBaseWidth,
    baseHeight: cameraBaseHeight,
    width: geometry.camWidth,
    height: geometry.camHeight,
    radius: geometry.camRadius,
    minScale: CAMERA_SIZE_MIN / CAMERA_SCALE_REFERENCE,
    maxScale: CAMERA_SIZE_MAX / CAMERA_SCALE_REFERENCE,
    scaleBase: CAMERA_SCALE_REFERENCE,
  };
  const phonePosition = draftPositions.phone ?? { x: phoneFrame.x, y: phoneFrame.y };
  const cameraPosition = draftPositions.camera ?? { x: cameraFrame.x, y: cameraFrame.y };
  const phoneAssetUrl = useAssetUrl(phonePlaybackSource?.filePath);
  const webcamAssetUrl = useAssetUrl(webcamPlaybackSource?.filePath);
  const microphoneAssetUrl = useAssetUrl(microphonePlaybackSource?.filePath);
  const phoneVolume = volumePercentToGain(doc.phoneVol ?? 100);
  const webcamVolume = volumePercentToGain(doc.webcamVol ?? 100);
  const microphoneVolume = volumePercentToGain(doc.mic);
  const visibleWebcamCarriesMicrophoneAudio =
    geometry.hasCam &&
    Boolean(webcamAssetUrl && microphoneAssetUrl) &&
    webcamAssetUrl === microphoneAssetUrl;
  const visibleWebcamVolume = visibleWebcamCarriesMicrophoneAudio
    ? webcamVolume * microphoneVolume
    : webcamVolume;
  const visibleWebcamMuted =
    visibleWebcamVolume <= 0 || (visibleWebcamCarriesMicrophoneAudio && doc.muted);
  const sourceZIndex = (layer: SourceLayer) => 10 + sourceOrder.indexOf(layer);

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

  const selectElement = (element: CanvasElement) => {
    setSelectedElement(element);
    onSelectElement?.(element);
  };

  const updateDragDraft =
    (element: CanvasElement) => (_event: DraggableEvent, data: DraggableData) => {
      setDraftPositions((current) => ({ ...current, [element]: { x: data.x, y: data.y } }));
    };

  const finishDrag = (element: CanvasElement) => (_event: DraggableEvent, data: DraggableData) => {
    if (element === "phone") {
      update({ phoneX: data.x / geometry.cw, phoneY: data.y / geometry.ch });
    } else {
      update({ camX: data.x / geometry.cw, camY: data.y / geometry.ch });
    }
    setDraftPositions((current) => {
      const next = { ...current };
      delete next[element];
      return next;
    });
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>, element: CanvasElement) => {
    event.preventDefault();
    event.stopPropagation();
    const frame = element === "phone" ? phoneFrame : cameraFrame;
    if (frame.baseWidth <= 0 || frame.baseHeight <= 0) return;
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const pointer = pointerOnStage(event, hostRef.current);

    resizeSessionRef.current = {
      element,
      centerX,
      centerY,
      startDistance: Math.max(1, distance(pointer.x, pointer.y, centerX, centerY)),
      startScaleX: frame.width / frame.baseWidth,
      startScaleY: frame.height / frame.baseHeight,
      frame,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    selectElement(element);
  };

  const updateResize = (event: PointerEvent<HTMLButtonElement>, quiet = true) => {
    const session = resizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    event.preventDefault();
    const pointer = pointerOnStage(event, hostRef.current);

    if (session.element === "phone") {
      const nextDistance = Math.max(
        1,
        distance(pointer.x, pointer.y, session.centerX, session.centerY)
      );
      const scale = clamp(
        session.startScaleX * (nextDistance / session.startDistance),
        session.frame.minScale,
        session.frame.maxScale
      );
      const width = session.frame.baseWidth * scale;
      const height = session.frame.baseHeight * scale;
      const x = session.centerX - width / 2;
      const y = session.centerY - height / 2;

      update(
        {
          phoneScale: Math.round(scale * session.frame.scaleBase),
          phoneX: x / geometry.cw,
          phoneY: y / geometry.ch,
        },
        quiet
      );
      return;
    }

    const scaleX = clamp(
      (Math.abs(pointer.x - session.centerX) * 2) / session.frame.baseWidth,
      session.frame.minScale,
      session.frame.maxScale
    );
    const scaleY = clamp(
      (Math.abs(pointer.y - session.centerY) * 2) / session.frame.baseHeight,
      session.frame.minScale,
      session.frame.maxScale
    );
    const width = session.frame.baseWidth * scaleX;
    const height = session.frame.baseHeight * scaleY;
    const x = session.centerX - width / 2;
    const y = session.centerY - height / 2;
    const camScaleX = Math.round(scaleX * session.frame.scaleBase);
    const camScaleY = Math.round(scaleY * session.frame.scaleBase);

    update(
      {
        camScale: Math.round((camScaleX + camScaleY) / 2),
        camScaleX,
        camScaleY,
        camX: x / geometry.cw,
        camY: y / geometry.ch,
      },
      quiet
    );
  };

  const finishResize = (event: PointerEvent<HTMLButtonElement>) => {
    const session = resizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    updateResize(event, false);
    resizeSessionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const phoneRef = useNativePreview<HTMLDivElement>({
    surface: "phone",
    uniqueId: phoneUniqueId,
    enabled: Boolean(phoneUniqueId) && !phoneAssetUrl,
    radius: phoneFrame.radius,
    hostRef,
  });

  const webcamRef = useNativePreview<HTMLDivElement>({
    surface: "webcam",
    uniqueId: webcamUniqueId,
    enabled: geometry.hasCam && Boolean(webcamUniqueId) && !webcamAssetUrl,
    radius: cameraFrame.radius,
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
          syncSlotToTimeline(slot, next, false);
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
        cancel="[data-resize-node]"
        nodeRef={phoneNodeRef}
        onDrag={updateDragDraft("phone")}
        onStart={() => selectElement("phone")}
        onStop={finishDrag("phone")}
        position={phonePosition}
      >
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          ref={phoneNodeRef}
          style={{
            width: phoneFrame.width,
            height: phoneFrame.height,
            zIndex: sourceZIndex("phone"),
          }}
        >
          {phoneAssetUrl ? (
            <DeviceFrame
              bezel={doc.frame}
              height={phoneFrame.height}
              radius={doc.radius}
              width={phoneFrame.width}
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
              height={phoneFrame.height}
              radius={doc.radius}
              width={phoneFrame.width}
            />
          )}
          <SelectionOverlay frame={phoneFrame} selected={selectedElement === "phone"} />
          {selectedElement === "phone" ? (
            <ResizeNode
              frame={phoneFrame}
              label="Resize phone"
              onPointerCancel={finishResize}
              onPointerDown={(event) => startResize(event, "phone")}
              onPointerMove={updateResize}
              onPointerUp={finishResize}
            />
          ) : null}
        </div>
      </Draggable>

      {geometry.hasCam ? (
        <Draggable
          cancel="[data-resize-node]"
          nodeRef={cameraNodeRef}
          onDrag={updateDragDraft("camera")}
          onStart={() => selectElement("camera")}
          onStop={finishDrag("camera")}
          position={cameraPosition}
        >
          <div
            className="absolute cursor-grab active:cursor-grabbing"
            ref={cameraNodeRef}
            style={{
              width: cameraFrame.width,
              height: cameraFrame.height,
              zIndex: sourceZIndex("camera"),
            }}
          >
            <div className="h-full w-full" ref={webcamRef}>
              <CameraBubble
                crop={doc.crop}
                live={Boolean(webcamAssetUrl || webcamUniqueId)}
                mirrored={doc.mirror}
                radius={cameraFrame.radius}
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
            <SelectionOverlay frame={cameraFrame} selected={selectedElement === "camera"} />
            {selectedElement === "camera" ? (
              <ResizeNode
                frame={cameraFrame}
                label="Resize camera"
                onPointerCancel={finishResize}
                onPointerDown={(event) => startResize(event, "camera")}
                onPointerMove={updateResize}
                onPointerUp={finishResize}
              />
            ) : null}
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

function SelectionOverlay({ frame, selected }: { frame: ResizeFrame; selected: boolean }) {
  if (!selected) return null;

  return (
    <div
      className="border-accent pointer-events-none absolute inset-0 z-10 border"
      style={{ borderRadius: frame.radius }}
    />
  );
}

function ResizeNode({
  frame,
  label,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  frame: ResizeFrame;
  label: string;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      aria-label={label}
      className="border-bright-line bg-bright-top shadow-knob absolute z-20 grid -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize place-items-center rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      data-resize-node
      onMouseDown={(event) => event.stopPropagation()}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left: frame.width,
        top: frame.height,
        width: RESIZE_HANDLE_SIZE,
        height: RESIZE_HANDLE_SIZE,
      }}
      type="button"
    >
      <span className="bg-accent block size-1.5 rounded-full" />
    </button>
  );
}

function pointerOnStage(event: PointerEvent, host: HTMLElement | null) {
  if (!host) return { x: event.clientX, y: event.clientY };
  const rect = host.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function distance(x: number, y: number, centerX: number, centerY: number) {
  return Math.hypot(x - centerX, y - centerY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  if (time >= slotEndSeconds(slot)) return "after";
  return "active";
}

function seekSlot(slot: ActiveMediaSlot, time: number) {
  const next = slotMediaTime(slot, time);
  seekMediaElement(slot.element, next);
}

function timelineTime(slot: ActiveMediaSlot) {
  return slot.element.currentTime + slotStartSeconds(slot);
}

function seekMediaElement(element: HTMLMediaElement, time: number) {
  try {
    element.currentTime = safeMediaTime(element, time);
  } catch {
    return;
  }
}

function safeMediaTime(element: HTMLMediaElement, time: number) {
  const duration = elementDuration(element);
  if (!duration) return Math.max(0, time);
  return Math.max(0, Math.min(time, Math.max(0, duration - LAST_VISIBLE_FRAME_OFFSET)));
}

function lastVisibleMediaTime(element: HTMLMediaElement, fallbackDuration: number) {
  const duration = elementDuration(element) ?? fallbackDuration;
  return Math.max(0, duration - LAST_VISIBLE_FRAME_OFFSET);
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
    seekMediaElement(slot.element, lastVisibleMediaTime(slot.element, slot.source.durationMs / 1000));
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
        video.currentTime = safeMediaTime(video, current);
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
        audio.currentTime = safeMediaTime(audio, current);
        onMetadata?.();
      }}
      preload="auto"
      ref={mediaRef}
      src={src}
    />
  );
}
