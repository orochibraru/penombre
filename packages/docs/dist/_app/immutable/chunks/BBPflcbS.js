import {
	U as ur,
	p as fr,
	k as X,
	h as pr,
	a as xe,
	l as mr,
	b as we,
	c as gr,
	m as br,
	o as hr,
	q as yr,
	f as Oe,
	w as vr,
	s as xr,
	u as wr,
	v as kr,
	d as Ve,
	V as zr,
	r as Ie,
	n as Mr
} from './ZGPguNnN.js';
import { _ as Ar } from './PPVm8Dsz.js';
var Cr = ((e) =>
		typeof require < 'u'
			? require
			: typeof Proxy < 'u'
				? new Proxy(e, { get: (t, r) => (typeof require < 'u' ? require : t)[r] })
				: e)(function (e) {
		if (typeof require < 'u') return require.apply(this, arguments);
		throw Error('Dynamic require of "' + e + '" is not supported');
	}),
	Te = (e) => (e === !1 ? 'false' : e === !0 ? 'true' : e === 0 ? '0' : e),
	j = (e) => {
		if (!e || typeof e != 'object') return !0;
		for (let t in e) return !1;
		return !0;
	},
	Gr = (e, t) => {
		if (e === t) return !0;
		if (!e || !t) return !1;
		let r = Object.keys(e),
			o = Object.keys(t);
		if (r.length !== o.length) return !1;
		for (let l = 0; l < r.length; l++) {
			let n = r[l];
			if (!o.includes(n) || e[n] !== t[n]) return !1;
		}
		return !0;
	};
function Be(e, t) {
	for (let r = 0; r < e.length; r++) {
		let o = e[r];
		Array.isArray(o) ? Be(o, t) : t.push(o);
	}
}
var Fe = (...e) => {
		let t = [];
		Be(e, t);
		let r = [];
		for (let o = 0; o < t.length; o++) t[o] && r.push(t[o]);
		return r;
	},
	qe = (e, t) => {
		let r = {};
		for (let o in e) {
			let l = e[o];
			if (o in t) {
				let n = t[o];
				Array.isArray(l) || Array.isArray(n)
					? (r[o] = Fe(n, l))
					: typeof l == 'object' && typeof n == 'object' && l && n
						? (r[o] = qe(l, n))
						: (r[o] = n + ' ' + l);
			} else r[o] = l;
		}
		for (let o in t) o in e || (r[o] = t[o]);
		return r;
	},
	Sr = /\s+/g,
	je = (e) => (!e || typeof e != 'string' ? e : e.replace(Sr, ' ').trim()),
	Z = null,
	pe = null,
	Pr = async () =>
		Z ||
		pe ||
		((pe = Ar(() => Promise.resolve().then(() => st), void 0, import.meta.url)
			.then((e) => ((Z = e), e))
			.catch(() => null)),
		pe),
	_r = (e) => (t) => {
		if (pe && !Z) return t;
		if (Z) {
			let { twMerge: r, extendTailwindMerge: o } = Z;
			return (
				j(e)
					? r
					: o({
							...e,
							extend: {
								theme: e.theme,
								classGroups: e.classGroups,
								conflictingClassGroupModifiers: e.conflictingClassGroupModifiers,
								conflictingClassGroups: e.conflictingClassGroups,
								...e.extend
							}
						})
			)(t);
		}
		try {
			let { twMerge: r, extendTailwindMerge: o } = Cr('tailwind-merge');
			return (
				(Z = { twMerge: r, extendTailwindMerge: o }),
				(j(e)
					? r
					: o({
							...e,
							extend: {
								theme: e.theme,
								classGroups: e.classGroups,
								conflictingClassGroupModifiers: e.conflictingClassGroupModifiers,
								conflictingClassGroups: e.conflictingClassGroups,
								...e.extend
							}
						}))(t)
			);
		} catch {
			return (Pr(), t);
		}
	},
	Rr = { twMerge: !0, twMergeConfig: {}, responsiveVariants: !1 },
	be = (...e) => {
		let t = [];
		We(e, t);
		let r = '';
		for (let o = 0; o < t.length; o++) t[o] && (r && (r += ' '), (r += t[o]));
		return r || void 0;
	};
