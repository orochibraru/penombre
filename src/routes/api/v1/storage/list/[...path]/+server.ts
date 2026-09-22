import { Logger } from "#lib/logger.js";
import { Http } from "#lib/server/http.js";
import { listFilesInFolder } from "#lib/server/openapi/v1/storage.js";
import { pageOptions } from "#lib/server/services/storage/listings.js";

const logger = new Logger("Storage List API");

/** Every ancestor's own path, root first: "a/b/c" -> ["a", "a/b", "a/b/c"]. */
function ancestorChain(path: string): string[] {
	const segments = path.split("/");
	return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}

export const GET = listFilesInFolder.handler(
	async ({ params, query, service }) => {
		logger.debug(`Listing files in: ${params.path}`);
		try {
			const data = await service.listFolderPage(
				params.path,
				pageOptions(query),
			);
			// One request instead of one per breadcrumb segment: `getFolderMeta`
			// is already scoped by the service's own owner/volume, so this stays
			// correct for a shared drive or a mounted volume too.
			const ancestorNames = await Promise.all(
				ancestorChain(params.path).map(
					async (path) => (await service.getFolderMeta(path))?.name ?? null,
				),
			);
			return Http.Ok({ ...data, ancestorNames });
		} catch (error) {
			return Http.ServerError("Failed to list items in folder", error);
		}
	},
);
