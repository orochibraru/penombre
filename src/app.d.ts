// See https://svelte.dev/docs/kit/types#app.d.ts

import type { AuthService } from '$lib/auth';
import type { User } from '$lib/auth-utils';
import type NodeCache from 'node-cache';

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
			bearerToken: string;
			cache: NodeCache;
			cacheBypass: boolean;
			isAdmin: boolean;
			impersonating: boolean;
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
