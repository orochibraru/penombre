import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export async function migrateDb() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		throw new Error('Missing DATABASE_URL');
	}
	console.log('Initializing drizzle on', dbUrl);
	const db = drizzle(dbUrl);

	console.log('Migrating database...');
	try {
		await migrate(db, {
			migrationsFolder: 'drizzle/'
		});
	} catch (e) {
		const err = e as Error;
		console.error('Failed to migrate database', err.message);
		throw e;
	}
}
