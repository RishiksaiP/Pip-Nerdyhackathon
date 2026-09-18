import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
export const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const runtimeDir = join(root, ".pip-run");
export const toolDir = join(homedir(), ".local/share/pip-tools");
export function loadEnv() {
  try {
    process.loadEnvFile(join(root, ".env"));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
export function tool(name, args = ["--version"]) {
  const r = spawnSync(name, args, {
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  return r.status === 0 ? (r.stdout || r.stderr).trim() : null;
}
export function ollamaBinary() {
  const p = join(
    toolDir,
    "ollama",
    process.platform === "win32" ? "ollama.exe" : "ollama",
  );
  return process.env.PIP_OLLAMA_BIN || (existsSync(p) ? p : "ollama");
}
export function pythonBinary() {
  return (
    process.env.PIP_PYTHON ||
    (process.platform === "win32" ? "python" : "python3")
  );
}
export function speechConfig() {
  const p = join(toolDir, "whisper", "whisper-cli.exe");
  return {
    binary: process.env.PIP_WHISPER_CLI || (existsSync(p) ? p : "whisper-cli"),
    model:
      process.env.PIP_WHISPER_MODEL ||
      join(toolDir, "models", "ggml-base.en.bin"),
  };
}
export async function json(url, options = {}, timeout = 2000) {
  const u = new URL(url);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))
    throw new Error("Only loopback services are supported");
  const r = await fetch(url, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function available(url) {
  try {
    return await json(url);
  } catch {
    return null;
  }
}
export async function waitFor(url, seconds = 20) {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const r = await available(url);
    if (r) return r;
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Service did not become ready: ${url}`);
}
export async function warmModel() {
  const started = Date.now();
  const data = await json(
    "http://127.0.0.1:11434/api/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:8b",
        think: false,
        stream: false,
        keep_alive: "60m",
        options: { temperature: 0, num_ctx: 4096, num_predict: 30 },
        format: {
          type: "object",
          additionalProperties: false,
          properties: { ready: { type: "boolean", enum: [true] } },
          required: ["ready"],
        },
        messages: [
          { role: "user", content: 'Return {"ready":true}. /no_think' },
        ],
      }),
    },
    60000,
  );
  if (JSON.parse(data.message?.content ?? "null")?.ready !== true)
    throw new Error("Structured warmup failed");
  return Date.now() - started;
}
export function fingerprint() {
  const hash = createHash("sha256");
  function walk(p) {
    if (!existsSync(p)) return;
    for (const e of readdirSync(p, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const f = join(p, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.isFile()) {
        hash.update(f.slice(root.length));
        hash.update(readFileSync(f));
      }
    }
  }
  for (const p of ["app", "components", "content", "lib", "public", "build"])
    walk(join(root, p));
  for (const p of [
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
  ])
    if (existsSync(join(root, p))) hash.update(readFileSync(join(root, p)));
  return hash.digest("hex");
}
