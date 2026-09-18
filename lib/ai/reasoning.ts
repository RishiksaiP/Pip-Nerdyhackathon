import { z } from "zod";
import {
  getLesson,
  misconceptions,
  misconceptionCodes,
} from "../../content/curriculum";
import { fallbackEvaluate } from "./fallback";
import type { Evaluation } from "./contracts";
export const concepts = [
  "equal_parts",
  "same_whole",
  "selected_parts",
  "denominator",
  "fraction_value",
  "equivalence",
  "equal_groups",
  "place_position",
  "zero_placeholder",
] as const;
export const reasoningSchema = z
  .object({
    skillId: z.string().max(80),
    status: z.enum(["correct", "partially_correct", "incorrect", "unclear"]),
    conceptsPresent: z.array(z.enum(concepts)).max(9),
    conceptsMissing: z.array(z.enum(concepts)).max(9),
    misconceptions: z
      .array(
        z
          .object({
            code: z.enum(misconceptionCodes),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(3),
    strength: z.enum(["strong", "developing", "weak", "unrelated"]),
    action: z.enum(["advance", "probe", "challenge", "remediate", "simplify"]),
    probeId: z.enum(misconceptionCodes).nullable(),
    confidence: z.number().min(0).max(1),
    safeToContinue: z.boolean(),
  })
  .strict();
export type Reasoning = z.infer<typeof reasoningSchema>;
const enumString = (values: readonly string[]) => ({
  type: "string",
  enum: values,
});
export const reasoningJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    skillId: { type: "string" },
    status: enumString([
      "correct",
      "partially_correct",
      "incorrect",
      "unclear",
    ]),
    conceptsPresent: { type: "array", items: enumString(concepts) },
    conceptsMissing: { type: "array", items: enumString(concepts) },
    misconceptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          code: enumString(misconceptionCodes),
          confidence: { type: "number" },
        },
        required: ["code", "confidence"],
      },
    },
    strength: enumString(["strong", "developing", "weak", "unrelated"]),
    action: enumString([
      "advance",
      "probe",
      "challenge",
      "remediate",
      "simplify",
    ]),
    probeId: { anyOf: [enumString(misconceptionCodes), { type: "null" }] },
    confidence: { type: "number" },
    safeToContinue: { type: "boolean" },
  },
  required: [
    "skillId",
    "status",
    "conceptsPresent",
    "conceptsMissing",
    "misconceptions",
    "strength",
    "action",
    "probeId",
    "confidence",
    "safeToContinue",
  ],
};
export function requiredConcepts(id: string): Reasoning["conceptsPresent"] {
  if (id === "moonberry-mix-up") return ["same_whole", "fraction_value"];
  const l = getLesson(id);
  return l.world === "multiplication"
    ? ["equal_groups"]
    : l.world === "place-value"
      ? ["place_position", "zero_placeholder"]
      : l.representation === "equivalent"
        ? ["same_whole", "equivalence"]
        : ["equal_parts", "selected_parts"];
}
export function validateReasoning(value: Reasoning, id: string) {
  if (value.skillId !== id) throw new Error("skill-mismatch");
  const allowed = misconceptionCodes.filter(
    (code) => misconceptions[code].skill === getLesson(id).world,
  );
  if (
    value.misconceptions.some((m) => !allowed.includes(m.code)) ||
    (value.probeId && !allowed.includes(value.probeId))
  )
    throw new Error("probe-outside-skill");
  if (value.conceptsPresent.some((c) => value.conceptsMissing.includes(c)))
    throw new Error("contradictory-evidence");
  return value;
}
export function authoredReasoning(id: string, text: string): Reasoning {
  const evaluation = fallbackEvaluate(id, text),
    good = evaluation.conceptualScore >= 0.7;
  return {
    skillId: id,
    status: good
      ? "correct"
      : evaluation.misconceptions.length
        ? "incorrect"
        : "partially_correct",
    conceptsPresent: good ? requiredConcepts(id) : [],
    conceptsMissing: good ? [] : requiredConcepts(id),
    misconceptions: evaluation.misconceptions,
    strength: good ? "strong" : "developing",
    action: good
      ? "advance"
      : evaluation.misconceptions.length
        ? "remediate"
        : "probe",
    probeId: evaluation.misconceptions[0]?.code ?? null,
    confidence: good ? 0.85 : 0.55,
    safeToContinue: true,
  };
}
// These evidence values are deterministic product heuristics; a model never emits a mastery score.
export function evidenceFromReasoning(r: Reasoning): Evaluation {
  const strong =
    r.safeToContinue &&
    r.status === "correct" &&
    r.strength === "strong" &&
    r.confidence >= 0.6 &&
    r.misconceptions.length === 0 &&
    requiredConcepts(r.skillId).every((c) => r.conceptsPresent.includes(c));
  const score = strong
    ? 0.97
    : r.misconceptions.length
      ? 0.18
      : r.strength === "unrelated"
        ? 0.1
        : 0.55;
  const missing = r.conceptsMissing[0];
  const line = strong
    ? "Oh! Let me try what you taught me."
    : r.misconceptions.length
      ? "Let’s test that idea with a picture."
      : missing === "equal_parts"
        ? "Do the pieces have to be equal? Teach me why."
        : missing === "selected_parts"
          ? "Which number counts the pieces you chose?"
          : missing === "zero_placeholder"
            ? "What is the zero keeping a place for?"
            : "Can you show why it works, using the objects?";
  return {
    conceptualScore: score,
    explanationScore: score,
    misconceptions: r.misconceptions,
    evidenceSummary: strong
      ? "Explained the required concepts independently."
      : r.misconceptions.length
        ? "Authored misconception detected; a counterexample is needed."
        : "More conceptual evidence is needed.",
    pip: { mood: strong ? "eureka" : "curious", line },
  };
}

