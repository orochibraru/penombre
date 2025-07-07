import { env } from '$env/dynamic/private';
import { Logger } from '$lib/logger';

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];

const logger = new Logger('Service::Mail');

export class MailService {
	public ready: boolean;

	constructor() {
		this.ready = true;
		for (const required of requiredEnvVars) {
			if (!env[required]) {
				this.ready = false;
			}
		}

		logger.info('Service Ready:', this.ready);
	}
}
