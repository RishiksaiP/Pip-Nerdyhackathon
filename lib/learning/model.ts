import { z } from "zod";
import { skills, getSkill, implementedSkills } from "../../content/skills";
import type { World } from "../../content/curriculum";
export const learningEvidenceSchema = z.object({
  id: z.string(),
  runId: z.string(),
  skillId: z.string().refine((id) => !!getSkill(id)),
  at: z.string().datetime(),
  kind: z.enum(["build", "explain", "repair", "transfer", "retention"]),
  result: z.enum(["demonstrated", "developing", "not_yet"]),
  independent: z.boolean(),
  hints: z.number().int().min(0).max(3),
  attempts: z.number().int().nonnegative(),
  representation: z.string().max(60),
  activityId: z.string().max(100),
  confidence: z.number().min(0).max(1),
  concepts: z.array(z.string().max(60)).max(12),
  misconceptions: z.array(z.string().max(80)).max(4),
  seeded: z.boolean().default(false),
});
export type LearningEvidence = z.infer<typeof learningEvidenceSchema>;
export const learningSchema = z
  .array(learningEvidenceSchema)
  .max(3000)
  .default([]);
export function skillState(
  events: LearningEvidence[],
  skillId: string,
  now = Date.now(),
) {
  const relevant = events.filter((e) => e.skillId === skillId);
  const state = {
    procedural: 0.35,
    conceptual: 0.35,
    explanation: 0.35,
    correction: 0.35,
    transfer: 0.35,
    retention: 0.35,
  };
  const independentTransfers = new Set<string>();
  let masteredAt: string | undefined;
  let lastReview: string | undefined;
  let reviews = 0;
  function passed() {
    return (
      score() >= 0.82 &&
      state.conceptual >= 0.75 &&
      state.transfer >= 0.8 &&
      state.correction >= 0.7 &&
      state.explanation >= 0.7 &&
      independentTransfers.size >= 2
    );
  }
  function score() {
    return (
      state.procedural * 0.15 +
      state.conceptual * 0.25 +
      state.correction * 0.2 +
      state.transfer * 0.3 +
      state.retention * 0.1
    );
  }
  for (const e of relevant) {
    const value =
      e.result === "demonstrated" ? 1 : e.result === "developing" ? 0.5 : 0.1;
    const reliability =
      ([1, 0.9, 0.75, 0.55][e.hints] ?? 0.55) *
      Math.max(0.35, 1 - e.attempts * 0.13) *
      Math.max(0.4, e.confidence);
    const keys: eKey[] =
      e.kind === "build"
        ? ["procedural", "conceptual"]
        : e.kind === "explain"
          ? ["conceptual", "explanation"]
          : e.kind === "repair"
            ? ["correction"]
            : e.kind === "transfer"
              ? ["transfer"]
              : ["retention"];
    for (const key of keys)
      state[key] +=
        (value < 0.5 ? 0.3 : 0.45) * reliability * (value - state[key]);
    if (
      e.kind === "transfer" &&
      e.result === "demonstrated" &&
      e.independent &&
      e.hints === 0 &&
      e.attempts === 0 &&
      e.confidence >= 0.7
    )
      independentTransfers.add(e.activityId);
    if (
      e.kind === "retention" &&
      e.result === "demonstrated" &&
      e.independent
    ) {
      lastReview = e.at;
      reviews++;
    }
    if (!masteredAt && passed()) masteredAt = e.at;
  }
  type eKey = keyof typeof state;
  const mastered = passed(),
    anchor = lastReview || masteredAt;
  const dueAt = anchor
    ? new Date(
        new Date(anchor).getTime() + [1, 3, 7][Math.min(reviews, 2)] * 86400000,
      ).toISOString()
    : null;
  return {
    state,
    overall: score(),
    mastered,
    independentTransfers: independentTransfers.size,
    events: relevant,
    masteredAt,
    dueAt,
    reviewDue: !!dueAt && new Date(dueAt).getTime() <= now,
    hints: relevant.reduce((n, e) => n + e.hints, 0),
    independence: relevant.filter((e) => !e.seeded).length
      ? relevant.filter((e) => e.independent && !e.seeded).length /
        relevant.filter((e) => !e.seeded).length
      : 0,
    status: mastered
      ? "mastered"
      : score() >= 0.55
        ? "developing"
        : "needs reinforcement",
  };
}
export function canStart(events: LearningEvidence[], skillId: string) {
  const s = getSkill(skillId);
  return !!s && s.prerequisites.every((id) => skillState(events, id).mastered);
}
export function skillStatus(
  events: LearningEvidence[],
  skillId: string,
  now = Date.now(),
) {
  const state = skillState(events, skillId, now);
  if (state.reviewDue) return "review due";
  if (state.mastered) return "mastered";
  if (state.events.length) return "developing";
  return canStart(events, skillId) ? "ready" : "locked";
}
export function nextMission(
  events: LearningEvidence[],
  world?: World,
  now = Date.now(),
) {
  const candidates = skills.filter(
    (s) => (!world || s.world === world) && implementedSkills.has(s.id),
  );
  const due = candidates.find((s) => skillState(events, s.id, now).reviewDue);
  if (due)
    return {
      skill: due,
      review: true,
      reason:
        "A spaced review is due. See what still travels to a new problem.",
      child: "Pip wants to remember what you taught.",
    };
  const ready = candidates.filter((s) => canStart(events, s.id));
  const unresolved = ready.find((s) => {
    const e = events.filter((e) => e.skillId === s.id);
    const lastRepair = e.findLast((e) => e.kind === "repair");
    return (
      e.some((e) => e.misconceptions.length) &&
      lastRepair?.result !== "demonstrated"
    );
  });
  const weak = ready.find(
    (s) =>
      !skillState(events, s.id).mastered &&
      skillState(events, s.id).events.length,
  );
  const skill =
    unresolved ||
    weak ||
    ready.find(
      (s) =>
        s.id === "equivalent_fractions" && !skillState(events, s.id).mastered,
    ) ||
    ready.find((s) => !skillState(events, s.id).mastered) ||
    candidates[0];
  return {
    skill,
    review: false,
    reason: unresolved
      ? "An unresolved misconception needs a visual counterexample."
      : weak
        ? "A little more independent evidence will strengthen this idea."
        : `The prerequisites for ${skill.title.toLowerCase()} are ready.`,
    child: unresolved
      ? "Help Pip untangle an idea."
      : `Teach Pip ${skill.title.toLowerCase()}.`,
  };
}
export function questProgress(events: LearningEvidence[], now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10),
    daily = events.filter(
      (e) => !e.seeded && e.at.startsWith(today) && e.result === "demonstrated",
    );
  const tasks = [
    daily.some((e) => e.kind === "explain"),
    daily.some((e) => e.kind === "repair"),
    daily.some((e) => e.kind === "transfer" || e.kind === "retention"),
  ];
  const days = new Set(
    events
      .filter((e) => !e.seeded && e.result === "demonstrated")
      .map((e) => e.at.slice(0, 10)),
  );
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const day = new Date(now - i * 86400000).toISOString().slice(0, 10);
    if (days.has(day)) streak++;
    else if (i > 0 || days.has(today)) break;
  }
  return { tasks, count: tasks.filter(Boolean).length, streak };
}
export function seedLearning(now = Date.now()): LearningEvidence[] {
  const result: LearningEvidence[] = [];
  for (const skill of [
    "equal_partitioning",
    "identify_fraction",
    "numerator_denominator_meaning",
    "fraction_magnitude",
  ]) {
    for (let round = 0; round < 4; round++)
      for (const kind of [
        "build",
        "explain",
        "repair",
        "transfer",
        "retention",
      ] as const) {
        if (skill === "fraction_magnitude" && round > 1) continue;
        result.push({
          id: `seed-${skill}-${round}-${kind}`,
          runId: "seeded-history",
          skillId: skill,
          at: new Date(
            now -
              86400000 * (skill === "fraction_magnitude" ? 1 : 0.2) +
              round * 1000,
          ).toISOString(),
          kind,
          result: "demonstrated",
          independent: skill !== "fraction_magnitude",
          hints: 0,
          attempts: 0,
          representation: "seeded-history",
          activityId: `seed-${round}-${kind}`,
          confidence: 1,
          concepts: [],
          misconceptions: [],
          seeded: true,
        });
      }
  }
  return result;
}
