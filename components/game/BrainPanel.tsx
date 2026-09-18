"use client";
import { useEffect, useState } from "react";
import { Activity, Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import { useSession } from "./SessionProvider";
import { aiSettingsSchema } from "@/lib/ai/settings";
import { z } from "zod";
const healthSchema = z.object({
  provider: z.string(),
  model: z.string(),
  available: z.boolean(),
  state: z.string(),
  detail: z.string(),
  local: z.boolean(),
  cloudAllowed: z.boolean(),
  strictLocal: z.boolean().optional(),
  endpoint: z.string().optional(),
});
export function BrainPanel() {
  const { session, update, ready } = useSession(),
    [health, setHealth] = useState<z.infer<typeof healthSchema> | null>(null),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [speech, setSpeech] = useState<{
      available: boolean;
      engine?: string;
      mode?: string;
      model?: string;
      device?: string;
      warm?: boolean;
    } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/voice/status", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) =>
        setSpeech(
          z
            .object({
              available: z.boolean(),
              engine: z.string().optional(),
              mode: z.string().optional(),
              model: z.string().optional(),
              device: z.string().optional(),
              warm: z.boolean().optional(),
            })
            .parse(data),
        ),
      )
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const { provider, quality } = session.aiSettings;
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const refresh = () =>
      void fetch(`/api/ai/status?provider=${provider}&quality=${quality}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => setHealth(healthSchema.parse(data)))
        .catch(() =>
          setHealth((previous) =>
            previous
              ? {
                  ...previous,
                  available: false,
                  detail: "Provider status unavailable",
                }
              : null,
          ),
        );
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [provider, quality, ready]);
  async function warm() {
    setBusy(true);
    setNote("Waking the selected model…");
    try {
      const r = await fetch("/api/ai/warmup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session.aiSettings),
        signal: AbortSignal.timeout(17000),
      });
      const data = z
        .object({ detail: z.string().optional() })
        .parse(await r.json());
      setNote(
        typeof data.detail === "string" ? data.detail : "Warmup finished.",
      );
    } catch {
      setNote(
        health?.strictLocal
          ? "Warmup unavailable. Restart the local model or launch Safe Demo."
          : "Warmup unavailable. The authored demo is ready.",
      );
    } finally {
      setBusy(false);
    }
  }
  const calls = session.events.filter(
    (e) => e.name === "explanation_submitted",
  );
  return (
    <section className="brain-panel">
      <div className="panel-kicker">
        <Cpu size={17} /> PIP’S BRAIN
      </div>
      <div className="brain-heading">
        <h2>Local first. A clear boundary.</h2>
        <span className={`brain-badge ${health?.available ? "connected" : ""}`}>
          {health
            ? health.available
              ? health.provider === "demo"
                ? "Authored demo"
                : health.provider === "openai"
                  ? "Cloud configured"
                  : "Local model detected"
              : health.strictLocal
                ? "Local AI unavailable"
                : "Fallback ready"
            : "Checking provider…"}
        </span>
      </div>
      <p>
        Language models interpret explanations. Mathematical answers and mastery
        decisions stay in code.
      </p>
      <div className="brain-controls">
        <label>
          Provider
          <select
            aria-label="AI provider"
            disabled={!ready || health?.strictLocal}
            value={provider}
            onChange={(e) => {
              setHealth(null);
              setNote("");
              update((s) => ({
                ...s,
                aiSettings: aiSettingsSchema.parse({
                  ...s.aiSettings,
                  provider: e.target.value,
                }),
              }));
            }}
          >
            <option value="auto">Auto · local first</option>
            <option value="ollama">Ollama</option>
            <option value="llamacpp">llama.cpp</option>
            <option value="openai" disabled={health?.cloudAllowed === false}>
              OpenAI · server opt-in required
            </option>
            <option value="demo">Authored demo</option>
          </select>
        </label>
        <label>
          Local model
          <select
            aria-label="Local model mode"
            disabled={!ready || provider !== "ollama"}
            value={quality ? "quality" : "fast"}
            onChange={(e) => {
              setHealth(null);
              setNote("");
              update((s) => ({
                ...s,
                aiSettings: {
                  ...s.aiSettings,
                  quality: e.target.value === "quality",
                },
              }));
            }}
          >
            <option value="fast">Fast Local · Qwen3-8B</option>
            <option value="quality">Quality Local · Qwen3-14B Q4</option>
          </select>
        </label>
        <button
          className="export-button"
          disabled={busy || !ready}
          onClick={() => void warm()}
        >
          <RefreshCw size={15} />
          {busy ? "Warming…" : "Warm & verify"}
        </button>
      </div>
      <div className="brain-facts">
        <span>
          <Cpu size={15} />
          {health?.model || "Checking configuration"}
        </span>
        <span>
          <ShieldCheck size={15} />
          Cloud fallback {health?.cloudAllowed ? "enabled" : "off"}
        </span>
        <span>
          <Activity size={15} />
          {calls.length} measured evaluations
        </span>
        {health?.endpoint && <span>{health.endpoint}</span>}
        {health?.strictLocal && (
          <span>Strict local verification · no fallback</span>
        )}
      </div>
      <p className="brain-note" role="status">
        {note || health?.detail}
      </p>
      <p className="measurement-note">
        Local means the app server’s machine. The guided demo uses the authored
        provider when Auto is selected outside strict verification. Choose
        llama.cpp to demonstrate real local inference. No hidden reasoning or
        learner text is logged.
      </p>
      <div className="lab-speech-status">
        <strong>Speech</strong>
        <span>
          {speech?.available
            ? speech.mode === "cloud"
              ? "Cloud transcription configured"
              : `${speech.engine || "Local speech"} · ${speech.model || "configured model"} · ${speech.device || "automatic device"} · ${speech.warm ? "warm" : "ready"}`
            : "Unavailable · typed teaching ready"}
        </span>
      </div>
      <ol className="trace-list">
        {calls
          .slice(-5)
          .reverse()
          .map((e) => (
            <li key={e.id}>
              <time>{new Date(e.at).toLocaleTimeString()}</time>
              <span>{e.detail}</span>
              <b>{e.latencyMs} ms</b>
            </li>
          ))}
      </ol>
    </section>
  );
}
