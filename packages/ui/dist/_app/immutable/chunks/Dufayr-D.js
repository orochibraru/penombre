import { o as He, s as Rt } from './BHHl-vxW.js';
import { H as de, S as xe, R as Ce } from './CYgJF_JY.js';
import { a1 as Pe, J as T, u as x, I as C } from './BW6z9EX9.js';
new URL('sveltekit-internal://');
function Ut(e, t) {
	return e === '/' || t === 'ignore'
		? e
		: t === 'never'
			? e.endsWith('/')
				? e.slice(0, -1)
				: e
			: t === 'always' && !e.endsWith('/')
				? e + '/'
				: e;
}
function It(e) {
	return e.split('%25').map(decodeURI).join('%25');
}
function Lt(e) {
	for (const t in e) e[t] = decodeURIComponent(e[t]);
	return e;
}
function ve({ href: e }) {
	return e.split('#')[0];
}
function Tt(e, t, n, r = !1) {
	const a = new URL(e);
	Object.defineProperty(a, 'searchParams', {
		value: new Proxy(a.searchParams, {
			get(i, o) {
				if (o === 'get' || o === 'getAll' || o === 'has') return (f) => (n(f), i[o](f));
				t();
				const c = Reflect.get(i, o);
				return typeof c == 'function' ? c.bind(i) : c;
			}
		}),
		enumerable: !0,
		configurable: !0
	});
	const s = ['href', 'pathname', 'search', 'toString', 'toJSON'];
	r && s.push('hash');
	for (const i of s)
		Object.defineProperty(a, i, {
			get() {
				return (t(), e[i]);
			},
			enumerable: !0,
			configurable: !0
		});
	return a;
}
function xt(...e) {
	let t = 5381;
	for (const n of e)
		if (typeof n == 'string') {
			let r = n.length;
			for (; r; ) t = (t * 33) ^ n.charCodeAt(--r);
		} else if (ArrayBuffer.isView(n)) {
			const r = new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
			let a = r.length;
			for (; a; ) t = (t * 33) ^ r[--a];
		} else throw new TypeError('value must be a string or TypedArray');
	return (t >>> 0).toString(36);
}
function Ct(e) {
	const t = atob(e),
		n = new Uint8Array(t.length);
	for (let r = 0; r < t.length; r++) n[r] = t.charCodeAt(r);
	return n.buffer;
}
const Pt = window.fetch;
window.fetch = (e, t) => (
	(e instanceof Request ? e.method : t?.method || 'GET') !== 'GET' && H.delete(Ne(e)),
	Pt(e, t)
);
const H = new Map();
function Nt(e, t) {
	const n = Ne(e, t),
		r = document.querySelector(n);
	if (r?.textContent) {
		let { body: a, ...s } = JSON.parse(r.textContent);
		const i = r.getAttribute('data-ttl');
		return (
			i && H.set(n, { body: a, init: s, ttl: 1e3 * Number(i) }),
			r.getAttribute('data-b64') !== null && (a = Ct(a)),
			Promise.resolve(new Response(a, s))
		);
	}
	return window.fetch(e, t);
}
function Ot(e, t, n) {
	if (H.size > 0) {
		const r = Ne(e, n),
			a = H.get(r);
		if (a) {
			if (
				performance.now() < a.ttl &&
				['default', 'force-cache', 'only-if-cached', void 0].includes(n?.cache)
			)
				return new Response(a.body, a.init);
			H.delete(r);
		}
	}
	return window.fetch(t, n);
}
function Ne(e, t) {
	let r = `script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request ? e.url : e)}]`;
	if (t?.headers || t?.body) {
		const a = [];
		(t.headers && a.push([...new Headers(t.headers)].join(',')),
			t.body && (typeof t.body == 'string' || ArrayBuffer.isView(t.body)) && a.push(t.body),
			(r += `[data-hash="${xt(...a)}"]`));
	}
	return r;
}
const jt = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function $t(e) {
	const t = [];
	return {
		pattern:
			e === '/'
				? /^\/$/
				: new RegExp(
						`^${Vt(e)
							.map((r) => {
								const a = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(r);
								if (a)
									return (
										t.push({ name: a[1], matcher: a[2], optional: !1, rest: !0, chained: !0 }),
										'(?:/(.*))?'
									);
								const s = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(r);
								if (s)
									return (
										t.push({ name: s[1], matcher: s[2], optional: !0, rest: !1, chained: !0 }),
										'(?:/([^/]+))?'
									);
								if (!r) return;
								const i = r.split(/\[(.+?)\](?!\])/);
								return (
									'/' +
									i
										.map((c, f) => {
											if (f % 2) {
												if (c.startsWith('x+'))
													return be(String.fromCharCode(parseInt(c.slice(2), 16)));
												if (c.startsWith('u+'))
													return be(
														String.fromCharCode(
															...c
																.slice(2)
																.split('-')
																.map((y) => parseInt(y, 16))
														)
													);
												const d = jt.exec(c),
													[, h, u, l, p] = d;
												return (
													t.push({
														name: l,
														matcher: p,
														optional: !!h,
														rest: !!u,
														chained: u ? f === 1 && i[0] === '' : !1
													}),
													u ? '(.*?)' : h ? '([^/]*)?' : '([^/]+?)'
												);
											}
											return be(c);
										})
										.join('')
								);
							})
							.join('')}/?$`
					),
		params: t
	};
}
function Dt(e) {
	return !/^\([^)]+\)$/.test(e);
}
function Vt(e) {
	return e.slice(1).split('/').filter(Dt);
}
function Bt(e, t, n) {
	const r = {},
		a = e.slice(1),
		s = a.filter((o) => o !== void 0);
	let i = 0;
	for (let o = 0; o < t.length; o += 1) {
		const c = t[o];
		let f = a[o - i];
		if (
			(c.chained &&
				c.rest &&
				i &&
				((f = a
					.slice(o - i, o + 1)
					.filter((d) => d)
					.join('/')),
				(i = 0)),
			f === void 0)
		) {
			c.rest && (r[c.name] = '');
			continue;
		}
		if (!c.matcher || n[c.matcher](f)) {
			r[c.name] = f;
			const d = t[o + 1],
				h = a[o + 1];
			(d && !d.rest && d.optional && h && c.chained && (i = 0),
				!d && !h && Object.keys(r).length === s.length && (i = 0));
			continue;
		}
		if (c.optional && c.chained) {
			i++;
			continue;
		}
		return;
	}
	if (!i) return r;
}
function be(e) {
	return e
		.normalize()
		.replace(/[[\]]/g, '\\$&')
		.replace(/%/g, '%25')
		.replace(/\//g, '%2[Ff]')
		.replace(/\?/g, '%3[Ff]')
		.replace(/#/g, '%23')
		.replace(/[.*+?^${}()|\\]/g, '\\$&');
}
function Ft({ nodes: e, server_loads: t, dictionary: n, matchers: r }) {
	const a = new Set(t);
	return Object.entries(n).map(([o, [c, f, d]]) => {
		const { pattern: h, params: u } = $t(o),
			l = {
				id: o,
				exec: (p) => {
					const y = h.exec(p);
					if (y) return Bt(y, u, r);
				},
				errors: [1, ...(d || [])].map((p) => e[p]),
				layouts: [0, ...(f || [])].map(i),
				leaf: s(c)
			};
		return ((l.errors.length = l.layouts.length = Math.max(l.errors.length, l.layouts.length)), l);
	});
	function s(o) {
		const c = o < 0;
		return (c && (o = ~o), [c, e[o]]);
	}
	function i(o) {
		return o === void 0 ? o : [a.has(o), e[o]];
	}
}
function tt(e, t = JSON.parse) {
	try {
		return t(sessionStorage[e]);
	} catch {}
}
function Ke(e, t, n = JSON.stringify) {
	const r = n(t);
	try {
		sessionStorage[e] = r;
	} catch {}
}
const I = globalThis.__sveltekit_1vbn6a?.base ?? '',
	Mt = globalThis.__sveltekit_1vbn6a?.assets ?? I,
	qt = '0.0.7',
	nt = 'sveltekit:snapshot',
	rt = 'sveltekit:scroll',
	at = 'sveltekit:states',
	Gt = 'sveltekit:pageurl',
	B = 'sveltekit:history',
	J = 'sveltekit:navigation',
	$ = { tap: 1, hover: 2, viewport: 3, eager: 4, off: -1, false: -1 },
	ee = location.origin;
function Oe(e) {
	if (e instanceof URL) return e;
	let t = document.baseURI;
	if (!t) {
		const n = document.getElementsByTagName('base');
		t = n.length ? n[0].href : document.URL;
	}
	return new URL(e, t);
}
function he() {
	return { x: pageXOffset, y: pageYOffset };
}
function V(e, t) {
	return e.getAttribute(`data-sveltekit-${t}`);
}
const We = { ...$, '': $.hover };
function ot(e) {
	let t = e.assignedSlot ?? e.parentNode;
	return (t?.nodeType === 11 && (t = t.host), t);
}
function st(e, t) {
	for (; e && e !== t; ) {
		if (e.nodeName.toUpperCase() === 'A' && e.hasAttribute('href')) return e;
		e = ot(e);
	}
}
function Ee(e, t, n) {
	let r;
	try {
		if (
			((r = new URL(e instanceof SVGAElement ? e.href.baseVal : e.href, document.baseURI)),
			n && r.hash.match(/^#[^/]/))
		) {
			const o = location.hash.split('#')[1] || '/';
			r.hash = `#${o}${r.hash}`;
		}
	} catch {}
	const a = e instanceof SVGAElement ? e.target.baseVal : e.target,
		s = !r || !!a || pe(r, t, n) || (e.getAttribute('rel') || '').split(/\s+/).includes('external'),
		i = r?.origin === ee && e.hasAttribute('download');
	return { url: r, external: s, target: a, download: i };
}
function oe(e) {
	let t = null,
		n = null,
		r = null,
		a = null,
		s = null,
		i = null,
		o = e;
	for (; o && o !== document.documentElement; )
		(r === null && (r = V(o, 'preload-code')),
			a === null && (a = V(o, 'preload-data')),
			t === null && (t = V(o, 'keepfocus')),
			n === null && (n = V(o, 'noscroll')),
			s === null && (s = V(o, 'reload')),
			i === null && (i = V(o, 'replacestate')),
			(o = ot(o)));
	function c(f) {
		switch (f) {
			case '':
			case 'true':
				return !0;
			case 'off':
			case 'false':
				return !1;
			default:
				return;
		}
	}
	return {
		preload_code: We[r ?? 'off'],
		preload_data: We[a ?? 'off'],
		keepfocus: c(t),
		noscroll: c(n),
		reload: c(s),
		replace_state: c(i)
	};
}
function Ye(e) {
	const t = Pe(e);
	let n = !0;
	function r() {
		((n = !0), t.update((i) => i));
	}
	function a(i) {
		((n = !1), t.set(i));
	}
	function s(i) {
		let o;
		return t.subscribe((c) => {
			(o === void 0 || (n && c !== o)) && i((o = c));
		});
	}
	return { notify: r, set: a, subscribe: s };
}
const it = { v: () => {} };
function Ht() {
	const { set: e, subscribe: t } = Pe(!1);
	let n;
	async function r() {
		clearTimeout(n);
		try {
			const a = await fetch(`${Mt}/_app/version.json`, {
				headers: { pragma: 'no-cache', 'cache-control': 'no-cache' }
			});
			if (!a.ok) return !1;
			const i = (await a.json()).version !== qt;
			return (i && (e(!0), it.v(), clearTimeout(n)), i);
		} catch {
			return !1;
		}
	}
	return { subscribe: t, check: r };
}
function pe(e, t, n) {
	return e.origin !== ee || !e.pathname.startsWith(t)
		? !0
		: n
			? !(
					e.pathname === t + '/' ||
					e.pathname === t + '/index.html' ||
					(e.protocol === 'file:' && e.pathname.replace(/\/[^/]+\.html?$/, '') === t)
				)
			: !1;
}
function Rn(e) {}
function Un(e) {
	const t = new DataView(e);
	let n = '';
	for (let r = 0; r < e.byteLength; r++) n += String.fromCharCode(t.getUint8(r));
	return Wt(n);
}
function Je(e) {
	const t = Kt(e),
		n = new ArrayBuffer(t.length),
		r = new DataView(n);
	for (let a = 0; a < n.byteLength; a++) r.setUint8(a, t.charCodeAt(a));
	return n;
}
const ct = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function Kt(e) {
	e.length % 4 === 0 && (e = e.replace(/==?$/, ''));
	let t = '',
		n = 0,
		r = 0;
	for (let a = 0; a < e.length; a++)
		((n <<= 6),
			(n |= ct.indexOf(e[a])),
			(r += 6),
			r === 24 &&
				((t += String.fromCharCode((n & 16711680) >> 16)),
				(t += String.fromCharCode((n & 65280) >> 8)),
				(t += String.fromCharCode(n & 255)),
				(n = r = 0)));
	return (
		r === 12
			? ((n >>= 4), (t += String.fromCharCode(n)))
			: r === 18 &&
				((n >>= 2),
				(t += String.fromCharCode((n & 65280) >> 8)),
				(t += String.fromCharCode(n & 255))),
		t
	);
}
function Wt(e) {
	let t = '';
	for (let n = 0; n < e.length; n += 3) {
		const r = [void 0, void 0, void 0, void 0];
		((r[0] = e.charCodeAt(n) >> 2),
			(r[1] = (e.charCodeAt(n) & 3) << 4),
			e.length > n + 1 &&
				((r[1] |= e.charCodeAt(n + 1) >> 4), (r[2] = (e.charCodeAt(n + 1) & 15) << 2)),
			e.length > n + 2 && ((r[2] |= e.charCodeAt(n + 2) >> 6), (r[3] = e.charCodeAt(n + 2) & 63)));
		for (let a = 0; a < r.length; a++) typeof r[a] > 'u' ? (t += '=') : (t += ct[r[a]]);
	}
	return t;
}
const Yt = -1,
	Jt = -2,
	zt = -3,
	Xt = -4,
	Zt = -5,
	Qt = -6;
function In(e, t) {
	return lt(JSON.parse(e), t);
}
function lt(e, t) {
	if (typeof e == 'number') return a(e, !0);
	if (!Array.isArray(e) || e.length === 0) throw new Error('Invalid input');
	const n = e,
		r = Array(n.length);
	function a(s, i = !1) {
		if (s === Yt) return;
		if (s === zt) return NaN;
		if (s === Xt) return 1 / 0;
		if (s === Zt) return -1 / 0;
		if (s === Qt) return -0;
		if (i) throw new Error('Invalid input');
		if (s in r) return r[s];
		const o = n[s];
		if (!o || typeof o != 'object') r[s] = o;
		else if (Array.isArray(o))
			if (typeof o[0] == 'string') {
				const c = o[0],
					f = t?.[c];
				if (f) return (r[s] = f(a(o[1])));
				switch (c) {
					case 'Date':
						r[s] = new Date(o[1]);
						break;
					case 'Set':
						const d = new Set();
						r[s] = d;
						for (let l = 1; l < o.length; l += 1) d.add(a(o[l]));
						break;
					case 'Map':
						const h = new Map();
						r[s] = h;
						for (let l = 1; l < o.length; l += 2) h.set(a(o[l]), a(o[l + 1]));
						break;
					case 'RegExp':
						r[s] = new RegExp(o[1], o[2]);
						break;
					case 'Object':
						r[s] = Object(o[1]);
						break;
					case 'BigInt':
						r[s] = BigInt(o[1]);
						break;
					case 'null':
						const u = Object.create(null);
						r[s] = u;
						for (let l = 1; l < o.length; l += 2) u[o[l]] = a(o[l + 1]);
						break;
					case 'Int8Array':
					case 'Uint8Array':
					case 'Uint8ClampedArray':
					case 'Int16Array':
					case 'Uint16Array':
					case 'Int32Array':
					case 'Uint32Array':
					case 'Float32Array':
					case 'Float64Array':
					case 'BigInt64Array':
					case 'BigUint64Array': {
						const l = globalThis[c],
							p = o[1],
							y = Je(p),
							_ = new l(y);
						r[s] = _;
						break;
					}
					case 'ArrayBuffer': {
						const l = o[1],
							p = Je(l);
						r[s] = p;
						break;
					}
					default:
						throw new Error(`Unknown type ${c}`);
				}
			} else {
				const c = new Array(o.length);
				r[s] = c;
				for (let f = 0; f < o.length; f += 1) {
					const d = o[f];
					d !== Jt && (c[f] = a(d));
				}
			}
		else {
			const c = {};
			r[s] = c;
			for (const f in o) {
				const d = o[f];
				c[f] = a(d);
			}
		}
		return r[s];
	}
	return a(0);
}
const ft = new Set(['load', 'prerender', 'csr', 'ssr', 'trailingSlash', 'config']);
[...ft];
const en = new Set([...ft]);
[...en];
function tn(e) {
	return e.filter((t) => t != null);
}
const nn = 'x-sveltekit-invalidated',
	rn = 'x-sveltekit-trailing-slash';
function se(e) {
	return e instanceof de || e instanceof xe ? e.status : 500;
}
function an(e) {
	return e instanceof xe ? e.text : 'Internal Error';
}
let b, z, Ae;
const on = He.toString().includes('$$') || /function \w+\(\) \{\}/.test(He.toString());
on
	? ((b = {
			data: {},
			form: null,
			error: null,
			params: {},
			route: { id: null },
			state: {},
			status: -1,
			url: new URL('https://example.com')
		}),
		(z = { current: null }),
		(Ae = { current: !1 }))
	: ((b = new (class {
			#e = T({});
			get data() {
				return x(this.#e);
			}
			set data(t) {
				C(this.#e, t);
			}
			#t = T(null);
			get form() {
				return x(this.#t);
			}
			set form(t) {
				C(this.#t, t);
			}
			#n = T(null);
			get error() {
				return x(this.#n);
			}
			set error(t) {
				C(this.#n, t);
			}
			#r = T({});
			get params() {
				return x(this.#r);
			}
			set params(t) {
				C(this.#r, t);
			}
			#a = T({ id: null });
			get route() {
				return x(this.#a);
			}
			set route(t) {
				C(this.#a, t);
			}
			#o = T({});
			get state() {
				return x(this.#o);
			}
			set state(t) {
				C(this.#o, t);
			}
			#s = T(-1);
			get status() {
				return x(this.#s);
			}
			set status(t) {
				C(this.#s, t);
			}
			#i = T(new URL('https://example.com'));
			get url() {
				return x(this.#i);
			}
			set url(t) {
				C(this.#i, t);
			}
		})()),
		(z = new (class {
			#e = T(null);
			get current() {
				return x(this.#e);
			}
			set current(t) {
				C(this.#e, t);
			}
		})()),
		(Ae = new (class {
			#e = T(!1);
			get current() {
				return x(this.#e);
			}
			set current(t) {
				C(this.#e, t);
			}
		})()),
		(it.v = () => (Ae.current = !0)));
function je(e) {
	Object.assign(b, e);
}
const sn = '/__data.json',
	cn = '.html__data.json';
function ln(e) {
	return e.endsWith('.html') ? e.replace(/\.html$/, cn) : e.replace(/\/$/, '') + sn;
}
const { onMount: fn, tick: Re } = Rt,
	un = new Set(['icon', 'shortcut icon', 'apple-touch-icon']),
	D = tt(rt) ?? {},
	X = tt(nt) ?? {},
	j = { url: Ye({}), page: Ye({}), navigating: Pe(null), updated: Ht() };
function $e(e) {
	D[e] = he();
}
function dn(e, t) {
	let n = e + 1;
	for (; D[n]; ) (delete D[n], (n += 1));
	for (n = t + 1; X[n]; ) (delete X[n], (n += 1));
}
function q(e) {
	return ((location.href = e.href), new Promise(() => {}));
}
async function ut() {
	if ('serviceWorker' in navigator) {
		const e = await navigator.serviceWorker.getRegistration(I || '/');
		e && (await e.update());
	}
}
function ze() {}
let De, Ue, ie, P, Ie, v;
const ce = [],
	le = [];
let O = null;
const ae = new Map(),
	Ve = new Set(),
	dt = new Set(),
	K = new Set();
let m = { branch: [], error: null, url: null },
	Be = !1,
	fe = !1,
	Xe = !0,
	Z = !1,
	G = !1,
	ht = !1,
	ge = !1,
	F,
	S,
	U,
	N;
const W = new Set();
let Se;
async function Cn(e, t, n) {
	(document.URL !== location.href && (location.href = location.href),
		(v = e),
		await e.hooks.init?.(),
		(De = Ft(e)),
		(P = document.documentElement),
		(Ie = t),
		(Ue = e.nodes[0]),
		(ie = e.nodes[1]),
		Ue(),
		ie(),
		(S = history.state?.[B]),
		(U = history.state?.[J]),
		S || ((S = U = Date.now()), history.replaceState({ ...history.state, [B]: S, [J]: U }, '')));
	const r = D[S];
	function a() {
		r && ((history.scrollRestoration = 'manual'), scrollTo(r.x, r.y));
	}
	(n
		? (a(), await bn(Ie, n))
		: (await Y({
				type: 'enter',
				url: Oe(v.hash ? An(new URL(location.href)) : location.href),
				replace_state: !0
			}),
			a()),
		vn());
}
async function hn() {
	if ((await (Se ||= Promise.resolve()), !Se)) return;
	Se = null;
	const e = (N = {}),
		t = await ne(m.url, !0);
	O = null;
	const n = t && (await qe(t));
	if (!(!n || e !== N)) {
		if (n.type === 'redirect') return te(new URL(n.location, m.url).href, {}, 1, e);
		(n.props.page && Object.assign(b, n.props.page),
			(m = n.state),
			pt(),
			F.$set(n.props),
			je(n.props.page));
	}
}
function pt() {
	((ce.length = 0), (ge = !1));
}
function gt(e) {
	le.some((t) => t?.snapshot) && (X[e] = le.map((t) => t?.snapshot?.capture()));
}
function _t(e) {
	X[e]?.forEach((t, n) => {
		le[n]?.snapshot?.restore(t);
	});
}
function Ze() {
	($e(S), Ke(rt, D), gt(U), Ke(nt, X));
}
async function te(e, t, n, r) {
	return Y({
		type: 'goto',
		url: Oe(e),
		keepfocus: t.keepFocus,
		noscroll: t.noScroll,
		replace_state: t.replaceState,
		state: t.state,
		redirect_count: n,
		nav_token: r,
		accept: () => {
			(t.invalidateAll && (ge = !0), t.invalidate && t.invalidate.forEach(wn));
		}
	});
}
async function pn(e) {
	if (e.id !== O?.id) {
		const t = {};
		(W.add(t),
			(O = {
				id: e.id,
				token: t,
				promise: qe({ ...e, preload: t }).then(
					(n) => (W.delete(t), n.type === 'loaded' && n.state.error && (O = null), n)
				)
			}));
	}
	return O.promise;
}
async function ke(e) {
	const t = (await ne(e, !1))?.route;
	t && (await Promise.all([...t.layouts, t.leaf].map((n) => n?.[1]())));
}
function mt(e, t, n) {
	m = e.state;
	const r = document.querySelector('style[data-sveltekit]');
	if (
		(r && r.remove(),
		Object.assign(b, e.props.page),
		(F = new v.root({
			target: t,
			props: { ...e.props, stores: j, components: le },
			hydrate: n,
			sync: !1
		})),
		_t(U),
		n)
	) {
		const a = {
			from: null,
			to: { params: m.params, route: { id: m.route?.id ?? null }, url: new URL(location.href) },
			willUnload: !1,
			type: 'enter',
			complete: Promise.resolve()
		};
		K.forEach((s) => s(a));
	}
	fe = !0;
}
function Q({ url: e, params: t, branch: n, status: r, error: a, route: s, form: i }) {
	let o = 'never';
	if (I && (e.pathname === I || e.pathname === I + '/')) o = 'always';
	else for (const l of n) l?.slash !== void 0 && (o = l.slash);
	((e.pathname = Ut(e.pathname, o)), (e.search = e.search));
	const c = {
		type: 'loaded',
		state: { url: e, params: t, branch: n, error: a, route: s },
		props: { constructors: tn(n).map((l) => l.node.component), page: me(b) }
	};
	i !== void 0 && (c.props.form = i);
	let f = {},
		d = !b,
		h = 0;
	for (let l = 0; l < Math.max(n.length, m.branch.length); l += 1) {
		const p = n[l],
			y = m.branch[l];
		(p?.data !== y?.data && (d = !0),
			p && ((f = { ...f, ...p.data }), d && (c.props[`data_${h}`] = f), (h += 1)));
	}
	return (
		(!m.url || e.href !== m.url.href || m.error !== a || (i !== void 0 && i !== b.form) || d) &&
			(c.props.page = {
				error: a,
				params: t,
				route: { id: s?.id ?? null },
				state: {},
				status: r,
				url: new URL(e),
				form: i ?? null,
				data: d ? f : b.data
			}),
		c
	);
}
async function Fe({ loader: e, parent: t, url: n, params: r, route: a, server_data_node: s }) {
	let i = null,
		o = !0;
	const c = {
			dependencies: new Set(),
			params: new Set(),
			parent: !1,
			route: !1,
			url: !1,
			search_params: new Set()
		},
		f = await e();
	if (f.universal?.load) {
		let d = function (...u) {
			for (const l of u) {
				const { href: p } = new URL(l, n);
				c.dependencies.add(p);
			}
		};
		const h = {
			route: new Proxy(a, { get: (u, l) => (o && (c.route = !0), u[l]) }),
			params: new Proxy(r, { get: (u, l) => (o && c.params.add(l), u[l]) }),
			data: s?.data ?? null,
			url: Tt(
				n,
				() => {
					o && (c.url = !0);
				},
				(u) => {
					o && c.search_params.add(u);
				},
				v.hash
			),
			async fetch(u, l) {
				u instanceof Request &&
					(l = {
						body: u.method === 'GET' || u.method === 'HEAD' ? void 0 : await u.blob(),
						cache: u.cache,
						credentials: u.credentials,
						headers: [...u.headers].length > 0 ? u?.headers : void 0,
						integrity: u.integrity,
						keepalive: u.keepalive,
						method: u.method,
						mode: u.mode,
						redirect: u.redirect,
						referrer: u.referrer,
						referrerPolicy: u.referrerPolicy,
						signal: u.signal,
						...l
					});
				const { resolved: p, promise: y } = yt(u, l, n);
				return (o && d(p.href), y);
			},
			setHeaders: () => {},
			depends: d,
			parent() {
				return (o && (c.parent = !0), t());
			},
			untrack(u) {
				o = !1;
				try {
					return u();
				} finally {
					o = !0;
				}
			}
		};
		i = (await f.universal.load.call(null, h)) ?? null;
	}
	return {
		node: f,
		loader: e,
		server: s,
		universal: f.universal?.load ? { type: 'data', data: i, uses: c } : null,
		data: i ?? s?.data ?? null,
		slash: f.universal?.trailingSlash ?? s?.slash
	};
}
function yt(e, t, n) {
	let r = e instanceof Request ? e.url : e;
	const a = new URL(r, n);
	a.origin === n.origin && (r = a.href.slice(n.origin.length));
	const s = fe ? Ot(r, a.href, t) : Nt(r, t);
	return { resolved: a, promise: s };
}
function Qe(e, t, n, r, a, s) {
	if (ge) return !0;
	if (!a) return !1;
	if ((a.parent && e) || (a.route && t) || (a.url && n)) return !0;
	for (const i of a.search_params) if (r.has(i)) return !0;
	for (const i of a.params) if (s[i] !== m.params[i]) return !0;
	for (const i of a.dependencies) if (ce.some((o) => o(new URL(i)))) return !0;
	return !1;
}
function Me(e, t) {
	return e?.type === 'data' ? e : e?.type === 'skip' ? (t ?? null) : null;
}
function gn(e, t) {
	if (!e) return new Set(t.searchParams.keys());
	const n = new Set([...e.searchParams.keys(), ...t.searchParams.keys()]);
	for (const r of n) {
		const a = e.searchParams.getAll(r),
			s = t.searchParams.getAll(r);
		a.every((i) => s.includes(i)) && s.every((i) => a.includes(i)) && n.delete(r);
	}
	return n;
}
function et({ error: e, url: t, route: n, params: r }) {
	return {
		type: 'loaded',
		state: { error: e, url: t, route: n, params: r, branch: [] },
		props: { page: me(b), constructors: [] }
	};
}
async function qe({ id: e, invalidating: t, url: n, params: r, route: a, preload: s }) {
	if (O?.id === e) return (W.delete(O.token), O.promise);
	const { errors: i, layouts: o, leaf: c } = a,
		f = [...o, c];
	(i.forEach((g) => g?.().catch(() => {})), f.forEach((g) => g?.[1]().catch(() => {})));
	let d = null;
	const h = m.url ? e !== ue(m.url) : !1,
		u = m.route ? a.id !== m.route.id : !1,
		l = gn(m.url, n);
	let p = !1;
	const y = f.map((g, w) => {
		const A = m.branch[w],
			k = !!g?.[0] && (A?.loader !== g[1] || Qe(p, u, h, l, A.server?.uses, r));
		return (k && (p = !0), k);
	});
	if (y.some(Boolean)) {
		try {
			d = await St(n, y);
		} catch (g) {
			const w = await M(g, { url: n, params: r, route: { id: e } });
			return W.has(s)
				? et({ error: w, url: n, params: r, route: a })
				: _e({ status: se(g), error: w, url: n, route: a });
		}
		if (d.type === 'redirect') return d;
	}
	const _ = d?.nodes;
	let R = !1;
	const E = f.map(async (g, w) => {
		if (!g) return;
		const A = m.branch[w],
			k = _?.[w];
		if ((!k || k.type === 'skip') && g[1] === A?.loader && !Qe(R, u, h, l, A.universal?.uses, r))
			return A;
		if (((R = !0), k?.type === 'error')) throw k;
		return Fe({
			loader: g[1],
			url: n,
			params: r,
			route: a,
			parent: async () => {
				const ye = {};
				for (let we = 0; we < w; we += 1) Object.assign(ye, (await E[we])?.data);
				return ye;
			},
			server_data_node: Me(
				k === void 0 && g[0] ? { type: 'skip' } : (k ?? null),
				g[0] ? A?.server : void 0
			)
		});
	});
	for (const g of E) g.catch(() => {});
	const L = [];
	for (let g = 0; g < f.length; g += 1)
		if (f[g])
			try {
				L.push(await E[g]);
			} catch (w) {
				if (w instanceof Ce) return { type: 'redirect', location: w.location };
				if (W.has(s))
					return et({
						error: await M(w, { params: r, url: n, route: { id: a.id } }),
						url: n,
						params: r,
						route: a
					});
				let A = se(w),
					k;
				if (_?.includes(w)) ((A = w.status ?? A), (k = w.error));
				else if (w instanceof de) k = w.body;
				else {
					if (await j.updated.check()) return (await ut(), await q(n));
					k = await M(w, { params: r, url: n, route: { id: a.id } });
				}
				const re = await wt(g, L, i);
				return re
					? Q({
							url: n,
							params: r,
							branch: L.slice(0, re.idx).concat(re.node),
							status: A,
							error: k,
							route: a
						})
					: await bt(n, { id: a.id }, k, A);
			}
		else L.push(void 0);
	return Q({
		url: n,
		params: r,
		branch: L,
		status: 200,
		error: null,
		route: a,
		form: t ? void 0 : null
	});
}
async function wt(e, t, n) {
	for (; e--; )
		if (n[e]) {
			let r = e;
			for (; !t[r]; ) r -= 1;
			try {
				return {
					idx: r + 1,
					node: { node: await n[e](), loader: n[e], data: {}, server: null, universal: null }
				};
			} catch {
				continue;
			}
		}
}
async function _e({ status: e, error: t, url: n, route: r }) {
	const a = {};
	let s = null;
	if (v.server_loads[0] === 0)
		try {
			const o = await St(n, [!0]);
			if (o.type !== 'data' || (o.nodes[0] && o.nodes[0].type !== 'data')) throw 0;
			s = o.nodes[0] ?? null;
		} catch {
			(n.origin !== ee || n.pathname !== location.pathname || Be) && (await q(n));
		}
	try {
		const o = await Fe({
				loader: Ue,
				url: n,
				params: a,
				route: r,
				parent: () => Promise.resolve({}),
				server_data_node: Me(s)
			}),
			c = { node: await ie(), loader: ie, universal: null, server: null, data: null };
		return Q({ url: n, params: a, branch: [o, c], status: e, error: t, route: null });
	} catch (o) {
		if (o instanceof Ce) return te(new URL(o.location, location.href), {}, 0);
		throw o;
	}
}
async function _n(e) {
	const t = e.href;
	if (ae.has(t)) return ae.get(t);
	let n;
	try {
		const r = (async () => {
			let a =
				(await v.hooks.reroute({ url: new URL(e), fetch: async (s, i) => yt(s, i, e).promise })) ??
				e;
			if (typeof a == 'string') {
				const s = new URL(e);
				(v.hash ? (s.hash = a) : (s.pathname = a), (a = s));
			}
			return a;
		})();
		(ae.set(t, r), (n = await r));
	} catch {
		ae.delete(t);
		return;
	}
	return n;
}
async function ne(e, t) {
	if (e && !pe(e, I, v.hash)) {
		const n = await _n(e);
		if (!n) return;
		const r = mn(n);
		for (const a of De) {
			const s = a.exec(r);
			if (s) return { id: ue(e), invalidating: t, route: a, params: Lt(s), url: e };
		}
	}
}
function mn(e) {
	return (
		It(v.hash ? e.hash.replace(/^#/, '').replace(/[?#].+/, '') : e.pathname.slice(I.length)) || '/'
	);
}
function ue(e) {
	return (v.hash ? e.hash.replace(/^#/, '') : e.pathname) + e.search;
}
function vt({ url: e, type: t, intent: n, delta: r }) {
	let a = !1;
	const s = Ge(m, n, e, t);
	r !== void 0 && (s.navigation.delta = r);
	const i = {
		...s.navigation,
		cancel: () => {
			((a = !0), s.reject(new Error('navigation cancelled')));
		}
	};
	return (Z || Ve.forEach((o) => o(i)), a ? null : s);
}
async function Y({
	type: e,
	url: t,
	popped: n,
	keepfocus: r,
	noscroll: a,
	replace_state: s,
	state: i = {},
	redirect_count: o = 0,
	nav_token: c = {},
	accept: f = ze,
	block: d = ze
}) {
	const h = N;
	N = c;
	const u = await ne(t, !1),
		l = e === 'enter' ? Ge(m, u, t, e) : vt({ url: t, type: e, delta: n?.delta, intent: u });
	if (!l) {
		(d(), N === c && (N = h));
		return;
	}
	const p = S,
		y = U;
	(f(),
		(Z = !0),
		fe && l.navigation.type !== 'enter' && j.navigating.set((z.current = l.navigation)));
	let _ = u && (await qe(u));
	if (!_) {
		if (pe(t, I, v.hash)) return await q(t);
		_ = await bt(
			t,
			{ id: null },
			await M(new xe(404, 'Not Found', `Not found: ${t.pathname}`), {
				url: t,
				params: {},
				route: { id: null }
			}),
			404
		);
	}
	if (((t = u?.url || t), N !== c)) return (l.reject(new Error('navigation aborted')), !1);
	if (_.type === 'redirect')
		if (o >= 20)
			_ = await _e({
				status: 500,
				error: await M(new Error('Redirect loop'), { url: t, params: {}, route: { id: null } }),
				url: t,
				route: { id: null }
			});
		else return (await te(new URL(_.location, t).href, {}, o + 1, c), !1);
	else _.props.page.status >= 400 && (await j.updated.check()) && (await ut(), await q(t));
	if (
		(pt(),
		$e(p),
		gt(y),
		_.props.page.url.pathname !== t.pathname && (t.pathname = _.props.page.url.pathname),
		(i = n ? n.state : i),
		!n)
	) {
		const g = s ? 0 : 1,
			w = { [B]: (S += g), [J]: (U += g), [at]: i };
		((s ? history.replaceState : history.pushState).call(history, w, '', t), s || dn(S, U));
	}
	if (((O = null), (_.props.page.state = i), fe)) {
		((m = _.state), _.props.page && (_.props.page.url = t));
		const g = (await Promise.all(Array.from(dt, (w) => w(l.navigation)))).filter(
			(w) => typeof w == 'function'
		);
		if (g.length > 0) {
			let w = function () {
				g.forEach((A) => {
					K.delete(A);
				});
			};
			(g.push(w),
				g.forEach((A) => {
					K.add(A);
				}));
		}
		(F.$set(_.props), je(_.props.page), (ht = !0));
	} else mt(_, Ie, !1);
	const { activeElement: R } = document;
	await Re();
	const E = n ? n.scroll : a ? he() : null;
	if (Xe) {
		const g = t.hash && document.getElementById(Et(t));
		E ? scrollTo(E.x, E.y) : g ? g.scrollIntoView() : scrollTo(0, 0);
	}
	const L = document.activeElement !== R && document.activeElement !== document.body;
	(!r && !L && Te(t),
		(Xe = !0),
		_.props.page && Object.assign(b, _.props.page),
		(Z = !1),
		e === 'popstate' && _t(U),
		l.fulfil(void 0),
		K.forEach((g) => g(l.navigation)),
		j.navigating.set((z.current = null)));
}
async function bt(e, t, n, r) {
	return e.origin === ee && e.pathname === location.pathname && !Be
		? await _e({ status: r, error: n, url: e, route: t })
		: await q(e);
}
function yn() {
	let e, t, n;
	P.addEventListener('mousemove', (o) => {
		const c = o.target;
		(clearTimeout(e),
			(e = setTimeout(() => {
				s(c, $.hover);
			}, 20)));
	});
	function r(o) {
		o.defaultPrevented || s(o.composedPath()[0], $.tap);
	}
	(P.addEventListener('mousedown', r), P.addEventListener('touchstart', r, { passive: !0 }));
	const a = new IntersectionObserver(
		(o) => {
			for (const c of o) c.isIntersecting && (ke(new URL(c.target.href)), a.unobserve(c.target));
		},
		{ threshold: 0 }
	);
	async function s(o, c) {
		const f = st(o, P),
			d = f === t && c >= n;
		if (!f || d) return;
		const { url: h, external: u, download: l } = Ee(f, I, v.hash);
		if (u || l) return;
		const p = oe(f),
			y = h && ue(m.url) === ue(h);
		if (!(p.reload || y))
			if (c <= p.preload_data) {
				((t = f), (n = $.tap));
				const _ = await ne(h, !1);
				if (!_) return;
				pn(_);
			} else c <= p.preload_code && ((t = f), (n = c), ke(h));
	}
	function i() {
		a.disconnect();
		for (const o of P.querySelectorAll('a')) {
			const { url: c, external: f, download: d } = Ee(o, I, v.hash);
			if (f || d) continue;
			const h = oe(o);
			h.reload ||
				(h.preload_code === $.viewport && a.observe(o), h.preload_code === $.eager && ke(c));
		}
	}
	(K.add(i), i());
}
function M(e, t) {
	if (e instanceof de) return e.body;
	const n = se(e),
		r = an(e);
	return v.hooks.handleError({ error: e, event: t, status: n, message: r }) ?? { message: r };
}
function At(e, t) {
	fn(
		() => (
			e.add(t),
			() => {
				e.delete(t);
			}
		)
	);
}
function Pn(e) {
	At(Ve, e);
}
function Nn(e) {
	At(dt, e);
}
function On(e, t = {}) {
	return (
		(e = new URL(Oe(e))),
		e.origin !== ee ? Promise.reject(new Error('goto: invalid URL')) : te(e, t, 0)
	);
}
function wn(e) {
	if (typeof e == 'function') ce.push(e);
	else {
		const { href: t } = new URL(e, location.href);
		ce.push((n) => n.href === t);
	}
}
function jn() {
	return ((ge = !0), hn());
}
async function $n(e) {
	if (e.type === 'error') {
		const t = new URL(location.href),
			{ branch: n, route: r } = m;
		if (!r) return;
		const a = await wt(m.branch.length, n, r.errors);
		if (a) {
			const s = Q({
				url: t,
				params: m.params,
				branch: n.slice(0, a.idx).concat(a.node),
				status: e.status ?? 500,
				error: e.error,
				route: r
			});
			((m = s.state), F.$set(s.props), je(s.props.page), Re().then(() => Te(m.url)));
		}
	} else
		e.type === 'redirect'
			? await te(e.location, { invalidateAll: !0 }, 0)
			: ((b.form = e.data),
				(b.status = e.status),
				F.$set({ form: null, page: me(b) }),
				await Re(),
				F.$set({ form: e.data }),
				e.type === 'success' && Te(b.url));
}
function vn() {
	((history.scrollRestoration = 'manual'),
		addEventListener('beforeunload', (t) => {
			let n = !1;
			if ((Ze(), !Z)) {
				const r = Ge(m, void 0, null, 'leave'),
					a = {
						...r.navigation,
						cancel: () => {
							((n = !0), r.reject(new Error('navigation cancelled')));
						}
					};
				Ve.forEach((s) => s(a));
			}
			n ? (t.preventDefault(), (t.returnValue = '')) : (history.scrollRestoration = 'auto');
		}),
		addEventListener('visibilitychange', () => {
			document.visibilityState === 'hidden' && Ze();
		}),
		navigator.connection?.saveData || yn(),
		P.addEventListener('click', async (t) => {
			if (
				t.button ||
				t.which !== 1 ||
				t.metaKey ||
				t.ctrlKey ||
				t.shiftKey ||
				t.altKey ||
				t.defaultPrevented
			)
				return;
			const n = st(t.composedPath()[0], P);
			if (!n) return;
			const { url: r, external: a, target: s, download: i } = Ee(n, I, v.hash);
			if (!r) return;
			if (s === '_parent' || s === '_top') {
				if (window.parent !== window) return;
			} else if (s && s !== '_self') return;
			const o = oe(n);
			if (
				(!(n instanceof SVGAElement) &&
					r.protocol !== location.protocol &&
					!(r.protocol === 'https:' || r.protocol === 'http:')) ||
				i
			)
				return;
			const [f, d] = (v.hash ? r.hash.replace(/^#/, '') : r.href).split('#'),
				h = f === ve(location);
			if (a || (o.reload && (!h || !d))) {
				vt({ url: r, type: 'link' }) ? (Z = !0) : t.preventDefault();
				return;
			}
			if (d !== void 0 && h) {
				const [, u] = m.url.href.split('#');
				if (u === d) {
					if (
						(t.preventDefault(),
						d === '' || (d === 'top' && n.ownerDocument.getElementById('top') === null))
					)
						window.scrollTo({ top: 0 });
					else {
						const l = n.ownerDocument.getElementById(decodeURIComponent(d));
						l && (l.scrollIntoView(), l.focus());
					}
					return;
				}
				if (((G = !0), $e(S), e(r), !o.replace_state)) return;
				G = !1;
			}
			(t.preventDefault(),
				await new Promise((u) => {
					(requestAnimationFrame(() => {
						setTimeout(u, 0);
					}),
						setTimeout(u, 100));
				}),
				await Y({
					type: 'link',
					url: r,
					keepfocus: o.keepfocus,
					noscroll: o.noscroll,
					replace_state: o.replace_state ?? r.href === location.href
				}));
		}),
		P.addEventListener('submit', (t) => {
			if (t.defaultPrevented) return;
			const n = HTMLFormElement.prototype.cloneNode.call(t.target),
				r = t.submitter;
			if ((r?.formTarget || n.target) === '_blank' || (r?.formMethod || n.method) !== 'get') return;
			const i = new URL((r?.hasAttribute('formaction') && r?.formAction) || n.action);
			if (pe(i, I, !1)) return;
			const o = t.target,
				c = oe(o);
			if (c.reload) return;
			(t.preventDefault(), t.stopPropagation());
			const f = new FormData(o),
				d = r?.getAttribute('name');
			(d && f.append(d, r?.getAttribute('value') ?? ''),
				(i.search = new URLSearchParams(f).toString()),
				Y({
					type: 'form',
					url: i,
					keepfocus: c.keepfocus,
					noscroll: c.noscroll,
					replace_state: c.replace_state ?? i.href === location.href
				}));
		}),
		addEventListener('popstate', async (t) => {
			if (!Le) {
				if (t.state?.[B]) {
					const n = t.state[B];
					if (((N = {}), n === S)) return;
					const r = D[n],
						a = t.state[at] ?? {},
						s = new URL(t.state[Gt] ?? location.href),
						i = t.state[J],
						o = m.url ? ve(location) === ve(m.url) : !1;
					if (i === U && (ht || o)) {
						(a !== b.state && (b.state = a), e(s), (D[S] = he()), r && scrollTo(r.x, r.y), (S = n));
						return;
					}
					const f = n - S;
					await Y({
						type: 'popstate',
						url: s,
						popped: { state: a, scroll: r, delta: f },
						accept: () => {
							((S = n), (U = i));
						},
						block: () => {
							history.go(-f);
						},
						nav_token: N
					});
				} else if (!G) {
					const n = new URL(location.href);
					(e(n), v.hash && location.reload());
				}
			}
		}),
		addEventListener('hashchange', () => {
			G &&
				((G = !1), history.replaceState({ ...history.state, [B]: ++S, [J]: U }, '', location.href));
		}));
	for (const t of document.querySelectorAll('link')) un.has(t.rel) && (t.href = t.href);
	addEventListener('pageshow', (t) => {
		t.persisted && j.navigating.set((z.current = null));
	});
	function e(t) {
		((m.url = b.url = t), j.page.set(me(b)), j.page.notify());
	}
}
async function bn(
	e,
	{ status: t = 200, error: n, node_ids: r, params: a, route: s, server_route: i, data: o, form: c }
) {
	Be = !0;
	const f = new URL(location.href);
	let d;
	(({ params: a = {}, route: s = { id: null } } = (await ne(f, !1)) || {}),
		(d = De.find(({ id: l }) => l === s.id)));
	let h,
		u = !0;
	try {
		const l = r.map(async (y, _) => {
				const R = o[_];
				return (
					R?.uses && (R.uses = kt(R.uses)),
					Fe({
						loader: v.nodes[y],
						url: f,
						params: a,
						route: s,
						parent: async () => {
							const E = {};
							for (let L = 0; L < _; L += 1) Object.assign(E, (await l[L]).data);
							return E;
						},
						server_data_node: Me(R)
					})
				);
			}),
			p = await Promise.all(l);
		if (d) {
			const y = d.layouts;
			for (let _ = 0; _ < y.length; _++) y[_] || p.splice(_, 0, void 0);
		}
		h = Q({ url: f, params: a, branch: p, status: t, error: n, form: c, route: d ?? null });
	} catch (l) {
		if (l instanceof Ce) {
			await q(new URL(l.location, location.href));
			return;
		}
		((h = await _e({
			status: se(l),
			error: await M(l, { url: f, params: a, route: s }),
			url: f,
			route: s
		})),
			(e.textContent = ''),
			(u = !1));
	}
	(h.props.page && (h.props.page.state = {}), mt(h, e, u));
}
async function St(e, t) {
	const n = new URL(e);
	((n.pathname = ln(e.pathname)),
		e.pathname.endsWith('/') && n.searchParams.append(rn, '1'),
		n.searchParams.append(nn, t.map((s) => (s ? '1' : '0')).join('')));
	const r = window.fetch,
		a = await r(n.href, {});
	if (!a.ok) {
		let s;
		throw (
			a.headers.get('content-type')?.includes('application/json')
				? (s = await a.json())
				: a.status === 404
					? (s = 'Not Found')
					: a.status === 500 && (s = 'Internal Error'),
			new de(a.status, s)
		);
	}
	return new Promise(async (s) => {
		const i = new Map(),
			o = a.body.getReader(),
			c = new TextDecoder();
		function f(h) {
			return lt(h, {
				...v.decoders,
				Promise: (u) =>
					new Promise((l, p) => {
						i.set(u, { fulfil: l, reject: p });
					})
			});
		}
		let d = '';
		for (;;) {
			const { done: h, value: u } = await o.read();
			if (h && !d) break;
			for (
				d +=
					!u && d
						? `
`
						: c.decode(u, { stream: !0 });
				;

			) {
				const l = d.indexOf(`
`);
				if (l === -1) break;
				const p = JSON.parse(d.slice(0, l));
				if (((d = d.slice(l + 1)), p.type === 'redirect')) return s(p);
				if (p.type === 'data')
					(p.nodes?.forEach((y) => {
						y?.type === 'data' && ((y.uses = kt(y.uses)), (y.data = f(y.data)));
					}),
						s(p));
				else if (p.type === 'chunk') {
					const { id: y, data: _, error: R } = p,
						E = i.get(y);
					(i.delete(y), R ? E.reject(f(R)) : E.fulfil(f(_)));
				}
			}
		}
	});
}
function kt(e) {
	return {
		dependencies: new Set(e?.dependencies ?? []),
		params: new Set(e?.params ?? []),
		parent: !!e?.parent,
		route: !!e?.route,
		url: !!e?.url,
		search_params: new Set(e?.search_params ?? [])
	};
}
let Le = !1;
function Te(e) {
	const t = document.querySelector('[autofocus]');
	if (t) t.focus();
	else {
		const n = Et(e);
		if (n && document.getElementById(n)) {
			const { x: a, y: s } = he();
			setTimeout(() => {
				const i = history.state;
				((Le = !0),
					location.replace(`#${n}`),
					v.hash && location.replace(e.hash),
					history.replaceState(i, '', e.hash),
					scrollTo(a, s),
					(Le = !1));
			});
		} else {
			const a = document.body,
				s = a.getAttribute('tabindex');
			((a.tabIndex = -1),
				a.focus({ preventScroll: !0, focusVisible: !1 }),
				s !== null ? a.setAttribute('tabindex', s) : a.removeAttribute('tabindex'));
		}
		const r = getSelection();
		if (r && r.type !== 'None') {
			const a = [];
			for (let s = 0; s < r.rangeCount; s += 1) a.push(r.getRangeAt(s));
			setTimeout(() => {
				if (r.rangeCount === a.length) {
					for (let s = 0; s < r.rangeCount; s += 1) {
						const i = a[s],
							o = r.getRangeAt(s);
						if (
							i.commonAncestorContainer !== o.commonAncestorContainer ||
							i.startContainer !== o.startContainer ||
							i.endContainer !== o.endContainer ||
							i.startOffset !== o.startOffset ||
							i.endOffset !== o.endOffset
						)
							return;
					}
					r.removeAllRanges();
				}
			});
		}
	}
}
function Ge(e, t, n, r) {
	let a, s;
	const i = new Promise((c, f) => {
		((a = c), (s = f));
	});
	return (
		i.catch(() => {}),
		{
			navigation: {
				from: { params: e.params, route: { id: e.route?.id ?? null }, url: e.url },
				to: n && { params: t?.params ?? null, route: { id: t?.route?.id ?? null }, url: n },
				willUnload: !t,
				type: r,
				complete: i
			},
			fulfil: a,
			reject: s
		}
	);
}
function me(e) {
	return {
		data: e.data,
		error: e.error,
		form: e.form,
		params: e.params,
		route: e.route,
		state: e.state,
		status: e.status,
		url: e.url
	};
}
function An(e) {
	const t = new URL(e);
	return ((t.hash = decodeURIComponent(e.hash)), t);
}
function Et(e) {
	let t;
	if (v.hash) {
		const [, , n] = e.hash.split('#', 3);
		t = n ?? '';
	} else t = e.hash.slice(1);
	return decodeURIComponent(t);
}
export {
	Jt as H,
	zt as N,
	Xt as P,
	Yt as U,
	Zt as a,
	I as b,
	Qt as c,
	In as d,
	Un as e,
	v as f,
	On as g,
	$n as h,
	jn as i,
	Pn as j,
	Cn as k,
	Rn as l,
	z as n,
	Nn as o,
	b as p,
	j as s
};
