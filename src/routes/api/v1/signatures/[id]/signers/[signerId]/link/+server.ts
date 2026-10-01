import { Http } from "#lib/server/http.js";
import { renewSignatureLink } from "#lib/server/openapi/v1/signatures.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { signatureFailure } from "#lib/server/services/signatures/respond.js";

export const POST = renewSignatureLink.handler(
	async ({ params, body, user }) => {
		try {
			return Http.Ok(
				await signatures().renewLink(
					params.id,
					params.signerId,
					user.id,
					body.send,
				),
			);
		} catch (error) {
			return signatureFailure(error, "Failed to issue a new signing link");
		}
	},
);
