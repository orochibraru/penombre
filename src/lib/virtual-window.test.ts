import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileModule } from "svelte/compiler";

import type * as VirtualWindow from "./virtual-window.svelte";

/**
 * The virtualizer uses runes, which only the Svelte compiler understands, so
 * the test compiles the module itself and imports the result, as
 * `sheet/state.test.ts` does.
 */
let rowAtOffset: typeof VirtualWindow.rowAtOffset;
let createWindowVirtualizer: typeof VirtualWindow.createWindowVirtualizer;

beforeAll(async () => {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const source = await Bun.file(
		path.join(here, "virtual-window.svelte.ts"),
	).text();
	const js = new Bun.Transpiler({ loader: "ts" }).transformSync(source);
	const { code } = compileModule(js, {
		generate: "client",
		filename: "virtual-window.svelte.js",
	}).js;
	const runtime = fileURLToPath(import.meta.resolve("svelte/internal/client"));
	const file = path.join(
		mkdtempSync(path.join(tmpdir(), "virtual-window-")),
		"virtual-window.js",
	);
	await Bun.write(
		file,
		code.replaceAll("'svelte/internal/client'", JSON.stringify(runtime)),
	);
	({ rowAtOffset, createWindowVirtualizer } = await import(file));
});

const original = Object.getOwnPropertyDescriptor(globalThis, "window");

function setWindow(scrollY: number, innerHeight: number) {
	Object.defineProperty(globalThis, "window", {
		value: { scrollY, innerHeight },
		configurable: true,
	});
}

afterEach(() => {
	if (original) {
		Object.defineProperty(globalThis, "window", original);
	} else {
		delete (globalThis as { window?: unknown }).window;
	}
});

/** A container whose top sits `top` pixels below the viewport's. */
function container(top: number) {
	return { getBoundingClientRect: () => ({ top }) } as HTMLElement;
}

describe("rowAtOffset", () => {
	// Rows of 57, 40, 40, 57: a file, its two versions, the next file.
	const offsets = [0, 57, 97, 137, 194];

	test("finds the row a position falls in", () => {
		expect(rowAtOffset(offsets, 0)).toBe(0);
		expect(rowAtOffset(offsets, 56)).toBe(0);
		expect(rowAtOffset(offsets, 57)).toBe(1);
		expect(rowAtOffset(offsets, 100)).toBe(2);
		expect(rowAtOffset(offsets, 150)).toBe(3);
	});

	test("past the end is the end", () => {
		expect(rowAtOffset(offsets, 10_000)).toBe(4);
	});
});

describe("createWindowVirtualizer", () => {
	test("before any measurement, renders a tall viewport from the top", () => {
		const list = createWindowVirtualizer({
			count: () => 1000,
			rowHeight: () => 50,
		});
		// 900px assumed: rows 0 to 18, plus 4 of overscan below.
		expect(list.first).toBe(0);
		expect(list.last).toBe(23);
		expect(list.padTop).toBe(0);
		expect(list.padBottom).toBe((1000 - 23) * 50);
	});

	test("follows the page's scroll, below where the list starts", () => {
		setWindow(0, 500);
		const list = createWindowVirtualizer({
			count: () => 1000,
			rowHeight: () => 50,
			overscan: 2,
		});
		list.bind(container(200));
		list.onResize();
		// Still above the list: its top rows are on screen.
		expect(list.first).toBe(0);
		expect(list.last).toBe(13);

		setWindow(1200, 500);
		list.onScroll();
		// 1000px into the list is row 20; 500px later is row 30.
		expect(list.first).toBe(18);
		expect(list.last).toBe(33);
		expect(list.padTop).toBe(18 * 50);
		expect(list.padBottom).toBe((1000 - 33) * 50);
	});

	test("re-measures where the list starts once the page has scrolled", () => {
		setWindow(300, 500);
		const list = createWindowVirtualizer({
			count: () => 100,
			rowHeight: () => 10,
			overscan: 0,
		});
		// The container is 100px under the viewport's top: 400px down the page.
		list.bind(container(100));
		list.onResize();
		list.onScroll();
		expect(list.first).toBe(0);
		setWindow(600, 500);
		list.onScroll();
		expect(list.first).toBe(20);
		list.bind(null);
		list.measure();
		expect(list.first).toBe(20);
	});

	test("never runs past the end of a short list", () => {
		setWindow(0, 800);
		const list = createWindowVirtualizer({
			count: () => 3,
			rowHeight: () => 0,
		});
		list.onResize();
		// A zero row height is taken as 1px.
		expect(list.first).toBe(0);
		expect(list.last).toBe(3);
		expect(list.padBottom).toBe(0);
	});

	test("an empty list renders nothing", () => {
		const list = createWindowVirtualizer({
			count: () => -1,
			rowHeight: () => 40,
		});
		expect(list.first).toBe(0);
		expect(list.last).toBe(0);
		expect(list.padTop).toBe(0);
		expect(list.padBottom).toBe(0);
	});

	test("sums mixed row heights into the spacers", () => {
		setWindow(0, 100);
		// Every third row is a file (60px), the others its versions (20px).
		const heightOf = (index: number) => (index % 3 === 0 ? 60 : 20);
		const list = createWindowVirtualizer({
			count: () => 30,
			rowHeight: () => 60,
			heightOf,
			overscan: 1,
		});
		list.bind(container(0));
		list.onResize();
		expect(list.first).toBe(0);
		// 100px reaches row 3 (starting at 100); one row of overscan beyond.
		expect(list.last).toBe(5);
		expect(list.padTop).toBe(0);
		expect(list.padBottom).toBe(10 * 100 - (60 + 20 + 20 + 60 + 20));

		setWindow(300, 100);
		list.onScroll();
		// 300px is row 9, 400px row 12.
		expect(list.first).toBe(8);
		expect(list.last).toBe(14);
		expect(list.padTop).toBe(2 * 100 + 60 + 20);
		expect(list.padBottom).toBe(10 * 100 - 4 * 100 - 60 - 20);
	});
});
