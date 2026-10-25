import type { Mock } from "bun:test";
import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";

import { getConfig, getStoragePath } from "#lib/server/config.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { drives, files, notifications, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { Email } from "#lib/server/email.js";
import type { SignatureDeps } from "#lib/server/services/signatures/base.js";

import { signatures, SignatureService } from "./index";

const mockGetConfig = getConfig as Mock<typeof getConfig>;

const QUERIES = ["select", "insert", "update", "delete"] as const;
const sharedDb = getDb() as unknown as Record<string, unknown>;
const originalQueries = { ...sharedDb };

/** Points the preloaded db mock at a real database until the test ends. */
function useDatabase(database: Database) {
	for (const query of QUERIES) {
		sharedDb[query] = (...args: unknown[]) =>
			(database[query] as (...inner: unknown[]) => unknown)(...args);
	}
}

afterEach(() => {
	for (const query of QUERIES) {
		if (query in originalQueries) {
			sharedDb[query] = originalQueries[query];
		} else {
			delete sharedDb[query];
		}
	}
});

const folder = crypto.randomUUID();
afterAll(() => {
	rmSync(join(getStoragePath(), ".signatures", folder), {
		recursive: true,
		force: true,
	});
});

const deps = () => (signatures() as unknown as { deps: SignatureDeps }).deps;

async function seeded() {
	const database = migratedSqlite();
	await database.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "signer", name: "Signer", email: "signer@x.test" },
	]);
	await database
		.insert(drives)
		.values({ id: "d1", name: "Team", ownerId: "owner" });
	await database.insert(files).values([
		{ id: "f1", name: "Contract.docx", ownerId: "owner", path: "docs/f1" },
		{
			id: "orphan",
			name: "Orphan.docx",
			ownerId: "owner",
			path: "orphan",
			volumeId: "drive:deleted",
		},
	]);
	useDatabase(database);
	return database;
}

const request = (fileId: string | null) =>
	({
		id: "r1",
		ownerId: "owner",
		fileId,
		documentName: "Contract.docx",
	}) as never;

describe("signatures", () => {
	test("is one service for the whole process", () => {
		expect(signatures()).toBeInstanceOf(SignatureService);
		expect(signatures()).toBe(signatures());
	});

	test("links point at the configured origin", () => {
		expect(deps().origin()).toBe(getConfig().origin);
	});

	test("mails only when SMTP is set up, through the template", async () => {
		expect(await deps().mailer()).toBeNull();

		mockGetConfig.mockReturnValueOnce({
			...getConfig(),
			smtp: {
				enabled: true,
				host: "smtp.example",
				port: 587,
				user: "mailer",
				password: "secret",
				from: "drive@example",
				secure: false,
			},
		} as never);
		const send = await deps().mailer();

		const sendTemplate = Email.sendTemplate;
		const sent: unknown[] = [];
		Email.sendTemplate = async (...args) => {
			sent.push(args);
		};
		try {
			const content = { subject: "Sign", heading: "Sign", lines: [] };
			await send?.("signer@x.test", content);
			expect(sent).toEqual([["signer@x.test", content]]);
		} finally {
			Email.sendTemplate = sendTemplate;
		}
	});

	test("a warning never throws", () => {
		expect(() =>
			deps().warn("Could not email", new Error("down")),
		).not.toThrow();
	});
});

describe("the PDF store", () => {
	test("reads back what it wrote, and nothing for a missing key", async () => {
		const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
		await deps().store.write(`${folder}/original.pdf`, bytes);

		expect(await deps().store.read(`${folder}/original.pdf`)).toEqual(bytes);
		expect(await deps().store.read(`${folder}/missing.pdf`)).toBeNull();
	});
});

describe("notify", () => {
	test("records the notification for its recipient", async () => {
		const database = await seeded();
		await deps().notify({
			userId: "signer",
			type: "signature_requested",
			actorName: "Owner",
			resourceName: "Contract.docx",
			link: "/sign/signer/s1",
		});

		expect(await database.select().from(notifications)).toMatchObject([
			{
				userId: "signer",
				type: "signature_requested",
				actorName: "Owner",
				resourceName: "Contract.docx",
			},
		]);
	});
});

describe("saveSigned", () => {
	test("does nothing for a request with no document, or one since deleted", async () => {
		await seeded();
		const bytes = new Uint8Array([1, 2, 3]);
		expect(await deps().saveSigned(request(null), bytes)).toBeUndefined();
		expect(await deps().saveSigned(request("missing"), bytes)).toBeUndefined();
	});

	test("does nothing when the document's drive is gone", async () => {
		await seeded();
		expect(
			await deps().saveSigned(request("orphan"), new Uint8Array([1])),
		).toBeUndefined();
	});

	test("files a live document's PDF through the owner's storage", async () => {
		await seeded();
		// The preload's `StorageService` cannot be constructed, so reaching it
		// is as far as this suite can follow the save.
		await expect(
			deps().saveSigned(request("f1"), new Uint8Array([1])),
		).rejects.toThrow(TypeError);
	});
});
