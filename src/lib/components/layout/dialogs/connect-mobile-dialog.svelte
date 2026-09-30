<script lang="ts">
	import { RefreshCwIcon, SmartphoneIcon } from "@lucide/svelte";
	import { renderSVG } from "uqr";
	import { api } from "#lib/api/index.js";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import * as Dialog from "#lib/components/ui/dialog/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { phoneSystem } from "#lib/release.js";

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

	// A phone cannot scan its own screen: there the link is simply opened.
	const onPhone = $derived(
		open && typeof navigator !== "undefined"
			? phoneSystem(navigator.userAgent) !== undefined
			: false,
	);

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
