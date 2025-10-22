import {
	av as Pt,
	am as qe,
	M as _e,
	N as It,
	au as dr,
	y as W,
	x as i,
	C as k,
	aj as Oe,
	A as y,
	aF as At,
	p as T,
	h as S,
	a as _,
	w as q,
	b as d,
	c as N,
	f as P,
	t as te,
	H as ct,
	k as h,
	F as fr,
	s as O,
	j as Gr,
	P as Et,
	an as ce,
	u as L,
	o as Z,
	d as M,
	v as re,
	r as A,
	q as K,
	aG as Br,
	n as le,
	g as be,
	e as he,
	ar as Dr,
	aB as hr,
	Z as Y,
	z as B,
	a1 as Fr,
	m as zr,
	aH as Lr,
	aw as Kr,
	$ as mr,
	S as Me,
	aI as gr,
	aJ as Xt,
	ah as rt,
	Q as jr,
	a3 as vr,
	K as nt,
	J as bt,
	aK as qr,
	aL as Hr,
	a7 as Wr,
	T as Ur
} from '../chunks/ZGPguNnN.js';
import '../chunks/CU2VXAWn.js';
import {
	M as Jr,
	n as Xr,
	p as Qr,
	q as Yr,
	O as Zr,
	P as $r,
	c as en,
	d as Qt,
	e as tn,
	b as rn,
	i as nn,
	j as sn,
	k as on,
	f as an,
	l as ln,
	h as pr,
	m as cn,
	u as un,
	S as _r,
	r as br
} from '../chunks/C00SH7Uv.js';
import { B as dn } from '../chunks/XxJimDSk.js';
import { c as Q, B as Fe } from '../chunks/BBPflcbS.js';
import {
	N as fn,
	r as ue,
	a as C,
	u as se,
	k as me,
	O as hn,
	n as Mt,
	C as ut,
	q as Be,
	o as wr,
	E as mn,
	H as gn,
	g as vn,
	A as pn,
	Q as _n,
	R as bn,
	T as wn,
	f as yn,
	h as xn,
	U as Sn,
	V as Cn,
	W as kn,
	w as He,
	p as st,
	l as Yt,
	s as Se,
	S as Pn,
	m as yr,
	x as Zt
} from '../chunks/L9BR-Aao.js';
import { g as $t } from '../chunks/BqRgMCoP.js';
import { p as In } from '../chunks/BT0mVCPM.js';
import '../chunks/BzFm6CDa.js';
const xr = typeof window < 'u' ? window : void 0;
function An(o) {
	let e = o.activeElement;
	for (; e?.shadowRoot; ) {
		const t = e.shadowRoot.activeElement;
		if (t === e) break;
		e = t;
	}
	return e;
}
let En = class {
	#e;
	#t;
	constructor(e = {}) {
		const { window: t = xr, document: r = t?.document } = e;
		t !== void 0 &&
			((this.#e = r),
			(this.#t = Pt((n) => {
				const s = qe(t, 'focusin', n),
					a = qe(t, 'focusout', n);
				return () => {
					(s(), a());
				};
			})));
	}
	get current() {
		return (this.#t?.(), this.#e ? An(this.#e) : null);
	}
};
new En();
function Mn(o, e) {
	switch (o) {
		case 'post':
			It(e);
			break;
		case 'pre':
			_e(e);
			break;
	}
}
function Sr(o, e, t, r = {}) {
	const { lazy: n = !1 } = r;
	let s = !n,
		a = Array.isArray(o) ? [] : void 0;
	Mn(e, () => {
		const l = Array.isArray(o) ? o.map((u) => u()) : o();
		if (!s) {
			((s = !0), (a = l));
			return;
		}
		const c = dr(() => t(l, a));
		return ((a = l), c);
	});
}
function Ot(o, e, t) {
	Sr(o, 'post', e, t);
}
function On(o, e, t) {
	Sr(o, 'pre', e, t);
}
Ot.pre = On;
function Tn(o, e) {
	switch (o) {
		case 'local':
			return e.localStorage;
		case 'session':
			return e.sessionStorage;
	}
}
class Cr {
	#e;
	#t;
	#r;
	#n;
	#s;
	#o = W(0);
	constructor(e, t, r = {}) {
		const {
			storage: n = 'local',
			serializer: s = { serialize: JSON.stringify, deserialize: JSON.parse },
			syncTabs: a = !0,
			window: l = xr
		} = r;
		if (((this.#e = t), (this.#t = e), (this.#r = s), l === void 0)) return;
		const c = Tn(n, l);
		this.#n = c;
		const u = c.getItem(e);
		(u !== null ? (this.#e = this.#a(u)) : this.#c(t),
			a && n === 'local' && (this.#s = Pt(() => qe(l, 'storage', this.#i))));
	}
	get current() {
		(this.#s?.(), i(this.#o));
		const e = this.#a(this.#n?.getItem(this.#t)) ?? this.#e,
			t = new WeakMap(),
			r = (n) => {
				if (n === null || n?.constructor.name === 'Date' || typeof n != 'object') return n;
				let s = t.get(n);
				return (
					s ||
						((s = new Proxy(n, {
							get: (a, l) => (i(this.#o), r(Reflect.get(a, l))),
							set: (a, l, c) => (
								k(this.#o, i(this.#o) + 1),
								Reflect.set(a, l, c),
								this.#c(e),
								!0
							)
						})),
						t.set(n, s)),
					s
				);
			};
		return r(e);
	}
	set current(e) {
		(this.#c(e), k(this.#o, i(this.#o) + 1));
	}
	#i = (e) => {
		e.key !== this.#t ||
			e.newValue === null ||
			((this.#e = this.#a(e.newValue)), k(this.#o, i(this.#o) + 1));
	};
	#a(e) {
		try {
			return this.#r.deserialize(e);
		} catch (t) {
			console.error(`Error when parsing "${e}" from persisted store "${this.#t}"`, t);
			return;
		}
	}
	#c(e) {
		try {
			e != null && this.#n?.setItem(this.#t, this.#r.serialize(e));
		} catch (t) {
			console.error(
				`Error when writing value from persisted store "${this.#t}" to ${this.#n}`,
				t
			);
		}
	}
}
function er(o) {
	return o.filter((e) => e.length > 0);
}
const kr = { getItem: (o) => null, setItem: (o, e) => {} },
	Je = typeof document < 'u';
function Nn(o) {
	return typeof o == 'function';
}
function Vn(o) {
	return o !== null && typeof o == 'object';
}
const We = Symbol('box'),
	Tt = Symbol('is-writable');
function Rn(o) {
	return Vn(o) && We in o;
}
function Gn(o) {
	return $.isBox(o) && Tt in o;
}
function $(o) {
	let e = W(Oe(o));
	return {
		[We]: !0,
		[Tt]: !0,
		get current() {
			return i(e);
		},
		set current(t) {
			k(e, t, !0);
		}
	};
}
function Bn(o, e) {
	const t = y(o);
	return e
		? {
				[We]: !0,
				[Tt]: !0,
				get current() {
					return i(t);
				},
				set current(r) {
					e(r);
				}
			}
		: {
				[We]: !0,
				get current() {
					return o();
				}
			};
}
function Dn(o) {
	return $.isBox(o) ? o : Nn(o) ? $.with(o) : $(o);
}
function Fn(o) {
	return Object.entries(o).reduce(
		(e, [t, r]) =>
			$.isBox(r)
				? ($.isWritableBox(r)
						? Object.defineProperty(e, t, {
								get() {
									return r.current;
								},
								set(n) {
									r.current = n;
								}
							})
						: Object.defineProperty(e, t, {
								get() {
									return r.current;
								}
							}),
					e)
				: Object.assign(e, { [t]: r }),
		{}
	);
}
function zn(o) {
	return $.isWritableBox(o)
		? {
				[We]: !0,
				get current() {
					return o.current;
				}
			}
		: o;
}
$.from = Dn;
$.with = Bn;
$.flatten = Fn;
$.readonly = zn;
$.isBox = Rn;
$.isWritableBox = Gn;
function Ln(o, e) {
	const t = RegExp(o, 'g');
	return (r) => {
		if (typeof r != 'string')
			throw new TypeError(`expected an argument of type string, but got ${typeof r}`);
		return r.match(t) ? r.replace(t, e) : r;
	};
}
const Kn = Ln(/[A-Z]/, (o) => `-${o.toLowerCase()}`);
function jn(o) {
	if (!o || typeof o != 'object' || Array.isArray(o))
		throw new TypeError(`expected an argument of type object, but got ${typeof o}`);
	return Object.keys(o).map((e) => `${Kn(e)}: ${o[e]};`).join(`
`);
}
function qn(o = {}) {
	return jn(o).replace(
		`
`,
		' '
	);
}
const Hn = {
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
qn(Hn);
const Wn = typeof window < 'u' ? window : void 0;
function Un(o) {
	let e = o.activeElement;
	for (; e?.shadowRoot; ) {
		const t = e.shadowRoot.activeElement;
		if (t === e) break;
		e = t;
	}
	return e;
}
class Jn {
	#e;
	#t;
	constructor(e = {}) {
		const { window: t = Wn, document: r = t?.document } = e;
		t !== void 0 &&
			((this.#e = r),
			(this.#t = Pt((n) => {
				const s = qe(t, 'focusin', n),
					a = qe(t, 'focusout', n);
				return () => {
					(s(), a());
				};
			})));
	}
	get current() {
		return (this.#t?.(), this.#e ? Un(this.#e) : null);
	}
}
new Jn();
const Ae = $('mode-watcher-mode'),
	Ee = $('mode-watcher-theme'),
	Xn = ['dark', 'light', 'system'];
function wt(o) {
	return typeof o != 'string' ? !1 : Xn.includes(o);
}
class Qn {
	#e = 'system';
	#t = Je ? localStorage : kr;
	#r = this.#t.getItem(Ae.current);
	#n = wt(this.#r) ? this.#r : this.#e;
	#s = W(Oe(this.#o()));
	#o(e = this.#n) {
		return new Cr(Ae.current, e, {
			serializer: { serialize: (t) => t, deserialize: (t) => (wt(t) ? t : this.#e) }
		});
	}
	constructor() {
		At(() =>
			Ot.pre(
				() => Ae.current,
				(e, t) => {
					const r = i(this.#s).current;
					(k(this.#s, this.#o(r), !0), t && localStorage.removeItem(t));
				}
			)
		);
	}
	get current() {
		return i(this.#s).current;
	}
	set current(e) {
		i(this.#s).current = e;
	}
}
class Yn {
	#e = void 0;
	#t = !0;
	#r = W(Oe(this.#e));
	#n =
		typeof window < 'u' && typeof window.matchMedia == 'function'
			? new Jr('prefers-color-scheme: light')
			: { current: !1 };
	query() {
		Je && k(this.#r, this.#n.current ? 'light' : 'dark', !0);
	}
	tracking(e) {
		this.#t = e;
	}
	constructor() {
		(At(() => {
			_e(() => {
				this.#t && this.query();
			});
		}),
			(this.query = this.query.bind(this)),
			(this.tracking = this.tracking.bind(this)));
	}
	get current() {
		return i(this.#r);
	}
}
const ot = new Qn(),
	yt = new Yn();
class Zn {
	#e = Je ? localStorage : kr;
	#t = this.#e.getItem(Ee.current);
	#r = this.#t === null || this.#t === void 0 ? '' : this.#t;
	#n = W(Oe(this.#s()));
	#s(e = this.#r) {
		return new Cr(Ee.current, e, {
			serializer: { serialize: (t) => (typeof t != 'string' ? '' : t), deserialize: (t) => t }
		});
	}
	constructor() {
		At(() =>
			Ot.pre(
				() => Ee.current,
				(e, t) => {
					const r = i(this.#n).current;
					(k(this.#n, this.#s(r), !0), t && localStorage.removeItem(t));
				}
			)
		);
	}
	get current() {
		return i(this.#n).current;
	}
	set current(e) {
		i(this.#n).current = e;
	}
}
const tt = new Zn();
let tr,
	rr,
	nr = !1,
	je = null;
function $n() {
	return (
		je ||
		((je = document.createElement('style')),
		je.appendChild(
			document.createTextNode(`* {
		-webkit-transition: none !important;
		-moz-transition: none !important;
		-o-transition: none !important;
		-ms-transition: none !important;
		transition: none !important;
	}`)
		),
		je)
	);
}
function Pr(o, e = !1) {
	if (typeof document > 'u') return;
	if (!nr) {
		((nr = !0), o());
		return;
	}
	if (typeof window < 'u' && window.__vitest_worker__) {
		o();
		return;
	}
	(clearTimeout(tr), clearTimeout(rr));
	const r = $n(),
		n = () => document.head.appendChild(r),
		s = () => {
			r.parentNode && document.head.removeChild(r);
		};
	function a() {
		(o(), window.requestAnimationFrame(s));
	}
	if (typeof window.requestAnimationFrame < 'u') {
		(n(),
			e
				? a()
				: window.requestAnimationFrame(() => {
						a();
					}));
		return;
	}
	(n(),
		(tr = window.setTimeout(() => {
			(o(), (rr = window.setTimeout(s, 16)));
		}, 16)));
}
const xe = $(void 0),
	at = $(!0),
	it = $(!1),
	xt = $([]),
	St = $([]);
function es() {
	const o = y(() => {
		if (!Je) return;
		const e = ot.current === 'system' ? yt.current : ot.current,
			t = er(xt.current),
			r = er(St.current);
		function n() {
			const s = document.documentElement,
				a = document.querySelector('meta[name="theme-color"]');
			e === 'light'
				? (t.length && s.classList.remove(...t),
					r.length && s.classList.add(...r),
					(s.style.colorScheme = 'light'),
					a && xe.current && a.setAttribute('content', xe.current.light))
				: (r.length && s.classList.remove(...r),
					t.length && s.classList.add(...t),
					(s.style.colorScheme = 'dark'),
					a && xe.current && a.setAttribute('content', xe.current.dark));
		}
		return (at.current ? Pr(n, it.current) : n(), e);
	});
	return {
		get current() {
			return i(o);
		}
	};
}
function ts() {
	const o = y(() => {
		if ((tt.current, !Je)) return;
		function e() {
			document.documentElement.setAttribute('data-theme', tt.current);
		}
		return (
			at.current
				? Pr(
						e,
						dr(() => it.current)
					)
				: e(),
			tt.current
		);
	});
	return {
		get current() {
			return i(o);
		}
	};
}
const lt = es(),
	rs = ts();
function ns() {
	ot.current = lt.current === 'dark' ? 'light' : 'dark';
}
function ss(o) {
	ot.current = o;
}
function os(o) {
	tt.current = o;
}
function as({
	defaultMode: o = 'system',
	themeColors: e,
	darkClassNames: t = ['dark'],
	lightClassNames: r = [],
	defaultTheme: n = '',
	modeStorageKey: s = 'mode-watcher-mode',
	themeStorageKey: a = 'mode-watcher-theme'
}) {
	const l = document.documentElement,
		c = localStorage.getItem(s) ?? o,
		u = localStorage.getItem(a) ?? n,
		g =
			c === 'light' ||
			(c === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
	if (
		(g
			? (t.length && l.classList.remove(...t.filter(Boolean)),
				r.length && l.classList.add(...r.filter(Boolean)))
			: (r.length && l.classList.remove(...r.filter(Boolean)),
				t.length && l.classList.add(...t.filter(Boolean))),
		(l.style.colorScheme = g ? 'light' : 'dark'),
		e)
	) {
		const v = document.querySelector('meta[name="theme-color"]');
		v && v.setAttribute('content', c === 'light' ? e.light : e.dark);
	}
	(u && (l.setAttribute('data-theme', u), localStorage.setItem(a, u)),
		localStorage.setItem(s, c));
}
var is = P('<meta name="theme-color"/>');
function ls(o, e) {
	T(e, !0);
	var t = S(),
		r = _(t);
	{
		var n = (s) => {
			var a = is();
			(te(() => ct(a, 'content', e.themeColors.dark)), d(s, a));
		};
		q(r, (s) => {
			e.themeColors && s(n);
		});
	}
	(d(o, t), N());
}
var cs = P('<meta name="theme-color"/>'),
	us = P('<!> <!>', 1);
function ds(o, e) {
	T(e, !0);
	let t = h(e, 'trueNonce', 3, '');
	(fr((r) => {
		var n = us(),
			s = _(n);
		{
			var a = (c) => {
				var u = cs();
				(te(() => ct(u, 'content', e.themeColors.dark)), d(c, u));
			};
			q(s, (c) => {
				e.themeColors && c(a);
			});
		}
		var l = O(s, 2);
		(Gr(
			l,
			() =>
				`<script${t() ? ` nonce=${t()}` : ''}>(` +
				as.toString() +
				')(' +
				JSON.stringify(e.initConfig) +
				');<\/script>'
		),
			d(r, n));
	}),
		N());
}
function fs(o, e) {
	T(e, !0);
	let t = h(e, 'track', 3, !0),
		r = h(e, 'defaultMode', 3, 'system'),
		n = h(e, 'disableTransitions', 3, !0),
		s = h(e, 'darkClassNames', 19, () => ['dark']),
		a = h(e, 'lightClassNames', 19, () => []),
		l = h(e, 'defaultTheme', 3, ''),
		c = h(e, 'nonce', 3, ''),
		u = h(e, 'themeStorageKey', 3, 'mode-watcher-theme'),
		g = h(e, 'modeStorageKey', 3, 'mode-watcher-mode'),
		v = h(e, 'disableHeadScriptInjection', 3, !1),
		b = h(e, 'synchronousModeChanges', 3, !1);
	((Ae.current = g()),
		(Ee.current = u()),
		(xt.current = s()),
		(St.current = a()),
		(at.current = n()),
		(xe.current = e.themeColors),
		(it.current = b()),
		_e(() => {
			it.current = b();
		}),
		_e(() => {
			at.current = n();
		}),
		_e(() => {
			xe.current = e.themeColors;
		}),
		_e(() => {
			xt.current = s();
		}),
		_e(() => {
			St.current = a();
		}),
		_e(() => {
			Ae.current = g();
		}),
		_e(() => {
			Ee.current = u();
		}),
		_e(() => {
			(lt.current, Ae.current, Ee.current, rs.current);
		}),
		Et(() => {
			(yt.tracking(t()), yt.query());
			const I = localStorage.getItem(Ae.current);
			ss(wt(I) ? I : r());
			const U = localStorage.getItem(Ee.current);
			os(U || l());
		}));
	const p = {
			defaultMode: r(),
			themeColors: e.themeColors,
			darkClassNames: s(),
			lightClassNames: a(),
			defaultTheme: l(),
			modeStorageKey: g(),
			themeStorageKey: u()
		},
		m = y(() => (typeof window > 'u' ? c() : ''));
	var f = S(),
		w = _(f);
	{
		var x = (I) => {
				ls(I, {
					get themeColors() {
						return xe.current;
					}
				});
			},
			E = (I) => {
				ds(I, {
					get trueNonce() {
						return i(m);
					},
					get initConfig() {
						return p;
					},
					get themeColors() {
						return xe.current;
					}
				});
			};
		q(w, (I) => {
			v() ? I(x) : I(E, !1);
		});
	}
	(d(o, f), N());
}
const Ir = {
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
fn(Ir);
var hs = P('<button><!></button>');
function ms(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'disabled', 3, !1),
		a = K(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'children', 'child', 'disabled']);
	const l = Xr.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(p) => n(p)
			),
			disabled: C(() => !!s())
		}),
		c = y(() => se(a, l.props));
	var u = S(),
		g = _(u);
	{
		var v = (p) => {
				var m = S(),
					f = _(m);
				(L(
					f,
					() => e.child,
					() => ({ props: i(c) })
				),
					d(p, m));
			},
			b = (p) => {
				var m = hs();
				Z(m, () => ({ ...i(c) }));
				var f = M(m);
				(L(f, () => e.children ?? re), A(m), d(p, m));
			};
		q(g, (p) => {
			e.child ? p(v) : p(b, !1);
		});
	}
	(d(o, u), N());
}
const gs = Mt({ component: 'separator', parts: ['root'] });
class Nt {
	static create(e) {
		return new Nt(e);
	}
	opts;
	attachment;
	constructor(e) {
		((this.opts = e), (this.attachment = me(e.ref)));
	}
	#e = y(() => ({
		id: this.opts.id.current,
		role: this.opts.decorative.current ? 'none' : 'separator',
		'aria-orientation': this.opts.orientation.current,
		'aria-hidden': hn(this.opts.decorative.current),
		'data-orientation': this.opts.orientation.current,
		[gs.root]: '',
		...this.attachment
	}));
	get props() {
		return i(this.#e);
	}
	set props(e) {
		k(this.#e, e);
	}
}
var vs = P('<div><!></div>');
function ps(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'decorative', 3, !1),
		a = h(e, 'orientation', 3, 'horizontal'),
		l = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'child',
			'children',
			'decorative',
			'orientation'
		]);
	const c = Nt.create({
			ref: C(
				() => n(),
				(m) => n(m)
			),
			id: C(() => r()),
			decorative: C(() => s()),
			orientation: C(() => a())
		}),
		u = y(() => se(l, c.props));
	var g = S(),
		v = _(g);
	{
		var b = (m) => {
				var f = S(),
					w = _(f);
				(L(
					w,
					() => e.child,
					() => ({ props: i(u) })
				),
					d(m, f));
			},
			p = (m) => {
				var f = vs();
				Z(f, () => ({ ...i(u) }));
				var w = M(f);
				(L(w, () => e.children ?? re), A(f), d(m, f));
			};
		q(v, (m) => {
			e.child ? m(b) : m(p, !1);
		});
	}
	(d(o, g), N());
}
function _s(o, e) {
	let t = o.nextElementSibling;
	for (; t; ) {
		if (t.matches(e)) return t;
		t = t.nextElementSibling;
	}
}
function bs(o, e) {
	let t = o.previousElementSibling;
	for (; t; ) {
		if (t.matches(e)) return t;
		t = t.previousElementSibling;
	}
}
function Ar(o) {
	if (typeof CSS < 'u' && typeof CSS.escape == 'function') return CSS.escape(o);
	const e = o.length;
	let t = -1,
		r,
		n = '';
	const s = o.charCodeAt(0);
	if (e === 1 && s === 45) return '\\' + o;
	for (; ++t < e; ) {
		if (((r = o.charCodeAt(t)), r === 0)) {
			n += '�';
			continue;
		}
		if (
			(r >= 1 && r <= 31) ||
			r === 127 ||
			(t === 0 && r >= 48 && r <= 57) ||
			(t === 1 && r >= 48 && r <= 57 && s === 45)
		) {
			n += '\\' + r.toString(16) + ' ';
			continue;
		}
		if (
			r >= 128 ||
			r === 45 ||
			r === 95 ||
			(r >= 48 && r <= 57) ||
			(r >= 65 && r <= 90) ||
			(r >= 97 && r <= 122)
		) {
			n += o.charAt(t);
			continue;
		}
		n += '\\' + o.charAt(t);
	}
	return n;
}
const Ie = 'data-value',
	oe = Mt({
		component: 'command',
		parts: [
			'root',
			'list',
			'input',
			'separator',
			'loading',
			'empty',
			'group',
			'group-items',
			'group-heading',
			'item',
			'viewport',
			'input-label'
		]
	}),
	De = oe.selector('group'),
	mt = oe.selector('group-items'),
	sr = oe.selector('group-heading'),
	Er = oe.selector('item'),
	gt = `${oe.selector('item')}:not([aria-disabled="true"])`,
	Te = new ut('Command.Root'),
	ws = new ut('Command.List'),
	Ue = new ut('Command.Group'),
	or = { search: '', value: '', filtered: { count: 0, items: new Map(), groups: new Set() } };
class Vt {
	static create(e) {
		return Te.set(new Vt(e));
	}
	opts;
	attachment;
	#e = !1;
	#t = !0;
	sortAfterTick = !1;
	sortAndFilterAfterTick = !1;
	allItems = new Set();
	allGroups = new Map();
	allIds = new Map();
	#r = W(0);
	get key() {
		return i(this.#r);
	}
	set key(e) {
		k(this.#r, e, !0);
	}
	#n = W(null);
	get viewportNode() {
		return i(this.#n);
	}
	set viewportNode(e) {
		k(this.#n, e, !0);
	}
	#s = W(null);
	get inputNode() {
		return i(this.#s);
	}
	set inputNode(e) {
		k(this.#s, e, !0);
	}
	#o = W(null);
	get labelNode() {
		return i(this.#o);
	}
	set labelNode(e) {
		k(this.#o, e, !0);
	}
	#i = W(or);
	get commandState() {
		return i(this.#i);
	}
	set commandState(e) {
		k(this.#i, e);
	}
	#a = W(Oe(or));
	get _commandState() {
		return i(this.#a);
	}
	set _commandState(e) {
		k(this.#a, e, !0);
	}
	#c() {
		return Br(this._commandState);
	}
	#m() {
		this.#e ||
			((this.#e = !0),
			Be(() => {
				this.#e = !1;
				const e = this.#c();
				!Object.is(this.commandState, e) &&
					((this.commandState = e), this.opts.onStateChange?.current?.(e));
			}));
	}
	setState(e, t, r) {
		Object.is(this._commandState[e], t) ||
			((this._commandState[e] = t),
			e === 'search' ? (this.#p(), this.#g()) : e === 'value' && (r || this.#k()),
			this.#m());
	}
	constructor(e) {
		((this.opts = e), (this.attachment = me(this.opts.ref)));
		const t = { ...this._commandState, value: this.opts.value.current ?? '' };
		((this._commandState = t),
			(this.commandState = t),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	#_(e, t) {
		const r = this.opts.filter.current ?? Or;
		return e ? r(e, this._commandState.search, t) : 0;
	}
	#g() {
		if (!this._commandState.search || this.opts.shouldFilter.current === !1) {
			this.#v();
			return;
		}
		const e = this._commandState.filtered.items,
			t = [];
		for (const a of this._commandState.filtered.groups) {
			const l = this.allGroups.get(a);
			let c = 0;
			if (!l) {
				t.push([a, c]);
				continue;
			}
			for (const u of l) {
				const g = e.get(u);
				c = Math.max(g ?? 0, c);
			}
			t.push([a, c]);
		}
		const r = this.viewportNode,
			n = this.getValidItems().sort((a, l) => {
				const c = a.getAttribute('data-value'),
					u = l.getAttribute('data-value'),
					g = e.get(c) ?? 0;
				return (e.get(u) ?? 0) - g;
			});
		for (const a of n) {
			const l = a.closest(mt);
			if (l) {
				const c = a.parentElement === l ? a : a.closest(`${mt} > *`);
				c && l.appendChild(c);
			} else {
				const c = a.parentElement === r ? a : a.closest(`${mt} > *`);
				c && r?.appendChild(c);
			}
		}
		const s = t.sort((a, l) => l[1] - a[1]);
		for (const a of s) {
			const l = r?.querySelector(`${De}[${Ie}="${Ar(a[0])}"]`);
			l?.parentElement?.appendChild(l);
		}
		this.#v();
	}
	setValue(e, t) {
		(e !== this.opts.value.current &&
			e === '' &&
			Be(() => {
				this.key++;
			}),
			this.setState('value', e, t),
			(this.opts.value.current = e));
	}
	#v() {
		Be(() => {
			const t = this.getValidItems()
					.find((n) => n.getAttribute('aria-disabled') !== 'true')
					?.getAttribute(Ie),
				r = this.#t && this.opts.disableInitialScroll.current;
			(this.setValue(t ?? '', r), (this.#t = !1));
		});
	}
	#p() {
		if (!this._commandState.search || this.opts.shouldFilter.current === !1) {
			this._commandState.filtered.count = this.allItems.size;
			return;
		}
		this._commandState.filtered.groups = new Set();
		let e = 0;
		for (const t of this.allItems) {
			const r = this.allIds.get(t)?.value ?? '',
				n = this.allIds.get(t)?.keywords ?? [],
				s = this.#_(r, n);
			(this._commandState.filtered.items.set(t, s), s > 0 && e++);
		}
		for (const [t, r] of this.allGroups)
			for (const n of r) {
				const s = this._commandState.filtered.items.get(n);
				if (s && s > 0) {
					this._commandState.filtered.groups.add(t);
					break;
				}
			}
		this._commandState.filtered.count = e;
	}
	getValidItems() {
		const e = this.opts.ref.current;
		return e ? Array.from(e.querySelectorAll(gt)).filter((r) => !!r) : [];
	}
	getVisibleItems() {
		const e = this.opts.ref.current;
		return e ? Array.from(e.querySelectorAll(Er)).filter((r) => !!r) : [];
	}
	get itemsGrid() {
		if (!this.isGrid) return [];
		const e = this.opts.columns.current ?? 1,
			t = this.getVisibleItems(),
			r = [[]];
		let n = t[0]?.getAttribute('data-group'),
			s = 0,
			a = 0;
		for (let l = 0; l < t.length; l++) {
			const c = t[l],
				u = c?.getAttribute('data-group');
			n !== u
				? ((n = u), (s = 1), a++, r.push([{ index: l, firstRowOfGroup: !0, ref: c }]))
				: (s++,
					s > e && (a++, (s = 1), r.push([])),
					r[a]?.push({
						index: l,
						firstRowOfGroup: r[a]?.[0]?.firstRowOfGroup ?? l === 0,
						ref: c
					}));
		}
		return r;
	}
	#l() {
		const e = this.opts.ref.current;
		if (!e) return;
		const t = e.querySelector(`${gt}[data-selected]`);
		if (t) return t;
	}
	#k() {
		Be(() => {
			const e = this.#l();
			if (!e) return;
			const t = e.parentElement?.parentElement;
			if (t) {
				if (this.isGrid) {
					const r = this.#P(e);
					if ((e.scrollIntoView({ block: 'nearest' }), r)) {
						e?.closest(De)?.querySelector(sr)?.scrollIntoView({ block: 'nearest' });
						return;
					}
				} else {
					const r = Qr(t);
					if (r && r.dataset?.value === e.dataset?.value) {
						e?.closest(De)?.querySelector(sr)?.scrollIntoView({ block: 'nearest' });
						return;
					}
				}
				e.scrollIntoView({ block: 'nearest' });
			}
		});
	}
	#P(e) {
		const t = this.itemsGrid;
		if (t.length === 0) return !1;
		for (let r = 0; r < t.length; r++) {
			const n = t[r];
			if (n !== void 0)
				for (let s = 0; s < n.length; s++) {
					const a = n[s];
					if (!(a === void 0 || a.ref !== e)) return a.firstRowOfGroup;
				}
		}
		return !1;
	}
	updateSelectedToIndex(e) {
		const t = this.getValidItems()[e];
		t && this.setValue(t.getAttribute(Ie) ?? '');
	}
	updateSelectedByItem(e) {
		const t = this.#l(),
			r = this.getValidItems(),
			n = r.findIndex((a) => a === t);
		let s = r[n + e];
		(this.opts.loop.current &&
			(s = n + e < 0 ? r[r.length - 1] : n + e === r.length ? r[0] : r[n + e]),
			s && this.setValue(s.getAttribute(Ie) ?? ''));
	}
	updateSelectedByGroup(e) {
		let r = this.#l()?.closest(De),
			n;
		for (; r && !n; ) ((r = e > 0 ? _s(r, De) : bs(r, De)), (n = r?.querySelector(gt)));
		n ? this.setValue(n.getAttribute(Ie) ?? '') : this.updateSelectedByItem(e);
	}
	registerValue(e, t) {
		return (
			(e && e === this.allIds.get(e)?.value) || this.allIds.set(e, { value: e, keywords: t }),
			this._commandState.filtered.items.set(e, this.#_(e, t)),
			this.sortAfterTick ||
				((this.sortAfterTick = !0),
				Be(() => {
					(this.#g(), (this.sortAfterTick = !1));
				})),
			() => {
				this.allIds.delete(e);
			}
		);
	}
	registerItem(e, t) {
		return (
			this.allItems.add(e),
			t &&
				(this.allGroups.has(t)
					? this.allGroups.get(t).add(e)
					: this.allGroups.set(t, new Set([e]))),
			this.sortAndFilterAfterTick ||
				((this.sortAndFilterAfterTick = !0),
				Be(() => {
					(this.#p(), this.#g(), (this.sortAndFilterAfterTick = !1));
				})),
			this.#m(),
			() => {
				const r = this.#l();
				(this.allItems.delete(e),
					this.commandState.filtered.items.delete(e),
					this.#p(),
					r?.getAttribute('id') === e && this.#v(),
					this.#m());
			}
		);
	}
	registerGroup(e) {
		return (
			this.allGroups.has(e) || this.allGroups.set(e, new Set()),
			() => {
				(this.allIds.delete(e), this.allGroups.delete(e));
			}
		);
	}
	get isGrid() {
		return this.opts.columns.current !== null;
	}
	#b() {
		return this.updateSelectedToIndex(this.getValidItems().length - 1);
	}
	#u(e) {
		(e.preventDefault(),
			e.metaKey
				? this.#b()
				: e.altKey
					? this.updateSelectedByGroup(1)
					: this.updateSelectedByItem(1));
	}
	#w(e) {
		this.opts.columns.current !== null &&
			(e.preventDefault(),
			e.metaKey ? this.updateSelectedByGroup(1) : this.updateSelectedByItem(this.#I(e)));
	}
	#y(e, t) {
		if (t.length === 0) return null;
		for (let r = 0; r < t.length; r++) {
			const n = t[r];
			if (n !== void 0)
				for (let s = 0; s < n.length; s++) {
					const a = n[s];
					if (!(a === void 0 || a.ref !== e)) return { columnIndex: s, rowIndex: r };
				}
		}
		return null;
	}
	#I(e) {
		const t = this.itemsGrid,
			r = this.#l();
		if (!r) return 0;
		const n = this.#y(r, t);
		if (!n) return 0;
		let s = null;
		const a = e.altKey ? 1 : 0;
		if (e.altKey && n.rowIndex === t.length - 2 && !this.opts.loop.current)
			s = this.#d({
				start: t.length - 1,
				end: t.length,
				expectedColumnIndex: n.columnIndex,
				grid: t
			});
		else if (n.rowIndex === t.length - 1) {
			if (!this.opts.loop.current) return 0;
			s = this.#d({
				start: 0 + a,
				end: n.rowIndex,
				expectedColumnIndex: n.columnIndex,
				grid: t
			});
		} else
			((s = this.#d({
				start: n.rowIndex + 1 + a,
				end: t.length,
				expectedColumnIndex: n.columnIndex,
				grid: t
			})),
				s === null &&
					this.opts.loop.current &&
					(s = this.#d({
						start: 0,
						end: n.rowIndex,
						expectedColumnIndex: n.columnIndex,
						grid: t
					})));
		return this.#x(r, s);
	}
	#d({ start: e, end: t, grid: r, expectedColumnIndex: n }) {
		let s = null;
		for (let a = e; a < t; a++) {
			const l = r[a];
			if (((s = l[n]?.ref ?? null), s !== null && et(s))) {
				s = null;
				continue;
			}
			if (s === null)
				for (let c = l.length - 1; c >= 0; c--) {
					const u = l[l.length - 1];
					if (!(u === void 0 || et(u.ref))) {
						s = u.ref;
						break;
					}
				}
			break;
		}
		return s;
	}
	#x(e, t) {
		if (t === null) return 0;
		const r = this.getValidItems(),
			n = r.findIndex((a) => a === e);
		return r.findIndex((a) => a === t) - n;
	}
	#S(e) {
		this.opts.columns.current !== null &&
			(e.preventDefault(),
			e.metaKey ? this.updateSelectedByGroup(-1) : this.updateSelectedByItem(this.#A(e)));
	}
	#A(e) {
		const t = this.itemsGrid,
			r = this.#l();
		if (r === void 0) return 0;
		const n = this.#y(r, t);
		if (n === null) return 0;
		let s = null;
		const a = e.altKey ? 1 : 0;
		if (e.altKey && n.rowIndex === 1 && this.opts.loop.current === !1)
			s = this.#f({ start: 0, end: 0, expectedColumnIndex: n.columnIndex, grid: t });
		else if (n.rowIndex === 0) {
			if (this.opts.loop.current === !1) return 0;
			s = this.#f({
				start: t.length - 1 - a,
				end: n.rowIndex + 1,
				expectedColumnIndex: n.columnIndex,
				grid: t
			});
		} else
			((s = this.#f({
				start: n.rowIndex - 1 - a,
				end: 0,
				expectedColumnIndex: n.columnIndex,
				grid: t
			})),
				s === null &&
					this.opts.loop.current &&
					(s = this.#f({
						start: t.length - 1,
						end: n.rowIndex + 1,
						expectedColumnIndex: n.columnIndex,
						grid: t
					})));
		return this.#x(r, s);
	}
	#f({ start: e, end: t, grid: r, expectedColumnIndex: n }) {
		let s = null;
		for (let a = e; a >= t; a--) {
			const l = r[a];
			if (l !== void 0) {
				if (((s = l[n]?.ref ?? null), s !== null && et(s))) {
					s = null;
					continue;
				}
				if (s === null)
					for (let c = l.length - 1; c >= 0; c--) {
						const u = l[l.length - 1];
						if (!(u === void 0 || et(u.ref))) {
							s = u.ref;
							break;
						}
					}
				break;
			}
		}
		return s;
	}
	#h(e) {
		(e.preventDefault(),
			e.metaKey
				? this.updateSelectedToIndex(0)
				: e.altKey
					? this.updateSelectedByGroup(-1)
					: this.updateSelectedByItem(-1));
	}
	onkeydown(e) {
		const t = this.opts.vimBindings.current && e.ctrlKey;
		switch (e.key) {
			case kn:
			case Cn: {
				t && (this.isGrid ? this.#w(e) : this.#u(e));
				break;
			}
			case Sn: {
				t && this.isGrid && this.#u(e);
				break;
			}
			case xn:
				this.isGrid ? this.#w(e) : this.#u(e);
				break;
			case yn:
				if (!this.isGrid) break;
				this.#u(e);
				break;
			case wn:
			case bn: {
				t && (this.isGrid ? this.#S(e) : this.#h(e));
				break;
			}
			case _n: {
				t && this.isGrid && this.#h(e);
				break;
			}
			case pn:
				this.isGrid ? this.#S(e) : this.#h(e);
				break;
			case vn:
				if (!this.isGrid) break;
				this.#h(e);
				break;
			case gn:
				(e.preventDefault(), this.updateSelectedToIndex(0));
				break;
			case mn:
				(e.preventDefault(), this.#b());
				break;
			case wr:
				if (!e.isComposing && e.keyCode !== 229) {
					e.preventDefault();
					const r = this.#l();
					r && r?.click();
				}
		}
	}
	#C = y(() => ({
		id: this.opts.id.current,
		role: 'application',
		[oe.root]: '',
		tabindex: -1,
		onkeydown: this.onkeydown,
		...this.attachment
	}));
	get props() {
		return i(this.#C);
	}
	set props(e) {
		k(this.#C, e);
	}
}
function et(o) {
	return o.getAttribute('aria-disabled') === 'true';
}
class Rt {
	static create(e) {
		return new Rt(e, Te.get());
	}
	opts;
	root;
	attachment;
	#e = y(
		() =>
			(this.root._commandState.filtered.count === 0 && this.#t === !1) ||
			this.opts.forceMount.current
	);
	get shouldRender() {
		return i(this.#e);
	}
	set shouldRender(e) {
		k(this.#e, e);
	}
	#t = !0;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref)),
			_e(() => {
				this.#t = !1;
			}));
	}
	#r = y(() => ({
		id: this.opts.id.current,
		role: 'presentation',
		[oe.empty]: '',
		...this.attachment
	}));
	get props() {
		return i(this.#r);
	}
	set props(e) {
		k(this.#r, e);
	}
}
class Gt {
	static create(e) {
		return Ue.set(new Gt(e, Te.get()));
	}
	opts;
	root;
	attachment;
	#e = y(() =>
		this.opts.forceMount.current ||
		this.root.opts.shouldFilter.current === !1 ||
		!this.root.commandState.search
			? !0
			: this.root._commandState.filtered.groups.has(this.trueValue)
	);
	get shouldRender() {
		return i(this.#e);
	}
	set shouldRender(e) {
		k(this.#e, e);
	}
	#t = W(null);
	get headingNode() {
		return i(this.#t);
	}
	set headingNode(e) {
		k(this.#t, e, !0);
	}
	#r = W('');
	get trueValue() {
		return i(this.#r);
	}
	set trueValue(e) {
		k(this.#r, e, !0);
	}
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref)),
			(this.trueValue = e.value.current ?? e.id.current),
			He(
				() => this.trueValue,
				() => this.root.registerGroup(this.trueValue)
			),
			It(() =>
				this.opts.value.current
					? ((this.trueValue = this.opts.value.current),
						this.root.registerValue(this.opts.value.current))
					: this.headingNode && this.headingNode.textContent
						? ((this.trueValue = this.headingNode.textContent.trim().toLowerCase()),
							this.root.registerValue(this.trueValue))
						: ((this.trueValue = `-----${this.opts.id.current}`),
							this.root.registerValue(this.trueValue))
			));
	}
	#n = y(() => ({
		id: this.opts.id.current,
		role: 'presentation',
		hidden: this.shouldRender ? void 0 : !0,
		'data-value': this.trueValue,
		[oe.group]: '',
		...this.attachment
	}));
	get props() {
		return i(this.#n);
	}
	set props(e) {
		k(this.#n, e);
	}
}
class Bt {
	static create(e) {
		return new Bt(e, Ue.get());
	}
	opts;
	group;
	attachment;
	constructor(e, t) {
		((this.opts = e),
			(this.group = t),
			(this.attachment = me(this.opts.ref, (r) => (this.group.headingNode = r))));
	}
	#e = y(() => ({ id: this.opts.id.current, [oe['group-heading']]: '', ...this.attachment }));
	get props() {
		return i(this.#e);
	}
	set props(e) {
		k(this.#e, e);
	}
}
class Dt {
	static create(e) {
		return new Dt(e, Ue.get());
	}
	opts;
	group;
	attachment;
	constructor(e, t) {
		((this.opts = e), (this.group = t), (this.attachment = me(this.opts.ref)));
	}
	#e = y(() => ({
		id: this.opts.id.current,
		role: 'group',
		[oe['group-items']]: '',
		'aria-labelledby': this.group.headingNode?.id ?? void 0,
		...this.attachment
	}));
	get props() {
		return i(this.#e);
	}
	set props(e) {
		k(this.#e, e);
	}
}
class Ft {
	static create(e) {
		return new Ft(e, Te.get());
	}
	opts;
	root;
	attachment;
	#e = y(() => {
		const e = this.root.viewportNode?.querySelector(
			`${Er}[${Ie}="${Ar(this.root.opts.value.current)}"]`
		);
		if (e != null) return e.getAttribute('id') ?? void 0;
	});
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref, (r) => (this.root.inputNode = r))),
			He(
				() => this.opts.ref.current,
				() => {
					const r = this.opts.ref.current;
					r && this.opts.autofocus.current && Yr(10, () => r.focus());
				}
			),
			He(
				() => this.opts.value.current,
				() => {
					this.root.commandState.search !== this.opts.value.current &&
						this.root.setState('search', this.opts.value.current);
				}
			));
	}
	#t = y(() => ({
		id: this.opts.id.current,
		type: 'text',
		[oe.input]: '',
		autocomplete: 'off',
		autocorrect: 'off',
		spellcheck: !1,
		'aria-autocomplete': 'list',
		role: 'combobox',
		'aria-expanded': st(!0),
		'aria-controls': this.root.viewportNode?.id ?? void 0,
		'aria-labelledby': this.root.labelNode?.id ?? void 0,
		'aria-activedescendant': i(this.#e),
		...this.attachment
	}));
	get props() {
		return i(this.#t);
	}
	set props(e) {
		k(this.#t, e);
	}
}
class zt {
	static create(e) {
		const t = Ue.getOr(null);
		return new zt({ ...e, group: t }, Te.get());
	}
	opts;
	root;
	attachment;
	#e = null;
	#t = y(() => this.opts.forceMount.current || this.#e?.opts.forceMount.current === !0);
	#r = y(() => {
		if (
			(this.opts.ref.current,
			i(this.#t) ||
				this.root.opts.shouldFilter.current === !1 ||
				!this.root.commandState.search)
		)
			return !0;
		const e = this.root.commandState.filtered.items.get(this.trueValue);
		return e === void 0 ? !1 : e > 0;
	});
	get shouldRender() {
		return i(this.#r);
	}
	set shouldRender(e) {
		k(this.#r, e);
	}
	#n = y(() => this.root.opts.value.current === this.trueValue && this.trueValue !== '');
	get isSelected() {
		return i(this.#n);
	}
	set isSelected(e) {
		k(this.#n, e);
	}
	#s = W('');
	get trueValue() {
		return i(this.#s);
	}
	set trueValue(e) {
		k(this.#s, e, !0);
	}
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.#e = Ue.getOr(null)),
			(this.trueValue = e.value.current),
			(this.attachment = me(this.opts.ref)),
			He(
				[
					() => this.trueValue,
					() => this.#e?.trueValue,
					() => this.opts.forceMount.current
				],
				() => {
					if (!(this.opts.forceMount.current || !this.trueValue))
						return this.root.registerItem(this.trueValue, this.#e?.trueValue);
				}
			),
			He([() => this.opts.value.current, () => this.opts.ref.current], () => {
				(this.opts.value.current
					? (this.trueValue = this.opts.value.current)
					: this.opts.ref.current?.textContent &&
						(this.trueValue = this.opts.ref.current.textContent.trim()),
					this.trueValue &&
						(this.root.registerValue(
							this.trueValue,
							e.keywords.current.map((r) => r.trim())
						),
						this.opts.ref.current?.setAttribute(Ie, this.trueValue)));
			}),
			(this.onclick = this.onclick.bind(this)),
			(this.onpointermove = this.onpointermove.bind(this)));
	}
	#o() {
		this.opts.disabled.current || (this.#i(), this.opts.onSelect?.current());
	}
	#i() {
		this.opts.disabled.current || this.root.setValue(this.trueValue, !0);
	}
	onpointermove(e) {
		this.opts.disabled.current || this.root.opts.disablePointerSelection.current || this.#i();
	}
	onclick(e) {
		this.opts.disabled.current || this.#o();
	}
	#a = y(() => ({
		id: this.opts.id.current,
		'aria-disabled': st(this.opts.disabled.current),
		'aria-selected': st(this.isSelected),
		'data-disabled': Yt(this.opts.disabled.current),
		'data-selected': Yt(this.isSelected),
		'data-value': this.trueValue,
		'data-group': this.#e?.trueValue,
		[oe.item]: '',
		role: 'option',
		onpointermove: this.onpointermove,
		onclick: this.onclick,
		...this.attachment
	}));
	get props() {
		return i(this.#a);
	}
	set props(e) {
		k(this.#a, e);
	}
}
class Lt {
	static create(e) {
		return ws.set(new Lt(e, Te.get()));
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		((this.opts = e), (this.root = t), (this.attachment = me(this.opts.ref)));
	}
	#e = y(() => ({
		id: this.opts.id.current,
		role: 'listbox',
		'aria-label': this.opts.ariaLabel.current,
		[oe.list]: '',
		...this.attachment
	}));
	get props() {
		return i(this.#e);
	}
	set props(e) {
		k(this.#e, e);
	}
}
class Kt {
	static create(e) {
		return new Kt(e, Te.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref, (r) => (this.root.labelNode = r))));
	}
	#e = y(() => ({
		id: this.opts.id.current,
		[oe['input-label']]: '',
		for: this.opts.for?.current,
		style: Ir,
		...this.attachment
	}));
	get props() {
		return i(this.#e);
	}
	set props(e) {
		k(this.#e, e);
	}
}
var ys = P('<label><!></label>');
function xs(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = K(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'children']);
	const a = Kt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(g) => n(g)
			)
		}),
		l = y(() => se(s, a.props));
	var c = ys();
	Z(c, () => ({ ...i(l) }));
	var u = M(c);
	(L(u, () => e.children ?? re), A(c), d(o, c), N());
}
var Ss = P('<!> <!>', 1),
	Cs = P('<div><!> <!></div>');
