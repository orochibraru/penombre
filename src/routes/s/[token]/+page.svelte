<script lang="ts">
	import {
		ClockAlertIcon,
		DownloadIcon,
		FolderIcon,
		LockIcon,
		LogInIcon,
		PlayIcon,
	} from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import FileTypeIcon from "$lib/components/file-type-icon.svelte";
	import ShareMedia from "$lib/components/share-media.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { cn, filesCountLabel, readableFileSize } from "$lib/utils";

	const { data, form } = $props();

	$effect(() => {
		title.set(
			data.state === "ok" ? (data.name ?? m.shared_link()) : m.shared_link(),
		);
	});

	const files = $derived(data.files ?? []);

	/** Which row in a folder share is currently expanded, if any. */
	let openPreview = $state<string | null>(null);

	/** Mirrors ShareMedia's own test, so a button only appears if it will play. */
	const previewable = (file: (typeof files)[number]) => {
		const type = file.metadata.contentType ?? "";
		return (
			type.startsWith("image/") ||
			type.startsWith("video/") ||
			type.startsWith("audio/")
		);
	};
	const totalSize = $derived(
		files.reduce((sum, file) => sum + (file.size ?? 0), 0),
	);
</script>

<!--
  A capability URL is often the only page an outside visitor ever sees of this
  instance, so it stands alone: centred, no app chrome, no nav to nowhere.
-->
<div
    class="from-background to-muted/40 flex min-h-screen flex-col items-center bg-linear-to-b px-4 py-10 sm:py-16"
