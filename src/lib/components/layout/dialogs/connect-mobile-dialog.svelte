<script lang="ts">
	import { RefreshCwIcon, SmartphoneIcon } from "@lucide/svelte";
	import { renderSVG } from "uqr";
	import { api } from "#lib/api/index.js";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Dialog from "#lib/components/ui/dialog/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import {
		offeredRelease,
		PLAY_STORE,
		phoneSystem,
		RELEASES,
	} from "#lib/release.js";
	import { page } from "$app/state";

	let { open = $bindable(false) }: { open: boolean } = $props();

	let link = $state("");
	let failed = $state(false);
	let renew: ReturnType<typeof setTimeout> | undefined;

	/** A code lives two minutes: a new one replaces it just before it lapses. */
	async function issue() {
		clearTimeout(renew);
		failed = false;
		const { data, error } = await api.POST("/api/v1/mobile/pair");
		if (error || !data?.data) {
			link = "";
			failed = true;
			return;
		}
		link = data.data.url;
		const lapses = new Date(data.data.expiresAt).getTime() - Date.now();
		renew = setTimeout(() => void issue(), Math.max(lapses - 10_000, 10_000));
	}

	$effect(() => {
		if (open) {
			void issue();
		}
		return () => {
			clearTimeout(renew);
			// A code nobody is looking at has no reason to stay on screen.
			link = "";
		};
	});

	const system = $derived(
		open && typeof navigator !== "undefined"
			? phoneSystem(navigator.userAgent)
			: undefined,
	);
	// A phone cannot scan its own screen: there the link is simply opened.
	const onPhone = $derived(system !== undefined);
	const release = $derived(open ? offeredRelease(page.data) : undefined);

	// Built here from a link this page just received: nothing a user typed.
	const code = $derived(link ? renderSVG(link, { border: 2 }) : "");
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-sm">
        <Dialog.Header>
            <Dialog.Title>{m.mobile_connect()}</Dialog.Title>
            <Dialog.Description>{m.mobile_connect_description()}</Dialog.Description>
        </Dialog.Header>
        <!-- White whatever the theme: a scanner needs dark on light. -->
        <div
            class="mx-auto flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden rounded-lg bg-white"
            role="img"
            aria-label={m.mobile_connect()}
        >
            {#if code}
                <div class="size-full [&>svg]:size-full" data-pairing-code>
                    {@html code}
                </div>
            {:else if failed}
                <p class="p-4 text-center text-sm text-neutral-700">{m.mobile_connect_error()}</p>
            {:else}
                <Spinner class="size-6 text-neutral-700" />
            {/if}
        </div>
        {#if onPhone && link}
            <a href={link} class={buttonVariants({ class: "w-full" })}>
                <SmartphoneIcon />
                {m.mobile_connect_open()}
            </a>
        {/if}
        <div class="flex flex-col items-center gap-2">
            <p class="text-muted-foreground text-sm">{m.mobile_connect_get()}</p>
            <div class="flex flex-wrap justify-center gap-2">
                {#if system !== "ios"}
                    <a
                        href={PLAY_STORE}
                        target="_blank"
                        rel="noreferrer"
                        class={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
                        </svg>
                        {m.apps_google_play()}
                    </a>
                {/if}
                {#await release then version}
                    <a
                        href={version ? `${RELEASES}/tag/v${version}` : RELEASES}
                        target="_blank"
                        rel="noreferrer"
                        class={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        {m.apps_github()}
                    </a>
                {/await}
            </div>
        </div>
        <p class="text-muted-foreground text-center text-xs">{m.mobile_connect_expires()}</p>
        <p class="text-muted-foreground text-center text-xs">{m.mobile_connect_sessions()}</p>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => void issue()}>
                <RefreshCwIcon />
                {m.mobile_connect_new()}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
