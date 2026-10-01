import type { EmailContent } from "#lib/server/email-template.js";

/** What a signer is told, in English: the certificate is English too. */

const HONEST =
	"This is a simple electronic signature: whoever holds this link can sign " +
	"as you, so do not forward this email.";

const day = (date: Date) =>
	date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

export function requestEmail(input: {
	requester: string;
	documentName: string;
	message: string | null;
	expiresAt: Date;
	url: string;
}): EmailContent {
	return {
		subject: `${input.requester} asks you to sign ${input.documentName}`,
		heading: `Please sign ${input.documentName}`,
		lines: [
			`${input.requester} asks you to sign “${input.documentName}”.`,
			...(input.message ? [`Their message: ${input.message}`] : []),
			`The link works until ${day(input.expiresAt)}.`,
		],
		action: { label: "Review and sign", url: input.url },
		footnote: HONEST,
	};
}

export function signedEmail(input: {
	documentName: string;
	availableUntil: Date;
	url: string;
}): EmailContent {
	return {
		subject: `${input.documentName} is signed`,
		heading: `${input.documentName} is signed`,
		lines: [
			"Everyone has signed. The signed PDF carries a certificate listing each signature and every step of the request.",
		],
		action: { label: "Download the signed PDF", url: input.url },
		footnote: `The link works until ${day(input.availableUntil)}.`,
	};
}
