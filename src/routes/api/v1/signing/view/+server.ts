import { Http } from "#lib/server/http.js";
import { openSigning } from "#lib/server/openapi/v1/signing.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { requestSigner } from "#lib/server/services/signatures/page.js";
import {
	signatureFailure,
	signingMeta,
} from "#lib/server/services/signatures/respond.js";

export const POST = openSigning.handler(async ({ body, event }) => {
	const signer = requestSigner(event, body);
	try {
		const view = signer
			? await signatures().open(signer, signingMeta(event))
			: null;
		return view
			? Http.Ok(view)
			: Http.NotFound(
					"This link does not exist, or a newer one replaced it. Check your latest email.",
				);
	} catch (error) {
		return signatureFailure(error, "Failed to open the signing link");
	}
});
