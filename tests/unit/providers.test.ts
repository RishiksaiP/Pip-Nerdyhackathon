import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { evaluateExplanation } from "../../lib/ai/gateway";
import { selectProvider, config, StrictLocalAIError } from "../../lib/ai/providers";
import { evaluateCorrection } from "../../lib/ai/gateway";
const good = "Four equal pieces make the whole and we take three.";
const compact = {
  s: "correct",
  c: ["equal_parts", "selected_parts"],
  m: null,
  q: 0.95,
};
beforeEach(() => {
  vi.stubEnv("AI_PROVIDER", "ollama");
  vi.stubEnv("ALLOW_CLOUD_FALLBACK", "false");
  vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
  vi.stubEnv("DEMO_MODE", "false");
  vi.stubEnv("PIP_STRICT_LOCAL_AI", "false");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("local-first provider policy", () => {
  it("strict mode overrides demo, cloud opt-in and client provider choices", () => {
    vi.stubEnv("PIP_STRICT_LOCAL_AI", "true");
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("ALLOW_CLOUD_FALLBACK", "true");
    expect(config().cloudAllowed).toBe(false);
    expect(selectProvider({ provider: "demo", quality: false }).id).toBe("llamacpp");
  });
  it("strict failure never invokes another provider or authored evaluation", async () => {
    vi.stubEnv("PIP_STRICT_LOCAL_AI", "true");
    const request = vi.fn<typeof fetch>(async () => { throw new Error("offline"); });
    vi.stubGlobal("fetch", request);
    await expect(evaluateExplanation("fraction-meaning", good)).rejects.toBeInstanceOf(StrictLocalAIError);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("llama health requires both readiness and the requested model alias", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.endsWith("/health") ? { status: "ok" } : { data: [{ id: "other-model" }] })));
    expect((await selectProvider({ provider: "llamacpp", quality: false }).healthCheck()).available).toBe(false);
  });
  it("correction needs same-whole and magnitude evidence, not a correct selection alone", async () => {
    for (const [concepts, accepted] of [[[], false], [["same_whole", "fraction_value"], true]] as const) {
      vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ message: { content: JSON.stringify({ ...compact, c: concepts }) } }] })));
      const r = await evaluateCorrection("fraction-meaning", "Same whole; more pieces means smaller pieces.", "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE", { provider: "llamacpp", quality: false });
      expect(r.accepted).toBe(accepted);
    }
  });
  it("uses constrained Ollama with thinking disabled and strips hidden reasoning", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        message: { content: JSON.stringify(compact), thinking: "never expose" },
      }),
    );
    vi.stubGlobal("fetch", request);
    const result = await evaluateExplanation("fraction-meaning", good);
    expect(result.trace.provider).toBe("ollama");
    expect(result.evaluation.conceptualScore).toBe(0.97);
    const body = JSON.parse(request.mock.calls[0]?.[1]?.body as string);
    expect(body.think).toBe(false);
    expect(body.format.additionalProperties).toBe(false);
    expect(JSON.stringify(result)).not.toContain("never expose");
  });
  it("does not send child data to cloud merely because a key exists", async () => {
    const request = vi.fn<typeof fetch>(() =>
      Promise.reject(new Error("offline")),
    );
    vi.stubGlobal("fetch", request);
    const result = await evaluateExplanation("fraction-meaning", good);
    expect(result.trace.provider).toBe("demo");
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toContain("127.0.0.1");
  });
  it("uses preserved OpenAI support only after explicit opt-in", async () => {
    vi.stubEnv("ALLOW_CLOUD_FALLBACK", "true");
    const request = vi.fn(async (url: string) =>
      url.includes("openai.com")
        ? Response.json({
            output: [
              {
                content: [
                  { type: "output_text", text: JSON.stringify(compact) },
                ],
              },
            ],
          })
        : new Response("offline", { status: 503 }),
    );
    vi.stubGlobal("fetch", request);
    const result = await evaluateExplanation("fraction-meaning", good);
    expect(result.trace.provider).toBe("openai");
    expect(result.trace.fallback).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("invalid schema and cross-world probes fall back before changing progress", async () => {
    for (const output of [
      { ...compact, m: "UNKNOWN" },
      { ...compact, m: "ZERO_PLACEHOLDER_IGNORED" },
      { ...compact, mastery: 1 },
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>(async () =>
          Response.json({ message: { content: JSON.stringify(output) } }),
        ),
      );
      expect(
        (await evaluateExplanation("fraction-meaning", good)).trace.provider,
      ).toBe("demo");
    }
  });
  it("timeout uses the deterministic provider", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("deadline", "TimeoutError");
      }),
    );
    expect((await evaluateExplanation("fraction-meaning", good)).source).toBe(
      "fallback",
    );
  });
  it("llama.cpp sends the JSON grammar and validates the response", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        choices: [{ message: { content: JSON.stringify(compact) } }],
      }),
    );
    vi.stubGlobal("fetch", request);
    const result = await evaluateExplanation("fraction-meaning", good, {
      provider: "llamacpp",
      quality: false,
    });
    expect(result.trace.provider).toBe("llamacpp");
    expect(
      JSON.parse(request.mock.calls[0]?.[1]?.body as string).response_format
        .schema.additionalProperties,
    ).toBe(false);
  });
  it("provider and quality selection are bounded, deterministic demo makes no requests", async () => {
    expect(selectProvider({ provider: "ollama", quality: true }).model).toBe(
      "qwen3:14b",
    );
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await evaluateExplanation("fraction-meaning", good, {
      provider: "demo",
      quality: false,
    });
    expect(request).not.toHaveBeenCalled();
  });
});
