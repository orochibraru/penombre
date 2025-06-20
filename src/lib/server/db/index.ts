import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from '$lib/server/db/schema/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(env.DATABASE_URL);

if (!env.DATABASE_URL) {
	if (!building) {
		throw new Error('Missing database url');
	}
}

export const db = drizzle(client, { schema });
