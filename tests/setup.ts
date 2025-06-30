import {
	DockerComposeEnvironment,
	Wait,
	type StartedDockerComposeEnvironment
} from 'testcontainers';
import { migrateDb } from '../scripts/migrate-lib';

let environment: StartedDockerComposeEnvironment;

export async function setup() {
	const composeFilePath = './';
	const composeFile = 'compose.yaml';
	console.log('Starting containers');
	environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
		.withWaitStrategy('db-1', Wait.forHealthCheck())
		.withWaitStrategy('minio-1', Wait.forHealthCheck())
		.up();

	const db = environment.getContainer('db-1');
	const minio = environment.getContainer('minio-1');

	console.debug('DB Port', db.getFirstMappedPort());
	console.debug('Minio Port', minio.getFirstMappedPort());

	const dbLogs = await db.logs();
	const minioLogs = await minio.logs();

	minioLogs.on('data', (data) => {
		console.debug(data);
	});

	dbLogs.on('data', (data) => {
		console.debug(data);
	});

	// Migrate DB
	await migrateDb();
}

export async function teardown() {
	console.log('Killing containers');

	await environment.down({ removeVolumes: true });
}
