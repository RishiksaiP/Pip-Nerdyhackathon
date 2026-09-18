"use client";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { misconceptions, type MisconceptionCode } from "@/content/curriculum";
import { FractionBar } from "./Primitives";
export function LearnedMoment({
  code,
  onContinue,
}: {
  code: MisconceptionCode;
  onContinue: () => void;
}) {
  return (
    <div className="learned-moment">
      <div className="notebook-leaf">
        <BookOpen size={25} />
        <span className="eyebrow">PIP’S NOTEBOOK · A NEW IDEA</span>
        <h2>You changed my mind.</h2>
        <p>{misconceptions[code].correction}</p>
        {code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE" && (
          <div className="notebook-diagram">
            <span>
              <s>1/8 &gt; 1/4</s>
            </span>
            <strong>
              1/8 &lt; 1/4 <Check size={20} />
            </strong>
            <FractionBar parts={8} selected={[0]} readonly />
            <FractionBar parts={4} selected={[0]} readonly />
          </div>
        )}
        <span className="notebook-signature">
          A note from Pip, taught by you.
        </span>
      </div>
      <div className="transfer-invitation">
        <span className="eyebrow">PIP LEARNED. BUT DID YOU?</span>
        <p>Two new pictures. Same idea. Your turn.</p>
        <button className="button green" onClick={onContinue}>
          Let me prove it <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
