import { expect, test, type Page } from "@playwright/test";

// Synthetic audio only. Exercise browser event ordering without a real microphone.
async function mockMicrophone(page: Page, delayedPermission = false) {
  await page.route("**/api/voice/status", (route) =>
    route.fulfill({ json: { available: true, cloudAllowed: false } }),
  );
  await page.addInitScript(
    ({ delayedPermission }) => {
      const state = {
        requests: 0,
        activeTracks: 0,
        recordings: 0,
        grant: () => {},
      };
      Object.assign(window, { voiceTest: state });
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => {
          state.requests++;
          const grant = () => {
            state.activeTracks++;
            let stopped = false;
            return {
              getTracks: () => [
                {
                  stop: () => {
                    if (!stopped) state.activeTracks--;
                    stopped = true;
                  },
                },
              ],
            };
          };
          return delayedPermission
            ? new Promise((resolve) => {
                state.grant = () => resolve(grant());
              })
            : Promise.resolve(grant());
        },
      });
      class Recorder {
        state = "inactive";
        mimeType = "audio/wav";
        ondataavailable: ((event: { data: Blob }) => void) | null = null;
        onstop: (() => void) | null = null;
        start() {
          this.state = "recording";
          state.recordings++;
        }
        stop() {
          this.state = "inactive";
          setTimeout(() => {
            this.ondataavailable?.({
              data: new Blob(["synthetic".repeat(40)]),
            });
            this.onstop?.();
          }, 0);
        }
      }
      Object.defineProperty(window, "MediaRecorder", { value: Recorder });
    },
    { delayedPermission },
  );
}

async function explanationStage(page: Page) {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Moonberry Potion, 1/4 full", exact: true })
    .click();
  await page.getByRole("button", { name: "Show Pip", exact: true }).click();
  await expect(page.getByLabel("Your explanation")).toBeVisible();
}

const microphone = (page: Page) =>
  page.getByRole("button", { name: "Talk to Pip" });
const voiceState = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          voiceTest: {
            requests: number;
            activeTracks: number;
            recordings: number;
          };
        }
      ).voiceTest,
  );

test("tap to stop transcribes once and closes microphone tracks", async ({
  page,
}) => {
  await mockMicrophone(page);
  let uploads = 0;
  await page.route("**/api/voice/transcribe", (route) => {
    uploads++;
    return route.fulfill({
      json: { text: "Four equal pieces make a whole; take three." },
    });
  });
  await explanationStage(page);
  await microphone(page).click();
  await expect(
    page.getByRole("button", { name: "Stop recording" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByLabel("Your explanation")).toHaveValue(
    "Four equal pieces make a whole; take three.",
  );
  expect(uploads).toBe(1);
  expect((await voiceState(page)).activeTracks).toBe(0);
});

test("pending permission disables repeat requests and navigation releases the stream", async ({
  page,
}) => {
  await mockMicrophone(page, true);
  await explanationStage(page);
  await microphone(page).click();
  await expect(microphone(page)).toBeDisabled();
  expect((await voiceState(page)).requests).toBe(1);
  await page.getByRole("button", { name: "Reset demo ↺" }).click();
  await page.evaluate(() =>
    (
      window as unknown as { voiceTest: { grant: () => void } }
    ).voiceTest.grant(),
  );
  await expect.poll(async () => (await voiceState(page)).activeTracks).toBe(0);
  expect((await voiceState(page)).recordings).toBe(0);
});

test("leaving the explanation stage discards active audio without uploading", async ({
  page,
}) => {
  await mockMicrophone(page);
  let uploads = 0;
  await page.route("**/api/voice/transcribe", (route) => {
    uploads++;
    return route.fulfill({ json: { text: "An obsolete transcript." } });
  });
  await explanationStage(page);
  await page
    .getByLabel("Your explanation")
    .fill(
      "The bottles are the same size whole. More equal pieces make each piece smaller.",
    );
  await microphone(page).click();
  await expect(
    page.getByRole("button", { name: "Stop recording" }),
  ).toBeVisible();
  // Trigger submission without moving focus, so unmount owns recording cleanup.
  await page
    .getByRole("button", { name: "Teach Pip", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(
    page.getByRole("heading", { name: "Is Pip right?" }),
  ).toBeVisible();
  await page.keyboard.up("Space");
  await page.waitForTimeout(150);
  expect((await voiceState(page)).activeTracks).toBe(0);
  expect(uploads).toBe(0);
});

test("leaving the browser window stops an active recording", async ({
  page,
}) => {
  await mockMicrophone(page);
  await page.route("**/api/voice/transcribe", (route) =>
    route.fulfill({ json: { text: "Four equal pieces." } }),
  );
  await explanationStage(page);
  await microphone(page).click();
  await expect(
    page.getByRole("button", { name: "Stop recording" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect.poll(async () => (await voiceState(page)).activeTracks).toBe(0);
  await page.keyboard.up("Space");
});
