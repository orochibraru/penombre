// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from 'better-auth';
import { Logger } from '$lib/logger';

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
