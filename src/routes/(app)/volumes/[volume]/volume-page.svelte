<script lang="ts">
	import {
		ArrowLeftIcon,
		ChevronDownIcon,
		HardDriveIcon,
		LockIcon,
		RefreshCwIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";
	import { api, type ObjectList } from "$lib/api";
	import FileLayout from "$lib/components/file/layout.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Progress } from "$lib/components/ui/progress";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { etaLabel } from "$lib/utils";

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

	/** The event data of `/api/v1/volumes/{name}/scan/events`. */
	interface ScanStatus {
		scanning: boolean;
		step?: {
			phase: "listing" | "folders" | "files" | "cleanup";
			current?: string;
			done: number;
			total: number;
		};
		etaSeconds?: number;
	}

	let status: ScanStatus = $state(untrack(() => ({ scanning: data.scanning })));
	const scanning = $derived(status.scanning);

	// Live over SSE rather than polled: the step and the file being read
	// change many times a second. Reopened per volume, closed on leaving.
	$effect(() => {
		const source = new EventSource(
			`/api/v1/volumes/${encodeURIComponent(data.volume.name)}/scan/events`,
		);
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

	async function rescan(mode: "quick" | "full" = "quick") {
		requesting = true;
		const { error } = await api.POST("/api/v1/volumes/{name}/scan", {
			params: { path: { name: data.volume.name } },
			body: { mode },
		});
		requesting = false;
		if (error) {
			toast.error(m.volume_rescan_error());
		}
	}

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
                onclick={() => rescan("quick")}
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
                        onclick={() => rescan("quick")}
                    >
                        <span class="font-medium">{m.volume_scan_quick()}</span>
                        <span class="text-muted-foreground text-xs">
                            {m.volume_scan_quick_description()}
                        </span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        class="flex-col items-start gap-0.5"
                        onclick={() => rescan("full")}
                    >
                        <span class="font-medium">{m.volume_scan_full()}</span>
                        <span class="text-muted-foreground text-xs">
                            {m.volume_scan_full_description()}
                        </span>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </ButtonGroup.Root>
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

    {#if scanning}
        <Alert.Root>
            <Spinner />
            <Alert.Title>{m.volume_scanning()}</Alert.Title>
            <Alert.Description class="w-full min-w-0">
                <p>{m.volume_scanning_description()}</p>
                <div class="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="font-medium">{phaseLabel}</span>
                    {#if status.etaSeconds !== undefined}
                        <span class="tabular-nums">
                            {m.volume_scan_eta({
                                time: etaLabel(status.etaSeconds),
                            })}
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

    <FileLayout data={data.files} preferences={data.preferences} />
</div>
