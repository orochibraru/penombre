import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { reportClientError } from "#lib/server/openapi/v1/client-errors.js";
import { isRateLimited } from "#lib/server/rate-limit.js";

const logger = new Logger("Client");

export const POST = reportClientError.handler(async ({ body, user, event }) => {
	// Open to anyone, so the log must not be theirs to flood.
	if (
		await isRateLimited(`client-error:${event.getClientAddress()}`, {
			max: 30,
			windowSeconds: 5 * 60,
		})
	) {
		return Http.TooManyRequests();
	}
	// JSON-quoted: a message with newlines must not forge log lines.
	logger.error(
		`Browser error [${JSON.stringify(body.errorId)}] on ${JSON.stringify(body.url)} (user ${user?.id ?? "anonymous"}): ${JSON.stringify(body.message)}`,
		body.stack ? JSON.stringify(body.stack) : "",
	);
	return Http.Accepted();
});
