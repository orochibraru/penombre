import type { ObjectItem } from "$lib/api-client";
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

	return filename.substring(lastDotIndex + 1);
}

export function isCodeItem(fileName: string) {
	return (
		codeFileExtensions.includes(`.${getFileExtension(fileName)}`) ||
		codeFileNames.includes(fileName)
	);
}

export function determineCodeFileLanguage(item: ObjectItem): SupportedLanguage {
	const fileExtension = getFileExtension(item.key);

	if (fileExtension === item.key) {
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

	switch (fileExtension) {
		case "js":
		case "mjs":
		case "cjs":
			return "javascript";
		case "ts":
		case "tsx":
			return "typescript";
		case "py":
			return "python";
		case "java":
			return "java";
		case "c":
			return "c";
		case "cpp":
			return "cpp";
		case "cs":
			return "csharp";
		case "go":
			return "go";
		case "rs":
			return "rust";
		case "php":
			return "php";
		case "html":
		case "htm":
			return "html";
		case "css":
			return "css";
		case "json":
		case "jsonc":
			return "json";
		case "xml":
			return "xml";
		case "yaml":
		case "yml":
			return "yaml";
		case "md":
			return "markdown";
		case "sql":
			return "sql";
		case "sh":
			return "bash";
		case "rb":
			return "ruby";
		case "swift":
			return "swift";
		case "kt":
			return "kotlin";
		case "vue":
			return "vue";
		case "svelte":
			return "svelte";
		case "scss":
		case "sass":
			return "scss";
		case "less":
			return "less";
		case "toml":
			return "toml";
		case "ini":
			return "ini";
		case "env":
			return "dotenv";
		case "hcl":
		case "tf":
			return "hcl";
		default:
			return "text";
	}
}
