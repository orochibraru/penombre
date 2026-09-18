import { getSmtpSettings } from "#lib/server/services/app-settings.js";

export const load = async () => ({
	// The email copy of a notification is only offered when the instance can
	// actually send one — gated here as well as in the service, so the toggle
	// never promises mail that would be silently dropped.
	smtpAvailable: !!(await getSmtpSettings()),
});
