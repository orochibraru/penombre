<script lang="ts">
	import {
		ArrowRightIcon,
		CalendarClockIcon,
		FileIcon,
		FileMusicIcon,
		GitMergeIcon,
		HistoryIcon,
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
	import {
		loadVersions,
		mergeVersionsOf,
		refreshVersions,
	} from "#lib/store/versions.js";
	import {
		type ListedVersion,
		type MergeOrder,
		mergedName,
		mergeOrder,
		sortTakes,
	} from "#lib/versions.js";
	import { invalidate } from "$app/navigation";

	let loading = $state(false);
	let name = $state("");
	let order: MergeOrder = $state("date");
	const nameId = $props.id();

	const open = $derived($mergeVersionsOf !== null);
	const files = $derived(mergeOrder($mergeVersionsOf?.items ?? [], order));
	/** The file that stays: the last one in the chosen order. */
	const target = $derived(files.at(-1));

	// Its own history takes part: an older take merged in lands before it.
	let history: ListedVersion[] = $state([]);
	$effect(() => {
		const id = target?.metadata.id;
		history = [];
		if (id) {
			void loadVersions(id).then((versions) => {
				if (target?.metadata.id === id) {
					history = versions ?? [];
				}
			});
		}
	});

	interface Entry {
		/** A file id, or `v:<id>` for a version the target already has. */
		token: string;
		name: string;
		at?: string;
		item?: ObjectItem;
	}

	/** Oldest first, exactly as the server will keep them; the target follows. */
	const entries: Entry[] = $derived(
		sortTakes(
			[
				...history.map((version) => ({
					token: `v:${version.id}`,
					name: version.name ?? (target ? label(target) : ""),
					at: version.createdAt,
				})),
				...files.slice(0, -1).map((item) => ({
					token: item.metadata.id,
					name: label(item),
					at: item.updatedAt,
					item,
				})),
			],
			order,
		),
	);

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
	const when = (at?: string) =>
		at
			? new Date(at).toLocaleString(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				})
			: "";

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		const { data, error } = await api.POST("/api/v1/storage/versions/merge", {
			body: {
				ids: [
					...entries.map((entry) => entry.token),
					target?.metadata.id ?? "",
				],
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
		toast.success(m.versions_merged({ count: String(files.length) }));
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
                {#each entries as entry, index (entry.token)}
                    {@const Icon = !entry.item
                        ? HistoryIcon
                        : entry.item.metadata.category === "MUSIC"
                          ? FileMusicIcon
                          : FileIcon}
                    <li class="flex min-w-0 items-center gap-3 px-3 py-2.5 text-sm">
                        <Badge
                            variant="outline"
                            class="w-14 shrink-0 justify-center tabular-nums"
                        >
                            v{index + 1}
                        </Badge>
                        <Icon class="text-primary size-4 shrink-0" />
                        <div class="flex min-w-0 flex-1 flex-col">
                            <span class="truncate">{entry.name}</span>
                            <span class="text-muted-foreground text-xs">
                                {when(entry.at)}
                            </span>
                        </div>
                    </li>
                {/each}
                {#if target}
                    {@const Icon =
                        target.metadata.category === "MUSIC" ? FileMusicIcon : FileIcon}
                    <li
                        class="bg-primary/10 flex min-w-0 items-center gap-3 px-3 py-2.5 text-sm"
                    >
                        <Badge class="w-14 shrink-0 justify-center">
                            {m.versions_latest()}
                        </Badge>
                        <Icon class="text-primary size-4 shrink-0" />
                        <div class="flex min-w-0 flex-1 flex-col">
                            {#if name.trim() && name.trim() !== label(target)}
                                <span class="flex min-w-0 items-center gap-1.5">
                                    <span class="text-muted-foreground truncate line-through">
                                        {label(target)}
                                    </span>
                                    <ArrowRightIcon class="size-3 shrink-0" />
                                    <span class="truncate font-medium">{name.trim()}</span>
                                </span>
                            {:else}
                                <span class="truncate font-medium">{label(target)}</span>
                            {/if}
                            <span class="text-muted-foreground text-xs">
                                {when(target.updatedAt)}
                            </span>
                        </div>
                    </li>
                {/if}
            </ol>
        </div>
    </div>
</ResponsiveDialog>
