import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runtimeDir, json } from "./local-runtime.mjs";
try {
  const state = JSON.parse(
    readFileSync(join(runtimeDir, "state.json"), "utf8"),
  );
  const health = await json(`http://127.0.0.1:${state.controlPort}/health`);
  if (health.instance !== state.instance)
    throw new Error("Launcher identity changed");
  const response = await fetch(`http://127.0.0.1:${state.controlPort}/stop`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.token}` },
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("Stop request rejected");
  const alive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  const deadline = Date.now() + 5000;
  while ((state.owned ?? []).some(alive) && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(
    (state.owned ?? []).some(alive)
      ? "Stop requested; a child is still shutting down. Check its terminal before restarting."
      : "Stopped Pip-owned processes. Existing services are left alone.",
  );
} catch {
  console.log(
    "No reachable Pip launcher. Use Ctrl+C in its terminal. No unrelated process was stopped.",
  );
}
