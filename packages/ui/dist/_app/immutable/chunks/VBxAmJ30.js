import {
	b8 as $,
	h as I,
	U as P,
	bd as K,
	P as y,
	A as m,
	J as V,
	ak as z,
	I as H,
	u as W,
	v as U,
	ab as L,
	aa as O,
	ac as M,
	x as G,
	z as q
} from './BW6z9EX9.js';
import { l as j, o as R } from './DzGRxXYC.js';
import { d as w } from './BPMCz5tT.js';
import { p as J, c as Y } from './DzxQehGt.js';
function X() {
	return Symbol($);
}
function Kt(t, e, n = e) {
	var r = K(),
		o = new WeakSet();
	(j(t, 'input', (s) => {
		var i = s ? t.defaultValue : t.value;
		if (((i = x(t) ? v(i) : i), n(i), y !== null && o.add(y), r && i !== (i = e()))) {
			var a = t.selectionStart,
				l = t.selectionEnd;
			((t.value = i ?? ''),
				l !== null && ((t.selectionStart = a), (t.selectionEnd = Math.min(l, t.value.length))));
		}
	}),
		((I && t.defaultValue !== t.value) || (m(e) == null && t.value)) &&
			(n(x(t) ? v(t.value) : t.value), y !== null && o.add(y)),
		P(() => {
			var s = e();
			(t === document.activeElement && o.has(y)) ||
				(x(t) && s === v(t.value)) ||
				(t.type === 'date' && !s && !t.value) ||
				(s !== t.value && (t.value = s ?? ''));
		}));
}
function x(t) {
	var e = t.type;
	return e === 'number' || e === 'range';
}
function v(t) {
	return t === '' ? null : +t;
}
function Vt(t, e, n = e) {
	(j(t, 'change', () => {
		n(t.files);
	}),
		I && t.files && n(t.files),
		P(() => {
			t.files = e();
		}));
}
function Z(t) {
	return typeof t == 'function';
}
function Q(t) {
	return t !== null && typeof t == 'object';
}
const tt = ['string', 'number', 'bigint', 'boolean'];
function S(t) {
	return t == null || tt.includes(typeof t)
		? !0
		: Array.isArray(t)
			? t.every((e) => S(e))
			: typeof t == 'object'
				? Object.getPrototypeOf(t) === Object.prototype
				: !1;
}
const g = Symbol('box'),
	_ = Symbol('is-writable');
function et(t) {
	return Q(t) && g in t;
}
function nt(t) {
	return c.isBox(t) && _ in t;
}
function c(t) {
	let e = V(z(t));
	return {
		[g]: !0,
		[_]: !0,
		get current() {
			return W(e);
		},
		set current(n) {
			H(e, n, !0);
		}
	};
}
function rt(t, e) {
	const n = U(t);
	return e
		? {
				[g]: !0,
				[_]: !0,
				get current() {
					return W(n);
				},
				set current(r) {
					e(r);
				}
			}
		: {
				[g]: !0,
				get current() {
					return t();
				}
			};
}
function ot(t) {
	return c.isBox(t) ? t : Z(t) ? c.with(t) : c(t);
}
function st(t) {
	return Object.entries(t).reduce(
		(e, [n, r]) =>
			c.isBox(r)
				? (c.isWritableBox(r)
						? Object.defineProperty(e, n, {
								get() {
									return r.current;
								},
								set(o) {
									r.current = o;
								}
							})
						: Object.defineProperty(e, n, {
								get() {
									return r.current;
								}
							}),
					e)
				: Object.assign(e, { [n]: r }),
		{}
	);
}
function it(t) {
	return c.isWritableBox(t)
		? {
				[g]: !0,
				get current() {
					return t.current;
				}
			}
		: t;
}
c.from = ot;
c.with = rt;
c.flatten = st;
c.readonly = it;
c.isBox = et;
c.isWritableBox = nt;
function at(...t) {
	return function (e) {
		for (const n of t)
			if (n) {
				if (e.defaultPrevented) return;
				typeof n == 'function' ? n.call(this, e) : n.current?.call(this, e);
			}
	};
}
const ct = /\d/,
	ut = ['-', '_', '/', '.'];
