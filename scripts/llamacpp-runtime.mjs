import { existsSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { resolve, join } from "node:path";
import { root, tool, json } from "./local-runtime.mjs";

export const llamaBase = "http://127.0.0.1:8080";
export const llamaAlias = "qwen3-8b";
export function llamaConfig() {
  const model = resolve(root, process.env.PIP_LLAMA_MODEL || "models/qwen3-8b/Qwen3-8B-Q4_K_M.gguf");
  const candidates = [process.env.PIP_LLAMA_SERVER, "llama-server", join(root, "tools/llama.cpp/llama-server.exe"), join(root, "vendor/llama.cpp/build/bin/llama-server.exe")].filter(Boolean);
  const binary = candidates.find((candidate) => tool(candidate));
  if (!binary) throw new Error("llama-server not found. Install llama.cpp and add its folder to PATH, or set PIP_LLAMA_SERVER.");
  if (!existsSync(model)) throw new Error(`GGUF missing: ${model}. Run scripts/download-gguf-models.ps1 or set PIP_LLAMA_MODEL.`);
  const fd = openSync(model, "r"), magic = Buffer.alloc(4);
  try { readSync(fd, magic, 0, 4, 0); } finally { closeSync(fd); }
  if (magic.toString() !== "GGUF" || statSync(model).size < 1_000_000_000) throw new Error(`Incomplete or invalid Qwen GGUF: ${model}`);
  const help = tool(binary, ["--help"]) || "";
  const args = ["-m", model, "--host", "127.0.0.1", "--port", "8080", "--ctx-size", "8192", "--parallel", "1", "--alias", llamaAlias];
  if (help.includes("--gpu-layers")) args.push("--gpu-layers", /'all'/.test(help) ? "all" : "999");
  if (/--flash-attn[^\n]*on/.test(help)) args.push("--flash-attn", "on");
  if (help.includes("--log-timestamps")) args.push("--log-timestamps");
  if (help.includes("--verbosity")) args.push("--verbosity", "4");
  return { binary, model, bytes: statSync(model).size, args };
}
export async function verifyLlama() {
  const health = await json(`${llamaBase}/health`);
  const models = await json(`${llamaBase}/v1/models`);
  if (health.status !== "ok" || !models.data?.some((m) => m.id === llamaAlias)) throw new Error("Port 8080 is not serving a healthy qwen3-8b model. Stop the other model before retrying.");
}
export async function warmLlama() {
  await verifyLlama();
  const start = Date.now();
  const data = await json(`${llamaBase}/v1/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: llamaAlias, messages: [{ role: "user", content: 'Return {"ready":true}. /no_think' }], temperature: 0, max_tokens: 32, stream: false, chat_template_kwargs: { enable_thinking: false }, response_format: { type: "json_object", schema: { type: "object", properties: { ready: { const: true } }, required: ["ready"], additionalProperties: false } } }),
  }, 60000);
  if (JSON.parse(data.choices?.[0]?.message?.content || "null")?.ready !== true) throw new Error("Qwen structured warmup failed.");
  return Date.now() - start;
}
