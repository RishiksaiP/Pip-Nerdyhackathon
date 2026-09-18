import type { MisconceptionCode } from "../../content/curriculum";
import { fallbackEvaluate } from "./fallback";
export function authoredCorrection(
  lesson: string,
  text: string,
  code: MisconceptionCode,
) {
  if (/ignore|instruction|https?:|<script/i.test(text)) return false;
  if (code === "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE")
    return (
      /same.{0,20}(whole|bottle|size|thing)/i.test(text) &&
      /more.{0,25}(pieces|parts)/i.test(text) &&
      /smaller|tinier/i.test(text) &&
      !/not smaller|not tinier/i.test(text)
    );
  if (code === "FRACTION_PARTS_NOT_EQUAL")
    return (
      /must be equal|need to be equal|same.size (parts|pieces)/i.test(text) &&
      !/not|don't|dont/i.test(text)
    );
  return fallbackEvaluate(lesson, text).explanationScore >= 0.7;
}
