import {
	N as Ge,
	au as pt,
	y as ue,
	aj as bt,
	C as T,
	x as l,
	p as M,
	k as d,
	h as v,
	a as u,
	w as V,
	b as i,
	c as I,
	u as D,
	A as b,
	f as k,
	o as G,
	d as F,
	r as K,
	q as z,
	v as L,
	a3 as mt,
	t as ye,
	H as me,
	Z as $,
	am as Ce,
	an as je,
	X as _t,
	Y as yt,
	z as O,
	s as ce,
	a1 as xt,
	n as Pe,
	m as ne,
	g as Oe,
	J as wt,
	K as Ct,
	e as Ee,
	aw as Pt,
	ax as Ot,
	S as We,
	G as Dt
} from '../chunks/ZGPguNnN.js';
import { p as Tt } from '../chunks/BT0mVCPM.js';
import { c as j, r as Ye } from '../chunks/BBPflcbS.js';
import {
	u as Ue,
	F as kt,
	g as St,
	a as At,
	o as Et,
	D as Mt,
	O as It,
	b as Nt,
	P as Ft,
	c as Kt,
	d as Le,
	e as zt,
	M as Ht,
	f as Rt,
	h as Xe,
	i as Bt,
	j as Wt,
	k as Lt,
	l as Gt,
	m as jt,
	S as Yt
} from '../chunks/C00SH7Uv.js';
import {
	a as E,
	s as xe,
	u as ve,
	w as De,
	v as Ut,
	x as Ve,
	j as Xt,
	C as qe,
	y as Je,
	n as Vt,
	k as Qe,
	z as qt,
	l as Ze,
	r as $e
} from '../chunks/L9BR-Aao.js';
function Jt(s) {
	Ge(() => pt(() => s()));
}
const Qt = { afterMs: 1e4, onChange: xe };
function Zt(s, e) {
	const { afterMs: t, onChange: a, getWindow: r } = { ...Qt, ...e };
	let n = null,
		o = ue(bt(s));
	function c() {
		return r().setTimeout(() => {
			(T(o, s, !0), a?.(s));
		}, t);
	}
	return (
		Ge(() => () => {
			n && r().clearTimeout(n);
		}),
		E(
			() => l(o),
			(h) => {
				(T(o, h, !0), a?.(h), n && r().clearTimeout(n), (n = c()));
			}
		)
	);
}
var $t = mt(
		'<svg viewBox="0 0 30 10" preserveAspectRatio="none" data-arrow=""><polygon points="0,0 30,0 15,10" fill="currentColor"></polygon></svg>'
	),
	er = k('<span><!></span>');
