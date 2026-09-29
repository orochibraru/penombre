import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { getVolumes, isSimpleMode } from "#lib/server/config.js";
import { DAV_CHALLENGE } from "#lib/server/dav/auth.js";
import { davOptions, davRoot, handleDav } from "#lib/server/dav/handler.js";
import { parseDavPath } from "#lib/server/dav/location.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { drivesService } from "#lib/server/services/drives.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/** A folder's href ends in `/`; Kit would 308 it away, and DAV clients do not follow. */
export const trailingSlash = "ignore";

/** `fallback`, not per-method exports: PROPFIND, MKCOL, MOVE and LOCK have none. */
/** What the sidebar lists, minus read-only volumes: nothing could sync into one. */
async function places(user: NonNullable<App.Locals["user"]>) {
	const drives = isSimpleMode() ? [] : await drivesService.listForUser(user.id);
	const driveList = drives.map((d) => ({
		href: `/dav/drives/${encodeURIComponent(d.id)}/`,
		name: d.name,
	}));
	if (isDriveOnly(user)) {
		return driveList;
	}
	return [
		{ href: "/dav/me/", name: "My drive" },
		...driveList,
		...getVolumes()
			.filter((v) => !v.readOnly)
			.map((v) => ({
				href: `/dav/volumes/${encodeURIComponent(v.name)}/`,
				name: v.label,
			})),
	];
}

export const fallback = async (event) => {
	if (event.url.pathname === "/dav" || event.url.pathname === "/dav/") {
		if (event.request.method !== "OPTIONS" && !event.locals.user) {
			return new Response(null, { status: 401, headers: DAV_CHALLENGE });
		}
		return davRoot(
			event.request,
			event.locals.user ? await places(event.locals.user) : [],
		);
	}
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
