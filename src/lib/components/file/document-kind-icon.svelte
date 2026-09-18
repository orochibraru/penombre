<script lang="ts" module>
	import { FileTextIcon, PresentationIcon, TableIcon } from "@lucide/svelte";
	import type { DocumentKind } from "#lib/documents.js";

	/** One icon per editable kind, so a deck never renders as a page. */
	export const DOCUMENT_KIND_ICONS = {
		document: FileTextIcon,
		sheet: TableIcon,
		presentation: PresentationIcon,
	} satisfies Record<DocumentKind, typeof FileTextIcon>;
</script>

<script lang="ts">
    import { DOCUMENT_KINDS } from "#lib/documents.js";
    import { cn } from "#lib/utils.js";

    let {
        kind,
        class: className,
    }: { kind: DocumentKind; class?: string } = $props();

    const Icon = $derived(DOCUMENT_KIND_ICONS[kind]);
</script>

<Icon class={cn(DOCUMENT_KINDS[kind].color, className)} />
