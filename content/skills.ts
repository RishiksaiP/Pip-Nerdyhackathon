import type { World } from "./curriculum";
export type Skill = {
  id: string;
  title: string;
  world: World;
  prerequisites: string[];
  lessonId: string;
  concept: string;
  x: number;
  y: number;
};
export const skills: Skill[] = [
  {
    id: "equal_partitioning",
    title: "Equal parts",
    world: "fractions",
    prerequisites: [],
    lessonId: "equal-parts",
    concept: "A fraction needs equal-sized parts of one whole.",
    x: 9,
    y: 62,
  },
  {
    id: "identify_fraction",
    title: "Name the fraction",
    world: "fractions",
    prerequisites: ["equal_partitioning"],
    lessonId: "fraction-meaning",
    concept: "The numerator counts selected parts.",
    x: 25,
    y: 34,
  },
  {
    id: "numerator_denominator_meaning",
    title: "Pieces and the whole",
    world: "fractions",
    prerequisites: ["identify_fraction"],
    lessonId: "fraction-meaning",
    concept:
      "The denominator counts all equal parts; the numerator counts selected parts.",
    x: 41,
    y: 55,
  },
  {
    id: "fraction_magnitude",
    title: "Fraction magnitude",
    world: "fractions",
    prerequisites: [],
    lessonId: "moonberry-mix-up",
    concept: "For the same whole, more equal pieces make each piece smaller.",
    x: 57,
    y: 24,
  },
  {
    id: "compare_fractions",
    title: "Compare fractions",
    world: "fractions",
    prerequisites: ["fraction_magnitude"],
    lessonId: "unlike-denominators",
    concept: "Compare fractional values on the same whole.",
    x: 75,
    y: 53,
  },
  {
    id: "equivalent_fractions",
    title: "Different look. Same amount.",
    world: "fractions",
    prerequisites: ["fraction_magnitude"],
    lessonId: "equivalent-fractions",
    concept: "Different fractions can name the same amount.",
    x: 91,
    y: 29,
  },
  {
    id: "equal_groups",
    title: "Equal groups",
    world: "multiplication",
    prerequisites: [],
    lessonId: "equal-groups",
    concept: "Multiplication counts equal groups.",
    x: 10,
    y: 52,
  },
  {
    id: "repeated_addition",
    title: "Add the groups",
    world: "multiplication",
    prerequisites: ["equal_groups"],
    lessonId: "equal-groups",
    concept: "Three groups of four are four plus four plus four.",
    x: 30,
    y: 26,
  },
  {
    id: "arrays",
    title: "Rows and columns",
    world: "multiplication",
    prerequisites: ["repeated_addition"],
    lessonId: "equal-groups",
    concept: "Rows times columns counts every object.",
    x: 50,
    y: 53,
  },
  {
    id: "multiplication_facts",
    title: "Multiplication facts",
    world: "multiplication",
    prerequisites: ["arrays"],
    lessonId: "equal-groups",
    concept: "Known equal groups help recall a product.",
    x: 70,
    y: 25,
  },
  {
    id: "distributive_reasoning",
    title: "Split a group",
    world: "multiplication",
    prerequisites: ["multiplication_facts"],
    lessonId: "equal-groups",
    concept: "Split an array, then add the partial products.",
    x: 90,
    y: 53,
  },
  {
    id: "identify_digit_value",
    title: "A digit’s value",
    world: "place-value",
    prerequisites: [],
    lessonId: "place-value",
    concept: "A digit’s position tells its value.",
    x: 14,
    y: 53,
  },
  {
    id: "compose_numbers",
    title: "Build a number",
    world: "place-value",
    prerequisites: ["identify_digit_value"],
    lessonId: "place-value",
    concept: "Hundreds, tens and ones combine to make a number.",
    x: 38,
    y: 26,
  },
  {
    id: "expanded_form",
    title: "Unpack a number",
    world: "place-value",
    prerequisites: ["compose_numbers"],
    lessonId: "place-value",
    concept: "203 is 200 plus 0 plus 3.",
    x: 64,
    y: 53,
  },
  {
    id: "compare_multi_digit_numbers",
    title: "Compare numbers",
    world: "place-value",
    prerequisites: ["expanded_form"],
    lessonId: "place-value",
    concept: "Compare the greatest place first.",
    x: 88,
    y: 26,
  },
];
export const getSkill = (id: string) => skills.find((s) => s.id === id);
export function skillForLesson(id: string) {
  return (
    (
      {
        "moonberry-mix-up": "fraction_magnitude",
        "fraction-meaning": "fraction_magnitude",
        "equal-parts": "equal_partitioning",
        "equivalent-fractions": "equivalent_fractions",
        "same-denominator": "compare_fractions",
        "unlike-denominators": "compare_fractions",
        "fraction-number-line": "fraction_magnitude",
        "equal-groups": "equal_groups",
        "place-value": "compose_numbers",
      } as Record<string, string>
    )[id] ?? "fraction_magnitude"
  );
}
// Nodes without their own activity stay visible as curriculum, never pretend to be playable.
export const implementedSkills = new Set([
  "equal_partitioning",
  "identify_fraction",
  "numerator_denominator_meaning",
  "fraction_magnitude",
  "compare_fractions",
  "equivalent_fractions",
  "equal_groups",
  "repeated_addition",
  "arrays",
  "identify_digit_value",
  "compose_numbers",
  "expanded_form",
]);
