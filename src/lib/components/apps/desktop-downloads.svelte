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
	import { Input } from "#lib/components/ui/input/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { assetUrl, RELEASES } from "#lib/release.js";
	import { copyText } from "#lib/utils.js";
	import { page } from "$app/state";

	const GUIDE = "https://orochibraru.com/penombre/docs/desktop";
	const TARGETS = [
		{
			id: "aarch64-apple-darwin",
			system: "macOS (Apple silicon)",
			file: "penombre-sync-aarch64-apple-darwin.dmg",
		},
		{
			id: "x86_64-apple-darwin",
			system: "macOS (Intel)",
			file: "penombre-sync-x86_64-apple-darwin.dmg",
		},
		{
			id: "x86_64-unknown-linux-gnu",
			system: "Linux (x86_64)",
			file: "penombre-sync-x86_64.AppImage",
		},
		{
			id: "x86_64-pc-windows-msvc",
			system: "Windows (x86_64)",
			file: "penombre-sync-x86_64-pc-windows-msvc.exe",
		},
	] as const;
	type Target = (typeof TARGETS)[number];

	let { version }: { version: string } = $props();

	// Browsers do not tell Apple silicon from Intel; the newer is likelier.
	let detected = $state<Target>();
	onMount(() => {
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
	// By id: `detected` is a state proxy, never identical to the entry it wraps.
	const others = $derived(
		TARGETS.filter((target) => target.id !== detected?.id),
	);
	const formula = $derived(
		version.includes("-") ? "penombre-sync-canary" : "penombre-sync",
	);

	async function copyAddress() {
		if (await copyText(page.url.origin)) {
			toast.success(m.copied());
		}
	}
</script>

<div class="flex flex-col gap-4">
    {#if detected}
        <a href={assetUrl(version, detected.file)} class={buttonVariants({ class: "self-start" })}>
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
                href={assetUrl(version, target.file)}
                class="text-primary flex items-center gap-2 text-sm hover:underline"
            >
                <DownloadIcon class="size-4" />
                {target.system}
            </a>
        {/each}
    </div>
    <p class="text-muted-foreground text-sm">{m.desktop_app_requirements()}</p>
    <div class="flex flex-col gap-1.5">
        <p class="text-sm font-medium">Homebrew</p>
        <p class="text-muted-foreground text-sm">{m.desktop_app_homebrew_description()}</p>
        <pre
            class="bg-muted overflow-x-auto rounded-md p-3 font-mono text-xs">brew install orochibraru/tap/{formula}
brew services start {formula}</pre>
    </div>
    <div class="flex flex-col gap-1.5">
        <p class="text-sm font-medium">{m.desktop_app_server_title()}</p>
        <p class="text-muted-foreground text-sm">{m.desktop_app_server_description()}</p>
        <div class="flex gap-2">
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
        </div>
    </div>
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
            href={`${RELEASES}/tag/v${version}`}
            target="_blank"
            rel="noreferrer"
            class={buttonVariants({ variant: "outline", size: "sm" })}
        >
            <ExternalLinkIcon />
            {m.desktop_app_all_releases()}
        </a>
    </div>
</div>