function We(e, t) {
	for (let r = 0; r < e.length; r++) {
		let o = e[r];
		Array.isArray(o) ? We(o, t) : o && t.push(o);
	}
}
var ke = null,
	ze = {},
	Me = !1,
	de =
		(...e) =>
		(t) => {
			let r = be(e);
			return !r || !t.twMerge
				? r
				: ((!ke || Me) && ((Me = !1), (ke = _r(ze))), ke(r) || void 0);
		},
	Ne = (e, t) => {
		for (let r in t) r in e ? (e[r] = be(e[r], t[r])) : (e[r] = t[r]);
		return e;
	},
	Vr = (e, t) => {
		let {
				extend: r = null,
				slots: o = {},
				variants: l = {},
				compoundVariants: n = [],
				compoundSlots: d = [],
				defaultVariants: v = {}
			} = e,
			c = { ...Rr, ...t },
			z = r?.base ? be(r.base, e?.base) : e?.base,
			x = r?.variants && !j(r.variants) ? qe(l, r.variants) : l,
			T = r?.defaultVariants && !j(r.defaultVariants) ? { ...r.defaultVariants, ...v } : v;
		!j(c.twMergeConfig) && !Gr(c.twMergeConfig, ze) && ((Me = !0), (ze = c.twMergeConfig));
		let N = j(r?.slots),
			E = j(o) ? {} : { base: be(e?.base, N && r?.base), ...o },
			A = N ? E : Ne({ ...r?.slots }, j(E) ? { base: e?.base } : E),
			C = j(r?.compoundVariants) ? n : Fe(r?.compoundVariants, n),
			_ = (I) => {
				if (j(x) && j(o) && N) return de(z, I?.class, I?.className)(c);
				if (C && !Array.isArray(C))
					throw new TypeError(
						`The "compoundVariants" prop must be an array. Received: ${typeof C}`
					);
				if (d && !Array.isArray(d))
					throw new TypeError(
						`The "compoundSlots" prop must be an array. Received: ${typeof d}`
					);
				let D = (g, b, h = [], y) => {
						let p = h;
						if (typeof b == 'string') {
							let f = je(b).split(' ');
							for (let s = 0; s < f.length; s++) p.push(`${g}:${f[s]}`);
						} else if (Array.isArray(b))
							for (let f = 0; f < b.length; f++) p.push(`${g}:${b[f]}`);
						else if (typeof b == 'object' && typeof y == 'string' && y in b) {
							let f = b[y];
							if (f && typeof f == 'string') {
								let s = je(f).split(' '),
									R = [];
								for (let S = 0; S < s.length; S++) R.push(`${g}:${s[S]}`);
								p[y] = p[y] ? p[y].concat(R) : R;
							} else if (Array.isArray(f) && f.length > 0) {
								let s = [];
								for (let R = 0; R < f.length; R++) s.push(`${g}:${f[R]}`);
								p[y] = s;
							}
						}
						return p;
					},
					G = (g, b = x, h = null, y = null) => {
						let p = b[g];
						if (!p || j(p)) return null;
						let f = y?.[g] ?? I?.[g];
						if (f === null) return null;
						let s = Te(f),
							R =
								(Array.isArray(c.responsiveVariants) &&
									c.responsiveVariants.length > 0) ||
								c.responsiveVariants === !0,
							S = T?.[g],
							M = [];
						if (typeof s == 'object' && R)
							for (let [k, J] of Object.entries(s)) {
								let ae = p[J];
								if (k === 'initial') {
									S = J;
									continue;
								}
								(Array.isArray(c.responsiveVariants) &&
									!c.responsiveVariants.includes(k)) ||
									(M = D(k, ae, M, h));
							}
						let F = s != null && typeof s != 'object' ? s : Te(S),
							w = p[F || 'false'];
						return typeof M == 'object' && typeof h == 'string' && M[h]
							? Ne(M, w)
							: M.length > 0
								? (M.push(w), h === 'base' ? M.join(' ') : M)
								: w;
					},
					q = () => {
						if (!x) return null;
						let g = Object.keys(x),
							b = [];
						for (let h = 0; h < g.length; h++) {
							let y = G(g[h], x);
							y && b.push(y);
						}
						return b;
					},
					O = (g, b) => {
						if (!x || typeof x != 'object') return null;
						let h = [];
						for (let y in x) {
							let p = G(y, x, g, b),
								f = g === 'base' && typeof p == 'string' ? p : p && p[g];
							f && h.push(f);
						}
						return h;
					},
					W = {};
				for (let g in I) {
					let b = I[g];
					b !== void 0 && (W[g] = b);
				}
				let u = (g, b) => {
						let h = typeof I?.[g] == 'object' ? { [g]: I[g]?.initial } : {};
						return { ...T, ...W, ...h, ...b };
					},
					B = (g = [], b) => {
						let h = [],
							y = g.length;
						for (let p = 0; p < y; p++) {
							let { class: f, className: s, ...R } = g[p],
								S = !0,
								M = u(null, b);
							for (let F in R) {
								let w = R[F],
									k = M[F];
								if (Array.isArray(w)) {
									if (!w.includes(k)) {
										S = !1;
										break;
									}
								} else {
									if ((w == null || w === !1) && (k == null || k === !1))
										continue;
									if (k !== w) {
										S = !1;
										break;
									}
								}
							}
							S && (f && h.push(f), s && h.push(s));
						}
						return h;
					},
					se = (g) => {
						let b = B(C, g);
						if (!Array.isArray(b)) return b;
						let h = {},
							y = de;
						for (let p = 0; p < b.length; p++) {
							let f = b[p];
							if (typeof f == 'string') h.base = y(h.base, f)(c);
							else if (typeof f == 'object') for (let s in f) h[s] = y(h[s], f[s])(c);
						}
						return h;
					},
					ne = (g) => {
						if (d.length < 1) return null;
						let b = {},
							h = u(null, g);
						for (let y = 0; y < d.length; y++) {
							let { slots: p = [], class: f, className: s, ...R } = d[y];
							if (!j(R)) {
								let S = !0;
								for (let M in R) {
									let F = h[M],
										w = R[M];
									if (
										F === void 0 ||
										(Array.isArray(w) ? !w.includes(F) : w !== F)
									) {
										S = !1;
										break;
									}
								}
								if (!S) continue;
							}
							for (let S = 0; S < p.length; S++) {
								let M = p[S];
								(b[M] || (b[M] = []), b[M].push([f, s]));
							}
						}
						return b;
					};
				if (!j(o) || !N) {
					let g = {};
					if (typeof A == 'object' && !j(A)) {
						let b = de;
						for (let h in A)
							g[h] = (y) => {
								let p = se(y),
									f = ne(y);
								return b(
									A[h],
									O(h, y),
									p ? p[h] : void 0,
									f ? f[h] : void 0,
									y?.class,
									y?.className
								)(c);
							};
					}
					return g;
				}
				return de(z, q(), B(C), I?.class, I?.className)(c);
			},
			L = () => {
				if (!(!x || typeof x != 'object')) return Object.keys(x);
			};
		return (
			(_.variantKeys = L()),
			(_.extend = r),
			(_.base = z),
			(_.slots = A),
			(_.variants = x),
			(_.defaultVariants = T),
			(_.compoundSlots = d),
			(_.compoundVariants = C),
			_
		);
	};
