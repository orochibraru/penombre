import { paraglideVitePlugin } from '@inlang/paraglide-js'
// @ts-nocheck

import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";
import { SvelteKitPWA } from '@vite-pwa/sveltekit'

export default defineConfig({
    plugins: [
        {
            name: "bun-external",
            enforce: "pre",
            resolveId(id) {
                if (id === "bun") return { id: "bun", external: true };
            },
        },
        paraglideVitePlugin({ 
            project: './project.inlang', 
            outdir: './src/lib/paraglide',
            strategy: ["localStorage", "cookie", "baseLocale"]
        }),
        tailwindcss(), 
        sveltekit(), 
        SvelteKitPWA()
    ],
    define: {
        SUPERFORMS_LEGACY: true
    },
    optimizeDeps: {
        exclude: ["bun"]
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

