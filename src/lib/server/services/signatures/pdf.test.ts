import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import {
	assertSignatureImage,
	buildSignedPdf,
	type Certificate,
	freezeDocument,
	localTime,
	UnsignableDocumentError,
} from "./pdf";
import { pngDataUrl } from "./test-utils";

const html = (text: string) => new TextEncoder().encode(text).buffer;

function pdftotext(bytes: Uint8Array): string {
	const dir = mkdtempSync(join(tmpdir(), "penombre-sign-"));
	const path = join(dir, "doc.pdf");
	writeFileSync(path, bytes);
	const result = Bun.spawnSync(["pdftotext", "-layout", path, "-"]);
	return result.stdout.toString();
}

const hasPoppler = Bun.which("pdftotext") !== null;

describe("freezeDocument", () => {
	test("exports a document to PDF and hashes those bytes", async () => {
		const frozen = await freezeDocument(
			"Contract.html",
			html("<h1>Contract</h1><p>Pay on time.</p>"),
		);
		expect(frozen.hash).toMatch(/^[0-9a-f]{64}$/);
		expect(frozen.pageCount).toBe(1);
		expect(new TextDecoder().decode(frozen.pdf.slice(0, 5))).toBe("%PDF-");
	});

	test("keeps a PDF's own bytes", async () => {
		const doc = await PDFDocument.create();
		doc.addPage();
		doc.addPage();
		const bytes = await doc.save();
		const frozen = await freezeDocument("scan.PDF", bytes.slice().buffer);
		expect(frozen.pdf).toEqual(bytes);
		expect(frozen.pageCount).toBe(2);
	});

	test("refuses what is not a PDF nor exportable", async () => {
		await expect(
			freezeDocument("photo.png", new Uint8Array([1, 2, 3]).buffer),
		).rejects.toBeInstanceOf(UnsignableDocumentError);
		await expect(
			freezeDocument("broken.pdf", html("%PDF-1.7 nothing")),
		).rejects.toBeInstanceOf(UnsignableDocumentError);
	});
});

describe("assertSignatureImage", () => {
	test("takes a PNG data URL", async () => {
		await assertSignatureImage(pngDataUrl());
	});

	test("refuses other types, garbage and huge images", async () => {
		await expect(
			assertSignatureImage("data:image/svg+xml;base64,PHN2Zy8+"),
		).rejects.toBeInstanceOf(UnsignableDocumentError);
		await expect(
			assertSignatureImage("data:image/png;base64,AAAA"),
		).rejects.toBeInstanceOf(UnsignableDocumentError);
		await expect(
			assertSignatureImage(`data:image/png;base64,${"A".repeat(300_000)}`),
		).rejects.toBeInstanceOf(UnsignableDocumentError);
	});
});

describe("localTime", () => {
	test("formats in the signer's zone, and ignores an unknown one", () => {
		const at = new Date("2026-10-01T14:03:22Z");
		expect(localTime(at, "Europe/Paris")).toContain("16:03:22");
		expect(localTime(at, "Mars/Olympus")).toBeNull();
		expect(localTime(at, null)).toBeNull();
	});
});

describe("buildSignedPdf", () => {
	test("appends a certificate and stamps every page", async () => {
		const frozen = await freezeDocument(
			"Lease.html",
			html("<h1>Lease</h1><p>The tenant pays rent.</p>"),
		);
		const at = new Date("2026-10-01T10:00:00Z");
		const cert: Certificate = {
			requestId: "req-1234",
			documentName: "Lease.docx",
			documentHash: frozen.hash,
			pageCount: frozen.pageCount,
			requester: "Owner <owner@example.com>",
			createdAt: at,
			completedAt: new Date("2026-10-02T10:00:00Z"),
			signers: [
				{
					name: "Ada Lovelace",
					email: "ada@example.com",
					signature: pngDataUrl(),
					signedAt: new Date("2026-10-02T09:59:00Z"),
					timeZone: "Europe/London",
					ipAddress: "203.0.113.7",
					userAgent: "Test/1.0",
					account: false,
				},
			],
			events: [
				{
					at,
					type: "created",
					actor: "Owner",
					detail: null,
					ipAddress: null,
				},
				{
					at,
					type: "declined",
					actor: "Someone",
					detail: "not me",
					ipAddress: "198.51.100.1",
				},
			],
		};
		const signed = await buildSignedPdf(frozen.pdf, cert);
		const doc = await PDFDocument.load(signed);
		expect(doc.getPageCount()).toBeGreaterThan(frozen.pageCount);
		expect(doc.getTitle()).toBe("Lease.docx (signed)");

		if (hasPoppler) {
			const text = pdftotext(signed);
			expect(text).toContain("The tenant pays rent.");
			expect(text).toContain("Signature certificate");
			expect(text).toContain(frozen.hash);
			expect(text).toContain("Ada Lovelace");
			expect(text).toContain("203.0.113.7");
			expect(text).toContain("Request created");
			expect(text).toContain("not me");
			const stamps = text.match(
				/Signature request req-1234 · page \d+ of \d+/g,
			);
			expect(stamps?.length).toBe(doc.getPageCount());
		}
	});
});
