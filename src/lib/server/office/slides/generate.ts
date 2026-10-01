import { isLine } from "#lib/slides/geometry.js";
import type {
	Box,
	Bullet,
	Color,
	Fill,
	Geometry,
	GroupElement,
	LevelStyle,
	Line,
	Paragraph,
	ParagraphStyle,
	PathDef,
	Run,
	RunStyle,
	ShapeElement,
	TextBody,
} from "#lib/slides/model.js";
import {
	element,
	isElement,
	text,
	type XmlElement,
	type XmlNode,
} from "../xml";

/**
 * The model written as DrawingML and PresentationML. Child order follows
 * the schema's sequences exactly: PowerPoint reads an out-of-order child as
 * a corrupt file and offers to repair it.
 */

const round = (value: number) => String(Math.round(value));

function colorNode(color: Color): XmlElement {
	const children = (color.mods ?? []).map(([name, value]) =>
		element(`a:${name}`, { val: round(value) }),
	);
	return color.scheme
		? element("a:schemeClr", { val: color.scheme }, children)
		: element(
				"a:srgbClr",
				{ val: (color.rgb ?? "000000").toUpperCase() },
				children,
			);
}

/** A fill. `embed` gives the relationship id for an image fill's source. */
export function fillNode(
	fill: Fill,
	embed: (src: string) => string | null,
): XmlElement {
	switch (fill.type) {
		case "none":
			return element("a:noFill");
		case "solid":
			return element("a:solidFill", {}, [colorNode(fill.color)]);
		case "image": {
			const id = embed(fill.src);
			return id
				? element("a:blipFill", { dpi: "0", rotWithShape: "1" }, [
						element("a:blip", { "r:embed": id }),
						element("a:srcRect"),
						element("a:stretch", {}, [element("a:fillRect")]),
					])
				: element("a:noFill");
		}
		default: {
			const stops = element(
				"a:gsLst",
				{},
				fill.stops.map((stop) =>
					element("a:gs", { pos: round(stop.pos) }, [colorNode(stop.color)]),
				),
			);
			const shade = fill.radial
				? element("a:path", { path: "circle" }, [
						element("a:fillToRect", {
							l: "50000",
							t: "50000",
							r: "50000",
							b: "50000",
						}),
					])
				: element("a:lin", { ang: round(fill.angle * 60_000), scaled: "0" });
			return element("a:gradFill", { rotWithShape: "1" }, [stops, shade]);
		}
	}
}

export function lineNode(line: Line): XmlElement {
	const children: XmlNode[] = [
		fillNode(
			line.fill.type === "image" ? { type: "none" } : line.fill,
			() => null,
		),
	];
	if (line.dash) {
		children.push(element("a:prstDash", { val: line.dash }));
	}
	children.push(element("a:round"));
	if (line.head) {
		children.push(element("a:headEnd", { type: line.head }));
	}
	if (line.tail) {
		children.push(element("a:tailEnd", { type: line.tail }));
	}
	return element("a:ln", { w: round(line.width), cap: line.cap }, children);
}

export function xfrmNode(box: Box, name = "a:xfrm", group = false): XmlElement {
	const attrs: Record<string, string | undefined> = {};
	if (box.rot) {
		attrs.rot = round((((box.rot % 360) + 360) % 360) * 60_000);
	}
	if (box.flipH) {
		attrs.flipH = "1";
	}
	if (box.flipV) {
		attrs.flipV = "1";
	}
	const off = element("a:off", { x: round(box.x), y: round(box.y) });
	const ext = element("a:ext", {
		cx: round(Math.max(0, box.w)),
		cy: round(Math.max(0, box.h)),
	});
	const children = group
		? [
				off,
				ext,
				element("a:chOff", { ...off.attrs }),
				element("a:chExt", { ...ext.attrs }),
			]
		: [off, ext];
	return element(name, attrs, children);
}

function pathNode(path: PathDef): XmlElement {
	const pt = (v: number[], at: number) =>
		element("a:pt", { x: round(v[at] ?? 0), y: round(v[at + 1] ?? 0) });
	const commands = path.commands.map((command) => {
		const v = command.v;
		switch (command.op) {
			case "M":
				return element("a:moveTo", {}, [pt(v, 0)]);
			case "L":
				return element("a:lnTo", {}, [pt(v, 0)]);
			case "C":
				return element("a:cubicBezTo", {}, [pt(v, 0), pt(v, 2), pt(v, 4)]);
			case "Q":
				return element("a:quadBezTo", {}, [pt(v, 0), pt(v, 2)]);
			case "A":
				return element("a:arcTo", {
					wR: round(v[0] ?? 0),
					hR: round(v[1] ?? 0),
					stAng: round((v[2] ?? 0) * 60_000),
					swAng: round((v[3] ?? 0) * 60_000),
				});
			default:
				return element("a:close");
		}
	});
	return element(
		"a:path",
		{
			w: round(path.w),
			h: round(path.h),
			fill: path.fill === false ? "none" : undefined,
			stroke: path.stroke === false ? "0" : undefined,
		},
		commands,
	);
}

