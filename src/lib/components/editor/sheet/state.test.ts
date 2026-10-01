import { beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileModule } from "svelte/compiler";
import type { SheetState as State } from "./state.svelte";

/**
 * `SheetState` uses runes, which only the Svelte compiler understands, so
 * the test compiles the module itself and imports the result. Imports are
 * made absolute, since the compiled file lives outside the package.
 */
let SheetState: typeof State;

beforeAll(async () => {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const lib = path.resolve(here, "../../..");
	const source = await Bun.file(path.join(here, "state.svelte.ts")).text();
	const js = new Bun.Transpiler({ loader: "ts" }).transformSync(source);
	const { code } = compileModule(js, {
		generate: "client",
		filename: "state.svelte.js",
	}).js;
	const runtime = fileURLToPath(import.meta.resolve("svelte/internal/client"));
	const absolute = code
		.replaceAll("'svelte/internal/client'", JSON.stringify(runtime))
		.replaceAll('"#lib/', `"${lib}/`);
	const file = path.join(
		mkdtempSync(path.join(tmpdir(), "sheet-state-")),
		"state.js",
	);
	await Bun.write(file, absolute);
	({ SheetState } = await import(file));
});

function open(csv: string) {
	const saved: string[] = [];
	const sheet = new SheetState(csv, false, (content) => saved.push(content));
	return { sheet, saved, last: () => saved.at(-1) };
}

