<script lang="ts">
	import { PanelLeftIcon } from "@lucide/svelte";
	import type { ComponentProps } from "svelte";
	import type { Button } from "$lib/components/ui/button/index";
	import { cn } from "$lib/utils.js";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	size="icon"
	class={cn('size-5 md:hidden', className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<PanelLeftIcon />
	<span class="sr-only">Toggle Sidebar</span>
</button>
