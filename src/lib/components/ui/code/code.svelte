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

<div
    {...rest}
    bind:this={ref}
    class={cn(
        // `max-w-[60vw]` was viewport-relative, so inside a dialog the block
        // was sized against the window rather than its container and spilled
        // out of it. Bound by the parent instead; `min-w-0` lets it shrink
        // when that parent is a flex item.
        "min-w-0 max-w-full max-h-[50vh] overflow-auto p-3",
        codeVariants({ variant }),
        className,
    )}
>
    <div class="overflow-x-auto">
        <pre
            class="bg-transparent! m-0! p-0! whitespace-pre-wrap break-all">{@html codeState.highlighted}</pre>
    </div>

    {@render children?.()}
</div>
