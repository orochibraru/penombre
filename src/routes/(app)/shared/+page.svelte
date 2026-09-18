<script lang="ts">
	import {
		CopyIcon,
		FolderIcon,
		Link2Icon,
		Link2OffIcon,
		LockIcon,
		UserCheckIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import FileTypeIcon from "#lib/components/file-type-icon.svelte";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { cn, downloadsCountLabel } from "#lib/utils.js";
	import { invalidate } from "$app/navigation";

	const { data } = $props();

	$title = m.nav_shared();

	let copiedId: string | null = $state(null);
	let revokingId: string | null = $state(null);

	async function copy(share: { id: string; token: string }) {
		await navigator.clipboard.writeText(
			`${window.location.origin}/s/${share.token}`,
		);
		copiedId = share.id;
		toast.success(m.toast_link_copied());
		setTimeout(() => {
			if (copiedId === share.id) {
				copiedId = null;
			}
		}, 2000);
	}

	async function revoke(id: string) {
		revokingId = id;
		const { error } = await api.DELETE("/api/v1/shares/{id}", {
			params: { path: { id } },
		});
		revokingId = null;
		if (error) {
			toast.error(m.toast_share_revoke_error());
			return;
		}
		toast.success(m.toast_share_revoked());
		await invalidate("app:shares");
	}

	/** An expiry inside this window gets highlighted as running out. */
	const SOON_MS = 3 * 24 * 60 * 60 * 1000;

	/** How a link's expiry should read: dead, running out, or fine. */
	function expiry(iso: string | null) {
		if (!iso) {
			return { state: "never" as const, label: m.share_expiry_never() };
		}
		const remaining = new Date(iso).getTime() - Date.now();
		if (remaining <= 0) {
			return { state: "expired" as const, label: m.share_expired() };
		}
		return {
			state: remaining < SOON_MS ? ("soon" as const) : ("ok" as const),
			label: m.expires_at({ date: new Date(iso).toLocaleDateString() }),
		};
	}
</script>

<div class="flex flex-col gap-5">
    <div>
        <h2 class="text-xl font-semibold tracking-tight">{m.nav_shared()}</h2>
        <p class="text-muted-foreground text-sm">{m.shared_description()}</p>
    </div>

        {#if data.shares.length === 0}
            <Card.Root class="border-dashed shadow-none">
                <Card.Content
                    class="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center"
                >
                    <div
                        class="bg-muted flex size-12 items-center justify-center rounded-lg"
                    >
                        <Link2Icon class="size-5" />
                    </div>
                    <div>
                        <p class="text-foreground text-sm font-medium">
                            {m.no_shares()}
                        </p>
                        <p class="mt-1 text-xs">{m.no_shares_hint()}</p>
                    </div>
                </Card.Content>
            </Card.Root>
        {:else}
            <div class="flex flex-col gap-2">
                {#each data.shares as share (share.id)}
                    {@const exp = expiry(share.expiresAt)}
                    <Card.Root class="gap-0 py-3 transition-colors hover:border-primary/40">
                        <Card.Content
                            class="flex flex-wrap items-center justify-between gap-3 px-4"
                        >
                            <div class="flex min-w-0 items-center gap-3">
                                <div
                                    class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full"
                                >
                                    {#if share.resourceType === "folder"}
                                        <FolderIcon class="size-4" />
                                    {:else}
                                        <FileTypeIcon class="size-4" />
                                    {/if}
                                </div>
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-medium">
                                        {share.resourceName}
                                    </p>
                                    <div
                                        class="mt-1 flex flex-wrap items-center gap-1.5"
                                    >
                                        {#if exp.state === "expired"}
                                            <Badge
                                                variant="outline"
                                                class="border-destructive/40 bg-destructive/10 text-destructive"
                                            >
                                                {exp.label}
                                            </Badge>
                                        {:else}
                                            <span
                                                class={cn(
                                                    "text-muted-foreground text-xs tabular-nums",
                                                    exp.state === "soon" &&
                                                        "text-destructive font-medium",
                                                )}
                                            >
                                                {exp.label}
                                            </span>
                                        {/if}
                                        <span
                                            class="text-muted-foreground text-xs"
                                            aria-hidden="true">·</span
                                        >
                                        <span
                                            class="text-muted-foreground text-xs tabular-nums"
                                        >
                                            {downloadsCountLabel(
                                                share.downloadCount,
                                            )}
                                        </span>
                                        {#if share.hasPassword}
                                            <Badge variant="secondary">
                                                <LockIcon />
                                                {m.share_badge_password()}
                                            </Badge>
                                        {/if}
                                        {#if share.requiresAuth}
                                            <Badge variant="secondary">
                                                <UserCheckIcon />
                                                {m.share_badge_signin()}
                                            </Badge>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="flex shrink-0 items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={exp.state === "expired"}
                                    onclick={() => copy(share)}
                                >
                                    <CopyIcon class="size-4" />
                                    {copiedId === share.id
                                        ? m.copied()
                                        : m.copy_link()}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="text-muted-foreground hover:text-destructive"
                                    loading={revokingId === share.id}
                                    onclick={() => revoke(share.id)}
                                >
                                    <Link2OffIcon class="size-4" />
                                    {m.revoke()}
                                </Button>
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/each}
            </div>
        {/if}
</div>