const _e = '-',
	Ir = (e) => {
		const t = jr(e),
			{ conflictingClassGroups: r, conflictingClassGroupModifiers: o } = e;
		return {
			getClassGroupId: (d) => {
				const v = d.split(_e);
				return (v[0] === '' && v.length !== 1 && v.shift(), Ue(v, t) || Tr(d));
			},
			getConflictingClassGroupIds: (d, v) => {
				const c = r[d] || [];
				return v && o[d] ? [...c, ...o[d]] : c;
			}
		};
	},
	Ue = (e, t) => {
		if (e.length === 0) return t.classGroupId;
		const r = e[0],
			o = t.nextPart.get(r),
			l = o ? Ue(e.slice(1), o) : void 0;
		if (l) return l;
		if (t.validators.length === 0) return;
		const n = e.join(_e);
		return t.validators.find(({ validator: d }) => d(n))?.classGroupId;
	},
	Ee = /^\[(.+)\]$/,
	Tr = (e) => {
		if (Ee.test(e)) {
			const t = Ee.exec(e)[1],
				r = t?.substring(0, t.indexOf(':'));
			if (r) return 'arbitrary..' + r;
		}
	},
	jr = (e) => {
		const { theme: t, classGroups: r } = e,
			o = { nextPart: new Map(), validators: [] };
		for (const l in r) Ae(r[l], o, l, t);
		return o;
	},
	Ae = (e, t, r, o) => {
		e.forEach((l) => {
			if (typeof l == 'string') {
				const n = l === '' ? t : Le(t, l);
				n.classGroupId = r;
				return;
			}
			if (typeof l == 'function') {
				if (Nr(l)) {
					Ae(l(o), t, r, o);
					return;
				}
				t.validators.push({ validator: l, classGroupId: r });
				return;
			}
			Object.entries(l).forEach(([n, d]) => {
				Ae(d, Le(t, n), r, o);
			});
		});
	},
	Le = (e, t) => {
		let r = e;
		return (
			t.split(_e).forEach((o) => {
				(r.nextPart.has(o) || r.nextPart.set(o, { nextPart: new Map(), validators: [] }),
					(r = r.nextPart.get(o)));
			}),
			r
		);
	},
	Nr = (e) => e.isThemeGetter,
	Er = (e) => {
		if (e < 1) return { get: () => {}, set: () => {} };
		let t = 0,
			r = new Map(),
			o = new Map();
		const l = (n, d) => {
			(r.set(n, d), t++, t > e && ((t = 0), (o = r), (r = new Map())));
		};
		return {
			get(n) {
				let d = r.get(n);
				if (d !== void 0) return d;
				if ((d = o.get(n)) !== void 0) return (l(n, d), d);
			},
			set(n, d) {
				r.has(n) ? r.set(n, d) : l(n, d);
			}
		};
	},
	Ce = '!',
	Ge = ':',
	Lr = Ge.length,
	Or = (e) => {
		const { prefix: t, experimentalParseClassName: r } = e;
		let o = (l) => {
			const n = [];
			let d = 0,
				v = 0,
				c = 0,
				z;
			for (let A = 0; A < l.length; A++) {
				let C = l[A];
				if (d === 0 && v === 0) {
					if (C === Ge) {
						(n.push(l.slice(c, A)), (c = A + Lr));
						continue;
					}
					if (C === '/') {
						z = A;
						continue;
					}
				}
				C === '[' ? d++ : C === ']' ? d-- : C === '(' ? v++ : C === ')' && v--;
			}
			const x = n.length === 0 ? l : l.substring(c),
				T = Br(x),
				N = T !== x,
				E = z && z > c ? z - c : void 0;
			return {
				modifiers: n,
				hasImportantModifier: N,
				baseClassName: T,
				maybePostfixModifierPosition: E
			};
		};
		if (t) {
			const l = t + Ge,
				n = o;
			o = (d) =>
				d.startsWith(l)
					? n(d.substring(l.length))
					: {
							isExternal: !0,
							modifiers: [],
							hasImportantModifier: !1,
							baseClassName: d,
							maybePostfixModifierPosition: void 0
						};
		}
		if (r) {
			const l = o;
			o = (n) => r({ className: n, parseClassName: l });
		}
		return o;
	},
	Br = (e) =>
		e.endsWith(Ce) ? e.substring(0, e.length - 1) : e.startsWith(Ce) ? e.substring(1) : e,
	Fr = (e) => {
		const t = Object.fromEntries(e.orderSensitiveModifiers.map((o) => [o, !0]));
		return (o) => {
			if (o.length <= 1) return o;
			const l = [];
			let n = [];
			return (
				o.forEach((d) => {
					d[0] === '[' || t[d] ? (l.push(...n.sort(), d), (n = [])) : n.push(d);
				}),
				l.push(...n.sort()),
				l
			);
		};
	},
	qr = (e) => ({ cache: Er(e.cacheSize), parseClassName: Or(e), sortModifiers: Fr(e), ...Ir(e) }),
	Wr = /\s+/,
	Ur = (e, t) => {
		const {
				parseClassName: r,
				getClassGroupId: o,
				getConflictingClassGroupIds: l,
				sortModifiers: n
			} = t,
			d = [],
			v = e.trim().split(Wr);
		let c = '';
		for (let z = v.length - 1; z >= 0; z -= 1) {
			const x = v[z],
				{
					isExternal: T,
					modifiers: N,
					hasImportantModifier: E,
					baseClassName: A,
					maybePostfixModifierPosition: C
				} = r(x);
			if (T) {
				c = x + (c.length > 0 ? ' ' + c : c);
				continue;
			}
			let _ = !!C,
				L = o(_ ? A.substring(0, C) : A);
			if (!L) {
				if (!_) {
					c = x + (c.length > 0 ? ' ' + c : c);
					continue;
				}
				if (((L = o(A)), !L)) {
					c = x + (c.length > 0 ? ' ' + c : c);
					continue;
				}
				_ = !1;
			}
			const I = n(N).join(':'),
				D = E ? I + Ce : I,
				G = D + L;
			if (d.includes(G)) continue;
			d.push(G);
			const q = l(L, _);
			for (let O = 0; O < q.length; ++O) {
				const W = q[O];
				d.push(D + W);
			}
			c = x + (c.length > 0 ? ' ' + c : c);
		}
		return c;
	};
