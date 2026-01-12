import { page } from "$app/state";
import { buildOriginUrl } from "$lib/utils";

type ObjectUrlProps = {
	baseUrl: URL;
	itemPath: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: number;
};

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
	if (raw) params.set("raw", "true");
	if (thumbnail) params.set("thumbnail", "true");
	if (size) params.set("size", size.toString());

	const queryString = params.toString();
	const finalUrl = `${normalizedBaseUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${queryString ? `?${queryString}` : ""}`;
	return finalUrl;
}
