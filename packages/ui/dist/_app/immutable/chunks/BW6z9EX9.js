var Le = Array.isArray,
	je = Array.prototype.indexOf,
	Dn = Array.from,
	Xt = Object.defineProperty,
	lt = Object.getOwnPropertyDescriptor,
	qe = Object.getOwnPropertyDescriptors,
	Ye = Object.prototype,
	He = Array.prototype,
	ie = Object.getPrototypeOf,
	Zt = Object.isExtensible;
function Pn(t) {
	return typeof t == 'function';
}
const J = () => {};
function Mn(t) {
	return t();
}
function Pt(t) {
	for (var e = 0; e < t.length; e++) t[e]();
}
function Ue() {
	var t,
		e,
		n = new Promise((r, a) => {
			((t = r), (e = a));
		});
	return { promise: n, resolve: t, reject: e };
}
function Fn(t, e) {
	if (Array.isArray(t)) return t;
	if (!(Symbol.iterator in t)) return Array.from(t);
	const n = [];
	for (const r of t) if ((n.push(r), n.length === e)) break;
	return n;
}
const x = 2,
	Mt = 4,
	Tt = 8,
	dt = 16,
	P = 32,
	G = 64,
	ue = 128,
	A = 256,
	bt = 512,
	b = 1024,
	O = 2048,
	K = 4096,
	j = 8192,
	st = 16384,
	Ft = 32768,
	fe = 65536,
	Jt = 1 << 17,
	Be = 1 << 18,
	Lt = 1 << 19,
	jt = 1 << 20,
	kt = 1 << 21,
	qt = 1 << 22,
	H = 1 << 23,
	U = Symbol('$state'),
	Ln = Symbol('legacy props'),
	jn = Symbol(''),
	Yt = new (class extends Error {
		name = 'StaleReactionError';
		message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
	})(),
	Yn = 1,
	Ht = 3,
	Ut = 8;
function $e() {
	throw new Error('https://svelte.dev/e/await_outside_boundary');
}
function Ve(t) {
	throw new Error('https://svelte.dev/e/lifecycle_outside_component');
}
function Ge() {
	throw new Error('https://svelte.dev/e/async_derived_orphan');
}
function Ke(t) {
	throw new Error('https://svelte.dev/e/effect_in_teardown');
}
function We() {
	throw new Error('https://svelte.dev/e/effect_in_unowned_derived');
}
function ze(t) {
	throw new Error('https://svelte.dev/e/effect_orphan');
}
function Xe() {
	throw new Error('https://svelte.dev/e/effect_update_depth_exceeded');
}
function Hn() {
	throw new Error('https://svelte.dev/e/get_abort_signal_outside_reaction');
}
function Un() {
	throw new Error('https://svelte.dev/e/hydration_failed');
}
function Bn(t) {
	throw new Error('https://svelte.dev/e/lifecycle_legacy_only');
}
function $n(t) {
	throw new Error('https://svelte.dev/e/props_invalid_value');
}
function Ze() {
	throw new Error('https://svelte.dev/e/state_descriptors_fixed');
}
function Je() {
	throw new Error('https://svelte.dev/e/state_prototype_fixed');
}
function Qe() {
	throw new Error('https://svelte.dev/e/state_unsafe_mutation');
}
const Vn = 1,
	Gn = 2,
	Kn = 4,
	Wn = 8,
	zn = 16,
	Xn = 1,
	Zn = 2,
	Jn = 4,
	Qn = 8,
	tr = 16,
	er = 1,
	nr = 2,
	rr = 4,
	tn = 1,
	en = 2,
	nn = '[',
	rn = '[!',
	sn = ']',
	Bt = {},
	m = Symbol(),
	sr = 'http://www.w3.org/1999/xhtml',
	ar = 'http://www.w3.org/2000/svg',
	ir = '@attach';
function $t(t) {
	console.warn('https://svelte.dev/e/hydration_mismatch');
}
function ur() {
	console.warn('https://svelte.dev/e/select_multiple_invalid_value');
}
let N = !1;
function fr(t) {
	N = t;
}
let p;
function tt(t) {
	if (t === null) throw ($t(), Bt);
	return (p = t);
}
function le() {
	return tt(z(p));
}
function lr(t) {
	if (N) {
		if (z(p) !== null) throw ($t(), Bt);
		p = t;
	}
}
function or(t = 1) {
	if (N) {
		for (var e = t, n = p; e--; ) n = z(n);
		p = n;
	}
}
function cr() {
	for (var t = 0, e = p; ; ) {
		if (e.nodeType === Ut) {
			var n = e.data;
			if (n === sn) {
				if (t === 0) return e;
				t -= 1;
			} else (n === nn || n === rn) && (t += 1);
		}
		var r = z(e);
		(e.remove(), (e = r));
	}
}
function _r(t) {
	if (!t || t.nodeType !== Ut) throw ($t(), Bt);
	return t.data;
}
function oe(t) {
	return t === this.v;
}
function ce(t, e) {
	return t != t
		? e == e
		: t !== e || (t !== null && typeof t == 'object') || typeof t == 'function';
}
function vr(t, e) {
	return t !== e;
}
function _e(t) {
	return !ce(t, this.v);
}
let At = !1;
function dr() {
	At = !0;
}
let y = null;
function yt(t) {
	y = t;
}
function hr(t) {
	return xt().get(t);
}
function pr(t, e) {
	return (xt().set(t, e), e);
}
function wr(t) {
	return xt().has(t);
}
function br() {
	return xt();
}
function yr(t, e = !1, n) {
	y = { p: y, c: null, e: null, s: t, x: null, l: At && !e ? { s: null, u: null, $: [] } : null };
}
function gr(t) {
	var e = y,
		n = e.e;
	if (n !== null) {
		e.e = null;
		for (var r of n) Ae(r);
	}
	return ((y = e.p), {});
}
function ht() {
	return !At || (y !== null && y.l === null);
}
function xt(t) {
	return (y === null && Ve(), (y.c ??= new Map(an(y) || void 0)));
}
function an(t) {
	let e = t.p;
	for (; e !== null; ) {
		const n = e.c;
		if (n !== null) return n;
		e = e.p;
	}
	return null;
}
const un = new WeakMap();
function fn(t) {
	var e = h;
	if (e === null) return ((_.f |= H), t);
	if ((e.f & Ft) === 0) {
		if ((e.f & ue) === 0) throw (!e.parent && t instanceof Error && ve(t), t);
		e.b.error(t);
	} else Vt(t, e);
}
function Vt(t, e) {
	for (; e !== null; ) {
		if ((e.f & ue) !== 0)
			try {
				e.b.error(t);
				return;
			} catch (n) {
				t = n;
			}
		e = e.parent;
	}
	throw (t instanceof Error && ve(t), t);
}
function ve(t) {
	const e = un.get(t);
	e && (Xt(t, 'message', { value: e.message }), Xt(t, 'stack', { value: e.stack }));
}
const ln = typeof requestIdleCallback > 'u' ? (t) => setTimeout(t, 1) : requestIdleCallback;
let ct = [],
	_t = [];
