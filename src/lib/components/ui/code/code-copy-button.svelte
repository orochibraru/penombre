<script lang="ts">
	import type { CodeCopyButtonProps } from "#lib/components/ui/code/types.js";
	import { CopyButton } from "#lib/components/ui/copy-button/index.js";
	import { cn } from "#lib/utils/utils.js";
	import { useCodeCopyButton } from "./code.svelte.js";

	let { class: className }: CodeCopyButtonProps = $props();

	const copyButton = useCodeCopyButton();
</script>

<CopyButton class={cn('absolute top-2 right-2', className)} text={copyButton.code} />
