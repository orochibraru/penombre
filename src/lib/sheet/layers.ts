import type { SheetLayout } from "./layout";
import { parseName, type Rect } from "./selection";
import { type CellStyle, type Look, lookOf, PLAIN_LOOK } from "./styles";
import { layered, tableLayer, tableRects } from "./tables";

/**
 * How each cell draws once the layers under its own style are counted: the
 * table it sits in, and the link colour of an unstyled hyperlink. Looks are
 * kept per combination, as the style table's are per style.
 */
export class CellLooks {
	private readonly cache = new Map<string, Look>();
	private readonly rects: (Rect | null)[];
	/** Linked cells by `row * 16384 + col`. */
	private readonly links: Set<number>;

	constructor(
		private readonly styles: CellStyle[],
		private readonly looks: Look[],
		private readonly sheet: SheetLayout | undefined,
	) {
		this.rects = tableRects(sheet?.tables);
		this.links = new Set(
			(sheet?.links ?? []).flatMap((ref) => {
				const cell = parseName(ref)?.anchor;
				return cell ? [cell.row * 16_384 + cell.col] : [];
			}),
		);
	}

	private tableAt(row: number, col: number) {
		for (const [i, rect] of this.rects.entries()) {
			const table = this.sheet?.tables?.[i];
			if (
				table &&
				rect &&
				row >= rect.top &&
				row <= rect.bottom &&
				col >= rect.left &&
				col <= rect.right
			) {
				return tableLayer(table, rect, row, col);
			}
		}
		return null;
	}

	look = (id: number, row: number, col: number): Look => {
		const table = this.rects.length > 0 ? this.tableAt(row, col) : null;
		const linked = this.links.size > 0 && this.links.has(row * 16_384 + col);
		if (!(table || linked)) {
			return this.looks[id] ?? PLAIN_LOOK;
		}
		const key = `${id}|${table?.key ?? ""}|${linked}`;
		let look = this.cache.get(key);
		if (!look) {
			const own = this.styles[id] ?? {};
			const style = table ? layered(table.style, own) : own;
			look = lookOf(linked ? { ...style, underline: true } : style);
			if (linked && !style.color && !style.fill) {
				look = {
					...look,
					cell: `${look.cell}; color: var(--primary)`,
					text: `${look.text}; color: var(--primary)`,
				};
			}
			this.cache.set(key, look);
		}
		return look;
	};
}
