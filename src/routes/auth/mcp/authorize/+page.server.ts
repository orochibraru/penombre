import { redirect } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
import { signInReturningTo } from "#lib/next.js";
import {
	type AuthorizeRequest,
	createAuthorizationCode,
	issuer,
	OAuthRefusal,
	readAuthorizeRequest,
} from "#lib/server/mcp/oauth.js";

const logger = new Logger("MCP OAuth");

/** Never redirects on a bad request: an unchecked redirect_uri is an open redirect. */
async function read(url: URL): Promise<AuthorizeRequest | string> {
	try {
		return await readAuthorizeRequest(url);
	} catch (error) {
		if (error instanceof OAuthRefusal) {
			return error.message;
		}
		logger.error("Could not read an MCP authorization request", error);
		return "the request could not be read";
	}
}

function back(
	req: AuthorizeRequest,
	url: URL,
	answer: Record<string, string>,
): never {
	const target = new URL(req.redirectUri);
	for (const [name, value] of Object.entries(answer)) {
		target.searchParams.set(name, value);
	}
	if (req.state) {
		target.searchParams.set("state", req.state);
	}
	target.searchParams.set("iss", issuer(url));
	redirect(303, target.toString(), { external: true });
}

export const load = async ({ url, locals }) => {
	if (!locals.user) {
		redirect(302, signInReturningTo(url));
	}
	const req = await read(url);
	if (typeof req === "string") {
		return { problem: req, client: null };
	}
	return {
		problem: null,
		client: {
			name: req.client.name,
			host: new URL(req.client.clientId).host,
			redirectHost: new URL(req.redirectUri).host,
		},
	};
};

export const actions = {
	approve: async ({ url, locals }) => {
		if (!locals.user) {
			redirect(302, signInReturningTo(url));
		}
		const req = await read(url);
		if (typeof req === "string") {
			return { problem: req };
		}
		const code = await createAuthorizationCode({
			userId: locals.user.id,
			clientId: req.client.clientId,
			clientName: req.client.name,
			redirectUri: req.redirectUri,
			challenge: req.challenge,
		});
		back(req, url, { code });
	},
	deny: async ({ url, locals }) => {
		if (!locals.user) {
			redirect(302, signInReturningTo(url));
		}
		const req = await read(url);
		if (typeof req === "string") {
			return { problem: req };
		}
		back(req, url, { error: "access_denied" });
	},
};
