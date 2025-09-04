import {
	L as m,
	h as C,
	d as Er,
	u as z,
	aj as Tr,
	X as Nr,
	Y as Sr,
	Z as rr,
	s as G,
	_ as $,
	i as H,
	C as Or,
	aN as Cr,
	O as V,
	Q as Ir,
	P as wr,
	aV as er,
	N as ur,
	aA as Lr,
	aT as ar,
	aQ as lr,
	a5 as nr,
	aW as B,
	a0 as or,
	R as Mr,
	aX as X,
	aY as Rr,
	aZ as K,
	au as Y,
	j as Hr,
	a_ as Dr,
	aP as Pr,
	a$ as $r,
	n as Vr,
	e as Yr,
	V as Ur,
	b0 as vr,
	b1 as qr,
	T as cr,
	b2 as yr,
	b3 as Br,
	at as Xr,
	b4 as jr,
	b5 as Fr,
	b6 as Gr,
	b7 as Kr,
	b8 as Qr,
	b9 as Zr,
	ba as kr
} from './BW6z9EX9.js';
import { c as zr, d as Wr, e as Jr, f as mr, n as xr, g as re, j as ee } from './DzGRxXYC.js';
function be(r, a) {
	return a;
}
function ae(r, a, e) {
	for (var f = r.items, i = [], t = a.length, s = 0; s < t; s++) Dr(a[s].e, i, !0);
	var o = t > 0 && i.length === 0 && e !== null;
	if (o) {
		var E = e.parentNode;
		(Pr(E), E.append(e), f.clear(), w(r, a[0].prev, a[t - 1].next));
	}
	$r(i, () => {
		for (var c = 0; c < t; c++) {
			var g = a[c];
			(o || (f.delete(g.k), w(r, g.prev, g.next)), Y(g.e, !o));
		}
	});
}
function pe(r, a, e, f, i, t = null) {
	var s = r,
		o = { flags: a, items: new Map(), first: null },
		E = (a & vr) !== 0;
	if (E) {
		var c = r;
		s = C ? G(Vr(c)) : c.appendChild(ur());
	}
	C && Er();
	var g = null,
		T = !1,
		h = new Map(),
		O = Tr(() => {
			var b = e();
			return nr(b) ? b : b == null ? [] : lr(b);
		}),
		n,
		v;
	function A() {
		(fe(v, n, o, h, s, i, a, f, e),
			t !== null &&
				(n.length === 0
					? g
						? or(g)
						: (g = V(() => t(s)))
					: g !== null &&
						Mr(g, () => {
							g = null;
						})));
	}
	(m(() => {
		((v ??= Yr), (n = z(O)));
		var b = n.length;
		if (T && b === 0) return;
		T = b === 0;
		let N = !1;
		if (C) {
			var d = Nr(s) === Sr;
			d !== (b === 0) && ((s = rr()), G(s), $(!1), (N = !0));
		}
		if (C) {
			for (var _ = null, p, u = 0; u < b; u++) {
				if (H.nodeType === Or && H.data === Cr) {
					((s = H), (N = !0), $(!1));
					break;
				}
				var l = n[u],
					S = f(l, u);
				((p = W(H, o, _, null, l, S, u, i, a, e)), o.items.set(S, p), (_ = p));
			}
			b > 0 && G(rr());
		}
		if (C) b === 0 && t && (g = V(() => t(s)));
		else if (Ir()) {
			var L = new Set(),
				U = wr;
			for (u = 0; u < b; u += 1) {
				((l = n[u]), (S = f(l, u)));
				var M = o.items.get(S) ?? h.get(S);
				(M
					? (a & (X | B)) !== 0 && dr(M, l, u, a)
					: ((p = W(null, o, null, null, l, S, u, i, a, e, !0)), h.set(S, p)),
					L.add(S));
			}
			for (const [I, q] of o.items) L.has(I) || U.skipped_effects.add(q.e);
			U.add_callback(A);
		} else A();
		(N && $(!0), z(O));
	}),
		C && (s = H));
}
function fe(r, a, e, f, i, t, s, o, E) {
	var c = (s & qr) !== 0,
		g = (s & (X | B)) !== 0,
		T = a.length,
		h = e.items,
		O = e.first,
		n = O,
		v,
		A = null,
		b,
		N = [],
		d = [],
		_,
		p,
		u,
		l;
	if (c)
		for (l = 0; l < T; l += 1)
			((_ = a[l]),
				(p = o(_, l)),
				(u = h.get(p)),
				u !== void 0 && (u.a?.measure(), (b ??= new Set()).add(u)));
	for (l = 0; l < T; l += 1) {
		if (((_ = a[l]), (p = o(_, l)), (u = h.get(p)), u === void 0)) {
			var S = f.get(p);
			if (S !== void 0) {
				(f.delete(p), h.set(p, S));
				var L = A ? A.next : n;
				(w(e, A, S), w(e, S, L), Q(S, L, i), (A = S));
			} else {
				var U = n ? n.e.nodes_start : i;
				A = W(U, e, A, A === null ? e.first : A.next, _, p, l, t, s, E);
			}
			(h.set(p, A), (N = []), (d = []), (n = A.next));
			continue;
		}
		if (
			(g && dr(u, _, l, s),
			(u.e.f & K) !== 0 && (or(u.e), c && (u.a?.unfix(), (b ??= new Set()).delete(u))),
			u !== n)
		) {
			if (v !== void 0 && v.has(u)) {
				if (N.length < d.length) {
					var M = d[0],
						I;
					A = M.prev;
					var q = N[0],
						j = N[N.length - 1];
					for (I = 0; I < N.length; I += 1) Q(N[I], M, i);
					for (I = 0; I < d.length; I += 1) v.delete(d[I]);
					(w(e, q.prev, j.next),
						w(e, A, q),
						w(e, j, M),
						(n = M),
						(A = j),
						(l -= 1),
						(N = []),
						(d = []));
				} else
					(v.delete(u),
						Q(u, n, i),
						w(e, u.prev, u.next),
						w(e, u, A === null ? e.first : A.next),
						w(e, A, u),
						(A = u));
				continue;
			}
			for (N = [], d = []; n !== null && n.k !== p; )
				((n.e.f & K) === 0 && (v ??= new Set()).add(n), d.push(n), (n = n.next));
			if (n === null) continue;
			u = n;
		}
		(N.push(u), (A = u), (n = u.next));
	}
	if (n !== null || v !== void 0) {
		for (var R = v === void 0 ? [] : lr(v); n !== null; )
			((n.e.f & K) === 0 && R.push(n), (n = n.next));
		var F = R.length;
		if (F > 0) {
			var Ar = (s & vr) !== 0 && T === 0 ? i : null;
			if (c) {
				for (l = 0; l < F; l += 1) R[l].a?.measure();
				for (l = 0; l < F; l += 1) R[l].a?.fix();
			}
			ae(e, R, Ar);
		}
	}
	(c &&
		Ur(() => {
			if (b !== void 0) for (u of b) u.a?.apply();
		}),
		(r.first = e.first && e.first.e),
		(r.last = A && A.e));
	for (var gr of f.values()) Y(gr.e);
	f.clear();
}
function dr(r, a, e, f) {
	((f & X) !== 0 && er(r.v, a), (f & B) !== 0 ? er(r.i, e) : (r.i = e));
}
function W(r, a, e, f, i, t, s, o, E, c, g) {
	var T = (E & X) !== 0,
		h = (E & Rr) === 0,
		O = T ? (h ? Lr(i, !1, !1) : ar(i)) : i,
		n = (E & B) === 0 ? s : ar(s),
		v = { i: n, v: O, k: t, a: null, e: null, prev: e, next: f };
	try {
		if (r === null) {
			var A = document.createDocumentFragment();
			A.append((r = ur()));
		}
		return (
			(v.e = V(() => o(r, O, n, c), C)),
			(v.e.prev = e && e.e),
			(v.e.next = f && f.e),
			e === null ? g || (a.first = v) : ((e.next = v), (e.e.next = v.e)),
			f !== null && ((f.prev = v), (f.e.prev = v.e)),
			v
		);
	} finally {
	}
}
function Q(r, a, e) {
	for (
		var f = r.next ? r.next.e.nodes_start : e, i = a ? a.e.nodes_start : e, t = r.e.nodes_start;
		t !== null && t !== f;

	) {
		var s = Hr(t);
		(i.before(t), (t = s));
	}
}
function w(r, a, e) {
	(a === null ? (r.first = e) : ((a.next = e), (a.e.next = e && e.e)),
		e !== null && ((e.prev = a), (e.e.prev = a && a.e)));
}
function ie(r, a) {
	var e = void 0,
		f;
	m(() => {
		e !== (e = a()) &&
			(f && (Y(f), (f = null)),
			e &&
				(f = V(() => {
					cr(() => e(r));
				})));
	});
}
function _r(r) {
	var a,
		e,
		f = '';
	if (typeof r == 'string' || typeof r == 'number') f += r;
	else if (typeof r == 'object')
		if (Array.isArray(r)) {
			var i = r.length;
			for (a = 0; a < i; a++) r[a] && (e = _r(r[a])) && (f && (f += ' '), (f += e));
		} else for (e in r) r[e] && (f && (f += ' '), (f += e));
	return f;
}
function te() {
	for (var r, a, e = 0, f = '', i = arguments.length; e < i; e++)
		(r = arguments[e]) && (a = _r(r)) && (f && (f += ' '), (f += a));
	return f;
}
function se(r) {
	return typeof r == 'object' ? te(r) : (r ?? '');
}
const fr = [
	...` 	
\r\f \v\uFEFF`
];
function ue(r, a, e) {
	var f = r == null ? '' : '' + r;
	if ((a && (f = f ? f + ' ' + a : a), e)) {
		for (var i in e)
			if (e[i]) f = f ? f + ' ' + i : i;
			else if (f.length)
				for (var t = i.length, s = 0; (s = f.indexOf(i, s)) >= 0; ) {
					var o = s + t;
					(s === 0 || fr.includes(f[s - 1])) && (o === f.length || fr.includes(f[o]))
						? (f = (s === 0 ? '' : f.substring(0, s)) + f.substring(o + 1))
						: (s = o);
				}
	}
	return f === '' ? null : f;
}
function ir(r, a = !1) {
	var e = a ? ' !important;' : ';',
		f = '';
	for (var i in r) {
		var t = r[i];
		t != null && t !== '' && (f += ' ' + i + ': ' + t + e);
	}
	return f;
}
function Z(r) {
	return r[0] !== '-' || r[1] !== '-' ? r.toLowerCase() : r;
}
function le(r, a) {
	if (a) {
		var e = '',
			f,
			i;
		if ((Array.isArray(a) ? ((f = a[0]), (i = a[1])) : (f = a), r)) {
			r = String(r)
				.replaceAll(/\s*\/\*.*?\*\/\s*/g, '')
				.trim();
			var t = !1,
				s = 0,
				o = !1,
				E = [];
			(f && E.push(...Object.keys(f).map(Z)), i && E.push(...Object.keys(i).map(Z)));
			var c = 0,
				g = -1;
			const v = r.length;
			for (var T = 0; T < v; T++) {
				var h = r[T];
				if (
					(o
						? h === '/' && r[T - 1] === '*' && (o = !1)
						: t
							? t === h && (t = !1)
							: h === '/' && r[T + 1] === '*'
								? (o = !0)
								: h === '"' || h === "'"
									? (t = h)
									: h === '('
										? s++
										: h === ')' && s--,
					!o && t === !1 && s === 0)
				) {
					if (h === ':' && g === -1) g = T;
					else if (h === ';' || T === v - 1) {
						if (g !== -1) {
							var O = Z(r.substring(c, g).trim());
							if (!E.includes(O)) {
								h !== ';' && T++;
								var n = r.substring(c, T).trim();
								e += ' ' + n + ';';
							}
						}
						((c = T + 1), (g = -1));
					}
				}
			}
		}
		return (f && (e += ir(f)), i && (e += ir(i, !0)), (e = e.trim()), e === '' ? null : e);
	}
	return r == null ? null : String(r);
}
function ne(r, a, e, f, i, t) {
	var s = r.__className;
	if (C || s !== e || s === void 0) {
		var o = ue(e, f, t);
		((!C || o !== r.getAttribute('class')) &&
			(o == null ? r.removeAttribute('class') : a ? (r.className = o) : r.setAttribute('class', o)),
			(r.__className = e));
	} else if (t && i !== t)
		for (var E in t) {
			var c = !!t[E];
			(i == null || c !== !!i[E]) && r.classList.toggle(E, c);
		}
	return t;
}
function k(r, a = {}, e, f) {
	for (var i in e) {
		var t = e[i];
		a[i] !== t && (e[i] == null ? r.style.removeProperty(i) : r.style.setProperty(i, t, f));
	}
}
function oe(r, a, e, f) {
	var i = r.__style;
	if (C || i !== a) {
		var t = le(a, f);
		((!C || t !== r.getAttribute('style')) &&
			(t == null ? r.removeAttribute('style') : (r.style.cssText = t)),
			(r.__style = a));
	} else
		f && (Array.isArray(f) ? (k(r, e?.[0], f[0]), k(r, e?.[1], f[1], 'important')) : k(r, e, f));
	return f;
}
function J(r, a, e = !1) {
	if (r.multiple) {
		if (a == null) return;
		if (!nr(a)) return yr();
		for (var f of r.options) f.selected = a.includes(tr(f));
		return;
	}
	for (f of r.options) {
		var i = tr(f);
		if (Br(i, a)) {
			f.selected = !0;
			return;
		}
	}
	(!e || a !== void 0) && (r.selectedIndex = -1);
}
function ve(r) {
	var a = new MutationObserver(() => {
		J(r, r.__value);
	});
	(a.observe(r, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ['value'] }),
		Xr(() => {
			a.disconnect();
		}));
}
function tr(r) {
	return '__value' in r ? r.__value : r.value;
}
const D = Symbol('class'),
	P = Symbol('style'),
	hr = Symbol('is custom element'),
	br = Symbol('is html');
