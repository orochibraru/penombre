import { migrateDb } from './migrate-lib';
import process from 'node:process';

void migrateDb().then(() => {
	console.log('Database migrated.');
	process.exit(0);
});
