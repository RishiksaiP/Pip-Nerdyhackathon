"use client";
import { Sparkles } from "lucide-react";
import { FractionBar } from "./Primitives";
import { MoonberryBottle } from "./MoonberryBottles";
import type { Lesson } from "@/content/curriculum";
import { nextAction, baseline } from "@/lib/mastery/engine";
import type { transferFallback } from "@/lib/ai/fallback";
export function TransferStage({
  lesson,
  choice,
  attempts,
  onChoice,
  onProve,
}: {
  lesson: Lesson;
  context: typeof transferFallback;
  choice: string;
  attempts: number;
  onChoice: (v: string) => void;
  onProve: () => void;
}) {
  const scaffold =
    nextAction(baseline(), [], attempts > 0) === "alternate-representation";
  return (
    <div className="transfer">
      <p className="instruction">
        {lesson.world === "fractions"
          ? "Which bottle has more Moonberry Potion?"
          : lesson.world === "multiplication"
            ? "Four bags. Three crystals in every bag. How many crystals?"
            : "The telescope needs 3 hundreds, 0 tens, and 2 ones. Which number?"}
      </p>
      {lesson.world === "fractions" ? (
        <>
          <div className="potions">
            <MoonberryBottle
              n={lesson.transferLeft.n}
              d={lesson.transferLeft.d}
              selected={choice === "left"}
              onClick={() => onChoice("left")}
            />
            <span className="potion-versus">or</span>
            <MoonberryBottle
              n={lesson.transferRight.n}
              d={lesson.transferRight.d}
              selected={choice === "right"}
              onClick={() => onChoice("right")}
            />
          </div>
          <button
            className={`equal-option ${choice === "equal" ? "selected" : ""}`}
            onClick={() => onChoice("equal")}
          >
            They use the same amount
          </button>
          {scaffold && (
            <div className="transfer-scaffold">
              <p>Try a different picture. Both bars are the same whole.</p>
              <div>
                <FractionBar
                  parts={lesson.transferLeft.d}
                  selected={Array.from(
                    { length: lesson.transferLeft.n },
                    (_, i) => i,
                  )}
                  readonly
                />
                <FractionBar
                  parts={lesson.transferRight.d}
                  selected={Array.from(
                    { length: lesson.transferRight.n },
                    (_, i) => i,
                  )}
                  readonly
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="choice-row transfer-numbers">
          {(lesson.world === "multiplication"
            ? ["7", "12", "16"]
            : ["320", "302", "32"]
          ).map((value) => (
            <button
              key={value}
              className={`button outline ${choice === value ? "selected" : ""}`}
              onClick={() => onChoice(value)}
            >
              {value}
            </button>
          ))}
        </div>
      )}
      <div className="surface-bottom">
        <span className="muted">New setting. Same understanding.</span>
        <button className="button green" disabled={!choice} onClick={onProve}>
          Prove it <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}
