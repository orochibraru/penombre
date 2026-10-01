import {
	type Paragraph,
	type Run,
	type RunStyle,
	sameValue,
	type TextBody,
} from "./model";

/**
 * Text edits as model operations over (paragraph, offset) positions. The
 * editor lets the browser type and delete, reads the result back, and runs
 * everything else — formatting, new paragraphs, pastes — through these, so
 * the text box renders the same whether or not it is being edited.
 */

export interface Pos {
	/** Paragraph index. */
	p: number;
	/** Characters into the paragraph, a line break counting as one. */
	o: number;
}

export function paragraphText(paragraph: Paragraph): string {
	return paragraph.runs.map((run) => run.text).join("");
}

export function comparePos(a: Pos, b: Pos): number {
	return a.p === b.p ? a.o - b.o : a.p - b.p;
}

function styleOf(run: Run): RunStyle & { field?: Run["field"] } {
	const { text: _text, ...style } = run;
	return style;
}

/** Adjacent runs that look the same become one; empty ones go. */
export function normalizeRuns(runs: Run[]): Run[] {
	const out: Run[] = [];
	for (const run of runs) {
		if (run.text === "") {
			continue;
		}
		const last = out.at(-1);
		if (
			last &&
			!last.field &&
			!run.field &&
			sameValue(styleOf(last), styleOf(run))
		) {
			last.text += run.text;
		} else {
			out.push({ ...run });
		}
	}
	return out;
}

/** The runs split so that one starts exactly at `offset`. Returns that index. */
function splitAt(paragraph: Paragraph, offset: number): number {
	let at = 0;
	for (let index = 0; index < paragraph.runs.length; index++) {
		const run = paragraph.runs[index] as Run;
		if (offset <= at) {
			return index;
		}
		if (offset < at + run.text.length) {
			const cut = offset - at;
			paragraph.runs.splice(
				index,
				1,
				{ ...run, text: run.text.slice(0, cut) },
				{ ...run, text: run.text.slice(cut) },
			);
			return index + 1;
		}
		at += run.text.length;
	}
	return paragraph.runs.length;
}

/** Visit every run between two positions, splitting at the edges. */
function eachRun(
	body: TextBody,
	start: Pos,
	end: Pos,
	visit: (run: Run) => void,
): void {
	for (let p = start.p; p <= end.p; p++) {
		const paragraph = body.paragraphs[p];
		if (!paragraph) {
			continue;
		}
		const length = paragraphText(paragraph).length;
		const first = splitAt(paragraph, p === start.p ? start.o : 0);
		const stop = splitAt(paragraph, p === end.p ? end.o : length);
		for (const run of paragraph.runs.slice(first, stop)) {
			visit(run);
		}
	}
}

/** Word boundaries around a caret, for formatting a word with no selection. */
export function wordAt(body: TextBody, pos: Pos): [Pos, Pos] {
	const text = paragraphText(body.paragraphs[pos.p] ?? { runs: [] });
	let from = pos.o;
	let to = pos.o;
	while (from > 0 && /\w/u.test(text[from - 1] ?? "")) {
		from--;
	}
	while (to < text.length && /\w/u.test(text[to] ?? "")) {
		to++;
	}
	return [
		{ p: pos.p, o: from },
		{ p: pos.p, o: to },
	];
}

/** Character formatting laid over a range; a collapsed range takes its word. */
export function styleRange(
	body: TextBody,
	start: Pos,
	end: Pos,
	patch: RunStyle,
): TextBody {
	const next = structuredClone(body);
	const [from, to] =
		comparePos(start, end) === 0 ? wordAt(next, start) : [start, end];
	eachRun(next, from, to, (run) => Object.assign(run, patch));
	for (const paragraph of next.paragraphs) {
		paragraph.runs = normalizeRuns(paragraph.runs);
	}
	return next;
}

/** Character formatting for the whole box, empty paragraphs included. */
export function styleAll(body: TextBody, patch: RunStyle): TextBody {
	const next = structuredClone(body);
	for (const paragraph of next.paragraphs) {
		for (const run of paragraph.runs) {
			Object.assign(run, patch);
		}
		if (patch.size !== undefined && paragraph.runs.length === 0) {
			paragraph.endSize = patch.size;
		}
		paragraph.runs = normalizeRuns(paragraph.runs);
	}
	return next;
}

