import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BetweenHorizontalEndIcon,
	BetweenHorizontalStartIcon,
	BetweenVerticalEndIcon,
	BetweenVerticalStartIcon,
	BoldIcon,
	CodeIcon,
	CodeXmlIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	ItalicIcon,
	ListChecksIcon,
	ListIcon,
	ListIndentDecreaseIcon,
	ListIndentIncreaseIcon,
	ListOrderedIcon,
	MinusIcon,
	PanelTopIcon,
	PilcrowIcon,
	QuoteIcon,
	Redo2Icon,
	RemoveFormattingIcon,
	StrikethroughIcon,
	SubscriptIcon,
	SuperscriptIcon,
	TableCellsMergeIcon,
	TableCellsSplitIcon,
	TableColumnsSplitIcon,
	TableIcon,
	TableRowsSplitIcon,
	Trash2Icon,
	UnderlineIcon,
	Undo2Icon,
} from "@lucide/svelte";
import {
	blockValue,
	type DocumentEditor,
	hasHeaderRow,
	markValue,
} from "#lib/editor/document-extension.js";
import {
	FONT_FAMILIES,
	FONT_SIZES,
	firstFamily,
	LINE_HEIGHTS,
} from "#lib/editor/document-format.js";
import { m } from "#lib/paraglide/messages.js";

/** One command, as a toolbar button, a menu entry or a dropdown choice. */
export interface Tool {
	label: string;
	icon?: typeof BoldIcon;
	run: () => unknown;
	active?: () => boolean;
	disabled?: () => boolean;
	/** A ProseMirror binding, `Mod-b`. */
	shortcut?: string;
	/** For a dropdown choice that previews itself: a font in its own face. */
	style?: string;
}

type Commands = DocumentEditor["commands"];

const history = (commands: Commands): Tool[] => [
	{
		label: m.editor_undo(),
		icon: Undo2Icon,
		run: () => commands.undo(),
		shortcut: "Mod-z",
	},
	{
		label: m.editor_redo(),
		icon: Redo2Icon,
		run: () => commands.redo(),
		shortcut: "Mod-Shift-z",
	},
];

const marks = (editor: DocumentEditor): Tool[] => [
	{
		label: m.editor_bold(),
		icon: BoldIcon,
		run: () => editor.commands.toggleBold(),
		active: () => editor.marks.bold.isActive(),
		shortcut: "Mod-b",
	},
	{
		label: m.editor_italic(),
		icon: ItalicIcon,
		run: () => editor.commands.toggleItalic(),
		active: () => editor.marks.italic.isActive(),
		shortcut: "Mod-i",
	},
	{
		label: m.editor_underline(),
		icon: UnderlineIcon,
		run: () => editor.commands.toggleUnderline(),
		active: () => editor.marks.underline.isActive(),
		shortcut: "Mod-u",
	},
	{
		label: m.editor_strikethrough(),
		icon: StrikethroughIcon,
		run: () => editor.commands.toggleStrike(),
		active: () => editor.marks.strike.isActive(),
		shortcut: "Mod-Shift-s",
	},
];

const scripts = (editor: DocumentEditor): Tool[] => [
	{
		label: m.editor_inline_code(),
		icon: CodeIcon,
		run: () => editor.commands.toggleCode(),
		active: () => editor.marks.code.isActive(),
		shortcut: "Mod-e",
	},
	{
		label: m.doc_superscript(),
		icon: SuperscriptIcon,
		run: () => editor.commands.toggleSuperscript(),
		active: () => editor.marks.superscript.isActive(),
		shortcut: "Mod-.",
	},
	{
		label: m.doc_subscript(),
		icon: SubscriptIcon,
		run: () => editor.commands.toggleSubscript(),
		active: () => editor.marks.subscript.isActive(),
		shortcut: "Mod-,",
	},
];

function alignments(editor: DocumentEditor): Tool[] {
	const alignedAs = (value: string) =>
		(editor.state.selection.$from.parent.attrs.textAlign ?? "left") === value;
	return (
		[
			["left", m.editor_align_left(), AlignLeftIcon, "Mod-Shift-l"],
			["center", m.editor_align_center(), AlignCenterIcon, "Mod-Shift-e"],
			["right", m.editor_align_right(), AlignRightIcon, "Mod-Shift-r"],
			["justify", m.editor_align_justify(), AlignJustifyIcon, "Mod-Shift-j"],
		] as const
	).map(([value, label, icon, shortcut]) => ({
		label,
		icon,
		run: () => editor.commands.setTextAlign(value === "left" ? null : value),
		active: () => alignedAs(value),
		shortcut,
	}));
}

const lists = (editor: DocumentEditor): Tool[] =>
	(
		[
			["bullet", m.editor_bullet_list(), ListIcon],
			["ordered", m.editor_numbered_list(), ListOrderedIcon],
			["task", m.editor_task_list(), ListChecksIcon],
		] as const
	).map(([kind, label, icon]) => ({
		label,
		icon,
		run: () => editor.commands.toggleList({ kind }),
		active: () => editor.nodes.list.isActive({ kind }),
	}));

const indents = (editor: DocumentEditor): Tool[] => [
	{
		label: m.doc_outdent(),
		icon: ListIndentDecreaseIcon,
		run: () => editor.commands.shiftIndent(-1),
		shortcut: "Mod-[",
	},
	{
		label: m.doc_indent(),
		icon: ListIndentIncreaseIcon,
		run: () => editor.commands.shiftIndent(1),
		shortcut: "Mod-]",
	},
];

