import { Logger } from "#lib/logger.js";

const logger = new Logger("HTTP_ERROR");

export interface StandardizedResponse<T = void> {
	message?: string;
	data?: T;
	context?: unknown;
}

// oxlint-disable-next-line typescript/no-extraneous-class -- Http helper
export class Http {
	public static StandardizedResponse<T = void>(
		res: StandardizedResponse<T>,
		init?: ResponseInit,
	) {
		return Response.json(res, init);
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
					message,
					context: error.message,
				},
				{
					status: 500,
				},
			);
		}

		return Http.StandardizedResponse(
			{
				message,
				context: "Internal server error",
			},
			{
				status: 500,
			},
		);
	}

	public static Unauthorized(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Unauthorized", context: details },
			{ status: 401 },
		);
	}

	public static Forbidden(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Forbidden", context: details },
			{ status: 403 },
		);
	}

	public static BadRequest(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 400 },
		);
	}

	public static NotFound(message = "Not found", details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 404 },
		);
	}

	public static Conflict(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 409 },
		);
	}

	public static UnprocessableEntity(message: string, details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 422 },
		);
	}

	public static TooManyRequests(message = "Too many requests", details?: any) {
		return Http.StandardizedResponse(
			{ message, context: details },
			{ status: 429 },
		);
	}

	public static NotImplemented(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Not implemented", context: details },
			{ status: 501 },
		);
	}

	public static ServiceUnavailable(details?: any) {
		return Http.StandardizedResponse(
			{ message: "Service unavailable", context: details },
			{ status: 503 },
		);
	}
}
