import type { RequestEvent } from "@sveltejs/kit";

import { Http } from "#lib/server/http.js";
import { rawFileSecurityHeaders } from "#lib/server/services/storage/mappers.js";

import {
	type RequestMeta,
	SignatureError,
	UnsignableDocumentError,
} from "./service";

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

/** Who is answering a link: where from, with what, signed in as whom. */
export function signingMeta(event: RequestEvent): RequestMeta {
	const account = event.locals.user;
	return {
		ipAddress: event.getClientAddress(),
		userAgent: event.request.headers.get("user-agent"),
		account: account ? { id: account.id, email: account.email } : null,
	};
}
