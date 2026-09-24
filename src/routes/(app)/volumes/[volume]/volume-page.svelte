<script lang="ts">
	import {
		ArrowLeftIcon,
		HardDriveIcon,
		LockIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { untrack } from "svelte";
	import { api, type ObjectList } from "#lib/api/index.js";
	import FileLayout from "#lib/components/file/layout.svelte";
	import ScanBanner from "#lib/components/scan/scan-banner.svelte";
	import ScanControls from "#lib/components/scan/scan-controls.svelte";
	import type { ScanStatus } from "#lib/components/scan/scan-status.js";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { page } from "$app/state";

	interface Props {
		data: {
			volume: { name: string; label: string; readOnly: boolean };
			files: { data: ObjectList | undefined; err: unknown };
			scanning: boolean;
			title?: string;
			preferences?: Record<string, unknown>;
		};
	}

	const { data }: Props = $props();

	// The same header serves the mount's listings and its trash; the trash is
	// a leaf, so from there the button goes back rather than deeper.
	const inTrash = $derived(page.url.pathname.endsWith("/trash"));

	$effect(() => {
		title.set(data.title ?? data.volume.label);
	});

	let status: ScanStatus = $state(untrack(() => ({ scanning: data.scanning })));

	async function rescan(mode: "quick" | "full") {
		const { error } = await api.POST("/api/v1/volumes/{name}/scan", {
			params: { path: { name: data.volume.name } },
			body: { mode },
		});
		return !error;
	}
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
        <HardDriveIcon class="text-primary size-4" />
        <h1 class="text-lg font-semibold tracking-tight">
            {data.volume.label}
        </h1>
        {#if data.volume.readOnly}
            <Badge variant="secondary">
                <LockIcon />
                {m.volume_read_only()}
            </Badge>
        {/if}
        <ScanControls
            eventsUrl={`/api/v1/volumes/${encodeURIComponent(data.volume.name)}/scan/events`}
            {rescan}
            bind:status
        />
        <Button
            variant="outline"
            size="sm"
            href={inTrash
                ? `/volumes/${data.volume.name}`
                : `/volumes/${data.volume.name}/trash`}
        >
            {#if inTrash}
                <ArrowLeftIcon />
                {data.volume.label}
            {:else}
                <Trash2Icon />
                {m.nav_trash()}
            {/if}
        </Button>
    </div>

    <ScanBanner {status} />

    <FileLayout data={data.files} preferences={data.preferences} />
</div>