function lt(t = '') {
	if (!ct.test(t)) return t !== t.toLowerCase();
}
function ft(t) {
	const e = [];
	let n = '',
		r,
		o;
	for (const s of t) {
		const i = ut.includes(s);
		if (i === !0) {
			(e.push(n), (n = ''), (r = void 0));
			continue;
		}
		const a = lt(s);
		if (o === !1) {
			if (r === !1 && a === !0) {
				(e.push(n), (n = s), (r = a));
				continue;
			}
			if (r === !0 && a === !1 && n.length > 1) {
				const l = n.at(-1);
				(e.push(n.slice(0, Math.max(0, n.length - 1))), (n = l + s), (r = a));
				continue;
			}
		}
		((n += s), (r = a), (o = i));
	}
	return (e.push(n), e);
}
function B(t) {
	return t
		? ft(t)
				.map((e) => ht(e))
				.join('')
		: '';
}
function dt(t) {
	return pt(B(t || ''));
}
function ht(t) {
	return t ? t[0].toUpperCase() + t.slice(1) : '';
}
function pt(t) {
	return t ? t[0].toLowerCase() + t.slice(1) : '';
}
function b(t) {
	if (!t) return {};
	const e = {};
	function n(r, o) {
		if (
			r.startsWith('-moz-') ||
			r.startsWith('-webkit-') ||
			r.startsWith('-ms-') ||
			r.startsWith('-o-')
		) {
			e[B(r)] = o;
			return;
		}
		if (r.startsWith('--')) {
			e[r] = o;
			return;
		}
		e[dt(r)] = o;
	}
	return (J(t, n), e);
}
function yt(...t) {
	return (...e) => {
		for (const n of t) typeof n == 'function' && n(...e);
	};
}
function gt(t, e) {
	const n = RegExp(t, 'g');
	return (r) => {
		if (typeof r != 'string')
			throw new TypeError(`expected an argument of type string, but got ${typeof r}`);
		return r.match(n) ? r.replace(n, e) : r;
	};
}
const bt = gt(/[A-Z]/, (t) => `-${t.toLowerCase()}`);
function mt(t) {
	if (!t || typeof t != 'object' || Array.isArray(t))
		throw new TypeError(`expected an argument of type object, but got ${typeof t}`);
	return Object.keys(t).map((e) => `${bt(e)}: ${t[e]};`).join(`
`);
}
function N(t = {}) {
	return mt(t).replace(
		`
`,
		' '
	);
}
const At = {
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
	},
	zt = N(At),
	wt = [
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
	xt = new Set(wt);
function vt(t) {
	return xt.has(t);
}
function Ht(...t) {
	const e = { ...t[0] };
	for (let n = 1; n < t.length; n++) {
		const r = t[n];
		if (r) {
			for (const o of Object.keys(r)) {
				const s = e[o],
					i = r[o],
					a = typeof s == 'function',
					l = typeof i == 'function';
				if (a && vt(o)) {
					const u = s,
						f = i;
					e[o] = at(u, f);
				} else if (a && l) e[o] = yt(s, i);
				else if (o === 'class') {
					const u = S(s),
						f = S(i);
					u && f ? (e[o] = w(s, i)) : u ? (e[o] = w(s)) : f && (e[o] = w(i));
				} else if (o === 'style') {
					const u = typeof s == 'object',
						f = typeof i == 'object',
						p = typeof s == 'string',
						h = typeof i == 'string';
					if (u && f) e[o] = { ...s, ...i };
					else if (u && h) {
						const d = b(i);
						e[o] = { ...s, ...d };
					} else if (p && f) {
						const d = b(s);
						e[o] = { ...d, ...i };
					} else if (p && h) {
						const d = b(s),
							A = b(i);
						e[o] = { ...d, ...A };
					} else u ? (e[o] = s) : f ? (e[o] = i) : p ? (e[o] = s) : h && (e[o] = i);
				} else e[o] = i !== void 0 ? i : s;
			}
			for (const o of Object.getOwnPropertySymbols(r)) {
				const s = e[o],
					i = r[o];
				e[o] = i !== void 0 ? i : s;
			}
		}
	}
	return (
		typeof e.style == 'object' &&
			(e.style = N(e.style).replaceAll(
				`
`,
				' '
			)),
		e.hidden !== !0 && ((e.hidden = void 0), delete e.hidden),
		e.disabled !== !0 && ((e.disabled = void 0), delete e.disabled),
		e
	);
}
const St = typeof window < 'u' ? window : void 0;
function Et(t) {
	let e = t.activeElement;
	for (; e?.shadowRoot; ) {
		const n = e.shadowRoot.activeElement;
		if (n === e) break;
		e = n;
	}
	return e;
}
class Ct {
	#t;
	#e;
	constructor(e = {}) {
		const { window: n = St, document: r = n?.document } = e;
		n !== void 0 &&
			((this.#t = r),
			(this.#e = Y((o) => {
				const s = R(n, 'focusin', o),
					i = R(n, 'focusout', o);
				return () => {
					(s(), i());
				};
			})));
	}
	get current() {
		return (this.#e?.(), this.#t ? Et(this.#t) : null);
	}
}
new Ct();
class Ut {
	#t;
	#e;
	constructor(e) {
		((this.#t = e), (this.#e = Symbol(e)));
	}
	get key() {
		return this.#e;
	}
	exists() {
		return L(this.#e);
	}
	get() {
		const e = O(this.#e);
		if (e === void 0) throw new Error(`Context "${this.#t}" not found`);
		return e;
	}
	getOr(e) {
		const n = O(this.#e);
		return n === void 0 ? e : n;
	}
	set(e) {
		return M(this.#e, e);
	}
}
function _t(t, e) {
	switch (t) {
		case 'post':
			q(e);
			break;
		case 'pre':
			G(e);
			break;
	}
}
function D(t, e, n, r = {}) {
	const { lazy: o = !1 } = r;
	let s = !o,
		i = Array.isArray(t) ? [] : void 0;
	_t(e, () => {
		const a = Array.isArray(t) ? t.map((u) => u()) : t();
		if (!s) {
			((s = !0), (i = a));
			return;
		}
		const l = m(() => n(a, i));
		return ((i = a), l);
	});
}
function kt(t, e, n) {
	D(t, 'post', e, n);
}
function Tt(t, e, n) {
	D(t, 'pre', e, n);
}
kt.pre = Tt;
function Lt(t, e) {
	return {
		[X()]: (n) =>
			c.isBox(t)
				? ((t.current = n),
					m(() => e?.(n)),
					() => {
						('isConnected' in n && n.isConnected) || ((t.current = null), e?.(null));
					})
				: (t(n),
					m(() => e?.(n)),
					() => {
						('isConnected' in n && n.isConnected) || (t(null), e?.(null));
					})
	};
}
function Mt(t) {
	return t ? 'open' : 'closed';
}
function Gt(t) {
	return t ? 'true' : 'false';
}
function qt(t) {
	return t ? 'true' : 'false';
}
function Jt(t) {
	return t ? '' : void 0;
}
function Yt(t) {
	return t ? 'true' : 'false';
}
function Xt(t, e) {
	return e ? 'mixed' : t ? 'true' : 'false';
}
function Zt(t) {
	return t;
}
function Qt(t) {
	return t ? 'true' : void 0;
}
function te(t) {
	return t;
}
function ee(t) {
	return t ? '' : void 0;
}
class Ot {
	#t;
	#e;
	attrs;
	constructor(e) {
		((this.#t = e.getVariant ? e.getVariant() : null),
			(this.#e = this.#t ? `data-${this.#t}-` : `data-${e.component}-`),
			(this.getAttr = this.getAttr.bind(this)),
			(this.selector = this.selector.bind(this)),
			(this.attrs = Object.fromEntries(e.parts.map((n) => [n, this.getAttr(n)]))));
	}
	getAttr(e, n) {
		return n ? `data-${n}-${e}` : `${this.#e}${e}`;
	}
	selector(e, n) {
		return `[${this.getAttr(e, n)}]`;
	}
}
function ne(t) {
	const e = new Ot(t);
	return { ...e.attrs, selector: e.selector, getAttr: e.getAttr };
}
const E = 'ArrowDown',
	k = 'ArrowLeft',
	T = 'ArrowRight',
	C = 'ArrowUp',
	Rt = 'End',
	re = 'Enter',
	oe = 'Escape',
	It = 'Home',
	se = 'PageDown',
	ie = 'PageUp',
	ae = ' ',
	ce = 'Tab';
function Pt(t) {
	return window.getComputedStyle(t).getPropertyValue('direction');
}
function Wt(t = 'ltr', e = 'horizontal') {
	return { horizontal: t === 'rtl' ? k : T, vertical: E }[e];
}
function jt(t = 'ltr', e = 'horizontal') {
	return { horizontal: t === 'rtl' ? T : k, vertical: C }[e];
}
function Bt(t = 'ltr', e = 'horizontal') {
	return (
		['ltr', 'rtl'].includes(t) || (t = 'ltr'),
		['horizontal', 'vertical'].includes(e) || (e = 'horizontal'),
		{ nextKey: Wt(t, e), prevKey: jt(t, e) }
	);
}
class ue {
	#t;
	#e = c(null);
	constructor(e) {
		this.#t = e;
	}
	getCandidateNodes() {
		return this.#t.rootNode.current
			? this.#t.candidateSelector
				? Array.from(this.#t.rootNode.current.querySelectorAll(this.#t.candidateSelector))
				: this.#t.candidateAttr
					? Array.from(
							this.#t.rootNode.current.querySelectorAll(
								`[${this.#t.candidateAttr}]:not([data-disabled])`
							)
						)
					: []
			: [];
	}
	focusFirstCandidate() {
		const e = this.getCandidateNodes();
		e.length && e[0]?.focus();
	}
	handleKeydown(e, n, r = !1) {
		const o = this.#t.rootNode.current;
		if (!o || !e) return;
		const s = this.getCandidateNodes();
		if (!s.length) return;
		const i = s.indexOf(e),
			a = Pt(o),
			{ nextKey: l, prevKey: u } = Bt(a, this.#t.orientation.current),
			f = this.#t.loop.current,
			p = { [l]: i + 1, [u]: i - 1, [It]: 0, [Rt]: s.length - 1 };
		if (r) {
			const A = l === E ? T : E,
				F = u === C ? k : C;
			((p[A] = i + 1), (p[F] = i - 1));
		}
		let h = p[n.key];
		if (h === void 0) return;
		(n.preventDefault(), h < 0 && f ? (h = s.length - 1) : h === s.length && f && (h = 0));
		const d = s[h];
		if (d) return (d.focus(), (this.#e.current = d.id), this.#t.onCandidateFocus?.(d), d);
	}
	getTabIndex(e) {
		const n = this.getCandidateNodes(),
			r = this.#e.current !== null;
		return e && !r && n[0] === e
			? ((this.#e.current = e.id), 0)
			: e?.id === this.#e.current
				? 0
				: -1;
	}
	setCurrentTabStopId(e) {
		this.#e.current = e;
	}
}
function le() {}
function fe(t, e) {
	return `bits-${t}`;
}
export {
	E as A,
	Zt as B,
	Ut as C,
	Vt as D,
	re as E,
	te as F,
	Qt as G,
	It as H,
	k as I,
	T as J,
	ie as P,
	ue as R,
	ae as S,
	ce as T,
	Lt as a,
	Kt as b,
	ne as c,
	fe as d,
	c as e,
	Jt as f,
	ee as g,
	Gt as h,
	Yt as i,
	Xt as j,
	St as k,
	Q as l,
	Ht as m,
	le as n,
	yt as o,
	Mt as p,
	oe as q,
	at as r,
	zt as s,
	b as t,
	N as u,
	C as v,
	kt as w,
	se as x,
	Rt as y,
	qt as z
};
