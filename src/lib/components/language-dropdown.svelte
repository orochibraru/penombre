<script lang="ts">
	import { CheckIcon } from "@lucide/svelte";
	import { Label } from "$lib/components/ui/label";
	import * as m from "$lib/paraglide/messages.js";
	import {
		getLocale,
		type Locale,
		locales,
		setLocale,
	} from "$lib/paraglide/runtime";
	import { cn } from "$lib/utils";

	let currentLanguage = $derived(getLocale());

	/**
	 * Each language is named in its own language — someone who has landed on
	 * the wrong locale can still recognise theirs. `Intl.DisplayNames` gives
	 * us that for free, with the raw code as a fallback.
	 */
	function endonym(locale: Locale): string {
		try {
			return (
				new Intl.DisplayNames([locale], { type: "language" }).of(locale) ??
				locale
			);
		} catch {
			return locale;
		}
	}

	function changeLocale(newLocale: Locale) {
		if (newLocale === currentLanguage) {
			return;
		}
		// `setLocale` reloads the page itself to re-render compiled messages.
		setLocale(newLocale);
	}
</script>

<fieldset class="flex flex-col gap-3">
    <legend class="text-sm font-medium">{m.select_language()}</legend>
    <p class="text-muted-foreground text-sm">{m.language_description()}</p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each locales as locale (locale)}
            {@const active = locale === currentLanguage}
            <Label
                class={cn(
                    "hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-xs border p-3 transition-colors",
                    active && "border-ring bg-input/20",
                )}
            >
                <input
                    type="radio"
                    name="locale"
                    value={locale}
                    checked={active}
                    class="sr-only"
                    onchange={() => changeLocale(locale)}
                />
                <div class="grid gap-1 font-normal">
                    <span class="font-medium capitalize">{endonym(locale)}</span>
                    <span class="text-muted-foreground text-xs uppercase">
                        {locale}
                    </span>
                </div>
                {#if active}
                    <CheckIcon class="text-primary h-4 w-4 shrink-0" />
                {/if}
            </Label>
        {/each}
    </div>
</fieldset>
