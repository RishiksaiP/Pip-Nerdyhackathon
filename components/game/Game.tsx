"use client";
import { MoonberryBottles } from "./MoonberryBottles";
import { authoredCorrection } from "@/lib/ai/correction";
import { StarCore, RewardChoice } from "./Progression";
import { reaction, explanationReaction } from "@/lib/learning/personality";
import { LearnedMoment } from "./LearnedMoment";
import { IndependentTransfer, transferTarget } from "./IndependentTransfer";
import {
  authoredReasoning,
  evidenceFromReasoning,
  reasoningSchema,
} from "@/lib/ai/reasoning";
import { recordLearning, recordReview } from "@/lib/learning/actions";
import { skillState, nextMission, canStart } from "@/lib/learning/model";
import { getSkill } from "@/content/skills";
import Link from "@/components/game/AppLink";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  Blocks,
  MessageCircle,
  RefreshCw,
  FlaskConical,
  Sparkles,
  Leaf,
  Gem,
  Telescope,
} from "lucide-react";
import { Pip, type Mood } from "@/components/pip/Pip";
import { useSession } from "./SessionProvider";
import { Header } from "./Chrome";
import {
  FractionBar,
  NumberLine,
  ArrayGrid,
  BaseTenBlocks,
} from "./Primitives";
import { correctionChallenges } from "@/content/corrections";
import { CorrectionStage } from "./CorrectionStage";
import { TransferStage } from "./TransferStage";
import { VoiceInput } from "./VoiceInput";
import {
  getLesson,
  misconceptions,
  lessons,
  worldInfo,
  type World,
  type MisconceptionCode,
} from "@/content/curriculum";
import {
  freshRun,
  freshSession,
  event,
  type Run,
} from "@/lib/persistence/store";
import {
  validateBuild,
  compareFractions,
  multiply,
  compose,
} from "@/lib/math/kernel";

