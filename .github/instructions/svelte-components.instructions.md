---
applyTo: "packages/web/src/**/*.svelte"
description: "Use when creating or modifying Svelte components. Enforces Svelte 5 runes, shadcn-svelte imports, and Paraglide i18n patterns."
---

# Svelte Component Guidelines

## Svelte 5 Runes Only

- Use `$props()` for component props — never `export let`
- Use `$state()` for reactive local state — never `let x = ...` for reactivity
- Use `$derived()` for computed values — never `$:` reactive statements
- Use `$effect()` for side effects — never `$:` blocks
- Use `$bindable()` for two-way bindable props

```svelte
<script lang="ts">
    let { value = $bindable(), label }: { value: string; label: string } = $props();
    let count: number = $state(0);
    const doubled = $derived(count * 2);
</script>
```

## Imports

- UI components: `import { Button } from "$lib/components/ui/button";`
- Compound components: `import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";`
- Class merging: `import { cn } from "$lib/utils";`
- Icons: `import { IconName } from "@lucide/svelte";`
- i18n: `import * as m from "$lib/paraglide/messages.js";`
- Navigation: `import { goto } from "$app/navigation";`
- Page state: `import { page } from "$app/state";`

## i18n

All user-facing strings must use Paraglide: `{m.key_name()}`. Never hardcode display text.

## Styling

Use TailwindCSS 4 utility classes. Merge conditional classes with `cn()`.