function De() {
	let e = 0,
		t,
		r,
		o = '';
	for (; e < arguments.length; )
		(t = arguments[e++]) && (r = Ke(t)) && (o && (o += ' '), (o += r));
	return o;
}
const Ke = (e) => {
	if (typeof e == 'string') return e;
	let t,
		r = '';
	for (let o = 0; o < e.length; o++) e[o] && (t = Ke(e[o])) && (r && (r += ' '), (r += t));
	return r;
};
function he(e, ...t) {
	let r,
		o,
		l,
		n = d;
	function d(c) {
		const z = t.reduce((x, T) => T(x), e());
		return ((r = qr(z)), (o = r.cache.get), (l = r.cache.set), (n = v), v(c));
	}
	function v(c) {
		const z = o(c);
		if (z) return z;
		const x = Ur(c, r);
		return (l(c, x), x);
	}
	return function () {
		return n(De.apply(null, arguments));
	};
}
const P = (e) => {
		const t = (r) => r[e] || [];
		return ((t.isThemeGetter = !0), t);
	},
	Xe = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
	He = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
	Dr = /^\d+\/\d+$/,
	Kr = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
	Xr =
		/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
	Hr = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
	Jr = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
	Qr =
		/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
	Q = (e) => Dr.test(e),
	m = (e) => !!e && !Number.isNaN(Number(e)),
	K = (e) => !!e && Number.isInteger(Number(e)),
	me = (e) => e.endsWith('%') && m(e.slice(0, -1)),
	U = (e) => Kr.test(e),
	Je = () => !0,
	Yr = (e) => Xr.test(e) && !Hr.test(e),
	Qe = () => !1,
	Zr = (e) => Jr.test(e),
	$r = (e) => Qr.test(e),
	Ye = (e) => !a(e) && !i(e),
	Ze = (e) => $(e, nr, Qe),
	a = (e) => Xe.test(e),
	H = (e) => $(e, ar, Yr),
	ge = (e) => $(e, et, m),
	Se = (e) => $(e, or, Qe),
	$e = (e) => $(e, sr, $r),
	re = (e) => $(e, ir, Zr),
	i = (e) => He.test(e),
	Y = (e) => ee(e, ar),
	er = (e) => ee(e, rt),
	Pe = (e) => ee(e, or),
	rr = (e) => ee(e, nr),
	tr = (e) => ee(e, sr),
	te = (e) => ee(e, ir, !0),
	$ = (e, t, r) => {
		const o = Xe.exec(e);
		return o ? (o[1] ? t(o[1]) : r(o[2])) : !1;
	},
	ee = (e, t, r = !1) => {
		const o = He.exec(e);
		return o ? (o[1] ? t(o[1]) : r) : !1;
	},
	or = (e) => e === 'position' || e === 'percentage',
	sr = (e) => e === 'image' || e === 'url',
	nr = (e) => e === 'length' || e === 'size' || e === 'bg-size',
	ar = (e) => e === 'length',
	et = (e) => e === 'number',
	rt = (e) => e === 'family-name',
	ir = (e) => e === 'shadow',
	tt = Object.defineProperty(
		{
			__proto__: null,
			isAny: Je,
			isAnyNonArbitrary: Ye,
			isArbitraryImage: $e,
			isArbitraryLength: H,
			isArbitraryNumber: ge,
			isArbitraryPosition: Se,
			isArbitraryShadow: re,
			isArbitrarySize: Ze,
			isArbitraryValue: a,
			isArbitraryVariable: i,
			isArbitraryVariableFamilyName: er,
			isArbitraryVariableImage: tr,
			isArbitraryVariableLength: Y,
			isArbitraryVariablePosition: Pe,
			isArbitraryVariableShadow: te,
			isArbitraryVariableSize: rr,
			isFraction: Q,
			isInteger: K,
			isNumber: m,
			isPercent: me,
			isTshirtSize: U
		},
		Symbol.toStringTag,
		{ value: 'Module' }
	),
	ye = () => {
		const e = P('color'),
			t = P('font'),
			r = P('text'),
			o = P('font-weight'),
			l = P('tracking'),
			n = P('leading'),
			d = P('breakpoint'),
			v = P('container'),
			c = P('spacing'),
			z = P('radius'),
			x = P('shadow'),
			T = P('inset-shadow'),
			N = P('text-shadow'),
			E = P('drop-shadow'),
			A = P('blur'),
			C = P('perspective'),
			_ = P('aspect'),
			L = P('ease'),
			I = P('animate'),
			D = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'],
			G = () => [
				'center',
				'top',
				'bottom',
				'left',
				'right',
				'top-left',
				'left-top',
				'top-right',
				'right-top',
				'bottom-right',
				'right-bottom',
				'bottom-left',
				'left-bottom'
			],
			q = () => [...G(), i, a],
			O = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
			W = () => ['auto', 'contain', 'none'],
			u = () => [i, a, c],
			B = () => [Q, 'full', 'auto', ...u()],
			se = () => [K, 'none', 'subgrid', i, a],
			ne = () => ['auto', { span: ['full', K, i, a] }, K, i, a],
			g = () => [K, 'auto', i, a],
			b = () => ['auto', 'min', 'max', 'fr', i, a],
			h = () => [
				'start',
				'end',
				'center',
				'between',
				'around',
				'evenly',
				'stretch',
				'baseline',
				'center-safe',
				'end-safe'
			],
			y = () => ['start', 'end', 'center', 'stretch', 'center-safe', 'end-safe'],
			p = () => ['auto', ...u()],
			f = () => [
				Q,
				'auto',
				'full',
				'dvw',
				'dvh',
				'lvw',
				'lvh',
				'svw',
				'svh',
				'min',
				'max',
				'fit',
				...u()
			],
			s = () => [e, i, a],
			R = () => [...G(), Pe, Se, { position: [i, a] }],
			S = () => ['no-repeat', { repeat: ['', 'x', 'y', 'space', 'round'] }],
			M = () => ['auto', 'cover', 'contain', rr, Ze, { size: [i, a] }],
			F = () => [me, Y, H],
			w = () => ['', 'none', 'full', z, i, a],
			k = () => ['', m, Y, H],
			J = () => ['solid', 'dashed', 'dotted', 'double'],
			ae = () => [
				'normal',
				'multiply',
				'screen',
				'overlay',
				'darken',
				'lighten',
				'color-dodge',
				'color-burn',
				'hard-light',
				'soft-light',
				'difference',
				'exclusion',
				'hue',
				'saturation',
				'color',
				'luminosity'
			],
			V = () => [m, me, Pe, Se],
			Re = () => ['', 'none', A, i, a],
			ie = () => ['none', m, i, a],
			le = () => ['none', m, i, a],
			ve = () => [m, i, a],
			ce = () => [Q, 'full', ...u()];
		return {
			cacheSize: 500,
			theme: {
				animate: ['spin', 'ping', 'pulse', 'bounce'],
				aspect: ['video'],
				blur: [U],
				breakpoint: [U],
				color: [Je],
				container: [U],
				'drop-shadow': [U],
				ease: ['in', 'out', 'in-out'],
				font: [Ye],
				'font-weight': [
					'thin',
					'extralight',
					'light',
					'normal',
					'medium',
					'semibold',
					'bold',
					'extrabold',
					'black'
				],
				'inset-shadow': [U],
				leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
				perspective: ['dramatic', 'near', 'normal', 'midrange', 'distant', 'none'],
				radius: [U],
				shadow: [U],
				spacing: ['px', m],
				text: [U],
				'text-shadow': [U],
				tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']
			},
			classGroups: {
				aspect: [{ aspect: ['auto', 'square', Q, a, i, _] }],
				container: ['container'],
				columns: [{ columns: [m, a, i, v] }],
				'break-after': [{ 'break-after': D() }],
				'break-before': [{ 'break-before': D() }],
				'break-inside': [
					{ 'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'] }
				],
				'box-decoration': [{ 'box-decoration': ['slice', 'clone'] }],
				box: [{ box: ['border', 'content'] }],
				display: [
					'block',
					'inline-block',
					'inline',
					'flex',
					'inline-flex',
					'table',
					'inline-table',
					'table-caption',
					'table-cell',
					'table-column',
					'table-column-group',
					'table-footer-group',
					'table-header-group',
					'table-row-group',
					'table-row',
					'flow-root',
					'grid',
					'inline-grid',
					'contents',
					'list-item',
					'hidden'
				],
				sr: ['sr-only', 'not-sr-only'],
				float: [{ float: ['right', 'left', 'none', 'start', 'end'] }],
				clear: [{ clear: ['left', 'right', 'both', 'none', 'start', 'end'] }],
				isolation: ['isolate', 'isolation-auto'],
				'object-fit': [{ object: ['contain', 'cover', 'fill', 'none', 'scale-down'] }],
				'object-position': [{ object: q() }],
				overflow: [{ overflow: O() }],
				'overflow-x': [{ 'overflow-x': O() }],
				'overflow-y': [{ 'overflow-y': O() }],
				overscroll: [{ overscroll: W() }],
				'overscroll-x': [{ 'overscroll-x': W() }],
				'overscroll-y': [{ 'overscroll-y': W() }],
				position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
				inset: [{ inset: B() }],
				'inset-x': [{ 'inset-x': B() }],
				'inset-y': [{ 'inset-y': B() }],
				start: [{ start: B() }],
				end: [{ end: B() }],
				top: [{ top: B() }],
				right: [{ right: B() }],
				bottom: [{ bottom: B() }],
				left: [{ left: B() }],
				visibility: ['visible', 'invisible', 'collapse'],
				z: [{ z: [K, 'auto', i, a] }],
				basis: [{ basis: [Q, 'full', 'auto', v, ...u()] }],
				'flex-direction': [{ flex: ['row', 'row-reverse', 'col', 'col-reverse'] }],
				'flex-wrap': [{ flex: ['nowrap', 'wrap', 'wrap-reverse'] }],
				flex: [{ flex: [m, Q, 'auto', 'initial', 'none', a] }],
				grow: [{ grow: ['', m, i, a] }],
				shrink: [{ shrink: ['', m, i, a] }],
				order: [{ order: [K, 'first', 'last', 'none', i, a] }],
				'grid-cols': [{ 'grid-cols': se() }],
				'col-start-end': [{ col: ne() }],
				'col-start': [{ 'col-start': g() }],
				'col-end': [{ 'col-end': g() }],
				'grid-rows': [{ 'grid-rows': se() }],
				'row-start-end': [{ row: ne() }],
				'row-start': [{ 'row-start': g() }],
				'row-end': [{ 'row-end': g() }],
				'grid-flow': [{ 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] }],
				'auto-cols': [{ 'auto-cols': b() }],
				'auto-rows': [{ 'auto-rows': b() }],
				gap: [{ gap: u() }],
				'gap-x': [{ 'gap-x': u() }],
				'gap-y': [{ 'gap-y': u() }],
				'justify-content': [{ justify: [...h(), 'normal'] }],
				'justify-items': [{ 'justify-items': [...y(), 'normal'] }],
				'justify-self': [{ 'justify-self': ['auto', ...y()] }],
				'align-content': [{ content: ['normal', ...h()] }],
				'align-items': [{ items: [...y(), { baseline: ['', 'last'] }] }],
				'align-self': [{ self: ['auto', ...y(), { baseline: ['', 'last'] }] }],
				'place-content': [{ 'place-content': h() }],
				'place-items': [{ 'place-items': [...y(), 'baseline'] }],
				'place-self': [{ 'place-self': ['auto', ...y()] }],
				p: [{ p: u() }],
				px: [{ px: u() }],
				py: [{ py: u() }],
				ps: [{ ps: u() }],
				pe: [{ pe: u() }],
				pt: [{ pt: u() }],
				pr: [{ pr: u() }],
				pb: [{ pb: u() }],
				pl: [{ pl: u() }],
				m: [{ m: p() }],
				mx: [{ mx: p() }],
				my: [{ my: p() }],
				ms: [{ ms: p() }],
				me: [{ me: p() }],
				mt: [{ mt: p() }],
				mr: [{ mr: p() }],
				mb: [{ mb: p() }],
				ml: [{ ml: p() }],
				'space-x': [{ 'space-x': u() }],
				'space-x-reverse': ['space-x-reverse'],
				'space-y': [{ 'space-y': u() }],
				'space-y-reverse': ['space-y-reverse'],
				size: [{ size: f() }],
				w: [{ w: [v, 'screen', ...f()] }],
				'min-w': [{ 'min-w': [v, 'screen', 'none', ...f()] }],
				'max-w': [{ 'max-w': [v, 'screen', 'none', 'prose', { screen: [d] }, ...f()] }],
				h: [{ h: ['screen', 'lh', ...f()] }],
				'min-h': [{ 'min-h': ['screen', 'lh', 'none', ...f()] }],
				'max-h': [{ 'max-h': ['screen', 'lh', ...f()] }],
				'font-size': [{ text: ['base', r, Y, H] }],
				'font-smoothing': ['antialiased', 'subpixel-antialiased'],
				'font-style': ['italic', 'not-italic'],
				'font-weight': [{ font: [o, i, ge] }],
				'font-stretch': [
					{
						'font-stretch': [
							'ultra-condensed',
							'extra-condensed',
							'condensed',
							'semi-condensed',
							'normal',
							'semi-expanded',
							'expanded',
							'extra-expanded',
							'ultra-expanded',
							me,
							a
						]
					}
				],
				'font-family': [{ font: [er, a, t] }],
				'fvn-normal': ['normal-nums'],
				'fvn-ordinal': ['ordinal'],
				'fvn-slashed-zero': ['slashed-zero'],
				'fvn-figure': ['lining-nums', 'oldstyle-nums'],
				'fvn-spacing': ['proportional-nums', 'tabular-nums'],
				'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
				tracking: [{ tracking: [l, i, a] }],
				'line-clamp': [{ 'line-clamp': [m, 'none', i, ge] }],
				leading: [{ leading: [n, ...u()] }],
				'list-image': [{ 'list-image': ['none', i, a] }],
				'list-style-position': [{ list: ['inside', 'outside'] }],
				'list-style-type': [{ list: ['disc', 'decimal', 'none', i, a] }],
				'text-alignment': [
					{ text: ['left', 'center', 'right', 'justify', 'start', 'end'] }
				],
				'placeholder-color': [{ placeholder: s() }],
				'text-color': [{ text: s() }],
				'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
				'text-decoration-style': [{ decoration: [...J(), 'wavy'] }],
				'text-decoration-thickness': [{ decoration: [m, 'from-font', 'auto', i, H] }],
				'text-decoration-color': [{ decoration: s() }],
				'underline-offset': [{ 'underline-offset': [m, 'auto', i, a] }],
				'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
				'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
				'text-wrap': [{ text: ['wrap', 'nowrap', 'balance', 'pretty'] }],
				indent: [{ indent: u() }],
				'vertical-align': [
					{
						align: [
							'baseline',
							'top',
							'middle',
							'bottom',
							'text-top',
							'text-bottom',
							'sub',
							'super',
							i,
							a
						]
					}
				],
				whitespace: [
					{
						whitespace: [
							'normal',
							'nowrap',
							'pre',
							'pre-line',
							'pre-wrap',
							'break-spaces'
						]
					}
				],
				break: [{ break: ['normal', 'words', 'all', 'keep'] }],
				wrap: [{ wrap: ['break-word', 'anywhere', 'normal'] }],
				hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
				content: [{ content: ['none', i, a] }],
				'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
				'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
				'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
				'bg-position': [{ bg: R() }],
				'bg-repeat': [{ bg: S() }],
				'bg-size': [{ bg: M() }],
				'bg-image': [
					{
						bg: [
							'none',
							{
								linear: [
									{ to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] },
									K,
									i,
									a
								],
								radial: ['', i, a],
								conic: [K, i, a]
							},
							tr,
							$e
						]
					}
				],
				'bg-color': [{ bg: s() }],
				'gradient-from-pos': [{ from: F() }],
				'gradient-via-pos': [{ via: F() }],
				'gradient-to-pos': [{ to: F() }],
				'gradient-from': [{ from: s() }],
				'gradient-via': [{ via: s() }],
				'gradient-to': [{ to: s() }],
				rounded: [{ rounded: w() }],
				'rounded-s': [{ 'rounded-s': w() }],
				'rounded-e': [{ 'rounded-e': w() }],
				'rounded-t': [{ 'rounded-t': w() }],
				'rounded-r': [{ 'rounded-r': w() }],
				'rounded-b': [{ 'rounded-b': w() }],
				'rounded-l': [{ 'rounded-l': w() }],
				'rounded-ss': [{ 'rounded-ss': w() }],
				'rounded-se': [{ 'rounded-se': w() }],
				'rounded-ee': [{ 'rounded-ee': w() }],
				'rounded-es': [{ 'rounded-es': w() }],
				'rounded-tl': [{ 'rounded-tl': w() }],
				'rounded-tr': [{ 'rounded-tr': w() }],
				'rounded-br': [{ 'rounded-br': w() }],
				'rounded-bl': [{ 'rounded-bl': w() }],
				'border-w': [{ border: k() }],
				'border-w-x': [{ 'border-x': k() }],
				'border-w-y': [{ 'border-y': k() }],
				'border-w-s': [{ 'border-s': k() }],
				'border-w-e': [{ 'border-e': k() }],
				'border-w-t': [{ 'border-t': k() }],
				'border-w-r': [{ 'border-r': k() }],
				'border-w-b': [{ 'border-b': k() }],
				'border-w-l': [{ 'border-l': k() }],
				'divide-x': [{ 'divide-x': k() }],
				'divide-x-reverse': ['divide-x-reverse'],
				'divide-y': [{ 'divide-y': k() }],
				'divide-y-reverse': ['divide-y-reverse'],
				'border-style': [{ border: [...J(), 'hidden', 'none'] }],
				'divide-style': [{ divide: [...J(), 'hidden', 'none'] }],
				'border-color': [{ border: s() }],
				'border-color-x': [{ 'border-x': s() }],
				'border-color-y': [{ 'border-y': s() }],
				'border-color-s': [{ 'border-s': s() }],
				'border-color-e': [{ 'border-e': s() }],
				'border-color-t': [{ 'border-t': s() }],
				'border-color-r': [{ 'border-r': s() }],
				'border-color-b': [{ 'border-b': s() }],
				'border-color-l': [{ 'border-l': s() }],
				'divide-color': [{ divide: s() }],
				'outline-style': [{ outline: [...J(), 'none', 'hidden'] }],
				'outline-offset': [{ 'outline-offset': [m, i, a] }],
				'outline-w': [{ outline: ['', m, Y, H] }],
				'outline-color': [{ outline: s() }],
				shadow: [{ shadow: ['', 'none', x, te, re] }],
				'shadow-color': [{ shadow: s() }],
				'inset-shadow': [{ 'inset-shadow': ['none', T, te, re] }],
				'inset-shadow-color': [{ 'inset-shadow': s() }],
				'ring-w': [{ ring: k() }],
				'ring-w-inset': ['ring-inset'],
				'ring-color': [{ ring: s() }],
				'ring-offset-w': [{ 'ring-offset': [m, H] }],
				'ring-offset-color': [{ 'ring-offset': s() }],
				'inset-ring-w': [{ 'inset-ring': k() }],
				'inset-ring-color': [{ 'inset-ring': s() }],
				'text-shadow': [{ 'text-shadow': ['none', N, te, re] }],
				'text-shadow-color': [{ 'text-shadow': s() }],
				opacity: [{ opacity: [m, i, a] }],
				'mix-blend': [{ 'mix-blend': [...ae(), 'plus-darker', 'plus-lighter'] }],
				'bg-blend': [{ 'bg-blend': ae() }],
				'mask-clip': [
					{ 'mask-clip': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] },
					'mask-no-clip'
				],
				'mask-composite': [{ mask: ['add', 'subtract', 'intersect', 'exclude'] }],
				'mask-image-linear-pos': [{ 'mask-linear': [m] }],
				'mask-image-linear-from-pos': [{ 'mask-linear-from': V() }],
				'mask-image-linear-to-pos': [{ 'mask-linear-to': V() }],
				'mask-image-linear-from-color': [{ 'mask-linear-from': s() }],
				'mask-image-linear-to-color': [{ 'mask-linear-to': s() }],
				'mask-image-t-from-pos': [{ 'mask-t-from': V() }],
				'mask-image-t-to-pos': [{ 'mask-t-to': V() }],
				'mask-image-t-from-color': [{ 'mask-t-from': s() }],
				'mask-image-t-to-color': [{ 'mask-t-to': s() }],
				'mask-image-r-from-pos': [{ 'mask-r-from': V() }],
				'mask-image-r-to-pos': [{ 'mask-r-to': V() }],
				'mask-image-r-from-color': [{ 'mask-r-from': s() }],
				'mask-image-r-to-color': [{ 'mask-r-to': s() }],
				'mask-image-b-from-pos': [{ 'mask-b-from': V() }],
				'mask-image-b-to-pos': [{ 'mask-b-to': V() }],
				'mask-image-b-from-color': [{ 'mask-b-from': s() }],
				'mask-image-b-to-color': [{ 'mask-b-to': s() }],
				'mask-image-l-from-pos': [{ 'mask-l-from': V() }],
				'mask-image-l-to-pos': [{ 'mask-l-to': V() }],
				'mask-image-l-from-color': [{ 'mask-l-from': s() }],
				'mask-image-l-to-color': [{ 'mask-l-to': s() }],
				'mask-image-x-from-pos': [{ 'mask-x-from': V() }],
				'mask-image-x-to-pos': [{ 'mask-x-to': V() }],
				'mask-image-x-from-color': [{ 'mask-x-from': s() }],
				'mask-image-x-to-color': [{ 'mask-x-to': s() }],
				'mask-image-y-from-pos': [{ 'mask-y-from': V() }],
				'mask-image-y-to-pos': [{ 'mask-y-to': V() }],
				'mask-image-y-from-color': [{ 'mask-y-from': s() }],
				'mask-image-y-to-color': [{ 'mask-y-to': s() }],
				'mask-image-radial': [{ 'mask-radial': [i, a] }],
				'mask-image-radial-from-pos': [{ 'mask-radial-from': V() }],
				'mask-image-radial-to-pos': [{ 'mask-radial-to': V() }],
				'mask-image-radial-from-color': [{ 'mask-radial-from': s() }],
				'mask-image-radial-to-color': [{ 'mask-radial-to': s() }],
				'mask-image-radial-shape': [{ 'mask-radial': ['circle', 'ellipse'] }],
				'mask-image-radial-size': [
					{
						'mask-radial': [
							{ closest: ['side', 'corner'], farthest: ['side', 'corner'] }
						]
					}
				],
				'mask-image-radial-pos': [{ 'mask-radial-at': G() }],
				'mask-image-conic-pos': [{ 'mask-conic': [m] }],
				'mask-image-conic-from-pos': [{ 'mask-conic-from': V() }],
				'mask-image-conic-to-pos': [{ 'mask-conic-to': V() }],
				'mask-image-conic-from-color': [{ 'mask-conic-from': s() }],
				'mask-image-conic-to-color': [{ 'mask-conic-to': s() }],
				'mask-mode': [{ mask: ['alpha', 'luminance', 'match'] }],
				'mask-origin': [
					{ 'mask-origin': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] }
				],
				'mask-position': [{ mask: R() }],
				'mask-repeat': [{ mask: S() }],
				'mask-size': [{ mask: M() }],
				'mask-type': [{ 'mask-type': ['alpha', 'luminance'] }],
				'mask-image': [{ mask: ['none', i, a] }],
				filter: [{ filter: ['', 'none', i, a] }],
				blur: [{ blur: Re() }],
				brightness: [{ brightness: [m, i, a] }],
				contrast: [{ contrast: [m, i, a] }],
				'drop-shadow': [{ 'drop-shadow': ['', 'none', E, te, re] }],
				'drop-shadow-color': [{ 'drop-shadow': s() }],
				grayscale: [{ grayscale: ['', m, i, a] }],
				'hue-rotate': [{ 'hue-rotate': [m, i, a] }],
				invert: [{ invert: ['', m, i, a] }],
				saturate: [{ saturate: [m, i, a] }],
				sepia: [{ sepia: ['', m, i, a] }],
				'backdrop-filter': [{ 'backdrop-filter': ['', 'none', i, a] }],
				'backdrop-blur': [{ 'backdrop-blur': Re() }],
				'backdrop-brightness': [{ 'backdrop-brightness': [m, i, a] }],
				'backdrop-contrast': [{ 'backdrop-contrast': [m, i, a] }],
				'backdrop-grayscale': [{ 'backdrop-grayscale': ['', m, i, a] }],
				'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [m, i, a] }],
				'backdrop-invert': [{ 'backdrop-invert': ['', m, i, a] }],
				'backdrop-opacity': [{ 'backdrop-opacity': [m, i, a] }],
				'backdrop-saturate': [{ 'backdrop-saturate': [m, i, a] }],
				'backdrop-sepia': [{ 'backdrop-sepia': ['', m, i, a] }],
				'border-collapse': [{ border: ['collapse', 'separate'] }],
				'border-spacing': [{ 'border-spacing': u() }],
				'border-spacing-x': [{ 'border-spacing-x': u() }],
				'border-spacing-y': [{ 'border-spacing-y': u() }],
				'table-layout': [{ table: ['auto', 'fixed'] }],
				caption: [{ caption: ['top', 'bottom'] }],
				transition: [
					{
						transition: [
							'',
							'all',
							'colors',
							'opacity',
							'shadow',
							'transform',
							'none',
							i,
							a
						]
					}
				],
				'transition-behavior': [{ transition: ['normal', 'discrete'] }],
				duration: [{ duration: [m, 'initial', i, a] }],
				ease: [{ ease: ['linear', 'initial', L, i, a] }],
				delay: [{ delay: [m, i, a] }],
				animate: [{ animate: ['none', I, i, a] }],
				backface: [{ backface: ['hidden', 'visible'] }],
				perspective: [{ perspective: [C, i, a] }],
				'perspective-origin': [{ 'perspective-origin': q() }],
				rotate: [{ rotate: ie() }],
				'rotate-x': [{ 'rotate-x': ie() }],
				'rotate-y': [{ 'rotate-y': ie() }],
				'rotate-z': [{ 'rotate-z': ie() }],
				scale: [{ scale: le() }],
				'scale-x': [{ 'scale-x': le() }],
				'scale-y': [{ 'scale-y': le() }],
				'scale-z': [{ 'scale-z': le() }],
				'scale-3d': ['scale-3d'],
				skew: [{ skew: ve() }],
				'skew-x': [{ 'skew-x': ve() }],
				'skew-y': [{ 'skew-y': ve() }],
				transform: [{ transform: [i, a, '', 'none', 'gpu', 'cpu'] }],
				'transform-origin': [{ origin: q() }],
				'transform-style': [{ transform: ['3d', 'flat'] }],
				translate: [{ translate: ce() }],
				'translate-x': [{ 'translate-x': ce() }],
				'translate-y': [{ 'translate-y': ce() }],
				'translate-z': [{ 'translate-z': ce() }],
				'translate-none': ['translate-none'],
				accent: [{ accent: s() }],
				appearance: [{ appearance: ['none', 'auto'] }],
				'caret-color': [{ caret: s() }],
				'color-scheme': [
					{ scheme: ['normal', 'dark', 'light', 'light-dark', 'only-dark', 'only-light'] }
				],
				cursor: [
					{
						cursor: [
							'auto',
							'default',
							'pointer',
							'wait',
							'text',
							'move',
							'help',
							'not-allowed',
							'none',
							'context-menu',
							'progress',
							'cell',
							'crosshair',
							'vertical-text',
							'alias',
							'copy',
							'no-drop',
							'grab',
							'grabbing',
							'all-scroll',
							'col-resize',
							'row-resize',
							'n-resize',
							'e-resize',
							's-resize',
							'w-resize',
							'ne-resize',
							'nw-resize',
							'se-resize',
							'sw-resize',
							'ew-resize',
							'ns-resize',
							'nesw-resize',
							'nwse-resize',
							'zoom-in',
							'zoom-out',
							i,
							a
						]
					}
				],
				'field-sizing': [{ 'field-sizing': ['fixed', 'content'] }],
				'pointer-events': [{ 'pointer-events': ['auto', 'none'] }],
				resize: [{ resize: ['none', '', 'y', 'x'] }],
				'scroll-behavior': [{ scroll: ['auto', 'smooth'] }],
				'scroll-m': [{ 'scroll-m': u() }],
				'scroll-mx': [{ 'scroll-mx': u() }],
				'scroll-my': [{ 'scroll-my': u() }],
				'scroll-ms': [{ 'scroll-ms': u() }],
				'scroll-me': [{ 'scroll-me': u() }],
				'scroll-mt': [{ 'scroll-mt': u() }],
				'scroll-mr': [{ 'scroll-mr': u() }],
				'scroll-mb': [{ 'scroll-mb': u() }],
				'scroll-ml': [{ 'scroll-ml': u() }],
				'scroll-p': [{ 'scroll-p': u() }],
				'scroll-px': [{ 'scroll-px': u() }],
				'scroll-py': [{ 'scroll-py': u() }],
				'scroll-ps': [{ 'scroll-ps': u() }],
				'scroll-pe': [{ 'scroll-pe': u() }],
				'scroll-pt': [{ 'scroll-pt': u() }],
				'scroll-pr': [{ 'scroll-pr': u() }],
				'scroll-pb': [{ 'scroll-pb': u() }],
				'scroll-pl': [{ 'scroll-pl': u() }],
				'snap-align': [{ snap: ['start', 'end', 'center', 'align-none'] }],
				'snap-stop': [{ snap: ['normal', 'always'] }],
				'snap-type': [{ snap: ['none', 'x', 'y', 'both'] }],
				'snap-strictness': [{ snap: ['mandatory', 'proximity'] }],
				touch: [{ touch: ['auto', 'none', 'manipulation'] }],
				'touch-x': [{ 'touch-pan': ['x', 'left', 'right'] }],
				'touch-y': [{ 'touch-pan': ['y', 'up', 'down'] }],
				'touch-pz': ['touch-pinch-zoom'],
				select: [{ select: ['none', 'text', 'all', 'auto'] }],
				'will-change': [
					{ 'will-change': ['auto', 'scroll', 'contents', 'transform', i, a] }
				],
				fill: [{ fill: ['none', ...s()] }],
				'stroke-w': [{ stroke: [m, Y, H, ge] }],
				stroke: [{ stroke: ['none', ...s()] }],
				'forced-color-adjust': [{ 'forced-color-adjust': ['auto', 'none'] }]
			},
			conflictingClassGroups: {
				overflow: ['overflow-x', 'overflow-y'],
				overscroll: ['overscroll-x', 'overscroll-y'],
				inset: ['inset-x', 'inset-y', 'start', 'end', 'top', 'right', 'bottom', 'left'],
				'inset-x': ['right', 'left'],
				'inset-y': ['top', 'bottom'],
				flex: ['basis', 'grow', 'shrink'],
				gap: ['gap-x', 'gap-y'],
				p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
				px: ['pr', 'pl'],
				py: ['pt', 'pb'],
				m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
				mx: ['mr', 'ml'],
				my: ['mt', 'mb'],
				size: ['w', 'h'],
				'font-size': ['leading'],
				'fvn-normal': [
					'fvn-ordinal',
					'fvn-slashed-zero',
					'fvn-figure',
					'fvn-spacing',
					'fvn-fraction'
				],
				'fvn-ordinal': ['fvn-normal'],
				'fvn-slashed-zero': ['fvn-normal'],
				'fvn-figure': ['fvn-normal'],
				'fvn-spacing': ['fvn-normal'],
				'fvn-fraction': ['fvn-normal'],
				'line-clamp': ['display', 'overflow'],
				rounded: [
					'rounded-s',
					'rounded-e',
					'rounded-t',
					'rounded-r',
					'rounded-b',
					'rounded-l',
					'rounded-ss',
					'rounded-se',
					'rounded-ee',
					'rounded-es',
					'rounded-tl',
					'rounded-tr',
					'rounded-br',
					'rounded-bl'
				],
				'rounded-s': ['rounded-ss', 'rounded-es'],
				'rounded-e': ['rounded-se', 'rounded-ee'],
				'rounded-t': ['rounded-tl', 'rounded-tr'],
				'rounded-r': ['rounded-tr', 'rounded-br'],
				'rounded-b': ['rounded-br', 'rounded-bl'],
				'rounded-l': ['rounded-tl', 'rounded-bl'],
				'border-spacing': ['border-spacing-x', 'border-spacing-y'],
				'border-w': [
					'border-w-x',
					'border-w-y',
					'border-w-s',
					'border-w-e',
					'border-w-t',
					'border-w-r',
					'border-w-b',
					'border-w-l'
				],
				'border-w-x': ['border-w-r', 'border-w-l'],
				'border-w-y': ['border-w-t', 'border-w-b'],
				'border-color': [
					'border-color-x',
					'border-color-y',
					'border-color-s',
					'border-color-e',
					'border-color-t',
					'border-color-r',
					'border-color-b',
					'border-color-l'
				],
				'border-color-x': ['border-color-r', 'border-color-l'],
				'border-color-y': ['border-color-t', 'border-color-b'],
				translate: ['translate-x', 'translate-y', 'translate-none'],
				'translate-none': ['translate', 'translate-x', 'translate-y', 'translate-z'],
				'scroll-m': [
					'scroll-mx',
					'scroll-my',
					'scroll-ms',
					'scroll-me',
					'scroll-mt',
					'scroll-mr',
					'scroll-mb',
					'scroll-ml'
				],
				'scroll-mx': ['scroll-mr', 'scroll-ml'],
				'scroll-my': ['scroll-mt', 'scroll-mb'],
				'scroll-p': [
					'scroll-px',
					'scroll-py',
					'scroll-ps',
					'scroll-pe',
					'scroll-pt',
					'scroll-pr',
					'scroll-pb',
					'scroll-pl'
				],
				'scroll-px': ['scroll-pr', 'scroll-pl'],
				'scroll-py': ['scroll-pt', 'scroll-pb'],
				touch: ['touch-x', 'touch-y', 'touch-pz'],
				'touch-x': ['touch'],
				'touch-y': ['touch'],
				'touch-pz': ['touch']
			},
			conflictingClassGroupModifiers: { 'font-size': ['leading'] },
			orderSensitiveModifiers: [
				'*',
				'**',
				'after',
				'backdrop',
				'before',
				'details-content',
				'file',
				'first-letter',
				'first-line',
				'marker',
				'placeholder',
				'selection'
			]
		};
	},
	lr = (
		e,
		{ cacheSize: t, prefix: r, experimentalParseClassName: o, extend: l = {}, override: n = {} }
	) => (
		oe(e, 'cacheSize', t),
		oe(e, 'prefix', r),
		oe(e, 'experimentalParseClassName', o),
		ue(e.theme, n.theme),
		ue(e.classGroups, n.classGroups),
		ue(e.conflictingClassGroups, n.conflictingClassGroups),
		ue(e.conflictingClassGroupModifiers, n.conflictingClassGroupModifiers),
		oe(e, 'orderSensitiveModifiers', n.orderSensitiveModifiers),
		fe(e.theme, l.theme),
		fe(e.classGroups, l.classGroups),
		fe(e.conflictingClassGroups, l.conflictingClassGroups),
		fe(e.conflictingClassGroupModifiers, l.conflictingClassGroupModifiers),
		cr(e, l, 'orderSensitiveModifiers'),
		e
	),
	oe = (e, t, r) => {
		r !== void 0 && (e[t] = r);
	},
	ue = (e, t) => {
		if (t) for (const r in t) oe(e, r, t[r]);
	},
	fe = (e, t) => {
		if (t) for (const r in t) cr(e, t, r);
	},
	cr = (e, t, r) => {
		const o = t[r];
		o !== void 0 && (e[r] = e[r] ? e[r].concat(o) : o);
	},
	ot = (e, ...t) => (typeof e == 'function' ? he(ye, e, ...t) : he(() => lr(ye(), e), ...t)),
	dr = he(ye),
	st = Object.freeze(
		Object.defineProperty(
			{
				__proto__: null,
				createTailwindMerge: he,
				extendTailwindMerge: ot,
				fromTheme: P,
				getDefaultConfig: ye,
				mergeConfigs: lr,
				twJoin: De,
				twMerge: dr,
				validators: tt
			},
			Symbol.toStringTag,
			{ value: 'Module' }
		)
	);
