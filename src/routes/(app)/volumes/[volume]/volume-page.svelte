<script lang="ts">
	import {
		ArrowLeftIcon,
		HardDriveIcon,
		LockIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";
	import type { ObjectList } from "$lib/api";
	import FileLayout from "$lib/components/file/layout.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

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

	/**
	 * While a pass is running, refresh so files appear as they are found — and
	 * so the banner goes when it ends. The server keeps a cooldown, so a
	 * refresh cannot start a new one.
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
        <Button
            variant="outline"
            size="sm"
            class="ml-auto"
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

    {#if data.scanning}
        <Alert.Root>
            <Spinner />
            <Alert.Title>{m.volume_scanning()}</Alert.Title>
            <Alert.Description>
                {m.volume_scanning_description()}
            </Alert.Description>
        </Alert.Root>
    {/if}

    <FileLayout data={data.files} preferences={data.preferences} />
</div>
