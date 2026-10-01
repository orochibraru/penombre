import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import {
	type SignatureRequest,
	signatureEvents,
	signatureRequests,
	signatureSigners,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { EmailContent } from "#lib/server/email-template.js";
import type { NotificationInput } from "#lib/server/services/notifications.js";
import { sha256 } from "./pdf";
import {
	type DocumentSource,
	hashToken,
	originalKey,
	type RequestMeta,
	SignatureError,
	SignatureService,
} from "./service";
import { pngDataUrl } from "./test-utils";

const META: RequestMeta = { ipAddress: "203.0.113.9", userAgent: "Test/1" };
const OWNER = { id: "owner", name: "Olive Owner", email: "olive@example.com" };
const SIGNATURE = pngDataUrl();

function harness(mail = true) {
	const database = migratedSqlite();
	const stored = new Map<string, Uint8Array>();
	const sent: { to: string; content: EmailContent }[] = [];
	const notified: NotificationInput[] = [];
	const saved: { request: SignatureRequest; bytes: Uint8Array }[] = [];
	const service = new SignatureService({
		database,
		store: {
			write: (key, bytes) => {
				stored.set(key, bytes);
				return Promise.resolve();
			},
			read: (key) => Promise.resolve(stored.get(key) ?? null),
		},
		mailer: () =>
			Promise.resolve(
				mail
					? (to: string, content: EmailContent) => {
							sent.push({ to, content });
							return Promise.resolve();
						}
					: null,
			),
		notify: (input) => {
			notified.push(input);
			return Promise.resolve();
		},
		saveSigned: (request, bytes) => {
			saved.push({ request, bytes });
			return Promise.resolve();
		},
		origin: () => "https://drive.example",
		warn: () => undefined,
	});
	return { database, stored, sent, notified, saved, service };
}

type Harness = ReturnType<typeof harness>;

const tokenOf = (url: string) => url.slice(url.indexOf("/sign/") + 6);
const lastLinkTo = (h: Harness, email: string) => {
	const mail = h.sent.findLast((entry) => entry.to === email);
	return tokenOf(mail?.content.action?.url ?? "");
};

async function seedUsers(h: Harness) {
	await h.database
		.insert(user)
		.values([
			OWNER,
			{ id: "ada", name: "Ada Account", email: "ada@example.com" },
			{ id: "stranger", name: "Sam Stranger", email: "sam@example.com" },
		]);
}

async function ask(
	h: Harness,
	options: {
		sequential?: boolean;
		signers?: { name?: string; email?: string; userId?: string }[];
	} = {},
) {
	await seedUsers(h);
	return h.service.create({
		requester: OWNER,
		file: { id: "file-1", name: "NDA.html" },
		bytes: new TextEncoder().encode("<h1>NDA</h1><p>Keep it secret.</p>")
			.buffer,
		signers: options.signers ?? [
			{ name: "Bea Guest", email: "Bea@Example.com" },
			{ userId: "ada" },
		],
		message: "Please sign by Friday",
		sequential: options.sequential ?? false,
	});
}

const sign = (h: Harness, token: string, meta: RequestMeta = META) =>
	h.service.sign(
		token,
		{ signature: SIGNATURE, timeZone: "Europe/Paris", consent: true },
		meta,
	);

async function refused(promise: Promise<unknown>): Promise<number> {
	try {
		await promise;
	} catch (error) {
		if (error instanceof SignatureError) {
			return error.status;
		}
		throw error;
	}
	return 0;
}

describe("asking", () => {
	test("freezes the document, hashes it and stores links hashed", async () => {
		const h = harness();
		const { request, links } = await ask(h);
		const original = h.stored.get(originalKey(request.id));
		expect(original).toBeDefined();
		expect(request.documentHash).toBe(sha256(original ?? new Uint8Array()));
		expect(request.status).toBe("pending");
		expect(links.map((link) => link.email)).toEqual([
			"bea@example.com",
			"ada@example.com",
		]);
		expect(links.every((link) => link.emailed)).toBe(true);
		// The account signer is named from their row.
		expect(links[1]?.name).toBe("Ada Account");

		const rows = await h.database.select().from(signatureSigners);
		const tokens = links.map((link) => tokenOf(link.url));
		expect(rows.map((row) => row.tokenHash).sort()).toEqual(
			tokens.map(hashToken).sort(),
		);
		expect(rows.some((row) => tokens.includes(row.tokenHash))).toBe(false);
		expect(h.sent[0]?.content.lines.join(" ")).toContain(
			"Please sign by Friday",
		);
	});

	test("refuses no signer, a duplicate address and an unknown account", async () => {
		const h = harness();
		expect(await refused(ask(h, { signers: [] }))).toBe(400);
		const again = harness();
		expect(
			await refused(
				ask(again, {
					signers: [
						{ userId: "ada" },
						{ name: "Ada Twin", email: "ADA@example.com" },
					],
				}),
			),
		).toBe(400);
		const third = harness();
		expect(await refused(ask(third, { signers: [{ userId: "ghost" }] }))).toBe(
			400,
		);
	});

	test("a reader cannot ask, and a trashed document is not found", async () => {
		const h = harness();
		const source = (readOnly: boolean, isTrashed = false): DocumentSource => ({
			readOnly,
			findFileById: () => Promise.resolve("NDA.html"),
			getRawFileData: () =>
				Promise.resolve({
					buffer: new TextEncoder().encode("<p>x</p>").buffer,
					meta: { metadata: { name: "NDA.html", isTrashed } },
				}),
		});
		const input = {
			requester: OWNER,
			signers: [{ name: "B", email: "b@x.io" }],
			sequential: false,
		};
		expect(await refused(h.service.request(source(true), "f", input))).toBe(
			403,
		);
		expect(
			await refused(h.service.request(source(false, true), "f", input)),
		).toBe(404);
		await seedUsers(h);
		const { request } = await h.service.request(source(false), "f", input);
		expect(request.documentName).toBe("NDA.html");
	});

	test("without mail the links are only handed back", async () => {
		const h = harness(false);
		const { links } = await ask(h);
		expect(links.every((link) => !link.emailed)).toBe(true);
		expect(h.sent).toHaveLength(0);
	});
});

describe("signing", () => {
	test("a link signs once, and an unknown one is nothing", async () => {
		const h = harness();
		const { links } = await ask(h);
		const token = tokenOf(links[0]?.url ?? "");
		expect(await h.service.open("not-a-token", META)).toBeNull();

		const view = await h.service.open(token, META);
		expect(view?.signer.email).toBe("bea@example.com");
		expect(view?.requesterName).toBe("Olive Owner");
		await h.service.open(token, META);
		const viewed = await h.database
			.select()
			.from(signatureEvents)
			.where(eq(signatureEvents.type, "viewed"));
		expect(viewed).toHaveLength(1);

		expect(
			await refused(
				h.service.sign(token, { signature: SIGNATURE, consent: false }, META),
			),
		).toBe(400);
		expect(
			await refused(
				h.service.sign(
					token,
					{ signature: "data:image/png;base64,AAAA", consent: true },
					META,
				),
			),
		).toBe(400);
		const signed = await sign(h, token);
		expect(signed.signer.status).toBe("signed");
		expect(await refused(sign(h, token))).toBe(409);
		expect(await refused(sign(h, "not-a-token"))).toBe(404);
	});

	test("records the account only when it is the signer's own", async () => {
		const h = harness();
		const { links } = await ask(h);
		await sign(h, tokenOf(links[0]?.url ?? ""), {
			...META,
			account: { id: "stranger", email: "sam@example.com" },
		});
		await sign(h, tokenOf(links[1]?.url ?? ""), {
			...META,
			account: { id: "ada", email: "ADA@example.com" },
		});
		const rows = await h.database.select().from(signatureSigners);
		const byEmail = new Map(rows.map((row) => [row.email, row]));
		expect(byEmail.get("bea@example.com")?.userId).toBeNull();
		expect(byEmail.get("ada@example.com")?.userId).toBe("ada");
		expect(await h.service.lastSignature("ada")).toBe(SIGNATURE);
		expect(await h.service.lastSignature("stranger")).toBeNull();
	});

	test("in order, the second waits and gets a fresh link on their turn", async () => {
		const h = harness();
		const { links } = await ask(h, { sequential: true });
		expect(links.map((link) => link.emailed)).toEqual([true, false]);
		const second = tokenOf(links[1]?.url ?? "");
		expect((await h.service.open(second, META))?.waitingFor).toBe("Bea Guest");
		expect(await refused(sign(h, second))).toBe(409);

		await sign(h, tokenOf(links[0]?.url ?? ""));
		// The turn email carries a new link; the one handed out before is dead.
		expect(await h.service.open(second, META)).toBeNull();
		const fresh = lastLinkTo(h, "ada@example.com");
		expect((await h.service.open(fresh, META))?.waitingFor).toBeNull();
		await sign(h, fresh);
	});

	test("expired and cancelled requests take no answer", async () => {
		const h = harness();
		const { request, links } = await ask(h);
		await h.database
			.update(signatureRequests)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(signatureRequests.id, request.id));
		const token = tokenOf(links[0]?.url ?? "");
		expect((await h.service.open(token, META))?.status).toBe("expired");
		expect(await refused(sign(h, token))).toBe(410);

		const other = harness();
		const asked = await ask(other);
		expect(
			await refused(
				other.service.cancel(asked.request.id, { ...OWNER, id: "stranger" }),
			),
		).toBe(404);
		expect((await other.service.cancel(asked.request.id, OWNER)).status).toBe(
			"cancelled",
		);
		expect(await refused(other.service.cancel(asked.request.id, OWNER))).toBe(
			409,
		);
		expect(await refused(sign(other, tokenOf(asked.links[0]?.url ?? "")))).toBe(
			410,
		);
		expect(
			await other.service.signerPdf(
				tokenOf(asked.links[0]?.url ?? ""),
				"original",
			),
		).toBeNull();
	});

	test("a decline closes the request and tells the requester", async () => {
		const h = harness();
		const { links } = await ask(h);
		const view = await h.service.decline(
			tokenOf(links[1]?.url ?? ""),
			"Wrong amount",
			META,
		);
		expect(view.status).toBe("declined");
		expect(h.notified).toEqual([
			expect.objectContaining({
				userId: "owner",
				type: "signature_declined",
				actorName: "Ada Account",
			}),
		]);
		expect(await refused(sign(h, tokenOf(links[0]?.url ?? "")))).toBe(409);
	});

	test("answers are rate limited per link", async () => {
		const h = harness();
		const { links } = await ask(h);
		const token = tokenOf(links[0]?.url ?? "");
		const statuses: number[] = [];
		for (let attempt = 0; attempt < 11; attempt++) {
			statuses.push(
				await refused(
					h.service.sign(token, { signature: SIGNATURE, consent: false }, META),
				),
			);
		}
		expect(statuses.slice(0, 10).every((status) => status === 400)).toBe(true);
		expect(statuses[10]).toBe(429);
	});
});

