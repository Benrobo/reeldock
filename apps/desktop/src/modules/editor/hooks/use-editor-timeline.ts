import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cutRegions, keptDuration, removeAt, splitAt, useProject } from "@/modules/project";
import type { ProjectDoc } from "@/modules/project";
import { timecode } from "@/lib/format";

export function useEditorTimeline(doc: ProjectDoc) {
  const stripRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const undo = useProject((state) => state.undo);
  const redo = useProject((state) => state.redo);
  const canUndo = useProject((state) => state.canUndo);
  const canRedo = useProject((state) => state.canRedo);
  const selectedSegment = useProject((state) => state.selectedSegment);
  const selectSegment = useProject((state) => state.selectSegment);
  const time = useProject((state) => state.time);
  const setProjectTime = useProject((state) => state.setTime);
  const update = useProject((state) => state.update);
  const [playing, setPlaying] = useState(false);
  const [seekVersion, setSeekVersion] = useState(0);
  const removed = cutRegions(doc.segments, doc.dur);
  const kept = keptDuration(doc.segments);
  const cutSummary = `${doc.segments.length} kept segment${doc.segments.length === 1 ? "" : "s"} · ${timecode(
    kept
  )}`;

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    if (time < doc.dur || !playing) return;
    setPlaying(false);
  }, [doc.dur, playing, time]);

  const requestSeek = (nextTime: number) => {
    const next = Math.max(0, Math.min(doc.dur, nextTime));
    timeRef.current = next;
    setProjectTime(next);
    setSeekVersion((value) => value + 1);
  };

  const syncPlaybackTime = (nextTime: number) => {
    const next = Math.max(0, Math.min(doc.dur, nextTime));
    timeRef.current = next;
    setProjectTime(next);
  };

  const setPlayback = (nextPlaying: boolean) => {
    if (!nextPlaying) {
      setPlaying(false);
      return;
    }

    if (timeRef.current >= doc.dur) {
      requestSeek(0);
    }

    setPlaying(true);
  };

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((event.clientX - rect.left) / rect.width) * doc.dur;
    requestSeek(next);
  };

  const split = () => {
    const result = splitAt(doc.segments, time);
    if (!result) return;
    update({ segments: result.segments });
    selectSegment(result.selected);
  };

  const remove = () => {
    const result = removeAt(doc.segments, selectedSegment);
    if (!result) return;
    update({ segments: result.segments });
    selectSegment(result.selected);
  };

  return {
    canRedo,
    canUndo,
    cutSummary,
    kept,
    playing,
    redo,
    remove,
    removed,
    scrub,
    seekVersion,
    selectSegment,
    selectedSegment,
    setPlaying: setPlayback,
    setTime: requestSeek,
    syncPlaybackTime,
    split,
    stripRef,
    time,
    undo,
  };
}
