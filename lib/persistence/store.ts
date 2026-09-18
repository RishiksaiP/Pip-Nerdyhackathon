import { z } from "zod";
import { progressionSchema } from "../learning/progression";
import {
  learningSchema,
  seedLearning,
  type LearningEvidence,
} from "../learning/model";
import {
  aiSettingsSchema,
  defaultAISettings,
  type AISettings,
} from "../ai/settings";
import { skillForLesson, getSkill } from "../../content/skills";
import {
  baseline,
  dimensions,
  type MasteryState,
  type Evidence,
  type MisconceptionState,
} from "../mastery/engine";
import {
  lessons,
  misconceptionCodes,
  getLesson,
  type World,
} from "../../content/curriculum";
export type Event = {
  id: string;
  name: string;
  at: string;
  lessonId?: string;
  detail?: string;
  latencyMs?: number;
};
export type Run = {
  id: string;
  skillId: string;
  review: boolean;
  probeCode?: (typeof misconceptionCodes)[number];
  notebookOpen: boolean;
  transferStep: number;
  transferLine: number;
  lessonId: string;
  stage: number;
  selected: number[];
  line: number;
  rows: number;
  columns: number;
  hundreds: number;
  tens: number;
  ones: number;
  hints: number;
  attempts: number;
  correctionRevealed: boolean;
  completed: boolean;
  feedback: string;
};
export type Session = {
  progression: z.infer<typeof progressionSchema>;
  version: 1;
  learning: LearningEvidence[];
  aiSettings: AISettings;
  id: string;
  demo: boolean;
  seed?: string;
  xp: number;
  mastery: Record<World, MasteryState>;
  misconceptions: MisconceptionState[];
  evidence: Evidence[];
  events: Event[];
  completed: string[];
  run: Run | null;
  sound: boolean;
  voiceConsent: boolean;
};
export const freshRun = (
  lessonId: string,
  skillId = skillForLesson(lessonId),
  review = false,
): Run => ({
  id: crypto.randomUUID(),
  skillId,
  review,
  notebookOpen: false,
  transferStep: 0,
  transferLine: 0,
  lessonId,
  stage: 0,
  selected: [],
  line: 0,
  rows: 1,
  columns: 1,
  hundreds: 0,
  tens: 0,
  ones: 0,
  hints: 0,
  attempts: 0,
  correctionRevealed: false,
  completed: false,
  feedback: "",
});
export function freshSession(demo = false): Session {
  return {
    version: 1,
    learning: demo ? seedLearning() : [],
    aiSettings: defaultAISettings,
    id: globalThis.crypto?.randomUUID?.() ?? `anon-${Date.now()}`,
    demo,
    ...(demo ? { seed: "hackathon-demo-v1" } : {}),
    xp: demo ? 450 : 0,
    progression: {awards:[],equipped:demo ? "compass" : null,chosen:[],celebratedLevel:demo ? 4 : 1},
    mastery: {
      fractions: baseline(demo ? 0.78 : 0.35),
      multiplication: baseline(),
      "place-value": baseline(),
    },
    misconceptions: [],
    evidence: [],
    events: [
      {
        id: "session-start",
        name: "session_started",
        at: new Date().toISOString(),
        detail: demo
          ? "Demonstration with seeded 78% prior evidence and 450 prior journey XP (Level 4)"
          : "Anonymous local session",
      },
    ],
    completed: [],
    run: null,
    sound: false,
    voiceConsent: false,
  };
}
const boundedInteger = (max: number) => z.number().int().min(0).max(max);
const lessonId = z
  .string()
  .refine((id) => lessons.some((lesson) => lesson.id === id));
const mastery = z.object(
  Object.fromEntries(
    dimensions.map((k) => [k, z.number().min(0).max(1)]),
  ) as Record<(typeof dimensions)[number], z.ZodNumber>,
);
const runSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    skillId: z
      .string()
      .refine((id) => !!getSkill(id))
      .optional(),
    review: z.boolean().default(false),
    probeCode: z.enum(misconceptionCodes).optional(),
    notebookOpen: z.boolean().default(false),
    transferStep: boundedInteger(1).default(0),
    transferLine: boundedInteger(16).default(0),
    lessonId,
    stage: boundedInteger(4),
    selected: z.array(boundedInteger(7)).max(8),
    line: boundedInteger(3),
    rows: boundedInteger(5),
    columns: boundedInteger(5),
    hundreds: boundedInteger(4),
    tens: boundedInteger(4),
    ones: boundedInteger(4),
    hints: boundedInteger(3),
    attempts: z.number().int().nonnegative(),
    correctionRevealed: z.boolean(),
    completed: z.boolean(),
    feedback: z.string().max(500),
  })
  .transform((run) => ({
    ...run,
    skillId: run.skillId ?? skillForLesson(run.lessonId),
  }))
  .refine(
    (run) =>
      new Set(run.selected).size === run.selected.length &&
      run.selected.every((n) => n < getLesson(run.lessonId).target.d),
  );
export const sessionSchema = z.object({
  progression: progressionSchema,
  version: z.literal(1),
  learning: learningSchema,
  aiSettings: aiSettingsSchema.default(defaultAISettings),
  id: z.string(),
  demo: z.boolean(),
  seed: z.string().optional(),
  xp: z.number().int().nonnegative(),
  mastery: z.object({
    fractions: mastery,
    multiplication: mastery,
    "place-value": mastery,
  }),
  completed: z.array(lessonId),
  evidence: z.array(
    z.object({
      id: z.string(),
      dimension: z.enum(dimensions),
      score: z.number().min(0).max(1),
      reliability: z.number().min(0).max(1),
      source: z.string(),
      at: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      at: z.string(),
      lessonId: lessonId.optional(),
      detail: z.string().optional(),
      latencyMs: z.number().nonnegative().optional(),
    }),
  ),
  misconceptions: z.array(
    z.object({
      code: z.enum(misconceptionCodes),
      confidence: z.number().min(0).max(1),
      observations: z.number().int().nonnegative(),
      resolvedAt: z.string().optional(),
    }),
  ),
  run: runSchema.nullable(),
  sound: z.boolean(),
  voiceConsent: z.boolean(),
});
export interface Repository {
  load(): Session;
  save(s: Session): boolean;
  clear(): void;
}
const KEY = "pip-session-v1";
export const localRepository: Repository = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshSession();
      const parsed = sessionSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : freshSession();
    } catch {
      return freshSession();
    }
  },
  save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  },
};
export function event(
  s: Session,
  name: string,
  lessonId?: string,
  detail?: string,
  latencyMs?: number,
): Session {
  return {
    ...s,
    events: [
      ...s.events,
      {
        id: crypto.randomUUID(),
        name,
        at: new Date().toISOString(),
        lessonId,
        detail,
        latencyMs,
      },
    ].slice(-250),
  };
}
