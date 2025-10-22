import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

// Override proxy mode to prevent dev from having to change this variable all the time when testing.
process.env.DEV_PROXY = "false";

export default defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    globalSetup: "./tests/global-setup.ts",
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
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
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
    testDir: "tests",
    testMatch: /(.+\.)?(test|spec)\.[jt]s/,
    timeout: 120_000,
});
