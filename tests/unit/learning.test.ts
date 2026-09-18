import { describe, it, expect } from "vitest";
import {
  type Session,
  freshSession,
  freshRun,
} from "../../lib/persistence/store";
import { recordLearning } from "../../lib/learning/actions";
import {
  seedLearning,
  skillState,
  nextMission,
  canStart,
} from "../../lib/learning/model";
import type { LearningEvidence } from "../../lib/learning/model";
const now = Date.parse("2026-09-17T12:00:00Z");
function credible(): LearningEvidence[] {
  let s: Session = { ...freshSession(true), run: freshRun("fraction-meaning") };
  s = recordLearning(s, "build", "demonstrated");
  s = recordLearning(s, "explain", "demonstrated");
  s = recordLearning(s, "repair", "demonstrated");
  s = recordLearning(s, "transfer", "demonstrated");
  s.run!.transferStep = 1;
  s = recordLearning(s, "transfer", "demonstrated");
  return s.learning;
}
describe("evidence-led learning and missions", () => {
  it("requires two distinct independent transfers even with perfect seeded concept evidence", () => {
    const events = seedLearning(now).filter(
      (e) => e.skillId === "fraction_magnitude",
    );
    expect(skillState(events, "fraction_magnitude").mastered).toBe(false);
    const all = credible();
    expect(skillState(all, "fraction_magnitude").mastered).toBe(true);
    expect(
      skillState(
        all.filter(
          (e) => !(e.kind === "transfer" && e.activityId.endsWith("-1")),
        ),
        "fraction_magnitude",
      ).mastered,
    ).toBe(false);
  });
  it("hints lower evidence strength and prevent assisted transfer counting as independent", () => {
    const all = credible(),
      modified = all.map((e) =>
        e.seeded ? e : { ...e, hints: 3, independent: false },
      );
    expect(skillState(modified, "fraction_magnitude").mastered).toBe(false);
    expect(skillState(modified, "fraction_magnitude").overall).toBeLessThan(
      skillState(all, "fraction_magnitude").overall,
    );
  });
  it("deduplicates successful stages but permits a new run to strengthen evidence", () => {
    let s: Session = {
      ...freshSession(),
      run: freshRun("equal-parts", "equal_partitioning"),
    };
    s = recordLearning(s, "build", "demonstrated");
    const repeated = recordLearning(s, "build", "demonstrated");
    expect(repeated.learning).toHaveLength(1);
    s = { ...s, run: freshRun("equal-parts", "equal_partitioning") };
    expect(recordLearning(s, "build", "demonstrated").learning).toHaveLength(2);
  });
  it("gates prerequisites and unlocks equivalence after the hero", () => {
    expect(canStart([], "equivalent_fractions")).toBe(false);
    expect(nextMission([], "fractions", now).skill.id).toBe(
      "equal_partitioning",
    );
    const events = credible();
    expect(canStart(events, "equivalent_fractions")).toBe(true);
    expect(nextMission(events, "fractions").skill.id).toBe(
      "equivalent_fractions",
    );
  });
  it("schedules 1, 3, then 7-day reviews and prioritizes overdue recall", () => {
    let events = credible().map((e) => ({
      ...e,
      at: new Date(now).toISOString(),
    }));
    let state = skillState(events, "fraction_magnitude", now);
    expect(state.dueAt).toBe(new Date(now + 86400000).toISOString());
    for (const [i, days] of [3, 7].entries()) {
      events = [
        ...events,
        {
          ...events.at(-1)!,
          id: `review-${i}`,
          kind: "retention",
          at: state.dueAt!,
          seeded: false,
        },
      ];
      const anchor = Date.parse(state.dueAt!);
      state = skillState(events, "fraction_magnitude", anchor);
      expect(state.dueAt).toBe(
        new Date(anchor + days * 86400000).toISOString(),
      );
    }
    expect(
      nextMission(events, "fractions", Date.parse(state.dueAt!) + 1).review,
    ).toBe(true);
  });
});
