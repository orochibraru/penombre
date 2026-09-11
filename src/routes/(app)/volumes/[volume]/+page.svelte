<script lang="ts">
	import { HardDriveIcon, LockIcon } from "@lucide/svelte";
	import DataTable from "$lib/components/file/wrapper.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	const { data } = $props();

	$effect(() => {
		title.set(data.volume.label);
	});
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
        <HardDriveIcon class="text-muted-foreground size-4" />
        <h1 class="text-lg font-semibold tracking-tight">
            {data.volume.label}
        </h1>
        {#if data.volume.readOnly}
            <Badge variant="secondary">
                <LockIcon />
                {m.volume_read_only()}
            </Badge>
        {/if}
    </div>

    <DataTable data={data.files} />
</div>
