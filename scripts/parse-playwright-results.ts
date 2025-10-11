#!/usr/bin/env node

/**
 * Parse Playwright test results and generate a markdown summary
 * This script reads the Playwright JSON report and generates a markdown comment for PRs
 */
import fs from "node:fs";
import path from "node:path";

function parsePlaywrightResults() {
  // Playwright generates a JSON report alongside the HTML report
  const reportPath = path.join(
    process.cwd(),
    "playwright-report",
    "report.json"
  );
  const resultsPath = path.join(process.cwd(), "test-results");

  let report = null;
  let hasResults = false;

  // Try to read the JSON report first
  if (fs.existsSync(reportPath)) {
    try {
      const reportContent = fs.readFileSync(reportPath, "utf8");
      report = JSON.parse(reportContent);
      hasResults = true;
    } catch (error) {
      console.error("Error reading Playwright JSON report:", error);
    }
  }

  // If no JSON report, try to parse from test-results directory
  if (!hasResults && fs.existsSync(resultsPath)) {
    try {
      const resultFiles = fs.readdirSync(resultsPath);
      const jsonFiles = resultFiles.filter((file) => file.endsWith(".json"));

      if (jsonFiles.length > 0) {
        const firstJsonFile = path.join(resultsPath, jsonFiles[0]);
        const resultContent = fs.readFileSync(firstJsonFile, "utf8");
        report = JSON.parse(resultContent);
        hasResults = true;
      }
    } catch (error) {
      console.error("Error reading test results:", error);
    }
  }

  if (!hasResults) {
    return generateFallbackSummary();
  }

  return generateMarkdownSummary(report);
}

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
}

interface TestResult {
  duration?: number;
  error?: {
    message: string;
  };
}

interface TestSpec {
  title: string;
  outcome: "expected" | "unexpected" | "flaky" | "skipped";
  results?: TestResult[];
}

interface TestSuite {
  title: string;
  specs?: TestSpec[];
  suites?: TestSuite[];
}

interface PlaywrightReport {
  stats: {
    startTime: Date;
    duration: number;
    expected: number;
    skipped: number;
    unexpected: number;
    flaky: number;
  };
  suites: TestSuite[];
}

function generateMarkdownSummary(report: PlaywrightReport): string {
  const stats: TestStats = {
    total:
      report.stats.expected +
      report.stats.unexpected +
      report.stats.skipped +
      report.stats.flaky,
    passed: report.stats.expected,
    failed: report.stats.unexpected,
    skipped: report.stats.skipped,
    flaky: report.stats.flaky,
    duration: report.stats.duration,
  };
  const emoji: string = stats.failed > 0 ? "❌" : "✅";
  const status: string = stats.failed > 0 ? "Failed" : "Passed";

  let markdown: string = `## 🎭 Playwright Test Report\n\n`;
  markdown += `**Test Status:** ${emoji} ${status}\n\n`;

  // Summary table
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${stats.total} |\n`;
  markdown += `| ✅ Passed | ${stats.passed} |\n`;
  markdown += `| ❌ Failed | ${stats.failed} |\n`;
  markdown += `| ⏭️ Skipped | ${stats.skipped} |\n`;
  markdown += `| 🔄 Flaky | ${stats.flaky} |\n\n`;

  // Duration
  if (stats.duration) {
    markdown += `**Duration:** ${formatDuration(stats.duration)}\n\n`;
  }

  // Failed tests details
  if (stats.failed > 0 && report.suites) {
    markdown += generateFailedTestsSection(report);
  }

  // Flaky tests details
  if (stats.flaky > 0 && report.suites) {
    markdown += generateFlakyTestsSection(report);
  }

  markdown += `---\n`;
  markdown += `*Report generated from commit ${
    process.env.GITHUB_SHA || "unknown"
  }*\n`;

  return markdown;
}

interface FailedTest {
  title: string;
  path: string;
  error: string | null;
}

function generateFailedTestsSection(report: PlaywrightReport): string {
  let markdown: string = `### ❌ Failed Tests\n\n`;
  const failedTests: FailedTest[] = [];

  function collectFailedTests(suite: TestSuite, suitePath: string = ""): void {
    const currentPath: string = suitePath
      ? `${suitePath} › ${suite.title}`
      : suite.title;

    if (suite.specs) {
      suite.specs.forEach((spec: TestSpec) => {
        if (spec.outcome === "unexpected") {
          failedTests.push({
            title: spec.title,
            path: currentPath,
            error: getTestError(spec),
          });
        }
      });
    }

    if (suite.suites) {
      suite.suites.forEach((childSuite: TestSuite) => {
        collectFailedTests(childSuite, currentPath);
      });
    }
  }

  report.suites.forEach((suite: TestSuite) => collectFailedTests(suite));

  failedTests.forEach((test: FailedTest) => {
    markdown += `- **${test.path} › ${test.title}**\n`;
    if (test.error) {
      markdown += `  \`\`\`\n  ${test.error}\n  \`\`\`\n`;
    }
    markdown += `\n`;
  });

  return markdown;
}

