import type { Handle } from "@sveltejs/kit/hooks";
import { getConfig } from "#lib/server/config.js";
import { DAV_PREFIX } from "#lib/server/dav/location.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORM_TYPES = new Set([
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/plain",
	"application/x-sveltekit-formdata",
]);

/**
 * Kit 3's CSRF rule, which counts a missing content type as a form, minus
 * API-key requests: a browser cannot attach those headers cross-site without
 * a preflight, and Kit's version refused every bodiless DELETE from a script.
 * `/dav/` has no POST, and a cross-site form can send nothing else. Under
 * `/mcp/`, a transfer link or a PKCE code is the credential, which a form
 * cannot forge.
 *
 * `ORIGIN` counts too: with no proxy header, adapter-bun assumes `https`, so
 * on a plain-HTTP instance `event.url` never matches what the browser sends.
 */
export const csrfHandler: Handle = ({ event, resolve }) => {
	const { headers, method } = event.request;
	const type = headers.get("content-type")?.split(";")[0]?.trim();
	const origin = headers.get("origin");
	if (
		!event.url.pathname.startsWith(DAV_PREFIX) &&
		!event.url.pathname.startsWith("/mcp/") &&
		MUTATING.has(method) &&
		(!type || FORM_TYPES.has(type.toLowerCase())) &&
		origin !== event.url.origin &&
		origin !== URL.parse(getConfig().origin)?.origin &&
		!headers.has("x-api-key") &&
		!headers.get("authorization")?.startsWith("Bearer ")
	) {
		return Response.json(
			{ message: `Cross-site ${method} form submissions are forbidden` },
			{ status: 403 },
		);
	}
	return resolve(event);
};
