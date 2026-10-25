import { afterEach, describe, expect, test } from "bun:test";

import { resolve } from "$app/paths";

import type { ObjectItem } from "#lib/api/index.js";
import {
	buildOriginUrl,
	capitalizeFirstLetter,
	cn,
	copyText,
	etaLabel,
	generateUuid,
	getBaseUrl,
	getCookie,
	getDocumentType,
	getFileIconType,
	HttpError,
	isBrowsableListing,
	isFolderItem,
	isServerSide,
	isTrashListing,
	type ItemAction,
	listingHref,
	PARENT_KEY,
	parentHref,
	prettierName,
	prettyDate,
	randomId,
	readableFileSize,
	resolveDropDestination,
	resolveParentPath,
	secondsToMinutes,
	shouldDisplayAction,
	stripFolders,
	toggleFullscreen,
	toSnake,
} from "#lib/utils.js";

const originalDocument = Object.getOwnPropertyDescriptor(
	globalThis,
	"document",
);

/** Stands in for the browser's `document` until the test ends. */
function setDocument(value: object) {
	Object.defineProperty(globalThis, "document", {
		value,
		configurable: true,
	});
}

afterEach(() => {
	if (originalDocument) {
		Object.defineProperty(globalThis, "document", originalDocument);
	} else {
		delete (globalThis as { document?: unknown }).document;
	}
});

describe("resolveParentPath", () => {
	test("is undefined where there is nothing to go up to", () => {
		// No `path` param at all: /browse, and every non-browse listing.
		expect(resolveParentPath(undefined)).toBeUndefined();
		expect(resolveParentPath("")).toBeUndefined();
	});

	test("returns the drive root one level down", () => {
		expect(resolveParentPath("photos")).toBe("");
	});

	test("drops the last segment of a nested path", () => {
		expect(resolveParentPath("photos/2024/summer")).toBe("photos/2024");
	});
});

describe("resolveDropDestination", () => {
	test("resolves the parent row to the folder above", () => {
		expect(resolveDropDestination(PARENT_KEY, "photos/2024")).toBe("photos");
		expect(resolveDropDestination(PARENT_KEY, "photos")).toBe("");
		expect(resolveDropDestination(PARENT_KEY, undefined)).toBe("");
	});

	test("resolves a folder row to a child of the current folder", () => {
		expect(resolveDropDestination("summer/", "photos/2024")).toBe(
			"photos/2024/summer",
		);
		expect(resolveDropDestination("photos/", undefined)).toBe("photos");
	});
});

describe("randomId", () => {
	test("is unique across calls", () => {
		const ids = new Set(Array.from({ length: 200 }, () => randomId()));
		expect(ids.size).toBe(200);
	});

	test("works without crypto.randomUUID (an insecure context)", () => {
		// Plain HTTP at a LAN address: the property is simply absent, and
		// reaching for it used to throw and take the waveform down with it.
		// Defined on the instance rather than deleted — it lives on
		// `Crypto.prototype`, so deleting the own property changes nothing.
		Object.defineProperty(globalThis.crypto, "randomUUID", {
			value: undefined,
			configurable: true,
		});
		try {
			expect(randomId()).toMatch(/^[0-9a-f]{32}$/);
		} finally {
			delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID;
		}
	});

	test("still works with no crypto at all", () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
		});
		try {
			expect(randomId().length).toBeGreaterThan(8);
		} finally {
			if (original) {
				Object.defineProperty(globalThis, "crypto", original);
			}
		}
	});
});

