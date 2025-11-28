import { page } from "$app/state";

type ObjectUrlProps = {
	baseUrl: string;
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

	const finalUrl = `${baseUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${raw ? "?raw=true" : ""}`;
	return finalUrl;
}
