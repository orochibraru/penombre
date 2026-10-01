import { error } from "@sveltejs/kit";
import {
	SignatureError,
	signatures,
} from "#lib/server/services/signatures/index.js";
import { pdfResponse } from "#lib/server/services/signatures/respond.js";

/** The signed PDF, for a while after everyone signed. */
export const GET = async ({ params }) => {
	try {
		const pdf = await signatures().signerPdf(params.token, "signed");
		if (!pdf) {
			return error(404, "The signed PDF is not available from this link.");
		}
		return pdfResponse(pdf, "attachment");
	} catch (caught) {
		if (caught instanceof SignatureError) {
			return error(caught.status, caught.message);
		}
		throw caught;
	}
};