export function geometryNode(geometry: Geometry): XmlElement {
	if ("paths" in geometry) {
		return element("a:custGeom", {}, [
			element("a:avLst"),
			element("a:gdLst"),
			element("a:ahLst"),
			element("a:cxnLst"),
			element("a:rect", { l: "l", t: "t", r: "r", b: "b" }),
			element("a:pathLst", {}, geometry.paths.map(pathNode)),
		]);
	}
	const guides = Object.entries(geometry.adj ?? {}).map(([name, value]) =>
		element("a:gd", { name, fmla: `val ${round(value)}` }),
	);
	return element("a:prstGeom", { prst: geometry.preset }, [
		element("a:avLst", {}, guides),
	]);
}

// =========================================================================
// Text
// =========================================================================

const flag = (value: boolean | undefined) =>
	value === undefined ? undefined : value ? "1" : "0";

function runPropsNode(style: RunStyle, name = "a:rPr"): XmlElement {
	const attrs: Record<string, string | undefined> = {
		lang: name === "a:defRPr" ? undefined : "en-US",
		sz: style.size === undefined ? undefined : round(style.size * 100),
		b: flag(style.bold),
		i: flag(style.italic),
		u:
			style.underline === undefined
				? undefined
				: style.underline
					? "sng"
					: "none",
		strike:
			style.strike === undefined
				? undefined
				: style.strike
					? "sngStrike"
					: "noStrike",
		cap: style.caps,
		spc: style.spacing === undefined ? undefined : round(style.spacing),
		baseline:
			style.baseline === undefined ? undefined : round(style.baseline * 1000),
		dirty: name === "a:rPr" ? "0" : undefined,
	};
	const children: XmlElement[] = [];
	if (style.color) {
		children.push(element("a:solidFill", {}, [colorNode(style.color)]));
	}
	if (style.font) {
		children.push(element("a:latin", { typeface: style.font }));
	}
	return element(name, attrs, children);
}

function bulletNodes(bullet: Bullet | undefined): XmlElement[] {
	if (!bullet) {
		return [];
	}
	if (bullet.type === "none") {
		return [element("a:buNone")];
	}
	if (bullet.type === "number") {
		return [
			element("a:buAutoNum", {
				type: bullet.scheme,
				startAt:
					bullet.start && bullet.start !== 1 ? String(bullet.start) : undefined,
			}),
		];
	}
	const out: XmlElement[] = [];
	if (bullet.color) {
		out.push(element("a:buClr", {}, [colorNode(bullet.color)]));
	}
	if (bullet.font) {
		out.push(element("a:buFont", { typeface: bullet.font }));
	}
	out.push(element("a:buChar", { char: bullet.char }));
	return out;
}

/** `a:pPr` or a list style's `a:lvlNpPr`; null when there is nothing to say. */
function paragraphPropsNode(
	style: ParagraphStyle & RunStyle,
	name = "a:pPr",
	level?: number,
): XmlElement | null {
	const children: XmlElement[] = [];
	if (style.lineSpacing !== undefined) {
		children.push(
			element("a:lnSpc", {}, [
				element("a:spcPct", { val: round(style.lineSpacing * 1000) }),
			]),
		);
	}
	if (style.spaceBefore !== undefined) {
		children.push(
			element("a:spcBef", {}, [
				element("a:spcPts", { val: round(style.spaceBefore * 100) }),
			]),
		);
	}
	if (style.spaceAfter !== undefined) {
		children.push(
			element("a:spcAft", {}, [
				element("a:spcPts", { val: round(style.spaceAfter * 100) }),
			]),
		);
	}
	children.push(...bulletNodes(style.bullet));
	const {
		align,
		marL,
		indent,
		lineSpacing: _l,
		spaceBefore: _b,
		spaceAfter: _a,
		bullet: _u,
		...run
	} = style;
	if (
		name !== "a:pPr" &&
		Object.values(run).some((value) => value !== undefined)
	) {
		children.push(runPropsNode(run, "a:defRPr"));
	}
	const attrs = {
		marL: marL === undefined ? undefined : round(marL),
		lvl: level ? String(level) : undefined,
		indent: indent === undefined ? undefined : round(indent),
		algn: align,
	};
	if (
		children.length === 0 &&
		Object.values(attrs).every((value) => value === undefined)
	) {
		return null;
	}
	return element(name, attrs, children);
}

