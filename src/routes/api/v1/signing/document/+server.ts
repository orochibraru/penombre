import { Http } from "#lib/server/http.js";
import { signingDocument } from "#lib/server/openapi/v1/signing.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { requestSigner } from "#lib/server/services/signatures/page.js";
import {
	pdfResponse,
	signatureFailure,
} from "#lib/server/services/signatures/respond.js";

export const POST = signingDocument.handler(async ({ body, event }) => {
	const signer = requestSigner(event, body);
	try {
		const pdf = signer ? await signatures().signerPdf(signer, body.kind) : null;
		return pdf
			? pdfResponse(pdf, "inline")
			: Http.NotFound("This document is no longer available.");
	} catch (error) {
		return signatureFailure(error, "Failed to read the document to sign");
	}
});
