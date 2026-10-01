<script lang="ts" module>
	import {
		baseLocale,
		extractLocaleFromCookie,
		extractLocaleFromNavigator,
		getLocale,
		isLocale,
		type Locale,
		locales,
		setLocale,
	} from "#lib/paraglide/runtime.js";
	import { APP_USER_AGENT } from "#lib/release.js";

	/**
	 * Puts a signed-in page in the account's language, over whatever this
	 * browser chose (paraglide reads localStorage first). With none saved the
	 * browser keeps its own, except inside the mobile app, whose cookie says
	 * what the app speaks. `setLocale` stores the locale before it reloads, so
	 * the next load already matches and this never loops.
	 */
	export function applyLanguage(language: string | null | undefined): void {
		if (typeof window === "undefined") {
			return;
		}
		const inApp = navigator.userAgent.includes(APP_USER_AGENT);
		const wanted = language ?? (inApp ? extractLocaleFromCookie() : undefined);
		if (wanted && isLocale(wanted) && wanted !== getLocale()) {
			setLocale(wanted);
		}
	}
</script>

<script lang="ts">
	import { CheckIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as Select from "#lib/components/ui/select/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";

	interface Props {
		/**
		 * `compact` renders a plain select. The card grid is right in Settings,
		 * where it is the subject of the page, but on the auth screens it
		 * dwarfs the sign-in form it sits under.
		 */
		compact?: boolean;
	}

	const { compact = false }: Props = $props();

	let currentLanguage = $derived(getLocale());

	/**
	 * The account's saved language where a page is signed in (`null` is
	 * automatic); undefined on the auth screens, where only this browser
	 * changes.
	 */
	const account = $derived(
		page.data.preferences as { language?: Locale | null } | undefined,
	);
	const automatic = $derived(account !== undefined && !account.language);

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

	/**
	 * Saves the choice to the account first, so the app and every other
	 * browser follow it; `null` is automatic, this browser's own language.
	 * `setLocale` then reloads the page to re-render compiled messages.
	 */
	async function changeLocale(next: Locale | null) {
		if (account) {
			const { error } = await api.PUT("/api/v1/preferences", {
				body: { language: next },
			});
			if (error) {
				toast.error(m.toast_account_update_error());
				return;
			}
		}
		const locale = next ?? extractLocaleFromNavigator() ?? baseLocale;
		if (locale !== currentLanguage) {
			setLocale(locale);
			return;
		}
		await invalidate("app:preferences");
	}
</script>

{#if compact}
    <Select.Root
        type="single"
        value={currentLanguage}
        onValueChange={(value) => changeLocale(value as Locale)}
    >
        <Select.Trigger class="w-full" aria-label={m.select_language()}>
            {endonym(currentLanguage)}
        </Select.Trigger>
        <Select.Content>
            {#each locales as locale (locale)}
                <Select.Item value={locale}>
                    <span class="capitalize">{endonym(locale)}</span>
                    <span class="text-muted-foreground ml-2 text-xs uppercase">
                        {locale}
                    </span>
                </Select.Item>
            {/each}
        </Select.Content>
    </Select.Root>
{:else}
<fieldset class="flex flex-col gap-3">
    <legend class="text-sm font-medium">{m.select_language()}</legend>
    <p class="text-muted-foreground text-sm">{m.language_description()}</p>
    {#if account}
        <p class="text-muted-foreground text-sm">{m.lang_account_hint()}</p>
    {/if}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#if account}
            {@render option(null, m.lang_automatic(), endonym(currentLanguage), automatic)}
        {/if}
        {#each locales as locale (locale)}
            {@render option(
                locale,
                endonym(locale),
                locale,
                !automatic && locale === currentLanguage,
            )}
        {/each}
    </div>
</fieldset>
{/if}

{#snippet option(
    value: Locale | null,
    name: string,
    detail: string,
    active: boolean,
)}
    <Label
        class={cn(
            "hover:bg-input/20 flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
            active && "border-ring bg-input/20",
        )}
    >
        <input
            type="radio"
            name="locale"
            value={value ?? "auto"}
            checked={active}
            class="sr-only"
            onchange={() => changeLocale(value)}
        />
        <div class="grid gap-1 font-normal">
            <span class="font-medium capitalize">{name}</span>
            <span
                class={cn(
                    "text-muted-foreground text-xs",
                    value !== null && "uppercase",
                )}
            >
                {detail}
            </span>
        </div>
        {#if active}
            <CheckIcon class="text-primary h-4 w-4 shrink-0" />
        {/if}
    </Label>
{/snippet}
