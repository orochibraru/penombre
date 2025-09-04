import './1HBmZ_db.js';
import {
	h as fn,
	d as Cr,
	bd as Er,
	bf as Tr,
	bg as Mr,
	L as Fr,
	N as Nr,
	O as Dr,
	P as Ir,
	Q as _r,
	i as Rr,
	$ as kr,
	R as Br,
	J as D,
	bh as gn,
	aT as Lr,
	u,
	I as b,
	aU as Yt,
	p as I,
	o as T,
	q as P,
	af as k,
	a as A,
	b as _,
	v as x,
	z as at,
	ae as Wr,
	ak as Lt,
	bb as Tt,
	f as nt,
	c as lt,
	r as ut,
	a9 as Kr,
	bc as _n,
	G as Xt,
	K as zr,
	a1 as Ne
} from './BW6z9EX9.js';
import { s as N } from './BC_1JO3s.js';
import { s as U, r as W, p as m } from './Cic-IlSQ.js';
import { I as zt } from './C9yuXBdp.js';
import { i as Q } from './ClaijROu.js';
import { c as ht } from './C-vcVqpF.js';
import { c as yt } from './Bvsacp8G.js';
import { a as ot, r as pn } from './BPMCz5tT.js';
import {
	k as Vr,
	w as X,
	l as me,
	e as w,
	o as _t,
	C as At,
	c as Rn,
	p as ve,
	a as rt,
	S as Qt,
	E as we,
	d as Mt,
	m as et,
	n as z,
	q as Hr,
	r as Ur,
	t as Yr,
	u as qr,
	A as kn,
	P as Gr,
	H as Xr,
	v as jr,
	x as Zr,
	y as Jr,
	f as De,
	z as Qr,
	R as $r,
	T as ti,
	B as ei,
	h as ni,
	D as ri,
	b as mn
} from './VBxAmJ30.js';
import { c as ii } from './DzxQehGt.js';
import { b as Oe } from './Bo6bj8hH.js';
import { o as $, m as oi, u as si } from './DzGRxXYC.js';
import { o as ai } from './BHHl-vxW.js';
function ci(e, t, n) {
	fn && Cr();
	var r = e,
		i = kr,
		s,
		o,
		a = null,
		c = Er() ? Tr : Mr;
	function l() {
		(s && Br(s), a !== null && (a.lastChild.remove(), r.before(a), (a = null)), (s = o));
	}
	(Fr(() => {
		if (c(i, (i = t()))) {
			var h = r,
				d = _r();
			(d && ((a = document.createDocumentFragment()), a.append((h = Nr()))),
				(o = Dr(() => n(h))),
				d ? Ir.add_callback(l) : l());
		}
	}),
		fn && (r = Rr));
}
class li extends Map {
	#t = new Map();
	#e = D(0);
	#n = D(0);
	#r = gn || -1;
	constructor(t) {
		if ((super(), t)) {
			for (var [n, r] of t) super.set(n, r);
			this.#n.v = super.size;
		}
	}
	#i(t) {
		return gn === this.#r ? D(t) : Lr(t);
	}
	has(t) {
		var n = this.#t,
			r = n.get(t);
		if (r === void 0) {
			var i = super.get(t);
			if (i !== void 0) ((r = this.#i(0)), n.set(t, r));
			else return (u(this.#e), !1);
		}
		return (u(r), !0);
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
				u(this.#e);
				return;
			}
		}
		return (u(r), super.get(t));
	}
	set(t, n) {
		var r = this.#t,
			i = r.get(t),
			s = super.get(t),
			o = super.set(t, n),
			a = this.#e;
		if (i === void 0) ((i = this.#i(0)), r.set(t, i), b(this.#n, super.size), Yt(a));
		else if (s !== n) {
			Yt(i);
			var c = a.reactions === null ? null : new Set(a.reactions),
				l = c === null || !i.reactions?.every((h) => c.has(h));
			l && Yt(a);
		}
		return o;
	}
	delete(t) {
		var n = this.#t,
			r = n.get(t),
			i = super.delete(t);
		return (r !== void 0 && (n.delete(t), b(this.#n, super.size), b(r, -1), Yt(this.#e)), i);
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var t = this.#t;
			b(this.#n, 0);
			for (var n of t.values()) b(n, -1);
			(Yt(this.#e), t.clear());
		}
	}
	#o() {
		u(this.#e);
		var t = this.#t;
		if (this.#n.v !== t.size) {
			for (var n of super.keys())
				if (!t.has(n)) {
					var r = this.#i(0);
					t.set(n, r);
				}
		}
		for ([, r] of this.#t) u(r);
	}
	keys() {
		return (u(this.#e), super.keys());
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
		return (u(this.#n), super.size);
	}
}
function Ba(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['circle', { cx: '12', cy: '12', r: '1' }],
		['circle', { cx: '12', cy: '5', r: '1' }],
		['circle', { cx: '12', cy: '19', r: '1' }]
	];
	(zt(
		e,
		U({ name: 'ellipsis-vertical' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function La(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
		['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }]
	];
	(zt(
		e,
		U({ name: 'file' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function Wa(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		[
			'path',
			{
				d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
			}
		]
	];
	(zt(
		e,
		U({ name: 'folder' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function Ka(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		[
			'path',
			{
				d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'
			}
		]
	];
	(zt(
		e,
		U({ name: 'star' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function za(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M3 6h18' }],
		['path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }],
		['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }]
	];
	(zt(
		e,
		U({ name: 'trash' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function ui(e, t) {
	I(t, !0);
	/**
	 * @license @lucide/svelte v0.525.0 - ISC
	 *
	 * ISC License
	 *
	 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
	 *
	 * Permission to use, copy, modify, and/or distribute this software for any
	 * purpose with or without fee is hereby granted, provided that the above
	 * copyright notice and this permission notice appear in all copies.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	 *
	 */ let n = W(t, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M18 6 6 18' }],
		['path', { d: 'm6 6 12 12' }]
	];
	(zt(
		e,
		U({ name: 'x' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (i, s) => {
				var o = T(),
					a = P(o);
				(N(a, () => t.children ?? k), A(i, o));
			},
			$$slots: { default: !0 }
		})
	),
		_());
}
function di(e) {
	return typeof e == 'function';
}
function vn(e) {
	return di(e) ? e() : e;
}
class hi {
	#t = { width: 0, height: 0 };
	#e = !1;
	#n;
	#r;
	#i;
	#o = x(() => (u(this.#s)?.(), this.getSize().width));
	#a = x(() => (u(this.#s)?.(), this.getSize().height));
	#s = x(() => {
		const t = vn(this.#r);
		if (t)
			return ii((n) => {
				if (!this.#i) return;
				const r = new this.#i.ResizeObserver((i) => {
					this.#e = !0;
					for (const s of i) {
						const o = this.#n.box === 'content-box' ? s.contentBoxSize : s.borderBoxSize,
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
		((this.#i = n.window ?? Vr), (this.#n = n), (this.#r = t), (this.#t = { width: 0, height: 0 }));
	}
	calculateSize() {
		const t = vn(this.#r);
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
			h = r - o - c;
		return { width: l, height: h };
	}
	getSize() {
		return this.#e ? this.#t : (this.calculateSize() ?? this.#t);
	}
	get current() {
		return (u(this.#s)?.(), this.getSize());
	}
	get width() {
		return u(this.#o);
	}
	get height() {
		return u(this.#a);
	}
}
class fi {
	#t = D(void 0);
	constructor(t, n) {
		(n !== void 0 && b(this.#t, n, !0),
			X(
				() => t(),
				(r, i) => {
					b(this.#t, i, !0);
				}
			));
	}
	get current() {
		return u(this.#t);
	}
}
function Vt(e) {
	at(() => () => {
		e();
	});
}
function Ie(e, t) {
	return setTimeout(t, e);
}
function bt(e) {
	Wr().then(e);
}
const gi = 1,
	pi = 9,
	mi = 11;
function Pe(e) {
	return me(e) && e.nodeType === gi && typeof e.nodeName == 'string';
}
function Bn(e) {
	return me(e) && e.nodeType === pi;
}
function vi(e) {
	return me(e) && e.constructor?.name === 'VisualViewport';
}
function wi(e) {
	return me(e) && e.nodeType !== void 0;
}
function Ln(e) {
	return wi(e) && e.nodeType === mi && 'host' in e;
}
function bi(e, t) {
	if (!e || !t || !Pe(e) || !Pe(t)) return !1;
	const n = t.getRootNode?.();
	if (e === t || e.contains(t)) return !0;
	if (n && Ln(n)) {
		let r = t;
		for (; r; ) {
			if (e === r) return !0;
			r = r.parentNode || r.host;
		}
	}
	return !1;
}
function $t(e) {
	return Bn(e) ? e : vi(e) ? e.document : (e?.ownerDocument ?? document);
}
function jt(e) {
	return Ln(e)
		? jt(e.host)
		: Bn(e)
			? (e.defaultView ?? window)
			: Pe(e)
				? (e.ownerDocument?.defaultView ?? window)
				: window;
}
function yi(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot; ) {
		const n = t.shadowRoot.activeElement;
		if (n === t) break;
		t = n;
	}
	return t;
}
class _e {
	element;
	#t = x(() =>
		this.element.current ? (this.element.current.getRootNode() ?? document) : document
	);
	get root() {
		return u(this.#t);
	}
	set root(t) {
		b(this.#t, t);
	}
	constructor(t) {
		typeof t == 'function' ? (this.element = w.with(t)) : (this.element = t);
	}
	getDocument = () => $t(this.root);
	getWindow = () => this.getDocument().defaultView ?? window;
	getActiveElement = () => yi(this.root);
	isActiveElement = (t) => t === this.getActiveElement();
	getElementById(t) {
		return this.root.getElementById(t);
	}
	querySelector = (t) => (this.root ? this.root.querySelector(t) : null);
	querySelectorAll = (t) => (this.root ? this.root.querySelectorAll(t) : []);
	setTimeout = (t, n) => this.getWindow().setTimeout(t, n);
	clearTimeout = (t) => this.getWindow().clearTimeout(t);
}
class xi {
	state;
	#t;
	constructor(t, n) {
		((this.state = w(t)), (this.#t = n), (this.dispatch = this.dispatch.bind(this)));
	}
	#e(t) {
		return this.#t[this.state.current][t] ?? this.state.current;
	}
	dispatch(t) {
		this.state.current = this.#e(t);
	}
}
const Si = {
	mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
	unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
	unmounted: { MOUNT: 'mounted' }
};
class Ai {
	opts;
	#t = D('none');
	get prevAnimationNameState() {
		return u(this.#t);
	}
	set prevAnimationNameState(t) {
		b(this.#t, t, !0);
	}
	#e = D(Lt({}));
	get styles() {
		return u(this.#e);
	}
	set styles(t) {
		b(this.#e, t, !0);
	}
	initialStatus;
	previousPresent;
	machine;
	present;
	constructor(t) {
		((this.opts = t),
			(this.present = this.opts.open),
			(this.initialStatus = t.open.current ? 'mounted' : 'unmounted'),
			(this.previousPresent = new fi(() => this.present.current)),
			(this.machine = new xi(this.initialStatus, Si)),
			(this.handleAnimationEnd = this.handleAnimationEnd.bind(this)),
			(this.handleAnimationStart = this.handleAnimationStart.bind(this)),
			Oi(this),
			Pi(this),
			Ci(this));
	}
	handleAnimationEnd(t) {
		if (!this.opts.ref.current) return;
		const n = re(this.opts.ref.current),
			r = n.includes(t.animationName) || n === 'none';
		t.target === this.opts.ref.current && r && this.machine.dispatch('ANIMATION_END');
	}
	handleAnimationStart(t) {
		this.opts.ref.current &&
			t.target === this.opts.ref.current &&
			(this.prevAnimationNameState = re(this.opts.ref.current));
	}
	#n = x(() => ['mounted', 'unmountSuspended'].includes(this.machine.state.current));
	get isPresent() {
		return u(this.#n);
	}
	set isPresent(t) {
		b(this.#n, t);
	}
}
function Oi(e) {
	X(
		() => e.present.current,
		() => {
			if (!e.opts.ref.current || !(e.present.current !== e.previousPresent.current)) return;
			const n = e.prevAnimationNameState,
				r = re(e.opts.ref.current);
			if (e.present.current) e.machine.dispatch('MOUNT');
			else if (r === 'none' || e.styles.display === 'none') e.machine.dispatch('UNMOUNT');
			else {
				const i = n !== r;
				e.previousPresent.current && i
					? e.machine.dispatch('ANIMATION_OUT')
					: e.machine.dispatch('UNMOUNT');
			}
		}
	);
}
function Pi(e) {
	X(
		() => e.machine.state.current,
		() => {
			if (!e.opts.ref.current) return;
			const t = re(e.opts.ref.current);
			e.prevAnimationNameState = e.machine.state.current === 'mounted' ? t : 'none';
		}
	);
}
function Ci(e) {
	X(
		() => e.opts.ref.current,
		() => {
			if (e.opts.ref.current)
				return (
					(e.styles = getComputedStyle(e.opts.ref.current)),
					_t(
						$(e.opts.ref.current, 'animationstart', e.handleAnimationStart),
						$(e.opts.ref.current, 'animationcancel', e.handleAnimationEnd),
						$(e.opts.ref.current, 'animationend', e.handleAnimationEnd)
					)
				);
		}
	);
}
function re(e) {
	return (e && getComputedStyle(e).animationName) || 'none';
}
function Re(e, t) {
	I(t, !0);
	const n = new Ai({ open: w.with(() => t.open), ref: t.ref });
	var r = T(),
		i = P(r);
	{
		var s = (o) => {
			var a = T(),
				c = P(a);
			(N(
				c,
				() => t.presence ?? k,
				() => ({ present: n.isPresent })
			),
				A(o, a));
		};
		Q(i, (o) => {
			(t.forceMount || t.open || n.isPresent) && o(s);
		});
	}
	(A(e, r), _());
}
class Ei {
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
		this.#t.afterTick ? bt(n) : n();
	}
}
class Wn {
	#t;
	#e;
	#n;
	constructor(t) {
		((this.#t = t),
			(this.#e = t.enabled ?? !0),
			(this.#n = new Ei({ ref: this.#t.ref, afterTick: this.#t.open })),
			X([() => this.#t.open.current], ([n]) => {
				this.#e &&
					this.#n.run(() => {
						n === this.#t.open.current && this.#t.onComplete();
					});
			}));
	}
}
const Ti = Rn({
		component: 'dialog',
		parts: ['content', 'trigger', 'overlay', 'title', 'description', 'close', 'cancel', 'action']
	}),
	Ft = new At('Dialog.Root | AlertDialog.Root');
class ke {
	static create(t) {
		return Ft.set(new ke(t));
	}
	opts;
	#t = D(null);
	get triggerNode() {
		return u(this.#t);
	}
	set triggerNode(t) {
		b(this.#t, t, !0);
	}
	#e = D(null);
	get contentNode() {
		return u(this.#e);
	}
	set contentNode(t) {
		b(this.#e, t, !0);
	}
	#n = D(null);
	get descriptionNode() {
		return u(this.#n);
	}
	set descriptionNode(t) {
		b(this.#n, t, !0);
	}
	#r = D(void 0);
	get contentId() {
		return u(this.#r);
	}
	set contentId(t) {
		b(this.#r, t, !0);
	}
	#i = D(void 0);
	get titleId() {
		return u(this.#i);
	}
	set titleId(t) {
		b(this.#i, t, !0);
	}
	#o = D(void 0);
	get triggerId() {
		return u(this.#o);
	}
	set triggerId(t) {
		b(this.#o, t, !0);
	}
	#a = D(void 0);
	get descriptionId() {
		return u(this.#a);
	}
	set descriptionId(t) {
		b(this.#a, t, !0);
	}
	#s = D(null);
	get cancelNode() {
		return u(this.#s);
	}
	set cancelNode(t) {
		b(this.#s, t, !0);
	}
	constructor(t) {
		((this.opts = t),
			(this.handleOpen = this.handleOpen.bind(this)),
			(this.handleClose = this.handleClose.bind(this)),
			new Wn({
				ref: w.with(() => this.contentNode),
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
	getBitsAttr = (t) => Ti.getAttr(t, this.opts.variant.current);
	#c = x(() => ({ 'data-state': ve(this.opts.open.current) }));
	get sharedProps() {
		return u(this.#c);
	}
	set sharedProps(t) {
		b(this.#c, t);
	}
}
class Be {
	static create(t) {
		return new Be(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = rt(this.opts.ref)),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(t) {
		this.opts.disabled.current || t.button > 0 || this.root.handleClose();
	}
	onkeydown(t) {
		this.opts.disabled.current ||
			((t.key === Qt || t.key === we) && (t.preventDefault(), this.root.handleClose()));
	}
	#t = x(() => ({
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
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class Kn {
	static create(t) {
		return new Kn(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t), (this.root = n), (this.attachment = rt(this.opts.ref)));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('action')]: '',
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class Le {
	static create(t) {
		return new Le(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.root.titleId = this.opts.id.current),
			(this.attachment = rt(this.opts.ref)),
			X.pre(
				() => this.opts.id.current,
				(r) => {
					this.root.titleId = r;
				}
			));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		role: 'heading',
		'aria-level': this.opts.level.current,
		[this.root.getBitsAttr('title')]: '',
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class We {
	static create(t) {
		return new We(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.root.descriptionId = this.opts.id.current),
			(this.attachment = rt(this.opts.ref, (r) => {
				this.root.descriptionNode = r;
			})),
			X.pre(
				() => this.opts.id.current,
				(r) => {
					this.root.descriptionId = r;
				}
			));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('description')]: '',
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class Ke {
	static create(t) {
		return new Ke(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = rt(this.opts.ref, (r) => {
				((this.root.contentNode = r), (this.root.contentId = r?.id));
			})));
	}
	#t = x(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return u(this.#t);
	}
	set snippetProps(t) {
		b(this.#t, t);
	}
	#e = x(() => ({
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
		return u(this.#e);
	}
	set props(t) {
		b(this.#e, t);
	}
}
class ze {
	static create(t) {
		return new ze(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t), (this.root = n), (this.attachment = rt(this.opts.ref)));
	}
	#t = x(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return u(this.#t);
	}
	set snippetProps(t) {
		b(this.#t, t);
	}
	#e = x(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('overlay')]: '',
		style: { pointerEvents: 'auto' },
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return u(this.#e);
	}
	set props(t) {
		b(this.#e, t);
	}
}
class zn {
	static create(t) {
		return new zn(t, Ft.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			(this.attachment = rt(this.opts.ref, (r) => (this.root.cancelNode = r))),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(t) {
		this.opts.disabled.current || t.button > 0 || this.root.handleClose();
	}
	onkeydown(t) {
		this.opts.disabled.current ||
			((t.key === Qt || t.key === we) && (t.preventDefault(), this.root.handleClose()));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr('cancel')]: '',
		onclick: this.onclick,
		onkeydown: this.onkeydown,
		tabindex: 0,
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
var Mi = nt('<div><!></div>');
function Fi(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'level', 3, 2),
		o = W(t, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'child', 'children', 'level']);
	const a = Le.create({
			id: w.with(() => r()),
			level: w.with(() => s()),
			ref: w.with(
				() => i(),
				(f) => i(f)
			)
		}),
		c = x(() => et(o, a.props));
	var l = T(),
		h = P(l);
	{
		var d = (f) => {
				var p = T(),
					v = P(p);
				(N(
					v,
					() => t.child,
					() => ({ props: u(c) })
				),
					A(f, p));
			},
			g = (f) => {
				var p = Mi();
				ot(p, () => ({ ...u(c) }));
				var v = lt(p);
				(N(v, () => t.children ?? k), ut(p), A(f, p));
			};
		Q(h, (f) => {
			t.child ? f(d) : f(g, !1);
		});
	}
	(A(e, l), _());
}
function Ni(e, t) {
	var n = T(),
		r = P(n);
	(ci(
		r,
		() => t.children,
		(i) => {
			var s = T(),
				o = P(s);
			(N(o, () => t.children ?? k), A(i, s));
		}
	),
		A(e, n));
}
const Ve = typeof document < 'u',
	wn = Di();
function Di() {
	return (
		Ve &&
		window?.navigator?.userAgent &&
		(/iP(ad|hone|od)/.test(window.navigator.userAgent) ||
			(window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent)))
	);
}
function Pt(e) {
	return e instanceof HTMLElement;
}
function ie(e) {
	return e instanceof Element;
}
function Ii(e) {
	return e instanceof Element || e instanceof SVGElement;
}
function Va(e) {
	return e.matches(':focus-visible');
}
function _i(e) {
	return e !== null;
}
function Ri(e) {
	return e instanceof HTMLInputElement && 'select' in e;
}
const ki = new At('BitsConfig');
function Bi() {
	const e = new Li(null, {});
	return ki.getOr(e).opts;
}
class Li {
	opts;
	constructor(t, n) {
		const r = Wi(t, n);
		this.opts = {
			defaultPortalTo: r((i) => i.defaultPortalTo),
			defaultLocale: r((i) => i.defaultLocale)
		};
	}
}
function Wi(e, t) {
	return (n) =>
		w.with(() => {
			const i = n(t)?.current;
			if (i !== void 0) return i;
			if (e !== null) return n(e.opts)?.current;
		});
}
function Ki(e, t) {
	return (n) => {
		const r = Bi();
		return w.with(() => {
			const i = n();
			if (i !== void 0) return i;
			const s = e(r).current;
			return s !== void 0 ? s : t;
		});
	};
}
const zi = Ki((e) => e.defaultPortalTo, 'body');
function Vn(e, t) {
	I(t, !0);
	const n = zi(() => t.to),
		r = Kr();
	let i = x(s);
	function s() {
		if (!Ve || t.disabled) return null;
		let d = null;
		return (
			typeof n.current == 'string' ? (d = document.querySelector(n.current)) : (d = n.current),
			d
		);
	}
	let o;
	function a() {
		o && (si(o), (o = null));
	}
	X([() => u(i), () => t.disabled], ([d, g]) => {
		if (!d || g) {
			a();
			return;
		}
		return (
			(o = oi(Ni, { target: d, props: { children: t.children }, context: r })),
			() => {
				a();
			}
		);
	});
	var c = T(),
		l = P(c);
	{
		var h = (d) => {
			var g = T(),
				f = P(g);
			(N(f, () => t.children ?? k), A(d, g));
		};
		Q(l, (d) => {
			t.disabled && d(h);
		});
	}
	(A(e, c), _());
}
function Hn(e, t, n, r) {
	const i = Array.isArray(t) ? t : [t];
	return (
		i.forEach((s) => e.addEventListener(s, n, r)),
		() => {
			i.forEach((s) => e.removeEventListener(s, n, r));
		}
	);
}
class Vi {
	eventName;
	options;
	constructor(t, n = { bubbles: !0, cancelable: !0 }) {
		((this.eventName = t), (this.options = n));
	}
	createEvent(t) {
		return new CustomEvent(this.eventName, { ...this.options, detail: t });
	}
	dispatch(t, n) {
		const r = this.createEvent(n);
		return (t.dispatchEvent(r), r);
	}
	listen(t, n, r) {
		const i = (s) => {
			n(s);
		};
		return $(t, this.eventName, i, r);
	}
}
function bn(e, t = 500) {
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
function Un(e, t) {
	return e === t || e.contains(t);
}
function Yn(e) {
	return e?.ownerDocument ?? document;
}
function Hi(e, t) {
	const { clientX: n, clientY: r } = e,
		i = t.getBoundingClientRect();
	return n < i.left || n > i.right || r < i.top || r > i.bottom;
}
globalThis.bitsDismissableLayers ??= new Map();
class He {
	static create(t) {
		return new He(t);
	}
	opts;
	#t;
	#e;
	#n = { pointerdown: !1 };
	#r = !1;
	#i = !1;
	#o = void 0;
	#a;
	#s = z;
	constructor(t) {
		((this.opts = t),
			(this.#e = t.interactOutsideBehavior),
			(this.#t = t.onInteractOutside),
			(this.#a = t.onFocusOutside),
			at(() => {
				this.#o = Yn(this.opts.ref.current);
			}));
		let n = z;
		const r = () => {
			(this.#h(), globalThis.bitsDismissableLayers.delete(this), this.#l.destroy(), n());
		};
		(X([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (!(!this.opts.enabled.current || !this.opts.ref.current))
				return (
					Ie(1, () => {
						this.opts.ref.current &&
							(globalThis.bitsDismissableLayers.set(this, this.#e), n(), (n = this.#d()));
					}),
					r
				);
		}),
			Vt(() => {
				(this.#h.destroy(),
					globalThis.bitsDismissableLayers.delete(this),
					this.#l.destroy(),
					this.#s(),
					n());
			}));
	}
	#c = (t) => {
		t.defaultPrevented ||
			(this.opts.ref.current &&
				bt(() => {
					!this.opts.ref.current ||
						this.#m(t.target) ||
						(t.target && !this.#i && this.#a.current?.(t));
				}));
	};
	#d() {
		return _t(
			$(this.#o, 'pointerdown', _t(this.#f, this.#p), { capture: !0 }),
			$(this.#o, 'pointerdown', _t(this.#g, this.#l)),
			$(this.#o, 'focusin', this.#c)
		);
	}
	#u = (t) => {
		let n = t;
		(n.defaultPrevented && (n = yn(t)), this.#t.current(t));
	};
	#l = bn((t) => {
		if (!this.opts.ref.current) {
			this.#s();
			return;
		}
		const n =
			this.opts.isValidEvent.current(t, this.opts.ref.current) || qi(t, this.opts.ref.current);
		if (!this.#r || this.#v() || !n) {
			this.#s();
			return;
		}
		let r = t;
		if (
			(r.defaultPrevented && (r = yn(r)),
			this.#e.current !== 'close' && this.#e.current !== 'defer-otherwise-close')
		) {
			this.#s();
			return;
		}
		t.pointerType === 'touch'
			? (this.#s(), (this.#s = Hn(this.#o, 'click', this.#u, { once: !0 })))
			: this.#t.current(r);
	}, 10);
	#f = (t) => {
		this.#n[t.type] = !0;
	};
	#g = (t) => {
		this.#n[t.type] = !1;
	};
	#p = () => {
		this.opts.ref.current && (this.#r = Yi(this.opts.ref.current));
	};
	#m = (t) => (this.opts.ref.current ? Un(this.opts.ref.current, t) : !1);
	#h = bn(() => {
		for (const t in this.#n) this.#n[t] = !1;
		this.#r = !1;
	}, 20);
	#v() {
		return Object.values(this.#n).some(Boolean);
	}
	#w = () => {
		this.#i = !0;
	};
	#b = () => {
		this.#i = !1;
	};
	props = { onfocuscapture: this.#w, onblurcapture: this.#b };
}
function Ui(e) {
	return e.findLast(([t, { current: n }]) => n === 'close' || n === 'ignore');
}
function Yi(e) {
	const t = [...globalThis.bitsDismissableLayers],
		n = Ui(t);
	if (n) return n[0].opts.ref.current === e;
	const [r] = t[0];
	return r.opts.ref.current === e;
}
function qi(e, t) {
	if ('button' in e && e.button > 0) return !1;
	const n = e.target;
	return ie(n) ? Yn(n).documentElement.contains(n) && !Un(t, n) && Hi(e, t) : !1;
}
function yn(e) {
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
								((i = !0), typeof o.preventDefault == 'function' && o.preventDefault());
							}
						: a === 'defaultPrevented'
							? i
							: a in o
								? o[a]
								: e[a]
	});
}
function qn(e, t) {
	I(t, !0);
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'onInteractOutside', 3, z),
		i = m(t, 'onFocusOutside', 3, z),
		s = m(t, 'isValidEvent', 3, () => !1);
	const o = He.create({
		id: w.with(() => t.id),
		interactOutsideBehavior: w.with(() => n()),
		onInteractOutside: w.with(() => r()),
		enabled: w.with(() => t.enabled),
		onFocusOutside: w.with(() => i()),
		isValidEvent: w.with(() => s()),
		ref: t.ref
	});
	var a = T(),
		c = P(a);
	(N(
		c,
		() => t.children ?? k,
		() => ({ props: o.props })
	),
		A(e, a),
		_());
}
globalThis.bitsEscapeLayers ??= new Map();
class Ue {
	static create(t) {
		return new Ue(t);
	}
	opts;
	domContext;
	constructor(t) {
		((this.opts = t), (this.domContext = new _e(this.opts.ref)));
		let n = z;
		X(
			() => t.enabled.current,
			(r) => (
				r && (globalThis.bitsEscapeLayers.set(this, t.escapeKeydownBehavior), (n = this.#t())),
				() => {
					(n(), globalThis.bitsEscapeLayers.delete(this));
				}
			)
		);
	}
	#t = () => $(this.domContext.getDocument(), 'keydown', this.#e, { passive: !1 });
	#e = (t) => {
		if (t.key !== Hr || !Gi(this)) return;
		const n = new KeyboardEvent(t.type, t);
		t.preventDefault();
		const r = this.opts.escapeKeydownBehavior.current;
		(r !== 'close' && r !== 'defer-otherwise-close') || this.opts.onEscapeKeydown.current(n);
	};
}
function Gi(e) {
	const t = [...globalThis.bitsEscapeLayers],
		n = t.findLast(([i, { current: s }]) => s === 'close' || s === 'ignore');
	if (n) return n[0] === e;
	const [r] = t[0];
	return r === e;
}
function Gn(e, t) {
	I(t, !0);
	let n = m(t, 'escapeKeydownBehavior', 3, 'close'),
		r = m(t, 'onEscapeKeydown', 3, z);
	Ue.create({
		escapeKeydownBehavior: w.with(() => n()),
		onEscapeKeydown: w.with(() => r()),
		enabled: w.with(() => t.enabled),
		ref: t.ref
	});
	var i = T(),
		s = P(i);
	(N(s, () => t.children ?? k), A(e, i), _());
}
class Ye {
	static instance;
	#t = w([]);
	#e = new WeakMap();
	static getInstance() {
		return (this.instance || (this.instance = new Ye()), this.instance);
	}
	register(t) {
		const n = this.getActive();
		(n && n !== t && n.pause(),
			(this.#t.current = this.#t.current.filter((r) => r !== t)),
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
}
/*!
 * tabbable 6.2.0
 * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
 */ var Xn = [
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
	oe = Xn.join(','),
	jn = typeof Element > 'u',
	Rt = jn
		? function () {}
		: Element.prototype.matches ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.webkitMatchesSelector,
	se =
		!jn && Element.prototype.getRootNode
			? function (e) {
					var t;
					return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
				}
			: function (e) {
					return e?.ownerDocument;
				},
	ae = function e(t, n) {
		var r;
		n === void 0 && (n = !0);
		var i =
				t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, 'inert'),
			s = i === '' || i === 'true',
			o = s || (n && t && e(t.parentNode));
		return o;
	},
	Xi = function (t) {
		var n,
			r =
				t == null || (n = t.getAttribute) === null || n === void 0
					? void 0
					: n.call(t, 'contenteditable');
		return r === '' || r === 'true';
	},
	Zn = function (t, n, r) {
		if (ae(t)) return [];
		var i = Array.prototype.slice.apply(t.querySelectorAll(oe));
		return (n && Rt.call(t, oe) && i.unshift(t), (i = i.filter(r)), i);
	},
	Jn = function e(t, n, r) {
		for (var i = [], s = Array.from(t); s.length; ) {
			var o = s.shift();
			if (!ae(o, !1))
				if (o.tagName === 'SLOT') {
					var a = o.assignedElements(),
						c = a.length ? a : o.children,
						l = e(c, !0, r);
					r.flatten ? i.push.apply(i, l) : i.push({ scopeParent: o, candidates: l });
				} else {
					var h = Rt.call(o, oe);
					h && r.filter(o) && (n || !t.includes(o)) && i.push(o);
					var d = o.shadowRoot || (typeof r.getShadowRoot == 'function' && r.getShadowRoot(o)),
						g = !ae(d, !1) && (!r.shadowRootFilter || r.shadowRootFilter(o));
					if (d && g) {
						var f = e(d === !0 ? o.children : d.children, !0, r);
						r.flatten ? i.push.apply(i, f) : i.push({ scopeParent: o, candidates: f });
					} else s.unshift.apply(s, o.children);
				}
		}
		return i;
	},
	Qn = function (t) {
		return !isNaN(parseInt(t.getAttribute('tabindex'), 10));
	},
	$n = function (t) {
		if (!t) throw new Error('No node provided');
		return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Xi(t)) && !Qn(t)
			? 0
			: t.tabIndex;
	},
	ji = function (t, n) {
		var r = $n(t);
		return r < 0 && n && !Qn(t) ? 0 : r;
	},
	Zi = function (t, n) {
		return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
	},
	tr = function (t) {
		return t.tagName === 'INPUT';
	},
	Ji = function (t) {
		return tr(t) && t.type === 'hidden';
	},
	Qi = function (t) {
		var n =
			t.tagName === 'DETAILS' &&
			Array.prototype.slice.apply(t.children).some(function (r) {
				return r.tagName === 'SUMMARY';
			});
		return n;
	},
	$i = function (t, n) {
		for (var r = 0; r < t.length; r++) if (t[r].checked && t[r].form === n) return t[r];
	},
	to = function (t) {
		if (!t.name) return !0;
		var n = t.form || se(t),
			r = function (a) {
				return n.querySelectorAll('input[type="radio"][name="' + a + '"]');
			},
			i;
		if (typeof window < 'u' && typeof window.CSS < 'u' && typeof window.CSS.escape == 'function')
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
		var s = $i(i, t.form);
		return !s || s === t;
	},
	eo = function (t) {
		return tr(t) && t.type === 'radio';
	},
	no = function (t) {
		return eo(t) && !to(t);
	},
	ro = function (t) {
		var n,
			r = t && se(t),
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
				var l, h, d;
				((r = se(i)),
					(i = (l = r) === null || l === void 0 ? void 0 : l.host),
					(s = !!(
						(h = i) !== null &&
						h !== void 0 &&
						(d = h.ownerDocument) !== null &&
						d !== void 0 &&
						d.contains(i)
					)));
			}
		}
		return s;
	},
	xn = function (t) {
		var n = t.getBoundingClientRect(),
			r = n.width,
			i = n.height;
		return r === 0 && i === 0;
	},
	io = function (t, n) {
		var r = n.displayCheck,
			i = n.getShadowRoot;
		if (getComputedStyle(t).visibility === 'hidden') return !0;
		var s = Rt.call(t, 'details>summary:first-of-type'),
			o = s ? t.parentElement : t;
		if (Rt.call(o, 'details:not([open]) *')) return !0;
		if (!r || r === 'full' || r === 'legacy-full') {
			if (typeof i == 'function') {
				for (var a = t; t; ) {
					var c = t.parentElement,
						l = se(t);
					if (c && !c.shadowRoot && i(c) === !0) return xn(t);
					t.assignedSlot
						? (t = t.assignedSlot)
						: !c && l !== t.ownerDocument
							? (t = l.host)
							: (t = c);
				}
				t = a;
			}
			if (ro(t)) return !t.getClientRects().length;
			if (r !== 'legacy-full') return !0;
		} else if (r === 'non-zero-area') return xn(t);
		return !1;
	},
	oo = function (t) {
		if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
			for (var n = t.parentElement; n; ) {
				if (n.tagName === 'FIELDSET' && n.disabled) {
					for (var r = 0; r < n.children.length; r++) {
						var i = n.children.item(r);
						if (i.tagName === 'LEGEND')
							return Rt.call(n, 'fieldset[disabled] *') ? !0 : !i.contains(t);
					}
					return !0;
				}
				n = n.parentElement;
			}
		return !1;
	},
	ce = function (t, n) {
		return !(n.disabled || ae(n) || Ji(n) || io(n, t) || Qi(n) || oo(n));
	},
	Ce = function (t, n) {
		return !(no(n) || $n(n) < 0 || !ce(t, n));
	},
	so = function (t) {
		var n = parseInt(t.getAttribute('tabindex'), 10);
		return !!(isNaN(n) || n >= 0);
	},
	ao = function e(t) {
		var n = [],
			r = [];
		return (
			t.forEach(function (i, s) {
				var o = !!i.scopeParent,
					a = o ? i.scopeParent : i,
					c = ji(a, o),
					l = o ? e(i.candidates) : a;
				c === 0
					? o
						? n.push.apply(n, l)
						: n.push(a)
					: r.push({ documentOrder: s, tabIndex: c, item: i, isScope: o, content: l });
			}),
			r
				.sort(Zi)
				.reduce(function (i, s) {
					return (s.isScope ? i.push.apply(i, s.content) : i.push(s.content), i);
				}, [])
				.concat(n)
		);
	},
	er = function (t, n) {
		n = n || {};
		var r;
		return (
			n.getShadowRoot
				? (r = Jn([t], n.includeContainer, {
						filter: Ce.bind(null, n),
						flatten: !1,
						getShadowRoot: n.getShadowRoot,
						shadowRootFilter: so
					}))
				: (r = Zn(t, n.includeContainer, Ce.bind(null, n))),
			ao(r)
		);
	},
	nr = function (t, n) {
		n = n || {};
		var r;
		return (
			n.getShadowRoot
				? (r = Jn([t], n.includeContainer, {
						filter: ce.bind(null, n),
						flatten: !0,
						getShadowRoot: n.getShadowRoot
					}))
				: (r = Zn(t, n.includeContainer, ce.bind(null, n))),
			r
		);
	},
	qe = function (t, n) {
		if (((n = n || {}), !t)) throw new Error('No node provided');
		return Rt.call(t, oe) === !1 ? !1 : Ce(n, t);
	},
	co = Xn.concat('iframe').join(','),
	rr = function (t, n) {
		if (((n = n || {}), !t)) throw new Error('No node provided');
		return Rt.call(t, co) === !1 ? !1 : ce(n, t);
	};
class Ge {
	#t = !1;
	#e = null;
	#n = Ye.getInstance();
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
		this.#e && (this.#o(), this.#s(), this.#n.unregister(this), (this.#e = null));
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
		if ((this.#i.onCloseAutoFocus.current(t), !t.defaultPrevented)) {
			const n = document.activeElement;
			n && n !== document.body && n.focus();
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
					if (l && t.contains(l) && rr(l)) (o.preventDefault(), l.focus());
					else {
						const h = this.#u(),
							d = this.#l()[0];
						(h || d || t).focus();
					}
				}
			},
			i = (o) => {
				if (!this.#i.loop || this.#t || o.key !== 'Tab' || !this.#n.isActiveScope(this)) return;
				const a = this.#d();
				if (a.length < 2) return;
				const c = a[0],
					l = a[a.length - 1];
				!o.shiftKey && n.activeElement === l
					? (o.preventDefault(), c.focus())
					: o.shiftKey && n.activeElement === c && (o.preventDefault(), l.focus());
			};
		this.#r.push($(n, 'focusin', r, { capture: !0 }), $(t, 'keydown', i));
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
		return this.#e ? er(this.#e, { includeContainer: !1, getShadowRoot: !0 }) : [];
	}
	#u() {
		return this.#d()[0] || null;
	}
	#l() {
		return this.#e ? nr(this.#e, { includeContainer: !1, getShadowRoot: !0 }) : [];
	}
	static use(t) {
		let n = null;
		return (
			X([() => t.ref.current, () => t.enabled.current], ([r, i]) => {
				r && i ? (n || (n = new Ge(t)), n.mount(r)) : n && (n.unmount(), (n = null));
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
function ir(e, t) {
	I(t, !0);
	let n = m(t, 'enabled', 3, !1),
		r = m(t, 'trapFocus', 3, !1),
		i = m(t, 'loop', 3, !1),
		s = m(t, 'onCloseAutoFocus', 3, z),
		o = m(t, 'onOpenAutoFocus', 3, z);
	const a = Ge.use({
		enabled: w.with(() => n()),
		trap: w.with(() => r()),
		loop: i(),
		onCloseAutoFocus: w.with(() => s()),
		onOpenAutoFocus: w.with(() => o()),
		ref: t.ref
	});
	var c = T(),
		l = P(c);
	(N(
		l,
		() => t.focusScope ?? k,
		() => ({ props: a.props })
	),
		A(e, c),
		_());
}
globalThis.bitsTextSelectionLayers ??= new Map();
class Xe {
	static create(t) {
		return new Xe(t);
	}
	opts;
	domContext;
	#t = z;
	constructor(t) {
		((this.opts = t), (this.domContext = new _e(t.ref)));
		let n = z;
		X(
			() => this.opts.enabled.current,
			(r) => (
				r &&
					(globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled), n(), (n = this.#e())),
				() => {
					(n(), this.#r(), globalThis.bitsTextSelectionLayers.delete(this));
				}
			)
		);
	}
	#e() {
		return _t(
			$(this.domContext.getDocument(), 'pointerdown', this.#n),
			$(this.domContext.getDocument(), 'pointerup', Ur(this.#r, this.opts.onPointerUp.current))
		);
	}
	#n = (t) => {
		const n = this.opts.ref.current,
			r = t.target;
		!Pt(n) ||
			!Pt(r) ||
			!this.opts.enabled.current ||
			!uo(this) ||
			!bi(n, r) ||
			(this.opts.onPointerDown.current(t),
			!t.defaultPrevented && (this.#t = lo(n, this.domContext.getDocument().body)));
	};
	#r = () => {
		(this.#t(), (this.#t = z));
	};
}
const Sn = (e) => e.style.userSelect || e.style.webkitUserSelect;
function lo(e, t) {
	const n = Sn(t),
		r = Sn(e);
	return (
		ee(t, 'none'),
		ee(e, 'text'),
		() => {
			(ee(t, n), ee(e, r));
		}
	);
}
function ee(e, t) {
	((e.style.userSelect = t), (e.style.webkitUserSelect = t));
}
function uo(e) {
	const t = [...globalThis.bitsTextSelectionLayers];
	if (!t.length) return !1;
	const n = t.at(-1);
	return n ? n[0] === e : !1;
}
function or(e, t) {
	I(t, !0);
	let n = m(t, 'preventOverflowTextSelection', 3, !0),
		r = m(t, 'onPointerDown', 3, z),
		i = m(t, 'onPointerUp', 3, z);
	Xe.create({
		id: w.with(() => t.id),
		onPointerDown: w.with(() => r()),
		onPointerUp: w.with(() => i()),
		enabled: w.with(() => t.enabled && n()),
		ref: t.ref
	});
	var s = T(),
		o = P(s);
	(N(o, () => t.children ?? k), A(e, s), _());
}
globalThis.bitsIdCounter ??= { current: 0 };
function je(e = 'bits') {
	return (globalThis.bitsIdCounter.current++, `${e}-${globalThis.bitsIdCounter.current}`);
}
class ho {
	#t;
	#e = 0;
	#n = D();
	#r;
	constructor(t) {
		this.#t = t;
	}
	#i() {
		((this.#e -= 1),
			this.#r && this.#e <= 0 && (this.#r(), b(this.#n, void 0), (this.#r = void 0)));
	}
	get(...t) {
		return (
			(this.#e += 1),
			u(this.#n) === void 0 &&
				(this.#r = _n(() => {
					b(this.#n, this.#t(...t), !0);
				})),
			at(() => () => {
				this.#i();
			}),
			u(this.#n)
		);
	}
}
const fo = new ho(() => {
	const e = new li(),
		t = x(() => {
			for (const s of e.values()) if (s) return !0;
			return !1;
		});
	let n = D(null),
		r = null;
	function i() {
		Ve &&
			(document.body.setAttribute('style', u(n) ?? ''),
			document.body.style.removeProperty('--scrollbar-width'),
			wn && r?.());
	}
	return (
		X(
			() => u(t),
			() => {
				if (!u(t)) return;
				b(n, document.body.getAttribute('style'), !0);
				const s = getComputedStyle(document.body),
					o = window.innerWidth - document.documentElement.clientWidth,
					c = {
						padding: Number.parseInt(s.paddingRight ?? '0', 10) + o,
						margin: Number.parseInt(s.marginRight ?? '0', 10)
					};
				(o > 0 &&
					((document.body.style.paddingRight = `${c.padding}px`),
					(document.body.style.marginRight = `${c.margin}px`),
					document.body.style.setProperty('--scrollbar-width', `${o}px`),
					(document.body.style.overflow = 'hidden')),
					wn &&
						(r = Hn(
							document,
							'touchmove',
							(l) => {
								l.target === document.documentElement &&
									(l.touches.length > 1 || l.preventDefault());
							},
							{ passive: !1 }
						)),
					bt(() => {
						((document.body.style.pointerEvents = 'none'),
							(document.body.style.overflow = 'hidden'));
					}));
			}
		),
		Vt(() => () => {
			r?.();
		}),
		{
			get map() {
				return e;
			},
			resetBodyStyle: i
		}
	);
});
class go {
	#t = je();
	#e;
	#n = () => null;
	#r;
	locked;
	constructor(t, n = () => null) {
		((this.#e = t),
			(this.#n = n),
			(this.#r = fo.get()),
			this.#r &&
				(this.#r.map.set(this.#t, this.#e ?? !1),
				(this.locked = w.with(
					() => this.#r.map.get(this.#t) ?? !1,
					(r) => this.#r.map.set(this.#t, r)
				)),
				Vt(() => {
					if ((this.#r.map.delete(this.#t), po(this.#r.map))) return;
					const r = this.#n();
					r === null
						? requestAnimationFrame(() => this.#r.resetBodyStyle())
						: Ie(r, () => this.#r.resetBodyStyle());
				})));
	}
}
function po(e) {
	for (const [t, n] of e) if (n) return !0;
	return !1;
}
function le(e, t) {
	I(t, !0);
	let n = m(t, 'preventScroll', 3, !0),
		r = m(t, 'restoreScrollDelay', 3, null);
	(n() && new go(n(), () => r()), _());
}
function mo({ forceMount: e, present: t, open: n }) {
	return (e || t) && n;
}
var vo = nt('<div><!></div>');
function wo(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'forceMount', 3, !1),
		s = m(t, 'ref', 15, null),
		o = W(t, ['$$slots', '$$events', '$$legacy', 'id', 'forceMount', 'child', 'children', 'ref']);
	const a = ze.create({
			id: w.with(() => r()),
			ref: w.with(
				() => s(),
				(l) => s(l)
			)
		}),
		c = x(() => et(o, a.props));
	{
		const l = (d) => {
			var g = T(),
				f = P(g);
			{
				var p = (y) => {
						var S = T(),
							E = P(S);
						{
							let C = x(() => ({ props: et(u(c)), ...a.snippetProps }));
							N(
								E,
								() => t.child,
								() => u(C)
							);
						}
						A(y, S);
					},
					v = (y) => {
						var S = vo();
						ot(S, (C) => ({ ...C }), [() => et(u(c))]);
						var E = lt(S);
						(N(
							E,
							() => t.children ?? k,
							() => a.snippetProps
						),
							ut(S),
							A(y, S));
					};
				Q(f, (y) => {
					t.child ? y(p) : y(v, !1);
				});
			}
			A(d, g);
		};
		let h = x(() => a.root.opts.open.current || i());
		Re(e, {
			get open() {
				return u(h);
			},
			get ref() {
				return a.opts.ref;
			},
			presence: l,
			$$slots: { presence: !0 }
		});
	}
	_();
}
var bo = nt('<div><!></div>');
function yo(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = W(t, ['$$slots', '$$events', '$$legacy', 'id', 'children', 'child', 'ref']);
	const o = We.create({
			id: w.with(() => r()),
			ref: w.with(
				() => i(),
				(g) => i(g)
			)
		}),
		a = x(() => et(s, o.props));
	var c = T(),
		l = P(c);
	{
		var h = (g) => {
				var f = T(),
					p = P(f);
				(N(
					p,
					() => t.child,
					() => ({ props: u(a) })
				),
					A(g, f));
			},
			d = (g) => {
				var f = bo();
				ot(f, () => ({ ...u(a) }));
				var p = lt(f);
				(N(p, () => t.children ?? k), ut(f), A(g, f));
			};
		Q(l, (g) => {
			t.child ? g(h) : g(d, !1);
		});
	}
	(A(e, c), _());
}
function Ha(e, t) {
	return e >= 0 && e < t.length;
}
function sr(e, t, n) {
	const r = t.toLowerCase();
	if (r.endsWith(' ')) {
		const d = r.slice(0, -1);
		if (e.filter((v) => v.toLowerCase().startsWith(d)).length <= 1) return sr(e, d, n);
		const f = n?.toLowerCase();
		if (f && f.startsWith(d) && f.charAt(d.length) === ' ' && t.trim() === d) return n;
		const p = e.filter((v) => v.toLowerCase().startsWith(r));
		if (p.length > 0) {
			const v = n ? e.indexOf(n) : -1;
			return An(p, Math.max(v, 0)).find((E) => E !== n) || n;
		}
	}
	const s = t.length > 1 && Array.from(t).every((d) => d === t[0]) ? t[0] : t,
		o = s.toLowerCase(),
		a = n ? e.indexOf(n) : -1;
	let c = An(e, Math.max(a, 0));
	s.length === 1 && (c = c.filter((d) => d !== n));
	const h = c.find((d) => d?.toLowerCase().startsWith(o));
	return h !== n ? h : void 0;
}
function An(e, t) {
	return e.map((n, r) => e[(t + r) % e.length]);
}
const xo = ['top', 'right', 'bottom', 'left'],
	Ct = Math.min,
	st = Math.max,
	ue = Math.round,
	ne = Math.floor,
	mt = (e) => ({ x: e, y: e }),
	So = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
	Ao = { start: 'end', end: 'start' };
function Ee(e, t, n) {
	return st(e, Ct(t, n));
}
function xt(e, t) {
	return typeof e == 'function' ? e(t) : e;
}
function St(e) {
	return e.split('-')[0];
}
function Ht(e) {
	return e.split('-')[1];
}
function Ze(e) {
	return e === 'x' ? 'y' : 'x';
}
function Je(e) {
	return e === 'y' ? 'height' : 'width';
}
const Oo = new Set(['top', 'bottom']);
function pt(e) {
	return Oo.has(St(e)) ? 'y' : 'x';
}
function Qe(e) {
	return Ze(pt(e));
}
function Po(e, t, n) {
	n === void 0 && (n = !1);
	const r = Ht(e),
		i = Qe(e),
		s = Je(i);
	let o =
		i === 'x' ? (r === (n ? 'end' : 'start') ? 'right' : 'left') : r === 'start' ? 'bottom' : 'top';
	return (t.reference[s] > t.floating[s] && (o = de(o)), [o, de(o)]);
}
function Co(e) {
	const t = de(e);
	return [Te(e), t, Te(t)];
}
function Te(e) {
	return e.replace(/start|end/g, (t) => Ao[t]);
}
const On = ['left', 'right'],
	Pn = ['right', 'left'],
	Eo = ['top', 'bottom'],
	To = ['bottom', 'top'];
function Mo(e, t, n) {
	switch (e) {
		case 'top':
		case 'bottom':
			return n ? (t ? Pn : On) : t ? On : Pn;
		case 'left':
		case 'right':
			return t ? Eo : To;
		default:
			return [];
	}
}
function Fo(e, t, n, r) {
	const i = Ht(e);
	let s = Mo(St(e), n === 'start', r);
	return (i && ((s = s.map((o) => o + '-' + i)), t && (s = s.concat(s.map(Te)))), s);
}
function de(e) {
	return e.replace(/left|right|bottom|top/g, (t) => So[t]);
}
function No(e) {
	return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function ar(e) {
	return typeof e != 'number' ? No(e) : { top: e, right: e, bottom: e, left: e };
}
function he(e) {
	const { x: t, y: n, width: r, height: i } = e;
	return { width: r, height: i, top: n, left: t, right: t + r, bottom: n + i, x: t, y: n };
}
function Cn(e, t, n) {
	let { reference: r, floating: i } = e;
	const s = pt(t),
		o = Qe(t),
		a = Je(o),
		c = St(t),
		l = s === 'y',
		h = r.x + r.width / 2 - i.width / 2,
		d = r.y + r.height / 2 - i.height / 2,
		g = r[a] / 2 - i[a] / 2;
	let f;
	switch (c) {
		case 'top':
			f = { x: h, y: r.y - i.height };
			break;
		case 'bottom':
			f = { x: h, y: r.y + r.height };
			break;
		case 'right':
			f = { x: r.x + r.width, y: d };
			break;
		case 'left':
			f = { x: r.x - i.width, y: d };
			break;
		default:
			f = { x: r.x, y: r.y };
	}
	switch (Ht(t)) {
		case 'start':
			f[o] -= g * (n && l ? -1 : 1);
			break;
		case 'end':
			f[o] += g * (n && l ? -1 : 1);
			break;
	}
	return f;
}
const Do = async (e, t, n) => {
	const { placement: r = 'bottom', strategy: i = 'absolute', middleware: s = [], platform: o } = n,
		a = s.filter(Boolean),
		c = await (o.isRTL == null ? void 0 : o.isRTL(t));
	let l = await o.getElementRects({ reference: e, floating: t, strategy: i }),
		{ x: h, y: d } = Cn(l, r, c),
		g = r,
		f = {},
		p = 0;
	for (let v = 0; v < a.length; v++) {
		const { name: y, fn: S } = a[v],
			{
				x: E,
				y: C,
				data: O,
				reset: M
			} = await S({
				x: h,
				y: d,
				initialPlacement: r,
				placement: g,
				strategy: i,
				middlewareData: f,
				rects: l,
				platform: o,
				elements: { reference: e, floating: t }
			});
		((h = E ?? h),
			(d = C ?? d),
			(f = { ...f, [y]: { ...f[y], ...O } }),
			M &&
				p <= 50 &&
				(p++,
				typeof M == 'object' &&
					(M.placement && (g = M.placement),
					M.rects &&
						(l =
							M.rects === !0
								? await o.getElementRects({ reference: e, floating: t, strategy: i })
								: M.rects),
					({ x: h, y: d } = Cn(l, g, c))),
				(v = -1)));
	}
	return { x: h, y: d, placement: g, strategy: i, middlewareData: f };
};
async function Zt(e, t) {
	var n;
	t === void 0 && (t = {});
	const { x: r, y: i, platform: s, rects: o, elements: a, strategy: c } = e,
		{
			boundary: l = 'clippingAncestors',
			rootBoundary: h = 'viewport',
			elementContext: d = 'floating',
			altBoundary: g = !1,
			padding: f = 0
		} = xt(t, e),
		p = ar(f),
		y = a[g ? (d === 'floating' ? 'reference' : 'floating') : d],
		S = he(
			await s.getClippingRect({
				element:
					(n = await (s.isElement == null ? void 0 : s.isElement(y))) == null || n
						? y
						: y.contextElement ||
							(await (s.getDocumentElement == null ? void 0 : s.getDocumentElement(a.floating))),
				boundary: l,
				rootBoundary: h,
				strategy: c
			})
		),
		E =
			d === 'floating'
				? { x: r, y: i, width: o.floating.width, height: o.floating.height }
				: o.reference,
		C = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(a.floating)),
		O = (await (s.isElement == null ? void 0 : s.isElement(C)))
			? (await (s.getScale == null ? void 0 : s.getScale(C))) || { x: 1, y: 1 }
			: { x: 1, y: 1 },
		M = he(
			s.convertOffsetParentRelativeRectToViewportRelativeRect
				? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
						elements: a,
						rect: E,
						offsetParent: C,
						strategy: c
					})
				: E
		);
	return {
		top: (S.top - M.top + p.top) / O.y,
		bottom: (M.bottom - S.bottom + p.bottom) / O.y,
		left: (S.left - M.left + p.left) / O.x,
		right: (M.right - S.right + p.right) / O.x
	};
}
const Io = (e) => ({
		name: 'arrow',
		options: e,
		async fn(t) {
			const { x: n, y: r, placement: i, rects: s, platform: o, elements: a, middlewareData: c } = t,
				{ element: l, padding: h = 0 } = xt(e, t) || {};
			if (l == null) return {};
			const d = ar(h),
				g = { x: n, y: r },
				f = Qe(i),
				p = Je(f),
				v = await o.getDimensions(l),
				y = f === 'y',
				S = y ? 'top' : 'left',
				E = y ? 'bottom' : 'right',
				C = y ? 'clientHeight' : 'clientWidth',
				O = s.reference[p] + s.reference[f] - g[f] - s.floating[p],
				M = g[f] - s.reference[f],
				R = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l));
			let F = R ? R[C] : 0;
			(!F || !(await (o.isElement == null ? void 0 : o.isElement(R)))) &&
				(F = a.floating[C] || s.floating[p]);
			const B = O / 2 - M / 2,
				Z = F / 2 - v[p] / 2 - 1,
				K = Ct(d[S], Z),
				J = Ct(d[E], Z),
				j = K,
				tt = F - v[p] - J,
				L = F / 2 - v[p] / 2 + B,
				V = Ee(j, L, tt),
				Y =
					!c.arrow &&
					Ht(i) != null &&
					L !== V &&
					s.reference[p] / 2 - (L < j ? K : J) - v[p] / 2 < 0,
				q = Y ? (L < j ? L - j : L - tt) : 0;
			return {
				[f]: g[f] + q,
				data: { [f]: V, centerOffset: L - V - q, ...(Y && { alignmentOffset: q }) },
				reset: Y
			};
		}
	}),
	_o = function (e) {
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
							mainAxis: h = !0,
							crossAxis: d = !0,
							fallbackPlacements: g,
							fallbackStrategy: f = 'bestFit',
							fallbackAxisSideDirection: p = 'none',
							flipAlignment: v = !0,
							...y
						} = xt(e, t);
					if ((n = s.arrow) != null && n.alignmentOffset) return {};
					const S = St(i),
						E = pt(a),
						C = St(a) === a,
						O = await (c.isRTL == null ? void 0 : c.isRTL(l.floating)),
						M = g || (C || !v ? [de(a)] : Co(a)),
						R = p !== 'none';
					!g && R && M.push(...Fo(a, v, p, O));
					const F = [a, ...M],
						B = await Zt(t, y),
						Z = [];
					let K = ((r = s.flip) == null ? void 0 : r.overflows) || [];
					if ((h && Z.push(B[S]), d)) {
						const L = Po(i, o, O);
						Z.push(B[L[0]], B[L[1]]);
					}
					if (((K = [...K, { placement: i, overflows: Z }]), !Z.every((L) => L <= 0))) {
						var J, j;
						const L = (((J = s.flip) == null ? void 0 : J.index) || 0) + 1,
							V = F[L];
						if (
							V &&
							(!(d === 'alignment' ? E !== pt(V) : !1) ||
								K.every((H) => H.overflows[0] > 0 && pt(H.placement) === E))
						)
							return { data: { index: L, overflows: K }, reset: { placement: V } };
						let Y =
							(j = K.filter((q) => q.overflows[0] <= 0).sort(
								(q, H) => q.overflows[1] - H.overflows[1]
							)[0]) == null
								? void 0
								: j.placement;
						if (!Y)
							switch (f) {
								case 'bestFit': {
									var tt;
									const q =
										(tt = K.filter((H) => {
											if (R) {
												const G = pt(H.placement);
												return G === E || G === 'y';
											}
											return !0;
										})
											.map((H) => [
												H.placement,
												H.overflows.filter((G) => G > 0).reduce((G, it) => G + it, 0)
											])
											.sort((H, G) => H[1] - G[1])[0]) == null
											? void 0
											: tt[0];
									q && (Y = q);
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
function En(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function Tn(e) {
	return xo.some((t) => e[t] >= 0);
}
const Ro = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'hide',
				options: e,
				async fn(t) {
					const { rects: n } = t,
						{ strategy: r = 'referenceHidden', ...i } = xt(e, t);
					switch (r) {
						case 'referenceHidden': {
							const s = await Zt(t, { ...i, elementContext: 'reference' }),
								o = En(s, n.reference);
							return { data: { referenceHiddenOffsets: o, referenceHidden: Tn(o) } };
						}
						case 'escaped': {
							const s = await Zt(t, { ...i, altBoundary: !0 }),
								o = En(s, n.floating);
							return { data: { escapedOffsets: o, escaped: Tn(o) } };
						}
						default:
							return {};
					}
				}
			}
		);
	},
	cr = new Set(['left', 'top']);
async function ko(e, t) {
	const { placement: n, platform: r, elements: i } = e,
		s = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)),
		o = St(n),
		a = Ht(n),
		c = pt(n) === 'y',
		l = cr.has(o) ? -1 : 1,
		h = s && c ? -1 : 1,
		d = xt(t, e);
	let {
		mainAxis: g,
		crossAxis: f,
		alignmentAxis: p
	} = typeof d == 'number'
		? { mainAxis: d, crossAxis: 0, alignmentAxis: null }
		: { mainAxis: d.mainAxis || 0, crossAxis: d.crossAxis || 0, alignmentAxis: d.alignmentAxis };
	return (
		a && typeof p == 'number' && (f = a === 'end' ? p * -1 : p),
		c ? { x: f * h, y: g * l } : { x: g * l, y: f * h }
	);
}
const Bo = function (e) {
		return (
			e === void 0 && (e = 0),
			{
				name: 'offset',
				options: e,
				async fn(t) {
					var n, r;
					const { x: i, y: s, placement: o, middlewareData: a } = t,
						c = await ko(t, e);
					return o === ((n = a.offset) == null ? void 0 : n.placement) &&
						(r = a.arrow) != null &&
						r.alignmentOffset
						? {}
						: { x: i + c.x, y: s + c.y, data: { ...c, placement: o } };
				}
			}
		);
	},
	Lo = function (e) {
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
									let { x: S, y: E } = y;
									return { x: S, y: E };
								}
							},
							...c
						} = xt(e, t),
						l = { x: n, y: r },
						h = await Zt(t, c),
						d = pt(St(i)),
						g = Ze(d);
					let f = l[g],
						p = l[d];
					if (s) {
						const y = g === 'y' ? 'top' : 'left',
							S = g === 'y' ? 'bottom' : 'right',
							E = f + h[y],
							C = f - h[S];
						f = Ee(E, f, C);
					}
					if (o) {
						const y = d === 'y' ? 'top' : 'left',
							S = d === 'y' ? 'bottom' : 'right',
							E = p + h[y],
							C = p - h[S];
						p = Ee(E, p, C);
					}
					const v = a.fn({ ...t, [g]: f, [d]: p });
					return { ...v, data: { x: v.x - n, y: v.y - r, enabled: { [g]: s, [d]: o } } };
				}
			}
		);
	},
	Wo = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				options: e,
				fn(t) {
					const { x: n, y: r, placement: i, rects: s, middlewareData: o } = t,
						{ offset: a = 0, mainAxis: c = !0, crossAxis: l = !0 } = xt(e, t),
						h = { x: n, y: r },
						d = pt(i),
						g = Ze(d);
					let f = h[g],
						p = h[d];
					const v = xt(a, t),
						y =
							typeof v == 'number'
								? { mainAxis: v, crossAxis: 0 }
								: { mainAxis: 0, crossAxis: 0, ...v };
					if (c) {
						const C = g === 'y' ? 'height' : 'width',
							O = s.reference[g] - s.floating[C] + y.mainAxis,
							M = s.reference[g] + s.reference[C] - y.mainAxis;
						f < O ? (f = O) : f > M && (f = M);
					}
					if (l) {
						var S, E;
						const C = g === 'y' ? 'width' : 'height',
							O = cr.has(St(i)),
							M =
								s.reference[d] -
								s.floating[C] +
								((O && ((S = o.offset) == null ? void 0 : S[d])) || 0) +
								(O ? 0 : y.crossAxis),
							R =
								s.reference[d] +
								s.reference[C] +
								(O ? 0 : ((E = o.offset) == null ? void 0 : E[d]) || 0) -
								(O ? y.crossAxis : 0);
						p < M ? (p = M) : p > R && (p = R);
					}
					return { [g]: f, [d]: p };
				}
			}
		);
	},
	Ko = function (e) {
		return (
			e === void 0 && (e = {}),
			{
				name: 'size',
				options: e,
				async fn(t) {
					var n, r;
					const { placement: i, rects: s, platform: o, elements: a } = t,
						{ apply: c = () => {}, ...l } = xt(e, t),
						h = await Zt(t, l),
						d = St(i),
						g = Ht(i),
						f = pt(i) === 'y',
						{ width: p, height: v } = s.floating;
					let y, S;
					d === 'top' || d === 'bottom'
						? ((y = d),
							(S =
								g === ((await (o.isRTL == null ? void 0 : o.isRTL(a.floating))) ? 'start' : 'end')
									? 'left'
									: 'right'))
						: ((S = d), (y = g === 'end' ? 'top' : 'bottom'));
					const E = v - h.top - h.bottom,
						C = p - h.left - h.right,
						O = Ct(v - h[y], E),
						M = Ct(p - h[S], C),
						R = !t.middlewareData.shift;
					let F = O,
						B = M;
					if (
						((n = t.middlewareData.shift) != null && n.enabled.x && (B = C),
						(r = t.middlewareData.shift) != null && r.enabled.y && (F = E),
						R && !g)
					) {
						const K = st(h.left, 0),
							J = st(h.right, 0),
							j = st(h.top, 0),
							tt = st(h.bottom, 0);
						f
							? (B = p - 2 * (K !== 0 || J !== 0 ? K + J : st(h.left, h.right)))
							: (F = v - 2 * (j !== 0 || tt !== 0 ? j + tt : st(h.top, h.bottom)));
					}
					await c({ ...t, availableWidth: B, availableHeight: F });
					const Z = await o.getDimensions(a.floating);
					return p !== Z.width || v !== Z.height ? { reset: { rects: !0 } } : {};
				}
			}
		);
	};
function be() {
	return typeof window < 'u';
}
function Ut(e) {
	return lr(e) ? (e.nodeName || '').toLowerCase() : '#document';
}
function ct(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function wt(e) {
	var t;
	return (t = (lr(e) ? e.ownerDocument : e.document) || window.document) == null
		? void 0
		: t.documentElement;
}
function lr(e) {
	return be() ? e instanceof Node || e instanceof ct(e).Node : !1;
}
function ft(e) {
	return be() ? e instanceof Element || e instanceof ct(e).Element : !1;
}
function vt(e) {
	return be() ? e instanceof HTMLElement || e instanceof ct(e).HTMLElement : !1;
}
function Mn(e) {
	return !be() || typeof ShadowRoot > 'u'
		? !1
		: e instanceof ShadowRoot || e instanceof ct(e).ShadowRoot;
}
const zo = new Set(['inline', 'contents']);
function te(e) {
	const { overflow: t, overflowX: n, overflowY: r, display: i } = gt(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !zo.has(i);
}
const Vo = new Set(['table', 'td', 'th']);
function Ho(e) {
	return Vo.has(Ut(e));
}
const Uo = [':popover-open', ':modal'];
function ye(e) {
	return Uo.some((t) => {
		try {
			return e.matches(t);
		} catch {
			return !1;
		}
	});
}
const Yo = ['transform', 'translate', 'scale', 'rotate', 'perspective'],
	qo = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'],
	Go = ['paint', 'layout', 'strict', 'content'];
function $e(e) {
	const t = tn(),
		n = ft(e) ? gt(e) : e;
	return (
		Yo.some((r) => (n[r] ? n[r] !== 'none' : !1)) ||
		(n.containerType ? n.containerType !== 'normal' : !1) ||
		(!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
		(!t && (n.filter ? n.filter !== 'none' : !1)) ||
		qo.some((r) => (n.willChange || '').includes(r)) ||
		Go.some((r) => (n.contain || '').includes(r))
	);
}
function Xo(e) {
	let t = Et(e);
	for (; vt(t) && !Kt(t); ) {
		if ($e(t)) return t;
		if (ye(t)) return null;
		t = Et(t);
	}
	return null;
}
function tn() {
	return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none');
}
const jo = new Set(['html', 'body', '#document']);
function Kt(e) {
	return jo.has(Ut(e));
}
function gt(e) {
	return ct(e).getComputedStyle(e);
}
function xe(e) {
	return ft(e)
		? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
		: { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function Et(e) {
	if (Ut(e) === 'html') return e;
	const t = e.assignedSlot || e.parentNode || (Mn(e) && e.host) || wt(e);
	return Mn(t) ? t.host : t;
}
function ur(e) {
	const t = Et(e);
	return Kt(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : vt(t) && te(t) ? t : ur(t);
}
function Jt(e, t, n) {
	var r;
	(t === void 0 && (t = []), n === void 0 && (n = !0));
	const i = ur(e),
		s = i === ((r = e.ownerDocument) == null ? void 0 : r.body),
		o = ct(i);
	if (s) {
		const a = Me(o);
		return t.concat(o, o.visualViewport || [], te(i) ? i : [], a && n ? Jt(a) : []);
	}
	return t.concat(i, Jt(i, [], n));
}
function Me(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function dr(e) {
	const t = gt(e);
	let n = parseFloat(t.width) || 0,
		r = parseFloat(t.height) || 0;
	const i = vt(e),
		s = i ? e.offsetWidth : n,
		o = i ? e.offsetHeight : r,
		a = ue(n) !== s || ue(r) !== o;
	return (a && ((n = s), (r = o)), { width: n, height: r, $: a });
}
function en(e) {
	return ft(e) ? e : e.contextElement;
}
function Wt(e) {
	const t = en(e);
	if (!vt(t)) return mt(1);
	const n = t.getBoundingClientRect(),
		{ width: r, height: i, $: s } = dr(t);
	let o = (s ? ue(n.width) : n.width) / r,
		a = (s ? ue(n.height) : n.height) / i;
	return (
		(!o || !Number.isFinite(o)) && (o = 1),
		(!a || !Number.isFinite(a)) && (a = 1),
		{ x: o, y: a }
	);
}
const Zo = mt(0);
function hr(e) {
	const t = ct(e);
	return !tn() || !t.visualViewport
		? Zo
		: { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function Jo(e, t, n) {
	return (t === void 0 && (t = !1), !n || (t && n !== ct(e)) ? !1 : t);
}
function kt(e, t, n, r) {
	(t === void 0 && (t = !1), n === void 0 && (n = !1));
	const i = e.getBoundingClientRect(),
		s = en(e);
	let o = mt(1);
	t && (r ? ft(r) && (o = Wt(r)) : (o = Wt(e)));
	const a = Jo(s, n, r) ? hr(s) : mt(0);
	let c = (i.left + a.x) / o.x,
		l = (i.top + a.y) / o.y,
		h = i.width / o.x,
		d = i.height / o.y;
	if (s) {
		const g = ct(s),
			f = r && ft(r) ? ct(r) : r;
		let p = g,
			v = Me(p);
		for (; v && r && f !== p; ) {
			const y = Wt(v),
				S = v.getBoundingClientRect(),
				E = gt(v),
				C = S.left + (v.clientLeft + parseFloat(E.paddingLeft)) * y.x,
				O = S.top + (v.clientTop + parseFloat(E.paddingTop)) * y.y;
			((c *= y.x),
				(l *= y.y),
				(h *= y.x),
				(d *= y.y),
				(c += C),
				(l += O),
				(p = ct(v)),
				(v = Me(p)));
		}
	}
	return he({ width: h, height: d, x: c, y: l });
}
function nn(e, t) {
	const n = xe(e).scrollLeft;
	return t ? t.left + n : kt(wt(e)).left + n;
}
function fr(e, t, n) {
	n === void 0 && (n = !1);
	const r = e.getBoundingClientRect(),
		i = r.left + t.scrollLeft - (n ? 0 : nn(e, r)),
		s = r.top + t.scrollTop;
	return { x: i, y: s };
}
function Qo(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e;
	const s = i === 'fixed',
		o = wt(r),
		a = t ? ye(t.floating) : !1;
	if (r === o || (a && s)) return n;
	let c = { scrollLeft: 0, scrollTop: 0 },
		l = mt(1);
	const h = mt(0),
		d = vt(r);
	if ((d || (!d && !s)) && ((Ut(r) !== 'body' || te(o)) && (c = xe(r)), vt(r))) {
		const f = kt(r);
		((l = Wt(r)), (h.x = f.x + r.clientLeft), (h.y = f.y + r.clientTop));
	}
	const g = o && !d && !s ? fr(o, c, !0) : mt(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + h.x + g.x,
		y: n.y * l.y - c.scrollTop * l.y + h.y + g.y
	};
}
function $o(e) {
	return Array.from(e.getClientRects());
}
function ts(e) {
	const t = wt(e),
		n = xe(e),
		r = e.ownerDocument.body,
		i = st(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
		s = st(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
	let o = -n.scrollLeft + nn(e);
	const a = -n.scrollTop;
	return (
		gt(r).direction === 'rtl' && (o += st(t.clientWidth, r.clientWidth) - i),
		{ width: i, height: s, x: o, y: a }
	);
}
function es(e, t) {
	const n = ct(e),
		r = wt(e),
		i = n.visualViewport;
	let s = r.clientWidth,
		o = r.clientHeight,
		a = 0,
		c = 0;
	if (i) {
		((s = i.width), (o = i.height));
		const l = tn();
		(!l || (l && t === 'fixed')) && ((a = i.offsetLeft), (c = i.offsetTop));
	}
	return { width: s, height: o, x: a, y: c };
}
const ns = new Set(['absolute', 'fixed']);
function rs(e, t) {
	const n = kt(e, !0, t === 'fixed'),
		r = n.top + e.clientTop,
		i = n.left + e.clientLeft,
		s = vt(e) ? Wt(e) : mt(1),
		o = e.clientWidth * s.x,
		a = e.clientHeight * s.y,
		c = i * s.x,
		l = r * s.y;
	return { width: o, height: a, x: c, y: l };
}
function Fn(e, t, n) {
	let r;
	if (t === 'viewport') r = es(e, n);
	else if (t === 'document') r = ts(wt(e));
	else if (ft(t)) r = rs(t, n);
	else {
		const i = hr(e);
		r = { x: t.x - i.x, y: t.y - i.y, width: t.width, height: t.height };
	}
	return he(r);
}
function gr(e, t) {
	const n = Et(e);
	return n === t || !ft(n) || Kt(n) ? !1 : gt(n).position === 'fixed' || gr(n, t);
}
function is(e, t) {
	const n = t.get(e);
	if (n) return n;
	let r = Jt(e, [], !1).filter((a) => ft(a) && Ut(a) !== 'body'),
		i = null;
	const s = gt(e).position === 'fixed';
	let o = s ? Et(e) : e;
	for (; ft(o) && !Kt(o); ) {
		const a = gt(o),
			c = $e(o);
		(!c && a.position === 'fixed' && (i = null),
			(
				s
					? !c && !i
					: (!c && a.position === 'static' && !!i && ns.has(i.position)) ||
						(te(o) && !c && gr(e, o))
			)
				? (r = r.filter((h) => h !== o))
				: (i = a),
			(o = Et(o)));
	}
	return (t.set(e, r), r);
}
function os(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e;
	const o = [...(n === 'clippingAncestors' ? (ye(t) ? [] : is(t, this._c)) : [].concat(n)), r],
		a = o[0],
		c = o.reduce(
			(l, h) => {
				const d = Fn(t, h, i);
				return (
					(l.top = st(d.top, l.top)),
					(l.right = Ct(d.right, l.right)),
					(l.bottom = Ct(d.bottom, l.bottom)),
					(l.left = st(d.left, l.left)),
					l
				);
			},
			Fn(t, a, i)
		);
	return { width: c.right - c.left, height: c.bottom - c.top, x: c.left, y: c.top };
}
function ss(e) {
	const { width: t, height: n } = dr(e);
	return { width: t, height: n };
}
function as(e, t, n) {
	const r = vt(t),
		i = wt(t),
		s = n === 'fixed',
		o = kt(e, !0, s, t);
	let a = { scrollLeft: 0, scrollTop: 0 };
	const c = mt(0);
	function l() {
		c.x = nn(i);
	}
	if (r || (!r && !s))
		if (((Ut(t) !== 'body' || te(i)) && (a = xe(t)), r)) {
			const f = kt(t, !0, s, t);
			((c.x = f.x + t.clientLeft), (c.y = f.y + t.clientTop));
		} else i && l();
	s && !r && i && l();
	const h = i && !r && !s ? fr(i, a) : mt(0),
		d = o.left + a.scrollLeft - c.x - h.x,
		g = o.top + a.scrollTop - c.y - h.y;
	return { x: d, y: g, width: o.width, height: o.height };
}
function Ae(e) {
	return gt(e).position === 'static';
}
function Nn(e, t) {
	if (!vt(e) || gt(e).position === 'fixed') return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return (wt(e) === n && (n = n.ownerDocument.body), n);
}
function pr(e, t) {
	const n = ct(e);
	if (ye(e)) return n;
	if (!vt(e)) {
		let i = Et(e);
		for (; i && !Kt(i); ) {
			if (ft(i) && !Ae(i)) return i;
			i = Et(i);
		}
		return n;
	}
	let r = Nn(e, t);
	for (; r && Ho(r) && Ae(r); ) r = Nn(r, t);
	return r && Kt(r) && Ae(r) && !$e(r) ? n : r || Xo(e) || n;
}
const cs = async function (e) {
	const t = this.getOffsetParent || pr,
		n = this.getDimensions,
		r = await n(e.floating);
	return {
		reference: as(e.reference, await t(e.floating), e.strategy),
		floating: { x: 0, y: 0, width: r.width, height: r.height }
	};
};
function ls(e) {
	return gt(e).direction === 'rtl';
}
const us = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Qo,
	getDocumentElement: wt,
	getClippingRect: os,
	getOffsetParent: pr,
	getElementRects: cs,
	getClientRects: $o,
	getDimensions: ss,
	getScale: Wt,
	isElement: ft,
	isRTL: ls
};
function mr(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function ds(e, t) {
	let n = null,
		r;
	const i = wt(e);
	function s() {
		var a;
		(clearTimeout(r), (a = n) == null || a.disconnect(), (n = null));
	}
	function o(a, c) {
		(a === void 0 && (a = !1), c === void 0 && (c = 1), s());
		const l = e.getBoundingClientRect(),
			{ left: h, top: d, width: g, height: f } = l;
		if ((a || t(), !g || !f)) return;
		const p = ne(d),
			v = ne(i.clientWidth - (h + g)),
			y = ne(i.clientHeight - (d + f)),
			S = ne(h),
			C = {
				rootMargin: -p + 'px ' + -v + 'px ' + -y + 'px ' + -S + 'px',
				threshold: st(0, Ct(1, c)) || 1
			};
		let O = !0;
		function M(R) {
			const F = R[0].intersectionRatio;
			if (F !== c) {
				if (!O) return o();
				F
					? o(!1, F)
					: (r = setTimeout(() => {
							o(!1, 1e-7);
						}, 1e3));
			}
			(F === 1 && !mr(l, e.getBoundingClientRect()) && o(), (O = !1));
		}
		try {
			n = new IntersectionObserver(M, { ...C, root: i.ownerDocument });
		} catch {
			n = new IntersectionObserver(M, C);
		}
		n.observe(e);
	}
	return (o(!0), s);
}
function hs(e, t, n, r) {
	r === void 0 && (r = {});
	const {
			ancestorScroll: i = !0,
			ancestorResize: s = !0,
			elementResize: o = typeof ResizeObserver == 'function',
			layoutShift: a = typeof IntersectionObserver == 'function',
			animationFrame: c = !1
		} = r,
		l = en(e),
		h = i || s ? [...(l ? Jt(l) : []), ...Jt(t)] : [];
	h.forEach((S) => {
		(i && S.addEventListener('scroll', n, { passive: !0 }), s && S.addEventListener('resize', n));
	});
	const d = l && a ? ds(l, n) : null;
	let g = -1,
		f = null;
	o &&
		((f = new ResizeObserver((S) => {
			let [E] = S;
			(E &&
				E.target === l &&
				f &&
				(f.unobserve(t),
				cancelAnimationFrame(g),
				(g = requestAnimationFrame(() => {
					var C;
					(C = f) == null || C.observe(t);
				}))),
				n());
		})),
		l && !c && f.observe(l),
		f.observe(t));
	let p,
		v = c ? kt(e) : null;
	c && y();
	function y() {
		const S = kt(e);
		(v && !mr(v, S) && n(), (v = S), (p = requestAnimationFrame(y)));
	}
	return (
		n(),
		() => {
			var S;
			(h.forEach((E) => {
				(i && E.removeEventListener('scroll', n), s && E.removeEventListener('resize', n));
			}),
				d?.(),
				(S = f) == null || S.disconnect(),
				(f = null),
				c && cancelAnimationFrame(p));
		}
	);
}
const fs = Bo,
	gs = Lo,
	ps = _o,
	ms = Ko,
	vs = Ro,
	ws = Io,
	bs = Wo,
	ys = (e, t, n) => {
		const r = new Map(),
			i = { platform: us, ...n },
			s = { ...i.platform, _c: r };
		return Do(e, t, { ...i, platform: s });
	};
function It(e) {
	return typeof e == 'function' ? e() : e;
}
function vr(e) {
	return typeof window > 'u' ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Dn(e, t) {
	const n = vr(e);
	return Math.round(t * n) / n;
}
function In(e) {
	return {
		[`--bits-${e}-content-transform-origin`]: 'var(--bits-floating-transform-origin)',
		[`--bits-${e}-content-available-width`]: 'var(--bits-floating-available-width)',
		[`--bits-${e}-content-available-height`]: 'var(--bits-floating-available-height)',
		[`--bits-${e}-anchor-width`]: 'var(--bits-floating-anchor-width)',
		[`--bits-${e}-anchor-height`]: 'var(--bits-floating-anchor-height)'
	};
}
function xs(e) {
	const t = e.whileElementsMounted,
		n = x(() => It(e.open) ?? !0),
		r = x(() => It(e.middleware)),
		i = x(() => It(e.transform) ?? !0),
		s = x(() => It(e.placement) ?? 'bottom'),
		o = x(() => It(e.strategy) ?? 'absolute'),
		a = x(() => It(e.sideOffset) ?? 0),
		c = x(() => It(e.alignOffset) ?? 0),
		l = e.reference;
	let h = D(0),
		d = D(0);
	const g = w(null);
	let f = D(Lt(u(o))),
		p = D(Lt(u(s))),
		v = D(Lt({})),
		y = D(!1);
	const S = x(() => {
		const F = g.current ? Dn(g.current, u(h)) : u(h),
			B = g.current ? Dn(g.current, u(d)) : u(d);
		return u(i)
			? {
					position: u(f),
					left: '0',
					top: '0',
					transform: `translate(${F}px, ${B}px)`,
					...(g.current && vr(g.current) >= 1.5 && { willChange: 'transform' })
				}
			: { position: u(f), left: `${F}px`, top: `${B}px` };
	});
	let E;
	function C() {
		l.current === null ||
			g.current === null ||
			ys(l.current, g.current, { middleware: u(r), placement: u(s), strategy: u(o) }).then((F) => {
				if (!u(n) && u(h) !== 0 && u(d) !== 0) {
					const B = Math.max(Math.abs(u(a)), Math.abs(u(c)), 15);
					if (F.x <= B && F.y <= B) return;
				}
				(b(h, F.x, !0),
					b(d, F.y, !0),
					b(f, F.strategy, !0),
					b(p, F.placement, !0),
					b(v, F.middlewareData, !0),
					b(y, !0));
			});
	}
	function O() {
		typeof E == 'function' && (E(), (E = void 0));
	}
	function M() {
		if ((O(), t === void 0)) {
			C();
			return;
		}
		l.current === null || g.current === null || (E = t(l.current, g.current, C));
	}
	function R() {
		u(n) || b(y, !1);
	}
	return (
		at(C),
		at(M),
		at(R),
		at(() => O),
		{
			floating: g,
			reference: l,
			get strategy() {
				return u(f);
			},
			get placement() {
				return u(p);
			},
			get middlewareData() {
				return u(v);
			},
			get isPositioned() {
				return u(y);
			},
			get floatingStyles() {
				return u(S);
			},
			get update() {
				return C;
			}
		}
	);
}
const Ss = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
	rn = new At('Floating.Root'),
	Fe = new At('Floating.Content'),
	on = new At('Floating.Root');
class fe {
	static create(t = !1) {
		return t ? on.set(new fe()) : rn.set(new fe());
	}
	anchorNode = w(null);
	customAnchorNode = w(null);
	triggerNode = w(null);
	constructor() {
		at(() => {
			this.customAnchorNode.current
				? typeof this.customAnchorNode.current == 'string'
					? (this.anchorNode.current = document.querySelector(this.customAnchorNode.current))
					: (this.anchorNode.current = this.customAnchorNode.current)
				: (this.anchorNode.current = this.triggerNode.current);
		});
	}
}
class ge {
	static create(t, n = !1) {
		return n ? Fe.set(new ge(t, on.get())) : Fe.set(new ge(t, rn.get()));
	}
	opts;
	root;
	contentRef = w(null);
	wrapperRef = w(null);
	arrowRef = w(null);
	contentAttachment = rt(this.contentRef);
	wrapperAttachment = rt(this.wrapperRef);
	arrowAttachment = rt(this.arrowRef);
	arrowId = w(je());
	#t = x(() => {
		if (typeof this.opts.style == 'string') return Yr(this.opts.style);
		if (!this.opts.style) return {};
	});
	#e = void 0;
	#n = new hi(() => this.arrowRef.current ?? void 0);
	#r = x(() => this.#n?.width ?? 0);
	#i = x(() => this.#n?.height ?? 0);
	#o = x(
		() =>
			this.opts.side?.current +
			(this.opts.align.current !== 'center' ? `-${this.opts.align.current}` : '')
	);
	#a = x(() =>
		Array.isArray(this.opts.collisionBoundary.current)
			? this.opts.collisionBoundary.current
			: [this.opts.collisionBoundary.current]
	);
	#s = x(() => u(this.#a).length > 0);
	get hasExplicitBoundaries() {
		return u(this.#s);
	}
	set hasExplicitBoundaries(t) {
		b(this.#s, t);
	}
	#c = x(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: u(this.#a).filter(_i),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return u(this.#c);
	}
	set detectOverflowOptions(t) {
		b(this.#c, t);
	}
	#d = D(void 0);
	#u = D(void 0);
	#l = D(void 0);
	#f = D(void 0);
	#g = x(() =>
		[
			fs({
				mainAxis: this.opts.sideOffset.current + u(this.#i),
				alignmentAxis: this.opts.alignOffset.current
			}),
			this.opts.avoidCollisions.current &&
				gs({
					mainAxis: !0,
					crossAxis: !1,
					limiter: this.opts.sticky.current === 'partial' ? bs() : void 0,
					...this.detectOverflowOptions
				}),
			this.opts.avoidCollisions.current && ps({ ...this.detectOverflowOptions }),
			ms({
				...this.detectOverflowOptions,
				apply: ({ rects: t, availableWidth: n, availableHeight: r }) => {
					const { width: i, height: s } = t.reference;
					(b(this.#d, n, !0), b(this.#u, r, !0), b(this.#l, i, !0), b(this.#f, s, !0));
				}
			}),
			this.arrowRef.current &&
				ws({ element: this.arrowRef.current, padding: this.opts.arrowPadding.current }),
			As({ arrowWidth: u(this.#r), arrowHeight: u(this.#i) }),
			this.opts.hideWhenDetached.current &&
				vs({ strategy: 'referenceHidden', ...this.detectOverflowOptions })
		].filter(Boolean)
	);
	get middleware() {
		return u(this.#g);
	}
	set middleware(t) {
		b(this.#g, t);
	}
	floating;
	#p = x(() => Os(this.floating.placement));
	get placedSide() {
		return u(this.#p);
	}
	set placedSide(t) {
		b(this.#p, t);
	}
	#m = x(() => Ps(this.floating.placement));
	get placedAlign() {
		return u(this.#m);
	}
	set placedAlign(t) {
		b(this.#m, t);
	}
	#h = x(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return u(this.#h);
	}
	set arrowX(t) {
		b(this.#h, t);
	}
	#v = x(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return u(this.#v);
	}
	set arrowY(t) {
		b(this.#v, t);
	}
	#w = x(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return u(this.#w);
	}
	set cannotCenterArrow(t) {
		b(this.#w, t);
	}
	#b = D();
	get contentZIndex() {
		return u(this.#b);
	}
	set contentZIndex(t) {
		b(this.#b, t, !0);
	}
	#y = x(() => Ss[this.placedSide]);
	get arrowBaseSide() {
		return u(this.#y);
	}
	set arrowBaseSide(t) {
		b(this.#y, t);
	}
	#x = x(() => ({
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
			'--bits-floating-available-width': `${u(this.#d)}px`,
			'--bits-floating-available-height': `${u(this.#u)}px`,
			'--bits-floating-anchor-width': `${u(this.#l)}px`,
			'--bits-floating-anchor-height': `${u(this.#f)}px`,
			...(this.floating.middlewareData.hide?.referenceHidden && {
				visibility: 'hidden',
				'pointer-events': 'none'
			}),
			...u(this.#t)
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return u(this.#x);
	}
	set wrapperProps(t) {
		b(this.#x, t);
	}
	#S = x(() => ({
		'data-side': this.placedSide,
		'data-align': this.placedAlign,
		style: qr({ ...u(this.#t) }),
		...this.contentAttachment
	}));
	get props() {
		return u(this.#S);
	}
	set props(t) {
		b(this.#S, t);
	}
	#A = x(() => ({
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
		return u(this.#A);
	}
	set arrowStyle(t) {
		b(this.#A, t);
	}
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			t.customAnchor && (this.root.customAnchorNode.current = t.customAnchor.current),
			X(
				() => t.customAnchor.current,
				(r) => {
					this.root.customAnchorNode.current = r;
				}
			),
			(this.floating = xs({
				strategy: () => this.opts.strategy.current,
				placement: () => u(this.#o),
				middleware: () => this.middleware,
				reference: this.root.anchorNode,
				whileElementsMounted: (...r) => hs(...r, { animationFrame: this.#e?.current === 'always' }),
				open: () => this.opts.enabled.current,
				sideOffset: () => this.opts.sideOffset.current,
				alignOffset: () => this.opts.alignOffset.current
			})),
			at(() => {
				this.floating.isPositioned && this.opts.onPlaced?.current();
			}),
			X(
				() => this.contentRef.current,
				(r) => {
					if (!r) return;
					const i = jt(r);
					this.contentZIndex = i.getComputedStyle(r).zIndex;
				}
			),
			at(() => {
				this.floating.floating.current = this.wrapperRef.current;
			}));
	}
}
class wr {
	static create(t) {
		return new wr(t, Fe.get());
	}
	opts;
	content;
	constructor(t, n) {
		((this.opts = t), (this.content = n));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		style: this.content.arrowStyle,
		'data-side': this.content.placedSide,
		...this.content.arrowAttachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class pe {
	static create(t, n = !1) {
		return n ? new pe(t, on.get()) : new pe(t, rn.get());
	}
	opts;
	root;
	constructor(t, n) {
		((this.opts = t),
			(this.root = n),
			t.virtualEl && t.virtualEl.current
				? (n.triggerNode = w.from(t.virtualEl.current))
				: (n.triggerNode = t.ref));
	}
}
function As(e) {
	return {
		name: 'transformOrigin',
		options: e,
		fn(t) {
			const { placement: n, rects: r, middlewareData: i } = t,
				o = i.arrow?.centerOffset !== 0,
				a = o ? 0 : e.arrowWidth,
				c = o ? 0 : e.arrowHeight,
				[l, h] = sn(n),
				d = { start: '0%', center: '50%', end: '100%' }[h],
				g = (i.arrow?.x ?? 0) + a / 2,
				f = (i.arrow?.y ?? 0) + c / 2;
			let p = '',
				v = '';
			return (
				l === 'bottom'
					? ((p = o ? d : `${g}px`), (v = `${-c}px`))
					: l === 'top'
						? ((p = o ? d : `${g}px`), (v = `${r.floating.height + c}px`))
						: l === 'right'
							? ((p = `${-c}px`), (v = o ? d : `${f}px`))
							: l === 'left' && ((p = `${r.floating.width + c}px`), (v = o ? d : `${f}px`)),
				{ data: { x: p, y: v } }
			);
		}
	};
}
function sn(e) {
	const [t, n = 'center'] = e.split('-');
	return [t, n];
}
function Os(e) {
	return sn(e)[0];
}
function Ps(e) {
	return sn(e)[1];
}
function Cs(e, t) {
	I(t, !0);
	let n = m(t, 'tooltip', 3, !1);
	fe.create(n());
	var r = T(),
		i = P(r);
	(N(i, () => t.children ?? k), A(e, r), _());
}
const Es = { afterMs: 1e4, onChange: z };
function br(e, t) {
	const { afterMs: n, onChange: r, getWindow: i } = { ...Es, ...t };
	let s = null,
		o = D(Lt(e));
	function a() {
		return i().setTimeout(() => {
			(b(o, e, !0), r?.(e));
		}, n);
	}
	return (
		at(() => () => {
			s && i().clearTimeout(s);
		}),
		w.with(
			() => u(o),
			(c) => {
				(b(o, c, !0), r?.(c), s && i().clearTimeout(s), (s = a()));
			}
		)
	);
}
class Ts {
	#t;
	#e;
	#n = x(() => (this.#t.onMatch ? this.#t.onMatch : (t) => t.focus()));
	#r = x(() => (this.#t.getCurrentItem ? this.#t.getCurrentItem : this.#t.getActiveElement));
	constructor(t) {
		((this.#t = t),
			(this.#e = br('', { afterMs: 1e3, getWindow: t.getWindow })),
			(this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this)),
			(this.resetTypeahead = this.resetTypeahead.bind(this)));
	}
	handleTypeaheadSearch(t, n) {
		if (!n.length) return;
		this.#e.current = this.#e.current + t;
		const r = u(this.#r)(),
			i = n.find((c) => c === r)?.textContent?.trim() ?? '',
			s = n.map((c) => c.textContent?.trim() ?? ''),
			o = sr(s, this.#e.current, i),
			a = n.find((c) => c.textContent?.trim() === o);
		return (a && u(this.#n)(a), a);
	}
	resetTypeahead() {
		this.#e.current = '';
	}
	get search() {
		return this.#e.current;
	}
}
function Ms(e, t) {
	I(t, !0);
	let n = m(t, 'tooltip', 3, !1);
	pe.create({ id: w.with(() => t.id), virtualEl: w.with(() => t.virtualEl), ref: t.ref }, n());
	var r = T(),
		i = P(r);
	(N(i, () => t.children ?? k), A(e, r), _());
}
function Fs(e, t) {
	I(t, !0);
	let n = m(t, 'side', 3, 'bottom'),
		r = m(t, 'sideOffset', 3, 0),
		i = m(t, 'align', 3, 'center'),
		s = m(t, 'alignOffset', 3, 0),
		o = m(t, 'arrowPadding', 3, 0),
		a = m(t, 'avoidCollisions', 3, !0),
		c = m(t, 'collisionBoundary', 19, () => []),
		l = m(t, 'collisionPadding', 3, 0),
		h = m(t, 'hideWhenDetached', 3, !1),
		d = m(t, 'onPlaced', 3, () => {}),
		g = m(t, 'sticky', 3, 'partial'),
		f = m(t, 'updatePositionStrategy', 3, 'optimized'),
		p = m(t, 'strategy', 3, 'fixed'),
		v = m(t, 'dir', 3, 'ltr'),
		y = m(t, 'style', 19, () => ({})),
		S = m(t, 'wrapperId', 19, je),
		E = m(t, 'customAnchor', 3, null),
		C = m(t, 'tooltip', 3, !1);
	const O = ge.create(
			{
				side: w.with(() => n()),
				sideOffset: w.with(() => r()),
				align: w.with(() => i()),
				alignOffset: w.with(() => s()),
				id: w.with(() => t.id),
				arrowPadding: w.with(() => o()),
				avoidCollisions: w.with(() => a()),
				collisionBoundary: w.with(() => c()),
				collisionPadding: w.with(() => l()),
				hideWhenDetached: w.with(() => h()),
				onPlaced: w.with(() => d()),
				sticky: w.with(() => g()),
				updatePositionStrategy: w.with(() => f()),
				strategy: w.with(() => p()),
				dir: w.with(() => v()),
				style: w.with(() => y()),
				enabled: w.with(() => t.enabled),
				wrapperId: w.with(() => S()),
				customAnchor: w.with(() => E())
			},
			C()
		),
		M = x(() => et(O.wrapperProps, { style: { pointerEvents: 'auto' } }));
	var R = T(),
		F = P(R);
	(N(
		F,
		() => t.content ?? k,
		() => ({ props: O.props, wrapperProps: u(M) })
	),
		A(e, R),
		_());
}
function Ns(e, t) {
	(I(t, !0),
		ai(() => {
			t.onPlaced?.();
		}));
	var n = T(),
		r = P(n);
	(N(
		r,
		() => t.content ?? k,
		() => ({ props: {}, wrapperProps: {} })
	),
		A(e, n),
		_());
}
function Ds(e, t) {
	let n = m(t, 'isStatic', 3, !1),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'content', 'isStatic', 'onPlaced']);
	var i = T(),
		s = P(i);
	{
		var o = (c) => {
				Ns(c, {
					get content() {
						return t.content;
					},
					get onPlaced() {
						return t.onPlaced;
					}
				});
			},
			a = (c) => {
				Fs(
					c,
					U(
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
		Q(s, (c) => {
			n() ? c(o) : c(a, !1);
		});
	}
	A(e, i);
}
var Is = nt('<!> <!>', 1);
function yr(e, t) {
	I(t, !0);
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = m(t, 'tooltip', 3, !1),
		c = W(t, [
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
	(Ds(e, {
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
		content: (h, d) => {
			let g = () => d?.().props,
				f = () => d?.().wrapperProps;
			var p = Is(),
				v = P(p);
			{
				var y = (C) => {
						le(C, {
							get preventScroll() {
								return t.preventScroll;
							}
						});
					},
					S = (C) => {
						var O = T(),
							M = P(O);
						{
							var R = (F) => {
								le(F, {
									get preventScroll() {
										return t.preventScroll;
									}
								});
							};
							Q(
								M,
								(F) => {
									t.forceMount || F(R);
								},
								!0
							);
						}
						A(C, O);
					};
				Q(v, (C) => {
					t.forceMount && t.enabled ? C(y) : C(S, !1);
				});
			}
			var E = Xt(v, 2);
			(ir(E, {
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
				focusScope: (O, M) => {
					let R = () => M?.().props;
					Gn(O, {
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
						children: (F, B) => {
							{
								const Z = (K, J) => {
									let j = () => J?.().props;
									or(K, {
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
										children: (tt, L) => {
											var V = T(),
												Y = P(V);
											{
												let q = x(() => ({
													props: et(c, g(), j(), R(), { style: { pointerEvents: 'auto' } }),
													wrapperProps: f()
												}));
												N(
													Y,
													() => t.popper ?? k,
													() => u(q)
												);
											}
											A(tt, V);
										},
										$$slots: { default: !0 }
									});
								};
								qn(F, {
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
									isValidEvent: i(),
									get enabled() {
										return t.enabled;
									},
									get ref() {
										return t.ref;
									},
									children: Z,
									$$slots: { default: !0 }
								});
							}
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { focusScope: !0 }
			}),
				A(h, p));
		},
		$$slots: { content: !0 }
	}),
		_());
}
function _s(e, t) {
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = W(t, [
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
	Re(e, {
		get open() {
			return t.open;
		},
		get ref() {
			return t.ref;
		},
		presence: (l) => {
			yr(
				l,
				U(
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
						isValidEvent: i(),
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
function Rs(e, t) {
	let n = m(t, 'interactOutsideBehavior', 3, 'close'),
		r = m(t, 'trapFocus', 3, !0),
		i = m(t, 'isValidEvent', 3, () => !1),
		s = m(t, 'customAnchor', 3, null),
		o = m(t, 'isStatic', 3, !1),
		a = W(t, [
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
	yr(
		e,
		U(
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
				isValidEvent: i(),
				get onFocusOutside() {
					return t.onFocusOutside;
				}
			},
			() => a,
			{ forceMount: !0 }
		)
	);
}
const ks = [we, Qt],
	Bs = [kn, Gr, Xr],
	xr = [jr, Zr, Jr],
	Ls = [...Bs, ...xr];
function Bt(e) {
	return e.pointerType === 'mouse';
}
function Ws(e, { select: t = !1 } = {}) {
	if (!e || !e.focus) return;
	const n = $t(e);
	if (n.activeElement === e) return;
	const r = n.activeElement;
	(e.focus({ preventScroll: !0 }), e !== r && Ri(e) && t && e.select());
}
function Ks(e, { select: t = !1 } = {}, n) {
	const r = n();
	for (const i of e) if ((Ws(i, { select: t }), n() !== r)) return !0;
}
function Gt() {
	return {
		getShadowRoot: !0,
		displayCheck:
			typeof ResizeObserver == 'function' && ResizeObserver.toString().includes('[native code]')
				? 'full'
				: 'none'
	};
}
function zs(e, t) {
	if (!qe(e, Gt())) return Vs(e, t);
	const n = $t(e),
		r = er(n.body, Gt());
	t === 'prev' && r.reverse();
	const i = r.indexOf(e);
	return i === -1 ? n.body : r.slice(i + 1)[0];
}
function Vs(e, t) {
	const n = $t(e);
	if (!rr(e, Gt())) return n.body;
	const r = nr(n.body, Gt());
	t === 'prev' && r.reverse();
	const i = r.indexOf(e);
	return i === -1 ? n.body : (r.slice(i + 1).find((o) => qe(o, Gt())) ?? n.body);
}
class Hs {
	#t;
	#e;
	#n;
	#r = D(null);
	constructor(t) {
		((this.#t = t),
			(this.#e = x(() => this.#t.enabled())),
			(this.#n = br(!1, {
				afterMs: t.transitTimeout ?? 300,
				onChange: (n) => {
					u(this.#e) && this.#t.setIsPointerInTransit?.(n);
				},
				getWindow: () => jt(this.#t.triggerNode())
			})),
			X([t.triggerNode, t.contentNode, t.enabled], ([n, r, i]) => {
				if (!n || !r || !i) return;
				const s = (a) => {
						this.#o(a, r);
					},
					o = (a) => {
						this.#o(a, n);
					};
				return _t($(n, 'pointerleave', s), $(r, 'pointerleave', o));
			}),
			X(
				() => u(this.#r),
				() => {
					const n = (i) => {
							if (!u(this.#r)) return;
							const s = i.target;
							if (!ie(s)) return;
							const o = { x: i.clientX, y: i.clientY },
								a = t.triggerNode()?.contains(s) || t.contentNode()?.contains(s),
								c = !Gs(o, u(this.#r));
							a ? this.#i() : c && (this.#i(), t.onPointerExit());
						},
						r = $t(t.triggerNode() ?? t.contentNode());
					if (r) return $(r, 'pointermove', n);
				}
			));
	}
	#i() {
		(b(this.#r, null), (this.#n.current = !1));
	}
	#o(t, n) {
		const r = t.currentTarget;
		if (!Pt(r)) return;
		const i = { x: t.clientX, y: t.clientY },
			s = Us(i, r.getBoundingClientRect()),
			o = Ys(i, s),
			a = qs(n.getBoundingClientRect()),
			c = Xs([...o, ...a]);
		(b(this.#r, c, !0), (this.#n.current = !0));
	}
}
function Us(e, t) {
	const n = Math.abs(t.top - e.y),
		r = Math.abs(t.bottom - e.y),
		i = Math.abs(t.right - e.x),
		s = Math.abs(t.left - e.x);
	switch (Math.min(n, r, i, s)) {
		case s:
			return 'left';
		case i:
			return 'right';
		case n:
			return 'top';
		case r:
			return 'bottom';
		default:
			throw new Error('unreachable');
	}
}
function Ys(e, t, n = 5) {
	const r = n * 1.5;
	switch (t) {
		case 'top':
			return [
				{ x: e.x - n, y: e.y + n },
				{ x: e.x, y: e.y - r },
				{ x: e.x + n, y: e.y + n }
			];
		case 'bottom':
			return [
				{ x: e.x - n, y: e.y - n },
				{ x: e.x, y: e.y + r },
				{ x: e.x + n, y: e.y - n }
			];
		case 'left':
			return [
				{ x: e.x + n, y: e.y - n },
				{ x: e.x - r, y: e.y },
				{ x: e.x + n, y: e.y + n }
			];
		case 'right':
			return [
				{ x: e.x - n, y: e.y - n },
				{ x: e.x + r, y: e.y },
				{ x: e.x - n, y: e.y + n }
			];
	}
}
function qs(e) {
	const { top: t, right: n, bottom: r, left: i } = e;
	return [
		{ x: i, y: t },
		{ x: n, y: t },
		{ x: n, y: r },
		{ x: i, y: r }
	];
}
function Gs(e, t) {
	const { x: n, y: r } = e;
	let i = !1;
	for (let s = 0, o = t.length - 1; s < t.length; o = s++) {
		const a = t[s].x,
			c = t[s].y,
			l = t[o].x,
			h = t[o].y;
		c > r != h > r && n < ((l - a) * (r - c)) / (h - c) + a && (i = !i);
	}
	return i;
}
function Xs(e) {
	const t = e.slice();
	return (
		t.sort((n, r) => (n.x < r.x ? -1 : n.x > r.x ? 1 : n.y < r.y ? -1 : n.y > r.y ? 1 : 0)),
		js(t)
	);
}
function js(e) {
	if (e.length <= 1) return e.slice();
	const t = [];
	for (let r = 0; r < e.length; r++) {
		const i = e[r];
		for (; t.length >= 2; ) {
			const s = t[t.length - 1],
				o = t[t.length - 2];
			if ((s.x - o.x) * (i.y - o.y) >= (s.y - o.y) * (i.x - o.x)) t.pop();
			else break;
		}
		t.push(i);
	}
	t.pop();
	const n = [];
	for (let r = e.length - 1; r >= 0; r--) {
		const i = e[r];
		for (; n.length >= 2; ) {
			const s = n[n.length - 1],
				o = n[n.length - 2];
			if ((s.x - o.x) * (i.y - o.y) >= (s.y - o.y) * (i.x - o.x)) n.pop();
			else break;
		}
		n.push(i);
	}
	return (
		n.pop(),
		t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n)
	);
}
const Zs = 'data-context-menu-trigger',
	an = new At('Menu.Root'),
	Se = new At('Menu.Root | Menu.Sub'),
	Sr = new At('Menu.Content'),
	Js = new At('Menu.Group | Menu.RadioGroup'),
	Qs = new Vi('bitsmenuopen', { bubbles: !1, cancelable: !0 }),
	$s = Rn({
		component: 'menu',
		parts: [
			'trigger',
			'content',
			'sub-trigger',
			'item',
			'group',
			'group-heading',
			'checkbox-group',
			'checkbox-item',
			'radio-group',
			'radio-item',
			'separator',
			'sub-content',
			'arrow'
		]
	});
class cn {
	static create(t) {
		const n = new cn(t);
		return an.set(n);
	}
	opts;
	isUsingKeyboard = new Ot();
	#t = D(!1);
	get ignoreCloseAutoFocus() {
		return u(this.#t);
	}
	set ignoreCloseAutoFocus(t) {
		b(this.#t, t, !0);
	}
	#e = D(!1);
	get isPointerInTransit() {
		return u(this.#e);
	}
	set isPointerInTransit(t) {
		b(this.#e, t, !0);
	}
	constructor(t) {
		this.opts = t;
	}
	getBitsAttr = (t) => $s.getAttr(t, this.opts.variant.current);
}
class ln {
	static create(t, n) {
		return Se.set(new ln(t, n, null));
	}
	opts;
	root;
	parentMenu;
	contentId = w.with(() => '');
	#t = D(null);
	get contentNode() {
		return u(this.#t);
	}
	set contentNode(t) {
		b(this.#t, t, !0);
	}
	#e = D(null);
	get triggerNode() {
		return u(this.#e);
	}
	set triggerNode(t) {
		b(this.#e, t, !0);
	}
	constructor(t, n, r) {
		((this.opts = t),
			(this.root = n),
			(this.parentMenu = r),
			new Wn({
				ref: w.with(() => this.contentNode),
				open: this.opts.open,
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}),
			r &&
				X(
					() => r.opts.open.current,
					() => {
						r.opts.open.current || (this.opts.open.current = !1);
					}
				));
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	onOpen() {
		this.opts.open.current = !0;
	}
	onClose() {
		this.opts.open.current = !1;
	}
}
class un {
	static create(t) {
		return Sr.set(new un(t, Se.get()));
	}
	opts;
	parentMenu;
	rovingFocusGroup;
	domContext;
	attachment;
	#t = D('');
	get search() {
		return u(this.#t);
	}
	set search(t) {
		b(this.#t, t, !0);
	}
	#e = 0;
	#n;
	#r = D(!1);
	get mounted() {
		return u(this.#r);
	}
	set mounted(t) {
		b(this.#r, t, !0);
	}
	#i;
	constructor(t, n) {
		((this.opts = t),
			(this.parentMenu = n),
			(this.domContext = new _e(t.ref)),
			(this.attachment = rt(this.opts.ref, (r) => {
				this.parentMenu.contentNode !== r && (this.parentMenu.contentNode = r);
			})),
			(n.contentId = t.id),
			(this.#i = t.isSub ?? !1),
			(this.onkeydown = this.onkeydown.bind(this)),
			(this.onblur = this.onblur.bind(this)),
			(this.onfocus = this.onfocus.bind(this)),
			(this.handleInteractOutside = this.handleInteractOutside.bind(this)),
			new Hs({
				contentNode: () => this.parentMenu.contentNode,
				triggerNode: () => this.parentMenu.triggerNode,
				enabled: () =>
					this.parentMenu.opts.open.current &&
					!!this.parentMenu.triggerNode?.hasAttribute(
						this.parentMenu.root.getBitsAttr('sub-trigger')
					),
				onPointerExit: () => {
					this.parentMenu.opts.open.current = !1;
				},
				setIsPointerInTransit: (r) => {
					this.parentMenu.root.isPointerInTransit = r;
				}
			}),
			(this.#n = new Ts({
				getActiveElement: () => this.domContext.getActiveElement(),
				getWindow: () => this.domContext.getWindow()
			}).handleTypeaheadSearch),
			(this.rovingFocusGroup = new $r({
				rootNode: w.with(() => this.parentMenu.contentNode),
				candidateAttr: this.parentMenu.root.getBitsAttr('item'),
				loop: this.opts.loop,
				orientation: w.with(() => 'vertical')
			})),
			X(
				() => this.parentMenu.contentNode,
				(r) => {
					if (!r) return;
					const i = () => {
						bt(() => {
							this.parentMenu.root.isUsingKeyboard.current &&
								this.rovingFocusGroup.focusFirstCandidate();
						});
					};
					return Qs.listen(r, i);
				}
			),
			at(() => {
				this.parentMenu.opts.open.current || this.domContext.getWindow().clearTimeout(this.#e);
			}));
	}
	#o() {
		const t = this.parentMenu.contentNode;
		return t
			? Array.from(
					t.querySelectorAll(`[${this.parentMenu.root.getBitsAttr('item')}]:not([data-disabled])`)
				)
			: [];
	}
	#a() {
		return this.parentMenu.root.isPointerInTransit;
	}
	onCloseAutoFocus = (t) => {
		(this.opts.onCloseAutoFocus.current(t),
			!(t.defaultPrevented || this.#i) &&
				this.parentMenu.triggerNode &&
				qe(this.parentMenu.triggerNode) &&
				this.parentMenu.triggerNode.focus());
	};
	handleTabKeyDown(t) {
		let n = this.parentMenu;
		for (; n.parentMenu !== null; ) n = n.parentMenu;
		if (!n.triggerNode) return;
		t.preventDefault();
		const r = zs(n.triggerNode, t.shiftKey ? 'prev' : 'next');
		r
			? ((this.parentMenu.root.ignoreCloseAutoFocus = !0),
				n.onClose(),
				bt(() => {
					(r.focus(),
						bt(() => {
							this.parentMenu.root.ignoreCloseAutoFocus = !1;
						}));
				}))
			: this.domContext.getDocument().body.focus();
	}
	onkeydown(t) {
		if (t.defaultPrevented) return;
		if (t.key === ti) {
			this.handleTabKeyDown(t);
			return;
		}
		const n = t.target,
			r = t.currentTarget;
		if (!Pt(n) || !Pt(r)) return;
		const i =
				n.closest(`[${this.parentMenu.root.getBitsAttr('content')}]`)?.id ===
				this.parentMenu.contentId.current,
			s = t.ctrlKey || t.altKey || t.metaKey,
			o = t.key.length === 1;
		if (this.rovingFocusGroup.handleKeydown(n, t) || t.code === 'Space') return;
		const c = this.#o();
		(i && !s && o && this.#n(t.key, c),
			t.target?.id === this.parentMenu.contentId.current &&
				Ls.includes(t.key) &&
				(t.preventDefault(),
				xr.includes(t.key) && c.reverse(),
				Ks(c, { select: !1 }, () => this.domContext.getActiveElement())));
	}
	onblur(t) {
		ie(t.currentTarget) &&
			ie(t.target) &&
			(t.currentTarget.contains?.(t.target) ||
				(this.domContext.getWindow().clearTimeout(this.#e), (this.search = '')));
	}
	onfocus(t) {
		this.parentMenu.root.isUsingKeyboard.current &&
			bt(() => this.rovingFocusGroup.focusFirstCandidate());
	}
	onItemEnter() {
		return this.#a();
	}
	onItemLeave(t) {
		if (
			t.currentTarget.hasAttribute(this.parentMenu.root.getBitsAttr('sub-trigger')) ||
			this.#a() ||
			this.parentMenu.root.isUsingKeyboard.current
		)
			return;
		(this.parentMenu.contentNode?.focus(), this.rovingFocusGroup.setCurrentTabStopId(''));
	}
	onTriggerLeave() {
		return !!this.#a();
	}
	onOpenAutoFocus = (t) => {
		if (t.defaultPrevented) return;
		(t.preventDefault(), this.parentMenu.contentNode?.focus());
	};
	handleInteractOutside(t) {
		if (!Ii(t.target)) return;
		const n = this.parentMenu.triggerNode?.id;
		if (t.target.id === n) {
			t.preventDefault();
			return;
		}
		t.target.closest(`#${n}`) && t.preventDefault();
	}
	#s = x(() => ({ open: this.parentMenu.opts.open.current }));
	get snippetProps() {
		return u(this.#s);
	}
	set snippetProps(t) {
		b(this.#s, t);
	}
	#c = x(() => ({
		id: this.opts.id.current,
		role: 'menu',
		'aria-orientation': ei('vertical'),
		[this.parentMenu.root.getBitsAttr('content')]: '',
		'data-state': ve(this.parentMenu.opts.open.current),
		onkeydown: this.onkeydown,
		onblur: this.onblur,
		onfocus: this.onfocus,
		dir: this.parentMenu.root.opts.dir.current,
		style: { pointerEvents: 'auto' },
		...this.attachment
	}));
	get props() {
		return u(this.#c);
	}
	set props(t) {
		b(this.#c, t);
	}
	popperProps = { onCloseAutoFocus: (t) => this.onCloseAutoFocus(t) };
}
class ta {
	opts;
	content;
	attachment;
	#t = D(!1);
	constructor(t, n) {
		((this.opts = t),
			(this.content = n),
			(this.attachment = rt(this.opts.ref)),
			(this.onpointermove = this.onpointermove.bind(this)),
			(this.onpointerleave = this.onpointerleave.bind(this)),
			(this.onfocus = this.onfocus.bind(this)),
			(this.onblur = this.onblur.bind(this)));
	}
	onpointermove(t) {
		if (!t.defaultPrevented && Bt(t))
			if (this.opts.disabled.current) this.content.onItemLeave(t);
			else {
				if (this.content.onItemEnter()) return;
				const r = t.currentTarget;
				if (!Pt(r)) return;
				r.focus();
			}
	}
	onpointerleave(t) {
		t.defaultPrevented || (Bt(t) && this.content.onItemLeave(t));
	}
	onfocus(t) {
		bt(() => {
			t.defaultPrevented || this.opts.disabled.current || b(this.#t, !0);
		});
	}
	onblur(t) {
		bt(() => {
			t.defaultPrevented || b(this.#t, !1);
		});
	}
	#e = x(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		role: 'menuitem',
		'aria-disabled': ni(this.opts.disabled.current),
		'data-disabled': De(this.opts.disabled.current),
		'data-highlighted': u(this.#t) ? '' : void 0,
		[this.content.parentMenu.root.getBitsAttr('item')]: '',
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onfocus: this.onfocus,
		onblur: this.onblur,
		...this.attachment
	}));
	get props() {
		return u(this.#e);
	}
	set props(t) {
		b(this.#e, t);
	}
}
class dn {
	static create(t) {
		const n = new ta(t, Sr.get());
		return new dn(t, n);
	}
	opts;
	item;
	root;
	#t = !1;
	constructor(t, n) {
		((this.opts = t),
			(this.item = n),
			(this.root = n.content.parentMenu.root),
			(this.onkeydown = this.onkeydown.bind(this)),
			(this.onclick = this.onclick.bind(this)),
			(this.onpointerdown = this.onpointerdown.bind(this)),
			(this.onpointerup = this.onpointerup.bind(this)));
	}
	#e() {
		if (this.item.opts.disabled.current) return;
		const t = new CustomEvent('menuitemselect', { bubbles: !0, cancelable: !0 });
		if ((this.opts.onSelect.current(t), t.defaultPrevented)) {
			this.item.content.parentMenu.root.isUsingKeyboard.current = !1;
			return;
		}
		this.opts.closeOnSelect.current && this.item.content.parentMenu.root.opts.onClose();
	}
	onkeydown(t) {
		const n = this.item.content.search !== '';
		if (!(this.item.opts.disabled.current || (n && t.key === Qt)) && ks.includes(t.key)) {
			if (!Pt(t.currentTarget)) return;
			(t.currentTarget.click(), t.preventDefault());
		}
	}
	onclick(t) {
		this.item.opts.disabled.current || this.#e();
	}
	onpointerup(t) {
		if (!t.defaultPrevented && !this.#t) {
			if (!Pt(t.currentTarget)) return;
			t.currentTarget?.click();
		}
	}
	onpointerdown(t) {
		this.#t = !0;
	}
	#n = x(() =>
		et(this.item.props, {
			onclick: this.onclick,
			onpointerdown: this.onpointerdown,
			onpointerup: this.onpointerup,
			onkeydown: this.onkeydown
		})
	);
	get props() {
		return u(this.#n);
	}
	set props(t) {
		b(this.#n, t);
	}
}
class Ar {
	static create(t) {
		return Js.set(new Ar(t, an.get()));
	}
	opts;
	root;
	attachment;
	#t = D(void 0);
	get groupHeadingId() {
		return u(this.#t);
	}
	set groupHeadingId(t) {
		b(this.#t, t, !0);
	}
	constructor(t, n) {
		((this.opts = t), (this.root = n), (this.attachment = rt(this.opts.ref)));
	}
	#e = x(() => ({
		id: this.opts.id.current,
		role: 'group',
		'aria-labelledby': this.groupHeadingId,
		[this.root.getBitsAttr('group')]: '',
		...this.attachment
	}));
	get props() {
		return u(this.#e);
	}
	set props(t) {
		b(this.#e, t);
	}
}
class Or {
	static create(t) {
		return new Or(t, an.get());
	}
	opts;
	root;
	attachment;
	constructor(t, n) {
		((this.opts = t), (this.root = n), (this.attachment = rt(this.opts.ref)));
	}
	#t = x(() => ({
		id: this.opts.id.current,
		role: 'group',
		[this.root.getBitsAttr('separator')]: '',
		...this.attachment
	}));
	get props() {
		return u(this.#t);
	}
	set props(t) {
		b(this.#t, t);
	}
}
class hn {
	static create(t) {
		return new hn(t, Se.get());
	}
	opts;
	parentMenu;
	attachment;
	constructor(t, n) {
		((this.opts = t),
			(this.parentMenu = n),
			(this.attachment = rt(this.opts.ref, (r) => (this.parentMenu.triggerNode = r))));
	}
	onpointerdown = (t) => {
		if (!this.opts.disabled.current) {
			if (t.pointerType === 'touch') return t.preventDefault();
			t.button === 0 &&
				t.ctrlKey === !1 &&
				(this.parentMenu.toggleOpen(), this.parentMenu.opts.open.current || t.preventDefault());
		}
	};
	onpointerup = (t) => {
		this.opts.disabled.current ||
			(t.pointerType === 'touch' && (t.preventDefault(), this.parentMenu.toggleOpen()));
	};
	onkeydown = (t) => {
		if (!this.opts.disabled.current) {
			if (t.key === Qt || t.key === we) {
				(this.parentMenu.toggleOpen(), t.preventDefault());
				return;
			}
			t.key === kn && (this.parentMenu.onOpen(), t.preventDefault());
		}
	};
	#t = x(() => {
		if (this.parentMenu.opts.open.current && this.parentMenu.contentId.current)
			return this.parentMenu.contentId.current;
	});
	#e = x(() => ({
		id: this.opts.id.current,
		disabled: this.opts.disabled.current,
		'aria-haspopup': 'menu',
		'aria-expanded': Qr(this.parentMenu.opts.open.current),
		'aria-controls': u(this.#t),
		'data-disabled': De(this.opts.disabled.current),
		'data-state': ve(this.parentMenu.opts.open.current),
		[this.parentMenu.root.getBitsAttr('trigger')]: '',
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		onkeydown: this.onkeydown,
		...this.attachment
	}));
	get props() {
		return u(this.#e);
	}
	set props(t) {
		b(this.#e, t);
	}
}
class Pr {
	static create(t) {
		return new Pr(t, Se.get());
	}
	opts;
	parentMenu;
	attachment;
	#t = D(Lt({ x: 0, y: 0 }));
	virtualElement = w({
		getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...u(this.#t) })
	});
	#e = null;
	constructor(t, n) {
		((this.opts = t),
			(this.parentMenu = n),
			(this.attachment = rt(this.opts.ref, (r) => (this.parentMenu.triggerNode = r))),
			(this.oncontextmenu = this.oncontextmenu.bind(this)),
			(this.onpointerdown = this.onpointerdown.bind(this)),
			(this.onpointermove = this.onpointermove.bind(this)),
			(this.onpointercancel = this.onpointercancel.bind(this)),
			(this.onpointerup = this.onpointerup.bind(this)),
			X(
				() => u(this.#t),
				(r) => {
					this.virtualElement.current = {
						getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...r })
					};
				}
			),
			X(
				() => this.opts.disabled.current,
				(r) => {
					r && this.#n();
				}
			),
			Vt(() => this.#n()));
	}
	#n() {
		this.#e !== null && jt(this.opts.ref.current).clearTimeout(this.#e);
	}
	#r(t) {
		(b(this.#t, { x: t.clientX, y: t.clientY }, !0), this.parentMenu.onOpen());
	}
	oncontextmenu(t) {
		t.defaultPrevented ||
			this.opts.disabled.current ||
			(this.#n(), this.#r(t), t.preventDefault(), this.parentMenu.contentNode?.focus());
	}
	onpointerdown(t) {
		this.opts.disabled.current ||
			Bt(t) ||
			(this.#n(), (this.#e = jt(this.opts.ref.current).setTimeout(() => this.#r(t), 700)));
	}
	onpointermove(t) {
		this.opts.disabled.current || Bt(t) || this.#n();
	}
	onpointercancel(t) {
		this.opts.disabled.current || Bt(t) || this.#n();
	}
	onpointerup(t) {
		this.opts.disabled.current || Bt(t) || this.#n();
	}
	#i = x(() => ({
		id: this.opts.id.current,
		disabled: this.opts.disabled.current,
		'data-disabled': De(this.opts.disabled.current),
		'data-state': ve(this.parentMenu.opts.open.current),
		[Zs]: '',
		tabindex: -1,
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointercancel: this.onpointercancel,
		onpointerup: this.onpointerup,
		oncontextmenu: this.oncontextmenu,
		...this.attachment
	}));
	get props() {
		return u(this.#i);
	}
	set props(t) {
		b(this.#i, t);
	}
}
var ea = nt('<div><!></div>');
function na(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'ref', 15, null),
		i = m(t, 'id', 19, () => Mt(n)),
		s = m(t, 'disabled', 3, !1),
		o = m(t, 'onSelect', 3, z),
		a = m(t, 'closeOnSelect', 3, !0),
		c = W(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'child',
			'children',
			'ref',
			'id',
			'disabled',
			'onSelect',
			'closeOnSelect'
		]);
	const l = dn.create({
			id: w.with(() => i()),
			disabled: w.with(() => s()),
			onSelect: w.with(() => o()),
			ref: w.with(
				() => r(),
				(v) => r(v)
			),
			closeOnSelect: w.with(() => a())
		}),
		h = x(() => et(c, l.props));
	var d = T(),
		g = P(d);
	{
		var f = (v) => {
				var y = T(),
					S = P(y);
				(N(
					S,
					() => t.child,
					() => ({ props: u(h) })
				),
					A(v, y));
			},
			p = (v) => {
				var y = ea();
				ot(y, () => ({ ...u(h) }));
				var S = lt(y);
				(N(S, () => t.children ?? k), ut(y), A(v, y));
			};
		Q(g, (v) => {
			t.child ? v(f) : v(p, !1);
		});
	}
	(A(e, d), _());
}
function ra(e, t) {
	I(t, !0);
	let n = m(t, 'open', 15, !1),
		r = m(t, 'onOpenChange', 3, z),
		i = m(t, 'onOpenChangeComplete', 3, z);
	ke.create({
		variant: w.with(() => 'dialog'),
		open: w.with(
			() => n(),
			(a) => {
				(n(a), r()(a));
			}
		),
		onOpenChangeComplete: w.with(() => i())
	});
	var s = T(),
		o = P(s);
	(N(o, () => t.children ?? k), A(e, s), _());
}
var ia = nt('<button><!></button>');
function oa(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'disabled', 3, !1),
		o = W(t, ['$$slots', '$$events', '$$legacy', 'children', 'child', 'id', 'ref', 'disabled']);
	const a = Be.create({
			variant: w.with(() => 'close'),
			id: w.with(() => r()),
			ref: w.with(
				() => i(),
				(f) => i(f)
			),
			disabled: w.with(() => !!s())
		}),
		c = x(() => et(o, a.props));
	var l = T(),
		h = P(l);
	{
		var d = (f) => {
				var p = T(),
					v = P(p);
				(N(
					v,
					() => t.child,
					() => ({ props: u(c) })
				),
					A(f, p));
			},
			g = (f) => {
				var p = ia();
				ot(p, () => ({ ...u(c) }));
				var v = lt(p);
				(N(v, () => t.children ?? k), ut(p), A(f, p));
			};
		Q(h, (f) => {
			t.child ? f(d) : f(g, !1);
		});
	}
	(A(e, l), _());
}
var sa = nt('<!> <!>', 1),
	aa = nt('<!> <div><!></div>', 1);
function ca(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'forceMount', 3, !1),
		o = m(t, 'onCloseAutoFocus', 3, z),
		a = m(t, 'onOpenAutoFocus', 3, z),
		c = m(t, 'onEscapeKeydown', 3, z),
		l = m(t, 'onInteractOutside', 3, z),
		h = m(t, 'trapFocus', 3, !0),
		d = m(t, 'preventScroll', 3, !0),
		g = m(t, 'restoreScrollDelay', 3, null),
		f = W(t, [
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
	const p = Ke.create({
			id: w.with(() => r()),
			ref: w.with(
				() => i(),
				(y) => i(y)
			)
		}),
		v = x(() => et(f, p.props));
	{
		const y = (E) => {
			{
				const C = (M, R) => {
					let F = () => R?.().props;
					Gn(
						M,
						U(() => u(v), {
							get enabled() {
								return p.root.opts.open.current;
							},
							get ref() {
								return p.opts.ref;
							},
							onEscapeKeydown: (B) => {
								(c()(B), !B.defaultPrevented && p.root.handleClose());
							},
							children: (B, Z) => {
								qn(
									B,
									U(() => u(v), {
										get ref() {
											return p.opts.ref;
										},
										get enabled() {
											return p.root.opts.open.current;
										},
										onInteractOutside: (K) => {
											(l()(K), !K.defaultPrevented && p.root.handleClose());
										},
										children: (K, J) => {
											or(
												K,
												U(() => u(v), {
													get ref() {
														return p.opts.ref;
													},
													get enabled() {
														return p.root.opts.open.current;
													},
													children: (j, tt) => {
														var L = T(),
															V = P(L);
														{
															var Y = (H) => {
																	var G = sa(),
																		it = P(G);
																	{
																		var dt = (Dt) => {
																			le(Dt, {
																				get preventScroll() {
																					return d();
																				},
																				get restoreScrollDelay() {
																					return g();
																				}
																			});
																		};
																		Q(it, (Dt) => {
																			p.root.opts.open.current && Dt(dt);
																		});
																	}
																	var Nt = Xt(it, 2);
																	{
																		let Dt = x(() => ({ props: et(u(v), F()), ...p.snippetProps }));
																		N(
																			Nt,
																			() => t.child,
																			() => u(Dt)
																		);
																	}
																	A(H, G);
																},
																q = (H) => {
																	var G = aa(),
																		it = P(G);
																	le(it, {
																		get preventScroll() {
																			return d();
																		}
																	});
																	var dt = Xt(it, 2);
																	ot(dt, (Dt) => ({ ...Dt }), [() => et(u(v), F())]);
																	var Nt = lt(dt);
																	(N(Nt, () => t.children ?? k), ut(dt), A(H, G));
																};
															Q(V, (H) => {
																t.child ? H(Y) : H(q, !1);
															});
														}
														A(j, L);
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
				let O = x(() =>
					mo({ forceMount: s(), present: p.root.opts.open.current, open: p.root.opts.open.current })
				);
				ir(E, {
					get ref() {
						return p.opts.ref;
					},
					loop: !0,
					get trapFocus() {
						return h();
					},
					get enabled() {
						return u(O);
					},
					get onOpenAutoFocus() {
						return a();
					},
					onCloseAutoFocus: (M) => {
						(o()(M), !M.defaultPrevented && Ie(1, () => p.root.triggerNode?.focus()));
					},
					focusScope: C,
					$$slots: { focusScope: !0 }
				});
			}
		};
		let S = x(() => p.root.opts.open.current || s());
		Re(
			e,
			U(() => u(v), {
				get forceMount() {
					return s();
				},
				get open() {
					return u(S);
				},
				get ref() {
					return p.opts.ref;
				},
				presence: y,
				$$slots: { presence: !0 }
			})
		);
	}
	_();
}
function la(e, t) {
	I(t, !0);
	let n = m(t, 'open', 15, !1),
		r = m(t, 'dir', 3, 'ltr'),
		i = m(t, 'onOpenChange', 3, z),
		s = m(t, 'onOpenChangeComplete', 3, z),
		o = m(t, '_internal_variant', 3, 'dropdown-menu');
	const a = cn.create({
		variant: w.with(() => o()),
		dir: w.with(() => r()),
		onClose: () => {
			(n(!1), i()(!1));
		}
	});
	(ln.create(
		{
			open: w.with(
				() => n(),
				(c) => {
					(n(c), i()(c));
				}
			),
			onOpenChangeComplete: w.with(() => s())
		},
		a
	),
		Cs(e, {
			children: (c, l) => {
				var h = T(),
					d = P(h);
				(N(d, () => t.children ?? k), A(c, h));
			},
			$$slots: { default: !0 }
		}),
		_());
}
var ua = nt('<div><div><!></div></div>'),
	da = nt('<div><div><!></div></div>');
function ha(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'loop', 3, !0),
		o = m(t, 'onInteractOutside', 3, z),
		a = m(t, 'onEscapeKeydown', 3, z),
		c = m(t, 'onCloseAutoFocus', 3, z),
		l = m(t, 'forceMount', 3, !1),
		h = m(t, 'trapFocus', 3, !1),
		d = W(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'child',
			'children',
			'ref',
			'loop',
			'onInteractOutside',
			'onEscapeKeydown',
			'onCloseAutoFocus',
			'forceMount',
			'trapFocus'
		]);
	const g = un.create({
			id: w.with(() => r()),
			loop: w.with(() => s()),
			ref: w.with(
				() => i(),
				(O) => i(O)
			),
			onCloseAutoFocus: w.with(() => c())
		}),
		f = x(() => et(d, g.props));
	function p(O) {
		if ((g.handleInteractOutside(O), !O.defaultPrevented && (o()(O), !O.defaultPrevented))) {
			if (O.target && O.target instanceof Element) {
				const M = `[${g.parentMenu.root.getBitsAttr('sub-content')}]`;
				if (O.target.closest(M)) return;
			}
			g.parentMenu.onClose();
		}
	}
	function v(O) {
		(a()(O), !O.defaultPrevented && g.parentMenu.onClose());
	}
	var y = T(),
		S = P(y);
	{
		var E = (O) => {
				Rs(
					O,
					U(
						() => u(f),
						() => g.popperProps,
						{
							get ref() {
								return g.opts.ref;
							},
							get enabled() {
								return g.parentMenu.opts.open.current;
							},
							onInteractOutside: p,
							onEscapeKeydown: v,
							get trapFocus() {
								return h();
							},
							get loop() {
								return s();
							},
							forceMount: !0,
							get id() {
								return r();
							},
							popper: (R, F) => {
								let B = () => F?.().props,
									Z = () => F?.().wrapperProps;
								var K = T();
								const J = x(() => et(B(), { style: In('dropdown-menu') }));
								var j = P(K);
								{
									var tt = (V) => {
											var Y = T(),
												q = P(Y);
											{
												let H = x(() => ({ props: u(J), wrapperProps: Z(), ...g.snippetProps }));
												N(
													q,
													() => t.child,
													() => u(H)
												);
											}
											A(V, Y);
										},
										L = (V) => {
											var Y = ua();
											ot(Y, () => ({ ...Z() }));
											var q = lt(Y);
											ot(q, () => ({ ...u(J) }));
											var H = lt(q);
											(N(H, () => t.children ?? k), ut(q), ut(Y), A(V, Y));
										};
									Q(j, (V) => {
										t.child ? V(tt) : V(L, !1);
									});
								}
								A(R, K);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			C = (O) => {
				var M = T(),
					R = P(M);
				{
					var F = (B) => {
						_s(
							B,
							U(
								() => u(f),
								() => g.popperProps,
								{
									get ref() {
										return g.opts.ref;
									},
									get open() {
										return g.parentMenu.opts.open.current;
									},
									onInteractOutside: p,
									onEscapeKeydown: v,
									get trapFocus() {
										return h();
									},
									get loop() {
										return s();
									},
									forceMount: !1,
									get id() {
										return r();
									},
									popper: (K, J) => {
										let j = () => J?.().props,
											tt = () => J?.().wrapperProps;
										var L = T();
										const V = x(() => et(j(), { style: In('dropdown-menu') }));
										var Y = P(L);
										{
											var q = (G) => {
													var it = T(),
														dt = P(it);
													{
														let Nt = x(() => ({
															props: u(V),
															wrapperProps: tt(),
															...g.snippetProps
														}));
														N(
															dt,
															() => t.child,
															() => u(Nt)
														);
													}
													A(G, it);
												},
												H = (G) => {
													var it = da();
													ot(it, () => ({ ...tt() }));
													var dt = lt(it);
													ot(dt, () => ({ ...u(V) }));
													var Nt = lt(dt);
													(N(Nt, () => t.children ?? k), ut(dt), ut(it), A(G, it));
												};
											Q(Y, (G) => {
												t.child ? G(q) : G(H, !1);
											});
										}
										A(K, L);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					Q(
						R,
						(B) => {
							l() || B(F);
						},
						!0
					);
				}
				A(O, M);
			};
		Q(S, (O) => {
			l() ? O(E) : O(C, !1);
		});
	}
	(A(e, y), _());
}
var fa = nt('<button><!></button>');
function ga(e, t) {
	const n = Tt();
	I(t, !0);
	let r = m(t, 'id', 19, () => Mt(n)),
		i = m(t, 'ref', 15, null),
		s = m(t, 'disabled', 3, !1),
		o = m(t, 'type', 3, 'button'),
		a = W(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'child',
			'children',
			'disabled',
			'type'
		]);
	const c = hn.create({
			id: w.with(() => r()),
			disabled: w.with(() => s() ?? !1),
			ref: w.with(
				() => i(),
				(h) => i(h)
			)
		}),
		l = x(() => et(a, c.props, { type: o() }));
	(Ms(e, {
		get id() {
			return r();
		},
		get ref() {
			return c.opts.ref;
		},
		children: (h, d) => {
			var g = T(),
				f = P(g);
			{
				var p = (y) => {
						var S = T(),
							E = P(S);
						(N(
							E,
							() => t.child,
							() => ({ props: u(l) })
						),
							A(y, S));
					},
					v = (y) => {
						var S = fa();
						ot(S, () => ({ ...u(l) }));
						var E = lt(S);
						(N(E, () => t.children ?? k), ut(S), A(y, S));
					};
				Q(f, (y) => {
					t.child ? y(p) : y(v, !1);
				});
			}
			A(h, g);
		},
		$$slots: { default: !0 }
	}),
		_());
}
let qt = D(!1);
class Ot {
	static _refs = 0;
	static _cleanup;
	constructor() {
		at(
			() => (
				Ot._refs === 0 &&
					(Ot._cleanup = _n(() => {
						const t = [],
							n = (i) => {
								b(qt, !1);
							},
							r = (i) => {
								b(qt, !0);
							};
						return (
							t.push(
								$(document, 'pointerdown', n, { capture: !0 }),
								$(document, 'pointermove', n, { capture: !0 }),
								$(document, 'keydown', r, { capture: !0 })
							),
							_t(...t)
						);
					})),
				Ot._refs++,
				() => {
					(Ot._refs--, Ot._refs === 0 && (b(qt, !1), Ot._cleanup?.()));
				}
			)
		);
	}
	get current() {
		return u(qt);
	}
	set current(t) {
		b(qt, t, !0);
	}
}
var pa = nt('<!> <span class="sr-only">Close</span>', 1),
	ma = nt('<!> <!>', 1),
	va = nt('<!> <!>', 1);
function Ua(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = m(t, 'showCloseButton', 3, !0),
		i = W(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'portalProps',
			'children',
			'showCloseButton'
		]);
	var s = T(),
		o = P(s);
	(ht(
		o,
		() => ya,
		(a, c) => {
			c(
				a,
				U(() => t.portalProps, {
					children: (l, h) => {
						var d = va(),
							g = P(d);
						ht(
							g,
							() => ba,
							(p, v) => {
								v(p, {});
							}
						);
						var f = Xt(g, 2);
						{
							let p = x(() =>
								yt(
									'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
									t.class
								)
							);
							ht(
								f,
								() => ca,
								(v, y) => {
									y(
										v,
										U(
											{
												'data-slot': 'dialog-content',
												get class() {
													return u(p);
												}
											},
											() => i,
											{
												get ref() {
													return n();
												},
												set ref(S) {
													n(S);
												},
												children: (S, E) => {
													var C = ma(),
														O = P(C);
													N(O, () => t.children ?? k);
													var M = Xt(O, 2);
													{
														var R = (F) => {
															var B = T(),
																Z = P(B);
															(ht(
																Z,
																() => oa,
																(K, J) => {
																	J(K, {
																		class:
																			"ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
																		children: (j, tt) => {
																			var L = pa(),
																				V = P(L);
																			(ui(V, {}), zr(2), A(j, L));
																		},
																		$$slots: { default: !0 }
																	});
																}
															),
																A(F, B));
														};
														Q(M, (F) => {
															r() && F(R);
														});
													}
													A(S, C);
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							);
						}
						A(l, d);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		A(e, s),
		_());
}
function Ya(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = T(),
		s = P(i);
	{
		let o = x(() => yt('text-muted-foreground text-sm', t.class));
		ht(
			s,
			() => yo,
			(a, c) => {
				c(
					a,
					U(
						{
							'data-slot': 'dialog-description',
							get class() {
								return u(o);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(l) {
								n(l);
							}
						}
					)
				);
			}
		);
	}
	(A(e, i), _());
}
var wa = nt('<div><!></div>');
function qa(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = wa();
	ot(i, (o) => ({ 'data-slot': 'dialog-header', class: o, ...r }), [
		() => yt('flex flex-col gap-2 text-center sm:text-left', t.class)
	]);
	var s = lt(i);
	(N(s, () => t.children ?? k),
		ut(i),
		Oe(
			i,
			(o) => n(o),
			() => n()
		),
		A(e, i),
		_());
}
function ba(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = T(),
		s = P(i);
	{
		let o = x(() =>
			yt(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				t.class
			)
		);
		ht(
			s,
			() => wo,
			(a, c) => {
				c(
					a,
					U(
						{
							'data-slot': 'dialog-overlay',
							get class() {
								return u(o);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(l) {
								n(l);
							}
						}
					)
				);
			}
		);
	}
	(A(e, i), _());
}
function Ga(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = T(),
		s = P(i);
	{
		let o = x(() => yt('text-lg leading-none font-semibold', t.class));
		ht(
			s,
			() => Fi,
			(a, c) => {
				c(
					a,
					U(
						{
							'data-slot': 'dialog-title',
							get class() {
								return u(o);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(l) {
								n(l);
							}
						}
					)
				);
			}
		);
	}
	(A(e, i), _());
}
const Xa = ra,
	ya = Vn;
var xa = nt('<input/>'),
	Sa = nt('<input/>');
function ja(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = m(t, 'value', 15),
		i = m(t, 'files', 15),
		s = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'value', 'type', 'files', 'class']);
	var o = T(),
		a = P(o);
	{
		var c = (h) => {
				var d = xa();
				(pn(d),
					ot(d, (g) => ({ 'data-slot': 'input', class: g, type: 'file', ...s }), [
						() =>
							yt(
								'selection:bg-primary dark:bg-input/30 selection:text-primary-foreground border-input ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
								'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
								'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
								t.class
							)
					]),
					Oe(
						d,
						(g) => n(g),
						() => n()
					),
					ri(d, i),
					mn(d, r),
					A(h, d));
			},
			l = (h) => {
				var d = Sa();
				(pn(d),
					ot(d, (g) => ({ 'data-slot': 'input', class: g, type: t.type, ...s }), [
						() =>
							yt(
								'border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
								'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
								'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
								t.class
							)
					]),
					Oe(
						d,
						(g) => n(g),
						() => n()
					),
					mn(d, r),
					A(h, d));
			};
		Q(a, (h) => {
			t.type === 'file' ? h(c) : h(l, !1);
		});
	}
	(A(e, o), _());
}
const Za = Ne({}),
	Ja = Ne({});
function Qa(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = m(t, 'sideOffset', 3, 4),
		i = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'sideOffset', 'portalProps', 'class']);
	var s = T(),
		o = P(s);
	(ht(
		o,
		() => Vn,
		(a, c) => {
			c(
				a,
				U(() => t.portalProps, {
					children: (l, h) => {
						var d = T(),
							g = P(d);
						{
							let f = x(() =>
								yt(
									'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
									t.class
								)
							);
							ht(
								g,
								() => ha,
								(p, v) => {
									v(
										p,
										U(
											{
												'data-slot': 'dropdown-menu-content',
												get sideOffset() {
													return r();
												},
												get class() {
													return u(f);
												}
											},
											() => i,
											{
												get ref() {
													return n();
												},
												set ref(y) {
													n(y);
												}
											}
										)
									);
								}
							);
						}
						A(l, d);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		A(e, s),
		_());
}
function $a(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = m(t, 'variant', 3, 'default'),
		i = W(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'inset', 'variant']);
	var s = T(),
		o = P(s);
	{
		let a = x(() =>
			yt(
				"data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-highlighted:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				t.class
			)
		);
		ht(
			o,
			() => na,
			(c, l) => {
				l(
					c,
					U(
						{
							'data-slot': 'dropdown-menu-item',
							get 'data-inset'() {
								return t.inset;
							},
							get 'data-variant'() {
								return r();
							},
							get class() {
								return u(a);
							}
						},
						() => i,
						{
							get ref() {
								return n();
							},
							set ref(h) {
								n(h);
							}
						}
					)
				);
			}
		);
	}
	(A(e, s), _());
}
function tc(e, t) {
	I(t, !0);
	let n = m(t, 'ref', 15, null),
		r = W(t, ['$$slots', '$$events', '$$legacy', 'ref']);
	var i = T(),
		s = P(i);
	(ht(
		s,
		() => ga,
		(o, a) => {
			a(
				o,
				U({ 'data-slot': 'dropdown-menu-trigger' }, () => r, {
					get ref() {
						return n();
					},
					set ref(c) {
						n(c);
					}
				})
			);
		}
	),
		A(e, i),
		_());
}
const ec = la,
	nc = Ne(null);
export {
	Ii as $,
	zn as A,
	ec as B,
	Zs as C,
	ke as D,
	Gn as E,
	ir as F,
	tc as G,
	Qa as H,
	ja as I,
	$a as J,
	Wa as K,
	Ja as L,
	cn as M,
	nc as N,
	La as O,
	Re as P,
	Za as Q,
	Xa as R,
	le as S,
	za as T,
	_e as U,
	wr as V,
	Ar as W,
	ui as X,
	Or as Y,
	Wn as Z,
	ie as _,
	Kn as a,
	Ha as a0,
	Vt as a1,
	Va as a2,
	Hs as a3,
	ca as a4,
	oa as a5,
	ra as a6,
	Ke as b,
	Ie as c,
	qn as d,
	or as e,
	ln as f,
	Cs as g,
	un as h,
	Rs as i,
	_s as j,
	In as k,
	Pr as l,
	Ms as m,
	wo as n,
	Vn as o,
	yo as p,
	Fi as q,
	na as r,
	mo as s,
	Ua as t,
	je as u,
	qa as v,
	Ga as w,
	Ya as x,
	Ba as y,
	Ka as z
};
