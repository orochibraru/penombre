<script lang="ts">
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { TEMPLATE_IDS } from "#lib/slides/templates/index.js";
	import type { SlidesEditor } from "./state.svelte.js";
	import TemplateGallery from "./template-gallery.svelte";

	/** Another template for a deck that exists: its master and layouts replaced, the text kept. */
	let {
		open = $bindable(false),
		editor,
	}: { open: boolean; editor: SlidesEditor } = $props();

	let selected = $state(TEMPLATE_IDS[0] ?? "midnight");

	$effect(() => {
		if (open && editor.deck.template) {
			selected = editor.deck.template;
		}
	});
</script>

<ResponsiveDialog
	bind:open
	title={m.slides_change_theme()}
	description={m.slides_change_theme_hint()}
	size="lg"
	submitLabel={m.slides_apply_theme()}
	bodyClass="max-h-[70vh]"
	onsubmit={() => {
		editor.useTemplate(selected);
		open = false;
	}}
>
	<TemplateGallery bind:selected />
</ResponsiveDialog>
