<script lang="ts">
	import * as Alert from "#lib/components/ui/alert/index.js";
	import { Progress } from "#lib/components/ui/progress/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { etaLabel } from "#lib/utils.js";
	import type { ScanStatus } from "./scan-status";

	const { status }: { status: ScanStatus } = $props();

	const phaseLabel = $derived.by(() => {
		switch (status.step?.phase) {
			case "files":
				return m.volume_scan_files({
					done: String(status.step.done),
					total: String(status.step.total),
				});
			case "folders":
				return m.volume_scan_folders();
			case "cleanup":
				return m.volume_scan_cleanup();
			default:
				return m.volume_scan_listing();
		}
	});
</script>

{#if status.scanning}
    <Alert.Root>
        <Spinner />
        <Alert.Title>{m.volume_scanning()}</Alert.Title>
        <Alert.Description class="w-full min-w-0">
            <p>{m.volume_scanning_description()}</p>
            <div class="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
                <span class="font-medium">{phaseLabel}</span>
                {#if status.etaSeconds !== undefined}
                    <span class="tabular-nums">
                        {m.volume_scan_eta({ time: etaLabel(status.etaSeconds) })}
                    </span>
                {/if}
            </div>
            {#if status.step?.phase === "files" && status.step.total > 0}
                <Progress
                    value={(status.step.done / status.step.total) * 100}
                    class="h-1.5 w-full"
                />
            {/if}
            {#if status.step?.current}
                <p
                    class="w-full truncate font-mono text-xs"
                    title={status.step.current}
                >
                    {status.step.current}
                </p>
            {/if}
        </Alert.Description>
    </Alert.Root>
{/if}
