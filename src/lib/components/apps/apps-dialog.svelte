<script lang="ts">
	import { MonitorIcon, SmartphoneIcon } from "@lucide/svelte";
	import DesktopDownloads from "#lib/components/apps/desktop-downloads.svelte";
	import MobileDownloads from "#lib/components/apps/mobile-downloads.svelte";
	import * as Dialog from "#lib/components/ui/dialog/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { desktopReleaseVersion, phoneSystem } from "#lib/release.js";
	import { appsDialogOpen } from "#lib/store/apps.js";
	import { page } from "$app/state";

	/**
	 * The layout already asks the server which release it runs and follows;
	 * that streamed answer is all this needs, so opening it costs no request.
	 */
	const version = $derived(
		Promise.resolve(page.data.versionCheck).then(
			(
				check:
					| {
							currentVersion: string;
							channel: "stable" | "canary";
							latestVersion: string | null;
					  }
					| undefined,
			) =>
				check
					? desktopReleaseVersion(
							check.currentVersion,
							check.channel,
							check.latestVersion,
						)
					: (page.data.config?.appVersion as string | undefined),
		),
	);

	// On a phone the phone's app comes first.
	const phone = $derived(
		$appsDialogOpen && typeof navigator !== "undefined"
			? phoneSystem(navigator.userAgent) !== undefined
			: false,
	);
</script>

{#snippet desktop(release: string)}
    <section class="flex flex-col gap-3">
        <h3 class="flex items-center gap-2 font-medium"><MonitorIcon class="text-primary size-4" />{m.apps_desktop_title()}</h3>
        <p class="text-muted-foreground text-sm">{m.apps_desktop_description()}</p>
        <DesktopDownloads version={release} />
    </section>
{/snippet}

{#snippet mobile(release: string)}
    <section class="flex flex-col gap-3">
        <h3 class="flex items-center gap-2 font-medium"><SmartphoneIcon class="text-primary size-4" />{m.apps_mobile_title()}</h3>
        <p class="text-muted-foreground text-sm">{m.apps_mobile_description()}</p>
        <MobileDownloads version={release} />
    </section>
{/snippet}

<Dialog.Root bind:open={$appsDialogOpen}>
    <Dialog.Content class="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <Dialog.Header>
            <Dialog.Title>{m.apps_title()}</Dialog.Title>
            <Dialog.Description>{m.apps_description()}</Dialog.Description>
        </Dialog.Header>
        {#await version}
            <Spinner class="mx-auto size-6" />
        {:then release}
            {#if release}
                <div class="grid gap-6 sm:grid-cols-2">
                    {#if phone}
                        {@render mobile(release)}
                        {@render desktop(release)}
                    {:else}
                        {@render desktop(release)}
                        {@render mobile(release)}
                    {/if}
                </div>
            {/if}
        {/await}
    </Dialog.Content>
</Dialog.Root>
