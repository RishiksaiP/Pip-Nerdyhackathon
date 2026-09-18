import { z } from "zod";
import type { Session } from "../persistence/store";
export const cosmetics = [
  { id: "compass", name: "Star Compass", level: 3, icon: "✧" },
  { id: "scarf", name: "Moon Explorer Scarf", level: 5, icon: "≈" },
  { id: "notebook", name: "Starry Notebook", level: 5, icon: "▤" },
  { id: "goggles", name: "Mischief Goggles", level: 5, icon: "◎" },
  { id: "cape", name: "Keeper’s Cape", level: 8, icon: "◇" },
  { id: "core", name: "Aurora Star Core", level: 12, icon: "✦" },
] as const;
export const cosmeticId = z.enum([
  "compass",
  "scarf",
  "notebook",
  "goggles",
  "cape",
  "core",
]);
export const progressionSchema = z
  .object({
    awards: z
      .array(
        z.object({
          key: z.string(),
          label: z.string(),
          xp: z.number().int().positive(),
        }),
      )
      .default([]),
    equipped: cosmeticId.nullable().default(null),
    chosen: z.array(cosmeticId).default([]),
    celebratedLevel: z.number().int().min(1).default(1),
  })
  .default({ awards: [], equipped: null, chosen: [], celebratedLevel: 1 });
export const evolutions = [
  { level: 1, name: "Curious Spark", reward: "A curious apprentice" },
  { level: 3, name: "Bright Spark", reward: "Star Compass" },
  {
    level: 5,
    name: "Junior Explorer",
    reward: "Choose a scarf, notebook or goggles",
  },
  {
    level: 8,
    name: "Knowledge Keeper",
    reward: "Keeper’s Cape + orbiting rune",
  },
  { level: 12, name: "Star Scholar", reward: "Aurora Star Core" },
  {
    level: 20,
    name: "Master Explorer",
    reward: "A sky full of your discoveries",
  },
];
export function progression(xp: number) {
  const level = Math.floor(xp / 150) + 1;
  return {
    level,
    within: xp % 150,
    remaining: 150 - (xp % 150),
    current: evolutions.findLast((e) => e.level <= level)!,
    next: evolutions.find((e) => e.level > level),
    unlocked: cosmetics.filter((c) => c.level <= level),
  };
}
// A key names a real piece of evidence. Replays and repeated submissions cannot mint XP.
export function award(
  s: Session,
  key: string,
  label: string,
  xp: number,
): Session {
  if (s.progression.awards.some((a) => a.key === key)) return s;
  return {
    ...s,
    xp: s.xp + xp,
    progression: {
      ...s.progression,
      awards: [...s.progression.awards, { key, label, xp }],
    },
  };
}
