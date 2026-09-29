import { getConfig } from "#lib/server/config.js";

/** Everything an email says; `renderEmail` lays it out as HTML and text. */
export interface EmailContent {
	subject: string;
	heading: string;
	/** Paragraphs, plain text. */
	lines: string[];
	/** One button, and the URL the text version spells out. */
	action?: { label: string; url: string };
	/** Small print under the button: why they got it, when it expires. */
	footnote?: string;
}

export interface RenderedEmail {
	subject: string;
	text: string;
	html: string;
}

const ACCENT = "#7a1f3d";

function escape(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/**
 * Tables and inline styles only: mail clients drop `<style>`, flexbox and
 * anything else a browser would take for granted.
 */
export function renderEmail(content: EmailContent): RenderedEmail {
	const { appName, origin } = getConfig();
	const paragraphs = content.lines
		.map(
			(line) =>
				`<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3a3d;">${escape(line)}</p>`,
		)
		.join("");
	const button = content.action
		? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:8px;background:${ACCENT};">
<a href="${escape(content.action.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escape(content.action.label)}</a>
</td></tr></table>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#77707a;">Or open this link: <a href="${escape(content.action.url)}" style="color:${ACCENT};word-break:break-all;">${escape(content.action.url)}</a></p>`
		: "";
	const footnote = content.footnote
		? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#77707a;">${escape(content.footnote)}</p>`
		: "";

	const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f2f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding:0 4px 16px;font-size:16px;font-weight:700;color:${ACCENT};">${escape(appName)}</td></tr>
<tr><td style="background:#ffffff;border-radius:14px;padding:32px;border:1px solid #ebe4e8;">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#1f1a1d;">${escape(content.heading)}</h1>
${paragraphs}${button}${footnote}
</td></tr>
<tr><td style="padding:16px 4px 0;font-size:12px;color:#9a929c;">Sent by ${escape(appName)} · <a href="${escape(origin)}" style="color:#9a929c;">${escape(origin.replace(/^https?:\/\//, ""))}</a></td></tr>
</table>
</td></tr>
</table>
</body></html>`;

	const text = [
		content.heading,
		"",
		...content.lines.flatMap((line) => [line, ""]),
		...(content.action
			? [`${content.action.label}: ${content.action.url}`, ""]
			: []),
		...(content.footnote ? [content.footnote, ""] : []),
		`— ${appName}, ${origin}`,
	].join("\n");

	return { subject: content.subject, text, html };
}
