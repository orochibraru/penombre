import {
	beforeEach,
	describe,
	expect,
	mock,
	setSystemTime,
	test,
} from "bun:test";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const enqueueJob = mock(async (_input: unknown) => "job-1");
const awaitJob = mock(
	async (): Promise<{ status: string; result: string | null } | undefined> =>
		undefined,
);

const finishJob = mock(async (_id: string) => true);
const disownJob = mock(async (_id: string) => {});
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob,
	awaitJob,
	finishJob,
	disownJob,
}));

const { probeMissingDurations, recordDurations } = await import("./media");

let database: Database;
const T0 = new Date("2026-01-01T00:00:00.000Z");

function ctx(ownerId = "u1") {
	return {
		db: database,
		storagePath: "/data",
		user: { id: ownerId },
		volumeId: null,
	} as never;
}

async function addFile(
	id: string,
	path: string,
	category: string,
	extra: Partial<typeof files.$inferInsert> = {},
) {
	await database.insert(files).values({
		id,
		name: path,
		path,
		category,
		ownerId: "u1",
		updatedAt: T0,
		...extra,
	});
}

async function file(id: string) {
	const [row] = await database.select().from(files).where(eq(files.id, id));
	return row;
}

function probeReturns(
	durations: Record<string, number>,
	probed: string[] = Object.keys(durations),
) {
	awaitJob.mockImplementationOnce(async () => ({
		status: "succeeded",
		result: JSON.stringify({ durations, probed }),
	}));
}

beforeEach(async () => {
	database = migratedSqlite();
	enqueueJob.mockClear();
	for (const id of ["u1", "u2"]) {
		await database.insert(user).values({ id, name: id, email: `${id}@x` });
	}
});

describe("recordDurations", () => {
	test("probes every row in one job and writes each duration to its column", async () => {
		await addFile("m", "a/track.mp3", "MUSIC");
		await addFile("v", "clip.mp4", "VIDEO");
		probeReturns({ "/data/a/track.mp3": 12.5, "/data/clip.mp4": 3 });

		await recordDurations(
			ctx(),
			[
				{ id: "m", path: "a/track.mp3", category: "MUSIC", updatedAt: T0 },
				{ id: "v", path: "clip.mp4", category: "VIDEO", updatedAt: T0 },
			],
			"k",
		);

		expect(enqueueJob).toHaveBeenLastCalledWith({
			type: "media-probe",
			spec: { paths: ["/data/a/track.mp3", "/data/clip.mp4"] },
			dedupeKey: "k",
			priority: "mutation",
		});
		expect(await file("m")).toMatchObject({
			musicDuration: 12.5,
			updatedAt: T0,
		});
		expect((await file("v"))?.videoDuration).toBe(3);
	});

	// Two quick re-uploads race two probes; the one for the older bytes must
	// not land on top of the newer.
	test("a probe for bytes since replaced writes nothing", async () => {
		await addFile("m", "track.mp3", "MUSIC", {
			updatedAt: new Date(T0.getTime() + 1),
		});
		probeReturns({ "/data/track.mp3": 99 });
		await recordDurations(ctx(), [
			{ id: "m", path: "track.mp3", category: "MUSIC", updatedAt: T0 },
		]);
		expect((await file("m"))?.musicDuration).toBeNull();
	});

	// `null` is what the sweep retries; writing 0 would freeze a probe that
	// merely never ran as "this file has no duration".
	test("writes nothing when the job never finishes or fails", async () => {
		await addFile("m", "track.mp3", "MUSIC");
		const row = {
			id: "m",
			path: "track.mp3",
			category: "MUSIC",
			updatedAt: T0,
		};
		awaitJob.mockImplementationOnce(async () => undefined);
		await recordDurations(ctx(), [row]);
		awaitJob.mockImplementationOnce(async () => ({
			status: "failed",
			result: null,
		}));
		await recordDurations(ctx(), [row]);
		expect((await file("m"))?.musicDuration).toBeNull();
	});

	test("never throws", async () => {
		enqueueJob.mockImplementationOnce(() => {
			throw new Error("db unavailable");
		});
		await expect(
			recordDurations(ctx(), [
				{ id: "m", path: "t.mp3", category: "MUSIC", updatedAt: T0 },
			]),
		).resolves.toEqual([]);
	});
});

