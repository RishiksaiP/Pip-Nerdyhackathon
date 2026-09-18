import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
export default defineConfig({
  testDir: "tests/live",
  workers: 1,
  timeout: 60000,
  retries: 0,
  reporter: [["list"]],
  outputDir: "artifacts/live-browser",
  use: {
    baseURL: "http://localhost:3176",
    viewport: { width: 1440, height: 900 },
    permissions: ["microphone"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-audio-capture=${resolve("artifacts/live-ai/synthetic-moonberry.wav")}`,
      ],
    },
  },
});
