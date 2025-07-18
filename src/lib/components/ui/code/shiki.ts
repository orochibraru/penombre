/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import { createHighlighterCore } from 'shiki/core';
// Follows the best practices established in https://shiki.matsu.io/guide/best-performance
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const bundledLanguages = {
	bash: () => import('@shikijs/langs/bash'),
	diff: () => import('@shikijs/langs/diff'),
	javascript: () => import('@shikijs/langs/javascript'),
	json: () => import('@shikijs/langs/json'),
	svelte: () => import('@shikijs/langs/svelte'),
	typescript: () => import('@shikijs/langs/typescript'),
	python: () => import('@shikijs/langs/python'),
	php: () => import('@shikijs/langs/php'),
	hcl: () => import('@shikijs/langs/hcl'),
	yaml: () => import('@shikijs/langs/yaml'),
	rust: () => import('@shikijs/langs/rust'),
	go: () => import('@shikijs/langs/go'),
	c: () => import('@shikijs/langs/c'),
	java: () => import('@shikijs/langs/java'),
	cpp: () => import('@shikijs/langs/cpp'),
	csharp: () => import('@shikijs/langs/csharp'),
	html: () => import('@shikijs/langs/html'),
	css: () => import('@shikijs/langs/css'),
	xml: () => import('@shikijs/langs/xml'),
	markdown: () => import('@shikijs/langs/markdown'),
	sql: () => import('@shikijs/langs/sql'),
	kotlin: () => import('@shikijs/langs/kotlin'),
	swift: () => import('@shikijs/langs/swift'),
	scss: () => import('@shikijs/langs/scss'),
	vue: () => import('@shikijs/langs/vue'),
	ruby: () => import('@shikijs/langs/ruby'),
	less: () => import('@shikijs/langs/less'),
	toml: () => import('@shikijs/langs/toml'),
	ini: () => import('@shikijs/langs/ini'),
	dockerfile: () => import('@shikijs/langs/dockerfile'),
	dotenv: () => import('@shikijs/langs/dotenv')
};

const languageBundle = Object.keys(bundledLanguages);

if (!languageBundle.includes('text')) {
	languageBundle.push('text');
}

export const supportedLanguages = languageBundle;

/** The languages configured for the highlighter */
export type SupportedLanguage = keyof typeof bundledLanguages | 'text';

/** A preloaded highlighter instance. */
export const highlighter = createHighlighterCore({
	themes: [
		import('@shikijs/themes/github-light-default'),
		import('@shikijs/themes/github-dark-default')
	],
	langs: Object.entries(bundledLanguages).map(([_, lang]) => lang),
	engine: createJavaScriptRegexEngine()
});
