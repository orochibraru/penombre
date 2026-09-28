import { DAV_CHALLENGE } from "#lib/server/dav/auth.js";
import { davOptions, handleDav } from "#lib/server/dav/handler.js";
import { parseDavPath } from "#lib/server/dav/location.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/** A folder's href ends in `/`; Kit would 308 it away, and DAV clients do not follow. */
export const trailingSlash = "ignore";

/** `fallback`, not per-method exports: PROPFIND, MKCOL, MOVE and LOCK have none. */
export const fallback = async (event) => {
	const loc = parseDavPath(event.url.pathname);
	if (!loc) {
		return new Response(null, { status: 404 });
	}
	// Explorer probes without credentials and gives up on a 401.
	if (event.request.method === "OPTIONS") {
		return davOptions();
	}
	const owner = event.locals.storageOwner ?? event.locals.user;
	if (!owner) {
		return new Response(null, { status: 401, headers: DAV_CHALLENGE });
	}
	try {
		const service = await storageServiceFor(owner, {
			url: new URL(`/?${loc.query}`, event.url),
			locals: event.locals,
		});
		return await handleDav(event.request, service, loc);
	} catch (error) {
		if (error instanceof DriveAccessError) {
			return new Response(null, { status: error.status });
		}
		throw error;
	}
};
