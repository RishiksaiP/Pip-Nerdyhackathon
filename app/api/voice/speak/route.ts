import { z } from "zod";
import { config } from "@/lib/ai/providers";
import { guard, smallJson } from "@/lib/ai/http";
const lines = [
  "Can you show me three fourths?",
  "Ohhh. You showed me why it works.",
  "You taught me that!",
];
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const { line } = z
      .object({ line: z.string().max(140) })
      .parse(await smallJson(req));
    if (
      !lines.includes(line) ||
      !config().cloudAllowed ||
      !process.env.OPENAI_API_KEY
    )
      return Response.json({ error: "use_browser_voice" }, { status: 503 });
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        model: process.env.PIP_TTS_MODEL || "gpt-4o-mini-tts",
        voice: "coral",
        input: line,
      }),
    });
    if (!res.ok) throw new Error("provider");
    return new Response(res.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "use_browser_voice" }, { status: 503 });
  }
}