function runStyleOf(run: Run): RunStyle {
	const { text: _text, field: _field, ...style } = run;
	return style;
}

export function paragraphNode(paragraph: Paragraph): XmlElement {
	const { runs, level, endSize, ...style } = paragraph;
	const children: XmlNode[] = [];
	const properties = paragraphPropsNode(style, "a:pPr", level);
	if (properties) {
		children.push(properties);
	}
	for (const run of runs) {
		const props = runPropsNode(runStyleOf(run));
		if (run.field) {
			children.push(
				element(
					"a:fld",
					{ id: run.field.id, type: run.field.type || undefined },
					[props, element("a:t", {}, [text(run.text)])],
				),
			);
			continue;
		}
		run.text.split("\n").forEach((piece, index) => {
			if (index > 0) {
				children.push(element("a:br", {}, [runPropsNode(runStyleOf(run))]));
			}
			if (piece !== "") {
				children.push(
					element("a:r", {}, [
						runPropsNode(runStyleOf(run)),
						element("a:t", {}, [text(piece)]),
					]),
				);
			}
		});
	}
	const last = runs.at(-1);
	children.push(
		runPropsNode(
			{
				size: endSize ?? last?.size,
				bold: last?.bold,
				italic: last?.italic,
				color: last?.color,
				font: last?.font,
			},
			"a:endParaRPr",
		),
	);
	return element("a:p", {}, children);
}

export const DEFAULT_INSET = [91_440, 45_720, 91_440, 45_720];
const INSET_NAMES = ["lIns", "tIns", "rIns", "bIns"] as const;

/** Only what differs from `inherited` is written, so the layout still governs the rest. */
export function bodyPrNode(body: TextBody, inherited?: TextBody): XmlElement {
	const base = inherited ?? {
		anchor: "t",
		inset: DEFAULT_INSET,
		wrap: true,
		autofit: "none",
	};
	const attrs: Record<string, string | undefined> = {
		wrap: body.wrap === base.wrap ? undefined : body.wrap ? "square" : "none",
		rtlCol: inherited ? undefined : "0",
		anchor: body.anchor === base.anchor ? undefined : body.anchor,
	};
	INSET_NAMES.forEach((name, index) => {
		const value = body.inset[index] ?? 0;
		if (value !== (base.inset[index] ?? 0)) {
			attrs[name] = round(value);
		}
	});
	const children: XmlElement[] = [];
	if (body.autofit === "shrink") {
		children.push(
			element("a:normAutofit", {
				fontScale:
					body.fontScale && body.fontScale < 1
						? round(body.fontScale * 100_000)
						: undefined,
				lnSpcReduction: body.lineReduction
					? round(body.lineReduction * 100_000)
					: undefined,
			}),
		);
	} else if (body.autofit === "resize") {
		children.push(element("a:spAutoFit"));
	} else if (base.autofit !== "none") {
		children.push(element("a:noAutofit"));
	}
	return element("a:bodyPr", attrs, children);
}

/** A list style for a master's or layout's placeholder. */
export function levelsNode(
	levels: LevelStyle[],
	name = "a:lstStyle",
): XmlElement {
	const children = levels
		.map((level, index) => paragraphPropsNode(level, `a:lvl${index + 1}pPr`))
		.filter((node): node is XmlElement => node !== null);
	return element(name, {}, children);
}

export function txBodyNode(
	body: TextBody,
	inherited?: TextBody,
	levels: LevelStyle[] = [],
): XmlElement {
	return element("p:txBody", {}, [
		bodyPrNode(body, inherited),
		levelsNode(levels),
		...body.paragraphs.map(paragraphNode),
	]);
}

// =========================================================================
// Shapes
// =========================================================================

export interface ShapeOptions {
	/** The box in the coordinates the parent writes its children in. */
	box: Box;
	/** Omit the transform: a placeholder where its layout put it. */
	inheritBox?: boolean;
	inheritFill?: boolean;
	inheritLine?: boolean;
	inheritedText?: TextBody;
	/** A layout or master placeholder's own list style. */
	levels?: LevelStyle[];
	embed: (src: string) => string | null;
}

