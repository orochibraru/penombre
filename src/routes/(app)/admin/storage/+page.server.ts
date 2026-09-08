import { StorageService } from "$lib/server/services/storage";

export const load = async () => ({
	storageSize: StorageService.getAvailableStorageSize(),
});
