const __vite__mapDeps = (
	i,
	m = __vite__mapDeps,
	d = m.f || (m.f = ['./DsT71iJE.js', './BMMyXqK5.js', './DlfHMoPT.js'])
) => i.map((i) => d[i]);
import {
	av as Hi,
	am as oo,
	p as Vi,
	f as Zo,
	o as qi,
	q as Xi,
	d as Qo,
	u as Jo,
	v as es,
	r as ts,
	b as ns,
	c as Yi,
	y as Ki,
	aj as Zi,
	C as Qi,
	x as rs,
	A as Ji
} from './ZGPguNnN.js';
import { c as ea, r as ta } from './BBPflcbS.js';
import { g as na } from './CU2VXAWn.js';
import { _ as Se } from './PPVm8Dsz.js';
const ra = typeof window < 'u' ? window : void 0;
function oa(t) {
	let e = t.activeElement;
	for (; e?.shadowRoot; ) {
		const n = e.shadowRoot.activeElement;
		if (n === e) break;
		e = n;
	}
	return e;
}
class sa {
	#e;
	#t;
	constructor(e = {}) {
		const { window: n = ra, document: r = n?.document } = e;
		n !== void 0 &&
			((this.#e = r),
			(this.#t = Hi((o) => {
				const s = oo(n, 'focusin', o),
					i = oo(n, 'focusout', o);
				return () => {
					(s(), i());
				};
			})));
	}
	get current() {
		return (this.#t?.(), this.#e ? oa(this.#e) : null);
	}
}
new sa();
var ia = Zo('<p><!></p>');
function sh(t, e) {
	Vi(e, !0);
	let n = Xi(e, ['$$slots', '$$events', '$$legacy', 'class', 'children']);
	var r = ia();
	qi(r, (s) => ({ class: s, ...n }), [
		() => ea('leading-[1.65rem] [&:not(:first-child)]:mt-6', e.class)
	]);
	var o = Qo(r);
	(Jo(o, () => e.children ?? es), ts(r), ns(t, r), Yi());
}
function aa(t) {
	return typeof t == 'function';
}
function la(t) {
	return t !== null && typeof t == 'object';
}
const bt = Symbol('box'),
	cr = Symbol('is-writable');
