import { createTransport, type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Logger } from "$lib/logger";
import { getConfig } from "$lib/server/config";
import { getSmtpSettings } from "$lib/server/services/app-settings";

const logger = new Logger("Email");

/** Resolved SMTP settings, from either the environment or the database. */
export interface SmtpConfig {
	enabled: boolean;
	host: string;
	port: number;
	user: string;
	password: string;
	from: string;
	secure: boolean;
}

interface EmailProps {
	to: string;
	subject: string;
	content: string;
}

export class Email {
	from: string;
	to: string;
	subject: string;
	content: string;
	transporter: Transporter<
		SMTPTransport.SentMessageInfo,
		SMTPTransport.Options
	>;

	/**
	 * Build a sender from whichever SMTP configuration applies.
	 *
	 * Async because the settings may live in the database: env wins when
	 * `SMTP_ENABLED` is set, otherwise the admin UI's values are used.
	 */
	static async create(props: EmailProps): Promise<Email> {
		const smtp = await getSmtpSettings();
		if (!smtp) {
			logger.error("SMTP is not configured");
			throw new Error("SMTP is not configured");
		}
		return new Email(props, smtp);
	}

	constructor({ to, subject, content }: EmailProps, smtpOverride?: SmtpConfig) {
		logger.debug(`Preparing email to: ${to}, subject: ${subject}`);
		this.to = to;
		this.subject = subject;
		this.content = content;

		const smtpConfig = smtpOverride ?? getConfig().smtp;
		if (!smtpConfig?.enabled) {
			logger.error("SMTP configuration is not defined or not enabled");
			throw new Error("SMTP configuration is not defined or not enabled");
		}

		this.from = smtpConfig.from;

		this.transporter = createTransport({
			host: smtpConfig.host,
			port: smtpConfig.port,
			secure: smtpConfig.secure, // true for port 465, false for other ports
			auth: {
				user: smtpConfig.user,
				pass: smtpConfig.password,
			},
		});

		logger.debug("SMTP transporter created successfully");
	}

	public send() {
		logger.info(`Sending email to: ${this.to}, subject: ${this.subject}`);
		return this.transporter.sendMail({
			to: this.to,
			from: this.from,
			subject: this.subject,
			text: this.content,
		});
	}
}
