import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

import { signInReturningTo } from "#lib/next.js";
import { getDb } from "#lib/server/db/index.js";
import { files } from "#lib/server/db/schema.js";
import { fileHref } from "#lib/server/services/file-href.js";

/**
 * The file twin of `/go/folder/<id>`: each viewer lands where they can open
 * it (`fileHref`), and anyone else gets the same 404 as an unknown id.
 */
export const GET = async ({ params, locals, url }) => {
	const viewer = locals.user;
	if (!viewer) {
		return redirect(303, signInReturningTo(url));
	}

	const [file] = await getDb()
		.select()
		.from(files)
		.where(and(eq(files.id, params.id), eq(files.isTrashed, false)));
	const href =
		file && (await fileHref(file, viewer.id, locals.storageOwner?.id));
	if (!href) {
		return error(404, "File not found");
	}
	return redirect(303, href);
};
