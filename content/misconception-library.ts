import { misconceptionCodes, misconceptions } from "./curriculum";
import { correctionChallenges } from "./corrections";
// All fields are authored. Models select IDs; they never invent a counterexample.
export const misconceptionLibrary = misconceptionCodes.map((id) => ({
  id,
  skill: misconceptions[id].skill,
  description: misconceptions[id].description,
  incorrectBehavior: misconceptions[id].mistake,
  counterexample: correctionChallenges[id].question,
  representation: id.startsWith("FRACTION")
    ? "equal-whole comparison"
    : id.startsWith("MULTIPLICATION") ||
        id.includes("ARRAY") ||
        id.includes("GROUP") ||
        id.includes("COMMUTATIVITY")
      ? "equal-group array"
      : "base-ten places",
  idealCorrection: misconceptions[id].correction,
  minimumEvidence:
    "Choose the mathematically valid counterexample, then pass two independent transfer tasks. A prompted selection alone does not prove mastery.",
  easyProbe: correctionChallenges[id],
  transferProbe: misconceptions[id].intervention,
}));
