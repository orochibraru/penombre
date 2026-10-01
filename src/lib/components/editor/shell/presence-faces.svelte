<script lang="ts">
	import * as Tooltip from "#lib/components/ui/tooltip/index.js";
	import { colourFor, faces, initials } from "#lib/editor/presence.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import type { Present } from "./presence.svelte.js";

	/** The other people who have this file open, as overlapping initials. */
	const { people }: { people: Present[] } = $props();

	const shown = $derived(faces(people, 4));

	const status = (person: Present) =>
		person.mode === "editing"
			? m.shell_person_editing({ name: person.name })
			: m.shell_person_viewing({ name: person.name });
</script>

{#if people.length > 0}
    <div class="flex items-center -space-x-2">
        {#each shown.shown as person (person.userId)}
            <Tooltip.Root>
                <Tooltip.Trigger
                    class={cn(
                        "ring-background flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white ring-2",
                        colourFor(person.userId),
                    )}
                    aria-label={status(person)}
                >
                    {initials(person.name)}
                </Tooltip.Trigger>
                <Tooltip.Content>{status(person)}</Tooltip.Content>
            </Tooltip.Root>
        {/each}
        {#if shown.more > 0}
            <Tooltip.Root>
                <Tooltip.Trigger
                    class="bg-muted text-muted-foreground ring-background flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ring-2"
                >
                    +{shown.more}
                </Tooltip.Trigger>
                <Tooltip.Content class="flex flex-col">
                    {#each people.slice(shown.shown.length) as person (person.userId)}
                        <span>{status(person)}</span>
                    {/each}
                </Tooltip.Content>
            </Tooltip.Root>
        {/if}
    </div>
{/if}
