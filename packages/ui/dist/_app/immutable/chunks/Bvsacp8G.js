import { d as Pe } from './BPMCz5tT.js';
const ne = '-',
	Ie = (e) => {
		const n = Ge(e),
			{ conflictingClassGroups: s, conflictingClassGroupModifiers: t } = e;
		return {
			getClassGroupId: (i) => {
				const u = i.split(ne);
				return (u[0] === '' && u.length !== 1 && u.shift(), xe(u, n) || Re(i));
			},
			getConflictingClassGroupIds: (i, u) => {
				const p = s[i] || [];
				return u && t[i] ? [...p, ...t[i]] : p;
			}
		};
	},
	xe = (e, n) => {
		if (e.length === 0) return n.classGroupId;
		const s = e[0],
			t = n.nextPart.get(s),
			l = t ? xe(e.slice(1), t) : void 0;
		if (l) return l;
		if (n.validators.length === 0) return;
		const d = e.join(ne);
		return n.validators.find(({ validator: i }) => i(d))?.classGroupId;
	},
	fe = /^\[(.+)\]$/,
	Re = (e) => {
		if (fe.test(e)) {
			const n = fe.exec(e)[1],
				s = n?.substring(0, n.indexOf(':'));
			if (s) return 'arbitrary..' + s;
		}
	},
	Ge = (e) => {
		const { theme: n, classGroups: s } = e,
			t = { nextPart: new Map(), validators: [] };
		for (const l in s) re(s[l], t, l, n);
		return t;
	},
	re = (e, n, s, t) => {
		e.forEach((l) => {
			if (typeof l == 'string') {
				const d = l === '' ? n : ge(n, l);
				d.classGroupId = s;
				return;
			}
			if (typeof l == 'function') {
				if (Be(l)) {
					re(l(t), n, s, t);
					return;
				}
				n.validators.push({ validator: l, classGroupId: s });
				return;
			}
			Object.entries(l).forEach(([d, i]) => {
				re(i, ge(n, d), s, t);
			});
		});
	},
	ge = (e, n) => {
		let s = e;
		return (
			n.split(ne).forEach((t) => {
				(s.nextPart.has(t) || s.nextPart.set(t, { nextPart: new Map(), validators: [] }),
					(s = s.nextPart.get(t)));
			}),
			s
		);
	},
	Be = (e) => e.isThemeGetter,
	Te = (e) => {
		if (e < 1) return { get: () => {}, set: () => {} };
		let n = 0,
			s = new Map(),
			t = new Map();
		const l = (d, i) => {
			(s.set(d, i), n++, n > e && ((n = 0), (t = s), (s = new Map())));
		};
		return {
			get(d) {
				let i = s.get(d);
				if (i !== void 0) return i;
				if ((i = t.get(d)) !== void 0) return (l(d, i), i);
			},
			set(d, i) {
				s.has(d) ? s.set(d, i) : l(d, i);
			}
		};
	},
	te = '!',
	se = ':',
	Ee = se.length,
	Ne = (e) => {
		const { prefix: n, experimentalParseClassName: s } = e;
		let t = (l) => {
			const d = [];
			let i = 0,
				u = 0,
				p = 0,
				b;
			for (let k = 0; k < l.length; k++) {
				let y = l[k];
				if (i === 0 && u === 0) {
					if (y === se) {
						(d.push(l.slice(p, k)), (p = k + Ee));
						continue;
					}
					if (y === '/') {
						b = k;
						continue;
					}
				}
				y === '[' ? i++ : y === ']' ? i-- : y === '(' ? u++ : y === ')' && u--;
			}
			const h = d.length === 0 ? l : l.substring(p),
				S = Le(h),
				F = S !== h,
				j = b && b > p ? b - p : void 0;
			return {
				modifiers: d,
				hasImportantModifier: F,
				baseClassName: S,
				maybePostfixModifierPosition: j
			};
		};
		if (n) {
			const l = n + se,
				d = t;
			t = (i) =>
				i.startsWith(l)
					? d(i.substring(l.length))
					: {
							isExternal: !0,
							modifiers: [],
							hasImportantModifier: !1,
							baseClassName: i,
							maybePostfixModifierPosition: void 0
						};
		}
		if (s) {
			const l = t;
			t = (d) => s({ className: d, parseClassName: l });
		}
		return t;
	},
	Le = (e) =>
		e.endsWith(te) ? e.substring(0, e.length - 1) : e.startsWith(te) ? e.substring(1) : e,
	Ve = (e) => {
		const n = Object.fromEntries(e.orderSensitiveModifiers.map((t) => [t, !0]));
		return (t) => {
			if (t.length <= 1) return t;
			const l = [];
			let d = [];
			return (
				t.forEach((i) => {
					i[0] === '[' || n[i] ? (l.push(...d.sort(), i), (d = [])) : d.push(i);
				}),
				l.push(...d.sort()),
				l
			);
		};
	},
	Fe = (e) => ({ cache: Te(e.cacheSize), parseClassName: Ne(e), sortModifiers: Ve(e), ...Ie(e) }),
	je = /\s+/,
	Oe = (e, n) => {
		const {
				parseClassName: s,
				getClassGroupId: t,
				getConflictingClassGroupIds: l,
				sortModifiers: d
			} = n,
			i = [],
			u = e.trim().split(je);
		let p = '';
		for (let b = u.length - 1; b >= 0; b -= 1) {
			const h = u[b],
				{
					isExternal: S,
					modifiers: F,
					hasImportantModifier: j,
					baseClassName: k,
					maybePostfixModifierPosition: y
				} = s(h);
			if (S) {
				p = h + (p.length > 0 ? ' ' + p : p);
				continue;
			}
			let G = !!y,
				A = t(G ? k.substring(0, y) : k);
			if (!A) {
				if (!G) {
					p = h + (p.length > 0 ? ' ' + p : p);
					continue;
				}
				if (((A = t(k)), !A)) {
					p = h + (p.length > 0 ? ' ' + p : p);
					continue;
				}
				G = !1;
			}
			const W = d(F).join(':'),
				O = j ? W + te : W,
				B = O + A;
			if (i.includes(B)) continue;
			i.push(B);
			const T = l(A, G);
			for (let P = 0; P < T.length; ++P) {
				const $ = T[P];
				i.push(O + $);
			}
			p = h + (p.length > 0 ? ' ' + p : p);
		}
		return p;
	};
