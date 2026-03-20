<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Button } from "$lib/components/ui/button";
    import {
        getLocale,
        locales,
        setLocale,
        type Locale,
    } from "$lib/paraglide/runtime";
    import { capitalizeFirstLetter } from "$lib/utils";
    import * as m from "$lib/paraglide/messages.js";

    let currentLanguage = $derived(getLocale());

    function changeLocale(newLocale: Locale) {
        setLocale(newLocale);
        // Force page reload to apply new locale
        window.location.reload();
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        {#snippet child({ props })}
            <Button {...props} variant="outline">
                {m.language({ locale: currentLanguage })}
            </Button>
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
        <DropdownMenu.Group>
            <DropdownMenu.Label>{m.select_language()}</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={currentLanguage}>
                {#each locales as locale}
                    <DropdownMenu.RadioItem
                        value={locale}
                        onclick={() => changeLocale(locale)}
                    >
                        {capitalizeFirstLetter(locale)}
                    </DropdownMenu.RadioItem>
                {/each}
            </DropdownMenu.RadioGroup>
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>
