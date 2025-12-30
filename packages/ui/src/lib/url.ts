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
	const fullPath = page.params.path
		? `${page.params.path}/${itemPath}`
		: itemPath;

	const finalBaseUrl = buildOriginUrl(baseUrl).toString();

	const finalUrl = `${finalBaseUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${raw ? "?raw=true" : ""}`;
	return finalUrl;
}