function nt(...e) {
	return dr(ur(e));
}
const at = Vr({
	base: "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md text-sm font-medium whitespace-nowrap outline-hidden transition-all select-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	variants: {
		variant: {
			default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs',
			destructive:
				'bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 text-white shadow-2xs',
			outline:
				'bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 border shadow-2xs',
			secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-2xs',
			ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
			link: 'text-primary underline-offset-4 hover:underline'
		},
		size: {
			default: 'h-9 px-4 py-2 has-[>svg]:px-3',
			sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
			lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
			icon: 'size-9'
		}
	},
	defaultVariants: { variant: 'default', size: 'default' }
});
var it = Oe(
		'<div class="absolute flex size-full place-items-center justify-center bg-inherit"><div class="flex animate-spin place-items-center justify-center"><!></div></div> <span class="sr-only">Loading</span>',
		1
	),
	lt = Oe('<!> <!>', 1);
function ut(e, t) {
	fr(t, !0);
	let r = X(t, 'ref', 15, null),
		o = X(t, 'variant', 3, 'default'),
		l = X(t, 'size', 3, 'default'),
		n = X(t, 'href', 3, void 0),
		d = X(t, 'type', 3, 'button'),
		v = X(t, 'loading', 7, !1),
		c = X(t, 'disabled', 3, !1),
		z = X(t, 'tabindex', 3, 0),
		x = yr(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'variant',
			'size',
			'href',
			'type',
			'loading',
			'disabled',
			'tabindex',
			'onclick',
			'onClickPromise',
			'class',
			'children'
		]);
	var T = pr(),
		N = xe(T);
	(mr(
		N,
		() => (n() ? 'a' : 'button'),
		!1,
		(E, A) => {
			br(
				E,
				(G) => r(G),
				() => r()
			);
			var C = async (G) => {
				(t.onclick?.(G),
					d() !== void 0 &&
						t.onClickPromise &&
						(v(!0), await t.onClickPromise(G), v(!1)));
			};
			hr(
				E,
				(G) => ({
					...x,
					'data-slot': 'button',
					type: n() ? void 0 : d(),
					href: n() && !c() ? n() : void 0,
					disabled: n() ? void 0 : c() || v(),
					'aria-disabled': n() ? c() : void 0,
					role: n() && c() ? 'link' : void 0,
					tabindex: n() && c() ? -1 : z(),
					class: G,
					onclick: C
				}),
				[() => nt(at({ variant: o(), size: l() }), t.class)]
			);
			var _ = lt(),
				L = xe(_);
			{
				var I = (G) => {
					var q = it(),
						O = xe(q),
						W = Ve(O),
						u = Ve(W);
					(zr(u, { class: 'size-4' }), Ie(W), Ie(O), Mr(2), we(G, q));
				};
				vr(L, (G) => {
					d() !== void 0 && v() && G(I);
				});
			}
			var D = xr(L, 2);
			(wr(D, () => t.children ?? kr), we(A, _));
		}
	),
		we(e, T),
		gr());
}
export { ut as B, nt as c, Vr as r, dr as t };
