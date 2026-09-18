import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { reasoningSchema } from "../lib/ai/reasoning";
import { evaluationSchema } from "../lib/ai/contracts";
import { z } from "zod";
const wireSchema = z.object({
  status: z.string().optional(), data: z.array(z.object({ id: z.string() })).default([]),
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).default([]),
  id: z.string().optional(), strictLocal: z.boolean().optional(), provider: z.string().optional(), cloudAllowed: z.boolean().optional(),
  source: z.string().optional(), requestId: z.string().default(""), latencyMs: z.number().optional(), accepted: z.boolean().optional(),
  analysis: reasoningSchema.optional(), evaluation: evaluationSchema.optional(),
  trace: z.object({ provider: z.string(), model: z.string(), schemaValid: z.boolean(), fallback: z.boolean() }).default({ provider: "", model: "", schemaValid: false, fallback: true }),
});

const base = process.env.PIP_TEST_URL || "http://127.0.0.1:3176";
const llama = "http://127.0.0.1:8080";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) throw new Error("Live tests only target loopback.");
const results: object[] = [];
const canary = `PIP_LOCAL_INTEGRATION_CANARY_${randomUUID().replaceAll("-", "")}`;
async function request(url: string, body?: object) {
  const start = Date.now();
  const response = await fetch(url, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(65000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status} ${JSON.stringify(data)}`);
  return { data: wireSchema.parse(data), ms: Date.now() - start };
}
function check(name: string, ok: boolean, detail: object = {}) {
  results.push({ name, passed: ok, ...detail });
  console.log(`${name.padEnd(32)} ${ok ? "PASS" : "FAIL"} ${JSON.stringify(detail)}`);
  if (!ok) throw new Error(name);
}
console.log("PIP LIVE AI INTEGRATION\n===============================");
try {
  check("llama-server health", (await request(`${llama}/health`)).data.status === "ok");
  check("Qwen3-8B model", (await request(`${llama}/v1/models`)).data.data.some((m: { id: string }) => m.id === "qwen3-8b"));
  const direct = await request(`${llama}/v1/chat/completions`, { model: "qwen3-8b", messages: [{ role: "system", content: "You are performing a local integration test." }, { role: "user", content: `Return exactly ${canary}. /no_think` }], chat_template_kwargs: { enable_thinking: false }, temperature: 0, max_tokens: 100, stream: false });
  check("Direct unique canary", direct.data.choices?.[0]?.message?.content.trim().replace(/\.$/, "") === canary, { latencyMs: direct.ms, completionId: direct.data.id });
  const health = (await request(`${base}/api/health`)).data;
  check("Strict backend configuration", health.strictLocal === true && health.provider === "llamacpp" && health.cloudAllowed === false);
  const fixtures = [
    { name: "Strong explanation", text: "The whole has four equal pieces and we're using three.", test: (r: ReturnType<typeof reasoningSchema.parse>) => r.status === "correct" && ["equal_parts", "selected_parts"].every((c) => r.conceptsPresent.includes(c as typeof r.conceptsPresent[number])) },
    { name: "Wrong reasoning", text: "Because three plus four equals seven.", test: (r: ReturnType<typeof reasoningSchema.parse>) => r.status !== "correct" },
    { name: "Misconception detection", text: "One eighth is bigger than one fourth because eight is bigger than four.", test: (r: ReturnType<typeof reasoningSchema.parse>) => r.misconceptions.some((m) => m.code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE") },
    { name: "Informal correct reasoning", text: "If you cut the same thing into more pieces, each piece gets smaller.", test: (r: ReturnType<typeof reasoningSchema.parse>) => r.conceptsPresent.includes("fraction_value") && !r.misconceptions.length },
    { name: "Supportive uncertainty", text: "I don't know.", test: (r: ReturnType<typeof reasoningSchema.parse>) => r.status === "unclear" && r.conceptsPresent.length === 0 },
  ];
  const ids = new Set<string>();
  for (const f of fixtures) {
    const { data, ms } = await request(`${base}/api/explanation/evaluate`, { lessonId: "fraction-meaning", explanation: f.text, settings: { provider: "demo", quality: false } });
    // Deliberately request demo: server strict mode must override every client choice.
    const r = reasoningSchema.parse(data.analysis);
    evaluationSchema.parse(data.evaluation);
    check(f.name, data.source === "live" && data.trace.provider === "llamacpp" && data.trace.model === "qwen3-8b" && data.trace.schemaValid === true && data.trace.fallback === false && !ids.has(data.requestId) && f.test(r), { requestId: data.requestId, latencyMs: ms, modelLatencyMs: data.latencyMs, status: r.status, concepts: r.conceptsPresent, misconceptions: r.misconceptions });
    ids.add(data.requestId);
  }
  const moonberry=await request(`${base}/api/explanation/evaluate`,{lessonId:"moonberry-mix-up",explanation:"They are the same size bottle, but when you split it into more equal pieces every piece gets smaller."});
  check("Moonberry live reasoning",moonberry.data.analysis?.status==="correct" && !moonberry.data.trace.fallback && moonberry.data.trace.provider==="llamacpp",{latencyMs:moonberry.ms});
  const correction = await request(`${base}/api/explanation/evaluate`, { lessonId: "moonberry-mix-up", explanation: "They're the same-size whole. When you divide it into more equal pieces, each piece gets smaller.", correctionCode: "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE" });
  check("Live correction evaluation", correction.data.accepted === true && correction.data.trace.provider === "llamacpp" && correction.data.trace.schemaValid && !correction.data.trace.fallback, { requestId: correction.data.requestId, latencyMs: correction.ms });
  for(const explanation of ["1/4", "One eighth is larger because eight is bigger than four."]){
    const weak=await request(`${base}/api/explanation/evaluate`,{lessonId:"moonberry-mix-up",explanation,correctionCode:"FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE"});
    check("Weak correction rejected",weak.data.accepted===false&&!weak.data.trace.fallback,{latencyMs:weak.ms});
  }
  const context=await request(`${base}/api/challenge/transfer`,{lessonId:"moonberry-mix-up"});
  check("Live transfer context",context.data.source==="live",{latencyMs:context.ms});
  console.log("LIVE LOCAL AI VERIFIED.");
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  const directory = resolve("artifacts/live-ai");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "integration.json"), JSON.stringify({ generatedAt: new Date().toISOString(), syntheticOnly: true, canary, passed: process.exitCode !== 1, results }, null, 2) + "\n");
}
