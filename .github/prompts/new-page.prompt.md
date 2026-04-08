---
description: "Scaffold a new SvelteKit page with route loader, component, and i18n translations."
agent: "agent"
argument-hint: "Describe the page (e.g., 'settings/notifications — user notification preferences')"
---

Create a new page in the Penombre SvelteKit web package.

## Steps

1. **Route files**: Create `+page.ts` (loader) and `+page.svelte` (component) under the appropriate path in `packages/web/src/routes/(app)/`. Add `+page.server.ts` if server-side form actions are needed.

2. **Component**: Use Svelte 5 runes (`$props`, `$state`, `$derived`). Import UI components from `$lib/components/ui/`. Use TailwindCSS classes for styling.

3. **i18n keys**: Add translation keys to all locale files (`packages/web/messages/en.json`, `fr.json`, `es.json`, `de.json`). Use `m.key_name()` from `$lib/paraglide/messages.js` for all user-facing strings. Use snake_case with a shared prefix for related keys.

4. **Navigation**: If the page needs a sidebar entry, update the layout in `packages/web/src/lib/components/layout/`.

5. **Machine translate**: Run `bun run machine-translate` in `packages/web/` if translations for non-English locales are unknown.

Follow the conventions in [svelte-components.instructions.md](../instructions/svelte-components.instructions.md).
