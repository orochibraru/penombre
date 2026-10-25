import { describe, expect, it } from "bun:test";

import { looksLikeMarkdown, markdownToHtml } from "./markdown";

describe("looksLikeMarkdown", () => {
	it("knows blocks and inline marks", () => {
		for (const text of [
			"# Title",
			"Intro\n- one\n- two",
			"1. first",
			"> quoted",
			"```ts\nlet a\n```",
			"| a | b |\n| - | - |",
			"some **bold** words",
			"see [the site](https://example.com)",
			"run `bun test`",
		]) {
			expect(looksLikeMarkdown(text)).toBe(true);
		}
	});

	it("leaves prose alone", () => {
		for (const text of [
			"Just a sentence.",
			"Price: 3 * 4 = 12",
			"C# is a language",
			"2026. A year.",
		]) {
			expect(looksLikeMarkdown(text)).toBe(false);
		}
	});
});

describe("markdownToHtml", () => {
	it("renders GitHub-flavoured Markdown", () => {
		const html = markdownToHtml(
			"# Hi\n\n- [ ] task\n- **b**\n\n| a |\n| - |\n| 1 |\n\n~~x~~",
		);
		expect(html).toContain("<h1>Hi</h1>");
		expect(html).toContain('type="checkbox"');
		expect(html).toContain("<strong>b</strong>");
		expect(html).toContain("<table>");
		expect(html).toContain("<del>x</del>");
	});

	it("names a fence's language as the code block lists it", () => {
		expect(markdownToHtml("```js\nlet a\n```")).toContain(
			'class="language-javascript"',
		);
		expect(markdownToHtml("```go\nx\n```")).toContain('class="language-go"');
	});
});
