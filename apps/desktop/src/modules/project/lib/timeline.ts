import type { Segment } from "../types";

export function keptDuration(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + (segment.end - segment.start), 0);
}

export function splitAt(
  segments: Segment[],
  time: number
): { segments: Segment[]; selected: number } | null {
  const index = segments.findIndex((s) => time > s.start + 0.4 && time < s.end - 0.4);
  if (index < 0) return null;
  const segment = segments[index];
  return {
    segments: [
      ...segments.slice(0, index),
      { start: segment.start, end: time },
      { start: time, end: segment.end },
      ...segments.slice(index + 1),
    ],
    selected: index + 1,
  };
}

export function removeAt(
  segments: Segment[],
  selected: number
): { segments: Segment[]; selected: number } | null {
  if (segments.length < 2) return null;
  const index = Math.min(selected, segments.length - 1);
  return { segments: segments.filter((_, n) => n !== index), selected: Math.max(0, index - 1) };
}

export function editedTime(segments: Segment[], time: number): number {
  let elapsed = 0;
  for (const segment of segments) {
    if (time >= segment.end) {
      elapsed += segment.end - segment.start;
      continue;
    }
    if (time > segment.start) return elapsed + (time - segment.start);
    return elapsed;
  }
  return elapsed;
}

export function snapTime(segments: Segment[], time: number): number {
  if (time <= segments[0].start) return segments[0].start;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (time <= segment.end) return Math.max(segment.start, time);
    const next = segments[i + 1];
    if (!next) return segment.end;
    if (time < next.start) return time - segment.end < next.start - time ? segment.end : next.start;
  }
  return segments[segments.length - 1].end;
}

export function nextTime(segments: Segment[], time: number): number {
  const current = segments.find((s) => time >= s.start && time < s.end);
  if (current) return time;
  const upcoming = segments.find((s) => s.start > time);
  return upcoming ? upcoming.start : segments[0].start;
}

export function cutRegions(
  segments: Segment[],
  duration: number
): { start: number; width: number }[] {
  const regions: { start: number; width: number }[] = [];
  if (segments[0].start > 0) regions.push({ start: 0, width: segments[0].start });
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].start > segments[i - 1].end) {
      regions.push({ start: segments[i - 1].end, width: segments[i].start - segments[i - 1].end });
    }
  }
  const last = segments[segments.length - 1];
  if (last.end < duration) regions.push({ start: last.end, width: duration - last.end });
  return regions;
}
