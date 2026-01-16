import { describe, expect, it } from "bun:test";
import type { ObjectItem } from "$lib/api-client";
import {
	codeFileExtensions,
	codeFileNames,
	determineCodeFileLanguage,
	getFileExtension,
	isCodeItem,
} from "./file-utils";

/**
 * File utilities unit tests
 *
 * Tests for file extension detection, code file identification, and language determination.
 */

describe("getFileExtension", () => {
	it("should return extension for regular files", () => {
		expect(getFileExtension("document.pdf")).toBe("pdf");
		expect(getFileExtension("image.jpg")).toBe("jpg");
		expect(getFileExtension("script.js")).toBe("js");
		expect(getFileExtension("styles.css")).toBe("css");
	});

	it("should return extension for files with multiple dots", () => {
		expect(getFileExtension("file.min.js")).toBe("js");
		expect(getFileExtension("archive.tar.gz")).toBe("gz");
		expect(getFileExtension("component.test.ts")).toBe("ts");
		expect(getFileExtension("data.backup.2024.json")).toBe("json");
	});

	it("should return filename when no extension exists", () => {
		expect(getFileExtension("Dockerfile")).toBe("Dockerfile");
		expect(getFileExtension("Makefile")).toBe("Makefile");
		expect(getFileExtension("README")).toBe("README");
	});

	it("should return filename when dot is at the start (hidden files)", () => {
		expect(getFileExtension(".gitignore")).toBe(".gitignore");
		expect(getFileExtension(".env")).toBe(".env");
		expect(getFileExtension(".bashrc")).toBe(".bashrc");
	});

	it("should return filename when dot is at the end", () => {
		expect(getFileExtension("file.")).toBe("file.");
	});

	it("should handle empty string", () => {
		expect(getFileExtension("")).toBe("");
	});
});

describe("isCodeItem", () => {
	it("should return true for code file extensions", () => {
		expect(isCodeItem("script.js")).toBe(true);
		expect(isCodeItem("main.ts")).toBe(true);
		expect(isCodeItem("app.py")).toBe(true);
		expect(isCodeItem("styles.css")).toBe(true);
		expect(isCodeItem("index.html")).toBe(true);
		expect(isCodeItem("config.json")).toBe(true);
	});

	it("should return true for special code file names", () => {
		expect(isCodeItem("Dockerfile")).toBe(true);
		expect(isCodeItem("Makefile")).toBe(true);
		expect(isCodeItem(".env")).toBe(true);
	});

	it("should return false for non-code files", () => {
		expect(isCodeItem("image.jpg")).toBe(false);
		expect(isCodeItem("document.pdf")).toBe(false);
		expect(isCodeItem("video.mp4")).toBe(false);
		expect(isCodeItem("archive.zip")).toBe(false);
		expect(isCodeItem("music.mp3")).toBe(false);
	});

	it("should return false for files without extensions", () => {
		expect(isCodeItem("README")).toBe(false);
		expect(isCodeItem("LICENSE")).toBe(false);
	});

	it("should handle edge cases", () => {
		expect(isCodeItem("")).toBe(false);
		expect(isCodeItem(".")).toBe(false);
	});
});

