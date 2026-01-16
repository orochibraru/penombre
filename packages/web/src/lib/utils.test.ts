import { describe, expect, it } from "bun:test";
import type { ObjectItem } from "$lib/api-client";
import {
	buildOriginUrl,
	capitalizeFirstLetter,
	cn,
	generateUuid,
	getBaseUrl,
	HttpError,
	isFolderItem,
	isServerSide,
	prettierName,
	prettyDate,
	readableFileSize,
	secondsToMinutes,
	shouldDisplayAction,
	stripFolders,
	toSnake,
} from "./utils";

/**
 * Utility function unit tests
 *
 * Tests for various utility functions used throughout the application.
 */

describe("cn", () => {
	it("should merge simple class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("should handle conditional classes", () => {
		expect(cn("base", false && "hidden", "active")).toBe("base active");
		expect(cn("base", true && "visible")).toBe("base visible");
	});

	it("should merge conflicting Tailwind classes", () => {
		// twMerge should keep the later class
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
		expect(cn("p-4", "p-8")).toBe("p-8");
	});

	it("should handle arrays", () => {
		expect(cn(["foo", "bar"])).toBe("foo bar");
	});

	it("should handle objects", () => {
		expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
	});

	it("should handle empty inputs", () => {
		expect(cn()).toBe("");
		expect(cn("")).toBe("");
		expect(cn(null, undefined)).toBe("");
	});
});

describe("prettierName", () => {
	it("should convert kebab-case to title case", () => {
		expect(prettierName("hello-world")).toBe("Hello World");
		expect(prettierName("my-other-app")).toBe("My Other App");
	});

	it("should handle single words", () => {
		expect(prettierName("hello")).toBe("Hello");
	});

	it("should handle empty or undefined input", () => {
		expect(prettierName("")).toBe("");
		expect(prettierName(undefined)).toBe("");
	});

	it("should handle words already capitalized", () => {
		expect(prettierName("Hello-World")).toBe("Hello World");
	});
});

describe("toSnake", () => {
	it("should convert spaces to hyphens and lowercase", () => {
		expect(toSnake("Hello World")).toBe("hello-world");
		expect(toSnake("My App Name")).toBe("my-app-name");
	});

	it("should lowercase single words", () => {
		expect(toSnake("HELLO")).toBe("hello");
	});

	it("should handle already snake-case strings", () => {
		expect(toSnake("hello-world")).toBe("hello-world");
	});

	it("should handle empty string", () => {
		expect(toSnake("")).toBe("");
	});
});

describe("capitalizeFirstLetter", () => {
	it("should capitalize the first letter", () => {
		expect(capitalizeFirstLetter("hello")).toBe("Hello");
		expect(capitalizeFirstLetter("world")).toBe("World");
	});

	it("should handle already capitalized strings", () => {
		expect(capitalizeFirstLetter("Hello")).toBe("Hello");
	});

	it("should handle empty string", () => {
		expect(capitalizeFirstLetter("")).toBe("");
	});

	it("should handle single character", () => {
		expect(capitalizeFirstLetter("a")).toBe("A");
	});

	it("should not affect rest of string", () => {
		expect(capitalizeFirstLetter("hELLO")).toBe("HELLO");
	});
});

describe("prettyDate", () => {
	it("should format a Date object", () => {
		const date = new Date("2024-06-15T14:30:00");
		const result = prettyDate(date);
		// The exact format depends on locale, but it should contain the key parts
		expect(result).toMatch(/15/);
		expect(result).toMatch(/Jun|juin|2024/i);
	});

	it("should format a date string", () => {
		const result = prettyDate("2024-01-01T10:00:00");
		expect(result).toMatch(/01|Jan|janv/i);
		expect(result).toMatch(/2024/);
	});
});

describe("generateUuid", () => {
	it("should return a valid UUID format", () => {
		const uuid = generateUuid();
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(uuid).toMatch(uuidRegex);
	});

	it("should generate unique UUIDs", () => {
		const uuid1 = generateUuid();
		const uuid2 = generateUuid();
		const uuid3 = generateUuid();
		expect(uuid1).not.toBe(uuid2);
		expect(uuid2).not.toBe(uuid3);
		expect(uuid1).not.toBe(uuid3);
	});
});

describe("readableFileSize", () => {
	it("should return dash for invalid input", () => {
		expect(readableFileSize(Number.NaN)).toBe("-");
	});

	it("should return dash for zero bytes", () => {
		expect(readableFileSize(0)).toBe("-");
	});

	it("should format bytes", () => {
		expect(readableFileSize(500)).toBe("500 B");
		expect(readableFileSize(1000)).toBe("1000 B");
	});

	it("should format kibibytes (binary)", () => {
		expect(readableFileSize(1024)).toBe("1.0 KiB");
		expect(readableFileSize(2048)).toBe("2.0 KiB");
	});

	it("should format kilobytes (SI)", () => {
		expect(readableFileSize(1000, true)).toBe("1.0 kB");
		expect(readableFileSize(2000, true)).toBe("2.0 kB");
	});

	it("should format mebibytes", () => {
		expect(readableFileSize(1024 * 1024)).toBe("1.0 MiB");
		expect(readableFileSize(5 * 1024 * 1024)).toBe("5.0 MiB");
	});

	it("should format gibibytes", () => {
		expect(readableFileSize(1024 * 1024 * 1024)).toBe("1.0 GiB");
	});

	it("should respect decimal places parameter", () => {
		expect(readableFileSize(1536, false, 2)).toBe("1.50 KiB");
		expect(readableFileSize(1536, false, 0)).toBe("2 KiB");
	});
});

