import type { Fill, LevelStyle, SlideElement } from "../model";
import {
	glyph,
	type LayoutKind,
	rule,
	scheme,
	shape,
	solid,
	stroke,
	type ThemeStyle,
} from "./build";

/**
 * The ten templates. Every face named here ships with Windows, macOS or
 * Office; where one is missing PowerPoint substitutes its own default and
 * the editor the stack in `text.ts`.
 *
 * Colours on shapes are theme references, so a deck recoloured by hand in
 * PowerPoint recolours its decoration too.
 */

const FEATURE = new Set<LayoutKind>(["title", "section", "closing"]);

const glow = (
	name: string,
	alpha: number,
	at: [number, number, number, number],
) =>
	shape("ellipse", at, {
		type: "gradient",
		radial: true,
		angle: 0,
		// Faded out well inside the shape, so the ellipse never shows an edge
		// whether a reader measures the gradient to its sides or its corners.
		stops: [
			{ pos: 0, color: scheme(name, alpha) },
			{ pos: 70_000, color: scheme(name, 0) },
			{ pos: 100_000, color: scheme(name, 0) },
		],
	});

const gradient = (angle: number, ...stops: [number, string][]): Fill => ({
	type: "gradient",
	angle,
	stops: stops.map(([pos, rgb]) => ({ pos, color: { rgb } })),
});

const quoteMark = (color: string, font: string, alpha = 0.3) =>
	glyph("“", [60, 30, 220, 220], {
		size: 220,
		font,
		color: scheme(color, alpha),
	} satisfies LevelStyle);

const midnight: ThemeStyle = {
	id: "midnight",
	name: "Midnight",
	dark: true,
	colors: {
		dk1: "0B1026",
		lt1: "FFFFFF",
		dk2: "1A1B45",
		lt2: "AEB3D6",
		accent1: "8B7CFF",
		accent2: "38D6F5",
		accent3: "F472B6",
		accent4: "FBBF24",
		accent5: "34D399",
		accent6: "60A5FA",
		hlink: "38D6F5",
		folHlink: "C4B5FD",
	},
	fonts: { heading: "Century Gothic", body: "Trebuchet MS" },
	background: {
		type: "gradient",
		angle: 45,
		stops: [
			{ pos: 0, color: scheme("bg1") },
			{ pos: 100_000, color: scheme("bg2") },
		],
	},
	title: { size: 36, align: "l", bold: true },
	body: { size: 20, bullet: "•", bulletColor: scheme("accent2") },
	quiet: scheme("tx2"),
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				glow("accent1", 0.55, [480, -300, 760, 760]),
				glow("accent2", 0.35, [-260, 280, 620, 620]),
				shape("rect", [80, 302, 64, 4], solid("accent2")),
			];
		}
		const mark =
			kind === "quote"
				? [quoteMark("accent2", "Century Gothic", 0.6)]
				: kind === "blank" || kind === "number"
					? []
					: [shape("rect", [60, 118, 48, 3], solid("accent2"))];
		return [glow("accent1", 0.35, [640, -260, 520, 520]), ...mark];
	},
};

const paper: ThemeStyle = {
	id: "paper",
	name: "Paper",
	dark: false,
	colors: {
		dk1: "1F1B16",
		lt1: "FBF8F3",
		dk2: "5A5045",
		lt2: "EFE7DA",
		accent1: "C8553D",
		accent2: "2D6A6A",
		accent3: "E0A458",
		accent4: "6B4E71",
		accent5: "8AA29E",
		accent6: "3E5C76",
		hlink: "2D6A6A",
		folHlink: "6B4E71",
	},
	fonts: { heading: "Georgia", body: "Gill Sans MT" },
	background: solid("bg1"),
	title: { size: 38, align: "l" },
	body: {
		size: 20,
		bullet: "–",
		bulletColor: scheme("accent1"),
		lineSpacing: 115,
	},
	quiet: scheme("tx2"),
	featureWidth: 600,
	decorate: (kind) => {
		const rules =
			kind === "blank"
				? []
				: [
						rule([60, 26, 900, 26], stroke("tx1", 0.75, 0.45)),
						rule([60, 514, 900, 514], stroke("tx1", 0.75, 0.45)),
					];
		if (FEATURE.has(kind)) {
			return [
				...rules,
				shape("ellipse", [690, 290, 420, 420], solid("accent1")),
				shape("ellipse", [640, 384, 128, 128], solid("accent2")),
				shape("ellipse", [860, 150, 36, 36], solid("accent3")),
				shape("rect", [80, 302, 40, 3], solid("accent1")),
			];
		}
		if (kind === "quote") {
			return [...rules, quoteMark("accent1", "Georgia", 0.35)];
		}
		return [...rules, shape("ellipse", [890, 20, 12, 12], solid("accent1"))];
	},
};