function ca(t) {
	return la(t) && bt in t;
}
function ua(t) {
	return le.isBox(t) && cr in t;
}
function le(t) {
	let e = Ki(Zi(t));
	return {
		[bt]: !0,
		[cr]: !0,
		get current() {
			return rs(e);
		},
		set current(n) {
			Qi(e, n, !0);
		}
	};
}
function fa(t, e) {
	const n = Ji(t);
	return e
		? {
				[bt]: !0,
				[cr]: !0,
				get current() {
					return rs(n);
				},
				set current(r) {
					e(r);
				}
			}
		: {
				[bt]: !0,
				get current() {
					return t();
				}
			};
}
function ha(t) {
	return le.isBox(t) ? t : aa(t) ? le.with(t) : le(t);
}
function pa(t) {
	return Object.entries(t).reduce(
		(e, [n, r]) =>
			le.isBox(r)
				? (le.isWritableBox(r)
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
function da(t) {
	return le.isWritableBox(t)
		? {
				[bt]: !0,
				get current() {
					return t.current;
				}
			}
		: t;
}
le.from = ha;
le.with = fa;
le.flatten = pa;
le.readonly = da;
le.isBox = ca;
le.isWritableBox = ua;
function ga(t, e) {
	const n = RegExp(t, 'g');
	return (r) => {
		if (typeof r != 'string')
			throw new TypeError(`expected an argument of type string, but got ${typeof r}`);
		return r.match(n) ? r.replace(n, e) : r;
	};
}
const ma = ga(/[A-Z]/, (t) => `-${t.toLowerCase()}`);
function ya(t) {
	if (!t || typeof t != 'object' || Array.isArray(t))
		throw new TypeError(`expected an argument of type object, but got ${typeof t}`);
	return Object.keys(t).map((e) => `${ma(e)}: ${t[e]};`).join(`
`);
}
function _a(t = {}) {
	return ya(t).replace(
		`
`,
		' '
	);
}
const ba = {
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
_a(ba);
const wa = [
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
];
new Set(wa);
/*! @license DOMPurify 3.3.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.0/LICENSE */ var Rn,
	so;
function io() {
	if (so) return Rn;
	so = 1;
	const {
		entries: t,
		setPrototypeOf: e,
		isFrozen: n,
		getPrototypeOf: r,
		getOwnPropertyDescriptor: o
	} = Object;
	let { freeze: s, seal: i, create: l } = Object,
		{ apply: a, construct: c } = typeof Reflect < 'u' && Reflect;
	(s ||
		(s = function (E) {
			return E;
		}),
		i ||
			(i = function (E) {
				return E;
			}),
		a ||
			(a = function (E, L) {
				for (
					var I = arguments.length, D = new Array(I > 2 ? I - 2 : 0), oe = 2;
					oe < I;
					oe++
				)
					D[oe - 2] = arguments[oe];
				return E.apply(L, D);
			}),
		c ||
			(c = function (E) {
				for (var L = arguments.length, I = new Array(L > 1 ? L - 1 : 0), D = 1; D < L; D++)
					I[D - 1] = arguments[D];
				return new E(...I);
			}));
	const u = $(Array.prototype.forEach),
		f = $(Array.prototype.lastIndexOf),
		p = $(Array.prototype.pop),
		g = $(Array.prototype.push),
		d = $(Array.prototype.splice),
		C = $(String.prototype.toLowerCase),
		b = $(String.prototype.toString),
		w = $(String.prototype.match),
		_ = $(String.prototype.replace),
		A = $(String.prototype.indexOf),
		P = $(String.prototype.trim),
		v = $(Object.prototype.hasOwnProperty),
		O = $(RegExp.prototype.test),
		U = Be(TypeError);
	function $(N) {
		return function (E) {
			E instanceof RegExp && (E.lastIndex = 0);
			for (var L = arguments.length, I = new Array(L > 1 ? L - 1 : 0), D = 1; D < L; D++)
				I[D - 1] = arguments[D];
			return a(N, E, I);
		};
	}
	function Be(N) {
		return function () {
			for (var E = arguments.length, L = new Array(E), I = 0; I < E; I++) L[I] = arguments[I];
			return c(N, L);
		};
	}
	function T(N, E) {
		let L = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : C;
		e && e(N, null);
		let I = E.length;
		for (; I--; ) {
			let D = E[I];
			if (typeof D == 'string') {
				const oe = L(D);
				oe !== D && (n(E) || (E[I] = oe), (D = oe));
			}
			N[D] = !0;
		}
		return N;
	}
	function Re(N) {
		for (let E = 0; E < N.length; E++) v(N, E) || (N[E] = null);
		return N;
	}
	function V(N) {
		const E = l(null);
		for (const [L, I] of t(N))
			v(N, L) &&
				(Array.isArray(I)
					? (E[L] = Re(I))
					: I && typeof I == 'object' && I.constructor === Object
						? (E[L] = V(I))
						: (E[L] = I));
		return E;
	}
	function ke(N, E) {
		for (; N !== null; ) {
			const I = o(N, E);
			if (I) {
				if (I.get) return $(I.get);
				if (typeof I.value == 'function') return $(I.value);
			}
			N = r(N);
		}
		function L() {
			return null;
		}
		return L;
	}
	const ce = s([
			'a',
			'abbr',
			'acronym',
			'address',
			'area',
			'article',
			'aside',
			'audio',
			'b',
			'bdi',
			'bdo',
			'big',
			'blink',
			'blockquote',
			'body',
			'br',
			'button',
			'canvas',
			'caption',
			'center',
			'cite',
			'code',
			'col',
			'colgroup',
			'content',
			'data',
			'datalist',
			'dd',
			'decorator',
			'del',
			'details',
			'dfn',
			'dialog',
			'dir',
			'div',
			'dl',
			'dt',
			'element',
			'em',
			'fieldset',
			'figcaption',
			'figure',
			'font',
			'footer',
			'form',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'head',
			'header',
			'hgroup',
			'hr',
			'html',
			'i',
			'img',
			'input',
			'ins',
			'kbd',
			'label',
			'legend',
			'li',
			'main',
			'map',
			'mark',
			'marquee',
			'menu',
			'menuitem',
			'meter',
			'nav',
			'nobr',
			'ol',
			'optgroup',
			'option',
			'output',
			'p',
			'picture',
			'pre',
			'progress',
			'q',
			'rp',
			'rt',
			'ruby',
			's',
			'samp',
			'search',
			'section',
			'select',
			'shadow',
			'slot',
			'small',
			'source',
			'spacer',
			'span',
			'strike',
			'strong',
			'style',
			'sub',
			'summary',
			'sup',
			'table',
			'tbody',
			'td',
			'template',
			'textarea',
			'tfoot',
			'th',
			'thead',
			'time',
			'tr',
			'track',
			'tt',
			'u',
			'ul',
			'var',
			'video',
			'wbr'
		]),
		de = s([
			'svg',
			'a',
			'altglyph',
			'altglyphdef',
			'altglyphitem',
			'animatecolor',
			'animatemotion',
			'animatetransform',
			'circle',
			'clippath',
			'defs',
			'desc',
			'ellipse',
			'enterkeyhint',
			'exportparts',
			'filter',
			'font',
			'g',
			'glyph',
			'glyphref',
			'hkern',
			'image',
			'inputmode',
			'line',
			'lineargradient',
			'marker',
			'mask',
			'metadata',
			'mpath',
			'part',
			'path',
			'pattern',
			'polygon',
			'polyline',
			'radialgradient',
			'rect',
			'stop',
			'style',
			'switch',
			'symbol',
			'text',
			'textpath',
			'title',
			'tref',
			'tspan',
			'view',
			'vkern'
		]),
		Ie = s([
			'feBlend',
			'feColorMatrix',
			'feComponentTransfer',
			'feComposite',
			'feConvolveMatrix',
			'feDiffuseLighting',
			'feDisplacementMap',
			'feDistantLight',
			'feDropShadow',
			'feFlood',
			'feFuncA',
			'feFuncB',
			'feFuncG',
			'feFuncR',
			'feGaussianBlur',
			'feImage',
			'feMerge',
			'feMergeNode',
			'feMorphology',
			'feOffset',
			'fePointLight',
			'feSpecularLighting',
			'feSpotLight',
			'feTile',
			'feTurbulence'
		]),
		ci = s([
			'animate',
			'color-profile',
			'cursor',
			'discard',
			'font-face',
			'font-face-format',
			'font-face-name',
			'font-face-src',
			'font-face-uri',
			'foreignobject',
			'hatch',
			'hatchpath',
			'mesh',
			'meshgradient',
			'meshpatch',
			'meshrow',
			'missing-glyph',
			'script',
			'set',
			'solidcolor',
			'unknown',
			'use'
		]),
		fn = s([
			'math',
			'menclose',
			'merror',
			'mfenced',
			'mfrac',
			'mglyph',
			'mi',
			'mlabeledtr',
			'mmultiscripts',
			'mn',
			'mo',
			'mover',
			'mpadded',
			'mphantom',
			'mroot',
			'mrow',
			'ms',
			'mspace',
			'msqrt',
			'mstyle',
			'msub',
			'msup',
			'msubsup',
			'mtable',
			'mtd',
			'mtext',
			'mtr',
			'munder',
			'munderover',
			'mprescripts'
		]),
		ui = s([
			'maction',
			'maligngroup',
			'malignmark',
			'mlongdiv',
			'mscarries',
			'mscarry',
			'msgroup',
			'mstack',
			'msline',
			'msrow',
			'semantics',
			'annotation',
			'annotation-xml',
			'mprescripts',
			'none'
		]),
		Ar = s(['#text']),
		kr = s([
			'accept',
			'action',
			'align',
			'alt',
			'autocapitalize',
			'autocomplete',
			'autopictureinpicture',
			'autoplay',
			'background',
			'bgcolor',
			'border',
			'capture',
			'cellpadding',
			'cellspacing',
			'checked',
			'cite',
			'class',
			'clear',
			'color',
			'cols',
			'colspan',
			'controls',
			'controlslist',
			'coords',
			'crossorigin',
			'datetime',
			'decoding',
			'default',
			'dir',
			'disabled',
			'disablepictureinpicture',
			'disableremoteplayback',
			'download',
			'draggable',
			'enctype',
			'enterkeyhint',
			'exportparts',
			'face',
			'for',
			'headers',
			'height',
			'hidden',
			'high',
			'href',
			'hreflang',
			'id',
			'inert',
			'inputmode',
			'integrity',
			'ismap',
			'kind',
			'label',
			'lang',
			'list',
			'loading',
			'loop',
			'low',
			'max',
			'maxlength',
			'media',
			'method',
			'min',
			'minlength',
			'multiple',
			'muted',
			'name',
			'nonce',
			'noshade',
			'novalidate',
			'nowrap',
			'open',
			'optimum',
			'part',
			'pattern',
			'placeholder',
			'playsinline',
			'popover',
			'popovertarget',
			'popovertargetaction',
			'poster',
			'preload',
			'pubdate',
			'radiogroup',
			'readonly',
			'rel',
			'required',
			'rev',
			'reversed',
			'role',
			'rows',
			'rowspan',
			'spellcheck',
			'scope',
			'selected',
			'shape',
			'size',
			'sizes',
			'slot',
			'span',
			'srclang',
			'start',
			'src',
			'srcset',
			'step',
			'style',
			'summary',
			'tabindex',
			'title',
			'translate',
			'type',
			'usemap',
			'valign',
			'value',
			'width',
			'wrap',
			'xmlns',
			'slot'
		]),
		hn = s([
			'accent-height',
			'accumulate',
			'additive',
			'alignment-baseline',
			'amplitude',
			'ascent',
			'attributename',
			'attributetype',
			'azimuth',
			'basefrequency',
			'baseline-shift',
			'begin',
			'bias',
			'by',
			'class',
			'clip',
			'clippathunits',
			'clip-path',
			'clip-rule',
			'color',
			'color-interpolation',
			'color-interpolation-filters',
			'color-profile',
			'color-rendering',
			'cx',
			'cy',
			'd',
			'dx',
			'dy',
			'diffuseconstant',
			'direction',
			'display',
			'divisor',
			'dur',
			'edgemode',
			'elevation',
			'end',
			'exponent',
			'fill',
			'fill-opacity',
			'fill-rule',
			'filter',
			'filterunits',
			'flood-color',
			'flood-opacity',
			'font-family',
			'font-size',
			'font-size-adjust',
			'font-stretch',
			'font-style',
			'font-variant',
			'font-weight',
			'fx',
			'fy',
			'g1',
			'g2',
			'glyph-name',
			'glyphref',
			'gradientunits',
			'gradienttransform',
			'height',
			'href',
			'id',
			'image-rendering',
			'in',
			'in2',
			'intercept',
			'k',
			'k1',
			'k2',
			'k3',
			'k4',
			'kerning',
			'keypoints',
			'keysplines',
			'keytimes',
			'lang',
			'lengthadjust',
			'letter-spacing',
			'kernelmatrix',
			'kernelunitlength',
			'lighting-color',
			'local',
			'marker-end',
			'marker-mid',
			'marker-start',
			'markerheight',
			'markerunits',
			'markerwidth',
			'maskcontentunits',
			'maskunits',
			'max',
			'mask',
			'mask-type',
			'media',
			'method',
			'mode',
			'min',
			'name',
			'numoctaves',
			'offset',
			'operator',
			'opacity',
			'order',
			'orient',
			'orientation',
			'origin',
			'overflow',
			'paint-order',
			'path',
			'pathlength',
			'patterncontentunits',
			'patterntransform',
			'patternunits',
			'points',
			'preservealpha',
			'preserveaspectratio',
			'primitiveunits',
			'r',
			'rx',
			'ry',
			'radius',
			'refx',
			'refy',
			'repeatcount',
			'repeatdur',
			'restart',
			'result',
			'rotate',
			'scale',
			'seed',
			'shape-rendering',
			'slope',
			'specularconstant',
			'specularexponent',
			'spreadmethod',
			'startoffset',
			'stddeviation',
			'stitchtiles',
			'stop-color',
			'stop-opacity',
			'stroke-dasharray',
			'stroke-dashoffset',
			'stroke-linecap',
			'stroke-linejoin',
			'stroke-miterlimit',
			'stroke-opacity',
			'stroke',
			'stroke-width',
			'style',
			'surfacescale',
			'systemlanguage',
			'tabindex',
			'tablevalues',
			'targetx',
			'targety',
			'transform',
			'transform-origin',
			'text-anchor',
			'text-decoration',
			'text-rendering',
			'textlength',
			'type',
			'u1',
			'u2',
			'unicode',
			'values',
			'viewbox',
			'visibility',
			'version',
			'vert-adv-y',
			'vert-origin-x',
			'vert-origin-y',
			'width',
			'word-spacing',
			'wrap',
			'writing-mode',
			'xchannelselector',
			'ychannelselector',
			'x',
			'x1',
			'x2',
			'xmlns',
			'y',
			'y1',
			'y2',
			'z',
			'zoomandpan'
		]),
		vr = s([
			'accent',
			'accentunder',
			'align',
			'bevelled',
			'close',
			'columnsalign',
			'columnlines',
			'columnspan',
			'denomalign',
			'depth',
			'dir',
			'display',
			'displaystyle',
			'encoding',
			'fence',
			'frame',
			'height',
			'href',
			'id',
			'largeop',
			'length',
			'linethickness',
			'lspace',
			'lquote',
			'mathbackground',
			'mathcolor',
			'mathsize',
			'mathvariant',
			'maxsize',
			'minsize',
			'movablelimits',
			'notation',
			'numalign',
			'open',
			'rowalign',
			'rowlines',
			'rowspacing',
			'rowspan',
			'rspace',
			'rquote',
			'scriptlevel',
			'scriptminsize',
			'scriptsizemultiplier',
			'selection',
			'separator',
			'separators',
			'stretchy',
			'subscriptshift',
			'supscriptshift',
			'symmetric',
			'voffset',
			'width',
			'xmlns'
		]),
		Tt = s(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']),
		fi = i(/\{\{[\w\W]*|[\w\W]*\}\}/gm),
		hi = i(/<%[\w\W]*|[\w\W]*%>/gm),
		pi = i(/\$\{[\w\W]*/gm),
		di = i(/^data-[\-\w.\u00B7-\uFFFF]+$/),
		gi = i(/^aria-[\-\w]+$/),
		xr = i(
			/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
		),
		mi = i(/^(?:\w+script|data):/i),
		yi = i(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),
		Tr = i(/^html$/i),
		_i = i(/^[a-z][.\w]*(-[.\w]+)+$/i);
	var Rr = Object.freeze({
		__proto__: null,
		ARIA_ATTR: gi,
		ATTR_WHITESPACE: yi,
		CUSTOM_ELEMENT: _i,
		DATA_ATTR: di,
		DOCTYPE_NAME: Tr,
		ERB_EXPR: hi,
		IS_ALLOWED_URI: xr,
		IS_SCRIPT_OR_DATA: mi,
		MUSTACHE_EXPR: fi,
		TMPLIT_EXPR: pi
	});
	const lt = { element: 1, text: 3, progressingInstruction: 7, comment: 8, document: 9 },
		bi = function () {
			return typeof window > 'u' ? null : window;
		},
		wi = function (E, L) {
			if (typeof E != 'object' || typeof E.createPolicy != 'function') return null;
			let I = null;
			const D = 'data-tt-policy-suffix';
			L && L.hasAttribute(D) && (I = L.getAttribute(D));
			const oe = 'dompurify' + (I ? '#' + I : '');
			try {
				return E.createPolicy(oe, {
					createHTML(Ue) {
						return Ue;
					},
					createScriptURL(Ue) {
						return Ue;
					}
				});
			} catch {
				return (console.warn('TrustedTypes policy ' + oe + ' could not be created.'), null);
			}
		},
		Ir = function () {
			return {
				afterSanitizeAttributes: [],
				afterSanitizeElements: [],
				afterSanitizeShadowDOM: [],
				beforeSanitizeAttributes: [],
				beforeSanitizeElements: [],
				beforeSanitizeShadowDOM: [],
				uponSanitizeAttribute: [],
				uponSanitizeElement: [],
				uponSanitizeShadowNode: []
			};
		};
	function Nr() {
		let N = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : bi();
		const E = (k) => Nr(k);
		if (
			((E.version = '3.3.0'),
			(E.removed = []),
			!N || !N.document || N.document.nodeType !== lt.document || !N.Element)
		)
			return ((E.isSupported = !1), E);
		let { document: L } = N;
		const I = L,
			D = I.currentScript,
			{
				DocumentFragment: oe,
				HTMLTemplateElement: Ue,
				Node: pn,
				Element: Lr,
				NodeFilter: ct,
				NamedNodeMap: Si = N.NamedNodeMap || N.MozNamedAttrMap,
				HTMLFormElement: Ei,
				DOMParser: Ai,
				trustedTypes: Rt
			} = N,
			ut = Lr.prototype,
			ki = ke(ut, 'cloneNode'),
			vi = ke(ut, 'remove'),
			xi = ke(ut, 'nextSibling'),
			Ti = ke(ut, 'childNodes'),
			It = ke(ut, 'parentNode');
		if (typeof Ue == 'function') {
			const k = L.createElement('template');
			k.content && k.content.ownerDocument && (L = k.content.ownerDocument);
		}
		let ne,
			ft = '';
		const {
				implementation: dn,
				createNodeIterator: Ri,
				createDocumentFragment: Ii,
				getElementsByTagName: Ni
			} = L,
			{ importNode: Li } = I;
		let re = Ir();
		E.isSupported =
			typeof t == 'function' &&
			typeof It == 'function' &&
			dn &&
			dn.createHTMLDocument !== void 0;
		const {
			MUSTACHE_EXPR: gn,
			ERB_EXPR: mn,
			TMPLIT_EXPR: yn,
			DATA_ATTR: Pi,
			ARIA_ATTR: Oi,
			IS_SCRIPT_OR_DATA: Mi,
			ATTR_WHITESPACE: Pr,
			CUSTOM_ELEMENT: $i
		} = Rr;
		let { IS_ALLOWED_URI: Or } = Rr,
			q = null;
		const Mr = T({}, [...ce, ...de, ...Ie, ...fn, ...Ar]);
		let Z = null;
		const $r = T({}, [...kr, ...hn, ...vr, ...Tt]);
		let F = Object.seal(
				l(null, {
					tagNameCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
					attributeNameCheck: {
						writable: !0,
						configurable: !1,
						enumerable: !0,
						value: null
					},
					allowCustomizedBuiltInElements: {
						writable: !0,
						configurable: !1,
						enumerable: !0,
						value: !1
					}
				})
			),
			ht = null,
			_n = null;
		const je = Object.seal(
			l(null, {
				tagCheck: { writable: !0, configurable: !1, enumerable: !0, value: null },
				attributeCheck: { writable: !0, configurable: !1, enumerable: !0, value: null }
			})
		);
		let Dr = !0,
			bn = !0,
			Gr = !1,
			Fr = !0,
			ze = !1,
			Nt = !0,
			Ne = !1,
			wn = !1,
			Cn = !1,
			We = !1,
			Lt = !1,
			Pt = !1,
			Br = !0,
			Ur = !1;
		const Di = 'user-content-';
		let Sn = !0,
			pt = !1,
			He = {},
			Ve = null;
		const jr = T({}, [
			'annotation-xml',
			'audio',
			'colgroup',
			'desc',
			'foreignobject',
			'head',
			'iframe',
			'math',
			'mi',
			'mn',
			'mo',
			'ms',
			'mtext',
			'noembed',
			'noframes',
			'noscript',
			'plaintext',
			'script',
			'style',
			'svg',
			'template',
			'thead',
			'title',
			'video',
			'xmp'
		]);
		let zr = null;
		const Wr = T({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
		let En = null;
		const Hr = T({}, [
				'alt',
				'class',
				'for',
				'id',
				'label',
				'name',
				'pattern',
				'placeholder',
				'role',
				'summary',
				'title',
				'value',
				'style',
				'xmlns'
			]),
			Ot = 'http://www.w3.org/1998/Math/MathML',
			Mt = 'http://www.w3.org/2000/svg',
			ye = 'http://www.w3.org/1999/xhtml';
		let qe = ye,
			An = !1,
			kn = null;
		const Gi = T({}, [Ot, Mt, ye], b);
		let $t = T({}, ['mi', 'mo', 'mn', 'ms', 'mtext']),
			Dt = T({}, ['annotation-xml']);
		const Fi = T({}, ['title', 'style', 'font', 'a', 'script']);
		let dt = null;
		const Bi = ['application/xhtml+xml', 'text/html'],
			Ui = 'text/html';
		let X = null,
			Xe = null;
		const ji = L.createElement('form'),
			Vr = function (h) {
				return h instanceof RegExp || h instanceof Function;
			},
			vn = function () {
				let h = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
				if (!(Xe && Xe === h)) {
					if (
						((!h || typeof h != 'object') && (h = {}),
						(h = V(h)),
						(dt = Bi.indexOf(h.PARSER_MEDIA_TYPE) === -1 ? Ui : h.PARSER_MEDIA_TYPE),
						(X = dt === 'application/xhtml+xml' ? b : C),
						(q = v(h, 'ALLOWED_TAGS') ? T({}, h.ALLOWED_TAGS, X) : Mr),
						(Z = v(h, 'ALLOWED_ATTR') ? T({}, h.ALLOWED_ATTR, X) : $r),
						(kn = v(h, 'ALLOWED_NAMESPACES') ? T({}, h.ALLOWED_NAMESPACES, b) : Gi),
						(En = v(h, 'ADD_URI_SAFE_ATTR') ? T(V(Hr), h.ADD_URI_SAFE_ATTR, X) : Hr),
						(zr = v(h, 'ADD_DATA_URI_TAGS') ? T(V(Wr), h.ADD_DATA_URI_TAGS, X) : Wr),
						(Ve = v(h, 'FORBID_CONTENTS') ? T({}, h.FORBID_CONTENTS, X) : jr),
						(ht = v(h, 'FORBID_TAGS') ? T({}, h.FORBID_TAGS, X) : V({})),
						(_n = v(h, 'FORBID_ATTR') ? T({}, h.FORBID_ATTR, X) : V({})),
						(He = v(h, 'USE_PROFILES') ? h.USE_PROFILES : !1),
						(Dr = h.ALLOW_ARIA_ATTR !== !1),
						(bn = h.ALLOW_DATA_ATTR !== !1),
						(Gr = h.ALLOW_UNKNOWN_PROTOCOLS || !1),
						(Fr = h.ALLOW_SELF_CLOSE_IN_ATTR !== !1),
						(ze = h.SAFE_FOR_TEMPLATES || !1),
						(Nt = h.SAFE_FOR_XML !== !1),
						(Ne = h.WHOLE_DOCUMENT || !1),
						(We = h.RETURN_DOM || !1),
						(Lt = h.RETURN_DOM_FRAGMENT || !1),
						(Pt = h.RETURN_TRUSTED_TYPE || !1),
						(Cn = h.FORCE_BODY || !1),
						(Br = h.SANITIZE_DOM !== !1),
						(Ur = h.SANITIZE_NAMED_PROPS || !1),
						(Sn = h.KEEP_CONTENT !== !1),
						(pt = h.IN_PLACE || !1),
						(Or = h.ALLOWED_URI_REGEXP || xr),
						(qe = h.NAMESPACE || ye),
						($t = h.MATHML_TEXT_INTEGRATION_POINTS || $t),
						(Dt = h.HTML_INTEGRATION_POINTS || Dt),
						(F = h.CUSTOM_ELEMENT_HANDLING || {}),
						h.CUSTOM_ELEMENT_HANDLING &&
							Vr(h.CUSTOM_ELEMENT_HANDLING.tagNameCheck) &&
							(F.tagNameCheck = h.CUSTOM_ELEMENT_HANDLING.tagNameCheck),
						h.CUSTOM_ELEMENT_HANDLING &&
							Vr(h.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) &&
							(F.attributeNameCheck = h.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),
						h.CUSTOM_ELEMENT_HANDLING &&
							typeof h.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements ==
								'boolean' &&
							(F.allowCustomizedBuiltInElements =
								h.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),
						ze && (bn = !1),
						Lt && (We = !0),
						He &&
							((q = T({}, Ar)),
							(Z = []),
							He.html === !0 && (T(q, ce), T(Z, kr)),
							He.svg === !0 && (T(q, de), T(Z, hn), T(Z, Tt)),
							He.svgFilters === !0 && (T(q, Ie), T(Z, hn), T(Z, Tt)),
							He.mathMl === !0 && (T(q, fn), T(Z, vr), T(Z, Tt))),
						h.ADD_TAGS &&
							(typeof h.ADD_TAGS == 'function'
								? (je.tagCheck = h.ADD_TAGS)
								: (q === Mr && (q = V(q)), T(q, h.ADD_TAGS, X))),
						h.ADD_ATTR &&
							(typeof h.ADD_ATTR == 'function'
								? (je.attributeCheck = h.ADD_ATTR)
								: (Z === $r && (Z = V(Z)), T(Z, h.ADD_ATTR, X))),
						h.ADD_URI_SAFE_ATTR && T(En, h.ADD_URI_SAFE_ATTR, X),
						h.FORBID_CONTENTS &&
							(Ve === jr && (Ve = V(Ve)), T(Ve, h.FORBID_CONTENTS, X)),
						Sn && (q['#text'] = !0),
						Ne && T(q, ['html', 'head', 'body']),
						q.table && (T(q, ['tbody']), delete ht.tbody),
						h.TRUSTED_TYPES_POLICY)
					) {
						if (typeof h.TRUSTED_TYPES_POLICY.createHTML != 'function')
							throw U(
								'TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.'
							);
						if (typeof h.TRUSTED_TYPES_POLICY.createScriptURL != 'function')
							throw U(
								'TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.'
							);
						((ne = h.TRUSTED_TYPES_POLICY), (ft = ne.createHTML('')));
					} else
						(ne === void 0 && (ne = wi(Rt, D)),
							ne !== null && typeof ft == 'string' && (ft = ne.createHTML('')));
					(s && s(h), (Xe = h));
				}
			},
			qr = T({}, [...de, ...Ie, ...ci]),
			Xr = T({}, [...fn, ...ui]),
			zi = function (h) {
				let y = It(h);
				(!y || !y.tagName) && (y = { namespaceURI: qe, tagName: 'template' });
				const S = C(h.tagName),
					G = C(y.tagName);
				return kn[h.namespaceURI]
					? h.namespaceURI === Mt
						? y.namespaceURI === ye
							? S === 'svg'
							: y.namespaceURI === Ot
								? S === 'svg' && (G === 'annotation-xml' || $t[G])
								: !!qr[S]
						: h.namespaceURI === Ot
							? y.namespaceURI === ye
								? S === 'math'
								: y.namespaceURI === Mt
									? S === 'math' && Dt[G]
									: !!Xr[S]
							: h.namespaceURI === ye
								? (y.namespaceURI === Mt && !Dt[G]) ||
									(y.namespaceURI === Ot && !$t[G])
									? !1
									: !Xr[S] && (Fi[S] || !qr[S])
								: !!(dt === 'application/xhtml+xml' && kn[h.namespaceURI])
					: !1;
			},
			ge = function (h) {
				g(E.removed, { element: h });
				try {
					It(h).removeChild(h);
				} catch {
					vi(h);
				}
			},
			Le = function (h, y) {
				try {
					g(E.removed, { attribute: y.getAttributeNode(h), from: y });
				} catch {
					g(E.removed, { attribute: null, from: y });
				}
				if ((y.removeAttribute(h), h === 'is'))
					if (We || Lt)
						try {
							ge(y);
						} catch {}
					else
						try {
							y.setAttribute(h, '');
						} catch {}
			},
			Yr = function (h) {
				let y = null,
					S = null;
				if (Cn) h = '<remove></remove>' + h;
				else {
					const j = w(h, /^[\r\n\t ]+/);
					S = j && j[0];
				}
				dt === 'application/xhtml+xml' &&
					qe === ye &&
					(h =
						'<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' +
						h +
						'</body></html>');
				const G = ne ? ne.createHTML(h) : h;
				if (qe === ye)
					try {
						y = new Ai().parseFromString(G, dt);
					} catch {}
				if (!y || !y.documentElement) {
					y = dn.createDocument(qe, 'template', null);
					try {
						y.documentElement.innerHTML = An ? ft : G;
					} catch {}
				}
				const J = y.body || y.documentElement;
				return (
					h && S && J.insertBefore(L.createTextNode(S), J.childNodes[0] || null),
					qe === ye ? Ni.call(y, Ne ? 'html' : 'body')[0] : Ne ? y.documentElement : J
				);
			},
			Kr = function (h) {
				return Ri.call(
					h.ownerDocument || h,
					h,
					ct.SHOW_ELEMENT |
						ct.SHOW_COMMENT |
						ct.SHOW_TEXT |
						ct.SHOW_PROCESSING_INSTRUCTION |
						ct.SHOW_CDATA_SECTION,
					null
				);
			},
			xn = function (h) {
				return (
					h instanceof Ei &&
					(typeof h.nodeName != 'string' ||
						typeof h.textContent != 'string' ||
						typeof h.removeChild != 'function' ||
						!(h.attributes instanceof Si) ||
						typeof h.removeAttribute != 'function' ||
						typeof h.setAttribute != 'function' ||
						typeof h.namespaceURI != 'string' ||
						typeof h.insertBefore != 'function' ||
						typeof h.hasChildNodes != 'function')
				);
			},
			Zr = function (h) {
				return typeof pn == 'function' && h instanceof pn;
			};
		function _e(k, h, y) {
			u(k, (S) => {
				S.call(E, h, y, Xe);
			});
		}
		const Qr = function (h) {
				let y = null;
				if ((_e(re.beforeSanitizeElements, h, null), xn(h))) return (ge(h), !0);
				const S = X(h.nodeName);
				if (
					(_e(re.uponSanitizeElement, h, { tagName: S, allowedTags: q }),
					(Nt &&
						h.hasChildNodes() &&
						!Zr(h.firstElementChild) &&
						O(/<[/\w!]/g, h.innerHTML) &&
						O(/<[/\w!]/g, h.textContent)) ||
						h.nodeType === lt.progressingInstruction ||
						(Nt && h.nodeType === lt.comment && O(/<[/\w]/g, h.data)))
				)
					return (ge(h), !0);
				if (!(je.tagCheck instanceof Function && je.tagCheck(S)) && (!q[S] || ht[S])) {
					if (
						!ht[S] &&
						eo(S) &&
						((F.tagNameCheck instanceof RegExp && O(F.tagNameCheck, S)) ||
							(F.tagNameCheck instanceof Function && F.tagNameCheck(S)))
					)
						return !1;
					if (Sn && !Ve[S]) {
						const G = It(h) || h.parentNode,
							J = Ti(h) || h.childNodes;
						if (J && G) {
							const j = J.length;
							for (let se = j - 1; se >= 0; --se) {
								const be = ki(J[se], !0);
								((be.__removalCount = (h.__removalCount || 0) + 1),
									G.insertBefore(be, xi(h)));
							}
						}
					}
					return (ge(h), !0);
				}
				return (h instanceof Lr && !zi(h)) ||
					((S === 'noscript' || S === 'noembed' || S === 'noframes') &&
						O(/<\/no(script|embed|frames)/i, h.innerHTML))
					? (ge(h), !0)
					: (ze &&
							h.nodeType === lt.text &&
							((y = h.textContent),
							u([gn, mn, yn], (G) => {
								y = _(y, G, ' ');
							}),
							h.textContent !== y &&
								(g(E.removed, { element: h.cloneNode() }), (h.textContent = y))),
						_e(re.afterSanitizeElements, h, null),
						!1);
			},
			Jr = function (h, y, S) {
				if (Br && (y === 'id' || y === 'name') && (S in L || S in ji)) return !1;
				if (!(bn && !_n[y] && O(Pi, y))) {
					if (!(Dr && O(Oi, y))) {
						if (!(je.attributeCheck instanceof Function && je.attributeCheck(y, h))) {
							if (!Z[y] || _n[y]) {
								if (
									!(
										(eo(h) &&
											((F.tagNameCheck instanceof RegExp &&
												O(F.tagNameCheck, h)) ||
												(F.tagNameCheck instanceof Function &&
													F.tagNameCheck(h))) &&
											((F.attributeNameCheck instanceof RegExp &&
												O(F.attributeNameCheck, y)) ||
												(F.attributeNameCheck instanceof Function &&
													F.attributeNameCheck(y, h)))) ||
										(y === 'is' &&
											F.allowCustomizedBuiltInElements &&
											((F.tagNameCheck instanceof RegExp &&
												O(F.tagNameCheck, S)) ||
												(F.tagNameCheck instanceof Function &&
													F.tagNameCheck(S))))
									)
								)
									return !1;
							} else if (!En[y]) {
								if (!O(Or, _(S, Pr, ''))) {
									if (
										!(
											(y === 'src' || y === 'xlink:href' || y === 'href') &&
											h !== 'script' &&
											A(S, 'data:') === 0 &&
											zr[h]
										)
									) {
										if (!(Gr && !O(Mi, _(S, Pr, '')))) {
											if (S) return !1;
										}
									}
								}
							}
						}
					}
				}
				return !0;
			},
			eo = function (h) {
				return h !== 'annotation-xml' && w(h, $i);
			},
			to = function (h) {
				_e(re.beforeSanitizeAttributes, h, null);
				const { attributes: y } = h;
				if (!y || xn(h)) return;
				const S = {
					attrName: '',
					attrValue: '',
					keepAttr: !0,
					allowedAttributes: Z,
					forceKeepAttr: void 0
				};
				let G = y.length;
				for (; G--; ) {
					const J = y[G],
						{ name: j, namespaceURI: se, value: be } = J,
						Ye = X(j),
						Tn = be;
					let Q = j === 'value' ? Tn : P(Tn);
					if (
						((S.attrName = Ye),
						(S.attrValue = Q),
						(S.keepAttr = !0),
						(S.forceKeepAttr = void 0),
						_e(re.uponSanitizeAttribute, h, S),
						(Q = S.attrValue),
						Ur && (Ye === 'id' || Ye === 'name') && (Le(j, h), (Q = Di + Q)),
						Nt && O(/((--!?|])>)|<\/(style|title|textarea)/i, Q))
					) {
						Le(j, h);
						continue;
					}
					if (Ye === 'attributename' && w(Q, 'href')) {
						Le(j, h);
						continue;
					}
					if (S.forceKeepAttr) continue;
					if (!S.keepAttr) {
						Le(j, h);
						continue;
					}
					if (!Fr && O(/\/>/i, Q)) {
						Le(j, h);
						continue;
					}
					ze &&
						u([gn, mn, yn], (ro) => {
							Q = _(Q, ro, ' ');
						});
					const no = X(h.nodeName);
					if (!Jr(no, Ye, Q)) {
						Le(j, h);
						continue;
					}
					if (
						ne &&
						typeof Rt == 'object' &&
						typeof Rt.getAttributeType == 'function' &&
						!se
					)
						switch (Rt.getAttributeType(no, Ye)) {
							case 'TrustedHTML': {
								Q = ne.createHTML(Q);
								break;
							}
							case 'TrustedScriptURL': {
								Q = ne.createScriptURL(Q);
								break;
							}
						}
					if (Q !== Tn)
						try {
							(se ? h.setAttributeNS(se, j, Q) : h.setAttribute(j, Q),
								xn(h) ? ge(h) : p(E.removed));
						} catch {
							Le(j, h);
						}
				}
				_e(re.afterSanitizeAttributes, h, null);
			},
			Wi = function k(h) {
				let y = null;
				const S = Kr(h);
				for (_e(re.beforeSanitizeShadowDOM, h, null); (y = S.nextNode()); )
					(_e(re.uponSanitizeShadowNode, y, null),
						Qr(y),
						to(y),
						y.content instanceof oe && k(y.content));
				_e(re.afterSanitizeShadowDOM, h, null);
			};
		return (
			(E.sanitize = function (k) {
				let h = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
					y = null,
					S = null,
					G = null,
					J = null;
				if (((An = !k), An && (k = '<!-->'), typeof k != 'string' && !Zr(k)))
					if (typeof k.toString == 'function') {
						if (((k = k.toString()), typeof k != 'string'))
							throw U('dirty is not a string, aborting');
					} else throw U('toString is not a function');
				if (!E.isSupported) return k;
				if ((wn || vn(h), (E.removed = []), typeof k == 'string' && (pt = !1), pt)) {
					if (k.nodeName) {
						const be = X(k.nodeName);
						if (!q[be] || ht[be])
							throw U('root node is forbidden and cannot be sanitized in-place');
					}
				} else if (k instanceof pn)
					((y = Yr('<!---->')),
						(S = y.ownerDocument.importNode(k, !0)),
						(S.nodeType === lt.element && S.nodeName === 'BODY') ||
						S.nodeName === 'HTML'
							? (y = S)
							: y.appendChild(S));
				else {
					if (!We && !ze && !Ne && k.indexOf('<') === -1)
						return ne && Pt ? ne.createHTML(k) : k;
					if (((y = Yr(k)), !y)) return We ? null : Pt ? ft : '';
				}
				y && Cn && ge(y.firstChild);
				const j = Kr(pt ? k : y);
				for (; (G = j.nextNode()); )
					(Qr(G), to(G), G.content instanceof oe && Wi(G.content));
				if (pt) return k;
				if (We) {
					if (Lt)
						for (J = Ii.call(y.ownerDocument); y.firstChild; )
							J.appendChild(y.firstChild);
					else J = y;
					return ((Z.shadowroot || Z.shadowrootmode) && (J = Li.call(I, J, !0)), J);
				}
				let se = Ne ? y.outerHTML : y.innerHTML;
				return (
					Ne &&
						q['!doctype'] &&
						y.ownerDocument &&
						y.ownerDocument.doctype &&
						y.ownerDocument.doctype.name &&
						O(Tr, y.ownerDocument.doctype.name) &&
						(se =
							'<!DOCTYPE ' +
							y.ownerDocument.doctype.name +
							`>
` +
							se),
					ze &&
						u([gn, mn, yn], (be) => {
							se = _(se, be, ' ');
						}),
					ne && Pt ? ne.createHTML(se) : se
				);
			}),
			(E.setConfig = function () {
				let k = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
				(vn(k), (wn = !0));
			}),
			(E.clearConfig = function () {
				((Xe = null), (wn = !1));
			}),
			(E.isValidAttribute = function (k, h, y) {
				Xe || vn({});
				const S = X(k),
					G = X(h);
				return Jr(S, G, y);
			}),
			(E.addHook = function (k, h) {
				typeof h == 'function' && g(re[k], h);
			}),
			(E.removeHook = function (k, h) {
				if (h !== void 0) {
					const y = f(re[k], h);
					return y === -1 ? void 0 : d(re[k], y, 1)[0];
				}
				return p(re[k]);
			}),
			(E.removeHooks = function (k) {
				re[k] = [];
			}),
			(E.removeAllHooks = function () {
				re = Ir();
			}),
			E
		);
	}
	var Ci = Nr();
	return ((Rn = Ci), Rn);
}
var In, ao;
function Ca() {
	return (
		ao || ((ao = 1), (In = window.DOMPurify || (window.DOMPurify = io().default || io()))),
		In
	);
}
var Sa = Ca();
const ih = na(Sa);
let Y = class extends Error {
	constructor(e) {
		(super(e), (this.name = 'ShikiError'));
	}
};
function Ea(t) {
	return ur(t);
}
function ur(t) {
	return Array.isArray(t) ? Aa(t) : t instanceof RegExp ? t : typeof t == 'object' ? ka(t) : t;
}
function Aa(t) {
	let e = [];
	for (let n = 0, r = t.length; n < r; n++) e[n] = ur(t[n]);
	return e;
}
function ka(t) {
	let e = {};
	for (let n in t) e[n] = ur(t[n]);
	return e;
}
function os(t, ...e) {
	return (
		e.forEach((n) => {
			for (let r in n) t[r] = n[r];
		}),
		t
	);
}
function ss(t) {
	const e = ~t.lastIndexOf('/') || ~t.lastIndexOf('\\');
	return e === 0 ? t : ~e === t.length - 1 ? ss(t.substring(0, t.length - 1)) : t.substr(~e + 1);
}
var Nn = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g,
	Gt = class {
		static hasCaptures(t) {
			return t === null ? !1 : ((Nn.lastIndex = 0), Nn.test(t));
		}
		static replaceCaptures(t, e, n) {
			return t.replace(Nn, (r, o, s, i) => {
				let l = n[parseInt(o || s, 10)];
				if (l) {
					let a = e.substring(l.start, l.end);
					for (; a[0] === '.'; ) a = a.substring(1);
					switch (i) {
						case 'downcase':
							return a.toLowerCase();
						case 'upcase':
							return a.toUpperCase();
						default:
							return a;
					}
				} else return r;
			});
		}
	};
function is(t, e) {
	return t < e ? -1 : t > e ? 1 : 0;
}
function as(t, e) {
	if (t === null && e === null) return 0;
	if (!t) return -1;
	if (!e) return 1;
	let n = t.length,
		r = e.length;
	if (n === r) {
		for (let o = 0; o < n; o++) {
			let s = is(t[o], e[o]);
			if (s !== 0) return s;
		}
		return 0;
	}
	return n - r;
}
function lo(t) {
	return !!(
		/^#[0-9a-f]{6}$/i.test(t) ||
		/^#[0-9a-f]{8}$/i.test(t) ||
		/^#[0-9a-f]{3}$/i.test(t) ||
		/^#[0-9a-f]{4}$/i.test(t)
	);
}
function ls(t) {
	return t.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
var cs = class {
		constructor(t) {
			this.fn = t;
		}
		cache = new Map();
		get(t) {
			if (this.cache.has(t)) return this.cache.get(t);
			const e = this.fn(t);
			return (this.cache.set(t, e), e);
		}
	},
	qt = class {
		constructor(t, e, n) {
			((this._colorMap = t), (this._defaults = e), (this._root = n));
		}
		static createFromRawTheme(t, e) {
			return this.createFromParsedTheme(Ta(t), e);
		}
		static createFromParsedTheme(t, e) {
			return Ia(t, e);
		}
		_cachedMatchRoot = new cs((t) => this._root.match(t));
		getColorMap() {
			return this._colorMap.getColorMap();
		}
		getDefaults() {
			return this._defaults;
		}
		match(t) {
			if (t === null) return this._defaults;
			const e = t.scopeName,
				r = this._cachedMatchRoot.get(e).find((o) => va(t.parent, o.parentScopes));
			return r ? new us(r.fontStyle, r.foreground, r.background) : null;
		}
	},
	Ln = class Wt {
		constructor(e, n) {
			((this.parent = e), (this.scopeName = n));
		}
		static push(e, n) {
			for (const r of n) e = new Wt(e, r);
			return e;
		}
		static from(...e) {
			let n = null;
			for (let r = 0; r < e.length; r++) n = new Wt(n, e[r]);
			return n;
		}
		push(e) {
			return new Wt(this, e);
		}
		getSegments() {
			let e = this;
			const n = [];
			for (; e; ) (n.push(e.scopeName), (e = e.parent));
			return (n.reverse(), n);
		}
		toString() {
			return this.getSegments().join(' ');
		}
		extends(e) {
			return this === e ? !0 : this.parent === null ? !1 : this.parent.extends(e);
		}
		getExtensionIfDefined(e) {
			const n = [];
			let r = this;
			for (; r && r !== e; ) (n.push(r.scopeName), (r = r.parent));
			return r === e ? n.reverse() : void 0;
		}
	};
function va(t, e) {
	if (e.length === 0) return !0;
	for (let n = 0; n < e.length; n++) {
		let r = e[n],
			o = !1;
		if (r === '>') {
			if (n === e.length - 1) return !1;
			((r = e[++n]), (o = !0));
		}
		for (; t && !xa(t.scopeName, r); ) {
			if (o) return !1;
			t = t.parent;
		}
		if (!t) return !1;
		t = t.parent;
	}
	return !0;
}
function xa(t, e) {
	return e === t || (t.startsWith(e) && t[e.length] === '.');
}
var us = class {
	constructor(t, e, n) {
		((this.fontStyle = t), (this.foregroundId = e), (this.backgroundId = n));
	}
};
function Ta(t) {
	if (!t) return [];
	if (!t.settings || !Array.isArray(t.settings)) return [];
	let e = t.settings,
		n = [],
		r = 0;
	for (let o = 0, s = e.length; o < s; o++) {
		let i = e[o];
		if (!i.settings) continue;
		let l;
		if (typeof i.scope == 'string') {
			let f = i.scope;
			((f = f.replace(/^[,]+/, '')), (f = f.replace(/[,]+$/, '')), (l = f.split(',')));
		} else Array.isArray(i.scope) ? (l = i.scope) : (l = ['']);
		let a = -1;
		if (typeof i.settings.fontStyle == 'string') {
			a = 0;
			let f = i.settings.fontStyle.split(' ');
			for (let p = 0, g = f.length; p < g; p++)
				switch (f[p]) {
					case 'italic':
						a = a | 1;
						break;
					case 'bold':
						a = a | 2;
						break;
					case 'underline':
						a = a | 4;
						break;
					case 'strikethrough':
						a = a | 8;
						break;
				}
		}
		let c = null;
		typeof i.settings.foreground == 'string' &&
			lo(i.settings.foreground) &&
			(c = i.settings.foreground);
		let u = null;
		typeof i.settings.background == 'string' &&
			lo(i.settings.background) &&
			(u = i.settings.background);
		for (let f = 0, p = l.length; f < p; f++) {
			let d = l[f].trim().split(' '),
				C = d[d.length - 1],
				b = null;
			(d.length > 1 && ((b = d.slice(0, d.length - 1)), b.reverse()),
				(n[r++] = new Ra(C, b, o, a, c, u)));
		}
	}
	return n;
}
var Ra = class {
		constructor(t, e, n, r, o, s) {
			((this.scope = t),
				(this.parentScopes = e),
				(this.index = n),
				(this.fontStyle = r),
				(this.foreground = o),
				(this.background = s));
		}
	},
	te = ((t) => (
		(t[(t.NotSet = -1)] = 'NotSet'),
		(t[(t.None = 0)] = 'None'),
		(t[(t.Italic = 1)] = 'Italic'),
		(t[(t.Bold = 2)] = 'Bold'),
		(t[(t.Underline = 4)] = 'Underline'),
		(t[(t.Strikethrough = 8)] = 'Strikethrough'),
		t
	))(te || {});
function Ia(t, e) {
	t.sort((a, c) => {
		let u = is(a.scope, c.scope);
		return u !== 0 || ((u = as(a.parentScopes, c.parentScopes)), u !== 0)
			? u
			: a.index - c.index;
	});
	let n = 0,
		r = '#000000',
		o = '#ffffff';
	for (; t.length >= 1 && t[0].scope === ''; ) {
		let a = t.shift();
		(a.fontStyle !== -1 && (n = a.fontStyle),
			a.foreground !== null && (r = a.foreground),
			a.background !== null && (o = a.background));
	}
	let s = new Na(e),
		i = new us(n, s.getId(r), s.getId(o)),
		l = new Pa(new Hn(0, null, -1, 0, 0), []);
	for (let a = 0, c = t.length; a < c; a++) {
		let u = t[a];
		l.insert(
			0,
			u.scope,
			u.parentScopes,
			u.fontStyle,
			s.getId(u.foreground),
			s.getId(u.background)
		);
	}
	return new qt(s, i, l);
}
var Na = class {
		_isFrozen;
		_lastColorId;
		_id2color;
		_color2id;
		constructor(t) {
			if (
				((this._lastColorId = 0),
				(this._id2color = []),
				(this._color2id = Object.create(null)),
				Array.isArray(t))
			) {
				this._isFrozen = !0;
				for (let e = 0, n = t.length; e < n; e++)
					((this._color2id[t[e]] = e), (this._id2color[e] = t[e]));
			} else this._isFrozen = !1;
		}
		getId(t) {
			if (t === null) return 0;
			t = t.toUpperCase();
			let e = this._color2id[t];
			if (e) return e;
			if (this._isFrozen) throw new Error(`Missing color in color map - ${t}`);
			return ((e = ++this._lastColorId), (this._color2id[t] = e), (this._id2color[e] = t), e);
		}
		getColorMap() {
			return this._id2color.slice(0);
		}
	},
	La = Object.freeze([]),
	Hn = class fs {
		scopeDepth;
		parentScopes;
		fontStyle;
		foreground;
		background;
		constructor(e, n, r, o, s) {
			((this.scopeDepth = e),
				(this.parentScopes = n || La),
				(this.fontStyle = r),
				(this.foreground = o),
				(this.background = s));
		}
		clone() {
			return new fs(
				this.scopeDepth,
				this.parentScopes,
				this.fontStyle,
				this.foreground,
				this.background
			);
		}
		static cloneArr(e) {
			let n = [];
			for (let r = 0, o = e.length; r < o; r++) n[r] = e[r].clone();
			return n;
		}
		acceptOverwrite(e, n, r, o) {
			(this.scopeDepth > e ? console.log('how did this happen?') : (this.scopeDepth = e),
				n !== -1 && (this.fontStyle = n),
				r !== 0 && (this.foreground = r),
				o !== 0 && (this.background = o));
		}
	},
	Pa = class Vn {
		constructor(e, n = [], r = {}) {
			((this._mainRule = e), (this._children = r), (this._rulesWithParentScopes = n));
		}
		_rulesWithParentScopes;
		static _cmpBySpecificity(e, n) {
			if (e.scopeDepth !== n.scopeDepth) return n.scopeDepth - e.scopeDepth;
			let r = 0,
				o = 0;
			for (
				;
				e.parentScopes[r] === '>' && r++,
					n.parentScopes[o] === '>' && o++,
					!(r >= e.parentScopes.length || o >= n.parentScopes.length);

			) {
				const s = n.parentScopes[o].length - e.parentScopes[r].length;
				if (s !== 0) return s;
				(r++, o++);
			}
			return n.parentScopes.length - e.parentScopes.length;
		}
		match(e) {
			if (e !== '') {
				let r = e.indexOf('.'),
					o,
					s;
				if (
					(r === -1
						? ((o = e), (s = ''))
						: ((o = e.substring(0, r)), (s = e.substring(r + 1))),
					this._children.hasOwnProperty(o))
				)
					return this._children[o].match(s);
			}
			const n = this._rulesWithParentScopes.concat(this._mainRule);
			return (n.sort(Vn._cmpBySpecificity), n);
		}
		insert(e, n, r, o, s, i) {
			if (n === '') {
				this._doInsertHere(e, r, o, s, i);
				return;
			}
			let l = n.indexOf('.'),
				a,
				c;
			l === -1 ? ((a = n), (c = '')) : ((a = n.substring(0, l)), (c = n.substring(l + 1)));
			let u;
			(this._children.hasOwnProperty(a)
				? (u = this._children[a])
				: ((u = new Vn(this._mainRule.clone(), Hn.cloneArr(this._rulesWithParentScopes))),
					(this._children[a] = u)),
				u.insert(e + 1, c, r, o, s, i));
		}
		_doInsertHere(e, n, r, o, s) {
			if (n === null) {
				this._mainRule.acceptOverwrite(e, r, o, s);
				return;
			}
			for (let i = 0, l = this._rulesWithParentScopes.length; i < l; i++) {
				let a = this._rulesWithParentScopes[i];
				if (as(a.parentScopes, n) === 0) {
					a.acceptOverwrite(e, r, o, s);
					return;
				}
			}
			(r === -1 && (r = this._mainRule.fontStyle),
				o === 0 && (o = this._mainRule.foreground),
				s === 0 && (s = this._mainRule.background),
				this._rulesWithParentScopes.push(new Hn(e, n, r, o, s)));
		}
	},
	rt = class ue {
		static toBinaryStr(e) {
			return e.toString(2).padStart(32, '0');
		}
		static print(e) {
			const n = ue.getLanguageId(e),
				r = ue.getTokenType(e),
				o = ue.getFontStyle(e),
				s = ue.getForeground(e),
				i = ue.getBackground(e);
			console.log({
				languageId: n,
				tokenType: r,
				fontStyle: o,
				foreground: s,
				background: i
			});
		}
		static getLanguageId(e) {
			return (e & 255) >>> 0;
		}
		static getTokenType(e) {
			return (e & 768) >>> 8;
		}
		static containsBalancedBrackets(e) {
			return (e & 1024) !== 0;
		}
		static getFontStyle(e) {
			return (e & 30720) >>> 11;
		}
		static getForeground(e) {
			return (e & 16744448) >>> 15;
		}
		static getBackground(e) {
			return (e & 4278190080) >>> 24;
		}
		static set(e, n, r, o, s, i, l) {
			let a = ue.getLanguageId(e),
				c = ue.getTokenType(e),
				u = ue.containsBalancedBrackets(e) ? 1 : 0,
				f = ue.getFontStyle(e),
				p = ue.getForeground(e),
				g = ue.getBackground(e);
			return (
				n !== 0 && (a = n),
				r !== 8 && (c = r),
				o !== null && (u = o ? 1 : 0),
				s !== -1 && (f = s),
				i !== 0 && (p = i),
				l !== 0 && (g = l),
				((a << 0) | (c << 8) | (u << 10) | (f << 11) | (p << 15) | (g << 24)) >>> 0
			);
		}
	};
function Xt(t, e) {
	const n = [],
		r = Oa(t);
	let o = r.next();
	for (; o !== null; ) {
		let a = 0;
		if (o.length === 2 && o.charAt(1) === ':') {
			switch (o.charAt(0)) {
				case 'R':
					a = 1;
					break;
				case 'L':
					a = -1;
					break;
				default:
					console.log(`Unknown priority ${o} in scope selector`);
			}
			o = r.next();
		}
		let c = i();
		if ((n.push({ matcher: c, priority: a }), o !== ',')) break;
		o = r.next();
	}
	return n;
	function s() {
		if (o === '-') {
			o = r.next();
			const a = s();
			return (c) => !!a && !a(c);
		}
		if (o === '(') {
			o = r.next();
			const a = l();
			return (o === ')' && (o = r.next()), a);
		}
		if (co(o)) {
			const a = [];
			do (a.push(o), (o = r.next()));
			while (co(o));
			return (c) => e(a, c);
		}
		return null;
	}
	function i() {
		const a = [];
		let c = s();
		for (; c; ) (a.push(c), (c = s()));
		return (u) => a.every((f) => f(u));
	}
	function l() {
		const a = [];
		let c = i();
		for (; c && (a.push(c), o === '|' || o === ','); ) {
			do o = r.next();
			while (o === '|' || o === ',');
			c = i();
		}
		return (u) => a.some((f) => f(u));
	}
}
function co(t) {
	return !!t && !!t.match(/[\w\.:]+/);
}
function Oa(t) {
	let e = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g,
		n = e.exec(t);
	return {
		next: () => {
			if (!n) return null;
			const r = n[0];
			return ((n = e.exec(t)), r);
		}
	};
}
function hs(t) {
	typeof t.dispose == 'function' && t.dispose();
}
var wt = class {
		constructor(t) {
			this.scopeName = t;
		}
		toKey() {
			return this.scopeName;
		}
	},
	Ma = class {
		constructor(t, e) {
			((this.scopeName = t), (this.ruleName = e));
		}
		toKey() {
			return `${this.scopeName}#${this.ruleName}`;
		}
	},
	$a = class {
		_references = [];
		_seenReferenceKeys = new Set();
		get references() {
			return this._references;
		}
		visitedRule = new Set();
		add(t) {
			const e = t.toKey();
			this._seenReferenceKeys.has(e) ||
				(this._seenReferenceKeys.add(e), this._references.push(t));
		}
	},
	Da = class {
		constructor(t, e) {
			((this.repo = t),
				(this.initialScopeName = e),
				this.seenFullScopeRequests.add(this.initialScopeName),
				(this.Q = [new wt(this.initialScopeName)]));
		}
		seenFullScopeRequests = new Set();
		seenPartialScopeRequests = new Set();
		Q;
		processQueue() {
			const t = this.Q;
			this.Q = [];
			const e = new $a();
			for (const n of t) Ga(n, this.initialScopeName, this.repo, e);
			for (const n of e.references)
				if (n instanceof wt) {
					if (this.seenFullScopeRequests.has(n.scopeName)) continue;
					(this.seenFullScopeRequests.add(n.scopeName), this.Q.push(n));
				} else {
					if (
						this.seenFullScopeRequests.has(n.scopeName) ||
						this.seenPartialScopeRequests.has(n.toKey())
					)
						continue;
					(this.seenPartialScopeRequests.add(n.toKey()), this.Q.push(n));
				}
		}
	};
function Ga(t, e, n, r) {
	const o = n.lookup(t.scopeName);
	if (!o) {
		if (t.scopeName === e) throw new Error(`No grammar provided for <${e}>`);
		return;
	}
	const s = n.lookup(e);
	t instanceof wt
		? Ht({ baseGrammar: s, selfGrammar: o }, r)
		: qn(t.ruleName, { baseGrammar: s, selfGrammar: o, repository: o.repository }, r);
	const i = n.injections(t.scopeName);
	if (i) for (const l of i) r.add(new wt(l));
}
function qn(t, e, n) {
	if (e.repository && e.repository[t]) {
		const r = e.repository[t];
		Yt([r], e, n);
	}
}
function Ht(t, e) {
	(t.selfGrammar.patterns &&
		Array.isArray(t.selfGrammar.patterns) &&
		Yt(t.selfGrammar.patterns, { ...t, repository: t.selfGrammar.repository }, e),
		t.selfGrammar.injections &&
			Yt(
				Object.values(t.selfGrammar.injections),
				{ ...t, repository: t.selfGrammar.repository },
				e
			));
}
function Yt(t, e, n) {
	for (const r of t) {
		if (n.visitedRule.has(r)) continue;
		n.visitedRule.add(r);
		const o = r.repository ? os({}, e.repository, r.repository) : e.repository;
		Array.isArray(r.patterns) && Yt(r.patterns, { ...e, repository: o }, n);
		const s = r.include;
		if (!s) continue;
		const i = ps(s);
		switch (i.kind) {
			case 0:
				Ht({ ...e, selfGrammar: e.baseGrammar }, n);
				break;
			case 1:
				Ht(e, n);
				break;
			case 2:
				qn(i.ruleName, { ...e, repository: o }, n);
				break;
			case 3:
			case 4:
				const l =
					i.scopeName === e.selfGrammar.scopeName
						? e.selfGrammar
						: i.scopeName === e.baseGrammar.scopeName
							? e.baseGrammar
							: void 0;
				if (l) {
					const a = { baseGrammar: e.baseGrammar, selfGrammar: l, repository: o };
					i.kind === 4 ? qn(i.ruleName, a, n) : Ht(a, n);
				} else
					i.kind === 4
						? n.add(new Ma(i.scopeName, i.ruleName))
						: n.add(new wt(i.scopeName));
				break;
		}
	}
}
var Fa = class {
		kind = 0;
	},
	Ba = class {
		kind = 1;
	},
	Ua = class {
		constructor(t) {
			this.ruleName = t;
		}
		kind = 2;
	},
	ja = class {
		constructor(t) {
			this.scopeName = t;
		}
		kind = 3;
	},
	za = class {
		constructor(t, e) {
			((this.scopeName = t), (this.ruleName = e));
		}
		kind = 4;
	};
function ps(t) {
	if (t === '$base') return new Fa();
	if (t === '$self') return new Ba();
	const e = t.indexOf('#');
	if (e === -1) return new ja(t);
	if (e === 0) return new Ua(t.substring(1));
	{
		const n = t.substring(0, e),
			r = t.substring(e + 1);
		return new za(n, r);
	}
}
var Wa = /\\(\d+)/,
	uo = /\\(\d+)/g,
	Ha = -1,
	ds = -2;
var kt = class {
		$location;
		id;
		_nameIsCapturing;
		_name;
		_contentNameIsCapturing;
		_contentName;
		constructor(t, e, n, r) {
			((this.$location = t),
				(this.id = e),
				(this._name = n || null),
				(this._nameIsCapturing = Gt.hasCaptures(this._name)),
				(this._contentName = r || null),
				(this._contentNameIsCapturing = Gt.hasCaptures(this._contentName)));
		}
		get debugName() {
			const t = this.$location
				? `${ss(this.$location.filename)}:${this.$location.line}`
				: 'unknown';
			return `${this.constructor.name}#${this.id} @ ${t}`;
		}
		getName(t, e) {
			return !this._nameIsCapturing || this._name === null || t === null || e === null
				? this._name
				: Gt.replaceCaptures(this._name, t, e);
		}
		getContentName(t, e) {
			return !this._contentNameIsCapturing || this._contentName === null
				? this._contentName
				: Gt.replaceCaptures(this._contentName, t, e);
		}
	},
	Va = class extends kt {
		retokenizeCapturedWithRuleId;
		constructor(t, e, n, r, o) {
			(super(t, e, n, r), (this.retokenizeCapturedWithRuleId = o));
		}
		dispose() {}
		collectPatterns(t, e) {
			throw new Error('Not supported!');
		}
		compile(t, e) {
			throw new Error('Not supported!');
		}
		compileAG(t, e, n, r) {
			throw new Error('Not supported!');
		}
	},
	qa = class extends kt {
		_match;
		captures;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, o) {
			(super(t, e, n, null),
				(this._match = new Ct(r, this.id)),
				(this.captures = o),
				(this._cachedCompiledPatterns = null));
		}
		dispose() {
			this._cachedCompiledPatterns &&
				(this._cachedCompiledPatterns.dispose(), (this._cachedCompiledPatterns = null));
		}
		get debugMatchRegExp() {
			return `${this._match.source}`;
		}
		collectPatterns(t, e) {
			e.push(this._match);
		}
		compile(t, e) {
			return this._getCachedCompiledPatterns(t).compile(t);
		}
		compileAG(t, e, n, r) {
			return this._getCachedCompiledPatterns(t).compileAG(t, n, r);
		}
		_getCachedCompiledPatterns(t) {
			return (
				this._cachedCompiledPatterns ||
					((this._cachedCompiledPatterns = new St()),
					this.collectPatterns(t, this._cachedCompiledPatterns)),
				this._cachedCompiledPatterns
			);
		}
	},
	fo = class extends kt {
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, o) {
			(super(t, e, n, r),
				(this.patterns = o.patterns),
				(this.hasMissingPatterns = o.hasMissingPatterns),
				(this._cachedCompiledPatterns = null));
		}
		dispose() {
			this._cachedCompiledPatterns &&
				(this._cachedCompiledPatterns.dispose(), (this._cachedCompiledPatterns = null));
		}
		collectPatterns(t, e) {
			for (const n of this.patterns) t.getRule(n).collectPatterns(t, e);
		}
		compile(t, e) {
			return this._getCachedCompiledPatterns(t).compile(t);
		}
		compileAG(t, e, n, r) {
			return this._getCachedCompiledPatterns(t).compileAG(t, n, r);
		}
		_getCachedCompiledPatterns(t) {
			return (
				this._cachedCompiledPatterns ||
					((this._cachedCompiledPatterns = new St()),
					this.collectPatterns(t, this._cachedCompiledPatterns)),
				this._cachedCompiledPatterns
			);
		}
	},
	Xn = class extends kt {
		_begin;
		beginCaptures;
		_end;
		endHasBackReferences;
		endCaptures;
		applyEndPatternLast;
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, o, s, i, l, a, c) {
			(super(t, e, n, r),
				(this._begin = new Ct(o, this.id)),
				(this.beginCaptures = s),
				(this._end = new Ct(i || '￿', -1)),
				(this.endHasBackReferences = this._end.hasBackReferences),
				(this.endCaptures = l),
				(this.applyEndPatternLast = a || !1),
				(this.patterns = c.patterns),
				(this.hasMissingPatterns = c.hasMissingPatterns),
				(this._cachedCompiledPatterns = null));
		}
		dispose() {
			this._cachedCompiledPatterns &&
				(this._cachedCompiledPatterns.dispose(), (this._cachedCompiledPatterns = null));
		}
		get debugBeginRegExp() {
			return `${this._begin.source}`;
		}
		get debugEndRegExp() {
			return `${this._end.source}`;
		}
		getEndWithResolvedBackReferences(t, e) {
			return this._end.resolveBackReferences(t, e);
		}
		collectPatterns(t, e) {
			e.push(this._begin);
		}
		compile(t, e) {
			return this._getCachedCompiledPatterns(t, e).compile(t);
		}
		compileAG(t, e, n, r) {
			return this._getCachedCompiledPatterns(t, e).compileAG(t, n, r);
		}
		_getCachedCompiledPatterns(t, e) {
			if (!this._cachedCompiledPatterns) {
				this._cachedCompiledPatterns = new St();
				for (const n of this.patterns)
					t.getRule(n).collectPatterns(t, this._cachedCompiledPatterns);
				this.applyEndPatternLast
					? this._cachedCompiledPatterns.push(
							this._end.hasBackReferences ? this._end.clone() : this._end
						)
					: this._cachedCompiledPatterns.unshift(
							this._end.hasBackReferences ? this._end.clone() : this._end
						);
			}
			return (
				this._end.hasBackReferences &&
					(this.applyEndPatternLast
						? this._cachedCompiledPatterns.setSource(
								this._cachedCompiledPatterns.length() - 1,
								e
							)
						: this._cachedCompiledPatterns.setSource(0, e)),
				this._cachedCompiledPatterns
			);
		}
	},
	Kt = class extends kt {
		_begin;
		beginCaptures;
		whileCaptures;
		_while;
		whileHasBackReferences;
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		_cachedCompiledWhilePatterns;
		constructor(t, e, n, r, o, s, i, l, a) {
			(super(t, e, n, r),
				(this._begin = new Ct(o, this.id)),
				(this.beginCaptures = s),
				(this.whileCaptures = l),
				(this._while = new Ct(i, ds)),
				(this.whileHasBackReferences = this._while.hasBackReferences),
				(this.patterns = a.patterns),
				(this.hasMissingPatterns = a.hasMissingPatterns),
				(this._cachedCompiledPatterns = null),
				(this._cachedCompiledWhilePatterns = null));
		}
		dispose() {
			(this._cachedCompiledPatterns &&
				(this._cachedCompiledPatterns.dispose(), (this._cachedCompiledPatterns = null)),
				this._cachedCompiledWhilePatterns &&
					(this._cachedCompiledWhilePatterns.dispose(),
					(this._cachedCompiledWhilePatterns = null)));
		}
		get debugBeginRegExp() {
			return `${this._begin.source}`;
		}
		get debugWhileRegExp() {
			return `${this._while.source}`;
		}
		getWhileWithResolvedBackReferences(t, e) {
			return this._while.resolveBackReferences(t, e);
		}
		collectPatterns(t, e) {
			e.push(this._begin);
		}
		compile(t, e) {
			return this._getCachedCompiledPatterns(t).compile(t);
		}
		compileAG(t, e, n, r) {
			return this._getCachedCompiledPatterns(t).compileAG(t, n, r);
		}
		_getCachedCompiledPatterns(t) {
			if (!this._cachedCompiledPatterns) {
				this._cachedCompiledPatterns = new St();
				for (const e of this.patterns)
					t.getRule(e).collectPatterns(t, this._cachedCompiledPatterns);
			}
			return this._cachedCompiledPatterns;
		}
		compileWhile(t, e) {
			return this._getCachedCompiledWhilePatterns(t, e).compile(t);
		}
		compileWhileAG(t, e, n, r) {
			return this._getCachedCompiledWhilePatterns(t, e).compileAG(t, n, r);
		}
		_getCachedCompiledWhilePatterns(t, e) {
			return (
				this._cachedCompiledWhilePatterns ||
					((this._cachedCompiledWhilePatterns = new St()),
					this._cachedCompiledWhilePatterns.push(
						this._while.hasBackReferences ? this._while.clone() : this._while
					)),
				this._while.hasBackReferences &&
					this._cachedCompiledWhilePatterns.setSource(0, e || '￿'),
				this._cachedCompiledWhilePatterns
			);
		}
	},
	gs = class ee {
		static createCaptureRule(e, n, r, o, s) {
			return e.registerRule((i) => new Va(n, i, r, o, s));
		}
		static getCompiledRuleId(e, n, r) {
			return (
				e.id ||
					n.registerRule((o) => {
						if (((e.id = o), e.match))
							return new qa(
								e.$vscodeTextmateLocation,
								e.id,
								e.name,
								e.match,
								ee._compileCaptures(e.captures, n, r)
							);
						if (typeof e.begin > 'u') {
							e.repository && (r = os({}, r, e.repository));
							let s = e.patterns;
							return (
								typeof s > 'u' && e.include && (s = [{ include: e.include }]),
								new fo(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									ee._compilePatterns(s, n, r)
								)
							);
						}
						return e.while
							? new Kt(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									e.begin,
									ee._compileCaptures(e.beginCaptures || e.captures, n, r),
									e.while,
									ee._compileCaptures(e.whileCaptures || e.captures, n, r),
									ee._compilePatterns(e.patterns, n, r)
								)
							: new Xn(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									e.begin,
									ee._compileCaptures(e.beginCaptures || e.captures, n, r),
									e.end,
									ee._compileCaptures(e.endCaptures || e.captures, n, r),
									e.applyEndPatternLast,
									ee._compilePatterns(e.patterns, n, r)
								);
					}),
				e.id
			);
		}
		static _compileCaptures(e, n, r) {
			let o = [];
			if (e) {
				let s = 0;
				for (const i in e) {
					if (i === '$vscodeTextmateLocation') continue;
					const l = parseInt(i, 10);
					l > s && (s = l);
				}
				for (let i = 0; i <= s; i++) o[i] = null;
				for (const i in e) {
					if (i === '$vscodeTextmateLocation') continue;
					const l = parseInt(i, 10);
					let a = 0;
					(e[i].patterns && (a = ee.getCompiledRuleId(e[i], n, r)),
						(o[l] = ee.createCaptureRule(
							n,
							e[i].$vscodeTextmateLocation,
							e[i].name,
							e[i].contentName,
							a
						)));
				}
			}
			return o;
		}
		static _compilePatterns(e, n, r) {
			let o = [];
			if (e)
				for (let s = 0, i = e.length; s < i; s++) {
					const l = e[s];
					let a = -1;
					if (l.include) {
						const c = ps(l.include);
						switch (c.kind) {
							case 0:
							case 1:
								a = ee.getCompiledRuleId(r[l.include], n, r);
								break;
							case 2:
								let u = r[c.ruleName];
								u && (a = ee.getCompiledRuleId(u, n, r));
								break;
							case 3:
							case 4:
								const f = c.scopeName,
									p = c.kind === 4 ? c.ruleName : null,
									g = n.getExternalGrammar(f, r);
								if (g)
									if (p) {
										let d = g.repository[p];
										d && (a = ee.getCompiledRuleId(d, n, g.repository));
									} else
										a = ee.getCompiledRuleId(
											g.repository.$self,
											n,
											g.repository
										);
								break;
						}
					} else a = ee.getCompiledRuleId(l, n, r);
					if (a !== -1) {
						const c = n.getRule(a);
						let u = !1;
						if (
							((c instanceof fo || c instanceof Xn || c instanceof Kt) &&
								c.hasMissingPatterns &&
								c.patterns.length === 0 &&
								(u = !0),
							u)
						)
							continue;
						o.push(a);
					}
				}
			return { patterns: o, hasMissingPatterns: (e ? e.length : 0) !== o.length };
		}
	},
	Ct = class ms {
		source;
		ruleId;
		hasAnchor;
		hasBackReferences;
		_anchorCache;
		constructor(e, n) {
			if (e && typeof e == 'string') {
				const r = e.length;
				let o = 0,
					s = [],
					i = !1;
				for (let l = 0; l < r; l++)
					if (e.charAt(l) === '\\' && l + 1 < r) {
						const c = e.charAt(l + 1);
						(c === 'z'
							? (s.push(e.substring(o, l)), s.push('$(?!\\n)(?<!\\n)'), (o = l + 2))
							: (c === 'A' || c === 'G') && (i = !0),
							l++);
					}
				((this.hasAnchor = i),
					o === 0
						? (this.source = e)
						: (s.push(e.substring(o, r)), (this.source = s.join(''))));
			} else ((this.hasAnchor = !1), (this.source = e));
			(this.hasAnchor
				? (this._anchorCache = this._buildAnchorCache())
				: (this._anchorCache = null),
				(this.ruleId = n),
				typeof this.source == 'string'
					? (this.hasBackReferences = Wa.test(this.source))
					: (this.hasBackReferences = !1));
		}
		clone() {
			return new ms(this.source, this.ruleId);
		}
		setSource(e) {
			this.source !== e &&
				((this.source = e),
				this.hasAnchor && (this._anchorCache = this._buildAnchorCache()));
		}
		resolveBackReferences(e, n) {
			if (typeof this.source != 'string')
				throw new Error('This method should only be called if the source is a string');
			let r = n.map((o) => e.substring(o.start, o.end));
			return (
				(uo.lastIndex = 0),
				this.source.replace(uo, (o, s) => ls(r[parseInt(s, 10)] || ''))
			);
		}
		_buildAnchorCache() {
			if (typeof this.source != 'string')
				throw new Error('This method should only be called if the source is a string');
			let e = [],
				n = [],
				r = [],
				o = [],
				s,
				i,
				l,
				a;
			for (s = 0, i = this.source.length; s < i; s++)
				((l = this.source.charAt(s)),
					(e[s] = l),
					(n[s] = l),
					(r[s] = l),
					(o[s] = l),
					l === '\\' &&
						s + 1 < i &&
						((a = this.source.charAt(s + 1)),
						a === 'A'
							? ((e[s + 1] = '￿'),
								(n[s + 1] = '￿'),
								(r[s + 1] = 'A'),
								(o[s + 1] = 'A'))
							: a === 'G'
								? ((e[s + 1] = '￿'),
									(n[s + 1] = 'G'),
									(r[s + 1] = '￿'),
									(o[s + 1] = 'G'))
								: ((e[s + 1] = a), (n[s + 1] = a), (r[s + 1] = a), (o[s + 1] = a)),
						s++));
			return { A0_G0: e.join(''), A0_G1: n.join(''), A1_G0: r.join(''), A1_G1: o.join('') };
		}
		resolveAnchors(e, n) {
			return !this.hasAnchor || !this._anchorCache || typeof this.source != 'string'
				? this.source
				: e
					? n
						? this._anchorCache.A1_G1
						: this._anchorCache.A1_G0
					: n
						? this._anchorCache.A0_G1
						: this._anchorCache.A0_G0;
		}
	},
	St = class {
		_items;
		_hasAnchors;
		_cached;
		_anchorCache;
		constructor() {
			((this._items = []),
				(this._hasAnchors = !1),
				(this._cached = null),
				(this._anchorCache = { A0_G0: null, A0_G1: null, A1_G0: null, A1_G1: null }));
		}
		dispose() {
			this._disposeCaches();
		}
		_disposeCaches() {
			(this._cached && (this._cached.dispose(), (this._cached = null)),
				this._anchorCache.A0_G0 &&
					(this._anchorCache.A0_G0.dispose(), (this._anchorCache.A0_G0 = null)),
				this._anchorCache.A0_G1 &&
					(this._anchorCache.A0_G1.dispose(), (this._anchorCache.A0_G1 = null)),
				this._anchorCache.A1_G0 &&
					(this._anchorCache.A1_G0.dispose(), (this._anchorCache.A1_G0 = null)),
				this._anchorCache.A1_G1 &&
					(this._anchorCache.A1_G1.dispose(), (this._anchorCache.A1_G1 = null)));
		}
		push(t) {
			(this._items.push(t), (this._hasAnchors = this._hasAnchors || t.hasAnchor));
		}
		unshift(t) {
			(this._items.unshift(t), (this._hasAnchors = this._hasAnchors || t.hasAnchor));
		}
		length() {
			return this._items.length;
		}
		setSource(t, e) {
			this._items[t].source !== e && (this._disposeCaches(), this._items[t].setSource(e));
		}
		compile(t) {
			if (!this._cached) {
				let e = this._items.map((n) => n.source);
				this._cached = new ho(
					t,
					e,
					this._items.map((n) => n.ruleId)
				);
			}
			return this._cached;
		}
		compileAG(t, e, n) {
			return this._hasAnchors
				? e
					? n
						? (this._anchorCache.A1_G1 ||
								(this._anchorCache.A1_G1 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A1_G1)
						: (this._anchorCache.A1_G0 ||
								(this._anchorCache.A1_G0 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A1_G0)
					: n
						? (this._anchorCache.A0_G1 ||
								(this._anchorCache.A0_G1 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A0_G1)
						: (this._anchorCache.A0_G0 ||
								(this._anchorCache.A0_G0 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A0_G0)
				: this.compile(t);
		}
		_resolveAnchors(t, e, n) {
			let r = this._items.map((o) => o.resolveAnchors(e, n));
			return new ho(
				t,
				r,
				this._items.map((o) => o.ruleId)
			);
		}
	},
	ho = class {
		constructor(t, e, n) {
			((this.regExps = e), (this.rules = n), (this.scanner = t.createOnigScanner(e)));
		}
		scanner;
		dispose() {
			typeof this.scanner.dispose == 'function' && this.scanner.dispose();
		}
		toString() {
			const t = [];
			for (let e = 0, n = this.rules.length; e < n; e++)
				t.push('   - ' + this.rules[e] + ': ' + this.regExps[e]);
			return t.join(`
`);
		}
		findNextMatchSync(t, e, n) {
			const r = this.scanner.findNextMatchSync(t, e, n);
			return r ? { ruleId: this.rules[r.index], captureIndices: r.captureIndices } : null;
		}
	},
	Pn = class {
		constructor(t, e) {
			((this.languageId = t), (this.tokenType = e));
		}
	},
	Xa = class Yn {
		_defaultAttributes;
		_embeddedLanguagesMatcher;
		constructor(e, n) {
			((this._defaultAttributes = new Pn(e, 8)),
				(this._embeddedLanguagesMatcher = new Ya(Object.entries(n || {}))));
		}
		getDefaultAttributes() {
			return this._defaultAttributes;
		}
		getBasicScopeAttributes(e) {
			return e === null ? Yn._NULL_SCOPE_METADATA : this._getBasicScopeAttributes.get(e);
		}
		static _NULL_SCOPE_METADATA = new Pn(0, 0);
		_getBasicScopeAttributes = new cs((e) => {
			const n = this._scopeToLanguage(e),
				r = this._toStandardTokenType(e);
			return new Pn(n, r);
		});
		_scopeToLanguage(e) {
			return this._embeddedLanguagesMatcher.match(e) || 0;
		}
		_toStandardTokenType(e) {
			const n = e.match(Yn.STANDARD_TOKEN_TYPE_REGEXP);
			if (!n) return 8;
			switch (n[1]) {
				case 'comment':
					return 1;
				case 'string':
					return 2;
				case 'regex':
					return 3;
				case 'meta.embedded':
					return 0;
			}
			throw new Error('Unexpected match for standard token type!');
		}
		static STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|meta\.embedded)\b/;
	},
	Ya = class {
		values;
		scopesRegExp;
		constructor(t) {
			if (t.length === 0) ((this.values = null), (this.scopesRegExp = null));
			else {
				this.values = new Map(t);
				const e = t.map(([n, r]) => ls(n));
				(e.sort(),
					e.reverse(),
					(this.scopesRegExp = new RegExp(`^((${e.join(')|(')}))($|\\.)`, '')));
			}
		}
		match(t) {
			if (!this.scopesRegExp) return;
			const e = t.match(this.scopesRegExp);
			if (e) return this.values.get(e[1]);
		}
	},
	po = class {
		constructor(t, e) {
			((this.stack = t), (this.stoppedEarly = e));
		}
	};
function ys(t, e, n, r, o, s, i, l) {
	const a = e.content.length;
	let c = !1,
		u = -1;
	if (i) {
		const g = Ka(t, e, n, r, o, s);
		((o = g.stack), (r = g.linePos), (n = g.isFirstLine), (u = g.anchorPosition));
	}
	const f = Date.now();
	for (; !c; ) {
		if (l !== 0 && Date.now() - f > l) return new po(o, !0);
		p();
	}
	return new po(o, !1);
	function p() {
		const g = Za(t, e, n, r, o, u);
		if (!g) {
			(s.produce(o, a), (c = !0));
			return;
		}
		const d = g.captureIndices,
			C = g.matchedRuleId,
			b = d && d.length > 0 ? d[0].end > r : !1;
		if (C === Ha) {
			const w = o.getRule(t);
			(s.produce(o, d[0].start),
				(o = o.withContentNameScopesList(o.nameScopesList)),
				mt(t, e, n, o, s, w.endCaptures, d),
				s.produce(o, d[0].end));
			const _ = o;
			if (((o = o.parent), (u = _.getAnchorPos()), !b && _.getEnterPos() === r)) {
				((o = _), s.produce(o, a), (c = !0));
				return;
			}
		} else {
			const w = t.getRule(C);
			s.produce(o, d[0].start);
			const _ = o,
				A = w.getName(e.content, d),
				P = o.contentNameScopesList.pushAttributed(A, t);
			if (((o = o.push(C, r, u, d[0].end === a, null, P, P)), w instanceof Xn)) {
				const v = w;
				(mt(t, e, n, o, s, v.beginCaptures, d), s.produce(o, d[0].end), (u = d[0].end));
				const O = v.getContentName(e.content, d),
					U = P.pushAttributed(O, t);
				if (
					((o = o.withContentNameScopesList(U)),
					v.endHasBackReferences &&
						(o = o.withEndRule(v.getEndWithResolvedBackReferences(e.content, d))),
					!b && _.hasSameRuleAs(o))
				) {
					((o = o.pop()), s.produce(o, a), (c = !0));
					return;
				}
			} else if (w instanceof Kt) {
				const v = w;
				(mt(t, e, n, o, s, v.beginCaptures, d), s.produce(o, d[0].end), (u = d[0].end));
				const O = v.getContentName(e.content, d),
					U = P.pushAttributed(O, t);
				if (
					((o = o.withContentNameScopesList(U)),
					v.whileHasBackReferences &&
						(o = o.withEndRule(v.getWhileWithResolvedBackReferences(e.content, d))),
					!b && _.hasSameRuleAs(o))
				) {
					((o = o.pop()), s.produce(o, a), (c = !0));
					return;
				}
			} else if (
				(mt(t, e, n, o, s, w.captures, d), s.produce(o, d[0].end), (o = o.pop()), !b)
			) {
				((o = o.safePop()), s.produce(o, a), (c = !0));
				return;
			}
		}
		d[0].end > r && ((r = d[0].end), (n = !1));
	}
}
function Ka(t, e, n, r, o, s) {
	let i = o.beginRuleCapturedEOL ? 0 : -1;
	const l = [];
	for (let a = o; a; a = a.pop()) {
		const c = a.getRule(t);
		c instanceof Kt && l.push({ rule: c, stack: a });
	}
	for (let a = l.pop(); a; a = l.pop()) {
		const { ruleScanner: c, findOptions: u } = el(a.rule, t, a.stack.endRule, n, r === i),
			f = c.findNextMatchSync(e, r, u);
		if (f) {
			if (f.ruleId !== ds) {
				o = a.stack.pop();
				break;
			}
			f.captureIndices &&
				f.captureIndices.length &&
				(s.produce(a.stack, f.captureIndices[0].start),
				mt(t, e, n, a.stack, s, a.rule.whileCaptures, f.captureIndices),
				s.produce(a.stack, f.captureIndices[0].end),
				(i = f.captureIndices[0].end),
				f.captureIndices[0].end > r && ((r = f.captureIndices[0].end), (n = !1)));
		} else {
			o = a.stack.pop();
			break;
		}
	}
	return { stack: o, linePos: r, anchorPosition: i, isFirstLine: n };
}
function Za(t, e, n, r, o, s) {
	const i = Qa(t, e, n, r, o, s),
		l = t.getInjections();
	if (l.length === 0) return i;
	const a = Ja(l, t, e, n, r, o, s);
	if (!a) return i;
	if (!i) return a;
	const c = i.captureIndices[0].start,
		u = a.captureIndices[0].start;
	return u < c || (a.priorityMatch && u === c) ? a : i;
}
function Qa(t, e, n, r, o, s) {
	const i = o.getRule(t),
		{ ruleScanner: l, findOptions: a } = _s(i, t, o.endRule, n, r === s),
		c = l.findNextMatchSync(e, r, a);
	return c ? { captureIndices: c.captureIndices, matchedRuleId: c.ruleId } : null;
}
function Ja(t, e, n, r, o, s, i) {
	let l = Number.MAX_VALUE,
		a = null,
		c,
		u = 0;
	const f = s.contentNameScopesList.getScopeNames();
	for (let p = 0, g = t.length; p < g; p++) {
		const d = t[p];
		if (!d.matcher(f)) continue;
		const C = e.getRule(d.ruleId),
			{ ruleScanner: b, findOptions: w } = _s(C, e, null, r, o === i),
			_ = b.findNextMatchSync(n, o, w);
		if (!_) continue;
		const A = _.captureIndices[0].start;
		if (
			!(A >= l) &&
			((l = A), (a = _.captureIndices), (c = _.ruleId), (u = d.priority), l === o)
		)
			break;
	}
	return a ? { priorityMatch: u === -1, captureIndices: a, matchedRuleId: c } : null;
}
function _s(t, e, n, r, o) {
	return { ruleScanner: t.compileAG(e, n, r, o), findOptions: 0 };
}
function el(t, e, n, r, o) {
	return { ruleScanner: t.compileWhileAG(e, n, r, o), findOptions: 0 };
}
function mt(t, e, n, r, o, s, i) {
	if (s.length === 0) return;
	const l = e.content,
		a = Math.min(s.length, i.length),
		c = [],
		u = i[0].end;
	for (let f = 0; f < a; f++) {
		const p = s[f];
		if (p === null) continue;
		const g = i[f];
		if (g.length === 0) continue;
		if (g.start > u) break;
		for (; c.length > 0 && c[c.length - 1].endPos <= g.start; )
			(o.produceFromScopes(c[c.length - 1].scopes, c[c.length - 1].endPos), c.pop());
		if (
			(c.length > 0
				? o.produceFromScopes(c[c.length - 1].scopes, g.start)
				: o.produce(r, g.start),
			p.retokenizeCapturedWithRuleId)
		) {
			const C = p.getName(l, i),
				b = r.contentNameScopesList.pushAttributed(C, t),
				w = p.getContentName(l, i),
				_ = b.pushAttributed(w, t),
				A = r.push(p.retokenizeCapturedWithRuleId, g.start, -1, !1, null, b, _),
				P = t.createOnigString(l.substring(0, g.end));
			(ys(t, P, n && g.start === 0, g.start, A, o, !1, 0), hs(P));
			continue;
		}
		const d = p.getName(l, i);
		if (d !== null) {
			const b = (
				c.length > 0 ? c[c.length - 1].scopes : r.contentNameScopesList
			).pushAttributed(d, t);
			c.push(new tl(b, g.end));
		}
	}
	for (; c.length > 0; )
		(o.produceFromScopes(c[c.length - 1].scopes, c[c.length - 1].endPos), c.pop());
}
var tl = class {
	scopes;
	endPos;
	constructor(t, e) {
		((this.scopes = t), (this.endPos = e));
	}
};
function nl(t, e, n, r, o, s, i, l) {
	return new ol(t, e, n, r, o, s, i, l);
}
function go(t, e, n, r, o) {
	const s = Xt(e, Zt),
		i = gs.getCompiledRuleId(n, r, o.repository);
	for (const l of s)
		t.push({
			debugSelector: e,
			matcher: l.matcher,
			ruleId: i,
			grammar: o,
			priority: l.priority
		});
}
function Zt(t, e) {
	if (e.length < t.length) return !1;
	let n = 0;
	return t.every((r) => {
		for (let o = n; o < e.length; o++) if (rl(e[o], r)) return ((n = o + 1), !0);
		return !1;
	});
}
function rl(t, e) {
	if (!t) return !1;
	if (t === e) return !0;
	const n = e.length;
	return t.length > n && t.substr(0, n) === e && t[n] === '.';
}
var ol = class {
	constructor(t, e, n, r, o, s, i, l) {
		if (
			((this._rootScopeName = t),
			(this.balancedBracketSelectors = s),
			(this._onigLib = l),
			(this._basicScopeAttributesProvider = new Xa(n, r)),
			(this._rootId = -1),
			(this._lastRuleId = 0),
			(this._ruleId2desc = [null]),
			(this._includedGrammars = {}),
			(this._grammarRepository = i),
			(this._grammar = mo(e, null)),
			(this._injections = null),
			(this._tokenTypeMatchers = []),
			o)
		)
			for (const a of Object.keys(o)) {
				const c = Xt(a, Zt);
				for (const u of c) this._tokenTypeMatchers.push({ matcher: u.matcher, type: o[a] });
			}
	}
	_rootId;
	_lastRuleId;
	_ruleId2desc;
	_includedGrammars;
	_grammarRepository;
	_grammar;
	_injections;
	_basicScopeAttributesProvider;
	_tokenTypeMatchers;
	get themeProvider() {
		return this._grammarRepository;
	}
	dispose() {
		for (const t of this._ruleId2desc) t && t.dispose();
	}
	createOnigScanner(t) {
		return this._onigLib.createOnigScanner(t);
	}
	createOnigString(t) {
		return this._onigLib.createOnigString(t);
	}
	getMetadataForScope(t) {
		return this._basicScopeAttributesProvider.getBasicScopeAttributes(t);
	}
	_collectInjections() {
		const t = {
				lookup: (o) =>
					o === this._rootScopeName ? this._grammar : this.getExternalGrammar(o),
				injections: (o) => this._grammarRepository.injections(o)
			},
			e = [],
			n = this._rootScopeName,
			r = t.lookup(n);
		if (r) {
			const o = r.injections;
			if (o) for (let i in o) go(e, i, o[i], this, r);
			const s = this._grammarRepository.injections(n);
			s &&
				s.forEach((i) => {
					const l = this.getExternalGrammar(i);
					if (l) {
						const a = l.injectionSelector;
						a && go(e, a, l, this, l);
					}
				});
		}
		return (e.sort((o, s) => o.priority - s.priority), e);
	}
	getInjections() {
		return (
			this._injections === null && (this._injections = this._collectInjections()),
			this._injections
		);
	}
	registerRule(t) {
		const e = ++this._lastRuleId,
			n = t(e);
		return ((this._ruleId2desc[e] = n), n);
	}
	getRule(t) {
		return this._ruleId2desc[t];
	}
	getExternalGrammar(t, e) {
		if (this._includedGrammars[t]) return this._includedGrammars[t];
		if (this._grammarRepository) {
			const n = this._grammarRepository.lookup(t);
			if (n)
				return (
					(this._includedGrammars[t] = mo(n, e && e.$base)),
					this._includedGrammars[t]
				);
		}
	}
	tokenizeLine(t, e, n = 0) {
		const r = this._tokenize(t, e, !1, n);
		return {
			tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	tokenizeLine2(t, e, n = 0) {
		const r = this._tokenize(t, e, !0, n);
		return {
			tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
			ruleStack: r.ruleStack,
			stoppedEarly: r.stoppedEarly
		};
	}
	_tokenize(t, e, n, r) {
		this._rootId === -1 &&
			((this._rootId = gs.getCompiledRuleId(
				this._grammar.repository.$self,
				this,
				this._grammar.repository
			)),
			this.getInjections());
		let o;
		if (!e || e === Kn.NULL) {
			o = !0;
			const c = this._basicScopeAttributesProvider.getDefaultAttributes(),
				u = this.themeProvider.getDefaults(),
				f = rt.set(
					0,
					c.languageId,
					c.tokenType,
					null,
					u.fontStyle,
					u.foregroundId,
					u.backgroundId
				),
				p = this.getRule(this._rootId).getName(null, null);
			let g;
			(p
				? (g = yt.createRootAndLookUpScopeName(p, f, this))
				: (g = yt.createRoot('unknown', f)),
				(e = new Kn(null, this._rootId, -1, -1, !1, null, g, g)));
		} else ((o = !1), e.reset());
		t =
			t +
			`
`;
		const s = this.createOnigString(t),
			i = s.content.length,
			l = new il(n, t, this._tokenTypeMatchers, this.balancedBracketSelectors),
			a = ys(this, s, o, 0, e, l, !0, r);
		return (
			hs(s),
			{ lineLength: i, lineTokens: l, ruleStack: a.stack, stoppedEarly: a.stoppedEarly }
		);
	}
};
function mo(t, e) {
	return (
		(t = Ea(t)),
		(t.repository = t.repository || {}),
		(t.repository.$self = {
			$vscodeTextmateLocation: t.$vscodeTextmateLocation,
			patterns: t.patterns,
			name: t.scopeName
		}),
		(t.repository.$base = e || t.repository.$self),
		t
	);
}
var yt = class me {
		constructor(e, n, r) {
			((this.parent = e), (this.scopePath = n), (this.tokenAttributes = r));
		}
		static fromExtension(e, n) {
			let r = e,
				o = e?.scopePath ?? null;
			for (const s of n)
				((o = Ln.push(o, s.scopeNames)), (r = new me(r, o, s.encodedTokenAttributes)));
			return r;
		}
		static createRoot(e, n) {
			return new me(null, new Ln(null, e), n);
		}
		static createRootAndLookUpScopeName(e, n, r) {
			const o = r.getMetadataForScope(e),
				s = new Ln(null, e),
				i = r.themeProvider.themeMatch(s),
				l = me.mergeAttributes(n, o, i);
			return new me(null, s, l);
		}
		get scopeName() {
			return this.scopePath.scopeName;
		}
		toString() {
			return this.getScopeNames().join(' ');
		}
		equals(e) {
			return me.equals(this, e);
		}
		static equals(e, n) {
			do {
				if (e === n || (!e && !n)) return !0;
				if (
					!e ||
					!n ||
					e.scopeName !== n.scopeName ||
					e.tokenAttributes !== n.tokenAttributes
				)
					return !1;
				((e = e.parent), (n = n.parent));
			} while (!0);
		}
		static mergeAttributes(e, n, r) {
			let o = -1,
				s = 0,
				i = 0;
			return (
				r !== null && ((o = r.fontStyle), (s = r.foregroundId), (i = r.backgroundId)),
				rt.set(e, n.languageId, n.tokenType, null, o, s, i)
			);
		}
		pushAttributed(e, n) {
			if (e === null) return this;
			if (e.indexOf(' ') === -1) return me._pushAttributed(this, e, n);
			const r = e.split(/ /g);
			let o = this;
			for (const s of r) o = me._pushAttributed(o, s, n);
			return o;
		}
		static _pushAttributed(e, n, r) {
			const o = r.getMetadataForScope(n),
				s = e.scopePath.push(n),
				i = r.themeProvider.themeMatch(s),
				l = me.mergeAttributes(e.tokenAttributes, o, i);
			return new me(e, s, l);
		}
		getScopeNames() {
			return this.scopePath.getSegments();
		}
		getExtensionIfDefined(e) {
			const n = [];
			let r = this;
			for (; r && r !== e; )
				(n.push({
					encodedTokenAttributes: r.tokenAttributes,
					scopeNames: r.scopePath.getExtensionIfDefined(r.parent?.scopePath ?? null)
				}),
					(r = r.parent));
			return r === e ? n.reverse() : void 0;
		}
	},
	Kn = class Oe {
		constructor(e, n, r, o, s, i, l, a) {
			((this.parent = e),
				(this.ruleId = n),
				(this.beginRuleCapturedEOL = s),
				(this.endRule = i),
				(this.nameScopesList = l),
				(this.contentNameScopesList = a),
				(this.depth = this.parent ? this.parent.depth + 1 : 1),
				(this._enterPos = r),
				(this._anchorPos = o));
		}
		_stackElementBrand = void 0;
		static NULL = new Oe(null, 0, 0, 0, !1, null, null, null);
		_enterPos;
		_anchorPos;
		depth;
		equals(e) {
			return e === null ? !1 : Oe._equals(this, e);
		}
		static _equals(e, n) {
			return e === n
				? !0
				: this._structuralEquals(e, n)
					? yt.equals(e.contentNameScopesList, n.contentNameScopesList)
					: !1;
		}
		static _structuralEquals(e, n) {
			do {
				if (e === n || (!e && !n)) return !0;
				if (
					!e ||
					!n ||
					e.depth !== n.depth ||
					e.ruleId !== n.ruleId ||
					e.endRule !== n.endRule
				)
					return !1;
				((e = e.parent), (n = n.parent));
			} while (!0);
		}
		clone() {
			return this;
		}
		static _reset(e) {
			for (; e; ) ((e._enterPos = -1), (e._anchorPos = -1), (e = e.parent));
		}
		reset() {
			Oe._reset(this);
		}
		pop() {
			return this.parent;
		}
		safePop() {
			return this.parent ? this.parent : this;
		}
		push(e, n, r, o, s, i, l) {
			return new Oe(this, e, n, r, o, s, i, l);
		}
		getEnterPos() {
			return this._enterPos;
		}
		getAnchorPos() {
			return this._anchorPos;
		}
		getRule(e) {
			return e.getRule(this.ruleId);
		}
		toString() {
			const e = [];
			return (this._writeString(e, 0), '[' + e.join(',') + ']');
		}
		_writeString(e, n) {
			return (
				this.parent && (n = this.parent._writeString(e, n)),
				(e[n++] =
					`(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`),
				n
			);
		}
		withContentNameScopesList(e) {
			return this.contentNameScopesList === e
				? this
				: this.parent.push(
						this.ruleId,
						this._enterPos,
						this._anchorPos,
						this.beginRuleCapturedEOL,
						this.endRule,
						this.nameScopesList,
						e
					);
		}
		withEndRule(e) {
			return this.endRule === e
				? this
				: new Oe(
						this.parent,
						this.ruleId,
						this._enterPos,
						this._anchorPos,
						this.beginRuleCapturedEOL,
						e,
						this.nameScopesList,
						this.contentNameScopesList
					);
		}
		hasSameRuleAs(e) {
			let n = this;
			for (; n && n._enterPos === e._enterPos; ) {
				if (n.ruleId === e.ruleId) return !0;
				n = n.parent;
			}
			return !1;
		}
		toStateStackFrame() {
			return {
				ruleId: this.ruleId,
				beginRuleCapturedEOL: this.beginRuleCapturedEOL,
				endRule: this.endRule,
				nameScopesList:
					this.nameScopesList?.getExtensionIfDefined(
						this.parent?.nameScopesList ?? null
					) ?? [],
				contentNameScopesList:
					this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
			};
		}
		static pushFrame(e, n) {
			const r = yt.fromExtension(e?.nameScopesList ?? null, n.nameScopesList);
			return new Oe(
				e,
				n.ruleId,
				n.enterPos ?? -1,
				n.anchorPos ?? -1,
				n.beginRuleCapturedEOL,
				n.endRule,
				r,
				yt.fromExtension(r, n.contentNameScopesList)
			);
		}
	},
	sl = class {
		balancedBracketScopes;
		unbalancedBracketScopes;
		allowAny = !1;
		constructor(t, e) {
			((this.balancedBracketScopes = t.flatMap((n) =>
				n === '*' ? ((this.allowAny = !0), []) : Xt(n, Zt).map((r) => r.matcher)
			)),
				(this.unbalancedBracketScopes = e.flatMap((n) => Xt(n, Zt).map((r) => r.matcher))));
		}
		get matchesAlways() {
			return this.allowAny && this.unbalancedBracketScopes.length === 0;
		}
		get matchesNever() {
			return this.balancedBracketScopes.length === 0 && !this.allowAny;
		}
		match(t) {
			for (const e of this.unbalancedBracketScopes) if (e(t)) return !1;
			for (const e of this.balancedBracketScopes) if (e(t)) return !0;
			return this.allowAny;
		}
	},
	il = class {
		constructor(t, e, n, r) {
			((this.balancedBracketSelectors = r),
				(this._emitBinaryTokens = t),
				(this._tokenTypeOverrides = n),
				(this._lineText = null),
				(this._tokens = []),
				(this._binaryTokens = []),
				(this._lastTokenEndIndex = 0));
		}
		_emitBinaryTokens;
		_lineText;
		_tokens;
		_binaryTokens;
		_lastTokenEndIndex;
		_tokenTypeOverrides;
		produce(t, e) {
			this.produceFromScopes(t.contentNameScopesList, e);
		}
		produceFromScopes(t, e) {
			if (this._lastTokenEndIndex >= e) return;
			if (this._emitBinaryTokens) {
				let r = t?.tokenAttributes ?? 0,
					o = !1;
				if (
					(this.balancedBracketSelectors?.matchesAlways && (o = !0),
					this._tokenTypeOverrides.length > 0 ||
						(this.balancedBracketSelectors &&
							!this.balancedBracketSelectors.matchesAlways &&
							!this.balancedBracketSelectors.matchesNever))
				) {
					const s = t?.getScopeNames() ?? [];
					for (const i of this._tokenTypeOverrides)
						i.matcher(s) && (r = rt.set(r, 0, i.type, null, -1, 0, 0));
					this.balancedBracketSelectors && (o = this.balancedBracketSelectors.match(s));
				}
				if (
					(o && (r = rt.set(r, 0, 8, o, -1, 0, 0)),
					this._binaryTokens.length > 0 &&
						this._binaryTokens[this._binaryTokens.length - 1] === r)
				) {
					this._lastTokenEndIndex = e;
					return;
				}
				(this._binaryTokens.push(this._lastTokenEndIndex),
					this._binaryTokens.push(r),
					(this._lastTokenEndIndex = e));
				return;
			}
			const n = t?.getScopeNames() ?? [];
			(this._tokens.push({ startIndex: this._lastTokenEndIndex, endIndex: e, scopes: n }),
				(this._lastTokenEndIndex = e));
		}
		getResult(t, e) {
			return (
				this._tokens.length > 0 &&
					this._tokens[this._tokens.length - 1].startIndex === e - 1 &&
					this._tokens.pop(),
				this._tokens.length === 0 &&
					((this._lastTokenEndIndex = -1),
					this.produce(t, e),
					(this._tokens[this._tokens.length - 1].startIndex = 0)),
				this._tokens
			);
		}
		getBinaryResult(t, e) {
			(this._binaryTokens.length > 0 &&
				this._binaryTokens[this._binaryTokens.length - 2] === e - 1 &&
				(this._binaryTokens.pop(), this._binaryTokens.pop()),
				this._binaryTokens.length === 0 &&
					((this._lastTokenEndIndex = -1),
					this.produce(t, e),
					(this._binaryTokens[this._binaryTokens.length - 2] = 0)));
			const n = new Uint32Array(this._binaryTokens.length);
			for (let r = 0, o = this._binaryTokens.length; r < o; r++) n[r] = this._binaryTokens[r];
			return n;
		}
	},
	al = class {
		constructor(t, e) {
			((this._onigLib = e), (this._theme = t));
		}
		_grammars = new Map();
		_rawGrammars = new Map();
		_injectionGrammars = new Map();
		_theme;
		dispose() {
			for (const t of this._grammars.values()) t.dispose();
		}
		setTheme(t) {
			this._theme = t;
		}
		getColorMap() {
			return this._theme.getColorMap();
		}
		addGrammar(t, e) {
			(this._rawGrammars.set(t.scopeName, t),
				e && this._injectionGrammars.set(t.scopeName, e));
		}
		lookup(t) {
			return this._rawGrammars.get(t);
		}
		injections(t) {
			return this._injectionGrammars.get(t);
		}
		getDefaults() {
			return this._theme.getDefaults();
		}
		themeMatch(t) {
			return this._theme.match(t);
		}
		grammarForScopeName(t, e, n, r, o) {
			if (!this._grammars.has(t)) {
				let s = this._rawGrammars.get(t);
				if (!s) return null;
				this._grammars.set(t, nl(t, s, e, n, r, o, this, this._onigLib));
			}
			return this._grammars.get(t);
		}
	},
	ll = class {
		_options;
		_syncRegistry;
		_ensureGrammarCache;
		constructor(e) {
			((this._options = e),
				(this._syncRegistry = new al(
					qt.createFromRawTheme(e.theme, e.colorMap),
					e.onigLib
				)),
				(this._ensureGrammarCache = new Map()));
		}
		dispose() {
			this._syncRegistry.dispose();
		}
		setTheme(e, n) {
			this._syncRegistry.setTheme(qt.createFromRawTheme(e, n));
		}
		getColorMap() {
			return this._syncRegistry.getColorMap();
		}
		loadGrammarWithEmbeddedLanguages(e, n, r) {
			return this.loadGrammarWithConfiguration(e, n, { embeddedLanguages: r });
		}
		loadGrammarWithConfiguration(e, n, r) {
			return this._loadGrammar(
				e,
				n,
				r.embeddedLanguages,
				r.tokenTypes,
				new sl(r.balancedBracketSelectors || [], r.unbalancedBracketSelectors || [])
			);
		}
		loadGrammar(e) {
			return this._loadGrammar(e, 0, null, null, null);
		}
		_loadGrammar(e, n, r, o, s) {
			const i = new Da(this._syncRegistry, e);
			for (; i.Q.length > 0; )
				(i.Q.map((l) => this._loadSingleGrammar(l.scopeName)), i.processQueue());
			return this._grammarForScopeName(e, n, r, o, s);
		}
		_loadSingleGrammar(e) {
			this._ensureGrammarCache.has(e) ||
				(this._doLoadSingleGrammar(e), this._ensureGrammarCache.set(e, !0));
		}
		_doLoadSingleGrammar(e) {
			const n = this._options.loadGrammar(e);
			if (n) {
				const r =
					typeof this._options.getInjections == 'function'
						? this._options.getInjections(e)
						: void 0;
				this._syncRegistry.addGrammar(n, r);
			}
		}
		addGrammar(e, n = [], r = 0, o = null) {
			return (
				this._syncRegistry.addGrammar(e, n),
				this._grammarForScopeName(e.scopeName, r, o)
			);
		}
		_grammarForScopeName(e, n = 0, r = null, o = null, s = null) {
			return this._syncRegistry.grammarForScopeName(e, n, r, o, s);
		}
	},
	Zn = Kn.NULL;
const cl = [
	'area',
	'base',
	'basefont',
	'bgsound',
	'br',
	'col',
	'command',
	'embed',
	'frame',
	'hr',
	'image',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
];
class vt {
	constructor(e, n, r) {
		((this.normal = n), (this.property = e), r && (this.space = r));
	}
}
vt.prototype.normal = {};
vt.prototype.property = {};
vt.prototype.space = void 0;
function bs(t, e) {
	const n = {},
		r = {};
	for (const o of t) (Object.assign(n, o.property), Object.assign(r, o.normal));
	return new vt(n, r, e);
}
function Qn(t) {
	return t.toLowerCase();
}
class ie {
	constructor(e, n) {
		((this.attribute = n), (this.property = e));
	}
}
ie.prototype.attribute = '';
ie.prototype.booleanish = !1;
ie.prototype.boolean = !1;
ie.prototype.commaOrSpaceSeparated = !1;
ie.prototype.commaSeparated = !1;
ie.prototype.defined = !1;
ie.prototype.mustUseProperty = !1;
ie.prototype.number = !1;
ie.prototype.overloadedBoolean = !1;
ie.prototype.property = '';
ie.prototype.spaceSeparated = !1;
ie.prototype.space = void 0;
let ul = 0;
const R = Fe(),
	z = Fe(),
	Jn = Fe(),
	m = Fe(),
	M = Fe(),
	tt = Fe(),
	ae = Fe();
function Fe() {
	return 2 ** ++ul;
}
const er = Object.freeze(
		Object.defineProperty(
			{
				__proto__: null,
				boolean: R,
				booleanish: z,
				commaOrSpaceSeparated: ae,
				commaSeparated: tt,
				number: m,
				overloadedBoolean: Jn,
				spaceSeparated: M
			},
			Symbol.toStringTag,
			{ value: 'Module' }
		)
	),
	On = Object.keys(er);
class fr extends ie {
	constructor(e, n, r, o) {
		let s = -1;
		if ((super(e, n), yo(this, 'space', o), typeof r == 'number'))
			for (; ++s < On.length; ) {
				const i = On[s];
				yo(this, On[s], (r & er[i]) === er[i]);
			}
	}
}
fr.prototype.defined = !0;
function yo(t, e, n) {
	n && (t[e] = n);
}
function ot(t) {
	const e = {},
		n = {};
	for (const [r, o] of Object.entries(t.properties)) {
		const s = new fr(r, t.transform(t.attributes || {}, r), o, t.space);
		(t.mustUseProperty && t.mustUseProperty.includes(r) && (s.mustUseProperty = !0),
			(e[r] = s),
			(n[Qn(r)] = r),
			(n[Qn(s.attribute)] = r));
	}
	return new vt(e, n, t.space);
}
const ws = ot({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: z,
		ariaAutoComplete: null,
		ariaBusy: z,
		ariaChecked: z,
		ariaColCount: m,
		ariaColIndex: m,
		ariaColSpan: m,
		ariaControls: M,
		ariaCurrent: null,
		ariaDescribedBy: M,
		ariaDetails: null,
		ariaDisabled: z,
		ariaDropEffect: M,
		ariaErrorMessage: null,
		ariaExpanded: z,
		ariaFlowTo: M,
		ariaGrabbed: z,
		ariaHasPopup: null,
		ariaHidden: z,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: M,
		ariaLevel: m,
		ariaLive: null,
		ariaModal: z,
		ariaMultiLine: z,
		ariaMultiSelectable: z,
		ariaOrientation: null,
		ariaOwns: M,
		ariaPlaceholder: null,
		ariaPosInSet: m,
		ariaPressed: z,
		ariaReadOnly: z,
		ariaRelevant: null,
		ariaRequired: z,
		ariaRoleDescription: M,
		ariaRowCount: m,
		ariaRowIndex: m,
		ariaRowSpan: m,
		ariaSelected: z,
		ariaSetSize: m,
		ariaSort: null,
		ariaValueMax: m,
		ariaValueMin: m,
		ariaValueNow: m,
		ariaValueText: null,
		role: null
	},
	transform(t, e) {
		return e === 'role' ? e : 'aria-' + e.slice(4).toLowerCase();
	}
});
function Cs(t, e) {
	return e in t ? t[e] : e;
}
function Ss(t, e) {
	return Cs(t, e.toLowerCase());
}
const fl = ot({
		attributes: {
			acceptcharset: 'accept-charset',
			classname: 'class',
			htmlfor: 'for',
			httpequiv: 'http-equiv'
		},
		mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
		properties: {
			abbr: null,
			accept: tt,
			acceptCharset: M,
			accessKey: M,
			action: null,
			allow: null,
			allowFullScreen: R,
			allowPaymentRequest: R,
			allowUserMedia: R,
			alt: null,
			as: null,
			async: R,
			autoCapitalize: null,
			autoComplete: M,
			autoFocus: R,
			autoPlay: R,
			blocking: M,
			capture: null,
			charSet: null,
			checked: R,
			cite: null,
			className: M,
			cols: m,
			colSpan: null,
			content: null,
			contentEditable: z,
			controls: R,
			controlsList: M,
			coords: m | tt,
			crossOrigin: null,
			data: null,
			dateTime: null,
			decoding: null,
			default: R,
			defer: R,
			dir: null,
			dirName: null,
			disabled: R,
			download: Jn,
			draggable: z,
			encType: null,
			enterKeyHint: null,
			fetchPriority: null,
			form: null,
			formAction: null,
			formEncType: null,
			formMethod: null,
			formNoValidate: R,
			formTarget: null,
			headers: M,
			height: m,
			hidden: Jn,
			high: m,
			href: null,
			hrefLang: null,
			htmlFor: M,
			httpEquiv: M,
			id: null,
			imageSizes: null,
			imageSrcSet: null,
			inert: R,
			inputMode: null,
			integrity: null,
			is: null,
			isMap: R,
			itemId: null,
			itemProp: M,
			itemRef: M,
			itemScope: R,
			itemType: M,
			kind: null,
			label: null,
			lang: null,
			language: null,
			list: null,
			loading: null,
			loop: R,
			low: m,
			manifest: null,
			max: null,
			maxLength: m,
			media: null,
			method: null,
			min: null,
			minLength: m,
			multiple: R,
			muted: R,
			name: null,
			nonce: null,
			noModule: R,
			noValidate: R,
			onAbort: null,
			onAfterPrint: null,
			onAuxClick: null,
			onBeforeMatch: null,
			onBeforePrint: null,
			onBeforeToggle: null,
			onBeforeUnload: null,
			onBlur: null,
			onCancel: null,
			onCanPlay: null,
			onCanPlayThrough: null,
			onChange: null,
			onClick: null,
			onClose: null,
			onContextLost: null,
			onContextMenu: null,
			onContextRestored: null,
			onCopy: null,
			onCueChange: null,
			onCut: null,
			onDblClick: null,
			onDrag: null,
			onDragEnd: null,
			onDragEnter: null,
			onDragExit: null,
			onDragLeave: null,
			onDragOver: null,
			onDragStart: null,
			onDrop: null,
			onDurationChange: null,
			onEmptied: null,
			onEnded: null,
			onError: null,
			onFocus: null,
			onFormData: null,
			onHashChange: null,
			onInput: null,
			onInvalid: null,
			onKeyDown: null,
			onKeyPress: null,
			onKeyUp: null,
			onLanguageChange: null,
			onLoad: null,
			onLoadedData: null,
			onLoadedMetadata: null,
			onLoadEnd: null,
			onLoadStart: null,
			onMessage: null,
			onMessageError: null,
			onMouseDown: null,
			onMouseEnter: null,
			onMouseLeave: null,
			onMouseMove: null,
			onMouseOut: null,
			onMouseOver: null,
			onMouseUp: null,
			onOffline: null,
			onOnline: null,
			onPageHide: null,
			onPageShow: null,
			onPaste: null,
			onPause: null,
			onPlay: null,
			onPlaying: null,
			onPopState: null,
			onProgress: null,
			onRateChange: null,
			onRejectionHandled: null,
			onReset: null,
			onResize: null,
			onScroll: null,
			onScrollEnd: null,
			onSecurityPolicyViolation: null,
			onSeeked: null,
			onSeeking: null,
			onSelect: null,
			onSlotChange: null,
			onStalled: null,
			onStorage: null,
			onSubmit: null,
			onSuspend: null,
			onTimeUpdate: null,
			onToggle: null,
			onUnhandledRejection: null,
			onUnload: null,
			onVolumeChange: null,
			onWaiting: null,
			onWheel: null,
			open: R,
			optimum: m,
			pattern: null,
			ping: M,
			placeholder: null,
			playsInline: R,
			popover: null,
			popoverTarget: null,
			popoverTargetAction: null,
			poster: null,
			preload: null,
			readOnly: R,
			referrerPolicy: null,
			rel: M,
			required: R,
			reversed: R,
			rows: m,
			rowSpan: m,
			sandbox: M,
			scope: null,
			scoped: R,
			seamless: R,
			selected: R,
			shadowRootClonable: R,
			shadowRootDelegatesFocus: R,
			shadowRootMode: null,
			shape: null,
			size: m,
			sizes: null,
			slot: null,
			span: m,
			spellCheck: z,
			src: null,
			srcDoc: null,
			srcLang: null,
			srcSet: null,
			start: m,
			step: null,
			style: null,
			tabIndex: m,
			target: null,
			title: null,
			translate: null,
			type: null,
			typeMustMatch: R,
			useMap: null,
			value: z,
			width: m,
			wrap: null,
			writingSuggestions: null,
			align: null,
			aLink: null,
			archive: M,
			axis: null,
			background: null,
			bgColor: null,
			border: m,
			borderColor: null,
			bottomMargin: m,
			cellPadding: null,
			cellSpacing: null,
			char: null,
			charOff: null,
			classId: null,
			clear: null,
			code: null,
			codeBase: null,
			codeType: null,
			color: null,
			compact: R,
			declare: R,
			event: null,
			face: null,
			frame: null,
			frameBorder: null,
			hSpace: m,
			leftMargin: m,
			link: null,
			longDesc: null,
			lowSrc: null,
			marginHeight: m,
			marginWidth: m,
			noResize: R,
			noHref: R,
			noShade: R,
			noWrap: R,
			object: null,
			profile: null,
			prompt: null,
			rev: null,
			rightMargin: m,
			rules: null,
			scheme: null,
			scrolling: z,
			standby: null,
			summary: null,
			text: null,
			topMargin: m,
			valueType: null,
			version: null,
			vAlign: null,
			vLink: null,
			vSpace: m,
			allowTransparency: null,
			autoCorrect: null,
			autoSave: null,
			disablePictureInPicture: R,
			disableRemotePlayback: R,
			prefix: null,
			property: null,
			results: m,
			security: null,
			unselectable: null
		},
		space: 'html',
		transform: Ss
	}),
	hl = ot({
		attributes: {
			accentHeight: 'accent-height',
			alignmentBaseline: 'alignment-baseline',
			arabicForm: 'arabic-form',
			baselineShift: 'baseline-shift',
			capHeight: 'cap-height',
			className: 'class',
			clipPath: 'clip-path',
			clipRule: 'clip-rule',
			colorInterpolation: 'color-interpolation',
			colorInterpolationFilters: 'color-interpolation-filters',
			colorProfile: 'color-profile',
			colorRendering: 'color-rendering',
			crossOrigin: 'crossorigin',
			dataType: 'datatype',
			dominantBaseline: 'dominant-baseline',
			enableBackground: 'enable-background',
			fillOpacity: 'fill-opacity',
			fillRule: 'fill-rule',
			floodColor: 'flood-color',
			floodOpacity: 'flood-opacity',
			fontFamily: 'font-family',
			fontSize: 'font-size',
			fontSizeAdjust: 'font-size-adjust',
			fontStretch: 'font-stretch',
			fontStyle: 'font-style',
			fontVariant: 'font-variant',
			fontWeight: 'font-weight',
			glyphName: 'glyph-name',
			glyphOrientationHorizontal: 'glyph-orientation-horizontal',
			glyphOrientationVertical: 'glyph-orientation-vertical',
			hrefLang: 'hreflang',
			horizAdvX: 'horiz-adv-x',
			horizOriginX: 'horiz-origin-x',
			horizOriginY: 'horiz-origin-y',
			imageRendering: 'image-rendering',
			letterSpacing: 'letter-spacing',
			lightingColor: 'lighting-color',
			markerEnd: 'marker-end',
			markerMid: 'marker-mid',
			markerStart: 'marker-start',
			navDown: 'nav-down',
			navDownLeft: 'nav-down-left',
			navDownRight: 'nav-down-right',
			navLeft: 'nav-left',
			navNext: 'nav-next',
			navPrev: 'nav-prev',
			navRight: 'nav-right',
			navUp: 'nav-up',
			navUpLeft: 'nav-up-left',
			navUpRight: 'nav-up-right',
			onAbort: 'onabort',
			onActivate: 'onactivate',
			onAfterPrint: 'onafterprint',
			onBeforePrint: 'onbeforeprint',
			onBegin: 'onbegin',
			onCancel: 'oncancel',
			onCanPlay: 'oncanplay',
			onCanPlayThrough: 'oncanplaythrough',
			onChange: 'onchange',
			onClick: 'onclick',
			onClose: 'onclose',
			onCopy: 'oncopy',
			onCueChange: 'oncuechange',
			onCut: 'oncut',
			onDblClick: 'ondblclick',
			onDrag: 'ondrag',
			onDragEnd: 'ondragend',
			onDragEnter: 'ondragenter',
			onDragExit: 'ondragexit',
			onDragLeave: 'ondragleave',
			onDragOver: 'ondragover',
			onDragStart: 'ondragstart',
			onDrop: 'ondrop',
			onDurationChange: 'ondurationchange',
			onEmptied: 'onemptied',
			onEnd: 'onend',
			onEnded: 'onended',
			onError: 'onerror',
			onFocus: 'onfocus',
			onFocusIn: 'onfocusin',
			onFocusOut: 'onfocusout',
			onHashChange: 'onhashchange',
			onInput: 'oninput',
			onInvalid: 'oninvalid',
			onKeyDown: 'onkeydown',
			onKeyPress: 'onkeypress',
			onKeyUp: 'onkeyup',
			onLoad: 'onload',
			onLoadedData: 'onloadeddata',
			onLoadedMetadata: 'onloadedmetadata',
			onLoadStart: 'onloadstart',
			onMessage: 'onmessage',
			onMouseDown: 'onmousedown',
			onMouseEnter: 'onmouseenter',
			onMouseLeave: 'onmouseleave',
			onMouseMove: 'onmousemove',
			onMouseOut: 'onmouseout',
			onMouseOver: 'onmouseover',
			onMouseUp: 'onmouseup',
			onMouseWheel: 'onmousewheel',
			onOffline: 'onoffline',
			onOnline: 'ononline',
			onPageHide: 'onpagehide',
			onPageShow: 'onpageshow',
			onPaste: 'onpaste',
			onPause: 'onpause',
			onPlay: 'onplay',
			onPlaying: 'onplaying',
			onPopState: 'onpopstate',
			onProgress: 'onprogress',
			onRateChange: 'onratechange',
			onRepeat: 'onrepeat',
			onReset: 'onreset',
			onResize: 'onresize',
			onScroll: 'onscroll',
			onSeeked: 'onseeked',
			onSeeking: 'onseeking',
			onSelect: 'onselect',
			onShow: 'onshow',
			onStalled: 'onstalled',
			onStorage: 'onstorage',
			onSubmit: 'onsubmit',
			onSuspend: 'onsuspend',
			onTimeUpdate: 'ontimeupdate',
			onToggle: 'ontoggle',
			onUnload: 'onunload',
			onVolumeChange: 'onvolumechange',
			onWaiting: 'onwaiting',
			onZoom: 'onzoom',
			overlinePosition: 'overline-position',
			overlineThickness: 'overline-thickness',
			paintOrder: 'paint-order',
			panose1: 'panose-1',
			pointerEvents: 'pointer-events',
			referrerPolicy: 'referrerpolicy',
			renderingIntent: 'rendering-intent',
			shapeRendering: 'shape-rendering',
			stopColor: 'stop-color',
			stopOpacity: 'stop-opacity',
			strikethroughPosition: 'strikethrough-position',
			strikethroughThickness: 'strikethrough-thickness',
			strokeDashArray: 'stroke-dasharray',
			strokeDashOffset: 'stroke-dashoffset',
			strokeLineCap: 'stroke-linecap',
			strokeLineJoin: 'stroke-linejoin',
			strokeMiterLimit: 'stroke-miterlimit',
			strokeOpacity: 'stroke-opacity',
			strokeWidth: 'stroke-width',
			tabIndex: 'tabindex',
			textAnchor: 'text-anchor',
			textDecoration: 'text-decoration',
			textRendering: 'text-rendering',
			transformOrigin: 'transform-origin',
			typeOf: 'typeof',
			underlinePosition: 'underline-position',
			underlineThickness: 'underline-thickness',
			unicodeBidi: 'unicode-bidi',
			unicodeRange: 'unicode-range',
			unitsPerEm: 'units-per-em',
			vAlphabetic: 'v-alphabetic',
			vHanging: 'v-hanging',
			vIdeographic: 'v-ideographic',
			vMathematical: 'v-mathematical',
			vectorEffect: 'vector-effect',
			vertAdvY: 'vert-adv-y',
			vertOriginX: 'vert-origin-x',
			vertOriginY: 'vert-origin-y',
			wordSpacing: 'word-spacing',
			writingMode: 'writing-mode',
			xHeight: 'x-height',
			playbackOrder: 'playbackorder',
			timelineBegin: 'timelinebegin'
		},
		properties: {
			about: ae,
			accentHeight: m,
			accumulate: null,
			additive: null,
			alignmentBaseline: null,
			alphabetic: m,
			amplitude: m,
			arabicForm: null,
			ascent: m,
			attributeName: null,
			attributeType: null,
			azimuth: m,
			bandwidth: null,
			baselineShift: null,
			baseFrequency: null,
			baseProfile: null,
			bbox: null,
			begin: null,
			bias: m,
			by: null,
			calcMode: null,
			capHeight: m,
			className: M,
			clip: null,
			clipPath: null,
			clipPathUnits: null,
			clipRule: null,
			color: null,
			colorInterpolation: null,
			colorInterpolationFilters: null,
			colorProfile: null,
			colorRendering: null,
			content: null,
			contentScriptType: null,
			contentStyleType: null,
			crossOrigin: null,
			cursor: null,
			cx: null,
			cy: null,
			d: null,
			dataType: null,
			defaultAction: null,
			descent: m,
			diffuseConstant: m,
			direction: null,
			display: null,
			dur: null,
			divisor: m,
			dominantBaseline: null,
			download: R,
			dx: null,
			dy: null,
			edgeMode: null,
			editable: null,
			elevation: m,
			enableBackground: null,
			end: null,
			event: null,
			exponent: m,
			externalResourcesRequired: null,
			fill: null,
			fillOpacity: m,
			fillRule: null,
			filter: null,
			filterRes: null,
			filterUnits: null,
			floodColor: null,
			floodOpacity: null,
			focusable: null,
			focusHighlight: null,
			fontFamily: null,
			fontSize: null,
			fontSizeAdjust: null,
			fontStretch: null,
			fontStyle: null,
			fontVariant: null,
			fontWeight: null,
			format: null,
			fr: null,
			from: null,
			fx: null,
			fy: null,
			g1: tt,
			g2: tt,
			glyphName: tt,
			glyphOrientationHorizontal: null,
			glyphOrientationVertical: null,
			glyphRef: null,
			gradientTransform: null,
			gradientUnits: null,
			handler: null,
			hanging: m,
			hatchContentUnits: null,
			hatchUnits: null,
			height: null,
			href: null,
			hrefLang: null,
			horizAdvX: m,
			horizOriginX: m,
			horizOriginY: m,
			id: null,
			ideographic: m,
			imageRendering: null,
			initialVisibility: null,
			in: null,
			in2: null,
			intercept: m,
			k: m,
			k1: m,
			k2: m,
			k3: m,
			k4: m,
			kernelMatrix: ae,
			kernelUnitLength: null,
			keyPoints: null,
			keySplines: null,
			keyTimes: null,
			kerning: null,
			lang: null,
			lengthAdjust: null,
			letterSpacing: null,
			lightingColor: null,
			limitingConeAngle: m,
			local: null,
			markerEnd: null,
			markerMid: null,
			markerStart: null,
			markerHeight: null,
			markerUnits: null,
			markerWidth: null,
			mask: null,
			maskContentUnits: null,
			maskUnits: null,
			mathematical: null,
			max: null,
			media: null,
			mediaCharacterEncoding: null,
			mediaContentEncodings: null,
			mediaSize: m,
			mediaTime: null,
			method: null,
			min: null,
			mode: null,
			name: null,
			navDown: null,
			navDownLeft: null,
			navDownRight: null,
			navLeft: null,
			navNext: null,
			navPrev: null,
			navRight: null,
			navUp: null,
			navUpLeft: null,
			navUpRight: null,
			numOctaves: null,
			observer: null,
			offset: null,
			onAbort: null,
			onActivate: null,
			onAfterPrint: null,
			onBeforePrint: null,
			onBegin: null,
			onCancel: null,
			onCanPlay: null,
			onCanPlayThrough: null,
			onChange: null,
			onClick: null,
			onClose: null,
			onCopy: null,
			onCueChange: null,
			onCut: null,
			onDblClick: null,
			onDrag: null,
			onDragEnd: null,
			onDragEnter: null,
			onDragExit: null,
			onDragLeave: null,
			onDragOver: null,
			onDragStart: null,
			onDrop: null,
			onDurationChange: null,
			onEmptied: null,
			onEnd: null,
			onEnded: null,
			onError: null,
			onFocus: null,
			onFocusIn: null,
			onFocusOut: null,
			onHashChange: null,
			onInput: null,
			onInvalid: null,
			onKeyDown: null,
			onKeyPress: null,
			onKeyUp: null,
			onLoad: null,
			onLoadedData: null,
			onLoadedMetadata: null,
			onLoadStart: null,
			onMessage: null,
			onMouseDown: null,
			onMouseEnter: null,
			onMouseLeave: null,
			onMouseMove: null,
			onMouseOut: null,
			onMouseOver: null,
			onMouseUp: null,
			onMouseWheel: null,
			onOffline: null,
			onOnline: null,
			onPageHide: null,
			onPageShow: null,
			onPaste: null,
			onPause: null,
			onPlay: null,
			onPlaying: null,
			onPopState: null,
			onProgress: null,
			onRateChange: null,
			onRepeat: null,
			onReset: null,
			onResize: null,
			onScroll: null,
			onSeeked: null,
			onSeeking: null,
			onSelect: null,
			onShow: null,
			onStalled: null,
			onStorage: null,
			onSubmit: null,
			onSuspend: null,
			onTimeUpdate: null,
			onToggle: null,
			onUnload: null,
			onVolumeChange: null,
			onWaiting: null,
			onZoom: null,
			opacity: null,
			operator: null,
			order: null,
			orient: null,
			orientation: null,
			origin: null,
			overflow: null,
			overlay: null,
			overlinePosition: m,
			overlineThickness: m,
			paintOrder: null,
			panose1: null,
			path: null,
			pathLength: m,
			patternContentUnits: null,
			patternTransform: null,
			patternUnits: null,
			phase: null,
			ping: M,
			pitch: null,
			playbackOrder: null,
			pointerEvents: null,
			points: null,
			pointsAtX: m,
			pointsAtY: m,
			pointsAtZ: m,
			preserveAlpha: null,
			preserveAspectRatio: null,
			primitiveUnits: null,
			propagate: null,
			property: ae,
			r: null,
			radius: null,
			referrerPolicy: null,
			refX: null,
			refY: null,
			rel: ae,
			rev: ae,
			renderingIntent: null,
			repeatCount: null,
			repeatDur: null,
			requiredExtensions: ae,
			requiredFeatures: ae,
			requiredFonts: ae,
			requiredFormats: ae,
			resource: null,
			restart: null,
			result: null,
			rotate: null,
			rx: null,
			ry: null,
			scale: null,
			seed: null,
			shapeRendering: null,
			side: null,
			slope: null,
			snapshotTime: null,
			specularConstant: m,
			specularExponent: m,
			spreadMethod: null,
			spacing: null,
			startOffset: null,
			stdDeviation: null,
			stemh: null,
			stemv: null,
			stitchTiles: null,
			stopColor: null,
			stopOpacity: null,
			strikethroughPosition: m,
			strikethroughThickness: m,
			string: null,
			stroke: null,
			strokeDashArray: ae,
			strokeDashOffset: null,
			strokeLineCap: null,
			strokeLineJoin: null,
			strokeMiterLimit: m,
			strokeOpacity: m,
			strokeWidth: null,
			style: null,
			surfaceScale: m,
			syncBehavior: null,
			syncBehaviorDefault: null,
			syncMaster: null,
			syncTolerance: null,
			syncToleranceDefault: null,
			systemLanguage: ae,
			tabIndex: m,
			tableValues: null,
			target: null,
			targetX: m,
			targetY: m,
			textAnchor: null,
			textDecoration: null,
			textRendering: null,
			textLength: null,
			timelineBegin: null,
			title: null,
			transformBehavior: null,
			type: null,
			typeOf: ae,
			to: null,
			transform: null,
			transformOrigin: null,
			u1: null,
			u2: null,
			underlinePosition: m,
			underlineThickness: m,
			unicode: null,
			unicodeBidi: null,
			unicodeRange: null,
			unitsPerEm: m,
			values: null,
			vAlphabetic: m,
			vMathematical: m,
			vectorEffect: null,
			vHanging: m,
			vIdeographic: m,
			version: null,
			vertAdvY: m,
			vertOriginX: m,
			vertOriginY: m,
			viewBox: null,
			viewTarget: null,
			visibility: null,
			width: null,
			widths: null,
			wordSpacing: null,
			writingMode: null,
			x: null,
			x1: null,
			x2: null,
			xChannelSelector: null,
			xHeight: m,
			y: null,
			y1: null,
			y2: null,
			yChannelSelector: null,
			z: null,
			zoomAndPan: null
		},
		space: 'svg',
		transform: Cs
	}),
	Es = ot({
		properties: {
			xLinkActuate: null,
			xLinkArcRole: null,
			xLinkHref: null,
			xLinkRole: null,
			xLinkShow: null,
			xLinkTitle: null,
			xLinkType: null
		},
		space: 'xlink',
		transform(t, e) {
			return 'xlink:' + e.slice(5).toLowerCase();
		}
	}),
	As = ot({
		attributes: { xmlnsxlink: 'xmlns:xlink' },
		properties: { xmlnsXLink: null, xmlns: null },
		space: 'xmlns',
		transform: Ss
	}),
	ks = ot({
		properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
		space: 'xml',
		transform(t, e) {
			return 'xml:' + e.slice(3).toLowerCase();
		}
	}),
	pl = /[A-Z]/g,
	_o = /-[a-z]/g,
	dl = /^data[-\w.:]+$/i;
function gl(t, e) {
	const n = Qn(e);
	let r = e,
		o = ie;
	if (n in t.normal) return t.property[t.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === 'data' && dl.test(e)) {
		if (e.charAt(4) === '-') {
			const s = e.slice(5).replace(_o, yl);
			r = 'data' + s.charAt(0).toUpperCase() + s.slice(1);
		} else {
			const s = e.slice(4);
			if (!_o.test(s)) {
				let i = s.replace(pl, ml);
				(i.charAt(0) !== '-' && (i = '-' + i), (e = 'data' + i));
			}
		}
		o = fr;
	}
	return new o(r, e);
}
function ml(t) {
	return '-' + t.toLowerCase();
}
function yl(t) {
	return t.charAt(1).toUpperCase();
}
const _l = bs([ws, fl, Es, As, ks], 'html'),
	vs = bs([ws, hl, Es, As, ks], 'svg'),
	bo = {}.hasOwnProperty;
function bl(t, e) {
	const n = e || {};
	function r(o, ...s) {
		let i = r.invalid;
		const l = r.handlers;
		if (o && bo.call(o, t)) {
			const a = String(o[t]);
			i = bo.call(l, a) ? l[a] : r.unknown;
		}
		if (i) return i.call(this, o, ...s);
	}
	return ((r.handlers = n.handlers || {}), (r.invalid = n.invalid), (r.unknown = n.unknown), r);
}
const wl = /["&'<>`]/g,
	Cl = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
	Sl = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,
	El = /[|\\{}()[\]^$+*?.]/g,
	wo = new WeakMap();
function Al(t, e) {
	if (((t = t.replace(e.subset ? kl(e.subset) : wl, r)), e.subset || e.escapeOnly)) return t;
	return t.replace(Cl, n).replace(Sl, r);
	function n(o, s, i) {
		return e.format(
			(o.charCodeAt(0) - 55296) * 1024 + o.charCodeAt(1) - 56320 + 65536,
			i.charCodeAt(s + 2),
			e
		);
	}
	function r(o, s, i) {
		return e.format(o.charCodeAt(0), i.charCodeAt(s + 1), e);
	}
}
function kl(t) {
	let e = wo.get(t);
	return (e || ((e = vl(t)), wo.set(t, e)), e);
}
function vl(t) {
	const e = [];
	let n = -1;
	for (; ++n < t.length; ) e.push(t[n].replace(El, '\\$&'));
	return new RegExp('(?:' + e.join('|') + ')', 'g');
}
const xl = /[\dA-Fa-f]/;
function Tl(t, e, n) {
	const r = '&#x' + t.toString(16).toUpperCase();
	return n && e && !xl.test(String.fromCharCode(e)) ? r : r + ';';
}
const Rl = /\d/;
function Il(t, e, n) {
	const r = '&#' + String(t);
	return n && e && !Rl.test(String.fromCharCode(e)) ? r : r + ';';
}
const Nl = [
		'AElig',
		'AMP',
		'Aacute',
		'Acirc',
		'Agrave',
		'Aring',
		'Atilde',
		'Auml',
		'COPY',
		'Ccedil',
		'ETH',
		'Eacute',
		'Ecirc',
		'Egrave',
		'Euml',
		'GT',
		'Iacute',
		'Icirc',
		'Igrave',
		'Iuml',
		'LT',
		'Ntilde',
		'Oacute',
		'Ocirc',
		'Ograve',
		'Oslash',
		'Otilde',
		'Ouml',
		'QUOT',
		'REG',
		'THORN',
		'Uacute',
		'Ucirc',
		'Ugrave',
		'Uuml',
		'Yacute',
		'aacute',
		'acirc',
		'acute',
		'aelig',
		'agrave',
		'amp',
		'aring',
		'atilde',
		'auml',
		'brvbar',
		'ccedil',
		'cedil',
		'cent',
		'copy',
		'curren',
		'deg',
		'divide',
		'eacute',
		'ecirc',
		'egrave',
		'eth',
		'euml',
		'frac12',
		'frac14',
		'frac34',
		'gt',
		'iacute',
		'icirc',
		'iexcl',
		'igrave',
		'iquest',
		'iuml',
		'laquo',
		'lt',
		'macr',
		'micro',
		'middot',
		'nbsp',
		'not',
		'ntilde',
		'oacute',
		'ocirc',
		'ograve',
		'ordf',
		'ordm',
		'oslash',
		'otilde',
		'ouml',
		'para',
		'plusmn',
		'pound',
		'quot',
		'raquo',
		'reg',
		'sect',
		'shy',
		'sup1',
		'sup2',
		'sup3',
		'szlig',
		'thorn',
		'times',
		'uacute',
		'ucirc',
		'ugrave',
		'uml',
		'uuml',
		'yacute',
		'yen',
		'yuml'
	],
	Mn = {
		nbsp: ' ',
		iexcl: '¡',
		cent: '¢',
		pound: '£',
		curren: '¤',
		yen: '¥',
		brvbar: '¦',
		sect: '§',
		uml: '¨',
		copy: '©',
		ordf: 'ª',
		laquo: '«',
		not: '¬',
		shy: '­',
		reg: '®',
		macr: '¯',
		deg: '°',
		plusmn: '±',
		sup2: '²',
		sup3: '³',
		acute: '´',
		micro: 'µ',
		para: '¶',
		middot: '·',
		cedil: '¸',
		sup1: '¹',
		ordm: 'º',
		raquo: '»',
		frac14: '¼',
		frac12: '½',
		frac34: '¾',
		iquest: '¿',
		Agrave: 'À',
		Aacute: 'Á',
		Acirc: 'Â',
		Atilde: 'Ã',
		Auml: 'Ä',
		Aring: 'Å',
		AElig: 'Æ',
		Ccedil: 'Ç',
		Egrave: 'È',
		Eacute: 'É',
		Ecirc: 'Ê',
		Euml: 'Ë',
		Igrave: 'Ì',
		Iacute: 'Í',
		Icirc: 'Î',
		Iuml: 'Ï',
		ETH: 'Ð',
		Ntilde: 'Ñ',
		Ograve: 'Ò',
		Oacute: 'Ó',
		Ocirc: 'Ô',
		Otilde: 'Õ',
		Ouml: 'Ö',
		times: '×',
		Oslash: 'Ø',
		Ugrave: 'Ù',
		Uacute: 'Ú',
		Ucirc: 'Û',
		Uuml: 'Ü',
		Yacute: 'Ý',
		THORN: 'Þ',
		szlig: 'ß',
		agrave: 'à',
		aacute: 'á',
		acirc: 'â',
		atilde: 'ã',
		auml: 'ä',
		aring: 'å',
		aelig: 'æ',
		ccedil: 'ç',
		egrave: 'è',
		eacute: 'é',
		ecirc: 'ê',
		euml: 'ë',
		igrave: 'ì',
		iacute: 'í',
		icirc: 'î',
		iuml: 'ï',
		eth: 'ð',
		ntilde: 'ñ',
		ograve: 'ò',
		oacute: 'ó',
		ocirc: 'ô',
		otilde: 'õ',
		ouml: 'ö',
		divide: '÷',
		oslash: 'ø',
		ugrave: 'ù',
		uacute: 'ú',
		ucirc: 'û',
		uuml: 'ü',
		yacute: 'ý',
		thorn: 'þ',
		yuml: 'ÿ',
		fnof: 'ƒ',
		Alpha: 'Α',
		Beta: 'Β',
		Gamma: 'Γ',
		Delta: 'Δ',
		Epsilon: 'Ε',
		Zeta: 'Ζ',
		Eta: 'Η',
		Theta: 'Θ',
		Iota: 'Ι',
		Kappa: 'Κ',
		Lambda: 'Λ',
		Mu: 'Μ',
		Nu: 'Ν',
		Xi: 'Ξ',
		Omicron: 'Ο',
		Pi: 'Π',
		Rho: 'Ρ',
		Sigma: 'Σ',
		Tau: 'Τ',
		Upsilon: 'Υ',
		Phi: 'Φ',
		Chi: 'Χ',
		Psi: 'Ψ',
		Omega: 'Ω',
		alpha: 'α',
		beta: 'β',
		gamma: 'γ',
		delta: 'δ',
		epsilon: 'ε',
		zeta: 'ζ',
		eta: 'η',
		theta: 'θ',
		iota: 'ι',
		kappa: 'κ',
		lambda: 'λ',
		mu: 'μ',
		nu: 'ν',
		xi: 'ξ',
		omicron: 'ο',
		pi: 'π',
		rho: 'ρ',
		sigmaf: 'ς',
		sigma: 'σ',
		tau: 'τ',
		upsilon: 'υ',
		phi: 'φ',
		chi: 'χ',
		psi: 'ψ',
		omega: 'ω',
		thetasym: 'ϑ',
		upsih: 'ϒ',
		piv: 'ϖ',
		bull: '•',
		hellip: '…',
		prime: '′',
		Prime: '″',
		oline: '‾',
		frasl: '⁄',
		weierp: '℘',
		image: 'ℑ',
		real: 'ℜ',
		trade: '™',
		alefsym: 'ℵ',
		larr: '←',
		uarr: '↑',
		rarr: '→',
		darr: '↓',
		harr: '↔',
		crarr: '↵',
		lArr: '⇐',
		uArr: '⇑',
		rArr: '⇒',
		dArr: '⇓',
		hArr: '⇔',
		forall: '∀',
		part: '∂',
		exist: '∃',
		empty: '∅',
		nabla: '∇',
		isin: '∈',
		notin: '∉',
		ni: '∋',
		prod: '∏',
		sum: '∑',
		minus: '−',
		lowast: '∗',
		radic: '√',
		prop: '∝',
		infin: '∞',
		ang: '∠',
		and: '∧',
		or: '∨',
		cap: '∩',
		cup: '∪',
		int: '∫',
		there4: '∴',
		sim: '∼',
		cong: '≅',
		asymp: '≈',
		ne: '≠',
		equiv: '≡',
		le: '≤',
		ge: '≥',
		sub: '⊂',
		sup: '⊃',
		nsub: '⊄',
		sube: '⊆',
		supe: '⊇',
		oplus: '⊕',
		otimes: '⊗',
		perp: '⊥',
		sdot: '⋅',
		lceil: '⌈',
		rceil: '⌉',
		lfloor: '⌊',
		rfloor: '⌋',
		lang: '〈',
		rang: '〉',
		loz: '◊',
		spades: '♠',
		clubs: '♣',
		hearts: '♥',
		diams: '♦',
		quot: '"',
		amp: '&',
		lt: '<',
		gt: '>',
		OElig: 'Œ',
		oelig: 'œ',
		Scaron: 'Š',
		scaron: 'š',
		Yuml: 'Ÿ',
		circ: 'ˆ',
		tilde: '˜',
		ensp: ' ',
		emsp: ' ',
		thinsp: ' ',
		zwnj: '‌',
		zwj: '‍',
		lrm: '‎',
		rlm: '‏',
		ndash: '–',
		mdash: '—',
		lsquo: '‘',
		rsquo: '’',
		sbquo: '‚',
		ldquo: '“',
		rdquo: '”',
		bdquo: '„',
		dagger: '†',
		Dagger: '‡',
		permil: '‰',
		lsaquo: '‹',
		rsaquo: '›',
		euro: '€'
	},
	Ll = ['cent', 'copy', 'divide', 'gt', 'lt', 'not', 'para', 'times'],
	xs = {}.hasOwnProperty,
	tr = {};
let Ft;
for (Ft in Mn) xs.call(Mn, Ft) && (tr[Mn[Ft]] = Ft);
const Pl = /[^\dA-Za-z]/;
function Ol(t, e, n, r) {
	const o = String.fromCharCode(t);
	if (xs.call(tr, o)) {
		const s = tr[o],
			i = '&' + s;
		return n &&
			Nl.includes(s) &&
			!Ll.includes(s) &&
			(!r || (e && e !== 61 && Pl.test(String.fromCharCode(e))))
			? i
			: i + ';';
	}
	return '';
}
function Ml(t, e, n) {
	let r = Tl(t, e, n.omitOptionalSemicolons),
		o;
	if (
		((n.useNamedReferences || n.useShortestReferences) &&
			(o = Ol(t, e, n.omitOptionalSemicolons, n.attribute)),
		(n.useShortestReferences || !o) && n.useShortestReferences)
	) {
		const s = Il(t, e, n.omitOptionalSemicolons);
		s.length < r.length && (r = s);
	}
	return o && (!n.useShortestReferences || o.length < r.length) ? o : r;
}
function nt(t, e) {
	return Al(t, Object.assign({ format: Ml }, e));
}
const $l = /^>|^->|<!--|-->|--!>|<!-$/g,
	Dl = ['>'],
	Gl = ['<', '>'];
function Fl(t, e, n, r) {
	return r.settings.bogusComments
		? '<?' +
				nt(t.value, Object.assign({}, r.settings.characterReferences, { subset: Dl })) +
				'>'
		: '<!--' + t.value.replace($l, o) + '-->';
	function o(s) {
		return nt(s, Object.assign({}, r.settings.characterReferences, { subset: Gl }));
	}
}
function Bl(t, e, n, r) {
	return (
		'<!' +
		(r.settings.upperDoctype ? 'DOCTYPE' : 'doctype') +
		(r.settings.tightDoctype ? '' : ' ') +
		'html>'
	);
}
function Co(t, e) {
	const n = String(t);
	if (typeof e != 'string') throw new TypeError('Expected character');
	let r = 0,
		o = n.indexOf(e);
	for (; o !== -1; ) (r++, (o = n.indexOf(e, o + e.length)));
	return r;
}
function Ul(t, e) {
	const n = e || {};
	return (t[t.length - 1] === '' ? [...t, ''] : t)
		.join((n.padRight ? ' ' : '') + ',' + (n.padLeft === !1 ? '' : ' '))
		.trim();
}
function jl(t) {
	return t.join(' ').trim();
}
const zl = /[ \t\n\f\r]/g;
function hr(t) {
	return typeof t == 'object' ? (t.type === 'text' ? So(t.value) : !1) : So(t);
}
function So(t) {
	return t.replace(zl, '') === '';
}
const H = Rs(1),
	Ts = Rs(-1),
	Wl = [];
function Rs(t) {
	return e;
	function e(n, r, o) {
		const s = n ? n.children : Wl;
		let i = (r || 0) + t,
			l = s[i];
		if (!o) for (; l && hr(l); ) ((i += t), (l = s[i]));
		return l;
	}
}
const Hl = {}.hasOwnProperty;
function Is(t) {
	return e;
	function e(n, r, o) {
		return Hl.call(t, n.tagName) && t[n.tagName](n, r, o);
	}
}
const pr = Is({
	body: ql,
	caption: $n,
	colgroup: $n,
	dd: Zl,
	dt: Kl,
	head: $n,
	html: Vl,
	li: Yl,
	optgroup: Ql,
	option: Jl,
	p: Xl,
	rp: Eo,
	rt: Eo,
	tbody: tc,
	td: Ao,
	tfoot: nc,
	th: Ao,
	thead: ec,
	tr: rc
});
function $n(t, e, n) {
	const r = H(n, e, !0);
	return !r || (r.type !== 'comment' && !(r.type === 'text' && hr(r.value.charAt(0))));
}
function Vl(t, e, n) {
	const r = H(n, e);
	return !r || r.type !== 'comment';
}
function ql(t, e, n) {
	const r = H(n, e);
	return !r || r.type !== 'comment';
}
function Xl(t, e, n) {
	const r = H(n, e);
	return r
		? r.type === 'element' &&
				(r.tagName === 'address' ||
					r.tagName === 'article' ||
					r.tagName === 'aside' ||
					r.tagName === 'blockquote' ||
					r.tagName === 'details' ||
					r.tagName === 'div' ||
					r.tagName === 'dl' ||
					r.tagName === 'fieldset' ||
					r.tagName === 'figcaption' ||
					r.tagName === 'figure' ||
					r.tagName === 'footer' ||
					r.tagName === 'form' ||
					r.tagName === 'h1' ||
					r.tagName === 'h2' ||
					r.tagName === 'h3' ||
					r.tagName === 'h4' ||
					r.tagName === 'h5' ||
					r.tagName === 'h6' ||
					r.tagName === 'header' ||
					r.tagName === 'hgroup' ||
					r.tagName === 'hr' ||
					r.tagName === 'main' ||
					r.tagName === 'menu' ||
					r.tagName === 'nav' ||
					r.tagName === 'ol' ||
					r.tagName === 'p' ||
					r.tagName === 'pre' ||
					r.tagName === 'section' ||
					r.tagName === 'table' ||
					r.tagName === 'ul')
		: !n ||
				!(
					n.type === 'element' &&
					(n.tagName === 'a' ||
						n.tagName === 'audio' ||
						n.tagName === 'del' ||
						n.tagName === 'ins' ||
						n.tagName === 'map' ||
						n.tagName === 'noscript' ||
						n.tagName === 'video')
				);
}
function Yl(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && r.tagName === 'li');
}
function Kl(t, e, n) {
	const r = H(n, e);
	return !!(r && r.type === 'element' && (r.tagName === 'dt' || r.tagName === 'dd'));
}
function Zl(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'dt' || r.tagName === 'dd'));
}
function Eo(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'rp' || r.tagName === 'rt'));
}
function Ql(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && r.tagName === 'optgroup');
}
function Jl(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'option' || r.tagName === 'optgroup'));
}
function ec(t, e, n) {
	const r = H(n, e);
	return !!(r && r.type === 'element' && (r.tagName === 'tbody' || r.tagName === 'tfoot'));
}
function tc(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'tbody' || r.tagName === 'tfoot'));
}
function nc(t, e, n) {
	return !H(n, e);
}
function rc(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && r.tagName === 'tr');
}
function Ao(t, e, n) {
	const r = H(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'td' || r.tagName === 'th'));
}
const oc = Is({ body: ac, colgroup: lc, head: ic, html: sc, tbody: cc });
function sc(t) {
	const e = H(t, -1);
	return !e || e.type !== 'comment';
}
function ic(t) {
	const e = new Set();
	for (const r of t.children)
		if (r.type === 'element' && (r.tagName === 'base' || r.tagName === 'title')) {
			if (e.has(r.tagName)) return !1;
			e.add(r.tagName);
		}
	const n = t.children[0];
	return !n || n.type === 'element';
}
function ac(t) {
	const e = H(t, -1, !0);
	return (
		!e ||
		(e.type !== 'comment' &&
			!(e.type === 'text' && hr(e.value.charAt(0))) &&
			!(
				e.type === 'element' &&
				(e.tagName === 'meta' ||
					e.tagName === 'link' ||
					e.tagName === 'script' ||
					e.tagName === 'style' ||
					e.tagName === 'template')
			))
	);
}
function lc(t, e, n) {
	const r = Ts(n, e),
		o = H(t, -1, !0);
	return n &&
		r &&
		r.type === 'element' &&
		r.tagName === 'colgroup' &&
		pr(r, n.children.indexOf(r), n)
		? !1
		: !!(o && o.type === 'element' && o.tagName === 'col');
}
function cc(t, e, n) {
	const r = Ts(n, e),
		o = H(t, -1);
	return n &&
		r &&
		r.type === 'element' &&
		(r.tagName === 'thead' || r.tagName === 'tbody') &&
		pr(r, n.children.indexOf(r), n)
		? !1
		: !!(o && o.type === 'element' && o.tagName === 'tr');
}
const Bt = {
	name: [
		[
			`	
\f\r &/=>`.split(''),
			`	
\f\r "&'/=>\``.split('')
		],
		[
			`\0	
\f\r "&'/<=>`.split(''),
			`\0	
\f\r "&'/<=>\``.split('')
		]
	],
	unquoted: [
		[
			`	
\f\r &>`.split(''),
			`\0	
\f\r "&'<=>\``.split('')
		],
		[
			`\0	
\f\r "&'<=>\``.split(''),
			`\0	
\f\r "&'<=>\``.split('')
		]
	],
	single: [
		["&'".split(''), '"&\'`'.split('')],
		["\0&'".split(''), '\0"&\'`'.split('')]
	],
	double: [
		['"&'.split(''), '"&\'`'.split('')],
		['\0"&'.split(''), '\0"&\'`'.split('')]
	]
};
function uc(t, e, n, r) {
	const o = r.schema,
		s = o.space === 'svg' ? !1 : r.settings.omitOptionalTags;
	let i =
		o.space === 'svg'
			? r.settings.closeEmptyElements
			: r.settings.voids.includes(t.tagName.toLowerCase());
	const l = [];
	let a;
	o.space === 'html' && t.tagName === 'svg' && (r.schema = vs);
	const c = fc(r, t.properties),
		u = r.all(o.space === 'html' && t.tagName === 'template' ? t.content : t);
	return (
		(r.schema = o),
		u && (i = !1),
		(c || !s || !oc(t, e, n)) &&
			(l.push('<', t.tagName, c ? ' ' + c : ''),
			i &&
				(o.space === 'svg' || r.settings.closeSelfClosing) &&
				((a = c.charAt(c.length - 1)),
				(!r.settings.tightSelfClosing || a === '/' || (a && a !== '"' && a !== "'")) &&
					l.push(' '),
				l.push('/')),
			l.push('>')),
		l.push(u),
		!i && (!s || !pr(t, e, n)) && l.push('</' + t.tagName + '>'),
		l.join('')
	);
}
function fc(t, e) {
	const n = [];
	let r = -1,
		o;
	if (e) {
		for (o in e)
			if (e[o] !== null && e[o] !== void 0) {
				const s = hc(t, o, e[o]);
				s && n.push(s);
			}
	}
	for (; ++r < n.length; ) {
		const s = t.settings.tightAttributes ? n[r].charAt(n[r].length - 1) : void 0;
		r !== n.length - 1 && s !== '"' && s !== "'" && (n[r] += ' ');
	}
	return n.join('');
}
function hc(t, e, n) {
	const r = gl(t.schema, e),
		o = t.settings.allowParseErrors && t.schema.space === 'html' ? 0 : 1,
		s = t.settings.allowDangerousCharacters ? 0 : 1;
	let i = t.quote,
		l;
	if (
		(r.overloadedBoolean && (n === r.attribute || n === '')
			? (n = !0)
			: (r.boolean || r.overloadedBoolean) &&
				(typeof n != 'string' || n === r.attribute || n === '') &&
				(n = !!n),
		n == null || n === !1 || (typeof n == 'number' && Number.isNaN(n)))
	)
		return '';
	const a = nt(
		r.attribute,
		Object.assign({}, t.settings.characterReferences, { subset: Bt.name[o][s] })
	);
	return n === !0 ||
		((n = Array.isArray(n)
			? (r.commaSeparated ? Ul : jl)(n, { padLeft: !t.settings.tightCommaSeparatedLists })
			: String(n)),
		t.settings.collapseEmptyAttributes && !n)
		? a
		: (t.settings.preferUnquoted &&
				(l = nt(
					n,
					Object.assign({}, t.settings.characterReferences, {
						attribute: !0,
						subset: Bt.unquoted[o][s]
					})
				)),
			l !== n &&
				(t.settings.quoteSmart && Co(n, i) > Co(n, t.alternative) && (i = t.alternative),
				(l =
					i +
					nt(
						n,
						Object.assign({}, t.settings.characterReferences, {
							subset: (i === "'" ? Bt.single : Bt.double)[o][s],
							attribute: !0
						})
					) +
					i)),
			a + (l && '=' + l));
}
const pc = ['<', '&'];
function Ns(t, e, n, r) {
	return n && n.type === 'element' && (n.tagName === 'script' || n.tagName === 'style')
		? t.value
		: nt(t.value, Object.assign({}, r.settings.characterReferences, { subset: pc }));
}
function dc(t, e, n, r) {
	return r.settings.allowDangerousHtml ? t.value : Ns(t, e, n, r);
}
function gc(t, e, n, r) {
	return r.all(t);
}
const mc = bl('type', {
	invalid: yc,
	unknown: _c,
	handlers: { comment: Fl, doctype: Bl, element: uc, raw: dc, root: gc, text: Ns }
});
function yc(t) {
	throw new Error('Expected node, not `' + t + '`');
}
function _c(t) {
	const e = t;
	throw new Error('Cannot compile unknown node `' + e.type + '`');
}
const bc = {},
	wc = {},
	Cc = [];
