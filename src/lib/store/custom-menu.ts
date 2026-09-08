import { writable } from "svelte/store";
import type { NavItem } from "$lib/components/layout/nav.svelte";

export const customMenu = writable<{ title: string; items: NavItem[] } | null>(
	null,
);
