import { skillState } from "../learning/model";
import { award } from "../learning/progression";
import { getLesson, type MisconceptionCode } from "../../content/curriculum";
import { event, type Session } from "../persistence/store";
import {
  updateMastery,
  reliability,
  updateMisconception,
  type Dimension,
} from "./engine";
export function addEvidence(
  s: Session,
  dimension: Dimension,
  score: number,
  source: string,
): Session {
  const run = s.run;
  if (!run) return s;
  const lesson = getLesson(run.lessonId);
  const id = `${run.id}:${lesson.id}:${source}:${dimension}`;
  if (s.evidence.some((e) => e.id === id)) return s;
  const evidence = {
    id,
    dimension,
    score,
    reliability: reliability(run.hints, run.attempts),
    source: `${lesson.id}/${source}`,
    at: new Date().toISOString(),
  };
  return {
    ...s,
    evidence: [...s.evidence, evidence],
    mastery: {
      ...s.mastery,
      [lesson.world]: updateMastery(s.mastery[lesson.world], evidence),
    },
  };
}
export function observeMisconception(
  s: Session,
  code: MisconceptionCode,
  confidence: number,
  contradicted = false,
): Session {
  const existing = s.misconceptions.find((m) => m.code === code);
  return {
    ...s,
    misconceptions: [
      ...s.misconceptions.filter((m) => m.code !== code),
      updateMisconception(existing, code, confidence, contradicted),
    ],
  };
}
export function advance(s: Session, stage: number, _xp: number) {
  void _xp; // Kept for old callers; XP is issued only by evidence recording.
  if (!s.run || s.run.stage !== stage) return s;
  return {
    ...s,
    run: { ...s.run, stage: stage + 1, hints: 0, attempts: 0, feedback: "" },
  };
}
export function finish(s: Session) {
  if (!s.run || s.run.completed) return s;
  const lesson = getLesson(s.run.lessonId);
  let next = {
    ...s,
    completed: [...new Set([...s.completed, lesson.id])],
    run: { ...s.run, stage: 4, completed: true, feedback: "" },
  };
  const mastered = skillState(next.learning, s.run.skillId).mastered;
  if (mastered) {
    next = award(next, `${s.run.skillId}:mastery`, "Mastered a new concept", 50) as typeof next;
    if (next.learning.filter(e=>e.runId===s.run!.id).every(e=>e.hints===0 && e.attempts===0))
      next = award(next, `${s.run.skillId}:no-hint`, "No-clue mastery", 10) as typeof next;
  }
  return event(
    next,
    mastered ? "mastery_achieved" : "discovery_saved",
    lesson.id,
  );
}