function Sc(t, e) {
	const n = e || bc,
		r = n.quote || '"',
		o = r === '"' ? "'" : '"';
	if (r !== '"' && r !== "'") throw new Error('Invalid quote `' + r + '`, expected `\'` or `"`');
	return {
		one: Ec,
		all: Ac,
		settings: {
			omitOptionalTags: n.omitOptionalTags || !1,
			allowParseErrors: n.allowParseErrors || !1,
			allowDangerousCharacters: n.allowDangerousCharacters || !1,
			quoteSmart: n.quoteSmart || !1,
			preferUnquoted: n.preferUnquoted || !1,
			tightAttributes: n.tightAttributes || !1,
			upperDoctype: n.upperDoctype || !1,
			tightDoctype: n.tightDoctype || !1,
			bogusComments: n.bogusComments || !1,
			tightCommaSeparatedLists: n.tightCommaSeparatedLists || !1,
			tightSelfClosing: n.tightSelfClosing || !1,
			collapseEmptyAttributes: n.collapseEmptyAttributes || !1,
			allowDangerousHtml: n.allowDangerousHtml || !1,
			voids: n.voids || cl,
			characterReferences: n.characterReferences || wc,
			closeSelfClosing: n.closeSelfClosing || !1,
			closeEmptyElements: n.closeEmptyElements || !1
		},
		schema: n.space === 'svg' ? vs : _l,
		quote: r,
		alternative: o
	}.one(Array.isArray(t) ? { type: 'root', children: t } : t, void 0, void 0);
}
function Ec(t, e, n) {
	return mc(t, e, n, this);
}
function Ac(t) {
	const e = [],
		n = (t && t.children) || Cc;
	let r = -1;
	for (; ++r < n.length; ) e[r] = this.one(n[r], r, t);
	return e.join('');
}
function Qt(t, e) {
	const n = typeof t == 'string' ? {} : { ...t.colorReplacements },
		r = typeof t == 'string' ? t : t.name;
	for (const [o, s] of Object.entries(e?.colorReplacements || {}))
		typeof s == 'string' ? (n[o] = s) : o === r && Object.assign(n, s);
	return n;
}
function Te(t, e) {
	return t && (e?.[t?.toLowerCase()] || t);
}
function kc(t) {
	return Array.isArray(t) ? t : [t];
}
async function Ls(t) {
	return Promise.resolve(typeof t == 'function' ? t() : t).then((e) => e.default || e);
}
function dr(t) {
	return !t || ['plaintext', 'txt', 'text', 'plain'].includes(t);
}
function vc(t) {
	return t === 'ansi' || dr(t);
}
function gr(t) {
	return t === 'none';
}
function xc(t) {
	return gr(t);
}
function Ps(t, e) {
	if (!e) return t;
	((t.properties ||= {}),
		(t.properties.class ||= []),
		typeof t.properties.class == 'string' &&
			(t.properties.class = t.properties.class.split(/\s+/g)),
		Array.isArray(t.properties.class) || (t.properties.class = []));
	const n = Array.isArray(e) ? e : e.split(/\s+/g);
	for (const r of n) r && !t.properties.class.includes(r) && t.properties.class.push(r);
	return t;
}
function sn(t, e = !1) {
	const n = t.split(/(\r?\n)/g);
	let r = 0;
	const o = [];
	for (let s = 0; s < n.length; s += 2) {
		const i = e ? n[s] + (n[s + 1] || '') : n[s];
		(o.push([i, r]), (r += n[s].length), (r += n[s + 1]?.length || 0));
	}
	return o;
}
function Tc(t) {
	const e = sn(t, !0).map(([o]) => o);
	function n(o) {
		if (o === t.length) return { line: e.length - 1, character: e[e.length - 1].length };
		let s = o,
			i = 0;
		for (const l of e) {
			if (s < l.length) break;
			((s -= l.length), i++);
		}
		return { line: i, character: s };
	}
	function r(o, s) {
		let i = 0;
		for (let l = 0; l < o; l++) i += e[l].length;
		return ((i += s), i);
	}
	return { lines: e, indexToPos: n, posToIndex: r };
}
const mr = 'light-dark()',
	Rc = ['color', 'background-color'];
