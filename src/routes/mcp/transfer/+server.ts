import { writeNamed } from "#lib/server/dav/handler.js";
import { fileAt, locate } from "#lib/server/mcp/tool.js";
import { refusalOf } from "#lib/server/mcp/tools.js";
import { grantUsers, readGrant } from "#lib/server/mcp/transfer.js";

/** The link is the credential: the session and any key are ignored. */
async function granted(event: Parameters<typeof GET>[0]) {
	const grant = readGrant(
		event.url.searchParams.get("token"),
		event.request.method === "HEAD" ? "GET" : event.request.method,
	);
	const users = grant && (await grantUsers(grant));
	if (!grant || !users) {
		return null;
	}
	const locals = {
		...event.locals,
		user: users.user,
		storageOwner: users.owner,
	};
	return locate(grant.path, { ...users, locals, url: event.url });
}

async function answer(work: () => Promise<Response>): Promise<Response> {
	try {
		return await work();
	} catch (error) {
		const refusal = refusalOf(error);
		if (!refusal) {
			throw error;
		}
		return new Response(refusal, {
			status: refusal.includes("read-only") ? 403 : 404,
		});
	}
}

export const GET = (event) =>
	answer(async () => {
		const target = await granted(event);
		if (!target) {
			return new Response("Invalid or expired link", { status: 403 });
		}
		const entry = await fileAt(target.service, target.loc.segments);
		return target.service.handleRawFile(
			entry.path,
			undefined,
			event.request.headers.get("range") ?? undefined,
		);
	});

export const PUT = (event) =>
	answer(async () => {
		const target = await granted(event);
		if (!target) {
			return new Response("Invalid or expired link", { status: 403 });
		}
		// ponytail: whole body in memory, as WebDAV's PUT does
		const bytes = new Uint8Array(await event.request.arrayBuffer());
		const code = await writeNamed(target.service, target.loc.segments, bytes);
		return new Response(null, { status: code });
	});
