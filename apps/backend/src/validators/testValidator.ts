import { z } from "zod";

/**
 * Schéma de validation pour la création d'un test
 */
export const createTestSchema = z.object({
  url: z
    .string({
      required_error: "URL is required",
    })
    .url({
      message: "Must be a valid URL",
    })
    .min(1, "URL cannot be empty"),

  prompt: z
    .string({
      required_error: "Prompt is required",
    })
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must not exceed 2000 characters"),

  userId: z
    .string({
      required_error: "User ID is required",
    })
    .min(1, "User ID cannot be empty"),
});

/**
 * Type inféré du schéma
 */
export type CreateTestInput = z.infer<typeof createTestSchema>;

/**
 * Schéma pour les paramètres de route (ID)
 */
export const testIdParamSchema = z.object({
  id: z.string().min(1, "Test ID is required"),
});

/**
 * Schéma pour la création d'un résultat
 */
export const createResultSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  status: z.enum(["success", "failure", "error", "pending"], {
    required_error: "Status is required",
  }),
  logs: z.string().optional().nullable(),
  screenshotUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;

/**
 * Fonction helper pour valider les données
 */
export function validateCreateTest(data: unknown) {
  return createTestSchema.safeParse(data);
}

export function validateTestId(id: unknown) {
  return testIdParamSchema.safeParse({ id });
}

export function validateCreateResult(data: unknown) {
  return createResultSchema.safeParse(data);
}
