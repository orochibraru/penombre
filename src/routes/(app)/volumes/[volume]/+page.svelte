<script lang="ts">
	import { HardDriveIcon, InfoIcon, LockIcon } from "@lucide/svelte";
	import { invalidate } from "$app/navigation";
	import DataTable from "$lib/components/file/wrapper.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	const { data } = $props();

	$effect(() => {
		title.set(data.volume.label);
	});

	/**
	 * While a scan is running, refresh the listing so files appear as they are
	 * found — and so the banner goes away when the pass ends. The server keeps
	 * a cooldown, so a refresh does not start a new scan.
	 */
	$effect(() => {
		if (!data.scanning) {
			return;
		}
		const timer = setInterval(() => void invalidate("app:files"), 3000);
		return () => clearInterval(timer);
	});
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
        {#if data.scanning}
            <Badge variant="secondary">
                <Spinner size={3} />
                {m.volume_scanning()}
            </Badge>
        {/if}
    </div>

    {#if data.hidden}
        <!-- The mount has files nobody can see: name the variable that fixes it. -->
        <Alert.Root>
            <InfoIcon />
            <Alert.Title>{m.volume_per_user_title()}</Alert.Title>
            <Alert.Description>
                {m.volume_per_user_description()}
                <code class="font-mono">{data.sharedVariable}=true</code>
                {m.volume_per_user_restart()}
            </Alert.Description>
        </Alert.Root>
    {:else if data.scanning}
        <Alert.Root>
            <Spinner />
            <Alert.Title>{m.volume_scanning()}</Alert.Title>
            <Alert.Description>{m.volume_scanning_description()}</Alert.Description>
        </Alert.Root>
    {/if}

    <DataTable data={data.files} />
</div>
