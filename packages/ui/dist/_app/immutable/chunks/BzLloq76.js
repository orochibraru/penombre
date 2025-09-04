import { a as Q } from './BLduGpSf.js';
const G = /\{[^{}]+\}/g,
	J = () =>
		typeof process == 'object' &&
		Number.parseInt(process?.versions?.node?.substring(0, 2)) >= 18 &&
		process.versions.undici;
function _() {
	return Math.random().toString(36).slice(2, 11);
}
function X(r) {
	let {
		baseUrl: e = '',
		Request: t = globalThis.Request,
		fetch: o = globalThis.fetch,
		querySerializer: n,
		bodySerializer: i,
		headers: l,
		requestInitExt: c = void 0,
		...N
	} = { ...r };
	((c = J() ? c : void 0), (e = D(e)));
	const p = [];
	async function y(a, s) {
		const {
			baseUrl: m,
			fetch: z = o,
			Request: te = t,
			headers: C,
			params: w = {},
			parseAs: A = 'json',
			querySerializer: g,
			bodySerializer: O = i ?? K,
			body: I,
			...$
		} = s || {};
		let v = e;
		m && (v = D(m) ?? e);
		let q = typeof n == 'function' ? n : H(n);
		g && (q = typeof g == 'function' ? g : H({ ...(typeof n == 'object' ? n : {}), ...g }));
		const x = I === void 0 ? void 0 : O(I, k(l, C, w.header)),
			B = k(
				x === void 0 || x instanceof FormData ? {} : { 'Content-Type': 'application/json' },
				l,
				C,
				w.header
			),
			W = { redirect: 'follow', ...N, ...$, body: x, headers: B };
		let j,
			E,
			h = new t(V(a, { baseUrl: v, params: w, querySerializer: q }), W),
			f;
		for (const d in $) d in h || (h[d] = $[d]);
		if (p.length) {
			((j = _()),
				(E = Object.freeze({
					baseUrl: v,
					fetch: z,
					parseAs: A,
					querySerializer: q,
					bodySerializer: O
				})));
			for (const d of p)
				if (d && typeof d == 'object' && typeof d.onRequest == 'function') {
					const u = await d.onRequest({ request: h, schemaPath: a, params: w, options: E, id: j });
					if (u)
						if (u instanceof t) h = u;
						else if (u instanceof Response) {
							f = u;
							break;
						} else
							throw new Error(
								'onRequest: must return new Request() or Response() when modifying the request'
							);
				}
		}
		if (!f) {
			try {
				f = await z(h, c);
			} catch (d) {
				let u = d;
				if (p.length)
					for (let b = p.length - 1; b >= 0; b--) {
						const T = p[b];
						if (T && typeof T == 'object' && typeof T.onError == 'function') {
							const R = await T.onError({
								request: h,
								error: u,
								schemaPath: a,
								params: w,
								options: E,
								id: j
							});
							if (R) {
								if (R instanceof Response) {
									((u = void 0), (f = R));
									break;
								}
								if (R instanceof Error) {
									u = R;
									continue;
								}
								throw new Error('onError: must return new Response() or instance of Error');
							}
						}
					}
				if (u) throw u;
			}
			if (p.length)
				for (let d = p.length - 1; d >= 0; d--) {
					const u = p[d];
					if (u && typeof u == 'object' && typeof u.onResponse == 'function') {
						const b = await u.onResponse({
							request: h,
							response: f,
							schemaPath: a,
							params: w,
							options: E,
							id: j
						});
						if (b) {
							if (!(b instanceof Response))
								throw new Error(
									'onResponse: must return new Response() when modifying the response'
								);
							f = b;
						}
					}
				}
		}
		if (f.status === 204 || h.method === 'HEAD' || f.headers.get('Content-Length') === '0')
			return f.ok ? { data: void 0, response: f } : { error: void 0, response: f };
		if (f.ok)
			return A === 'stream' ? { data: f.body, response: f } : { data: await f[A](), response: f };
		let U = await f.text();
		try {
			U = JSON.parse(U);
		} catch {}
		return { error: U, response: f };
	}
	return {
		request(a, s, m) {
			return y(s, { ...m, method: a.toUpperCase() });
		},
		GET(a, s) {
			return y(a, { ...s, method: 'GET' });
		},
		PUT(a, s) {
			return y(a, { ...s, method: 'PUT' });
		},
		POST(a, s) {
			return y(a, { ...s, method: 'POST' });
		},
		DELETE(a, s) {
			return y(a, { ...s, method: 'DELETE' });
		},
		OPTIONS(a, s) {
			return y(a, { ...s, method: 'OPTIONS' });
		},
		HEAD(a, s) {
			return y(a, { ...s, method: 'HEAD' });
		},
		PATCH(a, s) {
			return y(a, { ...s, method: 'PATCH' });
		},
		TRACE(a, s) {
			return y(a, { ...s, method: 'TRACE' });
		},
		use(...a) {
			for (const s of a)
				if (s) {
					if (typeof s != 'object' || !('onRequest' in s || 'onResponse' in s || 'onError' in s))
						throw new Error(
							'Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`'
						);
					p.push(s);
				}
		},
		eject(...a) {
			for (const s of a) {
				const m = p.indexOf(s);
				m !== -1 && p.splice(m, 1);
			}
		}
	};
}
function S(r, e, t) {
	if (e == null) return '';
	if (typeof e == 'object')
		throw new Error(
			'Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.'
		);
	return `${r}=${t?.allowReserved === !0 ? e : encodeURIComponent(e)}`;
}
function F(r, e, t) {
	if (!e || typeof e != 'object') return '';
	const o = [],
		n = { simple: ',', label: '.', matrix: ';' }[t.style] || '&';
	if (t.style !== 'deepObject' && t.explode === !1) {
		for (const c in e) o.push(c, t.allowReserved === !0 ? e[c] : encodeURIComponent(e[c]));
		const l = o.join(',');
		switch (t.style) {
			case 'form':
				return `${r}=${l}`;
			case 'label':
				return `.${l}`;
			case 'matrix':
				return `;${r}=${l}`;
			default:
				return l;
		}
	}
	for (const l in e) {
		const c = t.style === 'deepObject' ? `${r}[${l}]` : l;
		o.push(S(c, e[l], t));
	}
	const i = o.join(n);
	return t.style === 'label' || t.style === 'matrix' ? `${n}${i}` : i;
}
function L(r, e, t) {
	if (!Array.isArray(e)) return '';
	if (t.explode === !1) {
		const i = { form: ',', spaceDelimited: '%20', pipeDelimited: '|' }[t.style] || ',',
			l = (t.allowReserved === !0 ? e : e.map((c) => encodeURIComponent(c))).join(i);
		switch (t.style) {
			case 'simple':
				return l;
			case 'label':
				return `.${l}`;
			case 'matrix':
				return `;${r}=${l}`;
			default:
				return `${r}=${l}`;
		}
	}
	const o = { simple: ',', label: '.', matrix: ';' }[t.style] || '&',
		n = [];
	for (const i of e)
		t.style === 'simple' || t.style === 'label'
			? n.push(t.allowReserved === !0 ? i : encodeURIComponent(i))
			: n.push(S(r, i, t));
	return t.style === 'label' || t.style === 'matrix' ? `${o}${n.join(o)}` : n.join(o);
}
function H(r) {
	return function (t) {
		const o = [];
		if (t && typeof t == 'object')
			for (const n in t) {
				const i = t[n];
				if (i != null) {
					if (Array.isArray(i)) {
						if (i.length === 0) continue;
						o.push(
							L(n, i, {
								style: 'form',
								explode: !0,
								...r?.array,
								allowReserved: r?.allowReserved || !1
							})
						);
						continue;
					}
					if (typeof i == 'object') {
						o.push(
							F(n, i, {
								style: 'deepObject',
								explode: !0,
								...r?.object,
								allowReserved: r?.allowReserved || !1
							})
						);
						continue;
					}
					o.push(S(n, i, r));
				}
			}
		return o.join('&');
	};
}
function Y(r, e) {
	let t = r;
	for (const o of r.match(G) ?? []) {
		let n = o.substring(1, o.length - 1),
			i = !1,
			l = 'simple';
		if (
			(n.endsWith('*') && ((i = !0), (n = n.substring(0, n.length - 1))),
			n.startsWith('.')
				? ((l = 'label'), (n = n.substring(1)))
				: n.startsWith(';') && ((l = 'matrix'), (n = n.substring(1))),
			!e || e[n] === void 0 || e[n] === null)
		)
			continue;
		const c = e[n];
		if (Array.isArray(c)) {
			t = t.replace(o, L(n, c, { style: l, explode: i }));
			continue;
		}
		if (typeof c == 'object') {
			t = t.replace(o, F(n, c, { style: l, explode: i }));
			continue;
		}
		if (l === 'matrix') {
			t = t.replace(o, `;${S(n, c)}`);
			continue;
		}
		t = t.replace(o, l === 'label' ? `.${encodeURIComponent(c)}` : encodeURIComponent(c));
	}
	return t;
}
function K(r, e) {
	return r instanceof FormData
		? r
		: e &&
			  (e.get instanceof Function
					? (e.get('Content-Type') ?? e.get('content-type'))
					: (e['Content-Type'] ?? e['content-type'])) === 'application/x-www-form-urlencoded'
			? new URLSearchParams(r).toString()
			: JSON.stringify(r);
}
function V(r, e) {
	let t = `${e.baseUrl}${r}`;
	e.params?.path && (t = Y(t, e.params.path));
	let o = e.querySerializer(e.params.query ?? {});
	return (o.startsWith('?') && (o = o.substring(1)), o && (t += `?${o}`), t);
}
function k(...r) {
	const e = new Headers();
	for (const t of r) {
		if (!t || typeof t != 'object') continue;
		const o = t instanceof Headers ? t.entries() : Object.entries(t);
		for (const [n, i] of o)
			if (i === null) e.delete(n);
			else if (Array.isArray(i)) for (const l of i) e.append(n, l);
			else i !== void 0 && e.set(n, i);
	}
	return e;
}
function D(r) {
	return r.endsWith('/') ? r.substring(0, r.length - 1) : r;
}
const M = X();
function Z(r) {
	return new Promise((e) => setTimeout(e, r));
}
const ee = {
	async onRequest({ request: r }) {
		for (; !1; ) await Z(100);
		const e = Q();
		return (e && r.headers.set('X-CSRF-Token', e), r);
	}
};
M.use(ee);
const ne = M,
	P = 'An unexpected error occured.';
function oe(r, e = P, t) {
	let o = e;
	return (
		r >= 401 && r <= 403 && e === P && (o = "You don't have access."),
		console.error('API Error', { code: r, message: e, details: t }),
		{ err: { code: r, message: o }, data: void 0 }
	);
}
function ie(r) {
	return { err: void 0, data: r };
}
export { ne as a, oe as b, ie as c };
