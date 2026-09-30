import { describe, expect, mock, test } from "bun:test";

const error = mock();
mock.module("svelte-sonner", () => ({ toast: { error } }));

const { playMedia } = await import("#lib/play.js");

const media = (play: () => Promise<void>) =>
	({ play }) as unknown as HTMLMediaElement;
const named = (name: string) => Object.assign(new Error(name), { name });

describe("playMedia", () => {
	test("answers true once playback started", async () => {
		expect(await playMedia(media(async () => undefined))).toBe(true);
	});

	test("answers false with no element", async () => {
		expect(await playMedia(null)).toBe(false);
	});

	test.each(["AbortError", "NotAllowedError"])("%s is silent", async (name) => {
		error.mockClear();
		const refused = media(() => Promise.reject(named(name)));
		expect(await playMedia(refused)).toBe(false);
		expect(error).not.toHaveBeenCalled();
	});

	test("an unplayable file is reported", async () => {
		error.mockClear();
		const broken = media(() => Promise.reject(named("NotSupportedError")));
		expect(await playMedia(broken)).toBe(false);
		expect(error).toHaveBeenCalledTimes(1);
	});
});
