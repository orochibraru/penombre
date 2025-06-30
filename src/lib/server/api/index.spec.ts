import { router } from '$lib/server/api';
import { treaty } from '@elysiajs/eden';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setup, teardown } from '../../../../tests/setup';

const api = treaty(router);

describe('/api', () => {
	beforeAll(async () => {
		if (!process.env.CI) {
			await setup();
		}
	});

	afterAll(async () => {
		if (!process.env.CI) {
			await teardown();
		}
	});

	it('/v1/ping', async () => {
		const { data, error } = await api.api.v1.ping.get();

		expect(error).toBeNull();

		expect(data).toBe('PONG!');
	});

	it('/v1/files requires auth', async () => {
		const { error } = await api.api.v1.files.get();

		expect(error).toBeTruthy();
	});
});
