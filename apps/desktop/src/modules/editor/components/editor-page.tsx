import { useState } from "react";
import { useStageSize } from "@/modules/canvas";
import type { ProjectDoc } from "@/modules/project";
import { useEditorExport } from "../hooks/use-editor-export";
import { useEditorProjectSession } from "../hooks/use-editor-project-session";
import { useEditorTimeline } from "../hooks/use-editor-timeline";
import type { EditorSection } from "../data/editor-data";
import { EditorExportModal } from "./editor-export-modal";
import { EditorHeader } from "./editor-header";
import { EditorSidebar } from "./editor-sidebar";
import { EditorStage } from "./editor-stage";
import { EditorTimeline } from "./editor-timeline";

export function EditorPage() {
  const { ref, size } = useStageSize();
  const project = useEditorProjectSession();
  const timeline = useEditorTimeline(project.doc);
  const exportModal = useEditorExport({
    activeProject: project.activeProject,
    doc: project.doc,
    sourceTracks: project.sourceTracks,
    onProjectSaved: project.markSaved,
  });
  const [section, setSection] = useState<EditorSection>("canvas");

  const updateDoc = (patch: Partial<ProjectDoc>, quiet?: boolean) => {
    project.update(patch, quiet);
  };

  return (
    <main className="bg-window relative flex h-full min-w-0 flex-col">
      <EditorHeader
        isEdited={project.isEdited}
        projectName={project.activeProject?.name}
        storageError={project.storageError}
        onOpenExport={exportModal.openModal}
      />

      <EditorStage
        playing={timeline.playing}
        section={section}
        seekVersion={timeline.seekVersion}
        size={size}
        stageRef={ref}
        time={timeline.time}
        tracksByKind={project.tracksByKind}
        onPlaybackEnded={() => timeline.setPlaying(false)}
        onPlaybackTimeChange={timeline.syncPlaybackTime}
        onSectionChange={setSection}
      >
        <EditorSidebar
          doc={project.doc}
          hasRecordedMicrophone={project.hasRecordedMicrophone}
          hasRecordedWebcam={project.hasRecordedWebcam}
          section={section}
          onSectionChange={setSection}
          onUpdate={updateDoc}
        />
      </EditorStage>

      <EditorTimeline
        canRedo={timeline.canRedo}
        canUndo={timeline.canUndo}
        cutSummary={timeline.cutSummary}
        duration={project.doc.dur}
        keptDuration={timeline.kept}
        playing={timeline.playing}
        removed={timeline.removed}
        selectedSegment={timeline.selectedSegment}
        segments={project.doc.segments}
        stripRef={timeline.stripRef}
        time={timeline.time}
        onRedo={timeline.redo}
        onRemove={timeline.remove}
        onScrub={timeline.scrub}
        onSelectSegment={timeline.selectSegment}
        onSetPlaying={timeline.setPlaying}
        onSetTime={timeline.setTime}
        onSplit={timeline.split}
        onUndo={timeline.undo}
      />

      <EditorExportModal
        duration={exportModal.duration ?? project.doc.dur}
        error={exportModal.error}
        nativeExportAvailable={exportModal.nativeExportAvailable}
        open={exportModal.open}
        outputPath={exportModal.outputPath}
        progress={exportModal.progress}
        readyTrackCount={project.readyTracks}
        ratio={exportModal.ratio}
        state={exportModal.state}
        width={project.doc.ratio === "custom" ? project.doc.cw : undefined}
        height={project.doc.ratio === "custom" ? project.doc.chh : undefined}
        onDismiss={() => exportModal.setOpen(false)}
        onReveal={() => void exportModal.reveal()}
        onStart={() => void exportModal.start()}
      />
    </main>
  );
}
