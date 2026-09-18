import { config } from "@/lib/ai/providers";
import { speechUrl } from "@/lib/speech/config";
export async function GET() {
  const cloudAllowed = config().cloudAllowed && !!process.env.OPENAI_API_KEY;
  try {
    const r = await fetch(speechUrl() + "/health", {
      signal: AbortSignal.timeout(700),
    });
    if (r.ok) {
      const data = (await r.json()) as {
        available?: boolean;
        engine?: string;
        model?: string;
        device?: string;
        warm?: boolean;
      };
      if (data.available)
        return Response.json({
          available: true,
          mode: "local",
          cloudAllowed,
          engine:
            data.engine === "faster-whisper" ? "faster-whisper" : data.engine === "whisper.cpp" ? "whisper.cpp" : "Local speech",
          model: data.model?.slice(0, 80),
          device: data.device?.slice(0, 80),
          warm: data.warm === true,
        });
    }
  } catch {}
  return Response.json({
    available: cloudAllowed,
    mode: cloudAllowed ? "cloud" : "unavailable",
    cloudAllowed,
  });
}
