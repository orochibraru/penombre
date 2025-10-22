import {
	x as l,
	A as k,
	y as b,
	aj as _,
	C as d,
	U as N,
	Q as F,
	at as H,
	au as T,
	av as V,
	am as h,
	W as D,
	X as x,
	Y as $,
	M as z,
	N as K,
	p as G,
	h as C,
	a as P,
	w as Q,
	b as I,
	c as Y,
	u as q,
	v as J
} from './ZGPguNnN.js';
import { p as X } from './CU2VXAWn.js';
function Z(t, n) {
	let e = null;
	if (!t || typeof t != 'string') return e;
	const r = X(t),
		o = typeof n == 'function';
	return (
		r.forEach((i) => {
			if (i.type !== 'declaration') return;
			const { property: s, value: a } = i;
			o ? n(s, a, i) : a && ((e = e || {}), (e[s] = a));
		}),
		e
	);
}
function tt(t) {
	return typeof t == 'function';
}
function nt(t) {
	return t !== null && typeof t == 'object';
}
const et = ['string', 'number', 'bigint', 'boolean'];
function O(t) {
	return t == null || et.includes(typeof t)
		? !0
		: Array.isArray(t)
			? t.every((n) => O(n))
			: typeof t == 'object'
				? Object.getPrototypeOf(t) === Object.prototype
				: !1;
}
const m = Symbol('box'),
	v = Symbol('is-writable');
function j(t, n) {
	const e = k(t);
	return n
		? {
				[m]: !0,
				[v]: !0,
				get current() {
					return l(e);
				},
				set current(r) {
					n(r);
				}
			}
		: {
				[m]: !0,
				get current() {
					return t();
				}
			};
}
function S(t) {
	return nt(t) && m in t;
}
function R(t) {
	return S(t) && v in t;
}
function Ut(t) {
	return S(t) ? t : tt(t) ? j(t) : U(t);
}
function Mt(t) {
	return Object.entries(t).reduce(
		(n, [e, r]) =>
			S(r)
				? (R(r)
						? Object.defineProperty(n, e, {
								get() {
									return r.current;
								},
								set(o) {
									r.current = o;
								}
							})
						: Object.defineProperty(n, e, {
								get() {
									return r.current;
								}
							}),
					n)
				: Object.assign(n, { [e]: r }),
		{}
	);
}
function Wt(t) {
	return R(t)
		? {
				[m]: !0,
				get current() {
					return t.current;
				}
			}
		: t;
}
function U(t) {
	let n = b(_(t));
	return {
		[m]: !0,
		[v]: !0,
		get current() {
			return l(n);
		},
		set current(e) {
			d(n, e, !0);
		}
	};
}
function rt(...t) {
	return function (n) {
		for (const e of t)
			if (e) {
				if (n.defaultPrevented) return;
				typeof e == 'function' ? e.call(this, n) : e.current?.call(this, n);
			}
	};
}
const ot = /\d/,
	st = ['-', '_', '/', '.'];