function nvProps(
	shape: { id: string; name?: string; descr?: string },
	kind: string,
): XmlElement {
	return element("p:cNvPr", {
		id: shape.id,
		name: shape.name ?? `${kind} ${shape.id}`,
		descr: shape.descr,
	});
}

function phNode(
	shape: ShapeElement | { placeholder?: { type?: string; idx?: string } },
): XmlElement[] {
	return shape.placeholder
		? [
				element("p:ph", {
					type: shape.placeholder.type,
					idx: shape.placeholder.idx,
				}),
			]
		: [];
}

export function shapeNode(
	shape: ShapeElement,
	options: ShapeOptions,
): XmlElement {
	const connector = isLine(shape.geometry) && !shape.text && !shape.placeholder;
	const spPr: XmlElement[] = [];
	if (!options.inheritBox) {
		spPr.push(xfrmNode(options.box));
	}
	if (
		!shape.placeholder ||
		!("preset" in shape.geometry) ||
		shape.geometry.preset !== "rect"
	) {
		spPr.push(geometryNode(shape.geometry));
	}
	if (!options.inheritFill) {
		spPr.push(fillNode(shape.fill, options.embed));
	}
	if (!options.inheritLine) {
		spPr.push(lineNode(shape.line));
	}
	if (connector) {
		return element("p:cxnSp", {}, [
			element("p:nvCxnSpPr", {}, [
				nvProps(shape, "Connector"),
				element("p:cNvCxnSpPr"),
				element("p:nvPr"),
			]),
			element("p:spPr", {}, spPr),
		]);
	}
	const locks = shape.placeholder ? [element("a:spLocks", { noGrp: "1" })] : [];
	const textBox =
		!shape.placeholder &&
		shape.text &&
		shape.fill.type === "none" &&
		shape.line.fill.type === "none";
	const children: XmlElement[] = [
		element("p:nvSpPr", {}, [
			nvProps(
				shape,
				shape.placeholder ? "Placeholder" : textBox ? "TextBox" : "Shape",
			),
			element("p:cNvSpPr", { txBox: textBox ? "1" : undefined }, locks),
			element("p:nvPr", {}, phNode(shape)),
		]),
		element("p:spPr", {}, spPr),
	];
	if (shape.text) {
		children.push(
			txBodyNode(shape.text, options.inheritedText, options.levels),
		);
	}
	return element("p:sp", {}, children);
}

export function pictureNode(
	picture: {
		id: string;
		name?: string;
		descr?: string;
		placeholder?: { type?: string; idx?: string };
		crop?: { l: number; t: number; r: number; b: number };
		geometry?: Geometry;
		line?: Line;
	},
	box: Box,
	embed: string,
): XmlElement {
	const crop = picture.crop;
	const spPr: XmlElement[] = [
		xfrmNode(box),
		geometryNode(picture.geometry ?? { preset: "rect" }),
	];
	if (picture.line) {
		spPr.push(lineNode(picture.line));
	}
	return element("p:pic", {}, [
		element("p:nvPicPr", {}, [
			nvProps(picture, "Picture"),
			element("p:cNvPicPr", {}, [
				element("a:picLocks", { noChangeAspect: "1" }),
			]),
			element("p:nvPr", {}, phNode(picture)),
		]),
		element("p:blipFill", {}, [
			element("a:blip", { "r:embed": embed }),
			...(crop
				? [
						element("a:srcRect", {
							l: round(crop.l),
							t: round(crop.t),
							r: round(crop.r),
							b: round(crop.b),
						}),
					]
				: []),
			element("a:stretch", {}, [element("a:fillRect")]),
		]),
		element("p:spPr", {}, spPr),
	]);
}

export function groupNode(
	group: GroupElement,
	box: Box,
	children: XmlElement[],
): XmlElement {
	return element("p:grpSp", {}, [
		element("p:nvGrpSpPr", {}, [
			nvProps(group, "Group"),
			element("p:cNvGrpSpPr"),
			element("p:nvPr"),
		]),
		element("p:grpSpPr", {}, [xfrmNode(box, "a:xfrm", true)]),
		...children,
	]);
}

/** The first child element whose name is in `names`. */
export function firstChild(
	parent: XmlElement,
	names: Set<string>,
): XmlElement | undefined {
	return parent.children.find(
		(child): child is XmlElement => isElement(child) && names.has(child.name),
	);
}