function Ic(t, e) {
	let n = 0;
	const r = [];
	for (const o of e)
		(o > n && r.push({ ...t, content: t.content.slice(n, o), offset: t.offset + n }), (n = o));
	return (
		n < t.content.length && r.push({ ...t, content: t.content.slice(n), offset: t.offset + n }),
		r
	);
}
function Nc(t, e) {
	const n = Array.from(e instanceof Set ? e : new Set(e)).sort((r, o) => r - o);
	return n.length
		? t.map((r) =>
				r.flatMap((o) => {
					const s = n
						.filter((i) => o.offset < i && i < o.offset + o.content.length)
						.map((i) => i - o.offset)
						.sort((i, l) => i - l);
					return s.length ? Ic(o, s) : o;
				})
			)
		: t;
}
function Lc(t, e, n, r, o = 'css-vars') {
	const s = { content: t.content, explanation: t.explanation, offset: t.offset },
		i = e.map((u) => Jt(t.variants[u])),
		l = new Set(i.flatMap((u) => Object.keys(u))),
		a = {},
		c = (u, f) => {
			const p = f === 'color' ? '' : f === 'background-color' ? '-bg' : `-${f}`;
			return n + e[u] + (f === 'color' ? '' : p);
		};
	return (
		i.forEach((u, f) => {
			for (const p of l) {
				const g = u[p] || 'inherit';
				if (f === 0 && r && Rc.includes(p))
					if (r === mr && i.length > 1) {
						const d = e.findIndex((_) => _ === 'light'),
							C = e.findIndex((_) => _ === 'dark');
						if (d === -1 || C === -1)
							throw new Y(
								'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes'
							);
						const b = i[d][p] || 'inherit',
							w = i[C][p] || 'inherit';
						((a[p] = `light-dark(${b}, ${w})`), o === 'css-vars' && (a[c(f, p)] = g));
					} else a[p] = g;
				else o === 'css-vars' && (a[c(f, p)] = g);
			}
		}),
		(s.htmlStyle = a),
		s
	);
}
function Jt(t) {
	const e = {};
	if (
		(t.color && (e.color = t.color),
		t.bgColor && (e['background-color'] = t.bgColor),
		t.fontStyle)
	) {
		(t.fontStyle & te.Italic && (e['font-style'] = 'italic'),
			t.fontStyle & te.Bold && (e['font-weight'] = 'bold'));
		const n = [];
		(t.fontStyle & te.Underline && n.push('underline'),
			t.fontStyle & te.Strikethrough && n.push('line-through'),
			n.length && (e['text-decoration'] = n.join(' ')));
	}
	return e;
}
function nr(t) {
	return typeof t == 'string'
		? t
		: Object.entries(t)
				.map(([e, n]) => `${e}:${n}`)
				.join(';');
}
const Os = new WeakMap();
function an(t, e) {
	Os.set(t, e);
}
function Et(t) {
	return Os.get(t);
}
class st {
	_stacks = {};
	lang;
	get themes() {
		return Object.keys(this._stacks);
	}
	get theme() {
		return this.themes[0];
	}
	get _stack() {
		return this._stacks[this.theme];
	}
	static initial(e, n) {
		return new st(Object.fromEntries(kc(n).map((r) => [r, Zn])), e);
	}
	constructor(...e) {
		if (e.length === 2) {
			const [n, r] = e;
			((this.lang = r), (this._stacks = n));
		} else {
			const [n, r, o] = e;
			((this.lang = r), (this._stacks = { [o]: n }));
		}
	}
	getInternalStack(e = this.theme) {
		return this._stacks[e];
	}
	getScopes(e = this.theme) {
		return Pc(this._stacks[e]);
	}
	toJSON() {
		return {
			lang: this.lang,
			theme: this.theme,
			themes: this.themes,
			scopes: this.getScopes()
		};
	}
}
function Pc(t) {
	const e = [],
		n = new Set();
	function r(o) {
		if (n.has(o)) return;
		n.add(o);
		const s = o?.nameScopesList?.scopeName;
		(s && e.push(s), o.parent && r(o.parent));
	}
	return (r(t), e);
}
function Oc(t, e) {
	if (!(t instanceof st)) throw new Y('Invalid grammar state');
	return t.getInternalStack(e);
}
function Mc() {
	const t = new WeakMap();
	function e(n) {
		if (!t.has(n.meta)) {
			let r = function (i) {
				if (typeof i == 'number') {
					if (i < 0 || i > n.source.length)
						throw new Y(
							`Invalid decoration offset: ${i}. Code length: ${n.source.length}`
						);
					return { ...o.indexToPos(i), offset: i };
				} else {
					const l = o.lines[i.line];
					if (l === void 0)
						throw new Y(
							`Invalid decoration position ${JSON.stringify(i)}. Lines length: ${o.lines.length}`
						);
					let a = i.character;
					if ((a < 0 && (a = l.length + a), a < 0 || a > l.length))
						throw new Y(
							`Invalid decoration position ${JSON.stringify(i)}. Line ${i.line} length: ${l.length}`
						);
					return { ...i, character: a, offset: o.posToIndex(i.line, a) };
				}
			};
			const o = Tc(n.source),
				s = (n.options.decorations || []).map((i) => ({
					...i,
					start: r(i.start),
					end: r(i.end)
				}));
			($c(s), t.set(n.meta, { decorations: s, converter: o, source: n.source }));
		}
		return t.get(n.meta);
	}
	return {
		name: 'shiki:decorations',
		tokens(n) {
			if (!this.options.decorations?.length) return;
			const o = e(this).decorations.flatMap((i) => [i.start.offset, i.end.offset]);
			return Nc(n, o);
		},
		code(n) {
			if (!this.options.decorations?.length) return;
			const r = e(this),
				o = Array.from(n.children).filter(
					(u) => u.type === 'element' && u.tagName === 'span'
				);
			if (o.length !== r.converter.lines.length)
				throw new Y(
					`Number of lines in code element (${o.length}) does not match the number of lines in the source (${r.converter.lines.length}). Failed to apply decorations.`
				);
			function s(u, f, p, g) {
				const d = o[u];
				let C = '',
					b = -1,
					w = -1;
				if (
					(f === 0 && (b = 0),
					p === 0 && (w = 0),
					p === Number.POSITIVE_INFINITY && (w = d.children.length),
					b === -1 || w === -1)
				)
					for (let A = 0; A < d.children.length; A++)
						((C += Ms(d.children[A])),
							b === -1 && C.length === f && (b = A + 1),
							w === -1 && C.length === p && (w = A + 1));
				if (b === -1)
					throw new Y(
						`Failed to find start index for decoration ${JSON.stringify(g.start)}`
					);
				if (w === -1)
					throw new Y(`Failed to find end index for decoration ${JSON.stringify(g.end)}`);
				const _ = d.children.slice(b, w);
				if (!g.alwaysWrap && _.length === d.children.length) l(d, g, 'line');
				else if (!g.alwaysWrap && _.length === 1 && _[0].type === 'element')
					l(_[0], g, 'token');
				else {
					const A = { type: 'element', tagName: 'span', properties: {}, children: _ };
					(l(A, g, 'wrapper'), d.children.splice(b, _.length, A));
				}
			}
			function i(u, f) {
				o[u] = l(o[u], f, 'line');
			}
			function l(u, f, p) {
				const g = f.properties || {},
					d = f.transform || ((C) => C);
				return (
					(u.tagName = f.tagName || 'span'),
					(u.properties = { ...u.properties, ...g, class: u.properties.class }),
					f.properties?.class && Ps(u, f.properties.class),
					(u = d(u, p) || u),
					u
				);
			}
			const a = [],
				c = r.decorations.sort(
					(u, f) => f.start.offset - u.start.offset || u.end.offset - f.end.offset
				);
			for (const u of c) {
				const { start: f, end: p } = u;
				if (f.line === p.line) s(f.line, f.character, p.character, u);
				else if (f.line < p.line) {
					s(f.line, f.character, Number.POSITIVE_INFINITY, u);
					for (let g = f.line + 1; g < p.line; g++) a.unshift(() => i(g, u));
					s(p.line, 0, p.character, u);
				}
			}
			a.forEach((u) => u());
		}
	};
}
function $c(t) {
	for (let e = 0; e < t.length; e++) {
		const n = t[e];
		if (n.start.offset > n.end.offset)
			throw new Y(
				`Invalid decoration range: ${JSON.stringify(n.start)} - ${JSON.stringify(n.end)}`
			);
		for (let r = e + 1; r < t.length; r++) {
			const o = t[r],
				s = n.start.offset <= o.start.offset && o.start.offset < n.end.offset,
				i = n.start.offset < o.end.offset && o.end.offset <= n.end.offset,
				l = o.start.offset <= n.start.offset && n.start.offset < o.end.offset,
				a = o.start.offset < n.end.offset && n.end.offset <= o.end.offset;
			if (s || i || l || a) {
				if (
					(s && i) ||
					(l && a) ||
					(l && n.start.offset === n.end.offset) ||
					(i && o.start.offset === o.end.offset)
				)
					continue;
				throw new Y(
					`Decorations ${JSON.stringify(n.start)} and ${JSON.stringify(o.start)} intersect.`
				);
			}
		}
	}
}
function Ms(t) {
	return t.type === 'text' ? t.value : t.type === 'element' ? t.children.map(Ms).join('') : '';
}
const Dc = [Mc()];
function en(t) {
	const e = Gc(t.transformers || []);
	return [...e.pre, ...e.normal, ...e.post, ...Dc];
}
function Gc(t) {
	const e = [],
		n = [],
		r = [];
	for (const o of t)
		switch (o.enforce) {
			case 'pre':
				e.push(o);
				break;
			case 'post':
				n.push(o);
				break;
			default:
				r.push(o);
		}
	return { pre: e, post: n, normal: r };
}
var $e = [
		'black',
		'red',
		'green',
		'yellow',
		'blue',
		'magenta',
		'cyan',
		'white',
		'brightBlack',
		'brightRed',
		'brightGreen',
		'brightYellow',
		'brightBlue',
		'brightMagenta',
		'brightCyan',
		'brightWhite'
	],
	Dn = {
		1: 'bold',
		2: 'dim',
		3: 'italic',
		4: 'underline',
		7: 'reverse',
		8: 'hidden',
		9: 'strikethrough'
	};
