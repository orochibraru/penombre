import './1HBmZ_db.js';
import {
	p as Xe,
	o as Ye,
	q as Ze,
	a as ce,
	b as $e,
	f as Ne,
	c as we,
	af as xe,
	r as ke,
	G as er
} from './BW6z9EX9.js';
import { s as ze } from './BC_1JO3s.js';
import { i as Ae } from './ClaijROu.js';
import { a as Me } from './BPMCz5tT.js';
import { b as Ce } from './Bo6bj8hH.js';
import { p as X, r as rr } from './Cic-IlSQ.js';
import { c as Se } from './Bvsacp8G.js';
import { L as tr } from './ByM4i_p0.js';
var Ge = (e) => (typeof e == 'boolean' ? `${e}` : e === 0 ? '0' : e),
	j = (e) => !e || typeof e != 'object' || Object.keys(e).length === 0,
	or = (e, t) => JSON.stringify(e) === JSON.stringify(t);
function _e(e, t) {
	e.forEach(function (r) {
		Array.isArray(r) ? _e(r, t) : t.push(r);
	});
}
function Ee(e) {
	let t = [];
	return (_e(e, t), t);
}
var Le = (...e) => Ee(e).filter(Boolean),
	Oe = (e, t) => {
		let r = {},
			o = Object.keys(e),
			a = Object.keys(t);
		for (let i of o)
			if (a.includes(i)) {
				let l = e[i],
					m = t[i];
				Array.isArray(l) || Array.isArray(m)
					? (r[i] = Le(m, l))
					: typeof l == 'object' && typeof m == 'object'
						? (r[i] = Oe(l, m))
						: (r[i] = m + ' ' + l);
			} else r[i] = e[i];
		for (let i of a) o.includes(i) || (r[i] = t[i]);
		return r;
	},
	Pe = (e) => (!e || typeof e != 'string' ? e : e.replace(/\s+/g, ' ').trim());
