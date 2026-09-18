"use client";
import { ArrowRight } from "lucide-react";
import { FractionBar } from "./Primitives";
import { VoiceInput } from "./VoiceInput";
import { MoonberryBottles } from "./MoonberryBottles";
import { correctionChallenges } from "@/content/corrections";
import type { MisconceptionCode } from "@/content/curriculum";
export function CorrectionStage({
  code,
  revealed,
  choice,
  onChoice,
  onReveal,
  onAgree,
  onCorrect,
  explanation,
  onExplanation,
  busy,
  requireExplanation,
  onListening,
}: {
  code: MisconceptionCode;
  revealed: boolean;
  choice: string;
  onChoice: (v: string) => void;
  onReveal: () => void;
  onAgree: () => void;
  onCorrect: () => void;
  explanation: string;
  onExplanation: (text: string) => void;
  busy: boolean;
  requireExplanation: boolean;
  onListening: (active: boolean) => void;
}) {
  const challenge = correctionChallenges[code],
    hero = code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE";
  return (
    <div className="correction">
      <div className="misconception-tag">PIP TRIES YOUR IDEA…</div>
      {!revealed ? (
        <>
          <div className="comparison-bars">
            {hero ? (
              <>
                <div>
                  <b>
                    1/8 <small className="pip-pick">Pip’s pick</small>
                  </b>
                  <FractionBar parts={8} selected={[0]} readonly />
                </div>
                <div>
                  <b>1/4</b>
                  <FractionBar parts={4} selected={[0]} readonly />
                </div>
              </>
            ) : (
              <div className="correction-claim">
                {challenge.claim}
                {code === "FRACTION_PARTS_NOT_EQUAL" && (
                  <div
                    className="unequal-proof"
                    aria-label="Four pieces of unequal sizes"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {[
                  "FRACTION_NUMERATOR_TOTAL",
                  "FRACTION_DENOMINATOR_COLORED",
                ].includes(code) && (
                  <FractionBar parts={4} selected={[0, 1, 2]} readonly />
                )}
              </div>
            )}
          </div>
          <h2>Is Pip right?</h2>
          <div className="choice-row">
            <button className="button outline" onClick={onAgree}>
              Yes, I think so
            </button>
            <button className="button green" onClick={onReveal}>
              No — I’ll show you <ArrowRight size={17} />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="instruction">{challenge.question}</p>
          {hero ? (
            <MoonberryBottles choice={choice} onChoice={onChoice} />
          ) : (
            <>
              {/MULTIPLICATION|ARRAY|GROUP|COMMUTATIVITY/.test(code) && (
                <div className="correction-array">
                  {Array.from(
                    {
                      length: code === "MULTIPLICATION_ALWAYS_LARGER" ? 6 : 12,
                    },
                    (_, i) => (
                      <span key={i}>◆</span>
                    ),
                  )}
                </div>
              )}
              {code === "ZERO_PLACEHOLDER_IGNORED" && (
                <div className="proof-objects">
                  <span>100</span>
                  <span>100</span>
                  <span>+ 3</span>
                </div>
              )}
              <div className="choice-row">
                {challenge.choices.map((value) => (
                  <button
                    key={value}
                    className={`button outline ${choice === value ? "selected" : ""}`}
                    onClick={() => onChoice(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </>
          )}

          <VoiceInput
            onText={onExplanation}
            onListening={onListening}
            disabled={busy}
          />
          <label className="correction-explanation">
            Teach Pip why{requireExplanation ? "" : " (optional)"}
            <textarea
              aria-label="Your correction"
              value={explanation}
              onChange={(e) => onExplanation(e.target.value)}
              maxLength={800}
              rows={2}
              placeholder={
                hero
                  ? "They’re the same-size whole. More equal pieces means…"
                  : "Pip, here’s why your idea needs to change…"
              }
              disabled={busy}
            />
          </label>
          <div className="surface-bottom">
            <span className="muted">Help Pip see what changed.</span>
            <button
              className="button green"
              disabled={
                !choice ||
                busy ||
                (requireExplanation && explanation.trim().length < 2)
              }
              onClick={onCorrect}
            >
              {busy ? "Pip is thinking…" : "Here’s why"}{" "}
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
