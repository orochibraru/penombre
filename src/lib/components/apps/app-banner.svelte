<script lang="ts">
	import { SmartphoneIcon, XIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { APP_USER_AGENT, phoneSystem } from "#lib/release.js";
	import { appsDialogOpen } from "#lib/store/apps.js";

	const SEEN = "penombre:app-banner";

	let shown = $state(false);

	// Once a session, on a phone's browser, and never inside the app itself,
	// whose embedded pages are this same site.
	onMount(() => {
		const ua = navigator.userAgent;
		if (!phoneSystem(ua) || ua.includes(APP_USER_AGENT)) {
			return;
		}
		try {
			shown = sessionStorage.getItem(SEEN) === null;
		} catch {
			// Storage refused (private mode): say it once per page instead.
			shown = true;
		}
	});

	function dismiss() {
		shown = false;
		try {
			sessionStorage.setItem(SEEN, "1");
		} catch {
			// Nothing to remember it in.
		}
	}
</script>

{#if shown}
    <div
        class="bg-primary/10 border-primary/20 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
        role="status"
    >
        <SmartphoneIcon class="text-primary size-5 shrink-0" />
        <p class="min-w-0 flex-1">{m.app_banner_text()}</p>
        <Button
            size="sm"
            onclick={() => {
                dismiss();
                appsDialogOpen.set(true);
            }}
        >{m.app_banner_action()}</Button>
        <Button variant="ghost" size="icon" title={m.close()} onclick={dismiss}>
            <XIcon />
        </Button>
    </div>
{/if}
