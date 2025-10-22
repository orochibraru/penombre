import {
	W as ot,
	X as K,
	Y as ct,
	y as M,
	x as d,
	C as m,
	A as j,
	p as q,
	k as h,
	f as P,
	o as lt,
	q as A,
	d as D,
	j as ht,
	s as Z,
	u as O,
	v as G,
	r as L,
	m as tt,
	b as v,
	c as E,
	Z as I,
	a as k,
	w as F,
	_ as ut,
	n as V,
	a0 as W,
	h as X,
	a1 as dt,
	a2 as gt,
	P as ft,
	z as Q
} from './ZGPguNnN.js';
import { h as vt, D as yt, b as T, c as mt } from './CXunQUVT.js';
import { c as H, B as _t } from './BBPflcbS.js';
import './CU2VXAWn.js';
class et {
	#t;
	#e;
	constructor(t) {
		((this.#t = t), (this.#e = Symbol(t)));
	}
	get key() {
		return this.#e;
	}
	exists() {
		return ot(this.#e);
	}
	get() {
		const t = K(this.#e);
		if (t === void 0) throw new Error(`Context "${this.#t}" not found`);
		return t;
	}
	getOr(t) {
		const e = K(this.#e);
		return e === void 0 ? t : e;
	}
	set(t) {
		return ct(this.#e, t);
	}
}
class xt {
	constructor(t, e) {
		((this.opts = t),
			(this.overflow = e),
			vt.then((i) => {
				this.highlighter = i;
			}));
	}
	#t = M(null);
	get highlighter() {
		return d(this.#t);
	}
	set highlighter(t) {
		m(this.#t, t, !0);
	}
	highlight(t) {
		return this.highlighter?.codeToHtml(t, {
			lang: this.opts.lang.current,
			themes: { light: 'github-light-default', dark: 'github-dark-default' },
			transformers: [
				{
					pre: (e) => (
						(e.properties.style = ''),
						this.opts.hideLines.current || (e.properties.class += ' line-numbers'),
						e
					),
					line: (e, i) => (
						bt(i, this.opts.highlight.current) &&
							(e.properties.class = `${e.properties.class} line--highlighted`),
						e
					)
				}
			]
		});
	}
	get code() {
		return this.opts.code.current;
	}
	#e = j(() => yt.sanitize(this.highlight(this.code) ?? ''));
	get highlighted() {
		return d(this.#e);
	}
	set highlighted(t) {
		m(this.#e, t);
	}
}
function bt(s, t) {
	if (!t) return !1;
	let e = !1;
	for (const i of t) {
		if (typeof i == 'number') {
			if (s === i) {
				e = !0;
				break;
			}
			continue;
		}
		if (i[0] <= s && s <= i[1]) {
			e = !0;
			break;
		}
	}
	return e;
}
class Ct {
	constructor(t) {
		this.root = t;
	}
	get code() {
		return this.root.opts.code.current;
	}
}
const pt = new et('code-overflow-state'),
	st = new et('code-root-state');
function wt(s) {
	let t;
	try {
		t = pt.get();
	} catch {}
	return st.set(new xt(s, t));
}
function zt() {
	return new Ct(st.get());
}
var kt = P('<div><!> <!></div>');
function Pt(s, t) {
	q(t, !0);
	let e = h(t, 'ref', 15, null),
		i = h(t, 'variant', 3, 'default'),
		r = h(t, 'lang', 3, 'typescript'),
		n = h(t, 'hideLines', 3, !1),
		o = h(t, 'highlight', 19, () => []),
		a = A(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'variant',
			'lang',
			'code',
			'class',
			'hideLines',
			'highlight',
			'children'
		]);
	const g = wt({
		code: T.with(() => t.code),
		hideLines: T.with(() => n()),
		highlight: T.with(() => o()),
		lang: T.with(() => r())
	});
	var u = kt();
	lt(u, (l) => ({ ...a, class: l }), [() => H(mt({ variant: i() }), t.class)]);
	var c = D(u);
	ht(c, () => g.highlighted);
	var f = Z(c, 2);
	(O(f, () => t.children ?? G),
		L(u),
		tt(
			u,
			(l) => e(l),
			() => e()
		),
		v(s, u),
		E());
}
function it(s) {
	const t = s - 1;
	return t * t * t + 1;
}
function $(s) {
	const t = typeof s == 'string' && s.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	return t ? [parseFloat(t[1]), t[2] || 'px'] : [s, 'px'];
}
function Et(
	s,
	{ delay: t = 0, duration: e = 400, easing: i = it, x: r = 0, y: n = 0, opacity: o = 0 } = {}
) {
	const a = getComputedStyle(s),
		g = +a.opacity,
		u = a.transform === 'none' ? '' : a.transform,
		c = g * (1 - o),
		[f, l] = $(r),
		[C, S] = $(n);
	return {
		delay: t,
		duration: e,
		easing: i,
		css: (p, B) => `
			transform: ${u} translate(${(1 - p) * f}${l}, ${(1 - p) * C}${S});
			opacity: ${g - c * B}`
	};
}
function Y(
	s,
	{ delay: t = 0, duration: e = 400, easing: i = it, start: r = 0, opacity: n = 0 } = {}
) {
	const o = getComputedStyle(s),
		a = +o.opacity,
		g = o.transform === 'none' ? '' : o.transform,
		u = 1 - r,
		c = a * (1 - n);
	return {
		delay: t,
		duration: e,
		easing: i,
		css: (f, l) => `
			transform: ${g} scale(${1 - u * l});
			opacity: ${a - c * l}
		`
	};
}
class St {
	#t = M();
	delay;
	timeout = void 0;
	constructor({ delay: t = 500 } = {}) {
		this.delay = t;
	}
	async copy(t) {
		this.timeout && (m(this.#t, void 0), clearTimeout(this.timeout));
		try {
			(await navigator.clipboard.writeText(t),
				m(this.#t, 'success'),
				(this.timeout = setTimeout(() => {
					m(this.#t, void 0);
				}, this.delay)));
		} catch {
			(m(this.#t, 'failure'),
				(this.timeout = setTimeout(() => {
					m(this.#t, void 0);
				}, this.delay)));
		}
		return d(this.#t);
	}
	get copied() {
		return d(this.#t) === 'success';
	}
	get status() {
		return d(this.#t);
	}
}
var Bt = P('<div><!> <span class="sr-only">Copied</span></div>'),
	Dt = P('<div><!> <span class="sr-only">Failed to copy</span></div>'),
	Lt = P('<div><!> <span class="sr-only">Copy</span></div>'),
	Tt = P('<!> <!>', 1);
function Ft(s, t) {
	q(t, !0);
	let e = h(t, 'ref', 15, null),
		i = h(t, 'animationDuration', 3, 500),
		r = h(t, 'variant', 3, 'ghost'),
		n = h(t, 'size', 7, 'icon'),
		o = h(t, 'tabindex', 19, () => -1),
		a = A(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'text',
			'icon',
			'animationDuration',
			'variant',
			'size',
			'onCopy',
			'class',
			'tabindex',
			'children'
		]);
	n() === 'icon' && t.children && n('default');
	const g = new St();
	{
		let u = j(() => H('flex items-center gap-2', t.class));
		_t(
			s,
			I(() => a, {
				get variant() {
					return r();
				},
				get size() {
					return n();
				},
				get tabindex() {
					return o();
				},
				get class() {
					return d(u);
				},
				type: 'button',
				name: 'copy',
				onclick: async () => {
					const c = await g.copy(t.text);
					t.onCopy?.(c);
				},
				get ref() {
					return e();
				},
				set ref(c) {
					e(c);
				},
				children: (c, f) => {
					var l = Tt(),
						C = k(l);
					{
						var S = (_) => {
								var x = Bt(),
									w = D(x);
								(ut(w, { tabindex: -1 }),
									V(2),
									L(x),
									W(
										1,
										x,
										() => Y,
										() => ({ duration: i(), start: 0.85 })
									),
									v(_, x));
							},
							p = (_) => {
								var x = X(),
									w = k(x);
								{
									var N = (b) => {
											var y = Dt(),
												U = D(y);
											(dt(U, { tabindex: -1 }),
												V(2),
												L(y),
												W(
													1,
													y,
													() => Y,
													() => ({ duration: i(), start: 0.85 })
												),
												v(b, y));
										},
										R = (b) => {
											var y = Lt(),
												U = D(y);
											{
												var nt = (z) => {
														var J = X(),
															rt = k(J);
														(O(rt, () => t.icon), v(z, J));
													},
													at = (z) => {
														gt(z, { tabindex: -1 });
													};
												F(U, (z) => {
													t.icon ? z(nt) : z(at, !1);
												});
											}
											(V(2),
												L(y),
												W(
													1,
													y,
													() => Y,
													() => ({ duration: i(), start: 0.85 })
												),
												v(b, y));
										};
									F(
										w,
										(b) => {
											g.status === 'failure' ? b(N) : b(R, !1);
										},
										!0
									);
								}
								v(_, x);
							};
						F(C, (_) => {
							g.status === 'success' ? _(S) : _(p, !1);
						});
					}
					var B = Z(C, 2);
					(O(B, () => t.children ?? G), v(c, l));
				},
				$$slots: { default: !0 }
			})
		);
	}
	E();
}
function Mt(s, t) {
	(q(t, !0), h(t, 'ref', 11, null));
	let e = h(t, 'variant', 3, 'ghost'),
		i = h(t, 'size', 3, 'icon'),
		r = A(t, ['$$slots', '$$events', '$$legacy', 'ref', 'variant', 'size', 'class']);
	const n = zt();
	{
		let o = j(() => H('absolute top-2 right-2', t.class));
		Ft(
			s,
			I(
				{
					get class() {
						return d(o);
					},
					get text() {
						return n.code;
					},
					get variant() {
						return e();
					},
					get size() {
						return i();
					}
				},
				() => r
			)
		);
	}
	E();
}
var Ot = P('<div style="display: none;"><!></div> <!>', 1);
function Ht(s, t) {
	q(t, !0);
	let e = h(t, 'lang', 3, 'bash'),
		i = A(t, ['$$slots', '$$events', '$$legacy', 'class', 'children', 'lang']),
		r = M(void 0),
		n = M('');
	ft(() => {
		d(r) && m(n, d(r).textContent?.trim() || '', !0);
	});
	var o = Ot(),
		a = k(o),
		g = D(a);
	(O(g, () => t.children ?? G),
		L(a),
		tt(
			a,
			(f) => m(r, f),
			() => d(r)
		));
	var u = Z(a, 2);
	{
		var c = (f) => {
			var l = X(),
				C = k(l);
			{
				let S = j(() => H('mt-3 w-full max-w-none', t.class));
				Q(
					C,
					() => Pt,
					(p, B) => {
						B(
							p,
							I(
								{
									get lang() {
										return e();
									},
									get class() {
										return d(S);
									}
								},
								() => i,
								{
									get code() {
										return d(n);
									},
									children: (_, x) => {
										var w = X(),
											N = k(w);
										(Q(
											N,
											() => Mt,
											(R, b) => {
												b(R, { size: 'sm', variant: 'ghost' });
											}
										),
											v(_, w));
									},
									$$slots: { default: !0 }
								}
							)
						);
					}
				);
			}
			v(f, l);
		};
		F(u, (f) => {
			d(n) && f(c);
		});
	}
	(v(s, o), E());
}
export { et as C, Ht as P, Et as f };
