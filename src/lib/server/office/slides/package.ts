import type { Fill, ShapeElement, SlideElement } from "#lib/slides/model.js";
import {
	type TemplateSpec,
	templateSpec,
} from "#lib/slides/templates/index.js";
import { declareContentType, relsPartFor, removePart } from "../pptx-package";
import { element, parseXml, serializeXml, type XmlElement } from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";
import { fillNode, levelsNode, shapeNode } from "./generate";
import { REL, type Relationship, relationships } from "./read";
import { Rels, relativeTarget } from "./rels";

/**
 * A new presentation from a template, and a template laid onto an existing
 * one. Masters, layouts and themes are generated from the same spec the
 * editor previews, so what the gallery shows is what the file says.
 */

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS =
	'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const CT = "application/vnd.openxmlformats-officedocument";
const TYPES = {
	master: `${CT}.presentationml.slideMaster+xml`,
	layout: `${CT}.presentationml.slideLayout+xml`,
	theme: `${CT}.theme+xml`,
	notesMaster: `${CT}.presentationml.notesMaster+xml`,
};
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
/** Master and layout ids share one space, which must start here. */
const FIRST_LAYOUT_ID = 2_147_483_649;

const FORMAT_SCHEME = `<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme>`;

const SCHEME_ORDER = [
	"dk1",
	"lt1",
	"dk2",
	"lt2",
	"accent1",
	"accent2",
	"accent3",
	"accent4",
	"accent5",
	"accent6",
	"hlink",
	"folHlink",
];

