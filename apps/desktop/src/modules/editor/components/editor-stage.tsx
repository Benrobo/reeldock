import type { IconData } from "@benrobo/iconary/core";
import {
  ArtboardIcon,
  CameraVideoIcon,
  Mic01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Icon } from "@benrobo/iconary/react";
import { cn } from "@reeldock/ui";
import Tippy from "@tippyjs/react";
import type { ReactNode, RefObject } from "react";
import { CanvasStage } from "@/modules/canvas";
import { EDITOR_SECTIONS, type EditorSection } from "../data/editor-data";
import type { TracksByKind } from "../lib/source-tracks";

const sectionIcons = {
  canvas: ArtboardIcon,
  phone: SmartPhone01Icon,
  camera: CameraVideoIcon,
  audio: Mic01Icon,
} as const satisfies Record<EditorSection, IconData>;

type EditorStageProps = {
  children: ReactNode;
  section: EditorSection;
  size: { w: number; h: number };
  stageRef: RefObject<HTMLDivElement | null>;
  time: number;
  playing: boolean;
  seekVersion: number;
  tracksByKind: TracksByKind;
  onPlaybackEnded: () => void;
  onPlaybackTimeChange: (time: number) => void;
  onSectionChange: (section: EditorSection) => void;
};

export function EditorStage({
  children,
  section,
  size,
  stageRef,
  time,
  playing,
  seekVersion,
  tracksByKind,
  onPlaybackEnded,
  onPlaybackTimeChange,
  onSectionChange,
}: EditorStageProps) {
  return (
    <div className="bg-well relative flex min-h-0 flex-1 justify-between gap-6 overflow-hidden p-[26px]">
      <div
        className="flex min-h-0 min-w-0 flex-1 items-center justify-center self-stretch"
        ref={stageRef}
      >
        <CanvasStage
          microphoneSource={tracksByKind.microphone}
          phoneSource={tracksByKind.phone}
          playing={playing}
          seekVersion={seekVersion}
          time={time}
          webcamSource={tracksByKind.webcam}
          onPlaybackEnded={onPlaybackEnded}
          onPlaybackTimeChange={onPlaybackTimeChange}
          onSelectElement={onSectionChange}
          size={size}
        />
      </div>
      <div className="flex min-h-0 shrink-0 items-start justify-between gap-5 self-stretch">
        <EditorSectionRail section={section} onSectionChange={onSectionChange} />
        {children}
      </div>
    </div>
  );
}

function EditorSectionRail({
  section,
  onSectionChange,
}: {
  section: EditorSection;
  onSectionChange: (section: EditorSection) => void;
}) {
  return (
    <nav
      aria-label="Editor sections"
      className="flex w-10 shrink-0 flex-col items-center gap-5 pt-2"
    >
      {EDITOR_SECTIONS.map((item) => {
        const selected = section === item.id;

        return (
          <Tippy content={item.label} key={item.id} placement="left">
            <button
              aria-label={item.label}
              className={cn(
                "relative grid size-9 cursor-pointer place-items-center border-0 bg-transparent p-0",
                selected ? "text-accent" : "text-fg-3 hover:text-fg-control"
              )}
              onClick={() => onSectionChange(item.id)}
              type="button"
            >
              <Icon color="currentColor" icon={sectionIcons[item.id]} size={20} />
              {selected ? (
                <span className="bg-accent absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full" />
              ) : null}
            </button>
          </Tippy>
        );
      })}
    </nav>
  );
}
