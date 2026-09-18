import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("synthetic microphone through faster-whisper, strict Qwen, mastery and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const traces: unknown[] = [];
  await page.goto("/demo?presentation=1&reset=1&provider=llamacpp");
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Show Pip", exact: true }).click();
  await page.getByRole("button", { name: "Talk to Pip", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stop recording" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/screenshots/live-listening.png" });
  // Real browser MediaRecorder input from an explicitly synthetic 6.7-second WAV.
  await page.waitForTimeout(8500);
  const speechResponse = page.waitForResponse("**/api/voice/transcribe");
  await page.getByRole("button", { name: "Stop recording" }).click();
  const speech = await (await speechResponse).json();
  expect(speech.source).toBe("local");
  expect(speech.text).toMatch(/smaller/i);
  await expect(page.getByLabel("Your explanation")).toHaveValue(speech.text);
  await expect(page.getByLabel("Your explanation")).toBeEditable();
  const evaluation = page.waitForResponse("**/api/explanation/evaluate");
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  const first = await (await evaluation).json();
  expect(first.trace.fallback).toBe(false);
  expect(first.trace.provider).toBe("llamacpp");
  traces.push(first.trace);
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page
    .getByLabel("Your correction")
    .fill(
      "They are the same size whole. More equal pieces make each piece smaller.",
    );
  const correction = page.waitForResponse("**/api/explanation/evaluate");
  await page.getByRole("button", { name: "Here’s why" }).click();
  const second = await (await correction).json();
  expect(second.accepted).toBe(true);
  expect(second.trace.fallback).toBe(false);
  traces.push(second.trace);
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
  await page.screenshot({ path: "artifacts/screenshots/live-level-up.png" });
  await page.getByRole("button", { name: "Skip celebration" }).click();
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Mischief Goggles/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Mischief Goggles · Equipped/ }),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Pip level up" })).toHaveCount(
    0,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(saved.xp).toBe(665);
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    for (const route of ["/demo", "/pip", "/world", "/grownups", "/lab"]) {
      await page.goto(route);
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      await expect(
        page.getByText("665 XP", { exact: true }).first(),
      ).toBeVisible();
      if (route === "/lab")
        await expect(
          page.getByText(/faster-whisper · faster-whisper-base.en/),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/screenshots/live-${route.slice(1)}-${size.width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
  writeFileSync(
    "artifacts/live-ai/browser.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        syntheticAudio: true,
        speechSource: speech.source,
        traces,
        mastery: true,
        xp: saved.xp,
        level: 5,
        persistence: true,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
});