const bold: ThemeStyle = {
	id: "bold",
	name: "Bold",
	dark: false,
	colors: {
		dk1: "111111",
		lt1: "FFFFFF",
		dk2: "2B2B2B",
		lt2: "F2F2F2",
		accent1: "FF4D2E",
		accent2: "FFC700",
		accent3: "2E5BFF",
		accent4: "00B884",
		accent5: "8B5CF6",
		accent6: "111111",
		hlink: "2E5BFF",
		folHlink: "8B5CF6",
	},
	fonts: { heading: "Arial Black", body: "Arial" },
	background: solid("bg1"),
	title: { size: 36, align: "l", spacing: -30 },
	body: {
		size: 20,
		bullet: "■",
		bulletFont: "Arial",
		bulletColor: scheme("accent1"),
	},
	quiet: scheme("tx1", 0.62),
	feature: {
		background: solid("accent1"),
		title: scheme("bg1"),
		text: scheme("bg1", 0.85),
	},
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				shape("ellipse", [700, 320, 380, 380], solid("accent2")),
				shape("rect", [860, 44, 44, 44], solid("bg1")),
			];
		}
		if (kind === "quote") {
			return [quoteMark("accent1", "Arial Black", 1)];
		}
		return [
			shape("rect", [0, 0, 16, 540], solid("accent1")),
			...(kind === "blank"
				? []
				: [shape("rect", [900, 36, 20, 20], solid("accent2"))]),
		];
	},
};

const aurora: ThemeStyle = {
	id: "aurora",
	name: "Aurora",
	dark: true,
	colors: {
		dk1: "061A23",
		lt1: "F4FBFF",
		dk2: "0E2F3A",
		lt2: "A7C7D0",
		accent1: "5EEAD4",
		accent2: "C084FC",
		accent3: "38BDF8",
		accent4: "F9A8D4",
		accent5: "FDE68A",
		accent6: "86EFAC",
		hlink: "5EEAD4",
		folHlink: "C084FC",
	},
	fonts: { heading: "Trebuchet MS", body: "Trebuchet MS" },
	background: gradient(
		60,
		[0, "061A23"],
		[55_000, "0C3441"],
		[100_000, "2A1B4A"],
	),
	title: { size: 36, align: "ctr", bold: true },
	body: { size: 20, bullet: "•", bulletColor: scheme("accent1") },
	quiet: scheme("tx2"),
	decorate: (kind) => {
		const strong = FEATURE.has(kind) ? 1 : 0.6;
		return [
			glow("accent1", 0.5 * strong, [-200, -260, 680, 680]),
			glow("accent2", 0.45 * strong, [480, 200, 700, 700]),
			glow("accent3", 0.3 * strong, [680, -160, 360, 360]),
			...(kind === "quote" ? [quoteMark("accent1", "Trebuchet MS", 0.55)] : []),
		];
	},
};

const swiss: ThemeStyle = {
	id: "swiss",
	name: "Swiss",
	dark: false,
	colors: {
		dk1: "111111",
		lt1: "FFFFFF",
		dk2: "3D3D3D",
		lt2: "F1F1F1",
		accent1: "E30613",
		accent2: "111111",
		accent3: "8A8A8A",
		accent4: "0057B8",
		accent5: "FFB400",
		accent6: "00875A",
		hlink: "0057B8",
		folHlink: "3D3D3D",
	},
	fonts: { heading: "Arial", body: "Arial" },
	background: solid("bg1"),
	title: { size: 40, align: "l", bold: true, spacing: -50 },
	body: { size: 20, bullet: "—", bulletColor: scheme("accent1") },
	quiet: scheme("tx1", 0.55),
	featureWidth: 680,
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				shape("rect", [800, 60, 100, 100], solid("accent1")),
				rule([80, 470, 880, 470], stroke("tx1", 1)),
			];
		}
		if (kind === "quote") {
			return [quoteMark("accent1", "Arial", 1)];
		}
		return kind === "blank"
			? []
			: [
					shape("rect", [60, 22, 14, 14], solid("accent1")),
					rule([60, 120, 900, 120], stroke("tx1", 0.75, 0.25)),
				];
	},
};

