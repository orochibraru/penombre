import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { kitRoutes } from "vite-plugin-kit-routes";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  plugins: [tailwindcss(), sveltekit(), kitRoutes()],
  test: {
    hookTimeout: 30000,
    globals: true,
    name: "server",
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
    deps: {
      inline: ["@sveltejs/kit"],
    },
  },
});
