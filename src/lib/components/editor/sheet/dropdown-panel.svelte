<script lang="ts">
	import { PlusIcon, Trash2Icon, XIcon } from "@lucide/svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import {
		CHIP_PALETTE,
		type ChipColor,
		colorOf,
		type Dropdown,
		isSourceRef,
		isSqref,
		listProblem,
		matchItem,
	} from "#lib/sheet/dropdowns.js";
	import { cn } from "#lib/utils.js";
	import type { Dropdowns } from "./dropdowns.svelte.js";

	/**
	 * The dropdown editor, beside the grid (under it on a phone): its range,
	 * its items and their colours, whether other values are refused. Every
	 * change is one undo step; text fields apply on Enter or when they lose
	 * the focus. A renamed item renames the cells that held it.
	 */
	const { drops, dropdown }: { drops: Dropdowns; dropdown: Dropdown } =
		$props();

	let rangeProblem = $state(false);
	let sourceProblem = $state(false);
	/** Why the last item typed was not taken. */
	let refused = $state<"taken" | "empty" | "comma" | "long" | null>(null);
	/** The item whose colours are open. */
	let picking = $state<string | null>(null);
	let draft = $state("");
	/** Items from a range, chosen before a valid range was typed. */
	let byRange = $state(false);

	const items = $derived(drops.items(dropdown));
	const fromRange = $derived(byRange || dropdown.source !== undefined);
	const listed = $derived(fromRange ? items : (dropdown.values ?? []));
	const problem = $derived(
		dropdown.values ? listProblem(dropdown.values) : null,
	);
	const PROBLEMS = {
		taken: m.sheet_dropdown_problem_taken,
		empty: m.sheet_dropdown_problem_empty,
		comma: m.sheet_dropdown_problem_comma,
		long: m.sheet_dropdown_problem_long,
	};

	/** The dropdown with `patch` laid over it; undefined removes a field. */
	function update(patch: Partial<Dropdown>) {
		const next: Record<string, unknown> = { ...dropdown, ...patch };
		for (const [key, value] of Object.entries(next)) {
			if (value === undefined) {
				delete next[key];
			}
		}
		drops.update(next as unknown as Dropdown);
	}

	function setRange(text: string) {
		const range = text.trim().toUpperCase();
		rangeProblem = !isSqref(range);
		if (!rangeProblem && range !== dropdown.range) {
			update({ range });
		}
	}

	function setSource(text: string) {
		const source = text.trim().replace(/^=/, "");
		sourceProblem = !isSourceRef(source);
		if (!sourceProblem && source !== dropdown.source) {
			update({ source, values: undefined });
			byRange = false;
		}
	}

	function useList() {
		byRange = false;
		if (dropdown.source !== undefined) {
			update({
				source: undefined,
				values:
					items.length > 0
						? items.slice(0, 100)
						: [m.sheet_dropdown_option({ n: "1" })],
			});
		}
	}

	function setColor(item: string, swatch?: { fill: string; text?: string }) {
		const colors: ChipColor[] = (dropdown.colors ?? []).filter(
			(color) => color.value.toLowerCase() !== item.toLowerCase(),
		);
		if (swatch) {
			colors.push({ value: item, ...swatch });
		}
		update({ colors: colors.length > 0 ? colors : undefined });
	}

	/** Taken by another item, case aside. */
	const taken = (value: string, except?: string) =>
		(dropdown.values ?? []).some(
			(item) => item !== except && item.toLowerCase() === value.toLowerCase(),
		);

	/** Why `values` will not do, as the reason shown; null when they will. */
	function refusal(values: string[], value: string, except?: string) {
		refused = taken(value, except) ? "taken" : listProblem(values);
		return refused !== null;
	}

	function rename(from: string, text: string) {
		const to = text.trim();
		const values = (dropdown.values ?? []).map((v) => (v === from ? to : v));
		if (to !== "" && to !== from && !refusal(values, to, from)) {
			drops.rename(dropdown, from, to);
		}
	}

	function removeItem(item: string) {
		update({
			values: (dropdown.values ?? []).filter((value) => value !== item),
			colors: dropdown.colors?.filter((color) => color.value !== item),
		});
	}

	function addItem() {
		const value = draft.trim();
		const values = [...(dropdown.values ?? []), value];
		if (value === "" || refusal(values, value)) {
			return;
		}
		const swatch = CHIP_PALETTE[(values.length - 1) % CHIP_PALETTE.length];
		update({
			values,
			colors: [
				...(dropdown.colors ?? []),
				{ value, ...(swatch ?? { fill: "#E8EAED" }) },
			],
		});
		draft = "";
	}

	const enter = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			(event.currentTarget as HTMLInputElement).blur();
		}
	};
</script>

