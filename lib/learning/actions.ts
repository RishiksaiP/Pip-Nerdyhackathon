import type { Session } from "../persistence/store";
import type { LearningEvidence } from "./model";
import { skillState } from "./model";
import { award } from "./progression";
export function recordLearning(
  session: Session,
  kind: LearningEvidence["kind"],
  result: LearningEvidence["result"],
  options: Partial<
    Pick<
      LearningEvidence,
      "concepts" | "misconceptions" | "confidence" | "representation"
    >
  > = {},
): Session {
  const run = session.run;
  if (!run) return session;
  const activityId = `${run.lessonId}-${kind}-${kind === "transfer" ? run.transferStep : 0}`;
  const id = `${run.id}:${activityId}:${result === "demonstrated" ? "success" : run.attempts}`;
  if (session.learning.some((e) => e.id === id)) return session;
  const evidence: LearningEvidence = {
    id,
    runId: run.id,
    skillId: run.skillId,
    at: new Date().toISOString(),
    kind,
    result,
    independent: run.hints === 0 && run.attempts === 0,
    hints: run.hints,
    attempts: run.attempts,
    activityId,
    representation:
      kind === "transfer"
        ? run.transferStep
          ? "context"
          : "number-line"
        : "visual",
    confidence: 1,
    concepts: [],
    misconceptions: [],
    seeded: false,
    ...options,
  };
  let next = {
    ...session,
    learning: [...session.learning, evidence].slice(-3000),
  };
  if (result === "demonstrated") {
    const key = `${run.skillId}:${kind}:${kind === "transfer" ? run.transferStep : kind === "retention" ? evidence.at.slice(0, 10) : 0}`;
    const xp =
      kind === "build"
        ? 10
        : kind === "explain"
          ? 20
          : kind === "repair"
            ? 50
            : kind === "retention"
              ? 30
              : run.transferStep
                ? 40
                : 35;
    const label =
      kind === "build"
        ? "Showed your idea"
        : kind === "explain"
          ? "Explained why"
          : kind === "repair"
            ? "Caught + corrected Pip"
            : kind === "retention"
              ? "Remembered it later"
              : evidence.independent
                ? "Independent proof"
                : "Practised a new picture";
    next = award(
      next,
      key,
      label,
      kind === "transfer" && !evidence.independent ? 10 : xp,
    );
    if (run.attempts > 0)
      next = award(next, `${run.skillId}:perseverance`, "Never gave up", 15);
    if (kind === "explain" && run.attempts > 0)
      next = award(
        next,
        `${run.skillId}:improved`,
        "Improved your explanation",
        10,
      );
  }
  return next;
}
export function recordReview(session: Session) {
  const run = session.run;
  if (!run?.review) return session;
  const state = skillState(session.learning, run.skillId);
  if (
    !state.masteredAt ||
    Date.now() - new Date(state.masteredAt).getTime() < 86400000
  )
    return session;
  const transfers = session.learning.filter(
    (e) => e.runId === run.id && e.kind === "transfer",
  );
  if (
    transfers.length < 2 ||
    transfers.some((e) => !e.independent || e.result !== "demonstrated")
  )
    return session;
  return recordLearning(session, "retention", "demonstrated", {
    representation: "delayed-transfer",
  });
}