function Fc(t, e) {
	const n = t.indexOf('\x1B', e);
	if (n !== -1 && t[n + 1] === '[') {
		const r = t.indexOf('m', n);
		if (r !== -1)
			return {
				sequence: t.substring(n + 2, r).split(';'),
				startPosition: n,
				position: r + 1
			};
	}
	return { position: t.length };
}
function ko(t) {
	const e = t.shift();
	if (e === '2') {
		const n = t.splice(0, 3).map((r) => Number.parseInt(r));
		return n.length !== 3 || n.some((r) => Number.isNaN(r)) ? void 0 : { type: 'rgb', rgb: n };
	} else if (e === '5') {
		const n = t.shift();
		if (n) return { type: 'table', index: Number(n) };
	}
}
function Bc(t) {
	const e = [];
	for (; t.length > 0; ) {
		const n = t.shift();
		if (!n) continue;
		const r = Number.parseInt(n);
		if (!Number.isNaN(r))
			if (r === 0) e.push({ type: 'resetAll' });
			else if (r <= 9) Dn[r] && e.push({ type: 'setDecoration', value: Dn[r] });
			else if (r <= 29) {
				const o = Dn[r - 20];
				o &&
					(e.push({ type: 'resetDecoration', value: o }),
					o === 'dim' && e.push({ type: 'resetDecoration', value: 'bold' }));
			} else if (r <= 37)
				e.push({ type: 'setForegroundColor', value: { type: 'named', name: $e[r - 30] } });
			else if (r === 38) {
				const o = ko(t);
				o && e.push({ type: 'setForegroundColor', value: o });
			} else if (r === 39) e.push({ type: 'resetForegroundColor' });
			else if (r <= 47)
				e.push({ type: 'setBackgroundColor', value: { type: 'named', name: $e[r - 40] } });
			else if (r === 48) {
				const o = ko(t);
				o && e.push({ type: 'setBackgroundColor', value: o });
			} else
				r === 49
					? e.push({ type: 'resetBackgroundColor' })
					: r === 53
						? e.push({ type: 'setDecoration', value: 'overline' })
						: r === 55
							? e.push({ type: 'resetDecoration', value: 'overline' })
							: r >= 90 && r <= 97
								? e.push({
										type: 'setForegroundColor',
										value: { type: 'named', name: $e[r - 90 + 8] }
									})
								: r >= 100 &&
									r <= 107 &&
									e.push({
										type: 'setBackgroundColor',
										value: { type: 'named', name: $e[r - 100 + 8] }
									});
	}
	return e;
}
function Uc() {
	let t = null,
		e = null,
		n = new Set();
	return {
		parse(r) {
			const o = [];
			let s = 0;
			do {
				const i = Fc(r, s),
					l = i.sequence ? r.substring(s, i.startPosition) : r.substring(s);
				if (
					(l.length > 0 &&
						o.push({ value: l, foreground: t, background: e, decorations: new Set(n) }),
					i.sequence)
				) {
					const a = Bc(i.sequence);
					for (const c of a)
						c.type === 'resetAll'
							? ((t = null), (e = null), n.clear())
							: c.type === 'resetForegroundColor'
								? (t = null)
								: c.type === 'resetBackgroundColor'
									? (e = null)
									: c.type === 'resetDecoration' && n.delete(c.value);
					for (const c of a)
						c.type === 'setForegroundColor'
							? (t = c.value)
							: c.type === 'setBackgroundColor'
								? (e = c.value)
								: c.type === 'setDecoration' && n.add(c.value);
				}
				s = i.position;
			} while (s < r.length);
			return o;
		}
	};
}
var jc = {
	black: '#000000',
	red: '#bb0000',
	green: '#00bb00',
	yellow: '#bbbb00',
	blue: '#0000bb',
	magenta: '#ff00ff',
	cyan: '#00bbbb',
	white: '#eeeeee',
	brightBlack: '#555555',
	brightRed: '#ff5555',
	brightGreen: '#00ff00',
	brightYellow: '#ffff55',
	brightBlue: '#5555ff',
	brightMagenta: '#ff55ff',
	brightCyan: '#55ffff',
	brightWhite: '#ffffff'
};
function zc(t = jc) {
	function e(l) {
		return t[l];
	}
	function n(l) {
		return `#${l.map((a) => Math.max(0, Math.min(a, 255)).toString(16).padStart(2, '0')).join('')}`;
	}
	let r;
	function o() {
		if (r) return r;
		r = [];
		for (let c = 0; c < $e.length; c++) r.push(e($e[c]));
		let l = [0, 95, 135, 175, 215, 255];
		for (let c = 0; c < 6; c++)
			for (let u = 0; u < 6; u++) for (let f = 0; f < 6; f++) r.push(n([l[c], l[u], l[f]]));
		let a = 8;
		for (let c = 0; c < 24; c++, a += 10) r.push(n([a, a, a]));
		return r;
	}
	function s(l) {
		return o()[l];
	}
	function i(l) {
		switch (l.type) {
			case 'named':
				return e(l.name);
			case 'rgb':
				return n(l.rgb);
			case 'table':
				return s(l.index);
		}
	}
	return { value: i };
}
function Wc(t, e, n) {
	const r = Qt(t, n),
		o = sn(e),
		s = zc(
			Object.fromEntries(
				$e.map((l) => [
					l,
					t.colors?.[`terminal.ansi${l[0].toUpperCase()}${l.substring(1)}`]
				])
			)
		),
		i = Uc();
	return o.map((l) =>
		i.parse(l[0]).map((a) => {
			let c, u;
			(a.decorations.has('reverse')
				? ((c = a.background ? s.value(a.background) : t.bg),
					(u = a.foreground ? s.value(a.foreground) : t.fg))
				: ((c = a.foreground ? s.value(a.foreground) : t.fg),
					(u = a.background ? s.value(a.background) : void 0)),
				(c = Te(c, r)),
				(u = Te(u, r)),
				a.decorations.has('dim') && (c = Hc(c)));
			let f = te.None;
			return (
				a.decorations.has('bold') && (f |= te.Bold),
				a.decorations.has('italic') && (f |= te.Italic),
				a.decorations.has('underline') && (f |= te.Underline),
				a.decorations.has('strikethrough') && (f |= te.Strikethrough),
				{ content: a.value, offset: l[1], color: c, bgColor: u, fontStyle: f }
			);
		})
	);
}
function Hc(t) {
	const e = t.match(/#([0-9a-f]{3})([0-9a-f]{3})?([0-9a-f]{2})?/);
	if (e)
		if (e[3]) {
			const r = Math.round(Number.parseInt(e[3], 16) / 2)
				.toString(16)
				.padStart(2, '0');
			return `#${e[1]}${e[2]}${r}`;
		} else
			return e[2]
				? `#${e[1]}${e[2]}80`
				: `#${Array.from(e[1])
						.map((r) => `${r}${r}`)
						.join('')}80`;
	const n = t.match(/var\((--[\w-]+-ansi-[\w-]+)\)/);
	return n ? `var(${n[1]}-dim)` : t;
}
function yr(t, e, n = {}) {
	const { lang: r = 'text', theme: o = t.getLoadedThemes()[0] } = n;
	if (dr(r) || gr(o)) return sn(e).map((a) => [{ content: a[0], offset: a[1] }]);
	const { theme: s, colorMap: i } = t.setTheme(o);
	if (r === 'ansi') return Wc(s, e, n);
	const l = t.getLanguage(r);
	if (n.grammarState) {
		if (n.grammarState.lang !== l.name)
			throw new Y(
				`Grammar state language "${n.grammarState.lang}" does not match highlight language "${l.name}"`
			);
		if (!n.grammarState.themes.includes(s.name))
			throw new Y(
				`Grammar state themes "${n.grammarState.themes}" do not contain highlight theme "${s.name}"`
			);
	}
	return qc(e, l, s, i, n);
}
function Vc(...t) {
	if (t.length === 2) return Et(t[1]);
	const [e, n, r = {}] = t,
		{ lang: o = 'text', theme: s = e.getLoadedThemes()[0] } = r;
	if (dr(o) || gr(s)) throw new Y('Plain language does not have grammar state');
	if (o === 'ansi') throw new Y('ANSI language does not have grammar state');
	const { theme: i, colorMap: l } = e.setTheme(s),
		a = e.getLanguage(o);
	return new st(tn(n, a, i, l, r).stateStack, a.name, i.name);
}
function qc(t, e, n, r, o) {
	const s = tn(t, e, n, r, o),
		i = new st(tn(t, e, n, r, o).stateStack, e.name, n.name);
	return (an(s.tokens, i), s.tokens);
}
function tn(t, e, n, r, o) {
	const s = Qt(n, o),
		{ tokenizeMaxLineLength: i = 0, tokenizeTimeLimit: l = 500 } = o,
		a = sn(t);
	let c = o.grammarState
			? (Oc(o.grammarState, n.name) ?? Zn)
			: o.grammarContextCode != null
				? tn(o.grammarContextCode, e, n, r, {
						...o,
						grammarState: void 0,
						grammarContextCode: void 0
					}).stateStack
				: Zn,
		u = [];
	const f = [];
	for (let p = 0, g = a.length; p < g; p++) {
		const [d, C] = a[p];
		if (d === '') {
			((u = []), f.push([]));
			continue;
		}
		if (i > 0 && d.length >= i) {
			((u = []), f.push([{ content: d, offset: C, color: '', fontStyle: 0 }]));
			continue;
		}
		let b, w, _;
		o.includeExplanation && ((b = e.tokenizeLine(d, c, l)), (w = b.tokens), (_ = 0));
		const A = e.tokenizeLine2(d, c, l),
			P = A.tokens.length / 2;
		for (let v = 0; v < P; v++) {
			const O = A.tokens[2 * v],
				U = v + 1 < P ? A.tokens[2 * v + 2] : d.length;
			if (O === U) continue;
			const $ = A.tokens[2 * v + 1],
				Be = Te(r[rt.getForeground($)], s),
				T = rt.getFontStyle($),
				Re = { content: d.substring(O, U), offset: C + O, color: Be, fontStyle: T };
			if (o.includeExplanation) {
				const V = [];
				if (o.includeExplanation !== 'scopeName')
					for (const ce of n.settings) {
						let de;
						switch (typeof ce.scope) {
							case 'string':
								de = ce.scope.split(/,/).map((Ie) => Ie.trim());
								break;
							case 'object':
								de = ce.scope;
								break;
							default:
								continue;
						}
						V.push({ settings: ce, selectors: de.map((Ie) => Ie.split(/ /)) });
					}
				Re.explanation = [];
				let ke = 0;
				for (; O + ke < U; ) {
					const ce = w[_],
						de = d.substring(ce.startIndex, ce.endIndex);
					((ke += de.length),
						Re.explanation.push({
							content: de,
							scopes:
								o.includeExplanation === 'scopeName'
									? Xc(ce.scopes)
									: Yc(V, ce.scopes)
						}),
						(_ += 1));
				}
			}
			u.push(Re);
		}
		(f.push(u), (u = []), (c = A.ruleStack));
	}
	return { tokens: f, stateStack: c };
}
function Xc(t) {
	return t.map((e) => ({ scopeName: e }));
}
function Yc(t, e) {
	const n = [];
	for (let r = 0, o = e.length; r < o; r++) {
		const s = e[r];
		n[r] = { scopeName: s, themeMatches: Zc(t, s, e.slice(0, r)) };
	}
	return n;
}
function vo(t, e) {
	return t === e || (e.substring(0, t.length) === t && e[t.length] === '.');
}
function Kc(t, e, n) {
	if (!vo(t[t.length - 1], e)) return !1;
	let r = t.length - 2,
		o = n.length - 1;
	for (; r >= 0 && o >= 0; ) (vo(t[r], n[o]) && (r -= 1), (o -= 1));
	return r === -1;
}
function Zc(t, e, n) {
	const r = [];
	for (const { selectors: o, settings: s } of t)
		for (const i of o)
			if (Kc(i, e, n)) {
				r.push(s);
				break;
			}
	return r;
}
function $s(t, e, n) {
	const r = Object.entries(n.themes)
			.filter((a) => a[1])
			.map((a) => ({ color: a[0], theme: a[1] })),
		o = r.map((a) => {
			const c = yr(t, e, { ...n, theme: a.theme }),
				u = Et(c),
				f = typeof a.theme == 'string' ? a.theme : a.theme.name;
			return { tokens: c, state: u, theme: f };
		}),
		s = Qc(...o.map((a) => a.tokens)),
		i = s[0].map((a, c) =>
			a.map((u, f) => {
				const p = { content: u.content, variants: {}, offset: u.offset };
				return (
					'includeExplanation' in n &&
						n.includeExplanation &&
						(p.explanation = u.explanation),
					s.forEach((g, d) => {
						const { content: C, explanation: b, offset: w, ..._ } = g[c][f];
						p.variants[r[d].color] = _;
					}),
					p
				);
			})
		),
		l = o[0].state
			? new st(
					Object.fromEntries(o.map((a) => [a.theme, a.state?.getInternalStack(a.theme)])),
					o[0].state.lang
				)
			: void 0;
	return (l && an(i, l), i);
}
function Qc(...t) {
	const e = t.map(() => []),
		n = t.length;
	for (let r = 0; r < t[0].length; r++) {
		const o = t.map((a) => a[r]),
			s = e.map(() => []);
		e.forEach((a, c) => a.push(s[c]));
		const i = o.map(() => 0),
			l = o.map((a) => a[0]);
		for (; l.every((a) => a); ) {
			const a = Math.min(...l.map((c) => c.content.length));
			for (let c = 0; c < n; c++) {
				const u = l[c];
				u.content.length === a
					? (s[c].push(u), (i[c] += 1), (l[c] = o[c][i[c]]))
					: (s[c].push({ ...u, content: u.content.slice(0, a) }),
						(l[c] = { ...u, content: u.content.slice(a), offset: u.offset + a }));
			}
		}
	}
	return e;
}
function nn(t, e, n) {
	let r, o, s, i, l, a;
	if ('themes' in n) {
		const {
				defaultColor: c = 'light',
				cssVariablePrefix: u = '--shiki-',
				colorsRendering: f = 'css-vars'
			} = n,
			p = Object.entries(n.themes)
				.filter((w) => w[1])
				.map((w) => ({ color: w[0], theme: w[1] }))
				.sort((w, _) => (w.color === c ? -1 : _.color === c ? 1 : 0));
		if (p.length === 0) throw new Y('`themes` option must not be empty');
		const g = $s(t, e, n);
		if (((a = Et(g)), c && mr !== c && !p.find((w) => w.color === c)))
			throw new Y(`\`themes\` option must contain the defaultColor key \`${c}\``);
		const d = p.map((w) => t.getTheme(w.theme)),
			C = p.map((w) => w.color);
		((s = g.map((w) => w.map((_) => Lc(_, C, u, c, f)))), a && an(s, a));
		const b = p.map((w) => Qt(w.theme, n));
		((o = xo(p, d, b, u, c, 'fg', f)),
			(r = xo(p, d, b, u, c, 'bg', f)),
			(i = `shiki-themes ${d.map((w) => w.name).join(' ')}`),
			(l = c ? void 0 : [o, r].join(';')));
	} else if ('theme' in n) {
		const c = Qt(n.theme, n);
		s = yr(t, e, n);
		const u = t.getTheme(n.theme);
		((r = Te(u.bg, c)), (o = Te(u.fg, c)), (i = u.name), (a = Et(s)));
	} else throw new Y('Invalid options, either `theme` or `themes` must be provided');
	return { tokens: s, fg: o, bg: r, themeName: i, rootStyle: l, grammarState: a };
}
function xo(t, e, n, r, o, s, i) {
	return t
		.map((l, a) => {
			const c = Te(e[a][s], n[a]) || 'inherit',
				u = `${r + l.color}${s === 'bg' ? '-bg' : ''}:${c}`;
			if (a === 0 && o) {
				if (o === mr && t.length > 1) {
					const f = t.findIndex((C) => C.color === 'light'),
						p = t.findIndex((C) => C.color === 'dark');
					if (f === -1 || p === -1)
						throw new Y(
							'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes'
						);
					const g = Te(e[f][s], n[f]) || 'inherit',
						d = Te(e[p][s], n[p]) || 'inherit';
					return `light-dark(${g}, ${d});${u}`;
				}
				return c;
			}
			return i === 'css-vars' ? u : null;
		})
		.filter((l) => !!l)
		.join(';');
}
function rn(
	t,
	e,
	n,
	r = {
		meta: {},
		options: n,
		codeToHast: (o, s) => rn(t, o, s),
		codeToTokens: (o, s) => nn(t, o, s)
	}
) {
	let o = e;
	for (const d of en(n)) o = d.preprocess?.call(r, o, n) || o;
	let { tokens: s, fg: i, bg: l, themeName: a, rootStyle: c, grammarState: u } = nn(t, o, n);
	const { mergeWhitespaces: f = !0, mergeSameStyleTokens: p = !1 } = n;
	(f === !0 ? (s = eu(s)) : f === 'never' && (s = tu(s)), p && (s = nu(s)));
	const g = {
		...r,
		get source() {
			return o;
		}
	};
	for (const d of en(n)) s = d.tokens?.call(g, s) || s;
	return Jc(s, { ...n, fg: i, bg: l, themeName: a, rootStyle: c }, g, u);
}
function Jc(t, e, n, r = Et(t)) {
	const o = en(e),
		s = [],
		i = { type: 'root', children: [] },
		{ structure: l = 'classic', tabindex: a = '0' } = e;
	let c = {
			type: 'element',
			tagName: 'pre',
			properties: {
				class: `shiki ${e.themeName || ''}`,
				style: e.rootStyle || `background-color:${e.bg};color:${e.fg}`,
				...(a !== !1 && a != null ? { tabindex: a.toString() } : {}),
				...Object.fromEntries(
					Array.from(Object.entries(e.meta || {})).filter(([d]) => !d.startsWith('_'))
				)
			},
			children: []
		},
		u = { type: 'element', tagName: 'code', properties: {}, children: s };
	const f = [],
		p = {
			...n,
			structure: l,
			addClassToHast: Ps,
			get source() {
				return n.source;
			},
			get tokens() {
				return t;
			},
			get options() {
				return e;
			},
			get root() {
				return i;
			},
			get pre() {
				return c;
			},
			get code() {
				return u;
			},
			get lines() {
				return f;
			}
		};
	if (
		(t.forEach((d, C) => {
			C &&
				(l === 'inline'
					? i.children.push({
							type: 'element',
							tagName: 'br',
							properties: {},
							children: []
						})
					: l === 'classic' &&
						s.push({
							type: 'text',
							value: `
`
						}));
			let b = {
					type: 'element',
					tagName: 'span',
					properties: { class: 'line' },
					children: []
				},
				w = 0;
			for (const _ of d) {
				let A = {
					type: 'element',
					tagName: 'span',
					properties: { ..._.htmlAttrs },
					children: [{ type: 'text', value: _.content }]
				};
				const P = nr(_.htmlStyle || Jt(_));
				P && (A.properties.style = P);
				for (const v of o) A = v?.span?.call(p, A, C + 1, w, b, _) || A;
				(l === 'inline' ? i.children.push(A) : l === 'classic' && b.children.push(A),
					(w += _.content.length));
			}
			if (l === 'classic') {
				for (const _ of o) b = _?.line?.call(p, b, C + 1) || b;
				(f.push(b), s.push(b));
			}
		}),
		l === 'classic')
	) {
		for (const d of o) u = d?.code?.call(p, u) || u;
		c.children.push(u);
		for (const d of o) c = d?.pre?.call(p, c) || c;
		i.children.push(c);
	}
	let g = i;
	for (const d of o) g = d?.root?.call(p, g) || g;
	return (r && an(g, r), g);
}
function eu(t) {
	return t.map((e) => {
		const n = [];
		let r = '',
			o = 0;
		return (
			e.forEach((s, i) => {
				const a = !(
					s.fontStyle &&
					(s.fontStyle & te.Underline || s.fontStyle & te.Strikethrough)
				);
				a && s.content.match(/^\s+$/) && e[i + 1]
					? (o || (o = s.offset), (r += s.content))
					: r
						? (a
								? n.push({ ...s, offset: o, content: r + s.content })
								: n.push({ content: r, offset: o }, s),
							(o = 0),
							(r = ''))
						: n.push(s);
			}),
			n
		);
	});
}
function tu(t) {
	return t.map((e) =>
		e.flatMap((n) => {
			if (n.content.match(/^\s+$/)) return n;
			const r = n.content.match(/^(\s*)(.*?)(\s*)$/);
			if (!r) return n;
			const [, o, s, i] = r;
			if (!o && !i) return n;
			const l = [{ ...n, offset: n.offset + o.length, content: s }];
			return (
				o && l.unshift({ content: o, offset: n.offset }),
				i && l.push({ content: i, offset: n.offset + o.length + s.length }),
				l
			);
		})
	);
}
function nu(t) {
	return t.map((e) => {
		const n = [];
		for (const r of e) {
			if (n.length === 0) {
				n.push({ ...r });
				continue;
			}
			const o = n[n.length - 1],
				s = nr(o.htmlStyle || Jt(o)),
				i = nr(r.htmlStyle || Jt(r)),
				l = o.fontStyle && (o.fontStyle & te.Underline || o.fontStyle & te.Strikethrough),
				a = r.fontStyle && (r.fontStyle & te.Underline || r.fontStyle & te.Strikethrough);
			!l && !a && s === i ? (o.content += r.content) : n.push({ ...r });
		}
		return n;
	});
}
const ru = Sc;
function ou(t, e, n) {
	const r = {
		meta: {},
		options: n,
		codeToHast: (s, i) => rn(t, s, i),
		codeToTokens: (s, i) => nn(t, s, i)
	};
	let o = ru(rn(t, e, n, r));
	for (const s of en(n)) o = s.postprocess?.call(r, o, n) || o;
	return o;
}
const To = { light: '#333333', dark: '#bbbbbb' },
	Ro = { light: '#fffffe', dark: '#1e1e1e' },
	Io = '__shiki_resolved';
function _r(t) {
	if (t?.[Io]) return t;
	const e = { ...t };
	(e.tokenColors && !e.settings && ((e.settings = e.tokenColors), delete e.tokenColors),
		(e.type ||= 'dark'),
		(e.colorReplacements = { ...e.colorReplacements }),
		(e.settings ||= []));
	let { bg: n, fg: r } = e;
	if (!n || !r) {
		const l = e.settings ? e.settings.find((a) => !a.name && !a.scope) : void 0;
		(l?.settings?.foreground && (r = l.settings.foreground),
			l?.settings?.background && (n = l.settings.background),
			!r && e?.colors?.['editor.foreground'] && (r = e.colors['editor.foreground']),
			!n && e?.colors?.['editor.background'] && (n = e.colors['editor.background']),
			r || (r = e.type === 'light' ? To.light : To.dark),
			n || (n = e.type === 'light' ? Ro.light : Ro.dark),
			(e.fg = r),
			(e.bg = n));
	}
	(e.settings[0] && e.settings[0].settings && !e.settings[0].scope) ||
		e.settings.unshift({ settings: { foreground: e.fg, background: e.bg } });
	let o = 0;
	const s = new Map();
	function i(l) {
		if (s.has(l)) return s.get(l);
		o += 1;
		const a = `#${o.toString(16).padStart(8, '0').toLowerCase()}`;
		return e.colorReplacements?.[`#${a}`] ? i(l) : (s.set(l, a), a);
	}
	e.settings = e.settings.map((l) => {
		const a = l.settings?.foreground && !l.settings.foreground.startsWith('#'),
			c = l.settings?.background && !l.settings.background.startsWith('#');
		if (!a && !c) return l;
		const u = { ...l, settings: { ...l.settings } };
		if (a) {
			const f = i(l.settings.foreground);
			((e.colorReplacements[f] = l.settings.foreground), (u.settings.foreground = f));
		}
		if (c) {
			const f = i(l.settings.background);
			((e.colorReplacements[f] = l.settings.background), (u.settings.background = f));
		}
		return u;
	});
	for (const l of Object.keys(e.colors || {}))
		if (
			(l === 'editor.foreground' ||
				l === 'editor.background' ||
				l.startsWith('terminal.ansi')) &&
			!e.colors[l]?.startsWith('#')
		) {
			const a = i(e.colors[l]);
			((e.colorReplacements[a] = e.colors[l]), (e.colors[l] = a));
		}
	return (Object.defineProperty(e, Io, { enumerable: !1, writable: !1, value: !0 }), e);
}
async function Ds(t) {
	return Array.from(
		new Set(
			(
				await Promise.all(
					t
						.filter((e) => !vc(e))
						.map(async (e) => await Ls(e).then((n) => (Array.isArray(n) ? n : [n])))
				)
			).flat()
		)
	);
}
async function Gs(t) {
	return (await Promise.all(t.map(async (n) => (xc(n) ? null : _r(await Ls(n)))))).filter(
		(n) => !!n
	);
}
let su = 3;
function iu(t, e = 3) {
	e > su || console.trace(`[SHIKI DEPRECATE]: ${t}`);
}
class et extends Error {
	constructor(e) {
		(super(e), (this.name = 'ShikiError'));
	}
}
class au extends ll {
	constructor(e, n, r, o = {}) {
		(super(e),
			(this._resolver = e),
			(this._themes = n),
			(this._langs = r),
			(this._alias = o),
			this._themes.map((s) => this.loadTheme(s)),
			this.loadLanguages(this._langs));
	}
	_resolvedThemes = new Map();
	_resolvedGrammars = new Map();
	_langMap = new Map();
	_langGraph = new Map();
	_textmateThemeCache = new WeakMap();
	_loadedThemesCache = null;
	_loadedLanguagesCache = null;
	getTheme(e) {
		return typeof e == 'string' ? this._resolvedThemes.get(e) : this.loadTheme(e);
	}
	loadTheme(e) {
		const n = _r(e);
		return (
			n.name && (this._resolvedThemes.set(n.name, n), (this._loadedThemesCache = null)),
			n
		);
	}
	getLoadedThemes() {
		return (
			this._loadedThemesCache || (this._loadedThemesCache = [...this._resolvedThemes.keys()]),
			this._loadedThemesCache
		);
	}
	setTheme(e) {
		let n = this._textmateThemeCache.get(e);
		(n || ((n = qt.createFromRawTheme(e)), this._textmateThemeCache.set(e, n)),
			this._syncRegistry.setTheme(n));
	}
	getGrammar(e) {
		if (this._alias[e]) {
			const n = new Set([e]);
			for (; this._alias[e]; ) {
				if (((e = this._alias[e]), n.has(e)))
					throw new et(`Circular alias \`${Array.from(n).join(' -> ')} -> ${e}\``);
				n.add(e);
			}
		}
		return this._resolvedGrammars.get(e);
	}
	loadLanguage(e) {
		if (this.getGrammar(e.name)) return;
		const n = new Set(
			[...this._langMap.values()].filter((s) => s.embeddedLangsLazy?.includes(e.name))
		);
		this._resolver.addLanguage(e);
		const r = {
			balancedBracketSelectors: e.balancedBracketSelectors || ['*'],
			unbalancedBracketSelectors: e.unbalancedBracketSelectors || []
		};
		this._syncRegistry._rawGrammars.set(e.scopeName, e);
		const o = this.loadGrammarWithConfiguration(e.scopeName, 1, r);
		if (
			((o.name = e.name),
			this._resolvedGrammars.set(e.name, o),
			e.aliases &&
				e.aliases.forEach((s) => {
					this._alias[s] = e.name;
				}),
			(this._loadedLanguagesCache = null),
			n.size)
		)
			for (const s of n)
				(this._resolvedGrammars.delete(s.name),
					(this._loadedLanguagesCache = null),
					this._syncRegistry?._injectionGrammars?.delete(s.scopeName),
					this._syncRegistry?._grammars?.delete(s.scopeName),
					this.loadLanguage(this._langMap.get(s.name)));
	}
	dispose() {
		(super.dispose(),
			this._resolvedThemes.clear(),
			this._resolvedGrammars.clear(),
			this._langMap.clear(),
			this._langGraph.clear(),
			(this._loadedThemesCache = null));
	}
	loadLanguages(e) {
		for (const o of e) this.resolveEmbeddedLanguages(o);
		const n = Array.from(this._langGraph.entries()),
			r = n.filter(([o, s]) => !s);
		if (r.length) {
			const o = n
				.filter(
					([s, i]) => i && i.embeddedLangs?.some((l) => r.map(([a]) => a).includes(l))
				)
				.filter((s) => !r.includes(s));
			throw new et(
				`Missing languages ${r.map(([s]) => `\`${s}\``).join(', ')}, required by ${o.map(([s]) => `\`${s}\``).join(', ')}`
			);
		}
		for (const [o, s] of n) this._resolver.addLanguage(s);
		for (const [o, s] of n) this.loadLanguage(s);
	}
	getLoadedLanguages() {
		return (
			this._loadedLanguagesCache ||
				(this._loadedLanguagesCache = [
					...new Set([...this._resolvedGrammars.keys(), ...Object.keys(this._alias)])
				]),
			this._loadedLanguagesCache
		);
	}
	resolveEmbeddedLanguages(e) {
		if ((this._langMap.set(e.name, e), this._langGraph.set(e.name, e), e.embeddedLangs))
			for (const n of e.embeddedLangs) this._langGraph.set(n, this._langMap.get(n));
	}
}
class lu {
	_langs = new Map();
	_scopeToLang = new Map();
	_injections = new Map();
	_onigLib;
	constructor(e, n) {
		((this._onigLib = {
			createOnigScanner: (r) => e.createScanner(r),
			createOnigString: (r) => e.createString(r)
		}),
			n.forEach((r) => this.addLanguage(r)));
	}
	get onigLib() {
		return this._onigLib;
	}
	getLangRegistration(e) {
		return this._langs.get(e);
	}
	loadGrammar(e) {
		return this._scopeToLang.get(e);
	}
	addLanguage(e) {
		(this._langs.set(e.name, e),
			e.aliases &&
				e.aliases.forEach((n) => {
					this._langs.set(n, e);
				}),
			this._scopeToLang.set(e.scopeName, e),
			e.injectTo &&
				e.injectTo.forEach((n) => {
					(this._injections.get(n) || this._injections.set(n, []),
						this._injections.get(n).push(e.scopeName));
				}));
	}
	getInjections(e) {
		const n = e.split('.');
		let r = [];
		for (let o = 1; o <= n.length; o++) {
			const s = n.slice(0, o).join('.');
			r = [...r, ...(this._injections.get(s) || [])];
		}
		return r;
	}
}
let gt = 0;
function cu(t) {
	((gt += 1),
		t.warnings !== !1 &&
			gt >= 10 &&
			gt % 10 === 0 &&
			console.warn(
				`[Shiki] ${gt} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`
			));
	let e = !1;
	if (!t.engine) throw new et('`engine` option is required for synchronous mode');
	const n = (t.langs || []).flat(1),
		r = (t.themes || []).flat(1).map(_r),
		o = new lu(t.engine, n),
		s = new au(o, r, n, t.langAlias);
	let i;
	function l(_) {
		b();
		const A = s.getGrammar(typeof _ == 'string' ? _ : _.name);
		if (!A) throw new et(`Language \`${_}\` not found, you may need to load it first`);
		return A;
	}
	function a(_) {
		if (_ === 'none') return { bg: '', fg: '', name: 'none', settings: [], type: 'dark' };
		b();
		const A = s.getTheme(_);
		if (!A) throw new et(`Theme \`${_}\` not found, you may need to load it first`);
		return A;
	}
	function c(_) {
		b();
		const A = a(_);
		i !== _ && (s.setTheme(A), (i = _));
		const P = s.getColorMap();
		return { theme: A, colorMap: P };
	}
	function u() {
		return (b(), s.getLoadedThemes());
	}
	function f() {
		return (b(), s.getLoadedLanguages());
	}
	function p(..._) {
		(b(), s.loadLanguages(_.flat(1)));
	}
	async function g(..._) {
		return p(await Ds(_));
	}
	function d(..._) {
		b();
		for (const A of _.flat(1)) s.loadTheme(A);
	}
	async function C(..._) {
		return (b(), d(await Gs(_)));
	}
	function b() {
		if (e) throw new et('Shiki instance has been disposed');
	}
	function w() {
		e || ((e = !0), s.dispose(), (gt -= 1));
	}
	return {
		setTheme: c,
		getTheme: a,
		getLanguage: l,
		getLoadedThemes: u,
		getLoadedLanguages: f,
		loadLanguage: g,
		loadLanguageSync: p,
		loadTheme: C,
		loadThemeSync: d,
		dispose: w,
		[Symbol.dispose]: w
	};
}
async function uu(t) {
	t.engine ||
		iu(
			'`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.'
		);
	const [e, n, r] = await Promise.all([Gs(t.themes || []), Ds(t.langs || []), t.engine]);
	return cu({ ...t, themes: e, langs: n, engine: r });
}
async function fu(t) {
	const e = await uu(t);
	return {
		getLastGrammarState: (...n) => Vc(e, ...n),
		codeToTokensBase: (n, r) => yr(e, n, r),
		codeToTokensWithThemes: (n, r) => $s(e, n, r),
		codeToTokens: (n, r) => nn(e, n, r),
		codeToHast: (n, r) => rn(e, n, r),
		codeToHtml: (n, r) => ou(e, n, r),
		getBundledLanguages: () => ({}),
		getBundledThemes: () => ({}),
		...e,
		getInternalContext: () => e
	};
}
function it(t) {
	if ([...t].length !== 1) throw new Error(`Expected "${t}" to be a single code point`);
	return t.codePointAt(0);
}
function hu(t, e, n) {
	return (t.has(e) || t.set(e, n), t.get(e));
}
const br = new Set([
		'alnum',
		'alpha',
		'ascii',
		'blank',
		'cntrl',
		'digit',
		'graph',
		'lower',
		'print',
		'punct',
		'space',
		'upper',
		'word',
		'xdigit'
	]),
	K = String.raw;