/** The runs a range covers, for the toolbar to show what is on. */
export function rangeRuns(body: TextBody, start: Pos, end: Pos): Run[] {
	if (comparePos(start, end) === 0) {
		const paragraph = body.paragraphs[start.p];
		let at = 0;
		for (const run of paragraph?.runs ?? []) {
			at += run.text.length;
			if (start.o <= at) {
				return [run];
			}
		}
		const last = paragraph?.runs.at(-1);
		return last ? [last] : [];
	}
	const out: Run[] = [];
	eachRun(structuredClone(body), start, end, (run) => out.push(run));
	return out;
}

/** Paragraph settings for the paragraphs a range touches. */
export function styleParagraphs(
	body: TextBody,
	start: Pos,
	end: Pos,
	patch: Partial<Omit<Paragraph, "runs">>,
): TextBody {
	const next = structuredClone(body);
	for (let p = Math.min(start.p, end.p); p <= Math.max(start.p, end.p); p++) {
		const paragraph = next.paragraphs[p];
		if (paragraph) {
			Object.assign(paragraph, patch);
		}
	}
	return next;
}

/** The style a new character at `pos` takes: the run it follows. */
function runStyleAt(paragraph: Paragraph, offset: number): RunStyle {
	let at = 0;
	let style: RunStyle = {};
	for (const run of paragraph.runs) {
		if (run.field) {
			at += run.text.length;
			continue;
		}
		style = styleOf(run);
		at += run.text.length;
		if (offset <= at) {
			break;
		}
	}
	return style;
}

export function deleteRange(
	body: TextBody,
	start: Pos,
	end: Pos,
): { body: TextBody; pos: Pos } {
	const [from, to] = comparePos(start, end) <= 0 ? [start, end] : [end, start];
	const next = structuredClone(body);
	const head = next.paragraphs[from.p];
	const tail = next.paragraphs[to.p];
	if (!head || !tail) {
		return { body: next, pos: from };
	}
	const cutHead = splitAt(head, from.o);
	const kept = head.runs.slice(0, cutHead);
	const cutTail = splitAt(tail, to.o);
	const rest = tail.runs.slice(cutTail);
	head.runs = normalizeRuns([...kept, ...rest]);
	next.paragraphs.splice(from.p + 1, to.p - from.p);
	return { body: next, pos: from };
}

/** Plain text typed or pasted at `pos`, in the style around it. */
export function insertText(
	body: TextBody,
	pos: Pos,
	text: string,
): { body: TextBody; pos: Pos } {
	let next = structuredClone(body);
	let at = pos;
	const style = runStyleAt(next.paragraphs[pos.p] ?? { runs: [] }, pos.o);
	const lines = text.replace(/\r\n?/g, "\n").split("\n");
	lines.forEach((line, index) => {
		if (index > 0) {
			({ body: next, pos: at } = splitParagraph(next, at));
		}
		const paragraph = next.paragraphs[at.p];
		if (!paragraph || line === "") {
			return;
		}
		const cut = splitAt(paragraph, at.o);
		paragraph.runs.splice(cut, 0, { ...style, text: line });
		paragraph.runs = normalizeRuns(paragraph.runs);
		at = { p: at.p, o: at.o + line.length };
	});
	return { body: next, pos: at };
}

/** Enter: the paragraph cut in two, the second keeping the first's settings. */
export function splitParagraph(
	body: TextBody,
	pos: Pos,
): { body: TextBody; pos: Pos } {
	const next = structuredClone(body);
	const paragraph = next.paragraphs[pos.p];
	if (!paragraph) {
		return { body: next, pos };
	}
	const style = runStyleAt(paragraph, pos.o);
	const cut = splitAt(paragraph, pos.o);
	const { runs, ...settings } = paragraph;
	const second: Paragraph = {
		...structuredClone(settings),
		runs: runs.slice(cut),
	};
	if (second.runs.length === 0) {
		second.endSize = style.size ?? paragraph.endSize;
	}
	paragraph.runs = runs.slice(0, cut);
	next.paragraphs.splice(pos.p + 1, 0, second);
	return { body: next, pos: { p: pos.p + 1, o: 0 } };
}
