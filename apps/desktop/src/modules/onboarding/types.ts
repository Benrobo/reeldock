import { z } from "zod";

export const onboardingRequirementStatusSchema = z.enum(["pending", "granted", "denied"]);

export const onboardingRequirementsSchema = z.object({
  camera: onboardingRequirementStatusSchema,
  microphone: onboardingRequirementStatusSchema,
  phone: onboardingRequirementStatusSchema,
});

export type OnboardingRequirementStatus = z.infer<typeof onboardingRequirementStatusSchema>;
export type OnboardingRequirements = z.infer<typeof onboardingRequirementsSchema>;
export type OnboardingRequirementKey = keyof OnboardingRequirements;
