import { z } from "zod";
import { aiSettingsSchema } from "./settings";
import {
  misconceptionCodes,
  misconceptions,
  getLesson,
} from "../../content/curriculum";
export const evaluationSchema = z
  .object({
    conceptualScore: z.number().min(0).max(1),
    explanationScore: z.number().min(0).max(1),
    misconceptions: z
      .array(
        z
          .object({
            code: z.enum(misconceptionCodes),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(4),
    evidenceSummary: z.string().max(220),
    pip: z
      .object({
        mood: z.enum(["curious", "thinking", "confused", "eureka", "excited"]),
        line: z.string().max(140),
      })
      .strict(),
  })
  .strict();
export type Evaluation = z.infer<typeof evaluationSchema>;
export function validateEvaluationForLesson(
  evaluation: Evaluation,
  lessonId: string,
): Evaluation {
  if (
    evaluation.misconceptions.some(
      (m) => misconceptions[m.code].skill !== getLesson(lessonId).world,
    )
  )
    throw new Error("misconception-outside-skill");
  return evaluation;
}
export const explanationInput = z
  .object({
    lessonId: z.string().max(80),
    explanation: z.string().trim().min(2).max(800),
    mode: z.enum(["typed", "voice"]).default("typed"),
    settings: aiSettingsSchema.optional(),
    correctionCode: z.enum(misconceptionCodes).optional(),
  })
  .strict();
// Scene copy is selected from safe wording; it cannot invent facts about the bottles.
export const transferTitles = [
  "Moonberry Potion Shop",
  "Moonberry Mix-Up",
  "A Moonberry Mystery",
] as const;
export const transferLines = [
  "New place. Same idea. Can you prove it here?",
  "My potion shelf needs your sharp eyes.",
  "A new pair of bottles. Show me what you know.",
] as const;
export const transferSchema = z
  .object({
    scene: z.literal("potion_shop"),
    title: z.enum(transferTitles),
    leftLabel: z.literal("Moonberry Potion"),
    rightLabel: z.literal("Moonberry Potion"),
    prompt: z.literal("Which bottle has more Moonberry Potion?"),
    pipLine: z.enum(transferLines),
  })
  .strict();
export const tutorSchema = z
  .object({
    headline: z.string().max(80),
    observation: z.string().max(240),
    recommendedIntervention: z.string().max(200),
    reason: z.string().max(200),
  })
  .strict();
export const evaluatorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    conceptualScore: { type: "number" },
    explanationScore: { type: "number" },
    misconceptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          code: { type: "string", enum: [...misconceptionCodes] },
          confidence: { type: "number" },
        },
        required: ["code", "confidence"],
      },
    },
    evidenceSummary: { type: "string" },
    pip: {
      type: "object",
      additionalProperties: false,
      properties: {
        mood: {
          type: "string",
          enum: ["curious", "thinking", "confused", "eureka", "excited"],
        },
        line: { type: "string" },
      },
      required: ["mood", "line"],
    },
  },
  required: [
    "conceptualScore",
    "explanationScore",
    "misconceptions",
    "evidenceSummary",
    "pip",
  ],
};