{#snippet item(value: string, editable: boolean)}
	{@const color = colorOf(dropdown, matchItem(items, value) ?? value)}
	<li class="flex flex-col gap-1.5">
		<div class="flex min-w-0 items-center gap-2">
			<button
				type="button"
				class={cn(
					"size-7 shrink-0 rounded-full border",
					!color && "bg-muted",
					picking === value && "ring-ring ring-2",
				)}
				style={color ? `background-color: ${color.fill}` : undefined}
				aria-label={m.sheet_dropdown_colour({ value })}
				aria-expanded={picking === value}
				onclick={() => (picking = picking === value ? null : value)}
			></button>
			{#if editable}
				<Input
					{value}
					aria-label={value}
					class="h-8 min-w-0 flex-1"
					onchange={(e) => rename(value, e.currentTarget.value)}
					onkeydown={enter}
				/>
				<button
					type="button"
					class="text-muted-foreground hover:bg-muted hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-md"
					aria-label={m.sheet_dropdown_remove_item({ value })}
					onclick={() => removeItem(value)}
				>
					<Trash2Icon class="size-4" />
				</button>
			{:else}
				<span class="min-w-0 flex-1 truncate text-sm">{value}</span>
			{/if}
		</div>
		{#if picking === value}
			<div
				class="flex flex-wrap items-center gap-1.5 ps-9"
				role="group"
				aria-label={m.sheet_dropdown_colour({ value })}
			>
				{#each CHIP_PALETTE as swatch (swatch.fill)}
					<button
						type="button"
						class={cn(
							"size-6 rounded-full border",
							color?.fill === swatch.fill && "ring-ring ring-2 ring-offset-1",
						)}
						style="background-color: {swatch.fill}"
						aria-label={swatch.fill}
						onclick={() => setColor(value, swatch)}
					></button>
				{/each}
				<label
					class="relative size-6 cursor-pointer overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]"
					title={m.sheet_dropdown_custom_colour()}
				>
					<input
						type="color"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						aria-label={m.sheet_dropdown_custom_colour()}
						value={color?.fill ?? "#E8EAED"}
						onchange={(e) =>
							setColor(value, { fill: e.currentTarget.value.toUpperCase() })}
					/>
				</label>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground ms-1 text-xs"
					onclick={() => setColor(value)}
				>
					{m.sheet_dropdown_no_colour()}
				</button>
			</div>
		{/if}
	</li>
{/snippet}

<aside
	class="bg-surface-base fixed inset-x-0 bottom-0 z-40 flex max-h-[55vh] flex-col overflow-hidden rounded-t-xl border shadow-lg md:static md:z-auto md:max-h-none md:w-80 md:shrink-0 md:rounded-lg md:shadow-none"
	aria-label={m.sheet_dropdown()}
>
	<header class="flex items-center justify-between border-b px-3 py-2">
		<h2 class="text-sm font-medium">{m.sheet_dropdown()}</h2>
		<button
			type="button"
			class="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-md"
			aria-label={m.sheet_dropdown_close()}
			onclick={() => (drops.panel = null)}
		>
			<XIcon class="size-4" />
		</button>
	</header>
	<div class="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-3">
		<div class="flex flex-col gap-2">
			<Label for="dropdown-range">{m.sheet_dropdown_range()}</Label>
			<Input
				id="dropdown-range"
				value={dropdown.range}
				placeholder="F2:F20"
				aria-invalid={rangeProblem}
				onchange={(e) => setRange(e.currentTarget.value)}
				onkeydown={enter}
			/>
			{#if rangeProblem}
				<p class="text-destructive text-xs">
					{m.sheet_dropdown_range_invalid()}
				</p>
			{/if}
		</div>
		<div class="flex gap-1" role="group" aria-label={m.sheet_dropdown_items()}>
			{#each [[false, m.sheet_dropdown_from_list()], [true, m.sheet_dropdown_from_range()]] as const as [value, label] (label)}
				<button
					type="button"
					aria-pressed={fromRange === value}
					class={cn(
						"h-8 flex-1 rounded-md border px-2 text-xs",
						fromRange === value
							? "bg-primary text-primary-foreground border-primary"
							: "hover:bg-muted",
					)}
					onclick={() => (value ? (byRange = true) : useList())}
				>
					{label}
				</button>
			{/each}
		</div>
		{#if fromRange}
			<div class="flex flex-col gap-2">
				<Label for="dropdown-source">{m.sheet_dropdown_source()}</Label>
				<Input
					id="dropdown-source"
					value={dropdown.source ?? ""}
					placeholder="Sheet2!A1:A9"
					aria-invalid={sourceProblem}
					onchange={(e) => setSource(e.currentTarget.value)}
					onkeydown={enter}
				/>
				{#if sourceProblem}
					<p class="text-destructive text-xs">
						{m.sheet_dropdown_range_invalid()}
					</p>
				{/if}
			</div>
		{/if}
		<fieldset class="flex min-w-0 flex-col gap-2">
			<legend class="mb-2 text-sm font-medium"
				>{m.sheet_dropdown_items()}</legend
			>
			<ul class="flex flex-col gap-2">
				{#each listed as value (value)}
					{@render item(value, !fromRange)}
				{/each}
			</ul>
			{#if !fromRange}
				<form
					class="flex items-center gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						addItem();
					}}
				>
					<Input
						bind:value={draft}
						placeholder={m.sheet_dropdown_add()}
						aria-label={m.sheet_dropdown_add()}
						class="h-8 min-w-0 flex-1"
					/>
					<button
						type="submit"
						class="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
						aria-label={m.sheet_dropdown_add()}
					>
						<PlusIcon class="size-4" />
					</button>
				</form>
			{/if}
			{#if (refused ?? problem) && !fromRange}
				<p class="text-destructive text-xs">
					{PROBLEMS[refused ?? problem ?? "empty"]()}
				</p>
			{/if}
		</fieldset>
		<Label>
			<Checkbox
				checked={dropdown.strict === true}
				onCheckedChange={(checked) =>
					update({ strict: checked ? true : undefined })}
			/>
			{m.sheet_dropdown_strict()}
		</Label>
		<div class="flex flex-wrap justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				class="text-destructive"
				onclick={drops.remove}
			>
				<Trash2Icon class="size-4" />
				{m.sheet_dropdown_remove()}
			</Button>
			<Button size="sm" onclick={() => (drops.panel = null)}>
				{m.sheet_dropdown_done()}
			</Button>
		</div>
	</div>
</aside>
