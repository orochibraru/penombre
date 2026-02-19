import { StorageService } from "$lib/server/services/storage";

export const load = async () => {
	return {
		storageSize: StorageService.getAvailableStorageSize(),
	};
};
