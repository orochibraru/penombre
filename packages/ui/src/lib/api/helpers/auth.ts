import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { authClient } from "$lib/auth-client";
import { route } from "$lib/ROUTES";

async function signOutCallback() {
	await authClient.signOut();
	await goto(route("/auth/sign-in"), { invalidateAll: true });
	return true;
}

export async function handleSignOut() {
	toast.promise(signOutCallback(), {
		loading: "Signing you out",
		success: "You were signed out",
		error: "Failed to sign you out",
	});
}
