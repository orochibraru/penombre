import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	spyOn,
	test,
} from "bun:test";

import { getDb } from "#lib/server/db/index.js";
import type { Database } from "#lib/server/db/index.js";
import {
	fileNotes,
	files,
	notifications,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { EmailContent } from "#lib/server/email-template.js";
import { Email } from "#lib/server/email.js";
import * as appSettings from "#lib/server/services/app-settings.js";

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

describe("over the real migrations", () => {
	let database: Database;
	let svc: InstanceType<typeof NotificationService>;
	let sent: { to: string; content: EmailContent }[];
	let smtp: Mock<typeof appSettings.getSmtpSettings>;
	let send: Mock<typeof Email.sendTemplate>;

	const mail = {
		enabled: true,
		host: "smtp.test",
		port: 587,
		user: "",
		password: "",
		from: "drive@x.test",
		secure: false,
	};

	beforeEach(async () => {
		database = migratedSqlite();
		await database.insert(user).values([
			{ id: "ada", name: "Ada", email: "ada@x.test" },
			{ id: "bob", name: "Bob", email: "bob@x.test" },
		]);
		svc = new NotificationService();
		Object.defineProperty(svc, "db", { value: database, configurable: true });
		choosing(svc, {});
		sent = [];
		smtp = spyOn(appSettings, "getSmtpSettings").mockResolvedValue(mail);
		send = spyOn(Email, "sendTemplate").mockImplementation(
			async (to, content) => {
				sent.push({ to, content });
			},
		);
	});

	afterEach(() => {
		smtp.mockRestore();
		send.mockRestore();
	});

	test("lists a user's own notifications, newest first", async () => {
		await database.insert(notifications).values([
			{
				id: "n1",
				userId: "ada",
				type: "note",
				actorName: "Bob",
				resourceName: "take.wav",
				link: "/go/file/f1",
				createdAt: new Date(1_000),
			},
			{
				id: "n2",
				userId: "ada",
				type: "share",
				readAt: new Date(3_000),
				createdAt: new Date(2_000),
			},
			{ id: "n3", userId: "bob", type: "share" },
		]);
		expect(await svc.list("ada")).toEqual([
			{
				id: "n2",
				type: "share",
				actorName: null,
				resourceName: null,
				link: null,
				read: true,
				createdAt: new Date(2_000).toISOString(),
			},
			{
				id: "n1",
				type: "note",
				actorName: "Bob",
				resourceName: "take.wav",
				link: "/go/file/f1",
				read: false,
				createdAt: new Date(1_000).toISOString(),
			},
		]);
		expect(await svc.list("ada", 1)).toHaveLength(1);
	});

	test("counts and clears only the caller's unread notifications", async () => {
		await database.insert(notifications).values([
			{ id: "n1", userId: "ada", type: "note" },
			{ id: "n2", userId: "ada", type: "note" },
			{ id: "n3", userId: "bob", type: "note" },
		]);
		expect(await svc.unreadCount("ada")).toBe(2);
		// Someone else's id matches nothing.
		expect(await svc.markRead("ada", ["n1", "n3"])).toBe(1);
		expect(await svc.unreadCount("ada")).toBe(1);
		expect(await svc.unreadCount("bob")).toBe(1);
		expect(await svc.markRead("ada")).toBe(1);
		expect(await svc.unreadCount("ada")).toBe(0);
	});

	test("note participants are everyone who wrote on the file but the author", async () => {
		await database
			.insert(files)
			.values({ id: "f1", name: "take.wav", ownerId: "ada", path: "f1" });
		await database.insert(fileNotes).values([
			{ id: "c1", fileId: "f1", userId: "ada", body: "one" },
			{ id: "c2", fileId: "f1", userId: "bob", body: "two" },
			{ id: "c3", fileId: "f1", userId: "bob", body: "three" },
		]);
		expect(await svc.noteParticipants("f1", "ada")).toEqual(["bob"]);
	});

	test("a share is mailed to the recipient's address, with a link back", async () => {
		await svc.notify(
			{
				userId: "bob",
				type: "share",
				actorName: "Ada",
				resourceName: "Mix",
				link: "/go/folder/x",
			},
			"https://drive.test",
		);
		expect(sent).toEqual([
			{
				to: "bob@x.test",
				content: {
					subject: "Something was shared with you",
					heading: "Something was shared with you",
					lines: ["Ada shared Mix with you."],
					action: { label: "Open it", url: "https://drive.test/go/folder/x" },
					footnote:
						"You can choose which notifications are emailed to you in your settings.",
				},
			},
		]);
		expect(await svc.unreadCount("bob")).toBe(1);
	});

	test("every kind has its own line, and unnamed parts read naturally", async () => {
		choosing(svc, { emailNotifications: true });
		for (const type of [
			"note",
			"signature_completed",
			"signature_declined",
			"signature_requested",
		] as const) {
			await svc.notify({ userId: "bob", type });
		}
		expect(sent.map((mail) => mail.content.lines[0])).toEqual([
			"Someone left a note on an item.",
			"Everyone signed an item. The signed PDF is ready.",
			"Someone declined to sign an item.",
			"Someone asks you to sign an item.",
		]);
		expect(sent.every((mail) => !("action" in mail.content))).toBe(true);
	});

	test("nothing is mailed without SMTP, or to an account with no address", async () => {
		smtp.mockResolvedValue(null);
		await svc.notify({ userId: "bob", type: "share" });
		smtp.mockResolvedValue(mail);
		await svc.notify({ userId: "gone", type: "share" });
		expect(sent).toEqual([]);
	});

	test("a mail server that fails does not fail the notification", async () => {
		send.mockRejectedValue(new Error("connection refused"));
		await expect(
			svc.notify({ userId: "bob", type: "share" }),
		).resolves.toBeUndefined();
		expect(await svc.unreadCount("bob")).toBe(1);
	});

	test("unreadable preferences write nothing and send nothing", async () => {
		Object.defineProperty(svc, "preferences", {
			value: () => Promise.reject(new Error("db down")),
			configurable: true,
		});
		await svc.notify({ userId: "bob", type: "share" });
		expect(await svc.unreadCount("bob")).toBe(0);
		expect(sent).toEqual([]);
	});

	test("reads the app's database unless a test shadows it", () => {
		expect(Reflect.get(new NotificationService(), "db")).toBe(getDb());
	});
});
