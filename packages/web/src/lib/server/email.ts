import { createTransport, type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Logger } from "$lib/logger";
import { getOpendriveConfig } from "$lib/server/config";

const logger = new Logger("Email");

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

	constructor({ to, subject, content }: EmailProps) {
		logger.debug(`Preparing email to: ${to}, subject: ${subject}`);
		this.to = to;
		this.subject = subject;
		this.content = content;

		const smtpConfig = getOpendriveConfig().smtp;
		if (!smtpConfig) {
			logger.error("SMTP configuration is not defined");
			throw new Error("SMTP configuration is not defined");
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
