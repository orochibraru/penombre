import { describe, expect, test } from "bun:test";
import { canConvert, prepareRendition, renditionUrl } from "#lib/renditions.js";

const raw = "http://drive.test/api/v1/storage/file/a%2Fb.avi?drive=d1&raw=true";

function answering(...statuses: string[]) {
	const asked: string[] = [];
	const fetcher = (async (url: string, init: RequestInit) => {
		asked.push(`${init.method} ${url}`);
		const status = statuses.shift();
		return status === "500"
			? new Response(null, { status: 500 })
			: Response.json({ data: { status, error: "why" } });
	}) as unknown as typeof fetch;
	return { asked, fetcher };
}

describe("renditions", () => {
	test("a rendition is the original's URL plus its height", () => {
		expect(renditionUrl(raw, 480)).toBe(`${raw}&rendition=480`);
	});

	test("a version's bytes cannot be converted", () => {
		expect(canConvert(raw)).toBe(true);
		expect(
			canConvert("http://drive.test/api/v1/storage/file/f/versions/v/raw"),
		).toBe(false);
	});

	test("asks again until it is ready, where the file lives", async () => {
		const { asked, fetcher } = answering("preparing", "preparing", "ready");

		const done = await prepareRendition(raw, 720, undefined, {
			fetcher: fetcher,
			floorMs: 0,
		});

		expect(done.status).toBe("ready");
		expect(asked).toEqual(
			Array(3).fill(
				"POST http://drive.test/api/v1/storage/file/a%2Fb.avi/renditions/720?drive=d1",
			),
		);
	});

	test("a failure or a refusal ends the asking", async () => {
		const failed = answering("failed");
		expect(
			await prepareRendition(raw, 480, undefined, {
				fetcher: failed.fetcher,
				floorMs: 0,
			}),
		).toEqual({ status: "failed", error: "why" });

		const down = answering("500");
		expect(
			(
				await prepareRendition(raw, 480, undefined, {
					fetcher: down.fetcher,
					floorMs: 0,
				})
			).status,
		).toBe("failed");
	});

	test("an abort stops it between two asks", async () => {
		const abort = new AbortController();
		const { asked, fetcher } = answering("preparing", "ready");
		const wrapped = (async (url: string, init: RequestInit) => {
			const response = await fetcher(url, init);
			abort.abort();
			return response;
		}) as unknown as typeof fetch;

		const done = await prepareRendition(raw, 480, abort.signal, {
			fetcher: wrapped,
			floorMs: 0,
		});

		expect(done.status).toBe("aborted");
		expect(asked).toHaveLength(1);
	});
});
