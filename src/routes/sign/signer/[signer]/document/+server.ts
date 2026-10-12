import { error } from "@sveltejs/kit";
import {
	SignatureError,
	signatures,
} from "#lib/server/services/signatures/index.js";
import { accountSigner } from "#lib/server/services/signatures/page.js";
import { pdfResponse } from "#lib/server/services/signatures/respond.js";

/** As `/sign/[token]/document`, for the signed-in signer. */
export const GET = async (event) => {
	const signer = accountSigner(event, event.params.signer);
	try {
		const pdf = signer
			? await signatures().signerPdf(signer, "original")
			: null;
		if (!pdf) {
			return error(404, "This document is not available.");
		}
		return pdfResponse(
			pdf,
			event.url.searchParams.has("download") ? "attachment" : "inline",
		);
	} catch (caught) {
		if (caught instanceof SignatureError) {
			return error(caught.status, caught.message);
		}
		throw caught;
	}
};
