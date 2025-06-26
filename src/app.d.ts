// See https://svelte.dev/docs/kit/types#app.d.ts
import type { StorageService } from '$lib/server/services/storage';
import type { User } from 'better-auth';
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
			user: User;
			storage: StorageService;
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
