import { getConfig } from "#lib/server/config.js";
import { effectiveReleaseChannel } from "#lib/server/services/app-settings.js";
import {
	channelOf,
	checkForUpdate,
	desktopReleaseVersion,
} from "#lib/server/services/version.js";

export const load = async () => {
	const own = getConfig().appVersion;
	const channel = await effectiveReleaseChannel();
	// Only asks GitHub (cached) when the channel differs from the server's own.
	const newest =
		channel === channelOf(own) ? null : (await checkForUpdate()).latestVersion;
	return { version: desktopReleaseVersion(own, channel, newest) };
};
