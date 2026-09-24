<script lang="ts">
	import { api } from "#lib/api/index.js";
	import { page } from "$app/state";
	import ScanBanner from "./scan-banner.svelte";
	import ScanControls from "./scan-controls.svelte";
	import type { ScanStatus } from "./scan-status";

	/** Simple mode's drive is a mount like any volume, rescanned the same way. */
	let status: ScanStatus = $state({ scanning: false });

	async function rescan(mode: "quick" | "full") {
		const { error } = await api.POST("/api/v1/library/scan", {
			body: { mode },
		});
		return !error;
	}
</script>

{#if page.data.config?.simpleMode}
    <div class="flex flex-wrap items-center justify-end gap-2">
        <ScanControls eventsUrl="/api/v1/library/scan/events" {rescan} bind:status />
    </div>
    <ScanBanner {status} />
{/if}
