import { a as s, b as a, c as n } from './BzLloq76.js';
async function u() {
	try {
		const { data: r, error: e, response: t } = await s.GET('/api/v1/auth/oauth/providers');
		return e ? a(t.status, e.error) : n(r);
	} catch (r) {
		return a(500, 'API seems unreachable', r);
	}
}
async function i() {
	try {
		const { data: r, error: e, response: t } = await s.GET('/api/v1/auth/me');
		return e
			? a(t.status, e.error)
			: r
				? n(r)
				: a(500, 'No user or session retrieved from auth me endpoint');
	} catch (r) {
		return a(500, 'API seems unreachable', r);
	}
}
export { i as a, u as g };