>
    <div class="w-full max-w-2xl">
        <p
            class="text-muted-foreground mb-6 text-center text-sm font-medium tracking-wide"
        >
            {data.appName}
        </p>

        {#if data.state === "password"}
            <Card.Root class="shadow-lg">
                <Card.Header class="items-center text-center">
                    <div
                        class="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-lg"
                    >
                        <LockIcon class="size-5" />
                    </div>
                    <Card.Title class="text-xl">
                        {m.share_password_title()}
                    </Card.Title>
                    <Card.Description>
                        {m.share_password_description()}
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                    <form
                        method="POST"
                        action="?/unlock"
                        use:enhance
                        class="mx-auto flex max-w-sm flex-col gap-3"
                    >
                        <Input
                            required
                            type="password"
                            name="password"
                            autocomplete="off"
                            placeholder={m.password()}
                            aria-invalid={!!form?.error}
                            class="text-center"
                        />
                        {#if form?.error}
                            <p class="text-destructive text-center text-xs">
                                {form.error}
                            </p>
                        {/if}
                        <Button type="submit" class="w-full">
                            {m.unlock()}
                        </Button>
                    </form>
                </Card.Content>
            </Card.Root>
        {:else if data.state === "expired" || data.state === "auth"}
            {@const expired = data.state === "expired"}
            <Card.Root class="shadow-lg">
                <Card.Header class="items-center text-center">
                    <div
                        class={cn(
                            "mx-auto mb-2 flex size-12 items-center justify-center rounded-lg",
                            expired
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary",
                        )}
                    >
                        {#if expired}
                            <ClockAlertIcon class="size-5" />
                        {:else}
                            <LogInIcon class="size-5" />
                        {/if}
                    </div>
                    <Card.Title class="text-xl">
                        {expired
                            ? m.share_expired_title()
                            : m.share_auth_title()}
                    </Card.Title>
                    <Card.Description>
                        {expired
                            ? m.share_expired_description()
                            : m.share_auth_description()}
                    </Card.Description>
                </Card.Header>
                {#if !expired}
                    <Card.Content class="flex justify-center">
                        <a
                            class={buttonVariants({ variant: "default" })}
                            href="{resolve('/auth/sign-in')}?redirect={encodeURIComponent(
                            resolve('/s/[token]', { token: data.token }),
                        )}"
                        >
                            {m.sign_in()}
                        </a>
                    </Card.Content>
                {/if}
            </Card.Root>
        {:else}
            <Card.Root class="overflow-hidden shadow-lg">
                <Card.Header
                    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="flex min-w-0 items-center gap-3">
                        <div
                            class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg"
                        >
                            {#if data.resourceType === "folder"}
                                <FolderIcon class="size-5" />
                            {:else}
                                <FileTypeIcon
                                    category={files[0]?.metadata.category}
                                    class="size-5"
                                />
                            {/if}
                        </div>
                        <div class="min-w-0">
                            <Card.Title class="truncate text-lg">
                                {data.name}
                            </Card.Title>
                            <Card.Description class="tabular-nums">
                                {#if data.resourceType === "folder"}
                                    {filesCountLabel(
                                        files.length,
                                        readableFileSize(totalSize),
                                    )}
                                {:else}
                                    {readableFileSize(files[0]?.size ?? 0)}
                                {/if}
                            </Card.Description>
                        </div>
                    </div>

                    <a
                        class={cn(
                            buttonVariants({ variant: "default" }),
                            "shrink-0",
                        )}
                        href={resolve("/s/[token]/download", { token: data.token })}
                        download
                    >
                        <DownloadIcon />
                        {data.resourceType === "folder"
                            ? m.download_as_zip()
                            : m.download()}
                    </a>
                </Card.Header>

                {#if data.resourceType === "file" && files[0]}
                    <ShareMedia
                        src="{resolve('/s/[token]/download', {
                            token: data.token,
                        })}?inline"
                        category={files[0].metadata.category}
                        contentType={files[0].metadata.contentType}
                        name={files[0].metadata.name}
                    />
                {/if}

                {#if data.resourceType === "folder"}
                    <Card.Content class="px-0">
                        <ul class="divide-border divide-y border-t">
                            {#each files as file (file.key)}
                                <li
                                    class="hover:bg-muted/50 group flex items-center justify-between gap-3 px-6 py-2.5 transition-colors"
                                >
                                    <div
                                        class="flex min-w-0 items-center gap-2.5"
                                    >
                                        <FileTypeIcon
                                            category={file.metadata.category}
                                            class="text-muted-foreground size-4 shrink-0"
                                        />
                                        <span class="truncate text-sm">
                                            {file.metadata.name}
                                        </span>
                                    </div>
                                    <div
                                        class="flex shrink-0 items-center gap-2"
                                    >
                                        <span
                                            class="text-muted-foreground text-xs tabular-nums"
                                        >
                                            {readableFileSize(file.size ?? 0)}
                                        </span>
                                        {#if previewable(file)}
                                            <button
                                                type="button"
                                                class={cn(
                                                    buttonVariants({
                                                        variant: "ghost",
                                                        size: "icon",
                                                    }),
                                                    "text-muted-foreground hover:text-foreground size-8 transition-colors",
                                                )}
                                                aria-label={m.share_preview()}
                                                aria-expanded={openPreview ===
                                                    file.metadata.id}
                                                onclick={() =>
                                                    (openPreview =
                                                        openPreview ===
                                                        file.metadata.id
                                                            ? null
                                                            : file.metadata.id)}
                                            >
                                                <PlayIcon class="size-4" />
                                            </button>
                                        {/if}
                                        <a
                                            class={cn(
                                                buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon",
                                                }),
                                                // Always visible: a hover-only control is unreachable on touch.
                                                "text-muted-foreground hover:text-foreground size-8 transition-colors",
                                            )}
                                            href="{resolve('/s/[token]/download', {
                                                token: data.token,
                                            })}?file={file.metadata.id}"
                                            aria-label={m.download()}
                                            download
                                        >
                                            <DownloadIcon class="size-4" />
                                        </a>
                                    </div>
                                </li>
                                {#if openPreview === file.metadata.id}
                                    <li class="bg-muted/20">
                                        <ShareMedia
                                            src="{resolve(
                                                '/s/[token]/download',
                                                { token: data.token },
                                            )}?inline&file={file.metadata.id}"
                                            category={file.metadata.category}
                                            contentType={file.metadata
                                                .contentType}
                                            name={file.metadata.name}
                                        />
                                    </li>
                                {/if}
                            {:else}
                                <li
                                    class="text-muted-foreground px-6 py-8 text-center text-sm"
                                >
                                    {m.folder_empty()}
                                </li>
                            {/each}
                        </ul>
                    </Card.Content>
                {/if}
            </Card.Root>
        {/if}

        {#if data.state === "ok" && data.expiresAt}
            <p
                class="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-xs"
            >
                <ClockAlertIcon class="size-3.5" />
                {m.expires_at({
                    date: new Date(data.expiresAt).toLocaleString(),
                })}
            </p>
        {/if}
    </div>
</div>
