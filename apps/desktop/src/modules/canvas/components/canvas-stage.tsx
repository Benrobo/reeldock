import { useRef } from "react";
import { cn } from "@reeldock/ui";
import { DEFAULT_PHONE_ASPECT } from "@/constants/preview";
import { backgroundCss, stageGeometry, useProject } from "@/modules/project";
import { CameraBubble } from "./camera-bubble";
import { DeviceFrame, deviceFrameMetrics } from "./device-frame";
import { useNativePreview } from "../hooks/use-native-preview";

type CanvasStageProps = {
  size: { w: number; h: number };
  phoneUniqueId?: string;
  webcamUniqueId?: string;
  phoneAspect?: number;
  className?: string;
};

export function CanvasStage({
  size,
  phoneUniqueId,
  webcamUniqueId,
  phoneAspect = DEFAULT_PHONE_ASPECT,
  className,
}: CanvasStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { doc } = useProject();
  const geometry = stageGeometry(doc, size, phoneAspect);
  const phoneMetrics = deviceFrameMetrics(geometry.phoneWidth, geometry.phoneHeight, doc.frame);

  const phoneRef = useNativePreview<HTMLDivElement>({
    surface: "phone",
    uniqueId: phoneUniqueId,
    enabled: Boolean(phoneUniqueId),
    radius: phoneMetrics.outerRadius,
    hostRef,
  });

  const webcamRef = useNativePreview<HTMLDivElement>({
    surface: "webcam",
    uniqueId: webcamUniqueId,
    enabled: geometry.hasCam && Boolean(webcamUniqueId),
    radius: geometry.camRadius,
    mirror: doc.mirror,
    hostRef,
  });

  return (
    <div
      className={cn("shadow-stage relative shrink-0 overflow-hidden rounded-[10px]", className)}
      ref={hostRef}
      style={{ width: geometry.cw, height: geometry.ch, background: backgroundCss(doc) }}
    >
      <div
        className="ease-glide absolute transition-[left,top,width,height] duration-300"
        style={{
          left: geometry.phoneLeft,
          top: geometry.phoneTop,
          width: geometry.phoneWidth,
          height: geometry.phoneHeight,
        }}
      >
        {phoneUniqueId ? (
          <div className="h-full w-full" ref={phoneRef} />
        ) : (
          <DeviceFrame
            bezel={doc.frame}
            height={geometry.phoneHeight}
            width={geometry.phoneWidth}
          />
        )}
      </div>

      {geometry.hasCam ? (
        <div
          className="ease-glide absolute transition-[left,top,width,height] duration-300"
          ref={webcamRef}
          style={{
            left: geometry.camLeft,
            top: geometry.camTop,
            width: geometry.camWidth,
            height: geometry.camHeight,
          }}
        >
          <CameraBubble
            crop={doc.crop}
            live={Boolean(webcamUniqueId)}
            mirrored={doc.mirror}
            radius={geometry.camRadius}
          />
        </div>
      ) : null}
    </div>
  );
}