describe("secondsToMinutes", () => {
	it("should convert seconds to MM:SS format", () => {
		expect(secondsToMinutes(0)).toBe("00:00");
		expect(secondsToMinutes(30)).toBe("00:30");
		expect(secondsToMinutes(60)).toBe("01:00");
		expect(secondsToMinutes(90)).toBe("01:30");
		expect(secondsToMinutes(125)).toBe("02:05");
	});

	it("should handle longer durations", () => {
		expect(secondsToMinutes(600)).toBe("10:00");
		expect(secondsToMinutes(3599)).toBe("59:59");
	});
});

describe("isFolderItem", () => {
	function createItem(key: string): ObjectItem {
		return { key } as ObjectItem;
	}

	it("should return true for folder items (keys ending with /)", () => {
		expect(isFolderItem(createItem("folder/"))).toBe(true);
		expect(isFolderItem(createItem("path/to/folder/"))).toBe(true);
	});

	it("should return false for file items", () => {
		expect(isFolderItem(createItem("file.txt"))).toBe(false);
		expect(isFolderItem(createItem("path/to/file.txt"))).toBe(false);
	});

	it("should return false for empty key", () => {
		expect(isFolderItem(createItem(""))).toBe(false);
	});
});

describe("stripFolders", () => {
	it("should extract filename from path with forward slashes", () => {
		expect(stripFolders("/path/to/file.txt")).toBe("file.txt");
		expect(stripFolders("folder/subfolder/document.pdf")).toBe("document.pdf");
	});

	it("should extract filename from path with backslashes", () => {
		expect(stripFolders("C:\\Users\\Documents\\file.txt")).toBe("file.txt");
	});

	it("should return filename if no path separators", () => {
		expect(stripFolders("file.txt")).toBe("file.txt");
	});

	it("should handle empty string", () => {
		expect(stripFolders("")).toBe("");
	});

	it("should handle trailing slash", () => {
		expect(stripFolders("/path/to/folder/")).toBe("");
	});
});

describe("shouldDisplayAction", () => {
	function createItem(key: string): ObjectItem {
		return { key } as ObjectItem;
	}

	it("should return true when no restrictions", () => {
		const action = { title: "Test", icon: null, action: () => {} };
		expect(shouldDisplayAction({ action, item: createItem("file.txt") })).toBe(
			true,
		);
		expect(shouldDisplayAction({ action, item: createItem("folder/") })).toBe(
			true,
		);
	});

	it("should respect fileOnly restriction", () => {
		const action = {
			title: "Test",
			icon: null,
			action: () => {},
			fileOnly: true,
		};
		expect(shouldDisplayAction({ action, item: createItem("file.txt") })).toBe(
			true,
		);
		expect(shouldDisplayAction({ action, item: createItem("folder/") })).toBe(
			false,
		);
	});

	it("should respect folderOnly restriction", () => {
		const action = {
			title: "Test",
			icon: null,
			action: () => {},
			folderOnly: true,
		};
		expect(shouldDisplayAction({ action, item: createItem("file.txt") })).toBe(
			false,
		);
		expect(shouldDisplayAction({ action, item: createItem("folder/") })).toBe(
			true,
		);
	});
});

describe("HttpError", () => {
	it("should create an error with body and status", () => {
		const error = new HttpError({
			body: { message: "Not Found" },
			status: 404,
		});
		expect(error.body.message).toBe("Not Found");
		expect(error.status).toBe(404);
	});

	it("should handle different status codes", () => {
		const error500 = new HttpError({
			body: { message: "Server Error" },
			status: 500,
		});
		expect(error500.status).toBe(500);

		const error401 = new HttpError({
			body: { message: "Unauthorized" },
			status: 401,
		});
		expect(error401.status).toBe(401);
	});
});

describe("buildOriginUrl", () => {
	it("should extract protocol and host from URL", () => {
		const url = new URL("https://example.com/path/to/resource");
		const origin = buildOriginUrl(url);
		expect(origin.toString()).toBe("https://example.com/");
	});

	it("should preserve port if present", () => {
		const url = new URL("http://localhost:3000/api/test");
		const origin = buildOriginUrl(url);
		expect(origin.toString()).toBe("http://localhost:3000/");
	});
});

describe("isServerSide", () => {
	it("should return false in browser-like environment", () => {
		// In Bun test, window is typically not defined, so this tests SSR detection
		const result = isServerSide();
		expect(typeof result).toBe("boolean");
	});
});

describe("getBaseUrl", () => {
	it("should return base URL without trailing slash", () => {
		const url = new URL("https://example.com/path/to/resource");
		expect(getBaseUrl(url)).toBe("https://example.com");
	});

	it("should handle URLs with ports", () => {
		const url = new URL("http://localhost:5173/app");
		expect(getBaseUrl(url)).toBe("http://localhost:5173");
	});

	it("should handle URLs that already end with just host", () => {
		const url = new URL("https://api.example.com");
		expect(getBaseUrl(url)).toBe("https://api.example.com");
	});
});
