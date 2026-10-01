import {
	ArrowDownToLineIcon,
	ArrowRightToLineIcon,
	ClipboardPasteIcon,
	CopyIcon,
	EraserIcon,
	PlusIcon,
	ScissorsIcon,
	Trash2Icon,
} from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { m } from "#lib/paraglide/messages.js";
import { copyText } from "#lib/utils.js";
import type { SheetState } from "./state.svelte.js";

/** One command, as both the menu bar and the right-click menu show it. */
export interface SheetAction {
	label: string;
	icon: typeof PlusIcon;
	run: () => unknown;
	shortcut?: string;
	destructive?: boolean;
}

/** How the platform spells the shortcut modifier. */
export const MOD =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent)
		? "⌘"
		: "Ctrl+";

/**
 * A paste from a menu has no clipboard event to read, and the clipboard API
 * needs a secure context and a permission; without them, say which keys do.
 */
async function pasteFromMenu(sheet: SheetState): Promise<void> {
	try {
		sheet.paste(await navigator.clipboard.readText());
	} catch {
		toast.info(m.sheet_paste_shortcut({ shortcut: `${MOD}V` }));
	}
}

export const clipboardActions = (sheet: SheetState): SheetAction[] => [
	{
		label: m.sheet_cut(),
		icon: ScissorsIcon,
		run: () => copyText(sheet.copy(true)),
		shortcut: `${MOD}X`,
	},
	{
		label: m.sheet_copy(),
		icon: CopyIcon,
		run: () => copyText(sheet.copy(false)),
		shortcut: `${MOD}C`,
	},
	{
		label: m.sheet_paste(),
		icon: ClipboardPasteIcon,
		run: () => pasteFromMenu(sheet),
		shortcut: `${MOD}V`,
	},
];

export const fillActions = (sheet: SheetState): SheetAction[] => [
	{
		label: m.sheet_fill_down(),
		icon: ArrowDownToLineIcon,
		run: () => sheet.fill("down"),
		shortcut: `${MOD}D`,
	},
	{
		label: m.sheet_fill_right(),
		icon: ArrowRightToLineIcon,
		run: () => sheet.fill("right"),
		shortcut: `${MOD}R`,
	},
	{
		label: m.sheet_clear(),
		icon: EraserIcon,
		run: () => sheet.clear(),
		shortcut: "⌫",
	},
];

export const insertActions = (sheet: SheetState): SheetAction[] => [
	{
		label: m.sheet_insert_row_above(),
		icon: PlusIcon,
		run: () => sheet.insertRows(false),
	},
	{
		label: m.sheet_insert_row_below(),
		icon: PlusIcon,
		run: () => sheet.insertRows(true),
	},
	{
		label: m.sheet_insert_column_left(),
		icon: PlusIcon,
		run: () => sheet.insertCols(false),
	},
	{
		label: m.sheet_insert_column_right(),
		icon: PlusIcon,
		run: () => sheet.insertCols(true),
	},
];

export const deleteActions = (sheet: SheetState): SheetAction[] => [
	{
		label: m.sheet_delete_row(),
		icon: Trash2Icon,
		run: () => sheet.deleteRows(),
		destructive: true,
	},
	{
		label: m.sheet_delete_column(),
		icon: Trash2Icon,
		run: () => sheet.deleteCols(),
		destructive: true,
	},
];