function at(t, e) {
	if (t == null) throw new Error(e ?? 'Value expected');
	return t;
}
const Fs = K`\[\^?`,
	Bs = `c.? | C(?:-.?)?|${K`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${K`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${K`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${K`o\{[^\}]*\}?`}|${K`\d{1,3}`}`,
	wr = /[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/,
	Ut = new RegExp(
		K`
  \\ (?:
    ${Bs}
    | [gk]<[^>]*>?
    | [gk]'[^']*'?
    | .
  )
  | \( (?:
    \? (?:
      [:=!>({]
      | <[=!]
      | <[^>]*>
      | '[^']*'
      | ~\|?
      | #(?:[^)\\]|\\.?)*
      | [^:)]*[:)]
    )?
    | \*[^\)]*\)?
  )?
  | (?:${wr.source})+
  | ${Fs}
  | .
`.replace(/\s+/g, ''),
		'gsu'
	),
	Gn = new RegExp(
		K`
  \\ (?:
    ${Bs}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${Fs}
  | &&
  | .
`.replace(/\s+/g, ''),
		'gsu'
	);
function pu(t, e = {}) {
	const n = { flags: '', ...e, rules: { captureGroup: !1, singleline: !1, ...e.rules } };
	if (typeof t != 'string') throw new Error('String expected as pattern');
	const r = Lu(n.flags),
		o = [r.extended],
		s = {
			captureGroup: n.rules.captureGroup,
			getCurrentModX() {
				return o.at(-1);
			},
			numOpenGroups: 0,
			popModX() {
				o.pop();
			},
			pushModX(f) {
				o.push(f);
			},
			replaceCurrentModX(f) {
				o[o.length - 1] = f;
			},
			singleline: n.rules.singleline
		};
	let i = [],
		l;
	for (Ut.lastIndex = 0; (l = Ut.exec(t)); ) {
		const f = du(s, t, l[0], Ut.lastIndex);
		(f.tokens ? i.push(...f.tokens) : f.token && i.push(f.token),
			f.lastIndex !== void 0 && (Ut.lastIndex = f.lastIndex));
	}
	const a = [];
	let c = 0;
	(i
		.filter((f) => f.type === 'GroupOpen')
		.forEach((f) => {
			f.kind === 'capturing' ? (f.number = ++c) : f.raw === '(' && a.push(f);
		}),
		c ||
			a.forEach((f, p) => {
				((f.kind = 'capturing'), (f.number = p + 1));
			}));
	const u = c || a.length;
	return { tokens: i.map((f) => (f.type === 'EscapedNumber' ? Ou(f, u) : f)).flat(), flags: r };
}
function du(t, e, n, r) {
	const [o, s] = n;
	if (n === '[' || n === '[^') {
		const i = gu(e, n, r);
		return { tokens: i.tokens, lastIndex: i.lastIndex };
	}
	if (o === '\\') {
		if ('AbBGyYzZ'.includes(s)) return { token: No(n, n) };
		if (/^\\g[<']/.test(n)) {
			if (!/^\\g(?:<[^>]+>|'[^']+')$/.test(n)) throw new Error(`Invalid group name "${n}"`);
			return { token: ku(n) };
		}
		if (/^\\k[<']/.test(n)) {
			if (!/^\\k(?:<[^>]+>|'[^']+')$/.test(n)) throw new Error(`Invalid group name "${n}"`);
			return { token: js(n) };
		}
		if (s === 'K') return { token: zs('keep', n) };
		if (s === 'N' || s === 'R') return { token: De('newline', n, { negate: s === 'N' }) };
		if (s === 'O') return { token: De('any', n) };
		if (s === 'X') return { token: De('text_segment', n) };
		const i = Us(n, { inCharClass: !1 });
		return Array.isArray(i) ? { tokens: i } : { token: i };
	}
	if (o === '(') {
		if (s === '*') return { token: Ru(n) };
		if (n === '(?{') throw new Error(`Unsupported callout "${n}"`);
		if (n.startsWith('(?#')) {
			if (e[r] !== ')') throw new Error('Unclosed comment group "(?#"');
			return { lastIndex: r + 1 };
		}
		if (/^\(\?[-imx]+[:)]$/.test(n)) return { token: Tu(n, t) };
		if (
			(t.pushModX(t.getCurrentModX()),
			t.numOpenGroups++,
			(n === '(' && !t.captureGroup) || n === '(?:')
		)
			return { token: Qe('group', n) };
		if (n === '(?>') return { token: Qe('atomic', n) };
		if (n === '(?=' || n === '(?!' || n === '(?<=' || n === '(?<!')
			return {
				token: Qe(n[2] === '<' ? 'lookbehind' : 'lookahead', n, { negate: n.endsWith('!') })
			};
		if (
			(n === '(' && t.captureGroup) ||
			(n.startsWith('(?<') && n.endsWith('>')) ||
			(n.startsWith("(?'") && n.endsWith("'"))
		)
			return { token: Qe('capturing', n, { ...(n !== '(' && { name: n.slice(3, -1) }) }) };
		if (n.startsWith('(?~')) {
			if (n === '(?~|') throw new Error(`Unsupported absence function kind "${n}"`);
			return { token: Qe('absence_repeater', n) };
		}
		throw n === '(?('
			? new Error(`Unsupported conditional "${n}"`)
			: new Error(`Invalid or unsupported group option "${n}"`);
	}
	if (n === ')') {
		if ((t.popModX(), t.numOpenGroups--, t.numOpenGroups < 0)) throw new Error('Unmatched ")"');
		return { token: Su(n) };
	}
	if (t.getCurrentModX()) {
		if (n === '#') {
			const i = e.indexOf(
				`
`,
				r
			);
			return { lastIndex: i === -1 ? e.length : i };
		}
		if (/^\s$/.test(n)) {
			const i = /\s+/y;
			return ((i.lastIndex = r), { lastIndex: i.exec(e) ? i.lastIndex : r });
		}
	}
	if (n === '.') return { token: De('dot', n) };
	if (n === '^' || n === '$') {
		const i = t.singleline ? { '^': K`\A`, $: K`\Z` }[n] : n;
		return { token: No(i, n) };
	}
	return n === '|' ? { token: yu(n) } : wr.test(n) ? { tokens: Mu(n) } : { token: Ee(it(n), n) };
}
function gu(t, e, n) {
	const r = [Lo(e[1] === '^', e)];
	let o = 1,
		s;
	for (Gn.lastIndex = n; (s = Gn.exec(t)); ) {
		const i = s[0];
		if (i[0] === '[' && i[1] !== ':') (o++, r.push(Lo(i[1] === '^', i)));
		else if (i === ']') {
			if (r.at(-1).type === 'CharacterClassOpen') r.push(Ee(93, i));
			else if ((o--, r.push(_u(i)), !o)) break;
		} else {
			const l = mu(i);
			Array.isArray(l) ? r.push(...l) : r.push(l);
		}
	}
	return { tokens: r, lastIndex: Gn.lastIndex || t.length };
}
function mu(t) {
	if (t[0] === '\\') return Us(t, { inCharClass: !0 });
	if (t[0] === '[') {
		const e = /\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(t);
		if (!e || !br.has(e.groups.name)) throw new Error(`Invalid POSIX class "${t}"`);
		return De('posix', t, { value: e.groups.name, negate: !!e.groups.negate });
	}
	return t === '-' ? bu(t) : t === '&&' ? wu(t) : Ee(it(t), t);
}
function Us(t, { inCharClass: e }) {
	const n = t[1];
	if (n === 'c' || n === 'C') return xu(t);
	if ('dDhHsSwW'.includes(n)) return Iu(t);
	if (t.startsWith(K`\o{`))
		throw new Error(`Incomplete, invalid, or unsupported octal code point "${t}"`);
	if (/^\\[pP]\{/.test(t)) {
		if (t.length === 3) throw new Error(`Incomplete or invalid Unicode property "${t}"`);
		return Nu(t);
	}
	if (new RegExp('^\\\\x[89A-Fa-f]\\p{AHex}', 'u').test(t))
		try {
			const r = t
					.split(/\\x/)
					.slice(1)
					.map((i) => parseInt(i, 16)),
				o = new TextDecoder('utf-8', { ignoreBOM: !0, fatal: !0 }).decode(
					new Uint8Array(r)
				),
				s = new TextEncoder();
			return [...o].map((i) => {
				const l = [...s.encode(i)].map((a) => `\\x${a.toString(16)}`).join('');
				return Ee(it(i), l);
			});
		} catch {
			throw new Error(`Multibyte code "${t}" incomplete or invalid in Oniguruma`);
		}
	if (n === 'u' || n === 'x') return Ee(Pu(t), t);
	if (Po.has(n)) return Ee(Po.get(n), t);
	if (/\d/.test(n)) return Cu(e, t);
	if (t === '\\') throw new Error(K`Incomplete escape "\"`);
	if (n === 'M') throw new Error(`Unsupported meta "${t}"`);
	if ([...t].length === 2) return Ee(t.codePointAt(1), t);
	throw new Error(`Unexpected escape "${t}"`);
}
function yu(t) {
	return { type: 'Alternator', raw: t };
}
function No(t, e) {
	return { type: 'Assertion', kind: t, raw: e };
}
function js(t) {
	return { type: 'Backreference', raw: t };
}
function Ee(t, e) {
	return { type: 'Character', value: t, raw: e };
}
function _u(t) {
	return { type: 'CharacterClassClose', raw: t };
}
function bu(t) {
	return { type: 'CharacterClassHyphen', raw: t };
}
function wu(t) {
	return { type: 'CharacterClassIntersector', raw: t };
}
function Lo(t, e) {
	return { type: 'CharacterClassOpen', negate: t, raw: e };
}
function De(t, e, n = {}) {
	return { type: 'CharacterSet', kind: t, ...n, raw: e };
}
function zs(t, e, n = {}) {
	return t === 'keep'
		? { type: 'Directive', kind: t, raw: e }
		: { type: 'Directive', kind: t, flags: at(n.flags), raw: e };
}
function Cu(t, e) {
	return { type: 'EscapedNumber', inCharClass: t, raw: e };
}
function Su(t) {
	return { type: 'GroupClose', raw: t };
}
function Qe(t, e, n = {}) {
	return { type: 'GroupOpen', kind: t, ...n, raw: e };
}
function Eu(t, e, n, r) {
	return { type: 'NamedCallout', kind: t, tag: e, arguments: n, raw: r };
}
function Au(t, e, n, r) {
	return { type: 'Quantifier', kind: t, min: e, max: n, raw: r };
}
function ku(t) {
	return { type: 'Subroutine', raw: t };
}
const vu = new Set(['COUNT', 'CMP', 'ERROR', 'FAIL', 'MAX', 'MISMATCH', 'SKIP', 'TOTAL_COUNT']),
	Po = new Map([
		['a', 7],
		['b', 8],
		['e', 27],
		['f', 12],
		['n', 10],
		['r', 13],
		['t', 9],
		['v', 11]
	]);
function xu(t) {
	const e = t[1] === 'c' ? t[2] : t[3];
	if (!e || !/[A-Za-z]/.test(e)) throw new Error(`Unsupported control character "${t}"`);
	return Ee(it(e.toUpperCase()) - 64, t);
}
function Tu(t, e) {
	let { on: n, off: r } = /^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(t).groups;
	r ??= '';
	const o = (e.getCurrentModX() || n.includes('x')) && !r.includes('x'),
		s = Mo(n),
		i = Mo(r),
		l = {};
	if ((s && (l.enable = s), i && (l.disable = i), t.endsWith(')')))
		return (e.replaceCurrentModX(o), zs('flags', t, { flags: l }));
	if (t.endsWith(':'))
		return (
			e.pushModX(o),
			e.numOpenGroups++,
			Qe('group', t, { ...((s || i) && { flags: l }) })
		);
	throw new Error(`Unexpected flag modifier "${t}"`);
}
function Ru(t) {
	const e =
		/\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(
			t
		);
	if (!e) throw new Error(`Incomplete or invalid named callout "${t}"`);
	const { name: n, tag: r, args: o } = e.groups;
	if (!n) throw new Error(`Invalid named callout "${t}"`);
	if (r === '') throw new Error(`Named callout tag with empty value not allowed "${t}"`);
	const s = o
			? o
					.split(',')
					.filter((u) => u !== '')
					.map((u) => (/^[+-]?\d+$/.test(u) ? +u : u))
			: [],
		[i, l, a] = s,
		c = vu.has(n) ? n.toLowerCase() : 'custom';
	switch (c) {
		case 'fail':
		case 'mismatch':
		case 'skip':
			if (s.length > 0) throw new Error(`Named callout arguments not allowed "${s}"`);
			break;
		case 'error':
			if (s.length > 1) throw new Error(`Named callout allows only one argument "${s}"`);
			if (typeof i == 'string')
				throw new Error(`Named callout argument must be a number "${i}"`);
			break;
		case 'max':
			if (!s.length || s.length > 2)
				throw new Error(`Named callout must have one or two arguments "${s}"`);
			if (typeof i == 'string' && !/^[A-Za-z_]\w*$/.test(i))
				throw new Error(`Named callout argument one must be a tag or number "${i}"`);
			if (s.length === 2 && (typeof l == 'number' || !/^[<>X]$/.test(l)))
				throw new Error(
					`Named callout optional argument two must be '<', '>', or 'X' "${l}"`
				);
			break;
		case 'count':
		case 'total_count':
			if (s.length > 1) throw new Error(`Named callout allows only one argument "${s}"`);
			if (s.length === 1 && (typeof i == 'number' || !/^[<>X]$/.test(i)))
				throw new Error(`Named callout optional argument must be '<', '>', or 'X' "${i}"`);
			break;
		case 'cmp':
			if (s.length !== 3) throw new Error(`Named callout must have three arguments "${s}"`);
			if (typeof i == 'string' && !/^[A-Za-z_]\w*$/.test(i))
				throw new Error(`Named callout argument one must be a tag or number "${i}"`);
			if (typeof l == 'number' || !/^(?:[<>!=]=|[<>])$/.test(l))
				throw new Error(
					`Named callout argument two must be '==', '!=', '>', '<', '>=', or '<=' "${l}"`
				);
			if (typeof a == 'string' && !/^[A-Za-z_]\w*$/.test(a))
				throw new Error(`Named callout argument three must be a tag or number "${a}"`);
			break;
		case 'custom':
			throw new Error(`Undefined callout name "${n}"`);
		default:
			throw new Error(`Unexpected named callout kind "${c}"`);
	}
	return Eu(c, r ?? null, o?.split(',') ?? null, t);
}
function Oo(t) {
	let e = null,
		n,
		r;
	if (t[0] === '{') {
		const { minStr: o, maxStr: s } = /^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(t).groups,
			i = 1e5;
		if (+o > i || (s && +s > i)) throw new Error('Quantifier value unsupported in Oniguruma');
		if (
			((n = +o),
			(r = s === void 0 ? +o : s === '' ? 1 / 0 : +s),
			n > r && ((e = 'possessive'), ([n, r] = [r, n])),
			t.endsWith('?'))
		) {
			if (e === 'possessive')
				throw new Error('Unsupported possessive interval quantifier chain with "?"');
			e = 'lazy';
		} else e || (e = 'greedy');
	} else
		((n = t[0] === '+' ? 1 : 0),
			(r = t[0] === '?' ? 1 : 1 / 0),
			(e = t[1] === '+' ? 'possessive' : t[1] === '?' ? 'lazy' : 'greedy'));
	return Au(e, n, r, t);
}
function Iu(t) {
	const e = t[1].toLowerCase();
	return De({ d: 'digit', h: 'hex', s: 'space', w: 'word' }[e], t, { negate: t[1] !== e });
}
function Nu(t) {
	const { p: e, neg: n, value: r } = /^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(t).groups;
	return De('property', t, { value: r, negate: (e === 'P' && !n) || (e === 'p' && !!n) });
}
function Mo(t) {
	const e = {};
	return (
		t.includes('i') && (e.ignoreCase = !0),
		t.includes('m') && (e.dotAll = !0),
		t.includes('x') && (e.extended = !0),
		Object.keys(e).length ? e : null
	);
}
function Lu(t) {
	const e = {
		ignoreCase: !1,
		dotAll: !1,
		extended: !1,
		digitIsAscii: !1,
		posixIsAscii: !1,
		spaceIsAscii: !1,
		wordIsAscii: !1,
		textSegmentMode: null
	};
	for (let n = 0; n < t.length; n++) {
		const r = t[n];
		if (!'imxDPSWy'.includes(r)) throw new Error(`Invalid flag "${r}"`);
		if (r === 'y') {
			if (!/^y{[gw]}/.test(t.slice(n)))
				throw new Error('Invalid or unspecified flag "y" mode');
			((e.textSegmentMode = t[n + 2] === 'g' ? 'grapheme' : 'word'), (n += 3));
			continue;
		}
		e[
			{
				i: 'ignoreCase',
				m: 'dotAll',
				x: 'extended',
				D: 'digitIsAscii',
				P: 'posixIsAscii',
				S: 'spaceIsAscii',
				W: 'wordIsAscii'
			}[r]
		] = !0;
	}
	return e;
}
function Pu(t) {
	if (
		new RegExp(
			'^(?:\\\\u(?!\\p{AHex}{4})|\\\\x(?!\\p{AHex}{1,2}|\\{\\p{AHex}{1,8}\\}))',
			'u'
		).test(t)
	)
		throw new Error(`Incomplete or invalid escape "${t}"`);
	const e =
		t[2] === '{'
			? new RegExp('^\\\\x\\{\\s*(?<hex>\\p{AHex}+)', 'u').exec(t).groups.hex
			: t.slice(2);
	return parseInt(e, 16);
}
function Ou(t, e) {
	const { raw: n, inCharClass: r } = t,
		o = n.slice(1);
	if (!r && ((o !== '0' && o.length === 1) || (o[0] !== '0' && +o <= e))) return [js(n)];
	const s = [],
		i = o.match(/^[0-7]+|\d/g);
	for (let l = 0; l < i.length; l++) {
		const a = i[l];
		let c;
		if (l === 0 && a !== '8' && a !== '9') {
			if (((c = parseInt(a, 8)), c > 127))
				throw new Error(K`Octal encoded byte above 177 unsupported "${n}"`);
		} else c = it(a);
		s.push(Ee(c, (l === 0 ? '\\' : '') + a));
	}
	return s;
}
function Mu(t) {
	const e = [],
		n = new RegExp(wr, 'gy');
	let r;
	for (; (r = n.exec(t)); ) {
		const o = r[0];
		if (o[0] === '{') {
			const s = /^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(o);
			if (s) {
				const { min: i, max: l } = s.groups;
				if (+i > +l && o.endsWith('?')) {
					(n.lastIndex--, e.push(Oo(o.slice(0, -1))));
					continue;
				}
			}
		}
		e.push(Oo(o));
	}
	return e;
}
function Ws(t, e) {
	if (!Array.isArray(t.body)) throw new Error('Expected node with body array');
	if (t.body.length !== 1) return !1;
	const n = t.body[0];
	return !e || Object.keys(e).every((r) => e[r] === n[r]);
}
function $u(t) {
	return Du.has(t.type);
}
const Du = new Set([
	'AbsenceFunction',
	'Backreference',
	'CapturingGroup',
	'Character',
	'CharacterClass',
	'CharacterSet',
	'Group',
	'Quantifier',
	'Subroutine'
]);
function Hs(t, e = {}) {
	const n = {
			flags: '',
			normalizeUnknownPropertyNames: !1,
			skipBackrefValidation: !1,
			skipLookbehindValidation: !1,
			skipPropertyNameValidation: !1,
			unicodePropertyMap: null,
			...e,
			rules: { captureGroup: !1, singleline: !1, ...e.rules }
		},
		r = pu(t, {
			flags: n.flags,
			rules: { captureGroup: n.rules.captureGroup, singleline: n.rules.singleline }
		}),
		o = (p, g) => {
			const d = r.tokens[s.nextIndex];
			switch (((s.parent = p), s.nextIndex++, d.type)) {
				case 'Alternator':
					return Ge();
				case 'Assertion':
					return Gu(d);
				case 'Backreference':
					return Fu(d, s);
				case 'Character':
					return ln(d.value, { useLastValid: !!g.isCheckingRangeEnd });
				case 'CharacterClassHyphen':
					return Bu(d, s, g);
				case 'CharacterClassOpen':
					return Uu(d, s, g);
				case 'CharacterSet':
					return ju(d, s);
				case 'Directive':
					return Xu(d.kind, { flags: d.flags });
				case 'GroupOpen':
					return zu(d, s, g);
				case 'NamedCallout':
					return Ku(d.kind, d.tag, d.arguments);
				case 'Quantifier':
					return Wu(d, s);
				case 'Subroutine':
					return Hu(d, s);
				default:
					throw new Error(`Unexpected token type "${d.type}"`);
			}
		},
		s = {
			capturingGroups: [],
			hasNumberedRef: !1,
			namedGroupsByName: new Map(),
			nextIndex: 0,
			normalizeUnknownPropertyNames: n.normalizeUnknownPropertyNames,
			parent: null,
			skipBackrefValidation: n.skipBackrefValidation,
			skipLookbehindValidation: n.skipLookbehindValidation,
			skipPropertyNameValidation: n.skipPropertyNameValidation,
			subroutines: [],
			tokens: r.tokens,
			unicodePropertyMap: n.unicodePropertyMap,
			walk: o
		},
		i = Qu(Yu(r.flags));
	let l = i.body[0];
	for (; s.nextIndex < r.tokens.length; ) {
		const p = o(l, {});
		p.type === 'Alternative' ? (i.body.push(p), (l = p)) : l.body.push(p);
	}
	const { capturingGroups: a, hasNumberedRef: c, namedGroupsByName: u, subroutines: f } = s;
	if (c && u.size && !n.rules.captureGroup)
		throw new Error('Numbered backref/subroutine not allowed when using named capture');
	for (const { ref: p } of f)
		if (typeof p == 'number') {
			if (p > a.length) throw new Error("Subroutine uses a group number that's not defined");
			p && (a[p - 1].isSubroutined = !0);
		} else if (u.has(p)) {
			if (u.get(p).length > 1)
				throw new Error(K`Subroutine uses a duplicate group name "\g<${p}>"`);
			u.get(p)[0].isSubroutined = !0;
		} else throw new Error(K`Subroutine uses a group name that's not defined "\g<${p}>"`);
	return i;
}
function Gu({ kind: t }) {
	return rr(
		at(
			{
				'^': 'line_start',
				$: 'line_end',
				'\\A': 'string_start',
				'\\b': 'word_boundary',
				'\\B': 'word_boundary',
				'\\G': 'search_start',
				'\\y': 'text_segment_boundary',
				'\\Y': 'text_segment_boundary',
				'\\z': 'string_end',
				'\\Z': 'string_end_newline'
			}[t],
			`Unexpected assertion kind "${t}"`
		),
		{ negate: t === K`\B` || t === K`\Y` }
	);
}
function Fu({ raw: t }, e) {
	const n = /^\\k[<']/.test(t),
		r = n ? t.slice(3, -1) : t.slice(1),
		o = (s, i = !1) => {
			const l = e.capturingGroups.length;
			let a = !1;
			if (s > l)
				if (e.skipBackrefValidation) a = !0;
				else throw new Error(`Not enough capturing groups defined to the left "${t}"`);
			return ((e.hasNumberedRef = !0), or(i ? l + 1 - s : s, { orphan: a }));
		};
	if (n) {
		const s = /^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(r);
		if (s) return o(+s.groups.num, !!s.groups.sign);
		if (/[-+]/.test(r)) throw new Error(`Invalid backref name "${t}"`);
		if (!e.namedGroupsByName.has(r))
			throw new Error(`Group name not defined to the left "${t}"`);
		return or(r);
	}
	return o(+r);
}
function Bu(t, e, n) {
	const { tokens: r, walk: o } = e,
		s = e.parent,
		i = s.body.at(-1),
		l = r[e.nextIndex];
	if (
		!n.isCheckingRangeEnd &&
		i &&
		i.type !== 'CharacterClass' &&
		i.type !== 'CharacterClassRange' &&
		l &&
		l.type !== 'CharacterClassOpen' &&
		l.type !== 'CharacterClassClose' &&
		l.type !== 'CharacterClassIntersector'
	) {
		const a = o(s, { ...n, isCheckingRangeEnd: !0 });
		if (i.type === 'Character' && a.type === 'Character') return (s.body.pop(), qu(i, a));
		throw new Error('Invalid character class range');
	}
	return ln(it('-'));
}
function Uu({ negate: t }, e, n) {
	const { tokens: r, walk: o } = e,
		s = r[e.nextIndex],
		i = [Vt()];
	let l = Go(s);
	for (; l.type !== 'CharacterClassClose'; ) {
		if (l.type === 'CharacterClassIntersector') (i.push(Vt()), e.nextIndex++);
		else {
			const c = i.at(-1);
			c.body.push(o(c, n));
		}
		l = Go(r[e.nextIndex], s);
	}
	const a = Vt({ negate: t });
	return (
		i.length === 1
			? (a.body = i[0].body)
			: ((a.kind = 'intersection'),
				(a.body = i.map((c) => (c.body.length === 1 ? c.body[0] : c)))),
		e.nextIndex++,
		a
	);
}
function ju({ kind: t, negate: e, value: n }, r) {
	const {
		normalizeUnknownPropertyNames: o,
		skipPropertyNameValidation: s,
		unicodePropertyMap: i
	} = r;
	if (t === 'property') {
		const l = cn(n);
		if (br.has(l) && !i?.has(l)) ((t = 'posix'), (n = l));
		else
			return Je(n, {
				negate: e,
				normalizeUnknownPropertyNames: o,
				skipPropertyNameValidation: s,
				unicodePropertyMap: i
			});
	}
	return t === 'posix' ? Zu(n, { negate: e }) : sr(t, { negate: e });
}
function zu(t, e, n) {
	const {
			tokens: r,
			capturingGroups: o,
			namedGroupsByName: s,
			skipLookbehindValidation: i,
			walk: l
		} = e,
		a = Ju(t),
		c = a.type === 'AbsenceFunction',
		u = Do(a),
		f = u && a.negate;
	if (
		(a.type === 'CapturingGroup' && (o.push(a), a.name && hu(s, a.name, []).push(a)),
		c && n.isInAbsenceFunction)
	)
		throw new Error('Nested absence function not supported by Oniguruma');
	let p = Fo(r[e.nextIndex]);
	for (; p.type !== 'GroupClose'; ) {
		if (p.type === 'Alternator') (a.body.push(Ge()), e.nextIndex++);
		else {
			const g = a.body.at(-1),
				d = l(g, {
					...n,
					isInAbsenceFunction: n.isInAbsenceFunction || c,
					isInLookbehind: n.isInLookbehind || u,
					isInNegLookbehind: n.isInNegLookbehind || f
				});
			if ((g.body.push(d), (u || n.isInLookbehind) && !i)) {
				const C = 'Lookbehind includes a pattern not allowed by Oniguruma';
				if (f || n.isInNegLookbehind) {
					if ($o(d) || d.type === 'CapturingGroup') throw new Error(C);
				} else if ($o(d) || (Do(d) && d.negate)) throw new Error(C);
			}
		}
		p = Fo(r[e.nextIndex]);
	}
	return (e.nextIndex++, a);
}
function Wu({ kind: t, min: e, max: n }, r) {
	const o = r.parent,
		s = o.body.at(-1);
	if (!s || !$u(s)) throw new Error('Quantifier requires a repeatable token');
	const i = qs(t, e, n, s);
	return (o.body.pop(), i);
}
function Hu({ raw: t }, e) {
	const { capturingGroups: n, subroutines: r } = e;
	let o = t.slice(3, -1);
	const s = /^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(o);
	if (s) {
		const l = +s.groups.num,
			a = n.length;
		if (
			((e.hasNumberedRef = !0),
			(o = { '': l, '+': a + l, '-': a + 1 - l }[s.groups.sign]),
			o < 1)
		)
			throw new Error('Invalid subroutine number');
	} else o === '0' && (o = 0);
	const i = Xs(o);
	return (r.push(i), i);
}
function Vu(t, e) {
	return { type: 'AbsenceFunction', kind: t, body: xt(e?.body) };
}
function Ge(t) {
	return { type: 'Alternative', body: Ys(t?.body) };
}
function rr(t, e) {
	const n = { type: 'Assertion', kind: t };
	return (
		(t === 'word_boundary' || t === 'text_segment_boundary') && (n.negate = !!e?.negate),
		n
	);
}
function or(t, e) {
	const n = !!e?.orphan;
	return { type: 'Backreference', ref: t, ...(n && { orphan: n }) };
}
function Vs(t, e) {
	const n = { name: void 0, isSubroutined: !1, ...e };
	if (n.name !== void 0 && !ef(n.name))
		throw new Error(`Group name "${n.name}" invalid in Oniguruma`);
	return {
		type: 'CapturingGroup',
		number: t,
		...(n.name && { name: n.name }),
		...(n.isSubroutined && { isSubroutined: n.isSubroutined }),
		body: xt(e?.body)
	};
}
function ln(t, e) {
	const n = { useLastValid: !1, ...e };
	if (t > 1114111) {
		const r = t.toString(16);
		if (n.useLastValid) t = 1114111;
		else
			throw t > 1310719
				? new Error(`Invalid code point out of range "\\x{${r}}"`)
				: new Error(`Invalid code point out of range in JS "\\x{${r}}"`);
	}
	return { type: 'Character', value: t };
}
function Vt(t) {
	const e = { kind: 'union', negate: !1, ...t };
	return { type: 'CharacterClass', kind: e.kind, negate: e.negate, body: Ys(t?.body) };
}
function qu(t, e) {
	if (e.value < t.value) throw new Error('Character class range out of order');
	return { type: 'CharacterClassRange', min: t, max: e };
}
function sr(t, e) {
	const n = !!e?.negate,
		r = { type: 'CharacterSet', kind: t };
	return (
		(t === 'digit' || t === 'hex' || t === 'newline' || t === 'space' || t === 'word') &&
			(r.negate = n),
		(t === 'text_segment' || (t === 'newline' && !n)) && (r.variableLength = !0),
		r
	);
}
function Xu(t, e = {}) {
	if (t === 'keep') return { type: 'Directive', kind: t };
	if (t === 'flags') return { type: 'Directive', kind: t, flags: at(e.flags) };
	throw new Error(`Unexpected directive kind "${t}"`);
}
function Yu(t) {
	return { type: 'Flags', ...t };
}
function pe(t) {
	const e = t?.atomic,
		n = t?.flags;
	if (e && n) throw new Error('Atomic group cannot have flags');
	return { type: 'Group', ...(e && { atomic: e }), ...(n && { flags: n }), body: xt(t?.body) };
}
function Me(t) {
	const e = { behind: !1, negate: !1, ...t };
	return {
		type: 'LookaroundAssertion',
		kind: e.behind ? 'lookbehind' : 'lookahead',
		negate: e.negate,
		body: xt(t?.body)
	};
}
function Ku(t, e, n) {
	return { type: 'NamedCallout', kind: t, tag: e, arguments: n };
}
function Zu(t, e) {
	const n = !!e?.negate;
	if (!br.has(t)) throw new Error(`Invalid POSIX class "${t}"`);
	return { type: 'CharacterSet', kind: 'posix', value: t, negate: n };
}
function qs(t, e, n, r) {
	if (e > n) throw new Error('Invalid reversed quantifier range');
	return { type: 'Quantifier', kind: t, min: e, max: n, body: r };
}
function Qu(t, e) {
	return { type: 'Regex', body: xt(e?.body), flags: t };
}
function Xs(t) {
	return { type: 'Subroutine', ref: t };
}
function Je(t, e) {
	const n = {
		negate: !1,
		normalizeUnknownPropertyNames: !1,
		skipPropertyNameValidation: !1,
		unicodePropertyMap: null,
		...e
	};
	let r = n.unicodePropertyMap?.get(cn(t));
	if (!r) {
		if (n.normalizeUnknownPropertyNames) r = tf(t);
		else if (n.unicodePropertyMap && !n.skipPropertyNameValidation)
			throw new Error(K`Invalid Unicode property "\p{${t}}"`);
	}
	return { type: 'CharacterSet', kind: 'property', value: r ?? t, negate: n.negate };
}
function Ju({ flags: t, kind: e, name: n, negate: r, number: o }) {
	switch (e) {
		case 'absence_repeater':
			return Vu('repeater');
		case 'atomic':
			return pe({ atomic: !0 });
		case 'capturing':
			return Vs(o, { name: n });
		case 'group':
			return pe({ flags: t });
		case 'lookahead':
		case 'lookbehind':
			return Me({ behind: e === 'lookbehind', negate: r });
		default:
			throw new Error(`Unexpected group kind "${e}"`);
	}
}
function xt(t) {
	if (t === void 0) t = [Ge()];
	else if (!Array.isArray(t) || !t.length || !t.every((e) => e.type === 'Alternative'))
		throw new Error('Invalid body; expected array of one or more Alternative nodes');
	return t;
}
function Ys(t) {
	if (t === void 0) t = [];
	else if (!Array.isArray(t) || !t.every((e) => !!e.type))
		throw new Error('Invalid body; expected array of nodes');
	return t;
}
function $o(t) {
	return t.type === 'LookaroundAssertion' && t.kind === 'lookahead';
}
function Do(t) {
	return t.type === 'LookaroundAssertion' && t.kind === 'lookbehind';
}
function ef(t) {
	return /^[\p{Alpha}\p{Pc}][^)]*$/u.test(t);
}
function tf(t) {
	return t
		.trim()
		.replace(/[- _]+/g, '_')
		.replace(/[A-Z][a-z]+(?=[A-Z])/g, '$&_')
		.replace(/[A-Za-z]+/g, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase());
}
function cn(t) {
	return t.replace(/[- _]+/g, '').toLowerCase();
}
function Go(t, e) {
	return at(
		t,
		`${e?.type === 'Character' && e.value === 93 ? 'Empty' : 'Unclosed'} character class`
	);
}
function Fo(t) {
	return at(t, 'Unclosed group');
}
function _t(t, e, n = null) {
	function r(s, i) {
		for (let l = 0; l < s.length; l++) {
			const a = o(s[l], i, l, s);
			l = Math.max(-1, l + a);
		}
	}
	function o(s, i = null, l = null, a = null) {
		let c = 0,
			u = !1;
		const f = {
				node: s,
				parent: i,
				key: l,
				container: a,
				root: t,
				remove() {
					(jt(a).splice(Math.max(0, Ke(l) + c), 1), c--, (u = !0));
				},
				removeAllNextSiblings() {
					return jt(a).splice(Ke(l) + 1);
				},
				removeAllPrevSiblings() {
					const w = Ke(l) + c;
					return ((c -= w), jt(a).splice(0, Math.max(0, w)));
				},
				replaceWith(w, _ = {}) {
					const A = !!_.traverse;
					(a
						? (a[Math.max(0, Ke(l) + c)] = w)
						: (at(i, "Can't replace root node")[l] = w),
						A && o(w, i, l, a),
						(u = !0));
				},
				replaceWithMultiple(w, _ = {}) {
					const A = !!_.traverse;
					if ((jt(a).splice(Math.max(0, Ke(l) + c), 1, ...w), (c += w.length - 1), A)) {
						let P = 0;
						for (let v = 0; v < w.length; v++) P += o(w[v], i, Ke(l) + v + P, a);
					}
					u = !0;
				},
				skip() {
					u = !0;
				}
			},
			{ type: p } = s,
			g = e['*'],
			d = e[p],
			C = typeof g == 'function' ? g : g?.enter,
			b = typeof d == 'function' ? d : d?.enter;
		if ((C?.(f, n), b?.(f, n), !u))
			switch (p) {
				case 'AbsenceFunction':
				case 'CapturingGroup':
				case 'Group':
					r(s.body, s);
					break;
				case 'Alternative':
				case 'CharacterClass':
					r(s.body, s);
					break;
				case 'Assertion':
				case 'Backreference':
				case 'Character':
				case 'CharacterSet':
				case 'Directive':
				case 'Flags':
				case 'NamedCallout':
				case 'Subroutine':
					break;
				case 'CharacterClassRange':
					(o(s.min, s, 'min'), o(s.max, s, 'max'));
					break;
				case 'LookaroundAssertion':
					r(s.body, s);
					break;
				case 'Quantifier':
					o(s.body, s, 'body');
					break;
				case 'Regex':
					(r(s.body, s), o(s.flags, s, 'flags'));
					break;
				default:
					throw new Error(`Unexpected node type "${p}"`);
			}
		return (d?.exit?.(f, n), g?.exit?.(f, n), c);
	}
	return (o(t), t);
}
function jt(t) {
	if (!Array.isArray(t)) throw new Error('Container expected');
	return t;
}
function Ke(t) {
	if (typeof t != 'number') throw new Error('Numeric key expected');
	return t;
}
const nf = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`;
function rf(t, e) {
	for (let n = 0; n < t.length; n++) t[n] >= e && t[n]++;
}
function of(t, e, n, r) {
	return t.slice(0, e) + r + t.slice(e + n.length);
}
const he = Object.freeze({ DEFAULT: 'DEFAULT', CHAR_CLASS: 'CHAR_CLASS' });
function Cr(t, e, n, r) {
	const o = new RegExp(String.raw`${e}|(?<$skip>\[\^?|\\?.)`, 'gsu'),
		s = [!1];
	let i = 0,
		l = '';
	for (const a of t.matchAll(o)) {
		const {
			0: c,
			groups: { $skip: u }
		} = a;
		if (!u && (!r || (r === he.DEFAULT) == !i)) {
			n instanceof Function
				? (l += n(a, { context: i ? he.CHAR_CLASS : he.DEFAULT, negated: s[s.length - 1] }))
				: (l += n);
			continue;
		}
		(c[0] === '[' ? (i++, s.push(c[1] === '^')) : c === ']' && i && (i--, s.pop()), (l += c));
	}
	return l;
}
function Ks(t, e, n, r) {
	Cr(t, e, n, r);
}
function sf(t, e, n = 0, r) {
	if (!new RegExp(e, 'su').test(t)) return null;
	const o = new RegExp(`${e}|(?<$skip>\\\\?.)`, 'gsu');
	o.lastIndex = n;
	let s = 0,
		i;
	for (; (i = o.exec(t)); ) {
		const {
			0: l,
			groups: { $skip: a }
		} = i;
		if (!a && (!r || (r === he.DEFAULT) == !s)) return i;
		(l === '[' ? s++ : l === ']' && s && s--, o.lastIndex == i.index && o.lastIndex++);
	}
	return null;
}
function zt(t, e, n) {
	return !!sf(t, e, 0, n);
}
function af(t, e) {
	const n = /\\?./gsu;
	n.lastIndex = e;
	let r = t.length,
		o = 0,
		s = 1,
		i;
	for (; (i = n.exec(t)); ) {
		const [l] = i;
		if (l === '[') o++;
		else if (o) l === ']' && o--;
		else if (l === '(') s++;
		else if (l === ')' && (s--, !s)) {
			r = i.index;
			break;
		}
	}
	return t.slice(e, r);
}
const Bo = new RegExp(
	String.raw`(?<noncapturingStart>${nf})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`,
	'gsu'
);
function lf(t, e) {
	const n = e?.hiddenCaptures ?? [];
	let r = e?.captureTransfers ?? new Map();
	if (!/\(\?>/.test(t)) return { pattern: t, captureTransfers: r, hiddenCaptures: n };
	const o = '(?>',
		s = '(?:(?=(',
		i = [0],
		l = [];
	let a = 0,
		c = 0,
		u = NaN,
		f;
	do {
		f = !1;
		let p = 0,
			g = 0,
			d = !1,
			C;
		for (Bo.lastIndex = Number.isNaN(u) ? 0 : u + s.length; (C = Bo.exec(t)); ) {
			const {
				0: b,
				index: w,
				groups: { capturingStart: _, noncapturingStart: A }
			} = C;
			if (b === '[') p++;
			else if (p) b === ']' && p--;
			else if (b === o && !d) ((u = w), (d = !0));
			else if (d && A) g++;
			else if (_) d ? g++ : (a++, i.push(a + c));
			else if (b === ')' && d) {
				if (!g) {
					c++;
					const P = a + c;
					if (
						((t = `${t.slice(0, u)}${s}${t.slice(u + o.length, w)}))<$$${P}>)${t.slice(w + 1)}`),
						(f = !0),
						l.push(P),
						rf(n, P),
						r.size)
					) {
						const v = new Map();
						(r.forEach((O, U) => {
							v.set(
								U >= P ? U + 1 : U,
								O.map(($) => ($ >= P ? $ + 1 : $))
							);
						}),
							(r = v));
					}
					break;
				}
				g--;
			}
		}
	} while (f);
	return (
		n.push(...l),
		(t = Cr(
			t,
			String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`,
			({ 0: p, groups: { backrefNum: g, wrappedBackrefNum: d } }) => {
				if (g) {
					const C = +g;
					if (C > i.length - 1)
						throw new Error(`Backref "${p}" greater than number of captures`);
					return `\\${i[C]}`;
				}
				return `\\${d}`;
			},
			he.DEFAULT
		)),
		{ pattern: t, captureTransfers: r, hiddenCaptures: n }
	);
}
const Zs = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`,
	Fn = new RegExp(
		String.raw`
