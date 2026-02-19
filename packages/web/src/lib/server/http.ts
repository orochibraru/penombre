import { json } from "@sveltejs/kit";
import { Logger } from "$lib/logger";

const logger = new Logger("HTTP_ERROR");

export type StandardizedResponse<T = void> = {
	message?: string;
	data?: T;
	context?: unknown;
};

// biome-ignore lint/complexity/noStaticOnlyClass: Http helper
export class Http {
	public static StandardizedResponse<T = void>(
		res: StandardizedResponse<T>,
		init?: ResponseInit,
	) {
		return json(res, init);
	}

	public static Ok<T>(data: T) {
		return Http.StandardizedResponse({ data }, { status: 200 });
	}

	public static Accepted() {
		return Http.StandardizedResponse({}, { status: 202 });
	}

	public static Created() {
		return Http.StandardizedResponse({}, { status: 201 });
	}

	public static Deleted() {
		return Http.StandardizedResponse({}, { status: 204 });
	}

	public static ServerError(message: string, error: unknown) {
		logger.error(message, error);
		if (error instanceof Error) {
			return Http.StandardizedResponse(
				{
					message: message,
					context: error.message,
				},
				{
					status: 500,
				},
			);
		}

		return Http.StandardizedResponse(
			{
				message: message,
				context: "Internal server error",
			},
			{
				status: 500,
			},
		);
	}

	public static Unauthorized() {
		return Http.StandardizedResponse(
			{ message: "Unauthorized" },
			{ status: 401 },
		);
	}

	public static Forbidden() {
		return Http.StandardizedResponse({ message: "Forbidden" }, { status: 403 });
	}

	public static BadRequest(message: string) {
		return Http.StandardizedResponse({ message }, { status: 400 });
	}

	public static NotFound(message = "Not found") {
		return Http.StandardizedResponse({ message }, { status: 404 });
	}

	public static Conflict(message: string) {
		return Http.StandardizedResponse({ message }, { status: 409 });
	}

	public static UnprocessableEntity(message: string) {
		return Http.StandardizedResponse({ message }, { status: 422 });
	}

	public static TooManyRequests(message = "Too many requests") {
		return Http.StandardizedResponse({ message }, { status: 429 });
	}

	public static NotImplemented() {
		return Http.StandardizedResponse(
			{ message: "Not implemented" },
			{ status: 501 },
		);
	}

	public static ServiceUnavailable() {
		return Http.StandardizedResponse(
			{ message: "Service unavailable" },
			{ status: 503 },
		);
	}
}
