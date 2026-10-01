import { officeKindForName } from "#lib/documents.js";
import { slidesPdfPages } from "../slides";
import { renderPdf } from "./pdf";

/** A 16:9 page in points, the slide filling it edge to edge. */
const PAGE = { width: 960, height: 540 };

export class ExportUnavailableError extends Error {}

export function exportSlides(
	format: "pdf" | "pptx",
	name: string,
	bytes: ArrayBuffer,
): Promise<Uint8Array> {
	// ponytail: a Markdown deck has no renderer here; convert it by opening
	// and saving it as .pptx first if that is ever asked for.
	if (!officeKindForName(name)) {
		return Promise.reject(
			new ExportUnavailableError(
				`A Markdown deck cannot be exported as ${format.toUpperCase()}`,
			),
		);
	}
	const pages = slidesPdfPages(bytes);
	return renderPdf({
		pageSize: PAGE,
		pageMargins: 0,
		content: pages.map((svg, index) => ({
			svg,
			width: PAGE.width,
			...(index > 0 ? { pageBreak: "before" as const } : {}),
		})),
	});
}
