<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import { cn } from '$lib/utils';

	type Props = {
		normalHeight: boolean;
	};

	const { normalHeight = false }: Props = $props();

	onMount(() => {
		$title = 'Oops';
	});
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-2 p-5',
		normalHeight ? 'h-full' : 'h-screen'
	)}
>
	<div class="flex flex-col gap-5 p-5 text-center">
		<h1 class="text-center text-[5rem] font-bold text-gray-700">{page.status ?? 500}</h1>

		{#if page.status === 404}
			<p class="text-2xl text-gray-800">Not found.</p>
			{#if dev}
				<p class="text-lg">{page.error?.message}</p>
			{:else}
				<p class="text-lg">
					The page you are looking for does not exist. Please check the URL and try again.
				</p>
			{/if}
		{:else}
			<p class="text-2xl text-gray-800">Oops! Something went wrong.</p>
			{#if dev || page.status === 403 || page.status === 401}
				<p class="text-lg">{page.error?.message}</p>
			{:else}
				<p class="text-lg">
					Please contact the site administrator if you think this shouldn't happen.
				</p>
			{/if}
		{/if}

		{#if page.error?.errorId && page.status === 500}
			<p class="text-muted-foreground max-w-[700px] text-lg">Error ID: {page.error.errorId}</p>
		{/if}
	</div>

	<Button href={route('/')}>Go back home</Button>
</div>
