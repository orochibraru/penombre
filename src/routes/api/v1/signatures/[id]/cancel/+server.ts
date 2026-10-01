import { Http } from "#lib/server/http.js";
import { cancelSignatureRequest } from "#lib/server/openapi/v1/signatures.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { signatureFailure } from "#lib/server/services/signatures/respond.js";

export const POST = cancelSignatureRequest.handler(async ({ params, user }) => {
	try {
		return Http.Ok(await signatures().cancel(params.id, user));
	} catch (error) {
		return signatureFailure(error, "Failed to cancel the signature request");
	}
});
