import { beforeEach, describe, expect, test } from "bun:test";
import { files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { NoteService } from "./notes";
import { type NoteReach, type NoteRequest, NotesApi } from "./notes-api";

/**
 * The notes routes' logic over the real SQLite migrations, with a stand-in
 * storage service: whether the caller can reach the file is the service's
 * question, answered here by `reachable`.
 */

interface Json {
	data?: Record<string, unknown> & { id?: string };
}

async function json(response: Response): Promise<Json> {
	return (await response.json()) as Json;
}

function service(reachable: boolean): NoteReach & { readOnly: boolean } {
	return {
		// A view-only share: it can read the file, not write it.
		readOnly: true,
		findFileById: (id) => Promise.resolve(reachable ? `docs/${id}` : null),
		findFileOwner: () =>
			Promise.resolve({ ownerId: "owner", name: "Plan.docx", volumeId: null }),
	};
}

let api: NotesApi;
let announced: string[];

const ada = { id: "ada", name: "Ada" };
const bob = { id: "bob", name: "Bob" };

function request(who = ada, reachable = true): NoteRequest {
	return {
		fileId: "f1",
		user: who,
		reach: () => Promise.resolve(service(reachable)),
	};
}

beforeEach(async () => {
	const db = migratedSqlite();
	await db.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "ada", name: "Ada", email: "ada@x.test" },
		{ id: "bob", name: "Bob", email: "bob@x.test" },
	]);
	await db.insert(files).values([
		{ id: "f1", name: "Plan.docx", ownerId: "owner", path: "f1" },
		{ id: "f2", name: "Other.docx", ownerId: "owner", path: "f2" },
	]);
	const notes = new NoteService();
	Object.defineProperty(notes, "db", { value: db, configurable: true });
	announced = [];
	api = new NotesApi(notes, (req) => {
		announced.push(req.user.id);
		return Promise.resolve();
	});
});

const anchor = {
	kind: "text" as const,
	quote: "the budget",
	prefix: "We agree ",
	suffix: " is final",
	offset: 9,
};

describe("comments", () => {
	test("a view-only reader can comment, with an anchor", async () => {
		const response = await api.create(request(bob), { body: "Why?", anchor });
		expect(response.status).toBe(200);
		const { data } = await json(response);
		expect(data?.anchor).toEqual(anchor);
		expect(data?.parentId).toBeNull();
		expect(announced).toEqual(["bob"]);
	});

	test("someone who cannot reach the file can neither read nor write", async () => {
		expect((await api.list(request(ada, false))).status).toBe(404);
		expect((await api.create(request(ada, false), { body: "Hi" })).status).toBe(
			404,
		);
	});

	test("a reply joins its thread and drops any anchor of its own", async () => {
		const root = await json(await api.create(request(), { body: "A", anchor }));
		const reply = await json(
			await api.create(request(bob), {
				body: "B",
				parentId: root.data?.id,
				anchor,
			}),
		);
		expect(reply.data?.parentId).toBe(root.data?.id ?? "");
		expect(reply.data?.anchor).toBeNull();
	});

	test("a reply to a reply, or to another file's thread, is refused", async () => {
		const root = await json(await api.create(request(), { body: "A" }));
		const reply = await json(
			await api.create(request(), { body: "B", parentId: root.data?.id }),
		);
		expect(
			(await api.create(request(), { body: "C", parentId: reply.data?.id }))
				.status,
		).toBe(400);
		const elsewhere = { ...request(), fileId: "f2" };
		expect(
			(await api.create(elsewhere, { body: "C", parentId: root.data?.id }))
				.status,
		).toBe(400);
	});

	test("anyone who can open the file resolves and reopens a thread", async () => {
		const root = await json(await api.create(request(), { body: "A" }));
		const id = root.data?.id ?? "";

		const resolved = await json(
			await api.update(request(bob), id, { resolved: true }),
		);
		expect(resolved.data?.resolvedAt).toBeString();
		expect(resolved.data?.resolvedByName).toBe("Bob");

		const reopened = await json(
			await api.update(request(ada), id, { resolved: false }),
		);
		expect(reopened.data?.resolvedAt).toBeNull();
		expect(reopened.data?.resolvedByName).toBeNull();

		expect(
			(await api.update(request(bob, false), id, { resolved: true })).status,
		).toBe(404);
	});

	test("only the author edits or deletes a comment", async () => {
		const root = await json(await api.create(request(), { body: "A" }));
		const id = root.data?.id ?? "";

		expect(
			(await api.update(request(bob), id, { body: "hacked" })).status,
		).toBe(404);
		expect((await api.remove(request(bob), id)).status).toBe(404);

		const edited = await json(await api.update(request(), id, { body: "A2" }));
		expect(edited.data?.body).toBe("A2");
	});

	test("deleting a thread takes its replies with it", async () => {
		const root = await json(await api.create(request(), { body: "A" }));
		await api.create(request(bob), { body: "B", parentId: root.data?.id });
		expect((await api.remove(request(), root.data?.id ?? "")).status).toBe(200);
		const { data } = await json(await api.list(request()));
		expect(data).toEqual([]);
	});
});

describe("media notes", () => {
	test("a timestamped note works as it always has", async () => {
		const created = await json(
			await api.create(request(), {
				body: "Kick is late",
				timestampSeconds: 12.5,
			}),
		);
		expect(created.data).toMatchObject({
			body: "Kick is late",
			timestampSeconds: 12.5,
			anchor: null,
			parentId: null,
			resolvedAt: null,
		});
		await api.create(request(bob), { body: "Intro", timestampSeconds: 1 });

		const { data } = await json(await api.list(request()));
		const list = data as unknown as { timestampSeconds: number }[];
		expect(list.map((note) => note.timestampSeconds)).toEqual([1, 12.5]);
	});

	test("an empty note is refused", async () => {
		expect((await api.create(request(), { body: "   " })).status).toBe(400);
	});
});
