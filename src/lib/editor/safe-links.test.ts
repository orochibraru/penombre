import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	mock,
	test,
} from "bun:test";

import { defineBasicExtension } from "prosekit/basic";
import { createEditor, union } from "prosekit/core";

import { defineSafeLinks, safeHref } from "./safe-links";

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
		expect(safeHref("", base)).toBeNull();
		expect(safeHref("http://[::1", base)).toBeNull();
	});
});

describe("defineSafeLinks", () => {
	class FakeElement {
		constructor(private readonly link: { href: string } | null) {}
		closest(selector: string) {
			expect(selector).toBe("a[href]");
			return this.link && { getAttribute: () => this.link?.href ?? null };
		}
	}
	const globals = globalThis as Record<string, unknown>;
	const saved = {
		Element: globals.Element,
		location: globals.location,
		window: globals.window,
	};
	const open = mock((..._args: unknown[]) => null);

	beforeAll(() => {
		globals.Element = FakeElement;
		globals.location = { href: base };
		globals.window = { open };
	});
	afterEach(() => open.mockClear());
	afterAll(() => {
		for (const [name, value] of Object.entries(saved)) {
			if (value === undefined) {
				delete globals[name];
			} else {
				globals[name] = value;
			}
		}
	});

	function click(target: unknown) {
		const editor = createEditor({
			extension: union(defineBasicExtension(), defineSafeLinks()),
		});
		const plugin = editor.state.plugins.find(
			(candidate) => candidate.props.handleDOMEvents?.click,
		);
		const preventDefault = mock(() => undefined);
		const event = { target, preventDefault } as unknown as PointerEvent;
		const handled = plugin?.props.handleDOMEvents?.click?.call(
			plugin,
			{} as never,
			event,
		);
		return { handled, prevented: preventDefault.mock.calls.length > 0 };
	}

	test("opens a safe link in a new tab", () => {
		expect(click(new FakeElement({ href: "/docs" }))).toEqual({
			handled: true,
			prevented: true,
		});
		expect(open).toHaveBeenCalledWith(
			"https://penombre.test/docs",
			"_blank",
			"noopener,noreferrer",
		);
	});

	test("swallows a script link without following it", () => {
		expect(click(new FakeElement({ href: "javascript:alert(1)" }))).toEqual({
			handled: true,
			prevented: true,
		});
		expect(open).not.toHaveBeenCalled();
	});

	test("leaves clicks outside links to the editor", () => {
		expect(click(new FakeElement(null))).toEqual({
			handled: false,
			prevented: false,
		});
		expect(click({ nodeType: 3 })).toEqual({
			handled: false,
			prevented: false,
		});
		expect(open).not.toHaveBeenCalled();
	});
});