const ye = '-',
	nr = (e) => {
		const t = ir(e),
			{ conflictingClassGroups: r, conflictingClassGroupModifiers: o } = e;
		return {
			getClassGroupId: (l) => {
				const m = l.split(ye);
				return (m[0] === '' && m.length !== 1 && m.shift(), Be(m, t) || sr(l));
			},
			getConflictingClassGroupIds: (l, m) => {
				const d = r[l] || [];
				return m && o[l] ? [...d, ...o[l]] : d;
			}
		};
	},
	Be = (e, t) => {
		if (e.length === 0) return t.classGroupId;
		const r = e[0],
			o = t.nextPart.get(r),
			a = o ? Be(e.slice(1), o) : void 0;
		if (a) return a;
		if (t.validators.length === 0) return;
		const i = e.join(ye);
		return t.validators.find(({ validator: l }) => l(i))?.classGroupId;
	},
	Re = /^\[(.+)\]$/,
	sr = (e) => {
		if (Re.test(e)) {
			const t = Re.exec(e)[1],
				r = t?.substring(0, t.indexOf(':'));
			if (r) return 'arbitrary..' + r;
		}
	},
	ir = (e) => {
		const { theme: t, classGroups: r } = e,
			o = { nextPart: new Map(), validators: [] };
		for (const a in r) pe(r[a], o, a, t);
		return o;
	},
	pe = (e, t, r, o) => {
		e.forEach((a) => {
			if (typeof a == 'string') {
				const i = a === '' ? t : Ie(t, a);
				i.classGroupId = r;
				return;
			}
			if (typeof a == 'function') {
				if (ar(a)) {
					pe(a(o), t, r, o);
					return;
				}
				t.validators.push({ validator: a, classGroupId: r });
				return;
			}
			Object.entries(a).forEach(([i, l]) => {
				pe(l, Ie(t, i), r, o);
			});
		});
	},
	Ie = (e, t) => {
		let r = e;
		return (
			t.split(ye).forEach((o) => {
				(r.nextPart.has(o) || r.nextPart.set(o, { nextPart: new Map(), validators: [] }),
					(r = r.nextPart.get(o)));
			}),
			r
		);
	},
	ar = (e) => e.isThemeGetter,
	lr = (e) => {
		if (e < 1) return { get: () => {}, set: () => {} };
		let t = 0,
			r = new Map(),
			o = new Map();
		const a = (i, l) => {
			(r.set(i, l), t++, t > e && ((t = 0), (o = r), (r = new Map())));
		};
		return {
			get(i) {
				let l = r.get(i);
				if (l !== void 0) return l;
				if ((l = o.get(i)) !== void 0) return (a(i, l), l);
			},
			set(i, l) {
				r.has(i) ? r.set(i, l) : a(i, l);
			}
		};
	},
	fe = '!',
	be = ':',
	cr = be.length,
	dr = (e) => {
		const { prefix: t, experimentalParseClassName: r } = e;
		let o = (a) => {
			const i = [];
			let l = 0,
				m = 0,
				d = 0,
				M;
			for (let x = 0; x < a.length; x++) {
				let A = a[x];
				if (l === 0 && m === 0) {
					if (A === be) {
						(i.push(a.slice(d, x)), (d = x + cr));
						continue;
					}
					if (A === '/') {
						M = x;
						continue;
					}
				}
				A === '[' ? l++ : A === ']' ? l-- : A === '(' ? m++ : A === ')' && m--;
			}
			const w = i.length === 0 ? a : a.substring(d),
				R = ur(w),
				T = R !== w,
				P = M && M > d ? M - d : void 0;
			return {
				modifiers: i,
				hasImportantModifier: T,
				baseClassName: R,
				maybePostfixModifierPosition: P
			};
		};
		if (t) {
			const a = t + be,
				i = o;
			o = (l) =>
				l.startsWith(a)
					? i(l.substring(a.length))
					: {
							isExternal: !0,
							modifiers: [],
							hasImportantModifier: !1,
							baseClassName: l,
							maybePostfixModifierPosition: void 0
						};
		}
		if (r) {
			const a = o;
			o = (i) => r({ className: i, parseClassName: a });
		}
		return o;
	},
	ur = (e) =>
		e.endsWith(fe) ? e.substring(0, e.length - 1) : e.startsWith(fe) ? e.substring(1) : e,
	pr = (e) => {
		const t = Object.fromEntries(e.orderSensitiveModifiers.map((o) => [o, !0]));
		return (o) => {
			if (o.length <= 1) return o;
			const a = [];
			let i = [];
			return (
				o.forEach((l) => {
					l[0] === '[' || t[l] ? (a.push(...i.sort(), l), (i = [])) : i.push(l);
				}),
				a.push(...i.sort()),
				a
			);
		};
	},
	fr = (e) => ({ cache: lr(e.cacheSize), parseClassName: dr(e), sortModifiers: pr(e), ...nr(e) }),
	br = /\s+/,
	gr = (e, t) => {
		const {
				parseClassName: r,
				getClassGroupId: o,
				getConflictingClassGroupIds: a,
				sortModifiers: i
			} = t,
			l = [],
			m = e.trim().split(br);
		let d = '';
		for (let M = m.length - 1; M >= 0; M -= 1) {
			const w = m[M],
				{
					isExternal: R,
					modifiers: T,
					hasImportantModifier: P,
					baseClassName: x,
					maybePostfixModifierPosition: A
				} = r(w);
			if (R) {
				d = w + (d.length > 0 ? ' ' + d : d);
				continue;
			}
			let C = !!A,
				N = o(C ? x.substring(0, A) : x);
			if (!N) {
				if (!C) {
					d = w + (d.length > 0 ? ' ' + d : d);
					continue;
				}
				if (((N = o(x)), !N)) {
					d = w + (d.length > 0 ? ' ' + d : d);
					continue;
				}
				C = !1;
			}
			const k = i(T).join(':'),
				U = P ? k + fe : k,
				_ = U + N;
			if (l.includes(_)) continue;
			l.push(_);
			const O = a(N, C);
			for (let u = 0; u < O.length; ++u) {
				const V = O[u];
				l.push(U + V);
			}
			d = w + (d.length > 0 ? ' ' + d : d);
		}
		return d;
	};