function ks(o, e) {
	const t = ce();
	T(e, !0);
	const r = (D) => {
		xs(D, {
			children: (z, H) => {
				le();
				var ee = be();
				(te(() => he(ee, b())), d(z, ee));
			},
			$$slots: { default: !0 }
		});
	};
	let n = h(e, 'id', 19, () => ue(t)),
		s = h(e, 'ref', 15, null),
		a = h(e, 'value', 15, ''),
		l = h(e, 'onValueChange', 3, Se),
		c = h(e, 'onStateChange', 3, Se),
		u = h(e, 'loop', 3, !1),
		g = h(e, 'shouldFilter', 3, !0),
		v = h(e, 'filter', 3, Or),
		b = h(e, 'label', 3, ''),
		p = h(e, 'vimBindings', 3, !0),
		m = h(e, 'disablePointerSelection', 3, !1),
		f = h(e, 'disableInitialScroll', 3, !1),
		w = h(e, 'columns', 3, null),
		x = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'value',
			'onValueChange',
			'onStateChange',
			'loop',
			'shouldFilter',
			'filter',
			'label',
			'vimBindings',
			'disablePointerSelection',
			'disableInitialScroll',
			'columns',
			'children',
			'child'
		]);
	const E = Vt.create({
			id: C(() => n()),
			ref: C(
				() => s(),
				(D) => s(D)
			),
			filter: C(() => v()),
			shouldFilter: C(() => g()),
			loop: C(() => u()),
			value: C(
				() => a(),
				(D) => {
					a() !== D && (a(D), l()(D));
				}
			),
			vimBindings: C(() => p()),
			disablePointerSelection: C(() => m()),
			disableInitialScroll: C(() => f()),
			onStateChange: C(() => c()),
			columns: C(() => w())
		}),
		I = (D) => E.updateSelectedToIndex(D),
		U = (D) => E.updateSelectedByGroup(D),
		G = (D) => E.updateSelectedByItem(D),
		F = () => E.getValidItems(),
		V = y(() => se(x, E.props));
	var R = {
			updateSelectedToIndex: I,
			updateSelectedByGroup: U,
			updateSelectedByItem: G,
			getValidItems: F
		},
		j = S(),
		J = _(j);
	{
		var X = (D) => {
				var z = Ss(),
					H = _(z);
				r(H);
				var ee = O(H, 2);
				(L(
					ee,
					() => e.child,
					() => ({ props: i(V) })
				),
					d(D, z));
			},
			ne = (D) => {
				var z = Cs();
				Z(z, () => ({ ...i(V) }));
				var H = M(z);
				r(H);
				var ee = O(H, 2);
				(L(ee, () => e.children ?? re), A(z), d(D, z));
			};
		q(J, (D) => {
			e.child ? D(X) : D(ne, !1);
		});
	}
	return (d(o, j), N(R));
}
var Ps = P('<div><!></div>');
function Is(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'forceMount', 3, !1),
		a = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'children',
			'child',
			'forceMount'
		]);
	const l = Rt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(b) => n(b)
			),
			forceMount: C(() => s())
		}),
		c = y(() => se(l.props, a));
	var u = S(),
		g = _(u);
	{
		var v = (b) => {
			var p = S(),
				m = _(p);
			{
				var f = (x) => {
						var E = S(),
							I = _(E);
						(L(
							I,
							() => e.child,
							() => ({ props: i(c) })
						),
							d(x, E));
					},
					w = (x) => {
						var E = Ps();
						Z(E, () => ({ ...i(c) }));
						var I = M(E);
						(L(I, () => e.children ?? re), A(E), d(x, E));
					};
				q(m, (x) => {
					e.child ? x(f) : x(w, !1);
				});
			}
			d(b, p);
		};
		q(g, (b) => {
			l.shouldRender && b(v);
		});
	}
	(d(o, u), N());
}
var As = P('<div><!></div>');
function Es(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'value', 3, ''),
		a = h(e, 'forceMount', 3, !1),
		l = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'value',
			'forceMount',
			'children',
			'child'
		]);
	const c = Gt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(m) => n(m)
			),
			forceMount: C(() => a()),
			value: C(() => s())
		}),
		u = y(() => se(l, c.props));
	var g = S(),
		v = _(g);
	{
		var b = (m) => {
				var f = S(),
					w = _(f);
				(L(
					w,
					() => e.child,
					() => ({ props: i(u) })
				),
					d(m, f));
			},
			p = (m) => {
				var f = As();
				Z(f, () => ({ ...i(u) }));
				var w = M(f);
				(L(w, () => e.children ?? re), A(f), d(m, f));
			};
		q(v, (m) => {
			e.child ? m(b) : m(p, !1);
		});
	}
	(d(o, g), N());
}
var Ms = P('<div><!></div>');
function Os(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = K(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'children', 'child']);
	const a = Bt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(b) => n(b)
			)
		}),
		l = y(() => se(s, a.props));
	var c = S(),
		u = _(c);
	{
		var g = (b) => {
				var p = S(),
					m = _(p);
				(L(
					m,
					() => e.child,
					() => ({ props: i(l) })
				),
					d(b, p));
			},
			v = (b) => {
				var p = Ms();
				Z(p, () => ({ ...i(l) }));
				var m = M(p);
				(L(m, () => e.children ?? re), A(p), d(b, p));
			};
		q(u, (b) => {
			e.child ? b(g) : b(v, !1);
		});
	}
	(d(o, c), N());
}
var Ts = P('<div><!></div>'),
	Ns = P('<div style="display: contents;"><!></div>');
