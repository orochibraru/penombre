import { authorizationServerMetadata } from "#lib/server/mcp/oauth.js";

export const GET = ({ url }) =>
	Response.json(authorizationServerMetadata(url), {
		headers: { "access-control-allow-origin": "*" },
	});