function mr() {
	let e = 0,
		t,
		r,
		o = '';
	for (; e < arguments.length; ) (t = arguments[e++]) && (r = Fe(t)) && (o && (o += ' '), (o += r));
	return o;
}
const Fe = (e) => {
	if (typeof e == 'string') return e;
	let t,
		r = '';
	for (let o = 0; o < e.length; o++) e[o] && (t = Fe(e[o])) && (r && (r += ' '), (r += t));
	return r;
};
function ge(e, ...t) {
	let r,
		o,
		a,
		i = l;
	function l(d) {
		const M = t.reduce((w, R) => R(w), e());
		return ((r = fr(M)), (o = r.cache.get), (a = r.cache.set), (i = m), m(d));
	}
	function m(d) {
		const M = o(d);
		if (M) return M;
		const w = gr(d, r);
		return (a(d, w), w);
	}
	return function () {
		return i(mr.apply(null, arguments));
	};
}
const G = (e) => {
		const t = (r) => r[e] || [];
		return ((t.isThemeGetter = !0), t);
	},
	We = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
	Ue = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
	hr = /^\d+\/\d+$/,
	yr = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
	vr =
		/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
	wr = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
	xr = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
	kr =
		/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
	Y = (e) => hr.test(e),
	h = (e) => !!e && !Number.isNaN(Number(e)),
	J = (e) => !!e && Number.isInteger(Number(e)),
	Ve = (e) => e.endsWith('%') && h(e.slice(0, -1)),
	W = (e) => yr.test(e),
	zr = () => !0,
	Ar = (e) => vr.test(e) && !wr.test(e),
	ve = () => !1,
	Mr = (e) => xr.test(e),
	Cr = (e) => kr.test(e),
	Sr = (e) => !n(e) && !s(e),
	Gr = (e) => Z(e, He, ve),
	n = (e) => We.test(e),
	H = (e) => Z(e, Ke, Ar),
	de = (e) => Z(e, Or, h),
	Pr = (e) => Z(e, qe, ve),
	Rr = (e) => Z(e, Je, Cr),
	Ir = (e) => Z(e, ve, Mr),
	s = (e) => Ue.test(e),
	ie = (e) => $(e, Ke),
	Vr = (e) => $(e, Br),
	jr = (e) => $(e, qe),
	Tr = (e) => $(e, He),
	Nr = (e) => $(e, Je),
	_r = (e) => $(e, Fr, !0),
	Z = (e, t, r) => {
		const o = We.exec(e);
		return o ? (o[1] ? t(o[1]) : r(o[2])) : !1;
	},
	$ = (e, t, r = !1) => {
		const o = Ue.exec(e);
		return o ? (o[1] ? t(o[1]) : r) : !1;
	},
	qe = (e) => e === 'position',
	Er = new Set(['image', 'url']),
	Je = (e) => Er.has(e),
	Lr = new Set(['length', 'size', 'percentage']),
	He = (e) => Lr.has(e),
	Ke = (e) => e === 'length',
	Or = (e) => e === 'number',
	Br = (e) => e === 'family-name',
	Fr = (e) => e === 'shadow',
	me = () => {
		const e = G('color'),
			t = G('font'),
			r = G('text'),
			o = G('font-weight'),
			a = G('tracking'),
			i = G('leading'),
			l = G('breakpoint'),
			m = G('container'),
			d = G('spacing'),
			M = G('radius'),
			w = G('shadow'),
			R = G('inset-shadow'),
			T = G('drop-shadow'),
			P = G('blur'),
			x = G('perspective'),
			A = G('aspect'),
			C = G('ease'),
			N = G('animate'),
			k = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'],
			U = () => [
				'bottom',
				'center',
				'left',
				'left-bottom',
				'left-top',
				'right',
				'right-bottom',
				'right-top',
				'top'
			],
			_ = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
			O = () => ['auto', 'contain', 'none'],
			u = () => [s, n, d],
			V = () => [Y, 'full', 'auto', ...u()],
			ee = () => [J, 'none', 'subgrid', s, n],
			re = () => ['auto', { span: ['full', J, s, n] }, s, n],
			K = () => [J, 'auto', s, n],
			se = () => ['auto', 'min', 'max', 'fr', s, n],
			g = () => ['start', 'end', 'center', 'between', 'around', 'evenly', 'stretch', 'baseline'],
			f = () => ['start', 'end', 'center', 'stretch'],
			p = () => ['auto', ...u()],
			y = () => [
				Y,
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
			c = () => [e, s, n],
			z = () => [Ve, H],
			b = () => ['', 'none', 'full', M, s, n],
			v = () => ['', h, ie, H],
			S = () => ['solid', 'dashed', 'dotted', 'double'],
			E = () => [
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
			I = () => ['', 'none', P, s, n],
			q = () => [
				'center',
				'top',
				'top-right',
				'right',
				'bottom-right',
				'bottom',
				'bottom-left',
				'left',
				'top-left',
				s,
				n
			],
			B = () => ['none', h, s, n],
			F = () => ['none', h, s, n],
			D = () => [h, s, n],
			Q = () => [Y, 'full', ...u()];
		return {
			cacheSize: 500,
			theme: {
				animate: ['spin', 'ping', 'pulse', 'bounce'],
				aspect: ['video'],
				blur: [W],
				breakpoint: [W],
				color: [zr],
				container: [W],
				'drop-shadow': [W],
				ease: ['in', 'out', 'in-out'],
				font: [Sr],
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
				'inset-shadow': [W],
				leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
				perspective: ['dramatic', 'near', 'normal', 'midrange', 'distant', 'none'],
				radius: [W],
				shadow: [W],
				spacing: ['px', h],
				text: [W],
				tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']
			},
			classGroups: {
				aspect: [{ aspect: ['auto', 'square', Y, n, s, A] }],
				container: ['container'],
				columns: [{ columns: [h, n, s, m] }],
				'break-after': [{ 'break-after': k() }],
				'break-before': [{ 'break-before': k() }],
				'break-inside': [{ 'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'] }],
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
				'object-position': [{ object: [...U(), n, s] }],
				overflow: [{ overflow: _() }],
				'overflow-x': [{ 'overflow-x': _() }],
				'overflow-y': [{ 'overflow-y': _() }],
				overscroll: [{ overscroll: O() }],
				'overscroll-x': [{ 'overscroll-x': O() }],
				'overscroll-y': [{ 'overscroll-y': O() }],
				position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
				inset: [{ inset: V() }],
				'inset-x': [{ 'inset-x': V() }],
				'inset-y': [{ 'inset-y': V() }],
				start: [{ start: V() }],
				end: [{ end: V() }],
				top: [{ top: V() }],
				right: [{ right: V() }],
				bottom: [{ bottom: V() }],
				left: [{ left: V() }],
				visibility: ['visible', 'invisible', 'collapse'],
				z: [{ z: [J, 'auto', s, n] }],
				basis: [{ basis: [Y, 'full', 'auto', m, ...u()] }],
				'flex-direction': [{ flex: ['row', 'row-reverse', 'col', 'col-reverse'] }],
				'flex-wrap': [{ flex: ['nowrap', 'wrap', 'wrap-reverse'] }],
				flex: [{ flex: [h, Y, 'auto', 'initial', 'none', n] }],
				grow: [{ grow: ['', h, s, n] }],
				shrink: [{ shrink: ['', h, s, n] }],
				order: [{ order: [J, 'first', 'last', 'none', s, n] }],
				'grid-cols': [{ 'grid-cols': ee() }],
				'col-start-end': [{ col: re() }],
				'col-start': [{ 'col-start': K() }],
				'col-end': [{ 'col-end': K() }],
				'grid-rows': [{ 'grid-rows': ee() }],
				'row-start-end': [{ row: re() }],
				'row-start': [{ 'row-start': K() }],
				'row-end': [{ 'row-end': K() }],
				'grid-flow': [{ 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] }],
				'auto-cols': [{ 'auto-cols': se() }],
				'auto-rows': [{ 'auto-rows': se() }],
				gap: [{ gap: u() }],
				'gap-x': [{ 'gap-x': u() }],
				'gap-y': [{ 'gap-y': u() }],
				'justify-content': [{ justify: [...g(), 'normal'] }],
				'justify-items': [{ 'justify-items': [...f(), 'normal'] }],
				'justify-self': [{ 'justify-self': ['auto', ...f()] }],
				'align-content': [{ content: ['normal', ...g()] }],
				'align-items': [{ items: [...f(), 'baseline'] }],
				'align-self': [{ self: ['auto', ...f(), 'baseline'] }],
				'place-content': [{ 'place-content': g() }],
				'place-items': [{ 'place-items': [...f(), 'baseline'] }],
				'place-self': [{ 'place-self': ['auto', ...f()] }],
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
				size: [{ size: y() }],
				w: [{ w: [m, 'screen', ...y()] }],
				'min-w': [{ 'min-w': [m, 'screen', 'none', ...y()] }],
				'max-w': [{ 'max-w': [m, 'screen', 'none', 'prose', { screen: [l] }, ...y()] }],
				h: [{ h: ['screen', ...y()] }],
				'min-h': [{ 'min-h': ['screen', 'none', ...y()] }],
				'max-h': [{ 'max-h': ['screen', ...y()] }],
				'font-size': [{ text: ['base', r, ie, H] }],
				'font-smoothing': ['antialiased', 'subpixel-antialiased'],
				'font-style': ['italic', 'not-italic'],
				'font-weight': [{ font: [o, s, de] }],
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
							Ve,
							n
						]
					}
				],
				'font-family': [{ font: [Vr, n, t] }],
				'fvn-normal': ['normal-nums'],
				'fvn-ordinal': ['ordinal'],
				'fvn-slashed-zero': ['slashed-zero'],
				'fvn-figure': ['lining-nums', 'oldstyle-nums'],
				'fvn-spacing': ['proportional-nums', 'tabular-nums'],
				'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
				tracking: [{ tracking: [a, s, n] }],
				'line-clamp': [{ 'line-clamp': [h, 'none', s, de] }],
				leading: [{ leading: [i, ...u()] }],
				'list-image': [{ 'list-image': ['none', s, n] }],
				'list-style-position': [{ list: ['inside', 'outside'] }],
				'list-style-type': [{ list: ['disc', 'decimal', 'none', s, n] }],
				'text-alignment': [{ text: ['left', 'center', 'right', 'justify', 'start', 'end'] }],
				'placeholder-color': [{ placeholder: c() }],
				'text-color': [{ text: c() }],
				'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
				'text-decoration-style': [{ decoration: [...S(), 'wavy'] }],
				'text-decoration-thickness': [{ decoration: [h, 'from-font', 'auto', s, H] }],
				'text-decoration-color': [{ decoration: c() }],
				'underline-offset': [{ 'underline-offset': [h, 'auto', s, n] }],
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
							s,
							n
						]
					}
				],
				whitespace: [
					{ whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] }
				],
				break: [{ break: ['normal', 'words', 'all', 'keep'] }],
				hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
				content: [{ content: ['none', s, n] }],
				'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
				'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
				'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
				'bg-position': [{ bg: [...U(), jr, Pr] }],
				'bg-repeat': [{ bg: ['no-repeat', { repeat: ['', 'x', 'y', 'space', 'round'] }] }],
				'bg-size': [{ bg: ['auto', 'cover', 'contain', Tr, Gr] }],
				'bg-image': [
					{
						bg: [
							'none',
							{
								linear: [{ to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] }, J, s, n],
								radial: ['', s, n],
								conic: [J, s, n]
							},
							Nr,
							Rr
						]
					}
				],
				'bg-color': [{ bg: c() }],
				'gradient-from-pos': [{ from: z() }],
				'gradient-via-pos': [{ via: z() }],
				'gradient-to-pos': [{ to: z() }],
				'gradient-from': [{ from: c() }],
				'gradient-via': [{ via: c() }],
				'gradient-to': [{ to: c() }],
				rounded: [{ rounded: b() }],
				'rounded-s': [{ 'rounded-s': b() }],
				'rounded-e': [{ 'rounded-e': b() }],
				'rounded-t': [{ 'rounded-t': b() }],
				'rounded-r': [{ 'rounded-r': b() }],
				'rounded-b': [{ 'rounded-b': b() }],
				'rounded-l': [{ 'rounded-l': b() }],
				'rounded-ss': [{ 'rounded-ss': b() }],
				'rounded-se': [{ 'rounded-se': b() }],
				'rounded-ee': [{ 'rounded-ee': b() }],
				'rounded-es': [{ 'rounded-es': b() }],
				'rounded-tl': [{ 'rounded-tl': b() }],
				'rounded-tr': [{ 'rounded-tr': b() }],
				'rounded-br': [{ 'rounded-br': b() }],
				'rounded-bl': [{ 'rounded-bl': b() }],
				'border-w': [{ border: v() }],
				'border-w-x': [{ 'border-x': v() }],
				'border-w-y': [{ 'border-y': v() }],
				'border-w-s': [{ 'border-s': v() }],
				'border-w-e': [{ 'border-e': v() }],
				'border-w-t': [{ 'border-t': v() }],
				'border-w-r': [{ 'border-r': v() }],
				'border-w-b': [{ 'border-b': v() }],
				'border-w-l': [{ 'border-l': v() }],
				'divide-x': [{ 'divide-x': v() }],
				'divide-x-reverse': ['divide-x-reverse'],
				'divide-y': [{ 'divide-y': v() }],
				'divide-y-reverse': ['divide-y-reverse'],
				'border-style': [{ border: [...S(), 'hidden', 'none'] }],
				'divide-style': [{ divide: [...S(), 'hidden', 'none'] }],
				'border-color': [{ border: c() }],
				'border-color-x': [{ 'border-x': c() }],
				'border-color-y': [{ 'border-y': c() }],
				'border-color-s': [{ 'border-s': c() }],
				'border-color-e': [{ 'border-e': c() }],
				'border-color-t': [{ 'border-t': c() }],
				'border-color-r': [{ 'border-r': c() }],
				'border-color-b': [{ 'border-b': c() }],
				'border-color-l': [{ 'border-l': c() }],
				'divide-color': [{ divide: c() }],
				'outline-style': [{ outline: [...S(), 'none', 'hidden'] }],
				'outline-offset': [{ 'outline-offset': [h, s, n] }],
				'outline-w': [{ outline: ['', h, ie, H] }],
				'outline-color': [{ outline: [e] }],
				shadow: [{ shadow: ['', 'none', w, _r, Ir] }],
				'shadow-color': [{ shadow: c() }],
				'inset-shadow': [{ 'inset-shadow': ['none', s, n, R] }],
				'inset-shadow-color': [{ 'inset-shadow': c() }],
				'ring-w': [{ ring: v() }],
				'ring-w-inset': ['ring-inset'],
				'ring-color': [{ ring: c() }],
				'ring-offset-w': [{ 'ring-offset': [h, H] }],
				'ring-offset-color': [{ 'ring-offset': c() }],
				'inset-ring-w': [{ 'inset-ring': v() }],
				'inset-ring-color': [{ 'inset-ring': c() }],
				opacity: [{ opacity: [h, s, n] }],
				'mix-blend': [{ 'mix-blend': [...E(), 'plus-darker', 'plus-lighter'] }],
				'bg-blend': [{ 'bg-blend': E() }],
				filter: [{ filter: ['', 'none', s, n] }],
				blur: [{ blur: I() }],
				brightness: [{ brightness: [h, s, n] }],
				contrast: [{ contrast: [h, s, n] }],
				'drop-shadow': [{ 'drop-shadow': ['', 'none', T, s, n] }],
				grayscale: [{ grayscale: ['', h, s, n] }],
				'hue-rotate': [{ 'hue-rotate': [h, s, n] }],
				invert: [{ invert: ['', h, s, n] }],
				saturate: [{ saturate: [h, s, n] }],
				sepia: [{ sepia: ['', h, s, n] }],
				'backdrop-filter': [{ 'backdrop-filter': ['', 'none', s, n] }],
				'backdrop-blur': [{ 'backdrop-blur': I() }],
				'backdrop-brightness': [{ 'backdrop-brightness': [h, s, n] }],
				'backdrop-contrast': [{ 'backdrop-contrast': [h, s, n] }],
				'backdrop-grayscale': [{ 'backdrop-grayscale': ['', h, s, n] }],
				'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [h, s, n] }],
				'backdrop-invert': [{ 'backdrop-invert': ['', h, s, n] }],
				'backdrop-opacity': [{ 'backdrop-opacity': [h, s, n] }],
				'backdrop-saturate': [{ 'backdrop-saturate': [h, s, n] }],
				'backdrop-sepia': [{ 'backdrop-sepia': ['', h, s, n] }],
				'border-collapse': [{ border: ['collapse', 'separate'] }],
				'border-spacing': [{ 'border-spacing': u() }],
				'border-spacing-x': [{ 'border-spacing-x': u() }],
				'border-spacing-y': [{ 'border-spacing-y': u() }],
				'table-layout': [{ table: ['auto', 'fixed'] }],
				caption: [{ caption: ['top', 'bottom'] }],
				transition: [
					{ transition: ['', 'all', 'colors', 'opacity', 'shadow', 'transform', 'none', s, n] }
				],
				'transition-behavior': [{ transition: ['normal', 'discrete'] }],
				duration: [{ duration: [h, 'initial', s, n] }],
				ease: [{ ease: ['linear', 'initial', C, s, n] }],
				delay: [{ delay: [h, s, n] }],
				animate: [{ animate: ['none', N, s, n] }],
				backface: [{ backface: ['hidden', 'visible'] }],
				perspective: [{ perspective: [x, s, n] }],
				'perspective-origin': [{ 'perspective-origin': q() }],
				rotate: [{ rotate: B() }],
				'rotate-x': [{ 'rotate-x': B() }],
				'rotate-y': [{ 'rotate-y': B() }],
				'rotate-z': [{ 'rotate-z': B() }],
				scale: [{ scale: F() }],
				'scale-x': [{ 'scale-x': F() }],
				'scale-y': [{ 'scale-y': F() }],
				'scale-z': [{ 'scale-z': F() }],
				'scale-3d': ['scale-3d'],
				skew: [{ skew: D() }],
				'skew-x': [{ 'skew-x': D() }],
				'skew-y': [{ 'skew-y': D() }],
				transform: [{ transform: [s, n, '', 'none', 'gpu', 'cpu'] }],
				'transform-origin': [{ origin: q() }],
				'transform-style': [{ transform: ['3d', 'flat'] }],
				translate: [{ translate: Q() }],
				'translate-x': [{ 'translate-x': Q() }],
				'translate-y': [{ 'translate-y': Q() }],
				'translate-z': [{ 'translate-z': Q() }],
				'translate-none': ['translate-none'],
				accent: [{ accent: c() }],
				appearance: [{ appearance: ['none', 'auto'] }],
				'caret-color': [{ caret: c() }],
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
							s,
							n
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
				'will-change': [{ 'will-change': ['auto', 'scroll', 'contents', 'transform', s, n] }],
				fill: [{ fill: ['none', ...c()] }],
				'stroke-w': [{ stroke: [h, ie, H, de] }],
				stroke: [{ stroke: ['none', ...c()] }],
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
				'before',
				'after',
				'placeholder',
				'file',
				'marker',
				'selection',
				'first-line',
				'first-letter',
				'backdrop',
				'*',
				'**'
			]
		};
	},
	Wr = (
		e,
		{ cacheSize: t, prefix: r, experimentalParseClassName: o, extend: a = {}, override: i = {} }
	) => (
		oe(e, 'cacheSize', t),
		oe(e, 'prefix', r),
		oe(e, 'experimentalParseClassName', o),
		ae(e.theme, i.theme),
		ae(e.classGroups, i.classGroups),
		ae(e.conflictingClassGroups, i.conflictingClassGroups),
		ae(e.conflictingClassGroupModifiers, i.conflictingClassGroupModifiers),
		oe(e, 'orderSensitiveModifiers', i.orderSensitiveModifiers),
		le(e.theme, a.theme),
		le(e.classGroups, a.classGroups),
		le(e.conflictingClassGroups, a.conflictingClassGroups),
		le(e.conflictingClassGroupModifiers, a.conflictingClassGroupModifiers),
		De(e, a, 'orderSensitiveModifiers'),
		e
	),
	oe = (e, t, r) => {
		r !== void 0 && (e[t] = r);
	},
	ae = (e, t) => {
		if (t) for (const r in t) oe(e, r, t[r]);
	},
	le = (e, t) => {
		if (t) for (const r in t) De(e, t, r);
	},
	De = (e, t, r) => {
		const o = t[r];
		o !== void 0 && (e[r] = e[r] ? e[r].concat(o) : o);
	},
	Ur = (e, ...t) => (typeof e == 'function' ? ge(me, e, ...t) : ge(() => Wr(me(), e), ...t)),
	qr = ge(me);
