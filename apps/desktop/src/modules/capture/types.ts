import { z } from "zod";

export const captureSourceSchema = z.object({
  id: z.string(),
  uniqueId: z.string(),
  label: z.string(),
  kind: z.enum(["phone", "webcam", "microphone"]),
  state: z.enum(["available", "unavailable", "permission-required"]),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type CaptureSource = z.infer<typeof captureSourceSchema>;
