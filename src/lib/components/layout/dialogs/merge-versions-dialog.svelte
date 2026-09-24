<script lang="ts">
	import {
		ArrowRightIcon,
		CalendarClockIcon,
		FileIcon,
		FileMusicIcon,
		GitMergeIcon,
		SortAscIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api, type ObjectItem } from "#lib/api/index.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as ToggleGroup from "#lib/components/ui/toggle-group/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { mergeVersionsOf, refreshVersions } from "#lib/store/versions.js";
	import { type MergeOrder, mergedName, mergeOrder } from "#lib/versions.js";
	import { invalidate } from "$app/navigation";

	let loading = $state(false);
	let name = $state("");
	let order: MergeOrder = $state("date");
	const nameId = $props.id();

	const open = $derived($mergeVersionsOf !== null);
	/** Oldest first, exactly as the server will keep them: the last stays. */
	const ordered = $derived(mergeOrder($mergeVersionsOf?.items ?? [], order));

	// Writes only `name`: reading back what it writes looped until Svelte gave up.
	$effect(() => {
		const request = $mergeVersionsOf;
		if (request) {
			name = mergedName(
				mergeOrder(request.items, "date").map(
					(item) => item.metadata.name || item.key,
				),
			);
		}
	});

	const label = (item: ObjectItem) => item.metadata.name || item.key;
	const when = (item: ObjectItem) =>
		item.updatedAt
			? new Date(item.updatedAt).toLocaleString(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				})
			: "";

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		const { data, error } = await api.POST("/api/v1/storage/versions/merge", {
			body: {
				ids: ordered.map((item) => item.metadata.id),
				name: name.trim() || undefined,
			},
		});
		loading = false;
		if (error || !data?.data) {
			toast.error(
				(error as { message?: string } | undefined)?.message ??
					m.versions_merge_error(),
			);
			return;
		}
		toast.success(m.versions_merged({ count: String(ordered.length) }));
		$mergeVersionsOf?.onmerged();
		mergeVersionsOf.set(null);
		await invalidate("app:files");
		await refreshVersions(data.data.id);
	}
</script>

<ResponsiveDialog
    bind:open={() => open, (value) => !value && mergeVersionsOf.set(null)}
    bind:loading
    title={m.versions_merge_title()}
    description={m.versions_merge_description()}
    submitLabel={m.versions_merge_submit()}
    loadingLabel={m.versions_merging()}
    form={{ onsubmit: handleSubmit }}
>
    <div class="flex min-w-0 flex-col gap-5 pt-1">
        <div class="grid gap-2">
            <Label for={nameId}>{m.versions_merge_name()}</Label>
            <div class="relative">
                <GitMergeIcon
                    class="text-primary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input id={nameId} class="pl-9" bind:value={name} required />
            </div>
        </div>

        <div class="grid gap-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-medium">{m.versions_merge_order()}</span>
                <ToggleGroup.Root
                    type="single"
                    variant="outline"
                    size="sm"
                    value={order}
                    onValueChange={(value) => {
                        if (value) {
                            order = value as MergeOrder;
                        }
                    }}
                >
                    <ToggleGroup.Item value="date" class="gap-1.5 px-3">
                        <CalendarClockIcon class="size-4" />
                        {m.versions_merge_by_date()}
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="name" class="gap-1.5 px-3">
                        <SortAscIcon class="size-4" />
                        {m.versions_merge_by_name()}
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>

            <ol
                class="bg-muted/40 max-h-72 min-w-0 divide-y overflow-y-auto rounded-lg border"
                aria-label={m.versions_merge_preview()}
            >
                {#each ordered as item, index (item.metadata.id)}
                    {@const Icon =
                        item.metadata.category === "MUSIC" ? FileMusicIcon : FileIcon}
                    {@const last = index === ordered.length - 1}
                    <li
                        class={[
                            "flex min-w-0 items-center gap-3 px-3 py-2.5 text-sm",
                            last && "bg-primary/10",
                        ]}
                    >
                        <Badge
                            variant={last ? "default" : "outline"}
                            class="w-14 shrink-0 justify-center tabular-nums"
                        >
                            {last ? m.versions_latest() : `v${index + 1}`}
                        </Badge>
                        <Icon class="text-primary size-4 shrink-0" />
                        <div class="flex min-w-0 flex-1 flex-col">
                            {#if last && name.trim() && name.trim() !== label(item)}
                                <span class="flex min-w-0 items-center gap-1.5">
                                    <span class="text-muted-foreground truncate line-through">
                                        {label(item)}
                                    </span>
                                    <ArrowRightIcon class="size-3 shrink-0" />
                                    <span class="truncate font-medium">{name.trim()}</span>
                                </span>
                            {:else}
                                <span class={["truncate", last && "font-medium"]}>
                                    {label(item)}
                                </span>
                            {/if}
                            <span class="text-muted-foreground text-xs">{when(item)}</span>
                        </div>
                    </li>
                {/each}
            </ol>
        </div>
    </div>
</ResponsiveDialog>
