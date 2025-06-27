import {
	DockerComposeEnvironment,
	type StartedDockerComposeEnvironment,
	Wait
} from 'testcontainers';
import { migrateDb } from './scripts/migrate-lib';

let environment: StartedDockerComposeEnvironment;

export async function setup() {
	const composeFilePath = './';
	const composeFile = 'compose.test.yaml';
	console.log('Starting containers');
	environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
		.withWaitStrategy('postgres-1', Wait.forHealthCheck())
		.up();

	// Migrate DB
	await migrateDb();
}

export async function teardown() {
	console.log('Killing containers');

	await environment.down({ removeVolumes: true });
}
