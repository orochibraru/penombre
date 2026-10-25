import type { SheetPicture } from "#lib/sheet/layout.js";

import {
	first,
	kid,
	kids,
	local,
	openRels,
	relTarget,
} from "./xlsx-charts/package";
import {
	ANCHORS,
	geometry,
	readAnchor,
	sheetDrawingPart,
} from "./xlsx-charts/read";
import { parseXml, type XmlElement } from "./xml";
import { partText, type ZipEntry } from "./zip";

/**
 * The pictures in a worksheet's drawing (`xdr:pic`), for the editor to show
 * where the file puts them. Google Sheets exports every chart this way, as a
 * PNG. They travel as data URIs in what the editor opens and never in what
 * it saves, so the save leaves the drawing's pictures exactly as they were.
 */

const TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	bmp: "image/bmp",
	svg: "image/svg+xml",
};

/** Past this a picture is left out rather than inlined into the page. */
const MAX_BYTES = 8 * 1024 * 1024;

function pictureOf(
	entries: ZipEntry[],
	anchor: XmlElement,
	where: {
		drawing: string;
		rels: ReturnType<typeof openRels>;
		sizes: ReturnType<typeof geometry>;
	},
): SheetPicture | null {
	const pic = kid(anchor, "pic");
	const blip = first(kid(pic, "blipFill"), "blip");
	const embed = blip
		? Object.entries(blip.attrs).find(([key]) => key.endsWith(":embed"))?.[1]
		: undefined;
	const part = relTarget(where.rels, where.drawing, embed);
	const type = TYPES[part?.split(".").pop()?.toLowerCase() ?? ""];
	const data = entries.find((entry) => entry.name === part)?.data;
	if (!(pic && part && type && data) || data.byteLength > MAX_BYTES) {
		return null;
	}
	const props = first(kid(pic, "nvPicPr"), "cNvPr");
	const name = props?.attrs.descr || props?.attrs.title || props?.attrs.name;
	return {
		id: `${where.drawing}#${props?.attrs.id ?? part}`,
		...(name ? { name } : {}),
		anchor: readAnchor(anchor, where.sizes),
		src: `data:${type};base64,${Buffer.from(data).toString("base64")}`,
	};
}

/** Every picture on a worksheet that a browser can draw. */
export function readSheetPictures(
	entries: ZipEntry[],
	sheetPath: string,
): SheetPicture[] {
	try {
		const found = sheetDrawingPart(entries, sheetPath);
		if (!found) {
			return [];
		}
		const doc = parseXml(partText(entries, found.part) ?? "");
		const where = {
			drawing: found.part,
			rels: openRels(entries, found.part),
			sizes: geometry(found.sheet.root),
		};
		const pictures: SheetPicture[] = [];
		const visit = (holder: XmlElement) => {
			for (const child of kids(holder)) {
				if (local(child) === "AlternateContent") {
					const choice = kid(child, "Choice");
					if (choice) {
						visit(choice);
					}
				} else if (ANCHORS.has(local(child))) {
					const picture = pictureOf(entries, child, where);
					if (picture) {
						pictures.push(picture);
					}
				}
			}
		};
		visit(doc.root);
		return pictures;
	} catch {
		// A drawing we cannot read must not keep the cells from opening.
		return [];
	}
}
