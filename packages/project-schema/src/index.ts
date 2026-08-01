import { z } from "zod";

export const aspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);

export const normalizedFrameSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const sourceTrackSchema = z.object({
  file: z.string().min(1),
  startOffsetMs: z.number().int().nonnegative(),
});

export const sourceVolumeSchema = z.number().min(0).max(2);

export const reeldockProjectSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative(),
  canvas: z.object({
    aspectRatio: aspectRatioSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    background: z.object({
      type: z.literal("colour"),
      value: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
  }),
  sources: z.object({
    phone: sourceTrackSchema
      .extend({
        rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
        volume: sourceVolumeSchema.default(1),
      })
      .optional(),
    webcam: sourceTrackSchema
      .extend({
        enabled: z.boolean(),
        volume: sourceVolumeSchema.default(1),
      })
      .optional(),
    microphone: sourceTrackSchema
      .extend({
        volume: sourceVolumeSchema,
      })
      .optional(),
    phoneAudio: sourceTrackSchema
      .extend({
        volume: sourceVolumeSchema,
      })
      .optional(),
  }),
  composition: z.object({
    phone: normalizedFrameSchema.extend({
      cornerRadius: z.number().int().nonnegative(),
      deviceFrame: z.enum(["none", "iphone"]),
    }),
    webcam: normalizedFrameSchema.extend({
      shape: z.enum(["circle", "rounded-rectangle", "rectangle"]),
      visible: z.boolean(),
    }),
  }),
  trim: z.object({
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().nonnegative(),
  }),
});

export type ReelDockProject = z.infer<typeof reeldockProjectSchema>;

export const createEmptyProject = (name: string, createdAt = new Date().toISOString()) =>
  reeldockProjectSchema.parse({
    version: 1,
    name,
    createdAt,
    durationMs: 0,
    canvas: {
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      background: {
        type: "colour",
        value: "#F4F2EC",
      },
    },
    sources: {},
    composition: {
      phone: {
        x: 0.08,
        y: 0.08,
        width: 0.34,
        height: 0.84,
        cornerRadius: 42,
        deviceFrame: "none",
      },
      webcam: {
        x: 0.56,
        y: 0.14,
        width: 0.34,
        height: 0.58,
        shape: "rounded-rectangle",
        visible: true,
      },
    },
    trim: {
      startMs: 0,
      endMs: 0,
    },
  });
