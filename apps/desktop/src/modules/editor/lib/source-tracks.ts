import type { StatusTone } from "@reeldock/ui";
import { timecode } from "@/lib/format";
import type { SourceTrackRecord } from "@/services";

export type TrackLoadState = "idle" | "loading" | "ready" | "failed";

export type TracksByKind = {
  phone?: SourceTrackRecord;
  webcam?: SourceTrackRecord;
  microphone?: SourceTrackRecord;
};

export function trackTone(track?: SourceTrackRecord): StatusTone {
  if (!track || !track.enabled) return "neutral";
  if (track.state === "recorded") return "ok";
  if (track.state === "failed") return "rec";
  if (track.state === "recording") return "warn";
  return "neutral";
}

export function trackStateLabel(track?: SourceTrackRecord) {
  if (!track) return "Not selected";
  if (!track.enabled) return "Disabled";
  if (track.state === "recorded") {
    return track.durationMs > 0 ? timecode(track.durationMs / 1000) : "Recorded";
  }
  if (track.state === "recording") return "Still recording";
  if (track.state === "failed") return "Failed";
  return "Planned";
}

export function trackFileLabel(track?: SourceTrackRecord) {
  if (!track?.filePath) return "No media file";
  return track.filePath.split("/").at(-1) ?? track.filePath;
}

export function groupTracksByKind(sourceTracks: SourceTrackRecord[]): TracksByKind {
  return {
    phone: sourceTracks.find((track) => track.kind === "phone"),
    webcam: sourceTracks.find((track) => track.kind === "webcam"),
    microphone: sourceTracks.find((track) => track.kind === "microphone"),
  };
}

export function hasRecordedTrack(track?: SourceTrackRecord) {
  return track?.enabled === true && track.state === "recorded" && Boolean(track.filePath);
}

export function readyTrackCount(sourceTracks: SourceTrackRecord[]) {
  return sourceTracks.filter((track) => track.enabled && track.state === "recorded").length;
}
