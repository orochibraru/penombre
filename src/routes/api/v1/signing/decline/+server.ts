import { Http } from "#lib/server/http.js";
import { declineThroughLink } from "#lib/server/openapi/v1/signing.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { requestSigner } from "#lib/server/services/signatures/page.js";
import {
	signatureFailure,
	signingMeta,
} from "#lib/server/services/signatures/respond.js";

export const POST = declineThroughLink.handler(async ({ body, event }) => {
	const signer = requestSigner(event, body);
	if (!signer) {
		return Http.NotFound("This link does not exist.");
	}
	try {
		return Http.Ok(
			await signatures().decline(
				signer,
				body.reason ?? null,
				signingMeta(event),
			),
		);
	} catch (error) {
		return signatureFailure(error, "Failed to decline");
	}
});
