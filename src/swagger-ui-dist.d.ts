// swagger-ui-dist ships no types of its own and there's no @types package for
// it — a minimal ambient shim covering just what (app)/api-docs uses.
declare module "swagger-ui-dist/swagger-ui-bundle.js" {
	interface SwaggerUIBundleOptions {
		url?: string;
		dom_id?: string;
		domNode?: HTMLElement;
		deepLinking?: boolean;
		presets?: unknown[];
	}

	interface SwaggerUIBundleStatic {
		(options: SwaggerUIBundleOptions): unknown;
		presets: { apis: unknown };
	}

	const SwaggerUIBundle: SwaggerUIBundleStatic;
	export default SwaggerUIBundle;
}
