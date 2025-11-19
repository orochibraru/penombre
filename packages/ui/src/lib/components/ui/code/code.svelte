<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { box } from "svelte-toolbelt";
	import { cn } from "$lib/utils/utils";
	import { codeVariants } from ".";
	import { useCode } from "./code.svelte.js";
	import type { CodeRootProps } from "./types";

	let {
		ref = $bindable(null),
		variant = "default",
		lang = "typescript",
		code,
		class: className,
		hideLines = false,
		highlight = [],
		children,
		...rest
	}: CodeRootProps = $props();

	const codeState = useCode({
		code: box.with(() => code),
		hideLines: box.with(() => hideLines),
		highlight: box.with(() => highlight),
		lang: box.with(() => lang),
	});
</script>

<div {...rest} bind:this={ref} class={cn('p-3', codeVariants({ variant }), className)}>
	{@html codeState.highlighted}
	{@render children?.()}
</div>
