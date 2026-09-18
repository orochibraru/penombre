<script lang="ts">
	import { DownloadIcon, FolderIcon, UsersIcon } from "@lucide/svelte";
	import FileTypeIcon from "#lib/components/file-type-icon.svelte";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import { buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { cn, readableFileSize } from "#lib/utils.js";
	import { resolve } from "$app/paths";

	const { data } = $props();

	$title = m.nav_shared_with_me();

	const permissionLabels: Record<string, string> = {
		read: m.permission_read(),
		write: m.permission_write(),
		admin: m.permission_admin(),
	};
</script>

<div class="flex flex-col gap-5">
    <div>
        <h2 class="text-xl font-semibold tracking-tight">
            {m.nav_shared_with_me()}
        </h2>
        <p class="text-muted-foreground text-sm">{m.shared_with_me_hint()}</p>
    </div>

    {#if data.sharedWithMe.length === 0}
        <Card.Root class="border-dashed shadow-none">
            <Card.Content
                class="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center"
            >
                <div
                    class="bg-muted flex size-12 items-center justify-center rounded-lg"
                >
                    <UsersIcon class="size-5" />
                </div>
                <p class="text-foreground text-sm font-medium">
                    {m.shared_with_me_empty()}
                </p>
            </Card.Content>
        </Card.Root>
    {:else}
        <div class="flex flex-col gap-2">
            {#each data.sharedWithMe as entry (entry.sharedWithId)}
                <Card.Root
                    class="hover:border-primary/40 gap-0 py-3 transition-colors"
                >
                    <Card.Content
                        class="flex flex-wrap items-center justify-between gap-3 px-4"
                    >
                        <a
                            class="flex min-w-0 items-center gap-3"
                            href={resolve("/(app)/shared-with-me/[share]", {
                                share: entry.sharedWithId,
                            })}
                        >
                            <div
                                class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full"
                            >
                                {#if entry.resourceType === "folder"}
                                    <FolderIcon class="size-4" />
                                {:else}
                                    <FileTypeIcon
                                        category={entry.category}
                                        class="size-4"
                                    />
                                {/if}
                            </div>
                            <div class="min-w-0">
                                <p class="truncate text-sm font-medium">
                                    {entry.name}
                                </p>
                                <div
                                    class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
                                >
                                    <span>
                                        {m.shared_by({ name: entry.owner.name })}
                                    </span>
                                    {#if entry.resourceType === "file"}
                                        <span aria-hidden="true">·</span>
                                        <span class="tabular-nums">
                                            {readableFileSize(entry.size)}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </a>

                        <div class="flex shrink-0 items-center gap-2">
                            <Badge variant="secondary">
                                {permissionLabels[entry.permission] ??
                                    entry.permission}
                            </Badge>
                            <a
                                class={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    }),
                                )}
                                href={resolve("/api/v1/sharings/[id]/download", {
                                    id: entry.sharedWithId,
                                })}
                                download
                            >
                                <DownloadIcon class="size-4" />
                                {m.download()}
                            </a>
                        </div>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>
