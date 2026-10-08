import { protectedResourceMetadata } from "#lib/server/mcp/oauth.js";

export const GET = ({ url }) =>
	Response.json(protectedResourceMetadata(url), {
		headers: { "access-control-allow-origin": "*" },
	});
