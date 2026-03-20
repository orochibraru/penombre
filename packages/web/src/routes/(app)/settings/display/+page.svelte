<script lang="ts">
    import {
        type Icon as IconType,
        MonitorIcon,
        MoonIcon,
        SunIcon,
    } from "@lucide/svelte";
    import { setMode, userPrefersMode } from "mode-watcher";
    import { Label } from "$lib/components/ui/label";
    import * as RadioGroup from "$lib/components/ui/radio-group";
    import { title } from "$lib/store/title";
    import * as m from "$lib/paraglide/messages.js";

    $title = m.settings_display();

    type Theme = {
        id: "dark" | "light" | "system";
        name: string;
        description: string;
        icon: typeof IconType;
    };

    const themes: Theme[] = [
        {
            id: "system",
            name: m.theme_system(),
            description: m.theme_system_description(),
            icon: MonitorIcon,
        },
        {
            id: "light",
            name: m.theme_light(),
            description: m.theme_light_description(),
            icon: SunIcon,
        },
        {
            id: "dark",
            name: m.theme_dark(),
            description: m.theme_dark_description(),
            icon: MoonIcon,
        },
    ];
</script>

<section>
    <fieldset class="flex flex-col gap-3">
        <legend class="text-sm font-medium">{m.theme()}</legend>
        <p class="text-muted-foreground text-sm">
            {m.theme_description()}
        </p>
        <RadioGroup.Root
            class="grid gap-3 md:grid-cols-3"
            value={userPrefersMode.current}
        >
            {#each themes as theme (theme.id)}
                {@const Icon = theme.icon}
                <Label
                    class="has-data-[state=checked]:border-ring has-data-[state=checked]:bg-input/20 hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                >
                    <div class="flex items-center gap-2">
                        <RadioGroup.Item
                            value={theme.id}
                            id={theme.name}
                            onclick={() => setMode(theme.id)}
                            class="data-[state=checked]:border-primary"
                        />
                        <div class="grid gap-1 font-normal">
                            <div class="font-medium">
                                {theme.name}
                            </div>
                            <div
                                class="text-muted-foreground text-xs leading-snug text-balance"
                            >
                                {theme.description}
                            </div>
                        </div>
                    </div>
                    <Icon class="h-5 w-5" />
                </Label>
            {/each}
        </RadioGroup.Root>
    </fieldset>
</section>
