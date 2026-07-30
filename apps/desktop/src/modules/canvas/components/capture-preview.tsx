import { useRef } from "react";
import { CameraBubble } from "./camera-bubble";
import { useNativePreview } from "../hooks/use-native-preview";
import { cn } from "@reeldock/ui";
import {
  DEVICE_PREVIEW_TARGET_SIZE,
  DEFAULT_PHONE_ASPECT,
  LIVE_DEVICE_PREVIEW_RADIUS,
  LIVE_WEBCAM_PREVIEW_RADIUS,
  SETUP_PREVIEW_DEBUG,
  WEBCAM_PREVIEW_TARGET_SIZE,
} from "@/constants/preview";

type CapturePreviewProps = {
  phoneUniqueId?: string;
  phoneDimensions?: { width?: number; height?: number };
  webcamUniqueId?: string;
  mirror?: boolean;
};

export function CapturePreview({
  phoneUniqueId,
  phoneDimensions,
  webcamUniqueId,
  mirror = true,
}: CapturePreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const phoneAspect = phoneAspectFromDimensions(phoneDimensions);

  const phoneRef = useNativePreview<HTMLDivElement>({
    surface: "phone",
    uniqueId: phoneUniqueId,
    enabled: Boolean(phoneUniqueId),
    radius: LIVE_DEVICE_PREVIEW_RADIUS,
    hostRef,
  });

  const webcamRef = useNativePreview<HTMLDivElement>({
    surface: "webcam",
    uniqueId: webcamUniqueId,
    enabled: Boolean(webcamUniqueId),
    mirror,
    hostRef,
  });

  return (
    <div
      className={cn(
        "box-border flex h-full w-full items-center justify-center p-12",
        SETUP_PREVIEW_DEBUG && "bg-blue-500/10 outline outline-4 outline-blue-500"
      )}
      ref={hostRef}
    >
      <div className="flex h-full max-h-[820px] items-center justify-center gap-[clamp(32px,4vw,56px)]">
        <div
          className={cn(
            "relative flex h-full shrink-0 items-center justify-center overflow-hidden",
            SETUP_PREVIEW_DEBUG && "bg-red-500/15 outline outline-4 outline-yellow-500"
          )}
          style={{ aspectRatio: phoneAspect }}
        >
          <div
            className={cn(
              "relative max-h-full max-w-full shrink-0",
              SETUP_PREVIEW_DEBUG && "outline outline-2 outline-yellow-300"
            )}
            style={{ aspectRatio: phoneAspect, height: DEVICE_PREVIEW_TARGET_SIZE }}
          >
            {phoneUniqueId ? (
              <div className="h-full w-full" ref={phoneRef} />
            ) : (
              <div className="h-full w-full rounded-[14%] border-[6px] border-black" />
            )}
          </div>
        </div>

        {webcamUniqueId ? (
          <div
            className={cn(
              "flex aspect-square h-[48%] shrink-0 items-center justify-center overflow-hidden",
              SETUP_PREVIEW_DEBUG && "bg-green-500/15 outline outline-4 outline-green-500"
            )}
          >
            <div
              className="aspect-square max-h-full max-w-full shrink-0"
              ref={webcamRef}
              style={{ height: WEBCAM_PREVIEW_TARGET_SIZE }}
            >
              <CameraBubble live mirrored={mirror} radius={LIVE_WEBCAM_PREVIEW_RADIUS} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function phoneAspectFromDimensions(dimensions?: { width?: number; height?: number }) {
  if (!dimensions?.width || !dimensions.height) return DEFAULT_PHONE_ASPECT;
  return (
    Math.min(dimensions.width, dimensions.height) / Math.max(dimensions.width, dimensions.height)
  );
}
