import { error, fail, redirect } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import {
	passwordProblem,
	passwordRules,
} from "#lib/server/auth/password-rules.js";
import { resolve } from "$app/paths";

const logger = new Logger("auth/reset-password");

/** better-auth lands here from the emailed link, with `?token=` or `?error=`. */
export const load = async ({ url }) => {
	if (!(await instanceSignInMethods()).password) {
		return error(404, "Password sign-in is not enabled");
	}
	const rules = await passwordRules();
	return {
		token: url.searchParams.get("token") ?? "",
		expired: url.searchParams.has("error"),
		minLength: rules.minLength,
		requireStrong: rules.requireStrong,
	};
};

export const actions = {
	reset: async ({ request }) => {
		const form = await request.formData();
		const token = String(form.get("token") ?? "").trim();
		const password = String(form.get("password") ?? "");
		const confirm = String(form.get("confirm") ?? "");
		if (!token) {
			return fail(400, { error: "RESET_EXPIRED" });
		}
		const problem = passwordProblem(password, confirm, await passwordRules());
		if (problem) {
			return fail(400, problem);
		}
		try {
			await auth.api.resetPassword({ body: { newPassword: password, token } });
		} catch (err) {
			logger.warn("A password reset was refused", err);
			return fail(400, { error: "RESET_EXPIRED" });
		}
		return redirect(303, `${resolve("auth/sign-in")}?reset=1`);
	},
};
