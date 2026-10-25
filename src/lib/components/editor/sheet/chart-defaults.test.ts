import { afterEach, describe, expect, test } from "bun:test";

import { CATEGORICAL } from "#lib/chart/render.js";

import { chartPalette, seriesLabel } from "./chart-defaults";

/** What a canvas paints each colour as: `[r, g, b, a]`. */
const PAINTED: Record<string, number[]> = {
	"#000000": [0, 0, 0, 255],
	"oklch(0.45 0.15 15)": [128, 16, 48, 255],
	transparent: [0, 0, 0, 0],
};

function fakeDocument(options: {
	dark?: boolean;
	primary: string;
	canvas?: boolean;
}) {
	let fill = "#000000";
	const context = {
		clearRect: () => undefined,
		fillRect: () => undefined,
		set fillStyle(value: string) {
			fill = value;
		},
		get fillStyle() {
			return fill;
		},
		getImageData: () => ({ data: PAINTED[fill] ?? [0, 0, 0, 255] }),
	};
	Object.defineProperty(globalThis, "document", {
		value: {
			documentElement: {
				classList: {
					contains: (name: string) => !!options.dark && name === "dark",
				},
			},
			createElement: () => ({
				getContext: () => (options.canvas === false ? null : context),
			}),
		},
		configurable: true,
	});
	Object.defineProperty(globalThis, "getComputedStyle", {
		value: () => ({ getPropertyValue: () => ` ${options.primary} ` }),
		configurable: true,
	});
}

const originals = {
	document: Object.getOwnPropertyDescriptor(globalThis, "document"),
	getComputedStyle: Object.getOwnPropertyDescriptor(
		globalThis,
		"getComputedStyle",
	),
};

afterEach(() => {
	for (const [name, original] of Object.entries(originals)) {
		if (original) {
			Object.defineProperty(globalThis, name, original);
		} else {
			delete (globalThis as Record<string, unknown>)[name];
		}
	}
});

describe("seriesLabel", () => {
	test("numbers an unnamed series", () => {
		expect(seriesLabel(3)).toBe("Series 3");
	});
});

describe("chartPalette", () => {
	test("is the light slots on the server", () => {
		expect(chartPalette()).toEqual(CATEGORICAL.light);
	});

	test("leads with the accent, painted to hex", () => {
		fakeDocument({ primary: "oklch(0.45 0.15 15)" });
		expect(chartPalette()).toEqual(["#801030", ...CATEGORICAL.light]);
	});

	test("takes the dark slots in dark mode", () => {
		fakeDocument({ dark: true, primary: "oklch(0.45 0.15 15)" });
		expect(chartPalette()).toEqual(["#801030", ...CATEGORICAL.dark]);
	});

	test("drops an accent that paints nothing", () => {
		fakeDocument({ primary: "transparent" });
		expect(chartPalette()).toEqual(CATEGORICAL.light);
	});

	test("drops the accent when it is unset or there is no canvas", () => {
		fakeDocument({ primary: "" });
		expect(chartPalette()).toEqual(CATEGORICAL.light);
		fakeDocument({ primary: "oklch(0.45 0.15 15)", canvas: false });
		expect(chartPalette()).toEqual(CATEGORICAL.light);
	});
});
