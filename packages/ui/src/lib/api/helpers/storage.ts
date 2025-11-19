import {
	type ApiResponse,
	apiError,
	apiSuccess,
	type BaseUploadBody,
	getApiClient,
	type ObjectList,
	type UploadBody,
	type UploadResult,
} from "$lib/api";

export type ObjectRequest = ApiResponse<ObjectList>;

export async function uploadFile(
	body: UploadBody,
): Promise<ApiResponse<UploadResult>> {
	try {
		const {
			data,
			error: err,
			response,
		} = await getApiClient().POST("/api/storage/objects", {
			body: body as BaseUploadBody,
		});

		if (err) {
			return apiError(response.status, err.message);
		}

		return apiSuccess(data);
	} catch (e) {
		return apiError(500, "API seems unreachable", e);
	}
}
