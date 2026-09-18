import type { Fraction } from "../lib/math/kernel";
export type World = "fractions" | "multiplication" | "place-value";
export const misconceptionCodes = [
  "FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE",
  "FRACTION_COMPARE_NUMERATOR_ONLY",
  "FRACTION_UNEQUAL_WHOLES",
  "FRACTION_PARTS_NOT_EQUAL",
  "FRACTION_ADD_DENOMINATORS",
  "MULTIPLICATION_IS_ADDITION_OF_OPERANDS",
  "ARRAY_ROWS_COLUMNS_CONFUSION",
  "GROUP_SIZE_COUNT_CONFUSION",
  "DIGIT_EQUALS_VALUE",
  "ZERO_PLACEHOLDER_IGNORED",
  "REGROUPING_CONFUSION",
  "FRACTION_NUMERATOR_TOTAL",
  "FRACTION_DENOMINATOR_COLORED",
  "FRACTION_TWO_WHOLE_NUMBERS",
  "MULTIPLICATION_ALWAYS_LARGER",
  "COMMUTATIVITY_CONFUSION",
  "DIGIT_POSITION_CONFUSION",
  "EXPANDED_FORM_CONFUSION",
] as const;
export type MisconceptionCode = (typeof misconceptionCodes)[number];
export const misconceptions = Object.fromEntries(
  misconceptionCodes
    .slice(0, 11)
    .map((code, i) => [
      code,
      {
        code,
        skill: i < 5 ? "fractions" : i < 8 ? "multiplication" : "place-value",
        description: [
          "Larger denominator treated as larger fraction",
          "Only numerators compared",
          "Different wholes treated as equal",
          "Unequal pieces counted as equal",
          "Denominators added",
          "Operands added instead of equal groups",
          "Array rows and columns confused",
          "Number of groups confused with group size",
          "Digit confused with its place value",
          "Zero placeholder skipped",
          "Regrouping changes value",
        ][i],
        correction: [
          "For the same whole, more equal pieces make smaller pieces.",
          "Compare both fractions by value.",
          "Compare fractions of equal-sized wholes.",
          "Every fractional piece must be equal.",
          "Use a common denominator before adding.",
          "Multiplication counts equal groups.",
          "Rows times columns counts all objects.",
          "Count the groups and the size of each group.",
          "A digit’s value depends on its position.",
          "Zero holds an empty place.",
          "Ten ones have the same value as one ten.",
        ][i],
        mistake: [
          "One eighth is bigger than one quarter because eight is bigger than four.",
          "Three fifths is bigger than two thirds because three is bigger than two.",
          "Half of a tiny cake equals half of a big cake.",
          "Any four pieces make quarters.",
          "One half plus one half equals two fourths.",
          "Three times four is seven.",
          "Three rows of four has only three objects.",
          "Three groups of four has only four objects.",
          "The two in 203 means two.",
          "203 is the same as 23.",
          "Trading ten ones for one ten changes the number.",
        ][i],
        intervention: [
          "Use equal-length bars split into quarters and eighths.",
          "Draw both fractions on one number line.",
          "Match the size of the wholes first.",
          "Compare the widths of the pieces.",
          "Overlay two halves onto one whole.",
          "Build three groups with four objects each.",
          "Count each row and each column.",
          "Separate group count from objects per group.",
          "Build the number with base-ten blocks.",
          "Build an empty tens column.",
          "Exchange ten ones for a ten rod.",
        ][i],
      },
    ]),
) as Record<
  MisconceptionCode,
  {
    code: MisconceptionCode;
    skill: string;
    description: string;
    correction: string;
    mistake: string;
    intervention: string;
  }
