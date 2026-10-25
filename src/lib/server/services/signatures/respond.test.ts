import { describe, expect, test } from "bun:test";

import { UnsignableDocumentError } from "./pdf";
import { pdfResponse, signatureFailure, signingMeta } from "./respond";
import { SignatureError } from "./service";

describe("signatureFailure", () => {
	test("a refusal keeps its status and message", async () => {
		const response = signatureFailure(
			new SignatureError(410, "This link has been replaced."),
			"Could not sign",
		);
		expect(response.status).toBe(410);
		expect(await response.json()).toEqual({
			message: "This link has been replaced.",
		});
	});

	test("a document that cannot be signed is unprocessable", async () => {
		const response = signatureFailure(
			new UnsignableDocumentError("The PDF is encrypted."),
			"Could not sign",
		);
		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({
			message: "The PDF is encrypted.",
		});
	});

	test("anything else is a 500 that never leaks the cause", async () => {
		const response = signatureFailure(
			new Error("SELECT * FROM signature_signers"),
			"Could not sign",
		);
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain("signature_signers");
	});
});

describe("pdfResponse", () => {
	test("serves the bytes as an uncached PDF with an encoded name", async () => {
		const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
		const response = pdfResponse(
			{ bytes, name: "Contrat signé.pdf" },
			"attachment",
		);

		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			"attachment; filename*=UTF-8''Contrat%20sign%C3%A9.pdf",
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(response.headers.get("Content-Security-Policy")).toBeNull();
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
	});

	test("can be shown inline", () => {
		const response = pdfResponse(
			{ bytes: new Uint8Array(), name: "a.pdf" },
			"inline",
		);
		expect(response.headers.get("Content-Disposition")).toStartWith("inline;");
	});
});

describe("signingMeta", () => {
	const event = (account: unknown, headers: HeadersInit = {}) =>
		({
			locals: { user: account },
			getClientAddress: () => "203.0.113.9",
			request: new Request("https://drive.example/sign/x", { headers }),
		}) as never;

	test("records the address, the agent and the signed-in account", () => {
		expect(
			signingMeta(
				event(
					{ id: "u1", email: "u1@example.com", name: "Someone" },
					{ "user-agent": "Test/1" },
				),
			),
		).toEqual({
			ipAddress: "203.0.113.9",
			userAgent: "Test/1",
			account: { id: "u1", email: "u1@example.com" },
		});
	});

	test("a signed-out signer has no account", () => {
		expect(signingMeta(event(null))).toEqual({
			ipAddress: "203.0.113.9",
			userAgent: null,
			account: null,
		});
	});
});
