import { describe, expect, test } from "bun:test";
import { safeHref } from "./safe-links";

const base = "https://penombre.test/s/abc";

describe("safeHref", () => {
	test("keeps web and mail links", () => {
		expect(safeHref("https://example.com/a", base)).toBe(
			"https://example.com/a",
		);
		expect(safeHref("mailto:a@b.test", base)).toBe("mailto:a@b.test");
		expect(safeHref("/docs", base)).toBe("https://penombre.test/docs");
	});

	test("drops anything that could run", () => {
		expect(safeHref("javascript:alert(1)", base)).toBeNull();
		expect(safeHref(" JavaScript:alert(1)", base)).toBeNull();
		expect(safeHref("data:text/html,<script>", base)).toBeNull();
		expect(safeHref(null, base)).toBeNull();
	});
});
