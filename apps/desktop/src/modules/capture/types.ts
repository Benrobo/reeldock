import { z } from "zod";

export const captureSourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["phone", "webcam", "microphone"]),
  state: z.enum(["available", "unavailable", "permission-required"]),
});

export type CaptureSource = z.infer<typeof captureSourceSchema>;
