import { afterEach, describe, expect, it, vi } from "vitest";
import {
  freshSession,
  freshRun,
  localRepository,
  sessionSchema,
} from "../../lib/persistence/store";
afterEach(() => vi.unstubAllGlobals());
describe("saved progress boundaries", () => {
  it("migrates old runs to their lesson skill and preserves larger transfer lines", () => {
    const session = { ...freshSession(), run: freshRun("place-value") };
    const legacy = JSON.parse(JSON.stringify(session));
    delete legacy.run.skillId;
    expect(sessionSchema.parse(legacy).run?.skillId).toBe("compose_numbers");
    const fractions = {
      ...freshSession(),
      run: { ...freshRun("unlike-denominators"), transferLine: 7 },
    };
    expect(sessionSchema.safeParse(fractions).success).toBe(true);
  });
  it("preserves valid resolved misconceptions and demo provenance", () => {
    const session = {
      ...freshSession(true),
      run: freshRun("fraction-meaning"),
    };
    session.misconceptions.push({
      code: "FRACTION_PARTS_NOT_EQUAL",
      confidence: 0.2,
      observations: 2,
      resolvedAt: "2026-09-15",
    });
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(session) });
    expect(localRepository.load()).toEqual(session);
  });
  it("rejects corrupted lesson IDs, object counts, and misconception codes", () => {
    const session = { ...freshSession(), run: freshRun("fraction-meaning") };
    for (const run of [
      { ...session.run, rows: -1 },
      { ...session.run, hundreds: 1000000 },
      { ...session.run, lessonId: "missing" },
      { ...session.run, selected: [0, 0, 0] },
      { ...session.run, selected: [7] },
    ]) {
      expect(sessionSchema.safeParse({ ...session, run }).success).toBe(false);
    }
    expect(
      sessionSchema.safeParse({
        ...session,
        misconceptions: [{ code: "unknown", confidence: 0.8, observations: 1 }],
      }).success,
    ).toBe(false);
  });
  it("recovers from malformed or unavailable browser storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{broken" });
    expect(localRepository.load().xp).toBe(0);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("full");
      },
    });
    expect(localRepository.load().run).toBeNull();
    expect(localRepository.save(freshSession())).toBe(false);
  });
});
