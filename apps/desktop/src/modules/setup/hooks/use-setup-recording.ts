import { useEffect, useRef, useState } from "react";
import { canUseLocalDb } from "@/db/local";
import type { ProjectDoc, ActiveProject } from "@/modules/project";
import { projectsService, type ProjectSummary } from "@/services";
import { useUiSound } from "@/hooks/use-ui-sound";
import {
  nativeRecordingKind,
  prepareRecording,
  recordingFilePath,
  startRecording,
  stopRecording,
  type CaptureSource,
  type NativeRecordingKind,
  type RecordingTrackResult,
} from "@/modules/capture";
import type { SetupSourcesState } from "./use-setup-sources";

type SetupRecordingState =
  | { status: "idle" }
  | { status: "creating-project" }
  | { status: "counting-down"; value: 3 | 2 | 1 }
  | { status: "recording"; startedAtMs: number }
  | { status: "stopping" }
  | { status: "failed"; message: string };

type UseSetupRecordingOptions = {
  activeProject: ActiveProject | null;
  doc: ProjectDoc;
  onboardingComplete: boolean;
  onboardingLoading: boolean;
  setupSources: SetupSourcesState;
  loadProject: (project: ProjectSummary) => void;
  setActiveProject: (project: ProjectSummary) => void;
  onNeedsPermissions: () => Promise<void>;
  onRecorded: () => Promise<void>;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isBusy(state: SetupRecordingState) {
  return (
    state.status === "creating-project" ||
    state.status === "counting-down" ||
    state.status === "stopping"
  );
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Recording could not start.";
}

function selectedRecordingSources(setupSources: SetupSourcesState) {
  const sources = [
    setupSources.phoneSource,
    setupSources.webcamEnabled ? setupSources.webcamSource : undefined,
    setupSources.microphoneEnabled ? setupSources.microphoneSource : undefined,
  ].filter((source): source is CaptureSource => Boolean(source));

  return sources.map((source) => ({
    kind: nativeRecordingKind(source),
    uniqueId: source.uniqueId,
    enabled: true,
  }));
}

function recordingFiles(projectPath: string, sources: Array<{ kind: NativeRecordingKind }>) {
  return sources.map((source) => ({
    kind: source.kind,
    path: recordingFilePath(projectPath, source.kind),
  }));
}

async function applyTrackResults(projectId: string, results: RecordingTrackResult[]) {
  const tracks = await projectsService.listSourceTracks(projectId);

  await Promise.all(
    results.map((result) => {
      const track = tracks.find((item) => item.kind === result.kind);
      if (!track) return Promise.resolve();

      return projectsService.updateSourceTrack(track.id, {
        filePath: result.filePath ?? track.filePath,
        state: result.state,
        startOffsetMs: result.startOffsetMs,
        durationMs: result.durationMs,
      });
    })
  );
}

export function useSetupRecording({
  activeProject,
  doc,
  onboardingComplete,
  onboardingLoading,
  setupSources,
  loadProject,
  setActiveProject,
  onNeedsPermissions,
  onRecorded,
}: UseSetupRecordingOptions) {
  const sounds = useUiSound();
  const [state, setState] = useState<SetupRecordingState>({ status: "idle" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const activeSessionRef = useRef<ProjectSummary | null>(null);
  const storageAvailable = canUseLocalDb();
  const locked = state.status !== "idle" && state.status !== "failed";
  const canRecord =
    storageAvailable &&
    setupSources.hasPhone &&
    onboardingComplete &&
    !onboardingLoading &&
    (state.status === "idle" || state.status === "failed");

  useEffect(() => {
    if (state.status !== "recording") return;

    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((performance.now() - state.startedAtMs) / 1000));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 250);
    return () => window.clearInterval(timer);
  }, [state]);

  const createOrReuseProject = async () => {
    return projectsService.create({
      sources: setupSources.recordingSources,
    });
  };

  const start = async () => {
    if (!storageAvailable) {
      sounds.playError();
      setState({
        status: "failed",
        message: "Recording must be started from the ReelDock desktop app.",
      });
      return;
    }

    if (!onboardingComplete) {
      await onNeedsPermissions();
      return;
    }
    if (!canRecord || isBusy(state)) return;

    setElapsedSeconds(0);
    setState({ status: "creating-project" });
    sounds.playClick();

    try {
      const draft = await createOrReuseProject();
      const saved = await projectsService.saveDoc(draft, doc);
      loadProject(saved);
      setActiveProject(saved);
      activeSessionRef.current = saved;
      const nativeSources = selectedRecordingSources(setupSources);

      await prepareRecording({
        projectId: saved.id,
        projectPath: saved.path,
        sources: nativeSources,
        files: recordingFiles(saved.path, nativeSources),
      });

      for (const value of [3, 2, 1] as const) {
        setState({ status: "counting-down", value });
        sounds.playCountdown();
        await wait(1000);
      }

      const started = await startRecording(saved.id);
      const recording = await projectsService.setStatus(saved, "recording");
      await applyTrackResults(recording.id, started.tracks);
      loadProject(recording);
      setActiveProject(recording);
      activeSessionRef.current = recording;
      sounds.playRecordStart();
      setState({ status: "recording", startedAtMs: performance.now() });
    } catch (error) {
      console.error(error);
      sounds.playError();
      setState({
        status: "failed",
        message: errorMessage(error),
      });
    }
  };

  const stop = async () => {
    if (state.status !== "recording") return;

    setState({ status: "stopping" });
    sounds.playRecordStop();

    try {
      const current = activeSessionRef.current
        ? await projectsService.find(activeSessionRef.current.id)
        : activeProject
          ? await projectsService.find(activeProject.id)
          : await projectsService.active();

      if (!current) {
        setState({ status: "idle" });
        return;
      }

      const stopped = await stopRecording(current.id);
      await applyTrackResults(current.id, stopped.tracks);
      const nativeDurationSeconds = Math.ceil(stopped.durationMs / 1000);
      const duration = Math.max(1, nativeDurationSeconds || elapsedSeconds);
      const saved = await projectsService.saveDoc(current, {
        ...doc,
        dur: duration,
        segments: [{ start: 0, end: duration }],
      });
      const recorded = await projectsService.setStatus(saved, "recorded");
      loadProject(recorded);
      setActiveProject(recorded);
      activeSessionRef.current = null;
      setState({ status: "idle" });
      await onRecorded();
    } catch (error) {
      console.error(error);
      sounds.playError();
      setState({
        status: "failed",
        message: errorMessage(error),
      });
    }
  };

  return {
    state,
    elapsedSeconds,
    storageAvailable,
    locked,
    canRecord,
    start,
    stop,
  };
}