// Compact wire format cuts autoregressive output latency; the API exposes the expanded evidence contract.
export const compactSchema = z
  .object({
    s: z.enum(["correct", "partial", "incorrect", "unrelated"]),
    c: z.array(z.enum(concepts)).max(9),
    m: z.enum(misconceptionCodes).nullable(),
    q: z.number().min(0).max(1),
  })
  .strict();
export const compactJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    s: enumString(["correct", "partial", "incorrect", "unrelated"]),
    c: { type: "array", items: enumString(concepts) },
    m: { anyOf: [enumString(misconceptionCodes), { type: "null" }] },
    q: { type: "number" },
  },
  required: ["s", "c", "m", "q"],
};
export function compactReasoning(r: Reasoning): z.infer<typeof compactSchema> {
  return {
    s:
      r.status === "correct"
        ? "correct"
        : r.status === "incorrect"
          ? "incorrect"
          : r.strength === "unrelated"
            ? "unrelated"
            : "partial",
    c: r.conceptsPresent,
    m: r.misconceptions[0]?.code ?? null,
    q: r.confidence,
  };
}
export function expandReasoning(
  r: z.infer<typeof compactSchema>,
  skillId: string,
): Reasoning {
  // Uncertain guesses are not evidence of a learner holding a misconception.
  const misconception = r.q >= 0.6 ? r.m : null;
  return validateReasoning(
    {
      skillId,
      status:
        r.s === "correct" &&
        !requiredConcepts(skillId).every((c) => r.c.includes(c))
          ? "partially_correct"
          : r.s === "partial"
            ? "partially_correct"
            : r.s === "unrelated"
              ? "unclear"
              : r.s,
      conceptsPresent: r.c,
      conceptsMissing: requiredConcepts(skillId).filter(
        (c) => !r.c.includes(c),
      ),
      misconceptions: misconception ? [{ code: misconception, confidence: r.q }] : [],
      strength:
        r.s === "correct"
          ? "strong"
          : r.s === "partial"
            ? "developing"
            : r.s === "unrelated"
              ? "unrelated"
              : "weak",
      action: misconception ? "remediate" : r.s === "correct" ? "advance" : "probe",
      probeId: misconception,
      confidence: r.q,
      safeToContinue: r.s !== "unrelated",
    },
    skillId,
  );
}
