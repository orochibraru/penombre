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
	import { ACCENT_SWATCH, ACCENTS, type Accent, applyTheme } from "$lib/theme";
	import { cn } from "$lib/utils";

	$title = m.settings_display();

	const { data } = $props();

	const layout = $derived(data.preferences?.layout ?? "list");
	const sortColumn = $derived(data.preferences?.sortColumn ?? "name");
	const sortDirection = $derived(data.preferences?.sortDirection ?? "asc");

	const fonts = [
		{
			id: "mono" as const,
			name: m.font_mono(),
			description: m.font_mono_description(),
			sample: "Aa 0O1l",
			css: '"JetBrains Mono Variable", ui-monospace, monospace',
		},
		{
			id: "sans" as const,
			name: m.font_sans(),
			description: m.font_sans_description(),
			sample: "Aa 0O1l",
			css: "ui-sans-serif, system-ui, sans-serif",
		},
	];

	const cornerOptions = [
		{
			id: "boxy" as const,
			name: m.corners_boxy(),
			description: m.corners_boxy_description(),
			radius: "2px",
		},
		{
			id: "rounded" as const,
			name: m.corners_rounded(),
			description: m.corners_rounded_description(),
			radius: "12px",
		},
	];

	const fontFamily = $derived(data.preferences?.fontFamily ?? "mono");
	const corners = $derived(data.preferences?.corners ?? "boxy");
	const accent = $derived(data.preferences?.accent ?? "violet");

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
		fontFamily?: "mono" | "sans";
		corners?: "boxy" | "rounded";
		accent?: Accent;
	}) {
		// Paint the change immediately; the reload below only persists it.
		applyTheme({ ...data.preferences, ...body });

		const { error } = await api.PUT("/api/v1/preferences", { body });
		if (error) {
			toast.error(m.toast_account_update_error());
			applyTheme(data.preferences);
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

<div class="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
    <Card.Root>
        <Card.Header>
            <Card.Title>{m.theme()}</Card.Title>
            <Card.Description>{m.theme_description()}</Card.Description>
        </Card.Header>
        <Card.Content>
            <RadioGroup.Root
                class="grid gap-2"
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
            <Card.Title>{m.accent_colour()}</Card.Title>
            <Card.Description>{m.accent_colour_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-2 sm:grid-cols-2">
            {#each ACCENTS as option (option)}
                <button
                    type="button"
                    aria-label={option}
                    aria-pressed={accent === option}
                    onclick={() => save({ accent: option })}
                    class={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs capitalize transition-colors",
                        accent === option
                            ? "border-ring bg-input/20 font-medium"
                            : "hover:bg-input/20",
                    )}
                >
                    <span
                        class="size-4 rounded-lg border"
                        style="background: {ACCENT_SWATCH[option]}"
                    ></span>
                    {option}
                </button>
            {/each}
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.font_family()}</Card.Title>
            <Card.Description>{m.font_family_description()}</Card.Description>
        </Card.Header>
        <Card.Content>
            <RadioGroup.Root class="grid gap-2" value={fontFamily}>
                {#each fonts as option (option.id)}
                    <Label
                        class="has-data-[state=checked]:border-ring has-data-[state=checked]:bg-input/20 hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                    >
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item
                                value={option.id}
                                id="font-{option.id}"
                                onclick={() => save({ fontFamily: option.id })}
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
                        <span
                            class="text-muted-foreground shrink-0 text-sm"
                            style="font-family: {option.css}"
                        >
                            {option.sample}
                        </span>
                    </Label>
                {/each}
            </RadioGroup.Root>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.corners()}</Card.Title>
            <Card.Description>{m.corners_description()}</Card.Description>
        </Card.Header>
        <Card.Content>
            <RadioGroup.Root class="grid gap-2" value={corners}>
                {#each cornerOptions as option (option.id)}
                    <Label
                        class="has-data-[state=checked]:border-ring has-data-[state=checked]:bg-input/20 hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                    >
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item
                                value={option.id}
                                id="corners-{option.id}"
                                onclick={() => save({ corners: option.id })}
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
                        <span
                            class="border-primary size-6 shrink-0 border-2"
                            style="border-radius: {option.radius}"
                        ></span>
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
            <RadioGroup.Root class="grid gap-2" value={layout}>
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
        <Card.Content class="grid gap-2">
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
