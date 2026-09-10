<script lang="ts">
	import {
		LayoutGridIcon,
		LayoutListIcon,
		type LucideIcon,
		MonitorIcon,
		MoonIcon,
		SunIcon,
	} from "@lucide/svelte";
	import { setMode, userPrefersMode } from "mode-watcher";
	import { toast } from "svelte-sonner";
	import { invalidate } from "$app/navigation";
	import { api } from "$lib/api";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Label } from "$lib/components/ui/label";
	import * as RadioGroup from "$lib/components/ui/radio-group";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	$title = m.settings_display();

	const { data } = $props();

	const layout = $derived(data.preferences?.layout ?? "list");
	const sortColumn = $derived(data.preferences?.sortColumn ?? "name");
	const sortDirection = $derived(data.preferences?.sortDirection ?? "asc");

	const layouts = [
		{
			id: "list" as const,
			name: m.layout_list(),
			description: m.layout_list_description(),
			icon: LayoutListIcon,
		},
		{
			id: "grid" as const,
			name: m.layout_grid(),
			description: m.layout_grid_description(),
			icon: LayoutGridIcon,
		},
	];

	const sortColumns = [
		{ value: "name", label: m.sort_name() },
		{ value: "size", label: m.sort_size() },
		{ value: "updatedAt", label: m.sort_updated() },
	];

	const sortDirections = [
		{ value: "asc", label: m.sort_ascending() },
		{ value: "desc", label: m.sort_descending() },
	];

	const sortColumnLabel = $derived(
		sortColumns.find((c) => c.value === sortColumn)?.label ?? m.sort_name(),
	);
	const sortDirectionLabel = $derived(
		sortDirections.find((d) => d.value === sortDirection)?.label ??
			m.sort_ascending(),
	);

	/** Persist one preference field; the layout store re-reads via invalidate. */
	async function save(body: {
		layout?: "grid" | "list";
		sortColumn?: "name" | "size" | "updatedAt";
		sortDirection?: "asc" | "desc";
	}) {
		const { error } = await api.PUT("/api/v1/preferences", { body });
		if (error) {
			toast.error(m.toast_account_update_error());
			return;
		}
		await invalidate("app:preferences");
		toast.success(m.toast_preferences_saved());
	}

	interface Theme {
		id: "dark" | "light" | "system";
		name: string;
		description: string;
		icon: LucideIcon;
	}

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

<div class="flex max-w-3xl flex-col gap-6">
    <div>
        <h2 class="text-xl font-semibold tracking-tight">
            {m.settings_nav_display()}
        </h2>
        <p class="text-muted-foreground text-sm">
            {m.settings_display_description()}
        </p>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.theme()}</Card.Title>
            <Card.Description>{m.theme_description()}</Card.Description>
        </Card.Header>
        <Card.Content>
            <RadioGroup.Root
                class="grid gap-3 sm:grid-cols-3"
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
                                <div class="font-medium">{theme.name}</div>
                                <div
                                    class="text-muted-foreground text-xs leading-snug text-balance"
                                >
                                    {theme.description}
                                </div>
                            </div>
                        </div>
                        <Icon class="size-5 shrink-0" />
                    </Label>
                {/each}
            </RadioGroup.Root>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.default_layout()}</Card.Title>
            <Card.Description>
                {m.default_layout_description()}
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <RadioGroup.Root class="grid gap-3 sm:grid-cols-2" value={layout}>
                {#each layouts as option (option.id)}
                    {@const Icon = option.icon}
                    <Label
                        class="has-data-[state=checked]:border-ring has-data-[state=checked]:bg-input/20 hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                    >
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item
                                value={option.id}
                                id={option.id}
                                onclick={() => save({ layout: option.id })}
                                class="data-[state=checked]:border-primary"
                            />
                            <div class="grid gap-1 font-normal">
                                <div class="font-medium">{option.name}</div>
                                <div
                                    class="text-muted-foreground text-xs leading-snug text-balance"
                                >
                                    {option.description}
                                </div>
                            </div>
                        </div>
                        <Icon class="size-5 shrink-0" />
                    </Label>
                {/each}
            </RadioGroup.Root>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.default_sort()}</Card.Title>
            <Card.Description>{m.default_sort_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-3 sm:grid-cols-2">
            <Select.Root
                type="single"
                value={sortColumn}
                onValueChange={(value) =>
                    save({
                        sortColumn: value as "name" | "size" | "updatedAt",
                    })}
            >
                <Select.Trigger class="w-full">
                    {sortColumnLabel}
                </Select.Trigger>
                <Select.Content>
                    {#each sortColumns as option (option.value)}
                        <Select.Item value={option.value}>
                            {option.label}
                        </Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>

            <Select.Root
                type="single"
                value={sortDirection}
                onValueChange={(value) =>
                    save({ sortDirection: value as "asc" | "desc" })}
            >
                <Select.Trigger class="w-full">
                    {sortDirectionLabel}
                </Select.Trigger>
                <Select.Content>
                    {#each sortDirections as option (option.value)}
                        <Select.Item value={option.value}>
                            {option.label}
                        </Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </Card.Content>
    </Card.Root>
</div>