function de() {
	var t = ct;
	((ct = []), Pt(t));
}
function he() {
	var t = _t;
	((_t = []), Pt(t));
}
function mr(t) {
	(ct.length === 0 && queueMicrotask(de), ct.push(t));
}
function Er(t) {
	(_t.length === 0 && ln(he), _t.push(t));
}
function on() {
	(ct.length > 0 && de(), _t.length > 0 && he());
}
function cn() {
	for (var t = h.b; t !== null && !t.has_pending_snippet(); ) t = t.parent;
	return (t === null && $e(), t);
}
function Gt(t) {
	var e = x | O,
		n = _ !== null && (_.f & x) !== 0 ? _ : null;
	return (
		h === null || (n !== null && (n.f & A) !== 0) ? (e |= A) : (h.f |= Lt),
		{
			ctx: y,
			deps: null,
			effects: null,
			equals: oe,
			f: e,
			fn: t,
			reactions: null,
			rv: 0,
			v: m,
			wv: 0,
			parent: n ?? h,
			ac: null
		}
	);
}
function _n(t, e) {
	let n = h;
	n === null && Ge();
	var r = n.b,
		a = void 0,
		s = Wt(m),
		f = null,
		l = !_;
	return (
		mn(() => {
			try {
				var i = t();
			} catch (d) {
				i = Promise.reject(d);
			}
			var u = () => i;
			((a = f?.then(u, u) ?? Promise.resolve(i)), (f = a));
			var o = S,
				c = r.pending;
			l && (r.update_pending_count(1), c || o.increment());
			const v = (d, w = void 0) => {
				((f = null),
					c || o.activate(),
					w ? w !== Yt && ((s.f |= H), Ct(s, w)) : ((s.f & H) !== 0 && (s.f ^= H), Ct(s, d)),
					l && (r.update_pending_count(-1), c || o.decrement()),
					be());
			};
			if ((a.then(v, (d) => v(null, d || 'unknown')), o))
				return () => {
					queueMicrotask(() => o.neuter());
				};
		}),
		new Promise((i) => {
			function u(o) {
				function c() {
					o === a ? i(s) : u(a);
				}
				o.then(c, c);
			}
			u(a);
		})
	);
}
function Tr(t) {
	const e = Gt(t);
	return (ke(e), e);
}
function vn(t) {
	const e = Gt(t);
	return ((e.equals = _e), e);
}
function pe(t) {
	var e = t.effects;
	if (e !== null) {
		t.effects = null;
		for (var n = 0; n < e.length; n += 1) q(e[n]);
	}
}
function dn(t) {
	for (var e = t.parent; e !== null; ) {
		if ((e.f & x) === 0) return e;
		e = e.parent;
	}
	return null;
}
function Kt(t) {
	var e,
		n = h;
	gt(dn(t));
	try {
		(pe(t), (e = De(t)));
	} finally {
		gt(n);
	}
	return e;
}
function we(t) {
	var e = Kt(t);
	if ((t.equals(e) || ((t.v = e), (t.wv = Ie())), !at))
		if (et !== null) et.set(t, t.v);
		else {
			var n = (F || (t.f & A) !== 0) && t.deps !== null ? K : b;
			g(t, n);
		}
}
function hn(t, e, n) {
	const r = ht() ? Gt : vn;
	if (e.length === 0) {
		n(t.map(r));
		return;
	}
	var a = S,
		s = h,
		f = pn(),
		l = cn();
	Promise.all(e.map((i) => _n(i)))
		.then((i) => {
			(a?.activate(), f());
			try {
				n([...t.map(r), ...i]);
			} catch (u) {
				(s.f & st) === 0 && Vt(u, s);
			}
			(a?.deactivate(), be());
		})
		.catch((i) => {
			l.error(i);
		});
}
function pn() {
	var t = h,
		e = _,
		n = y;
	return function () {
		(gt(t), rt(e), yt(n));
	};
}
function be() {
	(gt(null), rt(null), yt(null));
}
const wt = new Set();
let S = null,
	et = null,
	Qt = new Set(),
	Z = [],
	Nt = null,
	It = !1;
