import { oAuthReady } from '$lib/server/services/auth';
import { MailService } from '$lib/server/services/mail';

export const load = () => {
	const mail = new MailService();

	return {
		passwordlessReady: mail.ready,
		oauthReady: oAuthReady()
	};
};
