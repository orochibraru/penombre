import { toast } from "svelte-sonner";
import { authClient } from "#lib/auth-client.js";
import * as m from "#lib/paraglide/messages.js";
import { clearAll as clearUploadQueue } from "#lib/upload/queue.js";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

/** Same key the sign-in page remembers the last address under. */
const REMEMBERED_EMAIL_KEY = "penombre:sign-in-email";

async function signOutCallback() {
	await authClient.signOut();
	// A shared machine's next sign-in must not see this account's upload
	// list, resume its transfers, or have its address pre-filled.
	await clearUploadQueue();
	try {
		localStorage.removeItem(REMEMBERED_EMAIL_KEY);
	} catch {
		// Storage blocked (private window); nothing to clear.
	}
	await goto(resolve("auth/sign-in"), { refreshAll: true });
	return true;
}

export function handleSignOut() {
	toast.promise(signOutCallback, {
		loading: m.toast_signing_out(),
		success: m.toast_signed_out(),
		error: m.toast_sign_out_error(),
	});
}
