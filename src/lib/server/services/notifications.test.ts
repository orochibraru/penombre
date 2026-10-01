import { describe, expect, test } from "bun:test";

const { NotificationService } = await import("./notifications");

/**
 * The db is stubbed on the instance rather than by mocking `#lib/server/db/index.js`:
 * `mock.module` is global and permanent in Bun, so a module mock here would
 * follow every suite that runs afterwards.
 *
 * `email` is stubbed out too — the opt-in copy is a separate concern from
 * whether the right rows get written, and reaching for SMTP in a unit test
 * would make these depend on a mail server.
 */
function serviceWith(answers: unknown[][] = []) {
	const queue = [...answers];
	const inserted: Record<string, unknown>[] = [];
	const emailed: unknown[] = [];
	const svc = new NotificationService();

	// `db` is a prototype getter, so it is shadowed with an own property
	// rather than assigned to.
	const db = {
		select: () => ({
			from: () => ({
				where: () => Promise.resolve(queue.shift() ?? []),
			}),
		}),
		selectDistinct: () => ({
			from: () => ({
				where: () => Promise.resolve(queue.shift() ?? []),
			}),
		}),
		insert: () => ({
			values: (v: Record<string, unknown>) => {
				inserted.push(v);
				return Promise.resolve([]);
			},
		}),
		update: () => ({
			set: () => ({
				where: () => ({
					returning: () => Promise.resolve(queue.shift() ?? []),
				}),
			}),
		}),
	};
	Object.defineProperty(svc, "db", { value: db, configurable: true });
	Object.defineProperty(svc, "email", {
		value: async (input: unknown) => {
			emailed.push(input);
		},
		configurable: true,
	});

	return { svc, inserted, emailed, db };
}

/** The recipient's notification choices, as `getUserPreferences` answers them. */
function choosing(svc: object, prefs: Record<string, unknown>) {
	Object.defineProperty(svc, "preferences", {
		value: () => Promise.resolve(prefs),
		configurable: true,
	});
}

describe("notification choices", () => {
	test("a type kept off the bell writes no row, and can still be mailed", async () => {
		const { svc, inserted, emailed } = serviceWith();
		choosing(svc, { notifications: { note: { inApp: false, email: true } } });
		await svc.notify({ userId: "u2", type: "note" });
		expect(inserted).toHaveLength(0);
		expect(emailed).toHaveLength(1);
	});

	test("a share is mailed unless the person turned that off", async () => {
		const { svc, emailed } = serviceWith();
		choosing(svc, {});
		await svc.notify({ userId: "u2", type: "share" });
		expect(emailed).toHaveLength(1);

		const off = serviceWith();
		choosing(off.svc, { notifications: { share: { email: false } } });
		await off.svc.notify({ userId: "u2", type: "share" });
		expect(off.emailed).toHaveLength(0);
		expect(off.inserted).toHaveLength(1);
	});
});

describe("notify", () => {
	test("writes one row addressed to the recipient", async () => {
		const { svc, inserted } = serviceWith();
		await svc.notify({
			userId: "u2",
			type: "note",
			actorName: "Ada",
			resourceName: "track.wav",
			link: "/view/f1",
		});

		expect(inserted).toHaveLength(1);
		expect(inserted[0]).toMatchObject({
			userId: "u2",
			type: "note",
			actorName: "Ada",
			resourceName: "track.wav",
			link: "/view/f1",
		});
	});

	test("a failed insert is swallowed, never thrown at the caller", async () => {
		const { svc, db } = serviceWith();
		db.insert = () => ({
			values: () => Promise.reject(new Error("db is on fire")),
		});

		// The action that triggered this has already succeeded; a notification
		// failing must not turn it into a 500.
		expect(await svc.notify({ userId: "u2", type: "share" })).toBeUndefined();
	});
});

describe("notifyMany", () => {
	test("tells each recipient exactly once", async () => {
		const { svc, inserted } = serviceWith();
		// An owner who is also a participant in the thread appears twice.
		await svc.notifyMany(["owner", "u2", "owner"], {
			type: "note",
			actorName: "Ada",
		});

		expect(inserted.map((row) => row.userId)).toEqual(["owner", "u2"]);
	});

	test("no recipients means no rows", async () => {
		const { svc, inserted } = serviceWith();
		await svc.notifyMany([], { type: "share" });
		expect(inserted).toHaveLength(0);
	});
});

describe("markRead", () => {
	test("an empty id list touches nothing", async () => {
		const { svc } = serviceWith([[{ id: "n1" }]]);
		// Guarded explicitly: an empty `inArray` would otherwise match every
		// row and clear the whole bell.
		expect(await svc.markRead("u1", [])).toBe(0);
	});

	test("reports how many rows it actually changed", async () => {
		const { svc } = serviceWith([[{ id: "n1" }, { id: "n2" }]]);
		expect(await svc.markRead("u1")).toBe(2);
	});
});

describe("noteParticipants", () => {
	test("excludes the author", async () => {
		const { svc } = serviceWith([[{ userId: "u2" }, { userId: "u3" }]]);
		expect(await svc.noteParticipants("f1", "u1")).toEqual(["u2", "u3"]);
	});
});
