/**
 * E2E seed script - run via Bun to seed the database before Playwright tests
 * This is executed by global.setup.ts as a subprocess with test.setup.ts preloaded
 */
import { seedAuth } from "$lib/server/auth/seed";

async function main() {
	console.log("Seeding database for E2E tests...");
	await seedAuth();
	console.log("E2E database seeding complete.");
}

main().catch((err) => {
	console.error("E2E seed failed:", err);
	process.exit(1);
});
