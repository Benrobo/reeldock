import { z } from "zod";
import type {
  BackgroundKind,
  CameraAnchor,
  CameraShape,
  CanvasFit,
  CanvasRatio,
  ElementSize,
  LayoutId,
} from "@reeldock/shared";

export type Segment = { start: number; end: number };

const segmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
});

export const projectDocSchema = z.object({
  ratio: z.enum(["16:9", "9:16", "1:1", "custom"]) satisfies z.ZodType<CanvasRatio>,
  layout: z.enum(["focus", "side", "pip", "presenter", "vertical"]) satisfies z.ZodType<LayoutId>,
  phoneSize: z.enum(["S", "M", "L"]) satisfies z.ZodType<ElementSize>,
  frame: z.boolean(),
  shadow: z.boolean(),
  radius: z.number().min(0).max(80),
  zoom: z.number().min(75).max(130),
  swap: z.boolean(),
  camOn: z.boolean(),
  camShape: z.enum(["circle", "rect"]) satisfies z.ZodType<CameraShape>,
  camSize: z.enum(["S", "M", "L"]) satisfies z.ZodType<ElementSize>,
  camAnchor: z.enum(["tl", "tr", "bl", "br"]) satisfies z.ZodType<CameraAnchor>,
  mirror: z.boolean(),
  crop: z.number().min(0).max(100),
  bg: z.string().min(1),
  bgKind: z.enum(["solid", "gradient", "pattern", "image"]) satisfies z.ZodType<BackgroundKind>,
  grad: z.number().int().min(0),
  pat: z.number().int().min(0),
  fit: z.enum(["cover", "contain"]) satisfies z.ZodType<CanvasFit>,
  cw: z.number().int().min(320),
  chh: z.number().int().min(320),
  pad: z.number().min(0).max(18),
  gap: z.number().min(0).max(16),
  mic: z.number().min(0).max(100),
  phoneVol: z.number().min(0).max(100),
  muted: z.boolean(),
  dur: z.number().min(1),
  segments: z.array(segmentSchema).min(1),
});

export type ProjectDoc = z.infer<typeof projectDocSchema>;

export const DEFAULT_DOC = projectDocSchema.parse({
  ratio: "16:9",
  layout: "pip",
  phoneSize: "L",
  frame: true,
  shadow: true,
  radius: 34,
  zoom: 100,
  swap: false,
  camOn: true,
  camShape: "circle",
  camSize: "M",
  camAnchor: "br",
  mirror: true,
  crop: 50,
  bg: "var(--color-screen)",
  bgKind: "solid",
  grad: 0,
  pat: 0,
  fit: "cover",
  cw: 1600,
  chh: 1200,
  pad: 5,
  gap: 4,
  mic: 88,
  phoneVol: 42,
  muted: false,
  dur: 64,
  segments: [{ start: 2.5, end: 58 }],
});
