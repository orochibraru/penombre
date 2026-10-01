import { templateSpec } from "#lib/slides/templates/index.js";
import { relsPartFor } from "../pptx-package";
import { findElements, parseXml } from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";
import { skeleton } from "./package";
import { resolveTarget } from "./read";

const read = (entries: ZipEntry[], name: string) =>
	parseXml(partText(entries, name) ?? "<none/>").root;

function typeProblems(entries: ZipEntry[]): string[] {
	const problems: string[] = [];
	const names = new Set(entries.map((entry) => entry.name));
	if (entries[0]?.name !== "[Content_Types].xml") {
		problems.push("[Content_Types].xml is not the first entry");
	}
	const types = read(entries, "[Content_Types].xml");
	const defaults = new Set(
		findElements(types, "Default").map((node) =>
			node.attrs.Extension?.toLowerCase(),
		),
	);
	const overrides = new Set(
		findElements(types, "Override").map((node) => node.attrs.PartName),
	);
	for (const name of names) {
		const typed =
			overrides.has(`/${name}`) ||
			defaults.has(name.split(".").pop()?.toLowerCase());
		if (!typed && name !== "[Content_Types].xml") {
			problems.push(`${name} has no content type`);
		}
	}
	for (const override of overrides) {
		if (override && !names.has(override.slice(1))) {
			problems.push(`content type for missing ${override}`);
		}
	}
	return problems;
}

function relationshipProblems(entries: ZipEntry[], rels: string): string[] {
	const problems: string[] = [];
	const names = new Set(entries.map((entry) => entry.name));
	const match = /^(.*)_rels\/([^/]+)\.rels$/.exec(rels);
	const owner = `${match?.[1] ?? ""}${match?.[2] ?? ""}`;
	const ids = new Set<string>();
	for (const node of findElements(read(entries, rels), "Relationship")) {
		if (ids.has(node.attrs.Id ?? "")) {
			problems.push(`${rels} repeats ${node.attrs.Id}`);
		}
		ids.add(node.attrs.Id ?? "");
		const target = resolveTarget(owner, node.attrs.Target ?? "");
		if (node.attrs.TargetMode !== "External" && !names.has(target)) {
			problems.push(`${rels} ${node.attrs.Id} points at missing ${target}`);
		}
	}
	if (owner.endsWith(".xml") && names.has(owner)) {
		for (const used of (partText(entries, owner) ?? "").matchAll(
			/r:(?:embed|id|link)="([^"]+)"/g,
		)) {
			if (!ids.has(used[1] ?? "")) {
				problems.push(
					`${owner} uses ${used[1]}, which ${relsPartFor(owner)} lacks`,
				);
			}
		}
	}
	return problems;
}

function idProblems(entries: ZipEntry[]): string[] {
	const problems: string[] = [];
	const presentation = read(entries, "ppt/presentation.xml");
	const slideIds = findElements(presentation, "p:sldId").map(
		(node) => node.attrs.id,
	);
	if (new Set(slideIds).size !== slideIds.length) {
		problems.push("slide ids repeat");
	}
	const masterIds = [
		...findElements(presentation, "p:sldMasterId").map((node) => node.attrs.id),
		...entries
			.filter((entry) => entry.name.startsWith("ppt/slideMasters/slideMaster"))
			.flatMap((entry) =>
				findElements(read(entries, entry.name), "p:sldLayoutId"),
			)
			.map((node) => node.attrs.id),
	];
	if (
		new Set(masterIds).size !== masterIds.length ||
		masterIds.some((id) => Number(id) < 2_147_483_648)
	) {
		problems.push("master and layout ids repeat or are too small");
	}
	for (const entry of entries.filter((candidate) =>
		/^ppt\/slides\/slide\d+\.xml$/.test(candidate.name),
	)) {
		const ids = findElements(read(entries, entry.name), "p:cNvPr").map(
			(node) => node.attrs.id,
		);
		if (new Set(ids).size !== ids.length) {
			problems.push(`${entry.name} repeats a shape id`);
		}
	}
	return problems;
}

/**
 * What PowerPoint checks before it offers to repair a file, checked here:
 * every part typed, every relationship landing, every id unique.
 */
export function packageProblems(entries: ZipEntry[]): string[] {
	return [
		...typeProblems(entries),
		...entries
			.filter((entry) => entry.name.endsWith(".rels"))
			.flatMap((entry) => relationshipProblems(entries, entry.name)),
		...idProblems(entries),
	];
}

/**
 * A package on the Swiss template whose first slide is `body` (the shape
 * tree's children) with `rels` (Relationship elements) beside it.
 */
export function deckWith(
	body: string,
	rels = "",
	extra: Record<string, Uint8Array> = {},
): ZipEntry[] {
	const spec = templateSpec("swiss");
	if (!spec) {
		throw new Error("no template");
	}
	const entries = skeleton(spec, "Fixture");
	const slide = "ppt/slides/slide1.xml";
	setPartText(
		entries,
		slide,
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${body}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,
	);
	setPartText(
		entries,
		relsPartFor(slide),
		`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout3.xml"/>${rels}</Relationships>`,
	);
	const types = partText(entries, "[Content_Types].xml") ?? "";
	setPartText(
		entries,
		"[Content_Types].xml",
		types.replace(
			"</Types>",
			'<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>',
		),
	);
	const presentation = partText(entries, "ppt/presentation.xml") ?? "";
	setPartText(
		entries,
		"ppt/presentation.xml",
		presentation.replace(
			"<p:sldIdLst/>",
			'<p:sldIdLst><p:sldId id="256" r:id="rId99"/></p:sldIdLst>',
		),
	);
	const presentationRels =
		partText(entries, "ppt/_rels/presentation.xml.rels") ?? "";
	setPartText(
		entries,
		"ppt/_rels/presentation.xml.rels",
		presentationRels.replace(
			"</Relationships>",
			'<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>',
		),
	);
	for (const [name, data] of Object.entries(extra)) {
		entries.push({ name, data, stored: false });
	}
	return entries;
}

/** One pixel of PNG. */
export const PIXEL = new Uint8Array(
	Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
		"base64",
	),
);

export const PIXEL_URL = `data:image/png;base64,${Buffer.from(PIXEL).toString("base64")}`;

export const sp = (id: number, extra = "", spPr = "", text = "") =>
	`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="100" y="200"/><a:ext cx="3000" cy="4000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${spPr}</p:spPr>${extra}${text ? `<p:txBody><a:bodyPr/><a:lstStyle/>${text}</p:txBody>` : ""}</p:sp>`;