function tr(s, e) {
	M(e, !0);
	let t = d(e, 'id', 19, Ue),
		a = d(e, 'width', 3, 10),
		r = d(e, 'height', 3, 5),
		n = z(e, ['$$slots', '$$events', '$$legacy', 'id', 'children', 'child', 'width', 'height']);
	const o = b(() => ve(n, { id: t() }));
	var c = v(),
		h = u(c);
	{
		var g = (x) => {
				var m = v(),
					_ = u(m);
				(D(
					_,
					() => e.child,
					() => ({ props: l(o) })
				),
					i(x, m));
			},
			p = (x) => {
				var m = er();
				G(m, () => ({ ...l(o) }));
				var _ = F(m);
				{
					var S = (w) => {
							var f = v(),
								y = u(f);
							(D(y, () => e.children ?? L), i(w, f));
						},
						A = (w) => {
							var f = $t();
							(ye(() => {
								(me(f, 'width', a()), me(f, 'height', r()));
							}),
								i(w, f));
						};
					V(_, (w) => {
						e.children ? w(S) : w(A, !1);
					});
				}
				(K(m), i(x, m));
			};
		V(h, (x) => {
			e.child ? x(g) : x(p, !1);
		});
	}
	(i(s, c), I());
}
function rr(s, e) {
	M(e, !0);
	let t = d(e, 'id', 19, Ue),
		a = d(e, 'ref', 15, null),
		r = z(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref']);
	const n = kt.create({
			id: E(() => t()),
			ref: E(
				() => a(),
				(c) => a(c)
			)
		}),
		o = b(() => ve(r, n.props));
	(tr(
		s,
		$(() => l(o))
	),
		I());
}
class ar {
	#t;
	#r;
	#e;
	#a = ue(null);
	constructor(e) {
		((this.#t = e),
			(this.#r = b(() => this.#t.enabled())),
			(this.#e = Zt(!1, {
				afterMs: e.transitTimeout ?? 300,
				onChange: (t) => {
					l(this.#r) && this.#t.setIsPointerInTransit?.(t);
				},
				getWindow: () => At(this.#t.triggerNode())
			})),
			De([e.triggerNode, e.contentNode, e.enabled], ([t, a, r]) => {
				if (!t || !a || !r) return;
				const n = (c) => {
						this.#n(c, a);
					},
					o = (c) => {
						this.#n(c, t);
					};
				return Ut(Ce(t, 'pointerleave', n), Ce(a, 'pointerleave', o));
			}),
			De(
				() => l(this.#a),
				() => {
					const t = (r) => {
							if (!l(this.#a)) return;
							const n = r.target;
							if (!Ve(n)) return;
							const o = { x: r.clientX, y: r.clientY },
								c = e.triggerNode()?.contains(n) || e.contentNode()?.contains(n),
								h = !ir(o, l(this.#a));
							c ? this.#s() : h && (this.#s(), e.onPointerExit());
						},
						a = St(e.triggerNode() ?? e.contentNode());
					if (a) return Ce(a, 'pointermove', t);
				}
			));
	}
	#s() {
		(T(this.#a, null), (this.#e.current = !1));
	}
	#n(e, t) {
		const a = e.currentTarget;
		if (!Xt(a)) return;
		const r = { x: e.clientX, y: e.clientY },
			n = sr(r, a.getBoundingClientRect()),
			o = or(r, n),
			c = nr(t.getBoundingClientRect()),
			h = lr([...o, ...c]);
		(T(this.#a, h, !0), (this.#e.current = !0));
	}
}
function sr(s, e) {
	const t = Math.abs(e.top - s.y),
		a = Math.abs(e.bottom - s.y),
		r = Math.abs(e.right - s.x),
		n = Math.abs(e.left - s.x);
	switch (Math.min(t, a, r, n)) {
		case n:
			return 'left';
		case r:
			return 'right';
		case t:
			return 'top';
		case a:
			return 'bottom';
		default:
			throw new Error('unreachable');
	}
}
function or(s, e, t = 5) {
	const a = t * 1.5;
	switch (e) {
		case 'top':
			return [
				{ x: s.x - t, y: s.y + t },
				{ x: s.x, y: s.y - a },
				{ x: s.x + t, y: s.y + t }
			];
		case 'bottom':
			return [
				{ x: s.x - t, y: s.y - t },
				{ x: s.x, y: s.y + a },
				{ x: s.x + t, y: s.y - t }
			];
		case 'left':
			return [
				{ x: s.x + t, y: s.y - t },
				{ x: s.x - a, y: s.y },
				{ x: s.x + t, y: s.y + t }
			];
		case 'right':
			return [
				{ x: s.x - t, y: s.y - t },
				{ x: s.x + a, y: s.y },
				{ x: s.x - t, y: s.y + t }
			];
	}
}
function nr(s) {
	const { top: e, right: t, bottom: a, left: r } = s;
	return [
		{ x: r, y: e },
		{ x: t, y: e },
		{ x: t, y: a },
		{ x: r, y: a }
	];
}
function ir(s, e) {
	const { x: t, y: a } = s;
	let r = !1;
	for (let n = 0, o = e.length - 1; n < e.length; o = n++) {
		const c = e[n].x,
			h = e[n].y,
			g = e[o].x,
			p = e[o].y;
		h > a != p > a && t < ((g - c) * (a - h)) / (p - h) + c && (r = !r);
	}
	return r;
}
function lr(s) {
	const e = s.slice();
	return (
		e.sort((t, a) => (t.x < a.x ? -1 : t.x > a.x ? 1 : t.y < a.y ? -1 : t.y > a.y ? 1 : 0)),
		dr(e)
	);
}
function dr(s) {
	if (s.length <= 1) return s.slice();
	const e = [];
	for (let a = 0; a < s.length; a++) {
		const r = s[a];
		for (; e.length >= 2; ) {
			const n = e[e.length - 1],
				o = e[e.length - 2];
			if ((n.x - o.x) * (r.y - o.y) >= (n.y - o.y) * (r.x - o.x)) e.pop();
			else break;
		}
		e.push(r);
	}
	e.pop();
	const t = [];
	for (let a = s.length - 1; a >= 0; a--) {
		const r = s[a];
		for (; t.length >= 2; ) {
			const n = t[t.length - 1],
				o = t[t.length - 2];
			if ((n.x - o.x) * (r.y - o.y) >= (n.y - o.y) * (r.x - o.x)) t.pop();
			else break;
		}
		t.push(r);
	}
	return (
		t.pop(),
		e.length === 1 && t.length === 1 && e[0].x === t[0].x && e[0].y === t[0].y ? e : e.concat(t)
	);
}
class Me {
	#t;
	#r;
	#e = null;
	constructor(e, t) {
		((this.#r = e),
			(this.#t = t),
			(this.stop = this.stop.bind(this)),
			(this.start = this.start.bind(this)),
			Et(this.stop));
	}
	#a() {
		this.#e !== null && (window.clearTimeout(this.#e), (this.#e = null));
	}
	stop() {
		this.#a();
	}
	start(...e) {
		(this.#a(),
			(this.#e = window.setTimeout(() => {
				((this.#e = null), this.#r(...e));
			}, this.#t)));
	}
}
const et = Vt({ component: 'tooltip', parts: ['content', 'trigger'] }),
	tt = new qe('Tooltip.Provider'),
	Ie = new qe('Tooltip.Root');
class Ne {
	static create(e) {
		return tt.set(new Ne(e));
	}
	opts;
	#t = ue(!0);
	get isOpenDelayed() {
		return l(this.#t);
	}
	set isOpenDelayed(e) {
		T(this.#t, e, !0);
	}
	isPointerInTransit = Je(!1);
	#r;
	#e = ue(null);
	constructor(e) {
		((this.opts = e),
			(this.#r = new Me(() => {
				this.isOpenDelayed = !0;
			}, this.opts.skipDelayDuration.current)));
	}
	#a = () => {
		this.opts.skipDelayDuration.current !== 0 && this.#r.start();
	};
	#s = () => {
		this.#r.stop();
	};
	onOpen = (e) => {
		(l(this.#e) && l(this.#e) !== e && l(this.#e).handleClose(),
			this.#s(),
			(this.isOpenDelayed = !1),
			T(this.#e, e, !0));
	};
	onClose = (e) => {
		(l(this.#e) === e && T(this.#e, null), this.#a());
	};
	isTooltipOpen = (e) => l(this.#e) === e;
}
class Fe {
	static create(e) {
		return Ie.set(new Fe(e, tt.get()));
	}
	opts;
	provider;
	#t = b(() => this.opts.delayDuration.current ?? this.provider.opts.delayDuration.current);
	get delayDuration() {
		return l(this.#t);
	}
	set delayDuration(e) {
		T(this.#t, e);
	}
	#r = b(
		() =>
			this.opts.disableHoverableContent.current ??
			this.provider.opts.disableHoverableContent.current
	);
	get disableHoverableContent() {
		return l(this.#r);
	}
	set disableHoverableContent(e) {
		T(this.#r, e);
	}
	#e = b(
		() =>
			this.opts.disableCloseOnTriggerClick.current ??
			this.provider.opts.disableCloseOnTriggerClick.current
	);
	get disableCloseOnTriggerClick() {
		return l(this.#e);
	}
	set disableCloseOnTriggerClick(e) {
		T(this.#e, e);
	}
	#a = b(() => this.opts.disabled.current ?? this.provider.opts.disabled.current);
	get disabled() {
		return l(this.#a);
	}
	set disabled(e) {
		T(this.#a, e);
	}
	#s = b(
		() =>
			this.opts.ignoreNonKeyboardFocus.current ??
			this.provider.opts.ignoreNonKeyboardFocus.current
	);
	get ignoreNonKeyboardFocus() {
		return l(this.#s);
	}
	set ignoreNonKeyboardFocus(e) {
		T(this.#s, e);
	}
	#n = ue(null);
	get contentNode() {
		return l(this.#n);
	}
	set contentNode(e) {
		T(this.#n, e, !0);
	}
	#l = ue(null);
	get triggerNode() {
		return l(this.#l);
	}
	set triggerNode(e) {
		T(this.#l, e, !0);
	}
	#i = ue(!1);
	#o;
	#d = b(() =>
		this.opts.open.current ? (l(this.#i) ? 'delayed-open' : 'instant-open') : 'closed'
	);
	get stateAttr() {
		return l(this.#d);
	}
	set stateAttr(e) {
		T(this.#d, e);
	}
	constructor(e, t) {
		((this.opts = e),
			(this.provider = t),
			(this.#o = new Me(() => {
				(T(this.#i, !0), (this.opts.open.current = !0));
			}, this.delayDuration ?? 0)),
			new It({
				open: this.opts.open,
				ref: E(() => this.contentNode),
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}),
			De(
				() => this.delayDuration,
				() => {
					this.delayDuration !== void 0 &&
						(this.#o = new Me(() => {
							(T(this.#i, !0), (this.opts.open.current = !0));
						}, this.delayDuration));
				}
			),
			De(
				() => this.opts.open.current,
				(a) => {
					a ? this.provider.onOpen(this) : this.provider.onClose(this);
				},
				{ lazy: !0 }
			));
	}
	handleOpen = () => {
		(this.#o.stop(), T(this.#i, !1), (this.opts.open.current = !0));
	};
	handleClose = () => {
		(this.#o.stop(), (this.opts.open.current = !1));
	};
	#c = () => {
		this.#o.stop();
		const e = !this.provider.isOpenDelayed,
			t = this.delayDuration ?? 0;
		e || t === 0
			? (T(this.#i, t > 0 && e, !0), (this.opts.open.current = !0))
			: this.#o.start();
	};
	onTriggerEnter = () => {
		this.#c();
	};
	onTriggerLeave = () => {
		this.disableHoverableContent ? this.handleClose() : this.#o.stop();
	};
}
class Ke {
	static create(e) {
		return new Ke(e, Ie.get());
	}
	opts;
	root;
	attachment;
	#t = Je(!1);
	#r = ue(!1);
	#e = b(() => this.opts.disabled.current || this.root.disabled);
	domContext;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.domContext = new Mt(e.ref)),
			(this.attachment = Qe(this.opts.ref, (a) => (this.root.triggerNode = a))));
	}
	handlePointerUp = () => {
		this.#t.current = !1;
	};
	#a = () => {
		l(this.#e) || (this.#t.current = !1);
	};
	#s = () => {
		l(this.#e) ||
			((this.#t.current = !0),
			this.domContext.getDocument().addEventListener(
				'pointerup',
				() => {
					this.handlePointerUp();
				},
				{ once: !0 }
			));
	};
	#n = (e) => {
		l(this.#e) ||
			(e.pointerType !== 'touch' &&
				(l(this.#r) ||
					this.root.provider.isPointerInTransit.current ||
					(this.root.onTriggerEnter(), T(this.#r, !0))));
	};
	#l = () => {
		l(this.#e) || (this.root.onTriggerLeave(), T(this.#r, !1));
	};
	#i = (e) => {
		this.#t.current ||
			l(this.#e) ||
			(this.root.ignoreNonKeyboardFocus && !qt(e.currentTarget)) ||
			this.root.handleOpen();
	};
	#o = () => {
		l(this.#e) || this.root.handleClose();
	};
	#d = () => {
		this.root.disableCloseOnTriggerClick || l(this.#e) || this.root.handleClose();
	};
	#c = b(() => ({
		id: this.opts.id.current,
		'aria-describedby': this.root.opts.open.current ? this.root.contentNode?.id : void 0,
		'data-state': this.root.stateAttr,
		'data-disabled': Ze(l(this.#e)),
		'data-delay-duration': `${this.root.delayDuration}`,
		[et.trigger]: '',
		tabindex: l(this.#e) ? void 0 : 0,
		disabled: this.opts.disabled.current,
		onpointerup: this.#a,
		onpointerdown: this.#s,
		onpointermove: this.#n,
		onpointerleave: this.#l,
		onfocus: this.#i,
		onblur: this.#o,
		onclick: this.#d,
		...this.attachment
	}));
	get props() {
		return l(this.#c);
	}
	set props(e) {
		T(this.#c, e);
	}
}
class ze {
	static create(e) {
		return new ze(e, Ie.get());
	}
	opts;
	root;
	attachment;
	constructor(e, t) {
		((this.opts = e),
			(this.root = t),
			(this.attachment = Qe(this.opts.ref, (a) => (this.root.contentNode = a))),
			new ar({
				triggerNode: () => this.root.triggerNode,
				contentNode: () => this.root.contentNode,
				enabled: () => this.root.opts.open.current && !this.root.disableHoverableContent,
				onPointerExit: () => {
					this.root.provider.isTooltipOpen(this.root) && this.root.handleClose();
				},
				setIsPointerInTransit: (a) => {
					this.root.provider.isPointerInTransit.current = a;
				},
				transitTimeout: this.root.provider.opts.skipDelayDuration.current
			}),
			Jt(() =>
				Ce(window, 'scroll', (a) => {
					const r = a.target;
					r && r.contains(this.root.triggerNode) && this.root.handleClose();
				})
			));
	}
	onInteractOutside = (e) => {
		if (
			Ve(e.target) &&
			this.root.triggerNode?.contains(e.target) &&
			this.root.disableCloseOnTriggerClick
		) {
			e.preventDefault();
			return;
		}
		(this.opts.onInteractOutside.current(e), !e.defaultPrevented && this.root.handleClose());
	};
	onEscapeKeydown = (e) => {
		(this.opts.onEscapeKeydown.current?.(e), !e.defaultPrevented && this.root.handleClose());
	};
	onOpenAutoFocus = (e) => {
		e.preventDefault();
	};
	onCloseAutoFocus = (e) => {
		e.preventDefault();
	};
	#t = b(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return l(this.#t);
	}
	set snippetProps(e) {
		T(this.#t, e);
	}
	#r = b(() => ({
		id: this.opts.id.current,
		'data-state': this.root.stateAttr,
		'data-disabled': Ze(this.root.disabled),
		style: { pointerEvents: 'auto', outline: 'none' },
		[et.content]: '',
		...this.attachment
	}));
	get props() {
		return l(this.#r);
	}
	set props(e) {
		T(this.#r, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onOpenAutoFocus: this.onOpenAutoFocus,
		onCloseAutoFocus: this.onCloseAutoFocus
	};
}
function cr(s, e) {
	M(e, !0);
	let t = d(e, 'open', 15, !1),
		a = d(e, 'onOpenChange', 3, xe),
		r = d(e, 'onOpenChangeComplete', 3, xe);
	(Fe.create({
		open: E(
			() => t(),
			(n) => {
				(t(n), a()(n));
			}
		),
		delayDuration: E(() => e.delayDuration),
		disableCloseOnTriggerClick: E(() => e.disableCloseOnTriggerClick),
		disableHoverableContent: E(() => e.disableHoverableContent),
		ignoreNonKeyboardFocus: E(() => e.ignoreNonKeyboardFocus),
		disabled: E(() => e.disabled),
		onOpenChangeComplete: E(() => r())
	}),
		Nt(s, {
			tooltip: !0,
			children: (n, o) => {
				var c = v(),
					h = u(c);
				(D(h, () => e.children ?? L), i(n, c));
			},
			$$slots: { default: !0 }
		}),
		I());
}
var ur = k('<div><div><!></div></div>'),
	hr = k('<div><div><!></div></div>');
function fr(s, e) {
	const t = je();
	M(e, !0);
	let a = d(e, 'id', 19, () => $e(t)),
		r = d(e, 'ref', 15, null),
		n = d(e, 'side', 3, 'top'),
		o = d(e, 'sideOffset', 3, 0),
		c = d(e, 'align', 3, 'center'),
		h = d(e, 'avoidCollisions', 3, !0),
		g = d(e, 'arrowPadding', 3, 0),
		p = d(e, 'sticky', 3, 'partial'),
		x = d(e, 'hideWhenDetached', 3, !1),
		m = d(e, 'collisionPadding', 3, 0),
		_ = d(e, 'onInteractOutside', 3, xe),
		S = d(e, 'onEscapeKeydown', 3, xe),
		A = d(e, 'forceMount', 3, !1),
		w = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'ref',
			'side',
			'sideOffset',
			'align',
			'avoidCollisions',
			'arrowPadding',
			'sticky',
			'strategy',
			'hideWhenDetached',
			'collisionPadding',
			'onInteractOutside',
			'onEscapeKeydown',
			'forceMount'
		]);
	const f = ze.create({
			id: E(() => a()),
			ref: E(
				() => r(),
				(P) => r(P)
			),
			onInteractOutside: E(() => _()),
			onEscapeKeydown: E(() => S())
		}),
		y = b(() => ({
			side: n(),
			sideOffset: o(),
			align: c(),
			avoidCollisions: h(),
			arrowPadding: g(),
			sticky: p(),
			hideWhenDetached: x(),
			collisionPadding: m(),
			strategy: e.strategy
		})),
		H = b(() => ve(w, l(y), f.props));
	var B = v(),
		Y = u(B);
	{
		var N = (P) => {
				Ft(
					P,
					$(
						() => l(H),
						() => f.popperProps,
						{
							get enabled() {
								return f.root.opts.open.current;
							},
							get id() {
								return a();
							},
							trapFocus: !1,
							loop: !1,
							preventScroll: !1,
							forceMount: !0,
							get ref() {
								return f.opts.ref;
							},
							tooltip: !0,
							popper: (R, U) => {
								let ie = () => U?.().props,
									ee = () => U?.().wrapperProps;
								const te = b(() => ve(ie(), { style: Le('tooltip') }));
								var re = v(),
									le = u(re);
								{
									var W = (Z) => {
											var X = v(),
												J = u(X);
											{
												let ae = b(() => ({
													props: l(te),
													wrapperProps: ee(),
													...f.snippetProps
												}));
												D(
													J,
													() => e.child,
													() => l(ae)
												);
											}
											i(Z, X);
										},
										Q = (Z) => {
											var X = ur();
											G(X, () => ({ ...ee() }));
											var J = F(X);
											G(J, () => ({ ...l(te) }));
											var ae = F(J);
											(D(ae, () => e.children ?? L), K(J), K(X), i(Z, X));
										};
									V(le, (Z) => {
										e.child ? Z(W) : Z(Q, !1);
									});
								}
								i(R, re);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			C = (P) => {
				var q = v(),
					R = u(q);
				{
					var U = (ie) => {
						Kt(
							ie,
							$(
								() => l(H),
								() => f.popperProps,
								{
									get open() {
										return f.root.opts.open.current;
									},
									get id() {
										return a();
									},
									trapFocus: !1,
									loop: !1,
									preventScroll: !1,
									forceMount: !1,
									get ref() {
										return f.opts.ref;
									},
									tooltip: !0,
									popper: (te, re) => {
										let le = () => re?.().props,
											W = () => re?.().wrapperProps;
										const Q = b(() => ve(le(), { style: Le('tooltip') }));
										var Z = v(),
											X = u(Z);
										{
											var J = (oe) => {
													var se = v(),
														de = u(se);
													{
														let ge = b(() => ({
															props: l(Q),
															wrapperProps: W(),
															...f.snippetProps
														}));
														D(
															de,
															() => e.child,
															() => l(ge)
														);
													}
													i(oe, se);
												},
												ae = (oe) => {
													var se = hr();
													G(se, () => ({ ...W() }));
													var de = F(se);
													G(de, () => ({ ...l(Q) }));
													var ge = F(de);
													(D(ge, () => e.children ?? L),
														K(de),
														K(se),
														i(oe, se));
												};
											V(X, (oe) => {
												e.child ? oe(J) : oe(ae, !1);
											});
										}
										i(te, Z);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					V(
						R,
						(ie) => {
							A() || ie(U);
						},
						!0
					);
				}
				i(P, q);
			};
		V(Y, (P) => {
			A() ? P(N) : P(C, !1);
		});
	}
	(i(s, B), I());
}
var vr = k('<button><!></button>');
function gr(s, e) {
	const t = je();
	M(e, !0);
	let a = d(e, 'id', 19, () => $e(t)),
		r = d(e, 'disabled', 3, !1),
		n = d(e, 'type', 3, 'button'),
		o = d(e, 'ref', 15, null),
		c = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'disabled',
			'type',
			'ref'
		]);
	const h = Ke.create({
			id: E(() => a()),
			disabled: E(() => r() ?? !1),
			ref: E(
				() => o(),
				(p) => o(p)
			)
		}),
		g = b(() => ve(c, h.props, { type: n() }));
	(zt(s, {
		get id() {
			return a();
		},
		get ref() {
			return h.opts.ref;
		},
		tooltip: !0,
		children: (p, x) => {
			var m = v(),
				_ = u(m);
			{
				var S = (w) => {
						var f = v(),
							y = u(f);
						(D(
							y,
							() => e.child,
							() => ({ props: l(g) })
						),
							i(w, f));
					},
					A = (w) => {
						var f = vr();
						G(f, () => ({ ...l(g) }));
						var y = F(f);
						(D(y, () => e.children ?? L), K(f), i(w, f));
					};
				V(_, (w) => {
					e.child ? w(S) : w(A, !1);
				});
			}
			i(p, m);
		},
		$$slots: { default: !0 }
	}),
		I());
}
function pr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	(rr(
		s,
		$(() => a, {
			get ref() {
				return t();
			},
			set ref(r) {
				t(r);
			}
		})
	),
		I());
}
function br(s, e) {
	M(e, !0);
	let t = d(e, 'delayDuration', 3, 700),
		a = d(e, 'disableCloseOnTriggerClick', 3, !1),
		r = d(e, 'disableHoverableContent', 3, !1),
		n = d(e, 'disabled', 3, !1),
		o = d(e, 'ignoreNonKeyboardFocus', 3, !1),
		c = d(e, 'skipDelayDuration', 3, 300);
	Ne.create({
		delayDuration: E(() => t()),
		disableCloseOnTriggerClick: E(() => a()),
		disableHoverableContent: E(() => r()),
		disabled: E(() => n()),
		ignoreNonKeyboardFocus: E(() => o()),
		skipDelayDuration: E(() => c())
	});
	var h = v(),
		g = u(h);
	(D(g, () => e.children ?? L), i(s, h), I());
}
const mr = 768;
class _r extends Ht {
	constructor(e = mr) {
		super(`max-width: ${e - 1}px`);
	}
}
const yr = 'sidebar:state',
	xr = 3600 * 24 * 7,
	wr = '16rem',
	Cr = '18rem',
	Pr = '3rem',
	Or = 'b';
class Dr {
	props;
	#t = b(() => this.props.open());
	get open() {
		return l(this.#t);
	}
	set open(e) {
		T(this.#t, e);
	}
	#r = ue(!1);
	get openMobile() {
		return l(this.#r);
	}
	set openMobile(e) {
		T(this.#r, e, !0);
	}
	setOpen;
	#e;
	#a = b(() => (this.open ? 'expanded' : 'collapsed'));
	get state() {
		return l(this.#a);
	}
	set state(e) {
		T(this.#a, e);
	}
	constructor(e) {
		((this.setOpen = e.setOpen), (this.#e = new _r()), (this.props = e));
	}
	get isMobile() {
		return this.#e.current;
	}
	handleShortcutKeydown = (e) => {
		e.key === Or && (e.metaKey || e.ctrlKey) && (e.preventDefault(), this.toggle());
	};
	setOpenMobile = (e) => {
		this.openMobile = e;
	};
	toggle = () => {
		this.#e.current ? (this.openMobile = !this.openMobile) : this.setOpen(!this.open);
	};
}
const rt = 'scn-sidebar';
function Tr(s) {
	return yt(Symbol.for(rt), new Dr(s));
}
function at() {
	return _t(Symbol.for(rt));
}
function kr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var r = v(),
		n = u(r);
	{
		let o = b(() =>
			j(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				e.class
			)
		);
		O(
			n,
			() => Rt,
			(c, h) => {
				h(
					c,
					$(
						{
							'data-slot': 'sheet-overlay',
							get class() {
								return l(o);
							}
						},
						() => a,
						{
							get ref() {
								return t();
							},
							set ref(g) {
								t(g);
							}
						}
					)
				);
			}
		);
	}
	(i(s, r), I());
}
const Sr = Ye({
	base: 'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
	variants: {
		side: {
			top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
			bottom: 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
			left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
			right: 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm'
		}
	},
	defaultVariants: { side: 'right' }
});
var Ar = k('<!> <span class="sr-only">Close</span>', 1),
	Er = k('<!> <!>', 1),
	Mr = k('<!> <!>', 1);
function Ir(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = d(e, 'side', 3, 'right'),
		r = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'side',
			'portalProps',
			'children'
		]);
	var n = v(),
		o = u(n);
	(O(
		o,
		() => Xe,
		(c, h) => {
			h(
				c,
				$(() => e.portalProps, {
					children: (g, p) => {
						var x = Mr(),
							m = u(x);
						kr(m, {});
						var _ = ce(m, 2);
						{
							let S = b(() => j(Sr({ side: a() }), e.class));
							O(
								_,
								() => Bt,
								(A, w) => {
									w(
										A,
										$(
											{
												'data-slot': 'sheet-content',
												get class() {
													return l(S);
												}
											},
											() => r,
											{
												get ref() {
													return t();
												},
												set ref(f) {
													t(f);
												},
												children: (f, y) => {
													var H = Er(),
														B = u(H);
													D(B, () => e.children ?? L);
													var Y = ce(B, 2);
													(O(
														Y,
														() => Wt,
														(N, C) => {
															C(N, {
																class: 'ring-offset-background focus-visible:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none',
																children: (P, q) => {
																	var R = Ar(),
																		U = u(R);
																	(xt(U, { class: 'size-4' }),
																		Pe(2),
																		i(P, R));
																},
																$$slots: { default: !0 }
															});
														}
													),
														i(f, H));
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							);
						}
						i(g, x);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		i(s, n),
		I());
}
function Nr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var r = v(),
		n = u(r);
	{
		let o = b(() => j('text-muted-foreground text-sm', e.class));
		O(
			n,
			() => Lt,
			(c, h) => {
				h(
					c,
					$(
						{
							'data-slot': 'sheet-description',
							get class() {
								return l(o);
							}
						},
						() => a,
						{
							get ref() {
								return t();
							},
							set ref(g) {
								t(g);
							}
						}
					)
				);
			}
		);
	}
	(i(s, r), I());
}
var Fr = k('<div><!></div>');
function Kr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = Fr();
	G(r, (o) => ({ 'data-slot': 'sheet-header', class: o, ...a }), [
		() => j('flex flex-col gap-1.5 p-4', e.class)
	]);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
function zr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var r = v(),
		n = u(r);
	{
		let o = b(() => j('text-foreground font-semibold', e.class));
		O(
			n,
			() => Gt,
			(c, h) => {
				h(
					c,
					$(
						{
							'data-slot': 'sheet-title',
							get class() {
								return l(o);
							}
						},
						() => a,
						{
							get ref() {
								return t();
							},
							set ref(g) {
								t(g);
							}
						}
					)
				);
			}
		);
	}
	(i(s, r), I());
}
const Hr = jt;
var Rr = k('<div><!></div>'),
	Br = k('<!> <!>', 1),
	Wr = k('<!> <div class="flex h-full w-full flex-col"><!></div>', 1),
	Lr = k(
		'<div class="text-sidebar-foreground group peer hidden md:block" data-slot="sidebar"><div data-slot="sidebar-gap"></div> <div><div data-sidebar="sidebar" data-slot="sidebar-inner" class="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"><!></div></div></div>'
	);
function Gr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = d(e, 'side', 3, 'left'),
		r = d(e, 'variant', 3, 'sidebar'),
		n = d(e, 'collapsible', 3, 'offcanvas'),
		o = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'side',
			'variant',
			'collapsible',
			'class',
			'children'
		]);
	const c = at();
	var h = v(),
		g = u(h);
	{
		var p = (m) => {
				var _ = Rr();
				G(_, (A) => ({ class: A, ...o }), [
					() =>
						j(
							'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
							e.class
						)
				]);
				var S = F(_);
				(D(S, () => e.children ?? L),
					K(_),
					ne(
						_,
						(A) => t(A),
						() => t()
					),
					i(m, _));
			},
			x = (m) => {
				var _ = v(),
					S = u(_);
				{
					var A = (f) => {
							var y = v(),
								H = u(y),
								B = () => c.openMobile,
								Y = (N) => c.setOpenMobile(N);
							(O(
								H,
								() => Hr,
								(N, C) => {
									C(
										N,
										$(
											{
												get open() {
													return B();
												},
												set open(P) {
													Y(P);
												}
											},
											() => o,
											{
												children: (P, q) => {
													var R = v(),
														U = u(R);
													(O(
														U,
														() => Ir,
														(ie, ee) => {
															ee(ie, {
																'data-sidebar': 'sidebar',
																'data-slot': 'sidebar',
																'data-mobile': 'true',
																class: 'bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden',
																get style() {
																	return `--sidebar-width: ${Cr};`;
																},
																get side() {
																	return a();
																},
																children: (te, re) => {
																	var le = Wr(),
																		W = u(le);
																	O(
																		W,
																		() => Kr,
																		(X, J) => {
																			J(X, {
																				class: 'sr-only',
																				children: (
																					ae,
																					oe
																				) => {
																					var se = Br(),
																						de = u(se);
																					O(
																						de,
																						() => zr,
																						(
																							pe,
																							_e
																						) => {
																							_e(pe, {
																								children:
																									(
																										he,
																										fe
																									) => {
																										Pe();
																										var be =
																											Oe(
																												'Sidebar'
																											);
																										i(
																											he,
																											be
																										);
																									},
																								$$slots:
																									{
																										default:
																											!0
																									}
																							});
																						}
																					);
																					var ge = ce(
																						de,
																						2
																					);
																					(O(
																						ge,
																						() => Nr,
																						(
																							pe,
																							_e
																						) => {
																							_e(pe, {
																								children:
																									(
																										he,
																										fe
																									) => {
																										Pe();
																										var be =
																											Oe(
																												'Displays the mobile sidebar.'
																											);
																										i(
																											he,
																											be
																										);
																									},
																								$$slots:
																									{
																										default:
																											!0
																									}
																							});
																						}
																					),
																						i(ae, se));
																				},
																				$$slots: {
																					default: !0
																				}
																			});
																		}
																	);
																	var Q = ce(W, 2),
																		Z = F(Q);
																	(D(Z, () => e.children ?? L),
																		K(Q),
																		i(te, le));
																},
																$$slots: { default: !0 }
															});
														}
													),
														i(P, R));
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							),
								i(f, y));
						},
						w = (f) => {
							var y = Lr(),
								H = F(y),
								B = ce(H, 2);
							G(B, (C) => ({ 'data-slot': 'sidebar-container', class: C, ...o }), [
								() =>
									j(
										'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
										a() === 'left'
											? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
											: 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
										r() === 'floating' || r() === 'inset'
											? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
											: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
										e.class
									)
							]);
							var Y = F(B),
								N = F(Y);
							(D(N, () => e.children ?? L),
								K(Y),
								K(B),
								K(y),
								ne(
									y,
									(C) => t(C),
									() => t()
								),
								ye(
									(C) => {
										(me(y, 'data-state', c.state),
											me(
												y,
												'data-collapsible',
												c.state === 'collapsed' ? n() : ''
											),
											me(y, 'data-variant', r()),
											me(y, 'data-side', a()),
											Ct(H, 1, C));
									},
									[
										() =>
											wt(
												j(
													'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
													'group-data-[collapsible=offcanvas]:w-0',
													'group-data-[side=right]:rotate-180',
													r() === 'floating' || r() === 'inset'
														? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
														: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
												)
											)
									]
								),
								i(f, y));
						};
					V(
						S,
						(f) => {
							c.isMobile ? f(A) : f(w, !1);
						},
						!0
					);
				}
				i(m, _);
			};
		V(g, (m) => {
			n() === 'none' ? m(p) : m(x, !1);
		});
	}
	(i(s, h), I());
}
var jr = k('<div><!></div>');
function Yr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = jr();
	G(r, (o) => ({ 'data-slot': 'sidebar-content', 'data-sidebar': 'content', class: o, ...a }), [
		() =>
			j(
				'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
				e.class
			)
	]);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
var Ur = k('<div><!></div>');
function Xr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = Ur();
	G(r, (o) => ({ 'data-slot': 'sidebar-group', 'data-sidebar': 'group', class: o, ...a }), [
		() => j('relative flex w-full min-w-0 flex-col p-2', e.class)
	]);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
var Vr = k('<div><!></div>');
function qr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = Vr();
	G(
		r,
		(o) => ({
			'data-slot': 'sidebar-group-content',
			'data-sidebar': 'group-content',
			class: o,
			...a
		}),
		[() => j('w-full text-sm', e.class)]
	);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
var Jr = k('<div><!></div>');
function Qr(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'children', 'child', 'class']);
	const r = b(() => ({
		class: j(
			'text-sidebar-foreground/70 ring-sidebar-ring outline-hidden flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
			'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
			e.class
		),
		'data-slot': 'sidebar-group-label',
		'data-sidebar': 'group-label',
		...a
	}));
	var n = v(),
		o = u(n);
	{
		var c = (g) => {
				var p = v(),
					x = u(p);
				(D(
					x,
					() => e.child,
					() => ({ props: l(r) })
				),
					i(g, p));
			},
			h = (g) => {
				var p = Jr();
				G(p, () => ({ ...l(r) }));
				var x = F(p);
				(D(x, () => e.children ?? L),
					K(p),
					ne(
						p,
						(m) => t(m),
						() => t()
					),
					i(g, p));
			};
		V(o, (g) => {
			e.child ? g(c) : g(h, !1);
		});
	}
	(i(s, n), I());
}
var Zr = k('<ul><!></ul>');
function $r(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = Zr();
	G(r, (o) => ({ 'data-slot': 'sidebar-menu', 'data-sidebar': 'menu', class: o, ...a }), [
		() => j('flex w-full min-w-0 flex-col gap-1', e.class)
	]);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
var ea = k('<div></div>'),
	ta = k('<!> <!>', 1);
function ra(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = d(e, 'sideOffset', 3, 0),
		r = d(e, 'side', 3, 'top'),
		n = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'sideOffset',
			'side',
			'children',
			'arrowClasses'
		]);
	var o = v(),
		c = u(o);
	(O(
		c,
		() => Xe,
		(h, g) => {
			g(h, {
				children: (p, x) => {
					var m = v(),
						_ = u(m);
					{
						let S = b(() =>
							j(
								'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--bits-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
								e.class
							)
						);
						O(
							_,
							() => fr,
							(A, w) => {
								w(
									A,
									$(
										{
											'data-slot': 'tooltip-content',
											get sideOffset() {
												return a();
											},
											get side() {
												return r();
											},
											get class() {
												return l(S);
											}
										},
										() => n,
										{
											get ref() {
												return t();
											},
											set ref(f) {
												t(f);
											},
											children: (f, y) => {
												var H = ta(),
													B = u(H);
												D(B, () => e.children ?? L);
												var Y = ce(B, 2);
												{
													const N = (C, P) => {
														let q = () => P?.().props;
														var R = ea();
														(G(R, (U) => ({ class: U, ...q() }), [
															() =>
																j(
																	'bg-primary z-50 size-2.5 rotate-45 rounded-[2px]',
																	'data-[side=top]:translate-x-1/2 data-[side=top]:translate-y-[calc(-50%_+_2px)]',
																	'data-[side=bottom]:-translate-x-1/2 data-[side=bottom]:-translate-y-[calc(-50%_+_1px)]',
																	'data-[side=right]:translate-x-[calc(50%_+_2px)] data-[side=right]:translate-y-1/2',
																	'data-[side=left]:-translate-y-[calc(50%_-_3px)]',
																	e.arrowClasses
																)
														]),
															i(C, R));
													};
													O(
														Y,
														() => pr,
														(C, P) => {
															P(C, {
																child: N,
																$$slots: { child: !0 }
															});
														}
													);
												}
												i(f, H);
											},
											$$slots: { default: !0 }
										}
									)
								);
							}
						);
					}
					i(p, m);
				},
				$$slots: { default: !0 }
			});
		}
	),
		i(s, o),
		I());
}
function aa(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	var r = v(),
		n = u(r);
	(O(
		n,
		() => gr,
		(o, c) => {
			c(
				o,
				$({ 'data-slot': 'tooltip-trigger' }, () => a, {
					get ref() {
						return t();
					},
					set ref(h) {
						t(h);
					}
				})
			);
		}
	),
		i(s, r),
		I());
}
const sa = cr,
	oa = br,
	na = Ye({
		base: 'peer/menu-button outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
		variants: {
			variant: {
				default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				outline:
					'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]'
			},
			size: {
				default: 'h-8 text-sm',
				sm: 'h-7 text-xs',
				lg: 'group-data-[collapsible=icon]:p-0! h-12 text-sm'
			}
		},
		defaultVariants: { variant: 'default', size: 'default' }
	});
var ia = k('<button><!></button>'),
	la = k('<!> <!>', 1);
function da(s, e) {
	M(e, !0);
	const t = (S, A) => {
		let w = () => A?.().props;
		const f = b(() => ve(l(g), w()));
		var y = v(),
			H = u(y);
		{
			var B = (N) => {
					var C = v(),
						P = u(C);
					(D(
						P,
						() => e.child,
						() => ({ props: l(f) })
					),
						i(N, C));
				},
				Y = (N) => {
					var C = ia();
					G(C, () => ({ ...l(f) }));
					var P = F(C);
					(D(P, () => e.children ?? L),
						K(C),
						ne(
							C,
							(q) => a(q),
							() => a()
						),
						i(N, C));
				};
			V(H, (N) => {
				e.child ? N(B) : N(Y, !1);
			});
		}
		i(S, y);
	};
	let a = d(e, 'ref', 15, null),
		r = d(e, 'variant', 3, 'default'),
		n = d(e, 'size', 3, 'default'),
		o = d(e, 'isActive', 3, !1),
		c = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'children',
			'child',
			'variant',
			'size',
			'isActive',
			'tooltipContent',
			'tooltipContentProps'
		]);
	const h = at(),
		g = b(() => ({
			class: j(na({ variant: r(), size: n() }), e.class),
			'data-slot': 'sidebar-menu-button',
			'data-sidebar': 'menu-button',
			'data-size': n(),
			'data-active': o(),
			...c
		}));
	var p = v(),
		x = u(p);
	{
		var m = (S) => {
				t(S, () => ({}));
			},
			_ = (S) => {
				var A = v(),
					w = u(A);
				(O(
					w,
					() => sa,
					(f, y) => {
						y(f, {
							children: (H, B) => {
								var Y = la(),
									N = u(Y);
								{
									const P = (q, R) => {
										let U = () => R?.().props;
										t(q, () => ({ props: U() }));
									};
									O(
										N,
										() => aa,
										(q, R) => {
											R(q, { child: P, $$slots: { child: !0 } });
										}
									);
								}
								var C = ce(N, 2);
								{
									let P = b(() => h.state !== 'collapsed' || h.isMobile);
									O(
										C,
										() => ra,
										(q, R) => {
											R(
												q,
												$(
													{
														side: 'right',
														align: 'center',
														get hidden() {
															return l(P);
														}
													},
													() => e.tooltipContentProps,
													{
														children: (U, ie) => {
															var ee = v(),
																te = u(ee);
															{
																var re = (W) => {
																		var Q = Oe();
																		(ye(() =>
																			Ee(Q, e.tooltipContent)
																		),
																			i(W, Q));
																	},
																	le = (W) => {
																		var Q = v(),
																			Z = u(Q);
																		{
																			var X = (J) => {
																				var ae = v(),
																					oe = u(ae);
																				(D(
																					oe,
																					() =>
																						e.tooltipContent
																				),
																					i(J, ae));
																			};
																			V(
																				Z,
																				(J) => {
																					e.tooltipContent &&
																						J(X);
																				},
																				!0
																			);
																		}
																		i(W, Q);
																	};
																V(te, (W) => {
																	typeof e.tooltipContent ==
																	'string'
																		? W(re)
																		: W(le, !1);
																});
															}
															i(U, ee);
														},
														$$slots: { default: !0 }
													}
												)
											);
										}
									);
								}
								i(H, Y);
							},
							$$slots: { default: !0 }
						});
					}
				),
					i(S, A));
			};
		V(x, (S) => {
			e.tooltipContent ? S(_, !1) : S(m);
		});
	}
	(i(s, p), I());
}
var ca = k('<li><!></li>');
function ua(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = z(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var r = ca();
	G(
		r,
		(o) => ({ 'data-slot': 'sidebar-menu-item', 'data-sidebar': 'menu-item', class: o, ...a }),
		[() => j('group/menu-item relative', e.class)]
	);
	var n = F(r);
	(D(n, () => e.children ?? L),
		K(r),
		ne(
			r,
			(o) => t(o),
			() => t()
		),
		i(s, r),
		I());
}
var ha = k('<div><!></div>');
function fa(s, e) {
	M(e, !0);
	let t = d(e, 'ref', 15, null),
		a = d(e, 'open', 15, !0),
		r = d(e, 'onOpenChange', 3, () => {}),
		n = z(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'open',
			'onOpenChange',
			'class',
			'style',
			'children'
		]);
	const o = Tr({
		open: () => a(),
		setOpen: (g) => {
			(a(g), r()(g), (document.cookie = `${yr}=${a()}; path=/; max-age=${xr}`));
		}
	});
	var c = v();
	Pt('keydown', Ot, function (...g) {
		o.handleShortcutKeydown?.apply(this, g);
	});
	var h = u(c);
	(O(
		h,
		() => oa,
		(g, p) => {
			p(g, {
				delayDuration: 0,
				children: (x, m) => {
					var _ = ha();
					G(
						_,
						(A) => ({
							'data-slot': 'sidebar-wrapper',
							style: `--sidebar-width: ${wr}; --sidebar-width-icon: ${Pr}; ${e.style ?? ''}`,
							class: A,
							...n
						}),
						[
							() =>
								j(
									'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
									e.class
								)
						]
					);
					var S = F(_);
					(D(S, () => e.children ?? L),
						K(_),
						ne(
							_,
							(A) => t(A),
							() => t()
						),
						i(x, _));
				},
				$$slots: { default: !0 }
			});
		}
	),
		i(s, c),
		I());
}
var va = k('<a> <!></a>'),
	ga = k('<!> <!>', 1);
function pa(s, e) {
	M(e, !0);
	let t = z(e, ['$$slots', '$$events', '$$legacy', 'navItems']);
	const a = b(() => Tt.url.pathname);
	var r = v(),
		n = u(r);
	(O(
		n,
		() => Gr,
		(o, c) => {
			c(
				o,
				$(
					{
						class: 'sticky top-16 z-30 hidden h-[calc(100vh-4rem)] bg-transparent lg:flex',
						collapsible: 'none'
					},
					() => t,
					{
						children: (h, g) => {
							var p = v(),
								x = u(p);
							(O(
								x,
								() => Yr,
								(m, _) => {
									_(m, {
										class: 'no-scrollbar overflow-y-auto pb-12',
										children: (S, A) => {
											var w = v(),
												f = u(w);
											(We(
												f,
												17,
												() => e.navItems,
												(y) => y.title,
												(y, H) => {
													var B = v(),
														Y = u(B);
													(O(
														Y,
														() => Xr,
														(N, C) => {
															C(N, {
																children: (P, q) => {
																	var R = ga(),
																		U = u(R);
																	O(
																		U,
																		() => Qr,
																		(ee, te) => {
																			te(ee, {
																				class: 'text-muted-foreground font-medium',
																				children: (
																					re,
																					le
																				) => {
																					Pe();
																					var W = Oe();
																					(ye(() =>
																						Ee(
																							W,
																							l(H)
																								.title
																						)
																					),
																						i(re, W));
																				},
																				$$slots: {
																					default: !0
																				}
																			});
																		}
																	);
																	var ie = ce(U, 2);
																	(O(
																		ie,
																		() => qr,
																		(ee, te) => {
																			te(ee, {
																				children: (
																					re,
																					le
																				) => {
																					var W = v(),
																						Q = u(W);
																					{
																						var Z = (
																							X
																						) => {
																							var J =
																									v(),
																								ae =
																									u(
																										J
																									);
																							(O(
																								ae,
																								() =>
																									$r,
																								(
																									oe,
																									se
																								) => {
																									se(
																										oe,
																										{
																											class: 'gap-0.5',
																											children:
																												(
																													de,
																													ge
																												) => {
																													var pe =
																															v(),
																														_e =
																															u(
																																pe
																															);
																													(We(
																														_e,
																														17,
																														() =>
																															l(
																																H
																															)
																																.items,
																														(
																															he
																														) =>
																															he.href,
																														(
																															he,
																															fe
																														) => {
																															var be =
																																	v(),
																																st =
																																	u(
																																		be
																																	);
																															{
																																var ot =
																																	(
																																		Te
																																	) => {
																																		var He =
																																				v(),
																																			nt =
																																				u(
																																					He
																																				);
																																		(O(
																																			nt,
																																			() =>
																																				ua,
																																			(
																																				it,
																																				lt
																																			) => {
																																				lt(
																																					it,
																																					{
																																						children:
																																							(
																																								dt,
																																								_a
																																							) => {
																																								var Re =
																																										v(),
																																									ct =
																																										u(
																																											Re
																																										);
																																								{
																																									const ut =
																																										(
																																											ke,
																																											Se
																																										) => {
																																											let ft =
																																												() =>
																																													Se?.()
																																														.props;
																																											var we =
																																												va();
																																											G(
																																												we,
																																												() => ({
																																													href: l(
																																														fe
																																													)
																																														.href,
																																													...ft()
																																												})
																																											);
																																											var Be =
																																													F(
																																														we
																																													),
																																												vt =
																																													ce(
																																														Be
																																													);
																																											{
																																												var gt =
																																													(
																																														Ae
																																													) => {
																																														Dt(
																																															Ae,
																																															{
																																																class: 'text-muted-foreground mb-1 inline size-3 align-text-bottom'
																																															}
																																														);
																																													};
																																												V(
																																													vt,
																																													(
																																														Ae
																																													) => {
																																														l(
																																															fe
																																														)
																																															.external &&
																																															Ae(
																																																gt
																																															);
																																													}
																																												);
																																											}
																																											(K(
																																												we
																																											),
																																												ye(
																																													() =>
																																														Ee(
																																															Be,
																																															`${l(fe).title ?? ''} `
																																														)
																																												),
																																												i(
																																													ke,
																																													we
																																												));
																																										};
																																									let ht =
																																										b(
																																											() =>
																																												l(
																																													fe
																																												)
																																													.href ===
																																												l(
																																													a
																																												)
																																										);
																																									O(
																																										ct,
																																										() =>
																																											da,
																																										(
																																											ke,
																																											Se
																																										) => {
																																											Se(
																																												ke,
																																												{
																																													get isActive() {
																																														return l(
																																															ht
																																														);
																																													},
																																													class: 'data-[active=true]:bg-accent data-[active=true]:border-accent 3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md',
																																													child: ut,
																																													$$slots:
																																														{
																																															child: !0
																																														}
																																												}
																																											);
																																										}
																																									);
																																								}
																																								i(
																																									dt,
																																									Re
																																								);
																																							},
																																						$$slots:
																																							{
																																								default:
																																									!0
																																							}
																																					}
																																				);
																																			}
																																		),
																																			i(
																																				Te,
																																				He
																																			));
																																	};
																																V(
																																	st,
																																	(
																																		Te
																																	) => {
																																		l(
																																			fe
																																		)
																																			.items
																																			.length ===
																																			0 &&
																																			Te(
																																				ot
																																			);
																																	}
																																);
																															}
																															i(
																																he,
																																be
																															);
																														}
																													),
																														i(
																															de,
																															pe
																														));
																												},
																											$$slots:
																												{
																													default:
																														!0
																												}
																										}
																									);
																								}
																							),
																								i(
																									X,
																									J
																								));
																						};
																						V(
																							Q,
																							(X) => {
																								l(H)
																									.items
																									.length &&
																									X(
																										Z
																									);
																							}
																						);
																					}
																					i(re, W);
																				},
																				$$slots: {
																					default: !0
																				}
																			});
																		}
																	),
																		i(P, R));
																},
																$$slots: { default: !0 }
															});
														}
													),
														i(y, B));
												}
											),
												i(S, w));
										},
										$$slots: { default: !0 }
									});
								}
							),
								i(h, p));
						},
						$$slots: { default: !0 }
					}
				)
			);
		}
	),
		i(s, r),
		I());
}
var ba = k('<!> <div class="h-full w-full"><!></div>', 1),
	ma = k('<div class="container-wrapper flex flex-1 flex-col px-2"><!></div>');
function Oa(s, e) {
	var t = ma(),
		a = F(t);
	(O(
		a,
		() => fa,
		(r, n) => {
			n(r, {
				class: '3xl:fixed:container 3xl:fixed:px-3 min-h-min flex-1 items-start px-0 [--sidebar-width:220px] [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--sidebar-width:240px] lg:[--top-spacing:calc(var(--spacing)*4)]',
				children: (o, c) => {
					var h = ba(),
						g = u(h);
					pa(g, {
						get navItems() {
							return Yt;
						}
					});
					var p = ce(g, 2),
						x = F(p);
					(D(x, () => e.children), K(p), i(o, h));
				},
				$$slots: { default: !0 }
			});
		}
	),
		K(t),
		i(s, t));
}
export { Oa as component };
