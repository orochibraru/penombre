import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// A fully static build: every page is prerendered from `docs/*.md` and
		// `src/lib/config.ts` at build time (see `src/lib/docs-content.ts`,
		// and `docs/[slug]/+page.ts`'s `entries()`, which enumerates every
		// slug up front), so the output can be hosted anywhere plain files
		// can. No Node/Bun runtime, and no SPA fallback, since nothing here is
		// resolved at request time.
		adapter: adapter(),
	},
	preprocess: vitePreprocess(),
};

export default config;
