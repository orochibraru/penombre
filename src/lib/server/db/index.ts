import { env } from '$env/dynamic/private';
import * as schema from '$lib/server/db/schema/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const dbUrl = env.DATABASE_URL ?? 'postgres://postgres:postgres@0.0.0.0:5432/opendrive';

const client = postgres(dbUrl);

export const db = drizzle(client, { schema });
