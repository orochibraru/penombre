import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// Override proxy mode to prevent dev from having to change this variable all the time when testing.
process.env.DEV_PROXY = "false";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    // Use PLAYWRIGHT_BASE_URL if set (for PR environments), otherwise default to localhost
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080",
    trace: "on-first-retry",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "api-tests",
      testDir: "tests/api",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI
    ? [
        ["dot"],
        ["html"],
        ["json", { outputFile: "playwright-report/report.json" }],
      ]
    : "list",
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  // Only start webServer for local development (not in CI with external URL)
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "go -C packages/api run .",
        port: 8080,
        reuseExistingServer: !process.env.CI,
      },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 120_000,
});
