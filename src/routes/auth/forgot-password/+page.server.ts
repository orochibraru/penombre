import { error, fail } from "@sveltejs/kit";
import { instanceSignInMethods } from "#lib/server/auth/index.js";
import {
	canMailPasswordLinks,
	requestPasswordLink,
} from "#lib/server/auth/password-link.js";

export const load = async () => {
	if (!(await instanceSignInMethods()).password) {
		return error(404, "Password sign-in is not enabled");
	}
	return { canMail: await canMailPasswordLinks() };
};

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get("email") ?? "")
			.trim()
			.toLowerCase();
		if (!email) {
			return fail(400, { error: "INVALID_FORM" });
		}
		const outcome = await requestPasswordLink(email, getClientAddress());
		if (outcome === "limited") {
			return fail(429, { limited: true, email });
		}
		if (outcome === "unavailable") {
			return fail(503, { unavailable: true, email });
		}
		return { sent: email };
	},
};
