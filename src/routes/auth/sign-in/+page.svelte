<script lang="ts">
	import { GithubIcon } from '@lucide/svelte';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import { authClient } from '$lib/client/auth';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import { cn } from '$lib/utils.js';

	$title = 'Sign in';

	const { data } = $props();

	const id = $props.id();

	// TODO: For OTP: https://www.better-auth.com/docs/plugins/email-otp

	let loading: boolean = $state(false);
	let error: boolean = $state(false);
</script>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href={route('/')} class="flex items-center gap-2 font-medium">
				<div
					class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
				>
					<GalleryVerticalEndIcon class="size-4" />
				</div>
				Opendrive
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<form class={cn('flex flex-col gap-6')}>
					<div class="flex flex-col items-center gap-2 text-center">
						<h1 class="text-2xl font-bold">Login to your account</h1>
						<p class="text-muted-foreground text-sm text-balance">
							Enter your email below to login to your account
						</p>
					</div>
					{#if error}
						<Alert.Root class="mb-5" variant="destructive">
							<Alert.Title>Oops.</Alert.Title>
							<Alert.Description>
								There was an error when signing in. Please try again.
							</Alert.Description>
						</Alert.Root>
					{/if}
					<div class="grid gap-6">
						{#if data.passwordlessReady}
							<fieldset disabled={loading} class="grid gap-6">
								<div class="grid gap-3">
									<Label for="email-{id}">Email</Label>
									<Input id="email-{id}" type="email" placeholder="m@example.com" required />
								</div>
								<Button {loading} type="submit" class="w-full">
									{#if loading}
										Signing in...
									{:else}
										Sign in
									{/if}
								</Button>
							</fieldset>
						{/if}
						{#if data.passwordlessReady && data.oauthReady}
							<div
								class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
							>
								<span class="bg-background text-muted-foreground relative z-10 px-2"> Or </span>
							</div>
						{/if}
						{#if data.oauthReady}
							<Button
								variant="outline"
								class="w-full"
								{loading}
								onclick={async () => {
									loading = true;
									try {
										const res = await authClient.signIn.social({
											provider: 'github'
										});

										if (res.error) {
											console.error(res.error);
											error = true;
											loading = false;
										}
									} catch (e) {
										console.error(e);
										loading = false;
									}
								}}
							>
								{#if loading}
									Signing in...
								{:else}
									Sign in with Github
								{/if}
								<GithubIcon />
							</Button>
						{/if}
					</div>
					<div class="text-center text-sm">Don&apos;t have an account? Too bad.</div>
				</form>
			</div>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">
		<img
			src="/background.svg"
			alt="background"
			class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
		/>
	</div>
</div>
