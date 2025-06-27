import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { migrateDb } from './scripts/migrate';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let postgresContainer: StartedTestContainer;
let minioContainer: StartedTestContainer;

export async function setup() {
	try {
		console.debug('Starting postgres container..');
		postgresContainer = await new PostgreSqlContainer('postgres:17')
			.withExposedPorts(5173)
			.withDatabase('opendrive')
			.withUsername('postgres')
			.withPassword('postgres')
			.start();
	} catch (e) {
		console.error(e);
		throw e;
	}

	// // Migrate DB
	// try {
	//     await migrateDb()
	// }
	// catch (e) {
	//     console.error("Failed to migrate db")
	//     console.error(e)
	//     throw e;
	// }

	try {
		console.debug('Starting minio container..');
		minioContainer = await new GenericContainer('minio/minio')
			.withExposedPorts(9000)
			.withEnvironment({
				MINIO_ROOT_USER: 'opendrive',
				MINIO_ROOT_PASSWORD: 'opendrive'
			})
			.start();
	} catch (e) {
		console.error(e);
		throw e;
	}

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
