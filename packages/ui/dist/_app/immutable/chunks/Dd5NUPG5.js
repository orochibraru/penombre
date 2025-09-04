const s = {
		'/': '/',
		'/account': '/account',
		'/browse': '/browse',
		'/browse/[...path]': (t) => `/browse/${t.path?.join('/')}`,
		'/categories/[category]': (t) => `/categories/${t.category}`,
		'/recent': '/recent',
		'/settings': '/settings',
		'/shared': '/shared',
		'/starred': '/starred',
		'/sync': '/sync',
		'/trash': '/trash',
		'/auth/callback': '/auth/callback',
		'/auth/error': '/auth/error',
		'/auth/sign-in': '/auth/sign-in',
		'/error': '/error'
	},
	a = {},
	c = {},
	o = {},
	r = { ...s, ...c, ...a, ...o };
[...new Set(Object.keys(r).map((t) => /^\/.*|[^ ]?\/.*$/.exec(t)?.[0] ?? t))];
function u(t, ...e) {
	if (r[t] instanceof Function) {
		const n = r[t];
		return n(...e);
	} else return r[t];
}
export { u as r };
