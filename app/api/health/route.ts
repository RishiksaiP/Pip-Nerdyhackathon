import { config } from "@/lib/ai/providers";
export const dynamic = "force-dynamic";
export function GET() {
  const cfg = config();
  return Response.json({
    product: "pip",
    status: "ready",
    instance: process.env.PIP_INSTANCE_ID ?? "manual",
    cloudAllowed: cfg.cloudAllowed,
    provider: cfg.selected,
    model: process.env.LLAMACPP_MODEL || "qwen3-8b",
    endpoint: cfg.selected === "llamacpp" ? cfg.llamaUrl : undefined,
    strictLocal: cfg.strictLocal,
    aiTimeoutMs: cfg.timeout,
  });
}
