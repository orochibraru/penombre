import { DEFAULT_COLOR_MAP } from "#lib/slides/color.js";
import type {
	Box,
	Deck,
	LevelStyle,
	Master,
	Slide,
	SlideElement,
} from "#lib/slides/model.js";
import { templateOfTheme } from "#lib/slides/templates/index.js";
import { mergeLevels } from "#lib/slides/text.js";
import {
	notesPartFor,
	placeholderType,
	slideRefs,
	textShapes,
} from "../pptx-package";
import {
	childNamed,
	childrenNamed,
	findElement,
	type XmlElement,
} from "../xml";
import { partText, type ZipEntry } from "../zip";
import { readLevels, readParagraph } from "./drawingml";
import {
	background,
	IDENTITY,
	inheritPlaceholder,
	type LayoutInfo,
	type MasterInfo,
	matchLayout,
	matchMaster,
	media,
	placeholderOf,
	readElements,
	readShape,
	type Scope,
	stylesFor,
} from "./elements";
import { REL, readTheme, relatedPart, relationships, rootOf } from "./parts";

/**
 * A `.pptx` read into the slide editor's model, keeping beside it the XML
 * each element came from so the writer can patch rather than regenerate.
 */

export { type LayoutInfo, matchLayout, type PlaceholderInfo } from "./elements";
export { REL, type Relationship, relationships, resolveTarget } from "./parts";

// =========================================================================
// Parts
// =========================================================================

function readMaster(
	entries: ZipEntry[],
	part: string,
	defaults: LevelStyle[],
): MasterInfo {
	const root = rootOf(entries, part);
	const theme = readTheme(entries, relatedPart(entries, part, REL.theme));
	const map = childNamed(root, "p:clrMap");
	const colorMap: Record<string, string> = { ...DEFAULT_COLOR_MAP };
	for (const [key, value] of Object.entries(map?.attrs ?? {})) {
		if (value) {
			colorMap[key] = value;
		}
	}
	const styles = findElement(root, "p:txStyles");
	const info: MasterInfo = {
		part,
		theme,
		placeholders: [],
		styles: {
			title: readLevels(styles && childNamed(styles, "p:titleStyle")),
			body: readLevels(styles && childNamed(styles, "p:bodyStyle")),
			other: readLevels(styles && childNamed(styles, "p:otherStyle")),
		},
		model: undefined as unknown as Master,
	};
	const rels = relationships(entries, part);
	const scope: Scope = {
		part,
		rels,
		theme,
		inherited: () => undefined,
		defaults,
	};
	const tree = findElement(root, "p:spTree");
	for (const node of tree ? childrenNamed(tree, "p:sp") : []) {
		const ph = placeholderOf(node);
		if (ph) {
			info.placeholders.push(
				inheritPlaceholder(
					node,
					undefined,
					stylesFor(ph.type ?? "body", info),
					media(scope),
				),
			);
		}
	}
	scope.inherited = (ph) => matchMaster(info, ph);
	const elements = tree ? readElements(tree, scope) : [];
	info.model = {
		part,
		theme: theme.theme,
		colorMap,
		background: background(root, scope) ?? {
			type: "solid",
			color: { scheme: "bg1" },
		},
		elements: elements.filter((element) => !element.placeholder),
		placeholders: elements
			.filter((element) => element.placeholder)
			.map(emptied),
		textLevels: mergeLevels(defaults, info.styles.other),
	};
	return info;
}

/** A layout's placeholder as a slide starts from it: styled, but empty. */
function emptied(element: SlideElement): SlideElement {
	const { origin: _origin, ...rest } = element;
	if (rest.kind !== "shape" || !rest.text) {
		return rest;
	}
	const { fontScale: _scale, lineReduction: _reduction, ...text } = rest.text;
	return { ...rest, text: { ...text, paragraphs: [{ runs: [] }] } };
}

export interface PackageModel {
	deck: Deck;
	/** The XML of every slide element, by origin. */
	nodes: Map<string, XmlElement>;
	/** How each group maps its children's coordinates, by origin. */
	groups: Map<string, (box: Box) => Box>;
	layouts: Map<string, LayoutInfo>;
	masters: Map<string, MasterInfo>;
	defaults: LevelStyle[];
}