var Jr = { twMerge: !0, twMergeConfig: {}, responsiveVariants: !1 },
	Qe = (e) => e || void 0,
	ne = (...e) => Qe(Ee(e).filter(Boolean).join(' ')),
	ue = null,
	L = {},
	he = !1,
	te =
		(...e) =>
		(t) =>
			t.twMerge
				? ((!ue || he) &&
						((he = !1),
						(ue = j(L)
							? qr
							: Ur({
									...L,
									extend: {
										theme: L.theme,
										classGroups: L.classGroups,
										conflictingClassGroupModifiers: L.conflictingClassGroupModifiers,
										conflictingClassGroups: L.conflictingClassGroups,
										...L.extend
									}
								}))),
					Qe(ue(ne(e))))
				: ne(e),
	je = (e, t) => {
		for (let r in t) e.hasOwnProperty(r) ? (e[r] = ne(e[r], t[r])) : (e[r] = t[r]);
		return e;
	},
	Hr = (e, t) => {
		let {
				extend: r = null,
				slots: o = {},
				variants: a = {},
				compoundVariants: i = [],
				compoundSlots: l = [],
				defaultVariants: m = {}
			} = e,
			d = { ...Jr, ...t },
			M = r != null && r.base ? ne(r.base, e?.base) : e?.base,
			w = r != null && r.variants && !j(r.variants) ? Oe(a, r.variants) : a,
			R =
				r != null && r.defaultVariants && !j(r.defaultVariants)
					? { ...r.defaultVariants, ...m }
					: m;
		!j(d.twMergeConfig) && !or(d.twMergeConfig, L) && ((he = !0), (L = d.twMergeConfig));
		let T = j(r?.slots),
			P = j(o) ? {} : { base: ne(e?.base, T && r?.base), ...o },
			x = T ? P : je({ ...r?.slots }, j(P) ? { base: e?.base } : P),
			A = j(r?.compoundVariants) ? i : Le(r?.compoundVariants, i),
			C = (k) => {
				if (j(w) && j(o) && T) return te(M, k?.class, k?.className)(d);
				if (A && !Array.isArray(A))
					throw new TypeError(
						`The "compoundVariants" prop must be an array. Received: ${typeof A}`
					);
				if (l && !Array.isArray(l))
					throw new TypeError(`The "compoundSlots" prop must be an array. Received: ${typeof l}`);
				let U = (g, f, p = [], y) => {
						let c = p;
						if (typeof f == 'string')
							c = c.concat(
								Pe(f)
									.split(' ')
									.map((z) => `${g}:${z}`)
							);
						else if (Array.isArray(f)) c = c.concat(f.reduce((z, b) => z.concat(`${g}:${b}`), []));
						else if (typeof f == 'object' && typeof y == 'string') {
							for (let z in f)
								if (f.hasOwnProperty(z) && z === y) {
									let b = f[z];
									if (b && typeof b == 'string') {
										let v = Pe(b);
										c[y]
											? (c[y] = c[y].concat(v.split(' ').map((S) => `${g}:${S}`)))
											: (c[y] = v.split(' ').map((S) => `${g}:${S}`));
									} else
										Array.isArray(b) &&
											b.length > 0 &&
											(c[y] = b.reduce((v, S) => v.concat(`${g}:${S}`), []));
								}
						}
						return c;
					},
					_ = (g, f = w, p = null, y = null) => {
						var c;
						let z = f[g];
						if (!z || j(z)) return null;
						let b = (c = y?.[g]) != null ? c : k?.[g];
						if (b === null) return null;
						let v = Ge(b),
							S =
								(Array.isArray(d.responsiveVariants) && d.responsiveVariants.length > 0) ||
								d.responsiveVariants === !0,
							E = R?.[g],
							I = [];
						if (typeof v == 'object' && S)
							for (let [F, D] of Object.entries(v)) {
								let Q = z[D];
								if (F === 'initial') {
									E = D;
									continue;
								}
								(Array.isArray(d.responsiveVariants) && !d.responsiveVariants.includes(F)) ||
									(I = U(F, Q, I, p));
							}
						let q = v != null && typeof v != 'object' ? v : Ge(E),
							B = z[q || 'false'];
						return typeof I == 'object' && typeof p == 'string' && I[p]
							? je(I, B)
							: I.length > 0
								? (I.push(B), p === 'base' ? I.join(' ') : I)
								: B;
					},
					O = () => (w ? Object.keys(w).map((g) => _(g, w)) : null),
					u = (g, f) => {
						if (!w || typeof w != 'object') return null;
						let p = new Array();
						for (let y in w) {
							let c = _(y, w, g, f),
								z = g === 'base' && typeof c == 'string' ? c : c && c[g];
							z && (p[p.length] = z);
						}
						return p;
					},
					V = {};
				for (let g in k) k[g] !== void 0 && (V[g] = k[g]);
				let ee = (g, f) => {
						var p;
						let y =
							typeof k?.[g] == 'object' ? { [g]: (p = k[g]) == null ? void 0 : p.initial } : {};
						return { ...R, ...V, ...y, ...f };
					},
					re = (g = [], f) => {
						let p = [];
						for (let { class: y, className: c, ...z } of g) {
							let b = !0;
							for (let [v, S] of Object.entries(z)) {
								let E = ee(v, f)[v];
								if (Array.isArray(S)) {
									if (!S.includes(E)) {
										b = !1;
										break;
									}
								} else {
									let I = (q) => q == null || q === !1;
									if (I(S) && I(E)) continue;
									if (E !== S) {
										b = !1;
										break;
									}
								}
							}
							b && (y && p.push(y), c && p.push(c));
						}
						return p;
					},
					K = (g) => {
						let f = re(A, g);
						if (!Array.isArray(f)) return f;
						let p = {};
						for (let y of f)
							if ((typeof y == 'string' && (p.base = te(p.base, y)(d)), typeof y == 'object'))
								for (let [c, z] of Object.entries(y)) p[c] = te(p[c], z)(d);
						return p;
					},
					se = (g) => {
						if (l.length < 1) return null;
						let f = {};
						for (let { slots: p = [], class: y, className: c, ...z } of l) {
							if (!j(z)) {
								let b = !0;
								for (let v of Object.keys(z)) {
									let S = ee(v, g)[v];
									if (S === void 0 || (Array.isArray(z[v]) ? !z[v].includes(S) : z[v] !== S)) {
										b = !1;
										break;
									}
								}
								if (!b) continue;
							}
							for (let b of p) ((f[b] = f[b] || []), f[b].push([y, c]));
						}
						return f;
					};
				if (!j(o) || !T) {
					let g = {};
					if (typeof x == 'object' && !j(x))
						for (let f of Object.keys(x))
							g[f] = (p) => {
								var y, c;
								return te(
									x[f],
									u(f, p),
									((y = K(p)) != null ? y : [])[f],
									((c = se(p)) != null ? c : [])[f],
									p?.class,
									p?.className
								)(d);
							};
					return g;
				}
				return te(M, O(), re(A), k?.class, k?.className)(d);
			},
			N = () => {
				if (!(!w || typeof w != 'object')) return Object.keys(w);
			};
		return (
			(C.variantKeys = N()),
			(C.extend = r),
			(C.base = M),
			(C.slots = x),
			(C.variants = w),
			(C.defaultVariants = R),
			(C.compoundSlots = l),
			(C.compoundVariants = A),
			C
		);
	};
