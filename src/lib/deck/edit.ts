/**
 * Formatting a textarea's Markdown: each command is a replacement of one
 * range plus the selection to leave behind, so the caller can apply it as a
 * single undoable edit.
 */
export interface Edit {
	from: number;
	to: number;
	insert: string;
	selection: [number, number];
}

/** How many `char` in a row start at `from`, walking by `step`. */
function runOf(text: string, char: string, from = 0, step = 1): number {
	let count = 0;
	while (text[from + count * step] === char) {
		count++;
	}
	return count;
}

/**
 * Wrap the selection in `marker`, or unwrap it when it already is. `*` inside
 * `**` counts as bold, not italic: a run of one or three is italic, two or
 * three is bold.
 */
export function wrap(
	value: string,
	[start, end]: [number, number],
	marker: string,
	placeholder: string,
): Edit {
	const char = marker[0] ?? "";
	const before = runOf(value, char, start - 1, -1);
	const after = runOf(value.slice(end), char);
	const single = marker.length === 1;
	const wrapped = single
		? before % 2 === 1 && after % 2 === 1
		: before >= marker.length && after >= marker.length;
	const selected = value.slice(start, end);
	const inside = runOf(selected, char);
	const outer = runOf(selected, char, selected.length - 1, -1);
	if (
		selected.length > 2 * marker.length &&
		(single
			? inside % 2 === 1 && outer % 2 === 1
			: inside >= marker.length && outer >= marker.length)
	) {
		const inner = selected.slice(marker.length, -marker.length);
		return {
			from: start,
			to: end,
			insert: inner,
			selection: [start, start + inner.length],
		};
	}
	if (wrapped) {
		return {
			from: start - marker.length,
			to: end + marker.length,
			insert: selected,
			selection: [start - marker.length, end - marker.length],
		};
	}
	const text = selected || placeholder;
	return {
		from: start,
		to: end,
		insert: `${marker}${text}${marker}`,
		selection: [start + marker.length, start + marker.length + text.length],
	};
}

/** The whole lines a selection touches. */
function lineRange(
	value: string,
	[start, end]: [number, number],
): [number, number] {
	const from = value.lastIndexOf("\n", start - 1) + 1;
	// A selection ending just past a newline does not include the next line.
	const last = end > start && value[end - 1] === "\n" ? end - 1 : end;
	const newline = value.indexOf("\n", last);
	return [from, newline === -1 ? value.length : newline];
}

const LIST = /^(\s*)(?:[-*+]|\d{1,9}[.)])\s+/;

/**
 * Toggle a line prefix on every selected line: bullets, numbers, quotes.
 * `strip` removes a competing prefix first, so a bullet becomes a number
 * rather than both.
 */
export function prefixLines(
	value: string,
	selection: [number, number],
	prefix: (index: number) => string,
	{ has, strip }: { has: RegExp; strip?: RegExp },
): Edit {
	const [from, to] = lineRange(value, selection);
	const lines = value.slice(from, to).split("\n");
	const filled = lines.filter((line) => line.trim() !== "");
	const on = filled.length > 0 && filled.every((line) => has.test(line));
	let counter = 0;
	const insert = lines
		.map((line) => {
			if (on) {
				return line.replace(has, "$1");
			}
			if (line.trim() === "" && lines.length > 1) {
				return line;
			}
			const bare = strip ? line.replace(strip, "$1") : line;
			const indent = /^\s*/.exec(bare)?.[0] ?? "";
			return `${indent}${prefix(counter++)}${bare.slice(indent.length)}`;
		})
		.join("\n");
	const collapsed = selection[0] === selection[1] && lines.length === 1;
	return {
		from,
		to,
		insert,
		selection: collapsed
			? [from + insert.length, from + insert.length]
			: [from, from + insert.length],
	};
}

export const bullets = (value: string, selection: [number, number]) =>
	prefixLines(value, selection, () => "- ", {
		has: /^(\s*)[-*+]\s+/,
		strip: LIST,
	});

export const numbers = (value: string, selection: [number, number]) =>
	prefixLines(value, selection, (index) => `${index + 1}. `, {
		has: /^(\s*)\d{1,9}[.)]\s+/,
		strip: LIST,
	});

export const quotes = (value: string, selection: [number, number]) =>
	prefixLines(value, selection, () => "> ", { has: /^(\s{0,3})>\s?/ });

/** Cycle the caret's line through heading 1, 2, 3 and back to text. */
export function cycleHeading(value: string, selection: [number, number]): Edit {
	const [from, to] = lineRange(value, [selection[0], selection[0]]);
	const line = value.slice(from, to);
	const level = /^(#{1,6})\s/.exec(line)?.[1]?.length ?? 0;
	const text = line.replace(/^#{1,6}\s+/, "");
	const next = level >= 3 ? 0 : level + 1;
	const insert = next === 0 ? text : `${"#".repeat(next)} ${text}`;
	return {
		from,
		to,
		insert,
		selection: [from + insert.length, from + insert.length],
	};
}

/**
 * Insert a block on lines of its own, blank lines around it. `select` is a
 * range inside `block` to leave selected, such as a URL to type over.
 */
export function insertBlock(
	value: string,
	[start, end]: [number, number],
	block: string,
	select: [number, number] = [block.length, block.length],
): Edit {
	const before = value.slice(0, start);
	const after = value.slice(end);
	const lead =
		before === "" || before.endsWith("\n\n")
			? ""
			: before.endsWith("\n")
				? "\n"
				: "\n\n";
	const trail =
		after === "" || after.startsWith("\n\n")
			? ""
			: after.startsWith("\n")
				? "\n"
				: "\n\n";
	const offset = start + lead.length;
	return {
		from: start,
		to: end,
		insert: `${lead}${block}${trail}`,
		selection: [offset + select[0], offset + select[1]],
	};
}

/** `[selection](url)`, with the URL selected so it can be typed over. */
export function link(
	value: string,
	[start, end]: [number, number],
	placeholder: string,
): Edit {
	const text = value.slice(start, end) || placeholder;
	const url = "https://";
	const insert = `[${text}](${url})`;
	const at = start + text.length + 3;
	return { from: start, to: end, insert, selection: [at, at + url.length] };
}

/** Inline code for a word, a fenced block for several lines. */
export function code(
	value: string,
	selection: [number, number],
	placeholder: string,
): Edit {
	const selected = value.slice(selection[0], selection[1]);
	if (!selected.includes("\n")) {
		return wrap(value, selection, "`", placeholder);
	}
	const block = `\`\`\`\n${selected.replace(/\n$/, "")}\n\`\`\``;
	return insertBlock(value, selection, block, [4, block.length - 4]);
}

export const TABLE = "|     |     |\n| --- | --- |\n|     |     |";

export const table = (value: string, selection: [number, number]) =>
	insertBlock(value, selection, TABLE, [2, 2]);

/** A picture on a line of its own; an empty source leaves a URL to type. */
export function image(
	value: string,
	selection: [number, number],
	src = "",
): Edit {
	const url = src || "https://";
	const block = `![](${url})`;
	return insertBlock(
		value,
		selection,
		block,
		src ? [block.length, block.length] : [4, 4 + url.length],
	);
}
