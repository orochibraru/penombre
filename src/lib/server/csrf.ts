import type { Handle } from "@sveltejs/kit/hooks";

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
 */
export const csrfHandler: Handle = ({ event, resolve }) => {
	const { headers, method } = event.request;
	const type = headers.get("content-type")?.split(";")[0]?.trim();
	if (
		MUTATING.has(method) &&
		(!type || FORM_TYPES.has(type.toLowerCase())) &&
		headers.get("origin") !== event.url.origin &&
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
