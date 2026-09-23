<script lang="ts">
	import { CircleArrowUpIcon } from "@lucide/svelte";
	import { m } from "#lib/paraglide/messages.js";
	import type { AppConfig } from "#lib/server/config.js";

	import type { VersionCheckResult } from "#lib/server/services/version.js";

	interface Props {
		version: Promise<VersionCheckResult | undefined>;
		config: AppConfig;
	}

	const { version, config }: Props = $props();
</script>

{#await version then resolved}
    <div class="px-3 pb-3 pt-1 group-data-[collapsible=icon]:hidden">
        <p class="text-xs text-muted-foreground">
            {config.appName} version {resolved?.currentVersion}
        </p>
        {#if resolved}
            {#if resolved.updateAvailable && resolved.latestVersion}
                <a
                    href={resolved.releaseUrl ?? "https://github.com/orochibraru/penombre/releases"}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-1.5 flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                    <CircleArrowUpIcon class="h-3.5 w-3.5" />
                    {m.update_available({ version: resolved.latestVersion })}
                </a>
            {/if}
        {/if}
    </div>
{/await}
