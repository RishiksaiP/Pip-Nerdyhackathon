import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const portable = join(homedir(), ".local/share/pip-tools/ollama/ollama");
const executable =
  process.env.PIP_OLLAMA_BIN || (existsSync(portable) ? portable : "ollama");
const child = spawn(executable, ["serve"], {
  stdio: "inherit",
  env: { ...process.env, OLLAMA_HOST: "127.0.0.1:11434", OLLAMA_NO_CLOUD: "1" },
});
child.on("error", () => {
  console.error("Install Ollama or set PIP_OLLAMA_BIN to its executable.");
  process.exitCode = 1;
});
child.on("exit", (code) => process.exit(code ?? 1));
