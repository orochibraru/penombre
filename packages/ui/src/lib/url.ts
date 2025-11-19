import { page } from "$app/state";
import { apiUrl } from "$lib/api";

export function getObjectUrl(itemPath: string, raw?: boolean): string {
	const fullPath = page.params.path
		? `${page.params.path}/${itemPath}`
		: itemPath;

	const finalUrl = `${apiUrl}/api/storage/objects/item/${encodeURIComponent(fullPath)}${raw ? "?raw=true" : ""}`;
	return finalUrl;
}