function Vs(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = K(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'children', 'child']);
	const a = Dt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(b) => n(b)
			)
		}),
		l = y(() => se(s, a.props));
	var c = Ns(),
		u = M(c);
	{
		var g = (b) => {
				var p = S(),
					m = _(p);
				(L(
					m,
					() => e.child,
					() => ({ props: i(l) })
				),
					d(b, p));
			},
			v = (b) => {
				var p = Ts();
				Z(p, () => ({ ...i(l) }));
				var m = M(p);
				(L(m, () => e.children ?? re), A(p), d(b, p));
			};
		q(u, (b) => {
			e.child ? b(g) : b(v, !1);
		});
	}
	(A(c), d(o, c), N());
}
var Rs = P('<input/>');
function Gs(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'value', 15, ''),
		n = h(e, 'autofocus', 3, !1),
		s = h(e, 'id', 19, () => ue(t)),
		a = h(e, 'ref', 15, null),
		l = K(e, ['$$slots', '$$events', '$$legacy', 'value', 'autofocus', 'id', 'ref', 'child']);
	const c = Ft.create({
			id: C(() => s()),
			ref: C(
				() => a(),
				(m) => a(m)
			),
			value: C(
				() => r(),
				(m) => {
					r(m);
				}
			),
			autofocus: C(() => n() ?? !1)
		}),
		u = y(() => se(l, c.props));
	var g = S(),
		v = _(g);
	{
		var b = (m) => {
				var f = S(),
					w = _(f);
				(L(
					w,
					() => e.child,
					() => ({ props: i(u) })
				),
					d(m, f));
			},
			p = (m) => {
				var f = Rs();
				(Z(f, () => ({ ...i(u) }), void 0, void 0, void 0, !0), Dr(f, r), d(m, f));
			};
		q(v, (m) => {
			e.child ? m(b) : m(p, !1);
		});
	}
	(d(o, g), N());
}
var Bs = P('<div><!></div>'),
	Ds = P('<div style="display: contents;" data-item-wrapper=""><!></div>');
