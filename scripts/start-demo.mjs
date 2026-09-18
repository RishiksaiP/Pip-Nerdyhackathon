import { createServer as createNetServer } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { createServer } from "node:http";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { llamaConfig, warmLlama, verifyLlama, llamaBase } from "./llamacpp-runtime.mjs";
import {
  root,
  runtimeDir,
  loadEnv,
  ollamaBinary,
  pythonBinary,
  speechConfig,
  tool,
  available,
  waitFor,
  warmModel,
  fingerprint,
  json,
} from "./local-runtime.mjs";
process.chdir(root);
loadEnv();
const args = process.argv.slice(2),
  safe = args.includes("--safe"),
  noOpen = args.includes("--no-open");
const strict = !safe && !args.includes("--ollama") && (args.includes("--strict") || process.env.PIP_STRICT_LOCAL_AI === "true");
const provider = safe ? "demo" : args.includes("--ollama") ? "ollama" : "llamacpp";
if (strict && provider !== "llamacpp") throw new Error("Strict verification requires llama.cpp.");
const portIndex = args.indexOf("--port");
const port = portIndex < 0 ? 3176 : Number(args[portIndex + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Use a port between 1024 and 65535.");
const base = `http://localhost:${port}`,
  owned = [],
  instance = randomUUID(),
  token = randomBytes(24).toString("hex");
mkdirSync(runtimeDir, { recursive: true });
const statePath = join(runtimeDir, "state.json");
if (existsSync(statePath)) {
  let old;
  try {
    old = JSON.parse(readFileSync(statePath, "utf8"));
  } catch {}
  const health = old
    ? await available(`http://127.0.0.1:${old.controlPort}/health`)
    : null;
  if (health?.product === "pip-launcher" && health.instance === old.instance) {
    console.log(
      `Pip launcher is already running. ${old.url}\nUse npm run stop:demo before changing modes.`,
    );
    process.exit(0);
  }
  unlinkSync(statePath);
}
const lockPath = join(runtimeDir, "start.lock");
let ownsLock = false;
let closing = false,
  control;
async function stop(code = 0) {
  if (closing) return;
  process.exitCode = code;
  closing = true;
  for (const child of owned.reverse()) {
    try {
      if (process.platform === "win32")
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      else process.kill(-child.pid, "SIGTERM");
    } catch {}
  }
  control?.close();
  if (ownsLock) {
    try {
      unlinkSync(lockPath);
    } catch {}
  }
  try {
    const s = JSON.parse(readFileSync(statePath, "utf8"));
    if (s.instance === instance) unlinkSync(statePath);
  } catch {}
  console.log(
    "\nPip stopped. Pre-existing local AI/speech services were left running.",
  );
  setTimeout(() => process.exit(code), 200).unref();
}
function start(name, cmd, argv, env = {}) {
  const log = openSync(join(runtimeDir, `${name}.log`), "a");
  const child = spawn(cmd, argv, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", log, log],
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  closeSync(log);
  owned.push(child);
  child.on("error", (e) => {
    console.error(`${name}: ${e.message}`);
    void stop(1);
  });
  child.on("exit", (code) => {
    if (!closing && code !== null && name === "app") {
      console.error("App stopped. See .pip-run/app.log");
      void stop(1);
    }
  });
  return child;
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
try {
  console.log("PIP — Waking up the observatory…");
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(lockPath, "wx");
      writeFileSync(fd, String(process.pid));
      closeSync(fd);
      ownsLock = true;
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const pid = Number(readFileSync(lockPath, "utf8"));
      let alive = false;
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
          alive = true;
        } catch (error) {
          alive = error.code !== "ESRCH";
        }
      }
      if (alive)
        throw new Error(
          "Another Pip launcher is starting. Wait for its ready message.",
        );
      unlinkSync(lockPath);
    }
  }
  if (!ownsLock)
    throw new Error("Another Pip launcher is starting. Try again shortly.");
  if (await available(`${base}/api/health`))
    throw new Error(
      `Port ${port} already serves an app. Stop its terminal, or use --port 3177. No process was killed.`,
    );
  const portFree = await new Promise((resolve) => {
    const probe = createNetServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
  if (!portFree)
    throw new Error(
      `Port ${port} is busy. Stop its terminal or use --port 3177. No process was killed.`,
    );
  const sourceHash = fingerprint(),
    stamp = join(root, ".next/pip-source.sha256");
  if (!existsSync(stamp) || readFileSync(stamp, "utf8") !== sourceHash) {
    console.log("Preparing the production app…");
    const r = spawnSync(
      process.execPath,
      ["node_modules/next/dist/bin/next", "build"],
      { cwd: root, stdio: "inherit", env: process.env },
    );
    if (r.status !== 0)
      throw new Error(
        "Production build failed. Run npm ci, then npm run build:vercel.",
      );
    writeFileSync(stamp, sourceHash);
  }
  let local = false,
    speech = false,
    warmMs = null;
  if (!safe) {
    if (provider === "llamacpp") {
      if (await available(`${llamaBase}/health`)) {
        await verifyLlama();
        console.log("Reusing the healthy qwen3-8b server on loopback port 8080.");
      } else {
        const free = await new Promise((resolve) => {
          const probe = createNetServer();
          probe.once("error", () => resolve(false));
          probe.listen(8080, "127.0.0.1", () => probe.close(() => resolve(true)));
        });
        if (!free) throw new Error("Port 8080 is busy or the model is still loading. No duplicate server was started; wait or stop its owner.");
        const cfg = llamaConfig();
        console.log(`Starting llama.cpp\nModel: ${cfg.model}\nSize: ${cfg.bytes} bytes\nAPI: ${llamaBase}/v1`);
        start("llamacpp", cfg.binary, cfg.args);
        await waitFor(`${llamaBase}/health`, 300);
      }
      warmMs = await warmLlama();
      local = true;
    } else {
    let tags = await available("http://127.0.0.1:11434/api/tags");
    if (!tags && tool(ollamaBinary())) {
      console.log("Starting Ollama…");
      start("ollama", ollamaBinary(), ["serve"], {
        OLLAMA_HOST: "127.0.0.1:11434",
        OLLAMA_NO_CLOUD: "1",
        OLLAMA_MAX_LOADED_MODELS: "1",
      });
      tags = await waitFor("http://127.0.0.1:11434/api/tags").catch(() => null);
    }
    if (tags?.models?.some((m) => m.name === "qwen3:8b")) {
      console.log("Warming Qwen3-8B and checking structured output…");
      try {
        warmMs = await warmModel();
        local = true;
      } catch {
        console.log("WARNING: Qwen warmup failed. Authored fallback is ready.");
      }
    } else
      console.log(
        "WARNING: Local model missing. Install Ollama, then ollama pull qwen3:8b (5.2 GB).",
      );
    }
    const config = speechConfig();
    let health = await available("http://127.0.0.1:8178/health");
    if (
      !health &&
      (process.env.PIP_SPEECH_ENGINE === "faster-whisper" ? existsSync(process.env.PIP_FASTER_WHISPER_MODEL || "") : existsSync(config.model)) &&
      tool(pythonBinary()) &&
      (process.env.PIP_SPEECH_ENGINE === "faster-whisper" ? tool(pythonBinary(), ["-c", "import faster_whisper; print('ready')"]) : tool(config.binary, ["--help"]))
    ) {
      start("speech", pythonBinary(), ["scripts/speech-server.py"], {
        PIP_WHISPER_MODEL: config.model,
        PIP_WHISPER_CLI: config.binary,
      });
      health = await waitFor("http://127.0.0.1:8178/health").catch(() => null);
    }
    if (health?.available) {
      console.log("Warming local speech…");
      try {
        const result = await json(
          "http://127.0.0.1:8178/warmup",
          { method: "POST" },
          30000,
        );
        speech = result.available === true;
      } catch {
        console.log(
          "WARNING: Speech warmup unavailable. Typed teaching is ready.",
        );
      }
    }
  }
  console.log("Opening the notebook…");
  start(
    "app",
    process.execPath,
    [
      ...(args.includes("--offline")
        ? ["--import", "./scripts/offline-guard.mjs"]
        : []),
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      PIP_INSTANCE_ID: instance,
      AI_PROVIDER: provider,
      LLAMACPP_BASE_URL: `${llamaBase}/v1`,
      LLAMACPP_MODEL: "qwen3-8b",
      PIP_STRICT_LOCAL_AI: String(strict),
      AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS || "15000",
      LOCAL_AI_MODEL: "qwen3:8b",
      LOCAL_AI_QUALITY_MODEL: "qwen3:14b",
      ALLOW_CLOUD_FALLBACK: "false",
      AI_FALLBACK_PROVIDER: "none",
      DEMO_MODE: safe ? "true" : "false",
    },
  );
  const health = await waitFor(`${base}/api/health`, 30);
  if (health.instance !== instance || health.cloudAllowed)
    throw new Error("Unexpected app process or cloud policy.");
  if (!safe && provider === "llamacpp") {
    const proof = await json(`${base}/api/explanation/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: "fraction-meaning", explanation: "The whole has four equal pieces and we use three.", settings: { provider: "llamacpp", quality: false } }) }, 65000);
    if (proof.trace?.provider !== "llamacpp" || proof.trace.fallback || !proof.trace.schemaValid || proof.analysis?.status !== "correct") throw new Error("Pip backend did not verify live Qwen inference. See .pip-run/app.log.");
    console.log(`Pip backend -> llama.cpp -> Qwen: PASS (${proof.latencyMs} ms; schema valid)`);
  }
  const url = `${base}/demo?presentation=1&reset=1&provider=${provider}`;
  control = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ product: "pip-launcher", instance }));
      return;
    }
    const supplied = Buffer.from(req.headers.authorization ?? "");
    const wanted = Buffer.from(`Bearer ${token}`);
    if (
      req.method !== "POST" ||
      req.url !== "/stop" ||
      supplied.length !== wanted.length ||
      !timingSafeEqual(supplied, wanted)
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.end("Stopping Pip");
    void stop();
  });
  await new Promise((resolve) => control.listen(0, "127.0.0.1", resolve));
  writeFileSync(
    statePath,
    JSON.stringify({
      instance,
      controlPort: control.address().port,
      token,
      url,
      mode: safe ? "safe" : "live",
      provider,
      strict,
      owned: owned.map((c) => c.pid),
    }),
    { mode: 0o600 },
  );
  console.log(
    `\n=========================================\nPIP IS READY\n=========================================\nApp / demo: ${url}\nObservatory: ${base}/pip\nTechnical Lab: ${base}/lab\nBackend: ${base}/api/health — Healthy\nLocal AI (${provider}): ${local ? `Qwen3-8B — Local — Ready (${warmMs} ms warmup)` : safe ? "Authored demo selected" : "Unavailable; authored fallback active"}\nWhisper: ${speech ? "Local — Warm" : "Typed teaching ready"}\nCloud: OFF\nPress Ctrl+C or run npm run stop:demo to stop owned processes.\n=========================================`,
  );
  if (!noOpen) {
    const cmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "rundll32"
          : "xdg-open";
    const argv =
      process.platform === "win32"
        ? ["url.dll,FileProtocolHandler", url]
        : [url];
    const opener = spawn(cmd, argv, { stdio: "ignore", windowsHide: true });
    opener.on("error", () => console.log(`Open ${url} in your browser.`));
    opener.unref();
  }
} catch (e) {
  console.error(`NOT READY: ${e.message}`);
  await stop(1);
}
