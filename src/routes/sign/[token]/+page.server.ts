import { error, fail, type RequestEvent } from "@sveltejs/kit";
import {
	type RequestMeta,
	SignatureError,
	type SigningView,
	signatures,
} from "#lib/server/services/signatures/index.js";

/**
 * A signer's page. Public: the token is the whole credential, so each action
 * resolves it again rather than trusting the load, which never ran for a
 * bare POST.
 */

function meta(event: RequestEvent): RequestMeta {
	const account = event.locals.user;
	return {
		ipAddress: event.getClientAddress(),
		userAgent: event.request.headers.get("user-agent"),
		account: account ? { id: account.id, email: account.email } : null,
	};
}

export const load = async (event) => {
	let view: SigningView | null;
	try {
		view = await signatures().open(event.params.token, meta(event));
	} catch (caught) {
		if (caught instanceof SignatureError) {
			return error(caught.status, caught.message);
		}
		throw caught;
	}
	if (!view) {
		return error(
			404,
			"This link does not exist, or a newer one replaced it. Check your latest email.",
		);
	}
	const account = event.locals.user;
	// Only the signer's own account is offered its saved signature.
	const lastSignature =
		account &&
		view.status === "pending" &&
		view.signer.status === "pending" &&
		account.email.toLowerCase() === view.signer.email
			? await signatures().lastSignature(account.id)
			: null;
	return { view, lastSignature };
};

async function answer(
	event: RequestEvent,
	act: (form: FormData) => Promise<unknown>,
) {
	try {
		await act(await event.request.formData());
		return { answered: true };
	} catch (caught) {
		if (caught instanceof SignatureError) {
			return fail(caught.status, { error: caught.message });
		}
		throw caught;
	}
}

const text = (form: FormData, name: string) => {
	const value = form.get(name);
	return typeof value === "string" ? value : null;
};

export const actions = {
	sign: (event) =>
		answer(event, (form) =>
			signatures().sign(
				event.params.token,
				{
					signature: text(form, "signature") ?? "",
					timeZone: text(form, "timeZone"),
					consent: text(form, "consent") === "on",
				},
				meta(event),
			),
		),
	decline: (event) =>
		answer(event, (form) =>
			signatures().decline(
				event.params.token,
				text(form, "reason"),
				meta(event),
			),
		),
};