function themeXml(spec: Pick<TemplateSpec, "theme">): string {
	const { theme } = spec;
	const colors = SCHEME_ORDER.map(
		(name) =>
			`<a:${name}><a:srgbClr val="${theme.colors[name] ?? "000000"}"/></a:${name}>`,
	).join("");
	const font = (face: string) =>
		`<a:latin typeface="${face}"/><a:ea typeface=""/><a:cs typeface=""/>`;
	const name = theme.name.replace(/[<&"]/g, "");
	return `${PROLOG}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${name}"><a:themeElements><a:clrScheme name="${name}">${colors}</a:clrScheme><a:fontScheme name="${name}"><a:majorFont>${font(theme.fonts.heading)}</a:majorFont><a:minorFont>${font(theme.fonts.body)}</a:minorFont></a:fontScheme>${FORMAT_SCHEME}</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

const TREE_HEAD =
	'<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';

const PROMPTS: Record<string, string> = {
	title: "Click to add title",
	ctrTitle: "Click to add title",
	subTitle: "Click to add subtitle",
	pic: "",
};

/** Placeholders carry prompt text in a layout; the editor shows its own. */
function withPrompt(shape: ShapeElement): ShapeElement {
	const prompt = PROMPTS[shape.placeholder?.type ?? ""] ?? "Click to add text";
	if (!shape.text || prompt === "") {
		return shape;
	}
	return {
		...shape,
		text: { ...shape.text, paragraphs: [{ runs: [{ text: prompt }] }] },
	};
}

function spTree(
	decorations: SlideElement[],
	placeholders: ShapeElement[],
	withLevels: boolean,
): string {
	const embed = () => null;
	const nodes = [
		...decorations.map((decoration) =>
			decoration.kind === "shape"
				? shapeNode(decoration, { box: decoration, embed })
				: null,
		),
		...placeholders.map((shape) =>
			shapeNode(withPrompt(shape), {
				box: shape,
				embed,
				levels: withLevels ? shape.text?.levels : undefined,
			}),
		),
	].filter((node): node is XmlElement => node !== null);
	return `<p:spTree>${TREE_HEAD}${nodes.map((node) => serializeXml({ prolog: [], root: node })).join("")}</p:spTree>`;
}

function backgroundXml(fill: Fill | undefined): string {
	if (!fill) {
		return "";
	}
	const node = element("p:bg", {}, [
		element("p:bgPr", {}, [fillNode(fill, () => null), element("a:effectLst")]),
	]);
	return serializeXml({ prolog: [], root: node });
}

function masterXml(spec: TemplateSpec, layoutIds: string[]): string {
	const map = Object.entries({
		...spec.colorMap,
		...Object.fromEntries(SCHEME_ORDER.slice(4).map((n) => [n, n])),
	})
		.map(([key, value]) => `${key}="${value}"`)
		.join(" ");
	const styles = [
		levelsNode(spec.titleLevels, "p:titleStyle"),
		levelsNode(spec.bodyLevels, "p:bodyStyle"),
		levelsNode(spec.otherLevels, "p:otherStyle"),
	]
		.map((node) => serializeXml({ prolog: [], root: node }))
		.join("");
	const ids = layoutIds
		.map(
			(id, index) =>
				`<p:sldLayoutId id="${FIRST_LAYOUT_ID + index}" r:id="${id}"/>`,
		)
		.join("");
	return `${PROLOG}<p:sldMaster ${NS}><p:cSld>${backgroundXml(spec.background)}${spTree(spec.elements, spec.masterPlaceholders, false)}</p:cSld><p:clrMap ${map}/><p:sldLayoutIdLst>${ids}</p:sldLayoutIdLst><p:txStyles>${styles}</p:txStyles></p:sldMaster>`;
}

function layoutXml(layout: TemplateSpec["layouts"][number]): string {
	const kind =
		layout.type === "cust" ? ' userDrawn="1"' : ` type="${layout.type}"`;
	return `${PROLOG}<p:sldLayout ${NS}${kind} preserve="1"><p:cSld name="${layout.name}">${backgroundXml(layout.background)}${spTree(layout.elements, layout.placeholders, true)}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

const NOTES_MASTER = `${PROLOG}<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${TREE_HEAD}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>Click to add notes</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle><a:lvl1pPr marL="0" algn="l" rtl="0"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`;

function freePart(entries: ZipEntry[], stem: string): string {
	let n = 1;
	while (entries.some((entry) => entry.name === `${stem}${n}.xml`)) {
		n++;
	}
	return `${stem}${n}.xml`;
}

function relsXml(from: string, targets: [string, string][]): string {
	const nodes = targets
		.map(
			([type, target], index) =>
				`<Relationship Id="rId${index + 1}" Type="${type}" Target="${relativeTarget(from, target)}"/>`,
		)
		.join("");
	return `${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${nodes}</Relationships>`;
}

/** The template's theme, master and layouts written into the package. */
function writeTemplateParts(
	entries: ZipEntry[],
	spec: TemplateSpec,
): { master: string; theme: string } {
	const theme = freePart(entries, "ppt/theme/theme");
	setPartText(entries, theme, themeXml(spec));
	declareContentType(entries, theme, TYPES.theme);
	const master = freePart(entries, "ppt/slideMasters/slideMaster");
	const layouts = spec.layouts.map((layout) => {
		setPartText(entries, layout.part, layoutXml(layout));
		setPartText(
			entries,
			relsPartFor(layout.part),
			relsXml(layout.part, [[REL.master, master]]),
		);
		declareContentType(entries, layout.part, TYPES.layout);
		return layout.part;
	});
	setPartText(
		entries,
		relsPartFor(master),
		relsXml(master, [
			...layouts.map((part): [string, string] => [REL.layout, part]),
			[REL.theme, theme],
		]),
	);
	setPartText(
		entries,
		master,
		masterXml(
			spec,
			layouts.map((_part, index) => `rId${index + 1}`),
		),
	);
	declareContentType(entries, master, TYPES.master);
	return { master, theme };
}

// =========================================================================
// A new presentation
// =========================================================================

const CONTENT_TYPES = `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/></Types>`;

const escape = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function presentationXml(spec: TemplateSpec): string {
	const defaults = serializeXml({
		prolog: [],
		root: levelsNode(spec.otherLevels, "p:defaultTextStyle"),
	});
	return `${PROLOG}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst/><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>${defaults}</p:presentation>`;
}

/** Every part a presentation needs before its first slide. */
export function skeleton(spec: TemplateSpec, title: string): ZipEntry[] {
	const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
	const entries: ZipEntry[] = [];
	const put = (name: string, value: string, type?: string) => {
		setPartText(entries, name, value);
		if (type) {
			declareContentType(entries, name, type);
		}
	};
	put("[Content_Types].xml", CONTENT_TYPES);
	put(
		"_rels/.rels",
		`${PROLOG}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`,
	);
	put(
		"docProps/app.xml",
		`${PROLOG}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Penombre</Application><PresentationFormat>Widescreen</PresentationFormat></Properties>`,
		`${CT}.extended-properties+xml`,
	);
	put(
		"docProps/core.xml",
		`${PROLOG}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escape(title)}</dc:title><dc:creator>Penombre</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
		"application/vnd.openxmlformats-package.core-properties+xml",
	);
	put(
		"ppt/presentation.xml",
		presentationXml(spec),
		`${CT}.presentationml.presentation.main+xml`,
	);
	put(
		"ppt/presProps.xml",
		`${PROLOG}<p:presentationPr ${NS}/>`,
		`${CT}.presentationml.presProps+xml`,
	);
	put(
		"ppt/viewProps.xml",
		`${PROLOG}<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`,
		`${CT}.presentationml.viewProps+xml`,
	);
	put(
		"ppt/tableStyles.xml",
		`${PROLOG}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`,
		`${CT}.presentationml.tableStyles+xml`,
	);
	const { master, theme } = writeTemplateParts(entries, spec);
	// The notes master needs a theme of its own.
	const notesTheme = freePart(entries, "ppt/theme/theme");
	put(notesTheme, themeXml(spec), TYPES.theme);
	const notesMaster = "ppt/notesMasters/notesMaster1.xml";
	put(notesMaster, NOTES_MASTER, TYPES.notesMaster);
	put(
		relsPartFor(notesMaster),
		relsXml(notesMaster, [[REL.theme, notesTheme]]),
	);
	put(
		"ppt/_rels/presentation.xml.rels",
		relsXml("ppt/presentation.xml", [
			[REL.master, master],
			[REL.notesMaster, notesMaster],
			[`${R}/presProps`, "ppt/presProps.xml"],
			[`${R}/viewProps`, "ppt/viewProps.xml"],
			[REL.theme, theme],
			[`${R}/tableStyles`, "ppt/tableStyles.xml"],
		]),
	);
	return entries;
}

// =========================================================================
// Switching an existing deck's template
// =========================================================================

/** Themes a notes or handout master uses, which must outlive the swap. */
function keptThemes(
	entries: ZipEntry[],
	presentation: Map<string, Relationship>,
): Set<string> {
	return new Set(
		[...presentation.values()]
			.filter(
				(relationship) =>
					relationship.type === REL.notesMaster ||
					relationship.type.endsWith("/handoutMaster"),
			)
			.flatMap((relationship) => [
				...relationships(entries, relationship.target).values(),
			])
			.filter((relationship) => relationship.type === REL.theme)
			.map((relationship) => relationship.target),
	);
}

/**
 * Replace every slide master, its layouts and its theme with the
 * template's. Slides are pointed at their new layouts by the caller, which
 * knows which layout each one should take.
 */
export function installTemplate(entries: ZipEntry[], id: string): void {
	const spec = templateSpec(id);
	if (!spec) {
		return;
	}
	const presentation = "ppt/presentation.xml";
	const before = relationships(entries, presentation);
	const kept = keptThemes(entries, before);
	const masters = [...before.values()].filter(
		(relationship) => relationship.type === REL.master,
	);
	for (const master of masters) {
		for (const relationship of relationships(entries, master.target).values()) {
			const theme =
				relationship.type === REL.theme && !kept.has(relationship.target);
			if (relationship.type === REL.layout || theme) {
				removePart(entries, relationship.target);
			}
		}
		removePart(entries, master.target);
	}
	const { master, theme } = writeTemplateParts(entries, spec);

	const document = parseXml(
		partText(entries, "ppt/_rels/presentation.xml.rels") ?? "",
	);
	const oldIds = new Set(masters.map((relationship) => relationship.id));
	document.root.children = document.root.children.filter(
		(child) => child.type !== "element" || !oldIds.has(child.attrs.Id ?? ""),
	);
	setPartText(
		entries,
		"ppt/_rels/presentation.xml.rels",
		serializeXml(document),
	);
	const rels = new Rels(entries, presentation);
	rels.retarget(REL.theme, theme);
	const masterId = rels.ensure(REL.master, master);
	rels.save();

	const root = parseXml(partText(entries, presentation) ?? "");
	const list = root.root.children.find(
		(child): child is XmlElement =>
			child.type === "element" && child.name === "p:sldMasterIdLst",
	);
	if (list) {
		list.children = [
			element("p:sldMasterId", { id: "2147483648", "r:id": masterId }),
		];
	}
	setPartText(entries, presentation, serializeXml(root));
}
