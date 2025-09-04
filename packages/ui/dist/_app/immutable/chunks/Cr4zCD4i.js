import {
	x as F,
	z as N,
	A as V,
	J as w,
	u as a,
	I as f,
	ak as x,
	v as A,
	bc as T
} from './BW6z9EX9.js';
import { c as z } from './DzxQehGt.js';
import { o as m } from './DzGRxXYC.js';
import { M as Q } from './CNPipu-G.js';
const q = typeof window < 'u' ? window : void 0;
function U(t) {
	let e = t.activeElement;
	for (; e?.shadowRoot; ) {
		const r = e.shadowRoot.activeElement;
		if (r === e) break;
		e = r;
	}
	return e;
}
let X = class {
	#t;
	#e;
	constructor(e = {}) {
		const { window: r = q, document: n = r?.document } = e;
		r !== void 0 &&
			((this.#t = n),
			(this.#e = z((i) => {
				const s = m(r, 'focusin', i),
					o = m(r, 'focusout', i);
				return () => {
					(s(), o());
				};
			})));
	}
	get current() {
		return (this.#e?.(), this.#t ? U(this.#t) : null);
	}
};
new X();
function Z(t, e) {
	switch (t) {
		case 'post':
			N(e);
			break;
		case 'pre':
			F(e);
			break;
	}
}
function R(t, e, r, n = {}) {
	const { lazy: i = !1 } = n;
	let s = !i,
		o = Array.isArray(t) ? [] : void 0;
	Z(e, () => {
		const u = Array.isArray(t) ? t.map((d) => d()) : t();
		if (!s) {
			((s = !0), (o = u));
			return;
		}
		const l = V(() => r(u, o));
		return ((o = u), l);
	});
}
function M(t, e, r) {
	R(t, 'post', e, r);
}
function G(t, e, r) {
	R(t, 'pre', e, r);
}
M.pre = G;
function H(t, e) {
	switch (t) {
		case 'local':
			return e.localStorage;
		case 'session':
			return e.sessionStorage;
	}
}
class j {
	#t;
	#e;
	#n;
	#r;
	#s;
	#i = w(0);
	constructor(e, r, n = {}) {
		const {
			storage: i = 'local',
			serializer: s = { serialize: JSON.stringify, deserialize: JSON.parse },
			syncTabs: o = !0,
			window: u = q
		} = n;
		if (((this.#t = r), (this.#e = e), (this.#n = s), u === void 0)) return;
		const l = H(i, u);
		this.#r = l;
		const d = l.getItem(e);
		(d !== null ? (this.#t = this.#o(d)) : this.#c(r),
			o && i === 'local' && (this.#s = z(() => m(u, 'storage', this.#u))));
	}
	get current() {
		(this.#s?.(), a(this.#i));
		const e = this.#o(this.#r?.getItem(this.#e)) ?? this.#t,
			r = new WeakMap(),
			n = (i) => {
				if (i === null || i?.constructor.name === 'Date' || typeof i != 'object') return i;
				let s = r.get(i);
				return (
					s ||
						((s = new Proxy(i, {
							get: (o, u) => (a(this.#i), n(Reflect.get(o, u))),
							set: (o, u, l) => (f(this.#i, a(this.#i) + 1), Reflect.set(o, u, l), this.#c(e), !0)
						})),
						r.set(i, s)),
					s
				);
			};
		return n(e);
	}
	set current(e) {
		(this.#c(e), f(this.#i, a(this.#i) + 1));
	}
	#u = (e) => {
		e.key !== this.#e ||
			e.newValue === null ||
			((this.#t = this.#o(e.newValue)), f(this.#i, a(this.#i) + 1));
	};
	#o(e) {
		try {
			return this.#n.deserialize(e);
		} catch (r) {
			console.error(`Error when parsing "${e}" from persisted store "${this.#e}"`, r);
			return;
		}
	}
	#c(e) {
		try {
			e != null && this.#r?.setItem(this.#e, this.#n.serialize(e));
		} catch (r) {
			console.error(`Error when writing value from persisted store "${this.#e}" to ${this.#r}`, r);
		}
	}
}
function _(t) {
	return t.filter((e) => e.length > 0);
}
const C = { getItem: (t) => null, setItem: (t, e) => {} },
	p = typeof document < 'u';
function Y(t) {
	return typeof t == 'function';
}
function K(t) {
	return t !== null && typeof t == 'object';
}
const g = Symbol('box'),
	I = Symbol('is-writable');
function ee(t) {
	return K(t) && g in t;
}
function te(t) {
	return c.isBox(t) && I in t;
}
function c(t) {
	let e = w(x(t));
	return {
		[g]: !0,
		[I]: !0,
		get current() {
			return a(e);
		},
		set current(r) {
			f(e, r, !0);
		}
	};
}
function re(t, e) {
	const r = A(t);
	return e
		? {
				[g]: !0,
				[I]: !0,
				get current() {
					return a(r);
				},
				set current(n) {
					e(n);
				}
			}
		: {
				[g]: !0,
				get current() {
					return t();
				}
			};
}
function ne(t) {
	return c.isBox(t) ? t : Y(t) ? c.with(t) : c(t);
}
function ie(t) {
	return Object.entries(t).reduce(
		(e, [r, n]) =>
			c.isBox(n)
				? (c.isWritableBox(n)
						? Object.defineProperty(e, r, {
								get() {
									return n.current;
								},
								set(i) {
									n.current = i;
								}
							})
						: Object.defineProperty(e, r, {
								get() {
									return n.current;
								}
							}),
					e)
				: Object.assign(e, { [r]: n }),
		{}
	);
}
function se(t) {
	return c.isWritableBox(t)
		? {
				[g]: !0,
				get current() {
					return t.current;
				}
			}
		: t;
}
c.from = ne;
c.with = re;
c.flatten = ie;
c.readonly = se;
c.isBox = ee;
c.isWritableBox = te;
function oe(t, e) {
	const r = RegExp(t, 'g');
	return (n) => {
		if (typeof n != 'string')
			throw new TypeError(`expected an argument of type string, but got ${typeof n}`);
		return n.match(r) ? n.replace(r, e) : n;
	};
}
const ce = oe(/[A-Z]/, (t) => `-${t.toLowerCase()}`);
function ue(t) {
	if (!t || typeof t != 'object' || Array.isArray(t))
		throw new TypeError(`expected an argument of type object, but got ${typeof t}`);
	return Object.keys(t).map((e) => `${ce(e)}: ${t[e]};`).join(`
`);
}
function ae(t = {}) {
	return ue(t).replace(
		`
`,
		' '
	);
}
const le = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	borderWidth: '0',
	transform: 'translateX(-100%)'
};
ae(le);
const de = typeof window < 'u' ? window : void 0;
function fe(t) {
	let e = t.activeElement;
	for (; e?.shadowRoot; ) {
		const r = e.shadowRoot.activeElement;
		if (r === e) break;
		e = r;
	}
	return e;
}
class he {
	#t;
	#e;
	constructor(e = {}) {
		const { window: r = de, document: n = r?.document } = e;
		r !== void 0 &&
			((this.#t = n),
			(this.#e = z((i) => {
				const s = m(r, 'focusin', i),
					o = m(r, 'focusout', i);
				return () => {
					(s(), o());
				};
			})));
	}
	get current() {
		return (this.#e?.(), this.#t ? fe(this.#t) : null);
	}
}
new he();
const S = c('mode-watcher-mode'),
	E = c('mode-watcher-theme'),
	me = ['dark', 'light', 'system'];
function P(t) {
	return typeof t != 'string' ? !1 : me.includes(t);
}
class ge {
	#t = 'system';
	#e = p ? localStorage : C;
	#n = this.#e.getItem(S.current);
	#r = P(this.#n) ? this.#n : this.#t;
	#s = w(x(this.#i()));
	#i(e = this.#r) {
		return new j(S.current, e, {
			serializer: { serialize: (r) => r, deserialize: (r) => (P(r) ? r : this.#t) }
		});
	}
	constructor() {
		T(() =>
			M.pre(
				() => S.current,
				(e, r) => {
					const n = a(this.#s).current;
					(f(this.#s, this.#i(n), !0), r && localStorage.removeItem(r));
				}
			)
		);
	}
	get current() {
		return a(this.#s).current;
	}
	set current(e) {
		a(this.#s).current = e;
	}
}
class we {
	#t = void 0;
	#e = !0;
	#n = w(x(this.#t));
	#r =
		typeof window < 'u' && typeof window.matchMedia == 'function'
			? new Q('prefers-color-scheme: light')
			: { current: !1 };
	query() {
		p && f(this.#n, this.#r.current ? 'light' : 'dark', !0);
	}
	tracking(e) {
		this.#e = e;
	}
	constructor() {
		(T(() => {
			F(() => {
				this.#e && this.query();
			});
		}),
			(this.query = this.query.bind(this)),
			(this.tracking = this.tracking.bind(this)));
	}
	get current() {
		return a(this.#n);
	}
}
const k = new ge(),
	pe = new we();
class ye {
	#t = p ? localStorage : C;
	#e = this.#t.getItem(E.current);
	#n = this.#e === null || this.#e === void 0 ? '' : this.#e;
	#r = w(x(this.#s()));
	#s(e = this.#n) {
		return new j(E.current, e, {
			serializer: { serialize: (r) => (typeof r != 'string' ? '' : r), deserialize: (r) => r }
		});
	}
	constructor() {
		T(() =>
			M.pre(
				() => E.current,
				(e, r) => {
					const n = a(this.#r).current;
					(f(this.#r, this.#s(n), !0), r && localStorage.removeItem(r));
				}
			)
		);
	}
	get current() {
		return a(this.#r).current;
	}
	set current(e) {
		a(this.#r).current = e;
	}
}
const b = new ye();
let $,
	L,
	W = !1,
	h = null;
function be() {
	return (
		h ||
		((h = document.createElement('style')),
		h.appendChild(
			document.createTextNode(`* {
		-webkit-transition: none !important;
		-moz-transition: none !important;
		-o-transition: none !important;
		-ms-transition: none !important;
		transition: none !important;
	}`)
		),
		h)
	);
}
function O(t, e = !1) {
	if (typeof document > 'u') return;
	if (!W) {
		((W = !0), t());
		return;
	}
	if (typeof window < 'u' && window.__vitest_worker__) {
		t();
		return;
	}
	(clearTimeout($), clearTimeout(L));
	const n = be(),
		i = () => document.head.appendChild(n),
		s = () => {
			n.parentNode && document.head.removeChild(n);
		};
	function o() {
		(t(), window.requestAnimationFrame(s));
	}
	if (typeof window.requestAnimationFrame < 'u') {
		(i(),
			e
				? o()
				: window.requestAnimationFrame(() => {
						o();
					}));
		return;
	}
	(i(),
		($ = window.setTimeout(() => {
			(t(), (L = window.setTimeout(s, 16)));
		}, 16)));
}
const y = c(void 0),
	D = c(!0),
	J = c(!1),
	xe = c([]),
	Se = c([]);
function Ee() {
	const t = A(() => {
		if (!p) return;
		const e = k.current === 'system' ? pe.current : k.current,
			r = _(xe.current),
			n = _(Se.current);
		function i() {
			const s = document.documentElement,
				o = document.querySelector('meta[name="theme-color"]');
			e === 'light'
				? (r.length && s.classList.remove(...r),
					n.length && s.classList.add(...n),
					(s.style.colorScheme = 'light'),
					o && y.current && o.setAttribute('content', y.current.light))
				: (n.length && s.classList.remove(...n),
					r.length && s.classList.add(...r),
					(s.style.colorScheme = 'dark'),
					o && y.current && o.setAttribute('content', y.current.dark));
		}
		return (D.current ? O(i, J.current) : i(), e);
	});
	return {
		get current() {
			return a(t);
		}
	};
}
function ke() {
	const t = A(() => {
		if ((b.current, !p)) return;
		function e() {
			document.documentElement.setAttribute('data-theme', b.current);
		}
		return (
			D.current
				? O(
						e,
						V(() => J.current)
					)
				: e(),
			b.current
		);
	});
	return {
		get current() {
			return a(t);
		}
	};
}
const Be = Ee(),
	ve = ke();
function _e(t) {
	k.current = t;
}
function Pe(t) {
	b.current = t;
}
function $e(t) {
	return t;
}
function Le({
	defaultMode: t = 'system',
	themeColors: e,
	darkClassNames: r = ['dark'],
	lightClassNames: n = [],
	defaultTheme: i = '',
	modeStorageKey: s = 'mode-watcher-mode',
	themeStorageKey: o = 'mode-watcher-theme'
}) {
	const u = document.documentElement,
		l = localStorage.getItem(s) ?? t,
		d = localStorage.getItem(o) ?? i,
		B =
			l === 'light' ||
			(l === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
	if (
		(B
			? (r.length && u.classList.remove(...r.filter(Boolean)),
				n.length && u.classList.add(...n.filter(Boolean)))
			: (n.length && u.classList.remove(...n.filter(Boolean)),
				r.length && u.classList.add(...r.filter(Boolean))),
		(u.style.colorScheme = B ? 'light' : 'dark'),
		e)
	) {
		const v = document.querySelector('meta[name="theme-color"]');
		v && v.setAttribute('content', l === 'light' ? e.light : e.dark);
	}
	(d && (u.setAttribute('data-theme', d), localStorage.setItem(o, d)), localStorage.setItem(s, l));
}
export {
	Le as a,
	D as b,
	y as c,
	xe as d,
	J as e,
	Be as f,
	ve as g,
	$e as h,
	pe as i,
	P as j,
	Pe as k,
	Se as l,
	S as m,
	_e as s,
	E as t,
	k as u
};