function Ae(r) {
	if (C) {
		var a = !1,
			e = () => {
				if (!a) {
					if (((a = !0), r.hasAttribute('value'))) {
						var f = r.value;
						(y(r, 'value', null), (r.value = f));
					}
					if (r.hasAttribute('checked')) {
						var i = r.checked;
						(y(r, 'checked', null), (r.checked = i));
					}
				}
			};
		((r.__on_r = e), kr(e), re());
	}
}
function ge(r, a) {
	var e = x(r);
	e.value === (e.value = a ?? void 0) ||
		(r.value === a && (a !== 0 || r.nodeName !== 'PROGRESS')) ||
		(r.value = a ?? '');
}
function ce(r, a) {
	a ? r.hasAttribute('selected') || r.setAttribute('selected', '') : r.removeAttribute('selected');
}
function y(r, a, e, f) {
	var i = x(r);
	(C &&
		((i[a] = r.getAttribute(a)),
		a === 'src' || a === 'srcset' || (a === 'href' && r.nodeName === 'LINK'))) ||
		(i[a] !== (i[a] = e) &&
			(a === 'loading' && (r[Kr] = e),
			e == null
				? r.removeAttribute(a)
				: typeof e != 'string' && pr(r).includes(a)
					? (r[a] = e)
					: r.setAttribute(a, e)));
}
function de(r, a, e, f, i = !1) {
	var t = x(r),
		s = t[hr],
		o = !t[br];
	let E = C && s;
	E && $(!1);
	var c = a || {},
		g = r.tagName === 'OPTION';
	for (var T in a) T in e || (e[T] = null);
	(e.class ? (e.class = se(e.class)) : (f || e[D]) && (e.class = null), e[P] && (e.style ??= null));
	var h = pr(r);
	for (const d in e) {
		let _ = e[d];
		if (g && d === 'value' && _ == null) {
			((r.value = r.__value = ''), (c[d] = _));
			continue;
		}
		if (d === 'class') {
			var O = r.namespaceURI === 'http://www.w3.org/1999/xhtml';
			(ne(r, O, _, f, a?.[D], e[D]), (c[d] = _), (c[D] = e[D]));
			continue;
		}
		if (d === 'style') {
			(oe(r, _, a?.[P], e[P]), (c[d] = _), (c[P] = e[P]));
			continue;
		}
		var n = c[d];
		if (!(_ === n && !(_ === void 0 && r.hasAttribute(d)))) {
			c[d] = _;
			var v = d[0] + d[1];
			if (v !== '$$')
				if (v === 'on') {
					const p = {},
						u = '$$' + d;
					let l = d.slice(2);
					var A = ee(l);
					if ((zr(l) && ((l = l.slice(0, -7)), (p.capture = !0)), !A && n)) {
						if (_ != null) continue;
						(r.removeEventListener(l, c[u], p), (c[u] = null));
					}
					if (_ != null)
						if (A) ((r[`__${l}`] = _), Jr([l]));
						else {
							let S = function (L) {
								c[d].call(this, L);
							};
							c[u] = Wr(l, r, S, p);
						}
					else A && (r[`__${l}`] = void 0);
				} else if (d === 'style') y(r, d, _);
				else if (d === 'autofocus') mr(r, !!_);
				else if (!s && (d === '__value' || (d === 'value' && _ != null))) r.value = r.__value = _;
				else if (d === 'selected' && g) ce(r, _);
				else {
					var b = d;
					o || (b = xr(b));
					var N = b === 'defaultValue' || b === 'defaultChecked';
					if (_ == null && !s && !N)
						if (((t[d] = null), b === 'value' || b === 'checked')) {
							let p = r;
							const u = a === void 0;
							if (b === 'value') {
								let l = p.defaultValue;
								(p.removeAttribute(b), (p.defaultValue = l), (p.value = p.__value = u ? l : null));
							} else {
								let l = p.defaultChecked;
								(p.removeAttribute(b), (p.defaultChecked = l), (p.checked = u ? l : !1));
							}
						} else r.removeAttribute(d);
					else
						N || (h.includes(b) && (s || typeof _ != 'string'))
							? (r[b] = _)
							: typeof _ != 'function' && y(r, b, _);
				}
		}
	}
	return (E && $(!0), c);
}
function Ee(r, a, e = [], f = [], i, t = !1) {
	jr(e, f, (s) => {
		var o = void 0,
			E = {},
			c = r.nodeName === 'SELECT',
			g = !1;
		if (
			(m(() => {
				var h = a(...s.map(z)),
					O = de(r, o, h, i, t);
				g && c && 'value' in h && J(r, h.value);
				for (let v of Object.getOwnPropertySymbols(E)) h[v] || Y(E[v]);
				for (let v of Object.getOwnPropertySymbols(h)) {
					var n = h[v];
					(v.description === Qr &&
						(!o || n !== o[v]) &&
						(E[v] && Y(E[v]), (E[v] = V(() => ie(r, () => n)))),
						(O[v] = n));
				}
				o = O;
			}),
			c)
		) {
			var T = r;
			cr(() => {
				(J(T, o.value, !0), ve(T));
			});
		}
		g = !0;
	});
}
function x(r) {
	return (r.__attributes ??= { [hr]: r.nodeName.includes('-'), [br]: r.namespaceURI === Fr });
}
var sr = new Map();
function pr(r) {
	var a = sr.get(r.nodeName);
	if (a) return a;
	sr.set(r.nodeName, (a = []));
	for (var e, f = r, i = Element.prototype; i !== f; ) {
		e = Zr(f);
		for (var t in e) e[t].set && a.push(t);
		f = Gr(f);
	}
	return a;
}
export {
	P as S,
	Ee as a,
	y as b,
	se as c,
	te as d,
	pe as e,
	oe as f,
	ge as g,
	be as i,
	Ae as r,
	ne as s
};
