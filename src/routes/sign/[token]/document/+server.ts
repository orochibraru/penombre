import { error } from "@sveltejs/kit";
import {
	SignatureError,
	signatures,
} from "#lib/server/services/signatures/index.js";
import { pdfResponse } from "#lib/server/services/signatures/respond.js";

/** The frozen PDF this link asks to sign; `?download` saves it instead. */
export const GET = async ({ params, url }) => {
	try {
		const pdf = await signatures().signerPdf(params.token, "original");
		if (!pdf) {
			return error(404, "This document is no longer available.");
		}
		return pdfResponse(
			pdf,
			url.searchParams.has("download") ? "attachment" : "inline",
		);
	} catch (caught) {
		if (caught instanceof SignatureError) {
			return error(caught.status, caught.message);
		}
		throw caught;
	}
};
