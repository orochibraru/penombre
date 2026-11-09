import { afterEach, describe, expect, it, jest } from "bun:test";

import {
	MAX_WAIT_MS,
	QUIET_MS,
	type UploadNotice,
	UploadNoticeBatcher,
} from "./upload-notice-batcher.js";

const notice = (shareId = "s1"): UploadNotice => ({
	shareId,
	recipientId: "owner",
	folderId: "f1",
	folderName: "Drop box",
});

describe("UploadNoticeBatcher", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it("sends one notice for a burst, after it goes quiet", () => {
		jest.useFakeTimers();
		const sent: { count: number }[] = [];
		const batcher = new UploadNoticeBatcher(async (batch) => {
			sent.push(batch);
		});
		batcher.record(notice());
		jest.advanceTimersByTime(QUIET_MS - 1000);
		batcher.record(notice());
		batcher.record(notice());
		jest.advanceTimersByTime(QUIET_MS - 1000);
		expect(sent).toHaveLength(0);
		jest.advanceTimersByTime(1000);
		expect(sent).toEqual([
			expect.objectContaining({ count: 3, folderName: "Drop box" }),
		]);
	});

	it("does not hold a never-ending burst past the maximum wait", () => {
		jest.useFakeTimers();
		let clock = 0;
		const sent: number[] = [];
		const batcher = new UploadNoticeBatcher(
			async (batch) => {
				sent.push(batch.count);
			},
			() => clock,
		);
		const step = QUIET_MS / 2;
		batcher.record(notice());
		while (clock + step < MAX_WAIT_MS) {
			clock += step;
			jest.advanceTimersByTime(step);
			batcher.record(notice());
		}
		expect(sent).toHaveLength(0);
		jest.advanceTimersByTime(MAX_WAIT_MS - clock);
		expect(sent).toEqual([MAX_WAIT_MS / step]);
	});

	it("keeps links apart", async () => {
		const sent: string[] = [];
		const batcher = new UploadNoticeBatcher(async (batch) => {
			sent.push(batch.shareId);
		});
		batcher.record(notice("a"));
		batcher.record(notice("b"));
		await batcher.flushAll();
		expect(sent.toSorted()).toEqual(["a", "b"]);
	});

	it("swallows a failed delivery", async () => {
		const batcher = new UploadNoticeBatcher(() =>
			Promise.reject(new Error("smtp down")),
		);
		batcher.record(notice());
		await expect(batcher.flushAll()).resolves.toBeUndefined();
	});
});
