import createClient from "openapi-fetch";
import { env } from "$env/dynamic/private";
import type { components, paths } from "./schema";

export const apiUrl = env.ORIGIN || "http://localhost:8080";

export const authCookieName = "better-auth.session_token";

export function getApiClient(
	fetch: typeof globalThis.fetch = globalThis.fetch,
) {
	const client = createClient<paths>({
		baseUrl: apiUrl,
		credentials: "include",
		fetch,
	});

	return client;
}

export type ApiError = {
	code: number;
	message: string;
};

export type ApiResponse<T> =
	| {
			data: T;
			err: undefined;
	  }
	| {
			data: undefined;
			err: ApiError;
	  };

const defaultErrorMessage = "An unexpected error occured.";

export function apiError<T>(
	code: number,
	message = defaultErrorMessage,
	// biome-ignore lint/suspicious/noExplicitAny: This needs to be any error
	details?: any,
): ApiResponse<T> {
	let finalMessage = message;
	if (code >= 401 && code <= 403 && message === defaultErrorMessage) {
		finalMessage = "You don't have access.";
	}

	console.error("API Error", {
		code,
		message,
		details,
	});

	return {
		err: {
			code,
			message: finalMessage,
		},
		data: undefined,
	};
}

export function apiSuccess<T>(data: T): ApiResponse<T> {
	return {
		err: undefined,
		data,
	};
}

export type UserSession = components["schemas"]["Session"];
export type User = components["schemas"]["User"];
export type Bucket = string;
export type ObjectItem =
	paths["/api/storage/objects/item/{item}"]["get"]["responses"]["200"]["content"]["application/json"];
export type ObjectList =
	paths["/api/storage/objects"]["get"]["responses"]["200"]["content"]["application/json"];
export type UploadResult =
	paths["/api/storage/objects"]["post"]["responses"]["200"]["content"]["application/json"];
export type BaseUploadBody =
	paths["/api/storage/objects"]["post"]["requestBody"]["content"]["application/json"];
export type UploadBody =
	paths["/api/storage/objects"]["post"]["requestBody"]["content"]["application/json"];
