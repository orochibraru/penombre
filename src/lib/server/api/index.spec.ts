import { router } from '$lib/server/api';
import { treaty } from '@elysiajs/eden';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setup, teardown } from '../../../../tests/setup';

const api = treaty(router);

describe('/api', () => {
	beforeAll(async () => {
		if (!process.env.CI) {
			console.debug('Running in CI');
			await setup();
		}
	});

	afterAll(async () => {
		if (!process.env.CI) {
			console.debug('Running in CI');
			await teardown();
		}
	});

	it('/v1/ping', async () => {
		const { data, error } = await api.api.v1.ping.get();

		expect(error).toBeNull();

		expect(data).toBe('PONG!');
	});

	it('/v1/storage/objects requires auth', async () => {
		const { error } = await api.api.v1.storage.objects.get({ query: {} });

		expect(error).toBeTruthy();
	});
});
