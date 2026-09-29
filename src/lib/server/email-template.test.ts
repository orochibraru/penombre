import { describe, expect, test } from "bun:test";
import { withSenderName } from "./email";
import { renderEmail } from "./email-template";

describe("renderEmail", () => {
	test("people's own names reach the HTML as text, never markup", () => {
		const { html, text } = renderEmail({
			subject: "Something was shared with you",
			heading: "Something was shared with you",
			lines: ['<img src=x onerror="alert(1)"> shared "Mix & Master" with you.'],
			action: { label: "Open it", url: "https://x.test/s?a=1&b=2" },
		});
		expect(html).not.toContain("<img src=x");
		expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
		expect(html).toContain('href="https://x.test/s?a=1&amp;b=2"');
		expect(text).toContain("Open it: https://x.test/s?a=1&b=2");
	});

	test("a bare sender address gets the app's name, a named one is kept", () => {
		expect(withSenderName("no-reply@x.test", "Drive")).toBe(
			'"Drive" <no-reply@x.test>',
		);
		expect(withSenderName("Ops <ops@x.test>", "Drive")).toBe(
			"Ops <ops@x.test>",
		);
	});
});