const Te = Hr({
	base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
			destructive:
				'bg-destructive shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
			outline:
				'bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border',
			secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
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
var Kr = Ne('<a><!></a>'),
	Dr = Ne('<button><!> <!></button>');
function nt(e, t) {
	Xe(t, !0);
	let r = X(t, 'variant', 3, 'default'),
		o = X(t, 'size', 3, 'default'),
		a = X(t, 'ref', 15, null),
		i = X(t, 'href', 3, void 0),
		l = X(t, 'type', 3, 'button'),
		m = X(t, 'loading', 11, !1),
		d = rr(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'class',
			'variant',
			'size',
			'ref',
			'href',
			'type',
			'loading',
			'disabled',
			'children'
		]);
	var M = Ye(),
		w = Ze(M);
	{
		var R = (P) => {
				var x = Kr();
				Me(
					x,
					(C) => ({
						'data-slot': 'button',
						class: C,
						href: t.disabled ? void 0 : i(),
						'aria-disabled': t.disabled,
						role: t.disabled ? 'link' : void 0,
						tabindex: t.disabled ? -1 : void 0,
						...d
					}),
					[() => Se(Te({ variant: r(), size: o() }), t.class)]
				);
				var A = we(x);
				(ze(A, () => t.children ?? xe),
					ke(x),
					Ce(
						x,
						(C) => a(C),
						() => a()
					),
					ce(P, x));
			},
			T = (P) => {
				var x = Dr();
				Me(
					x,
					(k) => ({
						'data-slot': 'button',
						disabled: t.disabled || m(),
						class: k,
						type: l(),
						...d
					}),
					[
						() =>
							Se(Te({ variant: r(), size: o() }), m() && 'cursor-not-allowed opacity-50', t.class)
					]
				);
				var A = we(x);
				{
					var C = (k) => {
						tr(k, { class: 'h-5 w-5 animate-spin' });
					};
					Ae(A, (k) => {
						m() && k(C);
					});
				}
				var N = er(A, 2);
				(ze(N, () => t.children ?? xe),
					ke(x),
					Ce(
						x,
						(k) => a(k),
						() => a()
					),
					ce(P, x));
			};
		Ae(w, (P) => {
			i() ? P(R) : P(T, !1);
		});
	}
	(ce(e, M), $e());
}
export { nt as B, Te as b, Hr as c };
