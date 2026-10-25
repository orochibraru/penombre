import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	AlignVerticalJustifyCenterIcon,
	AlignVerticalJustifyEndIcon,
	AlignVerticalJustifyStartIcon,
	ArrowRightToLineIcon,
	BoldIcon,
	Grid2x2Icon,
	Grid2x2PlusIcon,
	Grid2x2XIcon,
	ItalicIcon,
	PanelBottomIcon,
	PanelLeftIcon,
	PanelLeftRightDashedIcon,
	PanelRightIcon,
	PanelTopBottomDashedIcon,
	PanelTopIcon,
	SquareIcon,
	StrikethroughIcon,
	TableCellsMergeIcon,
	TableCellsSplitIcon,
	UnderlineIcon,
	WrapTextIcon,
} from "@lucide/svelte";
import {
	firstFamily,
	FONT_FAMILIES,
	FONT_SIZES,
} from "#lib/editor/document-format.js";
import { m } from "#lib/paraglide/messages.js";
import { getLocale } from "#lib/paraglide/runtime.js";
import { formatValue } from "#lib/sheet/format.js";
import {
	CURRENCIES,
	currencyFormat,
	type PresetId,
	presets,
} from "#lib/sheet/number-formats.js";
import type { BorderEdge, CellStyle } from "#lib/sheet/styles.js";
import { MOD } from "./actions.js";
import {
	type BorderKind,
	merge,
	setBorders,
	setFormat,
	setStyle,
	toggle,
} from "./formatting.js";
import type { SheetState } from "./state.svelte.js";

/**
 * The Format commands as toolbar buttons, menu entries and dropdown
 * choices, one list for both places.
 */

export interface FormatTool {
	label: string;
	icon?: typeof BoldIcon;
	run: () => unknown;
	active?: () => boolean;
	shortcut?: string;
	/** A sample of what the choice does, `1,000.12`. */
	hint?: string;
	/** A font shown in its own face. */
	style?: string;
}

const current = (sheet: SheetState): CellStyle => {
	const { row, col } = sheet.selection.anchor;
	return sheet.styleAt(row, col);
};

export const markTools = (sheet: SheetState): FormatTool[] => [
	{
		label: m.editor_bold(),
		icon: BoldIcon,
		run: () => toggle(sheet, "bold"),
		active: () => Boolean(current(sheet).bold),
		shortcut: `${MOD}B`,
	},
	{
		label: m.editor_italic(),
		icon: ItalicIcon,
		run: () => toggle(sheet, "italic"),
		active: () => Boolean(current(sheet).italic),
		shortcut: `${MOD}I`,
	},
	{
		label: m.editor_underline(),
		icon: UnderlineIcon,
		run: () => toggle(sheet, "underline"),
		active: () => Boolean(current(sheet).underline),
		shortcut: `${MOD}U`,
	},
	{
		label: m.editor_strikethrough(),
		icon: StrikethroughIcon,
		run: () => toggle(sheet, "strike"),
		active: () => Boolean(current(sheet).strike),
		shortcut: "Alt+⇧5",
	},
];

export const alignTools = (sheet: SheetState): FormatTool[] =>
	(
		[
			["left", m.editor_align_left(), AlignLeftIcon, "L"],
			["center", m.editor_align_center(), AlignCenterIcon, "E"],
			["right", m.editor_align_right(), AlignRightIcon, "R"],
			["justify", m.editor_align_justify(), AlignJustifyIcon, ""],
		] as const
	).map(([align, label, icon, key]) => ({
		label,
		icon,
		run: () =>
			setStyle(sheet, {
				align: current(sheet).align === align ? undefined : align,
			}),
		active: () => current(sheet).align === align,
		shortcut: key ? `${MOD}⇧${key}` : undefined,
	}));

export const valignTools = (sheet: SheetState): FormatTool[] =>
	(
		[
			["top", m.sheet_valign_top(), AlignVerticalJustifyStartIcon],
			["middle", m.sheet_valign_middle(), AlignVerticalJustifyCenterIcon],
			["bottom", m.sheet_valign_bottom(), AlignVerticalJustifyEndIcon],
		] as const
	).map(([valign, label, icon]) => ({
		label,
		icon,
		run: () => setStyle(sheet, { valign }),
		active: () => current(sheet).valign === valign,
	}));

export const wrapTools = (sheet: SheetState): FormatTool[] => [
	{
		label: m.sheet_wrap_clip(),
		icon: ArrowRightToLineIcon,
		run: () => setStyle(sheet, { wrap: undefined }),
		active: () => !current(sheet).wrap,
	},
	{
		label: m.sheet_wrap_wrap(),
		icon: WrapTextIcon,
		run: () => setStyle(sheet, { wrap: true }),
		active: () => Boolean(current(sheet).wrap),
	},
];

