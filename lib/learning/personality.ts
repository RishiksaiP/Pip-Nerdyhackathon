import { z } from "zod";
export const reactions = {
  curious: [
    "Can you show me how you see it?",
    "Your idea first. I’ll follow along.",
    "My notebook has questions. Several.",
  ],
  confused: [
    "Wait. Let’s test that with the objects.",
    "Something doesn’t match yet. Let’s look closer.",
    "That piece has chosen chaos.",
  ],
  tiny_victory: [
    "That matches the picture you built.",
    "I can see your idea now.",
    "A small discovery. A suspiciously large grin.",
  ],
  big_victory: [
    "You used the idea in two new pictures.",
    "Look what your teaching did!",
    "I brought a notebook. You brought the understanding.",
  ],
  mistake: [
    "Can you check my idea?",
    "I think I know. Will you test it?",
    "I was VERY confident about that. Inconvenient.",
  ],
  learner_corrects_pip: [
    "You helped me change my mind.",
    "I’ll put your explanation in my notebook.",
    "Okay, professor. Updating my brain.",
  ],
  level_up: [
    "Your teaching lit up my Star Core.",
    "Look what we can explore now.",
    "Uh… was I supposed to start glowing?",
  ],
  returns_after_break: [
    "You’re back. I saved our notebook.",
    "Our next mystery is ready whenever you are.",
    "Notebook: ready. Pencil: probably behind my ear.",
  ],
  hard_problem: [
    "Take your time. We can investigate together.",
    "Try a different picture of the same idea.",
    "This one brought a disguise.",
  ],
  microphone: [
    "I’m listening to your idea.",
    "Tell me in your own words.",
    "My ears are… somewhere. I’m listening.",
  ],
  moonberry: [
    "Same bottles. Same potion. Different amounts.",
    "We need Moonberry Potion to wake the star projector.",
    "Moonberry Potion! The ceiling used to be less purple.",
  ],
  transfer: [
    "New picture. Your idea still works here.",
    "Your turn. I’ll keep my notebook closed.",
    "New problem. Same idea. Sneaky.",
  ],
  mastery: [
    "You taught me something I can keep.",
    "That idea has earned its own star.",
    "I may be the student here. Definitely the student.",
  ],
  thinking: [
    "I’m checking the idea you taught me.",
    "Let me connect those pieces.",
    "My brain is making the little thinking noises.",
  ],
} as const;
export type ReactionCategory = keyof typeof reactions;
export const reactionSchema = z
  .object({
    emotion: z.enum([
      "curious",
      "thinking",
      "confused",
      "proud",
      "playful",
      "excited",
    ]),
    reaction_type: z.string().max(40),
    dialogue: z.string().max(210),
    animation: z.enum(["idle", "aha", "listen", "think"]),
    next_action: z.enum(["stay", "correct", "transfer"]),
    humor_used: z.boolean(),
  })
  .strict();
// Every fourth opportunity may be humorous. Seed from real events, never rerender count.
export function reaction(category: ReactionCategory, sequence: number) {
  const humor = sequence % 4 === 3;
  return reactionSchema.parse({
    emotion:
      category === "thinking" ? "thinking" : humor ? "playful" : "curious",
    reaction_type: category,
    dialogue: reactions[category][humor ? 2 : sequence % 2],
    animation: category === "thinking" ? "think" : "idle",
    next_action: "stay",
    humor_used: humor,
  });
}
export function explanationReaction(
  text: string,
  attempts: number,
  concepts: string[],
) {
  if (attempts > 0)
    return "You changed your explanation. Now I can see why it works.";
  if (/denominator|numerator/.test(text.toLowerCase()))
    return "You even knew the math word for it. Let me try your idea.";
  if (concepts.includes("fraction_value"))
    return "Oh! More equal pieces of the same whole means smaller pieces. Can I try?";
  if (concepts.includes("equal_groups"))
    return "Each group has the same number. Now I see why you multiplied.";
  if (concepts.includes("zero_placeholder"))
    return "The zero keeps that place empty. It has a job after all.";
  return "Your words match the picture. Let me try what you taught me.";
}
