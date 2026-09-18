import { test, expect, type Page } from "@playwright/test";
const good =
  "The bottles are the same size whole. More equal pieces make each piece smaller, so one fourth is more than one eighth.";
async function build(page: Page) {
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Show Pip", exact: true }).click();
  await expect(page.getByLabel("Your explanation")).toBeVisible();
}
async function explain(page: Page) {
  await page.getByLabel("Your explanation").fill(good);
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Is Pip right?" }),
  ).toBeVisible({ timeout: 9000 });
}
async function correct(page: Page) {
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByLabel("Your correction").fill(good);
  await page.getByRole("button", { name: "Here’s why" }).click();
  await page.getByRole("button", { name: "Let me prove it" }).click();
  await expect(
    page.getByRole("heading", { name: "Find it on a number line." }),
  ).toBeVisible();
}
async function transfer(page: Page) {
  await page
    .getByRole("button", { name: "Number line 2 of 6", exact: true })
    .click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/3 full" })
    .click();
  await page.getByRole("button", { name: "Prove it" }).click();
}
test("landing opens world and Fraction Forest", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Teach Pip", exact: false })
    .first()
    .click();
  await expect(page).toHaveURL(/world/);
  await page.getByRole("link", { name: /Fraction Forest/ }).click();
  await expect(
    page.getByText("Which bottle has more Moonberry Potion?"),
  ).toBeVisible();
});
test("complete hero rehearsal, progression, evidence report, and lab", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "artifacts/screenshots/mastery-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Visit Pip’s room" }).click();
  await expect(page.getByText("1 discovery collected")).toBeVisible();
  await page.screenshot({
    path: "artifacts/screenshots/room-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "For grown-ups", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learning intelligence" }),
  ).toBeVisible();
  await expect(page.getByText("A misconception, reconsidered.")).toBeVisible();
  await page.screenshot({
    path: "artifacts/screenshots/grownups-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "How Pip learns", exact: true }).click();
  await expect(page.getByText("Exact math kernels")).toBeVisible();
  await page.screenshot({
    path: "artifacts/screenshots/lab-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("incorrect build is recoverable and novice discovery does not fake mastery", async ({
  page,
}) => {
  await page.goto("/play/fractions");
  await page.getByRole("button", { name: "Show Pip" }).click();
  await expect(page.locator(".feedback")).toContainText("Let’s test that");
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await expect(
    page.getByText("A NEW DISCOVERY", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toHaveCount(
    0,
  );
});
test("typed path survives offline and malformed explanation responses", async ({
  page,
}) => {
  await page.route("**/api/explanation/evaluate", (r) =>
    r.fulfill({ contentType: "application/json", body: '{"garbage":true}' }),
  );
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
});
test("slow AI times out and falls back", async ({ page }) => {
  await page.route("**/api/explanation/evaluate", async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 8000));
    await r.abort().catch(() => {});
  });
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await expect(
    page.getByRole("heading", { name: "Is Pip right?" }),
  ).toBeVisible({ timeout: 9000 });
});
test("microphone denial keeps typed input usable", async ({ page }) => {
  await page.route("**/api/voice/status", (route) =>
    route.fulfill({ json: { available: true, cloudAllowed: false } }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        Promise.reject(new DOMException("Denied", "NotAllowedError")),
      configurable: true,
    });
  });
  await page.goto("/demo");
  await build(page);
  const mic = page.getByRole("button", {
    name: "Talk to Pip",
  });
  await mic.click();
  await expect(
    page.getByText(
      "I can’t hear your microphone right now. You can type it to me!",
    ),
  ).toBeVisible();
  await explain(page);
});
test("refresh resumes selected construction and demo stage", async ({
  page,
}) => {
  await page.goto("/demo");
  await build(page);
  await page.reload();
  await expect(page.getByLabel("Your explanation")).toBeVisible();
  await explain(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Is Pip right?" }),
  ).toBeVisible({ timeout: 9000 });
});
test("entering demo again resets its seeded state", async ({ page }) => {
  await page.goto("/demo");
  await build(page);
  await page.goto("/world");
  await page.goto("/demo?reset=1");
  await expect(page.getByRole("button", { name: "Show Pip" })).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(stored.xp).toBe(450);
  expect(stored.seed).toBe("hackathon-demo-v1");
});
test("double clicking does not duplicate evidence or XP", async ({ page }) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Show Pip" }).dblclick();
  await expect(page.getByLabel("Your explanation")).toBeVisible();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(s.xp).toBe(460);
  expect(s.evidence.length).toBe(2);
});
test("weak explanation cannot advance from an answer alone", async ({
  page,
}) => {
  await page.goto("/demo");
  await build(page);
  await page.getByLabel("Your explanation").fill("3 4");
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("show why");
  await expect(page.getByLabel("Your explanation")).toBeVisible();
});
test("multiplication proves the engine generalizes", async ({ page }) => {
  await page.goto("/play/multiplication");
  for (let i = 0; i < 2; i++) await page.getByLabel("Add Rows").click();
  for (let i = 0; i < 3; i++) await page.getByLabel("Add Columns").click();
  await page.getByRole("button", { name: "Show Pip" }).click();
  await page
    .getByLabel("Your explanation")
    .fill("Three equal groups of four make twelve altogether.");
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await page.getByRole("button", { name: "12", exact: true }).click();
  await page
    .getByLabel("Your correction")
    .fill("Three equal groups of four make twelve altogether.");
  await page.getByRole("button", { name: "Here’s why" }).click();
  await page.getByRole("button", { name: "Let me prove it" }).click();
  await page.getByRole("button", { name: "12", exact: true }).click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await page.getByRole("button", { name: "12", exact: true }).click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await expect(
    page.getByText("A NEW DISCOVERY", { exact: true }),
  ).toBeVisible();
});
test("place value handles the zero placeholder", async ({ page }) => {
  await page.goto("/play/place-value");
  for (let i = 0; i < 2; i++) await page.getByLabel("Add hundreds").click();
  for (let i = 0; i < 3; i++) await page.getByLabel("Add ones").click();
  await page.getByRole("button", { name: "Show Pip" }).click();
  await page
    .getByLabel("Your explanation")
    .fill(
      "Two hundreds, zero tens and three ones make 203. Zero holds the tens place.",
    );
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await page.getByRole("button", { name: "203", exact: true }).click();
  await page
    .getByLabel("Your correction")
    .fill(
      "Two hundreds, zero tens and three ones make 203. Zero holds the tens place.",
    );
  await page.getByRole("button", { name: "Here’s why" }).click();
  await page.getByRole("button", { name: "Let me prove it" }).click();
  await page.getByRole("button", { name: "200 + 0 + 3", exact: true }).click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await page.getByRole("button", { name: "302", exact: true }).click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await expect(
    page.getByText("A NEW DISCOVERY", { exact: true }),
  ).toBeVisible();
});
test("phone hero path fits and completes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Show Pip" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/screenshots/build-mobile.png",
    fullPage: true,
  });
  await build(page);
  await page.screenshot({
    path: "artifacts/screenshots/explain-mobile.png",
    fullPage: true,
  });
  await explain(page);
  await correct(page);
  await page.screenshot({
    path: "artifacts/screenshots/transfer-mobile.png",
    fullPage: true,
  });
  await transfer(page);
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("desktop tablet and phone routes have no overflow or errors", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/world", "/pip", "/grownups", "/lab"]) {
      await page.goto(route);
      await page.waitForTimeout(120);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${viewport.width}`,
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/screenshots/${route.replaceAll("/", "") || "landing"}-${viewport.width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
test("server rejects invalid input and cross-origin writes", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/explanation/evaluate", {
        data: { lessonId: "fraction-meaning", explanation: "" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/explanation/evaluate", {
        headers: { origin: "https://evil.example" },
        data: { lessonId: "fraction-meaning", explanation: good },
      })
    ).status(),
  ).toBe(403);
});
test("WebMCP reads the same evidence and rejects invalid input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool(tool: unknown) {
          (window as unknown as { pipTool: unknown }).pipTool = tool;
        },
      },
    });
  });
  await page.goto("/demo");
  await build(page);
  const result = await page.evaluate(() => {
    const tool = (
      window as unknown as {
        pipTool: {
          name: string;
          execute: (input: unknown) => { state: { procedural: number } };
        };
      }
    ).pipTool;
    const r = tool.execute({ world: "fractions" });
    let rejected = false;
    try {
      tool.execute({ world: "invalid" });
    } catch {
      rejected = true;
    }
    return { name: tool.name, procedural: r.state.procedural, rejected };
  });
  expect(result.name).toBe("read_pip_learning_evidence");
  expect(result.procedural).toBeGreaterThan(0.78);
  expect(result.rejected).toBe(true);
});
test("transfer failure opens another representation", async ({ page }) => {
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await correct(page);
  await page
    .getByRole("button", { name: "Number line 2 of 6", exact: true })
    .click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/6 full" })
    .click();
  await page.getByRole("button", { name: "Prove it" }).click();
  await expect(
    page.getByText("Try a different picture. Both bars are the same whole."),
  ).toBeVisible();
});

test("fresh mastery needs repeated independent evidence, then unlocks the next skill", async ({
  page,
}) => {
  await page.goto("/play/fractions?skill=equal_partitioning");
  for (let round = 0; round < 2; round++) {
    for (let n = 1; n <= 2; n++)
      await page
        .getByRole("button", { name: `Piece ${n} of 3`, exact: true })
        .click();
    await page.getByRole("button", { name: "Show Pip", exact: true }).click();
    await page
      .getByLabel("Your explanation")
      .fill("Three equal pieces make a whole and two are selected.");
    await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
    await correct(page);
    await page
      .getByRole("button", { name: "Number line 2 of 6", exact: true })
      .click();
    await page.getByRole("button", { name: "Prove it" }).click();
    await page
      .getByRole("button", { name: "Moonberry Potion, 1/2 full", exact: true })
      .click();
    await page.getByRole("button", { name: "Prove it" }).click();
    if (round < 1) {
      await expect(
        page.getByText("A NEW DISCOVERY", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Keep exploring" }).click();
    }
  }
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(saved.demo).toBe(false);
  expect(
    saved.learning.filter(
      (e: { kind: string; independent: boolean }) =>
        e.kind === "transfer" && e.independent,
    ),
  ).toHaveLength(4);
});

test("corrupt saved progress recovers and storage denial remains playable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("pip-session-v1", "{broken"),
  );
  await page.goto("/demo");
  await build(page);
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/demo?reset=1");
  await expect(
    page.getByText(
      "Storage is unavailable. Progress lasts until you leave or reload this page.",
    ),
  ).toBeVisible();
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
});

test("aborted network responses use local explanation and transfer context", async ({
  page,
}) => {
  await page.route("**/api/explanation/evaluate", (route) => route.abort());
  await page.route("**/api/challenge/transfer", (route) => route.abort());
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await expect(page.getByText("MASTERY PROVEN", { exact: true })).toBeVisible();
});

test("a delayed evaluation cannot advance a reset demo", async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requestArrived!: () => void;
  const arrived = new Promise<void>((resolve) => {
    requestArrived = resolve;
  });
  await page.route("**/api/explanation/evaluate", async (route) => {
    requestArrived();
    await ready;
    await route
      .fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          source: "live",
          evaluation: {
            conceptualScore: 0.97,
            explanationScore: 0.96,
            misconceptions: [],
            evidenceSummary: "Known concept",
            pip: { mood: "eureka", line: "I see why." },
          },
        }),
      })
      .catch(() => {});
  });
  await page.goto("/demo");
  await build(page);
  await page.getByLabel("Your explanation").fill(good);
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await arrived;
  await page.getByRole("link", { name: "World map", exact: true }).click();
  await page.goto("/demo?reset=1");
  await build(page);
  release();
  await page.waitForTimeout(400);
  await expect(page.getByLabel("Your explanation")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pip-session-v1")!),
  );
  expect(saved.evidence).toHaveLength(2);
});

test("an explanation changes Pip’s misconception probe", async ({ page }) => {
  await page.goto("/demo");
  await build(page);
  await page
    .getByLabel("Your explanation")
    .fill(
      "The four pieces can be different sizes. They do not need to be equal.",
    );
  await page.getByRole("button", { name: "Teach Pip", exact: true }).click();
  await page.getByRole("button", { name: "No — I’ll show you" }).click();
  await expect(
    page.getByText("Which rule makes four pieces into fourths?"),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "The pieces must be equal sizes",
      exact: true,
    })
    .click();
  await page.getByLabel("Your correction").fill("The pieces must be equal sizes because fourths divide one whole equally.");
  await page.getByRole("button", { name: "Here’s why" }).click();
  await expect(
    page.getByRole("button", { name: "Let me prove it" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset demo ↺" }).click();
  await expect(page.getByRole("button", { name: "Show Pip" })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("pip-session-v1")!).learning.filter(
          (e: { seeded: boolean }) => !e.seeded,
        ).length,
    ),
  ).toBe(0);
});
test("provider choice persists and cloud is unavailable without server opt-in", async ({
  page,
}) => {
  await page.goto("/lab");
  await page.getByLabel("AI provider").selectOption("demo");
  await page.reload();
  await expect(page.getByLabel("AI provider")).toHaveValue("demo");
  await expect(
    page.getByRole("option", { name: "OpenAI · server opt-in required" }),
  ).toHaveJSProperty("disabled", true);
  await expect(
    page.getByText("Authored demo", { exact: true }).first(),
  ).toBeVisible();
});
test("typing remains available without a speech status service", async ({
  page,
}) => {
  await page.route("**/api/voice/status", (route) =>
    route.fulfill({ json: { available: false, cloudAllowed: false } }),
  );
  await page.goto("/demo");
  await build(page);
  await expect(page.getByRole("button", { name: "Talk to Pip" })).toBeEnabled();
  await expect(page.getByLabel("Your explanation")).toBeEditable();
  await explain(page);
});
test("newly mastered skill lights the constellation and exposes the next concept", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo");
  await build(page);
  await explain(page);
  await correct(page);
  await transfer(page);
  await page.goto("/world");
  await page
    .getByRole("button", { name: "Fraction magnitude, mastered", exact: true })
    .click();
  await expect(
    page.getByText("New pictures proved 2/2", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Different look. Same amount., ready",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Teach this idea" }),
  ).toHaveAttribute("href", "/play/fractions?skill=equivalent_fractions");
});

test("presentation reset is consumed once and reload preserves progress", async ({
  page,
}) => {
  await page.goto("/demo?presentation=1&reset=1&provider=demo");
  await build(page);
  await page.reload();
  await expect(page.getByLabel("Your explanation")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("pip-session-v1")!).aiSettings.provider,
    ),
  ).toBe("demo");
});
test("presentation tasks fit the recording frame and rewards remain scrollable", async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo?presentation=1&reset=1&provider=demo");
    const frame = async (stage: string) => {
      await page.screenshot({
        path: `artifacts/screenshots/rc-${stage}-${viewport.width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          (reward) => reward ? document.documentElement.scrollWidth <= innerWidth : innerHeight < 900 ? (document.querySelector('.learning-surface')?.getBoundingClientRect().bottom ?? Infinity) <= innerHeight : document.documentElement.scrollHeight <= innerHeight + 1,
          stage === "mastery",
        ),
        `${stage} at ${viewport.width}`,
      ).toBe(true);
    };
    await expect(
      page.getByRole("button", { name: "Show Pip", exact: true }),
    ).toBeVisible();
    await frame("build");
    await build(page);
    await frame("explain");
    await explain(page);
    await frame("misconception");
    await page.getByRole("button", { name: "No — I’ll show you" }).click();
    await frame("correction");
    await page
      .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
      .click();
    await page.getByLabel("Your correction").fill(good);
    await page.getByRole("button", { name: "Here’s why" }).click();
    await expect(page.getByRole("button", {name: "Let me prove it"})).toBeVisible();
    await frame("notebook");
    await page.getByRole("button", { name: "Let me prove it" }).click();
    await frame("numberline");
    await page
      .getByRole("button", { name: "Number line 2 of 6", exact: true })
      .click();
    await page.getByRole("button", { name: "Prove it", exact: true }).click();
    await frame("potions");
    await page
      .getByRole("button", { name: "Moonberry Potion, 1/3 full", exact: true })
      .click();
    await page.getByRole("button", { name: "Prove it", exact: true }).click();
    await frame("mastery");
  }
});
