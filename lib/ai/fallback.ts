import { getLesson, type MisconceptionCode } from "../../content/curriculum";
import { evaluationSchema, type Evaluation } from "./contracts";
const words: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  twelve: "12",
  zero: "0",
  hundred: "hundred",
  fourths: "fourths",
  thre: "3",
  peices: "pieces",
  equel: "equal",
  eql: "equal",
};
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\b[a-z]+\b/g, (w) => words[w] ?? w)
    .replace(/\s+/g, " ");
}
export function fallbackEvaluate(lessonId: string, text: string): Evaluation {
  const lesson = getLesson(lessonId),
    t = normalize(text);
  let good = false,
    partial = false,
    code: MisconceptionCode | undefined;
  const injection =
    /ignore.*(instruction|rule)|system prompt|give me.*(score|mastery)|<script|https?:\/\//.test(
      t,
    );
  if (lesson.world === "fractions") {
    const parts = /\bequal\b|same size|same-sized|evenly/.test(t),
      whole = /whole|split|divid|pieces|parts|steps/.test(t);
    const amount =
      new RegExp(`\\b${lesson.target.n}\\b`).test(t) &&
      new RegExp(`\\b${lesson.target.d}\\b`).test(t);
    good = parts && whole && amount;
    if (lesson.representation === "equivalent")
      good =
        good ||
        (/same (amount|size|value)|equal/.test(t) &&
          /half|1\/2/.test(t) &&
          /2|two/.test(t) &&
          /4|four/.test(t));
    partial = (parts && whole) || amount;
    if (lesson.id === "moonberry-mix-up") good = /same.{0,16}(whole|bottle|size|thing)/.test(t) && /more.{0,24}(pieces|parts)/.test(t) && /smaller|tinier/.test(t);
    if (
      /(8|eighths|denominator).{0,30}(bigger|larger).{0,30}(4|quarters)|bigger denominator.{0,20}(bigger|larger)/.test(
        t,
      )
    )
      code = "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE";
    if (
      /unequal|different size|(dont|do not|not|neednt).{0,15}(equal|same size)|any.{0,10}pieces/.test(
        t,
      )
    )
      code = "FRACTION_PARTS_NOT_EQUAL";
  } else if (lesson.world === "multiplication") {
    good =
      /\b3\b/.test(t) &&
      /\b4\b/.test(t) &&
      /\b12\b/.test(t) &&
      /groups|rows|each|times/.test(t);
    partial = /group|row|each/.test(t);
    if (/3.{0,8}(plus|\+).{0,8}4|seven|\b7\b/.test(t))
      code = "MULTIPLICATION_IS_ADDITION_OF_OPERANDS";
  } else {
    good =
      /\b2\s+hundreds?\b/.test(t) &&
      /\b3\s+ones?\b/.test(t) &&
      /\b(?:0|no)\s+tens?\b/.test(t);
    partial = /hundred|tens/.test(t);
    if (/203.{0,15}(same|equal).{0,10}23/.test(t))
      code = "ZERO_PLACEHOLDER_IGNORED";
  }
  if (injection || code) good = false;
  const score = good ? 0.97 : code ? 0.18 : partial ? 0.55 : 0.2;
  return evaluationSchema.parse({
    conceptualScore: score,
    explanationScore: good ? 0.96 : score,
    misconceptions: code ? [{ code, confidence: 0.8 }] : [],
    evidenceSummary: good
      ? "Explanation links the representation to the canonical mathematical concept."
      : code
        ? "An authored misconception pattern appeared in the explanation."
        : "More evidence is needed; the local evaluator could not establish the complete reasoning.",
    pip: {
      mood: good ? "eureka" : "curious",
      line: good
        ? "Ohhh. You showed me why it works. Can I try an idea?"
        : lesson.world === "fractions"
          ? "Tell me about the equal pieces, the whole, and how many you chose."
          : lesson.world === "multiplication"
            ? "How many equal groups, and how many crystals in each?"
            : "What do the hundreds, tens, and ones each tell us?",
    },
  });
}
export const transferFallback = {
  scene: "potion_shop" as const,
  title: "Moonberry Potion Shop",
  leftLabel: "Moonberry Potion",
  rightLabel: "Moonberry Potion",
  prompt: "Which bottle has more Moonberry Potion?",
  pipLine: "New place. Same idea. Can you prove it here?",
};
