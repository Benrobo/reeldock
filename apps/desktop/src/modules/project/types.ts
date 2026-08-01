import { z } from "zod";
import type {
  BackgroundKind,
  CameraShape,
  CanvasFit,
  CanvasRatio,
  ElementSize,
} from "@reeldock/shared";
import {
  CAMERA_ROUNDNESS_MAX,
  CAMERA_ROUNDNESS_MIN,
  CAMERA_ROUNDNESS_DEFAULT,
  CAMERA_SHAPE_IDS,
  CAMERA_SIZE_DEFAULT,
  CAMERA_SIZE_MAX,
  CAMERA_SIZE_MIN,
  CANVAS_PADDING_MAX,
  CANVAS_PADDING_MIN,
  PHONE_ZOOM_DEFAULT,
  PHONE_ZOOM_MAX,
  PHONE_ZOOM_MIN,
} from "@reeldock/shared";

export type Segment = { start: number; end: number };

const segmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
});

const normalizedPositionSchema = z.number().nullable().default(null);
const cameraShapeSchema = z.preprocess(
  (value) => (value === "rect" ? "horizontal" : value),
  z.enum(CAMERA_SHAPE_IDS)
);

export const projectDocSchema = z.object({
  ratio: z.enum(["16:9", "9:16", "1:1", "custom"]) satisfies z.ZodType<CanvasRatio>,
  phoneSize: z.enum(["S", "M", "L"]) satisfies z.ZodType<ElementSize>,
  frame: z.boolean(),
  shadow: z.boolean(),
  radius: z.number().min(0).max(80),
  zoom: z.number().min(PHONE_ZOOM_MIN).max(PHONE_ZOOM_MAX),
  camOn: z.boolean(),
  camShape: cameraShapeSchema satisfies z.ZodType<CameraShape>,
  camScale: z.number().min(CAMERA_SIZE_MIN).max(CAMERA_SIZE_MAX).default(CAMERA_SIZE_DEFAULT),
  camRoundness: z
    .number()
    .min(CAMERA_ROUNDNESS_MIN)
    .max(CAMERA_ROUNDNESS_MAX)
    .default(CAMERA_ROUNDNESS_DEFAULT),
  mirror: z.boolean(),
  crop: z.number().min(0).max(100),
  bg: z.string().min(1),
  bgKind: z.enum(["solid", "gradient", "pattern", "image"]) satisfies z.ZodType<BackgroundKind>,
  grad: z.number().int().min(0),
  pat: z.number().int().min(0),
  fit: z.enum(["cover", "contain"]) satisfies z.ZodType<CanvasFit>,
  cw: z.number().int().min(320),
  chh: z.number().int().min(320),
  pad: z.number().min(CANVAS_PADDING_MIN).max(CANVAS_PADDING_MAX),
  mic: z.number().min(0).max(100),
  phoneVol: z.number().min(0).max(100).default(100),
  webcamVol: z.number().min(0).max(100).default(100),
  muted: z.boolean(),
  dur: z.number().min(1),
  segments: z.array(segmentSchema).min(1),
  phoneX: normalizedPositionSchema,
  phoneY: normalizedPositionSchema,
  camX: normalizedPositionSchema,
  camY: normalizedPositionSchema,
});

export type ProjectDoc = z.infer<typeof projectDocSchema>;

export const DEFAULT_DOC = projectDocSchema.parse({
  ratio: "16:9",
  phoneSize: "L",
  frame: true,
  shadow: true,
  radius: 34,
  zoom: PHONE_ZOOM_DEFAULT,
  camOn: true,
  camShape: "circle",
  camScale: CAMERA_SIZE_DEFAULT,
  camRoundness: CAMERA_ROUNDNESS_DEFAULT,
  mirror: true,
  crop: 50,
  bg: "var(--color-screen)",
  bgKind: "gradient",
  grad: 3,
  pat: 0,
  fit: "cover",
  cw: 1600,
  chh: 1200,
  pad: 5,
  mic: 88,
  phoneVol: 100,
  webcamVol: 100,
  muted: false,
  dur: 64,
  segments: [{ start: 2.5, end: 58 }],
});
