import { Http } from "$lib/server/http";
import { bulkMove } from "$lib/server/openapi/v1/storage";

export const POST = bulkMove.handler(async ({ body, service }) => {
	const results: { path: string; success: boolean; error?: string }[] = [];

	for (const item of body.items) {
		try {
			if (item.type === "folder") {
				const folderPath = item.path.replace(/\/$/, "");
				await service.moveFolder(folderPath, body.destination);
			} else {
				await service.moveFile(item.path, body.destination);
			}
			results.push({ path: item.path, success: true });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			results.push({ path: item.path, success: false, error: message });
		}
	}

	const successCount = results.filter((r) => r.success).length;
	const failCount = results.filter((r) => !r.success).length;

	return Http.Ok({
		message: `Moved ${successCount} of ${body.items.length} items`,
		results,
		successCount,
		failCount,
	});
});
