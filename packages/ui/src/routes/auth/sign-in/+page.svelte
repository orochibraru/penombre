<script lang="ts">
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";
	import { handleOauthSignIn } from "$lib/api/helpers/auth";
	import * as Alert from "$lib/components/ui/alert/index";
	import { Button } from "$lib/components/ui/button/index";
	import { title } from "$lib/store/title";
	import { cn } from "$lib/utils.js";

	let loading: boolean = $state(false);

	$title = "Sign in";

	let error: boolean = $state(false);

	async function oauthHandler(provider: string) {
		loading = true;
		const res = await handleOauthSignIn(provider);
		if (res.error) {
			error = true;
			toast.error("There was an error when signing in. Please try again.");
			loading = false;
			return;
		}
		console.log(res.data);
		if (res.data.url) {
			goto(res.data.url);
		}
	}
</script>

<form class={cn('flex flex-col gap-6')}>
	<div class="flex flex-col items-center gap-2 text-center">
		<h1 class="text-2xl font-bold">Access to your account</h1>
		<p class="text-muted-foreground text-sm text-balance">
			Choose one of the sign in methods to continue.
		</p>
	</div>
	{#if error}
		<Alert.Root class="mb-5" variant="destructive">
			<Alert.Title>Oops.</Alert.Title>
			<Alert.Description
				>There was an error when signing in. Please try again.</Alert.Description
			>
		</Alert.Root>
	{/if}
	<div class="grid gap-6">
		<Button
			variant="outline"
			class="w-full"
			{loading}
			onclick={() => oauthHandler('pocket-id')}
		>
			Sign in with Ombrage Auth
		</Button>

		<div class="text-center text-sm">Don&apos;t have an account? Too bad.</div>
	</div>
</form>
