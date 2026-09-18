"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "./AppLink";
import { useSession } from "./SessionProvider";
import { cosmetics, progression } from "@/lib/learning/progression";
import { Pip } from "../pip/Pip";
export function StarCore({ compact = false }: { compact?: boolean }) {
  const { session } = useSession();
  const p = progression(session.xp);
  const [shown, setShown] = useState(session.xp);
  const previous = useRef(session.xp);
  useEffect(() => {
    const from = previous.current;
    previous.current = session.xp;
    const start = performance.now();
    let frame = 0;
    function tick(t: number) {
      const f = Math.min(1, (t - start) / 650);
      setShown(Math.round(from + (session.xp - from) * f));
      if (f < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [session.xp]);
  return (
    <div
      className={`star-core-panel ${compact ? "compact" : ""}`}
      aria-label={`Pip Level ${p.level}, ${p.remaining} XP to next level`}
    >
      <span
        className={`star-core core-level-${Math.min(4, Math.floor(p.level / 3))}`}
        aria-hidden="true"
      >
        ✦
      </span>
      <div className="core-details">
        <div>
          <b>YOU + PIP · LEVEL {p.level}</b>
          <span>{shown} XP</span>
        </div>
        <div
          className="core-meter"
          role="progressbar"
          aria-label="Star Core energy"
          aria-valuenow={p.within}
          aria-valuemin={0}
          aria-valuemax={150}
        >
          <i style={{ width: `${(p.within / 150) * 100}%` }} />
        </div>
        {!compact && (
          <>
            <strong>{p.current.name}</strong>
            <small>
              {p.remaining} XP to Level {p.level + 1} ·{" "}
              {p.next
                ? `Next evolution: ${p.next.name} at Level ${p.next.level}`
                : "A sky full of discoveries"}
            </small>
            <small>{p.next?.reward}</small>
          </>
        )}
      </div>
    </div>
  );
}
export function JourneyFeedback() {
  const { session, update, ready } = useSession();
  const p = progression(session.xp);
  const latest = session.progression.awards.at(-1);
  const seen = useRef<{ id: string; count: number } | null>(null);
  const [visibleAward, setVisibleAward] = useState<typeof latest>();
  const dialog = useRef<HTMLDialogElement>(null);
  const showLevel =
    p.level > session.progression.celebratedLevel && session.run?.completed;
  useEffect(() => {
    if (!ready) return;
    const previous = seen.current;
    seen.current = { id: session.id, count: session.progression.awards.length };
    if (
      !previous ||
      previous.id !== session.id ||
      previous.count >= session.progression.awards.length
    )
      return;
    const show = setTimeout(() => setVisibleAward(latest), 0);
    const hide = setTimeout(() => setVisibleAward(undefined), 900);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [ready, session.id, session.progression.awards.length, latest]);
  const close = useCallback(() => {
    update((s) => ({
      ...s,
      progression: {
        ...s.progression,
        celebratedLevel: p.level,
        equipped:
          p.level >= 5 &&
          (!s.progression.equipped || s.progression.equipped === "compass")
            ? "scarf"
            : (s.progression.equipped ?? (p.level >= 3 ? "compass" : null)),
      },
    }));
  }, [p.level, update]);
  useEffect(() => {
    if (!showLevel) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const timer = setTimeout(close, 3800);
    return () => {
      clearTimeout(timer);
      element?.close();
      previous?.focus();
    };
  }, [showLevel, close]);
  return (
    <>
      {visibleAward && (
        <div key={visibleAward.key} className="xp-flight" role="status">
          <span>✦</span> +{visibleAward.xp} XP · {visibleAward.label}
        </div>
      )}
      {showLevel && (
        <dialog
          ref={dialog}
          onCancel={close}
          className="level-event"
          aria-label="Pip level up"
        >
          <button className="text-button" onClick={close}>
            Skip celebration
          </button>
          <Pip
            size={200}
            mood="levelUp"
            cosmetic={p.level >= 5 ? "scarf" : "compass"}
          />
          <span className="eyebrow">LOOK WHAT YOUR TEACHING DID</span>
          <h2>
            Level {p.level} · {p.current.name}
          </h2>
          <p>“Uh… was I supposed to start glowing?”</p>
          <p>{p.current.reward}</p>
        </dialog>
      )}
    </>
  );
}
export function PipCloset() {
  const { session, update } = useSession();
  const p = progression(session.xp);
  return (
    <section className="pip-closet">
      <div>
        <span className="eyebrow">EARNED THROUGH TEACHING</span>
        <h2>Pip’s closet</h2>
        <p>Choose your explorer’s look. Every unlocked item is yours.</p>
      </div>
      <div className="closet-grid">
        {cosmetics.map((c) => (
          <button
            key={c.id}
            disabled={p.level < c.level}
            className={session.progression.equipped === c.id ? "equipped" : ""}
            aria-pressed={session.progression.equipped === c.id}
            onClick={() =>
              update((s) => ({
                ...s,
                progression: {
                  ...s.progression,
                  equipped: c.id,
                  chosen: [...new Set([...s.progression.chosen, c.id])],
                },
              }))
            }
          >
            <span>{c.icon}</span>
            <b>{c.name}</b>
            <small>
              {p.level < c.level
                ? `Level ${c.level}`
                : session.progression.equipped === c.id
                  ? "Wearing it"
                  : "Equip"}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
export function RewardChoice() {
  const { session, update } = useSession();
  if (progression(session.xp).level < 5) return null;
  return (
    <div className="reward-choice">
      <span className="eyebrow">CHOOSE PIP’S REWARD</span>
      <h3>A new look for our next mystery.</h3>
      <div>
        {cosmetics
          .filter((c) => c.level === 5)
          .map((c) => (
            <button
              key={c.id}
              className={`button outline ${session.progression.equipped === c.id ? "selected" : ""}`}
              onClick={() =>
                update((s) => ({
                  ...s,
                  progression: {
                    ...s.progression,
                    equipped: c.id,
                    chosen: [...new Set([...s.progression.chosen, c.id])],
                  },
                }))
              }
            >
              {c.icon} {c.name}
              {session.progression.equipped === c.id ? " · Equipped" : ""}
            </button>
          ))}
      </div>
      <Link href="/pip">See Pip’s closet →</Link>
    </div>
  );
}
