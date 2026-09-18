import { explanationInput } from "@/lib/ai/contracts";
import { evaluateExplanation, evaluateCorrection } from "@/lib/ai/gateway";
import { StrictLocalAIError } from "@/lib/ai/providers";
import { guard, smallJson } from "@/lib/ai/http";
import { lessons } from "@/content/curriculum";
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  try {
    const input = explanationInput.parse(await smallJson(request));
    if (!lessons.some((l) => l.id === input.lessonId))
      throw new Error("lesson");
    const requestId = crypto.randomUUID();
    const result = input.correctionCode
      ? await evaluateCorrection(input.lessonId, input.explanation, input.correctionCode, input.settings)
      : await evaluateExplanation(
        input.lessonId,
        input.explanation,
        input.settings,
      );
    console.info(JSON.stringify({ event: "pip_ai_evaluation", requestId, phase: input.correctionCode ? "correction" : "explanation", ...result.trace }));
    return Response.json({ ...result, requestId });
  } catch (error) {
    if (error instanceof StrictLocalAIError) return Response.json({ error: "strict_local_ai_unavailable", message: "Pip couldn’t check that idea yet. Please try again.", fallback: false }, { status: 503 });
    return Response.json(
      { error: "Please send a short explanation for a known lesson." },
      { status: 400 },
    );
  }
}
