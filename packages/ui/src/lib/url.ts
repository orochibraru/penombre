import { page } from "$app/state";
import { buildOriginUrl } from "$lib/utils";

type ObjectUrlProps = {
	baseUrl: URL;
	itemPath: string;
	raw?: boolean;
};

export function getObjectUrl({
	baseUrl,
	itemPath,
	raw,
}: ObjectUrlProps): string {
	console.log(
		"Generating object URL for itemPath:",
		itemPath,
		"with raw:",
		raw,
	);
	const fullPath = page.params.path
		? `${page.params.path}/${itemPath}`
		: itemPath;

	const finalBaseUrl = buildOriginUrl(baseUrl).toString();

	// Strip trailing slash if present
	const normalizedBaseUrl = finalBaseUrl.endsWith("/")
		? finalBaseUrl.slice(0, -1)
		: finalBaseUrl;

	const finalUrl = `${normalizedBaseUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${raw ? "?raw=true" : ""}`;
	return finalUrl;
}