const blocks = (editor: DocumentEditor, insertTable: () => void): Tool[] => [
	{
		label: m.editor_quote(),
		icon: QuoteIcon,
		run: () => editor.commands.toggleBlockquote(),
		active: () => editor.nodes.blockquote.isActive(),
		shortcut: "Mod-Shift-b",
	},
	{
		label: m.editor_code_block(),
		icon: CodeXmlIcon,
		run: () => editor.commands.toggleCodeBlock(),
		active: () => editor.nodes.codeBlock.isActive(),
	},
	{
		label: m.editor_divider(),
		icon: MinusIcon,
		run: () => editor.commands.insertHorizontalRule(),
	},
	{ label: m.editor_table(), icon: TableIcon, run: insertTable },
];

function table(editor: DocumentEditor): Tool[] {
	const { commands } = editor;
	const tool = (
		label: string,
		icon: typeof BoldIcon,
		run: () => unknown,
	): Tool => ({ label, icon, run });
	return [
		tool(m.editor_row_above(), BetweenHorizontalStartIcon, () =>
			commands.addTableRowAbove(),
		),
		tool(m.editor_row_below(), BetweenHorizontalEndIcon, () =>
			commands.addTableRowBelow(),
		),
		tool(m.editor_column_before(), BetweenVerticalStartIcon, () =>
			commands.addTableColumnBefore(),
		),
		tool(m.editor_column_after(), BetweenVerticalEndIcon, () =>
			commands.addTableColumnAfter(),
		),
		tool(m.editor_delete_row(), TableRowsSplitIcon, () =>
			commands.deleteTableRow(),
		),
		tool(m.editor_delete_column(), TableColumnsSplitIcon, () =>
			commands.deleteTableColumn(),
		),
		{
			...tool(m.doc_merge_cells(), TableCellsMergeIcon, () =>
				commands.mergeTableCells(),
			),
			disabled: () => !commands.mergeTableCells.canExec(),
		},
		{
			...tool(m.doc_split_cell(), TableCellsSplitIcon, () =>
				commands.splitTableCell(),
			),
			disabled: () => !commands.splitTableCell.canExec(),
		},
		{
			...tool(m.doc_header_row(), PanelTopIcon, () =>
				commands.toggleHeaderRow(),
			),
			active: () => hasHeaderRow(editor.state),
		},
		tool(m.editor_delete_table(), Trash2Icon, () => commands.deleteTable()),
	];
}

const styles = (editor: DocumentEditor): Tool[] => [
	{
		label: m.editor_normal_text(),
		icon: PilcrowIcon,
		run: () => editor.commands.setParagraph(),
		active: () => editor.nodes.paragraph.isActive(),
		shortcut: "Mod-Alt-0",
	},
	...([Heading1Icon, Heading2Icon, Heading3Icon] as const).map(
		(icon, index): Tool => ({
			label: m.editor_heading({ level: String(index + 1) }),
			icon,
			run: () => editor.commands.setHeading({ level: index + 1 }),
			active: () => editor.nodes.heading.isActive({ level: index + 1 }),
			shortcut: `Mod-Alt-${index + 1}`,
			style: `font-size: ${1.5 - index * 0.2}em; font-weight: 600;`,
		}),
	),
];

/** Valued marks and attributes: the choices, then "default" to clear them. */
function valued(
	current: string | null,
	choices: { label: string; value: string; style?: string }[],
	set: (value: string | null) => unknown,
): Tool[] {
	return [
		{
			label: m.doc_default(),
			run: () => set(null),
			active: () => current === null,
		},
		...choices.map(({ label, value, style }) => ({
			label,
			style,
			run: () => set(value),
			active: () => current === value,
		})),
	];
}

function formats(editor: DocumentEditor) {
	const { state, commands } = editor;
	const font = markValue(state, "fontFamily", "family");
	const same = FONT_FAMILIES.find(
		(choice) =>
			font !== null && firstFamily(choice.value) === firstFamily(font),
	);
	const spacing = (value: string) =>
		value === "1"
			? m.doc_line_single()
			: value === "2"
				? m.doc_line_double()
				: value;
	return {
		fonts: valued(
			same?.value ?? font,
			FONT_FAMILIES.map((choice) => ({
				...choice,
				style: `font-family: ${choice.value};`,
			})),
			(value) =>
				commands.setMark("fontFamily", value ? { family: value } : null),
		),
		sizes: valued(
			markValue(state, "fontSize", "size"),
			FONT_SIZES.map((size) => ({ label: String(size), value: `${size}pt` })),
			(value) => commands.setMark("fontSize", value ? { size: value } : null),
		),
		spacing: valued(
			blockValue(state, "lineHeight"),
			LINE_HEIGHTS.map((value) => ({ label: spacing(value), value })),
			(value) => commands.setLineHeight(value),
		),
	};
}

/** Every tool, rebuilt on each transaction so `active` is read again. */
export function documentTools(editor: DocumentEditor, insertTable: () => void) {
	return {
		...formats(editor),
		styles: styles(editor),
		history: history(editor.commands),
		marks: marks(editor),
		scripts: scripts(editor),
		alignments: alignments(editor),
		lists: lists(editor),
		indents: indents(editor),
		blocks: blocks(editor, insertTable),
		table: table(editor),
		clear: {
			label: m.doc_clear_formatting(),
			icon: RemoveFormattingIcon,
			run: () => editor.commands.clearFormatting(),
			shortcut: "Mod-\\",
		} satisfies Tool,
	};
}
