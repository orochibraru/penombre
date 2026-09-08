// swagger-ui-dist ships no types of its own and there's no @types package for
// it, minimal ambient shim covering just what docs/api/+page.svelte uses.
// Mirrored from the main app's own src/swagger-ui-dist.d.ts, not shared,
// this package doesn't import from src/ (see its README on why it's a
// separate checkout entirely).
declare module "swagger-ui-dist/swagger-ui-bundle.js" {
	interface SwaggerUIBundleOptions {
		url?: string;
		dom_id?: string;
		domNode?: HTMLElement;
		presets?: unknown[];
	}

	interface SwaggerUIBundleStatic {
		(options: SwaggerUIBundleOptions): unknown;
		presets: { apis: unknown };
	}

	const SwaggerUIBundle: SwaggerUIBundleStatic;
	export default SwaggerUIBundle;
}