describe("probeMissingDurations", () => {
	test("probes only this root's playable rows still missing a duration", async () => {
		await addFile("todo", "a.mp3", "MUSIC");
		await addFile("clip", "b.mp4", "VIDEO");
		await addFile("done", "c.mp3", "MUSIC", { musicDuration: 4 });
		await addFile("none", "d.mp3", "MUSIC", { musicDuration: 0 });
		await addFile("doc", "e.txt", "DOCUMENTS");
		await addFile("other", "f.mp3", "MUSIC", { ownerId: "u2" });
		probeReturns({ "/data/a.mp3": 1 });

		await probeMissingDurations(ctx());

		const call = enqueueJob.mock.calls[0]?.[0] as {
			spec: { paths: string[] };
			dedupeKey: string;
		};
		expect(call.spec.paths.toSorted()).toEqual(["/data/a.mp3", "/data/b.mp4"]);
		expect(call.dedupeKey).toBe("media-probe:/data");
		expect((await file("todo"))?.musicDuration).toBe(1);
	});

	// Rows whose probe keeps coming back empty must not pin the batch.
	test("batches are drawn at random, so stuck rows cannot starve the rest", async () => {
		await database.insert(files).values(
			Array.from({ length: 600 }, (_, i) => ({
				id: `f${i}`,
				name: `${i}.mp3`,
				path: `${i}.mp3`,
				category: "MUSIC",
				ownerId: "u1",
			})),
		);
		await probeMissingDurations(ctx());
		await probeMissingDurations(ctx());
		const seen = new Set(
			enqueueJob.mock.calls.flatMap(
				(call) => (call[0] as { spec: { paths: string[] } }).spec.paths,
			),
		);
		expect(seen.size).toBeGreaterThan(500);
	});

	test("does nothing when every duration is known", async () => {
		await addFile("done", "c.mp3", "MUSIC", { musicDuration: 4 });
		await probeMissingDurations(ctx());
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	// Unreadable forever (EACCES) used to mean an ffprobe per row per minute,
	// indefinitely. A transient failure must still come back.
	test("a row ffprobe could not read backs off, then is retried", async () => {
		// Unique: the backoff is process-wide and tests rerun.
		await addFile(`stuck-${crypto.randomUUID()}`, "s.mp3", "MUSIC");
		probeReturns({}, ["/data/s.mp3"]);
		await probeMissingDurations(ctx());
		expect(enqueueJob).toHaveBeenCalledTimes(1);

		await probeMissingDurations(ctx());
		expect(enqueueJob).toHaveBeenCalledTimes(1);

		setSystemTime(new Date(Date.now() + 2 * 60_000));
		try {
			await probeMissingDurations(ctx());
		} finally {
			setSystemTime();
		}
		expect(enqueueJob).toHaveBeenCalledTimes(2);
	});

	test("a probe that never ran does not back the row off", async () => {
		await addFile("todo", "t.mp3", "MUSIC");
		awaitJob.mockImplementationOnce(async () => undefined);
		await probeMissingDurations(ctx());
		await probeMissingDurations(ctx());
		expect(enqueueJob).toHaveBeenCalledTimes(2);
	});

	// Two instances' sweeps can join one deduped job holding the other's
	// batch: rows it never probed are not "unreadable".
	test("a row the joined job never probed does not back off", async () => {
		await addFile(`other-${crypto.randomUUID()}`, "o.mp3", "MUSIC");
		probeReturns({}, ["/data/someone-elses.mp3"]);
		await probeMissingDurations(ctx());
		await probeMissingDurations(ctx());
		expect(enqueueJob).toHaveBeenCalledTimes(2);
	});
});
