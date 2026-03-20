import { Logger } from "$lib/logger";
import { getPenombreConfig } from "$lib/server/config";

const logger = new Logger("VERSION_CHECK");

const GITHUB_RELEASES_URL =
	"https://api.github.com/repos/orochibraru/penombre/releases/latest";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface VersionCheckResult {
	currentVersion: string;
	latestVersion: string | null;
	updateAvailable: boolean;
	releaseUrl: string | null;
}

interface CachedResult {
	data: VersionCheckResult;
	fetchedAt: number;
}

let cache: CachedResult | null = null;

function normalizeVersion(version: string): string {
	return version.replace(/^v/, "");
}

function isNewerVersion(current: string, latest: string): boolean {
	const currentParts = normalizeVersion(current).split(".").map(Number);
	const latestParts = normalizeVersion(latest).split(".").map(Number);

	for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
		const c = currentParts[i] ?? 0;
		const l = latestParts[i] ?? 0;
		if (l > c) return true;
		if (l < c) return false;
	}
	return false;
}

export async function checkForUpdate(): Promise<VersionCheckResult> {
	const config = getPenombreConfig();
	const currentVersion = config.appVersion;
	logger.debug(`Current app version: ${currentVersion}`);

	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
		logger.debug("Returning cached version check result", {
			currentVersion,
			latestVersion: cache.data.latestVersion,
			updateAvailable: cache.data.updateAvailable,
		});
		return { ...cache.data, currentVersion };
	}

	logger.debug("Fetching latest release from GitHub");

	try {
		const response = await fetch(GITHUB_RELEASES_URL, {
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "Penombre",
			},
			signal: AbortSignal.timeout(5000),
		});

		if (!response.ok) {
			logger.warn(`GitHub API returned ${response.status}`);
			return {
				currentVersion,
				latestVersion: null,
				updateAvailable: false,
				releaseUrl: null,
			};
		}

		const release = (await response.json()) as {
			tag_name: string;
			html_url: string;
		};
		const latestVersion = normalizeVersion(release.tag_name);
		const updateAvailable =
			currentVersion !== "development" &&
			isNewerVersion(currentVersion, latestVersion);

		logger.debug(
			`Current: ${currentVersion}, Latest: ${latestVersion}, Update available: ${updateAvailable}`,
		);

		const result: VersionCheckResult = {
			currentVersion,
			latestVersion,
			updateAvailable,
			releaseUrl: release.html_url,
		};

		cache = { data: result, fetchedAt: Date.now() };
		return result;
	} catch (error) {
		logger.warn("Failed to check for updates", error);
		return {
			currentVersion,
			latestVersion: null,
			updateAvailable: false,
			releaseUrl: null,
		};
	}
}
