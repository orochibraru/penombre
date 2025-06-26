import { router } from '$lib/server/api';
import { treaty } from '@elysiajs/eden';
import { describe, expect, it } from 'vitest';

const api = treaty(router);

describe('Elysia', () => {
	it('returns a response', async () => {
		const { data, error } = await api.api.v1.ping.get();

		expect(error).toBeNull();

		expect(data).toBe('PONG!');
	});
});
