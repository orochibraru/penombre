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

    $title = "Settings - Display";

    type Theme = {
        id: "dark" | "light" | "system";
        name: string;
        description: string;
        icon: typeof IconType;
    };

    const themes: Theme[] = [
        {
            id: "system",
            name: "System",
            description: "Follows your system's preferences",
            icon: MonitorIcon,
        },
        {
            id: "light",
            name: "Light",
            description: "Clear white-ish theme.",
            icon: SunIcon,
        },
        {
            id: "dark",
            name: "Dark",
            description: "Everything black.",
            icon: MoonIcon,
        },
    ];
</script>

<section>
    <fieldset class="flex flex-col gap-3">
        <legend class="text-sm font-medium">Theme</legend>
        <p class="text-muted-foreground text-sm">
            Select the theme that matches your style.
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