describe("names", () => {
	test("merges Tailwind classes, the last one winning", () => {
		expect(cn("px-2 text-sm", false, "px-4")).toBe("text-sm px-4");
	});

	test("turns a kebab-cased name into words", () => {
		expect(prettierName("my-other-app")).toBe("My Other App");
		expect(prettierName(undefined)).toBe("");
		expect(prettierName("")).toBe("");
	});

	test("kebab-cases a name", () => {
		expect(toSnake("My Other App")).toBe("my-other-app");
	});

	test("capitalizes the first letter only", () => {
		expect(capitalizeFirstLetter("hello world")).toBe("Hello world");
		expect(capitalizeFirstLetter("")).toBe("");
	});

	test("keeps the file name of a path, whichever the separator", () => {
		expect(stripFolders("photos/2024/summer.jpg")).toBe("summer.jpg");
		expect(stripFolders("C:\\Users\\me\\notes.txt")).toBe("notes.txt");
		expect(stripFolders("plain.txt")).toBe("plain.txt");
		expect(stripFolders("")).toBe("");
	});
});

describe("readableFileSize", () => {
	test("is a dash for a size that is not a number", () => {
		expect(readableFileSize(Number.NaN)).toBe("-");
	});

	test("counts bytes below the first unit", () => {
		expect(readableFileSize(0)).toBe("0 B");
		expect(readableFileSize(1023)).toBe("1023 B");
		expect(readableFileSize(999, true)).toBe("999 B");
	});

	test("uses binary units by default and decimal ones on request", () => {
		expect(readableFileSize(1536)).toBe("1.5 KiB");
		expect(readableFileSize(1500, true)).toBe("1.5 kB");
		expect(readableFileSize(5 * 1024 ** 3, false, 2)).toBe("5.00 GiB");
		expect(readableFileSize(-2048)).toBe("-2.0 KiB");
	});

	test("moves up a unit when rounding would reach it", () => {
		expect(readableFileSize(1024 * 1024 - 1)).toBe("1.0 MiB");
	});
});

describe("time", () => {
	test("shows seconds as minutes and seconds", () => {
		expect(secondsToMinutes(75)).toBe("01:15");
		expect(secondsToMinutes(0)).toBe("00:00");
	});

	test("rounds an estimate to the unit a person would say", () => {
		expect(etaLabel(0.2)).toBe("1 second");
		expect(etaLabel(42)).toBe("42 seconds");
		expect(etaLabel(100)).toBe("2 minutes");
		expect(etaLabel(5400)).toBe("1.5 hours");
	});

	test("formats a date in the browser's language", () => {
		Object.defineProperty(navigator, "language", {
			value: "en-GB",
			configurable: true,
		});
		try {
			// Day before month: British, not the default American order.
			expect(prettyDate("2024-03-14T09:05:00")).toMatch(
				/^14 Mar 2024\D+09:05$/,
			);
			expect(prettyDate(new Date("2024-03-14T09:05:00"))).toMatch(
				/^14 Mar 2024\D+09:05$/,
			);
		} finally {
			delete (navigator as { language?: string }).language;
		}
	});
});

describe("generateUuid", () => {
	test("makes distinct v4 ids", () => {
		const first = generateUuid();
		const second = generateUuid();
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
		expect(second).not.toBe(first);
	});
});

describe("HttpError", () => {
	test("keeps the status and body it was made from", () => {
		const error = new HttpError({ status: 404, body: { message: "Gone" } });
		expect(error.status).toBe(404);
		expect(error.body).toEqual({ message: "Gone" });
	});
});

describe("getCookie", () => {
	test("reads one cookie out of the jar", () => {
		setDocument({ cookie: "theme=dark; session=abc123; lang=fr" });
		expect(getCookie("session")).toBe("abc123");
		expect(getCookie("lang")).toBe("fr");
	});

	test("is undefined for a cookie that is not set", () => {
		setDocument({ cookie: "theme=dark" });
		expect(getCookie("session")).toBeUndefined();
	});
});

