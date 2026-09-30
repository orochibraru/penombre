<script lang="ts">
	import { BookOpenIcon, DownloadIcon, QrCodeIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { assetUrl, phoneSystem } from "#lib/release.js";
	import { appsDialogOpen, connectMobileOpen } from "#lib/store/apps.js";

	const GUIDE = "https://orochibraru.com/penombre/docs/mobile";
	const BUILDS = {
		android: { file: "penombre-android.apk", label: () => m.apps_android() },
		ios: { file: "penombre-ios-unsigned.ipa", label: () => m.apps_ios() },
	} as const;

	let { version }: { version: string } = $props();

	/** The phone this page is open on leads; a computer shows both alike. */
	let mine = $state<"android" | "ios">();
	onMount(() => {
		mine = phoneSystem(navigator.userAgent);
	});
	/** One dialog at a time: the code takes this one's place. */
	function connect() {
		appsDialogOpen.set(false);
		connectMobileOpen.set(true);
	}

	const order = $derived(
		mine === "ios"
			? (["ios", "android"] as const)
			: (["android", "ios"] as const),
	);
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
        {#each order as system (system)}
            <a
                href={assetUrl(version, BUILDS[system].file)}
                class={system === mine
                    ? buttonVariants({ class: "self-start" })
                    : "text-primary flex items-center gap-2 text-sm hover:underline"}
            >
                <DownloadIcon class="size-4" />
                {BUILDS[system].label()}
            </a>
        {/each}
    </div>
    <p class="text-muted-foreground text-sm">{m.apps_mobile_note()}</p>
    <div class="flex flex-wrap gap-2">
        <Button size="sm" onclick={connect}>
            <QrCodeIcon />
            {m.mobile_connect()}
        </Button>
        <a
            href={GUIDE}
            target="_blank"
            rel="noreferrer"
            class={buttonVariants({ variant: "outline", size: "sm" })}
        >
            <BookOpenIcon />
            {m.desktop_app_guide()}
        </a>
    </div>
</div>
