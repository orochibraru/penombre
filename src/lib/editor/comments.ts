/**
 * Comments on office files: what they point at and how a thread reads.
 *
 * A comment is a file note with an anchor. Media notes carry a timestamp and
 * no anchor, and never reach anything here.
 */

/** Quoted text, found again by its words rather than by a position. */
export interface TextAnchor {
	kind: "text";
	quote: string;
	/** The characters just before and after, to pick between repeats. */
	prefix: string;
	suffix: string;
	/** Where it started in the document's text when it was written. */
	offset: number;
}

export interface CellAnchor {
	kind: "cell";
	sheet: string;
	/** `A1` */
	cell: string;
}

export interface SlideAnchor {
	kind: "slide";
	index: number;
	/** A slide's own id when the format has one, so a reorder keeps it. */
	id?: string;
}

export type CommentAnchor = TextAnchor | CellAnchor | SlideAnchor;

/** How much text either side of a quote is kept to tell repeats apart. */
export const CONTEXT = 32;

/** A note as the notes API returns it. */
export interface CommentNote {
	id: string;
	userId: string;
	authorName: string | null;
	body: string;
	anchor: CommentAnchor | null;
	parentId: string | null;
	resolvedAt: string | null;
	resolvedByName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Thread {
	root: CommentNote;
	replies: CommentNote[];
}

/** Roots with their replies, oldest first; a reply whose root is gone is dropped. */
export function threads(notes: CommentNote[]): Thread[] {
	const byCreation = (a: CommentNote, b: CommentNote) =>
		a.createdAt.localeCompare(b.createdAt);
	const roots = notes.filter((note) => note.parentId === null);
	return roots.toSorted(byCreation).map((root) => ({
		root,
		replies: notes
			.filter((note) => note.parentId === root.id)
			.toSorted(byCreation),
	}));
}

/** `Sheet1!B3`: one key per commented cell. */
export function cellKey(sheet: string, cell: string): string {
	return `${sheet}!${cell.toUpperCase()}`;
}

/** Common characters at the end of `a` and `b`. */
function sharedEnd(a: string, b: string): number {
	let n = 0;
	while (n < a.length && n < b.length && a.at(-1 - n) === b.at(-1 - n)) {
		n++;
	}
	return n;
}

/** Common characters at the start of `a` and `b`. */
function sharedStart(a: string, b: string): number {
	let n = 0;
	while (n < a.length && n < b.length && a[n] === b[n]) {
		n++;
	}
	return n;
}

/**
 * Where a quote is in `text` now, or null when its words are gone.
 *
 * Every occurrence is scored by how much of its old surroundings it still
 * has; the distance from where it used to be only breaks ties.
 */
export function locateQuote(
	text: string,
	anchor: Pick<TextAnchor, "quote" | "prefix" | "suffix" | "offset">,
): { start: number; end: number } | null {
	const { quote } = anchor;
	if (!quote) {
		return null;
	}
	let best: { start: number; score: number } | null = null;
	for (
		let at = text.indexOf(quote);
		at !== -1;
		at = text.indexOf(quote, at + 1)
	) {
		const before = text.slice(Math.max(0, at - anchor.prefix.length), at);
		const after = text.slice(
			at + quote.length,
			at + quote.length + anchor.suffix.length,
		);
		const score =
			sharedEnd(before, anchor.prefix) +
			sharedStart(after, anchor.suffix) -
			Math.abs(at - anchor.offset) / (text.length + 1);
		if (!best || score > best.score) {
			best = { start: at, score };
		}
	}
	return best ? { start: best.start, end: best.start + quote.length } : null;
}

/** An anchor for `text[start, end)`. */
export function textAnchor(
	text: string,
	start: number,
	end: number,
): TextAnchor | null {
	const quote = text.slice(start, end);
	if (!quote.trim()) {
		return null;
	}
	return {
		kind: "text",
		quote,
		prefix: text.slice(Math.max(0, start - CONTEXT), start),
		suffix: text.slice(end, end + CONTEXT),
		offset: start,
	};
}

/** A run of text at a document position; `block` changes between paragraphs. */
export interface TextRun {
	text: string;
	pos: number;
	block: number;
}

/**
 * A document's text as one string, paragraphs split by a newline, with the
 * way back and forth between string offsets and document positions.
 */
export function flatten(runs: TextRun[]) {
	const starts: number[] = [];
	let text = "";
	let block: number | null = null;
	for (const run of runs) {
		if (block !== null && run.block !== block) {
			text += "\n";
		}
		block = run.block;
		starts.push(text.length);
		text += run.text;
	}

	const toPos = (offset: number): number => {
		for (let index = runs.length - 1; index >= 0; index--) {
			const start = starts[index] ?? 0;
			const run = runs[index];
			if (run && offset >= start) {
				return run.pos + Math.min(offset - start, run.text.length);
			}
		}
		return runs[0]?.pos ?? 0;
	};

	const toOffset = (pos: number): number => {
		for (let index = runs.length - 1; index >= 0; index--) {
			const run = runs[index];
			if (run && pos >= run.pos) {
				return (starts[index] ?? 0) + Math.min(pos - run.pos, run.text.length);
			}
		}
		return 0;
	};

	return { text, toPos, toOffset };
}
