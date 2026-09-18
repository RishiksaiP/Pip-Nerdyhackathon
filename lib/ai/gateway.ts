import { z } from "zod";
import { authoredCorrection } from "./correction";
import {
  getLesson,
  misconceptionCodes,
  misconceptions,
} from "../../content/curriculum";
import { EVALUATOR_PROMPT } from "../../content/prompts/evaluator-v2";
import {
  authoredReasoning,
  evidenceFromReasoning,
  compactSchema,
  compactJsonSchema,
  compactReasoning,
  expandReasoning,
  requiredConcepts,
} from "./reasoning";
import { runTask, type ProviderTrace } from "./providers";
import type { AISettings } from "./settings";
import type { MisconceptionCode } from "../../content/curriculum";
export { EVALUATOR_PROMPT as SYSTEM_PROMPT };
export async function evaluateCorrection(
  lessonId: string,
  text: string,
  code: MisconceptionCode,
  settings?: AISettings,
) {
  if (misconceptions[code].skill !== getLesson(lessonId).world)
    throw new Error("probe-outside-skill");
  const hero = code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE";
  const result = await runTask(
    {
      name: "pip_correction_v1",
      schema: compactSchema,
      jsonSchema: compactJsonSchema,
      system: EVALUATOR_PROMPT,
      input: {
        task: "Evaluate whether the learner explains why Pip's mistaken rule is wrong. The canonical concept below is sufficient for a correct correction. Do not require the original build, exact vocabulary, numbers, or an explicit restatement of the mistaken rule. Use m=null when the learner explains the corrected concept; a misconception is present only if the learner endorses it.",
        mistakenRule: misconceptions[code].mistake,
        canonicalConcept: misconceptions[code].correction,
        requiredConcepts: hero ? ["same_whole", "fraction_value"] : [],
        conceptMeaning: {
          same_whole: "the same object or equal-sized whole",
          fraction_value:
            "more equal pieces of that whole makes each piece smaller",
        },
        allowedMisconceptions: [code],
        learnerExplanation: text,
      },
      fallback: () => {
        const clear = authoredCorrection(lessonId, text, code);
        return {
          s: clear ? ("correct" as const) : ("partial" as const),
          c: clear ? ["same_whole" as const, "fraction_value" as const] : [],
          m: null,
          q: clear ? 0.85 : 0,
        };
      },
    },
    settings,
  );
  const r = result.value;
  const accepted =
    r.s === "correct" &&
    r.m === null &&
    r.q >= 0.6 &&
    (!hero ||
      ["same_whole", "fraction_value"].every((c) =>
        r.c.includes(c as (typeof r.c)[number]),
      ));
  return {
    accepted,
    conceptsPresent: r.c,
    trace: result.trace,
    source: result.trace.provider === "demo" ? "fallback" : "live",
    latencyMs: result.trace.latencyMs,
  };
}
export async function evaluateExplanation(
  lessonId: string,
  text: string,
  settings?: AISettings,
) {
  const lesson = getLesson(lessonId);
  const result = await runTask(
    {
      name: "pip_evidence_v2",
      schema: compactSchema.refine((r) => {
        try {
          expandReasoning(r, lessonId);
          return true;
        } catch {
          return false;
        }
      }, "Invalid skill evidence"),
      jsonSchema: compactJsonSchema,
      system: EVALUATOR_PROMPT,
      input: {
        skillId: lesson.id,
        gradeBand: "3–5",
        requiredConcepts: requiredConcepts(lessonId),
        conceptMeaning: {
          equal_parts: "parts of equal size",
          denominator: "the count of all equal parts",
          fraction_value:
            "splitting the same whole into more pieces makes each piece smaller; accept informal words like tinier",
          selected_parts: "how many pieces are used, chosen or taken",
          same_whole: "comparing one equal-sized whole",
          equivalence: "same amount",
          equal_groups: "each group has the same count",
          place_position: "hundreds tens and ones determine value",
          zero_placeholder: "zero keeps the empty place",
        },
        canonicalConcept: lesson.concept,
        verifiedTarget: lesson.target,
        allowedMisconceptions: misconceptionCodes.filter(
          (code) => misconceptions[code].skill === lesson.world,
        ),
        learnerExplanation: text,
      },
      fallback: () => compactReasoning(authoredReasoning(lessonId, text)),
    },
    settings,
  );
  const analysis = expandReasoning(result.value, lessonId);
  return {
    evaluation: evidenceFromReasoning(analysis),
    analysis,
    source:
      result.trace.provider === "demo"
        ? ("fallback" as const)
        : ("live" as const),
    latencyMs: result.trace.latencyMs,
    trace: result.trace,
  };
}
// Shared boundary for narrative context and factual summaries; never imported by a browser component.
export async function structuredRequest<T>(
  schema: z.ZodType<T>,
  jsonSchema: object,
  name: string,
  input: object,
  system: string,
  fallback: () => T,
  settings?: AISettings,
): Promise<{ value: T; trace: ProviderTrace }> {
  return runTask(
    { schema, jsonSchema, name, input, system, fallback },
    settings,
  );
}
