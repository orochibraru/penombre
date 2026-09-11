<script lang="ts">
	import {
		CheckIcon,
		LayoutGridIcon,
		LayoutListIcon,
		MonitorIcon,
		MoonIcon,
		PaletteIcon,
		SunIcon,
		TypeIcon,
	} from "@lucide/svelte";
	import { setMode } from "mode-watcher";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { invalidate } from "$app/navigation";
	import { api } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Label } from "$lib/components/ui/label";
	import { m } from "$lib/paraglide/messages.js";
	import { ACCENT_SWATCH, ACCENTS, type Accent, applyTheme } from "$lib/theme";
	import { cn } from "$lib/utils";

	interface Props {
		open: boolean;
		/** The signed-in user's saved preferences, used as the starting point. */
		preferences?: Record<string, unknown> | null;
	}

	let { open = $bindable(false), preferences = null }: Props = $props();

	// Local until the last step: nothing is written while someone is still
	// clicking around, but the app repaints so the choice is visible.
	// Seeded once from the saved preferences; the dialog owns them after that.
	const seed = untrack(
		() => (preferences ?? {}) as Record<string, string | undefined>,
	);
	let accent = $state<Accent>((seed.accent as Accent | undefined) ?? "purple");
	let fontFamily = $state<"mono" | "sans">(
		(seed.fontFamily as "mono" | "sans" | undefined) ?? "sans",
	);
	let corners = $state<"boxy" | "rounded">(
		(seed.corners as "boxy" | "rounded" | undefined) ?? "rounded",
	);
	let layout = $state<"grid" | "list">(
		(seed.layout as "grid" | "list" | undefined) ?? "list",
	);
	let step = $state(0);
	let saving = $state(false);
	/** Set once the walkthrough has recorded itself as done. */
	let settled = $state(false);

	const steps = [
		{ title: m.onboarding_accent(), icon: PaletteIcon },
		{ title: m.onboarding_typeface(), icon: TypeIcon },
		{ title: m.onboarding_layout(), icon: LayoutGridIcon },
	];

	const isLast = $derived(step === steps.length - 1);

	// Repaint on every change so each step previews itself.
	$effect(() => {
		applyTheme({ accent, fontFamily, corners });
	});

	async function persist(markDone: boolean) {
		saving = true;
		try {
			const { error } = await api.PUT("/api/v1/preferences", {
				body: {
					accent,
					fontFamily,
					corners,
					layout,
					...(markDone ? { onboarded: true } : {}),
				},
			});
			if (error) {
				toast.error(m.toast_account_update_error());
				return;
			}
			await invalidate("app:preferences");
		} finally {
			saving = false;
		}
	}

	async function finish() {
		settled = true;
		await persist(true);
		open = false;
	}

	/**
	 * Any dismissal counts as a skip.
	 *
	 * The dialog can also be closed by its own X or backdrop, and without this
	 * the walkthrough would reappear on the next load — which reads as broken
	 * rather than helpful.
	 */
	$effect(() => {
		if (open || settled) {
			return;
		}
		settled = true;
		void api.PUT("/api/v1/preferences", { body: { onboarded: true } });
	});

	async function skip() {
		// Records that the walkthrough is done, but does not write the
		// half-made choices.
		settled = true;
		saving = true;
		try {
			await api.PUT("/api/v1/preferences", { body: { onboarded: true } });
			await invalidate("app:preferences");
		} finally {
			saving = false;
			open = false;
		}
	}
</script>

<ResponsiveDialog
    bind:open
    size="sm"
    title={m.onboarding_title()}
    description={m.onboarding_description()}
