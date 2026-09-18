import { z } from "zod";
import type { AISettings } from "../settings";
export type ProviderId = "ollama" | "llamacpp" | "openai" | "demo";
export type Health = {
  provider: ProviderId;
  model: string;
  available: boolean;
  state: "connected" | "unavailable" | "demo";
  detail: string;
  local: boolean;
};
export type StructuredTask<T> = {
  name: string;
  schema: z.ZodType<T>;
  jsonSchema: object;
  system: string;
  input: object;
  fallback: () => T;
};
export interface AIProvider {
  id: ProviderId;
  model: string;
  healthCheck(): Promise<Health>;
  request<T>(task: StructuredTask<T>, signal: AbortSignal): Promise<T>;
}
export function config() {
  const strictLocal = process.env.PIP_STRICT_LOCAL_AI === "true";
  const selected = strictLocal ? "llamacpp" : process.env.AI_PROVIDER || "llamacpp";
  return {
    selected,
    strictLocal,
    cloudAllowed:
      !strictLocal && (process.env.ALLOW_CLOUD_FALLBACK === "true" || selected === "openai"),
    ollamaUrl: process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:11434",
    llamaUrl: process.env.LLAMACPP_BASE_URL || "http://127.0.0.1:8080/v1",
    fastModel: process.env.LOCAL_AI_MODEL || "qwen3:8b",
    qualityModel: process.env.LOCAL_AI_QUALITY_MODEL || "qwen3:14b",
    cloudModel: process.env.PIP_REASONING_MODEL || "gpt-4.1-mini",
    timeout: Math.min(
      60000,
      Math.max(1000, Number(process.env.AI_TIMEOUT_MS) || 15000),
    ),
  };
}
async function jsonFetch(url: string, init: RequestInit) {
  const r = await fetch(url, { ...init, redirect: "error" });
  if (!r.ok) throw new Error(`provider-http-${r.status}`);
  return r.json();
}
function localEndpoint(raw: string) {
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  )
    throw new Error("Local provider requires a loopback address");
  return raw.replace(/\/$/, "");
}
abstract class BaseProvider implements AIProvider {
  abstract id: ProviderId;
  abstract model: string;
  abstract request<T>(task: StructuredTask<T>, signal: AbortSignal): Promise<T>;
  abstract healthCheck(): Promise<Health>;
  health(available: boolean, detail: string): Health {
    return {
      provider: this.id,
      model: this.model,
      available,
      state: available ? "connected" : "unavailable",
      detail,
      local: this.id !== "openai",
    };
  }
}
export class OllamaProvider extends BaseProvider {
  id = "ollama" as const;
  constructor(public model = config().fastModel) {
    super();
  }
  async healthCheck() {
    try {
      const data = await jsonFetch(
        localEndpoint(config().ollamaUrl) + "/api/tags",
        { signal: AbortSignal.timeout(1500) },
      );
      const available = z
        .object({ models: z.array(z.object({ name: z.string() })) })
        .parse(data)
        .models.some((m: { name: string }) => m.name === this.model);
      return this.health(
        !!available,
        available
          ? "Local model installed"
          : `Install with ollama pull ${this.model}`,
      );
    } catch {
      return this.health(
        false,
        "Start Ollama on the configured loopback address.",
      );
    }
  }
  async request<T>(task: StructuredTask<T>, signal: AbortSignal) {
    const data = await jsonFetch(
      localEndpoint(config().ollamaUrl) + "/api/chat",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          think: false,
          stream: false,
          keep_alive: "15m",
          options: { temperature: 0, num_ctx: 4096, num_predict: 500 },
          format: task.jsonSchema,
          messages: [
            { role: "system", content: task.system },
            { role: "user", content: JSON.stringify(task.input) },
          ],
        }),
      },
    );
    return task.schema.parse(
      JSON.parse(
        z.object({ message: z.object({ content: z.string() }) }).parse(data)
          .message.content,
      ),
    );
  }
}
export class LlamaCppProvider extends BaseProvider {
  id = "llamacpp" as const;
  constructor(public model = process.env.LLAMACPP_MODEL || "qwen3-8b") {
    super();
  }
  async healthCheck() {
    try {
      const base = localEndpoint(config().llamaUrl);
      const health = await jsonFetch(base.replace(/\/v1$/, "") + "/health", {
        signal: AbortSignal.timeout(1500),
      });
      const models = await jsonFetch(base + "/models", { signal: AbortSignal.timeout(1500) });
      const available = z.object({ status: z.string() }).parse(health).status === "ok" && z.object({ data: z.array(z.object({ id: z.string() })) }).parse(models).data.some((m) => m.id === this.model);
      return this.health(available, available ? "llama.cpp healthy; configured model alias verified" : "Configured model alias is missing or still loading");
    } catch {
      return this.health(
        false,
        "Start llama-server with a configured GGUF model.",
      );
    }
  }
  async request<T>(task: StructuredTask<T>, signal: AbortSignal) {
    const data = await jsonFetch(
      localEndpoint(config().llamaUrl) + "/chat/completions",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: 500,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
          response_format: { type: "json_object", schema: task.jsonSchema },
          messages: [
            { role: "system", content: task.system },
            { role: "user", content: JSON.stringify(task.input) },
          ],
        }),
      },
    );
    return task.schema.parse(
      JSON.parse(
        z
          .object({
            choices: z
              .array(z.object({ message: z.object({ content: z.string() }) }))
              .min(1),
          })
          .parse(data).choices[0].message.content,
      ),
    );
  }
}
export class OpenAIProvider extends BaseProvider {
  id = "openai" as const;
  model = config().cloudModel;
  async healthCheck() {
    return this.health(
      config().cloudAllowed && !!process.env.OPENAI_API_KEY,
      config().cloudAllowed
        ? "Key configuration only; a live request verifies access."
        : "Cloud use disabled by server policy.",
    );
  }
  async request<T>(task: StructuredTask<T>, signal: AbortSignal) {
    if (!config().cloudAllowed || !process.env.OPENAI_API_KEY)
      throw new Error("cloud-disabled-or-unconfigured");
    const data = await jsonFetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 550,
        instructions: task.system,
        input: JSON.stringify(task.input),
        text: {
          format: {
            type: "json_schema",
            name: task.name,
            strict: true,
            schema: task.jsonSchema,
          },
        },
      }),
    });
    const parsed = z
      .object({
        output: z.array(
          z.object({
            content: z
              .array(
                z.object({ type: z.string(), text: z.string().optional() }),
              )
              .optional(),
          }),
        ),
      })
      .parse(data);
    const output = parsed.output
      .flatMap(
        (x: { content?: { type: string; text?: string }[] }) => x.content ?? [],
      )
      .find((x: { type: string }) => x.type === "output_text")?.text;
    return task.schema.parse(JSON.parse(output ?? ""));
  }
}
export class DeterministicDemoProvider extends BaseProvider {
  id = "demo" as const;
  model = "authored-rubric-v2";
  async healthCheck() {
    return {
      ...this.health(true, "Authored educational fallback; no model inference"),
      state: "demo" as const,
    };
  }
  async request<T>(task: StructuredTask<T>) {
    return task.schema.parse(task.fallback());
  }
}
export function selectProvider(settings?: AISettings): AIProvider {
  const cfg = config(),
    id =
      cfg.strictLocal ? "llamacpp" : process.env.DEMO_MODE === "true"
        ? "demo"
        : settings?.provider && settings.provider !== "auto"
          ? settings.provider
          : cfg.selected;
  if (id === "demo") return new DeterministicDemoProvider();
  if (id === "openai") return new OpenAIProvider();
  if (id === "llamacpp") return new LlamaCppProvider();
  return new OllamaProvider(
    settings?.quality ? cfg.qualityModel : cfg.fastModel,
  );
}
export type ProviderTrace = {
  provider: ProviderId;
  model: string;
  latencyMs: number;
  schemaValid: boolean;
  fallback: boolean;
  reason?: string;
  local: boolean;
};
export class StrictLocalAIError extends Error {
  constructor() { super("Strict local inference failed; no fallback was used."); }
}
export async function runTask<T>(
  task: StructuredTask<T>,
  settings?: AISettings,
): Promise<{ value: T; trace: ProviderTrace }> {
  const provider = selectProvider(settings),
    started = Date.now();
  const attempt = async (p: AIProvider) => {
    const value = await p.request(task, AbortSignal.timeout(config().timeout));
    return {
      value,
      trace: {
        provider: p.id,
        model: p.model,
        latencyMs: Date.now() - started,
        schemaValid: true,
        fallback: p.id === "demo",
        local: p.id !== "openai",
      },
    };
  };
  try {
    return await attempt(provider);
  } catch (error) {
    if (config().strictLocal) {
      console.error(JSON.stringify({ event: "local_ai_failed", provider: provider.id, model: provider.model, latencyMs: Date.now() - started, error: error instanceof Error ? error.name : "Error", fallback: false }));
      throw new StrictLocalAIError();
    }
    if (
      provider.id !== "openai" &&
      config().cloudAllowed &&
      process.env.OPENAI_API_KEY &&
      process.env.AI_FALLBACK_PROVIDER !== "none"
    ) {
      try {
        const result = await attempt(new OpenAIProvider());
        return {
          ...result,
          trace: {
            ...result.trace,
            fallback: true,
            reason:
              "Local provider unavailable; configured cloud fallback used.",
          },
        };
      } catch {}
    }
    const result = await attempt(new DeterministicDemoProvider());
    return {
      ...result,
      trace: {
        ...result.trace,
        fallback: true,
        reason: `${provider.id} unavailable, timed out, or failed schema validation.`,
      },
    };
  }
}
