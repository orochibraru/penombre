import {
	issueAccessToken,
	redeemAuthorizationCode,
} from "#lib/server/mcp/oauth.js";

const HEADERS = {
	"cache-control": "no-store",
	"access-control-allow-origin": "*",
};

function refuse(error: string, description: string): Response {
	return Response.json(
		{ error, error_description: description },
		{ status: 400, headers: HEADERS },
	);
}

export const POST = async ({ request }) => {
	const form = await request.formData().catch(() => null);
	const field = (name: string) => {
		const value = form?.get(name);
		return typeof value === "string" ? value : "";
	};
	if (field("grant_type") !== "authorization_code") {
		return refuse("unsupported_grant_type", "Only authorization_code.");
	}
	const pending = await redeemAuthorizationCode({
		code: field("code"),
		verifier: field("code_verifier"),
		clientId: field("client_id"),
		redirectUri: field("redirect_uri"),
	});
	if (!pending) {
		return refuse("invalid_grant", "The code is invalid, used or expired.");
	}
	return Response.json(
		{ access_token: await issueAccessToken(pending), token_type: "Bearer" },
		{ headers: HEADERS },
	);
};
