import { expect, test } from "@playwright/test";
import { lessons } from "../../content/curriculum";
import { freshRun, freshSession } from "../../lib/persistence/store";

test("every adventure renders its objects and shared voice on both response stages", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const lesson of lessons) {
    for (const stage of [0, 1, 2]) {
      const session = {
        ...freshSession(),
        run: { ...freshRun(lesson.id), stage, correctionRevealed: stage === 2 },
      };
      await page.goto("/");
      await page.evaluate(
        (s) => localStorage.setItem("pip-session-v1", JSON.stringify(s)),
        session,
      );
      await page.goto(`/play/${lesson.world}`);
      await expect(
        page.getByRole("heading", { name: lesson.title, exact: true }),
      ).toBeVisible();
      if (stage === 0)
        await expect(
          page.getByRole("button", { name: "Show Pip", exact: true }),
        ).toBeVisible();
      else {
        await expect(
          page.getByRole("button", { name: "Talk to Pip", exact: true }),
        ).toBeEnabled();
        await expect(
          page.getByLabel(
            stage === 1 ? "Your explanation" : "Your correction",
            { exact: true },
          ),
        ).toBeEditable();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("level celebration equips a reward, preserves choice, and reset clears it", async ({
  page,
}) => {
  await page.goto("/demo?reset=1");
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Show Pip", exact: true }).click();
  const text = "More equal pieces of the same whole make every piece smaller.";
  await page.getByLabel("Your explanation").fill(text);
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByLabel("Your correction").fill(text);
  await page.getByRole("button", { name: "Here’s why" }).click();
  await page.getByRole("button", { name: "Let me prove it" }).click();
  await page
    .getByRole("button", { name: "Number line 2 of 6", exact: true })
    .click();
  await page.getByRole("button", { name: "Prove it", exact: true }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/3 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Prove it", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Pip level up" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/screenshots/level-up.png" });
  await page.getByRole("button", { name: "Skip celebration" }).click();
  await page.getByRole("button", { name: /Mischief Goggles/ }).click();
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(before.progression.equipped).toBe("goggles");
  expect(before.xp).toBe(665);
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Pip level up" })).toHaveCount(
    0,
  );
  await expect(page.locator(".xp-flight")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Mischief Goggles · Equipped/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Visit Pip’s room" }).click();
  await expect(
    page.getByText("Star projector is awake", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Mischief Goggles Wearing it/ }),
  ).toBeVisible();
  await page.goto("/demo?reset=1");
  await expect(
    page.getByRole("button", { name: "Show Pip", exact: true }),
  ).toBeVisible();
  const reset = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(reset.xp).toBe(450);
  expect(reset.progression.awards).toEqual([]);
  expect(reset.progression.equipped).toBe("compass");
});
