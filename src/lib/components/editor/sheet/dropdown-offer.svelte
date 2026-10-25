<script lang="ts">
	import { ListIcon, XIcon } from "@lucide/svelte";
	import { m } from "#lib/paraglide/messages.js";
	import type { Dropdowns } from "./dropdowns.svelte.js";

	/**
	 * "Convert to dropdown", hung under the selection's last cell. It asks
	 * nothing: the grid keeps the keys, and a press here never reaches the
	 * grid's own selecting.
	 */
	const { drops }: { drops: Dropdowns } = $props();

	const stop = (event: Event) => event.stopPropagation();
</script>

<div
	class="bg-popover text-popover-foreground absolute inset-s-0 top-full z-15 mt-1 flex items-center rounded-full border text-xs whitespace-nowrap shadow-md"
>
	<button
		type="button"
		tabindex="-1"
		class="hover:bg-muted flex items-center gap-1.5 rounded-s-full py-1.5 ps-3 pe-2"
		onpointerdown={stop}
		ondblclick={stop}
		onclick={(e) => {
			stop(e);
			drops.convert();
		}}
	>
		<ListIcon class="text-primary size-3.5" />
		{m.sheet_dropdown_convert()}
	</button>
	<button
		type="button"
		tabindex="-1"
		class="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center rounded-e-full border-s py-1.5 ps-1.5 pe-2"
		aria-label={m.sheet_dropdown_dismiss()}
		onpointerdown={stop}
		ondblclick={stop}
		onclick={(e) => {
			stop(e);
			drops.dismiss();
		}}
	>
		<XIcon class="size-3.5" />
	</button>
</div>
