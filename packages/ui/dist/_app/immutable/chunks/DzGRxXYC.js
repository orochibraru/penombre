import {
	V as P,
	aI as m,
	aJ as T,
	e as D,
	a3 as V,
	at as x,
	az as G,
	a5 as J,
	h as v,
	N as H,
	L as K,
	aK as Q,
	C as A,
	aL as j,
	j as M,
	_ as g,
	s as L,
	i as _,
	n as W,
	aM as O,
	H as N,
	d as U,
	aN as X,
	k as Z,
	aO as ee,
	aP as te,
	aQ as re,
	aR as ae,
	O as ne,
	p as oe,
	w as ie,
	l as se,
	b as ue
} from './BW6z9EX9.js';
function Ee(e) {
	return e.endsWith('capture') && e !== 'gotpointercapture' && e !== 'lostpointercapture';
}
const le = [
	'beforeinput',
	'click',
	'change',
	'dblclick',
	'contextmenu',
	'focusin',
	'focusout',
	'input',
	'keydown',
	'keyup',
	'mousedown',
	'mousemove',
	'mouseout',
	'mouseover',
	'mouseup',
	'pointerdown',
	'pointermove',
	'pointerout',
	'pointerover',
	'pointerup',
	'touchend',
	'touchmove',
	'touchstart'
];
function ge(e) {
	return le.includes(e);
}
const ce = {
	formnovalidate: 'formNoValidate',
	ismap: 'isMap',
	nomodule: 'noModule',
	playsinline: 'playsInline',
	readonly: 'readOnly',
	defaultvalue: 'defaultValue',
	defaultchecked: 'defaultChecked',
	srcobject: 'srcObject',
	novalidate: 'noValidate',
	allowfullscreen: 'allowFullscreen',
	disablepictureinpicture: 'disablePictureInPicture',
	disableremoteplayback: 'disableRemotePlayback'
};
function we(e) {
	return ((e = e.toLowerCase()), ce[e] ?? e);
}
const fe = ['touchstart', 'touchmove'];
function de(e) {
	return fe.includes(e);
}
const _e = ['textarea', 'script', 'style', 'title'];
function be(e) {
	return _e.includes(e);
}
function me(e, t) {
	if (t) {
		const r = document.body;
		((e.autofocus = !0),
			P(() => {
				document.activeElement === r && e.focus();
			}));
	}
}
let I = !1;
function ve() {
	I ||
		((I = !0),
		document.addEventListener(
			'reset',
			(e) => {
				Promise.resolve().then(() => {
					if (!e.defaultPrevented) for (const t of e.target.elements) t.__on_r?.();
				});
			},
			{ capture: !0 }
		));
}
function Te(e, t, r, n = !0) {
	n && r();
	for (var o of t) e.addEventListener(o, r);
	x(() => {
		for (var a of t) e.removeEventListener(a, r);
	});
}
function q(e) {
	var t = V,
		r = D;
	(m(null), T(null));
	try {
		return e();
	} finally {
		(m(t), T(r));
	}
}
function Le(e, t, r, n = r) {
	e.addEventListener(t, () => q(r));
	const o = e.__on_r;
	(o
		? (e.__on_r = () => {
				(o(), n(!0));
			})
		: (e.__on_r = () => n(!0)),
		ve());
}
const B = new Set(),
	S = new Set();
