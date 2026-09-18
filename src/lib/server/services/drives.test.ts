import { describe, expect, test } from "bun:test";

const { DrivesService, driveVolume, driveVolumeId } = await import("./drives");

/**
 * The db is stubbed per-call rather than by mocking `#lib/server/db/index.js` — a
 * module mock would leak into every suite that runs after this one. Each entry
 * in `answers` satisfies one query, in order.
 *
 * `db` is a getter on the service, so it is shadowed rather than assigned.
 */
function serviceWith(answers: unknown[][]) {
	const queue = [...answers];
	const inserted: unknown[] = [];
	const updated: unknown[] = [];
	const deleted: unknown[] = [];
	const next = () => Promise.resolve(queue.shift() ?? []);
	const svc = new DrivesService();
	Object.defineProperty(svc, "db", {
		value: {
			select: () => ({
				from: () => ({
					where: next,
					leftJoin: () => ({ where: next }),
					innerJoin: () => ({ where: next }),
				}),
			}),
			insert: () => ({
				values: (rows: unknown) => {
					inserted.push(rows);
					return Promise.resolve([]);
				},
			}),
			update: () => ({
				set: (values: unknown) => {
					updated.push(values);
					return { where: () => Promise.resolve([]) };
				},
			}),
			delete: () => ({
				where: (clause: unknown) => {
					deleted.push(clause);
					return Promise.resolve([]);
				},
			}),
		},
		configurable: true,
	});
	return { svc, inserted, updated, deleted };
}

const drive = { id: "d1", name: "Team", ownerId: "owner" };

describe("access", () => {
	test("the owner is always a manager", async () => {
		const { svc } = serviceWith([[drive]]);
		expect(await svc.access("d1", "owner")).toEqual({
			drive: drive as never,
			role: "manager",
		});
	});

	test("a member gets the role on their row", async () => {
		const { svc } = serviceWith([[drive], [{ role: "viewer" }]]);
		expect((await svc.access("d1", "u2"))?.role).toBe("viewer");
	});

	test("a stranger gets nothing", async () => {
		const { svc } = serviceWith([[drive], []]);
		expect(await svc.access("d1", "u3")).toBeNull();
	});
});

describe("requireAccess", () => {
	// A guessed id must not tell a stranger that the drive exists.
	test("reports a drive the caller cannot open as missing", async () => {
		const { svc } = serviceWith([[drive], []]);
		await expect(svc.requireAccess("d1", "u3")).rejects.toMatchObject({
			status: 404,
		});
	});

	test("refuses a non-manager with 403", async () => {
		const { svc } = serviceWith([[drive], [{ role: "editor" }]]);
		await expect(svc.requireManager("d1", "u2")).rejects.toMatchObject({
			status: 403,
		});
	});
});

describe("addMembers", () => {
	test("never writes a row for the owner", async () => {
		// access → drive, owner is the caller; then the candidate lookup.
		const { svc, inserted } = serviceWith([[drive], [{ id: "owner" }]]);
		expect(await svc.addMembers("d1", "owner", ["owner"], "editor")).toEqual(
			[],
		);
		expect(inserted).toHaveLength(0);
	});

	test("returns only the people newly granted access", async () => {
		const { svc, inserted, updated } = serviceWith([
			[drive],
			[{ id: "u2" }, { id: "u3" }],
			[{ userId: "u2" }],
		]);
		expect(await svc.addMembers("d1", "owner", ["u2", "u3"], "editor")).toEqual(
			["u3"],
		);
		expect(inserted).toHaveLength(1);
		// The one who was already on the drive is moved to the new role.
		expect(updated).toEqual([{ role: "editor" }]);
	});
});

describe("removeMember", () => {
	test("anyone may remove themselves", async () => {
		const { svc, deleted } = serviceWith([[drive], [{ role: "viewer" }]]);
		await svc.removeMember("d1", "u2", "u2");
		expect(deleted).toHaveLength(1);
	});

	test("a member may not remove someone else", async () => {
		const { svc } = serviceWith([[drive], [{ role: "editor" }]]);
		await expect(svc.removeMember("d1", "u2", "u3")).rejects.toMatchObject({
			status: 403,
		});
	});
});

describe("remove", () => {
	test("a manager who is not the owner may not delete the drive", async () => {
		const { svc, deleted } = serviceWith([[drive], [{ role: "manager" }]]);
		await expect(svc.remove("d1", "u2")).rejects.toMatchObject({ status: 403 });
		expect(deleted).toHaveLength(0);
	});
});

describe("driveVolume", () => {
	test("is read-only for a viewer", () => {
		expect(driveVolume(drive as never, "viewer")).toMatchObject({
			name: driveVolumeId("d1"),
			label: "Team",
			readOnly: true,
		});
		expect(driveVolume(drive as never, "editor").readOnly).toBe(false);
	});

	// The prefix is what keeps a drive from colliding with an env-declared
	// volume, whose name can only ever be `[a-z0-9-]`.
	test("volume ids are namespaced", () => {
		expect(driveVolumeId("d1")).toBe("drive:d1");
	});
});