const forest: ThemeStyle = {
	id: "forest",
	name: "Forest",
	dark: true,
	colors: {
		dk1: "0E2A21",
		lt1: "F3EBD8",
		dk2: "163A2E",
		lt2: "C9BFA5",
		accent1: "D4A24C",
		accent2: "8FBF8F",
		accent3: "E07A5F",
		accent4: "6FA8A3",
		accent5: "F2CC8F",
		accent6: "B5B682",
		hlink: "D4A24C",
		folHlink: "8FBF8F",
	},
	fonts: { heading: "Palatino Linotype", body: "Calibri" },
	background: solid("bg1"),
	title: { size: 40, align: "l" },
	body: {
		size: 20,
		bullet: "•",
		bulletColor: scheme("accent1"),
		lineSpacing: 110,
	},
	quiet: scheme("tx2"),
	decorate: (kind) => {
		const bands = [
			shape("parallelogram", [560, -20, 520, 580], solid("tx1", 0.04), {
				adj: { adj: 60_000 },
			}),
			shape("parallelogram", [720, -20, 300, 580], solid("tx1", 0.035), {
				adj: { adj: 100_000 },
			}),
		];
		if (FEATURE.has(kind)) {
			return [
				...bands,
				shape(
					"ellipse",
					[760, 70, 140, 140],
					{ type: "none" },
					{
						line: stroke("accent1", 1),
					},
				),
				shape("ellipse", [800, 110, 60, 60], solid("accent1", 0.9)),
				rule([80, 304, 200, 304], stroke("accent1", 1.5)),
			];
		}
		if (kind === "quote") {
			return [...bands, quoteMark("accent1", "Palatino Linotype")];
		}
		return kind === "blank"
			? bands
			: [...bands, rule([60, 120, 150, 120], stroke("accent1", 1.5))];
	},
};

const sunset: ThemeStyle = {
	id: "sunset",
	name: "Sunset",
	dark: false,
	colors: {
		dk1: "2B2240",
		lt1: "FFF8F1",
		dk2: "5B4E7E",
		lt2: "FFE3D3",
		accent1: "F25C54",
		accent2: "F7B267",
		accent3: "4A3F6B",
		accent4: "2A9D8F",
		accent5: "E76F51",
		accent6: "264653",
		hlink: "2A9D8F",
		folHlink: "4A3F6B",
	},
	fonts: { heading: "Rockwell", body: "Trebuchet MS" },
	background: gradient(90, [0, "FFF8F1"], [100_000, "FFE1D3"]),
	title: { size: 38, align: "l", bold: true },
	body: { size: 20, bullet: "•", bulletColor: scheme("accent1") },
	quiet: scheme("tx2"),
	featureWidth: 620,
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				shape("ellipse", [660, 250, 420, 420], solid("accent2", 0.9)),
				shape("ellipse", [760, 150, 230, 230], solid("accent1", 0.88)),
				shape("rect", [0, 520, 960, 20], solid("accent3")),
			];
		}
		if (kind === "quote") {
			return [quoteMark("accent1", "Rockwell")];
		}
		return kind === "blank"
			? []
			: [
					shape("ellipse", [870, 26, 52, 52], solid("accent2", 0.9)),
					shape("ellipse", [900, 16, 26, 26], solid("accent1", 0.9)),
				];
	},
};

/** A 48pt grid over the whole slide, drawn once on the master. */
function blueprintGrid(): SlideElement[] {
	const line = stroke("tx1", 0.5, 0.09);
	const lines: SlideElement[] = [];
	for (let x = 48; x < 960; x += 48) {
		lines.push(rule([x, 0, x, 540], line));
	}
	for (let y = 48; y < 540; y += 48) {
		lines.push(rule([0, y, 960, y], line));
	}
	return lines;
}

