import { Http } from "#lib/server/http.js";
import { exportAccountData } from "#lib/server/openapi/v1/account.js";
import { exportAccountData as buildAccountDataExport } from "#lib/server/services/account-export.js";

export const GET = exportAccountData.handler(async ({ user }) => {
	try {
		const data = await buildAccountDataExport(user.id);
		if (!data) {
			return Http.NotFound("Account not found");
		}
		return Http.Ok(data);
	} catch (error) {
		return Http.ServerError("Failed to export account data", error);
	}
});
