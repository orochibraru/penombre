import { StatsService } from "$lib/server/services/stats";
import { StorageService } from "$lib/server/services/storage";

const stats = new StatsService();

export const load = async () => ({
	storagePath: StorageService.getAdminStoragePath(),
	stats: await stats.forInstance(),
});
