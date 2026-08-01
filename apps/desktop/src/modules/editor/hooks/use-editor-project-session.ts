import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/modules/project";
import { projectsService, type SourceTrackRecord } from "@/services";
import {
  groupTracksByKind,
  hasRecordedTrack,
  readyTrackCount,
  type TrackLoadState,
} from "../lib/source-tracks";

export function useEditorProjectSession() {
  const doc = useProject((state) => state.doc);
  const activeProject = useProject((state) => state.activeProject);
  const loadProject = useProject((state) => state.loadProject);
  const markSaved = useProject((state) => state.markSaved);
  const update = useProject((state) => state.update);
  const isEdited = useProject((state) => state.isEdited);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [trackLoadState, setTrackLoadState] = useState<TrackLoadState>("idle");
  const [sourceTracks, setSourceTracks] = useState<SourceTrackRecord[]>([]);
  const activeProjectId = activeProject?.id ?? null;
  const tracksByKind = useMemo(() => groupTracksByKind(sourceTracks), [sourceTracks]);
  const hasRecordedWebcam = hasRecordedTrack(tracksByKind.webcam);
  const hasRecordedMicrophone = hasRecordedTrack(tracksByKind.microphone);
  const readyTracks = readyTrackCount(sourceTracks);

  useEffect(() => {
    if (activeProject) return;
    let cancelled = false;

    projectsService
      .active()
      .then((project) => {
        if (!cancelled && project) {
          setStorageError(null);
          loadProject(project);
        }
      })
      .catch(() => {
        if (!cancelled) setStorageError("Local SQLite storage is unavailable.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject, loadProject]);

  useEffect(() => {
    if (!activeProjectId) return;
    const timer = window.setTimeout(() => {
      void projectsService
        .find(activeProjectId)
        .then((project) => {
          if (!project) return;
          void projectsService
            .saveDoc(project, doc)
            .then((saved) => {
              setStorageError(null);
              markSaved(saved);
            })
            .catch(() => setStorageError("Could not save changes to local SQLite."));
        })
        .catch(() => setStorageError("Could not save changes to local SQLite."));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [activeProjectId, doc, markSaved]);

  useEffect(() => {
    if (!activeProjectId) {
      setSourceTracks([]);
      setTrackLoadState("idle");
      return;
    }

    let cancelled = false;
    setTrackLoadState("loading");

    projectsService
      .listSourceTracks(activeProjectId)
      .then((tracks) => {
        if (cancelled) return;
        setSourceTracks(tracks);
        setTrackLoadState("ready");
        setStorageError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setSourceTracks([]);
        setTrackLoadState("failed");
        setStorageError("Could not load recorded source tracks from local SQLite.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (trackLoadState !== "ready" || hasRecordedWebcam || !doc.camOn) return;
    update({ camOn: false }, true);
  }, [doc.camOn, hasRecordedWebcam, trackLoadState, update]);

  return {
    activeProject,
    doc,
    hasRecordedMicrophone,
    hasRecordedWebcam,
    isEdited,
    markSaved,
    readyTracks,
    sourceTracks,
    storageError,
    trackLoadState,
    tracksByKind,
    update,
  };
}
