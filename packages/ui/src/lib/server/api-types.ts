import type { auth } from "$lib/server/auth";

export type CustomRouter = {
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
};

export type { AppType } from "$lib/server/api";
