import { test, expect } from "@playwright/test";

test.describe("Basic Application Flow @e2e", () => {
    test("application loads correctly", async ({ page }) => {
        await page.goto("/");

        // Check that the page loads without errors
        await expect(page).not.toHaveTitle(/Error/);

        // Check for basic UI elements (adjust selectors based on your app)
        // This is a generic test - you'll want to customize these selectors
        const body = page.locator("body");
        await expect(body).toBeVisible();
    });

    test("navigation works", async ({ page }) => {
        await page.goto("/");

        // Test basic navigation if your app has multiple pages
        // Adjust based on your actual application structure

        // For example, if you have a login or files page
        // await page.click('nav a[href="/files"]');
        // await expect(page).toHaveURL(/.*files/);
    });

    test("health check is accessible", async ({ page }) => {
        // Test that the health endpoint is accessible via browser
        await page.goto("/api/v1/healthz");

        // Should show the health response
        const content = await page.textContent("body");
        expect(content).toContain("db");
        expect(content).toContain("available");
        expect(content).toContain("storage");
    });
});

test.describe("File Upload Flow @e2e", () => {
    test.skip("can upload a file", async ({ page }) => {
        // Skip this test by default since it requires authentication
        // Uncomment and modify when you have a working upload flow

        await page.goto("/");

        // Example upload test (customize based on your UI):
        // 1. Navigate to upload page/section
        // 2. Select file to upload
        // 3. Verify upload progress/completion
        // 4. Verify file appears in file list

        /*
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('tests/fixtures/test-file.txt');
        
        await page.click('button[type="submit"]');
        
        // Wait for upload to complete
        await expect(page.locator('.upload-success')).toBeVisible({ timeout: 30000 });
        
        // Verify file appears in list
        await expect(page.locator('.file-list')).toContainText('test-file.txt');
        */
    });
});

test.describe("Authentication Flow @e2e", () => {
    test.skip("can access login page", async ({ page }) => {
        // Skip by default since OAuth might not be configured in PR environments

        await page.goto("/");

        // Example auth test (customize based on your app):
        /*
        await page.click('a[href="/login"]');
        await expect(page).toHaveURL(/.*login/);
        
        // Check for OAuth login options
        await expect(page.locator('button')).toContainText('Login');
        */
    });
});

test.describe("Responsive Design @e2e", () => {
    test("app works on mobile viewport", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
        await page.goto("/");

        // Check that the app is responsive
        const body = page.locator("body");
        await expect(body).toBeVisible();

        // Add specific mobile UI tests here
    });

    test("app works on tablet viewport", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
        await page.goto("/");

        const body = page.locator("body");
        await expect(body).toBeVisible();
    });
});

test.describe("Performance @e2e", () => {
    test("page loads within reasonable time", async ({ page }) => {
        const startTime = Date.now();

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const loadTime = Date.now() - startTime;

        // Expect page to load within 10 seconds (adjust based on your needs)
        expect(loadTime).toBeLessThan(10000);
    });

    test("no console errors on page load", async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Allow some common development warnings and authentication errors
        const seriousErrors = consoleErrors.filter(
            (error) =>
                !error.includes("favicon") &&
                !error.includes("Development mode") &&
                !error.includes("401") &&
                !error.includes("Unauthorized") &&
                !error.includes("API Error")
        );

        expect(seriousErrors).toHaveLength(0);
    });
});
