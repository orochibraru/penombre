import { createTransport, type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import { type EmailContent, renderEmail } from "#lib/server/email-template.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";

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
	/** Plain text; always sent, and all a text-only client shows. */
	content: string;
	html?: string;
}

/** `no-reply@x` → `"Penombre" <no-reply@x>`; an address that names itself stays. */
export function withSenderName(from: string, name: string): string {
	if (from.includes("<") || !name) {
		return from;
	}
	return `"${name.replaceAll('"', "")}" <${from.trim()}>`;
}

export class Email {
	from: string;
	to: string;
	subject: string;
	content: string;
	html?: string;
	transporter: Transporter<SMTPTransport.SentMessageInfo>;

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

	/** Lay `content` out with the shared template and send it. */
	static async sendTemplate(to: string, content: EmailContent): Promise<void> {
		const { subject, text, html } = renderEmail(content);
		const message = await Email.create({ to, subject, content: text, html });
		await message.send();
	}

	constructor(
		{ to, subject, content, html }: EmailProps,
		smtpOverride?: SmtpConfig,
	) {
		logger.debug(`Preparing email to: ${to}, subject: ${subject}`);
		this.to = to;
		this.subject = subject;
		this.content = content;
		this.html = html;

		const smtpConfig = smtpOverride ?? getConfig().smtp;
		if (!smtpConfig?.enabled) {
			logger.error("SMTP configuration is not defined or not enabled");
			throw new Error("SMTP configuration is not defined or not enabled");
		}

		this.from = withSenderName(smtpConfig.from, getConfig().appName);

		this.transporter = createTransport({
			host: smtpConfig.host,
			port: smtpConfig.port,
			secure: smtpConfig.secure, // true for port 465, false for other ports
			// Omitted entirely when there are no credentials: nodemailer sees
			// an `auth` block and tries to log in, so an unauthenticated relay
			// that merely *advertises* AUTH failed with "Missing credentials
			// for PLAIN" instead of accepting the message.
			...(smtpConfig.user || smtpConfig.password
				? { auth: { user: smtpConfig.user, pass: smtpConfig.password } }
				: {}),
		});

		logger.debug("SMTP transporter created successfully");
	}

	public send() {
		logger.debug(`Sending email to: ${this.to}, subject: ${this.subject}`);
		return this.transporter.sendMail({
			to: this.to,
			from: this.from,
			subject: this.subject,
			text: this.content,
			...(this.html ? { html: this.html } : {}),
		});
	}
}
