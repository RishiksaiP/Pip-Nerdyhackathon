import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { platform, release, totalmem } from "node:os";
import { verifyLlama, warmLlama } from "./llamacpp-runtime.mjs";
import {
  root,
  loadEnv,
  tool,
  ollamaBinary,
  pythonBinary,
  speechConfig,
  available,
  warmModel,
} from "./local-runtime.mjs";
process.chdir(root);
loadEnv();
const checks = [];
const report = (name, status, detail) => {
  checks.push({ name, status, detail });
  console.log(`${status.padEnd(7)} ${name}: ${detail}`);
};
console.log("PIP RELEASE DOCTOR\n==================");
report(
  "System",
  "PASS",
  `${platform()} ${release()} · ${Math.round(totalmem() / 1073741824)} GB RAM`,
);
const [major, minor] = process.versions.node.split(".").map(Number);
report(
  "Node",
  major > 22 || (major === 22 && minor >= 13) ? "PASS" : "FAIL",
  `${process.version}; requires 22.13+`,
);
report(
  "npm",
  tool(process.execPath, [
    process.env.npm_execpath ||
      join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    "--version",
  ]) || tool("npm")
    ? "PASS"
    : "WARNING",
  "Bundled with Node; npm ci installs the lockfile",
);
report(
  "Python",
  tool(pythonBinary()) ? "PASS" : "WARNING",
  tool(pythonBinary()) || "Install Python 3.10+ for optional speech",
);
report(
  "App dependencies",
  existsSync("node_modules/next/package.json") ? "PASS" : "FAIL",
  "Frontend and backend share this project; fix: npm ci",
);
report(
  "Persistence",
  "PASS",
  "Device-local browser storage; no database migration or service required",
);
report(
  "Demo seed",
  existsSync("lib/learning/model.ts") ? "PASS" : "FAIL",
  "Reset with /demo?reset=1",
);
report(
  "Production",
  existsSync(".next/BUILD_ID") ? "PASS" : "WARNING",
  "The launcher builds automatically when sources change",
);
report(
  "Environment",
  existsSync(".env") ? "PASS" : "WARNING",
  ".env optional; launcher always forces cloud OFF; values/secrets are not printed",
);
report(
  "Ollama binary",
  tool(ollamaBinary()) ? "PASS" : "WARNING",
  tool(ollamaBinary()) ||
    "Install https://ollama.com/download/windows; reopen terminal",
);
const tags = await available("http://127.0.0.1:11434/api/tags"),
  version = await available("http://127.0.0.1:11434/api/version");
report(
  "Ollama service",
  tags ? "PASS" : "WARNING",
  version?.version || "Start Ollama or run npm run start:demo",
);
const fast = tags?.models?.find((m) => m.name === "qwen3:8b"),
  quality = tags?.models?.find((m) => m.name === "qwen3:14b");
report(
  "Fast model",
  fast ? "PASS" : "WARNING",
  fast
    ? `${fast.name} · ${fast.details?.quantization_level} · ${(fast.size / 1e9).toFixed(2)} GB`
    : "Run ollama pull qwen3:8b (5.2 GB)",
);
report(
  "Quality model",
  quality ? "PASS" : "WARNING",
  quality
    ? "qwen3:14b installed"
    : "Optional, not needed. ollama pull qwen3:14b (9.3 GB)",
);
const gpu = tool("nvidia-smi", [
  "--query-gpu=name,memory.total,driver_version",
  "--format=csv,noheader",
]);
report(
  "GPU",
  gpu ? "PASS" : platform() === "darwin" ? "PASS" : "WARNING",
  gpu ||
    (platform() === "darwin"
      ? "Apple system: inspect Ollama placement below; no dedicated VRAM pool"
      : "NVIDIA tooling unavailable; CPU fallback may be slower"),
);
let structured = false;
if (process.env.AI_PROVIDER === "llamacpp" && !process.argv.includes("--quick")) {
  try {
    await verifyLlama();
    const ms = await warmLlama();
    structured = true;
    report("Structured inference", "PASS", `Real llama.cpp / Qwen3-8B JSON response · ${ms} ms`);
  } catch(e) { report("Structured inference", "WARNING", `${e.message}; run npm run start:demo`); }
} else if (fast && !process.argv.includes("--quick")) {
  try {
    const ms = await warmModel();
    structured = true;
    report(
      "Structured inference",
      "PASS",
      `Real qwen3:8b JSON response · ${ms} ms`,
    );
  } catch (e) {
    report(
      "Structured inference",
      "WARNING",
      `${e.message}; run npm run start:demo -- --safe if needed`,
    );
  }
} else
  report(
    "Structured inference",
    "WARNING",
    "Not run (--quick or missing model)",
  );
const ps = await available("http://127.0.0.1:11434/api/ps");
for (const m of ps?.models ?? [])
  report(
    "Model placement",
    "PASS",
    `${m.name}: ${(m.size / 1e9).toFixed(2)} GB total / ${(m.size_vram / 1e9).toFixed(2)} GB GPU; context ${m.context_length}`,
  );
const speech = speechConfig(),
  sh = await available("http://127.0.0.1:8178/health");
report(
  "Whisper files",
  (process.env.PIP_SPEECH_ENGINE === "faster-whisper"
    ? existsSync(join(process.env.PIP_FASTER_WHISPER_MODEL || "", "model.bin")) && !!tool(pythonBinary(),["-c","import faster_whisper; print('ready')"])
    : existsSync(speech.model) && !!tool(speech.binary, ["--help"]))
    ? "PASS"
    : "WARNING",
  process.env.PIP_SPEECH_ENGINE === "faster-whisper" ? "Pinned Python environment and base.en; repair: scripts/setup-faster-whisper.ps1" : "whisper.cpp; repair: scripts/setup-speech.ps1; typing remains available",
);
report(
  "Speech service",
  sh?.available ? "PASS" : "WARNING",
  sh?.available
    ? `${sh.engine} / ${sh.model} / ${sh.device ?? "automatic"} / ${sh.warm ? "warm" : "warmup pending"}`
    : "Start with npm run start:demo",
);
const app = await available("http://localhost:3176/api/health");
report(
  "App port 3176",
  app?.product === "pip" ? "PASS" : "WARNING",
  app
    ? "Frontend/backend responding"
    : "Launcher will start the app; use --port if occupied",
);
console.log(
  "\n" +
    (checks.some((c) => c.status === "FAIL")
      ? "NOT READY — fix FAIL items above"
      : structured
        ? "READY FOR LIVE DEMO" + (sh?.available ? "" : " — use typed teaching")
        : "READY FOR AUTHORED DEMO — live AI needs attention"),
);
if (process.argv.includes("--json")) console.log(JSON.stringify(checks));
if (checks.some((c) => c.status === "FAIL")) process.exitCode = 1;
