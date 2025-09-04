import { a as n, b as t, c as o } from './BzLloq76.js';
async function u(a) {
	try {
		const {
			data: r,
			error: e,
			response: s
		} = await n.GET('/api/v1/storage/objects', { params: { query: { folder: a } } });
		return e ? t(s.status, e.error) : o(r);
	} catch (r) {
		return t(500, 'API seems unreachable', r);
	}
}
async function i() {
	try {
		const { data: a, error: r, response: e } = await n.GET('/api/v1/storage/objects/recent');
		return r ? t(e.status, r.error) : o(a);
	} catch (a) {
		return t(500, 'API seems unreachable', a);
	}
}
async function p(a) {
	try {
		const {
			data: r,
			error: e,
			response: s
		} = await n.GET('/api/v1/storage/objects/category/{category}', {
			params: { path: { category: a } }
		});
		return e ? t(s.status, e.error) : o(r);
	} catch (r) {
		return t(500, 'API seems unreachable', r);
	}
}
async function l(a) {
	try {
		const { data: r, error: e, response: s } = await n.POST('/api/v1/storage/objects', { body: a });
		return e ? t(s.status, e.error) : o(r);
	} catch (r) {
		return t(500, 'API seems unreachable', r);
	}
}
export { p as a, i as b, u as l, l as u };
