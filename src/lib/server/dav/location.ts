/**
 * `/dav/me/…`, `/dav/drives/<id>/…`, `/dav/volumes/<name>/…`. A scope word
 * first because a WebDAV client cannot send `x-drive`, and a personal folder
 * may itself be called `drives`.
 */

export const DAV_PREFIX = "/dav/";

export interface DavLocation {
	/** What every href in a response starts with. */
	base: string;
	/** What `storageServiceFor` reads. */
	query: string;
	segments: string[];
}

export function parseDavPath(pathname: string): DavLocation | null {
	if (!`${pathname}/`.startsWith(DAV_PREFIX)) {
		return null;
	}
	let parts: string[];
	try {
		parts = pathname
			.slice(DAV_PREFIX.length)
			.split("/")
			.filter(Boolean)
			.map(decodeURIComponent);
	} catch {
		return null;
	}
	if (parts.some((p) => p === "." || p === ".." || p.includes("/"))) {
		return null;
	}
	const [scope, ...rest] = parts;
	if (scope === "me") {
		return { base: "/dav/me", query: "", segments: rest };
	}
	const [id, ...segments] = rest;
	if (!id) {
		return null;
	}
	const encoded = encodeURIComponent(id);
	if (scope === "drives") {
		return {
			base: `/dav/drives/${encoded}`,
			query: `drive=${encoded}`,
			segments,
		};
	}
	if (scope === "volumes") {
		return {
			base: `/dav/volumes/${encoded}`,
			query: `volume=${encoded}`,
			segments,
		};
	}
	return null;
}

export function hrefFor(
	base: string,
	segments: string[],
	folder: boolean,
): string {
	const path = segments.map(encodeURIComponent).join("/");
	return `${base}/${path}${folder && path ? "/" : ""}`;
}