const blueprint: ThemeStyle = {
	id: "blueprint",
	name: "Blueprint",
	dark: true,
	colors: {
		dk1: "0A2F6B",
		lt1: "FFFFFF",
		dk2: "0D3A82",
		lt2: "B9D3FF",
		accent1: "FFD166",
		accent2: "7FDBFF",
		accent3: "FF8FAB",
		accent4: "9BE7A0",
		accent5: "FFFFFF",
		accent6: "5AA9FF",
		hlink: "FFD166",
		folHlink: "7FDBFF",
	},
	fonts: { heading: "Courier New", body: "Verdana" },
	background: solid("bg1"),
	title: { size: 32, align: "l", bold: true, caps: true, spacing: 100 },
	body: { size: 18, bullet: "›", bulletColor: scheme("accent1") },
	quiet: scheme("tx2"),
	master: blueprintGrid,
	decorate: (kind) => {
		const mark = stroke("accent1", 1.5);
		if (FEATURE.has(kind)) {
			return [
				rule([40, 40, 80, 40], mark),
				rule([40, 40, 40, 80], mark),
				rule([880, 500, 920, 500], mark),
				rule([920, 460, 920, 500], mark),
				shape(
					"rect",
					[720, 380, 180, 84],
					{ type: "none" },
					{
						line: stroke("accent2", 1),
					},
				),
				shape("rect", [80, 302, 72, 4], solid("accent1")),
			];
		}
		if (kind === "quote") {
			return [quoteMark("accent1", "Courier New", 0.8)];
		}
		return kind === "blank" || kind === "number"
			? []
			: [shape("rect", [60, 118, 72, 3], solid("accent1"))];
	},
};

const pastel: ThemeStyle = {
	id: "pastel",
	name: "Pastel",
	dark: false,
	colors: {
		dk1: "2E2A47",
		lt1: "F7F4FF",
		dk2: "4B4670",
		lt2: "ECE7FF",
		accent1: "7B61FF",
		accent2: "FF7AB6",
		accent3: "3CCB9C",
		accent4: "FFB86B",
		accent5: "5CC8FF",
		accent6: "B69CFF",
		hlink: "7B61FF",
		folHlink: "FF7AB6",
	},
	fonts: { heading: "Century Gothic", body: "Century Gothic" },
	background: solid("bg1"),
	title: { size: 36, align: "ctr", bold: true },
	body: { size: 20, bullet: "•", bulletColor: scheme("accent2") },
	quiet: scheme("tx2"),
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				shape("ellipse", [-120, -150, 380, 320], solid("accent2", 0.22)),
				shape("ellipse", [740, 360, 340, 300], solid("accent3", 0.22)),
				shape("ellipse", [800, -90, 220, 220], solid("accent4", 0.28)),
				shape("ellipse", [-60, 400, 240, 210], solid("accent5", 0.2)),
			];
		}
		return [
			shape("ellipse", [-150, -170, 320, 270], solid("accent2", 0.18)),
			shape("ellipse", [850, 440, 220, 190], solid("accent3", 0.2)),
			...(kind === "quote"
				? [quoteMark("accent1", "Century Gothic", 0.5)]
				: []),
		];
	},
};

const noir: ThemeStyle = {
	id: "noir",
	name: "Noir",
	dark: true,
	colors: {
		dk1: "0A0A0A",
		lt1: "F5F1E8",
		dk2: "1A1A1A",
		lt2: "A89F8C",
		accent1: "C9A227",
		accent2: "E8D5A3",
		accent3: "8C7853",
		accent4: "D9D9D9",
		accent5: "B08D57",
		accent6: "6E6E6E",
		hlink: "C9A227",
		folHlink: "E8D5A3",
	},
	fonts: { heading: "Georgia", body: "Arial" },
	background: solid("bg1"),
	title: { size: 40, align: "ctr", italic: true },
	body: { size: 20, bullet: "—", bulletColor: scheme("accent1") },
	quiet: scheme("tx2"),
	decorate: (kind) => {
		if (FEATURE.has(kind)) {
			return [
				shape(
					"rect",
					[30, 30, 900, 480],
					{ type: "none" },
					{
						line: stroke("accent1", 0.75),
					},
				),
				shape(
					"rect",
					[38, 38, 884, 464],
					{ type: "none" },
					{
						line: stroke("accent1", 0.25, 0.6),
					},
				),
				shape("diamond", [472, 112, 16, 16], solid("accent1")),
			];
		}
		if (kind === "quote") {
			return [quoteMark("accent1", "Georgia", 0.4)];
		}
		return kind === "blank" || kind === "number" || kind === "picture"
			? []
			: [rule([420, 122, 540, 122], stroke("accent1", 1))];
	},
};

export const THEMES: ThemeStyle[] = [
	midnight,
	paper,
	bold,
	aurora,
	swiss,
	forest,
	sunset,
	blueprint,
	pastel,
	noir,
];