function Fs(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'value', 3, ''),
		a = h(e, 'disabled', 3, !1),
		l = h(e, 'onSelect', 3, Se),
		c = h(e, 'forceMount', 3, !1),
		u = h(e, 'keywords', 19, () => []),
		g = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'value',
			'disabled',
			'children',
			'child',
			'onSelect',
			'forceMount',
			'keywords'
		]);
	const v = zt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(f) => n(f)
			),
			value: C(() => s()),
			disabled: C(() => a()),
			onSelect: C(() => l()),
			forceMount: C(() => c()),
			keywords: C(() => u())
		}),
		b = y(() => se(g, v.props));
	var p = S(),
		m = _(p);
	(hr(
		m,
		() => v.root.key,
		(f) => {
			var w = Ds(),
				x = M(w);
			{
				var E = (I) => {
					var U = S(),
						G = _(U);
					{
						var F = (R) => {
								var j = S(),
									J = _(j);
								(L(
									J,
									() => e.child,
									() => ({ props: i(b) })
								),
									d(R, j));
							},
							V = (R) => {
								var j = Bs();
								Z(j, () => ({ ...i(b) }));
								var J = M(j);
								(L(J, () => e.children ?? re), A(j), d(R, j));
							};
						q(G, (R) => {
							e.child ? R(F) : R(V, !1);
						});
					}
					d(I, U);
				};
				q(x, (I) => {
					v.shouldRender && I(E);
				});
			}
			(A(w), te(() => ct(w, 'data-value', v.trueValue)), d(f, w));
		}
	),
		d(o, p),
		N());
}
var zs = P('<div><!></div>');
function Ls(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'child',
			'children',
			'aria-label'
		]);
	const a = Lt.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(g) => n(g)
			),
			ariaLabel: C(() => e['aria-label'] ?? 'Suggestions...')
		}),
		l = y(() => se(s, a.props));
	var c = S(),
		u = _(c);
	(hr(
		u,
		() => a.root._commandState.search === '',
		(g) => {
			var v = S(),
				b = _(v);
			{
				var p = (f) => {
						var w = S(),
							x = _(w);
						(L(
							x,
							() => e.child,
							() => ({ props: i(l) })
						),
							d(f, w));
					},
					m = (f) => {
						var w = zs();
						Z(w, () => ({ ...i(l) }));
						var x = M(w);
						(L(x, () => e.children ?? re), A(w), d(f, w));
					};
				q(b, (f) => {
					e.child ? f(p) : f(m, !1);
				});
			}
			d(g, v);
		}
	),
		d(o, c),
		N());
}
const ar = 1,
	Ks = 0.9,
	js = 0.8,
	qs = 0.17,
	vt = 0.1,
	pt = 0.999,
	Hs = 0.9999,
	Ws = 0.99,
	Us = /[\\/_+.#"@[({&]/,
	Js = /[\\/_+.#"@[({&]/g,
	Xs = /[\s-]/,
	Mr = /[\s-]/g;
function Ct(o, e, t, r, n, s, a) {
	if (s === e.length) return n === o.length ? ar : Ws;
	const l = `${n},${s}`;
	if (a[l] !== void 0) return a[l];
	const c = r.charAt(s);
	let u = t.indexOf(c, n),
		g = 0,
		v,
		b,
		p,
		m;
	for (; u >= 0; )
		((v = Ct(o, e, t, r, u + 1, s + 1, a)),
			v > g &&
				(u === n
					? (v *= ar)
					: Us.test(o.charAt(u - 1))
						? ((v *= js),
							(p = o.slice(n, u - 1).match(Js)),
							p && n > 0 && (v *= pt ** p.length))
						: Xs.test(o.charAt(u - 1))
							? ((v *= Ks),
								(m = o.slice(n, u - 1).match(Mr)),
								m && n > 0 && (v *= pt ** m.length))
							: ((v *= qs), n > 0 && (v *= pt ** (u - n))),
				o.charAt(u) !== e.charAt(s) && (v *= Hs)),
			((v < vt && t.charAt(u - 1) === r.charAt(s + 1)) ||
				(r.charAt(s + 1) === r.charAt(s) && t.charAt(u - 1) !== r.charAt(s))) &&
				((b = Ct(o, e, t, r, u + 1, s + 2, a)), b * vt > v && (v = b * vt)),
			v > g && (g = v),
			(u = t.indexOf(c, u + 1)));
	return ((a[l] = g), g);
}
function ir(o) {
	return o.toLowerCase().replace(Mr, ' ');
}
function Or(o, e, t) {
	return (
		(o = t && t.length > 0 ? `${`${o} ${t?.join(' ')}`}` : o),
		Ct(o, e, ir(o), ir(e), 0, 0, {})
	);
}
const kt = Mt({ component: 'popover', parts: ['root', 'trigger', 'content', 'close'] }),
	jt = new ut('Popover.Root');
class qt {
	static create(e) {
		return jt.set(new qt(e));
	}
	opts;
	#e = W(null);
	get contentNode() {
		return i(this.#e);
	}
	set contentNode(e) {
		k(this.#e, e, !0);
	}
	#t = W(null);
	get triggerNode() {
		return i(this.#t);
	}
	set triggerNode(e) {
		k(this.#t, e, !0);
	}
	constructor(e) {
		((this.opts = e),
			new Zr({
				ref: C(() => this.contentNode),
				open: this.opts.open,
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}));
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	handleClose() {
		this.opts.open.current && (this.opts.open.current = !1);
	}
}
class Ht {
	static create(e) {
		return new Ht(e, jt.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref, (r) => (this.root.triggerNode = r))),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(e) {
		this.opts.disabled.current || (e.button === 0 && this.root.toggleOpen());
	}
	onkeydown(e) {
		this.opts.disabled.current ||
			((e.key === wr || e.key === Pn) && (e.preventDefault(), this.root.toggleOpen()));
	}
	#e() {
		if (this.root.opts.open.current && this.root.contentNode?.id)
			return this.root.contentNode?.id;
	}
	#t = y(() => ({
		id: this.opts.id.current,
		'aria-haspopup': 'dialog',
		'aria-expanded': st(this.root.opts.open.current),
		'data-state': yr(this.root.opts.open.current),
		'aria-controls': this.#e(),
		[kt.trigger]: '',
		disabled: this.opts.disabled.current,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		...this.attachment
	}));
	get props() {
		return i(this.#t);
	}
	set props(e) {
		k(this.#t, e);
	}
}
class Wt {
	static create(e) {
		return new Wt(e, jt.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = me(this.opts.ref, (r) => (this.root.contentNode = r))));
	}
	onInteractOutside = (e) => {
		if ((this.opts.onInteractOutside.current(e), e.defaultPrevented || !Zt(e.target))) return;
		const t = e.target.closest(kt.selector('trigger'));
		if (!(t && t === this.root.triggerNode)) {
			if (this.opts.customAnchor.current) {
				if (Zt(this.opts.customAnchor.current)) {
					if (this.opts.customAnchor.current.contains(e.target)) return;
				} else if (typeof this.opts.customAnchor.current == 'string') {
					const r = document.querySelector(this.opts.customAnchor.current);
					if (r && r.contains(e.target)) return;
				}
			}
			this.root.handleClose();
		}
	};
	onEscapeKeydown = (e) => {
		(this.opts.onEscapeKeydown.current(e), !e.defaultPrevented && this.root.handleClose());
	};
	#e = y(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return i(this.#e);
	}
	set snippetProps(e) {
		k(this.#e, e);
	}
	#t = y(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		'data-state': yr(this.root.opts.open.current),
		[kt.content]: '',
		style: { pointerEvents: 'auto' },
		...this.attachment
	}));
	get props() {
		return i(this.#t);
	}
	set props(e) {
		k(this.#t, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown
	};
}
var Qs = P('<div><div><!></div></div>'),
	Ys = P('<div><div><!></div></div>');
function Zs(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'ref', 15, null),
		n = h(e, 'id', 19, () => ue(t)),
		s = h(e, 'forceMount', 3, !1),
		a = h(e, 'onCloseAutoFocus', 3, Se),
		l = h(e, 'onEscapeKeydown', 3, Se),
		c = h(e, 'onInteractOutside', 3, Se),
		u = h(e, 'trapFocus', 3, !0),
		g = h(e, 'preventScroll', 3, !1),
		v = h(e, 'customAnchor', 3, null),
		b = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'child',
			'children',
			'ref',
			'id',
			'forceMount',
			'onCloseAutoFocus',
			'onEscapeKeydown',
			'onInteractOutside',
			'trapFocus',
			'preventScroll',
			'customAnchor'
		]);
	const p = Wt.create({
			id: C(() => n()),
			ref: C(
				() => r(),
				(I) => r(I)
			),
			onInteractOutside: C(() => c()),
			onEscapeKeydown: C(() => l()),
			customAnchor: C(() => v())
		}),
		m = y(() => se(b, p.props));
	var f = S(),
		w = _(f);
	{
		var x = (I) => {
				$r(
					I,
					Y(
						() => i(m),
						() => p.popperProps,
						{
							get ref() {
								return p.opts.ref;
							},
							get enabled() {
								return p.root.opts.open.current;
							},
							get id() {
								return n();
							},
							get trapFocus() {
								return u();
							},
							get preventScroll() {
								return g();
							},
							loop: !0,
							forceMount: !0,
							get customAnchor() {
								return v();
							},
							get onCloseAutoFocus() {
								return a();
							},
							popper: (G, F) => {
								let V = () => F?.().props,
									R = () => F?.().wrapperProps;
								const j = y(() => se(V(), { style: Qt('popover') }));
								var J = S(),
									X = _(J);
								{
									var ne = (z) => {
											var H = S(),
												ee = _(H);
											{
												let ge = y(() => ({
													props: i(j),
													wrapperProps: R(),
													...p.snippetProps
												}));
												L(
													ee,
													() => e.child,
													() => i(ge)
												);
											}
											d(z, H);
										},
										D = (z) => {
											var H = Qs();
											Z(H, () => ({ ...R() }));
											var ee = M(H);
											Z(ee, () => ({ ...i(j) }));
											var ge = M(ee);
											(L(ge, () => e.children ?? re), A(ee), A(H), d(z, H));
										};
									q(X, (z) => {
										e.child ? z(ne) : z(D, !1);
									});
								}
								d(G, J);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			E = (I) => {
				var U = S(),
					G = _(U);
				{
					var F = (V) => {
						en(
							V,
							Y(
								() => i(m),
								() => p.popperProps,
								{
									get ref() {
										return p.opts.ref;
									},
									get open() {
										return p.root.opts.open.current;
									},
									get id() {
										return n();
									},
									get trapFocus() {
										return u();
									},
									get preventScroll() {
										return g();
									},
									loop: !0,
									forceMount: !1,
									get customAnchor() {
										return v();
									},
									get onCloseAutoFocus() {
										return a();
									},
									popper: (j, J) => {
										let X = () => J?.().props,
											ne = () => J?.().wrapperProps;
										const D = y(() => se(X(), { style: Qt('popover') }));
										var z = S(),
											H = _(z);
										{
											var ee = (de) => {
													var ve = S(),
														ae = _(ve);
													{
														let pe = y(() => ({
															props: i(D),
															wrapperProps: ne(),
															...p.snippetProps
														}));
														L(
															ae,
															() => e.child,
															() => i(pe)
														);
													}
													d(de, ve);
												},
												ge = (de) => {
													var ve = Ys();
													Z(ve, () => ({ ...ne() }));
													var ae = M(ve);
													Z(ae, () => ({ ...i(D) }));
													var pe = M(ae);
													(L(pe, () => e.children ?? re),
														A(ae),
														A(ve),
														d(de, ve));
												};
											q(H, (de) => {
												e.child ? de(ee) : de(ge, !1);
											});
										}
										d(j, z);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					q(
						G,
						(V) => {
							s() || V(F);
						},
						!0
					);
				}
				d(I, U);
			};
		q(w, (I) => {
			s() ? I(x) : I(E, !1);
		});
	}
	(d(o, f), N());
}
var $s = P('<button><!></button>');
function eo(o, e) {
	const t = ce();
	T(e, !0);
	let r = h(e, 'id', 19, () => ue(t)),
		n = h(e, 'ref', 15, null),
		s = h(e, 'type', 3, 'button'),
		a = h(e, 'disabled', 3, !1),
		l = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'ref',
			'type',
			'disabled'
		]);
	const c = Ht.create({
			id: C(() => r()),
			ref: C(
				() => n(),
				(g) => n(g)
			),
			disabled: C(() => !!a())
		}),
		u = y(() => se(l, c.props, { type: s() }));
	(tn(o, {
		get id() {
			return r();
		},
		get ref() {
			return c.opts.ref;
		},
		children: (g, v) => {
			var b = S(),
				p = _(b);
			{
				var m = (w) => {
						var x = S(),
							E = _(x);
						(L(
							E,
							() => e.child,
							() => ({ props: i(u) })
						),
							d(w, x));
					},
					f = (w) => {
						var x = $s();
						Z(x, () => ({ ...i(u) }));
						var E = M(x);
						(L(E, () => e.children ?? re), A(x), d(w, x));
					};
				q(p, (w) => {
					e.child ? w(m) : w(f, !1);
				});
			}
			d(g, b);
		},
		$$slots: { default: !0 }
	}),
		N());
}
function to(o, e) {
	T(e, !0);
	let t = h(e, 'open', 15, !1),
		r = h(e, 'onOpenChange', 3, Se),
		n = h(e, 'onOpenChangeComplete', 3, Se);
	(qt.create({
		open: C(
			() => t(),
			(s) => {
				(t(s), r()(s));
			}
		),
		onOpenChangeComplete: C(() => n())
	}),
		rn(o, {
			children: (s, a) => {
				var l = S(),
					c = _(l);
				(L(c, () => e.children ?? re), d(s, l));
			},
			$$slots: { default: !0 }
		}),
		N());
}
function _t(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() =>
			Q(
				'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
				e.class
			)
		);
		B(
			s,
			() => ps,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'separator',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
function ro(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = h(e, 'value', 15, ''),
		n = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'value', 'class']);
	var s = S(),
		a = _(s);
	{
		let l = y(() =>
			Q(
				'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
				e.class
			)
		);
		B(
			a,
			() => ks,
			(c, u) => {
				u(
					c,
					Y(
						{
							'data-slot': 'command',
							get class() {
								return i(l);
							}
						},
						() => n,
						{
							get value() {
								return r();
							},
							set value(g) {
								r(g);
							},
							get ref() {
								return t();
							},
							set ref(g) {
								t(g);
							}
						}
					)
				);
			}
		);
	}
	(d(o, s), N());
}
var no = P('<!> <span class="sr-only">Close</span>', 1),
	so = P('<!> <!>', 1),
	oo = P('<!> <!>', 1);
function ao(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = h(e, 'showCloseButton', 3, !0),
		n = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'portalProps',
			'children',
			'showCloseButton'
		]);
	var s = S(),
		a = _(s);
	(B(
		a,
		() => go,
		(l, c) => {
			c(
				l,
				Y(() => e.portalProps, {
					children: (u, g) => {
						var v = oo(),
							b = _(v);
						B(
							b,
							() => uo,
							(m, f) => {
								f(m, {});
							}
						);
						var p = O(b, 2);
						{
							let m = y(() =>
								Q(
									'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
									e.class
								)
							);
							B(
								p,
								() => nn,
								(f, w) => {
									w(
										f,
										Y(
											{
												'data-slot': 'dialog-content',
												get class() {
													return i(m);
												}
											},
											() => n,
											{
												get ref() {
													return t();
												},
												set ref(x) {
													t(x);
												},
												children: (x, E) => {
													var I = so(),
														U = _(I);
													L(U, () => e.children ?? re);
													var G = O(U, 2);
													{
														var F = (V) => {
															var R = S(),
																j = _(R);
															(B(
																j,
																() => sn,
																(J, X) => {
																	X(J, {
																		class: "ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
																		children: (ne, D) => {
																			var z = no(),
																				H = _(z);
																			(Fr(H, {}),
																				le(2),
																				d(ne, z));
																		},
																		$$slots: { default: !0 }
																	});
																}
															),
																d(V, R));
														};
														q(G, (V) => {
															r() && V(F);
														});
													}
													d(x, I);
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							);
						}
						d(u, v);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		d(o, s),
		N());
}
function io(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('text-muted-foreground text-sm', e.class));
		B(
			s,
			() => on,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'dialog-description',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
var lo = P('<div><!></div>');
function co(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var n = lo();
	Z(n, (a) => ({ 'data-slot': 'dialog-header', class: a, ...r }), [
		() => Q('flex flex-col gap-2 text-center sm:text-left', e.class)
	]);
	var s = M(n);
	(L(s, () => e.children ?? re),
		A(n),
		zr(
			n,
			(a) => t(a),
			() => t()
		),
		d(o, n),
		N());
}
function uo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() =>
			Q(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				e.class
			)
		);
		B(
			s,
			() => an,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'dialog-overlay',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
function fo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('text-lg leading-none font-semibold', e.class));
		B(
			s,
			() => ln,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'dialog-title',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
function ho(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	var n = S(),
		s = _(n);
	(B(
		s,
		() => ms,
		(a, l) => {
			l(
				a,
				Y({ 'data-slot': 'dialog-trigger' }, () => r, {
					get ref() {
						return t();
					},
					set ref(c) {
						t(c);
					}
				})
			);
		}
	),
		d(o, n),
		N());
}
const mo = cn,
	go = pr;
function vo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('py-6 text-center text-sm', e.class));
		B(
			s,
			() => Is,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'command-empty',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
var po = P('<!> <!>', 1);
function lr(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'children',
			'heading',
			'value'
		]);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('text-foreground overflow-hidden p-1', e.class)),
			l = y(() => e.value ?? e.heading ?? `----${un()}`);
		B(
			s,
			() => Es,
			(c, u) => {
				u(
					c,
					Y(
						{
							'data-slot': 'command-group',
							get class() {
								return i(a);
							},
							get value() {
								return i(l);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(g) {
								t(g);
							},
							children: (g, v) => {
								var b = po(),
									p = _(b);
								{
									var m = (w) => {
										var x = S(),
											E = _(x);
										(B(
											E,
											() => Os,
											(I, U) => {
												U(I, {
													class: 'text-muted-foreground px-2 py-1.5 text-xs font-medium',
													children: (G, F) => {
														le();
														var V = be();
														(te(() => he(V, e.heading)), d(G, V));
													},
													$$slots: { default: !0 }
												});
											}
										),
											d(w, x));
									};
									q(p, (w) => {
										e.heading && w(m);
									});
								}
								var f = O(p, 2);
								(B(
									f,
									() => Vs,
									(w, x) => {
										x(w, {
											get children() {
												return e.children;
											}
										});
									}
								),
									d(g, b));
							},
							$$slots: { default: !0 }
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
var _o = P(
	'<div class="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper"><!> <!></div>'
);
function bo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = h(e, 'value', 15, ''),
		n = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'value']);
	var s = _o(),
		a = M(s);
	Lr(a, { class: 'size-4 shrink-0 opacity-50' });
	var l = O(a, 2);
	{
		let c = y(() =>
			Q(
				'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
				e.class
			)
		);
		B(
			l,
			() => Gs,
			(u, g) => {
				g(
					u,
					Y(
						{
							'data-slot': 'command-input',
							get class() {
								return i(c);
							}
						},
						() => n,
						{
							get ref() {
								return t();
							},
							set ref(v) {
								t(v);
							},
							get value() {
								return r();
							},
							set value(v) {
								r(v);
							}
						}
					)
				);
			}
		);
	}
	(A(s), d(o, s), N());
}
function wo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() =>
			Q(
				"aria-selected:bg-accent aria-selected:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				e.class
			)
		);
		B(
			s,
			() => Fs,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'command-item',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
function yo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', e.class));
		B(
			s,
			() => Ls,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'command-list',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
function xo() {
	const o = y(() => navigator.platform.includes('MAC'));
	return {
		get current() {
			return i(o);
		}
	};
}
function So(o, e, t = { attributes: !0, characterData: !0, childList: !0, subtree: !0 }) {
	const r = y(o);
	It(() => {
		if (!i(r)) return;
		const n = new MutationObserver(e);
		return (n.observe(i(r), t), () => n.disconnect());
	});
}
function cr(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'children', 'ref', 'class', 'onHighlight']);
	So(
		() => t(),
		(a) => {
			for (const l of a)
				l.type === 'attributes' &&
					l.attributeName === 'aria-selected' &&
					t()?.getAttribute('aria-selected') === 'true' &&
					e.onHighlight?.();
		},
		{ attributes: !0 }
	);
	var n = S(),
		s = _(n);
	{
		let a = y(() =>
			Q(
				'data-[selected=true]:border-input data-[selected=true]:bg-input/50 h-9 rounded-md border border-transparent !px-3 font-medium',
				e.class
			)
		);
		B(
			s,
			() => wo,
			(l, c) => {
				c(
					l,
					Y(
						{
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							},
							children: (u, g) => {
								var v = S(),
									b = _(v);
								(L(b, () => e.children ?? re), d(u, v));
							},
							$$slots: { default: !0 }
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
const ur = (o, e) => {
	let t = () => e?.().class,
		r = () => e?.().content,
		n = () => gr(e?.(), ['class', 'content']);
	const s = y(r);
	var a = Co();
	Z(a, (g) => ({ class: g, ...n() }), [
		() =>
			Q(
				"bg-background dark:bg-background text-muted-foreground border-border/50 pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium shadow-sm select-none dark:border dark:shadow-none [&_svg:not([class*='size-'])]:size-3",
				t()
			)
	]);
	var l = M(a);
	{
		var c = (g) => {
				var v = be();
				(te(() => he(v, i(s))), d(g, v));
			},
			u = (g) => {
				var v = S(),
					b = _(v);
				(B(
					b,
					() => i(s),
					(p, m) => {
						m(p, {});
					}
				),
					d(g, v));
			};
		q(l, (g) => {
			typeof i(s) == 'string' ? g(c) : g(u, !1);
		});
	}
	(A(a), d(o, a));
};
var Co = P('<kbd><!></kbd>'),
	ko = P(
		'<span class="hidden lg:inline-flex">Search documentation...</span> <span class="inline-flex lg:hidden">Search...</span> <div class="absolute top-1.5 right-1.5 hidden gap-1 sm:flex"><!> <!></div>',
		1
	),
	Po = P('<!> <!>', 1),
	Io = P('<!> <!>', 1),
	Ao = P(
		'<!> <span class="text-muted-foreground ml-auto font-mono text-xs font-normal tabular-nums"> </span>',
		1
	),
	Eo = P('<!> ', 1),
	Mo = P('<!> <!>', 1),
	Oo = P('<!> <!>', 1),
	To = P('<!> <!>', 1),
	No = P('<!> <!>', 1);
function Vo(o, e) {
	T(e, !0);
	const t = xo();
	let r = W(!1),
		n = W(''),
		s = W(Oe([])),
		a = W(Oe([])),
		l = W(!1);
	async function c() {
		if (!i(s).length) {
			k(l, !0);
			try {
				const w = await (await fetch('/api/search')).json();
				k(s, w.docs, !0);
			} finally {
				k(l, !1);
			}
		}
	}
	function u(f, w) {
		const x = w.toLowerCase();
		let E = 0;
		return (
			f.title.toLowerCase().includes(x) && (E += 5),
			f.section.toLowerCase().includes(x) && (E += 3),
			f.description.toLowerCase().includes(x) && (E += 2),
			f.headings.join(' ').toLowerCase().includes(x) && (E += 2),
			f.content.toLowerCase().includes(x) && (E += 1),
			E
		);
	}
	async function g() {
		const f = i(n).trim();
		if (!f) {
			k(a, [], !0);
			return;
		}
		(await c(),
			k(
				a,
				i(s)
					.map((w) => ({ d: w, s: u(w, f) }))
					.filter((w) => w.s > 0)
					.sort((w, x) => x.s - w.s)
					.slice(0, 50)
					.map((w) => w.d),
				!0
			));
	}
	async function v(f) {
		(k(r, !1), await jr(), f());
	}
	function b(f) {
		if ((f.key === 'k' && (f.metaKey || f.ctrlKey)) || f.key === '/') {
			if (
				(f.target instanceof HTMLElement && f.target.isContentEditable) ||
				f.target instanceof HTMLInputElement ||
				f.target instanceof HTMLTextAreaElement ||
				f.target instanceof HTMLSelectElement
			)
				return;
			(f.preventDefault(), k(r, !i(r)), i(r) && c());
		}
	}
	var p = S();
	Kr('keydown', mr, b);
	var m = _(p);
	(B(
		m,
		() => mo,
		(f, w) => {
			w(f, {
				get open() {
					return i(r);
				},
				set open(x) {
					k(r, x, !0);
				},
				children: (x, E) => {
					var I = No(),
						U = _(I);
					{
						const F = (V, R) => {
							let j = () => R?.().props;
							{
								let J = y(() =>
									Q(
										'bg-background dark:bg-surface text-muted-foreground dark:text-surface-foreground/60 border-border/50 relative h-8 w-full justify-start border pl-2.5 font-normal shadow-sm sm:pr-12 md:w-40 lg:w-56 xl:w-64 dark:border-transparent dark:shadow-none'
									)
								);
								Fe(
									V,
									Y(j, {
										variant: 'secondary',
										get class() {
											return i(J);
										},
										onclick: () => k(r, !0),
										children: (X, ne) => {
											var D = ko(),
												z = O(_(D), 4),
												H = M(z);
											ur(H, () => ({ content: t.current ? '⌘' : 'Ctrl' }));
											var ee = O(H, 2);
											(ur(ee, () => ({
												content: 'K',
												class: 'aspect-square'
											})),
												A(z),
												d(X, D));
										},
										$$slots: { default: !0 }
									})
								);
							}
						};
						B(
							U,
							() => ho,
							(V, R) => {
								R(V, { child: F, $$slots: { child: !0 } });
							}
						);
					}
					var G = O(U, 2);
					(B(
						G,
						() => ao,
						(F, V) => {
							V(F, {
								showCloseButton: !1,
								class: 'bg-background rounded-xl border-none bg-clip-padding p-2 pb-2 shadow-2xl ring-4 ring-neutral-200/80 dark:bg-neutral-900 dark:shadow-2xl dark:ring-neutral-800',
								children: (R, j) => {
									var J = To(),
										X = _(J);
									B(
										X,
										() => co,
										(D, z) => {
											z(D, {
												class: 'sr-only',
												children: (H, ee) => {
													var ge = Po(),
														de = _(ge);
													B(
														de,
														() => fo,
														(ae, pe) => {
															pe(ae, {
																children: (Ce, Ut) => {
																	le();
																	var Ne =
																		be(
																			'Search documentation...'
																		);
																	d(Ce, Ne);
																},
																$$slots: { default: !0 }
															});
														}
													);
													var ve = O(de, 2);
													(B(
														ve,
														() => io,
														(ae, pe) => {
															pe(ae, {
																children: (Ce, Ut) => {
																	le();
																	var Ne = be('Search docs');
																	d(Ce, Ne);
																},
																$$slots: { default: !0 }
															});
														}
													),
														d(H, ge));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var ne = O(X, 2);
									(B(
										ne,
										() => ro,
										(D, z) => {
											z(D, {
												class: '**:data-[slot=command-input-wrapper]:bg-input/50 **:data-[slot=command-input-wrapper]:border-input rounded-none bg-transparent **:data-[slot=command-input]:!h-9 **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=command-input-wrapper]:!h-9 **:data-[slot=command-input-wrapper]:rounded-md **:data-[slot=command-input-wrapper]:border',
												children: (H, ee) => {
													var ge = Oo(),
														de = _(ge);
													B(
														de,
														() => bo,
														(ae, pe) => {
															pe(ae, {
																placeholder:
																	'Search documentation...',
																oninput: g,
																get value() {
																	return i(n);
																},
																set value(Ce) {
																	k(n, Ce, !0);
																}
															});
														}
													);
													var ve = O(de, 2);
													(B(
														ve,
														() => yo,
														(ae, pe) => {
															pe(ae, {
																class: 'no-scrollbar min-h-28 scroll-pt-2 scroll-pb-1.5 overflow-auto',
																children: (Ce, Ut) => {
																	var Ne = Mo(),
																		Jt = _(Ne);
																	B(
																		Jt,
																		() => vo,
																		(we, ke) => {
																			ke(we, {
																				class: 'text-muted-foreground py-12 text-center text-sm',
																				children: (
																					ze,
																					Ve
																				) => {
																					var ye = Io(),
																						Pe = _(ye);
																					{
																						var Xe = (
																							ie
																						) => {
																							var fe =
																								be(
																									'Building search index…'
																								);
																							d(
																								ie,
																								fe
																							);
																						};
																						q(
																							Pe,
																							(
																								ie
																							) => {
																								i(
																									l
																								) &&
																									ie(
																										Xe
																									);
																							}
																						);
																					}
																					var Re = O(
																						Pe,
																						2
																					);
																					{
																						var Le = (
																							ie
																						) => {
																							var fe =
																								be(
																									'Type to search documentation.'
																								);
																							d(
																								ie,
																								fe
																							);
																						};
																						q(
																							Re,
																							(
																								ie
																							) => {
																								i(
																									l
																								) ||
																									ie(
																										Le
																									);
																							}
																						);
																					}
																					d(ze, ye);
																				},
																				$$slots: {
																					default: !0
																				}
																			});
																		}
																	);
																	var Tr = O(Jt, 2);
																	{
																		var Nr = (we) => {
																				var ke = S(),
																					ze = _(ke);
																				(B(
																					ze,
																					() => lr,
																					(Ve, ye) => {
																						ye(Ve, {
																							heading:
																								'Search results',
																							class: '!p-0 [&_[data-command-group-heading]]:scroll-mt-16 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1',
																							children:
																								(
																									Pe,
																									Xe
																								) => {
																									var Re =
																											S(),
																										Le =
																											_(
																												Re
																											);
																									(Me(
																										Le,
																										17,
																										() =>
																											i(
																												a
																											),
																										(
																											ie
																										) =>
																											ie.id,
																										(
																											ie,
																											fe
																										) => {
																											{
																												let Qe =
																														y(
																															() =>
																																`${i(fe).title} ${i(fe).section}`
																														),
																													dt =
																														y(
																															() => [
																																i(
																																	fe
																																)
																																	.description,
																																...i(
																																	fe
																																)
																																	.headings
																															]
																														);
																												cr(
																													ie,
																													{
																														get value() {
																															return i(
																																Qe
																															);
																														},
																														get keywords() {
																															return i(
																																dt
																															);
																														},
																														onSelect:
																															() =>
																																v(
																																	() =>
																																		$t(
																																			i(
																																				fe
																																			)
																																				.href
																																		)
																																),
																														children:
																															(
																																ft,
																																Ge
																															) => {
																																var Ye =
																																		Ao(),
																																	Ze =
																																		_(
																																			Ye
																																		);
																																Xt(
																																	Ze,
																																	{}
																																);
																																var ht =
																																		O(
																																			Ze
																																		),
																																	Ke =
																																		O(
																																			ht
																																		),
																																	$e =
																																		M(
																																			Ke,
																																			!0
																																		);
																																(A(
																																	Ke
																																),
																																	te(
																																		() => {
																																			(he(
																																				ht,
																																				` ${i(fe).title ?? ''} `
																																			),
																																				he(
																																					$e,
																																					i(
																																						fe
																																					)
																																						.section
																																				));
																																		}
																																	),
																																	d(
																																		ft,
																																		Ye
																																	));
																															},
																														$$slots:
																															{
																																default:
																																	!0
																															}
																													}
																												);
																											}
																										}
																									),
																										d(
																											Pe,
																											Re
																										));
																								},
																							$$slots:
																								{
																									default:
																										!0
																								}
																						});
																					}
																				),
																					d(we, ke));
																			},
																			Vr = (we) => {
																				var ke = S(),
																					ze = _(ke);
																				(Me(
																					ze,
																					17,
																					() => _r,
																					(Ve) =>
																						Ve.title,
																					(Ve, ye) => {
																						var Pe =
																								S(),
																							Xe =
																								_(
																									Pe
																								);
																						(B(
																							Xe,
																							() =>
																								lr,
																							(
																								Re,
																								Le
																							) => {
																								Le(
																									Re,
																									{
																										get heading() {
																											return i(
																												ye
																											)
																												.title;
																										},
																										class: '!p-0 [&_[data-command-group-heading]]:scroll-mt-16 [&_[data-command-group-heading]]:!p-3 [&_[data-command-group-heading]]:!pb-1',
																										children:
																											(
																												ie,
																												fe
																											) => {
																												var Qe =
																														S(),
																													dt =
																														_(
																															Qe
																														);
																												(Me(
																													dt,
																													17,
																													() =>
																														i(
																															ye
																														)
																															.items,
																													rt,
																													(
																														ft,
																														Ge
																													) => {
																														{
																															let Ye =
																																y(
																																	() =>
																																		i(
																																			Ge
																																		).title?.toString()
																																			? `${i(ye).title} ${i(Ge).title}`
																																			: ''
																																);
																															cr(
																																ft,
																																{
																																	get value() {
																																		return i(
																																			Ye
																																		);
																																	},
																																	onSelect:
																																		() =>
																																			v(
																																				() =>
																																					i(
																																						Ge
																																					)
																																						.href &&
																																					$t(
																																						i(
																																							Ge
																																						)
																																							.href
																																					)
																																			),
																																	children:
																																		(
																																			Ze,
																																			ht
																																		) => {
																																			var Ke =
																																					Eo(),
																																				$e =
																																					_(
																																						Ke
																																					);
																																			Xt(
																																				$e,
																																				{}
																																			);
																																			var Rr =
																																				O(
																																					$e
																																				);
																																			(te(
																																				() =>
																																					he(
																																						Rr,
																																						` ${i(Ge).title ?? ''}`
																																					)
																																			),
																																				d(
																																					Ze,
																																					Ke
																																				));
																																		},
																																	$$slots:
																																		{
																																			default:
																																				!0
																																		}
																																}
																															);
																														}
																													}
																												),
																													d(
																														ie,
																														Qe
																													));
																											},
																										$$slots:
																											{
																												default:
																													!0
																											}
																									}
																								);
																							}
																						),
																							d(
																								Ve,
																								Pe
																							));
																					}
																				),
																					d(we, ke));
																			};
																		q(Tr, (we) => {
																			i(n)
																				? we(Nr)
																				: we(Vr, !1);
																		});
																	}
																	d(Ce, Ne);
																},
																$$slots: { default: !0 }
															});
														}
													),
														d(H, ge));
												},
												$$slots: { default: !0 }
											});
										}
									),
										d(R, J));
								},
								$$slots: { default: !0 }
							});
						}
					),
						d(x, I));
				},
				$$slots: { default: !0 }
			});
		}
	),
		d(o, p),
		N());
}
var Ro = vr(
	'<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"></path></svg>'
);
function Go(o, e) {
	var t = Ro();
	(te(() => nt(t, 0, bt(e.class))), d(o, t));
}
var Bo = P('<!> <span class="text-muted-foreground text-xs tabular-nums"> </span>', 1);
function Do(o, e) {
	T(e, !0);
	const t = 0;
	async function r() {
		try {
			return (
				(await (await fetch('https://ungh.cc/repos/pocket-id/pocket-id')).json()).repo
					?.stars ?? t
			);
		} catch (s) {
			return (console.error(s), t);
		}
	}
	let n = W(t);
	(Et(async () => {
		k(n, await r(), !0);
	}),
		Fe(o, {
			href: 'https://github.com/boyer-nicolas/opendrive',
			target: '_blank',
			rel: 'noreferrer',
			size: 'sm',
			variant: 'ghost',
			class: 'h-8 shadow-none',
			children: (s, a) => {
				var l = Bo(),
					c = _(l);
				Go(c, {});
				var u = O(c, 2),
					g = M(u, !0);
				(A(u),
					te(
						(v) => he(g, v),
						[
							() =>
								i(n) >= 1e3 ? `${(i(n) / 1e3).toFixed(1)}k` : i(n).toLocaleString()
						]
					),
					d(s, l));
			},
			$$slots: { default: !0 }
		}),
		N());
}
var Fo = vr(
	'<svg><path d="M506.6,0c209.52,0,379.98,170.45,379.98,379.96,0,82.33-25.9,160.68-74.91,226.54-48.04,64.59-113.78,111.51-190.13,135.71l-21.1,6.7-50.29-248.04,13.91-6.73c45.41-21.95,74.76-68.71,74.76-119.11,0-72.91-59.31-132.23-132.21-132.23s-132.23,59.32-132.23,132.23c0,50.4,29.36,97.16,74.77,119.11l13.65,6.61-81.01,499.24h-226.36V0h351.18Z"></path></svg>'
);
function zo(o, e) {
	let t = h(e, 'isDark', 3, !1),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'isDark', 'class']);
	var n = Fo();
	Z(n, () => ({
		xmlns: 'http://www.w3.org/2000/svg',
		version: '1.0',
		viewBox: '0 0 1000 1000',
		class: e.class || 'size-12',
		...r
	}));
	var s = M(n);
	(A(n), te(() => ct(s, 'fill', t() ? '#ffffff' : '#000000')), d(o, n));
}
var Lo = P('<nav></nav>');
function Ko(o, e) {
	T(e, !0);
	let t = h(e, 'class', 3, '');
	var r = Lo();
	(Me(
		r,
		21,
		() => e.items,
		rt,
		(n, s) => {
			{
				let a = y(() => Q(In.url.pathname === i(s).href && 'text-primary'));
				Fe(n, {
					get href() {
						return i(s).href;
					},
					variant: 'ghost',
					size: 'sm',
					get class() {
						return i(a);
					},
					children: (l, c) => {
						le();
						var u = be();
						(te(() => he(u, i(s).label)), d(l, u));
					},
					$$slots: { default: !0 }
				});
			}
		}
	),
		A(r),
		te(() => nt(r, 1, `${t() ?? ''} text-sm`)),
		d(o, r),
		N());
}
function jo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = h(e, 'sideOffset', 3, 4),
		n = h(e, 'align', 3, 'center'),
		s = K(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'sideOffset',
			'align',
			'portalProps'
		]);
	var a = S(),
		l = _(a);
	(B(
		l,
		() => pr,
		(c, u) => {
			u(
				c,
				Y(() => e.portalProps, {
					children: (g, v) => {
						var b = S(),
							p = _(b);
						{
							let m = y(() =>
								Q(
									'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--bits-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
									e.class
								)
							);
							B(
								p,
								() => Zs,
								(f, w) => {
									w(
										f,
										Y(
											{
												'data-slot': 'popover-content',
												get sideOffset() {
													return r();
												},
												get align() {
													return n();
												},
												get class() {
													return i(m);
												}
											},
											() => s,
											{
												get ref() {
													return t();
												},
												set ref(x) {
													t(x);
												}
											}
										)
									);
								}
							);
						}
						d(g, b);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		d(o, a),
		N());
}
function qo(o, e) {
	T(e, !0);
	let t = h(e, 'ref', 15, null),
		r = K(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var n = S(),
		s = _(n);
	{
		let a = y(() => Q('', e.class));
		B(
			s,
			() => eo,
			(l, c) => {
				c(
					l,
					Y(
						{
							'data-slot': 'popover-trigger',
							get class() {
								return i(a);
							}
						},
						() => r,
						{
							get ref() {
								return t();
							},
							set ref(u) {
								t(u);
							}
						}
					)
				);
			}
		);
	}
	(d(o, n), N());
}
const Ho = to;
var Wo = P('<a> </a>'),
	Uo = P(
		'<div class="relative flex h-8 w-4 items-center justify-center"><div class="relative size-4"><span></span> <span></span></div> <span class="sr-only">Toggle Menu</span></div> <span class="flex h-8 items-center text-lg leading-none font-medium">Menu</span>',
		1
	),
	Jo = P(
		'<div class="flex flex-col gap-4"><div class="text-muted-foreground text-sm font-medium"> </div> <div class="flex flex-col gap-3"></div></div>'
	),
	Xo = P(
		'<div class="flex flex-col gap-12 overflow-auto px-6 py-6"><div class="flex flex-col gap-4"><div class="text-muted-foreground text-sm font-medium">Menu</div> <div class="flex flex-col gap-3"><!> <!></div></div> <div class="flex flex-col gap-8"></div></div>'
	),
	Qo = P('<!> <!>', 1);
function Yo(o, e) {
	T(e, !0);
	const t = (l, c) => {
		let u = () => c?.().href,
			g = () => c?.().content,
			v = () => c?.().class,
			b = () => gr(c?.(), ['href', 'content', 'class']);
		var p = Wo(),
			m = () => {
				k(n, !1);
			};
		Z(p, (w) => ({ href: u(), onclick: m, class: w, ...b() }), [
			() => Q('text-2xl font-medium', v())
		]);
		var f = M(p, !0);
		(A(p), te(() => he(f, g())), d(l, p));
	};
	let r = K(e, ['$$slots', '$$events', '$$legacy', 'class']),
		n = W(!1);
	var s = S(),
		a = _(s);
	(B(
		a,
		() => Ho,
		(l, c) => {
			c(l, {
				get open() {
					return i(n);
				},
				set open(u) {
					k(n, u, !0);
				},
				children: (u, g) => {
					var v = Qo(),
						b = _(v);
					{
						const m = (f, w) => {
							let x = () => w?.().props;
							{
								let E = y(() =>
									Q(
										'extend-touch-target h-8 touch-manipulation items-center justify-start gap-2.5 !p-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent dark:hover:bg-transparent',
										e.class
									)
								);
								Fe(
									f,
									Y(x, () => r, {
										variant: 'ghost',
										get class() {
											return i(E);
										},
										children: (I, U) => {
											var G = Uo(),
												F = _(G),
												V = M(F),
												R = M(V),
												j = O(R, 2);
											(A(V),
												le(2),
												A(F),
												le(2),
												te(
													(J, X) => {
														(nt(R, 1, J), nt(j, 1, X));
													},
													[
														() =>
															bt(
																Q(
																	'bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100',
																	i(n)
																		? 'top-[0.4rem] -rotate-45'
																		: 'top-1'
																)
															),
														() =>
															bt(
																Q(
																	'bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100',
																	i(n)
																		? 'top-[0.4rem] rotate-45'
																		: 'top-2.5'
																)
															)
													]
												),
												d(I, G));
										},
										$$slots: { default: !0 }
									})
								);
							}
						};
						B(
							b,
							() => qo,
							(f, w) => {
								w(f, { child: m, $$slots: { child: !0 } });
							}
						);
					}
					var p = O(b, 2);
					(B(
						p,
						() => jo,
						(m, f) => {
							f(m, {
								class: 'bg-background/90 no-scrollbar h-(--bits-popover-content-available-height) w-(--bits-popover-content-available-width) overflow-y-auto rounded-none border-none p-0 shadow-none backdrop-blur duration-100',
								align: 'start',
								side: 'bottom',
								alignOffset: -16,
								sideOffset: 14,
								preventScroll: !0,
								children: (w, x) => {
									var E = Xo(),
										I = M(E),
										U = O(M(I), 2),
										G = M(U);
									t(G, () => ({ href: '/', content: 'Home' }));
									var F = O(G, 2);
									(Me(
										F,
										17,
										() => br,
										rt,
										(R, j) => {
											t(R, () => ({ href: i(j).href, content: i(j).label }));
										}
									),
										A(U),
										A(I));
									var V = O(I, 2);
									(Me(
										V,
										21,
										() => _r,
										(R) => R.title,
										(R, j) => {
											var J = Jo(),
												X = M(J),
												ne = M(X, !0);
											A(X);
											var D = O(X, 2);
											(Me(
												D,
												21,
												() => i(j).items,
												rt,
												(z, H) => {
													t(z, () => ({
														href: i(H).href,
														content: i(H).title
													}));
												}
											),
												A(D),
												A(J),
												te(() => he(ne, i(j).title)),
												d(R, J));
										}
									),
										A(V),
										A(E),
										d(w, E));
								},
								$$slots: { default: !0 }
							});
						}
					),
						d(u, v));
				},
				$$slots: { default: !0 }
			});
		}
	),
		d(o, s),
		N());
}
var Zo = P('<!> <!> <span class="sr-only">Toggle theme</span>', 1);
function $o(o) {
	Fe(o, {
		get onclick() {
			return ns;
		},
		variant: 'ghost',
		size: 'icon',
		children: (e, t) => {
			var r = Zo(),
				n = _(r);
			qr(n, {
				class: 'h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90'
			});
			var s = O(n, 2);
			(Hr(s, {
				class: 'absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0'
			}),
				le(2),
				d(e, r));
		},
		$$slots: { default: !0 }
	});
}
var ea = P('<!> <span class="sr-only">Opendrive</span>', 1),
	ta = P(
		'<header class="bg-background sticky top-0 z-50 w-full"><div class="container-wrapper px-6"><div class="flex h-16 items-center gap-2 **:data-[slot=separator]:!h-4"><!> <!> <!> <div class="ml-auto flex items-center gap-2 md:flex-1 md:justify-end"><div class="hidden w-full flex-1 md:flex md:w-auto md:flex-none"><!></div> <!> <!> <!> <!> <!> <!></div></div></div></header>'
	);
function ra(o, e) {
	T(e, !0);
	let t = W(''),
		r = W(!1);
	async function n() {
		try {
			return await (
				await fetch(
					'https://raw.githubusercontent.com/pocket-id/pocket-id/refs/heads/main/.version'
				)
			).text();
		} catch (G) {
			return (console.error('Error reading version file:', G), '');
		}
	}
	Et(() => {
		(n().then((F) => {
			F.trim() && k(t, F.trim(), !0);
		}),
			k(r, lt.current === 'dark'));
		const G = setInterval(() => {
			k(r, lt.current === 'dark');
		}, 100);
		return () => clearInterval(G);
	});
	var s = ta(),
		a = M(s),
		l = M(a),
		c = M(l);
	Yo(c, { class: 'flex lg:hidden' });
	var u = O(c, 2);
	Fe(u, {
		href: '/',
		variant: 'ghost',
		size: 'icon',
		class: 'hidden size-8 lg:flex',
		children: (G, F) => {
			var V = ea(),
				R = _(V);
			(zo(R, {
				get isDark() {
					return i(r);
				},
				class: 'size-5'
			}),
				le(2),
				d(G, V));
		},
		$$slots: { default: !0 }
	});
	var g = O(u, 2);
	Ko(g, {
		get items() {
			return br;
		},
		class: 'hidden lg:flex'
	});
	var v = O(g, 2),
		b = M(v),
		p = M(b);
	(Vo(p, {}), A(b));
	var m = O(b, 2);
	_t(m, { orientation: 'vertical' });
	var f = O(m, 2);
	{
		var w = (G) => {
			dn(G, {
				variant: 'default',
				class: 'bg-background dark:bg-surface border-border/50 dark:border-primary text-foreground border text-xs font-bold shadow-sm dark:shadow-none',
				children: (F, V) => {
					le();
					var R = be();
					(te(() => he(R, `v${i(t) ?? ''}`)), d(F, R));
				},
				$$slots: { default: !0 }
			});
		};
		q(f, (G) => {
			i(t) && G(w);
		});
	}
	var x = O(f, 2);
	_t(x, { orientation: 'vertical' });
	var E = O(x, 2);
	Do(E, {});
	var I = O(E, 2);
	_t(I, { orientation: 'vertical' });
	var U = O(I, 2);
	($o(U), A(v), A(l), A(a), A(s), d(o, s), N());
}
var na = P(
		'<meta name="description" content="Opendrive - A simple OIDC provider that allows users to authenticate with their passkeys to your services."/> <meta name="viewport" content="width=device-width, initial-scale=1"/>',
		1
	),
	sa = P(
		`<!> <span>Development environment — documentation may not reflect the production
						version</span>`,
		1
	),
	oa = P(
		'<!> <span>This documentation is for an unreleased version of Opendrive. See the <a href="https://pocket-id.org/docs" class="font-semibold text-blue-500 underline hover:text-blue-400">latest version</a> <!></span>',
		1
	),
	aa = P(
		'<div class="sticky top-0 z-[60] border-b border-blue-500 bg-blue-500/10 text-blue-500 backdrop-blur-sm dark:bg-blue-500/15"><div class="container-wrapper px-6 py-2"><div class="flex items-center justify-center gap-2 text-center text-[12px] font-medium"><!></div></div></div>'
	),
	ia = P(
		'<!> <!> <div class="bg-background text-foreground flex min-h-screen flex-col"><!> <main class="flex-1"><!></main></div>',
		1
	);
function _a(o, e) {
	T(e, !0);
	let t = W(!1),
		r = W(!1),
		n = W(void 0);
	async function s() {
		try {
			return await (
				await fetch(
					'https://raw.githubusercontent.com/pocket-id/pocket-id/refs/heads/main/.version'
				)
			).text();
		} catch {
			return '';
		}
	}
	if (typeof window < 'u') {
		const m = window.location.hostname;
		m === 'pocket-id.org' ||
			(k(t, !0),
			k(r, m === 'localhost' || m === '127.0.0.1', !0),
			s().then((w) => {
				k(n, w?.trim() || void 0, !0);
			}));
	}
	var a = ia();
	fr((m) => {
		var f = na();
		((mr.title = 'Opendrive'), le(2), d(m, f));
	});
	var l = _(a);
	fs(l, { disableTransitions: !1 });
	var c = O(l, 2);
	{
		var u = (m) => {
			var f = aa(),
				w = M(f),
				x = M(w),
				E = M(x);
			{
				var I = (G) => {
						var F = sa(),
							V = _(F);
						(Wr(V, { class: 'size-4' }), le(2), d(G, F));
					},
					U = (G) => {
						var F = oa(),
							V = _(F);
						Ur(V, { class: 'size-4' });
						var R = O(V, 2),
							j = O(M(R), 3);
						{
							var J = (X) => {
								var ne = be();
								(te(() => he(ne, `(v${i(n) ?? ''})`)), d(X, ne));
							};
							q(j, (X) => {
								i(n) && X(J);
							});
						}
						(A(R), d(G, F));
					};
				q(E, (G) => {
					i(r) ? G(I) : G(U, !1);
				});
			}
			(A(x), A(w), A(f), d(m, f));
		};
		q(c, (m) => {
			i(t) && m(u);
		});
	}
	var g = O(c, 2),
		v = M(g);
	ra(v, {});
	var b = O(v, 2),
		p = M(b);
	(L(p, () => e.children), A(b), A(g), d(o, a), N());
}
export { _a as component };