\\(?: \d+
  | c[A-Za-z]
  | [gk]<[^>]+>
  | [pPu]\{[^\}]+\}
  | u[A-Fa-f\d]{4}
  | x[A-Fa-f\d]{2}
  )
| \((?: \? (?: [:=!>]
  | <(?:[=!]|[^>]+>)
  | [A-Za-z\-]+:
  | \(DEFINE\)
  ))?
| (?<qBase>${Zs})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ''),
		'gsu'
	);
function cf(t) {
	if (!new RegExp(`${Zs}\\+`).test(t)) return { pattern: t };
	const e = [];
	let n = null,
		r = null,
		o = '',
		s = 0,
		i;
	for (Fn.lastIndex = 0; (i = Fn.exec(t)); ) {
		const {
			0: l,
			index: a,
			groups: { qBase: c, qMod: u, invalidQ: f }
		} = i;
		if (l === '[') (s || (r = a), s++);
		else if (l === ']') s ? s-- : (r = null);
		else if (!s)
			if (u === '+' && o && !o.startsWith('(')) {
				if (f) throw new Error(`Invalid quantifier "${l}"`);
				let p = -1;
				if (/^\{\d+\}$/.test(c)) t = of(t, a + c.length, u, '');
				else {
					if (o === ')' || o === ']') {
						const g = o === ')' ? n : r;
						if (g === null) throw new Error(`Invalid unmatched "${o}"`);
						t = `${t.slice(0, g)}(?>${t.slice(g, a)}${c})${t.slice(a + l.length)}`;
					} else t = `${t.slice(0, a - o.length)}(?>${o}${c})${t.slice(a + l.length)}`;
					p += 4;
				}
				Fn.lastIndex += p;
			} else l[0] === '(' ? e.push(a) : l === ')' && (n = e.length ? e.pop() : null);
		o = l;
	}
	return { pattern: t };
}
const fe = String.raw,
	uf = fe`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`,
	ir = fe`\(\?R=(?<rDepth>[^\)]+)\)|${uf}`,
	un = fe`\(\?<(?![=!])(?<captureName>[^>]+)>`,
	Qs = fe`${un}|(?<unnamed>\()(?!\?)`,
	Pe = new RegExp(fe`${un}|${ir}|\(\?|\\?.`, 'gsu'),
	Bn = 'Cannot use multiple overlapping recursions';
function ff(t, e) {
	const { hiddenCaptures: n, mode: r } = { hiddenCaptures: [], mode: 'plugin', ...e };
	let o = e?.captureTransfers ?? new Map();
	if (!new RegExp(ir, 'su').test(t))
		return { pattern: t, captureTransfers: o, hiddenCaptures: n };
	if (r === 'plugin' && zt(t, fe`\(\?\(DEFINE\)`, he.DEFAULT))
		throw new Error('DEFINE groups cannot be used with recursion');
	const s = [],
		i = zt(t, fe`\\[1-9]`, he.DEFAULT),
		l = new Map(),
		a = [];
	let c = !1,
		u = 0,
		f = 0,
		p;
	for (Pe.lastIndex = 0; (p = Pe.exec(t)); ) {
		const {
			0: g,
			groups: { captureName: d, rDepth: C, gRNameOrNum: b, gRDepth: w }
		} = p;
		if (g === '[') u++;
		else if (u) g === ']' && u--;
		else if (C) {
			if ((Uo(C), c)) throw new Error(Bn);
			if (i)
				throw new Error(
					`${r === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with global recursion`
				);
			const _ = t.slice(0, p.index),
				A = t.slice(Pe.lastIndex);
			if (zt(A, ir, he.DEFAULT)) throw new Error(Bn);
			const P = +C - 1;
			((t = jo(_, A, P, !1, n, s, f)), (o = Wo(o, _, P, s.length, 0, f)));
			break;
		} else if (b) {
			Uo(w);
			let _ = !1;
			for (const V of a)
				if (V.name === b || V.num === +b) {
					if (((_ = !0), V.hasRecursedWithin)) throw new Error(Bn);
					break;
				}
			if (!_)
				throw new Error(
					fe`Recursive \g cannot be used outside the referenced group "${r === 'external' ? b : fe`\g<${b}&R=${w}>`}"`
				);
			const A = l.get(b),
				P = af(t, A);
			if (i && zt(P, fe`${un}|\((?!\?)`, he.DEFAULT))
				throw new Error(
					`${r === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with recursion of capturing groups`
				);
			const v = t.slice(A, p.index),
				O = P.slice(v.length + g.length),
				U = s.length,
				$ = +w - 1,
				Be = jo(v, O, $, !0, n, s, f);
			o = Wo(o, v, $, s.length - U, U, f);
			const T = t.slice(0, A),
				Re = t.slice(A + P.length);
			((t = `${T}${Be}${Re}`),
				(Pe.lastIndex += Be.length - g.length - v.length - O.length),
				a.forEach((V) => (V.hasRecursedWithin = !0)),
				(c = !0));
		} else if (d)
			(f++,
				l.set(String(f), Pe.lastIndex),
				l.set(d, Pe.lastIndex),
				a.push({ num: f, name: d }));
		else if (g[0] === '(') {
			const _ = g === '(';
			(_ && (f++, l.set(String(f), Pe.lastIndex)), a.push(_ ? { num: f } : {}));
		} else g === ')' && a.pop();
	}
	return (n.push(...s), { pattern: t, captureTransfers: o, hiddenCaptures: n });
}
function Uo(t) {
	const e = `Max depth must be integer between 2 and 100; used ${t}`;
	if (!/^[1-9]\d*$/.test(t)) throw new Error(e);
	if (((t = +t), t < 2 || t > 100)) throw new Error(e);
}
function jo(t, e, n, r, o, s, i) {
	const l = new Set();
	r &&
		Ks(
			t + e,
			un,
			({ groups: { captureName: c } }) => {
				l.add(c);
			},
			he.DEFAULT
		);
	const a = [n, r ? l : null, o, s, i];
	return `${t}${zo(`(?:${t}`, 'forward', ...a)}(?:)${zo(`${e})`, 'backward', ...a)}${e}`;
}
function zo(t, e, n, r, o, s, i) {
	const a = (u) => (e === 'forward' ? u + 2 : n - u + 2 - 1);
	let c = '';
	for (let u = 0; u < n; u++) {
		const f = a(u);
		c += Cr(
			t,
			fe`${Qs}|\\k<(?<backref>[^>]+)>`,
			({ 0: p, groups: { captureName: g, unnamed: d, backref: C } }) => {
				if (C && r && !r.has(C)) return p;
				const b = `_$${f}`;
				if (d || g) {
					const w = i + s.length + 1;
					return (s.push(w), hf(o, w), d ? p : `(?<${g}${b}>`);
				}
				return fe`\k<${C}${b}>`;
			},
			he.DEFAULT
		);
	}
	return c;
}
function hf(t, e) {
	for (let n = 0; n < t.length; n++) t[n] >= e && t[n]++;
}
function Wo(t, e, n, r, o, s) {
	if (t.size && r) {
		let i = 0;
		Ks(e, Qs, () => i++, he.DEFAULT);
		const l = s - i + o,
			a = new Map();
		return (
			t.forEach((c, u) => {
				const f = (r - i * n) / n,
					p = i * n,
					g = u > l + i ? u + r : u,
					d = [];
				for (const C of c)
					if (C <= l) d.push(C);
					else if (C > l + i + f) d.push(C + r);
					else if (C <= l + i) for (let b = 0; b <= n; b++) d.push(C + i * b);
					else for (let b = 0; b <= n; b++) d.push(C + p + f * b);
				a.set(g, d);
			}),
			a
		);
	}
	return t;
}
var W = String.fromCodePoint,
	x = String.raw,
	Ae = {
		flagGroups: (() => {
			try {
				new RegExp('(?i:)');
			} catch {
				return !1;
			}
			return !0;
		})(),
		unicodeSets: (() => {
			try {
				new RegExp('', 'v');
			} catch {
				return !1;
			}
			return !0;
		})()
	};
Ae.bugFlagVLiteralHyphenIsRange = Ae.unicodeSets
	? (() => {
			try {
				new RegExp(x`[\d\-a]`, 'v');
			} catch {
				return !0;
			}
			return !1;
		})()
	: !1;
Ae.bugNestedClassIgnoresNegation = Ae.unicodeSets && new RegExp('[[^a]]', 'v').test('a');
function on(t, { enable: e, disable: n }) {
	return {
		dotAll: !n?.dotAll && !!(e?.dotAll || t.dotAll),
		ignoreCase: !n?.ignoreCase && !!(e?.ignoreCase || t.ignoreCase)
	};
}
function At(t, e, n) {
	return (t.has(e) || t.set(e, n), t.get(e));
}
function ar(t, e) {
	return Ho[t] >= Ho[e];
}
function pf(t, e) {
	if (t == null) throw new Error(e ?? 'Value expected');
	return t;
}
var Ho = { ES2025: 2025, ES2024: 2024, ES2018: 2018 },
	df = { auto: 'auto', ES2025: 'ES2025', ES2024: 'ES2024', ES2018: 'ES2018' };
function Js(t = {}) {
	if ({}.toString.call(t) !== '[object Object]') throw new Error('Unexpected options');
	if (t.target !== void 0 && !df[t.target]) throw new Error(`Unexpected target "${t.target}"`);
	const e = {
		accuracy: 'default',
		avoidSubclass: !1,
		flags: '',
		global: !1,
		hasIndices: !1,
		lazyCompileLength: 1 / 0,
		target: 'auto',
		verbose: !1,
		...t,
		rules: {
			allowOrphanBackrefs: !1,
			asciiWordBoundaries: !1,
			captureGroup: !1,
			recursionLimit: 20,
			singleline: !1,
			...t.rules
		}
	};
	return (
		e.target === 'auto' &&
			(e.target = Ae.flagGroups ? 'ES2025' : Ae.unicodeSets ? 'ES2024' : 'ES2018'),
		e
	);
}
var gf = '[	-\r ]',
	mf = new Set([W(304), W(305)]),
	we = x`[\p{L}\p{M}\p{N}\p{Pc}]`;
