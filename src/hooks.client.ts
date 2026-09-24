import type { HandleClientError } from "@sveltejs/kit/hooks";
import { api } from "#lib/api/index.js";
import { dev } from "$app/env";

function makeid(length: number) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export const handleError: HandleClientError = ({ error, kind }) => {
	if (kind !== "unknown") {
		return;
	}

	const errorId = makeid(24);
	// oxlint-disable-next-line no-console -- #lib/logger is server-only; without this a client error leaves no trace.
	console.error(`[${errorId}]`, error);
	api
		.POST("/api/v1/client-errors", {
			body: {
				errorId,
				message: (error instanceof Error ? error.message : String(error)).slice(
					0,
					2000,
				),
				stack: error instanceof Error ? error.stack?.slice(0, 8000) : undefined,
				url: location.href.slice(0, 2000),
			},
			keepalive: true,
		})
		.catch(() => undefined);

	if (dev) {
		if (error instanceof Error) {
			return {
				message: error.message,
				errorId,
			};
		}

		return {
			message: String(error),
			errorId,
		};
	}

	return {
		message: "Whoops!",
		errorId,
	};
};
