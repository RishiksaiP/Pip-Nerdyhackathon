"use client";
import { useState } from "react";
import { getSkill } from "@/content/skills";
import Link from "@/components/game/AppLink";
import {
  ArrowUpRight,
  Download,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Check,
  Clock3,
} from "lucide-react";
import { Header, Footer } from "@/components/game/Chrome";
import { useSession } from "@/components/game/SessionProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { buildReport } from "@/lib/mastery/report";
import { dimensions } from "@/lib/mastery/engine";
import { freshSession } from "@/lib/persistence/store";
import {
  worldInfo,
  lessons,
  misconceptions,
  type World,
} from "@/content/curriculum";
const labels: Record<string, string> = {
  challenge_started: "A new discovery began",
  build_submitted: "Built the idea with mathematical objects",
  explanation_submitted: "Explained the reasoning",
  pip_corrected: "Corrected Pip’s misconception",
  transfer_completed: "Applied the idea in a new setting",
  mastery_achieved: "All mastery gates reached",
  fallback_used: "Local reasoning evaluator used",
  discovery_saved: "Discovery added to Pip’s collection",
  procedural_retry: "Revisited the construction",
  correction_retry: "Revisited Pip’s idea",
  transfer_retry: "Tried the new context again",
};
export default function Grownups() {
  const { session, update } = useSession(),
    [world, setWorld] = useState<World>("fractions"),
    [reset, setReset] = useState(false);
  const report = buildReport(session, world),
    score = Math.round(report.overall * 100);
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            demo: session.demo,
            report,
            evidence: session.learning,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "pip-learning-report.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  return (
    <main className="adult-page">
      <Header light />
      <div className="adult-container">
        <div className="adult-heading">
          <div>
            <span className="eyebrow">A LITTLE PLAY. A CLEARER PICTURE.</span>
            <h1>Learning intelligence</h1>
            <p>
              Understanding that travels from independent play to the next human
              conversation.
            </p>
          </div>
          <button className="export-button" onClick={download}>
            <Download size={15} />
            Export evidence
          </button>
        </div>
        <div className="session-meta">
          <span className="status-dot" />
          {session.demo
            ? "Demonstration session · includes seeded prior evidence"
            : "Anonymous learner · this device only"}
          <span>NO PERSONAL PROFILE</span>
        </div>
        <Tabs value={world} onValueChange={(v) => setWorld(v as World)}>
          <TabsList className="report-tabs" variant="line">
            {(["fractions", "multiplication", "place-value"] as const).map(
              (w) => (
                <TabsTrigger key={w} value={w}>
                  {w === "fractions"
                    ? "Fractions"
                    : w === "multiplication"
                      ? "Multiplication"
                      : "Place value"}
                </TabsTrigger>
              ),
            )}
          </TabsList>
        </Tabs>
        <section className="tutor-skill-evidence">
          <span className="eyebrow">EVIDENCE THAT TRAVELS</span>
          <h2>{getSkill(report.skillId)?.title}</h2>
          <div className="tutor-proof-grid">
            <div>
              <strong>
                {Math.min(2, report.skill.independentTransfers)} / 2
              </strong>
              <span>independent transfer proofs</span>
            </div>
            <div>
              <strong>{report.skill.hints}</strong>
              <span>hints used</span>
            </div>
            <div>
              <strong>{Math.round(report.skill.independence * 100)}%</strong>
              <span>independent evidence</span>
            </div>
            <div>
              <strong>
                {report.skill.dueAt
                  ? new Date(report.skill.dueAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Not yet"}
              </strong>
              <span>next spaced review</span>
            </div>
          </div>
          <p>
            <b>Next: {report.mission.skill.title}.</b> {report.mission.reason}
          </p>
          <p>
            <b>Ask together:</b> “
            {report.mission.skill.id === "equivalent_fractions"
              ? "Can you show me two fractions that name the same amount?"
              : report.recommendation}
            ”
          </p>
          <span className="measurement-note">
            Concept, repair, transfer and delayed recall are recorded
            separately. Seeded history is identified in the demo.
          </span>
        </section>
        <div className="report-grid">
          <section className="confidence-panel">
            <div className="panel-kicker">THE UNDERSTANDING SO FAR</div>
            <h2>{getSkill(report.skillId)?.title}</h2>
            <div className="confidence-body">
              <div
                className="confidence-ring"
                style={{
                  background: `conic-gradient(#718c65 ${score}%,#e8ebdf 0)`,
                }}
              >
                <div>
                  <strong>
                    {score}
                    <small>%</small>
                  </strong>
                  <span>mastery confidence</span>
                </div>
              </div>
              <div className="confidence-notes">
                <span
                  className={`status-pill ${report.mastered ? "mastered" : ""}`}
                >
                  {report.mastered
                    ? "MASTERY PROVEN"
                    : report.hasEvidence
                      ? "GROWING UNDERSTANDING"
                      : "AWAITING EVIDENCE"}
                </span>
                <p>
                  {report.hasEvidence
                    ? "Built from what the learner did, explained, corrected, and transferred."
                    : "A starting baseline. Complete a discovery to add observed evidence."}
                </p>
                <Link href={`/play/${world}`}>
                  Continue in {worldInfo[world].title}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
            <div className="dimensions">
              {dimensions.map((d) => (
                <div className="dimension-row" key={d}>
                  <span>{d}</span>
                  <Progress
                    className={`evidence-progress ${d === report.weakest ? "weakest" : ""}`}
                    value={statePercent(d)}
                    aria-label={`${d} evidence`}
                  />
                  <b>{statePercent(d)}%</b>
                </div>
              ))}
            </div>
            <p className="measurement-note">
              Evidence model estimate, not a diagnostic score. Hints and
              repeated attempts lower reliability.
            </p>
          </section>
          <aside className="tutor-panel">
            <div className="panel-kicker">
              <Lightbulb size={15} /> THE NEXT TUTOR MOVE
            </div>
            <h2>
              Make the next
              <br />
              conversation count.
            </h2>
            <blockquote>“{report.recommendation}”</blockquote>
            <div className="tutor-why">
              <span>WHY THIS, WHY NOW</span>
              <p>{report.reason}</p>
            </div>
            <div className="human-note">
              <span>✦</span> Independent practice becomes a starting point for
              human teaching.
            </div>
          </aside>
          <section className="observation-panel">
            <div className="panel-kicker">A WINDOW INTO THE REASONING</div>
            <h2>
              {report.misconceptions.some((m) => m.resolvedAt)
                ? "A misconception, reconsidered."
                : "Look beyond the answer."}
            </h2>
            <p>{report.observation}</p>
            {report.misconceptions.map((m) => (
              <div className="misconception-record" key={m.code}>
                <span>
                  {m.resolvedAt ? <Check size={16} /> : <Lightbulb size={16} />}
                </span>
                <div>
                  <b>{misconceptions[m.code].description}</b>
                  <p>
                    {m.resolvedAt
                      ? "Corrected with contradictory evidence"
                      : `${Math.round(m.confidence * 100)}% pattern confidence · ${m.observations} observation(s)`}
                  </p>
                </div>
              </div>
            ))}
            <div className="learned-list">
              {lessons
                .filter(
                  (l) => l.world === world && session.completed.includes(l.id),
                )
                .map((l) => (
                  <span key={l.id}>
                    <Check size={12} />
                    {l.title}
                  </span>
                ))}
            </div>
          </section>
          <section className="activity-panel">
            <div className="panel-kicker">
              <Clock3 size={14} /> RECENT LEARNING MOMENTS
            </div>
            {report.activity.length ? (
              <ol>
                {report.activity.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <span />
                    <div>
                      <b>{labels[e.name] ?? e.name.replaceAll("_", " ")}</b>
                      <small>
                        {new Date(e.at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        ·{" "}
                        {e.detail?.startsWith("live:")
                          ? "Live AI reasoning"
                          : e.name === "fallback_used"
                            ? "Validated fallback"
                            : "Session evidence"}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-activity">
                <p>A fresh page, ready for an idea.</p>
                <Link href={`/play/${world}`}>
                  Start a discovery <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>
        </div>
        <section className="privacy-line">
          <ShieldCheck size={18} />
          <p>
            Anonymous by design. Progress stays in this browser. Audio is used
            only for transcription; Pip stores no recordings. Explanation text
            is processed by the AI provider when configured, then discarded by
            Pip.
          </p>
          <button
            onClick={() => {
              if (reset) {
                update(() => freshSession());
                setReset(false);
              } else setReset(true);
            }}
          >
            {reset ? "Confirm clear progress" : "Clear this device"}
          </button>
        </section>
      </div>
      <Footer />
    </main>
  );
  function statePercent(d: (typeof dimensions)[number]) {
    return Math.round(report.state[d] * 100);
  }
}
