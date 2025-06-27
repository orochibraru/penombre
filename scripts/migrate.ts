import { migrateDb } from './migrate-lib';

void migrateDb().then(() => {
	console.log('Database migrated.');
	process.exit(0);
});
