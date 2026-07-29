import { cn } from "@reeldock/ui";
import { backgroundCss, stageGeometry, useProject } from "@/modules/project";
import { CameraBubble } from "./camera-bubble";
import { DeviceFrame } from "./device-frame";
import { PhoneMock } from "./phone-mock";

type CanvasStageProps = {
  size: { w: number; h: number };
  className?: string;
};

export function CanvasStage({ size, className }: CanvasStageProps) {
  const { doc } = useProject();
  const geometry = stageGeometry(doc, size);

  return (
    <div
      className={cn("shadow-stage relative shrink-0 overflow-hidden rounded-[10px]", className)}
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
        <DeviceFrame bezel={doc.frame} height={geometry.phoneHeight} radius={doc.radius}>
          <PhoneMock />
        </DeviceFrame>
      </div>

      {geometry.hasCam ? (
        <div
          className="ease-glide absolute transition-[left,top,width,height] duration-300"
          style={{
            left: geometry.camLeft,
            top: geometry.camTop,
            width: geometry.camWidth,
            height: geometry.camHeight,
          }}
        >
          <CameraBubble crop={doc.crop} mirrored={doc.mirror} radius={geometry.camRadius} />
        </div>
      ) : null}
    </div>
  );
}
