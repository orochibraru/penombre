import { encodeXml } from "#lib/server/office/xml.js";
import type { TreeEntry } from "#lib/server/services/storage/listings.js";

export function xmlResponse(
	status: number,
	body: string,
	headers: Record<string, string> = {},
): Response {
	return new Response(`<?xml version="1.0" encoding="utf-8"?>\n${body}`, {
		status,
		headers: { "content-type": 'application/xml; charset="utf-8"', ...headers },
	});
}

export function multistatus(responses: string[], namespaces = ""): Response {
	return xmlResponse(
		207,
		`<d:multistatus xmlns:d="DAV:"${namespaces}>${responses.join("")}</d:multistatus>`,
	);
}

const SUPPORTED_LOCK =
	"<d:supportedlock><d:lockentry><d:lockscope><d:exclusive/></d:lockscope><d:locktype><d:write/></d:locktype></d:lockentry></d:supportedlock>";

export function propResponse(href: string, entry: TreeEntry): string {
	const props = [
		`<d:displayname>${encodeXml(entry.name)}</d:displayname>`,
		`<d:getlastmodified>${entry.updatedAt.toUTCString()}</d:getlastmodified>`,
		entry.type === "folder"
			? "<d:resourcetype><d:collection/></d:resourcetype>"
			: "<d:resourcetype/>",
		SUPPORTED_LOCK,
	];
	if (entry.type === "file") {
		props.push(
			`<d:getcontentlength>${entry.size}</d:getcontentlength>`,
			`<d:getcontenttype>${encodeXml(entry.contentType)}</d:getcontenttype>`,
			`<d:getetag>"${entry.id}-${entry.updatedAt.getTime()}-${entry.size}"</d:getetag>`,
		);
	}
	return `<d:response><d:href>${encodeXml(href)}</d:href><d:propstat><d:prop>${props.join("")}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`;
}
