<script lang="ts">
	import { ChevronDownIcon, RefreshCwIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as ButtonGroup from "#lib/components/ui/button-group/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { invalidate } from "$app/navigation";
	import type { ScanStatus } from "./scan-status";

	interface Props {
		/** The scan's event stream. */
		eventsUrl: string;
		/** Starts a pass; false when the request failed. */
		rescan: (mode: "quick" | "full") => Promise<boolean>;
		status: ScanStatus;
	}

	let { eventsUrl, rescan, status = $bindable() }: Props = $props();

	const scanning = $derived(status.scanning);

	// Live over SSE rather than polled: the step and the file being read
	// change many times a second. Reopened per stream, closed on leaving.
	$effect(() => {
		const source = new EventSource(eventsUrl);
		source.onmessage = (message) => {
			const next = JSON.parse(message.data) as ScanStatus;
			if (status.scanning && !next.scanning) {
				void invalidate("app:files");
			}
			status = next;
		};
		return () => source.close();
	});

	// Files appear as they are found, not only when the pass ends.
	$effect(() => {
		if (!scanning) {
			return;
		}
		const timer = setInterval(() => void invalidate("app:files"), 3000);
		return () => clearInterval(timer);
	});

	let requesting = $state(false);

	async function start(mode: "quick" | "full") {
		requesting = true;
		const ok = await rescan(mode);
		requesting = false;
		if (!ok) {
			toast.error(m.volume_rescan_error());
		}
	}
</script>

{#if scanning}
    <Badge variant="secondary">
        <Spinner size={3} />
        {m.volume_scanning()}
    </Badge>
{/if}
<ButtonGroup.Root class="ml-auto">
    <Button
        variant="outline"
        size="sm"
        disabled={scanning || requesting}
        onclick={() => start("quick")}
    >
        <RefreshCwIcon class={scanning ? "animate-spin" : ""} />
        {m.volume_rescan()}
    </Button>
    <DropdownMenu.Root>
        <DropdownMenu.Trigger disabled={scanning || requesting}>
            {#snippet child({ props })}
                <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="size-8"
                    aria-label={m.volume_rescan_options()}
                >
                    <ChevronDownIcon />
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-64">
            <DropdownMenu.Item
                class="flex-col items-start gap-0.5"
                onclick={() => start("quick")}
            >
                <span class="font-medium">{m.volume_scan_quick()}</span>
                <span class="text-muted-foreground text-xs">
                    {m.volume_scan_quick_description()}
                </span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
                class="flex-col items-start gap-0.5"
                onclick={() => start("full")}
            >
                <span class="font-medium">{m.volume_scan_full()}</span>
                <span class="text-muted-foreground text-xs">
                    {m.volume_scan_full_description()}
                </span>
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</ButtonGroup.Root>
