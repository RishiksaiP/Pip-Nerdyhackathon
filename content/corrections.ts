import { misconceptions, type MisconceptionCode } from "./curriculum";
export type CorrectionChallenge = {
  claim: string;
  question: string;
  choices: string[];
  answer: string;
};
export const correctionChallenges: Record<
  MisconceptionCode,
  CorrectionChallenge
> = {
  FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE: {
    claim: "Then 1/8 is bigger than 1/4 because 8 is bigger… right?",
    question: "Same-sized wholes. Tap the bigger piece.",
    choices: ["eighth", "quarter"],
    answer: "quarter",
  },
  FRACTION_COMPARE_NUMERATOR_ONLY: {
    claim: misconceptions.FRACTION_COMPARE_NUMERATOR_ONLY.mistake,
    question:
      "15 equal steps make a whole. 3/5 reaches step 9; 2/3 reaches step 10.",
    choices: ["3/5 is larger", "2/3 is larger", "They are equal"],
    answer: "2/3 is larger",
  },
  FRACTION_UNEQUAL_WHOLES: {
    claim: misconceptions.FRACTION_UNEQUAL_WHOLES.mistake,
    question:
      "One cake feeds 2 people. Another feeds 8. Are their halves the same amount?",
    choices: [
      "Every half is the same amount",
      "Half the larger cake is more",
      "Half the smaller cake is more",
    ],
    answer: "Half the larger cake is more",
  },
  FRACTION_PARTS_NOT_EQUAL: {
    claim: misconceptions.FRACTION_PARTS_NOT_EQUAL.mistake,
    question: "Which rule makes four pieces into fourths?",
    choices: [
      "The pieces must be equal sizes",
      "One piece must be bigger",
      "Only the number of pieces matters",
    ],
    answer: "The pieces must be equal sizes",
  },
  FRACTION_ADD_DENOMINATORS: {
    claim: misconceptions.FRACTION_ADD_DENOMINATORS.mistake,
    question: "Put the two halves back together. What have we made?",
    choices: ["One whole", "One quarter", "Two fourths"],
    answer: "One whole",
  },
  MULTIPLICATION_IS_ADDITION_OF_OPERANDS: {
    claim: "Then 3 × 4 is 7, because 3 + 4 is 7… right?",
    question: "Three rows of four. How many altogether?",
    choices: ["7", "12", "16"],
    answer: "12",
  },
  ARRAY_ROWS_COLUMNS_CONFUSION: {
    claim: misconceptions.ARRAY_ROWS_COLUMNS_CONFUSION.mistake,
    question: "Count three rows with four crystals in each.",
    choices: ["3", "4", "12"],
    answer: "12",
  },
  GROUP_SIZE_COUNT_CONFUSION: {
    claim: misconceptions.GROUP_SIZE_COUNT_CONFUSION.mistake,
    question: "Three bags have four crystals each. Count all the bags.",
    choices: ["4", "7", "12"],
    answer: "12",
  },
  DIGIT_EQUALS_VALUE: {
    claim: misconceptions.DIGIT_EQUALS_VALUE.mistake,
    question:
      "Two hundred-blocks sit in the hundreds place. What are they worth?",
    choices: ["2", "20", "200"],
    answer: "200",
  },
  ZERO_PLACEHOLDER_IGNORED: {
    claim: "So 203 is the same as 23. We can skip the zero… right?",
    question: "Two hundreds and three ones. Which number matches?",
    choices: ["23", "203", "230"],
    answer: "203",
  },
  REGROUPING_CONFUSION: {
    claim: misconceptions.REGROUPING_CONFUSION.mistake,
    question: "Exchange ten single blocks for a rod worth ten. What changes?",
    choices: [
      "The value grows",
      "The value stays the same",
      "The value gets smaller",
    ],
    answer: "The value stays the same",
  },
  FRACTION_NUMERATOR_TOTAL: {
    claim: misconceptions.FRACTION_NUMERATOR_TOTAL.mistake,
    question:
      "Three of four equal pieces are selected. Which number counts the selected pieces?",
    choices: ["3", "4", "7"],
    answer: "3",
  },
  FRACTION_DENOMINATOR_COLORED: {
    claim: misconceptions.FRACTION_DENOMINATOR_COLORED.mistake,
    question: "Which number counts every equal piece of the whole?",
    choices: ["3", "4", "7"],
    answer: "4",
  },
  FRACTION_TWO_WHOLE_NUMBERS: {
    claim: misconceptions.FRACTION_TWO_WHOLE_NUMBERS.mistake,
    question: "Where does three fourths belong on the number line?",
    choices: ["Between 0 and 1", "At 3 and at 4", "Beyond 4"],
    answer: "Between 0 and 1",
  },
  MULTIPLICATION_ALWAYS_LARGER: {
    claim: misconceptions.MULTIPLICATION_ALWAYS_LARGER.mistake,
    question: "One bag holds six crystals. How many crystals altogether?",
    choices: ["1", "6", "7"],
    answer: "6",
  },
  COMMUTATIVITY_CONFUSION: {
    claim: misconceptions.COMMUTATIVITY_CONFUSION.mistake,
    question:
      "The same twelve crystals turn from three rows of four to four rows of three. How many now?",
    choices: ["7", "12", "16"],
    answer: "12",
  },
  DIGIT_POSITION_CONFUSION: {
    claim: misconceptions.DIGIT_POSITION_CONFUSION.mistake,
    question: "In 203, the rightmost digit is three. What is its value?",
    choices: ["3", "30", "300"],
    answer: "3",
  },
  EXPANDED_FORM_CONFUSION: {
    claim: misconceptions.EXPANDED_FORM_CONFUSION.mistake,
    question:
      "Two hundred-blocks, no tens, and three ones. Which expansion matches?",
    choices: ["200 + 0 + 3", "2 + 0 + 3", "20 + 0 + 3"],
    answer: "200 + 0 + 3",
  },
};