class W {
	#f = new Map();
	#a = new Map();
	#i = new Set();
	#e = 0;
	#l = null;
	#o = !1;
	#r = [];
	#u = [];
	#n = [];
	#t = [];
	#s = [];
	skipped_effects = new Set();
	#_(e) {
		Z = [];
		var n = null;
		if (wt.size > 1) {
			((n = new Map()), (et = new Map()));
			for (const [s, f] of this.#f) (n.set(s, { v: s.v, wv: s.wv }), (s.v = f));
			for (const s of wt)
				if (s !== this)
					for (const [f, l] of s.#a) n.has(f) || (n.set(f, { v: f.v, wv: f.wv }), (f.v = l));
		}
		for (const s of e) this.#v(s);
		if (this.#r.length === 0 && this.#e === 0) {
			var r = this.#n,
				a = this.#t;
			((this.#n = []), (this.#t = []), (this.#s = []), this.#c(), te(r), te(a), this.#l?.resolve());
		} else {
			for (const s of this.#n) g(s, b);
			for (const s of this.#t) g(s, b);
			for (const s of this.#s) g(s, b);
		}
		if (n) {
			for (const [s, { v: f, wv: l }] of n) s.wv <= l && (s.v = f);
			et = null;
		}
		for (const s of this.#r) ot(s);
		for (const s of this.#u) ot(s);
		((this.#r = []), (this.#u = []));
	}
	#v(e) {
		e.f ^= b;
		for (var n = e.first; n !== null; ) {
			var r = n.f,
				a = (r & (P | G)) !== 0,
				s = a && (r & b) !== 0,
				f = s || (r & j) !== 0 || this.skipped_effects.has(n);
			if (!f && n.fn !== null) {
				if (a) n.f ^= b;
				else if ((r & Mt) !== 0) this.#t.push(n);
				else if (St(n))
					if ((r & qt) !== 0) {
						var l = n.b?.pending ? this.#u : this.#r;
						l.push(n);
					} else ((n.f & dt) !== 0 && this.#s.push(n), ot(n));
				var i = n.first;
				if (i !== null) {
					n = i;
					continue;
				}
			}
			var u = n.parent;
			for (n = n.next; n === null && u !== null; ) ((n = u.next), (u = u.parent));
		}
	}
	capture(e, n) {
		(this.#a.has(e) || this.#a.set(e, n), this.#f.set(e, e.v));
	}
	activate() {
		S = this;
	}
	deactivate() {
		S = null;
		for (const e of Qt) if ((Qt.delete(e), e(), S !== null)) break;
	}
	neuter() {
		this.#o = !0;
	}
	flush() {
		(Z.length > 0 ? this.flush_effects() : this.#c(),
			S === this && (this.#e === 0 && wt.delete(this), this.deactivate()));
	}
	flush_effects() {
		var e = Q;
		It = !0;
		try {
			var n = 0;
			for (re(!0); Z.length > 0; ) {
				if (n++ > 1e3) {
					var r, a;
					bn();
				}
				(this.#_(Z), B.clear());
			}
		} finally {
			((It = !1), re(e), (Nt = null));
		}
	}
	#c() {
		if (!this.#o) for (const e of this.#i) e();
		this.#i.clear();
	}
	increment() {
		this.#e += 1;
	}
	decrement() {
		if (((this.#e -= 1), this.#e === 0)) {
			for (const e of this.#n) (g(e, O), L(e));
			for (const e of this.#t) (g(e, O), L(e));
			for (const e of this.#s) (g(e, O), L(e));
			((this.#n = []), (this.#t = []), this.flush());
		} else this.deactivate();
	}
	add_callback(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#l ??= Ue()).promise;
	}
	static ensure(e = !0) {
		if (S === null) {
			const n = (S = new W());
			(wt.add(S),
				e &&
					queueMicrotask(() => {
						S === n && n.flush();
					}));
		}
		return S;
	}
}
function wn(t) {
	var e;
	const n = W.ensure(!1);
	for (t && (n.flush_effects(), (e = t())); ; ) {
		if ((on(), Z.length === 0)) return (n === S && n.flush(), (Nt = null), e);
		n.flush_effects();
	}
}
function bn() {
	try {
		Xe();
	} catch (t) {
		Vt(t, Nt);
	}
}
function te(t) {
	var e = t.length;
	if (e !== 0) {
		for (var n = 0; n < e; n++) {
			var r = t[n];
			if ((r.f & (st | j)) === 0 && St(r)) {
				var a = mt;
				if (
					(ot(r),
					r.deps === null &&
						r.first === null &&
						r.nodes_start === null &&
						(r.teardown === null ? Se(r) : (r.fn = null)),
					mt > a && (r.f & jt) !== 0)
				)
					break;
			}
		}
		for (; n < e; n += 1) L(t[n]);
	}
}
function L(t) {
	for (var e = (Nt = t); e.parent !== null; ) {
		e = e.parent;
		var n = e.f;
		if (It && e === h && (n & dt) !== 0) return;
		if ((n & (G | P)) !== 0) {
			if ((n & b) === 0) return;
			e.f ^= b;
		}
	}
	Z.push(e);
}
const B = new Map();
function Wt(t, e) {
	var n = { f: 0, v: t, reactions: null, equals: oe, rv: 0, wv: 0 };
	return n;
}
function M(t, e) {
	const n = Wt(t);
	return (ke(n), n);
}
function Ar(t, e = !1, n = !0) {
	const r = Wt(t);
	return (e || (r.equals = _e), At && n && y !== null && y.l !== null && (y.l.s ??= []).push(r), r);
}
function Y(t, e, n = !1) {
	_ !== null &&
		(!k || (_.f & Jt) !== 0) &&
		ht() &&
		(_.f & (x | dt | qt | Jt)) !== 0 &&
		!C?.includes(t) &&
		Qe();
	let r = n ? ut(e) : e;
	return Ct(t, r);
}
function Ct(t, e) {
	if (!t.equals(e)) {
		var n = t.v;
		(at ? B.set(t, e) : B.set(t, n),
			(t.v = e),
			W.ensure().capture(t, n),
			(t.f & x) !== 0 && ((t.f & O) !== 0 && Kt(t), g(t, (t.f & A) === 0 ? b : K)),
			(t.wv = Ie()),
			ye(t, O),
			ht() &&
				h !== null &&
				(h.f & b) !== 0 &&
				(h.f & (P | G)) === 0 &&
				(R === null ? Nn([t]) : R.push(t)));
	}
	return e;
}
function Ot(t) {
	Y(t, t.v + 1);
}
function ye(t, e) {
	var n = t.reactions;
	if (n !== null)
		for (var r = ht(), a = n.length, s = 0; s < a; s++) {
			var f = n[s],
				l = f.f;
			(l & O) === 0 &&
				((!r && f === h) || (g(f, e), (l & (b | A)) !== 0 && ((l & x) !== 0 ? ye(f, K) : L(f))));
		}
}
function ut(t) {
	if (typeof t != 'object' || t === null || U in t) return t;
	const e = ie(t);
	if (e !== Ye && e !== He) return t;
	var n = new Map(),
		r = Le(t),
		a = M(0),
		s = $,
		f = (l) => {
			if ($ === s) return l();
			var i = _,
				u = $;
			(rt(null), ae(s));
			var o = l();
			return (rt(i), ae(u), o);
		};
	return (
		r && n.set('length', M(t.length)),
		new Proxy(t, {
			defineProperty(l, i, u) {
				(!('value' in u) || u.configurable === !1 || u.enumerable === !1 || u.writable === !1) &&
					Ze();
				var o = n.get(i);
				return (
					o === void 0
						? (o = f(() => {
								var c = M(u.value);
								return (n.set(i, c), c);
							}))
						: Y(o, u.value, !0),
					!0
				);
			},
			deleteProperty(l, i) {
				var u = n.get(i);
				if (u === void 0) {
					if (i in l) {
						const o = f(() => M(m));
						(n.set(i, o), Ot(a));
					}
				} else (Y(u, m), Ot(a));
				return !0;
			},
			get(l, i, u) {
				if (i === U) return t;
				var o = n.get(i),
					c = i in l;
				if (
					(o === void 0 &&
						(!c || lt(l, i)?.writable) &&
						((o = f(() => {
							var d = ut(c ? l[i] : m),
								w = M(d);
							return w;
						})),
						n.set(i, o)),
					o !== void 0)
				) {
					var v = ft(o);
					return v === m ? void 0 : v;
				}
				return Reflect.get(l, i, u);
			},
			getOwnPropertyDescriptor(l, i) {
				var u = Reflect.getOwnPropertyDescriptor(l, i);
				if (u && 'value' in u) {
					var o = n.get(i);
					o && (u.value = ft(o));
				} else if (u === void 0) {
					var c = n.get(i),
						v = c?.v;
					if (c !== void 0 && v !== m)
						return { enumerable: !0, configurable: !0, value: v, writable: !0 };
				}
				return u;
			},
			has(l, i) {
				if (i === U) return !0;
				var u = n.get(i),
					o = (u !== void 0 && u.v !== m) || Reflect.has(l, i);
				if (u !== void 0 || (h !== null && (!o || lt(l, i)?.writable))) {
					u === void 0 &&
						((u = f(() => {
							var v = o ? ut(l[i]) : m,
								d = M(v);
							return d;
						})),
						n.set(i, u));
					var c = ft(u);
					if (c === m) return !1;
				}
				return o;
			},
			set(l, i, u, o) {
				var c = n.get(i),
					v = i in l;
				if (r && i === 'length')
					for (var d = u; d < c.v; d += 1) {
						var w = n.get(d + '');
						w !== void 0 ? Y(w, m) : d in l && ((w = f(() => M(m))), n.set(d + '', w));
					}
				if (c === void 0)
					(!v || lt(l, i)?.writable) && ((c = f(() => M(void 0))), Y(c, ut(u)), n.set(i, c));
				else {
					v = c.v !== m;
					var it = f(() => ut(u));
					Y(c, it);
				}
				var pt = Reflect.getOwnPropertyDescriptor(l, i);
				if ((pt?.set && pt.set.call(o, u), !v)) {
					if (r && typeof i == 'string') {
						var zt = n.get('length'),
							Rt = Number(i);
						Number.isInteger(Rt) && Rt >= zt.v && Y(zt, Rt + 1);
					}
					Ot(a);
				}
				return !0;
			},
			ownKeys(l) {
				ft(a);
				var i = Reflect.ownKeys(l).filter((c) => {
					var v = n.get(c);
					return v === void 0 || v.v !== m;
				});
				for (var [u, o] of n) o.v !== m && !(u in l) && i.push(u);
				return i;
			},
			setPrototypeOf() {
				Je();
			}
		})
	);
}
function ee(t) {
	try {
		if (t !== null && typeof t == 'object' && U in t) return t[U];
	} catch {}
	return t;
}
function xr(t, e) {
	return Object.is(ee(t), ee(e));
}
var ne, yn, ge, me, Ee;
function Nr() {
	if (ne === void 0) {
		((ne = window), (yn = document), (ge = /Firefox/.test(navigator.userAgent)));
		var t = Element.prototype,
			e = Node.prototype,
			n = Text.prototype;
		((me = lt(e, 'firstChild').get),
			(Ee = lt(e, 'nextSibling').get),
			Zt(t) &&
				((t.__click = void 0),
				(t.__className = void 0),
				(t.__attributes = null),
				(t.__style = void 0),
				(t.__e = void 0)),
			Zt(n) && (n.__t = void 0));
	}
}
function nt(t = '') {
	return document.createTextNode(t);
}
function V(t) {
	return me.call(t);
}
function z(t) {
	return Ee.call(t);
}
function Sr(t, e) {
	if (!N) return V(t);
	var n = V(p);
	if (n === null) n = p.appendChild(nt());
	else if (e && n.nodeType !== Ht) {
		var r = nt();
		return (n?.before(r), tt(r), r);
	}
	return (tt(n), n);
}
function Rr(t, e) {
	if (!N) {
		var n = V(t);
		return n instanceof Comment && n.data === '' ? z(n) : n;
	}
	return p;
}
function Or(t, e = 1, n = !1) {
	let r = N ? p : t;
	for (var a; e--; ) ((a = r), (r = z(r)));
	if (!N) return r;
	if (n && r?.nodeType !== Ht) {
		var s = nt();
		return (r === null ? a?.after(s) : r.before(s), tt(s), s);
	}
	return (tt(r), r);
}
function kr(t) {
	t.textContent = '';
}
function Ir() {
	return !1;
}
function Te(t) {
	(h === null && _ === null && ze(),
		_ !== null && (_.f & A) !== 0 && h === null && We(),
		at && Ke());
}
function gn(t, e) {
	var n = e.last;
	n === null ? (e.last = e.first = t) : ((n.next = t), (t.prev = n), (e.last = t));
}
function I(t, e, n, r = !0) {
	var a = h;
	a !== null && (a.f & j) !== 0 && (t |= j);
	var s = {
		ctx: y,
		deps: null,
		nodes_start: null,
		nodes_end: null,
		f: t | O,
		first: null,
		fn: e,
		last: null,
		next: null,
		parent: a,
		b: a && a.b,
		prev: null,
		teardown: null,
		transitions: null,
		wv: 0,
		ac: null
	};
	if (n)
		try {
			(ot(s), (s.f |= Ft));
		} catch (i) {
			throw (q(s), i);
		}
	else e !== null && L(s);
	var f =
		n &&
		s.deps === null &&
		s.first === null &&
		s.nodes_start === null &&
		s.teardown === null &&
		(s.f & Lt) === 0;
	if (!f && r && (a !== null && gn(s, a), _ !== null && (_.f & x) !== 0)) {
		var l = _;
		(l.effects ??= []).push(s);
	}
	return s;
}
function Cr() {
	return _ !== null && !k;
}
function Dr(t) {
	const e = I(Tt, null, !1);
	return (g(e, b), (e.teardown = t), e);
}
function Pr(t) {
	Te();
	var e = h.f,
		n = !_ && (e & P) !== 0 && (e & Ft) === 0;
	if (n) {
		var r = y;
		(r.e ??= []).push(t);
	} else return Ae(t);
}
function Ae(t) {
	return I(Mt | jt, t, !1);
}
function Mr(t) {
	return (Te(), I(Tt | jt, t, !0));
}
function Fr(t) {
	W.ensure();
	const e = I(G, t, !0);
	return () => {
		q(e);
	};
}
function Lr(t) {
	W.ensure();
	const e = I(G, t, !0);
	return (n = {}) =>
		new Promise((r) => {
			n.outro
				? An(e, () => {
						(q(e), r(void 0));
					})
				: (q(e), r(void 0));
		});
}
function jr(t) {
	return I(Mt, t, !1);
}
function mn(t) {
	return I(qt | Lt, t, !0);
}
function qr(t, e = 0) {
	return I(Tt | e, t, !0);
}
function Yr(t, e = [], n = []) {
	hn(e, n, (r) => {
		I(Tt, () => t(...r.map(ft)), !0);
	});
}
function Hr(t, e = 0) {
	var n = I(dt | e, t, !0);
	return n;
}
function Ur(t, e = !0) {
	return I(P, t, !0, e);
}
function xe(t) {
	var e = t.teardown;
	if (e !== null) {
		const n = at,
			r = _;
		(se(!0), rt(null));
		try {
			e.call(null);
		} finally {
			(se(n), rt(r));
		}
	}
}
function Ne(t, e = !1) {
	var n = t.first;
	for (t.first = t.last = null; n !== null; ) {
		n.ac?.abort(Yt);
		var r = n.next;
		((n.f & G) !== 0 ? (n.parent = null) : q(n, e), (n = r));
	}
}
function En(t) {
	for (var e = t.first; e !== null; ) {
		var n = e.next;
		((e.f & P) === 0 && q(e), (e = n));
	}
}
function q(t, e = !0) {
	var n = !1;
	((e || (t.f & Be) !== 0) &&
		t.nodes_start !== null &&
		t.nodes_end !== null &&
		(Tn(t.nodes_start, t.nodes_end), (n = !0)),
		Ne(t, e && !n),
		Et(t, 0),
		g(t, st));
	var r = t.transitions;
	if (r !== null) for (const s of r) s.stop();
	xe(t);
	var a = t.parent;
	(a !== null && a.first !== null && Se(t),
		(t.next =
			t.prev =
			t.teardown =
			t.ctx =
			t.deps =
			t.fn =
			t.nodes_start =
			t.nodes_end =
			t.ac =
				null));
}
function Tn(t, e) {
	for (; t !== null; ) {
		var n = t === e ? null : z(t);
		(t.remove(), (t = n));
	}
}
function Se(t) {
	var e = t.parent,
		n = t.prev,
		r = t.next;
	(n !== null && (n.next = r),
		r !== null && (r.prev = n),
		e !== null && (e.first === t && (e.first = r), e.last === t && (e.last = n)));
}
function An(t, e) {
	var n = [];
	(Re(t, n, !0),
		xn(n, () => {
			(q(t), e && e());
		}));
}
function xn(t, e) {
	var n = t.length;
	if (n > 0) {
		var r = () => --n || e();
		for (var a of t) a.out(r);
	} else e();
}
function Re(t, e, n) {
	if ((t.f & j) === 0) {
		if (((t.f ^= j), t.transitions !== null))
			for (const f of t.transitions) (f.is_global || n) && e.push(f);
		for (var r = t.first; r !== null; ) {
			var a = r.next,
				s = (r.f & fe) !== 0 || (r.f & P) !== 0;
			(Re(r, e, s ? n : !1), (r = a));
		}
	}
}
function Br(t) {
	Oe(t, !0);
}
function Oe(t, e) {
	if ((t.f & j) !== 0) {
		((t.f ^= j), (t.f & b) === 0 && (g(t, O), L(t)));
		for (var n = t.first; n !== null; ) {
			var r = n.next,
				a = (n.f & fe) !== 0 || (n.f & P) !== 0;
			(Oe(n, a ? e : !1), (n = r));
		}
		if (t.transitions !== null) for (const s of t.transitions) (s.is_global || e) && s.in();
	}
}
let Q = !1;
function re(t) {
	Q = t;
}
let at = !1;
function se(t) {
	at = t;
}
let _ = null,
	k = !1;
function rt(t) {
	_ = t;
}
let h = null;
function gt(t) {
	h = t;
}
let C = null;
function ke(t) {
	_ !== null && (C === null ? (C = [t]) : C.push(t));
}
let E = null,
	T = 0,
	R = null;
function Nn(t) {
	R = t;
}
let mt = 1,
	vt = 0,
	$ = vt;
function ae(t) {
	$ = t;
}
let F = !1;
function Ie() {
	return ++mt;
}
function St(t) {
	var e = t.f;
	if ((e & O) !== 0) return !0;
	if ((e & K) !== 0) {
		var n = t.deps,
			r = (e & A) !== 0;
		if (n !== null) {
			var a,
				s,
				f = (e & bt) !== 0,
				l = r && h !== null && !F,
				i = n.length;
			if ((f || l) && (h === null || (h.f & st) === 0)) {
				var u = t,
					o = u.parent;
				for (a = 0; a < i; a++)
					((s = n[a]), (f || !s?.reactions?.includes(u)) && (s.reactions ??= []).push(u));
				(f && (u.f ^= bt), l && o !== null && (o.f & A) === 0 && (u.f ^= A));
			}
			for (a = 0; a < i; a++) if (((s = n[a]), St(s) && we(s), s.wv > t.wv)) return !0;
		}
		(!r || (h !== null && !F)) && g(t, b);
	}
	return !1;
}
function Ce(t, e, n = !0) {
	var r = t.reactions;
	if (r !== null && !C?.includes(t))
		for (var a = 0; a < r.length; a++) {
			var s = r[a];
			(s.f & x) !== 0 ? Ce(s, e, !1) : e === s && (n ? g(s, O) : (s.f & b) !== 0 && g(s, K), L(s));
		}
}
function De(t) {
	var e = E,
		n = T,
		r = R,
		a = _,
		s = F,
		f = C,
		l = y,
		i = k,
		u = $,
		o = t.f;
	((E = null),
		(T = 0),
		(R = null),
		(F = (o & A) !== 0 && (k || !Q || _ === null)),
		(_ = (o & (P | G)) === 0 ? t : null),
		(C = null),
		yt(t.ctx),
		(k = !1),
		($ = ++vt),
		t.ac !== null && (t.ac.abort(Yt), (t.ac = null)));
	try {
		t.f |= kt;
		var c = (0, t.fn)(),
			v = t.deps;
		if (E !== null) {
			var d;
			if ((Et(t, T), v !== null && T > 0))
				for (v.length = T + E.length, d = 0; d < E.length; d++) v[T + d] = E[d];
			else t.deps = v = E;
			if (!F || ((o & x) !== 0 && t.reactions !== null))
				for (d = T; d < v.length; d++) (v[d].reactions ??= []).push(t);
		} else v !== null && T < v.length && (Et(t, T), (v.length = T));
		if (ht() && R !== null && !k && v !== null && (t.f & (x | K | O)) === 0)
			for (d = 0; d < R.length; d++) Ce(R[d], t);
		return (
			a !== null && a !== t && (vt++, R !== null && (r === null ? (r = R) : r.push(...R))),
			(t.f & H) !== 0 && (t.f ^= H),
			c
		);
	} catch (w) {
		return fn(w);
	} finally {
		((t.f ^= kt), (E = e), (T = n), (R = r), (_ = a), (F = s), (C = f), yt(l), (k = i), ($ = u));
	}
}
function Sn(t, e) {
	let n = e.reactions;
	if (n !== null) {
		var r = je.call(n, t);
		if (r !== -1) {
			var a = n.length - 1;
			a === 0 ? (n = e.reactions = null) : ((n[r] = n[a]), n.pop());
		}
	}
	n === null &&
		(e.f & x) !== 0 &&
		(E === null || !E.includes(e)) &&
		(g(e, K), (e.f & (A | bt)) === 0 && (e.f ^= bt), pe(e), Et(e, 0));
}
function Et(t, e) {
	var n = t.deps;
	if (n !== null) for (var r = e; r < n.length; r++) Sn(t, n[r]);
}
function ot(t) {
	var e = t.f;
	if ((e & st) === 0) {
		g(t, b);
		var n = h,
			r = Q;
		((h = t), (Q = !0));
		try {
			((e & dt) !== 0 ? En(t) : Ne(t), xe(t));
			var a = De(t);
			((t.teardown = typeof a == 'function' ? a : null), (t.wv = mt));
			var s;
		} finally {
			((Q = r), (h = n));
		}
	}
}
async function $r() {
	(await Promise.resolve(), wn());
}
function Vr() {
	return W.ensure().settled();
}
function ft(t) {
	var e = t.f,
		n = (e & x) !== 0;
	if (_ !== null && !k) {
		var r = h !== null && (h.f & st) !== 0;
		if (!r && !C?.includes(t)) {
			var a = _.deps;
			if ((_.f & kt) !== 0)
				t.rv < vt &&
					((t.rv = vt),
					E === null && a !== null && a[T] === t
						? T++
						: E === null
							? (E = [t])
							: (!F || !E.includes(t)) && E.push(t));
			else {
				(_.deps ??= []).push(t);
				var s = t.reactions;
				s === null ? (t.reactions = [_]) : s.includes(_) || s.push(_);
			}
		}
	} else if (n && t.deps === null && t.effects === null) {
		var f = t,
			l = f.parent;
		l !== null && (l.f & A) === 0 && (f.f ^= A);
	}
	if (at) {
		if (B.has(t)) return B.get(t);
		if (n) {
			f = t;
			var i = f.v;
			return (((f.f & b) !== 0 || Pe(f)) && (i = Kt(f)), B.set(f, i), i);
		}
	} else if (n) {
		if (((f = t), et?.has(f))) return et.get(f);
		St(f) && we(f);
	}
	if ((t.f & H) !== 0) throw t.v;
	return t.v;
}
function Pe(t) {
	if (t.v === m) return !0;
	if (t.deps === null) return !1;
	for (const e of t.deps) if (B.has(e) || ((e.f & x) !== 0 && Pe(e))) return !0;
	return !1;
}
function Rn(t) {
	var e = k;
	try {
		return ((k = !0), t());
	} finally {
		k = e;
	}
}
const On = -7169;
function g(t, e) {
	t.f = (t.f & On) | e;
}
function Gr(t) {
	if (!(typeof t != 'object' || !t || t instanceof EventTarget)) {
		if (U in t) Dt(t);
		else if (!Array.isArray(t))
			for (let e in t) {
				const n = t[e];
				typeof n == 'object' && n && U in n && Dt(n);
			}
	}
}
function Dt(t, e = new Set()) {
	if (typeof t == 'object' && t !== null && !(t instanceof EventTarget) && !e.has(t)) {
		(e.add(t), t instanceof Date && t.getTime());
		for (let r in t)
			try {
				Dt(t[r], e);
			} catch {}
		const n = ie(t);
		if (
			n !== Object.prototype &&
			n !== Array.prototype &&
			n !== Map.prototype &&
			n !== Set.prototype &&
			n !== Date.prototype
		) {
			const r = qe(n);
			for (let a in r) {
				const s = r[a].get;
				if (s)
					try {
						s.call(t);
					} catch {}
			}
		}
	}
}
function Me(t) {
	var e = document.createElement('template');
	return ((e.innerHTML = t.replaceAll('<!>', '<!---->')), e.content);
}
function D(t, e) {
	var n = h;
	n.nodes_start === null && ((n.nodes_start = t), (n.nodes_end = e));
}
function Kr(t, e) {
	var n = (e & tn) !== 0,
		r = (e & en) !== 0,
		a,
		s = !t.startsWith('<!>');
	return () => {
		if (N) return (D(p, null), p);
		a === void 0 && ((a = Me(s ? t : '<!>' + t)), n || (a = V(a)));
		var f = r || ge ? document.importNode(a, !0) : a.cloneNode(!0);
		if (n) {
			var l = V(f),
				i = f.lastChild;
			D(l, i);
		} else D(f, f);
		return f;
	};
}
function kn(t, e, n = 'svg') {
	var r = !t.startsWith('<!>'),
		a = `<${n}>${r ? t : '<!>' + t}</${n}>`,
		s;
	return () => {
		if (N) return (D(p, null), p);
		if (!s) {
			var f = Me(a),
				l = V(f);
			s = V(l);
		}
		var i = s.cloneNode(!0);
		return (D(i, i), i);
	};
}
function Wr(t, e) {
	return kn(t, e, 'svg');
}
function zr(t = '') {
	if (!N) {
		var e = nt(t + '');
		return (D(e, e), e);
	}
	var n = p;
	return (n.nodeType !== Ht && (n.before((n = nt())), tt(n)), D(n, n), n);
}
function Xr() {
	if (N) return (D(p, null), p);
	var t = document.createDocumentFragment(),
		e = document.createComment(''),
		n = nt();
	return (t.append(e, n), D(e, n), t);
}
function Zr(t, e) {
	if (N) {
		((h.nodes_end = p), le());
		return;
	}
	t !== null && t.before(e);
}
function Jr() {
	if (N && p && p.nodeType === Ut && p.textContent?.startsWith('#')) {
		const t = p.textContent.substring(1);
		return (le(), t);
	}
	return (((window.__svelte ??= {}).uid ??= 1), `c${window.__svelte.uid++}`);
}
function Fe(t, e, n) {
	if (t == null) return (e(void 0), n && n(void 0), J);
	const r = Rn(() => t.subscribe(e, n));
	return r.unsubscribe ? () => r.unsubscribe() : r;
}
const X = [];
function In(t, e) {
	return { subscribe: Cn(t, e).subscribe };
}
function Cn(t, e = J) {
	let n = null;
	const r = new Set();
	function a(l) {
		if (ce(t, l) && ((t = l), n)) {
			const i = !X.length;
			for (const u of r) (u[1](), X.push(u, t));
			if (i) {
				for (let u = 0; u < X.length; u += 2) X[u][0](X[u + 1]);
				X.length = 0;
			}
		}
	}
	function s(l) {
		a(l(t));
	}
	function f(l, i = J) {
		const u = [l, i];
		return (
			r.add(u),
			r.size === 1 && (n = e(a, s) || J),
			l(t),
			() => {
				(r.delete(u), r.size === 0 && n && (n(), (n = null)));
			}
		);
	}
	return { set: a, update: s, subscribe: f };
}
function Qr(t, e, n) {
	const r = !Array.isArray(t),
		a = r ? [t] : t;
	if (!a.every(Boolean)) throw new Error('derived() expects stores as input, got a falsy value');
	const s = e.length < 2;
	return In(n, (f, l) => {
		let i = !1;
		const u = [];
		let o = 0,
			c = J;
		const v = () => {
				if (o) return;
				c();
				const w = e(r ? u[0] : u, f, l);
				s ? f(w) : (c = typeof w == 'function' ? w : J);
			},
			d = a.map((w, it) =>
				Fe(
					w,
					(pt) => {
						((u[it] = pt), (o &= ~(1 << it)), i && v());
					},
					() => {
						o |= 1 << it;
					}
				)
			);
		return (
			(i = !0),
			v(),
			function () {
				(Pt(d), c(), (i = !1));
			}
		);
	});
}
function ts(t) {
	return { subscribe: t.subscribe.bind(t) };
}
function es(t) {
	let e;
	return (Fe(t, (n) => (e = n))(), e);
}
export {
	m as $,
	Rn as A,
	Mn as B,
	Ut as C,
	Gr as D,
	Gt as E,
	zr as F,
	Or as G,
	Bt as H,
	Y as I,
	M as J,
	or as K,
	Hr as L,
	fe as M,
	nt as N,
	Ur as O,
	S as P,
	Ir as Q,
	An as R,
	dr as S,
	jr as T,
	qr as U,
	mr as V,
	U as W,
	_r as X,
	rn as Y,
	cr as Z,
	fr as _,
	Zr as a,
	xn as a$,
	Br as a0,
	Cn as a1,
	Ve as a2,
	_ as a3,
	Hn as a4,
	Le as a5,
	Bn as a6,
	At as a7,
	wn as a8,
	br as a9,
	Ar as aA,
	Fe as aB,
	es as aC,
	dt as aD,
	Ft as aE,
	rr as aF,
	er as aG,
	nr as aH,
	rt as aI,
	gt as aJ,
	Be as aK,
	nn as aL,
	Nr as aM,
	sn as aN,
	Un as aO,
	kr as aP,
	Dn as aQ,
	Lr as aR,
	Cr as aS,
	Wt as aT,
	Ot as aU,
	Ct as aV,
	Gn as aW,
	Vn as aX,
	zn as aY,
	j as aZ,
	Re as a_,
	hr as aa,
	wr as ab,
	pr as ac,
	Vr as ad,
	$r as ae,
	J as af,
	lt as ag,
	$n as ah,
	Jn as ai,
	vn as aj,
	ut as ak,
	at as al,
	st as am,
	Qn as an,
	Zn as ao,
	Xn as ap,
	Pn as aq,
	Ln as ar,
	tr as as,
	Dr as at,
	q as au,
	Yn as av,
	ar as aw,
	Wr as ax,
	Fn as ay,
	Xt as az,
	gr as b,
	Kn as b0,
	Wn as b1,
	ur as b2,
	xr as b3,
	hn as b4,
	sr as b5,
	ie as b6,
	jn as b7,
	ir as b8,
	qe as b9,
	Er as ba,
	Jr as bb,
	Fr as bc,
	ht as bd,
	yn as be,
	vr as bf,
	ce as bg,
	$ as bh,
	Ye as bi,
	Qr as bj,
	ts as bk,
	ne as bl,
	Sr as c,
	le as d,
	h as e,
	Kr as f,
	Tn as g,
	N as h,
	p as i,
	z as j,
	$t as k,
	D as l,
	Me as m,
	V as n,
	Xr as o,
	yr as p,
	Rr as q,
	lr as r,
	tt as s,
	Yr as t,
	ft as u,
	Tr as v,
	y as w,
	Mr as x,
	Pt as y,
	Pr as z
};
