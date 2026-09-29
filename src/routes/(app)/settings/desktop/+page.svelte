<script lang="ts">
	import {
		BookOpenIcon,
		CopyIcon,
		DownloadIcon,
		ExternalLinkIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { copyText } from "#lib/utils.js";
	import { page } from "$app/state";

	const RELEASES = "https://github.com/orochibraru/penombre/releases";
	const GUIDE = "https://orochibraru.com/penombre/docs/desktop";
	const TARGETS = [
		{
			id: "aarch64-apple-darwin",
			system: "macOS (Apple silicon)",
			ext: "tar.gz",
		},
		{ id: "x86_64-apple-darwin", system: "macOS (Intel)", ext: "tar.gz" },
		{ id: "x86_64-unknown-linux-gnu", system: "Linux (x86_64)", ext: "tar.gz" },
		{ id: "x86_64-pc-windows-msvc", system: "Windows (x86_64)", ext: "zip" },
	] as const;
	type Target = (typeof TARGETS)[number];

	const { data } = $props();
	const release = $derived(`${RELEASES}/tag/v${data.version}`);
	const formula = $derived(
		data.version.includes("-") ? "penombre-sync-canary" : "penombre-sync",
	);
	const url = (target: Target) =>
		`${RELEASES}/download/v${data.version}/penombre-sync-${target.id}.${target.ext}`;

	// Browsers do not tell Apple silicon from Intel; the newer is likelier.
	let detected = $state<Target>();
	onMount(() => {
		title.set(m.title_settings_desktop());
		const ua = navigator.userAgent;
		const id = /Windows/.test(ua)
			? "x86_64-pc-windows-msvc"
			: /Macintosh/.test(ua)
				? "aarch64-apple-darwin"
				: /Linux/.test(ua) && !/Android/.test(ua)
					? "x86_64-unknown-linux-gnu"
					: undefined;
		detected = TARGETS.find((target) => target.id === id);
	});
	const others = $derived(TARGETS.filter((target) => target !== detected));

	async function copyAddress() {
		if (await copyText(page.url.origin)) {
			toast.success(m.copied());
		}
	}
</script>

<div class="grid gap-4 xl:grid-cols-2">
    <Card.Root>
        <Card.Header>
            <Card.Title>Penombre Sync</Card.Title>
            <Card.Description>
                {m.desktop_app_description({ version: data.version })}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
            {#if detected}
                <a href={url(detected)} class={buttonVariants({ class: "self-start" })}>
                    <DownloadIcon />
                    {m.desktop_app_download({ system: detected.system })}
                </a>
            {/if}
            <div class="flex flex-col gap-1">
                {#if detected}
                    <span class="text-muted-foreground text-sm">
                        {m.desktop_app_other_systems()}
                    </span>
                {/if}
                {#each others as target (target.id)}
                    <a
                        href={url(target)}
                        class="text-primary flex items-center gap-2 text-sm hover:underline"
                    >
                        <DownloadIcon class="size-4" />
                        {target.system}
                    </a>
                {/each}
            </div>
            <p class="text-muted-foreground text-sm">
                {m.desktop_app_requirements()}
            </p>
            <div class="flex flex-wrap gap-2">
                <a
                    href={GUIDE}
                    target="_blank"
                    rel="noreferrer"
                    class={buttonVariants({ variant: "outline", size: "sm" })}
                >
                    <BookOpenIcon />
                    {m.desktop_app_guide()}
                </a>
                <a
                    href={release}
                    target="_blank"
                    rel="noreferrer"
                    class={buttonVariants({ variant: "outline", size: "sm" })}
                >
                    <ExternalLinkIcon />
                    {m.desktop_app_all_releases()}
                </a>
            </div>
        </Card.Content>
    </Card.Root>

    <div class="flex flex-col gap-4">
        <Card.Root>
            <Card.Header>
                <Card.Title>{m.desktop_app_server_title()}</Card.Title>
                <Card.Description>
                    {m.desktop_app_server_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex gap-2">
                <Input readonly value={page.url.origin} class="font-mono" />
                <Button
                    variant="outline"
                    size="icon"
                    aria-label={m.desktop_app_copy_address()}
                    title={m.desktop_app_copy_address()}
                    onclick={copyAddress}
                >
                    <CopyIcon />
                </Button>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Homebrew</Card.Title>
                <Card.Description>
                    {m.desktop_app_homebrew_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <pre
                    class="bg-muted overflow-x-auto rounded-md p-3 font-mono text-sm">brew install orochibraru/tap/{formula}
brew services start {formula}</pre>
            </Card.Content>
        </Card.Root>
    </div>
</div>
