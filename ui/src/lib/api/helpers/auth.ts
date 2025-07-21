import {
  api,
  apiError,
  apiSuccess,
  type ApiResponse,
  type Providers,
  type UserSession,
} from "$lib/api";

export async function getProviders(): Promise<ApiResponse<Providers>> {
  try {
    const {
      data,
      error: err,
      response,
    } = await api.GET("/api/v1/auth/oauth/providers");

    if (err) {
      return apiError(response.status, err.error);
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable", e);
  }
}

export async function getUser(): Promise<ApiResponse<UserSession>> {
  try {
    const { data, error: err, response } = await api.GET("/api/v1/auth/me");

    if (err) {
      return apiError(response.status, err.error);
    }

    if (!data) {
      return apiError(
        500,
        "No user or session retrieved from auth me endpoint",
      );
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable", e);
  }
}
