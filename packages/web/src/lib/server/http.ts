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

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static Unauthorized(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Unauthorized", context: details },
			{ status: 401 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static Forbidden(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Forbidden", context: details },
			{ status: 403 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static BadRequest(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 400 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static NotFound(message = "Not found", details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 404 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static Conflict(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 409 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static UnprocessableEntity(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 422 },
		);
	}

	public static TooManyRequests(
		message = "Too many requests",
		// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
		details?: any,
	) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 429 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static NotImplemented(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Not implemented", context: details },
			{ status: 501 },
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow any for details
	public static ServiceUnavailable(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Service unavailable", context: details },
			{ status: 503 },
		);
	}
}