describe("determineCodeFileLanguage", () => {
	function createMockItem(name: string): ObjectItem {
		return {
			key: name,
			metadata: { name },
		} as ObjectItem;
	}

	it("should detect JavaScript files", () => {
		expect(determineCodeFileLanguage(createMockItem("app.js"))).toBe(
			"javascript",
		);
		expect(determineCodeFileLanguage(createMockItem("module.mjs"))).toBe(
			"javascript",
		);
		expect(determineCodeFileLanguage(createMockItem("script.cjs"))).toBe(
			"javascript",
		);
	});

	it("should detect TypeScript files", () => {
		expect(determineCodeFileLanguage(createMockItem("app.ts"))).toBe(
			"typescript",
		);
		expect(determineCodeFileLanguage(createMockItem("Component.tsx"))).toBe(
			"typescript",
		);
	});

	it("should detect Python files", () => {
		expect(determineCodeFileLanguage(createMockItem("main.py"))).toBe("python");
	});

	it("should detect Java files", () => {
		expect(determineCodeFileLanguage(createMockItem("Main.java"))).toBe("java");
	});

	it("should detect C/C++ files", () => {
		expect(determineCodeFileLanguage(createMockItem("main.c"))).toBe("c");
		expect(determineCodeFileLanguage(createMockItem("main.cpp"))).toBe("cpp");
	});

	it("should detect C# files", () => {
		expect(determineCodeFileLanguage(createMockItem("Program.cs"))).toBe(
			"csharp",
		);
	});

	it("should detect Go files", () => {
		expect(determineCodeFileLanguage(createMockItem("main.go"))).toBe("go");
	});

	it("should detect Rust files", () => {
		expect(determineCodeFileLanguage(createMockItem("lib.rs"))).toBe("rust");
	});

	it("should detect PHP files", () => {
		expect(determineCodeFileLanguage(createMockItem("index.php"))).toBe("php");
	});

	it("should detect markup files", () => {
		expect(determineCodeFileLanguage(createMockItem("index.html"))).toBe(
			"html",
		);
		expect(determineCodeFileLanguage(createMockItem("page.htm"))).toBe("html");
		expect(determineCodeFileLanguage(createMockItem("styles.css"))).toBe("css");
		expect(determineCodeFileLanguage(createMockItem("data.xml"))).toBe("xml");
	});

	it("should detect data files", () => {
		expect(determineCodeFileLanguage(createMockItem("config.json"))).toBe(
			"json",
		);
		expect(determineCodeFileLanguage(createMockItem("tsconfig.jsonc"))).toBe(
			"json",
		);
		expect(determineCodeFileLanguage(createMockItem("config.yaml"))).toBe(
			"yaml",
		);
		expect(determineCodeFileLanguage(createMockItem("config.yml"))).toBe(
			"yaml",
		);
		expect(determineCodeFileLanguage(createMockItem("config.toml"))).toBe(
			"toml",
		);
	});

	it("should detect markdown files", () => {
		expect(determineCodeFileLanguage(createMockItem("README.md"))).toBe(
			"markdown",
		);
	});

	it("should detect SQL files", () => {
		expect(determineCodeFileLanguage(createMockItem("query.sql"))).toBe("sql");
	});

	it("should detect shell scripts", () => {
		expect(determineCodeFileLanguage(createMockItem("install.sh"))).toBe(
			"bash",
		);
	});

	it("should detect Ruby files", () => {
		expect(determineCodeFileLanguage(createMockItem("app.rb"))).toBe("ruby");
	});

	it("should detect Swift files", () => {
		expect(determineCodeFileLanguage(createMockItem("AppDelegate.swift"))).toBe(
			"swift",
		);
	});

	it("should detect Kotlin files", () => {
		expect(determineCodeFileLanguage(createMockItem("MainActivity.kt"))).toBe(
			"kotlin",
		);
	});

	it("should detect Vue files", () => {
		expect(determineCodeFileLanguage(createMockItem("App.vue"))).toBe("vue");
	});

	it("should detect Svelte files", () => {
		expect(determineCodeFileLanguage(createMockItem("Component.svelte"))).toBe(
			"svelte",
		);
	});

	it("should detect SCSS/SASS/LESS files", () => {
		expect(determineCodeFileLanguage(createMockItem("styles.scss"))).toBe(
			"scss",
		);
		expect(determineCodeFileLanguage(createMockItem("styles.sass"))).toBe(
			"scss",
		);
		expect(determineCodeFileLanguage(createMockItem("styles.less"))).toBe(
			"less",
		);
	});

	it("should detect config files", () => {
		expect(determineCodeFileLanguage(createMockItem("config.ini"))).toBe("ini");
		expect(determineCodeFileLanguage(createMockItem("main.hcl"))).toBe("hcl");
		expect(determineCodeFileLanguage(createMockItem("main.tf"))).toBe("hcl");
		// Note: .env matches the "env" includes check in codeFileNames, returns dockerfile
		expect(determineCodeFileLanguage(createMockItem(".env"))).toBe(
			"dockerfile",
		);
	});

	it("should default to text for unknown extensions", () => {
		expect(determineCodeFileLanguage(createMockItem("file.xyz"))).toBe("text");
		expect(determineCodeFileLanguage(createMockItem("unknown.abc"))).toBe(
			"text",
		);
	});

	it("should use item.key when metadata.name is not available", () => {
		const item = { key: "script.ts" } as ObjectItem;
		expect(determineCodeFileLanguage(item)).toBe("typescript");
	});
});

describe("codeFileExtensions", () => {
	it("should contain common code file extensions", () => {
		expect(codeFileExtensions).toContain(".js");
		expect(codeFileExtensions).toContain(".ts");
		expect(codeFileExtensions).toContain(".py");
		expect(codeFileExtensions).toContain(".css");
		expect(codeFileExtensions).toContain(".html");
		expect(codeFileExtensions).toContain(".json");
	});

	it("should be an array of strings", () => {
		expect(Array.isArray(codeFileExtensions)).toBe(true);
		for (const ext of codeFileExtensions) {
			expect(typeof ext).toBe("string");
			expect(ext.startsWith(".")).toBe(true);
		}
	});
});

describe("codeFileNames", () => {
	it("should contain special code file names", () => {
		expect(codeFileNames).toContain("Dockerfile");
		expect(codeFileNames).toContain("Makefile");
		expect(codeFileNames).toContain(".env");
	});

	it("should be an array of strings", () => {
		expect(Array.isArray(codeFileNames)).toBe(true);
		for (const name of codeFileNames) {
			expect(typeof name).toBe("string");
		}
	});
});
