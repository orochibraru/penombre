import { StatsService } from "#lib/server/services/stats.js";
import { StorageService } from "#lib/server/services/storage/index.js";

const stats = new StatsService();

export const load = async () => ({
	storagePath: StorageService.getAdminStoragePath(),
	stats: await stats.forInstance(),
});
