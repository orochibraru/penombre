import type { HandleClientError } from "@sveltejs/kit";
import { dev } from "$app/environment";

function makeid(length: number) {
	var result = "";
	var characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export const handleError: HandleClientError = ({ error, event, message }) => {
	const errorId = makeid(24);

	console.error("An error occurred on the client side:", error, event, message);

	if (dev) {
		if (error instanceof Error) {
			return {
				message: error.message,
				stack: error.stack,
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
