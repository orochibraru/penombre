<script lang="ts">
	import { onMount } from "svelte";

	/**
	 * Resolved theme actually painted right now, for choosing which icon to
	 * show. `undefined` until `onMount` reads the real state (matches
	 * `app.html`'s inline script + the `prefers-color-scheme` media query in
	 * app.css), so the button renders inert on the server and during
	 * hydration rather than guessing and flashing the wrong icon.
	 */
	let resolved: "light" | "dark" | undefined = $state(undefined);

	onMount(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const readResolved = (): "light" | "dark" => {
			const override = document.documentElement.dataset.theme;
			if (override === "light" || override === "dark") {
				return override;
			}
			return media.matches ? "dark" : "light";
		};
		resolved = readResolved();

		// Only matters while there's no explicit override: if the visitor's
		// OS theme changes mid-session, follow it live instead of requiring a
		// reload.
		const onSystemChange = () => {
			if (!document.documentElement.dataset.theme) {
				resolved = readResolved();
			}
		};
		media.addEventListener("change", onSystemChange);
		return () => media.removeEventListener("change", onSystemChange);
	});

	/** Flips the explicit override and persists it; a page reload re-applies it via app.html's inline script. */
	function toggle() {
		const next = resolved === "dark" ? "light" : "dark";
		resolved = next;
		document.documentElement.setAttribute("data-theme", next);
		try {
			localStorage.setItem("theme", next);
		} catch {
			// Private-browsing/blocked storage: the toggle still works for this
			// page load, it just won't persist across a reload.
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label="Toggle color theme"
	class="flex size-8 items-center justify-center rounded-full border border-(--border) text-(--text-muted) transition-colors hover:border-(--border-hover) hover:text-(--text)"
>
	{#if resolved === "dark"}
		<!-- sun -->
		<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4.5" />
			<path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
		</svg>
	{:else}
		<!-- moon -->
		<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
		</svg>
	{/if}
</button>
