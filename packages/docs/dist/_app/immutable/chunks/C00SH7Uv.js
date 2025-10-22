import {
	y as I,
	ay as Ue,
	az as Xn,
	x as h,
	C as S,
	aA as Ft,
	av as dn,
	am as Q,
	N as rt,
	A as O,
	an as Mt,
	p as W,
	k as m,
	h as R,
	a as F,
	w as st,
	b as T,
	c as V,
	u as k,
	f as xt,
	o as Nt,
	d as Bt,
	v as z,
	r as Lt,
	q as ht,
	aB as jn,
	aC as Zn,
	aD as Gn,
	aE as Jn,
	aF as Qn,
	aj as le,
	P as $n,
	Z as yt,
	s as he
} from './ZGPguNnN.js';
import {
	D as re,
	a as w,
	F as tr,
	q as xe,
	w as tt,
	C as _t,
	k as ut,
	S as fn,
	o as hn,
	p as er,
	n as nr,
	m as rr,
	r as Wt,
	u as $,
	G as ir,
	s as L,
	v as Yt,
	x as or,
	I as sr,
	y as lt,
	J as ar,
	j as Ye,
	K as qe,
	P as Se,
	b as cr,
	L as lr,
	M as ur,
	N as dr
} from './L9BR-Aao.js';
import {
	i as fr,
	s as hr,
	c as gr,
	g as pr,
	a as mr,
	t as vr,
	h as wr,
	b as yr
} from './CCs0m0T5.js';
class br extends Map {
	#t = new Map();
	#e = I(0);
	#n = I(0);
	#r = Ue || -1;
	constructor(t) {
		if ((super(), t)) {
			for (var [n, r] of t) super.set(n, r);
			this.#n.v = super.size;
		}
	}
	#i(t) {
		return Ue === this.#r ? I(t) : Xn(t);
	}
	has(t) {
		var n = this.#t,
			r = n.get(t);
		if (r === void 0) {
			var i = super.get(t);
			if (i !== void 0) ((r = this.#i(0)), n.set(t, r));
			else return (h(this.#e), !1);
		}
		return (h(r), !0);
	}
	forEach(t, n) {
		(this.#o(), super.forEach(t, n));
	}
	get(t) {
		var n = this.#t,
			r = n.get(t);
		if (r === void 0) {
			var i = super.get(t);
			if (i !== void 0) ((r = this.#i(0)), n.set(t, r));
			else {
				h(this.#e);
				return;
			}
		}
		return (h(r), super.get(t));
	}
	set(t, n) {
		var r = this.#t,
			i = r.get(t),
			s = super.get(t),
			o = super.set(t, n),
			a = this.#e;
		if (i === void 0) ((i = this.#i(0)), r.set(t, i), S(this.#n, super.size), Ft(a));
		else if (s !== n) {
			Ft(i);
			var c = a.reactions === null ? null : new Set(a.reactions),
				l = c === null || !i.reactions?.every((g) => c.has(g));
			l && Ft(a);
		}
		return o;
	}
	delete(t) {
		var n = this.#t,
			r = n.get(t),
			i = super.delete(t);
		return (r !== void 0 && (n.delete(t), S(this.#n, super.size), S(r, -1), Ft(this.#e)), i);
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var t = this.#t;
			S(this.#n, 0);
			for (var n of t.values()) S(n, -1);
			(Ft(this.#e), t.clear());
		}
	}
	#o() {
		h(this.#e);
		var t = this.#t;
		if (this.#n.v !== t.size) {
			for (var n of super.keys())
				if (!t.has(n)) {
					var r = this.#i(0);
					t.set(n, r);
				}
		}
		for ([, r] of this.#t) h(r);
	}
	keys() {
		return (h(this.#e), super.keys());
	}
	values() {
		return (this.#o(), super.values());
	}
	entries() {
		return (this.#o(), super.entries());
	}
	[Symbol.iterator]() {
		return this.entries();
	}
	get size() {
		return (h(this.#n), super.size);
	}
}
class xr {
	#t;
	#e;
	constructor(t, n) {
		((this.#t = t), (this.#e = dn(n)));
	}
	get current() {
		return (this.#e(), this.#t());
	}
}
const Sr = /\(.+\)/,
	Or = new Set(['all', 'print', 'screen', 'and', 'or', 'not', 'only']);
class Ko extends xr {
	constructor(t, n) {
		let r = Sr.test(t) || t.split(/[\s,]+/).some((s) => Or.has(s.trim())) ? t : `(${t})`;
		const i = window.matchMedia(r);
		super(
			() => i.matches,
			(s) => Q(i, 'change', s)
		);
	}
}
function Vt(e) {
	rt(() => () => {
		e();
	});
}
function Ar(e, t) {
	return setTimeout(t, e);
}
const Pr = 1,
	Cr = 9,
	Er = 11;
function ge(e) {
	return re(e) && e.nodeType === Pr && typeof e.nodeName == 'string';
}
function gn(e) {
	return re(e) && e.nodeType === Cr;
}
function Tr(e) {
	return re(e) && e.constructor?.name === 'VisualViewport';
}
function Fr(e) {
	return re(e) && e.nodeType !== void 0;
}
function pn(e) {
	return Fr(e) && e.nodeType === Er && 'host' in e;
}
function Dr(e, t) {
	if (!e || !t || !ge(e) || !ge(t)) return !1;
	const n = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (n && pn(n)) {
		let r = t;
		for (; r; ) {
			if (e === r) return !0;
			r = r.parentNode || r.host;
		}
	}
	return !1;
}
function Rr(e) {
	return gn(e) ? e : Tr(e) ? e.document : (e?.ownerDocument ?? document);
}
function mn(e) {
	return pn(e)
		? mn(e.host)
		: gn(e)
			? (e.defaultView ?? window)
			: ge(e)
				? (e.ownerDocument?.defaultView ?? window)
				: window;
}
function Ir(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot; ) {
		const n = t.shadowRoot.activeElement;
		if (n === t) break;
		t = n;
	}
	return t;
}
class vn {
	element;
	#t = O(() =>
		this.element.current ? (this.element.current.getRootNode() ?? document) : document
	);
	get root() {
		return h(this.#t);
	}
	set root(t) {
		S(this.#t, t);
	}
	constructor(t) {
		typeof t == 'function' ? (this.element = w(t)) : (this.element = t);
	}
	getDocument = () => Rr(this.root);
	getWindow = () => this.getDocument().defaultView ?? window;
	getActiveElement = () => Ir(this.root);
	isActiveElement = (t) => t === this.getActiveElement();
	getElementById(t) {
		return this.root.getElementById(t);
	}
	querySelector = (t) => (this.root ? this.root.querySelector(t) : null);
	querySelectorAll = (t) => (this.root ? this.root.querySelectorAll(t) : []);
	setTimeout = (t, n) => this.getWindow().setTimeout(t, n);
	clearTimeout = (t) => this.getWindow().clearTimeout(t);
}
function kr(e) {
	return typeof e == 'function';
}
function Xe(e) {
	return kr(e) ? e() : e;
}
class Mr {
	#t = { width: 0, height: 0 };
	#e = !1;
	#n;
	#r;
	#i;
	#o = O(() => (h(this.#s)?.(), this.getSize().width));
	#a = O(() => (h(this.#s)?.(), this.getSize().height));
	#s = O(() => {
		const t = Xe(this.#r);
		if (t)
			return dn((n) => {
				if (!this.#i) return;
				const r = new this.#i.ResizeObserver((i) => {
					this.#e = !0;
					for (const s of i) {
						const o =
								this.#n.box === 'content-box' ? s.contentBoxSize : s.borderBoxSize,
							a = Array.isArray(o) ? o : [o];
						((this.#t.width = a.reduce((c, l) => Math.max(c, l.inlineSize), 0)),
							(this.#t.height = a.reduce((c, l) => Math.max(c, l.blockSize), 0)));
					}
					n();
				});
				return (
					r.observe(t),
					() => {
						((this.#e = !1), r.disconnect());
					}
				);
			});
	});
	constructor(t, n = { box: 'border-box' }) {
		((this.#i = n.window ?? tr),
			(this.#n = n),
			(this.#r = t),
			(this.#t = { width: 0, height: 0 }));
	}
	calculateSize() {
		const t = Xe(this.#r);
		if (!t || !this.#i) return;
		const n = t.offsetWidth,
			r = t.offsetHeight;
		if (this.#n.box === 'border-box') return { width: n, height: r };
		const i = this.#i.getComputedStyle(t),
			s = parseFloat(i.paddingLeft) + parseFloat(i.paddingRight),
			o = parseFloat(i.paddingTop) + parseFloat(i.paddingBottom),
			a = parseFloat(i.borderLeftWidth) + parseFloat(i.borderRightWidth),
			c = parseFloat(i.borderTopWidth) + parseFloat(i.borderBottomWidth),
			l = n - s - a,
			g = r - o - c;
		return { width: l, height: g };
	}
	getSize() {
		return this.#e ? this.#t : (this.calculateSize() ?? this.#t);
	}
	get current() {
		return (h(this.#s)?.(), this.getSize());
	}
	get width() {
		return h(this.#o);
	}
	get height() {
		return h(this.#a);
	}
}
class Nr {
	#t;
	#e = void 0;
	#n = !1;
	constructor(t) {
		((this.#t = t), Vt(() => this.#r()));
	}
	#r() {
		(this.#e && (window.cancelAnimationFrame(this.#e), (this.#e = void 0)), (this.#n = !1));
	}
	run(t) {
		if (this.#n) return;
		(this.#r(), (this.#n = !0));
		const n = this.#t.ref.current;
		if (!n) {
			this.#n = !1;
			return;
		}
		if (typeof n.getAnimations != 'function') {
			this.#i(t);
			return;
		}
		this.#e = window.requestAnimationFrame(() => {
			const r = n.getAnimations();
			if (r.length === 0) {
				this.#i(t);
				return;
			}
			Promise.allSettled(r.map((i) => i.finished)).then(() => {
				this.#i(t);
			});
		});
	}
	#i(t) {
		const n = () => {
			(t(), (this.#n = !1));
		};
		this.#t.afterTick ? xe(n) : n();
	}
}
class Br {
	#t;
	#e;
	#n;
	constructor(t) {
		((this.#t = t),
			(this.#e = t.enabled ?? !0),
			(this.#n = new Nr({ ref: this.#t.ref, afterTick: this.#t.open })),
			tt([() => this.#t.open.current], ([n]) => {
				this.#e &&
					this.#n.run(() => {
						n === this.#t.open.current && this.#t.onComplete();
					});
			}));
	}
}
const Lr = nr({
		component: 'dialog',
		parts: [
			'content',
			'trigger',
			'overlay',
			'title',
			'description',
			'close',
			'cancel',
			'action'
		]
	}),
	St = new _t('Dialog.Root | AlertDialog.Root');
class Oe {
	static create(t) {
		return St.set(new Oe(t));
	}
	opts;
	#t = I(null);
	get triggerNode() {
		return h(this.#t);
	}
	set triggerNode(t) {
		S(this.#t, t, !0);
	}
	#e = I(null);
	get contentNode() {
		return h(this.#e);
	}
	set contentNode(t) {
		S(this.#e, t, !0);
	}
	#n = I(null);
	get descriptionNode() {
		return h(this.#n);
	}
	set descriptionNode(t) {
		S(this.#n, t, !0);
	}
	#r = I(void 0);
	get contentId() {
		return h(this.#r);
	}
	set contentId(t) {
		S(this.#r, t, !0);
	}
	#i = I(void 0);
	get titleId() {
		return h(this.#i);
	}
	set titleId(t) {
		S(this.#i, t, !0);
	}
	#o = I(void 0);
	get triggerId() {
		return h(this.#o);
	}
	set triggerId(t) {
		S(this.#o, t, !0);
	}
	#a = I(void 0);
	get descriptionId() {
		return h(this.#a);
	}
	set descriptionId(t) {
		S(this.#a, t, !0);
	}
	#s = I(null);
	get cancelNode() {
		return h(this.#s);
	}
	set cancelNode(t) {
		S(this.#s, t, !0);
	}
	constructor(t) {
		((this.opts = t),
			(this.handleOpen = this.handleOpen.bind(this)),
			(this.handleClose = this.handleClose.bind(this)),
			new Br({
				ref: w(() => this.contentNode),
				open: this.opts.open,
				enabled: !0,
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}));
	}
	handleOpen() {
		this.opts.open.current || (this.opts.open.current = !0);
	}
	handleClose() {
		this.opts.open.current && (this.opts.open.current = !1);
	}
	getBitsAttr = (t) => Lr.getAttr(t, this.opts.variant.current);
	#c = O(() => ({ 'data-state': rr(this.opts.open.current) }));
	get sharedProps() {
		return h(this.#c);
	}
	set sharedProps(t) {
		S(this.#c, t);
	}
}
class wn {
	static create(t) {
		return new wn(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = ut(this.opts.ref, (r) => {
				((this.root.triggerNode = r), (this.root.triggerId = r?.id));
			})),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(t) {
		this.opts.disabled.current || t.button > 0 || this.root.handleOpen();
	}
	onkeydown(t) {
		this.opts.disabled.current ||
			((t.key === fn || t.key === hn) && (t.preventDefault(), this.root.handleOpen()));
	}
	#t = O(() => ({
		id: this.opts.id.current,
		'aria-haspopup': 'dialog',
		'aria-expanded': er(this.root.opts.open.current),
		'aria-controls': this.root.contentId,
		[this.root.getBitsAttr('trigger')]: '',
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		disabled: this.opts.disabled.current ? !0 : void 0,
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#t);
	}
	set props(t) {
		S(this.#t, t);
	}
}
class Ae {
	static create(t) {
		return new Ae(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = ut(this.opts.ref)),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(t) {
		this.opts.disabled.current || t.button > 0 || this.root.handleClose();
	}
	onkeydown(t) {
		this.opts.disabled.current ||
			((t.key === fn || t.key === hn) && (t.preventDefault(), this.root.handleClose()));
	}
	#t = O(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr(this.opts.variant.current)]: '',
		onclick: this.onclick,
		onkeydown: this.onkeydown,
		disabled: this.opts.disabled.current ? !0 : void 0,
		tabindex: 0,
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#t);
	}
	set props(t) {
		S(this.#t, t);
	}
}
class Pe {
	static create(t) {
		return new Pe(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.root.titleId = this.opts.id.current),
			(this.attachment = ut(this.opts.ref)),
			tt.pre(
				() => this.opts.id.current,
				(r) => {
					this.root.titleId = r;
				}
			));
	}
	#t = O(() => ({
		id: this.opts.id.current,
		role: 'heading',
		'aria-level': this.opts.level.current,
		[this.root.getBitsAttr('title')]: '',
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#t);
	}
	set props(t) {
		S(this.#t, t);
	}
}
class Ce {
	static create(t) {
		return new Ce(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.root.descriptionId = this.opts.id.current),
			(this.attachment = ut(this.opts.ref, (r) => {
				this.root.descriptionNode = r;
			})),
			tt.pre(
				() => this.opts.id.current,
				(r) => {
					this.root.descriptionId = r;
				}
			));
	}
	#t = O(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('description')]: '',
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#t);
	}
	set props(t) {
		S(this.#t, t);
	}
}
class Ee {
	static create(t) {
		return new Ee(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = ut(this.opts.ref, (r) => {
				((this.root.contentNode = r), (this.root.contentId = r?.id));
			})));
	}
	#t = O(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return h(this.#t);
	}
	set snippetProps(t) {
		S(this.#t, t);
	}
	#e = O(() => ({
		id: this.opts.id.current,
		role: this.root.opts.variant.current === 'alert-dialog' ? 'alertdialog' : 'dialog',
		'aria-modal': 'true',
		'aria-describedby': this.root.descriptionId,
		'aria-labelledby': this.root.titleId,
		[this.root.getBitsAttr('content')]: '',
		style: {
			pointerEvents: 'auto',
			outline: this.root.opts.variant.current === 'alert-dialog' ? 'none' : void 0
		},
		tabindex: this.root.opts.variant.current === 'alert-dialog' ? -1 : void 0,
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#e);
	}
	set props(t) {
		S(this.#e, t);
	}
}
class Te {
	static create(t) {
		return new Te(t, St.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t), (this.root = n), (this.attachment = ut(this.opts.ref)));
	}
	#t = O(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return h(this.#t);
	}
	set snippetProps(t) {
		S(this.#t, t);
	}
	#e = O(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('overlay')]: '',
		style: { pointerEvents: 'auto' },
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return h(this.#e);
	}
	set props(t) {
		S(this.#e, t);
	}
}
var _r = xt('<div><!></div>');
function Uo(e, t) {
	const n = Mt();
	W(t, !0);
	let r = m(t, 'id', 19, () => Wt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'level', 3, 2),
		o = ht(t, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'child', 'children', 'level']);
	const a = Pe.create({
			id: w(() => r()),
			level: w(() => s()),
			ref: w(
				() => i(),
				(d) => i(d)
			)
		}),
		c = O(() => $(o, a.props));
	var l = R(),
		g = F(l);
	{
		var u = (d) => {
				var f = R(),
					v = F(f);
				(k(
					v,
					() => t.child,
					() => ({ props: h(c) })
				),
					T(d, f));
			},
			p = (d) => {
				var f = _r();
				Nt(f, () => ({ ...h(c) }));
				var v = Bt(f);
				(k(v, () => t.children ?? z), Lt(f), T(d, f));
			};
		st(g, (d) => {
			t.child ? d(u) : d(p, !1);
		});
	}
	(T(e, l), V());
}
function Wr(e, t) {
	var n = R(),
		r = F(n);
	(jn(
		r,
		() => t.children,
		(i) => {
			var s = R(),
				o = F(s);
			(k(o, () => t.children ?? z), T(i, s));
		}
	),
		T(e, n));
}
const Vr = new _t('BitsConfig');
function zr() {
	const e = new Hr(null, {});
	return Vr.getOr(e).opts;
}
class Hr {
	opts;
	constructor(t, n) {
		const r = Kr(t, n);
		this.opts = {
			defaultPortalTo: r((i) => i.defaultPortalTo),
			defaultLocale: r((i) => i.defaultLocale)
		};
	}
}
function Kr(e, t) {
	return (n) =>
		w(() => {
			const i = n(t)?.current;
			if (i !== void 0) return i;
			if (e !== null) return n(e.opts)?.current;
		});
}
function Ur(e, t) {
	return (n) => {
		const r = zr();
		return w(() => {
			const i = n();
			if (i !== void 0) return i;
			const s = e(r).current;
			return s !== void 0 ? s : t;
		});
	};
}
const Yr = Ur((e) => e.defaultPortalTo, 'body');
function Yo(e, t) {
	W(t, !0);
	const n = Yr(() => t.to),
		r = Zn();
	let i = O(s);
	function s() {
		if (!ir || t.disabled) return null;
		let u = null;
		return (
			typeof n.current == 'string'
				? (u = document.querySelector(n.current))
				: (u = n.current),
			u
		);
	}
	let o;
	function a() {
		o && (Jn(o), (o = null));
	}
	tt([() => h(i), () => t.disabled], ([u, p]) => {
		if (!u || p) {
			a();
			return;
		}
		return (
			(o = Gn(Wr, { target: u, props: { children: t.children }, context: r })),
			() => {
				a();
			}
		);
	});
	var c = R(),
		l = F(c);
	{
		var g = (u) => {
			var p = R(),
				d = F(p);
			(k(d, () => t.children ?? z), T(u, p));
		};
		st(l, (u) => {
			t.disabled && u(g);
		});
	}
	(T(e, c), V());
}
function je(e, t = 500) {
	let n = null;
	const r = (...i) => {
		(n !== null && clearTimeout(n),
			(n = setTimeout(() => {
				e(...i);
			}, t)));
	};
	return (
		(r.destroy = () => {
			n !== null && (clearTimeout(n), (n = null));
		}),
		r
	);
}
function yn(e, t) {
	return e === t || e.contains(t);
}
function bn(e) {
	return e?.ownerDocument ?? document;
}
function qo(e) {
	if (!e) return null;
	for (const t of e.childNodes) if (t.nodeType !== Node.COMMENT_NODE) return t;
	return null;
}
function qr(e, t) {
	const { clientX: n, clientY: r } = e,
		i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
globalThis.bitsDismissableLayers ??= new Map();
class Fe {
	static create(t) {
		return new Fe(t);
	}
	opts;
	#t;
	#e;
	#n = { pointerdown: !1 };
	#r = !1;
	#i = !1;
	#o = void 0;
	#a;
	#s = L;
	constructor(t) {
		((this.opts = t),
			(this.#e = t.interactOutsideBehavior),
			(this.#t = t.onInteractOutside),
			(this.#a = t.onFocusOutside),
			rt(() => {
				this.#o = bn(this.opts.ref.current);
			}));
		let n = L;
		const r = () => {
			(this.#f(), globalThis.bitsDismissableLayers.delete(this), this.#l.destroy(), n());
		};
		(tt([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (!(!this.opts.enabled.current || !this.opts.ref.current))
				return (
					Ar(1, () => {
						this.opts.ref.current &&
							(globalThis.bitsDismissableLayers.set(this, this.#e),
							n(),
							(n = this.#d()));
					}),
					r
				);
		}),
			Vt(() => {
				(this.#f.destroy(),
					globalThis.bitsDismissableLayers.delete(this),
					this.#l.destroy(),
					this.#s(),
					n());
			}));
	}
	#c = (t) => {
		t.defaultPrevented ||
			(this.opts.ref.current &&
				xe(() => {
					!this.opts.ref.current ||
						this.#m(t.target) ||
						(t.target && !this.#i && this.#a.current?.(t));
				}));
	};
	#d() {
		return Yt(
			Q(this.#o, 'pointerdown', Yt(this.#h, this.#p), { capture: !0 }),
			Q(this.#o, 'pointerdown', Yt(this.#g, this.#l)),
			Q(this.#o, 'focusin', this.#c)
		);
	}
	#u = (t) => {
		let n = t;
		(n.defaultPrevented && (n = Ze(t)), this.#t.current(t));
	};
	#l = je((t) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		const n =
			this.opts.isValidEvent.current(t, this.opts.ref.current) ||
			Zr(t, this.opts.ref.current);
		if (!this.#r || this.#v() || !n) {
			this.#s();
			return;
		}
		let r = t;
		if (
			(r.defaultPrevented && (r = Ze(r)),
			this.#e.current !== 'close' && this.#e.current !== 'defer-otherwise-close')
		) {
			this.#s();
			return;
		}
		t.pointerType === 'touch'
			? (this.#s(), (this.#s = Q(this.#o, 'click', this.#u, { once: !0 })))
			: this.#t.current(r);
	}, 10);
	#h = (t) => {
		this.#n[t.type] = !0;
	};
	#g = (t) => {
		this.#n[t.type] = !1;
	};
	#p = () => {
		this.opts.ref.current && (this.#r = jr(this.opts.ref.current));
	};
	#m = (t) => (this.opts.ref.current ? yn(this.opts.ref.current, t) : !1);
	#f = je(() => {
		for (const t in this.#n) this.#n[t] = !1;
		this.#r = !1;
	}, 20);
	#v() {
		return Object.values(this.#n).some(Boolean);
	}
	#w = () => {
		this.#i = !0;
	};
	#y = () => {
		this.#i = !1;
	};
	props = { onfocuscapture: this.#w, onblurcapture: this.#y };
}
function Xr(e = [...globalThis.bitsDismissableLayers]) {
	return e.findLast(([t, { current: n }]) => n === 'close' || n === 'ignore');
}
function jr(e) {
	const t = [...globalThis.bitsDismissableLayers],
		n = Xr(t);
	if (n) return n[0].opts.ref.current === e;
	const [r] = t[0];
	return r.opts.ref.current === e;
}
function Zr(e, t) {
	if ('button' in e && e.button > 0) return !1;
	const n = e.target;
	return or(n) ? bn(n).documentElement.contains(n) && !yn(t, n) && qr(e, t) : !1;
}
function Ze(e) {
	const t = e.currentTarget,
		n = e.target;
	let r;
	e instanceof PointerEvent
		? (r = new PointerEvent(e.type, e))
		: (r = new PointerEvent('pointerdown', e));
	let i = !1;
	return new Proxy(r, {
		get: (o, a) =>
			a === 'currentTarget'
				? t
				: a === 'target'
					? n
					: a === 'preventDefault'
						? () => {
								((i = !0),
									typeof o.preventDefault == 'function' && o.preventDefault());
							}
						: a === 'defaultPrevented'
							? i
							: a in o
								? o[a]
								: e[a]
	});
}
function xn(e, t) {
	W(t, !0);
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'onInteractOutside', 3, L),
		i = m(t, 'onFocusOutside', 3, L),
		s = m(t, 'isValidEvent', 3, () => !1);
	const o = Fe.create({
		id: w(() => t.id),
		interactOutsideBehavior: w(() => n()),
		onInteractOutside: w(() => r()),
		enabled: w(() => t.enabled),
		onFocusOutside: w(() => i()),
		isValidEvent: w(() => s()),
		ref: t.ref
	});
	var a = R(),
		c = F(a);
	(k(
		c,
		() => t.children ?? z,
		() => ({ props: o.props })
	),
		T(e, a),
		V());
}
globalThis.bitsEscapeLayers ??= new Map();
class De {
	static create(t) {
		return new De(t);
	}
	opts;
	domContext;
	constructor(t) {
		((this.opts = t), (this.domContext = new vn(this.opts.ref)));
		let n = L;
		tt(
			() => t.enabled.current,
			(r) => (
				r &&
					(globalThis.bitsEscapeLayers.set(this, t.escapeKeydownBehavior),
					(n = this.#t())),
				() => {
					(n(), globalThis.bitsEscapeLayers.delete(this));
				}
			)
		);
	}
	#t = () => Q(this.domContext.getDocument(), 'keydown', this.#e, { passive: !1 });
	#e = (t) => {
		if (t.key !== sr || !Gr(this)) return;
		const n = new KeyboardEvent(t.type, t);
		t.preventDefault();
		const r = this.opts.escapeKeydownBehavior.current;
		(r !== 'close' && r !== 'defer-otherwise-close') || this.opts.onEscapeKeydown.current(n);
	};
}
function Gr(e) {
	const t = [...globalThis.bitsEscapeLayers],
		n = t.findLast(([i, { current: s }]) => s === 'close' || s === 'ignore');
	if (n) return n[0] === e;
	const [r] = t[0];
	return r === e;
}
function Sn(e, t) {
	W(t, !0);
	let n = m(t, 'escapeKeydownBehavior', 3, 'close'),
		r = m(t, 'onEscapeKeydown', 3, L);
	De.create({
		escapeKeydownBehavior: w(() => n()),
		onEscapeKeydown: w(() => r()),
		enabled: w(() => t.enabled),
		ref: t.ref
	});
	var i = R(),
		s = F(i);
	(k(s, () => t.children ?? z), T(e, i), V());
}
class Re {
	static instance;
	#t = lt([]);
	#e = new WeakMap();
	#n = new WeakMap();
	static getInstance() {
		return (this.instance || (this.instance = new Re()), this.instance);
	}
	register(t) {
		const n = this.getActive();
		n && n !== t && n.pause();
		const r = document.activeElement;
		(r && r !== document.body && this.#n.set(t, r),
			(this.#t.current = this.#t.current.filter((i) => i !== t)),
			this.#t.current.unshift(t));
	}
	unregister(t) {
		this.#t.current = this.#t.current.filter((r) => r !== t);
		const n = this.getActive();
		n && n.resume();
	}
	getActive() {
		return this.#t.current[0];
	}
	setFocusMemory(t, n) {
		this.#e.set(t, n);
	}
	getFocusMemory(t) {
		return this.#e.get(t);
	}
	isActiveScope(t) {
		return this.getActive() === t;
	}
	setPreFocusMemory(t, n) {
		this.#n.set(t, n);
	}
	getPreFocusMemory(t) {
		return this.#n.get(t);
	}
	clearPreFocusMemory(t) {
		this.#n.delete(t);
	}
}
/*!
 * tabbable 6.2.0
 * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
 */ var On = [
		'input:not([inert])',
		'select:not([inert])',
		'textarea:not([inert])',
		'a[href]:not([inert])',
		'button:not([inert])',
		'[tabindex]:not(slot):not([inert])',
		'audio[controls]:not([inert])',
		'video[controls]:not([inert])',
		'[contenteditable]:not([contenteditable="false"]):not([inert])',
		'details>summary:first-of-type:not([inert])',
		'details:not([inert])'
	],
	pe = On.join(','),
	An = typeof Element > 'u',
	At = An
		? function () {}
		: Element.prototype.matches ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.webkitMatchesSelector,
	Xt =
		!An && Element.prototype.getRootNode
			? function (e) {
					var t;
					return e == null || (t = e.getRootNode) === null || t === void 0
						? void 0
						: t.call(e);
				}
			: function (e) {
					return e?.ownerDocument;
				},
	jt = function e(t, n) {
		var r;
		n === void 0 && (n = !0);
		var i =
				t == null || (r = t.getAttribute) === null || r === void 0
					? void 0
					: r.call(t, 'inert'),
			s = i === '' || i === 'true',
			o = s || (n && t && e(t.parentNode));
		return o;
	},
	Jr = function (t) {
		var n,
			r =
				t == null || (n = t.getAttribute) === null || n === void 0
					? void 0
					: n.call(t, 'contenteditable');
		return r === '' || r === 'true';
	},
	Pn = function (t, n, r) {
		if (jt(t)) return [];
		var i = Array.prototype.slice.apply(t.querySelectorAll(pe));
		return (n && At.call(t, pe) && i.unshift(t), (i = i.filter(r)), i);
	},
	Cn = function e(t, n, r) {
		for (var i = [], s = Array.from(t); s.length; ) {
			var o = s.shift();
			if (!jt(o, !1))
				if (o.tagName === 'SLOT') {
					var a = o.assignedElements(),
						c = a.length ? a : o.children,
						l = e(c, !0, r);
					r.flatten ? i.push.apply(i, l) : i.push({ scopeParent: o, candidates: l });
				} else {
					var g = At.call(o, pe);
					g && r.filter(o) && (n || !t.includes(o)) && i.push(o);
					var u =
							o.shadowRoot ||
							(typeof r.getShadowRoot == 'function' && r.getShadowRoot(o)),
						p = !jt(u, !1) && (!r.shadowRootFilter || r.shadowRootFilter(o));
					if (u && p) {
						var d = e(u === !0 ? o.children : u.children, !0, r);
						r.flatten ? i.push.apply(i, d) : i.push({ scopeParent: o, candidates: d });
					} else s.unshift.apply(s, o.children);
				}
		}
		return i;
	},
	En = function (t) {
		return !isNaN(parseInt(t.getAttribute('tabindex'), 10));
	},
	Tn = function (t) {
		if (!t) throw new Error('No node provided');
		return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Jr(t)) && !En(t)
			? 0
			: t.tabIndex;
	},
	Qr = function (t, n) {
		var r = Tn(t);
		return r < 0 && n && !En(t) ? 0 : r;
	},
	$r = function (t, n) {
		return t.tabIndex === n.tabIndex
			? t.documentOrder - n.documentOrder
			: t.tabIndex - n.tabIndex;
	},
	Fn = function (t) {
		return t.tagName === 'INPUT';
	},
	ti = function (t) {
		return Fn(t) && t.type === 'hidden';
	},
	ei = function (t) {
		var n =
			t.tagName === 'DETAILS' &&
			Array.prototype.slice.apply(t.children).some(function (r) {
				return r.tagName === 'SUMMARY';
			});
		return n;
	},
	ni = function (t, n) {
		for (var r = 0; r < t.length; r++) if (t[r].checked && t[r].form === n) return t[r];
	},
	ri = function (t) {
		if (!t.name) return !0;
		var n = t.form || Xt(t),
			r = function (a) {
				return n.querySelectorAll('input[type="radio"][name="' + a + '"]');
			},
			i;
		if (
			typeof window < 'u' &&
			typeof window.CSS < 'u' &&
			typeof window.CSS.escape == 'function'
		)
			i = r(window.CSS.escape(t.name));
		else
			try {
				i = r(t.name);
			} catch (o) {
				return (
					console.error(
						'Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s',
						o.message
					),
					!1
				);
			}
		var s = ni(i, t.form);
		return !s || s === t;
	},
	ii = function (t) {
		return Fn(t) && t.type === 'radio';
	},
	oi = function (t) {
		return ii(t) && !ri(t);
	},
	si = function (t) {
		var n,
			r = t && Xt(t),
			i = (n = r) === null || n === void 0 ? void 0 : n.host,
			s = !1;
		if (r && r !== t) {
			var o, a, c;
			for (
				s = !!(
					((o = i) !== null &&
						o !== void 0 &&
						(a = o.ownerDocument) !== null &&
						a !== void 0 &&
						a.contains(i)) ||
					(t != null && (c = t.ownerDocument) !== null && c !== void 0 && c.contains(t))
				);
				!s && i;

			) {
				var l, g, u;
				((r = Xt(i)),
					(i = (l = r) === null || l === void 0 ? void 0 : l.host),
					(s = !!(
						(g = i) !== null &&
						g !== void 0 &&
						(u = g.ownerDocument) !== null &&
						u !== void 0 &&
						u.contains(i)
					)));
			}
		}
		return s;
	},
	Ge = function (t) {
		var n = t.getBoundingClientRect(),
			r = n.width,
			i = n.height;
		return r === 0 && i === 0;
	},
	ai = function (t, n) {
		var r = n.displayCheck,
			i = n.getShadowRoot;
		if (getComputedStyle(t).visibility === 'hidden') return !0;
		var s = At.call(t, 'details>summary:first-of-type'),
			o = s ? t.parentElement : t;
		if (At.call(o, 'details:not([open]) *')) return !0;
		if (!r || r === 'full' || r === 'legacy-full') {
			if (typeof i == 'function') {
				for (var a = t; t; ) {
					var c = t.parentElement,
						l = Xt(t);
					if (c && !c.shadowRoot && i(c) === !0) return Ge(t);
					t.assignedSlot
						? (t = t.assignedSlot)
						: !c && l !== t.ownerDocument
							? (t = l.host)
							: (t = c);
				}
				t = a;
			}
			if (si(t)) return !t.getClientRects().length;
			if (r !== 'legacy-full') return !0;
		} else if (r === 'non-zero-area') return Ge(t);
		return !1;
	},
	ci = function (t) {
		if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
			for (var n = t.parentElement; n; ) {
				if (n.tagName === 'FIELDSET' && n.disabled) {
					for (var r = 0; r < n.children.length; r++) {
						var i = n.children.item(r);
						if (i.tagName === 'LEGEND')
							return At.call(n, 'fieldset[disabled] *') ? !0 : !i.contains(t);
					}
					return !0;
				}
				n = n.parentElement;
			}
		return !1;
	},
	Zt = function (t, n) {
		return !(n.disabled || jt(n) || ti(n) || ai(n, t) || ei(n) || ci(n));
	},
	Je = function (t, n) {
		return !(oi(n) || Tn(n) < 0 || !Zt(t, n));
	},
	li = function (t) {
		var n = parseInt(t.getAttribute('tabindex'), 10);
		return !!(isNaN(n) || n >= 0);
	},
	ui = function e(t) {
		var n = [],
			r = [];
		return (
			t.forEach(function (i, s) {
				var o = !!i.scopeParent,
					a = o ? i.scopeParent : i,
					c = Qr(a, o),
					l = o ? e(i.candidates) : a;
				c === 0
					? o
						? n.push.apply(n, l)
						: n.push(a)
					: r.push({ documentOrder: s, tabIndex: c, item: i, isScope: o, content: l });
			}),
			r
				.sort($r)
				.reduce(function (i, s) {
					return (s.isScope ? i.push.apply(i, s.content) : i.push(s.content), i);
				}, [])
				.concat(n)
		);
	},
	di = function (t, n) {
		n = n || {};
		var r;
		return (
			n.getShadowRoot
				? (r = Cn([t], n.includeContainer, {
						filter: Je.bind(null, n),
						flatten: !1,
						getShadowRoot: n.getShadowRoot,
						shadowRootFilter: li
					}))
				: (r = Pn(t, n.includeContainer, Je.bind(null, n))),
			ui(r)
		);
	},
	fi = function (t, n) {
		n = n || {};
		var r;
		return (
			n.getShadowRoot
				? (r = Cn([t], n.includeContainer, {
						filter: Zt.bind(null, n),
						flatten: !0,
						getShadowRoot: n.getShadowRoot
					}))
				: (r = Pn(t, n.includeContainer, Zt.bind(null, n))),
			r
		);
	},
	hi = On.concat('iframe').join(','),
	gi = function (t, n) {
		if (((n = n || {}), !t)) throw new Error('No node provided');
		return At.call(t, hi) === !1 ? !1 : Zt(n, t);
	};
class Ie {
	#t = !1;
	#e = null;
	#n = Re.getInstance();
	#r = [];
	#i;
	constructor(t) {
		this.#i = t;
	}
	get paused() {
		return this.#t;
	}
	pause() {
		this.#t = !0;
	}
	resume() {
		this.#t = !1;
	}
	#o() {
		for (const t of this.#r) t();
		this.#r = [];
	}
	mount(t) {
		(this.#e && this.unmount(), (this.#e = t), this.#n.register(this), this.#c(), this.#a());
	}
	unmount() {
		this.#e &&
			(this.#o(),
			this.#s(),
			this.#n.unregister(this),
			this.#n.clearPreFocusMemory(this),
			(this.#e = null));
	}
	#a() {
		if (!this.#e) return;
		const t = new CustomEvent('focusScope.onOpenAutoFocus', { bubbles: !1, cancelable: !0 });
		(this.#i.onOpenAutoFocus.current(t),
			t.defaultPrevented ||
				requestAnimationFrame(() => {
					if (!this.#e) return;
					const n = this.#u();
					n ? (n.focus(), this.#n.setFocusMemory(this, n)) : this.#e.focus();
				}));
	}
	#s() {
		const t = new CustomEvent('focusScope.onCloseAutoFocus', { bubbles: !1, cancelable: !0 });
		if ((this.#i.onCloseAutoFocus.current?.(t), !t.defaultPrevented)) {
			const n = this.#n.getPreFocusMemory(this);
			if (n && document.contains(n))
				try {
					n.focus();
				} catch {
					document.body.focus();
				}
		}
	}
	#c() {
		if (!this.#e || !this.#i.trap.current) return;
		const t = this.#e,
			n = t.ownerDocument,
			r = (o) => {
				if (this.#t || !this.#n.isActiveScope(this)) return;
				const a = o.target;
				if (!a) return;
				if (t.contains(a)) this.#n.setFocusMemory(this, a);
				else {
					const l = this.#n.getFocusMemory(this);
					if (l && t.contains(l) && gi(l)) (o.preventDefault(), l.focus());
					else {
						const g = this.#u(),
							u = this.#l()[0];
						(g || u || t).focus();
					}
				}
			},
			i = (o) => {
				if (!this.#i.loop || this.#t || o.key !== 'Tab' || !this.#n.isActiveScope(this))
					return;
				const a = this.#d();
				if (a.length < 2) return;
				const c = a[0],
					l = a[a.length - 1];
				!o.shiftKey && n.activeElement === l
					? (o.preventDefault(), c.focus())
					: o.shiftKey && n.activeElement === c && (o.preventDefault(), l.focus());
			};
		this.#r.push(Q(n, 'focusin', r, { capture: !0 }), Q(t, 'keydown', i));
		const s = new MutationObserver(() => {
			const o = this.#n.getFocusMemory(this);
			if (o && !t.contains(o)) {
				const a = this.#u(),
					c = this.#l()[0],
					l = a || c;
				l ? (l.focus(), this.#n.setFocusMemory(this, l)) : t.focus();
			}
		});
		(s.observe(t, { childList: !0, subtree: !0 }), this.#r.push(() => s.disconnect()));
	}
	#d() {
		return this.#e ? di(this.#e, { includeContainer: !1, getShadowRoot: !0 }) : [];
	}
	#u() {
		return this.#d()[0] || null;
	}
	#l() {
		return this.#e ? fi(this.#e, { includeContainer: !1, getShadowRoot: !0 }) : [];
	}
	static use(t) {
		let n = null;
		return (
			tt([() => t.ref.current, () => t.enabled.current], ([r, i]) => {
				r && i ? (n || (n = new Ie(t)), n.mount(r)) : n && (n.unmount(), (n = null));
			}),
			Vt(() => {
				n?.unmount();
			}),
			{
				get props() {
					return { tabindex: -1 };
				}
			}
		);
	}
}
function Dn(e, t) {
	W(t, !0);
	let n = m(t, 'enabled', 3, !1),
		r = m(t, 'trapFocus', 3, !1),
		i = m(t, 'loop', 3, !1),
		s = m(t, 'onCloseAutoFocus', 3, L),
		o = m(t, 'onOpenAutoFocus', 3, L);
	const a = Ie.use({
		enabled: w(() => n()),
		trap: w(() => r()),
		loop: i(),
		onCloseAutoFocus: w(() => s()),
		onOpenAutoFocus: w(() => o()),
		ref: t.ref
	});
	var c = R(),
		l = F(c);
	(k(
		l,
		() => t.focusScope ?? z,
		() => ({ props: a.props })
	),
		T(e, c),
		V());
}
globalThis.bitsTextSelectionLayers ??= new Map();
class ke {
	static create(t) {
		return new ke(t);
	}
	opts;
	domContext;
	#t = L;
	constructor(t) {
		((this.opts = t), (this.domContext = new vn(t.ref)));
		let n = L;
		tt(
			() => this.opts.enabled.current,
			(r) => (
				r &&
					(globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled),
					n(),
					(n = this.#e())),
				() => {
					(n(), this.#r(), globalThis.bitsTextSelectionLayers.delete(this));
				}
			)
		);
	}
	#e() {
		return Yt(
			Q(this.domContext.getDocument(), 'pointerdown', this.#n),
			Q(
				this.domContext.getDocument(),
				'pointerup',
				ar(this.#r, this.opts.onPointerUp.current)
			)
		);
	}
	#n = (t) => {
		const n = this.opts.ref.current,
			r = t.target;
		!Ye(n) ||
			!Ye(r) ||
			!this.opts.enabled.current ||
			!mi(this) ||
			!Dr(n, r) ||
			(this.opts.onPointerDown.current(t),
			!t.defaultPrevented && (this.#t = pi(n, this.domContext.getDocument().body)));
	};
	#r = () => {
		(this.#t(), (this.#t = L));
	};
}
const Qe = (e) => e.style.userSelect || e.style.webkitUserSelect;
function pi(e, t) {
	const n = Qe(t),
		r = Qe(e);
	return (
		Ht(t, 'none'),
		Ht(e, 'text'),
		() => {
			(Ht(t, n), Ht(e, r));
		}
	);
}
function Ht(e, t) {
	((e.style.userSelect = t), (e.style.webkitUserSelect = t));
}
function mi(e) {
	const t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	const n = t.at(-1);
	return n ? n[0] === e : !1;
}
function Rn(e, t) {
	W(t, !0);
	let n = m(t, 'preventOverflowTextSelection', 3, !0),
		r = m(t, 'onPointerDown', 3, L),
		i = m(t, 'onPointerUp', 3, L);
	ke.create({
		id: w(() => t.id),
		onPointerDown: w(() => r()),
		onPointerUp: w(() => i()),
		enabled: w(() => t.enabled && n()),
		ref: t.ref
	});
	var s = R(),
		o = F(s);
	(k(o, () => t.children ?? z), T(e, s), V());
}
globalThis.bitsIdCounter ??= { current: 0 };
function Me(e = 'bits') {
	return (globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`);
}
class vi {
	#t;
	#e = 0;
	#n = I();
	#r;
	constructor(t) {
		this.#t = t;
	}
	#i() {
		((this.#e -= 1),
			this.#r && this.#e <= 0 && (this.#r(), S(this.#n, void 0), (this.#r = void 0)));
	}
	get(...t) {
		return (
			(this.#e += 1),
			h(this.#n) === void 0 &&
				(this.#r = Qn(() => {
					S(this.#n, this.#t(...t), !0);
				})),
			rt(() => () => {
				this.#i();
			}),
			h(this.#n)
		);
	}
}
const qt = new br();
let Kt = I(null),
	ue = null,
	Dt = null,
	Rt = !1;
const $e = w(() => {
	for (const e of qt.values()) if (e) return !0;
	return !1;
});
let de = null;
const wi = new vi(() => {
	function e() {
		(document.body.setAttribute('style', h(Kt) ?? ''),
			document.body.style.removeProperty('--scrollbar-width'),
			qe && ue?.(),
			S(Kt, null));
	}
	function t() {
		Dt !== null && (window.clearTimeout(Dt), (Dt = null));
	}
	function n(i, s) {
		(t(), (Rt = !0), (de = Date.now()));
		const o = de,
			a = () => {
				((Dt = null), de === o && (In(qt) ? (Rt = !1) : ((Rt = !1), s())));
			},
			c = i === null ? 24 : i;
		Dt = window.setTimeout(a, c);
	}
	function r() {
		h(Kt) === null && qt.size === 0 && !Rt && S(Kt, document.body.getAttribute('style'), !0);
	}
	return (
		tt(
			() => $e.current,
			() => {
				if (!$e.current) return;
				(r(), (Rt = !1));
				const i = getComputedStyle(document.body),
					s = window.innerWidth - document.documentElement.clientWidth,
					a = {
						padding: Number.parseInt(i.paddingRight ?? '0', 10) + s,
						margin: Number.parseInt(i.marginRight ?? '0', 10)
					};
				(s > 0 &&
					((document.body.style.paddingRight = `${a.padding}px`),
					(document.body.style.marginRight = `${a.margin}px`),
					document.body.style.setProperty('--scrollbar-width', `${s}px`),
					(document.body.style.overflow = 'hidden')),
					qe &&
						(ue = Q(
							document,
							'touchmove',
							(c) => {
								c.target === document.documentElement &&
									(c.touches.length > 1 || c.preventDefault());
							},
							{ passive: !1 }
						)),
					xe(() => {
						((document.body.style.pointerEvents = 'none'),
							(document.body.style.overflow = 'hidden'));
					}));
			}
		),
		Vt(() => () => {
			ue?.();
		}),
		{
			get lockMap() {
				return qt;
			},
			resetBodyStyle: e,
			scheduleCleanupIfNoNewLocks: n,
			cancelPendingCleanup: t,
			ensureInitialStyleCaptured: r
		}
	);
});
class yi {
	#t = Me();
	#e;
	#n = () => null;
	#r;
	locked;
	constructor(t, n = () => null) {
		((this.#e = t),
			(this.#n = n),
			(this.#r = wi.get()),
			this.#r &&
				(this.#r.cancelPendingCleanup(),
				this.#r.ensureInitialStyleCaptured(),
				this.#r.lockMap.set(this.#t, this.#e ?? !1),
				(this.locked = w(
					() => this.#r.lockMap.get(this.#t) ?? !1,
					(r) => this.#r.lockMap.set(this.#t, r)
				)),
				Vt(() => {
					if ((this.#r.lockMap.delete(this.#t), In(this.#r.lockMap))) return;
					const r = this.#n();
					this.#r.scheduleCleanupIfNoNewLocks(r, () => {
						this.#r.resetBodyStyle();
					});
				})));
	}
}
function In(e) {
	for (const [t, n] of e) if (n) return !0;
	return !1;
}
function Gt(e, t) {
	W(t, !0);
	let n = m(t, 'preventScroll', 3, !0),
		r = m(t, 'restoreScrollDelay', 3, null);
	(n() && new yi(n(), () => r()), V());
}
function bi({ forceMount: e, present: t, open: n }) {
	return (e || t) && n;
}
var xi = xt('<div><!></div>');
function Xo(e, t) {
	const n = Mt();
	W(t, !0);
	let r = m(t, 'id', 19, () => Wt(n)),
		i = m(t, 'forceMount', 3, !1),
		s = m(t, 'ref', 15, null),
		o = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'forceMount',
			'child',
			'children',
			'ref'
		]);
	const a = Te.create({
			id: w(() => r()),
			ref: w(
				() => s(),
				(l) => s(l)
			)
		}),
		c = O(() => $(o, a.props));
	{
		const l = (u) => {
			var p = R(),
				d = F(p);
			{
				var f = (y) => {
						var b = R(),
							A = F(b);
						{
							let x = O(() => ({ props: $(h(c)), ...a.snippetProps }));
							k(
								A,
								() => t.child,
								() => h(x)
							);
						}
						T(y, b);
					},
					v = (y) => {
						var b = xi();
						Nt(b, (x) => ({ ...x }), [() => $(h(c))]);
						var A = Bt(b);
						(k(
							A,
							() => t.children ?? z,
							() => a.snippetProps
						),
							Lt(b),
							T(y, b));
					};
				st(d, (y) => {
					t.child ? y(f) : y(v, !1);
				});
			}
			T(u, p);
		};
		let g = O(() => a.root.opts.open.current || i());
		Se(e, {
			get open() {
				return h(g);
			},
			get ref() {
				return a.opts.ref;
			},
			presence: l,
			$$slots: { presence: !0 }
		});
	}
	V();
}
var Si = xt('<div><!></div>');
function jo(e, t) {
	const n = Mt();
	W(t, !0);
	let r = m(t, 'id', 19, () => Wt(n)),
		i = m(t, 'ref', 15, null),
		s = ht(t, ['$$slots', '$$events', '$$legacy', 'id', 'children', 'child', 'ref']);
	const o = Ce.create({
			id: w(() => r()),
			ref: w(
				() => i(),
				(p) => i(p)
			)
		}),
		a = O(() => $(s, o.props));
	var c = R(),
		l = F(c);
	{
		var g = (p) => {
				var d = R(),
					f = F(d);
				(k(
					f,
					() => t.child,
					() => ({ props: h(a) })
				),
					T(p, d));
			},
			u = (p) => {
				var d = Si();
				Nt(d, () => ({ ...h(a) }));
				var f = Bt(d);
				(k(f, () => t.children ?? z), Lt(d), T(p, d));
			};
		st(l, (p) => {
			t.child ? p(g) : p(u, !1);
		});
	}
	(T(e, c), V());
}
const Oi = ['top', 'right', 'bottom', 'left'],
	gt = Math.min,
	q = Math.max,
	Jt = Math.round,
	Ut = Math.floor,
	ot = (e) => ({ x: e, y: e }),
	Ai = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
	Pi = { start: 'end', end: 'start' };
function me(e, t, n) {
	return q(e, gt(t, n));
}
function dt(e, t) {
	return typeof e == 'function' ? e(t) : e;
}
function ft(e) {
	return e.split('-')[0];
}
function Ct(e) {
	return e.split('-')[1];
}
function Ne(e) {
	return e === 'x' ? 'y' : 'x';
}
function Be(e) {
	return e === 'y' ? 'height' : 'width';
}
const Ci = new Set(['top', 'bottom']);
function it(e) {
	return Ci.has(ft(e)) ? 'y' : 'x';
}
function Le(e) {
	return Ne(it(e));
}
function Ei(e, t, n) {
	n === void 0 && (n = !1);
	const r = Ct(e),
		i = Le(e),
		s = Be(i);
	let o =
		i === 'x'
			? r === (n ? 'end' : 'start')
				? 'right'
				: 'left'
			: r === 'start'
				? 'bottom'
				: 'top';
	return (t.reference[s] > t.floating[s] && (o = Qt(o)), [o, Qt(o)]);
}
function Ti(e) {
	const t = Qt(e);
	return [ve(e), t, ve(t)];
}
function ve(e) {
	return e.replace(/start|end/g, (t) => Pi[t]);
}
const tn = ['left', 'right'],
	en = ['right', 'left'],
	Fi = ['top', 'bottom'],
	Di = ['bottom', 'top'];
function Ri(e, t, n) {
	switch (e) {
		case 'top':
		case 'bottom':
			return n ? (t ? en : tn) : t ? tn : en;
		case 'left':
		case 'right':
			return t ? Fi : Di;
		default:
			return [];
	}
}
function Ii(e, t, n, r) {
	const i = Ct(e);
	let s = Ri(ft(e), n === 'start', r);
	return (i && ((s = s.map((o) => o + '-' + i)), t && (s = s.concat(s.map(ve)))), s);
}
function Qt(e) {
	return e.replace(/left|right|bottom|top/g, (t) => Ai[t]);
}
function ki(e) {
	return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function kn(e) {
	return typeof e != 'number' ? ki(e) : { top: e, right: e, bottom: e, left: e };
}
function $t(e) {
	const { x: t, y: n, width: r, height: i } = e;
	return { width: r, height: i, top: n, left: t, right: t + r, bottom: n + i, x: t, y: n };
}
function nn(e, t, n) {
	let { reference: r, floating: i } = e;
	const s = it(t),
		o = Le(t),
		a = Be(o),
		c = ft(t),
		l = s === 'y',
		g = r.x + r.width / 2 - i.width / 2,
		u = r.y + r.height / 2 - i.height / 2,
		p = r[a] / 2 - i[a] / 2;
	let d;
	switch (c) {
		case 'top':
			d = { x: g, y: r.y - i.height };
			break;
		case 'bottom':
			d = { x: g, y: r.y + r.height };
			break;
		case 'right':
			d = { x: r.x + r.width, y: u };
			break;
		case 'left':
			d = { x: r.x - i.width, y: u };
			break;
		default:
			d = { x: r.x, y: r.y };
	}
	switch (Ct(t)) {
		case 'start':
			d[o] -= p * (n && l ? -1 : 1);
			break;
		case 'end':
			d[o] += p * (n && l ? -1 : 1);
			break;
	}
	return d;
}
const Mi = async (e, t, n) => {
	const {
			placement: r = 'bottom',
			strategy: i = 'absolute',
			middleware: s = [],
			platform: o
		} = n,
		a = s.filter(Boolean),
		c = await (o.isRTL == null ? void 0 : o.isRTL(t));
	let l = await o.getElementRects({ reference: e, floating: t, strategy: i }),
		{ x: g, y: u } = nn(l, r, c),
		p = r,
		d = {},
		f = 0;
	for (let v = 0; v < a.length; v++) {
		const { name: y, fn: b } = a[v],
			{
				x: A,
				y: x,
				data: P,
				reset: C
			} = await b({
				x: g,
				y: u,
				initialPlacement: r,
				placement: p,
				strategy: i,
				middlewareData: d,
				rects: l,
				platform: o,
				elements: { reference: e, floating: t }
			});
		((g = A ?? g),
			(u = x ?? u),
			(d = { ...d, [y]: { ...d[y], ...P } }),
			C &&
				f <= 50 &&
				(f++,
				typeof C == 'object' &&
					(C.placement && (p = C.placement),
					C.rects &&
						(l =
							C.rects === !0
								? await o.getElementRects({
										reference: e,
										floating: t,
										strategy: i
									})
								: C.rects),
					({ x: g, y: u } = nn(l, p, c))),
				(v = -1)));
	}
	return { x: g, y: u, placement: p, strategy: i, middlewareData: d };
};
async function It(e, t) {
	var n;
	t === void 0 && (t = {});
	const { x: r, y: i, platform: s, rects: o, elements: a, strategy: c } = e,
		{
			boundary: l = 'clippingAncestors',
			rootBoundary: g = 'viewport',
			elementContext: u = 'floating',
			altBoundary: p = !1,
			padding: d = 0
		} = dt(t, e),
		f = kn(d),
		y = a[p ? (u === 'floating' ? 'reference' : 'floating') : u],
		b = $t(
			await s.getClippingRect({
				element:
					(n = await (s.isElement == null ? void 0 : s.isElement(y))) == null || n
						? y
						: y.contextElement ||
							(await (s.getDocumentElement == null
								? void 0
								: s.getDocumentElement(a.floating))),
				boundary: l,
				rootBoundary: g,
				strategy: c
			})
		),
		A =
			u === 'floating'
				? { x: r, y: i, width: o.floating.width, height: o.floating.height }
				: o.reference,
		x = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(a.floating)),
		P = (await (s.isElement == null ? void 0 : s.isElement(x)))
			? (await (s.getScale == null ? void 0 : s.getScale(x))) || { x: 1, y: 1 }
			: { x: 1, y: 1 },
		C = $t(
			s.convertOffsetParentRelativeRectToViewportRelativeRect
				? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
						elements: a,
						rect: A,
						offsetParent: x,
						strategy: c
					})
				: A
		);
	return {
		top: (b.top - C.top + f.top) / P.y,
		bottom: (C.bottom - b.bottom + f.bottom) / P.y,
		left: (b.left - C.left + f.left) / P.x,
		right: (C.right - b.right + f.right) / P.x
	};
}
const Ni = (e) => ({
		name: 'arrow',
		options: e,
		async fn(t) {
			const {
					x: n,
					y: r,
					placement: i,
					rects: s,
					platform: o,
					elements: a,
					middlewareData: c
				} = t,
				{ element: l, padding: g = 0 } = dt(e, t) || {};
			if (l == null) return {};
			const u = kn(g),
				p = { x: n, y: r },
				d = Le(i),
				f = Be(d),
				v = await o.getDimensions(l),
				y = d === 'y',
				b = y ? 'top' : 'left',
				A = y ? 'bottom' : 'right',
				x = y ? 'clientHeight' : 'clientWidth',
				P = s.reference[f] + s.reference[d] - p[d] - s.floating[f],
				C = p[d] - s.reference[d],
				D = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l));
			let E = D ? D[x] : 0;
			(!E || !(await (o.isElement == null ? void 0 : o.isElement(D)))) &&
				(E = a.floating[x] || s.floating[f]);
			const M = P / 2 - C / 2,
				j = E / 2 - v[f] / 2 - 1,
				N = gt(u[b], j),
				G = gt(u[A], j),
				K = N,
				J = E - v[f] - G,
				B = E / 2 - v[f] / 2 + M,
				Z = me(K, B, J),
				Y =
					!c.arrow &&
					Ct(i) != null &&
					B !== Z &&
					s.reference[f] / 2 - (B < K ? N : G) - v[f] / 2 < 0,
				H = Y ? (B < K ? B - K : B - J) : 0;
			return {
				[d]: p[d] + H,
				data: { [d]: Z, centerOffset: B - Z - H, ...(Y && { alignmentOffset: H }) },
				reset: Y
			};
		}
	}),
	Bi = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'flip',
				options: e,
				async fn(t) {
					var n, r;
					const {
							placement: i,
							middlewareData: s,
							rects: o,
							initialPlacement: a,
							platform: c,
							elements: l
						} = t,
						{
							mainAxis: g = !0,
							crossAxis: u = !0,
							fallbackPlacements: p,
							fallbackStrategy: d = 'bestFit',
							fallbackAxisSideDirection: f = 'none',
							flipAlignment: v = !0,
							...y
						} = dt(e, t);
					if ((n = s.arrow) != null && n.alignmentOffset) return {};
					const b = ft(i),
						A = it(a),
						x = ft(a) === a,
						P = await (c.isRTL == null ? void 0 : c.isRTL(l.floating)),
						C = p || (x || !v ? [Qt(a)] : Ti(a)),
						D = f !== 'none';
					!p && D && C.push(...Ii(a, v, f, P));
					const E = [a, ...C],
						M = await It(t, y),
						j = [];
					let N = ((r = s.flip) == null ? void 0 : r.overflows) || [];
					if ((g && j.push(M[b]), u)) {
						const B = Ei(i, o, P);
						j.push(M[B[0]], M[B[1]]);
					}
					if (((N = [...N, { placement: i, overflows: j }]), !j.every((B) => B <= 0))) {
						var G, K;
						const B = (((G = s.flip) == null ? void 0 : G.index) || 0) + 1,
							Z = E[B];
						if (
							Z &&
							(!(u === 'alignment' ? A !== it(Z) : !1) ||
								N.every((_) => (it(_.placement) === A ? _.overflows[0] > 0 : !0)))
						)
							return { data: { index: B, overflows: N }, reset: { placement: Z } };
						let Y =
							(K = N.filter((H) => H.overflows[0] <= 0).sort(
								(H, _) => H.overflows[1] - _.overflows[1]
							)[0]) == null
								? void 0
								: K.placement;
						if (!Y)
							switch (d) {
								case 'bestFit': {
									var J;
									const H =
										(J = N.filter((_) => {
											if (D) {
												const U = it(_.placement);
												return U === A || U === 'y';
											}
											return !0;
										})
											.map((_) => [
												_.placement,
												_.overflows
													.filter((U) => U > 0)
													.reduce((U, mt) => U + mt, 0)
											])
											.sort((_, U) => _[1] - U[1])[0]) == null
											? void 0
											: J[0];
									H && (Y = H);
									break;
								}
								case 'initialPlacement':
									Y = a;
									break;
							}
						if (i !== Y) return { reset: { placement: Y } };
					}
					return {};
				}
			}
		);
	};
function rn(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function on(e) {
	return Oi.some((t) => e[t] >= 0);
}
const Li = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'hide',
				options: e,
				async fn(t) {
					const { rects: n } = t,
						{ strategy: r = 'referenceHidden', ...i } = dt(e, t);
					switch (r) {
						case 'referenceHidden': {
							const s = await It(t, { ...i, elementContext: 'reference' }),
								o = rn(s, n.reference);
							return { data: { referenceHiddenOffsets: o, referenceHidden: on(o) } };
						}
						case 'escaped': {
							const s = await It(t, { ...i, altBoundary: !0 }),
								o = rn(s, n.floating);
							return { data: { escapedOffsets: o, escaped: on(o) } };
						}
						default:
							return {};
					}
				}
			}
		);
	},
	Mn = new Set(['left', 'top']);
async function _i(e, t) {
	const { placement: n, platform: r, elements: i } = e,
		s = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)),
		o = ft(n),
		a = Ct(n),
		c = it(n) === 'y',
		l = Mn.has(o) ? -1 : 1,
		g = s && c ? -1 : 1,
		u = dt(t, e);
	let {
		mainAxis: p,
		crossAxis: d,
		alignmentAxis: f
	} = typeof u == 'number'
		? { mainAxis: u, crossAxis: 0, alignmentAxis: null }
		: {
				mainAxis: u.mainAxis || 0,
				crossAxis: u.crossAxis || 0,
				alignmentAxis: u.alignmentAxis
			};
	return (
		a && typeof f == 'number' && (d = a === 'end' ? f * -1 : f),
		c ? { x: d * g, y: p * l } : { x: p * l, y: d * g }
	);
}
const Wi = function (e) {
		return (
			e === void 0 && (e = 0),
			{
				name: 'offset',
				options: e,
				async fn(t) {
					var n, r;
					const { x: i, y: s, placement: o, middlewareData: a } = t,
						c = await _i(t, e);
					return o === ((n = a.offset) == null ? void 0 : n.placement) &&
						(r = a.arrow) != null &&
						r.alignmentOffset
						? {}
						: { x: i + c.x, y: s + c.y, data: { ...c, placement: o } };
				}
			}
		);
	},
	Vi = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'shift',
				options: e,
				async fn(t) {
					const { x: n, y: r, placement: i } = t,
						{
							mainAxis: s = !0,
							crossAxis: o = !1,
							limiter: a = {
								fn: (y) => {
									let { x: b, y: A } = y;
									return { x: b, y: A };
								}
							},
							...c
						} = dt(e, t),
						l = { x: n, y: r },
						g = await It(t, c),
						u = it(ft(i)),
						p = Ne(u);
					let d = l[p],
						f = l[u];
					if (s) {
						const y = p === 'y' ? 'top' : 'left',
							b = p === 'y' ? 'bottom' : 'right',
							A = d + g[y],
							x = d - g[b];
						d = me(A, d, x);
					}
					if (o) {
						const y = u === 'y' ? 'top' : 'left',
							b = u === 'y' ? 'bottom' : 'right',
							A = f + g[y],
							x = f - g[b];
						f = me(A, f, x);
					}
					const v = a.fn({ ...t, [p]: d, [u]: f });
					return { ...v, data: { x: v.x - n, y: v.y - r, enabled: { [p]: s, [u]: o } } };
				}
			}
		);
	},
	zi = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				options: e,
				fn(t) {
					const { x: n, y: r, placement: i, rects: s, middlewareData: o } = t,
						{ offset: a = 0, mainAxis: c = !0, crossAxis: l = !0 } = dt(e, t),
						g = { x: n, y: r },
						u = it(i),
						p = Ne(u);
					let d = g[p],
						f = g[u];
					const v = dt(a, t),
						y =
							typeof v == 'number'
								? { mainAxis: v, crossAxis: 0 }
								: { mainAxis: 0, crossAxis: 0, ...v };
					if (c) {
						const x = p === 'y' ? 'height' : 'width',
							P = s.reference[p] - s.floating[x] + y.mainAxis,
							C = s.reference[p] + s.reference[x] - y.mainAxis;
						d < P ? (d = P) : d > C && (d = C);
					}
					if (l) {
						var b, A;
						const x = p === 'y' ? 'width' : 'height',
							P = Mn.has(ft(i)),
							C =
								s.reference[u] -
								s.floating[x] +
								((P && ((b = o.offset) == null ? void 0 : b[u])) || 0) +
								(P ? 0 : y.crossAxis),
							D =
								s.reference[u] +
								s.reference[x] +
								(P ? 0 : ((A = o.offset) == null ? void 0 : A[u]) || 0) -
								(P ? y.crossAxis : 0);
						f < C ? (f = C) : f > D && (f = D);
					}
					return { [p]: d, [u]: f };
				}
			}
		);
	},
	Hi = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'size',
				options: e,
				async fn(t) {
					var n, r;
					const { placement: i, rects: s, platform: o, elements: a } = t,
						{ apply: c = () => {}, ...l } = dt(e, t),
						g = await It(t, l),
						u = ft(i),
						p = Ct(i),
						d = it(i) === 'y',
						{ width: f, height: v } = s.floating;
					let y, b;
					u === 'top' || u === 'bottom'
						? ((y = u),
							(b =
								p ===
								((await (o.isRTL == null ? void 0 : o.isRTL(a.floating)))
									? 'start'
									: 'end')
									? 'left'
									: 'right'))
						: ((b = u), (y = p === 'end' ? 'top' : 'bottom'));
					const A = v - g.top - g.bottom,
						x = f - g.left - g.right,
						P = gt(v - g[y], A),
						C = gt(f - g[b], x),
						D = !t.middlewareData.shift;
					let E = P,
						M = C;
					if (
						((n = t.middlewareData.shift) != null && n.enabled.x && (M = x),
						(r = t.middlewareData.shift) != null && r.enabled.y && (E = A),
						D && !p)
					) {
						const N = q(g.left, 0),
							G = q(g.right, 0),
							K = q(g.top, 0),
							J = q(g.bottom, 0);
						d
							? (M = f - 2 * (N !== 0 || G !== 0 ? N + G : q(g.left, g.right)))
							: (E = v - 2 * (K !== 0 || J !== 0 ? K + J : q(g.top, g.bottom)));
					}
					await c({ ...t, availableWidth: M, availableHeight: E });
					const j = await o.getDimensions(a.floating);
					return f !== j.width || v !== j.height ? { reset: { rects: !0 } } : {};
				}
			}
		);
	};
function ie() {
	return typeof window < 'u';
}
function Et(e) {
	return Nn(e) ? (e.nodeName || '').toLowerCase() : '#document';
}
function X(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ct(e) {
	var t;
	return (t = (Nn(e) ? e.ownerDocument : e.document) || window.document) == null
		? void 0
		: t.documentElement;
}
function Nn(e) {
	return ie() ? e instanceof Node || e instanceof X(e).Node : !1;
}
function et(e) {
	return ie() ? e instanceof Element || e instanceof X(e).Element : !1;
}
function at(e) {
	return ie() ? e instanceof HTMLElement || e instanceof X(e).HTMLElement : !1;
}
function sn(e) {
	return !ie() || typeof ShadowRoot > 'u'
		? !1
		: e instanceof ShadowRoot || e instanceof X(e).ShadowRoot;
}
const Ki = new Set(['inline', 'contents']);
function zt(e) {
	const { overflow: t, overflowX: n, overflowY: r, display: i } = nt(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !Ki.has(i);
}
const Ui = new Set(['table', 'td', 'th']);
function Yi(e) {
	return Ui.has(Et(e));
}
const qi = [':popover-open', ':modal'];
function oe(e) {
	return qi.some((t) => {
		try {
			return e.matches(t);
		} catch {
			return !1;
		}
	});
}
const Xi = ['transform', 'translate', 'scale', 'rotate', 'perspective'],
	ji = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'],
	Zi = ['paint', 'layout', 'strict', 'content'];
function _e(e) {
	const t = We(),
		n = et(e) ? nt(e) : e;
	return (
		Xi.some((r) => (n[r] ? n[r] !== 'none' : !1)) ||
		(n.containerType ? n.containerType !== 'normal' : !1) ||
		(!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
		(!t && (n.filter ? n.filter !== 'none' : !1)) ||
		ji.some((r) => (n.willChange || '').includes(r)) ||
		Zi.some((r) => (n.contain || '').includes(r))
	);
}
function Gi(e) {
	let t = pt(e);
	for (; at(t) && !Pt(t); ) {
		if (_e(t)) return t;
		if (oe(t)) return null;
		t = pt(t);
	}
	return null;
}
function We() {
	return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none');
}
const Ji = new Set(['html', 'body', '#document']);
function Pt(e) {
	return Ji.has(Et(e));
}
function nt(e) {
	return X(e).getComputedStyle(e);
}
function se(e) {
	return et(e)
		? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
		: { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function pt(e) {
	if (Et(e) === 'html') return e;
	const t = e.assignedSlot || e.parentNode || (sn(e) && e.host) || ct(e);
	return sn(t) ? t.host : t;
}
function Bn(e) {
	const t = pt(e);
	return Pt(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : at(t) && zt(t) ? t : Bn(t);
}
function kt(e, t, n) {
	var r;
	(t === void 0 && (t = []), n === void 0 && (n = !0));
	const i = Bn(e),
		s = i === ((r = e.ownerDocument) == null ? void 0 : r.body),
		o = X(i);
	if (s) {
		const a = we(o);
		return t.concat(o, o.visualViewport || [], zt(i) ? i : [], a && n ? kt(a) : []);
	}
	return t.concat(i, kt(i, [], n));
}
function we(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function Ln(e) {
	const t = nt(e);
	let n = parseFloat(t.width) || 0,
		r = parseFloat(t.height) || 0;
	const i = at(e),
		s = i ? e.offsetWidth : n,
		o = i ? e.offsetHeight : r,
		a = Jt(n) !== s || Jt(r) !== o;
	return (a && ((n = s), (r = o)), { width: n, height: r, $: a });
}
function Ve(e) {
	return et(e) ? e : e.contextElement;
}
function Ot(e) {
	const t = Ve(e);
	if (!at(t)) return ot(1);
	const n = t.getBoundingClientRect(),
		{ width: r, height: i, $: s } = Ln(t);
	let o = (s ? Jt(n.width) : n.width) / r,
		a = (s ? Jt(n.height) : n.height) / i;
	return (
		(!o || !Number.isFinite(o)) && (o = 1),
		(!a || !Number.isFinite(a)) && (a = 1),
		{ x: o, y: a }
	);
}
const Qi = ot(0);
function _n(e) {
	const t = X(e);
	return !We() || !t.visualViewport
		? Qi
		: { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function $i(e, t, n) {
	return (t === void 0 && (t = !1), !n || (t && n !== X(e)) ? !1 : t);
}
function bt(e, t, n, r) {
	(t === void 0 && (t = !1), n === void 0 && (n = !1));
	const i = e.getBoundingClientRect(),
		s = Ve(e);
	let o = ot(1);
	t && (r ? et(r) && (o = Ot(r)) : (o = Ot(e)));
	const a = $i(s, n, r) ? _n(s) : ot(0);
	let c = (i.left + a.x) / o.x,
		l = (i.top + a.y) / o.y,
		g = i.width / o.x,
		u = i.height / o.y;
	if (s) {
		const p = X(s),
			d = r && et(r) ? X(r) : r;
		let f = p,
			v = we(f);
		for (; v && r && d !== f; ) {
			const y = Ot(v),
				b = v.getBoundingClientRect(),
				A = nt(v),
				x = b.left + (v.clientLeft + parseFloat(A.paddingLeft)) * y.x,
				P = b.top + (v.clientTop + parseFloat(A.paddingTop)) * y.y;
			((c *= y.x),
				(l *= y.y),
				(g *= y.x),
				(u *= y.y),
				(c += x),
				(l += P),
				(f = X(v)),
				(v = we(f)));
		}
	}
	return $t({ width: g, height: u, x: c, y: l });
}
function ae(e, t) {
	const n = se(e).scrollLeft;
	return t ? t.left + n : bt(ct(e)).left + n;
}
function Wn(e, t) {
	const n = e.getBoundingClientRect(),
		r = n.left + t.scrollLeft - ae(e, n),
		i = n.top + t.scrollTop;
	return { x: r, y: i };
}
function to(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e;
	const s = i === 'fixed',
		o = ct(r),
		a = t ? oe(t.floating) : !1;
	if (r === o || (a && s)) return n;
	let c = { scrollLeft: 0, scrollTop: 0 },
		l = ot(1);
	const g = ot(0),
		u = at(r);
	if ((u || (!u && !s)) && ((Et(r) !== 'body' || zt(o)) && (c = se(r)), at(r))) {
		const d = bt(r);
		((l = Ot(r)), (g.x = d.x + r.clientLeft), (g.y = d.y + r.clientTop));
	}
	const p = o && !u && !s ? Wn(o, c) : ot(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + g.x + p.x,
		y: n.y * l.y - c.scrollTop * l.y + g.y + p.y
	};
}
function eo(e) {
	return Array.from(e.getClientRects());
}
function no(e) {
	const t = ct(e),
		n = se(e),
		r = e.ownerDocument.body,
		i = q(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
		s = q(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
	let o = -n.scrollLeft + ae(e);
	const a = -n.scrollTop;
	return (
		nt(r).direction === 'rtl' && (o += q(t.clientWidth, r.clientWidth) - i),
		{ width: i, height: s, x: o, y: a }
	);
}
const an = 25;
function ro(e, t) {
	const n = X(e),
		r = ct(e),
		i = n.visualViewport;
	let s = r.clientWidth,
		o = r.clientHeight,
		a = 0,
		c = 0;
	if (i) {
		((s = i.width), (o = i.height));
		const g = We();
		(!g || (g && t === 'fixed')) && ((a = i.offsetLeft), (c = i.offsetTop));
	}
	const l = ae(r);
	if (l <= 0) {
		const g = r.ownerDocument,
			u = g.body,
			p = getComputedStyle(u),
			d =
				(g.compatMode === 'CSS1Compat' &&
					parseFloat(p.marginLeft) + parseFloat(p.marginRight)) ||
				0,
			f = Math.abs(r.clientWidth - u.clientWidth - d);
		f <= an && (s -= f);
	} else l <= an && (s += l);
	return { width: s, height: o, x: a, y: c };
}
const io = new Set(['absolute', 'fixed']);
function oo(e, t) {
	const n = bt(e, !0, t === 'fixed'),
		r = n.top + e.clientTop,
		i = n.left + e.clientLeft,
		s = at(e) ? Ot(e) : ot(1),
		o = e.clientWidth * s.x,
		a = e.clientHeight * s.y,
		c = i * s.x,
		l = r * s.y;
	return { width: o, height: a, x: c, y: l };
}
function cn(e, t, n) {
	let r;
	if (t === 'viewport') r = ro(e, n);
	else if (t === 'document') r = no(ct(e));
	else if (et(t)) r = oo(t, n);
	else {
		const i = _n(e);
		r = { x: t.x - i.x, y: t.y - i.y, width: t.width, height: t.height };
	}
	return $t(r);
}
function Vn(e, t) {
	const n = pt(e);
	return n === t || !et(n) || Pt(n) ? !1 : nt(n).position === 'fixed' || Vn(n, t);
}
function so(e, t) {
	const n = t.get(e);
	if (n) return n;
	let r = kt(e, [], !1).filter((a) => et(a) && Et(a) !== 'body'),
		i = null;
	const s = nt(e).position === 'fixed';
	let o = s ? pt(e) : e;
	for (; et(o) && !Pt(o); ) {
		const a = nt(o),
			c = _e(o);
		(!c && a.position === 'fixed' && (i = null),
			(
				s
					? !c && !i
					: (!c && a.position === 'static' && !!i && io.has(i.position)) ||
						(zt(o) && !c && Vn(e, o))
			)
				? (r = r.filter((g) => g !== o))
				: (i = a),
			(o = pt(o)));
	}
	return (t.set(e, r), r);
}
function ao(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e;
	const o = [...(n === 'clippingAncestors' ? (oe(t) ? [] : so(t, this._c)) : [].concat(n)), r],
		a = o[0],
		c = o.reduce(
			(l, g) => {
				const u = cn(t, g, i);
				return (
					(l.top = q(u.top, l.top)),
					(l.right = gt(u.right, l.right)),
					(l.bottom = gt(u.bottom, l.bottom)),
					(l.left = q(u.left, l.left)),
					l
				);
			},
			cn(t, a, i)
		);
	return { width: c.right - c.left, height: c.bottom - c.top, x: c.left, y: c.top };
}
function co(e) {
	const { width: t, height: n } = Ln(e);
	return { width: t, height: n };
}
function lo(e, t, n) {
	const r = at(t),
		i = ct(t),
		s = n === 'fixed',
		o = bt(e, !0, s, t);
	let a = { scrollLeft: 0, scrollTop: 0 };
	const c = ot(0);
	function l() {
		c.x = ae(i);
	}
	if (r || (!r && !s))
		if (((Et(t) !== 'body' || zt(i)) && (a = se(t)), r)) {
			const d = bt(t, !0, s, t);
			((c.x = d.x + t.clientLeft), (c.y = d.y + t.clientTop));
		} else i && l();
	s && !r && i && l();
	const g = i && !r && !s ? Wn(i, a) : ot(0),
		u = o.left + a.scrollLeft - c.x - g.x,
		p = o.top + a.scrollTop - c.y - g.y;
	return { x: u, y: p, width: o.width, height: o.height };
}
function fe(e) {
	return nt(e).position === 'static';
}
function ln(e, t) {
	if (!at(e) || nt(e).position === 'fixed') return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return (ct(e) === n && (n = n.ownerDocument.body), n);
}
function zn(e, t) {
	const n = X(e);
	if (oe(e)) return n;
	if (!at(e)) {
		let i = pt(e);
		for (; i && !Pt(i); ) {
			if (et(i) && !fe(i)) return i;
			i = pt(i);
		}
		return n;
	}
	let r = ln(e, t);
	for (; r && Yi(r) && fe(r); ) r = ln(r, t);
	return r && Pt(r) && fe(r) && !_e(r) ? n : r || Gi(e) || n;
}
const uo = async function (e) {
	const t = this.getOffsetParent || zn,
		n = this.getDimensions,
		r = await n(e.floating);
	return {
		reference: lo(e.reference, await t(e.floating), e.strategy),
		floating: { x: 0, y: 0, width: r.width, height: r.height }
	};
};
function fo(e) {
	return nt(e).direction === 'rtl';
}
const ho = {
	convertOffsetParentRelativeRectToViewportRelativeRect: to,
	getDocumentElement: ct,
	getClippingRect: ao,
	getOffsetParent: zn,
	getElementRects: uo,
	getClientRects: eo,
	getDimensions: co,
	getScale: Ot,
	isElement: et,
	isRTL: fo
};
function Hn(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function go(e, t) {
	let n = null,
		r;
	const i = ct(e);
	function s() {
		var a;
		(clearTimeout(r), (a = n) == null || a.disconnect(), (n = null));
	}
	function o(a, c) {
		(a === void 0 && (a = !1), c === void 0 && (c = 1), s());
		const l = e.getBoundingClientRect(),
			{ left: g, top: u, width: p, height: d } = l;
		if ((a || t(), !p || !d)) return;
		const f = Ut(u),
			v = Ut(i.clientWidth - (g + p)),
			y = Ut(i.clientHeight - (u + d)),
			b = Ut(g),
			x = {
				rootMargin: -f + 'px ' + -v + 'px ' + -y + 'px ' + -b + 'px',
				threshold: q(0, gt(1, c)) || 1
			};
		let P = !0;
		function C(D) {
			const E = D[0].intersectionRatio;
			if (E !== c) {
				if (!P) return o();
				E
					? o(!1, E)
					: (r = setTimeout(() => {
							o(!1, 1e-7);
						}, 1e3));
			}
			(E === 1 && !Hn(l, e.getBoundingClientRect()) && o(), (P = !1));
		}
		try {
			n = new IntersectionObserver(C, { ...x, root: i.ownerDocument });
		} catch {
			n = new IntersectionObserver(C, x);
		}
		n.observe(e);
	}
	return (o(!0), s);
}
function po(e, t, n, r) {
	r === void 0 && (r = {});
	const {
			ancestorScroll: i = !0,
			ancestorResize: s = !0,
			elementResize: o = typeof ResizeObserver == 'function',
			layoutShift: a = typeof IntersectionObserver == 'function',
			animationFrame: c = !1
		} = r,
		l = Ve(e),
		g = i || s ? [...(l ? kt(l) : []), ...kt(t)] : [];
	g.forEach((b) => {
		(i && b.addEventListener('scroll', n, { passive: !0 }),
			s && b.addEventListener('resize', n));
	});
	const u = l && a ? go(l, n) : null;
	let p = -1,
		d = null;
	o &&
		((d = new ResizeObserver((b) => {
			let [A] = b;
			(A &&
				A.target === l &&
				d &&
				(d.unobserve(t),
				cancelAnimationFrame(p),
				(p = requestAnimationFrame(() => {
					var x;
					(x = d) == null || x.observe(t);
				}))),
				n());
		})),
		l && !c && d.observe(l),
		d.observe(t));
	let f,
		v = c ? bt(e) : null;
	c && y();
	function y() {
		const b = bt(e);
		(v && !Hn(v, b) && n(), (v = b), (f = requestAnimationFrame(y)));
	}
	return (
		n(),
		() => {
			var b;
			(g.forEach((A) => {
				(i && A.removeEventListener('scroll', n), s && A.removeEventListener('resize', n));
			}),
				u?.(),
				(b = d) == null || b.disconnect(),
				(d = null),
				c && cancelAnimationFrame(f));
		}
	);
}
const mo = Wi,
	vo = Vi,
	wo = Bi,
	yo = Hi,
	bo = Li,
	xo = Ni,
	So = zi,
	Oo = (e, t, n) => {
		const r = new Map(),
			i = { platform: ho, ...n },
			s = { ...i.platform, _c: r };
		return Mi(e, t, { ...i, platform: s });
	};
function wt(e) {
	return typeof e == 'function' ? e() : e;
}
function Kn(e) {
	return typeof window > 'u' ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function un(e, t) {
	const n = Kn(e);
	return Math.round(t * n) / n;
}
function Zo(e) {
	return {
		[`--bits-${e}-content-transform-origin`]: 'var(--bits-floating-transform-origin)',
		[`--bits-${e}-content-available-width`]: 'var(--bits-floating-available-width)',
		[`--bits-${e}-content-available-height`]: 'var(--bits-floating-available-height)',
		[`--bits-${e}-anchor-width`]: 'var(--bits-floating-anchor-width)',
		[`--bits-${e}-anchor-height`]: 'var(--bits-floating-anchor-height)'
	};
}
function Ao(e) {
	const t = e.whileElementsMounted,
		n = O(() => wt(e.open) ?? !0),
		r = O(() => wt(e.middleware)),
		i = O(() => wt(e.transform) ?? !0),
		s = O(() => wt(e.placement) ?? 'bottom'),
		o = O(() => wt(e.strategy) ?? 'absolute'),
		a = O(() => wt(e.sideOffset) ?? 0),
		c = O(() => wt(e.alignOffset) ?? 0),
		l = e.reference;
	let g = I(0),
		u = I(0);
	const p = lt(null);
	let d = I(le(h(o))),
		f = I(le(h(s))),
		v = I(le({})),
		y = I(!1);
	const b = O(() => {
		const E = p.current ? un(p.current, h(g)) : h(g),
			M = p.current ? un(p.current, h(u)) : h(u);
		return h(i)
			? {
					position: h(d),
					left: '0',
					top: '0',
					transform: `translate(${E}px, ${M}px)`,
					...(p.current && Kn(p.current) >= 1.5 && { willChange: 'transform' })
				}
			: { position: h(d), left: `${E}px`, top: `${M}px` };
	});
	let A;
	function x() {
		l.current === null ||
			p.current === null ||
			Oo(l.current, p.current, { middleware: h(r), placement: h(s), strategy: h(o) }).then(
				(E) => {
					if (!h(n) && h(g) !== 0 && h(u) !== 0) {
						const M = Math.max(Math.abs(h(a)), Math.abs(h(c)), 15);
						if (E.x <= M && E.y <= M) return;
					}
					(S(g, E.x, !0),
						S(u, E.y, !0),
						S(d, E.strategy, !0),
						S(f, E.placement, !0),
						S(v, E.middlewareData, !0),
						S(y, !0));
				}
			);
	}
	function P() {
		typeof A == 'function' && (A(), (A = void 0));
	}
	function C() {
		if ((P(), t === void 0)) {
			x();
			return;
		}
		l.current === null || p.current === null || (A = t(l.current, p.current, x));
	}
	function D() {
		h(n) || S(y, !1);
	}
	return (
		rt(x),
		rt(C),
		rt(D),
		rt(() => P),
		{
			floating: p,
			reference: l,
			get strategy() {
				return h(d);
			},
			get placement() {
				return h(f);
			},
			get middlewareData() {
				return h(v);
			},
			get isPositioned() {
				return h(y);
			},
			get floatingStyles() {
				return h(b);
			},
			get update() {
				return x;
			}
		}
	);
}
const Po = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
	ze = new _t('Floating.Root'),
	ye = new _t('Floating.Content'),
	He = new _t('Floating.Root');
class te {
	static create(t = !1) {
		return t ? He.set(new te()) : ze.set(new te());
	}
	anchorNode = lt(null);
	customAnchorNode = lt(null);
	triggerNode = lt(null);
	constructor() {
		rt(() => {
			this.customAnchorNode.current
				? typeof this.customAnchorNode.current == 'string'
					? (this.anchorNode.current = document.querySelector(
							this.customAnchorNode.current
						))
					: (this.anchorNode.current = this.customAnchorNode.current)
				: (this.anchorNode.current = this.triggerNode.current);
		});
	}
}
class ee {
	static create(t, n = !1) {
		return n ? ye.set(new ee(t, He.get())) : ye.set(new ee(t, ze.get()));
	}
	opts;
	root;
	contentRef = lt(null);
	wrapperRef = lt(null);
	arrowRef = lt(null);
	contentAttachment = ut(this.contentRef);
	wrapperAttachment = ut(this.wrapperRef);
	arrowAttachment = ut(this.arrowRef);
	arrowId = lt(Me());
	#t = O(() => {
		if (typeof this.opts.style == 'string') return lr(this.opts.style);
		if (!this.opts.style) return {};
	});
	#e = void 0;
	#n = new Mr(() => this.arrowRef.current ?? void 0);
	#r = O(() => this.#n?.width ?? 0);
	#i = O(() => this.#n?.height ?? 0);
	#o = O(
		() =>
			this.opts.side?.current +
			(this.opts.align.current !== 'center' ? `-${this.opts.align.current}` : '')
	);
	#a = O(() =>
		Array.isArray(this.opts.collisionBoundary.current)
			? this.opts.collisionBoundary.current
			: [this.opts.collisionBoundary.current]
	);
	#s = O(() => h(this.#a).length > 0);
	get hasExplicitBoundaries() {
		return h(this.#s);
	}
	set hasExplicitBoundaries(t) {
		S(this.#s, t);
	}
	#c = O(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: h(this.#a).filter(ur),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return h(this.#c);
	}
	set detectOverflowOptions(t) {
		S(this.#c, t);
	}
	#d = I(void 0);
	#u = I(void 0);
	#l = I(void 0);
	#h = I(void 0);
	#g = O(() =>
		[
			mo({
				mainAxis: this.opts.sideOffset.current + h(this.#i),
				alignmentAxis: this.opts.alignOffset.current
			}),
			this.opts.avoidCollisions.current &&
				vo({
					mainAxis: !0,
					crossAxis: !1,
					limiter: this.opts.sticky.current === 'partial' ? So() : void 0,
					...this.detectOverflowOptions
				}),
			this.opts.avoidCollisions.current && wo({ ...this.detectOverflowOptions }),
			yo({
				...this.detectOverflowOptions,
				apply: ({ rects: t, availableWidth: n, availableHeight: r }) => {
					const { width: i, height: s } = t.reference;
					(S(this.#d, n, !0), S(this.#u, r, !0), S(this.#l, i, !0), S(this.#h, s, !0));
				}
			}),
			this.arrowRef.current &&
				xo({ element: this.arrowRef.current, padding: this.opts.arrowPadding.current }),
			Co({ arrowWidth: h(this.#r), arrowHeight: h(this.#i) }),
			this.opts.hideWhenDetached.current &&
				bo({ strategy: 'referenceHidden', ...this.detectOverflowOptions })
		].filter(Boolean)
	);
	get middleware() {
		return h(this.#g);
	}
	set middleware(t) {
		S(this.#g, t);
	}
	floating;
	#p = O(() => Eo(this.floating.placement));
	get placedSide() {
		return h(this.#p);
	}
	set placedSide(t) {
		S(this.#p, t);
	}
	#m = O(() => To(this.floating.placement));
	get placedAlign() {
		return h(this.#m);
	}
	set placedAlign(t) {
		S(this.#m, t);
	}
	#f = O(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return h(this.#f);
	}
	set arrowX(t) {
		S(this.#f, t);
	}
	#v = O(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return h(this.#v);
	}
	set arrowY(t) {
		S(this.#v, t);
	}
	#w = O(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return h(this.#w);
	}
	set cannotCenterArrow(t) {
		S(this.#w, t);
	}
	#y = I();
	get contentZIndex() {
		return h(this.#y);
	}
	set contentZIndex(t) {
		S(this.#y, t, !0);
	}
	#b = O(() => Po[this.placedSide]);
	get arrowBaseSide() {
		return h(this.#b);
	}
	set arrowBaseSide(t) {
		S(this.#b, t);
	}
	#x = O(() => ({
		id: this.opts.wrapperId.current,
		'data-bits-floating-content-wrapper': '',
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned
				? this.floating.floatingStyles.transform
				: 'translate(0, -200%)',
			minWidth: 'max-content',
			zIndex: this.contentZIndex,
			'--bits-floating-transform-origin': `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			'--bits-floating-available-width': `${h(this.#d)}px`,
			'--bits-floating-available-height': `${h(this.#u)}px`,
			'--bits-floating-anchor-width': `${h(this.#l)}px`,
			'--bits-floating-anchor-height': `${h(this.#h)}px`,
			...(this.floating.middlewareData.hide?.referenceHidden && {
				visibility: 'hidden',
				'pointer-events': 'none'
			}),
			...h(this.#t)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return h(this.#x);
	}
	set wrapperProps(t) {
		S(this.#x, t);
	}
	#S = O(() => ({
		'data-side': this.placedSide,
		'data-align': this.placedAlign,
		style: dr({ ...h(this.#t) }),
		...this.contentAttachment
	}));
	get props() {
		return h(this.#S);
	}
	set props(t) {
		S(this.#S, t);
	}
	#O = O(() => ({
		position: 'absolute',
		left: this.arrowX ? `${this.arrowX}px` : void 0,
		top: this.arrowY ? `${this.arrowY}px` : void 0,
		[this.arrowBaseSide]: 0,
		'transform-origin': { top: '', right: '0 0', bottom: 'center 0', left: '100% 0' }[
			this.placedSide
		],
		transform: {
			top: 'translateY(100%)',
			right: 'translateY(50%) rotate(90deg) translateX(-50%)',
			bottom: 'rotate(180deg)',
			left: 'translateY(50%) rotate(-90deg) translateX(50%)'
		}[this.placedSide],
		visibility: this.cannotCenterArrow ? 'hidden' : void 0
	}));
	get arrowStyle() {
		return h(this.#O);
	}
	set arrowStyle(t) {
		S(this.#O, t);
	}
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			t.customAnchor && (this.root.customAnchorNode.current = t.customAnchor.current),
			tt(
				() => t.customAnchor.current,
				(r) => {
					this.root.customAnchorNode.current = r;
				}
			),
			(this.floating = Ao({
				strategy: () => this.opts.strategy.current,
				placement: () => h(this.#o),
				middleware: () => this.middleware,
				reference: this.root.anchorNode,
				whileElementsMounted: (...r) =>
					po(...r, { animationFrame: this.#e?.current === 'always' }),
				open: () => this.opts.enabled.current,
				sideOffset: () => this.opts.sideOffset.current,
				alignOffset: () => this.opts.alignOffset.current
			})),
			rt(() => {
				this.floating.isPositioned && this.opts.onPlaced?.current();
			}),
			tt(
				() => this.contentRef.current,
				(r) => {
					if (!r) return;
					const i = mn(r);
					this.contentZIndex = i.getComputedStyle(r).zIndex;
				}
			),
			rt(() => {
				this.floating.floating.current = this.wrapperRef.current;
			}));
	}
}
class Un {
	static create(t) {
		return new Un(t, ye.get());
	}
	opts;
	content;
	constructor(t, n) {
		((this.opts = t), (this.content = n));
	}
	#t = O(() => ({
		id: this.opts.id.current,
		style: this.content.arrowStyle,
		'data-side': this.content.placedSide,
		...this.content.arrowAttachment
	}));
	get props() {
		return h(this.#t);
	}
	set props(t) {
		S(this.#t, t);
	}
}
class ne {
	static create(t, n = !1) {
		return n ? new ne(t, He.get()) : new ne(t, ze.get());
	}
	opts;
	root;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			t.virtualEl && t.virtualEl.current
				? (n.triggerNode = cr(t.virtualEl.current))
				: (n.triggerNode = t.ref));
	}
}
function Co(e) {
	return {
		name: 'transformOrigin',
		options: e,
		fn(t) {
			const { placement: n, rects: r, middlewareData: i } = t,
				o = i.arrow?.centerOffset !== 0,
				a = o ? 0 : e.arrowWidth,
				c = o ? 0 : e.arrowHeight,
				[l, g] = Ke(n),
				u = { start: '0%', center: '50%', end: '100%' }[g],
				p = (i.arrow?.x ?? 0) + a / 2,
				d = (i.arrow?.y ?? 0) + c / 2;
			let f = '',
				v = '';
			return (
				l === 'bottom'
					? ((f = o ? u : `${p}px`), (v = `${-c}px`))
					: l === 'top'
						? ((f = o ? u : `${p}px`), (v = `${r.floating.height + c}px`))
						: l === 'right'
							? ((f = `${-c}px`), (v = o ? u : `${d}px`))
							: l === 'left' &&
								((f = `${r.floating.width + c}px`), (v = o ? u : `${d}px`)),
				{ data: { x: f, y: v } }
			);
		}
	};
}
function Ke(e) {
	const [t, n = 'center'] = e.split('-');
	return [t, n];
}
function Eo(e) {
	return Ke(e)[0];
}
function To(e) {
	return Ke(e)[1];
}
function Go(e, t) {
	W(t, !0);
	let n = m(t, 'tooltip', 3, !1);
	te.create(n());
	var r = R(),
		i = F(r);
	(k(i, () => t.children ?? z), T(e, r), V());
}
function Jo(e, t) {
	W(t, !0);
	let n = m(t, 'tooltip', 3, !1);
	ne.create({ id: w(() => t.id), virtualEl: w(() => t.virtualEl), ref: t.ref }, n());
	var r = R(),
		i = F(r);
	(k(i, () => t.children ?? z), T(e, r), V());
}
function Fo(e, t) {
	W(t, !0);
	let n = m(t, 'side', 3, 'bottom'),
		r = m(t, 'sideOffset', 3, 0),
		i = m(t, 'align', 3, 'center'),
		s = m(t, 'alignOffset', 3, 0),
		o = m(t, 'arrowPadding', 3, 0),
		a = m(t, 'avoidCollisions', 3, !0),
		c = m(t, 'collisionBoundary', 19, () => []),
		l = m(t, 'collisionPadding', 3, 0),
		g = m(t, 'hideWhenDetached', 3, !1),
		u = m(t, 'onPlaced', 3, () => {}),
		p = m(t, 'sticky', 3, 'partial'),
		d = m(t, 'updatePositionStrategy', 3, 'optimized'),
		f = m(t, 'strategy', 3, 'fixed'),
		v = m(t, 'dir', 3, 'ltr'),
		y = m(t, 'style', 19, () => ({})),
		b = m(t, 'wrapperId', 19, Me),
		A = m(t, 'customAnchor', 3, null),
		x = m(t, 'tooltip', 3, !1);
	const P = ee.create(
			{
				side: w(() => n()),
				sideOffset: w(() => r()),
				align: w(() => i()),
				alignOffset: w(() => s()),
				id: w(() => t.id),
				arrowPadding: w(() => o()),
				avoidCollisions: w(() => a()),
				collisionBoundary: w(() => c()),
				collisionPadding: w(() => l()),
				hideWhenDetached: w(() => g()),
				onPlaced: w(() => u()),
				sticky: w(() => p()),
				updatePositionStrategy: w(() => d()),
				strategy: w(() => f()),
				dir: w(() => v()),
				style: w(() => y()),
				enabled: w(() => t.enabled),
				wrapperId: w(() => b()),
				customAnchor: w(() => A())
			},
			x()
		),
		C = O(() => $(P.wrapperProps, { style: { pointerEvents: 'auto' } }));
	var D = R(),
		E = F(D);
	(k(
		E,
		() => t.content ?? z,
		() => ({ props: P.props, wrapperProps: h(C) })
	),
		T(e, D),
		V());
}
function Do(e, t) {
	(W(t, !0),
		$n(() => {
			t.onPlaced?.();
		}));
	var n = R(),
		r = F(n);
	(k(
		r,
		() => t.content ?? z,
		() => ({ props: {}, wrapperProps: {} })
	),
		T(e, n),
		V());
}
function Ro(e, t) {
	let n = m(t, 'isStatic', 3, !1),
		r = ht(t, ['$$slots', '$$events', '$$legacy', 'content', 'isStatic', 'onPlaced']);
	var i = R(),
		s = F(i);
	{
		var o = (c) => {
				Do(c, {
					get content() {
						return t.content;
					},
					get onPlaced() {
						return t.onPlaced;
					}
				});
			},
			a = (c) => {
				Fo(
					c,
					yt(
						{
							get content() {
								return t.content;
							},
							get onPlaced() {
								return t.onPlaced;
							}
						},
						() => r
					)
				);
			};
		st(s, (c) => {
			n() ? c(o) : c(a, !1);
		});
	}
	T(e, i);
}
var Io = xt('<!> <!>', 1);
function Yn(e, t) {
	W(t, !0);
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = m(t, 'tooltip', 3, !1),
		c = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'popper',
			'onEscapeKeydown',
			'escapeKeydownBehavior',
			'preventOverflowTextSelection',
			'id',
			'onPointerDown',
			'onPointerUp',
			'side',
			'sideOffset',
			'align',
			'alignOffset',
			'arrowPadding',
			'avoidCollisions',
			'collisionBoundary',
			'collisionPadding',
			'sticky',
			'hideWhenDetached',
			'updatePositionStrategy',
			'strategy',
			'dir',
			'preventScroll',
			'wrapperId',
			'style',
			'onPlaced',
			'onInteractOutside',
			'onCloseAutoFocus',
			'onOpenAutoFocus',
			'onFocusOutside',
			'interactOutsideBehavior',
			'loop',
			'trapFocus',
			'isValidEvent',
			'customAnchor',
			'isStatic',
			'enabled',
			'ref',
			'tooltip'
		]);
	(Ro(e, {
		get isStatic() {
			return o();
		},
		get id() {
			return t.id;
		},
		get side() {
			return t.side;
		},
		get sideOffset() {
			return t.sideOffset;
		},
		get align() {
			return t.align;
		},
		get alignOffset() {
			return t.alignOffset;
		},
		get arrowPadding() {
			return t.arrowPadding;
		},
		get avoidCollisions() {
			return t.avoidCollisions;
		},
		get collisionBoundary() {
			return t.collisionBoundary;
		},
		get collisionPadding() {
			return t.collisionPadding;
		},
		get sticky() {
			return t.sticky;
		},
		get hideWhenDetached() {
			return t.hideWhenDetached;
		},
		get updatePositionStrategy() {
			return t.updatePositionStrategy;
		},
		get strategy() {
			return t.strategy;
		},
		get dir() {
			return t.dir;
		},
		get wrapperId() {
			return t.wrapperId;
		},
		get style() {
			return t.style;
		},
		get onPlaced() {
			return t.onPlaced;
		},
		get customAnchor() {
			return s();
		},
		get enabled() {
			return t.enabled;
		},
		get tooltip() {
			return a();
		},
		content: (g, u) => {
			let p = () => u?.().props,
				d = () => u?.().wrapperProps;
			var f = Io(),
				v = F(f);
			{
				var y = (x) => {
						Gt(x, {
							get preventScroll() {
								return t.preventScroll;
							}
						});
					},
					b = (x) => {
						var P = R(),
							C = F(P);
						{
							var D = (E) => {
								Gt(E, {
									get preventScroll() {
										return t.preventScroll;
									}
								});
							};
							st(
								C,
								(E) => {
									t.forceMount || E(D);
								},
								!0
							);
						}
						T(x, P);
					};
				st(v, (x) => {
					t.forceMount && t.enabled ? x(y) : x(b, !1);
				});
			}
			var A = he(v, 2);
			(Dn(A, {
				get onOpenAutoFocus() {
					return t.onOpenAutoFocus;
				},
				get onCloseAutoFocus() {
					return t.onCloseAutoFocus;
				},
				get loop() {
					return t.loop;
				},
				get enabled() {
					return t.enabled;
				},
				get trapFocus() {
					return r();
				},
				get forceMount() {
					return t.forceMount;
				},
				get ref() {
					return t.ref;
				},
				focusScope: (P, C) => {
					let D = () => C?.().props;
					Sn(P, {
						get onEscapeKeydown() {
							return t.onEscapeKeydown;
						},
						get escapeKeydownBehavior() {
							return t.escapeKeydownBehavior;
						},
						get enabled() {
							return t.enabled;
						},
						get ref() {
							return t.ref;
						},
						children: (E, M) => {
							xn(E, {
								get id() {
									return t.id;
								},
								get onInteractOutside() {
									return t.onInteractOutside;
								},
								get onFocusOutside() {
									return t.onFocusOutside;
								},
								get interactOutsideBehavior() {
									return n();
								},
								get isValidEvent() {
									return i();
								},
								get enabled() {
									return t.enabled;
								},
								get ref() {
									return t.ref;
								},
								children: (N, G) => {
									let K = () => G?.().props;
									Rn(N, {
										get id() {
											return t.id;
										},
										get preventOverflowTextSelection() {
											return t.preventOverflowTextSelection;
										},
										get onPointerDown() {
											return t.onPointerDown;
										},
										get onPointerUp() {
											return t.onPointerUp;
										},
										get enabled() {
											return t.enabled;
										},
										get ref() {
											return t.ref;
										},
										children: (J, B) => {
											var Z = R(),
												Y = F(Z);
											{
												let H = O(() => ({
													props: $(c, p(), K(), D(), {
														style: { pointerEvents: 'auto' }
													}),
													wrapperProps: d()
												}));
												k(
													Y,
													() => t.popper ?? z,
													() => h(H)
												);
											}
											T(J, Z);
										},
										$$slots: { default: !0 }
									});
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { focusScope: !0 }
			}),
				T(g, f));
		},
		$$slots: { content: !0 }
	}),
		V());
}
function Qo(e, t) {
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'popper',
			'open',
			'onEscapeKeydown',
			'escapeKeydownBehavior',
			'preventOverflowTextSelection',
			'id',
			'onPointerDown',
			'onPointerUp',
			'side',
			'sideOffset',
			'align',
			'alignOffset',
			'arrowPadding',
			'avoidCollisions',
			'collisionBoundary',
			'collisionPadding',
			'sticky',
			'hideWhenDetached',
			'updatePositionStrategy',
			'strategy',
			'dir',
			'preventScroll',
			'wrapperId',
			'style',
			'onPlaced',
			'onInteractOutside',
			'onCloseAutoFocus',
			'onOpenAutoFocus',
			'onFocusOutside',
			'interactOutsideBehavior',
			'loop',
			'trapFocus',
			'isValidEvent',
			'customAnchor',
			'isStatic',
			'ref'
		]);
	Se(e, {
		get open() {
			return t.open;
		},
		get ref() {
			return t.ref;
		},
		presence: (l) => {
			Yn(
				l,
				yt(
					{
						get popper() {
							return t.popper;
						},
						get onEscapeKeydown() {
							return t.onEscapeKeydown;
						},
						get escapeKeydownBehavior() {
							return t.escapeKeydownBehavior;
						},
						get preventOverflowTextSelection() {
							return t.preventOverflowTextSelection;
						},
						get id() {
							return t.id;
						},
						get onPointerDown() {
							return t.onPointerDown;
						},
						get onPointerUp() {
							return t.onPointerUp;
						},
						get side() {
							return t.side;
						},
						get sideOffset() {
							return t.sideOffset;
						},
						get align() {
							return t.align;
						},
						get alignOffset() {
							return t.alignOffset;
						},
						get arrowPadding() {
							return t.arrowPadding;
						},
						get avoidCollisions() {
							return t.avoidCollisions;
						},
						get collisionBoundary() {
							return t.collisionBoundary;
						},
						get collisionPadding() {
							return t.collisionPadding;
						},
						get sticky() {
							return t.sticky;
						},
						get hideWhenDetached() {
							return t.hideWhenDetached;
						},
						get updatePositionStrategy() {
							return t.updatePositionStrategy;
						},
						get strategy() {
							return t.strategy;
						},
						get dir() {
							return t.dir;
						},
						get preventScroll() {
							return t.preventScroll;
						},
						get wrapperId() {
							return t.wrapperId;
						},
						get style() {
							return t.style;
						},
						get onPlaced() {
							return t.onPlaced;
						},
						get customAnchor() {
							return s();
						},
						get isStatic() {
							return o();
						},
						get enabled() {
							return t.open;
						},
						get onInteractOutside() {
							return t.onInteractOutside;
						},
						get onCloseAutoFocus() {
							return t.onCloseAutoFocus;
						},
						get onOpenAutoFocus() {
							return t.onOpenAutoFocus;
						},
						get interactOutsideBehavior() {
							return n();
						},
						get loop() {
							return t.loop;
						},
						get trapFocus() {
							return r();
						},
						get isValidEvent() {
							return i();
						},
						get onFocusOutside() {
							return t.onFocusOutside;
						},
						forceMount: !1,
						get ref() {
							return t.ref;
						}
					},
					() => a
				)
			);
		},
		$$slots: { presence: !0 }
	});
}
function $o(e, t) {
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'popper',
			'onEscapeKeydown',
			'escapeKeydownBehavior',
			'preventOverflowTextSelection',
			'id',
			'onPointerDown',
			'onPointerUp',
			'side',
			'sideOffset',
			'align',
			'alignOffset',
			'arrowPadding',
			'avoidCollisions',
			'collisionBoundary',
			'collisionPadding',
			'sticky',
			'hideWhenDetached',
			'updatePositionStrategy',
			'strategy',
			'dir',
			'preventScroll',
			'wrapperId',
			'style',
			'onPlaced',
			'onInteractOutside',
			'onCloseAutoFocus',
			'onOpenAutoFocus',
			'onFocusOutside',
			'interactOutsideBehavior',
			'loop',
			'trapFocus',
			'isValidEvent',
			'customAnchor',
			'isStatic',
			'enabled'
		]);
	Yn(
		e,
		yt(
			{
				get popper() {
					return t.popper;
				},
				get onEscapeKeydown() {
					return t.onEscapeKeydown;
				},
				get escapeKeydownBehavior() {
					return t.escapeKeydownBehavior;
				},
				get preventOverflowTextSelection() {
					return t.preventOverflowTextSelection;
				},
				get id() {
					return t.id;
				},
				get onPointerDown() {
					return t.onPointerDown;
				},
				get onPointerUp() {
					return t.onPointerUp;
				},
				get side() {
					return t.side;
				},
				get sideOffset() {
					return t.sideOffset;
				},
				get align() {
					return t.align;
				},
				get alignOffset() {
					return t.alignOffset;
				},
				get arrowPadding() {
					return t.arrowPadding;
				},
				get avoidCollisions() {
					return t.avoidCollisions;
				},
				get collisionBoundary() {
					return t.collisionBoundary;
				},
				get collisionPadding() {
					return t.collisionPadding;
				},
				get sticky() {
					return t.sticky;
				},
				get hideWhenDetached() {
					return t.hideWhenDetached;
				},
				get updatePositionStrategy() {
					return t.updatePositionStrategy;
				},
				get strategy() {
					return t.strategy;
				},
				get dir() {
					return t.dir;
				},
				get preventScroll() {
					return t.preventScroll;
				},
				get wrapperId() {
					return t.wrapperId;
				},
				get style() {
					return t.style;
				},
				get onPlaced() {
					return t.onPlaced;
				},
				get customAnchor() {
					return s();
				},
				get isStatic() {
					return o();
				},
				get enabled() {
					return t.enabled;
				},
				get onInteractOutside() {
					return t.onInteractOutside;
				},
				get onCloseAutoFocus() {
					return t.onCloseAutoFocus;
				},
				get onOpenAutoFocus() {
					return t.onOpenAutoFocus;
				},
				get interactOutsideBehavior() {
					return n();
				},
				get loop() {
					return t.loop;
				},
				get trapFocus() {
					return r();
				},
				get isValidEvent() {
					return i();
				},
				get onFocusOutside() {
					return t.onFocusOutside;
				}
			},
			() => a,
			{ forceMount: !0 }
		)
	);
}
function ts(e, t) {
	W(t, !0);
	let n = m(t, 'open', 15, !1),
		r = m(t, 'onOpenChange', 3, L),
		i = m(t, 'onOpenChangeComplete', 3, L);
	Oe.create({
		variant: w(() => 'dialog'),
		open: w(
			() => n(),
			(a) => {
				(n(a), r()(a));
			}
		),
		onOpenChangeComplete: w(() => i())
	});
	var s = R(),
		o = F(s);
	(k(o, () => t.children ?? z), T(e, s), V());
}
var ko = xt('<button><!></button>');
function es(e, t) {
	const n = Mt();
	W(t, !0);
	let r = m(t, 'id', 19, () => Wt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'disabled', 3, !1),
		o = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'ref',
			'disabled'
		]);
	const a = Ae.create({
			variant: w(() => 'close'),
			id: w(() => r()),
			ref: w(
				() => i(),
				(d) => i(d)
			),
			disabled: w(() => !!s())
		}),
		c = O(() => $(o, a.props));
	var l = R(),
		g = F(l);
	{
		var u = (d) => {
				var f = R(),
					v = F(f);
				(k(
					v,
					() => t.child,
					() => ({ props: h(c) })
				),
					T(d, f));
			},
			p = (d) => {
				var f = ko();
				Nt(f, () => ({ ...h(c) }));
				var v = Bt(f);
				(k(v, () => t.children ?? z), Lt(f), T(d, f));
			};
		st(g, (d) => {
			t.child ? d(u) : d(p, !1);
		});
	}
	(T(e, l), V());
}
var Mo = xt('<!> <!>', 1),
	No = xt('<!> <div><!></div>', 1);
function ns(e, t) {
	const n = Mt();
	W(t, !0);
	let r = m(t, 'id', 19, () => Wt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'forceMount', 3, !1),
		o = m(t, 'onCloseAutoFocus', 3, L),
		a = m(t, 'onOpenAutoFocus', 3, L),
		c = m(t, 'onEscapeKeydown', 3, L),
		l = m(t, 'onInteractOutside', 3, L),
		g = m(t, 'trapFocus', 3, !0),
		u = m(t, 'preventScroll', 3, !0),
		p = m(t, 'restoreScrollDelay', 3, null),
		d = ht(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'children',
			'child',
			'ref',
			'forceMount',
			'onCloseAutoFocus',
			'onOpenAutoFocus',
			'onEscapeKeydown',
			'onInteractOutside',
			'trapFocus',
			'preventScroll',
			'restoreScrollDelay'
		]);
	const f = Ee.create({
			id: w(() => r()),
			ref: w(
				() => i(),
				(y) => i(y)
			)
		}),
		v = O(() => $(d, f.props));
	{
		const y = (A) => {
			{
				const x = (C, D) => {
					let E = () => D?.().props;
					Sn(
						C,
						yt(() => h(v), {
							get enabled() {
								return f.root.opts.open.current;
							},
							get ref() {
								return f.opts.ref;
							},
							onEscapeKeydown: (M) => {
								(c()(M), !M.defaultPrevented && f.root.handleClose());
							},
							children: (M, j) => {
								xn(
									M,
									yt(() => h(v), {
										get ref() {
											return f.opts.ref;
										},
										get enabled() {
											return f.root.opts.open.current;
										},
										onInteractOutside: (N) => {
											(l()(N), !N.defaultPrevented && f.root.handleClose());
										},
										children: (N, G) => {
											Rn(
												N,
												yt(() => h(v), {
													get ref() {
														return f.opts.ref;
													},
													get enabled() {
														return f.root.opts.open.current;
													},
													children: (K, J) => {
														var B = R(),
															Z = F(B);
														{
															var Y = (_) => {
																	var U = Mo(),
																		mt = F(U);
																	{
																		var Tt = (vt) => {
																			Gt(vt, {
																				get preventScroll() {
																					return u();
																				},
																				get restoreScrollDelay() {
																					return p();
																				}
																			});
																		};
																		st(mt, (vt) => {
																			f.root.opts.open
																				.current && vt(Tt);
																		});
																	}
																	var ce = he(mt, 2);
																	{
																		let vt = O(() => ({
																			props: $(h(v), E()),
																			...f.snippetProps
																		}));
																		k(
																			ce,
																			() => t.child,
																			() => h(vt)
																		);
																	}
																	T(_, U);
																},
																H = (_) => {
																	var U = No(),
																		mt = F(U);
																	Gt(mt, {
																		get preventScroll() {
																			return u();
																		}
																	});
																	var Tt = he(mt, 2);
																	Nt(Tt, (vt) => ({ ...vt }), [
																		() => $(h(v), E())
																	]);
																	var ce = Bt(Tt);
																	(k(ce, () => t.children ?? z),
																		Lt(Tt),
																		T(_, U));
																};
															st(Z, (_) => {
																t.child ? _(Y) : _(H, !1);
															});
														}
														T(K, B);
													},
													$$slots: { default: !0 }
												})
											);
										},
										$$slots: { default: !0 }
									})
								);
							},
							$$slots: { default: !0 }
						})
					);
				};
				let P = O(() =>
					bi({
						forceMount: s(),
						present: f.root.opts.open.current,
						open: f.root.opts.open.current
					})
				);
				Dn(A, {
					get ref() {
						return f.opts.ref;
					},
					loop: !0,
					get trapFocus() {
						return g();
					},
					get enabled() {
						return h(P);
					},
					get onOpenAutoFocus() {
						return a();
					},
					get onCloseAutoFocus() {
						return o();
					},
					focusScope: x,
					$$slots: { focusScope: !0 }
				});
			}
		};
		let b = O(() => f.root.opts.open.current || s());
		Se(
			e,
			yt(() => h(v), {
				get forceMount() {
					return s();
				},
				get open() {
					return h(b);
				},
				get ref() {
					return f.opts.ref;
				},
				presence: y,
				$$slots: { presence: !0 }
			})
		);
	}
	V();
}
function Bo(e) {
	return `/docs/${e}`;
}
function Lo(e) {
	return [...e].sort((t, n) => {
		const r = t.order ?? 1e9,
			i = n.order ?? 1e9;
		return r !== i ? r - i : t.title.localeCompare(n.title);
	});
}
function be(e) {
	return Lo(e).map((t) => ({ title: t.title, href: Bo(t.path), items: [] }));
}
const qn = [
		{ key: 'introduction', title: 'Getting Started', source: fr },
		{ key: 'setup', title: 'Setup', source: hr },
		{ key: 'configuration', title: 'Configuration', source: gr },
		{ key: 'guides', title: 'Guides', source: pr },
		{ key: 'advanced', title: 'Advanced', source: mr },
		{ key: 'troubleshooting', title: 'Troubleshooting', source: vr },
		{ key: 'helpingOut', title: 'Helping Out', source: wr }
	],
	_o = qn.map(({ title: e, source: t }) => ({ title: e, items: be(t) })),
	Wo = {
		title: 'Community',
		items: [
			{ title: 'Demo', href: 'https://demo.pocket-id.org', external: !0, items: [] },
			{ title: 'Discord', href: 'https://discord.gg/8wudU9KaxM', external: !0, items: [] }
		]
	};
_o.push(Wo);
[...qn.flatMap((e) => be(e.source)), ...be(yr)];
const rs = [
	{ href: '/docs', label: 'Docs', title: 'Docs' },
	{ href: '/docs/api', label: 'API Reference', title: 'API Reference' },
	{ href: '/changelog', label: 'Changelog', title: 'Changelog' }
];
export {
	vn as D,
	Un as F,
	Ko as M,
	Br as O,
	$o as P,
	_o as S,
	mn as a,
	Go as b,
	Qo as c,
	Zo as d,
	Jo as e,
	Xo as f,
	Rr as g,
	Yo as h,
	ns as i,
	es as j,
	jo as k,
	Uo as l,
	ts as m,
	wn as n,
	Vt as o,
	qo as p,
	Ar as q,
	rs as r,
	Me as u
};
