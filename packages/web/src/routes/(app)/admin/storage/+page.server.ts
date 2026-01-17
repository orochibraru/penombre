import { AdminStorageService } from "$lib/server/services/storage";

export const load = async () => {
	return {
		storageSize: new AdminStorageService().getAvailableStorageSize(),
	};
};
