/**
 * Which release's builds (desktop, mobile) to offer. In a module of its own
 * so the browser can ask too: `services/version.ts` reads the server config.
 */

export function channelOf(version: string): "stable" | "canary" {
	return version.includes("-canary.") ? "canary" : "stable";
}

/**
 * The server's own release, unless the instance follows the other channel (a
 * server built from source reports a plain version while following canary),
 * then that channel's newest.
 */
export function desktopReleaseVersion(
	own: string,
	channel: "stable" | "canary",
	newest: string | null,
): string {
	return channel === channelOf(own) ? own : (newest ?? own);
}

/**
 * Which release's builds to offer, from what the layout already streamed: the
 * version check, or the server's own version when that did not answer.
 */
export async function offeredRelease(data: {
	versionCheck?: unknown;
	config?: { appVersion?: string };
}): Promise<string | undefined> {
	const check = (await data.versionCheck) as
		| {
				currentVersion: string;
				channel: "stable" | "canary";
				latestVersion: string | null;
		  }
		| undefined;
	return check
		? desktopReleaseVersion(
				check.currentVersion,
				check.channel,
				check.latestVersion,
			)
		: data.config?.appVersion;
}

export const RELEASES = "https://github.com/orochibraru/penombre/releases";
export const PLAY_STORE =
	"https://play.google.com/store/apps/details?id=com.orochibraru.penombre";

/** A release asset's download link. */
export function assetUrl(version: string, file: string): string {
	return `${RELEASES}/download/v${version}/${file}`;
}

/** The phone in hand, from its user agent; undefined on a computer. */
export function phoneSystem(userAgent: string): "android" | "ios" | undefined {
	if (/Android/.test(userAgent)) {
		return "android";
	}
	return /iPhone|iPad|iPod/.test(userAgent) ? "ios" : undefined;
}

/** Set by the mobile app on its embedded browser: nothing to advertise there. */
export const APP_USER_AGENT = "PenombreApp";
