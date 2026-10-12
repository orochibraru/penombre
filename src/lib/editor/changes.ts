/**
 * A suggested change (Word's tracked change) as the editor's HTML spells
 * it: text inside `<ins>`/`<del>` carrying `data-suggestion`, and a
 * paragraph whose break is suggested carrying `data-paragraph-change`.
 * The `.docx` reader writes this, the editor reads and writes it, the
 * `.docx` writer and the exports read it back.
 */

export type ChangeKind = "insert" | "delete";

export interface Change {
	id: string;
	author: string;
	/** Empty for a change read from Word, which records a name only. */
	authorId: string;
	/** ISO 8601. */
	date: string;
}

export interface ParagraphChange extends Change {
	kind: ChangeKind;
}

export const PARAGRAPH_CHANGE = "data-paragraph-change";

type Attributes = Record<string, string | undefined>;

/** A `data-suggestion` element's change, or null for a plain one. */
export function changeOf(attrs: Attributes): Change | null {
	const id = attrs["data-suggestion"];
	if (id === undefined) {
		return null;
	}
	return {
		id,
		author: attrs["data-author"] ?? "",
		authorId: attrs["data-author-id"] ?? "",
		date: attrs["data-date"] ?? "",
	};
}

export function changeAttributes(change: Change): Record<string, string> {
	return {
		"data-suggestion": change.id,
		"data-author": change.author,
		"data-author-id": change.authorId,
		"data-date": change.date,
	};
}

export function parseParagraphChange(
	value: string | null | undefined,
): ParagraphChange | null {
	if (!value) {
		return null;
	}
	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed !== "object" || parsed === null) {
			return null;
		}
		const { kind, id, author, authorId, date } = parsed as Record<
			string,
			unknown
		>;
		if ((kind !== "insert" && kind !== "delete") || typeof id !== "string") {
			return null;
		}
		const text = (field: unknown) => (typeof field === "string" ? field : "");
		return {
			kind,
			id,
			author: text(author),
			authorId: text(authorId),
			date: text(date),
		};
	} catch {
		return null;
	}
}

export const serializeParagraphChange = (change: ParagraphChange): string =>
	JSON.stringify(change);
