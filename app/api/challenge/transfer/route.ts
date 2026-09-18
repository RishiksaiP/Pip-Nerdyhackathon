import { z } from "zod";
import { aiSettingsSchema } from "@/lib/ai/settings";
import { getLesson } from "@/content/curriculum";
import { comparisonKernel } from "@/lib/math/kernel";
import { transferFallback } from "@/lib/ai/fallback";
import {
  transferSchema,
  transferTitles,
  transferLines,
} from "@/lib/ai/contracts";
import { structuredRequest } from "@/lib/ai/gateway";
import { config } from "@/lib/ai/providers";
import { guard, smallJson } from "@/lib/ai/http";
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    scene: {
      type: "string",
      enum: ["potion_shop"],
    },
    title: { type: "string", enum: [...transferTitles] },
    leftLabel: { type: "string", enum: ["Moonberry Potion"] },
    rightLabel: { type: "string", enum: ["Moonberry Potion"] },
    prompt: {
      type: "string",
      enum: ["Which bottle has more Moonberry Potion?"],
    },
    pipLine: { type: "string", enum: [...transferLines] },
  },
  required: ["scene", "title", "leftLabel", "rightLabel", "prompt", "pipLine"],
};
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const { lessonId, settings } = z
      .object({
        lessonId: z.string().max(80),
        settings: aiSettingsSchema.optional(),
      })
      .parse(await smallJson(req));
    const lesson = getLesson(lessonId),
      kernel = comparisonKernel(lesson.transferLeft, lesson.transferRight);
    try {
      const result = await structuredRequest(
        transferSchema,
        schema,
        "pip_transfer",
        { kernel },
        "Select a title and encouraging line from the schema's allowed choices for the next potion-shop proof. Copy each choice exactly. Mathematical facts and bottle amounts are owned by the application. Return only the specified JSON keys.",
        () => transferFallback,
        settings,
      );
      return Response.json({
        kernel,
        context: result.value,
        source: result.trace.provider === "demo" ? "fallback" : "live",
      });
    } catch {
      if (config().strictLocal)
        return Response.json(
          { error: "strict_local_ai_unavailable", fallback: false },
          { status: 503 },
        );
      return Response.json({
        kernel,
        context: transferFallback,
        source: "fallback",
      });
    }
  } catch {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
}