>
    <div class="flex flex-col gap-5">
        <!-- Progress -->
        <div class="flex items-center gap-2">
            {#each steps as s, i (s.title)}
                {@const Icon = s.icon}
                <div
                    class={cn(
                        "flex flex-1 items-center gap-2 border-b-2 pb-2 text-xs transition-colors",
                        i === step
                            ? "border-primary text-primary font-medium"
                            : i < step
                              ? "border-primary/40 text-muted-foreground"
                              : "border-border text-muted-foreground",
                    )}
                >
                    {#if i < step}
                        <CheckIcon class="size-3.5 shrink-0" />
                    {:else}
                        <Icon class="size-3.5 shrink-0" />
                    {/if}
                    <span class="truncate">{s.title}</span>
                </div>
            {/each}
        </div>

        {#if step === 0}
            <div class="grid grid-cols-2 gap-2">
                {#each ACCENTS as option (option)}
                    <button
                        type="button"
                        aria-pressed={accent === option}
                        onclick={() => (accent = option)}
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
            </div>
        {:else if step === 1}
            <div class="flex flex-col gap-3">
                <div class="grid gap-2">
                    {#each [{ id: "sans" as const, label: m.font_sans() }, { id: "mono" as const, label: m.font_mono() }] as option (option.id)}
                        <button
                            type="button"
                            onclick={() => (fontFamily = option.id)}
                            class={cn(
                                "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                                fontFamily === option.id
                                    ? "border-ring bg-input/20 font-medium"
                                    : "hover:bg-input/20",
                            )}
                        >
                            {option.label}
                            <span
                                class="text-muted-foreground text-xs"
                                style="font-family: {option.id === 'mono'
                                    ? '\"JetBrains Mono Variable\", monospace'
                                    : 'ui-sans-serif, system-ui'}"
                            >
                                Aa 0O1l
                            </span>
                        </button>
                    {/each}
                </div>

                <div class="grid grid-cols-2 gap-2">
                    {#each [{ id: "rounded" as const, label: m.corners_rounded(), r: "12px" }, { id: "boxy" as const, label: m.corners_boxy(), r: "2px" }] as option (option.id)}
                        <button
                            type="button"
                            onclick={() => (corners = option.id)}
                            class={cn(
                                "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                                corners === option.id
                                    ? "border-ring bg-input/20 font-medium"
                                    : "hover:bg-input/20",
                            )}
                        >
                            {option.label}
                            <span
                                class="border-primary size-4 border-2"
                                style="border-radius: {option.r}"
                            ></span>
                        </button>
                    {/each}
                </div>
            </div>
        {:else}
            <div class="flex flex-col gap-3">
                <div class="grid grid-cols-2 gap-2">
                    {#each [{ id: "list" as const, label: m.layout_list(), icon: LayoutListIcon }, { id: "grid" as const, label: m.layout_grid(), icon: LayoutGridIcon }] as option (option.id)}
                        {@const Icon = option.icon}
                        <button
                            type="button"
                            onclick={() => (layout = option.id)}
                            class={cn(
                                "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                                layout === option.id
                                    ? "border-ring bg-input/20 font-medium"
                                    : "hover:bg-input/20",
                            )}
                        >
                            {option.label}
                            <Icon class="size-4" />
                        </button>
                    {/each}
                </div>

                <div class="flex flex-col gap-2">
                    <Label class="text-xs">{m.theme()}</Label>
                    <div class="grid grid-cols-3 gap-2">
                        {#each [{ id: "system" as const, label: m.theme_system(), icon: MonitorIcon }, { id: "light" as const, label: m.theme_light(), icon: SunIcon }, { id: "dark" as const, label: m.theme_dark(), icon: MoonIcon }] as option (option.id)}
                            {@const Icon = option.icon}
                            <button
                                type="button"
                                onclick={() => setMode(option.id)}
                                class="hover:bg-input/20 flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors"
                            >
                                <Icon class="size-4" />
                                {option.label}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <Button
            variant="default"
            loading={saving}
            onclick={() => (isLast ? finish() : (step += 1))}
        >
            {isLast ? m.onboarding_finish() : m.continue()}
        </Button>
        {#if step > 0}
            <Button variant="outline" onclick={() => (step -= 1)}>
                {m.previous()}
            </Button>
        {/if}
        <Button variant="ghost" onclick={skip}>{m.onboarding_skip()}</Button>
    {/snippet}
</ResponsiveDialog>
