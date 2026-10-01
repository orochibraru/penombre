import type { Theme } from "#lib/slides/model.js";
import { NotAPresentationError, relsPartFor } from "../pptx-package";
import {
	childNamed,
	findElement,
	findElements,
	isElement,
	parseXml,
	type XmlElement,
} from "../xml";
import { partText, type ZipEntry } from "../zip";
import { colorChild, readColor } from "./drawingml";

/** Package plumbing: relationships between parts, and the theme a master uses. */

const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export const REL = {
	slide: `${R}/slide`,
	layout: `${R}/slideLayout`,
	master: `${R}/slideMaster`,
	theme: `${R}/theme`,
	image: `${R}/image`,
	hyperlink: `${R}/hyperlink`,
	notes: `${R}/notesSlide`,
	notesMaster: `${R}/notesMaster`,
};

export interface Relationship {
	id: string;
	type: string;
	/** A part name, resolved; or the raw target when external. */
	target: string;
	external: boolean;
}

/** A relationship target resolved against the folder of the part it is from. */
export function resolveTarget(part: string, target: string): string {
	if (target.startsWith("/")) {
		return target.slice(1);
	}
	const path = part.split("/").slice(0, -1);
	for (const segment of target.split("/")) {
		if (segment === "..") {
			path.pop();
		} else if (segment !== ".") {
			path.push(segment);
		}
	}
	return path.join("/");
}

export function relationships(
	entries: ZipEntry[],
	part: string,
): Map<string, Relationship> {
	const source = partText(entries, relsPartFor(part));
	const out = new Map<string, Relationship>();
	if (!source) {
		return out;
	}
	for (const node of findElements(parseXml(source).root, "Relationship")) {
		const id = node.attrs.Id;
		if (!id) {
			continue;
		}
		const external = node.attrs.TargetMode === "External";
		const target = node.attrs.Target ?? "";
		out.set(id, {
			id,
			type: node.attrs.Type ?? "",
			target: external ? target : resolveTarget(part, target),
			external,
		});
	}
	return out;
}

export function relatedPart(
	entries: ZipEntry[],
	part: string,
	type: string,
): string | undefined {
	for (const relationship of relationships(entries, part).values()) {
		if (relationship.type === type && !relationship.external) {
			return relationship.target;
		}
	}
	return undefined;
}

export function rootOf(entries: ZipEntry[], part: string): XmlElement {
	const source = partText(entries, part);
	if (source === null) {
		throw new NotAPresentationError(`Missing part ${part}`);
	}
	return parseXml(source).root;
}

// =========================================================================
// Theme
// =========================================================================

export interface ThemeInfo {
	theme: Theme;
	fills: XmlElement[];
	lines: XmlElement[];
	backgrounds: XmlElement[];
}

const FALLBACK_THEME: Theme = {
	name: "",
	colors: {
		dk1: "000000",
		lt1: "FFFFFF",
		dk2: "44546A",
		lt2: "E7E6E6",
		accent1: "4472C4",
		accent2: "ED7D31",
		accent3: "A5A5A5",
		accent4: "FFC000",
		accent5: "5B9BD5",
		accent6: "70AD47",
		hlink: "0563C1",
		folHlink: "954F72",
	},
	fonts: { heading: "Calibri", body: "Calibri" },
};

export function readTheme(
	entries: ZipEntry[],
	part: string | undefined,
): ThemeInfo {
	const empty = {
		theme: FALLBACK_THEME,
		fills: [],
		lines: [],
		backgrounds: [],
	};
	if (!part || partText(entries, part) === null) {
		return empty;
	}
	const root = rootOf(entries, part);
	const colors: Record<string, string> = { ...FALLBACK_THEME.colors };
	const scheme = findElement(root, "a:clrScheme");
	for (const child of scheme?.children ?? []) {
		if (isElement(child)) {
			const color = readColor(colorChild(child));
			if (color?.rgb) {
				colors[child.name.replace(/^a:/, "")] = color.rgb;
			}
		}
	}
	const face = (name: string) => {
		const font = findElement(root, name);
		return (font && childNamed(font, "a:latin")?.attrs.typeface) || "Calibri";
	};
	const list = (name: string) =>
		(findElement(root, name)?.children ?? []).filter(
			(child): child is XmlElement => isElement(child),
		);
	return {
		theme: {
			name: root.attrs.name ?? "",
			colors,
			fonts: { heading: face("a:majorFont"), body: face("a:minorFont") },
		},
		fills: list("a:fillStyleLst"),
		lines: list("a:lnStyleLst"),
		backgrounds: list("a:bgFillStyleLst"),
	};
}
