import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from '$lib/server/db/schema/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const dbUrl = env.DATABASE_URL;

if (!dbUrl) {
	if (!building) {
		throw new Error('Missing database url');
	}
}

const client = postgres(dbUrl);

export const db = drizzle(client, { schema });
