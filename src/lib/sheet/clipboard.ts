/**
 * Cells on the clipboard as tab-separated text, the format Excel, Google
 * Sheets and LibreOffice all write and read: a cell holding a tab, a line
 * break or a quote is quoted, with its quotes doubled.
 */

export function toTsv(block: string[][]): string {
	return block
		.map((row) =>
			row
				.map((cell) =>
					/[\t\n\r"]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
				)
				.join("\t"),
		)
		.join("\n");
}

/** Reads one quoted field from `at`; null when it is not a well-formed one. */
function quoted(text: string, at: number): [string, number] | null {
	let value = "";
	let i = at + 1;
	while (i < text.length) {
		if (text[i] === '"') {
			if (text[i + 1] === '"') {
				value += '"';
				i += 2;
				continue;
			}
			const after = text[i + 1];
			// A quote that does not end the field means the cell merely
			// started with one, as a plain `"hello` would.
			return after === undefined ||
				after === "\t" ||
				after === "\n" ||
				after === "\r"
				? [value, i + 1]
				: null;
		}
		value += text[i];
		i++;
	}
	return null;
}

export function parseTsv(text: string): string[][] {
	const source = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
	const rows: string[][] = [[]];
	let i = 0;
	while (i <= source.length) {
		const row = rows.at(-1) ?? [];
		const field = source[i] === '"' ? quoted(source, i) : null;
		let value: string;
		if (field) {
			[value, i] = field;
		} else {
			let end = i;
			while (
				end < source.length &&
				source[end] !== "\t" &&
				source[end] !== "\n"
			) {
				end++;
			}
			value = source.slice(i, end);
			i = end;
		}
		row.push(value);
		if (source[i] === "\n") {
			rows.push([]);
		}
		i++;
	}
	return rows;
}