function ei(t) {
	if (mf.has(t)) return [t];
	const e = new Set(),
		n = t.toLowerCase(),
		r = n.toUpperCase(),
		o = bf.get(n),
		s = yf.get(n),
		i = _f.get(n);
	return (
		[...r].length === 1 && e.add(r),
		i && e.add(i),
		o && e.add(o),
		e.add(n),
		s && e.add(s),
		[...e]
	);
}
var Sr = new Map(
		`C Other
Cc Control cntrl
Cf Format
Cn Unassigned
Co Private_Use
Cs Surrogate
L Letter
LC Cased_Letter
Ll Lowercase_Letter
Lm Modifier_Letter
Lo Other_Letter
Lt Titlecase_Letter
Lu Uppercase_Letter
M Mark Combining_Mark
Mc Spacing_Mark
Me Enclosing_Mark
Mn Nonspacing_Mark
N Number
Nd Decimal_Number digit
Nl Letter_Number
No Other_Number
P Punctuation punct
Pc Connector_Punctuation
Pd Dash_Punctuation
Pe Close_Punctuation
Pf Final_Punctuation
Pi Initial_Punctuation
Po Other_Punctuation
Ps Open_Punctuation
S Symbol
Sc Currency_Symbol
Sk Modifier_Symbol
Sm Math_Symbol
So Other_Symbol
Z Separator
Zl Line_Separator
Zp Paragraph_Separator
Zs Space_Separator
ASCII
ASCII_Hex_Digit AHex
Alphabetic Alpha
Any
Assigned
Bidi_Control Bidi_C
Bidi_Mirrored Bidi_M
Case_Ignorable CI
Cased
Changes_When_Casefolded CWCF
Changes_When_Casemapped CWCM
Changes_When_Lowercased CWL
Changes_When_NFKC_Casefolded CWKCF
Changes_When_Titlecased CWT
Changes_When_Uppercased CWU
Dash
Default_Ignorable_Code_Point DI
Deprecated Dep
Diacritic Dia
Emoji
Emoji_Component EComp
Emoji_Modifier EMod
Emoji_Modifier_Base EBase
Emoji_Presentation EPres
Extended_Pictographic ExtPict
Extender Ext
Grapheme_Base Gr_Base
Grapheme_Extend Gr_Ext
Hex_Digit Hex
IDS_Binary_Operator IDSB
IDS_Trinary_Operator IDST
ID_Continue IDC
ID_Start IDS
Ideographic Ideo
Join_Control Join_C
Logical_Order_Exception LOE
Lowercase Lower
Math
Noncharacter_Code_Point NChar
Pattern_Syntax Pat_Syn
Pattern_White_Space Pat_WS
Quotation_Mark QMark
Radical
Regional_Indicator RI
Sentence_Terminal STerm
Soft_Dotted SD
Terminal_Punctuation Term
Unified_Ideograph UIdeo
Uppercase Upper
Variation_Selector VS
White_Space space
XID_Continue XIDC
XID_Start XIDS`
			.split(/\s/)
			.map((t) => [cn(t), t])
	),
	yf = new Map([
		['s', W(383)],
		[W(383), 's']
	]),
	_f = new Map([
		[W(223), W(7838)],
		[W(107), W(8490)],
		[W(229), W(8491)],
		[W(969), W(8486)]
	]),
	bf = new Map([
		ve(453),
		ve(456),
		ve(459),
		ve(498),
		...Un(8072, 8079),
		...Un(8088, 8095),
		...Un(8104, 8111),
		ve(8124),
		ve(8140),
		ve(8188)
	]),
	wf = new Map([
		['alnum', x`[\p{Alpha}\p{Nd}]`],
		['alpha', x`\p{Alpha}`],
		['ascii', x`\p{ASCII}`],
		['blank', x`[\p{Zs}\t]`],
		['cntrl', x`\p{Cc}`],
		['digit', x`\p{Nd}`],
		['graph', x`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
		['lower', x`\p{Lower}`],
		['print', x`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
		['punct', x`[\p{P}\p{S}]`],
		['space', x`\p{space}`],
		['upper', x`\p{Upper}`],
		['word', x`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
		['xdigit', x`\p{AHex}`]
	]);
function Cf(t, e) {
	const n = [];
	for (let r = t; r <= e; r++) n.push(r);
	return n;
}
function ve(t) {
	const e = W(t);
	return [e.toLowerCase(), e];
}
function Un(t, e) {
	return Cf(t, e).map((n) => ve(n));
}
var ti = new Set([
	'Lower',
	'Lowercase',
	'Upper',
	'Uppercase',
	'Ll',
	'Lowercase_Letter',
	'Lt',
	'Titlecase_Letter',
	'Lu',
	'Uppercase_Letter'
]);
function Sf(t, e) {
	const n = {
		accuracy: 'default',
		asciiWordBoundaries: !1,
		avoidSubclass: !1,
		bestEffortTarget: 'ES2025',
		...e
	};
	ni(t);
	const r = {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		flagDirectivesByAlt: new Map(),
		jsGroupNameMap: new Map(),
		minTargetEs2024: ar(n.bestEffortTarget, 'ES2024'),
		passedLookbehind: !1,
		strategy: null,
		subroutineRefMap: new Map(),
		supportedGNodes: new Set(),
		digitIsAscii: t.flags.digitIsAscii,
		spaceIsAscii: t.flags.spaceIsAscii,
		wordIsAscii: t.flags.wordIsAscii
	};
	_t(t, Ef, r);
	const o = { dotAll: t.flags.dotAll, ignoreCase: t.flags.ignoreCase },
		s = {
			currentFlags: o,
			prevFlags: null,
			globalFlags: o,
			groupOriginByCopy: new Map(),
			groupsByName: new Map(),
			multiplexCapturesToLeftByRef: new Map(),
			openRefs: new Map(),
			reffedNodesByReferencer: new Map(),
			subroutineRefMap: r.subroutineRefMap
		};
	_t(t, Af, s);
	const i = {
		groupsByName: s.groupsByName,
		highestOrphanBackref: 0,
		numCapturesToLeft: 0,
		reffedNodesByReferencer: s.reffedNodesByReferencer
	};
	return (_t(t, kf, i), (t._originMap = s.groupOriginByCopy), (t._strategy = r.strategy), t);
}
var Ef = {
		AbsenceFunction({ node: t, parent: e, replaceWith: n }) {
			const { body: r, kind: o } = t;
			if (o === 'repeater') {
				const s = pe();
				s.body[0].body.push(Me({ negate: !0, body: r }), Je('Any'));
				const i = pe();
				(i.body[0].body.push(qs('greedy', 0, 1 / 0, s)), n(B(i, e), { traverse: !0 }));
			} else throw new Error('Unsupported absence function "(?~|"');
		},
		Alternative: {
			enter({ node: t, parent: e, key: n }, { flagDirectivesByAlt: r }) {
				const o = t.body.filter((s) => s.kind === 'flags');
				for (let s = n + 1; s < e.body.length; s++) {
					const i = e.body[s];
					At(r, i, []).push(...o);
				}
			},
			exit({ node: t }, { flagDirectivesByAlt: e }) {
				if (e.get(t)?.length) {
					const n = oi(e.get(t));
					if (n) {
						const r = pe({ flags: n });
						((r.body[0].body = t.body), (t.body = [B(r, t)]));
					}
				}
			}
		},
		Assertion(
			{ node: t, parent: e, key: n, container: r, root: o, remove: s, replaceWith: i },
			l
		) {
			const { kind: a, negate: c } = t,
				{
					asciiWordBoundaries: u,
					avoidSubclass: f,
					supportedGNodes: p,
					wordIsAscii: g
				} = l;
			if (a === 'text_segment_boundary')
				throw new Error(`Unsupported text segment boundary "\\${c ? 'Y' : 'y'}"`);
			if (a === 'line_end')
				i(B(Me({ body: [Ge({ body: [rr('string_end')] }), Ge({ body: [ln(10)] })] }), e));
			else if (a === 'line_start')
				i(B(Ce(x`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: !0 }), e));
			else if (a === 'search_start')
				if (p.has(t)) ((o.flags.sticky = !0), s());
				else {
					const d = r[n - 1];
					if (d && Nf(d)) i(B(Me({ negate: !0 }), e));
					else {
						if (f) throw new Error(x`Uses "\G" in a way that requires a subclass`);
						(i(xe(rr('string_start'), e)), (l.strategy = 'clip_search'));
					}
				}
			else if (!(a === 'string_end' || a === 'string_start'))
				if (a === 'string_end_newline') i(B(Ce(x`(?=\n?\z)`), e));
				else if (a === 'word_boundary') {
					if (!g && !u) {
						const d = `(?:(?<=${we})(?!${we})|(?<!${we})(?=${we}))`,
							C = `(?:(?<=${we})(?=${we})|(?<!${we})(?!${we}))`;
						i(B(Ce(c ? C : d), e));
					}
				} else throw new Error(`Unexpected assertion kind "${a}"`);
		},
		Backreference({ node: t }, { jsGroupNameMap: e }) {
			let { ref: n } = t;
			typeof n == 'string' && !zn(n) && ((n = jn(n, e)), (t.ref = n));
		},
		CapturingGroup({ node: t }, { jsGroupNameMap: e, subroutineRefMap: n }) {
			let { name: r } = t;
			(r && !zn(r) && ((r = jn(r, e)), (t.name = r)), n.set(t.number, t), r && n.set(r, t));
		},
		CharacterClassRange({ node: t, parent: e, replaceWith: n }) {
			if (e.kind === 'intersection') {
				const r = Vt({ body: [t] });
				n(B(r, e), { traverse: !0 });
			}
		},
		CharacterSet(
			{ node: t, parent: e, replaceWith: n },
			{ accuracy: r, minTargetEs2024: o, digitIsAscii: s, spaceIsAscii: i, wordIsAscii: l }
		) {
			const { kind: a, negate: c, value: u } = t;
			if (s && (a === 'digit' || u === 'digit')) {
				n(xe(sr('digit', { negate: c }), e));
				return;
			}
			if (i && (a === 'space' || u === 'space')) {
				n(B(Wn(Ce(gf), c), e));
				return;
			}
			if (l && (a === 'word' || u === 'word')) {
				n(xe(sr('word', { negate: c }), e));
				return;
			}
			if (a === 'any') n(xe(Je('Any'), e));
			else if (a === 'digit') n(xe(Je('Nd', { negate: c }), e));
			else if (a !== 'dot')
				if (a === 'text_segment') {
					if (r === 'strict')
						throw new Error(x`Use of "\X" requires non-strict accuracy`);
					const f =
							'\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?',
						p = x`\p{RI}{2}|${f}(?:\u200D${f})*`;
					n(
						B(
							Ce(x`(?>\r\n|${o ? x`\p{RGI_Emoji}` : p}|\P{M}\p{M}*)`, {
								skipPropertyNameValidation: !0
							}),
							e
						)
					);
				} else if (a === 'hex') n(xe(Je('AHex', { negate: c }), e));
				else if (a === 'newline')
					n(
						B(
							Ce(
								c
									? `[^
]`
									: `(?>\r
?|[
\v\f\u2028\u2029])`
							),
							e
						)
					);
				else if (a === 'posix')
					if (!o && (u === 'graph' || u === 'print')) {
						if (r === 'strict')
							throw new Error(
								`POSIX class "${u}" requires min target ES2024 or non-strict accuracy`
							);
						let f = { graph: '!-~', print: ' -~' }[u];
						(c && (f = `\0-${W(f.codePointAt(0) - 1)}${W(f.codePointAt(2) + 1)}-􏿿`),
							n(B(Ce(`[${f}]`), e)));
					} else n(B(Wn(Ce(wf.get(u)), c), e));
				else if (a === 'property') Sr.has(cn(u)) || (t.key = 'sc');
				else if (a === 'space') n(xe(Je('space', { negate: c }), e));
				else if (a === 'word') n(B(Wn(Ce(we), c), e));
				else throw new Error(`Unexpected character set kind "${a}"`);
		},
		Directive({
			node: t,
			parent: e,
			root: n,
			remove: r,
			replaceWith: o,
			removeAllPrevSiblings: s,
			removeAllNextSiblings: i
		}) {
			const { kind: l, flags: a } = t;
			if (l === 'flags')
				if (!a.enable && !a.disable) r();
				else {
					const c = pe({ flags: a });
					((c.body[0].body = i()), o(B(c, e), { traverse: !0 }));
				}
			else if (l === 'keep') {
				const c = n.body[0],
					f =
						n.body.length === 1 &&
						Ws(c, { type: 'Group' }) &&
						c.body[0].body.length === 1
							? c.body[0]
							: n;
				if (e.parent !== f || f.body.length > 1)
					throw new Error(x`Uses "\K" in a way that's unsupported`);
				const p = Me({ behind: !0 });
				((p.body[0].body = s()), o(B(p, e)));
			} else throw new Error(`Unexpected directive kind "${l}"`);
		},
		Flags({ node: t, parent: e }) {
			if (t.posixIsAscii) throw new Error('Unsupported flag "P"');
			if (t.textSegmentMode === 'word') throw new Error('Unsupported flag "y{w}"');
			([
				'digitIsAscii',
				'extended',
				'posixIsAscii',
				'spaceIsAscii',
				'wordIsAscii',
				'textSegmentMode'
			].forEach((n) => delete t[n]),
				Object.assign(t, {
					global: !1,
					hasIndices: !1,
					multiline: !1,
					sticky: t.sticky ?? !1
				}),
				(e.options = { disable: { x: !0, n: !0 }, force: { v: !0 } }));
		},
		Group({ node: t }) {
			if (!t.flags) return;
			const { enable: e, disable: n } = t.flags;
			(e?.extended && delete e.extended,
				n?.extended && delete n.extended,
				e?.dotAll && n?.dotAll && delete e.dotAll,
				e?.ignoreCase && n?.ignoreCase && delete e.ignoreCase,
				e && !Object.keys(e).length && delete t.flags.enable,
				n && !Object.keys(n).length && delete t.flags.disable,
				!t.flags.enable && !t.flags.disable && delete t.flags);
		},
		LookaroundAssertion({ node: t }, e) {
			const { kind: n } = t;
			n === 'lookbehind' && (e.passedLookbehind = !0);
		},
		NamedCallout({ node: t, parent: e, replaceWith: n }) {
			const { kind: r } = t;
			if (r === 'fail') n(B(Me({ negate: !0 }), e));
			else throw new Error(`Unsupported named callout "(*${r.toUpperCase()}"`);
		},
		Quantifier({ node: t }) {
			if (t.body.type === 'Quantifier') {
				const e = pe();
				(e.body[0].body.push(t.body), (t.body = B(e, t)));
			}
		},
		Regex: {
			enter({ node: t }, { supportedGNodes: e }) {
				const n = [];
				let r = !1,
					o = !1;
				for (const s of t.body)
					if (s.body.length === 1 && s.body[0].kind === 'search_start') s.body.pop();
					else {
						const i = ii(s.body);
						i ? ((r = !0), Array.isArray(i) ? n.push(...i) : n.push(i)) : (o = !0);
					}
				r && !o && n.forEach((s) => e.add(s));
			},
			exit(t, { accuracy: e, passedLookbehind: n, strategy: r }) {
				if (e === 'strict' && n && r)
					throw new Error(x`Uses "\G" in a way that requires non-strict accuracy`);
			}
		},
		Subroutine({ node: t }, { jsGroupNameMap: e }) {
			let { ref: n } = t;
			typeof n == 'string' && !zn(n) && ((n = jn(n, e)), (t.ref = n));
		}
	},
	Af = {
		Backreference(
			{ node: t },
			{ multiplexCapturesToLeftByRef: e, reffedNodesByReferencer: n }
		) {
			const { orphan: r, ref: o } = t;
			r || n.set(t, [...e.get(o).map(({ node: s }) => s)]);
		},
		CapturingGroup: {
			enter(
				{ node: t, parent: e, replaceWith: n, skip: r },
				{
					groupOriginByCopy: o,
					groupsByName: s,
					multiplexCapturesToLeftByRef: i,
					openRefs: l,
					reffedNodesByReferencer: a
				}
			) {
				const c = o.get(t);
				if (c && l.has(t.number)) {
					const f = xe(Vo(t.number), e);
					(a.set(f, l.get(t.number)), n(f));
					return;
				}
				(l.set(t.number, t), i.set(t.number, []), t.name && At(i, t.name, []));
				const u = i.get(t.name ?? t.number);
				for (let f = 0; f < u.length; f++) {
					const p = u[f];
					if (c === p.node || (c && c === p.origin) || t === p.origin) {
						u.splice(f, 1);
						break;
					}
				}
				if (
					(i.get(t.number).push({ node: t, origin: c }),
					t.name && i.get(t.name).push({ node: t, origin: c }),
					t.name)
				) {
					const f = At(s, t.name, new Map());
					let p = !1;
					if (c) p = !0;
					else
						for (const g of f.values())
							if (!g.hasDuplicateNameToRemove) {
								p = !0;
								break;
							}
					s.get(t.name).set(t, { node: t, hasDuplicateNameToRemove: p });
				}
			},
			exit({ node: t }, { openRefs: e }) {
				e.delete(t.number);
			}
		},
		Group: {
			enter({ node: t }, e) {
				((e.prevFlags = e.currentFlags),
					t.flags && (e.currentFlags = on(e.currentFlags, t.flags)));
			},
			exit(t, e) {
				e.currentFlags = e.prevFlags;
			}
		},
		Subroutine({ node: t, parent: e, replaceWith: n }, r) {
			const { isRecursive: o, ref: s } = t;
			if (o) {
				let u = e;
				for (
					;
					(u = u.parent) &&
					!(u.type === 'CapturingGroup' && (u.name === s || u.number === s));

				);
				r.reffedNodesByReferencer.set(t, u);
				return;
			}
			const i = r.subroutineRefMap.get(s),
				l = s === 0,
				a = l ? Vo(0) : ri(i, r.groupOriginByCopy, null);
			let c = a;
			if (!l) {
				const u = oi(Tf(i, (p) => p.type === 'Group' && !!p.flags)),
					f = u ? on(r.globalFlags, u) : r.globalFlags;
				vf(f, r.currentFlags) || ((c = pe({ flags: Rf(f) })), c.body[0].body.push(a));
			}
			n(B(c, e), { traverse: !l });
		}
	},
	kf = {
		Backreference({ node: t, parent: e, replaceWith: n }, r) {
			if (t.orphan) {
				r.highestOrphanBackref = Math.max(r.highestOrphanBackref, t.ref);
				return;
			}
			const s = r.reffedNodesByReferencer.get(t).filter((i) => xf(i, t));
			if (!s.length) n(B(Me({ negate: !0 }), e));
			else if (s.length > 1) {
				const i = pe({
					atomic: !0,
					body: s.reverse().map((l) => Ge({ body: [or(l.number)] }))
				});
				n(B(i, e));
			} else t.ref = s[0].number;
		},
		CapturingGroup({ node: t }, e) {
			((t.number = ++e.numCapturesToLeft),
				t.name &&
					e.groupsByName.get(t.name).get(t).hasDuplicateNameToRemove &&
					delete t.name);
		},
		Regex: {
			exit({ node: t }, e) {
				const n = Math.max(e.highestOrphanBackref - e.numCapturesToLeft, 0);
				for (let r = 0; r < n; r++) {
					const o = Vs();
					t.body.at(-1).body.push(o);
				}
			}
		},
		Subroutine({ node: t }, e) {
			!t.isRecursive || t.ref === 0 || (t.ref = e.reffedNodesByReferencer.get(t).number);
		}
	};
function ni(t) {
	_t(t, {
		'*'({ node: e, parent: n }) {
			e.parent = n;
		}
	});
}
function vf(t, e) {
	return t.dotAll === e.dotAll && t.ignoreCase === e.ignoreCase;
}
function xf(t, e) {
	let n = e;
	do {
		if (n.type === 'Regex') return !1;
		if (n.type === 'Alternative') continue;
		if (n === t) return !1;
		const r = si(n.parent);
		for (const o of r) {
			if (o === n) break;
			if (o === t || ai(o, t)) return !0;
		}
	} while ((n = n.parent));
	throw new Error('Unexpected path');
}
function ri(t, e, n, r) {
	const o = Array.isArray(t) ? [] : {};
	for (const [s, i] of Object.entries(t))
		s === 'parent'
			? (o.parent = Array.isArray(n) ? r : n)
			: i && typeof i == 'object'
				? (o[s] = ri(i, e, o, n))
				: (s === 'type' && i === 'CapturingGroup' && e.set(o, e.get(t) ?? t), (o[s] = i));
	return o;
}
function Vo(t) {
	const e = Xs(t);
	return ((e.isRecursive = !0), e);
}
function Tf(t, e) {
	const n = [];
	for (; (t = t.parent); ) (!e || e(t)) && n.push(t);
	return n;
}
function jn(t, e) {
	if (e.has(t)) return e.get(t);
	const n = `$${e.size}_${t.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/gu, '_')}`;
	return (e.set(t, n), n);
}
function oi(t) {
	const e = ['dotAll', 'ignoreCase'],
		n = { enable: {}, disable: {} };
	return (
		t.forEach(({ flags: r }) => {
			e.forEach((o) => {
				(r.enable?.[o] && (delete n.disable[o], (n.enable[o] = !0)),
					r.disable?.[o] && (n.disable[o] = !0));
			});
		}),
		Object.keys(n.enable).length || delete n.enable,
		Object.keys(n.disable).length || delete n.disable,
		n.enable || n.disable ? n : null
	);
}
function Rf({ dotAll: t, ignoreCase: e }) {
	const n = {};
	return (
		(t || e) && ((n.enable = {}), t && (n.enable.dotAll = !0), e && (n.enable.ignoreCase = !0)),
		(!t || !e) &&
			((n.disable = {}), !t && (n.disable.dotAll = !0), !e && (n.disable.ignoreCase = !0)),
		n
	);
}
function si(t) {
	if (!t) throw new Error('Node expected');
	const { body: e } = t;
	return Array.isArray(e) ? e : e ? [e] : null;
}
function ii(t) {
	const e = t.find((n) => n.kind === 'search_start' || Lf(n, { negate: !1 }) || !If(n));
	if (!e) return null;
	if (e.kind === 'search_start') return e;
	if (e.type === 'LookaroundAssertion') return e.body[0].body[0];
	if (e.type === 'CapturingGroup' || e.type === 'Group') {
		const n = [];
		for (const r of e.body) {
			const o = ii(r.body);
			if (!o) return null;
			Array.isArray(o) ? n.push(...o) : n.push(o);
		}
		return n;
	}
	return null;
}
function ai(t, e) {
	const n = si(t) ?? [];
	for (const r of n) if (r === e || ai(r, e)) return !0;
	return !1;
}
function If({ type: t }) {
	return t === 'Assertion' || t === 'Directive' || t === 'LookaroundAssertion';
}
function Nf(t) {
	const e = ['Character', 'CharacterClass', 'CharacterSet'];
	return e.includes(t.type) || (t.type === 'Quantifier' && t.min && e.includes(t.body.type));
}
function Lf(t, e) {
	const n = { negate: null, ...e };
	return (
		t.type === 'LookaroundAssertion' &&
		(n.negate === null || t.negate === n.negate) &&
		t.body.length === 1 &&
		Ws(t.body[0], { type: 'Assertion', kind: 'search_start' })
	);
}
function zn(t) {
	return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(t);
}
function Ce(t, e) {
	const r = Hs(t, { ...e, unicodePropertyMap: Sr }).body;
	return r.length > 1 || r[0].body.length > 1 ? pe({ body: r }) : r[0].body[0];
}
function Wn(t, e) {
	return ((t.negate = e), t);
}
function xe(t, e) {
	return ((t.parent = e), t);
}
function B(t, e) {
	return (ni(t), (t.parent = e), t);
}
function Pf(t, e) {
	const n = Js(e),
		r = ar(n.target, 'ES2024'),
		o = ar(n.target, 'ES2025'),
		s = n.rules.recursionLimit;
	if (!Number.isInteger(s) || s < 2 || s > 20)
		throw new Error('Invalid recursionLimit; use 2-20');
	let i = null,
		l = null;
	if (!o) {
		const g = [t.flags.ignoreCase];
		_t(t, Of, {
			getCurrentModI: () => g.at(-1),
			popModI() {
				g.pop();
			},
			pushModI(d) {
				g.push(d);
			},
			setHasCasedChar() {
				g.at(-1) ? (i = !0) : (l = !0);
			}
		});
	}
	const a = { dotAll: t.flags.dotAll, ignoreCase: !!((t.flags.ignoreCase || i) && !l) };
	let c = t;
	const u = {
		accuracy: n.accuracy,
		appliedGlobalFlags: a,
		captureMap: new Map(),
		currentFlags: { dotAll: t.flags.dotAll, ignoreCase: t.flags.ignoreCase },
		inCharClass: !1,
		lastNode: c,
		originMap: t._originMap,
		recursionLimit: s,
		useAppliedIgnoreCase: !!(!o && i && l),
		useFlagMods: o,
		useFlagV: r,
		verbose: n.verbose
	};
	function f(g) {
		return (
			(u.lastNode = c),
			(c = g),
			pf(Mf[g.type], `Unexpected node type "${g.type}"`)(g, u, f)
		);
	}
	const p = { pattern: t.body.map(f).join('|'), flags: f(t.flags), options: { ...t.options } };
	return (
		r ||
			(delete p.options.force.v,
			(p.options.disable.v = !0),
			(p.options.unicodeSetsPlugin = null)),
		(p._captureTransfers = new Map()),
		(p._hiddenCaptures = []),
		u.captureMap.forEach((g, d) => {
			(g.hidden && p._hiddenCaptures.push(d),
				g.transferTo && At(p._captureTransfers, g.transferTo, []).push(d));
		}),
		p
	);
}
var Of = {
		'*': {
			enter({ node: t }, e) {
				if (Xo(t)) {
					const n = e.getCurrentModI();
					e.pushModI(t.flags ? on({ ignoreCase: n }, t.flags).ignoreCase : n);
				}
			},
			exit({ node: t }, e) {
				Xo(t) && e.popModI();
			}
		},
		Backreference(t, e) {
			e.setHasCasedChar();
		},
		Character({ node: t }, e) {
			Er(W(t.value)) && e.setHasCasedChar();
		},
		CharacterClassRange({ node: t, skip: e }, n) {
			(e(), li(t, { firstOnly: !0 }).length && n.setHasCasedChar());
		},
		CharacterSet({ node: t }, e) {
			t.kind === 'property' && ti.has(t.value) && e.setHasCasedChar();
		}
	},
	Mf = {
		Alternative({ body: t }, e, n) {
			return t.map(n).join('');
		},
		Assertion({ kind: t, negate: e }) {
			if (t === 'string_end') return '$';
			if (t === 'string_start') return '^';
			if (t === 'word_boundary') return e ? x`\B` : x`\b`;
			throw new Error(`Unexpected assertion kind "${t}"`);
		},
		Backreference({ ref: t }, e) {
			if (typeof t != 'number')
				throw new Error('Unexpected named backref in transformed AST');
			if (
				!e.useFlagMods &&
				e.accuracy === 'strict' &&
				e.currentFlags.ignoreCase &&
				!e.captureMap.get(t).ignoreCase
			)
				throw new Error(
					'Use of case-insensitive backref to case-sensitive group requires target ES2025 or non-strict accuracy'
				);
			return '\\' + t;
		},
		CapturingGroup(t, e, n) {
			const { body: r, name: o, number: s } = t,
				i = { ignoreCase: e.currentFlags.ignoreCase },
				l = e.originMap.get(t);
			return (
				l && ((i.hidden = !0), s > l.number && (i.transferTo = l.number)),
				e.captureMap.set(s, i),
				`(${o ? `?<${o}>` : ''}${r.map(n).join('|')})`
			);
		},
		Character({ value: t }, e) {
			const n = W(t),
				r = Ze(t, {
					escDigit: e.lastNode.type === 'Backreference',
					inCharClass: e.inCharClass,
					useFlagV: e.useFlagV
				});
			if (r !== n) return r;
			if (e.useAppliedIgnoreCase && e.currentFlags.ignoreCase && Er(n)) {
				const o = ei(n);
				return e.inCharClass ? o.join('') : o.length > 1 ? `[${o.join('')}]` : o[0];
			}
			return n;
		},
		CharacterClass(t, e, n) {
			const { kind: r, negate: o, parent: s } = t;
			let { body: i } = t;
			if (r === 'intersection' && !e.useFlagV)
				throw new Error('Use of class intersection requires min target ES2024');
			Ae.bugFlagVLiteralHyphenIsRange &&
				e.useFlagV &&
				i.some(Yo) &&
				(i = [ln(45), ...i.filter((c) => !Yo(c))]);
			const l = () => `[${o ? '^' : ''}${i.map(n).join(r === 'intersection' ? '&&' : '')}]`;
			if (!e.inCharClass) {
				if ((!e.useFlagV || Ae.bugNestedClassIgnoresNegation) && !o) {
					const u = i.filter(
						(f) => f.type === 'CharacterClass' && f.kind === 'union' && f.negate
					);
					if (u.length) {
						const f = pe(),
							p = f.body[0];
						return (
							(f.parent = s),
							(p.parent = f),
							(i = i.filter((g) => !u.includes(g))),
							(t.body = i),
							i.length ? ((t.parent = p), p.body.push(t)) : f.body.pop(),
							u.forEach((g) => {
								const d = Ge({ body: [g] });
								((g.parent = d), (d.parent = f), f.body.push(d));
							}),
							n(f)
						);
					}
				}
				e.inCharClass = !0;
				const c = l();
				return ((e.inCharClass = !1), c);
			}
			const a = i[0];
			if (
				r === 'union' &&
				!o &&
				a &&
				(((!e.useFlagV || !e.verbose) &&
					s.kind === 'union' &&
					!(Ae.bugFlagVLiteralHyphenIsRange && e.useFlagV)) ||
					(!e.verbose &&
						s.kind === 'intersection' &&
						i.length === 1 &&
						a.type !== 'CharacterClassRange'))
			)
				return i.map(n).join('');
			if (!e.useFlagV && s.type === 'CharacterClass')
				throw new Error('Use of nested character class requires min target ES2024');
			return l();
		},
		CharacterClassRange(t, e) {
			const n = t.min.value,
				r = t.max.value,
				o = { escDigit: !1, inCharClass: !0, useFlagV: e.useFlagV },
				s = Ze(n, o),
				i = Ze(r, o),
				l = new Set();
			if (e.useAppliedIgnoreCase && e.currentFlags.ignoreCase) {
				const a = li(t);
				Bf(a).forEach((u) => {
					l.add(Array.isArray(u) ? `${Ze(u[0], o)}-${Ze(u[1], o)}` : Ze(u, o));
				});
			}
			return `${s}-${i}${[...l].join('')}`;
		},
		CharacterSet({ kind: t, negate: e, value: n, key: r }, o) {
			if (t === 'dot')
				return o.currentFlags.dotAll
					? o.appliedGlobalFlags.dotAll || o.useFlagMods
						? '.'
						: '[^]'
					: x`[^\n]`;
			if (t === 'digit') return e ? x`\D` : x`\d`;
			if (t === 'property') {
				if (o.useAppliedIgnoreCase && o.currentFlags.ignoreCase && ti.has(n))
					throw new Error(
						`Unicode property "${n}" can't be case-insensitive when other chars have specific case`
					);
				return `${e ? x`\P` : x`\p`}{${r ? `${r}=` : ''}${n}}`;
			}
			if (t === 'word') return e ? x`\W` : x`\w`;
			throw new Error(`Unexpected character set kind "${t}"`);
		},
		Flags(t, e) {
			return (
				(e.appliedGlobalFlags.ignoreCase ? 'i' : '') +
				(t.dotAll ? 's' : '') +
				(t.sticky ? 'y' : '')
			);
		},
		Group({ atomic: t, body: e, flags: n, parent: r }, o, s) {
			const i = o.currentFlags;
			n && (o.currentFlags = on(i, n));
			const l = e.map(s).join('|'),
				a =
					!o.verbose &&
					e.length === 1 &&
					r.type !== 'Quantifier' &&
					!t &&
					(!o.useFlagMods || !n)
						? l
						: `(?${Uf(t, n, o.useFlagMods)}${l})`;
			return ((o.currentFlags = i), a);
		},
		LookaroundAssertion({ body: t, kind: e, negate: n }, r, o) {
			return `(?${`${e === 'lookahead' ? '' : '<'}${n ? '!' : '='}`}${t.map(o).join('|')})`;
		},
		Quantifier(t, e, n) {
			return n(t.body) + jf(t);
		},
		Subroutine({ isRecursive: t, ref: e }, n) {
			if (!t) throw new Error('Unexpected non-recursive subroutine in transformed AST');
			const r = n.recursionLimit;
			return e === 0 ? `(?R=${r})` : x`\g<${e}&R=${r}>`;
		}
	},
	$f = new Set(['$', '(', ')', '*', '+', '.', '?', '[', '\\', ']', '^', '{', '|', '}']),
	Df = new Set(['-', '\\', ']', '^', '[']),
	Gf = new Set([
		'(',
		')',
		'-',
		'/',
		'[',
		'\\',
		']',
		'^',
		'{',
		'|',
		'}',
		'!',
		'#',
		'$',
		'%',
		'&',
		'*',
		'+',
		',',
		'.',
		':',
		';',
		'<',
		'=',
		'>',
		'?',
		'@',
		'`',
		'~'
	]),
	qo = new Map([
		[9, x`\t`],
		[10, x`\n`],
		[11, x`\v`],
		[12, x`\f`],
		[13, x`\r`],
		[8232, x`\u2028`],
		[8233, x`\u2029`],
		[65279, x`\uFEFF`]
	]),
	Ff = new RegExp('^\\p{Cased}$', 'u');
function Er(t) {
	return Ff.test(t);
}
function li(t, e) {
	const n = !!e?.firstOnly,
		r = t.min.value,
		o = t.max.value,
		s = [];
	if ((r < 65 && (o === 65535 || o >= 131071)) || (r === 65536 && o >= 131071)) return s;
	for (let i = r; i <= o; i++) {
		const l = W(i);
		if (!Er(l)) continue;
		const a = ei(l).filter((c) => {
			const u = c.codePointAt(0);
			return u < r || u > o;
		});
		if (a.length && (s.push(...a), n)) break;
	}
	return s;
}
function Ze(t, { escDigit: e, inCharClass: n, useFlagV: r }) {
	if (qo.has(t)) return qo.get(t);
	if (t < 32 || (t > 126 && t < 160) || t > 262143 || (e && zf(t)))
		return t > 255
			? `\\u{${t.toString(16).toUpperCase()}}`
			: `\\x${t.toString(16).toUpperCase().padStart(2, '0')}`;
	const o = n ? (r ? Gf : Df) : $f,
		s = W(t);
	return (o.has(s) ? '\\' : '') + s;
}
function Bf(t) {
	const e = t.map((o) => o.codePointAt(0)).sort((o, s) => o - s),
		n = [];
	let r = null;
	for (let o = 0; o < e.length; o++)
		e[o + 1] === e[o] + 1
			? (r ??= e[o])
			: r === null
				? n.push(e[o])
				: (n.push([r, e[o]]), (r = null));
	return n;
}
function Uf(t, e, n) {
	if (t) return '>';
	let r = '';
	if (e && n) {
		const { enable: o, disable: s } = e;
		r =
			(o?.ignoreCase ? 'i' : '') +
			(o?.dotAll ? 's' : '') +
			(s ? '-' : '') +
			(s?.ignoreCase ? 'i' : '') +
			(s?.dotAll ? 's' : '');
	}
	return `${r}:`;
}
function jf({ kind: t, max: e, min: n }) {
	let r;
	return (
		!n && e === 1
			? (r = '?')
			: !n && e === 1 / 0
				? (r = '*')
				: n === 1 && e === 1 / 0
					? (r = '+')
					: n === e
						? (r = `{${n}}`)
						: (r = `{${n},${e === 1 / 0 ? '' : e}}`),
		r + { greedy: '', lazy: '?', possessive: '+' }[t]
	);
}
function Xo({ type: t }) {
	return t === 'CapturingGroup' || t === 'Group' || t === 'LookaroundAssertion';
}
function zf(t) {
	return t > 47 && t < 58;
}
function Yo({ type: t, value: e }) {
	return t === 'Character' && e === 45;
}
var Wf = class lr extends RegExp {
	#e = new Map();
	#t = null;
	#r;
	#n = null;
	#o = null;
	rawOptions = {};
	get source() {
		return this.#r || '(?:)';
	}
	constructor(e, n, r) {
		const o = !!r?.lazyCompile;
		if (e instanceof RegExp) {
			if (r) throw new Error('Cannot provide options when copying a regexp');
			const s = e;
			(super(s, n),
				(this.#r = s.source),
				s instanceof lr &&
					((this.#e = s.#e),
					(this.#n = s.#n),
					(this.#o = s.#o),
					(this.rawOptions = s.rawOptions)));
		} else {
			const s = { hiddenCaptures: [], strategy: null, transfers: [], ...r };
			(super(o ? '' : e, n),
				(this.#r = e),
				(this.#e = Vf(s.hiddenCaptures, s.transfers)),
				(this.#o = s.strategy),
				(this.rawOptions = r ?? {}));
		}
		o || (this.#t = this);
	}
	exec(e) {
		if (!this.#t) {
			const { lazyCompile: o, ...s } = this.rawOptions;
			this.#t = new lr(this.#r, this.flags, s);
		}
		const n = this.global || this.sticky,
			r = this.lastIndex;
		if (this.#o === 'clip_search' && n && r) {
			this.lastIndex = 0;
			const o = this.#s(e.slice(r));
			return (o && (Hf(o, r, e, this.hasIndices), (this.lastIndex += r)), o);
		}
		return this.#s(e);
	}
	#s(e) {
		this.#t.lastIndex = this.lastIndex;
		const n = super.exec.call(this.#t, e);
		if (((this.lastIndex = this.#t.lastIndex), !n || !this.#e.size)) return n;
		const r = [...n];
		n.length = 1;
		let o;
		this.hasIndices && ((o = [...n.indices]), (n.indices.length = 1));
		const s = [0];
		for (let i = 1; i < r.length; i++) {
			const { hidden: l, transferTo: a } = this.#e.get(i) ?? {};
			if (
				(l
					? s.push(null)
					: (s.push(n.length), n.push(r[i]), this.hasIndices && n.indices.push(o[i])),
				a && r[i] !== void 0)
			) {
				const c = s[a];
				if (!c) throw new Error(`Invalid capture transfer to "${c}"`);
				if (((n[c] = r[i]), this.hasIndices && (n.indices[c] = o[i]), n.groups)) {
					this.#n || (this.#n = qf(this.source));
					const u = this.#n.get(a);
					u && ((n.groups[u] = r[i]), this.hasIndices && (n.indices.groups[u] = o[i]));
				}
			}
		}
		return n;
	}
};
function Hf(t, e, n, r) {
	if (((t.index += e), (t.input = n), r)) {
		const o = t.indices;
		for (let i = 0; i < o.length; i++) {
			const l = o[i];
			l && (o[i] = [l[0] + e, l[1] + e]);
		}
		const s = o.groups;
		s &&
			Object.keys(s).forEach((i) => {
				const l = s[i];
				l && (s[i] = [l[0] + e, l[1] + e]);
			});
	}
}
function Vf(t, e) {
	const n = new Map();
	for (const r of t) n.set(r, { hidden: !0 });
	for (const [r, o] of e) for (const s of o) At(n, s, {}).transferTo = r;
	return n;
}
function qf(t) {
	const e = /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu,
		n = new Map();
	let r = 0,
		o = 0,
		s;
	for (; (s = e.exec(t)); ) {
		const {
			0: i,
			groups: { capture: l, name: a }
		} = s;
		i === '[' ? r++ : r ? i === ']' && r-- : l && (o++, a && n.set(o, a));
	}
	return n;
}
function Xf(t, e) {
	const n = Yf(t, e);
	return n.options ? new Wf(n.pattern, n.flags, n.options) : new RegExp(n.pattern, n.flags);
}
function Yf(t, e) {
	const n = Js(e),
		r = Hs(t, {
			flags: n.flags,
			normalizeUnknownPropertyNames: !0,
			rules: { captureGroup: n.rules.captureGroup, singleline: n.rules.singleline },
			skipBackrefValidation: n.rules.allowOrphanBackrefs,
			unicodePropertyMap: Sr
		}),
		o = Sf(r, {
			accuracy: n.accuracy,
			asciiWordBoundaries: n.rules.asciiWordBoundaries,
			avoidSubclass: n.avoidSubclass,
			bestEffortTarget: n.target
		}),
		s = Pf(o, n),
		i = ff(s.pattern, {
			captureTransfers: s._captureTransfers,
			hiddenCaptures: s._hiddenCaptures,
			mode: 'external'
		}),
		l = cf(i.pattern),
		a = lf(l.pattern, {
			captureTransfers: i.captureTransfers,
			hiddenCaptures: i.hiddenCaptures
		}),
		c = {
			pattern: a.pattern,
			flags: `${n.hasIndices ? 'd' : ''}${n.global ? 'g' : ''}${s.flags}${s.options.disable.v ? 'u' : 'v'}`
		};
	if (n.avoidSubclass) {
		if (n.lazyCompileLength !== 1 / 0) throw new Error('Lazy compilation requires subclass');
	} else {
		const u = a.hiddenCaptures.sort((d, C) => d - C),
			f = Array.from(a.captureTransfers),
			p = o._strategy,
			g = c.pattern.length >= n.lazyCompileLength;
		(u.length || f.length || p || g) &&
			(c.options = {
				...(u.length && { hiddenCaptures: u }),
				...(f.length && { transfers: f }),
				...(p && { strategy: p }),
				...(g && { lazyCompile: g })
			});
	}
	return c;
}
const Ko = 4294967295;
class Kf {
	constructor(e, n = {}) {
		((this.patterns = e), (this.options = n));
		const { forgiving: r = !1, cache: o, regexConstructor: s } = n;
		if (!s) throw new Error('Option `regexConstructor` is not provided');
		this.regexps = e.map((i) => {
			if (typeof i != 'string') return i;
			const l = o?.get(i);
			if (l) {
				if (l instanceof RegExp) return l;
				if (r) return null;
				throw l;
			}
			try {
				const a = s(i);
				return (o?.set(i, a), a);
			} catch (a) {
				if ((o?.set(i, a), r)) return null;
				throw a;
			}
		});
	}
	regexps;
	findNextMatchSync(e, n, r) {
		const o = typeof e == 'string' ? e : e.content,
			s = [];
		function i(l, a, c = 0) {
			return {
				index: l,
				captureIndices: a.indices.map((u) =>
					u == null
						? { start: Ko, end: Ko, length: 0 }
						: { start: u[0] + c, end: u[1] + c, length: u[1] - u[0] }
				)
			};
		}
		for (let l = 0; l < this.regexps.length; l++) {
			const a = this.regexps[l];
			if (a)
				try {
					a.lastIndex = n;
					const c = a.exec(o);
					if (!c) continue;
					if (c.index === n) return i(l, c, 0);
					s.push([l, c, 0]);
				} catch (c) {
					if (this.options.forgiving) continue;
					throw c;
				}
		}
		if (s.length) {
			const l = Math.min(...s.map((a) => a[1].index));
			for (const [a, c, u] of s) if (c.index === l) return i(a, c, u);
		}
		return null;
	}
}
function Zf(t, e) {
	return Xf(t, {
		global: !0,
		hasIndices: !0,
		lazyCompileLength: 3e3,
		rules: {
			allowOrphanBackrefs: !0,
			asciiWordBoundaries: !0,
			captureGroup: !0,
			recursionLimit: 5,
			singleline: !0
		},
		...e
	});
}
function Qf(t = {}) {
	const e = Object.assign({ target: 'auto', cache: new Map() }, t);
	return (
		(e.regexConstructor ||= (n) => Zf(n, { target: e.target })),
		{
			createScanner(n) {
				return new Kf(n, e);
			},
			createString(n) {
				return { content: n };
			}
		}
	);
}
const Jf = {
		bash: () => Se(() => import('./Yzrsuije.js'), [], import.meta.url),
		diff: () => Se(() => import('./D97Zzqfu.js'), [], import.meta.url),
		javascript: () => Se(() => import('./BMMyXqK5.js'), [], import.meta.url),
		json: () => Se(() => import('./Cp-IABpG.js'), [], import.meta.url),
		svelte: () =>
			Se(() => import('./DsT71iJE.js'), __vite__mapDeps([0, 1, 2]), import.meta.url),
		typescript: () => Se(() => import('./DlfHMoPT.js'), [], import.meta.url),
		yaml: () => Se(() => import('./Buea-lGh.js'), [], import.meta.url)
	},
	ch = fu({
		themes: [
			Se(() => import('./D7oLnXFd.js'), [], import.meta.url),
			Se(() => import('./Cuk6v7N8.js'), [], import.meta.url)
		],
		langs: Object.entries(Jf).map(([t, e]) => e),
		engine: Qf()
	}),
	uh = ta({
		base: 'not-prose relative h-full overflow-auto rounded-lg border',
		variants: {
			variant: {
				default: 'border-border bg-card',
				secondary: 'bg-secondary/50 border-transparent'
			}
		}
	});
var eh = Zo('<div class="mdsx"><!></div>');
function fh(t, e) {
	var n = eh(),
		r = Qo(n);
	(Jo(r, () => e.children ?? es), ts(n), ns(t, n));
}
export { fh as B, ih as D, sh as P, le as b, uh as c, ch as h };
