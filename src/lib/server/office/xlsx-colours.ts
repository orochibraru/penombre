import { findElements, isElement, parseXml, type XmlElement } from "./xml";
import { partText, type ZipEntry } from "./zip";

/**
 * SpreadsheetML colours as `#RRGGBB`: rgb, the legacy indexed palette (or
 * the file's own), and theme slots with Excel's tint.
 */

/** A workbook part's path from its relationship type, `xl/` relative. */
export function relatedPart(entries: ZipEntry[], type: string): string | null {
	const rels = partText(entries, "xl/_rels/workbook.xml.rels");
	if (!rels) {
		return null;
	}
	const target = findElements(parseXml(rels).root, "Relationship").find((r) =>
		r.attrs.Type?.endsWith(`/${type}`),
	)?.attrs.Target;
	return target
		? `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}`
		: null;
}

const INDEXED = (
	"000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF " +
	"000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF " +
	"800000 008000 000080 808000 800080 008080 C0C0C0 808080 " +
	"9999FF 993366 FFFFCC CCFFFF 660066 FF8080 0066CC CCCCFF " +
	"000080 FF00FF FFFF00 00FFFF 800080 800000 008080 0000FF " +
	"00CCFF CCFFFF CCFFCC FFFF99 99CCFF FF99CC CC99FF FFCC99 " +
	"3366FF 33CCCC 99CC00 FFCC00 FF9900 FF6600 666699 969696 " +
	"003366 339966 003300 333300 993300 993366 333399 333333"
).split(" ");

/** Theme slots in SpreadsheetML's order: light 1 first, then dark 1. */
const THEME_SLOTS =
	"lt1 dk1 lt2 dk2 accent1 accent2 accent3 accent4 accent5 accent6 hlink folHlink".split(
		" ",
	);

export interface Palette {
	theme: string[];
	indexed: string[];
}

const localName = (name: string) => name.slice(name.indexOf(":") + 1);

function findLocal(parent: XmlElement, name: string): XmlElement | undefined {
	for (const child of parent.children) {
		if (!isElement(child)) {
			continue;
		}
		if (localName(child.name) === name) {
			return child;
		}
		const found = findLocal(child, name);
		if (found) {
			return found;
		}
	}
	return undefined;
}

/** The theme's colours and the indexed palette `styles` may override. */
export function readPalette(
	entries: ZipEntry[],
	styles: XmlElement | null,
): Palette {
	const theme: string[] = [];
	const source = partText(
		entries,
		relatedPart(entries, "theme") ?? "xl/theme/theme1.xml",
	);
	const scheme = source ? findLocal(parseXml(source).root, "clrScheme") : null;
	if (scheme) {
		for (const slot of THEME_SLOTS) {
			const holder = findLocal(scheme, slot);
			const value = holder?.children.find(isElement);
			const hex = value?.attrs.lastClr ?? value?.attrs.val ?? "";
			theme.push(/^[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : "");
		}
	}
	const custom = styles
		? findElements(styles, "rgbColor").map((c) => (c.attrs.rgb ?? "").slice(-6))
		: [];
	return { theme, indexed: custom.length > 0 ? custom : INDEXED };
}

function hexToHsl(hex: string): [number, number, number] {
	const [r, g, b] = [0, 2, 4].map(
		(at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255,
	) as [number, number, number];
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) {
		return [0, 0, l];
	}
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) {
		h = (g - b) / d + (g < b ? 6 : 0);
	} else if (max === g) {
		h = (b - r) / d + 2;
	} else {
		h = (r - g) / d + 4;
	}
	return [h / 6, s, l];
}

function hslToHex([h, s, l]: [number, number, number]): string {
	const channel = (t: number) => {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		let x = t;
		if (x < 0) {
			x += 1;
		}
		if (x > 1) {
			x -= 1;
		}
		if (x < 1 / 6) {
			return p + (q - p) * 6 * x;
		}
		if (x < 1 / 2) {
			return q;
		}
		return x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p;
	};
	const rgb =
		s === 0 ? [l, l, l] : [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
	return rgb
		.map((v) =>
			Math.round(v * 255)
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")
		.toUpperCase();
}

/** Excel's tint: towards white when positive, towards black when negative. */
export function tint(hex: string, amount: number): string {
	if (!amount) {
		return hex;
	}
	const [h, s, l] = hexToHsl(hex);
	const lightness = amount < 0 ? l * (1 + amount) : l * (1 - amount) + amount;
	return hslToHex([h, s, lightness]);
}

/** A `<color>`-like element as `#RRGGBB`, or undefined for automatic. */
export function colourOf(
	node: XmlElement | undefined,
	palette: Palette,
): string | undefined {
	if (!node || node.attrs.auto === "1" || node.attrs.auto === "true") {
		return undefined;
	}
	let hex: string | undefined;
	if (node.attrs.rgb) {
		hex = node.attrs.rgb.slice(-6);
	} else if (node.attrs.theme !== undefined) {
		hex = palette.theme[Number(node.attrs.theme)];
	} else if (node.attrs.indexed !== undefined) {
		hex = palette.indexed[Number(node.attrs.indexed)];
	}
	if (!(hex && /^[0-9A-Fa-f]{6}$/.test(hex))) {
		return undefined;
	}
	return `#${tint(hex.toUpperCase(), Number(node.attrs.tint ?? 0))}`;
}
