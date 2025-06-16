<script lang="ts">
	import { route } from '$lib/ROUTES';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import BrandGithub from '@tabler/icons-svelte/icons/brand-github';

	let loading: boolean = $state(false);
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Sign in</Card.Title>
			<Card.Description>Continue with Github to access your account.</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4">
				<Button
					variant="outline"
					class="w-full"
					{loading}
					onclick={async () => {
						loading = true;
						await authClient.signIn.social({
							provider: 'github'
						});
					}}
				>
					{#if loading}
						Signing in...
					{:else}
						Sign in with Github
					{/if}
					<BrandGithub />
				</Button>
			</div>
			{#if !loading}
				<div class="mt-4 text-center text-sm">
					Don't have an account?
					<a href={route('/auth/sign-up')} class="underline"> Sign up </a>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
