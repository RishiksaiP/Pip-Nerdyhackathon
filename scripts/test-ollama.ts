import { writeFileSync } from "node:fs";
import { evaluateExplanation, evaluateCorrection } from "../lib/ai/gateway";
const results = [];
for (const [name, text, correct] of [
  [
    "Moonberry explanation",
    "They are the same size bottle. More equal pieces make each piece smaller.",
    true,
  ],
  [
    "Misconception",
    "One eighth is bigger than one fourth because eight is bigger than four.",
    false,
  ],
] as const) {
  const result = await evaluateExplanation("moonberry-mix-up", text, {
    provider: "ollama",
    quality: false,
  });
  if (
    result.trace.fallback ||
    result.trace.provider !== "ollama" ||
    !result.trace.schemaValid ||
    (result.analysis.status === "correct") !== correct
  )
    throw new Error(name + " failed");
  results.push({ name, status: result.analysis.status, trace: result.trace });
  console.log(name + " PASS " + result.latencyMs + "ms");
}
const correction = await evaluateCorrection(
  "moonberry-mix-up",
  "More equal pieces of the same whole make each piece smaller.",
  "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE",
  { provider: "ollama", quality: false },
);
if (!correction.accepted || correction.trace.fallback) {
  console.log(JSON.stringify(correction));
  throw new Error("Correction failed");
}
results.push({
  name: "Correction",
  status: "accepted",
  trace: correction.trace,
});
writeFileSync(
  "artifacts/live-ai/ollama.json",
  JSON.stringify(
    { generatedAt: new Date().toISOString(), syntheticOnly: true, results },
    null,
    2,
  ),
);
console.log("Ollama correction PASS");
