import { error, fail, type RequestEvent } from "@sveltejs/kit";
import {
	SignatureError,
	signatures,
	type SignerKey,
	type SigningView,
} from "./index";
import { signingMeta } from "./respond";

/**
 * A signer's page, reached by their link's token or, signed in, by their own
 * row (`/sign/signer/<id>`, what a notification links to). Each action
 * resolves the key again rather than trusting the load, which never ran for a
 * bare POST. `key` is null when there is nobody it could open for.
 */
export function signingPage(key: (event: RequestEvent) => SignerKey | null) {
	const load = async (event: RequestEvent) => {
		const signer = key(event);
		let view: SigningView | null = null;
		try {
			view = signer
				? await signatures().open(signer, signingMeta(event))
				: null;
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
		// What the mobile app needs to open the same signer.
		const appKey =
			typeof signer === "string"
				? `token=${encodeURIComponent(signer)}`
				: `signer=${encodeURIComponent(signer?.signerId ?? "")}`;
		return { view, lastSignature, appKey };
	};

	async function answer(
		event: RequestEvent,
		act: (signer: SignerKey, form: FormData) => Promise<unknown>,
	) {
		const signer = key(event);
		if (!signer) {
			return fail(404, { error: "This link does not exist." });
		}
		try {
			await act(signer, await event.request.formData());
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

	const actions = {
		sign: (event: RequestEvent) =>
			answer(event, (signer, form) =>
				signatures().sign(
					signer,
					{
						signature: text(form, "signature") ?? "",
						timeZone: text(form, "timeZone"),
						consent: text(form, "consent") === "on",
					},
					signingMeta(event),
				),
			),
		decline: (event: RequestEvent) =>
			answer(event, (signer, form) =>
				signatures().decline(signer, text(form, "reason"), signingMeta(event)),
			),
	};

	return { load, actions };
}

/** A signed-in account's own signer row; nobody else's, and nothing signed out. */
export function accountSigner(
	event: RequestEvent,
	signerId: string | undefined,
): SignerKey | null {
	const user = event.locals.user;
	return user && signerId ? { signerId, userId: user.id } : null;
}

/** The signer an API call names: by token, or the caller's own row by id. */
export function requestSigner(
	event: RequestEvent,
	body: { token?: string; signer?: string },
): SignerKey | null {
	return body.token ?? accountSigner(event, body.signer);
}