import {
  addEvidence,
  advance,
  finish,
  observeMisconception,
} from "@/lib/mastery/session-actions";
import {
  evaluationSchema,
  transferSchema,
  validateEvaluationForLesson,
} from "@/lib/ai/contracts";
import { transferFallback } from "@/lib/ai/fallback";
let demoReloadConsumed = false;
const stageNames = ["Make it", "Teach it", "Catch it", "Prove it"];
const stageIcons = [Blocks, MessageCircle, RefreshCw, FlaskConical];
function chime() {
  try {
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.65);
    gain.connect(context.destination);
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const tone = context.createOscillator();
      tone.type = "sine";
      tone.frequency.value = f;
      tone.connect(gain);
      tone.start(context.currentTime + i * 0.08);
      tone.stop(context.currentTime + 0.65);
    });
    setTimeout(() => void context.close(), 900);
  } catch {}
}
export function Game({
  world = "fractions",
  demo = false,
}: {
  world?: World;
  demo?: boolean;
}) {
  const { session, ready, update, aiPolicy } = useSession(),
    initialized = useRef(false),
    busyRef = useRef(false);
  const [explanation, setExplanation] = useState(""),
    [correction, setCorrection] = useState(""),
    [busy, setBusy] = useState(false),
    [listening, setListening] = useState(false),
    [mood, setMood] = useState<Mood>("curious"),
    [transfer, setTransfer] = useState(transferFallback),
    [choice, setChoice] = useState(""),
    [reactionLine, setReactionLine] = useState("");
  const presentation =
    ready &&
    demo &&
    new URLSearchParams(window.location.search).get("presentation") === "1";
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    update((s) => {
      if (demo) {
        const params = new URLSearchParams(window.location.search);
        const selectedProvider = params.get("provider");
        const settings =
          selectedProvider === "ollama" ||
          selectedProvider === "demo" ||
          selectedProvider === "llamacpp"
            ? ({ provider: selectedProvider, quality: false } as const)
            : s.aiSettings;
        const reload =
          (
            performance.getEntriesByType("navigation")[0] as
              PerformanceNavigationTiming | undefined
          )?.type === "reload";
        if (
          reload &&
          params.get("reset") !== "1" &&
          !demoReloadConsumed &&
          s.demo &&
          s.run
        ) {
          demoReloadConsumed = true;
          return s;
        }
        demoReloadConsumed = true;
        if (s.demo && s.run && params.get("reset") !== "1") return s;
        if (params.get("reset") === "1") {
          params.delete("reset");
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${params}`,
          );
        }
        const reset = freshSession(true);
        return {
          ...reset,
          aiSettings: settings,
          run: freshRun("moonberry-mix-up"),
        };
      }
      const requested = new URLSearchParams(window.location.search).get(
        "skill",
      );
      const selectedSkill = requested ? getSkill(requested) : null;
      if (
        selectedSkill &&
        selectedSkill.world === world &&
        canStart(s.learning, selectedSkill.id)
      ) {
        if (s.run?.skillId === selectedSkill.id && !s.run.completed) return s;
        return event(
          {
            ...s,
            run: freshRun(
              selectedSkill.lessonId,
              selectedSkill.id,
              skillState(s.learning, selectedSkill.id).reviewDue,
            ),
          },
          "challenge_started",
          selectedSkill.lessonId,
        );
      }
      if (s.run && getLesson(s.run.lessonId).world === world) return s;
      const lesson =
        lessons.find((l) => l.world === world && !s.completed.includes(l.id)) ??
        lessons.find((l) => l.world === world)!;
      return event(
        { ...s, run: freshRun(lesson.id) },
        "challenge_started",
        lesson.id,
      );
    });
  }, [ready, demo, world, update]);
  const run = session.run,
    lesson = getLesson(
      run?.lessonId ?? lessons.find((l) => l.world === world)!.id,
    ),
    info = worldInfo[lesson.world];
  const currentStage = run?.stage;
  useEffect(() => {
    if (run?.stage !== 2 || !run.notebookOpen || lesson.world !== "fractions")
      return;
    let cancelled = false;
    void fetch("/api/challenge/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: lesson.id,
        settings:
          session.demo && session.aiSettings.provider === "auto"
            ? { provider: "demo", quality: false }
            : session.aiSettings,
      }),
      signal: AbortSignal.timeout(aiPolicy.aiTimeoutMs + 2000),
    })
      .then((r) => r.json())
      .then((d) => {
        const parsed = z.object({ context: transferSchema }).safeParse(d);
        if (
          !cancelled &&
          parsed.success &&
          parsed.data.context.scene === "potion_shop"
        )
          setTransfer({ ...parsed.data.context, scene: "potion_shop" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    run?.stage,
    run?.notebookOpen,
    lesson.id,
    lesson.world,
    session.demo,
    session.aiSettings,
    aiPolicy.aiTimeoutMs,
  ]);
  useEffect(() => {
    if (
      !ready ||
      !session.sound ||
      currentStage === undefined ||
      !("speechSynthesis" in window)
    )
      return;
    const lines = [
      "Can you show me your idea?",
      "Why does it work?",
      "Can you check my idea?",
      "Can you prove it somewhere else?",
      "You taught me that!",
    ];
    const utterance = new SpeechSynthesisUtterance(lines[currentStage]);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [currentStage, session.sound, ready]);
  if (!ready || !run)
    return (
      <main className="game-page">
        <Header />
        <div className="loading-pip">
          <Pip mood="thinking" />
          <p>Waking up the observatory…</p>
        </div>
      </main>
    );
  const stage = run.stage,
    code: MisconceptionCode =
      run.probeCode ??
      session.misconceptions
        .filter(
          (m) =>
            !m.resolvedAt &&
            m.confidence >= 0.65 &&
            misconceptions[m.code]?.skill === lesson.world,
        )
        .sort((a, b) => b.confidence - a.confidence)[0]?.code ??
      (lesson.world === "fractions"
        ? "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE"
        : lesson.world === "multiplication"
          ? "MULTIPLICATION_IS_ADDITION_OF_OPERANDS"
          : "ZERO_PLACEHOLDER_IGNORED");
  function patch(partial: Partial<Run>) {
    update((s) => (s.run ? { ...s, run: { ...s.run, ...partial } } : s));
  }
  function wrong(
    line: string,
    dimension: "procedural" | "correction" | "transfer",
  ) {
    setMood("confused");
    update((s) => {
      let next = addEvidence(
        recordLearning(
          s,
          dimension === "procedural"
            ? "build"
            : dimension === "correction"
              ? "repair"
              : "transfer",
          "not_yet",
        ),
        dimension,
        0.1,
        `incorrect-${s.run?.stage}-${s.run?.attempts}`,
      );
      next = event(next, `${dimension}_retry`, lesson.id);
      return {
        ...next,
        run: next.run
          ? { ...next.run, attempts: next.run.attempts + 1, feedback: line }
          : null,
      };
    });
  }
  function celebrate() {
    setMood("eureka");
    if (session.sound) chime();
  }
  function build() {
    if (busyRef.current || stage !== 0) return;
    const valid =
      lesson.representation === "potion"
        ? run!.selected[0] === 0
        : lesson.representation === "array"
          ? run!.rows === 3 &&
            run!.columns === 4 &&
            multiply(run!.rows, run!.columns) === 12
          : lesson.representation === "base-ten"
            ? compose(run!.hundreds, run!.tens, run!.ones) === 203
            : validateBuild(
                lesson.representation === "number-line"
                  ? run!.line
                  : run!.selected.length,
                lesson.target.d,
                lesson.target,
              );
    if (!valid) {
      wrong(
        lesson.world === "fractions"
          ? lesson.representation === "potion"
            ? "Let’s test that. These bottles hold the same whole. Compare the purple amounts."
            : `Let’s look again. Show ${lesson.target.n} of the ${lesson.target.d} equal parts.`
          : lesson.world === "multiplication"
            ? "Try three rows, with four crystals in each."
            : "Look at each place: two hundreds, no tens, three ones.",
        "procedural",
      );
      return;
    }
    celebrate();
    setReactionLine("");
    update((s) =>
      advance(
        event(
          addEvidence(
            addEvidence(
              recordLearning(s, "build", "demonstrated"),
              "procedural",
              1,
              "build",
            ),
            "conceptual",
            0.95,
            "build",
          ),
          "build_submitted",
          lesson.id,
          "Deterministic construction correct",
        ),
        0,
        15,
      ),
    );
  }
  async function explain() {
    if (busyRef.current || explanation.trim().length < 2 || stage !== 1) return;
    busyRef.current = true;
    setBusy(true);
    setMood("thinking");
    const started = Date.now();
    let result;
    let analysis;
    let trace: { provider: string; model: string; reason?: string } | undefined;
    let source = "fallback";
    try {
      const response = await fetch("/api/explanation/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          explanation: explanation.trim(),
          mode: "typed",
          settings:
            session.demo && session.aiSettings.provider === "auto"
              ? { provider: "demo", quality: false }
              : session.aiSettings,
        }),
        signal: AbortSignal.timeout(aiPolicy.aiTimeoutMs + 2000),
      });
      if (!response.ok) throw new Error("unavailable");
      const body = z
        .object({
          evaluation: evaluationSchema,
          analysis: reasoningSchema,
          trace: z.object({
            provider: z.string(),
            model: z.string(),
            latencyMs: z.number(),
            schemaValid: z.boolean(),
            fallback: z.boolean(),
            local: z.boolean(),
            reason: z.string().optional(),
          }),
          source: z.enum(["live", "fallback"]),
        })
        .parse(await response.json());
      analysis = body.analysis;
      trace = body.trace;
      result = validateEvaluationForLesson(
        evidenceFromReasoning(body.analysis),
        lesson.id,
      );
      source = body.source === "live" ? "live" : "fallback";
    } catch {
      if (aiPolicy.strictLocal) {
        patch({
          feedback: "Pip couldn’t check that idea yet. Please try again.",
        });
        setMood("curious");
        setBusy(false);
        busyRef.current = false;
        return;
      }
      analysis = authoredReasoning(lesson.id, explanation);
      result = evidenceFromReasoning(analysis);
    }
    const accepted =
      result.conceptualScore >= 0.7 && result.explanationScore >= 0.7;
    setMood(result.pip.mood);
    update((s) => {
      // A delayed evaluation must never grade a different lesson or a reset demo.
      if (
        s.id !== session.id ||
        s.run?.lessonId !== lesson.id ||
        s.run.stage !== 1
      )
        return s;
      let next = event(
        s,
        "explanation_submitted",
        lesson.id,
        `${trace?.provider ?? "demo"} · ${trace?.model ?? "authored-rubric-v2"} · schema valid · ${source}: ${result.evidenceSummary}`,
        Date.now() - started,
      );
      if (source === "fallback")
        next = event(
          next,
          "fallback_used",
          lesson.id,
          trace?.reason ?? "Authored reasoning rubric; no model result used.",
        );
      next = recordLearning(
        next,
        "explain",
        accepted
          ? "demonstrated"
          : result.misconceptions.length
            ? "not_yet"
            : "developing",
        {
          concepts: analysis.conceptsPresent,
          misconceptions: result.misconceptions.map((m) => m.code),
          confidence: analysis.confidence,
        },
      );
      if (analysis.probeId && next.run)
        next = { ...next, run: { ...next.run, probeCode: analysis.probeId } };
      for (const m of result.misconceptions)
        next = observeMisconception(next, m.code, m.confidence);
      next = addEvidence(
        next,
        "explanation",
        result.explanationScore,
        accepted ? "explain" : `weak-explain-${next.run!.attempts}`,
      );
      next = addEvidence(
        next,
        "conceptual",
        result.conceptualScore,
        accepted ? "explain" : `weak-explain-${next.run!.attempts}`,
      );
      if (
        accepted ||
        (result.misconceptions.length > 0 && analysis.safeToContinue)
      )
        return advance(next, 1, accepted ? 25 : 10);
      return {
        ...next,
        run: {
          ...next.run!,
          feedback: result.pip.line,
          attempts: next.run!.attempts + 1,
        },
      };
    });
    setBusy(false);
    busyRef.current = false;
    if (accepted) {
      celebrate();
      setReactionLine(
        explanationReaction(
          explanation,
          run!.attempts,
          analysis.conceptsPresent,
        ),
      );
    }
  }
  async function correct() {
    if (busyRef.current) return;
    const valid = choice === correctionChallenges[code].answer;
    if (!valid) {
      wrong("Let’s use the objects to check that idea.", "correction");
      return;
    }
    let correctionTrace:
      | {
          provider: string;
          model: string;
          latencyMs: number;
          fallback: boolean;
        }
      | undefined;
    if (correction.trim()) {
      busyRef.current = true;
      setBusy(true);
      setMood("thinking");
      try {
        const response = await fetch("/api/explanation/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            explanation: correction,
            correctionCode: code,
            settings:
              session.demo && session.aiSettings.provider === "auto"
                ? { provider: "demo", quality: false }
                : session.aiSettings,
          }),
          signal: AbortSignal.timeout(aiPolicy.aiTimeoutMs + 2000),
        });
        if (!response.ok) throw new Error("correction-unavailable");
        const data = z
          .object({
            accepted: z.boolean(),
            trace: z.object({
              provider: z.string(),
              model: z.string(),
              latencyMs: z.number(),
              fallback: z.boolean(),
              schemaValid: z.literal(true),
            }),
          })
          .parse(await response.json());
        correctionTrace = data.trace;
        if (!data.accepted) {
          wrong(
            code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE"
              ? "Tell me why more pieces change the size of each piece. Are the wholes the same size?"
              : "Show me why your correction works with these objects.",
            "correction",
          );
          setMood("curious");
          return;
        }
      } catch {
        if (aiPolicy.strictLocal) {
          patch({
            feedback:
              "Pip couldn’t check that correction yet. Please try again.",
          });
          setMood("curious");
          return;
        }
        if (!authoredCorrection(lesson.id, correction, code)) {
          wrong(
            "Show me why your correction works with these objects.",
            "correction",
          );
          return;
        }
      } finally {
        setBusy(false);
        busyRef.current = false;
      }
    } else {
      patch({ feedback: "Teach me why your correction works." });
      return;
    }
    celebrate();
    setChoice("");
    update((s) => {
      if (s.id !== session.id || s.run?.stage !== 2 || s.run.notebookOpen)
        return s;
      if (correctionTrace)
        s = event(
          s,
          "explanation_submitted",
          lesson.id,
          `${correctionTrace.provider} · ${correctionTrace.model} · schema valid · ${correctionTrace.fallback ? "fallback" : "live"}: correction evaluated`,
          correctionTrace.latencyMs,
        );
      const repaired = recordLearning(s, "repair", "demonstrated", {
        misconceptions: [code],
      });
      const next = event(
        addEvidence(
          observeMisconception(repaired, code, 0.8, true),
          "correction",
          1,
          "correct",
        ),
        "pip_corrected",
        lesson.id,
        "Corrected an authored misconception with a visual counterexample",
      );
      return {
        ...next,
        run: {
          ...next.run!,
          notebookOpen: true,
          probeCode: code,
          feedback: "",
        },
      };
    });
  }
  function startTransfer() {
    setReactionLine("");
    update((s) => advance(s, 2, 0));
    setChoice("");
  }
  function proveFirst() {
    const target = transferTarget(lesson);
    const correct = target
      ? validateBuild(run!.transferLine, target.parts, {
          n: target.n,
          d: target.d,
        })
      : run!.transferLine === (lesson.world === "multiplication" ? 2 : 1);
    if (!correct) {
      wrong(
        "Something doesn’t match yet. Try another point or picture.",
        "transfer",
      );
      return;
    }
    update((s) => {
      if (s.run?.stage !== 3 || s.run.transferStep !== 0) return s;
      const next = recordLearning(s, "transfer", "demonstrated", {
        representation: target ? "number-line" : "notation",
      });
      return {
        ...next,
        run: {
          ...next.run!,
          transferStep: 1,
          attempts: 0,
          hints: 0,
          feedback: "",
        },
      };
    });
    setChoice("");
    celebrate();
  }

  function prove() {
    if (run?.stage !== 3 || run.transferStep !== 1 || run.completed) return;
    const expected =
      lesson.world === "fractions"
        ? compareFractions(lesson.transferLeft, lesson.transferRight)
        : lesson.world === "multiplication"
          ? String(multiply(4, 3))
          : String(compose(3, 0, 2));
    if (choice !== expected) {
      wrong(
        lesson.world === "fractions"
          ? "These cups hold the same whole. Compare how much is filled."
          : lesson.world === "multiplication"
            ? "Four bags, three crystals in each. Count the equal groups."
            : "Three hundreds, zero tens, two ones. Give each digit its place.",
        "transfer",
      );
      return;
    }
    celebrate();
    update((s) =>
      finish(
        recordReview(
          advance(
            event(
              addEvidence(
                recordLearning(s, "transfer", "demonstrated", {
                  representation: "story-context",
                }),
                "transfer",
                1,
                "transfer",
              ),
              "transfer_completed",
              lesson.id,
              "Deterministic transfer correct",
            ),
            3,
            30,
          ),
        ),
      ),
    );
  }
  const skillProgress = skillState(session.learning, run.skillId);
  const mastered = skillProgress.mastered;
  const mission = nextMission(session.learning, lesson.world);
  const nextLesson = getLesson(mission.skill.lessonId);
  function next() {
    setCorrection("");
    if (!nextLesson) return;
    setChoice("");
    setExplanation("");
    setMood("curious");
    update((s) =>
      event(
        {
          ...s,
          run: freshRun(nextLesson.id, mission.skill.id, mission.review),
        },
        "challenge_started",
        nextLesson.id,
      ),
    );
  }
  const Icon =
    lesson.world === "fractions"
      ? Leaf
      : lesson.world === "multiplication"
        ? Gem
        : Telescope;
  const prompt =
    stage === 0
      ? lesson.representation === "potion"
        ? "Same potion. Same bottles. Different amounts. Help me wake the star projector."
        : lesson.representation === "array"
          ? "Can you build 3 groups of 4 crystals?"
          : lesson.representation === "base-ten"
            ? "Can you build the number 203?"
            : lesson.representation === "equivalent"
              ? "Can you make the same amount as one half?"
              : lesson.representation === "number-line"
                ? "Can you find 2/3 on this number line?"
                : `Can you show me ${lesson.target.n}/${lesson.target.d}?`
      : stage === 1
        ? lesson.representation === "potion"
          ? "Okay, potion professor—why does one fourth have more?"
          : lesson.world === "fractions"
            ? `But why does ${lesson.target.n}/${lesson.target.d} mean that amount?`
            : lesson.world === "multiplication"
              ? "Why does 3 × 4 make twelve?"
              : "What does each digit in 203 mean?"
        : stage === 2
          ? `${correctionChallenges[code].claim}${session.events.length % 4 === 3 ? " I am suspiciously confident." : ""}`
          : transfer.pipLine;
  return (
    <main
      className={`game-page ${presentation ? "presentation" : ""} ${stage === 3 ? "potion-scene" : ""} ${stage === 4 ? "mastery-scene" : ""} world-${lesson.world}`}
    >
      <Header light back />
      <div className="game-subheader">
        <Link href="/world">
          <ArrowLeft size={15} /> World map
        </Link>
        <span>
          <Icon size={15} />
          {info.title}
        </span>
        {session.demo ? (
          <button
            className="text-button demo-reset"
            onClick={() => {
              setChoice("");
              setExplanation("");
              setCorrection("");
              setReactionLine("");
              update((s) => ({
                ...freshSession(true),
                aiSettings: s.aiSettings,
                run: freshRun("moonberry-mix-up"),
              }));
            }}
          >
            Reset demo ↺
          </button>
        ) : (
          <span>YOUR DISCOVERY</span>
        )}
      </div>
      {stage < 4 ? (
        <>
          <div className="stage-track" aria-label="Learning stages">
            {stageNames.map((name, i) => {
              const StageIcon = stageIcons[i];
              return (
                <div
                  key={name}
                  className={`stage-stop ${stage === i ? "active" : ""} ${stage > i ? "done" : ""}`}
                  aria-current={stage === i ? "step" : undefined}
                >
                  <span>
                    {stage > i ? <Check size={18} /> : <StageIcon size={18} />}
                  </span>
                  <small>{name}</small>
                </div>
              );
            })}
          </div>
          <section className="lesson-heading">
            <span className="eyebrow">
              {stage === 3 ? "A NEW PLACE TO PROVE IT" : info.kicker}
            </span>
            <h1>
              {stage === 2 && run.notebookOpen
                ? "Pip learned."
                : stage === 3 && run.transferStep === 0
                  ? "Your turn. New mystery."
                  : stage === 3
                    ? lesson.world === "fractions"
                      ? transfer.title
                      : lesson.world === "multiplication"
                        ? "The crystal delivery"
                        : "A telescope delivery"
                    : lesson.title}
            </h1>
          </section>
          <div className="pip-dialogue">
            <Pip
              mood={
                listening
                  ? "listening"
                  : busy
                    ? "thinking"
                    : stage === 2 && run.notebookOpen
                      ? "writing"
                      : stage === 0
                        ? "looking_at_math"
                        : mood
              }
              size={150}
            />
            <div className="speech" aria-live="polite">
              {busy ? (
                reaction("thinking", session.events.length).dialogue
              ) : listening ? (
                reaction("microphone", session.events.length).dialogue
              ) : stage === 2 && run.notebookOpen ? (
                run.attempts > 1 ? (
                  "That one fought back. You taught me anyway."
                ) : (
                  reaction("learner_corrects_pip", session.events.length)
                    .dialogue
                )
              ) : stage === 3 && run.transferStep === 0 ? (
                "Can you prove it without my picture?"
              ) : reactionLine ? (
                <>
                  {reactionLine}
                  <br />
                  <small>{prompt}</small>
                </>
              ) : (
                prompt
              )}
            </div>
          </div>
          <section
            className={`learning-surface stage-${stage}`}
            aria-label={stageNames[stage]}
          >
            <div className="surface-label">
              <span>
                0{stage + 1} / {stageNames[stage].toUpperCase()}
              </span>
              <span>✦</span>
            </div>
            {stage === 0 && (
              <>
                <p className="instruction">
                  {lesson.representation === "potion"
                    ? "Which bottle has more Moonberry Potion?"
                    : lesson.representation === "array"
                      ? "Give every row the same number of crystals."
                      : lesson.representation === "base-ten"
                        ? "Add blocks to the hundreds, tens, and ones."
                        : lesson.representation === "number-line"
                          ? "Tap a point. Each step is the same size."
                          : lesson.representation === "equivalent"
                            ? "Fill the bottom bar to match the top one."
                            : "Tap the pieces you want to show Pip."}
                </p>
                {lesson.representation === "potion" && (
                  <MoonberryBottles
                    choice={
                      run.selected.length
                        ? run.selected[0] === 0
                          ? "quarter"
                          : "eighth"
                        : ""
                    }
                    onChoice={(v) =>
                      patch({
                        selected: [v === "quarter" ? 0 : 1],
                        feedback: "",
                      })
                    }
                  />
                )}
                {lesson.representation === "equivalent" && (
                  <FractionBar
                    parts={2}
                    selected={[0]}
                    readonly
                    label="One half reference"
                  />
                )}
                {["bar", "equivalent"].includes(lesson.representation) && (
                  <div className="build-object">
                    <FractionBar
                      parts={lesson.target.d}
                      selected={run.selected}
                      onChange={(selected) => {
                        patch({ selected, feedback: "" });
                        setMood("curious");
                      }}
                    />
                    <div className="fraction-readout">
                      <b>{run.selected.length}</b>
                      <span />
                      <b>{lesson.target.d}</b>
                    </div>
                  </div>
                )}
                {lesson.representation === "number-line" && (
                  <NumberLine
                    parts={3}
                    value={run.line}
                    onChange={(line) => patch({ line, feedback: "" })}
                  />
                )}
                {lesson.representation === "array" && (
                  <ArrayGrid
                    rows={run.rows}
                    columns={run.columns}
                    onRows={(rows) => patch({ rows })}
                    onColumns={(columns) => patch({ columns })}
                  />
                )}
                {lesson.representation === "base-ten" && (
                  <BaseTenBlocks
                    values={run}
                    onChange={(key, n) => patch({ [key]: n })}
                  />
                )}
                <div className="surface-bottom">
                  <button
                    className="text-button"
                    onClick={() => {
                      const count = Math.min(run.hints + 1, 3);
                      patch({
                        hints: count,
                        feedback: lesson.hints[count - 1],
                      });
                    }}
                  >
                    <Lightbulb size={17} /> Clue compass
                  </button>
                  <button className="button green" onClick={build}>
                    Show Pip <ArrowRight size={19} />
                  </button>
                </div>
              </>
            )}
            {stage === 1 && (
              <div className="explanation">
                <VoiceInput
                  onText={setExplanation}
                  onListening={setListening}
                  disabled={busy}
                />
                <div className="divider">
                  <span>or teach with your words</span>
                </div>
                <label htmlFor="explanation" className="sr-only">
                  Your explanation
                </label>
                <textarea
                  id="explanation"
                  maxLength={800}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="I think it works because…"
                  rows={3}
                />
                <div className="text-count">
                  {explanation.length}/800 · Ideas matter. Spelling doesn’t.
                </div>
                {session.demo && (
                  <button
                    className="demo-fill"
                    onClick={() => setExplanation(lesson.good)}
                  >
                    Use the demo explanation
                  </button>
                )}
                <div className="surface-bottom">
                  <span className="muted">
                    Pip is listening to your reasoning.
                  </span>
                  <button
                    disabled={busy || explanation.trim().length < 2}
                    className="button green"
                    onClick={() => void explain()}
                  >
                    {busy ? "Pip is thinking…" : "Teach Pip"}{" "}
                    <ArrowRight size={19} />
                  </button>
                </div>
              </div>
            )}
            {stage === 2 && !run.notebookOpen && (
              <CorrectionStage
                code={code}
                revealed={run.correctionRevealed}
                choice={choice}
                onChoice={setChoice}
                onReveal={() => {
                  setReactionLine("");
                  patch({ correctionRevealed: true, feedback: "" });
                  setMood("curious");
                }}
                onAgree={() => {
                  update((s) => observeMisconception(s, code, 0.8));
                  wrong(
                    "Let’s check it with a picture. Does Pip’s idea match what you see?",
                    "correction",
                  );
                }}
                onCorrect={() => void correct()}
                explanation={correction}
                onExplanation={setCorrection}
                busy={busy}
                requireExplanation={true}
                onListening={setListening}
              />
            )}
            {stage === 2 && run.notebookOpen && (
              <LearnedMoment code={code} onContinue={startTransfer} />
            )}
            {stage === 3 && run.transferStep === 0 && (
              <IndependentTransfer
                lesson={lesson}
                value={run.transferLine}
                onChange={(transferLine) =>
                  patch({ transferLine, feedback: "" })
                }
                onProve={proveFirst}
              />
            )}
            {stage === 3 && run.transferStep === 1 && (
              <TransferStage
                lesson={lesson}
                context={transfer}
                choice={choice}
                attempts={run.attempts}
                onChoice={setChoice}
                onProve={prove}
              />
            )}
            {run.feedback && (
              <div className="feedback" role="status">
                <Lightbulb size={17} />
                {run.feedback}
              </div>
            )}
          </section>
          <div className="quest-progress-peek">
            <StarCore />
          </div>
          <div className="game-bottom-note">
            {stage === 0
              ? "Little pieces of understanding. A little more light."
              : stage === 1
                ? "You don’t need fancy words. Just your idea."
                : stage === 2
                  ? "Even a clever little creature can mix things up."
                  : "Knowing it here means you can take it anywhere."}
          </div>
        </>
      ) : (
        <section className="mastery-moment">
          <div className="orb-orbit">
            <span className="knowledge-orb">✦</span>
            <Pip
              size={230}
              mood={mastered ? "mastery" : "excited"}
              cosmetic={session.progression.equipped}
            />
          </div>
          <span className="eyebrow">
            {mastered ? "MASTERY PROVEN" : "A NEW DISCOVERY"}
          </span>
          <h1>{mastered ? "You taught Pip!" : "Our discovery is growing."}</h1>
          {lesson.id === "moonberry-mix-up" && (
            <div className={`projector-payoff ${mastered ? "restored" : ""}`}>
              <span aria-hidden="true">✦ · ✧ · ✦</span>
              <h2>
                {mastered
                  ? "Moonberry Mix-Up · complete"
                  : "Moonberry Mix-Up · discoveries saved"}
              </h2>
              <p>
                {mastered
                  ? "The star projector is awake. You taught Pip fraction size."
                  : "The projector flickers to life. Another independent adventure will help this idea stick."}
              </p>
              {mastered && <b>Discovered: Moonberry Bottle</b>}
            </div>
          )}
          <p>
            {mastered
              ? "Comparing, explaining, and seeing the same idea somewhere new."
              : `${lesson.title} is in Pip’s collection. Keep exploring to build lasting mastery.`}
          </p>
          <div className="mastery-evidence">
            {stageNames.map((n, i) => (
              <span key={n}>
                <Check size={16} />
                {["Build", "Explain", "Correct", "Transfer"][i]}
              </span>
            ))}
          </div>
          <p className="proof-count">
            Independent transfer{" "}
            {Math.min(2, skillProgress.independentTransfers)}/2 ·{" "}
            {mastered ? "Review tomorrow" : "Every proof adds a little light"}
          </p>
          <div className="mastery-reward">
            <Sparkles size={19} />
            {mastered ? "A new star in your collection" : "Discovery saved"}
            <span>·</span>
            {mastered
              ? "Idea mastered"
              : "Keep teaching to strengthen this idea"}
          </div>
          <StarCore />
          <RewardChoice />
          <div className="mastery-actions">
            {nextLesson ? (
              <button className="button gold" onClick={next}>
                Keep exploring <ArrowRight size={18} />
              </button>
            ) : (
              <Link className="button gold" href="/world">
                Explore the worlds <ArrowRight size={18} />
              </Link>
            )}
            <Link className="button outline" href="/pip">
              Visit Pip’s room
            </Link>
          </div>
          <Link className="tutor-link" href="/grownups">
            See what this tells a tutor ↗
          </Link>
          {session.demo && (
            <p className="seed-note">
              Demo includes labelled prior evidence. Both transfer proofs came
              from your actions.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
