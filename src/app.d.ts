// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from 'better-auth';
import type NodeCache from 'node-cache';
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
			cache: NodeCache;
			user: User;
			logger: Logger;
			cacheBypass: boolean;
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
