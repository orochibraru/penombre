<script lang="ts">
	import {
		resolveIconUrl,
		createIconFallbackState,
		getNextFallbackUrl
	} from '$lib/utils/icon-util.js';

	interface Props {
		name: string;
		description: string;
		href: string;
		icon?: string;
		class?: string;
	}

	let { name, description, href, icon, class: className = '', ...restProps }: Props = $props();

	const iconUrl = $derived(resolveIconUrl(icon));
	const fallbackState = $state(createIconFallbackState());

	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		const nextUrl = getNextFallbackUrl(img.src, icon, fallbackState);
		img.src = nextUrl;
	}

	$effect(() => {
		fallbackState.clear();
	});
</script>

<a
	{href}
	class="bg-background dark:bg-surface border-border/50 hover:bg-muted/50 dark:hover:bg-surface/80 flex w-full flex-col items-center rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md sm:p-10 dark:border-transparent dark:shadow-none dark:hover:shadow-none {className}"
	{...restProps}
>
	{#if iconUrl}
		<img
			src={iconUrl}
			alt="{name} icon"
			class="mb-3 h-12 w-12 object-contain"
			loading="lazy"
			onerror={handleImageError}
		/>
	{/if}
	<p class="text-foreground text-center font-bold">{name}</p>
	<p class="text-muted-foreground mt-1 text-center text-xs">{description}</p>
</a>