function ke(e) {
	if (!v) return;
	(e.removeAttribute('onload'), e.removeAttribute('onerror'));
	const t = e.__e;
	t !== void 0 &&
		((e.__e = void 0),
		queueMicrotask(() => {
			e.isConnected && e.dispatchEvent(t);
		}));
}
function F(e, t, r, n = {}) {
	function o(a) {
		if ((n.capture || w.call(t, a), !a.cancelBubble)) return q(() => r?.call(this, a));
	}
	return (
		e.startsWith('pointer') || e.startsWith('touch') || e === 'wheel'
			? P(() => {
					t.addEventListener(e, o, n);
				})
			: t.addEventListener(e, o, n),
		o
	);
}
function Ne(e, t, r, n = {}) {
	var o = F(t, e, r, n);
	return () => {
		e.removeEventListener(t, o, n);
	};
}
function Ae(e, t, r, n, o) {
	var a = { capture: n, passive: o },
		l = F(e, t, r, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) &&
		x(() => {
			t.removeEventListener(e, l, a);
		});
}
function Me(e) {
	for (var t = 0; t < e.length; t++) B.add(e[t]);
	for (var r of S) r(e);
}
function w(e) {
	var t = this,
		r = t.ownerDocument,
		n = e.type,
		o = e.composedPath?.() || [],
		a = o[0] || e.target,
		l = 0,
		h = e.__root;
	if (h) {
		var f = o.indexOf(h);
		if (f !== -1 && (t === document || t === window)) {
			e.__root = t;
			return;
		}
		var p = o.indexOf(t);
		if (p === -1) return;
		f <= p && (l = f);
	}
	if (((a = o[l] || e.target), a !== t)) {
		G(e, 'currentTarget', {
			configurable: !0,
			get() {
				return a || r;
			}
		});
		var k = V,
			c = D;
		(m(null), T(null));
		try {
			for (var i, s = []; a !== null; ) {
				var y = a.assignedSlot || a.parentNode || a.host || null;
				try {
					var d = a['__' + n];
					if (d != null && (!a.disabled || e.target === a))
						if (J(d)) {
							var [z, ...$] = d;
							z.apply(a, [e, ...$]);
						} else d.call(a, e);
				} catch (b) {
					i ? s.push(b) : (i = b);
				}
				if (e.cancelBubble || y === t || y === null) break;
				a = y;
			}
			if (i) {
				for (let b of s)
					queueMicrotask(() => {
						throw b;
					});
				throw i;
			}
		} finally {
			((e.__root = t), delete e.currentTarget, m(k), T(c));
		}
	}
}
let u;
function he() {
	u = void 0;
}
function Oe(e) {
	let t = null,
		r = v;
	var n;
	if (v) {
		for (
			t = _, u === void 0 && (u = W(document.head));
			u !== null && (u.nodeType !== A || u.data !== j);

		)
			u = M(u);
		u === null ? g(!1) : (u = L(M(u)));
	}
	v || (n = document.head.appendChild(H()));
	try {
		K(() => e(n), Q);
	} finally {
		r && (g(!0), (u = _), L(t));
	}
}
let R = !0;
function Se(e) {
	R = e;
}
function Re(e, t) {
	var r = t == null ? '' : typeof t == 'object' ? t + '' : t;
	r !== (e.__t ??= e.nodeValue) && ((e.__t = r), (e.nodeValue = r + ''));
}
function pe(e, t) {
	return Y(e, t);
}
function Ce(e, t) {
	(O(), (t.intro = t.intro ?? !1));
	const r = t.target,
		n = v,
		o = _;
	try {
		for (var a = W(r); a && (a.nodeType !== A || a.data !== j); ) a = M(a);
		if (!a) throw N;
		(g(!0), L(a), U());
		const l = Y(e, { ...t, anchor: a });
		if (_ === null || _.nodeType !== A || _.data !== X) throw (Z(), N);
		return (g(!1), l);
	} catch (l) {
		if (l === N) return (t.recover === !1 && ee(), O(), te(r), g(!1), pe(e, t));
		throw l;
	} finally {
		(g(n), L(o), he());
	}
}
const E = new Map();
function Y(e, { target: t, anchor: r, props: n = {}, events: o, context: a, intro: l = !0 }) {
	O();
	var h = new Set(),
		f = (c) => {
			for (var i = 0; i < c.length; i++) {
				var s = c[i];
				if (!h.has(s)) {
					h.add(s);
					var y = de(s);
					t.addEventListener(s, w, { passive: y });
					var d = E.get(s);
					d === void 0
						? (document.addEventListener(s, w, { passive: y }), E.set(s, 1))
						: E.set(s, d + 1);
				}
			}
		};
	(f(re(B)), S.add(f));
	var p = void 0,
		k = ae(() => {
			var c = r ?? t.appendChild(H());
			return (
				ne(() => {
					if (a) {
						oe({});
						var i = ie;
						i.c = a;
					}
					(o && (n.$$events = o),
						v && se(c, null),
						(R = l),
						(p = e(c, n) || {}),
						(R = !0),
						v && (D.nodes_end = _),
						a && ue());
				}),
				() => {
					for (var i of h) {
						t.removeEventListener(i, w);
						var s = E.get(i);
						--s === 0 ? (document.removeEventListener(i, w), E.delete(i)) : E.set(i, s);
					}
					(S.delete(f), c !== r && c.parentNode?.removeChild(c));
				}
			);
		});
	return (C.set(p, k), p);
}
let C = new WeakMap();
function De(e, t) {
	const r = C.get(e);
	return r ? (C.delete(e), r(t)) : Promise.resolve();
}
export {
	Se as a,
	R as b,
	Ee as c,
	F as d,
	Me as e,
	me as f,
	ve as g,
	Ce as h,
	be as i,
	ge as j,
	Oe as k,
	Le as l,
	pe as m,
	we as n,
	Ne as o,
	Ae as p,
	Te as q,
	ke as r,
	Re as s,
	De as u,
	q as w
};
