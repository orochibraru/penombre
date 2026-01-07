import type { auth } from "$lib/server/auth";
import type { StorageService } from "$lib/server/dto/storage";

export type CustomRouter = {
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
};

export type StorageRouter = CustomRouter & {
	Variables: {
		storageService: StorageService;
	};
};

export type { AppType } from "$lib/server/api";
