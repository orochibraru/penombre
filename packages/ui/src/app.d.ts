import type { Logger } from "$lib/logger";
import type { AuthType } from "$lib/server/auth";
// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			error: string;
			errorId: string;
			errorStackTrace: string;
			message: unknown;
			userAgent: string;
			user: AuthType["user"];
			session: AuthType["session"];
			logger: Logger;
			isAdmin: boolean;
			authCookie: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Error {
			code?: string;
			errorId?: string;
		}
	}
}

declare module "svelte/elements" {
	interface HTMLAttributes {
		ontap?: (event: CustomEvent<null>) => void;
		onlongpress?: (event: CustomEvent<null>) => void;
	}
}
