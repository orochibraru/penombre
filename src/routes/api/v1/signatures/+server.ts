import { Http } from "#lib/server/http.js";
import {
	createSignatureRequest,
	listSignatureRequests,
} from "#lib/server/openapi/v1/signatures.js";
import { rethrowRefusal } from "#lib/server/services/drives.js";
import { signatures } from "#lib/server/services/signatures/index.js";
import { signatureFailure } from "#lib/server/services/signatures/respond.js";

export const GET = listSignatureRequests.handler(async ({ query, user }) => {
	try {
		return Http.Ok(await signatures().list(user.id, query.fileId));
	} catch (error) {
		return signatureFailure(error, "Failed to list signature requests");
	}
});

/** The document is read through the caller's storage, so its write access decides. */
export const POST = createSignatureRequest.handler(
	async ({ body, user, service }) => {
		try {
			return Http.Ok(
				await signatures().request(service, body.fileId, {
					requester: { id: user.id, name: user.name, email: user.email },
					signers: body.signers,
					message: body.message,
					sequential: body.sequential,
					expiresInDays: body.expiresInDays,
				}),
			);
		} catch (error) {
			rethrowRefusal(error);
			return signatureFailure(error, "Failed to request signatures");
		}
	},
);
