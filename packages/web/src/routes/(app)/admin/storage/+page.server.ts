import { AdminStorageService } from "$lib/server/dto/storage";

export const load = async () => {
	return {
		storageSize: new AdminStorageService().getAvailableStorageSize(),
	};
};
