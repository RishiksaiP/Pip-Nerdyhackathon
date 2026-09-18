import { aiSettingsSchema } from "@/lib/ai/settings";
import { selectProvider, config } from "@/lib/ai/providers";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = aiSettingsSchema.safeParse({
    provider: params.get("provider") || "auto",
    quality: params.get("quality") === "true",
  });
  if (!parsed.success)
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  const health = await selectProvider(parsed.data).healthCheck();
  return Response.json(
    {
      ...health,
      cloudAllowed: config().cloudAllowed,
      strictLocal: config().strictLocal,
      endpoint: health.provider === "llamacpp" ? config().llamaUrl : undefined,
      privacy: health.local
        ? "Processing on the app server; no cloud fallback unless explicitly enabled."
        : "Cloud processing enabled by server configuration.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
