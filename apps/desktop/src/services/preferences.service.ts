import { z } from "zod";
import { localDb, preferences } from "@/db/local";
import { DEFAULT_PREFERENCES } from "@/config/preferences";
import { onboardingRequirementStatusSchema } from "@/modules/onboarding/types";

const preferencesSchema = z.object({
  defaultProjectName: z.string().min(1),
  openEditorAfterRecording: z.boolean(),
  recordingsPath: z.string().min(1),
  recordingQuality: z.string().min(1),
  phoneCapture: z.string().min(1),
  hardwareAcceleration: z.boolean(),
  showPhoneAudioMonitoringControlDuringRecordingSetup: z.boolean(),
  selectedSources: z
    .object({
      phone: z.string().optional(),
      webcam: z.string().optional(),
      microphone: z.string().optional(),
    })
    .default({}),
  onboardingRequirements: z.object({
    phone: onboardingRequirementStatusSchema,
  }),
});

export type AppPreferences = z.infer<typeof preferencesSchema>;

function now() {
  return new Date().toISOString();
}

let preferenceWriteQueue = Promise.resolve();

function serializePreferenceValue(value: unknown) {
  return JSON.stringify(value);
}

function enqueuePreferenceWrite<T>(write: () => Promise<T>) {
  const next = preferenceWriteQueue.then(write, write);
  preferenceWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export const preferencesService = {
  async get(): Promise<AppPreferences> {
    const db = await localDb();
    const rows = await db.select().from(preferences);
    if (!rows.length) {
      return this.seed();
    }

    const values = Object.fromEntries(
      rows.map((row) => [
        row.key,
        typeof row.value === "undefined" ? undefined : JSON.parse(row.value),
      ])
    );
    return preferencesSchema.parse({ ...DEFAULT_PREFERENCES, ...values });
  },

  async save(patch: Partial<AppPreferences>): Promise<AppPreferences> {
    const next = preferencesSchema.parse({ ...(await this.get()), ...patch });

    await enqueuePreferenceWrite(async () => {
      const db = await localDb();
      const timestamp = now();
      for (const [key, value] of Object.entries(patch)) {
        const serialized = serializePreferenceValue(value);
        await db
          .insert(preferences)
          .values({ key, value: serialized, updatedAt: timestamp })
          .onConflictDoUpdate({
            target: preferences.key,
            set: { value: serialized, updatedAt: timestamp },
          });
      }
    });

    return next;
  },

  async seed(): Promise<AppPreferences> {
    await enqueuePreferenceWrite(async () => {
      const db = await localDb();
      const timestamp = now();
      for (const [key, value] of Object.entries(DEFAULT_PREFERENCES)) {
        const serialized = serializePreferenceValue(value);
        await db
          .insert(preferences)
          .values({ key, value: serialized, updatedAt: timestamp })
          .onConflictDoUpdate({
            target: preferences.key,
            set: { value: serialized, updatedAt: timestamp },
          });
      }
    });

    return preferencesSchema.parse(DEFAULT_PREFERENCES);
  },
};
