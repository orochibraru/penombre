<script lang="ts">
	import type { ObjectItem } from "#lib/api/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { loadVersions, versionsChanged } from "#lib/store/versions.js";
	import {
		type ListedVersion,
		versionItem,
		versionLabel,
	} from "#lib/versions.js";
	import { page } from "$app/state";

	/**
	 * Switches what the player or a preview shows between a file and its
	 * earlier versions. Renders nothing for a file without any.
	 */
	const {
		file,
		selected,
		onselect,
	}: {
		/** The file itself, never a version row. */
		file: ObjectItem;
		/** The version on show; null is the current file. */
		selected: string | null;
		onselect: (target: ObjectItem, versionId: string | null) => void;
	} = $props();

	const naming = $derived(page.data.preferences?.versionNaming);
	let versions = $state<ListedVersion[]>([]);

	$effect(() => {
		void $versionsChanged;
		const id = file.metadata.id;
		versions = [];
		if (file.metadata.versionSeq) {
			void loadVersions(id).then((loaded) => {
				if (file.metadata.id === id) {
					versions = loaded ?? [];
				}
			});
		}
	});

	function choose(value: string) {
		const version = versions.find((v) => v.id === value);
		if (version) {
			onselect(versionItem(file, version), version.id);
		} else {
			onselect(file, null);
		}
	}
</script>

{#if versions.length > 0}
    <select
        aria-label={m.versions_switch()}
        value={selected ?? ""}
        onchange={(e) => choose(e.currentTarget.value)}
        class="border-input bg-background h-8 max-w-44 shrink-0 rounded-md border px-2 text-xs"
    >
        <option value="">
            {versionLabel(
                naming,
                (file.metadata.versionSeq ?? 0) + 1,
                file.updatedAt ?? file.metadata.createdAt,
            )} · {m.versions_latest()}
        </option>
        {#each versions as version (version.id)}
            <option value={version.id}>
                {versionLabel(naming, version.seq, version.createdAt)}
            </option>
        {/each}
    </select>
{/if}
