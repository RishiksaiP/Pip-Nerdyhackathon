import { skillState, nextMission, questProgress } from "../learning/model";
import { getSkill, skillForLesson } from "../../content/skills";
import {
  getLesson,
  misconceptions,
  type World,
} from "../../content/curriculum";
import { dimensions, nextAction } from "./engine";
import type { Session } from "../persistence/store";
export function buildReport(session: Session, world: World = "fractions") {
  const last = session.learning.findLast(
    (e) => getSkill(e.skillId)?.world === world && !e.seeded,
  );
  const skillId =
    session.run && getLesson(session.run.lessonId).world === world
      ? session.run.skillId
      : (last?.skillId ??
        skillForLesson(
          world === "fractions"
            ? "fraction-meaning"
            : world === "multiplication"
              ? "equal-groups"
              : "place-value",
        ));
  const skill = skillState(session.learning, skillId),
    state = skill.state,
    mission = nextMission(session.learning, world);
  const relevant = session.misconceptions.filter(
      (m) => misconceptions[m.code]?.skill === world,
    ),
    unresolved = relevant
      .filter((m) => !m.resolvedAt)
      .sort((a, b) => b.confidence - a.confidence),
    weakest = [...dimensions].sort((a, b) => state[a] - state[b])[0];
  const hasEvidence = session.evidence.some(
    (e) => getLesson(e.source.split("/")[0]).world === world,
  );
  const recommendation = unresolved[0]
    ? misconceptions[unresolved[0].code].intervention
    : world === "fractions"
      ? weakest === "explanation"
        ? "Ask the learner to compare 5/8 and 2/3 visually, then explain how they know."
        : weakest === "transfer"
          ? "Try 5/8 and 2/3 on a number line. Ask what stays the same when the picture changes."
          : "Ask the learner to compare 5/8 and 2/3 using a visual representation before calculating."
      : world === "multiplication"
        ? "Build four equal groups of three. Ask how the rows connect to multiplication."
        : "Build 302 with base-ten blocks. Ask what would change if the zero moved.";
  return {
    world,
    state,
    skillId,
    skill,
    mission,
    quest: questProgress(session.learning),
    overall: skill.overall,
    mastered: skill.mastered,
    hasEvidence,
    weakest,
    misconceptions: relevant,
    recommendation,
    observation: unresolved[0]
      ? `Evidence suggests: ${misconceptions[unresolved[0].code].description.toLowerCase()}.`
      : relevant.some((m) => m.resolvedAt)
        ? "The learner corrected Pip’s authored misconception using a visual representation."
        : hasEvidence
          ? "The learner is building evidence across construction, reasoning, correction, and transfer."
          : "No learning evidence yet. Start a discovery to see what the learner understands.",
    reason: hasEvidence
      ? `The ${weakest} dimension currently has the lowest confidence (${Math.round(state[weakest] * 100)}%). Check it with an unfamiliar example before moving on.`
      : "The 35% starting values are a neutral baseline, not a measured assessment.",
    nextAction: nextAction(state, relevant),
    activity: session.events
      .filter((e) => e.lessonId && getLesson(e.lessonId).world === world)
      .slice(-8)
      .reverse(),
  };
}
