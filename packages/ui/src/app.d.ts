import type { Logger } from '$lib/logger';
// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '$lib/api';

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
			user: User;
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

declare module 'svelte/elements' {
	interface HTMLAttributes {
		ontap?: (event: CustomEvent<null>) => void;
		onlongpress?: (event: CustomEvent<null>) => void;
	}
}