interface FlakyTest {
  title: string;
  path: string;
  retries: number;
}

function generateFlakyTestsSection(report: PlaywrightReport): string {
  let markdown: string = `### 🔄 Flaky Tests\n\n`;
  const flakyTests: FlakyTest[] = [];

  function collectFlakyTests(suite: TestSuite, suitePath: string = ""): void {
    const currentPath: string = suitePath
      ? `${suitePath} › ${suite.title}`
      : suite.title;

    if (suite.specs) {
      suite.specs.forEach((spec: TestSpec) => {
        if (spec.outcome === "flaky") {
          flakyTests.push({
            title: spec.title,
            path: currentPath,
            retries: spec.results ? spec.results.length : 0,
          });
        }
      });
    }

    if (suite.suites) {
      suite.suites.forEach((childSuite: TestSuite) => {
        collectFlakyTests(childSuite, currentPath);
      });
    }
  }

  report.suites.forEach((suite: TestSuite) => collectFlakyTests(suite));

  flakyTests.forEach((test: FlakyTest) => {
    markdown += `- **${test.path} › ${test.title}** (${test.retries} attempts)\n`;
  });

  return markdown + "\n";
}

function getTestError(spec: TestSpec): string | null {
  if (!spec.results || spec.results.length === 0) {
    return null;
  }

  const lastResult: TestResult = spec.results[spec.results.length - 1];
  if (lastResult.error && lastResult.error.message) {
    return (
      lastResult.error.message.substring(0, 500) +
      (lastResult.error.message.length > 500 ? "..." : "")
    );
  }

  return null;
}

function formatDuration(milliseconds: number): string {
  const seconds: number = Math.floor(milliseconds / 1000);
  const minutes: number = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function generateFallbackSummary() {
  const hasPlaywrightReport = fs.existsSync(
    path.join(process.cwd(), "playwright-report")
  );
  const hasTestResults = fs.existsSync(
    path.join(process.cwd(), "test-results")
  );

  let markdown = `## 🎭 Playwright Test Report\n\n`;

  if (hasPlaywrightReport || hasTestResults) {
    markdown += `**Test Status:** ✅ Completed\n\n`;
    markdown += `Playwright tests have been executed. `;
    if (hasPlaywrightReport) {
      markdown += `HTML report has been generated.\n\n`;
    }
    if (hasTestResults) {
      markdown += `Test artifacts are available.\n\n`;
    }
  } else {
    markdown += `**Test Status:** ❓ No Results Found\n\n`;
    markdown += `No Playwright test results were found.\n\n`;
  }

  markdown += `---\n`;
  markdown += `*Report generated from commit ${
    process.env.GITHUB_SHA || "unknown"
  }*\n`;

  return markdown;
}

// Main execution
if (require.main === module) {
  try {
    const markdown = parsePlaywrightResults();
    console.log(markdown);
  } catch (error) {
    console.error("Error generating Playwright results:", error);
    process.exit(1);
  }
}

module.exports = { parsePlaywrightResults };
