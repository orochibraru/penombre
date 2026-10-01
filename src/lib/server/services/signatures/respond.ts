import { Http } from "#lib/server/http.js";
import { rawFileSecurityHeaders } from "#lib/server/services/storage/mappers.js";
import { SignatureError, UnsignableDocumentError } from "./service";

/** A refusal as the status that says why; anything else is logged as a 500. */
export function signatureFailure(error: unknown, what: string): Response {
	if (error instanceof SignatureError) {
		return Http.StandardizedResponse(
			{ message: error.message },
			{ status: error.status },
		);
	}
	if (error instanceof UnsignableDocumentError) {
		return Http.UnprocessableEntity(error.message);
	}
	return Http.ServerError(what, error);
}

export function pdfResponse(
	pdf: { bytes: Uint8Array; name: string },
	disposition: "inline" | "attachment",
): Response {
	return new Response(new Uint8Array(pdf.bytes), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(pdf.name)}`,
			"Cache-Control": "private, no-store",
			...rawFileSecurityHeaders("application/pdf"),
		},
	});
}
