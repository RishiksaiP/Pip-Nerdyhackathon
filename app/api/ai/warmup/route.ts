import { z } from "zod";
import { guard, smallJson } from "@/lib/ai/http";
import { aiSettingsSchema } from "@/lib/ai/settings";
import { selectProvider, config } from "@/lib/ai/providers";
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  try {
    const settings = aiSettingsSchema.parse(await smallJson(request));
    const provider = selectProvider(settings);
    const health = await provider.healthCheck();
    if (!health.available) return Response.json(health);
    if (provider.id === "demo")
      return Response.json({
        ...health,
        detail: "Authored demo ready; no model inference is used.",
      });
    await provider.request(
      {
        name: "warmup",
        schema: z.object({ ready: z.literal(true) }).strict(),
        jsonSchema: {
          type: "object",
          additionalProperties: false,
          properties: { ready: { type: "boolean", enum: [true] } },
          required: ["ready"],
        },
        system: 'Return {"ready":true}. /no_think',
        input: { warmup: true },
        fallback: () => ({ ready: true as const }),
      },
      AbortSignal.timeout(15000),
    );
    return Response.json({
      ...health,
      detail: "Model warmed with a synthetic structured request.",
    });
  } catch {
    return Response.json({
      available: false,
      state: "unavailable",
      detail: config().strictLocal ? "Local model unavailable; strict verification forbids fallback." : "Warmup unavailable; authored fallback remains ready.",
    }, { status: config().strictLocal ? 503 : 200 });
  }
}
