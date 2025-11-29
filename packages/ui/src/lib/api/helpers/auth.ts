import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { route } from "$lib/ROUTES";
import { getBaseUrl } from "$lib/utils";

export function getAuthClient(url: URL) {
	const baseUrl = getBaseUrl(url);

	return createAuthClient({
		baseURL: `${baseUrl}/api/auth`,
		plugins: [genericOAuthClient()],
	});
}

export async function handleOauthSignIn(
	client: ReturnType<typeof getAuthClient>,
	provider: string,
) {
	return await client.signIn.oauth2({
		providerId: provider,
		callbackURL: window.location.origin,
	});
}

async function signOutCallback(client: ReturnType<typeof getAuthClient>) {
	await client.signOut();
	await goto(route("/auth/sign-in"), { invalidateAll: true });
	return true;
}

export async function handleSignOut(client: ReturnType<typeof getAuthClient>) {
	toast.promise(signOutCallback(client), {
		loading: "Signing you out",
		success: "You were signed out",
		error: "Failed to sign you out",
	});
}
