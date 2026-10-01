/**
 * The PDFs of a signature request: the document frozen when it is sent, and
 * that same PDF with a certificate appended once everyone has signed.
 *
 * pdfmake lays the certificate out (it already renders exports); pdf-lib is
 * what can open an existing PDF, stamp its pages and append to it.
 */

import { createHash } from "node:crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { exportFile } from "#lib/server/office/export/index.js";
import { renderPdf } from "#lib/server/office/export/pdf.js";

/** A file this feature cannot turn into a PDF someone could sign. */
export class UnsignableDocumentError extends Error {}

export const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

export interface Frozen {
	pdf: Uint8Array;
	hash: string;
	pageCount: number;
}

/** A PDF's own bytes; any other document exported to PDF, as it is now. */
export async function freezeDocument(
	name: string,
	bytes: ArrayBuffer,
): Promise<Frozen> {
	let pdf: Uint8Array;
	if (/\.pdf$/i.test(name)) {
		pdf = new Uint8Array(bytes);
	} else {
		try {
			pdf = (await exportFile(name, bytes, "pdf")).data;
		} catch (error) {
			throw new UnsignableDocumentError(
				`${name} cannot be turned into a PDF to sign`,
				{ cause: error },
			);
		}
	}
	let pageCount: number;
	try {
		pageCount = (await PDFDocument.load(pdf)).getPageCount();
	} catch (error) {
		// Encrypted or broken: the certificate could not be appended to it.
		throw new UnsignableDocumentError(
			"This PDF is protected or damaged and cannot be signed",
			{ cause: error },
		);
	}
	return { pdf, hash: sha256(pdf), pageCount };
}

const MAX_SIGNATURE_BYTES = 200_000;
const PNG_DATA_URL = "data:image/png;base64,";

/**
 * Refuses anything but a small PNG pdfkit can draw. Rendering it once here is
 * the only proof: a PNG that fails at completion would leave the request
 * signed by everyone and without its PDF.
 */
export async function assertSignatureImage(dataUrl: string): Promise<void> {
	const encoded = dataUrl.startsWith(PNG_DATA_URL)
		? dataUrl.slice(PNG_DATA_URL.length)
		: "";
	if (!encoded || (encoded.length * 3) / 4 > MAX_SIGNATURE_BYTES) {
		throw new UnsignableDocumentError("The signature must be a small PNG");
	}
	try {
		await renderPdf({ content: [{ image: dataUrl, width: 100 }] });
	} catch (error) {
		throw new UnsignableDocumentError("The signature image is unreadable", {
			cause: error,
		});
	}
}

export interface CertificateSigner {
	name: string;
	email: string;
	signature: string;
	signedAt: Date;
	timeZone: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	account: boolean;
}

export interface CertificateEvent {
	at: Date;
	type: string;
	actor: string | null;
	detail: string | null;
	ipAddress: string | null;
}

export interface Certificate {
	requestId: string;
	documentName: string;
	documentHash: string;
	pageCount: number;
	requester: string;
	createdAt: Date;
	completedAt: Date;
	signers: CertificateSigner[];
	events: CertificateEvent[];
}

