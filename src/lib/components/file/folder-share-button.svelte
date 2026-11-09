<script lang="ts">
	import { page } from "$app/state";
	import { ShareIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	import { api, type ObjectItem } from "#lib/api/index.js";
	import ShareDialog from "#lib/components/layout/dialogs/share-dialog.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { m } from "#lib/paraglide/messages.js";

	/** Shares the folder on screen, without going back up to its row. */
	const {
		currentFolder,
		isTrash,
	}: { currentFolder: string; isTrash: boolean } = $props();

	// A recipient works inside a shared folder; re-sharing it is the owner's.
	const show = $derived(!!currentFolder && !isTrash && !page.data.share);

	let open = $state(false);
	let item: ObjectItem | null = $state(null);
	let loading = $state(false);

	async function share() {
		loading = true;
		const { data, error } = await api.GET(
			"/api/v1/storage/folder/{path}/meta",
			{ params: { path: { path: currentFolder } } },
		);
		loading = false;
		// The meta route's schema is untyped.
		const meta = data?.data as ObjectItem["metadata"] | undefined;
		if (error || !meta?.id) {
			toast.error(m.toast_share_create_error());
			return;
		}
		item = {
			key: `${currentFolder.split("/").pop()}/`,
			size: 0,
			updatedAt: new Date().toISOString(),
			metadata: meta,
			type: "folder",
		};
		open = true;
	}
</script>

{#if show}
	<Button
		variant="outline"
		title={m.share_this_folder()}
		disabled={loading}
		onclick={share}
	>
		<ShareIcon class="h-4 w-4" />
		<span class="sr-only">{m.share_this_folder()}</span>
	</Button>
	<ShareDialog bind:open bind:item />
{/if}
