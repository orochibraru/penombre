import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { authClient } from "$lib/auth-client";
import * as m from "$lib/paraglide/messages.js";

async function signOutCallback() {
	await authClient.signOut();
	await goto(resolve("/auth/sign-in"), { invalidateAll: true });
	return true;
}

export async function handleSignOut() {
	toast.promise(signOutCallback, {
		loading: m.toast_signing_out(),
		success: m.toast_signed_out(),
		error: m.toast_sign_out_error(),
	});
}