describe("listings", () => {
	test("links the personal drive's folders", () => {
		expect(listingHref("photos/2024")).toBe("/browse/[...path]");
		expect(resolve).toHaveBeenLastCalledWith("/(app)/browse/[...path]", {
			path: "photos/2024",
		});
		expect(listingHref("")).toBe("/browse");
	});

	test("links a drive's, a volume's and a share's folders", () => {
		expect(listingHref("a", { drive: "d1" })).toBe("/drives/[drive]/[...path]");
		expect(resolve).toHaveBeenLastCalledWith(
			"/(app)/drives/[drive]/[...path]",
			{ drive: "d1", path: "a" },
		);
		expect(listingHref("", { drive: "d1" })).toBe("/drives/[drive]");
		expect(listingHref("a", { volume: "music" })).toBe(
			"/volumes/[volume]/[...path]",
		);
		expect(resolve).toHaveBeenLastCalledWith(
			"/(app)/volumes/[volume]/[...path]",
			{ volume: "music", path: "a" },
		);
		expect(listingHref("", { volume: "music" })).toBe("/volumes/[volume]");
		expect(parentHref("a", { share: "s1" })).toBe(
			"/shared-with-me/[share]/[...path]",
		);
		expect(resolve).toHaveBeenLastCalledWith(
			"/(app)/shared-with-me/[share]/[...path]",
			{ share: "s1", path: "a" },
		);
		expect(parentHref("", { share: "s1" })).toBe("/shared-with-me/[share]");
	});

	test("tells the trashes apart from everything else", () => {
		expect(isTrashListing("/trash")).toBe(true);
		expect(isTrashListing("/drives/d1/trash")).toBe(true);
		expect(isTrashListing("/volumes/music/trash")).toBe(true);
		expect(isTrashListing("/drives/d1/trash/more")).toBe(false);
		expect(isTrashListing("/browse/trash")).toBe(false);
	});

	test("offers uploads only where things can be put", () => {
		expect(isBrowsableListing("/browse")).toBe(true);
		expect(isBrowsableListing("/browse/photos")).toBe(true);
		expect(isBrowsableListing("/drives/d1")).toBe(true);
		expect(isBrowsableListing("/volumes/music/a")).toBe(true);
		expect(isBrowsableListing("/shared-with-me/s1")).toBe(true);
		expect(isBrowsableListing("/drives/d1/trash")).toBe(false);
		expect(isBrowsableListing("/recent")).toBe(false);
	});
});

describe("shouldDisplayAction", () => {
	const folder = { key: "photos/" } as ObjectItem;
	const file = { key: "a.txt" } as ObjectItem;
	const action = (extra: Partial<ItemAction>): ItemAction => ({
		title: "Open",
		icon: null,
		action: () => undefined,
		...extra,
	});

	test("knows a folder by its trailing slash", () => {
		expect(isFolderItem(folder)).toBe(true);
		expect(isFolderItem(file)).toBe(false);
	});

	test("keeps file-only and folder-only actions to their kind", () => {
		expect(shouldDisplayAction({ action: action({}), item: file })).toBe(true);
		expect(
			shouldDisplayAction({ action: action({ fileOnly: true }), item: folder }),
		).toBe(false);
		expect(
			shouldDisplayAction({ action: action({ fileOnly: true }), item: file }),
		).toBe(true);
		expect(
			shouldDisplayAction({ action: action({ folderOnly: true }), item: file }),
		).toBe(false);
		expect(
			shouldDisplayAction({
				action: action({ folderOnly: true }),
				item: folder,
			}),
		).toBe(true);
	});

	test("asks a hidden action about the item it is shown for", () => {
		const hidden = action({ hidden: (item) => item.key === "a.txt" });
		expect(shouldDisplayAction({ action: hidden, item: file })).toBe(false);
		expect(shouldDisplayAction({ action: hidden, item: folder })).toBe(true);
	});
});

describe("origins", () => {
	test("keeps only the protocol and host", () => {
		const url = new URL("https://drive.example:8443/browse/a?x=1#top");
		expect(buildOriginUrl(url).href).toBe("https://drive.example:8443/");
		expect(getBaseUrl(url)).toBe("https://drive.example:8443");
	});

	test("knows it runs on the server here", () => {
		expect(isServerSide()).toBe(true);
	});
});