>;
Object.assign(misconceptions, {
  FRACTION_NUMERATOR_TOTAL: {
    code: "FRACTION_NUMERATOR_TOTAL",
    skill: "fractions",
    description: "Numerator treated as total pieces",
    mistake:
      "In three fourths, the three tells me how many pieces make the whole.",
    correction:
      "The denominator counts all equal parts; the numerator counts selected parts.",
    intervention:
      "Count all four pieces, then count the three selected pieces.",
  },
  FRACTION_DENOMINATOR_COLORED: {
    code: "FRACTION_DENOMINATOR_COLORED",
    skill: "fractions",
    description: "Denominator treated as selected pieces",
    mistake: "The four in three fourths means four pieces are colored.",
    correction:
      "The numerator counts selected parts. The denominator counts every equal part.",
    intervention: "Point to each selected part, then every part of the whole.",
  },
  FRACTION_TWO_WHOLE_NUMBERS: {
    code: "FRACTION_TWO_WHOLE_NUMBERS",
    skill: "fractions",
    description: "Fraction treated as two unrelated whole numbers",
    mistake: "Three fourths is just a three and a four, with no connection.",
    correction: "A fraction is one number: three equal fourths of a whole.",
    intervention: "Place the fraction at one point on a number line.",
  },
  MULTIPLICATION_ALWAYS_LARGER: {
    code: "MULTIPLICATION_ALWAYS_LARGER",
    skill: "multiplication",
    description: "Multiplication assumed to always increase value",
    mistake: "Multiplying six by one must make a bigger number.",
    correction:
      "One group of six is still six. Multiplication does not always make a number larger.",
    intervention: "Compare one group of six with six objects.",
  },
  COMMUTATIVITY_CONFUSION: {
    code: "COMMUTATIVITY_CONFUSION",
    skill: "multiplication",
    description: "Turning an array assumed to change its total",
    mistake: "If we turn three rows of four, we have a different total.",
    correction: "Turning an array changes rows and columns, but not its total.",
    intervention: "Turn the same array and count the unchanged objects.",
  },
  DIGIT_POSITION_CONFUSION: {
    code: "DIGIT_POSITION_CONFUSION",
    skill: "place-value",
    description: "Place positions counted from the wrong side",
    mistake: "In 203 the three is in the hundreds place.",
    correction: "From the right, places are ones, tens, then hundreds.",
    intervention: "Label each column starting with ones on the right.",
  },
  EXPANDED_FORM_CONFUSION: {
    code: "EXPANDED_FORM_CONFUSION",
    skill: "place-value",
    description: "Expanded form ignores place values",
    mistake: "203 can be unpacked as two plus zero plus three.",
    correction: "203 is two hundreds plus zero tens plus three ones.",
    intervention: "Write the value of each base-ten column before adding.",
  },
});
export type Lesson = {
  id: string;
  title: string;
  world: World;
  target: Fraction;
  representation: "bar" | "equivalent" | "number-line" | "array" | "base-ten" | "potion";
  concept: string;
  prerequisites: string[];
  hints: string[];
  good: string;
  weak: string;
  transferLeft: Fraction;
  transferRight: Fraction;
};
export const lessons: Lesson[] = [
  {
    id: "moonberry-mix-up", title: "Moonberry Mix-Up", world: "fractions",
    target: { n: 1, d: 4 }, representation: "potion", prerequisites: [],
    concept: "For identical bottles holding the same whole, dividing into more equal parts makes each part smaller. One fourth is more than one eighth.",
    hints: ["Compare the same-sized whole.", "Imagine splitting each bottle into equal pieces.", "More equal pieces make each piece smaller."],
    good: "They are the same size bottle, but when you split it into more equal pieces every piece gets smaller.",
    weak: "Eight is bigger than four so one eighth is more.",
    transferLeft: { n: 1, d: 3 }, transferRight: { n: 1, d: 6 },
  },
  {
    id: "fraction-meaning",
    title: "A whole lot of wonder",
    world: "fractions",
    target: { n: 3, d: 4 },
    representation: "bar",
    concept:
      "A fraction counts selected equal parts of one whole. The denominator is the number of equal parts; the numerator counts selected parts.",
    prerequisites: [],
    hints: [
      "How many equal pieces make the whole?",
      "The bottom number tells us there are four equal pieces.",
      "Fill three of the four equal pieces.",
    ],
    good: "The whole is split into four equal pieces and we take three.",
    weak: "Because three and four are the numbers.",
    transferLeft: { n: 2, d: 3 },
    transferRight: { n: 3, d: 4 },
  },
  {
    id: "equal-parts",
    title: "Equal means equal",
    world: "fractions",
    target: { n: 2, d: 3 },
    representation: "bar",
    concept: "A fraction needs equal parts of the same whole.",
    prerequisites: ["fraction-meaning"],
    hints: [
      "Look at the size of each piece.",
      "Three equally sized parts make thirds.",
      "Choose two of the three equal parts.",
    ],
    good: "Three equal pieces make a whole and two are selected.",
    weak: "Any three pieces work.",
    transferLeft: { n: 1, d: 3 },
    transferRight: { n: 1, d: 2 },
  },
  {
    id: "equivalent-fractions",
    title: "Different look. Same amount.",
    world: "fractions",
    target: { n: 2, d: 4 },
    representation: "equivalent",
    concept:
      "Equivalent fractions cover the same amount of the same whole: two fourths equals one half.",
    prerequisites: ["equal-parts"],
    hints: [
      "Match the amount shown in the top bar.",
      "Half of four equal pieces is two.",
      "Fill two fourths to match one half.",
    ],
    good: "Two of four equal pieces cover the same amount as one half.",
    weak: "Two fourths is larger because four is larger.",
    transferLeft: { n: 2, d: 4 },
    transferRight: { n: 1, d: 2 },
  },
  {
    id: "same-denominator",
    title: "More pieces, more potion",
    world: "fractions",
    target: { n: 3, d: 5 },
    representation: "bar",
    concept:
      "With equal denominators and equal wholes, the larger numerator counts more same-sized pieces.",
    prerequisites: ["equivalent-fractions"],
    hints: [
      "Each piece has the same size.",
      "The numerator counts selected pieces.",
      "Fill three fifths.",
    ],
    good: "The whole has five equal pieces and three are selected.",
    weak: "The bottom number counts what is colored.",
    transferLeft: { n: 2, d: 5 },
    transferRight: { n: 3, d: 5 },
  },
  {
    id: "unlike-denominators",
    title: "The little-piece puzzle",
    world: "fractions",
    target: { n: 5, d: 8 },
    representation: "bar",
    concept:
      "Compare fractional values with the same whole, not separate whole numbers.",
    prerequisites: ["same-denominator"],
    hints: [
      "Eight equal pieces make this whole.",
      "The top number is how many to fill.",
      "Select five of the eight pieces.",
    ],
    good: "Eight equal pieces make the whole and we take five.",
    weak: "Eighths are bigger than quarters.",
    transferLeft: { n: 5, d: 8 },
    transferRight: { n: 2, d: 3 },
  },
  {
    id: "fraction-number-line",
    title: "A new way to see it",
    world: "fractions",
    target: { n: 2, d: 3 },
    representation: "number-line",
    concept:
      "Fractions are positions on a number line; equal steps divide the distance from zero to one.",
    prerequisites: ["unlike-denominators"],
    hints: [
      "The space from zero to one is the whole.",
      "Each step is one third.",
      "Move to the second of three equal steps.",
    ],
    good: "Three equal steps make one whole and two steps reach two thirds.",
    weak: "Two thirds is at three.",
    transferLeft: { n: 3, d: 6 },
    transferRight: { n: 2, d: 3 },
  },
  {
    id: "equal-groups",
    title: "A little crystal counting",
    world: "multiplication",
    target: { n: 3, d: 4 },
    representation: "array",
    concept:
      "Three groups of four have twelve objects. Multiplication counts equal groups.",
    prerequisites: [],
    hints: [
      "Build equal rows.",
      "We need three rows with four in each.",
      "Set rows to three and columns to four.",
    ],
    good: "Three equal groups of four make twelve altogether.",
    weak: "Three plus four makes seven.",
    transferLeft: { n: 3, d: 1 },
    transferRight: { n: 4, d: 1 },
  },
  {
    id: "place-value",
    title: "A place for every star",
    world: "place-value",
    target: { n: 203, d: 1 },
    representation: "base-ten",
    concept:
      "203 is two hundreds, zero tens, and three ones. Zero holds the empty tens place.",
    prerequisites: [],
    hints: [
      "The first place counts hundreds.",
      "The zero means no tens.",
      "Use two hundreds, zero tens, and three ones.",
    ],
    good: "Two hundreds, zero tens and three ones make 203. Zero holds the tens place.",
    weak: "The two just means two.",
    transferLeft: { n: 320, d: 1 },
    transferRight: { n: 302, d: 1 },
  },
];
export const worldInfo = {
  fractions: {
    title: "Fraction Forest",
    kicker: "LITTLE PIECES. BIG DISCOVERIES.",
    color: "#91dfc0",
    icon: "leaf",
  },
  multiplication: {
    title: "Multiplication Mine",
    kicker: "EVERY GROUP HAS A STORY.",
    color: "#c3b4ea",
    icon: "gem",
  },
  "place-value": {
    title: "Place-Value Observatory",
    kicker: "EVERY DIGIT BELONGS SOMEWHERE.",
    color: "#f4cd7e",
    icon: "telescope",
  },
};
export const getLesson = (id: string) =>
  lessons.find((l) => l.id === id) ?? lessons[0];