/** `2026-10-01 14:03:22 UTC`: one zone for the whole trail. */
export function utc(date: Date): string {
	return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

/** The signer's own clock, when their browser named a zone we know. */
export function localTime(date: Date, timeZone: string | null): string | null {
	if (!timeZone) {
		return null;
	}
	try {
		return new Intl.DateTimeFormat("en-GB", {
			timeZone,
			dateStyle: "medium",
			timeStyle: "long",
		}).format(date);
	} catch {
		return null;
	}
}

const EVENT_LABELS: Record<string, string> = {
	created: "Request created",
	sent: "Link issued",
	viewed: "Document opened",
	signed: "Signed",
	declined: "Declined",
	completed: "Completed",
	cancelled: "Cancelled",
};

const MUTED = "#6b7280";

function field(label: string, value: string): Content[] {
	return [
		{ text: label, color: MUTED },
		{ text: value, font: "Courier", fontSize: 9 },
	];
}

function signerBlock(signer: CertificateSigner): Content {
	const local = localTime(signer.signedAt, signer.timeZone);
	return {
		unbreakable: true,
		margin: [0, 6, 0, 6],
		columns: [
			{ width: 170, image: signer.signature, fit: [160, 64] },
			{
				width: "*",
				stack: [
					{ text: signer.name, bold: true },
					{ text: signer.email, color: MUTED },
					`Signed ${utc(signer.signedAt)}`,
					...(local ? [{ text: `Signer's time: ${local}`, color: MUTED }] : []),
					{
						text: `IP ${signer.ipAddress ?? "unknown"}${signer.account ? " · account holder" : ""}`,
						color: MUTED,
					},
					{ text: signer.userAgent ?? "", fontSize: 7, color: MUTED },
				],
			},
		],
	};
}

function eventRow(event: CertificateEvent): Content[] {
	const details = [
		event.actor,
		event.detail,
		event.ipAddress && `IP ${event.ipAddress}`,
	]
		.filter(Boolean)
		.join(" · ");
	return [
		{ text: utc(event.at), font: "Courier", fontSize: 8 },
		EVENT_LABELS[event.type] ?? event.type,
		details,
	];
}

export function certificateDefinition(cert: Certificate): TDocumentDefinitions {
	return {
		info: { title: `Signature certificate: ${cert.documentName}` },
		pageSize: "A4",
		pageMargins: [56, 56, 56, 48],
		defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.2 },
		content: [
			{ text: "Signature certificate", fontSize: 18, bold: true },
			{
				text:
					"Simple electronic signatures with an audit trail. Each signer " +
					"was identified by access to a personal link sent to the address " +
					"below; no identity document or certificate authority was involved.",
				fontSize: 8,
				color: MUTED,
				margin: [0, 4, 0, 14],
			},
			{
				table: {
					widths: [110, "*"],
					body: [
						[{ text: "Document", color: MUTED }, cert.documentName],
						[{ text: "Pages", color: MUTED }, String(cert.pageCount)],
						field("SHA-256 (as sent)", cert.documentHash),
						field("Request", cert.requestId),
						[{ text: "Requested by", color: MUTED }, cert.requester],
						[{ text: "Sent", color: MUTED }, utc(cert.createdAt)],
						[{ text: "Completed", color: MUTED }, utc(cert.completedAt)],
					],
				},
				layout: "noBorders",
			},
			{ text: "Signers", fontSize: 13, bold: true, margin: [0, 16, 0, 4] },
			...cert.signers.map(signerBlock),
			{ text: "Audit trail", fontSize: 13, bold: true, margin: [0, 16, 0, 6] },
			{
				fontSize: 8,
				table: {
					headerRows: 1,
					widths: [118, 86, "*"],
					body: [
						[
							{ text: "Time", bold: true },
							{ text: "Event", bold: true },
							{ text: "Details", bold: true },
						],
						...cert.events.map(eventRow),
					],
				},
				layout: "lightHorizontalLines",
			},
		],
	};
}

/**
 * The frozen PDF, stamped on every page with the request id, followed by the
 * certificate. The document's pages are copied as they are, never re-rendered.
 */
export async function buildSignedPdf(
	original: Uint8Array,
	cert: Certificate,
): Promise<Uint8Array> {
	const doc = await PDFDocument.load(original);
	const certificate = await PDFDocument.load(
		await renderPdf(certificateDefinition(cert)),
	);
	const copied = await doc.copyPages(certificate, certificate.getPageIndices());
	for (const page of copied) {
		doc.addPage(page);
	}
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const pages = doc.getPages();
	pages.forEach((page, index) => {
		const label = `Signature request ${cert.requestId} · page ${index + 1} of ${pages.length}`;
		const size = 7;
		const box = page.getCropBox();
		page.drawText(label, {
			x: box.x + (box.width - font.widthOfTextAtSize(label, size)) / 2,
			y: box.y + 14,
			size,
			font,
			color: rgb(0.45, 0.45, 0.45),
		});
	});
	doc.setTitle(`${cert.documentName} (signed)`);
	doc.setProducer("Penombre");
	doc.setModificationDate(cert.completedAt);
	return doc.save();
}
