"use client";
import { useState } from "react";
import {
  Lock,
  Sparkles,
  Check,
  ArrowRight,
  BookOpen,
  Clock,
  CircleDot,
} from "lucide-react";
import Link from "./AppLink";
import { FractionBar } from "./Primitives";
import { useSession } from "./SessionProvider";
import { skills, implementedSkills } from "@/content/skills";
import { skillState, skillStatus, nextMission } from "@/lib/learning/model";
import {
  misconceptions,
  type MisconceptionCode,
  type World,
} from "@/content/curriculum";
export function SkillConstellation({
  world: initialWorld = "fractions",
}: {
  world?: World;
}) {
  const [world, setWorld] = useState<World>(initialWorld);
  const { session } = useSession(),
    [chosen, setChosen] = useState("");
  const nodes = skills.filter((s) => s.world === world),
    selected =
      nodes.find((s) => s.id === chosen) ||
      nodes.find(
        (s) => s.id === nextMission(session.learning, world).skill.id,
      ) ||
      nodes[0],
    state = skillState(session.learning, selected.id),
    status = skillStatus(session.learning, selected.id);
  return (
    <section className="constellation">
      <div className="constellation-heading">
        <div>
          <span className="eyebrow">YOUR IDEAS BECOME STARS</span>
          <h2>The knowledge constellation</h2>
        </div>
        <span>Every light has a reason.</span>
      </div>
      <div className="constellation-tabs" aria-label="Choose a skill world">
        {(["fractions", "multiplication", "place-value"] as World[]).map(
          (w) => (
            <button
              key={w}
              aria-pressed={world === w}
              onClick={() => setWorld(w)}
            >
              {w === "place-value"
                ? "Place value"
                : w === "fractions"
                  ? "Fractions"
                  : "Multiplication"}
            </button>
          ),
        )}
      </div>
      <div className="constellation-sky">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {nodes.flatMap((n) =>
            n.prerequisites.map((p) => {
              const parent = nodes.find((s) => s.id === p);
              return parent ? (
                <path
                  key={`${p}-${n.id}`}
                  d={`M ${parent.x} ${parent.y} C ${(parent.x + n.x) / 2} ${parent.y}, ${(parent.x + n.x) / 2} ${n.y}, ${n.x} ${n.y}`}
                  className={
                    skillState(session.learning, p).mastered ? "lit" : ""
                  }
                />
              ) : null;
            }),
          )}
        </svg>
        {nodes.map((n) => {
          const status = skillStatus(session.learning, n.id);
          return (
            <button
              key={n.id}
              className={`skill-star ${status.replace(" ", "-")} ${n.id === selected.id ? "selected" : ""}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              onClick={() => setChosen(n.id)}
              aria-label={`${n.title}, ${status}`}
              aria-pressed={selected.id === n.id}
            >
              <span>
                {status === "locked" ? (
                  <Lock size={15} />
                ) : status === "mastered" ? (
                  <Check size={18} />
                ) : status === "review due" ? (
                  <Clock size={18} />
                ) : status === "developing" ? (
                  <CircleDot size={18} />
                ) : (
                  <Sparkles size={18} />
                )}
              </span>
              <b>{n.title}</b>
            </button>
          );
        })}
      </div>
      <div className="star-detail">
        <div>
          <span className="eyebrow">{status.toUpperCase()}</span>
          <h3>{selected.title}</h3>
          <p>
            {state.events.length
              ? `${state.mastered ? "★★★ · You taught Pip this" : state.independentTransfers ? "★★☆ · An idea taking shape" : "★☆☆ · Our first discoveries"} · New pictures proved ${Math.min(2, state.independentTransfers)}/2`
              : "A new idea, waiting for its first proof."}
          </p>
          <small>
            {state.dueAt
              ? `Review ${new Date(state.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : selected.concept}
          </small>
        </div>
        {status === "locked" ? (
          <span className="locked-note">Follow the connected stars first.</span>
        ) : implementedSkills.has(selected.id) ? (
          <Link
            className="button outline"
            href={`/play/${world}?skill=${selected.id}`}
          >
            {state.reviewDue ? "Review this idea" : "Teach this idea"}{" "}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <span className="locked-note">Activity coming next</span>
        )}
      </div>
    </section>
  );
}
export function Notebook() {
  const { session } = useSession();
  const learned = skills.filter((s) =>
    session.learning.some(
      (e) =>
        !e.seeded &&
        e.skillId === s.id &&
        e.kind === "repair" &&
        e.result === "demonstrated",
    ),
  );
  return (
    <section className="pip-notebook">
      <div className="collection-heading">
        <h2>
          <BookOpen size={22} /> Pip’s notebook
        </h2>
        <span>Ideas you helped me see</span>
      </div>
      {learned.length ? (
        <div className="notebook-entries">
          {learned.map((s) => {
            const proof = session.learning.findLast(
              (e) =>
                !e.seeded &&
                e.skillId === s.id &&
                e.kind === "repair" &&
                e.result === "demonstrated",
            );
            const code = proof?.misconceptions[0] as
              MisconceptionCode | undefined;
            const note = code ? misconceptions[code] : undefined;
            return (
              <article key={s.id}>
                <span className="eyebrow">{s.world.replace("-", " ")}</span>
                <h3>{s.title}</h3>
                {note && (
                  <p className="old-idea">
                    <s>{note.mistake}</s>
                  </p>
                )}
                <span className="notebook-caption">What you taught me</span>
                <p>“{note?.correction || s.concept}”</p>
                {s.id === "fraction_magnitude" && (
                  <div className="memory-diagram">
                    <div>
                      <b>1/4</b>
                      <FractionBar parts={4} selected={[0]} readonly />
                    </div>
                    <div>
                      <b>1/8</b>
                      <FractionBar parts={8} selected={[0]} readonly />
                    </div>
                  </div>
                )}
                <small>
                  {skillState(session.learning, s.id).mastered
                    ? "You taught me this. Let’s remember it."
                    : "I’m learning. Let’s try another proof."}
                </small>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="notebook-empty">
          My pages are waiting. Teach me an idea, and we’ll write it here.
        </p>
      )}
    </section>
  );
}
export function NextQuest() {
  const { session } = useSession(),
    mission = nextMission(session.learning);
  return (
    <Link
      className="next-quest"
      href={`/play/${mission.skill.world}?skill=${mission.skill.id}`}
    >
      <span className="eyebrow">
        {mission.review ? "A LITTLE REMEMBERING" : "OUR NEXT DISCOVERY"}
      </span>
      <h3>{mission.child}</h3>
      <ArrowRight size={24} />
    </Link>
  );
}
