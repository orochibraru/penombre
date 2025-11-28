import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { toast } from "svelte-sonner";
import { dev } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { route } from "$lib/ROUTES";

const apiUrl = dev ? "http://localhost:8080" : page.url.origin;

export const authClient = createAuthClient({
	baseURL: `${apiUrl}/api/auth`,
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
