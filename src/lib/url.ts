import type { paths } from "#lib/api/index.js";
import { locationOf } from "#lib/storage-location.js";
import { buildOriginUrl } from "#lib/utils.js";
import { page, type ReadonlyURL } from "$app/state";

/**
 * Typed API path template – changing this string will produce a compile error
 * if it no longer exists in `paths`, preventing phantom 404s.
 */
const FILE_PATH_TEMPLATE: keyof paths = "/api/v1/storage/file/{id}";

/**
 * The API takes named thumbnail sizes, not pixels: three discrete values keep
 * the on-disk thumbnail cache bounded, where an arbitrary pixel count would
 * let any caller generate unlimited variants.
 */
export type ThumbnailSize = "small" | "medium" | "large";

interface ObjectUrlProps {
	baseUrl: ReadonlyURL;
	itemPath: string;
	/**
	 * Addresses the file by row id instead of `itemPath`. A listing key is only
	 * the last path segment, so a view with no folder in its URL (categories,
	 * starred, search) cannot build the path from it.
	 */
	fileId?: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: ThumbnailSize;
}

export function getObjectUrl({
	baseUrl,
	itemPath,
	fileId,
	raw,
	thumbnail,
	size,
}: ObjectUrlProps): string {
	const fullPath =
		fileId ?? (page.params.path ? `${page.params.path}/${itemPath}` : itemPath);

	const finalBaseUrl = buildOriginUrl(baseUrl).toString();

	// Strip trailing slash if present
	const normalizedBaseUrl = finalBaseUrl.endsWith("/")
		? finalBaseUrl.slice(0, -1)
		: finalBaseUrl;

	const params = new URLSearchParams();
	// A media element's `src` never passes through the API client, so where
	// the page is has to be spelled out here.
	const { drive, volume, share } = locationOf(page.params);
	if (drive) {
		params.set("drive", drive);
	} else if (volume) {
		params.set("volume", volume);
	} else if (share) {
		params.set("share", share);
	}
	if (raw) {
		params.set("raw", "true");
	}
	if (thumbnail) {
		params.set("thumbnail", "true");
	}
	if (size) {
		params.set("size", size);
	}

	const queryString = params.toString();
	const resolvedPath = FILE_PATH_TEMPLATE.replace(
		"{id}",
		encodeURIComponent(fullPath),
	);
	const finalUrl = `${normalizedBaseUrl}${resolvedPath}${queryString ? `?${queryString}` : ""}`;
	return finalUrl;
}
