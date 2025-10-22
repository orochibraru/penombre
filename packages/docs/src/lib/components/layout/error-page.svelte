<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	type Props = {
		normalHeight: boolean;
	};

	const { normalHeight = false }: Props = $props();
</script>

<svelte:head>
	<title>Oops</title>
</svelte:head>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-2 p-5',
		normalHeight ? 'h-full' : 'h-screen'
	)}
>
	<div class="flex flex-col gap-5 p-5 text-center">
		<h1 class="text-center text-[5rem] font-bold text-gray-700">
			{page.status ?? 500}
		</h1>

		{#if page.status === 404}
			<p class="text-2xl text-gray-800">Not found.</p>
			{#if dev}
				<p class="text-lg">{page.error?.message}</p>
			{:else}
				<p class="text-lg">
					The page you are looking for does not exist. Please check the URL and try again.
				</p>
			{/if}
		{:else if page.status >= 401 && page.status <= 403}
			<p class="text-2xl text-gray-800">You don't have access.</p>
			<p class="text-lg">Unauthorized</p>
		{:else}
			<p class="text-2xl text-gray-800">Oops! Something went wrong.</p>
			{#if dev || page.status === 403 || page.status === 401}
				<p class="max-w-3xl overflow-x-auto text-lg">{page.error?.message}</p>
			{:else}
				<p class="text-lg">
					Please contact the site administrator if you think this shouldn't happen.
				</p>
			{/if}
		{/if}
	</div>

	<Button href={'/'}>Go back home</Button>
</div>