function pdftotext(bytes: Uint8Array): string {
	const path = join(
		mkdtempSync(join(tmpdir(), "penombre-signed-")),
		"signed.pdf",
	);
	writeFileSync(path, bytes);
	return Bun.spawnSync(["pdftotext", path, "-"]).stdout.toString();
}

describe("completion", () => {
	test("builds the signed PDF with its certificate and tells everyone", async () => {
		const h = harness();
		const { request, links } = await ask(h);
		const first = tokenOf(links[0]?.url ?? "");
		const last = tokenOf(links[1]?.url ?? "");
		await h.service.open(first, META);
		await sign(h, first);
		expect(h.saved).toHaveLength(0);
		const done = await sign(h, last);
		expect(done.status).toBe("completed");
		expect(done.downloadUntil).not.toBeNull();

		const [row] = await h.database
			.select()
			.from(signatureRequests)
			.where(eq(signatureRequests.id, request.id));
		expect(row?.status).toBe("completed");
		expect(h.saved).toHaveLength(1);
		const signed = h.saved[0]?.bytes ?? new Uint8Array();
		expect(sha256(signed)).toBe(row?.signedHash ?? "");
		expect((await PDFDocument.load(signed)).getPageCount()).toBeGreaterThan(1);
		expect(h.notified).toEqual([
			expect.objectContaining({
				type: "signature_completed",
				resourceName: "NDA.html",
			}),
		]);

		// The one who just signed keeps their link; the other gets a new one.
		expect((await h.service.signerPdf(last, "signed"))?.bytes).toEqual(signed);
		expect(await h.service.signerPdf(first, "signed")).toBeNull();
		const mailed = lastLinkTo(h, "bea@example.com");
		expect((await h.service.signerPdf(mailed, "signed"))?.name).toBe(
			"NDA (signed).pdf",
		);

		if (Bun.which("pdftotext")) {
			const text = pdftotext(signed);
			for (const label of [
				"Request created",
				"Link issued",
				"Document opened",
				"Signed",
				"Completed",
			]) {
				expect(text).toContain(label);
			}
			expect(text).toContain(request.documentHash);
			expect(text).toContain("203.0.113.9");
			expect(text).toContain("Keep it secret.");
		}

		// Again: nothing rebuilt, nobody told twice.
		await h.service.finalize(request.id);
		expect(h.saved).toHaveLength(1);
		expect(h.notified).toHaveLength(1);
	});

	test("the requester's download rebuilds a PDF that failed to build", async () => {
		const h = harness(false);
		const { request, links } = await ask(h, {
			signers: [{ name: "Solo", email: "solo@x.io" }],
		});
		const original = h.stored.get(originalKey(request.id));
		h.stored.delete(originalKey(request.id));
		await sign(h, tokenOf(links[0]?.url ?? ""));
		expect(h.saved).toHaveLength(0);

		h.stored.set(originalKey(request.id), original ?? new Uint8Array());
		expect(
			await refused(h.service.ownerPdf(request.id, "stranger", "signed")),
		).toBe(404);
		const pdf = await h.service.ownerPdf(request.id, "owner", "signed");
		expect(pdf?.name).toBe("NDA (signed).pdf");
		expect(h.saved).toHaveLength(1);
	});
});

describe("managing", () => {
	test("lists only the requester's own, by file", async () => {
		const h = harness();
		const { request } = await ask(h);
		expect((await h.service.list("owner")).map((r) => r.id)).toEqual([
			request.id,
		]);
		expect(await h.service.list("owner", "other-file")).toEqual([]);
		expect(await h.service.list("stranger")).toEqual([]);
		const [listed] = await h.service.list("owner", "file-1");
		expect(listed?.signers.map((s) => s.status)).toEqual([
			"pending",
			"pending",
		]);
	});

	test("a new link replaces the old one", async () => {
		const h = harness();
		const { request, links } = await ask(h);
		const signerId = links[0]?.signerId ?? "";
		expect(
			await refused(
				h.service.renewLink(request.id, signerId, "stranger", false),
			),
		).toBe(404);
		const renewed = await h.service.renewLink(
			request.id,
			signerId,
			"owner",
			false,
		);
		expect(renewed.emailed).toBe(false);
		expect(await h.service.open(tokenOf(links[0]?.url ?? ""), META)).toBeNull();
		expect(
			(await h.service.open(tokenOf(renewed.url), META))?.signer.name,
		).toBe("Bea Guest");
	});
});
