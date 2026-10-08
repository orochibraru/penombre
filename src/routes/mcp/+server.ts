import { getConfig } from "#lib/server/config.js";
import { resourceMetadataUrl } from "#lib/server/mcp/oauth.js";
import { handleMcp } from "#lib/server/mcp/protocol.js";

export const POST = (event) => {
	// The spec's DNS-rebinding guard; MCP clients send no Origin at all.
	const origin = event.request.headers.get("origin");
	if (
		origin &&
		origin !== event.url.origin &&
		origin !== URL.parse(getConfig().origin)?.origin
	) {
		return new Response("Forbidden origin", { status: 403 });
	}
	const user = event.locals.user;
	if (!user) {
		return new Response("Unauthorized", {
			status: 401,
			headers: {
				"www-authenticate": `Bearer realm="Penombre", resource_metadata="${resourceMetadataUrl(event.url)}"`,
			},
		});
	}
	return handleMcp(event.request, {
		user,
		owner: event.locals.storageOwner ?? user,
		locals: event.locals,
		url: event.url,
	});
};
