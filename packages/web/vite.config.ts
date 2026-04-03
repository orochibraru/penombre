import { paraglideVitePlugin } from '@inlang/paraglide-js'
// @ts-nocheck

import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";
import { SvelteKitPWA } from '@vite-pwa/sveltekit'

export default defineConfig({
    plugins: [
        paraglideVitePlugin({ 
            project: './project.inlang', 
            outdir: './src/lib/paraglide',
            strategy: ["localStorage", "cookie", "baseLocale"]
        }),
        tailwindcss(), 
        sveltekit(), 
        SvelteKitPWA()
    ],
}) satisfies UserConfig;