function $e() {
	let e = 0,
		n,
		s,
		t = '';
	for (; e < arguments.length; ) (n = arguments[e++]) && (s = we(n)) && (t && (t += ' '), (t += s));
	return t;
}
const we = (e) => {
	if (typeof e == 'string') return e;
	let n,
		s = '';
	for (let t = 0; t < e.length; t++) e[t] && (n = we(e[t])) && (s && (s += ' '), (s += n));
	return s;
};
function _e(e, ...n) {
	let s,
		t,
		l,
		d = i;
	function i(p) {
		const b = n.reduce((h, S) => S(h), e());
		return ((s = Fe(b)), (t = s.cache.get), (l = s.cache.set), (d = u), u(p));
	}
	function u(p) {
		const b = t(p);
		if (b) return b;
		const h = Oe(p, s);
		return (l(p, h), h);
	}
	return function () {
		return d($e.apply(null, arguments));
	};
}
const f = (e) => {
		const n = (s) => s[e] || [];
		return ((n.isThemeGetter = !0), n);
	},
	ke = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
	ye = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
	We = /^\d+\/\d+$/,
	Ue = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
	De =
		/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
	qe = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
	Ye = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
	Ze =
		/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
	N = (e) => We.test(e),
	m = (e) => !!e && !Number.isNaN(Number(e)),
	C = (e) => !!e && Number.isInteger(Number(e)),
	ee = (e) => e.endsWith('%') && m(e.slice(0, -1)),
	M = (e) => Ue.test(e),
	He = () => !0,
	Je = (e) => De.test(e) && !qe.test(e),
	ve = () => !1,
	Ke = (e) => Ye.test(e),
	Xe = (e) => Ze.test(e),
	Qe = (e) => !o(e) && !r(e),
	eo = (e) => L(e, Se, ve),
	o = (e) => ke.test(e),
	R = (e) => L(e, Ce, Je),
	oe = (e) => L(e, no, m),
	be = (e) => L(e, ze, ve),
	oo = (e) => L(e, Me, Xe),
	H = (e) => L(e, Ae, Ke),
	r = (e) => ye.test(e),
	_ = (e) => V(e, Ce),
	ro = (e) => V(e, ao),
	he = (e) => V(e, ze),
	to = (e) => V(e, Se),
	so = (e) => V(e, Me),
	J = (e) => V(e, Ae, !0),
	L = (e, n, s) => {
		const t = ke.exec(e);
		return t ? (t[1] ? n(t[1]) : s(t[2])) : !1;
	},
	V = (e, n, s = !1) => {
		const t = ye.exec(e);
		return t ? (t[1] ? n(t[1]) : s) : !1;
	},
	ze = (e) => e === 'position' || e === 'percentage',
	Me = (e) => e === 'image' || e === 'url',
	Se = (e) => e === 'length' || e === 'size' || e === 'bg-size',
	Ce = (e) => e === 'length',
	no = (e) => e === 'number',
	ao = (e) => e === 'family-name',
	Ae = (e) => e === 'shadow',
	io = () => {
		const e = f('color'),
			n = f('font'),
			s = f('text'),
			t = f('font-weight'),
			l = f('tracking'),
			d = f('leading'),
			i = f('breakpoint'),
			u = f('container'),
			p = f('spacing'),
			b = f('radius'),
			h = f('shadow'),
			S = f('inset-shadow'),
			F = f('text-shadow'),
			j = f('drop-shadow'),
			k = f('blur'),
			y = f('perspective'),
			G = f('aspect'),
			A = f('ease'),
			W = f('animate'),
			O = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'],
			B = () => [
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
			T = () => [...B(), r, o],
			P = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
			$ = () => ['auto', 'contain', 'none'],
			c = () => [r, o, p],
			v = () => [N, 'full', 'auto', ...c()],
			ae = () => [C, 'none', 'subgrid', r, o],
			ie = () => ['auto', { span: ['full', C, r, o] }, C, r, o],
			U = () => [C, 'auto', r, o],
			le = () => ['auto', 'min', 'max', 'fr', r, o],
			K = () => [
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
			E = () => ['start', 'end', 'center', 'stretch', 'center-safe', 'end-safe'],
			z = () => ['auto', ...c()],
			I = () => [
				N,
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
				...c()
			],
			a = () => [e, r, o],
			ce = () => [...B(), he, be, { position: [r, o] }],
			de = () => ['no-repeat', { repeat: ['', 'x', 'y', 'space', 'round'] }],
			me = () => ['auto', 'cover', 'contain', to, eo, { size: [r, o] }],
			X = () => [ee, _, R],
			x = () => ['', 'none', 'full', b, r, o],
			w = () => ['', m, _, R],
			D = () => ['solid', 'dashed', 'dotted', 'double'],
			pe = () => [
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
			g = () => [m, ee, he, be],
			ue = () => ['', 'none', k, r, o],
			q = () => ['none', m, r, o],
			Y = () => ['none', m, r, o],
			Q = () => [m, r, o],
			Z = () => [N, 'full', ...c()];
		return {
			cacheSize: 500,
			theme: {
				animate: ['spin', 'ping', 'pulse', 'bounce'],
				aspect: ['video'],
				blur: [M],
				breakpoint: [M],
				color: [He],
				container: [M],
				'drop-shadow': [M],
				ease: ['in', 'out', 'in-out'],
				font: [Qe],
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
				'inset-shadow': [M],
				leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
				perspective: ['dramatic', 'near', 'normal', 'midrange', 'distant', 'none'],
				radius: [M],
				shadow: [M],
				spacing: ['px', m],
				text: [M],
				'text-shadow': [M],
				tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']
			},
			classGroups: {
				aspect: [{ aspect: ['auto', 'square', N, o, r, G] }],
				container: ['container'],
				columns: [{ columns: [m, o, r, u] }],
				'break-after': [{ 'break-after': O() }],
				'break-before': [{ 'break-before': O() }],
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
				'object-position': [{ object: T() }],
				overflow: [{ overflow: P() }],
				'overflow-x': [{ 'overflow-x': P() }],
				'overflow-y': [{ 'overflow-y': P() }],
				overscroll: [{ overscroll: $() }],
				'overscroll-x': [{ 'overscroll-x': $() }],
				'overscroll-y': [{ 'overscroll-y': $() }],
				position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
				inset: [{ inset: v() }],
				'inset-x': [{ 'inset-x': v() }],
				'inset-y': [{ 'inset-y': v() }],
				start: [{ start: v() }],
				end: [{ end: v() }],
				top: [{ top: v() }],
				right: [{ right: v() }],
				bottom: [{ bottom: v() }],
				left: [{ left: v() }],
				visibility: ['visible', 'invisible', 'collapse'],
				z: [{ z: [C, 'auto', r, o] }],
				basis: [{ basis: [N, 'full', 'auto', u, ...c()] }],
				'flex-direction': [{ flex: ['row', 'row-reverse', 'col', 'col-reverse'] }],
				'flex-wrap': [{ flex: ['nowrap', 'wrap', 'wrap-reverse'] }],
				flex: [{ flex: [m, N, 'auto', 'initial', 'none', o] }],
				grow: [{ grow: ['', m, r, o] }],
				shrink: [{ shrink: ['', m, r, o] }],
				order: [{ order: [C, 'first', 'last', 'none', r, o] }],
				'grid-cols': [{ 'grid-cols': ae() }],
				'col-start-end': [{ col: ie() }],
				'col-start': [{ 'col-start': U() }],
				'col-end': [{ 'col-end': U() }],
				'grid-rows': [{ 'grid-rows': ae() }],
				'row-start-end': [{ row: ie() }],
				'row-start': [{ 'row-start': U() }],
				'row-end': [{ 'row-end': U() }],
				'grid-flow': [{ 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] }],
				'auto-cols': [{ 'auto-cols': le() }],
				'auto-rows': [{ 'auto-rows': le() }],
				gap: [{ gap: c() }],
				'gap-x': [{ 'gap-x': c() }],
				'gap-y': [{ 'gap-y': c() }],
				'justify-content': [{ justify: [...K(), 'normal'] }],
				'justify-items': [{ 'justify-items': [...E(), 'normal'] }],
				'justify-self': [{ 'justify-self': ['auto', ...E()] }],
				'align-content': [{ content: ['normal', ...K()] }],
				'align-items': [{ items: [...E(), { baseline: ['', 'last'] }] }],
				'align-self': [{ self: ['auto', ...E(), { baseline: ['', 'last'] }] }],
				'place-content': [{ 'place-content': K() }],
				'place-items': [{ 'place-items': [...E(), 'baseline'] }],
				'place-self': [{ 'place-self': ['auto', ...E()] }],
				p: [{ p: c() }],
				px: [{ px: c() }],
				py: [{ py: c() }],
				ps: [{ ps: c() }],
				pe: [{ pe: c() }],
				pt: [{ pt: c() }],
				pr: [{ pr: c() }],
				pb: [{ pb: c() }],
				pl: [{ pl: c() }],
				m: [{ m: z() }],
				mx: [{ mx: z() }],
				my: [{ my: z() }],
				ms: [{ ms: z() }],
				me: [{ me: z() }],
				mt: [{ mt: z() }],
				mr: [{ mr: z() }],
				mb: [{ mb: z() }],
				ml: [{ ml: z() }],
				'space-x': [{ 'space-x': c() }],
				'space-x-reverse': ['space-x-reverse'],
				'space-y': [{ 'space-y': c() }],
				'space-y-reverse': ['space-y-reverse'],
				size: [{ size: I() }],
				w: [{ w: [u, 'screen', ...I()] }],
				'min-w': [{ 'min-w': [u, 'screen', 'none', ...I()] }],
				'max-w': [{ 'max-w': [u, 'screen', 'none', 'prose', { screen: [i] }, ...I()] }],
				h: [{ h: ['screen', 'lh', ...I()] }],
				'min-h': [{ 'min-h': ['screen', 'lh', 'none', ...I()] }],
				'max-h': [{ 'max-h': ['screen', 'lh', ...I()] }],
				'font-size': [{ text: ['base', s, _, R] }],
				'font-smoothing': ['antialiased', 'subpixel-antialiased'],
				'font-style': ['italic', 'not-italic'],
				'font-weight': [{ font: [t, r, oe] }],
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
							ee,
							o
						]
					}
				],
				'font-family': [{ font: [ro, o, n] }],
				'fvn-normal': ['normal-nums'],
				'fvn-ordinal': ['ordinal'],
				'fvn-slashed-zero': ['slashed-zero'],
				'fvn-figure': ['lining-nums', 'oldstyle-nums'],
				'fvn-spacing': ['proportional-nums', 'tabular-nums'],
				'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
				tracking: [{ tracking: [l, r, o] }],
				'line-clamp': [{ 'line-clamp': [m, 'none', r, oe] }],
				leading: [{ leading: [d, ...c()] }],
				'list-image': [{ 'list-image': ['none', r, o] }],
				'list-style-position': [{ list: ['inside', 'outside'] }],
				'list-style-type': [{ list: ['disc', 'decimal', 'none', r, o] }],
				'text-alignment': [{ text: ['left', 'center', 'right', 'justify', 'start', 'end'] }],
				'placeholder-color': [{ placeholder: a() }],
				'text-color': [{ text: a() }],
				'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
				'text-decoration-style': [{ decoration: [...D(), 'wavy'] }],
				'text-decoration-thickness': [{ decoration: [m, 'from-font', 'auto', r, R] }],
				'text-decoration-color': [{ decoration: a() }],
				'underline-offset': [{ 'underline-offset': [m, 'auto', r, o] }],
				'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
				'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
				'text-wrap': [{ text: ['wrap', 'nowrap', 'balance', 'pretty'] }],
				indent: [{ indent: c() }],
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
							r,
							o
						]
					}
				],
				whitespace: [
					{ whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] }
				],
				break: [{ break: ['normal', 'words', 'all', 'keep'] }],
				wrap: [{ wrap: ['break-word', 'anywhere', 'normal'] }],
				hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
				content: [{ content: ['none', r, o] }],
				'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
				'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
				'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
				'bg-position': [{ bg: ce() }],
				'bg-repeat': [{ bg: de() }],
				'bg-size': [{ bg: me() }],
				'bg-image': [
					{
						bg: [
							'none',
							{
								linear: [{ to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] }, C, r, o],
								radial: ['', r, o],
								conic: [C, r, o]
							},
							so,
							oo
						]
					}
				],
				'bg-color': [{ bg: a() }],
				'gradient-from-pos': [{ from: X() }],
				'gradient-via-pos': [{ via: X() }],
				'gradient-to-pos': [{ to: X() }],
				'gradient-from': [{ from: a() }],
				'gradient-via': [{ via: a() }],
				'gradient-to': [{ to: a() }],
				rounded: [{ rounded: x() }],
				'rounded-s': [{ 'rounded-s': x() }],
				'rounded-e': [{ 'rounded-e': x() }],
				'rounded-t': [{ 'rounded-t': x() }],
				'rounded-r': [{ 'rounded-r': x() }],
				'rounded-b': [{ 'rounded-b': x() }],
				'rounded-l': [{ 'rounded-l': x() }],
				'rounded-ss': [{ 'rounded-ss': x() }],
				'rounded-se': [{ 'rounded-se': x() }],
				'rounded-ee': [{ 'rounded-ee': x() }],
				'rounded-es': [{ 'rounded-es': x() }],
				'rounded-tl': [{ 'rounded-tl': x() }],
				'rounded-tr': [{ 'rounded-tr': x() }],
				'rounded-br': [{ 'rounded-br': x() }],
				'rounded-bl': [{ 'rounded-bl': x() }],
				'border-w': [{ border: w() }],
				'border-w-x': [{ 'border-x': w() }],
				'border-w-y': [{ 'border-y': w() }],
				'border-w-s': [{ 'border-s': w() }],
				'border-w-e': [{ 'border-e': w() }],
				'border-w-t': [{ 'border-t': w() }],
				'border-w-r': [{ 'border-r': w() }],
				'border-w-b': [{ 'border-b': w() }],
				'border-w-l': [{ 'border-l': w() }],
				'divide-x': [{ 'divide-x': w() }],
				'divide-x-reverse': ['divide-x-reverse'],
				'divide-y': [{ 'divide-y': w() }],
				'divide-y-reverse': ['divide-y-reverse'],
				'border-style': [{ border: [...D(), 'hidden', 'none'] }],
				'divide-style': [{ divide: [...D(), 'hidden', 'none'] }],
				'border-color': [{ border: a() }],
				'border-color-x': [{ 'border-x': a() }],
				'border-color-y': [{ 'border-y': a() }],
				'border-color-s': [{ 'border-s': a() }],
				'border-color-e': [{ 'border-e': a() }],
				'border-color-t': [{ 'border-t': a() }],
				'border-color-r': [{ 'border-r': a() }],
				'border-color-b': [{ 'border-b': a() }],
				'border-color-l': [{ 'border-l': a() }],
				'divide-color': [{ divide: a() }],
				'outline-style': [{ outline: [...D(), 'none', 'hidden'] }],
				'outline-offset': [{ 'outline-offset': [m, r, o] }],
				'outline-w': [{ outline: ['', m, _, R] }],
				'outline-color': [{ outline: a() }],
				shadow: [{ shadow: ['', 'none', h, J, H] }],
				'shadow-color': [{ shadow: a() }],
				'inset-shadow': [{ 'inset-shadow': ['none', S, J, H] }],
				'inset-shadow-color': [{ 'inset-shadow': a() }],
				'ring-w': [{ ring: w() }],
				'ring-w-inset': ['ring-inset'],
				'ring-color': [{ ring: a() }],
				'ring-offset-w': [{ 'ring-offset': [m, R] }],
				'ring-offset-color': [{ 'ring-offset': a() }],
				'inset-ring-w': [{ 'inset-ring': w() }],
				'inset-ring-color': [{ 'inset-ring': a() }],
				'text-shadow': [{ 'text-shadow': ['none', F, J, H] }],
				'text-shadow-color': [{ 'text-shadow': a() }],
				opacity: [{ opacity: [m, r, o] }],
				'mix-blend': [{ 'mix-blend': [...pe(), 'plus-darker', 'plus-lighter'] }],
				'bg-blend': [{ 'bg-blend': pe() }],
				'mask-clip': [
					{ 'mask-clip': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] },
					'mask-no-clip'
				],
				'mask-composite': [{ mask: ['add', 'subtract', 'intersect', 'exclude'] }],
				'mask-image-linear-pos': [{ 'mask-linear': [m] }],
				'mask-image-linear-from-pos': [{ 'mask-linear-from': g() }],
				'mask-image-linear-to-pos': [{ 'mask-linear-to': g() }],
				'mask-image-linear-from-color': [{ 'mask-linear-from': a() }],
				'mask-image-linear-to-color': [{ 'mask-linear-to': a() }],
				'mask-image-t-from-pos': [{ 'mask-t-from': g() }],
				'mask-image-t-to-pos': [{ 'mask-t-to': g() }],
				'mask-image-t-from-color': [{ 'mask-t-from': a() }],
				'mask-image-t-to-color': [{ 'mask-t-to': a() }],
				'mask-image-r-from-pos': [{ 'mask-r-from': g() }],
				'mask-image-r-to-pos': [{ 'mask-r-to': g() }],
				'mask-image-r-from-color': [{ 'mask-r-from': a() }],
				'mask-image-r-to-color': [{ 'mask-r-to': a() }],
				'mask-image-b-from-pos': [{ 'mask-b-from': g() }],
				'mask-image-b-to-pos': [{ 'mask-b-to': g() }],
				'mask-image-b-from-color': [{ 'mask-b-from': a() }],
				'mask-image-b-to-color': [{ 'mask-b-to': a() }],
				'mask-image-l-from-pos': [{ 'mask-l-from': g() }],
				'mask-image-l-to-pos': [{ 'mask-l-to': g() }],
				'mask-image-l-from-color': [{ 'mask-l-from': a() }],
				'mask-image-l-to-color': [{ 'mask-l-to': a() }],
				'mask-image-x-from-pos': [{ 'mask-x-from': g() }],
				'mask-image-x-to-pos': [{ 'mask-x-to': g() }],
				'mask-image-x-from-color': [{ 'mask-x-from': a() }],
				'mask-image-x-to-color': [{ 'mask-x-to': a() }],
				'mask-image-y-from-pos': [{ 'mask-y-from': g() }],
				'mask-image-y-to-pos': [{ 'mask-y-to': g() }],
				'mask-image-y-from-color': [{ 'mask-y-from': a() }],
				'mask-image-y-to-color': [{ 'mask-y-to': a() }],
				'mask-image-radial': [{ 'mask-radial': [r, o] }],
				'mask-image-radial-from-pos': [{ 'mask-radial-from': g() }],
				'mask-image-radial-to-pos': [{ 'mask-radial-to': g() }],
				'mask-image-radial-from-color': [{ 'mask-radial-from': a() }],
				'mask-image-radial-to-color': [{ 'mask-radial-to': a() }],
				'mask-image-radial-shape': [{ 'mask-radial': ['circle', 'ellipse'] }],
				'mask-image-radial-size': [
					{ 'mask-radial': [{ closest: ['side', 'corner'], farthest: ['side', 'corner'] }] }
				],
				'mask-image-radial-pos': [{ 'mask-radial-at': B() }],
				'mask-image-conic-pos': [{ 'mask-conic': [m] }],
				'mask-image-conic-from-pos': [{ 'mask-conic-from': g() }],
				'mask-image-conic-to-pos': [{ 'mask-conic-to': g() }],
				'mask-image-conic-from-color': [{ 'mask-conic-from': a() }],
				'mask-image-conic-to-color': [{ 'mask-conic-to': a() }],
				'mask-mode': [{ mask: ['alpha', 'luminance', 'match'] }],
				'mask-origin': [
					{ 'mask-origin': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] }
				],
				'mask-position': [{ mask: ce() }],
				'mask-repeat': [{ mask: de() }],
				'mask-size': [{ mask: me() }],
				'mask-type': [{ 'mask-type': ['alpha', 'luminance'] }],
				'mask-image': [{ mask: ['none', r, o] }],
				filter: [{ filter: ['', 'none', r, o] }],
				blur: [{ blur: ue() }],
				brightness: [{ brightness: [m, r, o] }],
				contrast: [{ contrast: [m, r, o] }],
				'drop-shadow': [{ 'drop-shadow': ['', 'none', j, J, H] }],
				'drop-shadow-color': [{ 'drop-shadow': a() }],
				grayscale: [{ grayscale: ['', m, r, o] }],
				'hue-rotate': [{ 'hue-rotate': [m, r, o] }],
				invert: [{ invert: ['', m, r, o] }],
				saturate: [{ saturate: [m, r, o] }],
				sepia: [{ sepia: ['', m, r, o] }],
				'backdrop-filter': [{ 'backdrop-filter': ['', 'none', r, o] }],
				'backdrop-blur': [{ 'backdrop-blur': ue() }],
				'backdrop-brightness': [{ 'backdrop-brightness': [m, r, o] }],
				'backdrop-contrast': [{ 'backdrop-contrast': [m, r, o] }],
				'backdrop-grayscale': [{ 'backdrop-grayscale': ['', m, r, o] }],
				'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [m, r, o] }],
				'backdrop-invert': [{ 'backdrop-invert': ['', m, r, o] }],
				'backdrop-opacity': [{ 'backdrop-opacity': [m, r, o] }],
				'backdrop-saturate': [{ 'backdrop-saturate': [m, r, o] }],
				'backdrop-sepia': [{ 'backdrop-sepia': ['', m, r, o] }],
				'border-collapse': [{ border: ['collapse', 'separate'] }],
				'border-spacing': [{ 'border-spacing': c() }],
				'border-spacing-x': [{ 'border-spacing-x': c() }],
				'border-spacing-y': [{ 'border-spacing-y': c() }],
				'table-layout': [{ table: ['auto', 'fixed'] }],
				caption: [{ caption: ['top', 'bottom'] }],
				transition: [
					{ transition: ['', 'all', 'colors', 'opacity', 'shadow', 'transform', 'none', r, o] }
				],
				'transition-behavior': [{ transition: ['normal', 'discrete'] }],
				duration: [{ duration: [m, 'initial', r, o] }],
				ease: [{ ease: ['linear', 'initial', A, r, o] }],
				delay: [{ delay: [m, r, o] }],
				animate: [{ animate: ['none', W, r, o] }],
				backface: [{ backface: ['hidden', 'visible'] }],
				perspective: [{ perspective: [y, r, o] }],
				'perspective-origin': [{ 'perspective-origin': T() }],
				rotate: [{ rotate: q() }],
				'rotate-x': [{ 'rotate-x': q() }],
				'rotate-y': [{ 'rotate-y': q() }],
				'rotate-z': [{ 'rotate-z': q() }],
				scale: [{ scale: Y() }],
				'scale-x': [{ 'scale-x': Y() }],
				'scale-y': [{ 'scale-y': Y() }],
				'scale-z': [{ 'scale-z': Y() }],
				'scale-3d': ['scale-3d'],
				skew: [{ skew: Q() }],
				'skew-x': [{ 'skew-x': Q() }],
				'skew-y': [{ 'skew-y': Q() }],
				transform: [{ transform: [r, o, '', 'none', 'gpu', 'cpu'] }],
				'transform-origin': [{ origin: T() }],
				'transform-style': [{ transform: ['3d', 'flat'] }],
				translate: [{ translate: Z() }],
				'translate-x': [{ 'translate-x': Z() }],
				'translate-y': [{ 'translate-y': Z() }],
				'translate-z': [{ 'translate-z': Z() }],
				'translate-none': ['translate-none'],
				accent: [{ accent: a() }],
				appearance: [{ appearance: ['none', 'auto'] }],
				'caret-color': [{ caret: a() }],
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
							r,
							o
						]
					}
				],
				'field-sizing': [{ 'field-sizing': ['fixed', 'content'] }],
				'pointer-events': [{ 'pointer-events': ['auto', 'none'] }],
				resize: [{ resize: ['none', '', 'y', 'x'] }],
				'scroll-behavior': [{ scroll: ['auto', 'smooth'] }],
				'scroll-m': [{ 'scroll-m': c() }],
				'scroll-mx': [{ 'scroll-mx': c() }],
				'scroll-my': [{ 'scroll-my': c() }],
				'scroll-ms': [{ 'scroll-ms': c() }],
				'scroll-me': [{ 'scroll-me': c() }],
				'scroll-mt': [{ 'scroll-mt': c() }],
				'scroll-mr': [{ 'scroll-mr': c() }],
				'scroll-mb': [{ 'scroll-mb': c() }],
				'scroll-ml': [{ 'scroll-ml': c() }],
				'scroll-p': [{ 'scroll-p': c() }],
				'scroll-px': [{ 'scroll-px': c() }],
				'scroll-py': [{ 'scroll-py': c() }],
				'scroll-ps': [{ 'scroll-ps': c() }],
				'scroll-pe': [{ 'scroll-pe': c() }],
				'scroll-pt': [{ 'scroll-pt': c() }],
				'scroll-pr': [{ 'scroll-pr': c() }],
				'scroll-pb': [{ 'scroll-pb': c() }],
				'scroll-pl': [{ 'scroll-pl': c() }],
				'snap-align': [{ snap: ['start', 'end', 'center', 'align-none'] }],
				'snap-stop': [{ snap: ['normal', 'always'] }],
				'snap-type': [{ snap: ['none', 'x', 'y', 'both'] }],
				'snap-strictness': [{ snap: ['mandatory', 'proximity'] }],
				touch: [{ touch: ['auto', 'none', 'manipulation'] }],
				'touch-x': [{ 'touch-pan': ['x', 'left', 'right'] }],
				'touch-y': [{ 'touch-pan': ['y', 'up', 'down'] }],
				'touch-pz': ['touch-pinch-zoom'],
				select: [{ select: ['none', 'text', 'all', 'auto'] }],
				'will-change': [{ 'will-change': ['auto', 'scroll', 'contents', 'transform', r, o] }],
				fill: [{ fill: ['none', ...a()] }],
				'stroke-w': [{ stroke: [m, _, R, oe] }],
				stroke: [{ stroke: ['none', ...a()] }],
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
	lo = _e(io);
function mo(...e) {
	return lo(Pe(e));
}
function po(e) {
	return String(e).charAt(0).toUpperCase() + String(e).slice(1);
}
function uo(e) {
	return new Date(e).toLocaleString(navigator.language, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
function fo(e, n = !1, s = 1) {
	if (!e || Number.isNaN(e)) return '-';
	if (e === 0) return null;
	const t = n ? 1e3 : 1024;
	if (Math.abs(e) < t) return `${e} B`;
	const l = n
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	let d = -1;
	const i = 10 ** s;
	let u = e;
	do ((u /= t), ++d);
	while (Math.round(Math.abs(u) * i) / i >= t && d < l.length - 1);
	return `${u.toFixed(s)} ${l[d]}`;
}
function go(e) {
	return new Date(e * 1e3).toISOString().slice(14, 19);
}
function bo(e) {
	const s = `; ${document.cookie}`.split(`; ${e}=`);
	if (s.length === 2) return s.pop()?.split(';').shift();
}
export { po as a, mo as c, bo as g, fo as h, uo as p, go as s, lo as t };
