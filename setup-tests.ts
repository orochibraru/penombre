import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { migrateDb } from './scripts/migrate-lib';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let postgresContainer: StartedPostgreSqlContainer;
let minioContainer: StartedTestContainer;

export async function setup() {
	console.debug('Starting postgres container..');
	postgresContainer = await new PostgreSqlContainer('postgres:17')
		.withExposedPorts(5173)
		.withDatabase('opendrive')
		.withUsername('postgres')
		.withPassword('postgres')
		.start();

	console.debug(postgresContainer.getConnectionUri());

	// Migrate DB
	await migrateDb();

	console.debug('Starting minio container..');
	minioContainer = await new GenericContainer('minio/minio')
		.withExposedPorts(9000)
		.withEnvironment({
			MINIO_ROOT_USER: 'opendrive',
			MINIO_ROOT_PASSWORD: 'opendrive'
		})
		.start();

	console.debug(minioContainer.getName());
	console.debug(postgresContainer.getName());
}

export async function teardown() {
	if (minioContainer) {
		console.debug('Stopping minio container..');
		await minioContainer.stop();
	}

	if (postgresContainer) {
		console.debug('Stopping postgres container..');
		await postgresContainer.stop();
	}
}
