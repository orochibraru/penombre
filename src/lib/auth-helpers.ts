import { toast } from "svelte-sonner";
import { authClient } from "#lib/auth-client.js";
import * as m from "#lib/paraglide/messages.js";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

async function signOutCallback() {
	await authClient.signOut();
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
