import { dev } from "$app/environment";
import { page } from "$app/state";

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

	const finalBaseUrl = dev ? "http://localhost:8080" : baseUrl.origin;

	const finalUrl = `${finalBaseUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${raw ? "?raw=true" : ""}`;
	return finalUrl;
}
