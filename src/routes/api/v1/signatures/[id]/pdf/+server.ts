import { Http } from "#lib/server/http.js";
import { signatureRequestPdf } from "#lib/server/openapi/v1/signatures.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import {
	pdfResponse,
	signatureFailure,
} from "#lib/server/services/signatures/respond.js";

export const GET = signatureRequestPdf.handler(
	async ({ params, query, user }) => {
		try {
			const pdf = await signatures().ownerPdf(params.id, user.id, query.kind);
			return pdf
				? pdfResponse(pdf, "attachment")
				: Http.NotFound("This PDF is not available yet.");
		} catch (error) {
			return signatureFailure(error, "Failed to read the signature PDF");
		}
	},
);