function readLayout(
	entries: ZipEntry[],
	part: string,
	masters: Map<string, MasterInfo>,
	defaults: LevelStyle[],
): { info: LayoutInfo; model: Deck["layouts"][number] } | null {
	const masterPart = relatedPart(entries, part, REL.master);
	if (!masterPart || partText(entries, part) === null) {
		return null;
	}
	let master = masters.get(masterPart);
	if (!master) {
		master = readMaster(entries, masterPart, defaults);
		masters.set(masterPart, master);
	}
	const root = rootOf(entries, part);
	const scope: Scope = {
		part,
		rels: relationships(entries, part),
		theme: master.theme,
		inherited: () => undefined,
		defaults,
	};
	const info: LayoutInfo = { part, master, placeholders: [] };
	const tree = findElement(root, "p:spTree");
	for (const node of tree ? childrenNamed(tree, "p:sp") : []) {
		const ph = placeholderOf(node);
		if (ph) {
			const below = matchMaster(master, ph);
			info.placeholders.push(
				inheritPlaceholder(
					node,
					below,
					stylesFor(ph.type, master),
					media(scope),
				),
			);
		}
	}
	scope.inherited = (ph) => matchMaster(master, ph);
	const elements = tree ? readElements(tree, scope) : [];
	// A layout's placeholders resolve against the layout itself, not the master.
	scope.inherited = (ph) => matchLayout(info, ph);
	const placeholders = (tree ? childrenNamed(tree, "p:sp") : [])
		.filter((node) => placeholderOf(node))
		.map((node) => emptied(readShape(node, scope, IDENTITY)));
	return {
		info,
		model: {
			part,
			name: findElement(root, "p:cSld")?.attrs.name ?? "",
			type: root.attrs.type ?? "cust",
			master: masterPart,
			background: background(root, scope),
			showMaster:
				root.attrs.showMasterSp !== "0" && root.attrs.showMasterSp !== "false",
			elements: elements.filter((element) => !element.placeholder),
			placeholders,
		},
	};
}

function notesText(entries: ZipEntry[], part: string): string {
	const notes = notesPartFor(entries, part);
	if (!notes) {
		return "";
	}
	const tree = findElement(rootOf(entries, notes), "p:spTree");
	const body =
		tree && textShapes(tree).find((shape) => placeholderType(shape) === "body");
	const txBody = body && childNamed(body, "p:txBody");
	return txBody
		? childrenNamed(txBody, "a:p")
				.map((p) =>
					readParagraph(p)
						.runs.map((run) => run.text)
						.join(""),
				)
				.join("\n")
				.trim()
		: "";
}

function presentationDefaults(entries: ZipEntry[]): {
	width: number;
	height: number;
	defaults: LevelStyle[];
} {
	const root = rootOf(entries, "ppt/presentation.xml");
	const size = childNamed(root, "p:sldSz");
	return {
		width: Number(size?.attrs.cx ?? 12_192_000),
		height: Number(size?.attrs.cy ?? 6_858_000),
		defaults: readLevels(childNamed(root, "p:defaultTextStyle")),
	};
}

/** Every layout, whether or not a slide uses it, in master order. */
function layoutParts(entries: ZipEntry[]): string[] {
	const masters = [...relationships(entries, "ppt/presentation.xml").values()]
		.filter((relationship) => relationship.type === REL.master)
		.map((relationship) => relationship.target);
	return masters.flatMap((master) =>
		[...relationships(entries, master).values()]
			.filter((relationship) => relationship.type === REL.layout)
			.map((relationship) => relationship.target),
	);
}

export function readPackage(entries: ZipEntry[]): PackageModel {
	const { width, height, defaults } = presentationDefaults(entries);
	const masters = new Map<string, MasterInfo>();
	const layouts = new Map<string, LayoutInfo>();
	const layoutModels: Deck["layouts"] = [];
	for (const part of layoutParts(entries)) {
		const layout = readLayout(entries, part, masters, defaults);
		if (layout) {
			layouts.set(part, layout.info);
			layoutModels.push(layout.model);
		}
	}
	const nodes = new Map<string, XmlElement>();
	const groups = new Map<string, (box: Box) => Box>();
	const slides: Slide[] = slideRefs(entries).map((ref) => {
		const root = rootOf(entries, ref.part);
		const layoutPart = relatedPart(entries, ref.part, REL.layout) ?? "";
		const layout = layouts.get(layoutPart);
		const master = layout?.master ?? [...masters.values()][0];
		const scope: Scope = {
			part: ref.part,
			rels: relationships(entries, ref.part),
			theme: master?.theme ?? readTheme(entries, undefined),
			inherited: (ph) => matchLayout(layout, ph),
			defaults,
			nodes,
			groups,
		};
		const tree = findElement(root, "p:spTree");
		const slide: Slide = {
			id: ref.part,
			source: ref.part,
			layout: layoutPart,
			notes: notesText(entries, ref.part),
			elements: tree ? readElements(tree, scope) : [],
		};
		const fill = background(root, scope);
		if (fill) {
			slide.background = fill;
		}
		if (root.attrs.show === "0" || root.attrs.show === "false") {
			slide.hidden = true;
		}
		return slide;
	});
	const masterModels = [...masters.values()].map((master) => master.model);
	const template = templateOfTheme(masterModels[0]?.theme.name ?? "");
	return {
		deck: {
			width,
			height,
			template,
			masters: masterModels,
			layouts: layoutModels,
			slides,
		},
		nodes,
		groups,
		layouts,
		masters,
		defaults,
	};
}

export function readDeck(entries: ZipEntry[]): Deck {
	return readPackage(entries).deck;
}
