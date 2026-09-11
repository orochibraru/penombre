import { page } from "$app/state";
import type { paths } from "$lib/api";
import { buildOriginUrl } from "$lib/utils";

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
	baseUrl: URL;
	itemPath: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: ThumbnailSize;
}

export function getObjectUrl({
	baseUrl,
	itemPath,
	raw,
	thumbnail,
	size,
}: ObjectUrlProps): string {
	const fullPath = page.params.path
		? `${page.params.path}/${itemPath}`
		: itemPath;

	const finalBaseUrl = buildOriginUrl(baseUrl).toString();

	// Strip trailing slash if present
	const normalizedBaseUrl = finalBaseUrl.endsWith("/")
		? finalBaseUrl.slice(0, -1)
		: finalBaseUrl;

	const params = new URLSearchParams();
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
