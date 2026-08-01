import { useState } from "react";
import type { CanvasRatio } from "@reeldock/shared";
import type { ActiveProject, ProjectDoc } from "@/modules/project";
import {
  projectFilesService,
  projectsService,
  type ProjectSummary,
  type SourceTrackRecord,
} from "@/services";
import { exportProject } from "../lib/export-bridge";

export type ExportState = "idle" | "running" | "done" | "failed";

type UseEditorExportOptions = {
  activeProject: ActiveProject | null;
  doc: ProjectDoc;
  sourceTracks: SourceTrackRecord[];
  onProjectSaved: (project: ProjectSummary) => void;
};

export function useEditorExport({
  activeProject,
  doc,
  sourceTracks,
  onProjectSaved,
}: UseEditorExportOptions) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExportState>("idle");
  const [ratio, setRatio] = useState<Exclude<CanvasRatio, "custom">>("16:9");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const nativeExportAvailable = Boolean(
    activeProject && sourceTracks.some((track) => track.kind === "phone" && track.filePath)
  );

  const openModal = () => {
    setOpen(true);
    setState("idle");
    setError(null);
    setProgress(0);
  };

  const start = async () => {
    if (!activeProject) {
      setError("Open a recorded project before exporting.");
      setState("failed");
      return;
    }

    const recordedTracks = sourceTracks.filter(
      (track) => track.enabled && track.state === "recorded" && track.filePath
    );

    if (!recordedTracks.some((track) => track.kind === "phone")) {
      setError("Export needs a recorded phone track.");
      setState("failed");
      return;
    }

    let job: Awaited<ReturnType<typeof projectsService.createExport>> | null = null;
    setState("running");
    setProgress(8);
    setError(null);
    setOutputPath(null);
    setDuration(null);

    try {
      const latestProject = await projectsService.find(activeProject.id);
      if (!latestProject) {
        throw new Error("Could not find the active project for export.");
      }
      const projectForExport = await projectsService.saveDoc(latestProject, doc);
      onProjectSaved(projectForExport);
      setProgress(18);

      job = await projectsService.createExport(projectForExport, ratio);
      setProgress(28);

      const result = await exportProject({
        projectId: projectForExport.id,
        outputPath: job.filePath,
        ratio,
        doc,
        tracks: recordedTracks,
      });
      setProgress(92);

      await projectsService.completeExport({ ...job, filePath: result.outputPath });
      const exportedProject = await projectsService.setStatus(projectForExport, "exported");
      onProjectSaved(exportedProject);
      setOutputPath(result.outputPath);
      setDuration(result.durationMs / 1000);
      setProgress(100);
      setState("done");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Export failed.";
      if (job) {
        await projectsService.failExport(job, message).catch(() => {});
      }
      setError(message);
      setState("failed");
    }
  };

  const reveal = async () => {
    if (!outputPath) return;
    await projectFilesService.revealProjectInFinder(outputPath);
  };

  return {
    duration,
    error,
    nativeExportAvailable,
    open,
    openModal,
    outputPath,
    progress,
    ratio,
    reveal,
    setOpen,
    setRatio,
    start,
    state,
  };
}