describe("SheetState", () => {
	it("types over a cell, commits, and moves on", () => {
		const { sheet, last } = open("a,b\n1,2\n");
		sheet.selectCell({ row: 1, col: 0 });
		sheet.begin("enter", "5");
		sheet.setDraft("50");
		sheet.commit(1, 0);
		expect(last()).toBe("a,b\n50,2\n");
		expect(sheet.selection.anchor).toEqual({ row: 2, col: 0 });
	});

	it("returns to the column a run of Tabs began in", () => {
		const { sheet } = open("a,b,c\n");
		sheet.selectCell({ row: 0, col: 0 });
		for (const text of ["x", "y"]) {
			sheet.begin("enter", text);
			sheet.commit(0, 1);
		}
		sheet.begin("enter", "z");
		sheet.commit(1, 0);
		expect(sheet.selection.anchor).toEqual({ row: 1, col: 0 });
		// Moving by any other means forgets where the run began.
		sheet.advance(0, 1);
		sheet.selectCell({ row: 3, col: 2 });
		sheet.advance(1, 0);
		expect(sheet.selection.anchor).toEqual({ row: 4, col: 2 });
	});

	it("puts the cell back on cancel", () => {
		const { sheet, saved } = open("a\n");
		sheet.begin("enter", "x");
		sheet.cancel();
		expect(sheet.editing).toBeNull();
		expect(saved).toEqual([]);
	});

	it("types in the formula bar without opening the cell", () => {
		const { sheet, last } = open("1\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.setDraft("=A1*3");
		expect(sheet.editing?.bar).toBe(true);
		sheet.commit();
		expect(last()).toBe("1,=A1*3\n");
		expect(sheet.shown(0, 1)).toBe("3");
		expect(sheet.numeric(0, 1)).toBe(true);
		expect(sheet.failed(0, 1)).toBe(false);
	});

	it("reads cells the way the grid shows them", () => {
		const { sheet } = open("x,5,=1/0,2026-03-14\n");
		expect(sheet.numeric(0, 0)).toBe(false);
		expect(sheet.numeric(0, 1)).toBe(true);
		expect(sheet.failed(0, 2)).toBe(true);
		expect(sheet.shown(0, 2)).toBe("#DIV/0!");
		expect(sheet.numeric(0, 3)).toBe(true);
		expect(sheet.bounds.rows).toBeGreaterThan(1);
	});

	it("selects rows, columns and everything", () => {
		const { sheet } = open("a,b,c\n1,2,3\n4,5,6\n");
		sheet.selectRows(1, false);
		sheet.selectRows(2, true);
		expect(sheet.rect).toEqual({ top: 1, left: 0, bottom: 2, right: 2 });
		sheet.selectCols(1, false);
		expect(sheet.rect).toEqual({ top: 0, left: 1, bottom: 2, right: 1 });
		expect(sheet.selected(2, 1)).toBe(true);
		expect(sheet.selected(2, 2)).toBe(false);
		sheet.selectAll();
		expect(sheet.rect).toEqual({ top: 0, left: 0, bottom: 2, right: 2 });
		sheet.move(1, 1);
		expect(sheet.singleCell).toBe(true);
		expect(sheet.selection.anchor).toEqual({ row: 1, col: 1 });
		sheet.move(-5, 0, true);
		expect(sheet.rect).toEqual({ top: 0, left: 1, bottom: 1, right: 1 });
	});

	it("inserts and deletes columns", () => {
		const { sheet, last } = open("a,b,=B1\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.insertCols(false);
		expect(last()).toBe("a,,b,=C1\n");
		sheet.insertCols(true);
		expect(last()).toBe("a,,,b,=D1\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.deleteCols();
		expect(last()).toBe("a,,b,=C1\n");
		sheet.selectCell({ row: 0, col: 30 });
		sheet.deleteCols();
		expect(last()).toBe("a,,b,=C1\n");
	});

	it("marks what was copied until the next edit", () => {
		const { sheet } = open("1,2\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.copy(false);
		expect(sheet.isCopied(0, 1)).toBe(true);
		expect(sheet.isCopied(0, 0)).toBe(false);
		sheet.clear();
		expect(sheet.copied).toBeNull();
	});

	it("keeps column widths per sheet, view only", () => {
		const { sheet, saved } = open("a\n");
		expect(sheet.widthOf(3)).toBe(112);
		sheet.setWidth(3, 20);
		expect(sheet.widthOf(3)).toBe(40);
		sheet.setWidth(0, 200.4);
		expect(sheet.widthOf(0)).toBe(200);
		expect(saved).toEqual([]);
	});

	it("undoes and redoes whole edits", () => {
		const { sheet, last } = open("1\n");
		sheet.begin("enter", "2");
		sheet.commit();
		sheet.selectCell({ row: 0, col: 1 });
		sheet.begin("enter", "3");
		sheet.commit();
		expect(last()).toBe("2,3\n");
		sheet.undo();
		expect(last()).toBe("2\n");
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 1 });
		sheet.undo();
		expect(last()).toBe("1\n");
		expect(sheet.canUndo).toBe(false);
		sheet.redo();
		expect(last()).toBe("2\n");
		expect(sheet.canRedo).toBe(true);
	});

	it("copies values out and pastes its own formulas back shifted", () => {
		const { sheet, last } = open("1,=A1*2\n2,\n3,\n");
		sheet.selectCell({ row: 0, col: 1 });
		expect(sheet.copy(false)).toBe("2");
		sheet.select({ anchor: { row: 1, col: 1 }, focus: { row: 2, col: 1 } });
		sheet.paste("2");
		expect(last()).toBe("1,=A1*2\n2,=A2*2\n3,=A3*2\n");
		expect(sheet.selection.focus).toEqual({ row: 2, col: 1 });
	});

	it("moves cells on a cut, formulas as they were", () => {
		const { sheet, last } = open("1,=A1\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.copy(true);
		sheet.selectCell({ row: 2, col: 2 });
		sheet.paste("1");
		expect(last()).toBe("1,,\n,,\n,,=A1\n");
	});

	it("pastes text from elsewhere as values, growing the grid", () => {
		const { sheet, last } = open("x\n");
		sheet.selectCell({ row: 1, col: 1 });
		sheet.paste("a\tb\n=1+1\td\n");
		expect(last()).toBe("x,,\n,a,b\n,=1+1,d\n");
		expect(sheet.shown(2, 1)).toBe("2");
	});

	it("clears the selection with Delete", () => {
		const { sheet, last } = open("1,2\n3,4\n");
		sheet.select({ anchor: { row: 0, col: 0 }, focus: { row: 1, col: 0 } });
		sheet.clear();
		expect(last()).toBe(",2\n,4\n");
	});

	it("inserts and deletes rows under the selection, fixing formulas", () => {
		const { sheet, last } = open("=SUM(A2:A3)\n1\n2\n");
		sheet.selectCell({ row: 2, col: 0 });
		sheet.insertRows(false);
		expect(last()).toBe("=SUM(A2:A4)\n1\n\n2\n");
		sheet.select({ anchor: { row: 1, col: 0 }, focus: { row: 2, col: 0 } });
		sheet.deleteRows();
		expect(last()).toBe("=SUM(A2:A2)\n2\n");
		sheet.selectCell({ row: 40, col: 0 });
		sheet.deleteRows();
		expect(last()).toBe("=SUM(A2:A2)\n2\n");
	});

	it("fills down from the top of the selection", () => {
		const { sheet, last } = open("1,=A1+1\n2,\n");
		sheet.select({ anchor: { row: 0, col: 1 }, focus: { row: 1, col: 1 } });
		sheet.fill("down");
		expect(last()).toBe("1,=A1+1\n2,=A2+1\n");
	});

	it("sorts below the header by the active column", () => {
		const { sheet, last } = open("n\n10\n=1+1\nb\n\n");
		sheet.sort(false, 0);
		expect(last()).toBe("n\n=1+1\n10\nb\n");
		sheet.header = false;
		sheet.sort(true, 0);
		expect(last()).toBe("n\nb\n10\n=1+1\n");
	});

	it("finds the next cell holding the text, results included", () => {
		const { sheet } = open("apple,=UPPER(A1)\npear,\n");
		expect(sheet.find("APPLE")).toBe(true);
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 1 });
		expect(sheet.find("nothing")).toBe(false);
	});

	it("leaps to the edge of the data with Ctrl+arrow", () => {
		const { sheet } = open("1\n2\n3\n\n5\n");
		sheet.leap(1, 0);
		expect(sheet.selection.anchor.row).toBe(2);
		sheet.leap(1, 0);
		expect(sheet.selection.anchor.row).toBe(4);
		sheet.leap(-1, 0, true);
		expect(sheet.selection.focus.row).toBe(2);
	});
});

describe("pointing at cells while typing a formula", () => {
	it("puts the clicked cell, then the dragged range, into the formula", () => {
		const { sheet, last } = open("1\n2\n3\n");
		sheet.selectCell({ row: 0, col: 1 });
		sheet.begin("enter", "=SUM(");
		sheet.caret = 5;
		expect(sheet.pointing).toBe(true);
		sheet.pointAt({ row: 0, col: 0 }, false);
		expect(sheet.editing?.draft).toBe("=SUM(A1");
		sheet.pointAt({ row: 2, col: 0 }, true);
		expect(sheet.editing?.draft).toBe("=SUM(A1:A3");
		expect(sheet.picked).toEqual({ top: 0, left: 0, bottom: 2, right: 0 });
		expect(sheet.caret).toBe(10);
		sheet.setDraft("=sum(a1:A3)");
		expect(sheet.picked).toBeNull();
		sheet.caret = 11;
		expect(sheet.pointing).toBe(false);
		sheet.commit();
		expect(last()).toBe("1,=SUM(A1:A3)\n2,\n3,\n");
		expect(sheet.shown(0, 1)).toBe("6");
	});

	it("only after something a reference can follow", () => {
		const { sheet } = open("1\n");
		sheet.begin("enter", "=A1");
		sheet.caret = 3;
		expect(sheet.pointing).toBe(false);
		sheet.setDraft("=A1+ ");
		sheet.caret = 5;
		expect(sheet.pointing).toBe(true);
		sheet.setDraft("hello(");
		sheet.caret = 6;
		expect(sheet.pointing).toBe(false);
	});
});

describe("SheetState over a workbook", () => {
	const book = JSON.stringify({
		nextId: 5,
		sheets: [
			{ id: 1, name: "Main", rows: [["=Data!A1*2"]] },
			{ id: 4, name: "Data", rows: [["21"]] },
		],
	});

	function openBook() {
		const saved: string[] = [];
		const sheet = new SheetState(book, true, (content) => saved.push(content));
		return {
			sheet,
			last: () =>
				JSON.parse(saved.at(-1) ?? "{}") as {
					sheets: { id: number; name: string; rows: string[][] }[];
				},
		};
	}

	it("computes across sheets", () => {
		const { sheet } = openBook();
		expect(sheet.shown(0, 0)).toBe("42");
		sheet.switchTo(1);
		expect(sheet.shown(0, 0)).toBe("21");
	});

	it("adds a sheet with the next free id, and renames with its references", () => {
		const { sheet, last } = openBook();
		sheet.addSheet();
		expect(sheet.active).toBe(2);
		expect(last().sheets.at(-1)).toEqual({
			id: 5,
			name: "Sheet3",
			rows: [[""]],
		});
		expect(sheet.renameSheet(1, "main")).toBe("taken");
		expect(sheet.renameSheet(1, "Q1 data")).toBeNull();
		expect(last().sheets[0]?.rows[0]?.[0]).toBe("='Q1 data'!A1*2");
	});

	it("deletes a sheet, and keeps showing the one that was on screen", () => {
		const { sheet, last } = openBook();
		sheet.addSheet();
		sheet.deleteSheet(0);
		expect(last().sheets.map((s) => s.name)).toEqual(["Data", "Sheet3"]);
		expect(sheet.sheet?.name).toBe("Sheet3");
		sheet.undo();
		expect(last().sheets.map((s) => s.name)).toEqual([
			"Main",
			"Data",
			"Sheet3",
		]);
	});
});

describe("the sheet's keyboard", () => {
	const press = (key: string, extra: Partial<KeyboardEvent> = {}) =>
		({
			key,
			shiftKey: false,
			metaKey: false,
			ctrlKey: false,
			altKey: false,
			isComposing: false,
			...extra,
		}) as KeyboardEvent;

	function context() {
		const calls: string[] = [];
		return {
			calls,
			context: {
				clipboard: (kind: string) => calls.push(kind),
				typeInto: () => calls.push("typeInto"),
				page: 10,
			},
		};
	}

	it("moves, extends and leaps with the arrows", async () => {
		const { gridKey } = await import("./keys");
		const { sheet } = open("1\n2\n3\n");
		const { context: ctx } = context();
		expect(gridKey(sheet, press("ArrowDown"), ctx)).toBe("prevent");
		expect(sheet.selection.anchor).toEqual({ row: 1, col: 0 });
		gridKey(sheet, press("ArrowRight", { shiftKey: true }), ctx);
		expect(sheet.rect).toEqual({ top: 1, left: 0, bottom: 1, right: 1 });
		gridKey(sheet, press("ArrowDown", { ctrlKey: true }), ctx);
		expect(sheet.selection.anchor.row).toBe(2);
		gridKey(sheet, press("PageDown"), ctx);
		expect(sheet.selection.anchor.row).toBe(12);
		gridKey(sheet, press("Home", { metaKey: true }), ctx);
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 0 });
		gridKey(sheet, press("Tab"), ctx);
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 1 });
	});

	it("starts editing by typing, Enter or F2", async () => {
		const { gridKey } = await import("./keys");
		const { sheet } = open("hello\n");
		const { context: ctx, calls } = context();
		expect(gridKey(sheet, press("x"), ctx)).toBe("prevent");
		expect(sheet.editing).toMatchObject({ draft: "x", mode: "enter" });
		sheet.cancel();
		gridKey(sheet, press("Enter"), ctx);
		expect(sheet.editing).toMatchObject({ draft: "hello", mode: "edit" });
		sheet.cancel();
		gridKey(sheet, press("F2"), ctx);
		expect(sheet.editing?.mode).toBe("edit");
		sheet.cancel();
		expect(gridKey(sheet, press("Dead"), ctx)).toBe("pass");
		expect(sheet.editing?.draft).toBe("");
		expect(calls).toEqual(["typeInto"]);
		sheet.cancel();
		// AltGr types a character; Ctrl alone with a letter is a shortcut.
		expect(
			gridKey(sheet, press("€", { ctrlKey: true, altKey: true }), ctx),
		).toBe("prevent");
		expect(sheet.editing?.draft).toBe("€");
		sheet.cancel();
		expect(gridKey(sheet, press("q", { ctrlKey: true }), ctx)).toBeNull();
	});

	it("routes the clipboard and the shortcuts", async () => {
		const { gridKey } = await import("./keys");
		const { sheet, last } = open("1,2\n");
		const { context: ctx, calls } = context();
		expect(gridKey(sheet, press("c", { metaKey: true }), ctx)).toBe("pass");
		expect(gridKey(sheet, press("x", { ctrlKey: true }), ctx)).toBe("pass");
		expect(gridKey(sheet, press("V", { ctrlKey: true }), ctx)).toBe("pass");
		expect(calls).toEqual(["copy", "cut", "paste"]);
		gridKey(sheet, press("Delete"), ctx);
		expect(last()).toBe(",2\n");
		gridKey(sheet, press("z", { ctrlKey: true }), ctx);
		expect(last()).toBe("1,2\n");
		gridKey(sheet, press("z", { metaKey: true, shiftKey: true }), ctx);
		expect(last()).toBe(",2\n");
		gridKey(sheet, press("a", { ctrlKey: true }), ctx);
		expect(sheet.rect).toEqual({ top: 0, left: 0, bottom: 0, right: 1 });
		gridKey(sheet, press("Escape"), ctx);
		expect(sheet.singleCell).toBe(true);
		gridKey(sheet, press(" ", { shiftKey: true }), ctx);
		expect(sheet.rect).toEqual({ top: 0, left: 0, bottom: 0, right: 1 });
		sheet.selectCell({ row: 0, col: 1 });
		gridKey(sheet, press(" ", { ctrlKey: true }), ctx);
		expect(sheet.rect).toEqual({ top: 0, left: 1, bottom: 0, right: 1 });
		expect(sheet.editing).toBeNull();
	});

	it("writes and moves on from the editor, arrows included while typing a value", async () => {
		const { editorKey } = await import("./keys");
		const { sheet, last } = open("a,b\n");
		sheet.begin("enter", "x");
		expect(editorKey(sheet, press("ArrowRight"), true)).toBe(true);
		expect(last()).toBe("x,b\n");
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 1 });
		sheet.begin("enter", "=SUM(");
		expect(editorKey(sheet, press("ArrowLeft"), true)).toBe(false);
		expect(editorKey(sheet, press("Enter", { isComposing: true }), true)).toBe(
			false,
		);
		expect(editorKey(sheet, press("Enter", { altKey: true }), true)).toBe(
			false,
		);
		expect(editorKey(sheet, press("Tab", { shiftKey: true }), true)).toBe(true);
		expect(sheet.selection.anchor).toEqual({ row: 0, col: 0 });
		sheet.begin("edit");
		expect(editorKey(sheet, press("ArrowDown"), true)).toBe(false);
		expect(editorKey(sheet, press("Escape"), true)).toBe(true);
		expect(sheet.editing).toBeNull();
		sheet.begin("edit", "y");
		expect(editorKey(sheet, press("Enter"), false)).toBe(true);
		expect(sheet.selection.anchor).toEqual({ row: 1, col: 0 });
		expect(last()).toBe("y,=SUM(\n");
	});

	it("in view mode, selects and copies but changes nothing", () => {
		const { sheet, saved } = open("a,b\n1,2\n");
		sheet.readOnly = true;
		sheet.selectCell({ row: 1, col: 1 });
		sheet.begin("enter", "9");
		expect(sheet.editing).toBeNull();
		sheet.clear();
		sheet.paste("x");
		sheet.insertRows(true);
		sheet.sort(true);
		sheet.addSheet();
		expect(sheet.renameSheet(0, "Other")).toBeNull();
		expect(saved).toEqual([]);
		expect(sheet.copy(false)).toBe("2");
	});

	it("knows which cells carry a comment", () => {
		const { sheet } = open("a,b\n1,2\n");
		const name = sheet.sheet?.name ?? "";
		sheet.comments = new Set([`${name}!B2`]);
		expect(sheet.commented(1, 1)).toBe(true);
		expect(sheet.commented(0, 0)).toBe(false);
	});
});
