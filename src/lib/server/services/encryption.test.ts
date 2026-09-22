import { describe, expect, mock, test } from "bun:test";
import { keyId } from "#lib/server/crypto/envelope.js";
import type { AppSettingsData } from "#lib/server/db/schema.js";
import { assertEncryptionKey, sweepOnce } from "./encryption";

const key = (byte: number) => Buffer.alloc(32, byte);
const id = (byte: number) => keyId(key(byte)).toString("hex");

function store(initial: AppSettingsData = {}) {
	let settings = initial;
	return {
		get: async () => settings,
		update: mock(async (updates: Partial<AppSettingsData>) => {
			settings = { ...settings, ...updates };
		}),
		read: () => settings,
	};
}

describe("assertEncryptionKey", () => {
	test("does nothing on a plaintext instance", async () => {
		const settings = store();
		await assertEncryptionKey({ previous: [] }, settings);
		expect(settings.update).not.toHaveBeenCalled();
	});

	test("records the key on first boot with one", async () => {
		const settings = store();
		await assertEncryptionKey({ current: key(1), previous: [] }, settings);
		expect(settings.read().encryptionKeyId).toBe(id(1));
	});

	test("refuses to boot without the key once files are sealed", async () => {
		await expect(
			assertEncryptionKey({ previous: [] }, store({ encryptionKeyId: id(1) })),
		).rejects.toThrow("ENCRYPTION_KEY is not set");
	});

	test("refuses a different key unless the old one is kept as previous", async () => {
		await expect(
			assertEncryptionKey(
				{ current: key(2), previous: [] },
				store({ encryptionKeyId: id(1) }),
			),
		).rejects.toThrow("ENCRYPTION_KEY_PREVIOUS");

		const settings = store({ encryptionKeyId: id(1) });
		await assertEncryptionKey(
			{ current: key(2), previous: [key(1)] },
			settings,
		);
		expect(settings.read().encryptionKeyId).toBe(id(2));
	});
});

describe("sweepOnce", () => {
	const result = (outcome: object) => ({
		enqueueJob: mock(async (_input: unknown) => "job-1"),
		awaitJob: mock(async () => ({
			status: "succeeded" as const,
			error: null,
			result: JSON.stringify(outcome),
		})),
	});

	test("enqueues a deduped background pass over the storage root", async () => {
		const jobs = result({
			sealed: 3,
			rewrapped: 0,
			more: true,
			next: "/tmp/penombre-test-storage/b",
			failed: [],
		});
		expect(await sweepOnce(jobs)).toBe(false);
		expect(jobs.enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "encrypt",
			dedupeKey: "encrypt:/tmp/penombre-test-storage",
			priority: "background",
			spec: { root: "/tmp/penombre-test-storage", budget: 2000 },
		});
	});

	test("the next pass resumes where the last one stopped", async () => {
		const jobs = result({
			sealed: 0,
			rewrapped: 0,
			more: false,
			next: "",
			failed: [],
		});
		expect(await sweepOnce(jobs)).toBe(true);
		expect(jobs.enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { after: "/tmp/penombre-test-storage/b" },
		});
		await sweepOnce(jobs);
		expect(jobs.enqueueJob.mock.calls[1]?.[0]).toMatchObject({
			spec: { after: "" },
		});
	});

	test("a failed job is not done", async () => {
		const jobs = {
			enqueueJob: mock(async () => "job-1"),
			awaitJob: mock(async () => ({
				status: "failed" as const,
				error: "no key",
				result: null,
			})),
		};
		expect(await sweepOnce(jobs)).toBe(false);
	});
});
