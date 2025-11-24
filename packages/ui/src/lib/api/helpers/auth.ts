import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { route } from "$lib/ROUTES";

export const authClient = createAuthClient({
	baseURL: "http://localhost:8080/api/auth",
	plugins: [genericOAuthClient()],
});

export async function handleOauthSignIn(provider: string) {
	return await authClient.signIn.oauth2({
		providerId: provider,
		callbackURL: window.location.origin,
	});
}

async function signOutCallback() {
	await authClient.signOut();
	await goto(route("/auth/sign-in"), { invalidateAll: true });
	return true;
}

export async function handleSignOut() {
	toast.promise(signOutCallback, {
		loading: "Signing you out",
		success: "You were signed out",
		error: "Failed to sign you out",
	});
}
