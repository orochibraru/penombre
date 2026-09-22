import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import {
	effectiveReleaseChannel,
	getAppSettings,
	isVersionCheckEnabled,
} from "#lib/server/services/app-settings.js";

const logger = new Logger("VERSION_CHECK");

const RELEASES_URL =
	"https://api.github.com/repos/orochibraru/penombre/releases";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
/** A failed check (rate limited, network down, air-gapped) retries sooner
 * than a successful one, but still not on every page load. */
const FAILURE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
/** Enough recent releases to find the newest canary even mid stable-release. */
const CANARY_LOOKBACK = 20;

export interface VersionCheckResult {
	currentVersion: string;
	latestVersion: string | null;
	updateAvailable: boolean;
	releaseUrl: string | null;
	/** Whether the check ran at all; false means "never asked", not "no update". */
	enabled: boolean;
	channel: "stable" | "canary";
}

interface CachedResult {
	data: VersionCheckResult;
	fetchedAt: number;
	ttl: number;
}

/** Keyed by channel: switching channel must not serve the other one's cache. */
const cache = new Map<string, CachedResult>();

export function normalizeVersion(version: string): string {
	return version.replace(/^v/, "");
}

interface ParsedVersion {
	major: number;
	minor: number;
	patch: number;
	prerelease: (string | number)[];
}

function parseSemver(version: string): ParsedVersion | null {
	const match = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z-.]+))?/.exec(
		normalizeVersion(version),
	);
	if (!match) {
		return null;
	}
	const [, major, minor, patch, pre] = match;
	const prerelease = pre
		? pre.split(".").map((id) => (/^\d+$/.test(id) ? Number(id) : id))
		: [];
	return {
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch ?? 0),
		prerelease,
	};
}

/**
 * Real semver precedence (spec section 11), not a per-segment `Number()`
 * split: that broke on any prerelease tag (`1.8.51-canary.3` parsed as
 * `NaN`) and compared a release against its own prerelease as equal.
 * Unparsable input compares as equal, so a garbage tag never claims an
 * update.
 */
function compareSemver(a: string, b: string): number {
	const pa = parseSemver(a);
	const pb = parseSemver(b);
	if (!pa || !pb) {
		return 0;
	}
	if (pa.major !== pb.major) {
		return pa.major - pb.major;
	}
	if (pa.minor !== pb.minor) {
		return pa.minor - pb.minor;
	}
	if (pa.patch !== pb.patch) {
		return pa.patch - pb.patch;
	}
	// No prerelease outranks any prerelease of the same major.minor.patch.
	if (pa.prerelease.length === 0 && pb.prerelease.length > 0) {
		return 1;
	}
	if (pa.prerelease.length > 0 && pb.prerelease.length === 0) {
		return -1;
	}
	const len = Math.max(pa.prerelease.length, pb.prerelease.length);
	for (let i = 0; i < len; i++) {
		const x = pa.prerelease[i];
		const y = pb.prerelease[i];
		if (x === undefined) {
			return -1;
		}
		if (y === undefined) {
			return 1;
		}
		if (x === y) {
			continue;
		}
		if (typeof x === "number" && typeof y === "number") {
			return x - y;
		}
		if (typeof x === "number") {
			return -1;
		}
		if (typeof y === "number") {
			return 1;
		}
		return x < y ? -1 : 1;
	}
	return 0;
}

export function isNewerVersion(current: string, latest: string): boolean {
	return compareSemver(current, latest) < 0;
}

interface GithubRelease {
	tag_name: string;
	html_url: string;
	prerelease: boolean;
	draft: boolean;
}

async function fetchLatestStable(): Promise<GithubRelease | null> {
	const response = await fetch(`${RELEASES_URL}/latest`, {
		headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "Penombre",
		},
		signal: AbortSignal.timeout(5000),
	});
	if (!response.ok) {
		logger.warn(`GitHub API returned ${response.status}`);
		return null;
	}
	return (await response.json()) as GithubRelease;
}

/** The single newest release or prerelease, whichever has higher precedence. */
async function fetchNewestCanary(): Promise<GithubRelease | null> {
	const response = await fetch(`${RELEASES_URL}?per_page=${CANARY_LOOKBACK}`, {
		headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "Penombre",
		},
		signal: AbortSignal.timeout(5000),
	});
	if (!response.ok) {
		logger.warn(`GitHub API returned ${response.status}`);
		return null;
	}
	const releases = (await response.json()) as GithubRelease[];
	let newest: GithubRelease | null = null;
	for (const release of releases) {
		if (release.draft) {
			continue;
		}
		if (!newest || compareSemver(newest.tag_name, release.tag_name) < 0) {
			newest = release;
		}
	}
	return newest;
}

export async function checkForUpdate(): Promise<VersionCheckResult> {
	const config = getConfig();
	const currentVersion = config.appVersion;
	const settings = await getAppSettings().catch(() => undefined);
	const channel = await effectiveReleaseChannel(settings);
	const enabled = await isVersionCheckEnabled(settings);

	if (!enabled) {
		return {
			currentVersion,
			latestVersion: null,
			updateAvailable: false,
			releaseUrl: null,
			enabled: false,
			channel,
		};
	}

	const cached = cache.get(channel);
	if (cached && Date.now() - cached.fetchedAt < cached.ttl) {
		return { ...cached.data, currentVersion };
	}

	try {
		const release =
			channel === "canary"
				? await fetchNewestCanary()
				: await fetchLatestStable();

		if (!release) {
			const result: VersionCheckResult = {
				currentVersion,
				latestVersion: null,
				updateAvailable: false,
				releaseUrl: null,
				enabled: true,
				channel,
			};
			cache.set(channel, {
				data: result,
				fetchedAt: Date.now(),
				ttl: FAILURE_CACHE_TTL_MS,
			});
			return result;
		}

		const latestVersion = normalizeVersion(release.tag_name);
		const updateAvailable =
			currentVersion !== "development" &&
			isNewerVersion(currentVersion, latestVersion);

		const result: VersionCheckResult = {
			currentVersion,
			latestVersion,
			updateAvailable,
			releaseUrl: release.html_url,
			enabled: true,
			channel,
		};

		cache.set(channel, {
			data: result,
			fetchedAt: Date.now(),
			ttl: CACHE_TTL_MS,
		});
		return result;
	} catch (error) {
		logger.warn("Failed to check for updates", error);
		const result: VersionCheckResult = {
			currentVersion,
			latestVersion: null,
			updateAvailable: false,
			releaseUrl: null,
			enabled: true,
			channel,
		};
		cache.set(channel, {
			data: result,
			fetchedAt: Date.now(),
			ttl: FAILURE_CACHE_TTL_MS,
		});
		return result;
	}
}
