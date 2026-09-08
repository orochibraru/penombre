import type { ObjectItem } from "$lib/api";
import {
	type SupportedLanguage,
	supportedLanguages,
} from "$lib/components/ui/code/shiki";

export const codeFileExtensions = [
	// Web front-end
	".html",
	".htm",
	".css",
	".scss",
	".sass",
	".less",
	".js",
	".mjs",
	".cjs",
	".ts",
	".tsx",
	".jsx",
	".vue",
	".svelte",

	// Back-end
	".php",
	".py",
	".rb",
	".java",
	".go",
	".rs",
	".c",
	".cpp",
	".cs",
	".swift",
	".kt",

	// Config, data, markup, and shell
	".env",
	".json",
	".jsonc",
	".xml",
	".yaml",
	".yml",
	".toml",
	".ini",
	".env",
	".md",
	".sql",
	".sh",
	".hcl",
	".tf",

	// Scripts
	".ps1",
	".bat",
	".cmd",
	".sh",
];

export const codeFileNames = [
	"Dockerfile",
	"Taskfile",
	"Makefile",
	"Caddyfile",
	".env",
];

export function getFileExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf(".");

	if (
		lastDotIndex === -1 ||
		lastDotIndex === 0 ||
		lastDotIndex === filename.length - 1
	) {
		return filename;
	}

	return filename.slice(lastDotIndex + 1);
}

export function isCodeItem(fileName: string) {
	return (
		codeFileExtensions.includes(`.${getFileExtension(fileName)}`) ||
		codeFileNames.includes(fileName)
	);
}

const EXTENSION_LANGUAGES: Record<string, SupportedLanguage> = {
	js: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	ts: "typescript",
	tsx: "typescript",
	py: "python",
	java: "java",
	c: "c",
	cpp: "cpp",
	cs: "csharp",
	go: "go",
	rs: "rust",
	php: "php",
	html: "html",
	htm: "html",
	css: "css",
	json: "json",
	jsonc: "json",
	xml: "xml",
	yaml: "yaml",
	yml: "yaml",
	md: "markdown",
	sql: "sql",
	sh: "bash",
	rb: "ruby",
	swift: "swift",
	kt: "kotlin",
	vue: "vue",
	svelte: "svelte",
	scss: "scss",
	sass: "scss",
	less: "less",
	toml: "toml",
	ini: "ini",
	env: "dotenv",
	hcl: "hcl",
	tf: "hcl",
};

export function determineCodeFileLanguage(item: ObjectItem): SupportedLanguage {
	const display = item.metadata?.name || item.key;
	const fileExtension = getFileExtension(display);

	if (fileExtension === display) {
		// Try special code file names
		for (const codeFileName of codeFileNames) {
			const isSupported = supportedLanguages.find(
				(supportedLang) => supportedLang === codeFileName.toLowerCase(),
			);
			if (isSupported) {
				return isSupported as SupportedLanguage;
			}
		}
	}

	return EXTENSION_LANGUAGES[fileExtension] ?? "text";
}
