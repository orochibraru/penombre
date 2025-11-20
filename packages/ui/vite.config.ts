// @ts-nocheck

import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { kitRoutes, type Options } from "vite-plugin-kit-routes";
import type { KIT_ROUTES } from "$lib/ROUTES";

export default defineConfig({
    plugins: [tailwindcss(), sveltekit(), kitRoutes()],
});

export const _kitRoutesConfig: Options<KIT_ROUTES> = {};
