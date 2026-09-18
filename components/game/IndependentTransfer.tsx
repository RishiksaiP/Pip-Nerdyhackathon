"use client";
import { NumberLine } from "./Primitives";
import { Sparkles } from "lucide-react";
import type { Lesson } from "@/content/curriculum";
export function transferTarget(lesson: Lesson) {
  return lesson.world === "fractions"
    ? {
        n: lesson.transferLeft.n,
        d: lesson.transferLeft.d,
        parts:
          lesson.transferLeft.d <= 4
            ? lesson.transferLeft.d * 2
            : lesson.transferLeft.d,
      }
    : null;
}
export function IndependentTransfer({
  lesson,
  value,
  onChange,
  onProve,
}: {
  lesson: Lesson;
  value: number;
  onChange: (n: number) => void;
  onProve: () => void;
}) {
  const target = transferTarget(lesson);
  return (
    <div className="independent-transfer">
      <span className="transfer-counter">
        PROOF 1 OF 2 · A DIFFERENT PICTURE
      </span>
      <h2>
        {target
          ? "Find it on a number line."
          : lesson.world === "multiplication"
            ? "Turn the array around."
            : "Unpack the number."}
      </h2>
      <p className="instruction">
        {target
          ? `Place ${target.n}/${target.d} between zero and one.`
          : lesson.world === "multiplication"
            ? "A grid has four rows of three crystals. How many altogether?"
            : "Which expanded form makes 203?"}
      </p>
      {target ? (
        <NumberLine parts={target.parts} value={value} onChange={onChange} />
      ) : (
        <div className="choice-row">
          {(lesson.world === "multiplication"
            ? ["7", "12", "16"]
            : ["200 + 0 + 3", "20 + 0 + 3", "200 + 30"]
          ).map((label, index) => (
            <button
              key={label}
              className={`button outline ${value === index + 1 ? "selected" : ""}`}
              onClick={() => onChange(index + 1)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="surface-bottom">
        <span className="muted">A fresh start. No hints from Pip.</span>
        <button className="button green" onClick={onProve}>
          Prove it <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}
