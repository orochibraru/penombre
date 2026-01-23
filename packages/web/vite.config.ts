import { paraglideVitePlugin } from '@inlang/paraglide-js'
// @ts-nocheck

import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";
import { kitRoutes, type Options } from "vite-plugin-kit-routes";
import type { KIT_ROUTES } from "$lib/ROUTES";

export default defineConfig({
    plugins: [
        paraglideVitePlugin({ 
            project: './project.inlang', 
            outdir: './src/lib/paraglide',
            strategy: ["localStorage", "cookie", "baseLocale"]
        }),
        tailwindcss(), 
        sveltekit(), 
        kitRoutes()
    ],
    define: {
        SUPERFORMS_LEGACY: true
    },
    build: {
        rollupOptions: {
            external: ["bun"]
        }
    },
    ssr: {
        external: ["bun"]
    }
}) satisfies UserConfig;

export const _kitRoutesConfig: Options<KIT_ROUTES> = {};
