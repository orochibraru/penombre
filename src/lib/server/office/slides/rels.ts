import { createHash } from "node:crypto";
import { relsPartFor } from "../pptx-package";
import {
	childrenNamed,
	element,
	findElements,
	isElement,
	parseXml,
	serializeXml,
	type XmlDocument,
	type XmlElement,
} from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";
import { relationships, resolveTarget } from "./read";

/**
 * A part's relationships, edited in place, and the media parts pictures
 * point at.
 */

const EMPTY_RELS =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';

/** The path from one part's folder to another part. */
export function relativeTarget(from: string, to: string): string {
	const source = from.split("/").slice(0, -1);
	const target = to.split("/");
	let shared = 0;
	while (
		shared < source.length &&
		shared < target.length - 1 &&
		source[shared] === target[shared]
	) {
		shared++;
	}
	return [
		...Array(source.length - shared).fill(".."),
		...target.slice(shared),
	].join("/");
}

export class Rels {
	private readonly document: XmlDocument;

	constructor(
		private readonly entries: ZipEntry[],
		readonly part: string,
	) {
		this.document = parseXml(
			partText(entries, relsPartFor(part)) ?? EMPTY_RELS,
		);
	}

	private get nodes(): XmlElement[] {
		return childrenNamed(this.document.root, "Relationship");
	}

	private nextId(): string {
		let highest = 0;
		for (const node of this.nodes) {
			highest = Math.max(
				highest,
				Number(/^rId(\d+)$/.exec(node.attrs.Id ?? "")?.[1] ?? 0),
			);
		}
		return `rId${highest + 1}`;
	}

	targetOf(type: string): string | undefined {
		const node = this.nodes.find((candidate) => candidate.attrs.Type === type);
		return node ? resolveTarget(this.part, node.attrs.Target ?? "") : undefined;
	}

	/** The id of a relationship to `target`, added when there is none. */
	ensure(type: string, target: string, external = false): string {
		const written = external ? target : relativeTarget(this.part, target);
		const found = this.nodes.find(
			(node) =>
				node.attrs.Type === type &&
				(external
					? node.attrs.Target === target
					: resolveTarget(this.part, node.attrs.Target ?? "") === target),
		);
		if (found?.attrs.Id) {
			return found.attrs.Id;
		}
		const id = this.nextId();
		this.document.root.children.push(
			element("Relationship", {
				Id: id,
				Type: type,
				Target: written,
				TargetMode: external ? "External" : undefined,
			}),
		);
		return id;
	}

	/** Point the (single) relationship of a type somewhere else. */
	retarget(type: string, target: string): void {
		const node = this.nodes.find((candidate) => candidate.attrs.Type === type);
		if (node) {
			node.attrs.Target = relativeTarget(this.part, target);
		} else {
			this.ensure(type, target);
		}
	}

	/** Forget relationships of these types that `xml` no longer uses. */
	dropUnused(xml: string, types: Set<string>): void {
		const used = new Set(
			[...xml.matchAll(/\br:\w+="([^"]+)"/g)].map((match) => match[1]),
		);
		this.document.root.children = this.document.root.children.filter(
			(node) =>
				!isElement(node) ||
				!types.has(node.attrs.Type ?? "") ||
				used.has(node.attrs.Id ?? ""),
		);
	}

	save(): void {
		setPartText(
			this.entries,
			relsPartFor(this.part),
			serializeXml(this.document),
		);
	}
}

const RELATIONSHIP_ATTRIBUTES = [
	"r:embed",
	"r:id",
	"r:link",
	"r:pict",
	"r:dm",
	"r:lo",
	"r:qs",
	"r:cs",
];

/**
 * Rewrite a node's relationship ids from the part it was copied out of to
 * the part it now lives in, adding the relationships it needs there.
 */
export function remapRelationships(
	node: XmlElement,
	entries: ZipEntry[],
	from: string,
	to: Rels,
): void {
	const source = relationships(entries, from);
	const visit = (current: XmlElement) => {
		for (const name of RELATIONSHIP_ATTRIBUTES) {
			const id = current.attrs[name];
			const relationship = id ? source.get(id) : undefined;
			if (relationship) {
				current.attrs[name] = to.ensure(
					relationship.type,
					relationship.target,
					relationship.external,
				);
			}
		}
		for (const child of current.children) {
			if (isElement(child)) {
				visit(child);
			}
		}
	};
	visit(node);
}

// =========================================================================
// Media
// =========================================================================

const MIME_EXTENSION: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpeg",
	"image/jpg": "jpeg",
	"image/gif": "gif",
	"image/bmp": "bmp",
};

const hash = (data: Uint8Array) =>
	createHash("sha1").update(data).digest("hex");

/** Pictures as package parts: a data URL becomes one, the same bytes only once. */
export class MediaStore {
	private readonly known = new Map<string, string>();

	constructor(private readonly entries: ZipEntry[]) {
		for (const entry of entries) {
			if (entry.name.startsWith("ppt/media/")) {
				this.known.set(hash(entry.data), entry.name);
			}
		}
	}

	/** The part a picture's `src` lives in, or null when it cannot be stored. */
	part(src: string): string | null {
		if (!src.startsWith("data:")) {
			return this.entries.some((entry) => entry.name === src) ? src : null;
		}
		const match = /^data:([^;,]+);base64,(.*)$/s.exec(src);
		const extension = match?.[1]
			? MIME_EXTENSION[match[1].toLowerCase()]
			: undefined;
		if (!match || !extension) {
			return null;
		}
		const data = new Uint8Array(Buffer.from(match[2] ?? "", "base64"));
		const digest = hash(data);
		const existing = this.known.get(digest);
		if (existing) {
			return existing;
		}
		let n = 1;
		while (
			this.entries.some((entry) =>
				entry.name.startsWith(`ppt/media/image${n}.`),
			)
		) {
			n++;
		}
		const name = `ppt/media/image${n}.${extension}`;
		this.entries.push({ name, data, stored: true });
		this.known.set(digest, name);
		declareExtension(this.entries, extension, `image/${extension}`);
		return name;
	}
}

function declareExtension(
	entries: ZipEntry[],
	extension: string,
	contentType: string,
): void {
	const source = partText(entries, "[Content_Types].xml");
	if (!source) {
		return;
	}
	const document = parseXml(source);
	const declared = childrenNamed(document.root, "Default").some(
		(node) => node.attrs.Extension?.toLowerCase() === extension,
	);
	if (!declared) {
		document.root.children.unshift(
			element("Default", { Extension: extension, ContentType: contentType }),
		);
		setPartText(entries, "[Content_Types].xml", serializeXml(document));
	}
}

/** Drop media no relationship points at any more. */
export function pruneMedia(entries: ZipEntry[]): void {
	const targets = new Set<string>();
	for (const entry of entries) {
		const match = /^(.*)_rels\/([^/]+)\.rels$/.exec(entry.name);
		if (!match) {
			continue;
		}
		const owner = `${match[1]}${match[2]}`;
		for (const node of findElements(
			parseXml(new TextDecoder().decode(entry.data)).root,
			"Relationship",
		)) {
			if (node.attrs.TargetMode !== "External") {
				targets.add(resolveTarget(owner, node.attrs.Target ?? ""));
			}
		}
	}
	for (let index = entries.length - 1; index >= 0; index--) {
		const name = entries[index]?.name ?? "";
		if (name.startsWith("ppt/media/") && !targets.has(name)) {
			entries.splice(index, 1);
		}
	}
}
