import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// Override proxy mode to prevent dev from having to change this variable all the time when testing.
process.env.DEV_PROXY = "false";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "github",
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: "go -C packages/api run .",
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 120_000,
});
