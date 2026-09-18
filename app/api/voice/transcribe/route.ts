import { z } from "zod";
import { guard } from "@/lib/ai/http";
import { config } from "@/lib/ai/providers";
import { speechUrl } from "@/lib/speech/config";
const transcript = z.object({ text: z.string().max(4000) });
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    if (Number(req.headers.get("content-length")) > 4000000)
      throw new Error("too-large");
    const file = (await req.formData()).get("audio");
    if (
      !(file instanceof File) ||
      file.size > 3000000 ||
      !["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"].some((t) =>
        file.type.startsWith(t),
      )
    )
      throw new Error("audio");
    if (file.type === "audio/wav") {
      try {
        const r = await fetch(speechUrl() + "/transcribe", {
          method: "POST",
          headers: { "Content-Type": "audio/wav" },
          body: await file.arrayBuffer(),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error("local-unavailable");
        const data = transcript.parse(await r.json());
        return Response.json({
          text: data.text.slice(0, 800),
          source: "local",
        });
      } catch {}
    }
    if (!config().cloudAllowed || !process.env.OPENAI_API_KEY)
      throw new Error("cloud-disabled");
    const form = new FormData();
    form.set("file", file);
    form.set(
      "model",
      process.env.PIP_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
    );
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error("provider");
    const data = transcript.parse(await response.json());
    return Response.json({ text: data.text.slice(0, 800), source: "cloud" });
  } catch {
    return Response.json(
      {
        error: "voice_unavailable",
        message: "Type your idea instead. Pip can read it.",
      },
      { status: 503 },
    );
  }
}