function it(t = '') {
	if (!ot.test(t)) return t !== t.toLowerCase();
}
function at(t) {
	const n = [];
	let e = '',
		r,
		o;
	for (const i of t) {
		const s = st.includes(i);
		if (s === !0) {
			(n.push(e), (e = ''), (r = void 0));
			continue;
		}
		const a = it(i);
		if (o === !1) {
			if (r === !1 && a === !0) {
				(n.push(e), (e = i), (r = a));
				continue;
			}
			if (r === !0 && a === !1 && e.length > 1) {
				const u = e.at(-1);
				(n.push(e.slice(0, Math.max(0, e.length - 1))), (e = u + i), (r = a));
				continue;
			}
		}
		((e += i), (r = a), (o = s));
	}
	return (n.push(e), n);
}
function M(t) {
	return t
		? at(t)
				.map((n) => ut(n))
				.join('')
		: '';
}
function ct(t) {
	return ft(M(t || ''));
}
function ut(t) {
	return t ? t[0].toUpperCase() + t.slice(1) : '';
}
function ft(t) {
	return t ? t[0].toLowerCase() + t.slice(1) : '';
}
function y(t) {
	if (!t) return {};
	const n = {};
	function e(r, o) {
		if (
			r.startsWith('-moz-') ||
			r.startsWith('-webkit-') ||
			r.startsWith('-ms-') ||
			r.startsWith('-o-')
		) {
			n[M(r)] = o;
			return;
		}
		if (r.startsWith('--')) {
			n[r] = o;
			return;
		}
		n[ct(r)] = o;
	}
	return (Z(t, e), n);
}
function W(...t) {
	return (...n) => {
		for (const e of t) typeof e == 'function' && e(...n);
	};
}
function lt(t, n) {
	const e = RegExp(t, 'g');
	return (r) => {
		if (typeof r != 'string')
			throw new TypeError(`expected an argument of type string, but got ${typeof r}`);
		return r.match(e) ? r.replace(e, n) : r;
	};
}
const dt = lt(/[A-Z]/, (t) => `-${t.toLowerCase()}`);
function pt(t) {
	if (!t || typeof t != 'object' || Array.isArray(t))
		throw new TypeError(`expected an argument of type object, but got ${typeof t}`);
	return Object.keys(t).map((n) => `${dt(n)}: ${t[n]};`).join(`
`);
}
function ht(t = {}) {
	return pt(t).replace(
		`
`,
		' '
	);
}
const mt = [
		'onabort',
		'onanimationcancel',
		'onanimationend',
		'onanimationiteration',
		'onanimationstart',
		'onauxclick',
		'onbeforeinput',
		'onbeforetoggle',
		'onblur',
		'oncancel',
		'oncanplay',
		'oncanplaythrough',
		'onchange',
		'onclick',
		'onclose',
		'oncompositionend',
		'oncompositionstart',
		'oncompositionupdate',
		'oncontextlost',
		'oncontextmenu',
		'oncontextrestored',
		'oncopy',
		'oncuechange',
		'oncut',
		'ondblclick',
		'ondrag',
		'ondragend',
		'ondragenter',
		'ondragleave',
		'ondragover',
		'ondragstart',
		'ondrop',
		'ondurationchange',
		'onemptied',
		'onended',
		'onerror',
		'onfocus',
		'onfocusin',
		'onfocusout',
		'onformdata',
		'ongotpointercapture',
		'oninput',
		'oninvalid',
		'onkeydown',
		'onkeypress',
		'onkeyup',
		'onload',
		'onloadeddata',
		'onloadedmetadata',
		'onloadstart',
		'onlostpointercapture',
		'onmousedown',
		'onmouseenter',
		'onmouseleave',
		'onmousemove',
		'onmouseout',
		'onmouseover',
		'onmouseup',
		'onpaste',
		'onpause',
		'onplay',
		'onplaying',
		'onpointercancel',
		'onpointerdown',
		'onpointerenter',
		'onpointerleave',
		'onpointermove',
		'onpointerout',
		'onpointerover',
		'onpointerup',
		'onprogress',
		'onratechange',
		'onreset',
		'onresize',
		'onscroll',
		'onscrollend',
		'onsecuritypolicyviolation',
		'onseeked',
		'onseeking',
		'onselect',
		'onselectionchange',
		'onselectstart',
		'onslotchange',
		'onstalled',
		'onsubmit',
		'onsuspend',
		'ontimeupdate',
		'ontoggle',
		'ontouchcancel',
		'ontouchend',
		'ontouchmove',
		'ontouchstart',
		'ontransitioncancel',
		'ontransitionend',
		'ontransitionrun',
		'ontransitionstart',
		'onvolumechange',
		'onwaiting',
		'onwebkitanimationend',
		'onwebkitanimationiteration',
		'onwebkitanimationstart',
		'onwebkittransitionend',
		'onwheel'
	],
	gt = new Set(mt);