describe("file kinds", () => {
	const kinds: [string, string, string | null][] = [
		["application/msword", "word", "word"],
		[
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"word",
			"word",
		],
		["application/vnd.ms-excel", "excel", "excel"],
		[
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"excel",
			"excel",
		],
		["application/vnd.ms-powerpoint", "powerpoint", "powerpoint"],
		[
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"powerpoint",
			"powerpoint",
		],
		["application/vnd.google-apps.document", "gdoc", "gdoc"],
		["application/vnd.google-apps.spreadsheet", "gsheet", "gsheet"],
		["application/vnd.google-apps.presentation", "gslide", "gslide"],
		["application/pdf", "pdf", "pdf"],
		["application/json", "code", null],
		["text/yaml", "code", null],
		["application/zip", "archive", null],
		["application/gzip", "archive", null],
		["image/png", "default", null],
	];

	test.each(kinds)("%s has the %s icon", (type, icon, document) => {
		expect(getFileIconType(type)).toBe(icon as "default");
		expect(getDocumentType(type)).toBe(document as null);
	});

	test("a file with no type is the default", () => {
		expect(getFileIconType(undefined)).toBe("default");
		expect(getDocumentType(undefined)).toBeNull();
	});
});

describe("toggleFullscreen", () => {
	test("leaves full screen when something holds it", () => {
		const calls: string[] = [];
		setDocument({
			fullscreenElement: {},
			exitFullscreen: async () => {
				calls.push("exit");
			},
		});
		const element = {
			requestFullscreen: async () => {
				calls.push("enter");
			},
		} as unknown as HTMLElement;
		toggleFullscreen(element);
		expect(calls).toEqual(["exit"]);
	});

	test("puts the element in full screen", () => {
		const calls: string[] = [];
		setDocument({ fullscreenElement: null });
		const element = {
			requestFullscreen: async () => {
				calls.push("enter");
			},
		} as unknown as HTMLElement;
		toggleFullscreen(element);
		expect(calls).toEqual(["enter"]);
	});

	test("falls back to the video's own full screen on iOS", () => {
		const calls: string[] = [];
		setDocument({ fullscreenElement: null });
		const video = {
			webkitEnterFullscreen: () => calls.push("video"),
		} as unknown as HTMLVideoElement;
		toggleFullscreen({} as HTMLElement, video);
		expect(calls).toEqual(["video"]);
		// Nothing to fall back to: nothing happens.
		toggleFullscreen(null, null);
		expect(calls).toEqual(["video"]);
	});
});

describe("copyText", () => {
	const originalClipboard = Object.getOwnPropertyDescriptor(
		navigator,
		"clipboard",
	);

	afterEach(() => {
		if (originalClipboard) {
			Object.defineProperty(navigator, "clipboard", originalClipboard);
		} else {
			delete (navigator as { clipboard?: unknown }).clipboard;
		}
	});

	test("writes to the clipboard in a secure context", async () => {
		const written: string[] = [];
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: async (text: string) => written.push(text) },
			configurable: true,
		});
		expect(await copyText("https://drive.example/go/folder/1")).toBe(true);
		expect(written).toEqual(["https://drive.example/go/folder/1"]);
	});

	test("copies through a selected textarea without one", async () => {
		const events: string[] = [];
		const area = {
			value: "",
			style: {} as Record<string, string>,
			select: () => events.push(`select ${area.value}`),
			remove: () => events.push("remove"),
		};
		setDocument({
			createElement: (tag: string) => {
				events.push(`create ${tag}`);
				return area;
			},
			body: { append: () => events.push("append") },
			execCommand: (command: string) => {
				events.push(command);
				return true;
			},
		});
		expect(await copyText("hello")).toBe(true);
		expect(events).toEqual([
			"create textarea",
			"append",
			"select hello",
			"copy",
			"remove",
		]);
		expect(area.style).toEqual({ position: "fixed", opacity: "0" });
	});

	test("reports a copy the browser refused", async () => {
		const area = {
			value: "",
			style: {},
			select: () => undefined,
			remove: () => undefined,
		};
		setDocument({
			createElement: () => area,
			body: { append: () => undefined },
			execCommand: () => false,
		});
		expect(await copyText("hello")).toBe(false);
	});
});
