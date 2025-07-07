<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLLiAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
	bind:this={ref}
	data-slot="breadcrumb-item"
	class={cn('text-foreground inline-flex items-center gap-1.5 text-base', className)}
	{...restProps}
>
	{@render children?.()}
</li>
