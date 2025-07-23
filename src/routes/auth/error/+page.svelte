<script lang="ts">
	import { AlertCircleIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { getAuthError } from '$lib/auth';
	import * as Alert from '$lib/components/ui/alert/index';
	import { Button } from '$lib/components/ui/button/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import { cn } from '$lib/utils.js';

	$title = 'Authentication Error';

	let authError: string = $state('');

	onMount(() => {
		const err = getAuthError();
		authError = err ? err : '';
	});
</script>

<form class={cn('flex flex-col gap-6')}>
	<div class="flex flex-col items-center gap-2 text-center">
		<h1 class="text-2xl font-bold">Oops!</h1>
	</div>
	<div>
		<Alert.Root variant="destructive" class="mb-5">
			<AlertCircleIcon />
			<Alert.Title>There was an error signing you in</Alert.Title>
			<Alert.Description>
				<p>
					{#if authError}
						{authError}
					{:else}
						Please verify that the configuration is correct and that you have access.
					{/if}
				</p>
			</Alert.Description>
		</Alert.Root>
		<Button class="w-full" variant="destructive" href={route('/auth/sign-in')}>Try Again</Button>
	</div>
</form>
