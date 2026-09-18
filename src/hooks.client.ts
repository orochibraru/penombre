import type { HandleClientError } from "@sveltejs/kit/hooks";
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
