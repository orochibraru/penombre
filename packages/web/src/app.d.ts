import type { Logger } from "$lib/logger";
import type { AuthType } from "$lib/server/auth";
import type { StorageService } from "$lib/server/services/storage";
import type { HTMLAnchorAttributes } from "svelte/elements";
import type { Pathname } from "$app/types";

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
			storageService: StorageService;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Error {
			code?: string;
			errorId?: string;
		}
	}

	namespace svelteHTML {
		interface HTMLAttributes<T> {
			ontap?: (event: CustomEvent<null>) => void;
			onlongpress?: (event: CustomEvent<null>) => void;
		}

		interface IntrinsicElements {
			a: Omit<HTMLAnchorAttributes, "href"> & {
				// The (string & {}) trick prevents 'string' from collapsing the union,
				// preserving Intellisense for your Pathnames.
				href?: Pathname | (string & {}) | null;
			};
		}
	}
}