export const mergeTools = (sheet: SheetState): FormatTool[] => [
	{
		label: m.sheet_merge_all(),
		icon: TableCellsMergeIcon,
		run: () => merge(sheet, "all"),
	},
	{
		label: m.sheet_merge_across(),
		icon: PanelLeftRightDashedIcon,
		run: () => merge(sheet, "across"),
	},
	{
		label: m.sheet_unmerge(),
		icon: TableCellsSplitIcon,
		run: () => merge(sheet, "none"),
	},
];

const BORDER_ICONS: Record<BorderKind, typeof BoldIcon> = {
	all: Grid2x2Icon,
	outer: SquareIcon,
	inner: Grid2x2PlusIcon,
	horizontal: PanelTopBottomDashedIcon,
	vertical: PanelLeftRightDashedIcon,
	top: PanelTopIcon,
	bottom: PanelBottomIcon,
	left: PanelLeftIcon,
	right: PanelRightIcon,
	none: Grid2x2XIcon,
};

export const borderLabel = (kind: BorderKind): string =>
	({
		all: m.sheet_border_all,
		outer: m.sheet_border_outer,
		inner: m.sheet_border_inner,
		horizontal: m.sheet_border_horizontal,
		vertical: m.sheet_border_vertical,
		top: m.sheet_border_top,
		bottom: m.sheet_border_bottom,
		left: m.sheet_border_left,
		right: m.sheet_border_right,
		none: m.sheet_border_none,
	})[kind]();

export const borderTools = (
	sheet: SheetState,
	line: () => BorderEdge,
): FormatTool[] =>
	(Object.keys(BORDER_ICONS) as BorderKind[]).map((kind) => ({
		label: borderLabel(kind),
		icon: BORDER_ICONS[kind],
		run: () => setBorders(sheet, kind, line()),
	}));

export const BORDER_LINES = [
	"thin",
	"medium",
	"thick",
	"dashed",
	"dotted",
] as const;

export const lineLabel = (style: (typeof BORDER_LINES)[number]): string =>
	({
		thin: m.sheet_border_thin,
		medium: m.sheet_border_medium,
		thick: m.sheet_border_thick,
		dashed: m.sheet_border_dashed,
		dotted: m.sheet_border_dotted,
	})[style]();

export const fontTools = (sheet: SheetState): FormatTool[] => [
	{
		label: m.doc_default(),
		run: () => setStyle(sheet, { font: undefined }),
		active: () => !current(sheet).font,
	},
	...FONT_FAMILIES.map((choice) => {
		const name = firstFamily(choice.value);
		return {
			label: choice.label,
			style: `font-family: ${choice.value}`,
			run: () => setStyle(sheet, { font: name }),
			active: () => current(sheet).font?.toLowerCase() === name.toLowerCase(),
		};
	}),
];

export const sizeTools = (sheet: SheetState): FormatTool[] => [
	{
		label: m.doc_default(),
		run: () => setStyle(sheet, { size: undefined }),
		active: () => !current(sheet).size,
	},
	...FONT_SIZES.map((size) => ({
		label: String(size),
		run: () => setStyle(sheet, { size }),
		active: () => current(sheet).size === size,
	})),
];

const PRESET_LABELS: Record<PresetId, () => string> = {
	automatic: m.sheet_format_automatic,
	plain: m.sheet_format_plain,
	number: m.sheet_format_number,
	thousands: m.sheet_format_thousands,
	currency: m.sheet_format_currency,
	accounting: m.sheet_format_accounting,
	percent: m.sheet_format_percent,
	scientific: m.sheet_format_scientific,
	date: m.sheet_format_date,
	time: m.sheet_format_time,
	datetime: m.sheet_format_datetime,
	duration: m.sheet_format_duration,
	text: m.sheet_format_text,
};

/** What each preset makes of a sample: a date, or 1,000.12. */
const SAMPLE: Partial<Record<PresetId, number>> = {
	date: 46_100.5625,
	time: 46_100.5625,
	datetime: 46_100.5625,
	duration: 1.5,
	percent: 0.1012,
};

export const numberTools = (sheet: SheetState): FormatTool[] =>
	presets(getLocale()).map(({ id, code }) => ({
		label: PRESET_LABELS[id](),
		hint: code ? formatValue(SAMPLE[id] ?? 1000.12, code).trim() : undefined,
		run: () => setFormat(sheet, code),
		active: () => current(sheet).format === code,
	}));

export const currencyTools = (sheet: SheetState): FormatTool[] =>
	Object.keys(CURRENCIES).map((code) => {
		const format = currencyFormat(code);
		return {
			label: code,
			hint: formatValue(1000.12, format),
			run: () => setFormat(sheet, format),
			active: () => current(sheet).format === format,
		};
	});
