import {
  api,
  apiError,
  apiSuccess,
  apiUrl,
  type ApiResponse,
  type BaseUploadBody,
  type ObjectList,
  type UploadBody,
  type UploadResult,
} from "$lib/api";

export async function listFiles(
  folder?: string,
): Promise<ApiResponse<ObjectList>> {
  try {
    const {
      data,
      error: err,
      response,
    } = await api.GET("/api/v1/storage/objects", {
      params: {
        query: {
          folder,
        },
      },
    });

    if (err) {
      return apiError(response.status, err.error);
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable", e);
  }
}

export async function listRecentFiles(): Promise<ApiResponse<ObjectList>> {
  try {
    const {
      data,
      error: err,
      response,
    } = await api.GET("/api/v1/storage/objects/recent");

    if (err) {
      return apiError(response.status, err.error);
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable", e);
  }
}

export async function listFilesByCategory(
  category: string,
): Promise<ApiResponse<ObjectList>> {
  try {
    const {
      data,
      error: err,
      response,
    } = await api.GET("/api/v1/storage/objects/category/{category}", {
      params: {
        path: {
          category,
        },
      },
    });

    if (err) {
      return apiError(response.status, err.error);
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable");
  }
}

export async function uploadFile(
  body: UploadBody,
): Promise<ApiResponse<UploadResult>> {
  try {
    const {
      data,
      error: err,
      response,
    } = await api.POST("/api/v1/storage/objects", {
      body: body as BaseUploadBody,
    });

    if (err) {
      return apiError(response.status, err.error);
    }

    return apiSuccess(data);
  } catch (e) {
    return apiError(500, "API seems unreachable", e);
  }
}