function yt(t) {
	return gt.has(t);
}
function Lt(...t) {
	const n = { ...t[0] };
	for (let e = 1; e < t.length; e++) {
		const r = t[e];
		if (r) {
			for (const o of Object.keys(r)) {
				const i = n[o],
					s = r[o],
					a = typeof i == 'function',
					u = typeof s == 'function';
				if (a && yt(o)) {
					const c = i,
						f = s;
					n[o] = rt(c, f);
				} else if (a && u) n[o] = W(i, s);
				else if (o === 'class') {
					const c = O(i),
						f = O(s);
					c && f ? (n[o] = N(i, s)) : c ? (n[o] = N(i)) : f && (n[o] = N(s));
				} else if (o === 'style') {
					const c = typeof i == 'object',
						f = typeof s == 'object',
						w = typeof i == 'string',
						E = typeof s == 'string';
					if (c && f) n[o] = { ...i, ...s };
					else if (c && E) {
						const p = y(s);
						n[o] = { ...i, ...p };
					} else if (w && f) {
						const p = y(i);
						n[o] = { ...p, ...s };
					} else if (w && E) {
						const p = y(i),
							B = y(s);
						n[o] = { ...p, ...B };
					} else c ? (n[o] = i) : f ? (n[o] = s) : w ? (n[o] = i) : E && (n[o] = s);
				} else n[o] = s !== void 0 ? s : i;
			}
			for (const o of Object.getOwnPropertySymbols(r)) {
				const i = n[o],
					s = r[o];
				n[o] = s !== void 0 ? s : i;
			}
		}
	}
	return (
		typeof n.style == 'object' &&
			(n.style = ht(n.style).replaceAll(
				`
`,
				' '
			)),
		n.hidden === !1 && ((n.hidden = void 0), delete n.hidden),
		n.disabled === !1 && ((n.disabled = void 0), delete n.disabled),
		n
	);
}
function Bt(t) {
	F().then(t);
}
function Ft(t, n) {
	return {
		[H()]: (e) =>
			S(t)
				? ((t.current = e),
					T(() => n?.(e)),
					() => {
						('isConnected' in e && e.isConnected) || ((t.current = null), n?.(null));
					})
				: (t(e),
					T(() => n?.(e)),
					() => {
						('isConnected' in e && e.isConnected) || (t(null), n?.(null));
					})
	};
}
const bt = typeof window < 'u' ? window : void 0;
function At(t) {
	let n = t.activeElement;
	for (; n?.shadowRoot; ) {
		const e = n.shadowRoot.activeElement;
		if (e === n) break;
		n = e;
	}
	return n;
}
class St {
	#t;
	#n;
	constructor(n = {}) {
		const { window: e = bt, document: r = e?.document } = n;
		e !== void 0 &&
			((this.#t = r),
			(this.#n = V((o) => {
				const i = h(e, 'focusin', o),
					s = h(e, 'focusout', o);
				return () => {
					(i(), s());
				};
			})));
	}
	get current() {
		return (this.#n?.(), this.#t ? At(this.#t) : null);
	}
}
new St();
class Ht {
	#t;
	#n;
	constructor(n) {
		((this.#t = n), (this.#n = Symbol(n)));
	}
	get key() {
		return this.#n;
	}
	exists() {
		return D(this.#n);
	}
	get() {
		const n = x(this.#n);
		if (n === void 0) throw new Error(`Context "${this.#t}" not found`);
		return n;
	}
	getOr(n) {
		const e = x(this.#n);
		return e === void 0 ? n : e;
	}
	set(n) {
		return $(this.#n, n);
	}
}
function wt(t, n) {
	switch (t) {
		case 'post':
			K(n);
			break;
		case 'pre':
			z(n);
			break;
	}
}
function L(t, n, e, r = {}) {
	const { lazy: o = !1 } = r;
	let i = !o,
		s = Array.isArray(t) ? [] : void 0;
	wt(n, () => {
		const a = Array.isArray(t) ? t.map((c) => c()) : t();
		if (!i) {
			((i = !0), (s = a));
			return;
		}
		const u = T(() => e(a, s));
		return ((s = a), u);
	});
}
function g(t, n, e) {
	L(t, 'post', n, e);
}
function Et(t, n, e) {
	L(t, 'pre', n, e);
}
g.pre = Et;
class Nt {
	#t = b(void 0);
	constructor(n, e) {
		(e !== void 0 && d(this.#t, e, !0),
			g(
				() => n(),
				(r, o) => {
					d(this.#t, o, !0);
				}
			));
	}
	get current() {
		return l(this.#t);
	}
}
function Vt(t) {
	return t ? 'true' : 'false';
}
function Dt(t) {
	return t ? 'true' : void 0;
}
function $t(t) {
	return t ? '' : void 0;
}
function zt(t) {
	return t ? 'open' : 'closed';
}
class Tt {
	#t;
	#n;
	attrs;
	constructor(n) {
		((this.#t = n.getVariant ? n.getVariant() : null),
			(this.#n = this.#t ? `data-${this.#t}-` : `data-${n.component}-`),
			(this.getAttr = this.getAttr.bind(this)),
			(this.selector = this.selector.bind(this)),
			(this.attrs = Object.fromEntries(n.parts.map((e) => [e, this.getAttr(e)]))));
	}
	getAttr(n, e) {
		return e ? `data-${e}-${n}` : `${this.#n}${n}`;
	}
	selector(n, e) {
		return `[${this.getAttr(n, e)}]`;
	}
}
function Kt(t) {
	const n = new Tt(t);
	return { ...n.attrs, selector: n.selector, getAttr: n.getAttr };
}
const Gt = 'ArrowDown',
	Qt = 'ArrowLeft',
	Yt = 'ArrowRight',
	qt = 'ArrowUp',
	Jt = 'End',
	Xt = 'Enter',
	Zt = 'Escape',
	tn = 'Home',
	nn = ' ',
	en = 'p',
	rn = 'n',
	on = 'j',
	sn = 'k',
	an = 'h',
	cn = 'l',
	Ot = typeof document < 'u',
	un = vt();
function vt() {
	return (
		Ot &&
		window?.navigator?.userAgent &&
		(/iP(ad|hone|od)/.test(window.navigator.userAgent) ||
			(window?.navigator?.maxTouchPoints > 2 &&
				/iPad|Macintosh/.test(window?.navigator.userAgent)))
	);
}
function fn(t) {
	return t instanceof HTMLElement;
}
function ln(t) {
	return t instanceof Element;
}
function dn(t) {
	return t.matches(':focus-visible');
}
function pn(t) {
	return t !== null;
}
function hn() {}
function mn(t, n) {
	return `bits-${t}`;
}
class xt {
	state;
	#t;
	constructor(n, e) {
		((this.state = U(n)), (this.#t = e), (this.dispatch = this.dispatch.bind(this)));
	}
	#n(n) {
		return this.#t[this.state.current][n] ?? this.state.current;
	}
	dispatch(n) {
		this.state.current = this.#n(n);
	}
}
const Ct = {
	mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
	unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
	unmounted: { MOUNT: 'mounted' }
};
class Pt {
	opts;
	#t = b('none');
	get prevAnimationNameState() {
		return l(this.#t);
	}
	set prevAnimationNameState(n) {
		d(this.#t, n, !0);
	}
	#n = b(_({}));
	get styles() {
		return l(this.#n);
	}
	set styles(n) {
		d(this.#n, n, !0);
	}
	initialStatus;
	previousPresent;
	machine;
	present;
	constructor(n) {
		((this.opts = n),
			(this.present = this.opts.open),
			(this.initialStatus = n.open.current ? 'mounted' : 'unmounted'),
			(this.previousPresent = new Nt(() => this.present.current)),
			(this.machine = new xt(this.initialStatus, Ct)),
			(this.handleAnimationEnd = this.handleAnimationEnd.bind(this)),
			(this.handleAnimationStart = this.handleAnimationStart.bind(this)),
			It(this),
			kt(this),
			_t(this));
	}
	handleAnimationEnd(n) {
		if (!this.opts.ref.current) return;
		const e = A(this.opts.ref.current),
			r = e.includes(n.animationName) || e === 'none';
		n.target === this.opts.ref.current && r && this.machine.dispatch('ANIMATION_END');
	}
	handleAnimationStart(n) {
		this.opts.ref.current &&
			n.target === this.opts.ref.current &&
			(this.prevAnimationNameState = A(this.opts.ref.current));
	}
	#e = k(() => ['mounted', 'unmountSuspended'].includes(this.machine.state.current));
	get isPresent() {
		return l(this.#e);
	}
	set isPresent(n) {
		d(this.#e, n);
	}
}
function It(t) {
	g(
		() => t.present.current,
		() => {
			if (!t.opts.ref.current || !(t.present.current !== t.previousPresent.current)) return;
			const e = t.prevAnimationNameState,
				r = A(t.opts.ref.current);
			if (t.present.current) t.machine.dispatch('MOUNT');
			else if (r === 'none' || t.styles.display === 'none') t.machine.dispatch('UNMOUNT');
			else {
				const o = e !== r;
				t.previousPresent.current && o
					? t.machine.dispatch('ANIMATION_OUT')
					: t.machine.dispatch('UNMOUNT');
			}
		}
	);
}
function kt(t) {
	g(
		() => t.machine.state.current,
		() => {
			if (!t.opts.ref.current) return;
			const n = A(t.opts.ref.current);
			t.prevAnimationNameState = t.machine.state.current === 'mounted' ? n : 'none';
		}
	);
}
function _t(t) {
	g(
		() => t.opts.ref.current,
		() => {
			if (t.opts.ref.current)
				return (
					(t.styles = getComputedStyle(t.opts.ref.current)),
					W(
						h(t.opts.ref.current, 'animationstart', t.handleAnimationStart),
						h(t.opts.ref.current, 'animationcancel', t.handleAnimationEnd),
						h(t.opts.ref.current, 'animationend', t.handleAnimationEnd)
					)
				);
		}
	);
}
function A(t) {
	return (t && getComputedStyle(t).animationName) || 'none';
}
function gn(t, n) {
	G(n, !0);
	const e = new Pt({ open: j(() => n.open), ref: n.ref });
	var r = C(),
		o = P(r);
	{
		var i = (s) => {
			var a = C(),
				u = P(a);
			(q(
				u,
				() => n.presence ?? J,
				() => ({ present: e.isPresent })
			),
				I(s, a));
		};
		Q(o, (s) => {
			(n.forceMount || n.open || e.isPresent) && s(i);
		});
	}
	(I(t, r), Y());
}
export {
	qt as A,
	m as B,
	Ht as C,
	nt as D,
	Jt as E,
	bt as F,
	Ot as G,
	tn as H,
	Zt as I,
	rt as J,
	un as K,
	y as L,
	pn as M,
	ht as N,
	Dt as O,
	gn as P,
	an as Q,
	sn as R,
	nn as S,
	en as T,
	cn as U,
	on as V,
	rn as W,
	j as a,
	Ut as b,
	Mt as c,
	S as d,
	R as e,
	Yt as f,
	Qt as g,
	Gt as h,
	v as i,
	fn as j,
	Ft as k,
	$t as l,
	zt as m,
	Kt as n,
	Xt as o,
	Vt as p,
	Bt as q,
	mn as r,
	hn as s,
	Wt as t,
	Lt as u,
	W as v,
	g as w,
	ln as x,
	U as y,
	dn as z
};
