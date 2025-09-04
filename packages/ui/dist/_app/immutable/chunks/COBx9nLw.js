const __vite__mapDeps = (
	i,
	m = __vite__mapDeps,
	d = m.f ||
		(m.f = [
			'./C9GXV3gB.js',
			'./BMMyXqK5.js',
			'./DlfHMoPT.js',
			'./DPfMkruS.js',
			'./BKs5yQvz.js',
			'./JhPuU2gP.js',
			'./BGJmEYvX.js',
			'./CylS5w8V.js',
			'./BLtJtn59.js',
			'./Cp-IABpG.js',
			'./Ck_RvX-X.js',
			'./BIGW1oBm.js',
			'./2EtD6e53.js',
			'./QfhU5h_1.js',
			'./Da1o7VXg.js',
			'./Yzrsuije.js',
			'./Buea-lGh.js'
		])
) => i.map((i) => d[i]);
import { a as ai, b as ws, s as Cs } from './1HBmZ_db.js';
import {
	a5 as ii,
	b6 as li,
	bi as ci,
	p as O,
	o as x,
	q as y,
	af as J,
	a as m,
	b as D,
	bb as cr,
	u as g,
	v as $,
	f as I,
	c as G,
	r as M,
	G as q,
	I as L,
	ab as ui,
	aa as ks,
	ac as di,
	J as Ye,
	K as qe,
	ak as xs,
	z as hi,
	F as wt,
	t as Be
} from './BW6z9EX9.js';
import { o as Ss, e as fi, s as He } from './DzGRxXYC.js';
import { i as H } from './ClaijROu.js';
import { a as _e, d as pi, e as Ot, i as Dt, b as Fn, c as gi, s as mi } from './BPMCz5tT.js';
import { c as P } from './C-vcVqpF.js';
import { s as re, r as V, p as S } from './Cic-IlSQ.js';
import { i as vi } from './Dufayr-D.js';
import { p as Vt } from './PJJQOX3K.js';
import { a as vr } from './BzLloq76.js';
import { b as Io, c as Ro, B as Cn } from './B00PyzgL.js';
import { s as W } from './BC_1JO3s.js';
import {
	n as pt,
	e as K,
	d as ur,
	m as At,
	C as $o,
	a as _i,
	w as Dr,
	E as yi,
	S as bi,
	f as wi,
	i as Ci,
	j as ki,
	c as xi
} from './VBxAmJ30.js';
import { c as Si } from './DzxQehGt.js';
import {
	D as Ei,
	a as Ai,
	A as Pi,
	b as Ii,
	P as Ri,
	F as $i,
	c as Es,
	E as Ni,
	d as Li,
	e as Ti,
	S as As,
	s as Mi,
	M as Oi,
	f as Di,
	g as Gi,
	u as No,
	h as Fi,
	i as Bi,
	C as ji,
	j as Ui,
	k as Ps,
	l as zi,
	m as Wi,
	n as Vi,
	o as Lo,
	p as Hi,
	q as qi,
	X as To,
	r as Ki,
	t as Xi,
	v as Zi,
	w as Qi,
	x as Ji,
	R as Yi,
	y as Is,
	z as Rs,
	T as $s,
	I as el,
	B as tl,
	G as nl,
	H as rl,
	J as sl,
	K as ol,
	L as al,
	N as Ns,
	O as Ls,
	Q as il
} from './BZM4qE7v.js';
import { I as kt, e as ll } from './C9yuXBdp.js';
import { b as xt } from './Bo6bj8hH.js';
import { c as ce, t as cl, h as Ts, a as ul, p as dl, s as hl } from './Bvsacp8G.js';
import './U1J4c8t1.js';
import { i as fl } from './-Zrx4PIN.js';
import { H as pl } from './D-Y8D09J.js';
import { _ as Q } from './D9Z9MdNV.js';
import { S as gl } from './CPMQ46A3.js';
import { r as ml } from './Dd5NUPG5.js';
import { a as _r, s as yr, b as br } from './DCEYseD3.js';
import { h as vl } from './Cu73ScE0.js';
const _l = [];
function yl(t, e = !1) {
	return Hn(t, new Map(), '', _l);
}
function Hn(t, e, n, r, s = null) {
	if (typeof t == 'object' && t !== null) {
		var o = e.get(t);
		if (o !== void 0) return o;
		if (t instanceof Map) return new Map(t);
		if (t instanceof Set) return new Set(t);
		if (ii(t)) {
			var a = Array(t.length);
			(e.set(t, a), s !== null && e.set(s, a));
			for (var i = 0; i < t.length; i += 1) {
				var l = t[i];
				i in t && (a[i] = Hn(l, e, n, r));
			}
			return a;
		}
		if (li(t) === ci) {
			((a = {}), e.set(t, a), s !== null && e.set(s, a));
			for (var c in t) a[c] = Hn(t[c], e, n, r);
			return a;
		}
		if (t instanceof Date) return structuredClone(t);
		if (typeof t.toJSON == 'function') return Hn(t.toJSON(), e, n, r, t);
	}
	if (t instanceof EventTarget) return t;
	try {
		return structuredClone(t);
	} catch {
		return t;
	}
}
function Mo(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [['path', { d: 'M20 6 9 17l-5-5' }]];
	(kt(
		t,
		re({ name: 'check' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Oo(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
		['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }]
	];
	(kt(
		t,
		re({ name: 'copy' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function bl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M15 3h6v6' }],
		['path', { d: 'M10 14 21 3' }],
		['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]
	];
	(kt(
		t,
		re({ name: 'external-link' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function wl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M10 12.5 8 15l2 2.5' }],
		['path', { d: 'm14 12.5 2 2.5-2 2.5' }],
		['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
		['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z' }]
	];
	(kt(
		t,
		re({ name: 'file-code' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Cl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
		['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
		['circle', { cx: '10', cy: '12', r: '2' }],
		['path', { d: 'm20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22' }]
	];
	(kt(
		t,
		re({ name: 'file-image' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function kl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M10.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v8.4' }],
		['path', { d: 'M8 18v-7.7L16 9v7' }],
		['circle', { cx: '14', cy: '16', r: '2' }],
		['circle', { cx: '6', cy: '18', r: '2' }]
	];
	(kt(
		t,
		re({ name: 'file-music' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function xl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }],
		['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
		['path', { d: 'M10 9H8' }],
		['path', { d: 'M16 13H8' }],
		['path', { d: 'M16 17H8' }]
	];
	(kt(
		t,
		re({ name: 'file-text' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Ms(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		[
			'path',
			{
				d: 'M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1'
			}
		],
		['path', { d: 'M2 13h10' }],
		['path', { d: 'm9 16 3-3-3-3' }]
	];
	(kt(
		t,
		re({ name: 'folder-input' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Sl(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [['path', { d: 'M5 12h14' }]];
	(kt(
		t,
		re({ name: 'minus' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function El(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M12 20h9' }],
		[
			'path',
			{
				d: 'M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z'
			}
		],
		['path', { d: 'm15 5 3 3' }]
	];
	(kt(
		t,
		re({ name: 'pencil-line' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Os(t, e) {
	O(e, !0);
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
	 */ let n = V(e, ['$$slots', '$$events', '$$legacy']);
	const r = [
		['path', { d: 'M12 2v13' }],
		['path', { d: 'm16 6-4-4-4 4' }],
		['path', { d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' }]
	];
	(kt(
		t,
		re({ name: 'share' }, () => n, {
			get iconNode() {
				return r;
			},
			children: (s, o) => {
				var a = x(),
					i = y(a);
				(W(i, () => e.children ?? J), m(s, a));
			},
			$$slots: { default: !0 }
		})
	),
		D());
}
function Al(t, e) {
	O(e, !0);
	let n = S(e, 'open', 15, !1),
		r = S(e, 'onOpenChange', 3, pt),
		s = S(e, 'onOpenChangeComplete', 3, pt);
	Ei.create({
		variant: K.with(() => 'alert-dialog'),
		open: K.with(
			() => n(),
			(i) => {
				(n(i), r()(i));
			}
		),
		onOpenChangeComplete: K.with(() => s())
	});
	var o = x(),
		a = y(o);
	(W(a, () => e.children ?? J), m(t, o), D());
}
var Pl = I('<button><!></button>');
function Il(t, e) {
	const n = cr();
	O(e, !0);
	let r = S(e, 'id', 19, () => ur(n)),
		s = S(e, 'ref', 15, null),
		o = V(e, ['$$slots', '$$events', '$$legacy', 'children', 'child', 'id', 'ref']);
	const a = Ai.create({
			id: K.with(() => r()),
			ref: K.with(
				() => s(),
				(f) => s(f)
			)
		}),
		i = $(() => At(o, a.props));
	var l = x(),
		c = y(l);
	{
		var u = (f) => {
				var h = x(),
					p = y(h);
				(W(
					p,
					() => e.child,
					() => ({ props: g(i) })
				),
					m(f, h));
			},
			d = (f) => {
				var h = Pl();
				_e(h, () => ({ ...g(i) }));
				var p = G(h);
				(W(p, () => e.children ?? J), M(h), m(f, h));
			};
		H(c, (f) => {
			e.child ? f(u) : f(d, !1);
		});
	}
	(m(t, l), D());
}
var Rl = I('<button><!></button>');
function $l(t, e) {
	const n = cr();
	O(e, !0);
	let r = S(e, 'id', 19, () => ur(n)),
		s = S(e, 'ref', 15, null),
		o = S(e, 'disabled', 3, !1),
		a = V(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'children', 'child', 'disabled']);
	const i = Pi.create({
			id: K.with(() => r()),
			ref: K.with(
				() => s(),
				(h) => s(h)
			),
			disabled: K.with(() => !!o())
		}),
		l = $(() => At(a, i.props));
	var c = x(),
		u = y(c);
	{
		var d = (h) => {
				var p = x(),
					v = y(p);
				(W(
					v,
					() => e.child,
					() => ({ props: g(l) })
				),
					m(h, p));
			},
			f = (h) => {
				var p = Rl();
				_e(p, () => ({ ...g(l) }));
				var v = G(p);
				(W(v, () => e.children ?? J), M(p), m(h, p));
			};
		H(u, (h) => {
			e.child ? h(d) : h(f, !1);
		});
	}
	(m(t, c), D());
}
var Nl = I('<!> <!>', 1),
	Ll = I('<!> <div><!></div>', 1);
function Tl(t, e) {
	const n = cr();
	O(e, !0);
	let r = S(e, 'id', 19, () => ur(n)),
		s = S(e, 'ref', 15, null),
		o = S(e, 'forceMount', 3, !1),
		a = S(e, 'interactOutsideBehavior', 3, 'ignore'),
		i = S(e, 'onCloseAutoFocus', 3, pt),
		l = S(e, 'onEscapeKeydown', 3, pt),
		c = S(e, 'onOpenAutoFocus', 3, pt),
		u = S(e, 'onInteractOutside', 3, pt),
		d = S(e, 'preventScroll', 3, !0),
		f = S(e, 'trapFocus', 3, !0),
		h = S(e, 'restoreScrollDelay', 3, null),
		p = V(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'children',
			'child',
			'ref',
			'forceMount',
			'interactOutsideBehavior',
			'onCloseAutoFocus',
			'onEscapeKeydown',
			'onOpenAutoFocus',
			'onInteractOutside',
			'preventScroll',
			'trapFocus',
			'restoreScrollDelay'
		]);
	const v = Ii.create({
			id: K.with(() => r()),
			ref: K.with(
				() => s(),
				(w) => s(w)
			)
		}),
		b = $(() => At(p, v.props));
	{
		const w = (k) => {
			{
				const E = (A, te) => {
					let fe = () => te?.().props;
					Ni(
						A,
						re(() => g(b), {
							get enabled() {
								return v.root.opts.open.current;
							},
							get ref() {
								return v.opts.ref;
							},
							onEscapeKeydown: (Le) => {
								(l()(Le), !Le.defaultPrevented && v.root.handleClose());
							},
							children: (Le, it) => {
								Li(
									Le,
									re(() => g(b), {
										get ref() {
											return v.opts.ref;
										},
										get enabled() {
											return v.root.opts.open.current;
										},
										get interactOutsideBehavior() {
											return a();
										},
										onInteractOutside: (Te) => {
											(u()(Te), !Te.defaultPrevented && v.root.handleClose());
										},
										children: (Te, Me) => {
											Ti(
												Te,
												re(() => g(b), {
													get ref() {
														return v.opts.ref;
													},
													get enabled() {
														return v.root.opts.open.current;
													},
													children: (lt, Oe) => {
														var De = x(),
															ct = y(De);
														{
															var ye = (Ne) => {
																	var Ke = Nl(),
																		Xe = y(Ke);
																	{
																		var ze = (rt) => {
																			As(rt, {
																				get preventScroll() {
																					return d();
																				},
																				get restoreScrollDelay() {
																					return h();
																				}
																			});
																		};
																		H(Xe, (rt) => {
																			v.root.opts.open.current && rt(ze);
																		});
																	}
																	var nt = q(Xe, 2);
																	{
																		let rt = $(() => ({
																			props: At(g(b), fe()),
																			...v.snippetProps
																		}));
																		W(
																			nt,
																			() => e.child,
																			() => g(rt)
																		);
																	}
																	m(Ne, Ke);
																},
																tt = (Ne) => {
																	var Ke = Ll(),
																		Xe = y(Ke);
																	As(Xe, {
																		get preventScroll() {
																			return d();
																		}
																	});
																	var ze = q(Xe, 2);
																	_e(ze, (rt) => ({ ...rt }), [() => At(g(b), fe())]);
																	var nt = G(ze);
																	(W(nt, () => e.children ?? J), M(ze), m(Ne, Ke));
																};
															H(ct, (Ne) => {
																e.child ? Ne(ye) : Ne(tt, !1);
															});
														}
														m(lt, De);
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
				let R = $(() =>
					Mi({ forceMount: o(), present: v.root.opts.open.current, open: v.root.opts.open.current })
				);
				$i(k, {
					get ref() {
						return v.opts.ref;
					},
					loop: !0,
					get trapFocus() {
						return f();
					},
					get enabled() {
						return g(R);
					},
					onCloseAutoFocus: (A) => {
						(i()(A), !A.defaultPrevented && Es(0, () => v.root.triggerNode?.focus()));
					},
					onOpenAutoFocus: (A) => {
						(c()(A),
							!A.defaultPrevented &&
								(A.preventDefault(), Es(0, () => v.opts.ref.current?.focus())));
					},
					focusScope: E,
					$$slots: { focusScope: !0 }
				});
			}
		};
		let _ = $(() => v.root.opts.open.current || o());
		Ri(t, {
			get forceMount() {
				return o();
			},
			get open() {
				return g(_);
			},
			get ref() {
				return v.opts.ref;
			},
			presence: w,
			$$slots: { presence: !0 }
		});
	}
	D();
}
const Ml = xi({ component: 'checkbox', parts: ['root', 'group', 'group-label', 'input'] }),
	Ol = new $o('Checkbox.Group'),
	Do = new $o('Checkbox.Root');
class rs {
	static create(e, n = null) {
		return Do.set(new rs(e, n));
	}
	opts;
	group;
	#e = $(() =>
		this.group && this.group.opts.name.current
			? this.group.opts.name.current
			: this.opts.name.current
	);
	get trueName() {
		return g(this.#e);
	}
	set trueName(e) {
		L(this.#e, e);
	}
	#t = $(() => (this.group && this.group.opts.required.current ? !0 : this.opts.required.current));
	get trueRequired() {
		return g(this.#t);
	}
	set trueRequired(e) {
		L(this.#t, e);
	}
	#n = $(() => (this.group && this.group.opts.disabled.current ? !0 : this.opts.disabled.current));
	get trueDisabled() {
		return g(this.#n);
	}
	set trueDisabled(e) {
		L(this.#n, e);
	}
	attachment;
	constructor(e, n) {
		((this.opts = e),
			(this.group = n),
			(this.attachment = _i(this.opts.ref)),
			(this.onkeydown = this.onkeydown.bind(this)),
			(this.onclick = this.onclick.bind(this)),
			Dr.pre(
				[() => yl(this.group?.opts.value.current), () => this.opts.value.current],
				([r, s]) => {
					!r || !s || (this.opts.checked.current = r.includes(s));
				}
			),
			Dr.pre(
				() => this.opts.checked.current,
				(r) => {
					this.group &&
						(r
							? this.group?.addValue(this.opts.value.current)
							: this.group?.removeValue(this.opts.value.current));
				}
			));
	}
	onkeydown(e) {
		this.opts.disabled.current ||
			(e.key === yi && e.preventDefault(), e.key === bi && (e.preventDefault(), this.#r()));
	}
	#r() {
		this.opts.indeterminate.current
			? ((this.opts.indeterminate.current = !1), (this.opts.checked.current = !0))
			: (this.opts.checked.current = !this.opts.checked.current);
	}
	onclick(e) {
		this.opts.disabled.current || this.#r();
	}
	#s = $(() => ({
		checked: this.opts.checked.current,
		indeterminate: this.opts.indeterminate.current
	}));
	get snippetProps() {
		return g(this.#s);
	}
	set snippetProps(e) {
		L(this.#s, e);
	}
	#o = $(() => ({
		id: this.opts.id.current,
		role: 'checkbox',
		type: this.opts.type.current,
		disabled: this.trueDisabled,
		'aria-checked': ki(this.opts.checked.current, this.opts.indeterminate.current),
		'aria-required': Ci(this.trueRequired),
		'data-disabled': wi(this.trueDisabled),
		'data-state': Dl(this.opts.checked.current, this.opts.indeterminate.current),
		[Ml.root]: '',
		onclick: this.onclick,
		onkeydown: this.onkeydown,
		...this.attachment
	}));
	get props() {
		return g(this.#o);
	}
	set props(e) {
		L(this.#o, e);
	}
}
class ss {
	static create() {
		return new ss(Do.get());
	}
	root;
	#e = $(() =>
		this.root.group
			? !!(
					this.root.opts.value.current !== void 0 &&
					this.root.group.opts.value.current.includes(this.root.opts.value.current)
				)
			: this.root.opts.checked.current
	);
	get trueChecked() {
		return g(this.#e);
	}
	set trueChecked(e) {
		L(this.#e, e);
	}
	#t = $(() => !!this.root.trueName);
	get shouldRender() {
		return g(this.#t);
	}
	set shouldRender(e) {
		L(this.#t, e);
	}
	constructor(e) {
		this.root = e;
	}
	#n = $(() => ({
		type: 'checkbox',
		checked: this.root.opts.checked.current === !0,
		disabled: this.root.trueDisabled,
		required: this.root.trueRequired,
		name: this.root.trueName,
		value: this.root.opts.value.current
	}));
	get props() {
		return g(this.#n);
	}
	set props(e) {
		L(this.#n, e);
	}
}
function Dl(t, e) {
	return e ? 'indeterminate' : t ? 'checked' : 'unchecked';
}
function Gl(t, e) {
	O(e, !1);
	const n = ss.create();
	fl();
	var r = x(),
		s = y(r);
	{
		var o = (a) => {
			pl(
				a,
				re(() => n.props)
			);
		};
		H(s, (a) => {
			n.shouldRender && a(o);
		});
	}
	(m(t, r), D());
}
var Fl = I('<button><!></button>'),
	Bl = I('<!> <!>', 1);
function jl(t, e) {
	const n = cr();
	O(e, !0);
	let r = S(e, 'checked', 15, !1),
		s = S(e, 'ref', 15, null),
		o = S(e, 'disabled', 3, !1),
		a = S(e, 'required', 3, !1),
		i = S(e, 'name', 3, void 0),
		l = S(e, 'value', 3, 'on'),
		c = S(e, 'id', 19, () => ur(n)),
		u = S(e, 'indeterminate', 15, !1),
		d = S(e, 'type', 3, 'button'),
		f = V(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'checked',
			'ref',
			'onCheckedChange',
			'children',
			'disabled',
			'required',
			'name',
			'value',
			'id',
			'indeterminate',
			'onIndeterminateChange',
			'child',
			'type'
		]);
	const h = Ol.getOr(null);
	(h && l() && (h.opts.value.current.includes(l()) ? r(!0) : r(!1)),
		Dr.pre(
			() => l(),
			() => {
				h && l() && (h.opts.value.current.includes(l()) ? r(!0) : r(!1));
			}
		));
	const p = rs.create(
			{
				checked: K.with(
					() => r(),
					(R) => {
						(r(R), e.onCheckedChange?.(R));
					}
				),
				disabled: K.with(() => o() ?? !1),
				required: K.with(() => a()),
				name: K.with(() => i()),
				value: K.with(() => l()),
				id: K.with(() => c()),
				ref: K.with(
					() => s(),
					(R) => s(R)
				),
				indeterminate: K.with(
					() => u(),
					(R) => {
						(u(R), e.onIndeterminateChange?.(R));
					}
				),
				type: K.with(() => d())
			},
			h
		),
		v = $(() => At({ ...f }, p.props));
	var b = Bl(),
		w = y(b);
	{
		var _ = (R) => {
				var A = x(),
					te = y(A);
				{
					let fe = $(() => ({ props: g(v), ...p.snippetProps }));
					W(
						te,
						() => e.child,
						() => g(fe)
					);
				}
				m(R, A);
			},
			k = (R) => {
				var A = Fl();
				_e(A, () => ({ ...g(v) }));
				var te = G(A);
				(W(
					te,
					() => e.children ?? J,
					() => p.snippetProps
				),
					M(A),
					m(R, A));
			};
		H(w, (R) => {
			e.child ? R(_) : R(k, !1);
		});
	}
	var E = q(w, 2);
	(Gl(E, {}), m(t, b), D());
}
function Ul(t, e) {
	O(e, !0);
	let n = S(e, 'open', 15, !1),
		r = S(e, 'dir', 3, 'ltr'),
		s = S(e, 'onOpenChange', 3, pt),
		o = S(e, 'onOpenChangeComplete', 3, pt);
	const a = Oi.create({
		variant: K.with(() => 'context-menu'),
		dir: K.with(() => r()),
		onClose: () => {
			(n(!1), s()?.(!1));
		}
	});
	(Di.create(
		{
			open: K.with(
				() => n(),
				(i) => {
					(n(i), s()(i));
				}
			),
			onOpenChangeComplete: K.with(() => o())
		},
		a
	),
		Gi(t, {
			children: (i, l) => {
				var c = x(),
					u = y(c);
				(W(u, () => e.children ?? J), m(i, c));
			},
			$$slots: { default: !0 }
		}),
		D());
}
var zl = I('<div><div><!></div></div>'),
	Wl = I('<div><div><!></div></div>');
function Vl(t, e) {
	O(e, !0);
	let n = S(e, 'id', 19, No),
		r = S(e, 'ref', 15, null),
		s = S(e, 'loop', 3, !0),
		o = S(e, 'onInteractOutside', 3, pt),
		a = S(e, 'onCloseAutoFocus', 3, pt),
		i = S(e, 'onOpenAutoFocus', 3, pt),
		l = S(e, 'preventScroll', 3, !0),
		c = S(e, 'onEscapeKeydown', 3, pt),
		u = S(e, 'forceMount', 3, !1),
		d = S(e, 'trapFocus', 3, !1),
		f = V(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'child',
			'children',
			'ref',
			'loop',
			'onInteractOutside',
			'onCloseAutoFocus',
			'onOpenAutoFocus',
			'preventScroll',
			'onEscapeKeydown',
			'forceMount',
			'trapFocus'
		]);
	const h = Fi.create({
			id: K.with(() => n()),
			loop: K.with(() => s()),
			ref: K.with(
				() => r(),
				(A) => r(A)
			),
			onCloseAutoFocus: K.with(() => a())
		}),
		p = $(() => At(f, h.props));
	function v(A) {
		if ((o()(A), !A.defaultPrevented)) {
			if (A.target && A.target instanceof Element) {
				const te = `[${h.parentMenu.root.getBitsAttr('sub-content')}]`;
				if (A.target.closest(te)) return;
			}
			h.parentMenu.onClose();
		}
	}
	function b(A) {
		(c()(A), !A.defaultPrevented && h.parentMenu.onClose());
	}
	function w(A) {
		if ('button' in A && A.button === 2) {
			const te = A.target;
			return te ? te.closest(`[${ji}]`) !== h.parentMenu.triggerNode : !1;
		}
		return !1;
	}
	var _ = x(),
		k = y(_);
	{
		var E = (A) => {
				Bi(
					A,
					re(
						() => g(p),
						() => h.popperProps,
						{
							get ref() {
								return h.opts.ref;
							},
							side: 'right',
							sideOffset: 2,
							align: 'start',
							get enabled() {
								return h.parentMenu.opts.open.current;
							},
							get preventScroll() {
								return l();
							},
							onInteractOutside: v,
							onEscapeKeydown: b,
							get onOpenAutoFocus() {
								return i();
							},
							isValidEvent: w,
							get trapFocus() {
								return d();
							},
							get loop() {
								return s();
							},
							get id() {
								return n();
							},
							popper: (fe, Le) => {
								let it = () => Le?.().props,
									Te = () => Le?.().wrapperProps;
								var Me = x();
								const lt = $(() => At(it(), { style: Ps('context-menu') }));
								var Oe = y(Me);
								{
									var De = (ye) => {
											var tt = x(),
												Ne = y(tt);
											{
												let Ke = $(() => ({ props: g(lt), wrapperProps: Te(), ...h.snippetProps }));
												W(
													Ne,
													() => e.child,
													() => g(Ke)
												);
											}
											m(ye, tt);
										},
										ct = (ye) => {
											var tt = zl();
											_e(tt, () => ({ ...Te() }));
											var Ne = G(tt);
											_e(Ne, () => ({ ...g(lt) }));
											var Ke = G(Ne);
											(W(Ke, () => e.children ?? J), M(Ne), M(tt), m(ye, tt));
										};
									H(Oe, (ye) => {
										e.child ? ye(De) : ye(ct, !1);
									});
								}
								m(fe, Me);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			R = (A) => {
				var te = x(),
					fe = y(te);
				{
					var Le = (it) => {
						Ui(
							it,
							re(
								() => g(p),
								() => h.popperProps,
								{
									get ref() {
										return h.opts.ref;
									},
									side: 'right',
									sideOffset: 2,
									align: 'start',
									get open() {
										return h.parentMenu.opts.open.current;
									},
									get preventScroll() {
										return l();
									},
									onInteractOutside: v,
									onEscapeKeydown: b,
									get onOpenAutoFocus() {
										return i();
									},
									isValidEvent: w,
									get trapFocus() {
										return d();
									},
									get loop() {
										return s();
									},
									get id() {
										return n();
									},
									popper: (Me, lt) => {
										let Oe = () => lt?.().props,
											De = () => lt?.().wrapperProps;
										var ct = x();
										const ye = $(() => At(Oe(), { style: Ps('context-menu') }));
										var tt = y(ct);
										{
											var Ne = (Xe) => {
													var ze = x(),
														nt = y(ze);
													{
														let rt = $(() => ({
															props: g(ye),
															wrapperProps: De(),
															...h.snippetProps
														}));
														W(
															nt,
															() => e.child,
															() => g(rt)
														);
													}
													m(Xe, ze);
												},
												Ke = (Xe) => {
													var ze = Wl();
													_e(ze, () => ({ ...De() }));
													var nt = G(ze);
													_e(nt, () => ({ ...g(ye) }));
													var rt = G(nt);
													(W(rt, () => e.children ?? J), M(nt), M(ze), m(Xe, ze));
												};
											H(tt, (Xe) => {
												e.child ? Xe(Ne) : Xe(Ke, !1);
											});
										}
										m(Me, ct);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					H(
						fe,
						(it) => {
							u() || it(Le);
						},
						!0
					);
				}
				m(A, te);
			};
		H(k, (A) => {
			u() ? A(E) : A(R, !1);
		});
	}
	(m(t, _), D());
}
var Hl = I('<div><!></div>');
function ql(t, e) {
	O(e, !0);
	let n = S(e, 'id', 19, No),
		r = S(e, 'ref', 15, null),
		s = S(e, 'disabled', 3, !1),
		o = V(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref', 'child', 'children', 'disabled']);
	const a = zi.create({
			id: K.with(() => n()),
			disabled: K.with(() => s()),
			ref: K.with(
				() => r(),
				(u) => r(u)
			)
		}),
		i = $(() => At(o, a.props, { style: { pointerEvents: 'auto' } }));
	var l = x(),
		c = y(l);
	(P(
		c,
		() => Wi,
		(u, d) => {
			d(u, {
				get id() {
					return n();
				},
				get virtualEl() {
					return a.virtualElement;
				},
				get ref() {
					return a.opts.ref;
				},
				children: (f, h) => {
					var p = x(),
						v = y(p);
					{
						var b = (_) => {
								var k = x(),
									E = y(k);
								(W(
									E,
									() => e.child,
									() => ({ props: g(i) })
								),
									m(_, k));
							},
							w = (_) => {
								var k = Hl();
								_e(k, () => ({ ...g(i) }));
								var E = G(k);
								(W(E, () => e.children ?? J), M(k), m(_, k));
							};
						H(v, (_) => {
							e.child ? _(b) : _(w, !1);
						});
					}
					m(f, p);
				},
				$$slots: { default: !0 }
			});
		}
	),
		m(t, l),
		D());
}
var Kl = I('<div></div>');
function Xl(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = Kl();
	(_e(s, (o) => ({ 'data-slot': 'skeleton', class: o, ...r }), [
		() => ce('bg-accent animate-pulse rounded-md', e.class)
	]),
		xt(
			s,
			(o) => n(o),
			() => n()
		),
		m(t, s),
		D());
}
function Zl(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = x(),
		o = y(s);
	{
		let a = $(() => ce(Io(), e.class));
		P(
			o,
			() => Il,
			(i, l) => {
				l(
					i,
					re(
						{
							'data-slot': 'alert-dialog-action',
							get class() {
								return g(a);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(c) {
								n(c);
							}
						}
					)
				);
			}
		);
	}
	(m(t, s), D());
}
function Ql(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = x(),
		o = y(s);
	{
		let a = $(() => ce(Io({ variant: 'outline' }), e.class));
		P(
			o,
			() => $l,
			(i, l) => {
				l(
					i,
					re(
						{
							'data-slot': 'alert-dialog-cancel',
							get class() {
								return g(a);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(c) {
								n(c);
							}
						}
					)
				);
			}
		);
	}
	(m(t, s), D());
}
function Jl(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = x(),
		o = y(s);
	{
		let a = $(() =>
			ce(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				e.class
			)
		);
		P(
			o,
			() => Vi,
			(i, l) => {
				l(
					i,
					re(
						{
							'data-slot': 'alert-dialog-overlay',
							get class() {
								return g(a);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(c) {
								n(c);
							}
						}
					)
				);
			}
		);
	}
	(m(t, s), D());
}
var Yl = I('<!> <!>', 1);
function ec(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'portalProps']);
	var s = x(),
		o = y(s);
	(P(
		o,
		() => Lo,
		(a, i) => {
			i(
				a,
				re(() => e.portalProps, {
					children: (l, c) => {
						var u = Yl(),
							d = y(u);
						Jl(d, {});
						var f = q(d, 2);
						{
							let h = $(() =>
								ce(
									'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
									e.class
								)
							);
							P(
								f,
								() => Tl,
								(p, v) => {
									v(
										p,
										re(
											{
												'data-slot': 'alert-dialog-content',
												get class() {
													return g(h);
												}
											},
											() => r,
											{
												get ref() {
													return n();
												},
												set ref(b) {
													n(b);
												}
											}
										)
									);
								}
							);
						}
						m(l, u);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		m(t, s),
		D());
}
function tc(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = x(),
		o = y(s);
	{
		let a = $(() => ce('text-muted-foreground text-sm', e.class));
		P(
			o,
			() => Hi,
			(i, l) => {
				l(
					i,
					re(
						{
							'data-slot': 'alert-dialog-description',
							get class() {
								return g(a);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(c) {
								n(c);
							}
						}
					)
				);
			}
		);
	}
	(m(t, s), D());
}
var nc = I('<div><!></div>');
function rc(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = nc();
	_e(s, (a) => ({ 'data-slot': 'alert-dialog-footer', class: a, ...r }), [
		() => ce('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
var sc = I('<div><!></div>');
function oc(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = sc();
	_e(s, (a) => ({ 'data-slot': 'alert-dialog-header', class: a, ...r }), [
		() => ce('flex flex-col gap-2 text-center sm:text-left', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
function ac(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var s = x(),
		o = y(s);
	{
		let a = $(() => ce('text-lg font-semibold', e.class));
		P(
			o,
			() => qi,
			(i, l) => {
				l(
					i,
					re(
						{
							'data-slot': 'alert-dialog-title',
							get class() {
								return g(a);
							}
						},
						() => r,
						{
							get ref() {
								return n();
							},
							set ref(c) {
								n(c);
							}
						}
					)
				);
			}
		);
	}
	(m(t, s), D());
}
const ic = Al,
	lc = Ro({
		base: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent',
				secondary:
					'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent',
				destructive:
					'bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white',
				outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
			}
		},
		defaultVariants: { variant: 'default' }
	});
function wr(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = S(e, 'variant', 3, 'default'),
		s = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'href', 'class', 'variant', 'children']);
	var o = x(),
		a = y(o);
	(ll(
		a,
		() => (e.href ? 'a' : 'span'),
		!1,
		(i, l) => {
			(xt(
				i,
				(d) => n(d),
				() => n()
			),
				_e(i, (d) => ({ 'data-slot': 'badge', href: e.href, class: d, ...s }), [
					() => ce(lc({ variant: r() }), e.class)
				]));
			var c = x(),
				u = y(c);
			(W(u, () => e.children ?? J), m(l, c));
		}
	),
		m(t, o),
		D());
}
var cc = I('<div data-slot="checkbox-indicator" class="text-current transition-none"><!></div>');
function Cr(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = S(e, 'checked', 15, !1),
		s = S(e, 'indeterminate', 15, !1),
		o = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'checked', 'indeterminate', 'class']);
	var a = x(),
		i = y(a);
	{
		const l = (u, d) => {
			let f = () => d?.().checked,
				h = () => d?.().indeterminate;
			var p = cc(),
				v = G(p);
			{
				var b = (_) => {
						Mo(_, { class: 'size-3.5' });
					},
					w = (_) => {
						var k = x(),
							E = y(k);
						{
							var R = (A) => {
								Sl(A, { class: 'size-3.5' });
							};
							H(
								E,
								(A) => {
									h() && A(R);
								},
								!0
							);
						}
						m(_, k);
					};
				H(v, (_) => {
					f() ? _(b) : _(w, !1);
				});
			}
			(M(p), m(u, p));
		};
		let c = $(() =>
			ce(
				'border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
				e.class
			)
		);
		P(
			i,
			() => jl,
			(u, d) => {
				d(
					u,
					re(
						{
							'data-slot': 'checkbox',
							get class() {
								return g(c);
							}
						},
						() => o,
						{
							get ref() {
								return n();
							},
							set ref(f) {
								n(f);
							},
							get checked() {
								return r();
							},
							set checked(f) {
								r(f);
							},
							get indeterminate() {
								return s();
							},
							set indeterminate(f) {
								s(f);
							},
							children: l,
							$$slots: { default: !0 }
						}
					)
				);
			}
		);
	}
	(m(t, a), D());
}
function os(...t) {
	return cl(pi(t));
}
const uc = typeof window < 'u' ? window : void 0;
function dc(t) {
	let e = t.activeElement;
	for (; e?.shadowRoot; ) {
		const n = e.shadowRoot.activeElement;
		if (n === e) break;
		e = n;
	}
	return e;
}
class hc {
	#e;
	#t;
	constructor(e = {}) {
		const { window: n = uc, document: r = n?.document } = e;
		n !== void 0 &&
			((this.#e = r),
			(this.#t = Si((s) => {
				const o = Ss(n, 'focusin', s),
					a = Ss(n, 'focusout', s);
				return () => {
					(o(), a());
				};
			})));
	}
	get current() {
		return (this.#t?.(), this.#e ? dc(this.#e) : null);
	}
}
new hc();
let Go = class {
		#e;
		#t;
		constructor(e) {
			((this.#e = e), (this.#t = Symbol(e)));
		}
		get key() {
			return this.#t;
		}
		exists() {
			return ui(this.#t);
		}
		get() {
			const e = ks(this.#t);
			if (e === void 0) throw new Error(`Context "${this.#e}" not found`);
			return e;
		}
		getOr(e) {
			const n = ks(this.#t);
			return n === void 0 ? e : n;
		}
		set(e) {
			return di(this.#t, e);
		}
	},
	Re = class extends Error {
		constructor(e) {
			(super(e), (this.name = 'ShikiError'));
		}
	};
function fc(t) {
	return as(t);
}
function as(t) {
	return Array.isArray(t) ? pc(t) : t instanceof RegExp ? t : typeof t == 'object' ? gc(t) : t;
}
function pc(t) {
	let e = [];
	for (let n = 0, r = t.length; n < r; n++) e[n] = as(t[n]);
	return e;
}
function gc(t) {
	let e = {};
	for (let n in t) e[n] = as(t[n]);
	return e;
}
function Fo(t, ...e) {
	return (
		e.forEach((n) => {
			for (let r in n) t[r] = n[r];
		}),
		t
	);
}
function Bo(t) {
	const e = ~t.lastIndexOf('/') || ~t.lastIndexOf('\\');
	return e === 0 ? t : ~e === t.length - 1 ? Bo(t.substring(0, t.length - 1)) : t.substr(~e + 1);
}
var kr = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g,
	Bn = class {
		static hasCaptures(t) {
			return t === null ? !1 : ((kr.lastIndex = 0), kr.test(t));
		}
		static replaceCaptures(t, e, n) {
			return t.replace(kr, (r, s, o, a) => {
				let i = n[parseInt(s || o, 10)];
				if (i) {
					let l = e.substring(i.start, i.end);
					for (; l[0] === '.'; ) l = l.substring(1);
					switch (a) {
						case 'downcase':
							return l.toLowerCase();
						case 'upcase':
							return l.toUpperCase();
						default:
							return l;
					}
				} else return r;
			});
		}
	};
function jo(t, e) {
	return t < e ? -1 : t > e ? 1 : 0;
}
function Uo(t, e) {
	if (t === null && e === null) return 0;
	if (!t) return -1;
	if (!e) return 1;
	let n = t.length,
		r = e.length;
	if (n === r) {
		for (let s = 0; s < n; s++) {
			let o = jo(t[s], e[s]);
			if (o !== 0) return o;
		}
		return 0;
	}
	return n - r;
}
function Ds(t) {
	return !!(
		/^#[0-9a-f]{6}$/i.test(t) ||
		/^#[0-9a-f]{8}$/i.test(t) ||
		/^#[0-9a-f]{3}$/i.test(t) ||
		/^#[0-9a-f]{4}$/i.test(t)
	);
}
function zo(t) {
	return t.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
var Wo = class {
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
	Qn = class {
		constructor(t, e, n) {
			((this._colorMap = t), (this._defaults = e), (this._root = n));
		}
		static createFromRawTheme(t, e) {
			return this.createFromParsedTheme(_c(t), e);
		}
		static createFromParsedTheme(t, e) {
			return bc(t, e);
		}
		_cachedMatchRoot = new Wo((t) => this._root.match(t));
		getColorMap() {
			return this._colorMap.getColorMap();
		}
		getDefaults() {
			return this._defaults;
		}
		match(t) {
			if (t === null) return this._defaults;
			const e = t.scopeName,
				r = this._cachedMatchRoot.get(e).find((s) => mc(t.parent, s.parentScopes));
			return r ? new Vo(r.fontStyle, r.foreground, r.background) : null;
		}
	},
	xr = class qn {
		constructor(e, n) {
			((this.parent = e), (this.scopeName = n));
		}
		static push(e, n) {
			for (const r of n) e = new qn(e, r);
			return e;
		}
		static from(...e) {
			let n = null;
			for (let r = 0; r < e.length; r++) n = new qn(n, e[r]);
			return n;
		}
		push(e) {
			return new qn(this, e);
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
function mc(t, e) {
	if (e.length === 0) return !0;
	for (let n = 0; n < e.length; n++) {
		let r = e[n],
			s = !1;
		if (r === '>') {
			if (n === e.length - 1) return !1;
			((r = e[++n]), (s = !0));
		}
		for (; t && !vc(t.scopeName, r); ) {
			if (s) return !1;
			t = t.parent;
		}
		if (!t) return !1;
		t = t.parent;
	}
	return !0;
}
function vc(t, e) {
	return e === t || (t.startsWith(e) && t[e.length] === '.');
}
var Vo = class {
	constructor(t, e, n) {
		((this.fontStyle = t), (this.foregroundId = e), (this.backgroundId = n));
	}
};
function _c(t) {
	if (!t) return [];
	if (!t.settings || !Array.isArray(t.settings)) return [];
	let e = t.settings,
		n = [],
		r = 0;
	for (let s = 0, o = e.length; s < o; s++) {
		let a = e[s];
		if (!a.settings) continue;
		let i;
		if (typeof a.scope == 'string') {
			let d = a.scope;
			((d = d.replace(/^[,]+/, '')), (d = d.replace(/[,]+$/, '')), (i = d.split(',')));
		} else Array.isArray(a.scope) ? (i = a.scope) : (i = ['']);
		let l = -1;
		if (typeof a.settings.fontStyle == 'string') {
			l = 0;
			let d = a.settings.fontStyle.split(' ');
			for (let f = 0, h = d.length; f < h; f++)
				switch (d[f]) {
					case 'italic':
						l = l | 1;
						break;
					case 'bold':
						l = l | 2;
						break;
					case 'underline':
						l = l | 4;
						break;
					case 'strikethrough':
						l = l | 8;
						break;
				}
		}
		let c = null;
		typeof a.settings.foreground == 'string' &&
			Ds(a.settings.foreground) &&
			(c = a.settings.foreground);
		let u = null;
		typeof a.settings.background == 'string' &&
			Ds(a.settings.background) &&
			(u = a.settings.background);
		for (let d = 0, f = i.length; d < f; d++) {
			let p = i[d].trim().split(' '),
				v = p[p.length - 1],
				b = null;
			(p.length > 1 && ((b = p.slice(0, p.length - 1)), b.reverse()),
				(n[r++] = new yc(v, b, s, l, c, u)));
		}
	}
	return n;
}
var yc = class {
		constructor(t, e, n, r, s, o) {
			((this.scope = t),
				(this.parentScopes = e),
				(this.index = n),
				(this.fontStyle = r),
				(this.foreground = s),
				(this.background = o));
		}
	},
	Ue = ((t) => (
		(t[(t.NotSet = -1)] = 'NotSet'),
		(t[(t.None = 0)] = 'None'),
		(t[(t.Italic = 1)] = 'Italic'),
		(t[(t.Bold = 2)] = 'Bold'),
		(t[(t.Underline = 4)] = 'Underline'),
		(t[(t.Strikethrough = 8)] = 'Strikethrough'),
		t
	))(Ue || {});
function bc(t, e) {
	t.sort((l, c) => {
		let u = jo(l.scope, c.scope);
		return u !== 0 || ((u = Uo(l.parentScopes, c.parentScopes)), u !== 0) ? u : l.index - c.index;
	});
	let n = 0,
		r = '#000000',
		s = '#ffffff';
	for (; t.length >= 1 && t[0].scope === ''; ) {
		let l = t.shift();
		(l.fontStyle !== -1 && (n = l.fontStyle),
			l.foreground !== null && (r = l.foreground),
			l.background !== null && (s = l.background));
	}
	let o = new wc(e),
		a = new Vo(n, o.getId(r), o.getId(s)),
		i = new kc(new Gr(0, null, -1, 0, 0), []);
	for (let l = 0, c = t.length; l < c; l++) {
		let u = t[l];
		i.insert(0, u.scope, u.parentScopes, u.fontStyle, o.getId(u.foreground), o.getId(u.background));
	}
	return new Qn(o, a, i);
}
var wc = class {
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
	Cc = Object.freeze([]),
	Gr = class Ho {
		scopeDepth;
		parentScopes;
		fontStyle;
		foreground;
		background;
		constructor(e, n, r, s, o) {
			((this.scopeDepth = e),
				(this.parentScopes = n || Cc),
				(this.fontStyle = r),
				(this.foreground = s),
				(this.background = o));
		}
		clone() {
			return new Ho(
				this.scopeDepth,
				this.parentScopes,
				this.fontStyle,
				this.foreground,
				this.background
			);
		}
		static cloneArr(e) {
			let n = [];
			for (let r = 0, s = e.length; r < s; r++) n[r] = e[r].clone();
			return n;
		}
		acceptOverwrite(e, n, r, s) {
			(this.scopeDepth > e ? console.log('how did this happen?') : (this.scopeDepth = e),
				n !== -1 && (this.fontStyle = n),
				r !== 0 && (this.foreground = r),
				s !== 0 && (this.background = s));
		}
	},
	kc = class Fr {
		constructor(e, n = [], r = {}) {
			((this._mainRule = e), (this._children = r), (this._rulesWithParentScopes = n));
		}
		_rulesWithParentScopes;
		static _cmpBySpecificity(e, n) {
			if (e.scopeDepth !== n.scopeDepth) return n.scopeDepth - e.scopeDepth;
			let r = 0,
				s = 0;
			for (
				;
				e.parentScopes[r] === '>' && r++,
					n.parentScopes[s] === '>' && s++,
					!(r >= e.parentScopes.length || s >= n.parentScopes.length);

			) {
				const o = n.parentScopes[s].length - e.parentScopes[r].length;
				if (o !== 0) return o;
				(r++, s++);
			}
			return n.parentScopes.length - e.parentScopes.length;
		}
		match(e) {
			if (e !== '') {
				let r = e.indexOf('.'),
					s,
					o;
				if (
					(r === -1 ? ((s = e), (o = '')) : ((s = e.substring(0, r)), (o = e.substring(r + 1))),
					this._children.hasOwnProperty(s))
				)
					return this._children[s].match(o);
			}
			const n = this._rulesWithParentScopes.concat(this._mainRule);
			return (n.sort(Fr._cmpBySpecificity), n);
		}
		insert(e, n, r, s, o, a) {
			if (n === '') {
				this._doInsertHere(e, r, s, o, a);
				return;
			}
			let i = n.indexOf('.'),
				l,
				c;
			i === -1 ? ((l = n), (c = '')) : ((l = n.substring(0, i)), (c = n.substring(i + 1)));
			let u;
			(this._children.hasOwnProperty(l)
				? (u = this._children[l])
				: ((u = new Fr(this._mainRule.clone(), Gr.cloneArr(this._rulesWithParentScopes))),
					(this._children[l] = u)),
				u.insert(e + 1, c, r, s, o, a));
		}
		_doInsertHere(e, n, r, s, o) {
			if (n === null) {
				this._mainRule.acceptOverwrite(e, r, s, o);
				return;
			}
			for (let a = 0, i = this._rulesWithParentScopes.length; a < i; a++) {
				let l = this._rulesWithParentScopes[a];
				if (Uo(l.parentScopes, n) === 0) {
					l.acceptOverwrite(e, r, s, o);
					return;
				}
			}
			(r === -1 && (r = this._mainRule.fontStyle),
				s === 0 && (s = this._mainRule.foreground),
				o === 0 && (o = this._mainRule.background),
				this._rulesWithParentScopes.push(new Gr(e, n, r, s, o)));
		}
	},
	fn = class ht {
		static toBinaryStr(e) {
			return e.toString(2).padStart(32, '0');
		}
		static print(e) {
			const n = ht.getLanguageId(e),
				r = ht.getTokenType(e),
				s = ht.getFontStyle(e),
				o = ht.getForeground(e),
				a = ht.getBackground(e);
			console.log({ languageId: n, tokenType: r, fontStyle: s, foreground: o, background: a });
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
		static set(e, n, r, s, o, a, i) {
			let l = ht.getLanguageId(e),
				c = ht.getTokenType(e),
				u = ht.containsBalancedBrackets(e) ? 1 : 0,
				d = ht.getFontStyle(e),
				f = ht.getForeground(e),
				h = ht.getBackground(e);
			return (
				n !== 0 && (l = n),
				r !== 8 && (c = r),
				s !== null && (u = s ? 1 : 0),
				o !== -1 && (d = o),
				a !== 0 && (f = a),
				i !== 0 && (h = i),
				((l << 0) | (c << 8) | (u << 10) | (d << 11) | (f << 15) | (h << 24)) >>> 0
			);
		}
	};
function Jn(t, e) {
	const n = [],
		r = xc(t);
	let s = r.next();
	for (; s !== null; ) {
		let l = 0;
		if (s.length === 2 && s.charAt(1) === ':') {
			switch (s.charAt(0)) {
				case 'R':
					l = 1;
					break;
				case 'L':
					l = -1;
					break;
				default:
					console.log(`Unknown priority ${s} in scope selector`);
			}
			s = r.next();
		}
		let c = a();
		if ((n.push({ matcher: c, priority: l }), s !== ',')) break;
		s = r.next();
	}
	return n;
	function o() {
		if (s === '-') {
			s = r.next();
			const l = o();
			return (c) => !!l && !l(c);
		}
		if (s === '(') {
			s = r.next();
			const l = i();
			return (s === ')' && (s = r.next()), l);
		}
		if (Gs(s)) {
			const l = [];
			do (l.push(s), (s = r.next()));
			while (Gs(s));
			return (c) => e(l, c);
		}
		return null;
	}
	function a() {
		const l = [];
		let c = o();
		for (; c; ) (l.push(c), (c = o()));
		return (u) => l.every((d) => d(u));
	}
	function i() {
		const l = [];
		let c = a();
		for (; c && (l.push(c), s === '|' || s === ','); ) {
			do s = r.next();
			while (s === '|' || s === ',');
			c = a();
		}
		return (u) => l.some((d) => d(u));
	}
}
function Gs(t) {
	return !!t && !!t.match(/[\w\.:]+/);
}
function xc(t) {
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
function qo(t) {
	typeof t.dispose == 'function' && t.dispose();
}
var En = class {
		constructor(t) {
			this.scopeName = t;
		}
		toKey() {
			return this.scopeName;
		}
	},
	Sc = class {
		constructor(t, e) {
			((this.scopeName = t), (this.ruleName = e));
		}
		toKey() {
			return `${this.scopeName}#${this.ruleName}`;
		}
	},
	Ec = class {
		_references = [];
		_seenReferenceKeys = new Set();
		get references() {
			return this._references;
		}
		visitedRule = new Set();
		add(t) {
			const e = t.toKey();
			this._seenReferenceKeys.has(e) || (this._seenReferenceKeys.add(e), this._references.push(t));
		}
	},
	Ac = class {
		constructor(t, e) {
			((this.repo = t),
				(this.initialScopeName = e),
				this.seenFullScopeRequests.add(this.initialScopeName),
				(this.Q = [new En(this.initialScopeName)]));
		}
		seenFullScopeRequests = new Set();
		seenPartialScopeRequests = new Set();
		Q;
		processQueue() {
			const t = this.Q;
			this.Q = [];
			const e = new Ec();
			for (const n of t) Pc(n, this.initialScopeName, this.repo, e);
			for (const n of e.references)
				if (n instanceof En) {
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
function Pc(t, e, n, r) {
	const s = n.lookup(t.scopeName);
	if (!s) {
		if (t.scopeName === e) throw new Error(`No grammar provided for <${e}>`);
		return;
	}
	const o = n.lookup(e);
	t instanceof En
		? Kn({ baseGrammar: o, selfGrammar: s }, r)
		: Br(t.ruleName, { baseGrammar: o, selfGrammar: s, repository: s.repository }, r);
	const a = n.injections(t.scopeName);
	if (a) for (const i of a) r.add(new En(i));
}
function Br(t, e, n) {
	if (e.repository && e.repository[t]) {
		const r = e.repository[t];
		Yn([r], e, n);
	}
}
function Kn(t, e) {
	(t.selfGrammar.patterns &&
		Array.isArray(t.selfGrammar.patterns) &&
		Yn(t.selfGrammar.patterns, { ...t, repository: t.selfGrammar.repository }, e),
		t.selfGrammar.injections &&
			Yn(
				Object.values(t.selfGrammar.injections),
				{ ...t, repository: t.selfGrammar.repository },
				e
			));
}
function Yn(t, e, n) {
	for (const r of t) {
		if (n.visitedRule.has(r)) continue;
		n.visitedRule.add(r);
		const s = r.repository ? Fo({}, e.repository, r.repository) : e.repository;
		Array.isArray(r.patterns) && Yn(r.patterns, { ...e, repository: s }, n);
		const o = r.include;
		if (!o) continue;
		const a = Ko(o);
		switch (a.kind) {
			case 0:
				Kn({ ...e, selfGrammar: e.baseGrammar }, n);
				break;
			case 1:
				Kn(e, n);
				break;
			case 2:
				Br(a.ruleName, { ...e, repository: s }, n);
				break;
			case 3:
			case 4:
				const i =
					a.scopeName === e.selfGrammar.scopeName
						? e.selfGrammar
						: a.scopeName === e.baseGrammar.scopeName
							? e.baseGrammar
							: void 0;
				if (i) {
					const l = { baseGrammar: e.baseGrammar, selfGrammar: i, repository: s };
					a.kind === 4 ? Br(a.ruleName, l, n) : Kn(l, n);
				} else a.kind === 4 ? n.add(new Sc(a.scopeName, a.ruleName)) : n.add(new En(a.scopeName));
				break;
		}
	}
}
var Ic = class {
		kind = 0;
	},
	Rc = class {
		kind = 1;
	},
	$c = class {
		constructor(t) {
			this.ruleName = t;
		}
		kind = 2;
	},
	Nc = class {
		constructor(t) {
			this.scopeName = t;
		}
		kind = 3;
	},
	Lc = class {
		constructor(t, e) {
			((this.scopeName = t), (this.ruleName = e));
		}
		kind = 4;
	};
function Ko(t) {
	if (t === '$base') return new Ic();
	if (t === '$self') return new Rc();
	const e = t.indexOf('#');
	if (e === -1) return new Nc(t);
	if (e === 0) return new $c(t.substring(1));
	{
		const n = t.substring(0, e),
			r = t.substring(e + 1);
		return new Lc(n, r);
	}
}
var Tc = /\\(\d+)/,
	Fs = /\\(\d+)/g,
	Mc = -1,
	Xo = -2;
var $n = class {
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
				(this._nameIsCapturing = Bn.hasCaptures(this._name)),
				(this._contentName = r || null),
				(this._contentNameIsCapturing = Bn.hasCaptures(this._contentName)));
		}
		get debugName() {
			const t = this.$location
				? `${Bo(this.$location.filename)}:${this.$location.line}`
				: 'unknown';
			return `${this.constructor.name}#${this.id} @ ${t}`;
		}
		getName(t, e) {
			return !this._nameIsCapturing || this._name === null || t === null || e === null
				? this._name
				: Bn.replaceCaptures(this._name, t, e);
		}
		getContentName(t, e) {
			return !this._contentNameIsCapturing || this._contentName === null
				? this._contentName
				: Bn.replaceCaptures(this._contentName, t, e);
		}
	},
	Oc = class extends $n {
		retokenizeCapturedWithRuleId;
		constructor(t, e, n, r, s) {
			(super(t, e, n, r), (this.retokenizeCapturedWithRuleId = s));
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
	Dc = class extends $n {
		_match;
		captures;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, s) {
			(super(t, e, n, null),
				(this._match = new An(r, this.id)),
				(this.captures = s),
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
					((this._cachedCompiledPatterns = new Pn()),
					this.collectPatterns(t, this._cachedCompiledPatterns)),
				this._cachedCompiledPatterns
			);
		}
	},
	Bs = class extends $n {
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, s) {
			(super(t, e, n, r),
				(this.patterns = s.patterns),
				(this.hasMissingPatterns = s.hasMissingPatterns),
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
					((this._cachedCompiledPatterns = new Pn()),
					this.collectPatterns(t, this._cachedCompiledPatterns)),
				this._cachedCompiledPatterns
			);
		}
	},
	jr = class extends $n {
		_begin;
		beginCaptures;
		_end;
		endHasBackReferences;
		endCaptures;
		applyEndPatternLast;
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		constructor(t, e, n, r, s, o, a, i, l, c) {
			(super(t, e, n, r),
				(this._begin = new An(s, this.id)),
				(this.beginCaptures = o),
				(this._end = new An(a || '￿', -1)),
				(this.endHasBackReferences = this._end.hasBackReferences),
				(this.endCaptures = i),
				(this.applyEndPatternLast = l || !1),
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
				this._cachedCompiledPatterns = new Pn();
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
						? this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length() - 1, e)
						: this._cachedCompiledPatterns.setSource(0, e)),
				this._cachedCompiledPatterns
			);
		}
	},
	er = class extends $n {
		_begin;
		beginCaptures;
		whileCaptures;
		_while;
		whileHasBackReferences;
		hasMissingPatterns;
		patterns;
		_cachedCompiledPatterns;
		_cachedCompiledWhilePatterns;
		constructor(t, e, n, r, s, o, a, i, l) {
			(super(t, e, n, r),
				(this._begin = new An(s, this.id)),
				(this.beginCaptures = o),
				(this.whileCaptures = i),
				(this._while = new An(a, Xo)),
				(this.whileHasBackReferences = this._while.hasBackReferences),
				(this.patterns = l.patterns),
				(this.hasMissingPatterns = l.hasMissingPatterns),
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
				this._cachedCompiledPatterns = new Pn();
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
					((this._cachedCompiledWhilePatterns = new Pn()),
					this._cachedCompiledWhilePatterns.push(
						this._while.hasBackReferences ? this._while.clone() : this._while
					)),
				this._while.hasBackReferences && this._cachedCompiledWhilePatterns.setSource(0, e || '￿'),
				this._cachedCompiledWhilePatterns
			);
		}
	},
	Zo = class je {
		static createCaptureRule(e, n, r, s, o) {
			return e.registerRule((a) => new Oc(n, a, r, s, o));
		}
		static getCompiledRuleId(e, n, r) {
			return (
				e.id ||
					n.registerRule((s) => {
						if (((e.id = s), e.match))
							return new Dc(
								e.$vscodeTextmateLocation,
								e.id,
								e.name,
								e.match,
								je._compileCaptures(e.captures, n, r)
							);
						if (typeof e.begin > 'u') {
							e.repository && (r = Fo({}, r, e.repository));
							let o = e.patterns;
							return (
								typeof o > 'u' && e.include && (o = [{ include: e.include }]),
								new Bs(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									je._compilePatterns(o, n, r)
								)
							);
						}
						return e.while
							? new er(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									e.begin,
									je._compileCaptures(e.beginCaptures || e.captures, n, r),
									e.while,
									je._compileCaptures(e.whileCaptures || e.captures, n, r),
									je._compilePatterns(e.patterns, n, r)
								)
							: new jr(
									e.$vscodeTextmateLocation,
									e.id,
									e.name,
									e.contentName,
									e.begin,
									je._compileCaptures(e.beginCaptures || e.captures, n, r),
									e.end,
									je._compileCaptures(e.endCaptures || e.captures, n, r),
									e.applyEndPatternLast,
									je._compilePatterns(e.patterns, n, r)
								);
					}),
				e.id
			);
		}
		static _compileCaptures(e, n, r) {
			let s = [];
			if (e) {
				let o = 0;
				for (const a in e) {
					if (a === '$vscodeTextmateLocation') continue;
					const i = parseInt(a, 10);
					i > o && (o = i);
				}
				for (let a = 0; a <= o; a++) s[a] = null;
				for (const a in e) {
					if (a === '$vscodeTextmateLocation') continue;
					const i = parseInt(a, 10);
					let l = 0;
					(e[a].patterns && (l = je.getCompiledRuleId(e[a], n, r)),
						(s[i] = je.createCaptureRule(
							n,
							e[a].$vscodeTextmateLocation,
							e[a].name,
							e[a].contentName,
							l
						)));
				}
			}
			return s;
		}
		static _compilePatterns(e, n, r) {
			let s = [];
			if (e)
				for (let o = 0, a = e.length; o < a; o++) {
					const i = e[o];
					let l = -1;
					if (i.include) {
						const c = Ko(i.include);
						switch (c.kind) {
							case 0:
							case 1:
								l = je.getCompiledRuleId(r[i.include], n, r);
								break;
							case 2:
								let u = r[c.ruleName];
								u && (l = je.getCompiledRuleId(u, n, r));
								break;
							case 3:
							case 4:
								const d = c.scopeName,
									f = c.kind === 4 ? c.ruleName : null,
									h = n.getExternalGrammar(d, r);
								if (h)
									if (f) {
										let p = h.repository[f];
										p && (l = je.getCompiledRuleId(p, n, h.repository));
									} else l = je.getCompiledRuleId(h.repository.$self, n, h.repository);
								break;
						}
					} else l = je.getCompiledRuleId(i, n, r);
					if (l !== -1) {
						const c = n.getRule(l);
						let u = !1;
						if (
							((c instanceof Bs || c instanceof jr || c instanceof er) &&
								c.hasMissingPatterns &&
								c.patterns.length === 0 &&
								(u = !0),
							u)
						)
							continue;
						s.push(l);
					}
				}
			return { patterns: s, hasMissingPatterns: (e ? e.length : 0) !== s.length };
		}
	},
	An = class Qo {
		source;
		ruleId;
		hasAnchor;
		hasBackReferences;
		_anchorCache;
		constructor(e, n) {
			if (e && typeof e == 'string') {
				const r = e.length;
				let s = 0,
					o = [],
					a = !1;
				for (let i = 0; i < r; i++)
					if (e.charAt(i) === '\\' && i + 1 < r) {
						const c = e.charAt(i + 1);
						(c === 'z'
							? (o.push(e.substring(s, i)), o.push('$(?!\\n)(?<!\\n)'), (s = i + 2))
							: (c === 'A' || c === 'G') && (a = !0),
							i++);
					}
				((this.hasAnchor = a),
					s === 0 ? (this.source = e) : (o.push(e.substring(s, r)), (this.source = o.join(''))));
			} else ((this.hasAnchor = !1), (this.source = e));
			(this.hasAnchor ? (this._anchorCache = this._buildAnchorCache()) : (this._anchorCache = null),
				(this.ruleId = n),
				typeof this.source == 'string'
					? (this.hasBackReferences = Tc.test(this.source))
					: (this.hasBackReferences = !1));
		}
		clone() {
			return new Qo(this.source, this.ruleId);
		}
		setSource(e) {
			this.source !== e &&
				((this.source = e), this.hasAnchor && (this._anchorCache = this._buildAnchorCache()));
		}
		resolveBackReferences(e, n) {
			if (typeof this.source != 'string')
				throw new Error('This method should only be called if the source is a string');
			let r = n.map((s) => e.substring(s.start, s.end));
			return ((Fs.lastIndex = 0), this.source.replace(Fs, (s, o) => zo(r[parseInt(o, 10)] || '')));
		}
		_buildAnchorCache() {
			if (typeof this.source != 'string')
				throw new Error('This method should only be called if the source is a string');
			let e = [],
				n = [],
				r = [],
				s = [],
				o,
				a,
				i,
				l;
			for (o = 0, a = this.source.length; o < a; o++)
				((i = this.source.charAt(o)),
					(e[o] = i),
					(n[o] = i),
					(r[o] = i),
					(s[o] = i),
					i === '\\' &&
						o + 1 < a &&
						((l = this.source.charAt(o + 1)),
						l === 'A'
							? ((e[o + 1] = '￿'), (n[o + 1] = '￿'), (r[o + 1] = 'A'), (s[o + 1] = 'A'))
							: l === 'G'
								? ((e[o + 1] = '￿'), (n[o + 1] = 'G'), (r[o + 1] = '￿'), (s[o + 1] = 'G'))
								: ((e[o + 1] = l), (n[o + 1] = l), (r[o + 1] = l), (s[o + 1] = l)),
						o++));
			return { A0_G0: e.join(''), A0_G1: n.join(''), A1_G0: r.join(''), A1_G1: s.join('') };
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
	Pn = class {
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
				this._cached = new js(
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
						? (this._anchorCache.A1_G1 || (this._anchorCache.A1_G1 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A1_G1)
						: (this._anchorCache.A1_G0 || (this._anchorCache.A1_G0 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A1_G0)
					: n
						? (this._anchorCache.A0_G1 || (this._anchorCache.A0_G1 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A0_G1)
						: (this._anchorCache.A0_G0 || (this._anchorCache.A0_G0 = this._resolveAnchors(t, e, n)),
							this._anchorCache.A0_G0)
				: this.compile(t);
		}
		_resolveAnchors(t, e, n) {
			let r = this._items.map((s) => s.resolveAnchors(e, n));
			return new js(
				t,
				r,
				this._items.map((s) => s.ruleId)
			);
		}
	},
	js = class {
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
	Sr = class {
		constructor(t, e) {
			((this.languageId = t), (this.tokenType = e));
		}
	},
	Gc = class Ur {
		_defaultAttributes;
		_embeddedLanguagesMatcher;
		constructor(e, n) {
			((this._defaultAttributes = new Sr(e, 8)),
				(this._embeddedLanguagesMatcher = new Fc(Object.entries(n || {}))));
		}
		getDefaultAttributes() {
			return this._defaultAttributes;
		}
		getBasicScopeAttributes(e) {
			return e === null ? Ur._NULL_SCOPE_METADATA : this._getBasicScopeAttributes.get(e);
		}
		static _NULL_SCOPE_METADATA = new Sr(0, 0);
		_getBasicScopeAttributes = new Wo((e) => {
			const n = this._scopeToLanguage(e),
				r = this._toStandardTokenType(e);
			return new Sr(n, r);
		});
		_scopeToLanguage(e) {
			return this._embeddedLanguagesMatcher.match(e) || 0;
		}
		_toStandardTokenType(e) {
			const n = e.match(Ur.STANDARD_TOKEN_TYPE_REGEXP);
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
	Fc = class {
		values;
		scopesRegExp;
		constructor(t) {
			if (t.length === 0) ((this.values = null), (this.scopesRegExp = null));
			else {
				this.values = new Map(t);
				const e = t.map(([n, r]) => zo(n));
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
	Us = class {
		constructor(t, e) {
			((this.stack = t), (this.stoppedEarly = e));
		}
	};
function Jo(t, e, n, r, s, o, a, i) {
	const l = e.content.length;
	let c = !1,
		u = -1;
	if (a) {
		const h = Bc(t, e, n, r, s, o);
		((s = h.stack), (r = h.linePos), (n = h.isFirstLine), (u = h.anchorPosition));
	}
	const d = Date.now();
	for (; !c; ) {
		if (i !== 0 && Date.now() - d > i) return new Us(s, !0);
		f();
	}
	return new Us(s, !1);
	function f() {
		const h = jc(t, e, n, r, s, u);
		if (!h) {
			(o.produce(s, l), (c = !0));
			return;
		}
		const p = h.captureIndices,
			v = h.matchedRuleId,
			b = p && p.length > 0 ? p[0].end > r : !1;
		if (v === Mc) {
			const w = s.getRule(t);
			(o.produce(s, p[0].start),
				(s = s.withContentNameScopesList(s.nameScopesList)),
				kn(t, e, n, s, o, w.endCaptures, p),
				o.produce(s, p[0].end));
			const _ = s;
			if (((s = s.parent), (u = _.getAnchorPos()), !b && _.getEnterPos() === r)) {
				((s = _), o.produce(s, l), (c = !0));
				return;
			}
		} else {
			const w = t.getRule(v);
			o.produce(s, p[0].start);
			const _ = s,
				k = w.getName(e.content, p),
				E = s.contentNameScopesList.pushAttributed(k, t);
			if (((s = s.push(v, r, u, p[0].end === l, null, E, E)), w instanceof jr)) {
				const R = w;
				(kn(t, e, n, s, o, R.beginCaptures, p), o.produce(s, p[0].end), (u = p[0].end));
				const A = R.getContentName(e.content, p),
					te = E.pushAttributed(A, t);
				if (
					((s = s.withContentNameScopesList(te)),
					R.endHasBackReferences &&
						(s = s.withEndRule(R.getEndWithResolvedBackReferences(e.content, p))),
					!b && _.hasSameRuleAs(s))
				) {
					((s = s.pop()), o.produce(s, l), (c = !0));
					return;
				}
			} else if (w instanceof er) {
				const R = w;
				(kn(t, e, n, s, o, R.beginCaptures, p), o.produce(s, p[0].end), (u = p[0].end));
				const A = R.getContentName(e.content, p),
					te = E.pushAttributed(A, t);
				if (
					((s = s.withContentNameScopesList(te)),
					R.whileHasBackReferences &&
						(s = s.withEndRule(R.getWhileWithResolvedBackReferences(e.content, p))),
					!b && _.hasSameRuleAs(s))
				) {
					((s = s.pop()), o.produce(s, l), (c = !0));
					return;
				}
			} else if ((kn(t, e, n, s, o, w.captures, p), o.produce(s, p[0].end), (s = s.pop()), !b)) {
				((s = s.safePop()), o.produce(s, l), (c = !0));
				return;
			}
		}
		p[0].end > r && ((r = p[0].end), (n = !1));
	}
}
function Bc(t, e, n, r, s, o) {
	let a = s.beginRuleCapturedEOL ? 0 : -1;
	const i = [];
	for (let l = s; l; l = l.pop()) {
		const c = l.getRule(t);
		c instanceof er && i.push({ rule: c, stack: l });
	}
	for (let l = i.pop(); l; l = i.pop()) {
		const { ruleScanner: c, findOptions: u } = Wc(l.rule, t, l.stack.endRule, n, r === a),
			d = c.findNextMatchSync(e, r, u);
		if (d) {
			if (d.ruleId !== Xo) {
				s = l.stack.pop();
				break;
			}
			d.captureIndices &&
				d.captureIndices.length &&
				(o.produce(l.stack, d.captureIndices[0].start),
				kn(t, e, n, l.stack, o, l.rule.whileCaptures, d.captureIndices),
				o.produce(l.stack, d.captureIndices[0].end),
				(a = d.captureIndices[0].end),
				d.captureIndices[0].end > r && ((r = d.captureIndices[0].end), (n = !1)));
		} else {
			s = l.stack.pop();
			break;
		}
	}
	return { stack: s, linePos: r, anchorPosition: a, isFirstLine: n };
}
function jc(t, e, n, r, s, o) {
	const a = Uc(t, e, n, r, s, o),
		i = t.getInjections();
	if (i.length === 0) return a;
	const l = zc(i, t, e, n, r, s, o);
	if (!l) return a;
	if (!a) return l;
	const c = a.captureIndices[0].start,
		u = l.captureIndices[0].start;
	return u < c || (l.priorityMatch && u === c) ? l : a;
}
function Uc(t, e, n, r, s, o) {
	const a = s.getRule(t),
		{ ruleScanner: i, findOptions: l } = Yo(a, t, s.endRule, n, r === o),
		c = i.findNextMatchSync(e, r, l);
	return c ? { captureIndices: c.captureIndices, matchedRuleId: c.ruleId } : null;
}
function zc(t, e, n, r, s, o, a) {
	let i = Number.MAX_VALUE,
		l = null,
		c,
		u = 0;
	const d = o.contentNameScopesList.getScopeNames();
	for (let f = 0, h = t.length; f < h; f++) {
		const p = t[f];
		if (!p.matcher(d)) continue;
		const v = e.getRule(p.ruleId),
			{ ruleScanner: b, findOptions: w } = Yo(v, e, null, r, s === a),
			_ = b.findNextMatchSync(n, s, w);
		if (!_) continue;
		const k = _.captureIndices[0].start;
		if (!(k >= i) && ((i = k), (l = _.captureIndices), (c = _.ruleId), (u = p.priority), i === s))
			break;
	}
	return l ? { priorityMatch: u === -1, captureIndices: l, matchedRuleId: c } : null;
}
function Yo(t, e, n, r, s) {
	return { ruleScanner: t.compileAG(e, n, r, s), findOptions: 0 };
}
function Wc(t, e, n, r, s) {
	return { ruleScanner: t.compileWhileAG(e, n, r, s), findOptions: 0 };
}
function kn(t, e, n, r, s, o, a) {
	if (o.length === 0) return;
	const i = e.content,
		l = Math.min(o.length, a.length),
		c = [],
		u = a[0].end;
	for (let d = 0; d < l; d++) {
		const f = o[d];
		if (f === null) continue;
		const h = a[d];
		if (h.length === 0) continue;
		if (h.start > u) break;
		for (; c.length > 0 && c[c.length - 1].endPos <= h.start; )
			(s.produceFromScopes(c[c.length - 1].scopes, c[c.length - 1].endPos), c.pop());
		if (
			(c.length > 0 ? s.produceFromScopes(c[c.length - 1].scopes, h.start) : s.produce(r, h.start),
			f.retokenizeCapturedWithRuleId)
		) {
			const v = f.getName(i, a),
				b = r.contentNameScopesList.pushAttributed(v, t),
				w = f.getContentName(i, a),
				_ = b.pushAttributed(w, t),
				k = r.push(f.retokenizeCapturedWithRuleId, h.start, -1, !1, null, b, _),
				E = t.createOnigString(i.substring(0, h.end));
			(Jo(t, E, n && h.start === 0, h.start, k, s, !1, 0), qo(E));
			continue;
		}
		const p = f.getName(i, a);
		if (p !== null) {
			const b = (c.length > 0 ? c[c.length - 1].scopes : r.contentNameScopesList).pushAttributed(
				p,
				t
			);
			c.push(new Vc(b, h.end));
		}
	}
	for (; c.length > 0; )
		(s.produceFromScopes(c[c.length - 1].scopes, c[c.length - 1].endPos), c.pop());
}
var Vc = class {
	scopes;
	endPos;
	constructor(t, e) {
		((this.scopes = t), (this.endPos = e));
	}
};
function Hc(t, e, n, r, s, o, a, i) {
	return new Kc(t, e, n, r, s, o, a, i);
}
function zs(t, e, n, r, s) {
	const o = Jn(e, tr),
		a = Zo.getCompiledRuleId(n, r, s.repository);
	for (const i of o)
		t.push({ debugSelector: e, matcher: i.matcher, ruleId: a, grammar: s, priority: i.priority });
}
function tr(t, e) {
	if (e.length < t.length) return !1;
	let n = 0;
	return t.every((r) => {
		for (let s = n; s < e.length; s++) if (qc(e[s], r)) return ((n = s + 1), !0);
		return !1;
	});
}
function qc(t, e) {
	if (!t) return !1;
	if (t === e) return !0;
	const n = e.length;
	return t.length > n && t.substr(0, n) === e && t[n] === '.';
}
var Kc = class {
	constructor(t, e, n, r, s, o, a, i) {
		if (
			((this._rootScopeName = t),
			(this.balancedBracketSelectors = o),
			(this._onigLib = i),
			(this._basicScopeAttributesProvider = new Gc(n, r)),
			(this._rootId = -1),
			(this._lastRuleId = 0),
			(this._ruleId2desc = [null]),
			(this._includedGrammars = {}),
			(this._grammarRepository = a),
			(this._grammar = Ws(e, null)),
			(this._injections = null),
			(this._tokenTypeMatchers = []),
			s)
		)
			for (const l of Object.keys(s)) {
				const c = Jn(l, tr);
				for (const u of c) this._tokenTypeMatchers.push({ matcher: u.matcher, type: s[l] });
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
				lookup: (s) => (s === this._rootScopeName ? this._grammar : this.getExternalGrammar(s)),
				injections: (s) => this._grammarRepository.injections(s)
			},
			e = [],
			n = this._rootScopeName,
			r = t.lookup(n);
		if (r) {
			const s = r.injections;
			if (s) for (let a in s) zs(e, a, s[a], this, r);
			const o = this._grammarRepository.injections(n);
			o &&
				o.forEach((a) => {
					const i = this.getExternalGrammar(a);
					if (i) {
						const l = i.injectionSelector;
						l && zs(e, l, i, this, i);
					}
				});
		}
		return (e.sort((s, o) => s.priority - o.priority), e);
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
			if (n) return ((this._includedGrammars[t] = Ws(n, e && e.$base)), this._includedGrammars[t]);
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
			((this._rootId = Zo.getCompiledRuleId(
				this._grammar.repository.$self,
				this,
				this._grammar.repository
			)),
			this.getInjections());
		let s;
		if (!e || e === zr.NULL) {
			s = !0;
			const c = this._basicScopeAttributesProvider.getDefaultAttributes(),
				u = this.themeProvider.getDefaults(),
				d = fn.set(0, c.languageId, c.tokenType, null, u.fontStyle, u.foregroundId, u.backgroundId),
				f = this.getRule(this._rootId).getName(null, null);
			let h;
			(f ? (h = xn.createRootAndLookUpScopeName(f, d, this)) : (h = xn.createRoot('unknown', d)),
				(e = new zr(null, this._rootId, -1, -1, !1, null, h, h)));
		} else ((s = !1), e.reset());
		t =
			t +
			`
`;
		const o = this.createOnigString(t),
			a = o.content.length,
			i = new Zc(n, t, this._tokenTypeMatchers, this.balancedBracketSelectors),
			l = Jo(this, o, s, 0, e, i, !0, r);
		return (
			qo(o),
			{ lineLength: a, lineTokens: i, ruleStack: l.stack, stoppedEarly: l.stoppedEarly }
		);
	}
};
function Ws(t, e) {
	return (
		(t = fc(t)),
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
var xn = class St {
		constructor(e, n, r) {
			((this.parent = e), (this.scopePath = n), (this.tokenAttributes = r));
		}
		static fromExtension(e, n) {
			let r = e,
				s = e?.scopePath ?? null;
			for (const o of n)
				((s = xr.push(s, o.scopeNames)), (r = new St(r, s, o.encodedTokenAttributes)));
			return r;
		}
		static createRoot(e, n) {
			return new St(null, new xr(null, e), n);
		}
		static createRootAndLookUpScopeName(e, n, r) {
			const s = r.getMetadataForScope(e),
				o = new xr(null, e),
				a = r.themeProvider.themeMatch(o),
				i = St.mergeAttributes(n, s, a);
			return new St(null, o, i);
		}
		get scopeName() {
			return this.scopePath.scopeName;
		}
		toString() {
			return this.getScopeNames().join(' ');
		}
		equals(e) {
			return St.equals(this, e);
		}
		static equals(e, n) {
			do {
				if (e === n || (!e && !n)) return !0;
				if (!e || !n || e.scopeName !== n.scopeName || e.tokenAttributes !== n.tokenAttributes)
					return !1;
				((e = e.parent), (n = n.parent));
			} while (!0);
		}
		static mergeAttributes(e, n, r) {
			let s = -1,
				o = 0,
				a = 0;
			return (
				r !== null && ((s = r.fontStyle), (o = r.foregroundId), (a = r.backgroundId)),
				fn.set(e, n.languageId, n.tokenType, null, s, o, a)
			);
		}
		pushAttributed(e, n) {
			if (e === null) return this;
			if (e.indexOf(' ') === -1) return St._pushAttributed(this, e, n);
			const r = e.split(/ /g);
			let s = this;
			for (const o of r) s = St._pushAttributed(s, o, n);
			return s;
		}
		static _pushAttributed(e, n, r) {
			const s = r.getMetadataForScope(n),
				o = e.scopePath.push(n),
				a = r.themeProvider.themeMatch(o),
				i = St.mergeAttributes(e.tokenAttributes, s, a);
			return new St(e, o, i);
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
	zr = class qt {
		constructor(e, n, r, s, o, a, i, l) {
			((this.parent = e),
				(this.ruleId = n),
				(this.beginRuleCapturedEOL = o),
				(this.endRule = a),
				(this.nameScopesList = i),
				(this.contentNameScopesList = l),
				(this.depth = this.parent ? this.parent.depth + 1 : 1),
				(this._enterPos = r),
				(this._anchorPos = s));
		}
		_stackElementBrand = void 0;
		static NULL = new qt(null, 0, 0, 0, !1, null, null, null);
		_enterPos;
		_anchorPos;
		depth;
		equals(e) {
			return e === null ? !1 : qt._equals(this, e);
		}
		static _equals(e, n) {
			return e === n
				? !0
				: this._structuralEquals(e, n)
					? xn.equals(e.contentNameScopesList, n.contentNameScopesList)
					: !1;
		}
		static _structuralEquals(e, n) {
			do {
				if (e === n || (!e && !n)) return !0;
				if (!e || !n || e.depth !== n.depth || e.ruleId !== n.ruleId || e.endRule !== n.endRule)
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
			qt._reset(this);
		}
		pop() {
			return this.parent;
		}
		safePop() {
			return this.parent ? this.parent : this;
		}
		push(e, n, r, s, o, a, i) {
			return new qt(this, e, n, r, s, o, a, i);
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
				: new qt(
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
					this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null) ?? [],
				contentNameScopesList:
					this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
			};
		}
		static pushFrame(e, n) {
			const r = xn.fromExtension(e?.nameScopesList ?? null, n.nameScopesList);
			return new qt(
				e,
				n.ruleId,
				n.enterPos ?? -1,
				n.anchorPos ?? -1,
				n.beginRuleCapturedEOL,
				n.endRule,
				r,
				xn.fromExtension(r, n.contentNameScopesList)
			);
		}
	},
	Xc = class {
		balancedBracketScopes;
		unbalancedBracketScopes;
		allowAny = !1;
		constructor(t, e) {
			((this.balancedBracketScopes = t.flatMap((n) =>
				n === '*' ? ((this.allowAny = !0), []) : Jn(n, tr).map((r) => r.matcher)
			)),
				(this.unbalancedBracketScopes = e.flatMap((n) => Jn(n, tr).map((r) => r.matcher))));
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
	Zc = class {
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
					s = !1;
				if (
					(this.balancedBracketSelectors?.matchesAlways && (s = !0),
					this._tokenTypeOverrides.length > 0 ||
						(this.balancedBracketSelectors &&
							!this.balancedBracketSelectors.matchesAlways &&
							!this.balancedBracketSelectors.matchesNever))
				) {
					const o = t?.getScopeNames() ?? [];
					for (const a of this._tokenTypeOverrides)
						a.matcher(o) && (r = fn.set(r, 0, a.type, null, -1, 0, 0));
					this.balancedBracketSelectors && (s = this.balancedBracketSelectors.match(o));
				}
				if (
					(s && (r = fn.set(r, 0, 8, s, -1, 0, 0)),
					this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === r)
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
			for (let r = 0, s = this._binaryTokens.length; r < s; r++) n[r] = this._binaryTokens[r];
			return n;
		}
	},
	Qc = class {
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
			(this._rawGrammars.set(t.scopeName, t), e && this._injectionGrammars.set(t.scopeName, e));
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
		grammarForScopeName(t, e, n, r, s) {
			if (!this._grammars.has(t)) {
				let o = this._rawGrammars.get(t);
				if (!o) return null;
				this._grammars.set(t, Hc(t, o, e, n, r, s, this, this._onigLib));
			}
			return this._grammars.get(t);
		}
	},
	Jc = class {
		_options;
		_syncRegistry;
		_ensureGrammarCache;
		constructor(e) {
			((this._options = e),
				(this._syncRegistry = new Qc(Qn.createFromRawTheme(e.theme, e.colorMap), e.onigLib)),
				(this._ensureGrammarCache = new Map()));
		}
		dispose() {
			this._syncRegistry.dispose();
		}
		setTheme(e, n) {
			this._syncRegistry.setTheme(Qn.createFromRawTheme(e, n));
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
				new Xc(r.balancedBracketSelectors || [], r.unbalancedBracketSelectors || [])
			);
		}
		loadGrammar(e) {
			return this._loadGrammar(e, 0, null, null, null);
		}
		_loadGrammar(e, n, r, s, o) {
			const a = new Ac(this._syncRegistry, e);
			for (; a.Q.length > 0; )
				(a.Q.map((i) => this._loadSingleGrammar(i.scopeName)), a.processQueue());
			return this._grammarForScopeName(e, n, r, s, o);
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
		addGrammar(e, n = [], r = 0, s = null) {
			return (this._syncRegistry.addGrammar(e, n), this._grammarForScopeName(e.scopeName, r, s));
		}
		_grammarForScopeName(e, n = 0, r = null, s = null, o = null) {
			return this._syncRegistry.grammarForScopeName(e, n, r, s, o);
		}
	},
	Wr = zr.NULL;
const Yc = [
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
class Nn {
	constructor(e, n, r) {
		((this.normal = n), (this.property = e), r && (this.space = r));
	}
}
Nn.prototype.normal = {};
Nn.prototype.property = {};
Nn.prototype.space = void 0;
function ea(t, e) {
	const n = {},
		r = {};
	for (const s of t) (Object.assign(n, s.property), Object.assign(r, s.normal));
	return new Nn(n, r, e);
}
function Vr(t) {
	return t.toLowerCase();
}
class et {
	constructor(e, n) {
		((this.attribute = n), (this.property = e));
	}
}
et.prototype.attribute = '';
et.prototype.booleanish = !1;
et.prototype.boolean = !1;
et.prototype.commaOrSpaceSeparated = !1;
et.prototype.commaSeparated = !1;
et.prototype.defined = !1;
et.prototype.mustUseProperty = !1;
et.prototype.number = !1;
et.prototype.overloadedBoolean = !1;
et.prototype.property = '';
et.prototype.spaceSeparated = !1;
et.prototype.space = void 0;
let eu = 0;
const B = Jt(),
	ve = Jt(),
	Hr = Jt(),
	C = Jt(),
	le = Jt(),
	dn = Jt(),
	at = Jt();
function Jt() {
	return 2 ** ++eu;
}
const qr = Object.freeze(
		Object.defineProperty(
			{
				__proto__: null,
				boolean: B,
				booleanish: ve,
				commaOrSpaceSeparated: at,
				commaSeparated: dn,
				number: C,
				overloadedBoolean: Hr,
				spaceSeparated: le
			},
			Symbol.toStringTag,
			{ value: 'Module' }
		)
	),
	Er = Object.keys(qr);
class is extends et {
	constructor(e, n, r, s) {
		let o = -1;
		if ((super(e, n), Vs(this, 'space', s), typeof r == 'number'))
			for (; ++o < Er.length; ) {
				const a = Er[o];
				Vs(this, Er[o], (r & qr[a]) === qr[a]);
			}
	}
}
is.prototype.defined = !0;
function Vs(t, e, n) {
	n && (t[e] = n);
}
function pn(t) {
	const e = {},
		n = {};
	for (const [r, s] of Object.entries(t.properties)) {
		const o = new is(r, t.transform(t.attributes || {}, r), s, t.space);
		(t.mustUseProperty && t.mustUseProperty.includes(r) && (o.mustUseProperty = !0),
			(e[r] = o),
			(n[Vr(r)] = r),
			(n[Vr(o.attribute)] = r));
	}
	return new Nn(e, n, t.space);
}
const ta = pn({
	properties: {
		ariaActiveDescendant: null,
		ariaAtomic: ve,
		ariaAutoComplete: null,
		ariaBusy: ve,
		ariaChecked: ve,
		ariaColCount: C,
		ariaColIndex: C,
		ariaColSpan: C,
		ariaControls: le,
		ariaCurrent: null,
		ariaDescribedBy: le,
		ariaDetails: null,
		ariaDisabled: ve,
		ariaDropEffect: le,
		ariaErrorMessage: null,
		ariaExpanded: ve,
		ariaFlowTo: le,
		ariaGrabbed: ve,
		ariaHasPopup: null,
		ariaHidden: ve,
		ariaInvalid: null,
		ariaKeyShortcuts: null,
		ariaLabel: null,
		ariaLabelledBy: le,
		ariaLevel: C,
		ariaLive: null,
		ariaModal: ve,
		ariaMultiLine: ve,
		ariaMultiSelectable: ve,
		ariaOrientation: null,
		ariaOwns: le,
		ariaPlaceholder: null,
		ariaPosInSet: C,
		ariaPressed: ve,
		ariaReadOnly: ve,
		ariaRelevant: null,
		ariaRequired: ve,
		ariaRoleDescription: le,
		ariaRowCount: C,
		ariaRowIndex: C,
		ariaRowSpan: C,
		ariaSelected: ve,
		ariaSetSize: C,
		ariaSort: null,
		ariaValueMax: C,
		ariaValueMin: C,
		ariaValueNow: C,
		ariaValueText: null,
		role: null
	},
	transform(t, e) {
		return e === 'role' ? e : 'aria-' + e.slice(4).toLowerCase();
	}
});
function na(t, e) {
	return e in t ? t[e] : e;
}
function ra(t, e) {
	return na(t, e.toLowerCase());
}
const tu = pn({
		attributes: {
			acceptcharset: 'accept-charset',
			classname: 'class',
			htmlfor: 'for',
			httpequiv: 'http-equiv'
		},
		mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
		properties: {
			abbr: null,
			accept: dn,
			acceptCharset: le,
			accessKey: le,
			action: null,
			allow: null,
			allowFullScreen: B,
			allowPaymentRequest: B,
			allowUserMedia: B,
			alt: null,
			as: null,
			async: B,
			autoCapitalize: null,
			autoComplete: le,
			autoFocus: B,
			autoPlay: B,
			blocking: le,
			capture: null,
			charSet: null,
			checked: B,
			cite: null,
			className: le,
			cols: C,
			colSpan: null,
			content: null,
			contentEditable: ve,
			controls: B,
			controlsList: le,
			coords: C | dn,
			crossOrigin: null,
			data: null,
			dateTime: null,
			decoding: null,
			default: B,
			defer: B,
			dir: null,
			dirName: null,
			disabled: B,
			download: Hr,
			draggable: ve,
			encType: null,
			enterKeyHint: null,
			fetchPriority: null,
			form: null,
			formAction: null,
			formEncType: null,
			formMethod: null,
			formNoValidate: B,
			formTarget: null,
			headers: le,
			height: C,
			hidden: Hr,
			high: C,
			href: null,
			hrefLang: null,
			htmlFor: le,
			httpEquiv: le,
			id: null,
			imageSizes: null,
			imageSrcSet: null,
			inert: B,
			inputMode: null,
			integrity: null,
			is: null,
			isMap: B,
			itemId: null,
			itemProp: le,
			itemRef: le,
			itemScope: B,
			itemType: le,
			kind: null,
			label: null,
			lang: null,
			language: null,
			list: null,
			loading: null,
			loop: B,
			low: C,
			manifest: null,
			max: null,
			maxLength: C,
			media: null,
			method: null,
			min: null,
			minLength: C,
			multiple: B,
			muted: B,
			name: null,
			nonce: null,
			noModule: B,
			noValidate: B,
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
			open: B,
			optimum: C,
			pattern: null,
			ping: le,
			placeholder: null,
			playsInline: B,
			popover: null,
			popoverTarget: null,
			popoverTargetAction: null,
			poster: null,
			preload: null,
			readOnly: B,
			referrerPolicy: null,
			rel: le,
			required: B,
			reversed: B,
			rows: C,
			rowSpan: C,
			sandbox: le,
			scope: null,
			scoped: B,
			seamless: B,
			selected: B,
			shadowRootClonable: B,
			shadowRootDelegatesFocus: B,
			shadowRootMode: null,
			shape: null,
			size: C,
			sizes: null,
			slot: null,
			span: C,
			spellCheck: ve,
			src: null,
			srcDoc: null,
			srcLang: null,
			srcSet: null,
			start: C,
			step: null,
			style: null,
			tabIndex: C,
			target: null,
			title: null,
			translate: null,
			type: null,
			typeMustMatch: B,
			useMap: null,
			value: ve,
			width: C,
			wrap: null,
			writingSuggestions: null,
			align: null,
			aLink: null,
			archive: le,
			axis: null,
			background: null,
			bgColor: null,
			border: C,
			borderColor: null,
			bottomMargin: C,
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
			compact: B,
			declare: B,
			event: null,
			face: null,
			frame: null,
			frameBorder: null,
			hSpace: C,
			leftMargin: C,
			link: null,
			longDesc: null,
			lowSrc: null,
			marginHeight: C,
			marginWidth: C,
			noResize: B,
			noHref: B,
			noShade: B,
			noWrap: B,
			object: null,
			profile: null,
			prompt: null,
			rev: null,
			rightMargin: C,
			rules: null,
			scheme: null,
			scrolling: ve,
			standby: null,
			summary: null,
			text: null,
			topMargin: C,
			valueType: null,
			version: null,
			vAlign: null,
			vLink: null,
			vSpace: C,
			allowTransparency: null,
			autoCorrect: null,
			autoSave: null,
			disablePictureInPicture: B,
			disableRemotePlayback: B,
			prefix: null,
			property: null,
			results: C,
			security: null,
			unselectable: null
		},
		space: 'html',
		transform: ra
	}),
	nu = pn({
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
			about: at,
			accentHeight: C,
			accumulate: null,
			additive: null,
			alignmentBaseline: null,
			alphabetic: C,
			amplitude: C,
			arabicForm: null,
			ascent: C,
			attributeName: null,
			attributeType: null,
			azimuth: C,
			bandwidth: null,
			baselineShift: null,
			baseFrequency: null,
			baseProfile: null,
			bbox: null,
			begin: null,
			bias: C,
			by: null,
			calcMode: null,
			capHeight: C,
			className: le,
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
			descent: C,
			diffuseConstant: C,
			direction: null,
			display: null,
			dur: null,
			divisor: C,
			dominantBaseline: null,
			download: B,
			dx: null,
			dy: null,
			edgeMode: null,
			editable: null,
			elevation: C,
			enableBackground: null,
			end: null,
			event: null,
			exponent: C,
			externalResourcesRequired: null,
			fill: null,
			fillOpacity: C,
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
			g1: dn,
			g2: dn,
			glyphName: dn,
			glyphOrientationHorizontal: null,
			glyphOrientationVertical: null,
			glyphRef: null,
			gradientTransform: null,
			gradientUnits: null,
			handler: null,
			hanging: C,
			hatchContentUnits: null,
			hatchUnits: null,
			height: null,
			href: null,
			hrefLang: null,
			horizAdvX: C,
			horizOriginX: C,
			horizOriginY: C,
			id: null,
			ideographic: C,
			imageRendering: null,
			initialVisibility: null,
			in: null,
			in2: null,
			intercept: C,
			k: C,
			k1: C,
			k2: C,
			k3: C,
			k4: C,
			kernelMatrix: at,
			kernelUnitLength: null,
			keyPoints: null,
			keySplines: null,
			keyTimes: null,
			kerning: null,
			lang: null,
			lengthAdjust: null,
			letterSpacing: null,
			lightingColor: null,
			limitingConeAngle: C,
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
			mediaSize: C,
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
			overlinePosition: C,
			overlineThickness: C,
			paintOrder: null,
			panose1: null,
			path: null,
			pathLength: C,
			patternContentUnits: null,
			patternTransform: null,
			patternUnits: null,
			phase: null,
			ping: le,
			pitch: null,
			playbackOrder: null,
			pointerEvents: null,
			points: null,
			pointsAtX: C,
			pointsAtY: C,
			pointsAtZ: C,
			preserveAlpha: null,
			preserveAspectRatio: null,
			primitiveUnits: null,
			propagate: null,
			property: at,
			r: null,
			radius: null,
			referrerPolicy: null,
			refX: null,
			refY: null,
			rel: at,
			rev: at,
			renderingIntent: null,
			repeatCount: null,
			repeatDur: null,
			requiredExtensions: at,
			requiredFeatures: at,
			requiredFonts: at,
			requiredFormats: at,
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
			specularConstant: C,
			specularExponent: C,
			spreadMethod: null,
			spacing: null,
			startOffset: null,
			stdDeviation: null,
			stemh: null,
			stemv: null,
			stitchTiles: null,
			stopColor: null,
			stopOpacity: null,
			strikethroughPosition: C,
			strikethroughThickness: C,
			string: null,
			stroke: null,
			strokeDashArray: at,
			strokeDashOffset: null,
			strokeLineCap: null,
			strokeLineJoin: null,
			strokeMiterLimit: C,
			strokeOpacity: C,
			strokeWidth: null,
			style: null,
			surfaceScale: C,
			syncBehavior: null,
			syncBehaviorDefault: null,
			syncMaster: null,
			syncTolerance: null,
			syncToleranceDefault: null,
			systemLanguage: at,
			tabIndex: C,
			tableValues: null,
			target: null,
			targetX: C,
			targetY: C,
			textAnchor: null,
			textDecoration: null,
			textRendering: null,
			textLength: null,
			timelineBegin: null,
			title: null,
			transformBehavior: null,
			type: null,
			typeOf: at,
			to: null,
			transform: null,
			transformOrigin: null,
			u1: null,
			u2: null,
			underlinePosition: C,
			underlineThickness: C,
			unicode: null,
			unicodeBidi: null,
			unicodeRange: null,
			unitsPerEm: C,
			values: null,
			vAlphabetic: C,
			vMathematical: C,
			vectorEffect: null,
			vHanging: C,
			vIdeographic: C,
			version: null,
			vertAdvY: C,
			vertOriginX: C,
			vertOriginY: C,
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
			xHeight: C,
			y: null,
			y1: null,
			y2: null,
			yChannelSelector: null,
			z: null,
			zoomAndPan: null
		},
		space: 'svg',
		transform: na
	}),
	sa = pn({
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
	oa = pn({
		attributes: { xmlnsxlink: 'xmlns:xlink' },
		properties: { xmlnsXLink: null, xmlns: null },
		space: 'xmlns',
		transform: ra
	}),
	aa = pn({
		properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
		space: 'xml',
		transform(t, e) {
			return 'xml:' + e.slice(3).toLowerCase();
		}
	}),
	ru = /[A-Z]/g,
	Hs = /-[a-z]/g,
	su = /^data[-\w.:]+$/i;
function ou(t, e) {
	const n = Vr(e);
	let r = e,
		s = et;
	if (n in t.normal) return t.property[t.normal[n]];
	if (n.length > 4 && n.slice(0, 4) === 'data' && su.test(e)) {
		if (e.charAt(4) === '-') {
			const o = e.slice(5).replace(Hs, iu);
			r = 'data' + o.charAt(0).toUpperCase() + o.slice(1);
		} else {
			const o = e.slice(4);
			if (!Hs.test(o)) {
				let a = o.replace(ru, au);
				(a.charAt(0) !== '-' && (a = '-' + a), (e = 'data' + a));
			}
		}
		s = is;
	}
	return new s(r, e);
}
function au(t) {
	return '-' + t.toLowerCase();
}
function iu(t) {
	return t.charAt(1).toUpperCase();
}
const lu = ea([ta, tu, sa, oa, aa], 'html'),
	ia = ea([ta, nu, sa, oa, aa], 'svg'),
	qs = {}.hasOwnProperty;
function cu(t, e) {
	const n = e || {};
	function r(s, ...o) {
		let a = r.invalid;
		const i = r.handlers;
		if (s && qs.call(s, t)) {
			const l = String(s[t]);
			a = qs.call(i, l) ? i[l] : r.unknown;
		}
		if (a) return a.call(this, s, ...o);
	}
	return ((r.handlers = n.handlers || {}), (r.invalid = n.invalid), (r.unknown = n.unknown), r);
}
const uu = /["&'<>`]/g,
	du = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
	hu = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,
	fu = /[|\\{}()[\]^$+*?.]/g,
	Ks = new WeakMap();
function pu(t, e) {
	if (((t = t.replace(e.subset ? gu(e.subset) : uu, r)), e.subset || e.escapeOnly)) return t;
	return t.replace(du, n).replace(hu, r);
	function n(s, o, a) {
		return e.format(
			(s.charCodeAt(0) - 55296) * 1024 + s.charCodeAt(1) - 56320 + 65536,
			a.charCodeAt(o + 2),
			e
		);
	}
	function r(s, o, a) {
		return e.format(s.charCodeAt(0), a.charCodeAt(o + 1), e);
	}
}
function gu(t) {
	let e = Ks.get(t);
	return (e || ((e = mu(t)), Ks.set(t, e)), e);
}
function mu(t) {
	const e = [];
	let n = -1;
	for (; ++n < t.length; ) e.push(t[n].replace(fu, '\\$&'));
	return new RegExp('(?:' + e.join('|') + ')', 'g');
}
const vu = /[\dA-Fa-f]/;
function _u(t, e, n) {
	const r = '&#x' + t.toString(16).toUpperCase();
	return n && e && !vu.test(String.fromCharCode(e)) ? r : r + ';';
}
const yu = /\d/;
function bu(t, e, n) {
	const r = '&#' + String(t);
	return n && e && !yu.test(String.fromCharCode(e)) ? r : r + ';';
}
const wu = [
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
	Ar = {
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
	Cu = ['cent', 'copy', 'divide', 'gt', 'lt', 'not', 'para', 'times'],
	la = {}.hasOwnProperty,
	Kr = {};
let jn;
for (jn in Ar) la.call(Ar, jn) && (Kr[Ar[jn]] = jn);
const ku = /[^\dA-Za-z]/;
function xu(t, e, n, r) {
	const s = String.fromCharCode(t);
	if (la.call(Kr, s)) {
		const o = Kr[s],
			a = '&' + o;
		return n &&
			wu.includes(o) &&
			!Cu.includes(o) &&
			(!r || (e && e !== 61 && ku.test(String.fromCharCode(e))))
			? a
			: a + ';';
	}
	return '';
}
function Su(t, e, n) {
	let r = _u(t, e, n.omitOptionalSemicolons),
		s;
	if (
		((n.useNamedReferences || n.useShortestReferences) &&
			(s = xu(t, e, n.omitOptionalSemicolons, n.attribute)),
		(n.useShortestReferences || !s) && n.useShortestReferences)
	) {
		const o = bu(t, e, n.omitOptionalSemicolons);
		o.length < r.length && (r = o);
	}
	return s && (!n.useShortestReferences || s.length < r.length) ? s : r;
}
function hn(t, e) {
	return pu(t, Object.assign({ format: Su }, e));
}
const Eu = /^>|^->|<!--|-->|--!>|<!-$/g,
	Au = ['>'],
	Pu = ['<', '>'];
function Iu(t, e, n, r) {
	return r.settings.bogusComments
		? '<?' + hn(t.value, Object.assign({}, r.settings.characterReferences, { subset: Au })) + '>'
		: '<!--' + t.value.replace(Eu, s) + '-->';
	function s(o) {
		return hn(o, Object.assign({}, r.settings.characterReferences, { subset: Pu }));
	}
}
function Ru(t, e, n, r) {
	return (
		'<!' +
		(r.settings.upperDoctype ? 'DOCTYPE' : 'doctype') +
		(r.settings.tightDoctype ? '' : ' ') +
		'html>'
	);
}
function Xs(t, e) {
	const n = String(t);
	if (typeof e != 'string') throw new TypeError('Expected character');
	let r = 0,
		s = n.indexOf(e);
	for (; s !== -1; ) (r++, (s = n.indexOf(e, s + e.length)));
	return r;
}
function $u(t, e) {
	const n = e || {};
	return (t[t.length - 1] === '' ? [...t, ''] : t)
		.join((n.padRight ? ' ' : '') + ',' + (n.padLeft === !1 ? '' : ' '))
		.trim();
}
function Nu(t) {
	return t.join(' ').trim();
}
const Lu = /[ \t\n\f\r]/g;
function ls(t) {
	return typeof t == 'object' ? (t.type === 'text' ? Zs(t.value) : !1) : Zs(t);
}
function Zs(t) {
	return t.replace(Lu, '') === '';
}
const ke = ua(1),
	ca = ua(-1),
	Tu = [];
function ua(t) {
	return e;
	function e(n, r, s) {
		const o = n ? n.children : Tu;
		let a = (r || 0) + t,
			i = o[a];
		if (!s) for (; i && ls(i); ) ((a += t), (i = o[a]));
		return i;
	}
}
const Mu = {}.hasOwnProperty;
function da(t) {
	return e;
	function e(n, r, s) {
		return Mu.call(t, n.tagName) && t[n.tagName](n, r, s);
	}
}
const cs = da({
	body: Du,
	caption: Pr,
	colgroup: Pr,
	dd: ju,
	dt: Bu,
	head: Pr,
	html: Ou,
	li: Fu,
	optgroup: Uu,
	option: zu,
	p: Gu,
	rp: Qs,
	rt: Qs,
	tbody: Vu,
	td: Js,
	tfoot: Hu,
	th: Js,
	thead: Wu,
	tr: qu
});
function Pr(t, e, n) {
	const r = ke(n, e, !0);
	return !r || (r.type !== 'comment' && !(r.type === 'text' && ls(r.value.charAt(0))));
}
function Ou(t, e, n) {
	const r = ke(n, e);
	return !r || r.type !== 'comment';
}
function Du(t, e, n) {
	const r = ke(n, e);
	return !r || r.type !== 'comment';
}
function Gu(t, e, n) {
	const r = ke(n, e);
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
function Fu(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && r.tagName === 'li');
}
function Bu(t, e, n) {
	const r = ke(n, e);
	return !!(r && r.type === 'element' && (r.tagName === 'dt' || r.tagName === 'dd'));
}
function ju(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'dt' || r.tagName === 'dd'));
}
function Qs(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'rp' || r.tagName === 'rt'));
}
function Uu(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && r.tagName === 'optgroup');
}
function zu(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'option' || r.tagName === 'optgroup'));
}
function Wu(t, e, n) {
	const r = ke(n, e);
	return !!(r && r.type === 'element' && (r.tagName === 'tbody' || r.tagName === 'tfoot'));
}
function Vu(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'tbody' || r.tagName === 'tfoot'));
}
function Hu(t, e, n) {
	return !ke(n, e);
}
function qu(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && r.tagName === 'tr');
}
function Js(t, e, n) {
	const r = ke(n, e);
	return !r || (r.type === 'element' && (r.tagName === 'td' || r.tagName === 'th'));
}
const Ku = da({ body: Qu, colgroup: Ju, head: Zu, html: Xu, tbody: Yu });
function Xu(t) {
	const e = ke(t, -1);
	return !e || e.type !== 'comment';
}
function Zu(t) {
	const e = new Set();
	for (const r of t.children)
		if (r.type === 'element' && (r.tagName === 'base' || r.tagName === 'title')) {
			if (e.has(r.tagName)) return !1;
			e.add(r.tagName);
		}
	const n = t.children[0];
	return !n || n.type === 'element';
}
function Qu(t) {
	const e = ke(t, -1, !0);
	return (
		!e ||
		(e.type !== 'comment' &&
			!(e.type === 'text' && ls(e.value.charAt(0))) &&
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
function Ju(t, e, n) {
	const r = ca(n, e),
		s = ke(t, -1, !0);
	return n &&
		r &&
		r.type === 'element' &&
		r.tagName === 'colgroup' &&
		cs(r, n.children.indexOf(r), n)
		? !1
		: !!(s && s.type === 'element' && s.tagName === 'col');
}
function Yu(t, e, n) {
	const r = ca(n, e),
		s = ke(t, -1);
	return n &&
		r &&
		r.type === 'element' &&
		(r.tagName === 'thead' || r.tagName === 'tbody') &&
		cs(r, n.children.indexOf(r), n)
		? !1
		: !!(s && s.type === 'element' && s.tagName === 'tr');
}
const Un = {
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
function ed(t, e, n, r) {
	const s = r.schema,
		o = s.space === 'svg' ? !1 : r.settings.omitOptionalTags;
	let a =
		s.space === 'svg'
			? r.settings.closeEmptyElements
			: r.settings.voids.includes(t.tagName.toLowerCase());
	const i = [];
	let l;
	s.space === 'html' && t.tagName === 'svg' && (r.schema = ia);
	const c = td(r, t.properties),
		u = r.all(s.space === 'html' && t.tagName === 'template' ? t.content : t);
	return (
		(r.schema = s),
		u && (a = !1),
		(c || !o || !Ku(t, e, n)) &&
			(i.push('<', t.tagName, c ? ' ' + c : ''),
			a &&
				(s.space === 'svg' || r.settings.closeSelfClosing) &&
				((l = c.charAt(c.length - 1)),
				(!r.settings.tightSelfClosing || l === '/' || (l && l !== '"' && l !== "'")) && i.push(' '),
				i.push('/')),
			i.push('>')),
		i.push(u),
		!a && (!o || !cs(t, e, n)) && i.push('</' + t.tagName + '>'),
		i.join('')
	);
}
function td(t, e) {
	const n = [];
	let r = -1,
		s;
	if (e) {
		for (s in e)
			if (e[s] !== null && e[s] !== void 0) {
				const o = nd(t, s, e[s]);
				o && n.push(o);
			}
	}
	for (; ++r < n.length; ) {
		const o = t.settings.tightAttributes ? n[r].charAt(n[r].length - 1) : void 0;
		r !== n.length - 1 && o !== '"' && o !== "'" && (n[r] += ' ');
	}
	return n.join('');
}
function nd(t, e, n) {
	const r = ou(t.schema, e),
		s = t.settings.allowParseErrors && t.schema.space === 'html' ? 0 : 1,
		o = t.settings.allowDangerousCharacters ? 0 : 1;
	let a = t.quote,
		i;
	if (
		(r.overloadedBoolean && (n === r.attribute || n === '')
			? (n = !0)
			: (r.boolean || r.overloadedBoolean) &&
				(typeof n != 'string' || n === r.attribute || n === '') &&
				(n = !!n),
		n == null || n === !1 || (typeof n == 'number' && Number.isNaN(n)))
	)
		return '';
	const l = hn(
		r.attribute,
		Object.assign({}, t.settings.characterReferences, { subset: Un.name[s][o] })
	);
	return n === !0 ||
		((n = Array.isArray(n)
			? (r.commaSeparated ? $u : Nu)(n, { padLeft: !t.settings.tightCommaSeparatedLists })
			: String(n)),
		t.settings.collapseEmptyAttributes && !n)
		? l
		: (t.settings.preferUnquoted &&
				(i = hn(
					n,
					Object.assign({}, t.settings.characterReferences, {
						attribute: !0,
						subset: Un.unquoted[s][o]
					})
				)),
			i !== n &&
				(t.settings.quoteSmart && Xs(n, a) > Xs(n, t.alternative) && (a = t.alternative),
				(i =
					a +
					hn(
						n,
						Object.assign({}, t.settings.characterReferences, {
							subset: (a === "'" ? Un.single : Un.double)[s][o],
							attribute: !0
						})
					) +
					a)),
			l + (i && '=' + i));
}
const rd = ['<', '&'];
function ha(t, e, n, r) {
	return n && n.type === 'element' && (n.tagName === 'script' || n.tagName === 'style')
		? t.value
		: hn(t.value, Object.assign({}, r.settings.characterReferences, { subset: rd }));
}
function sd(t, e, n, r) {
	return r.settings.allowDangerousHtml ? t.value : ha(t, e, n, r);
}
function od(t, e, n, r) {
	return r.all(t);
}
const ad = cu('type', {
	invalid: id,
	unknown: ld,
	handlers: { comment: Iu, doctype: Ru, element: ed, raw: sd, root: od, text: ha }
});
function id(t) {
	throw new Error('Expected node, not `' + t + '`');
}
function ld(t) {
	const e = t;
	throw new Error('Cannot compile unknown node `' + e.type + '`');
}
const cd = {},
	ud = {},
	dd = [];
function hd(t, e) {
	const n = e || cd,
		r = n.quote || '"',
		s = r === '"' ? "'" : '"';
	if (r !== '"' && r !== "'") throw new Error('Invalid quote `' + r + '`, expected `\'` or `"`');
	return {
		one: fd,
		all: pd,
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
			voids: n.voids || Yc,
			characterReferences: n.characterReferences || ud,
			closeSelfClosing: n.closeSelfClosing || !1,
			closeEmptyElements: n.closeEmptyElements || !1
		},
		schema: n.space === 'svg' ? ia : lu,
		quote: r,
		alternative: s
	}.one(Array.isArray(t) ? { type: 'root', children: t } : t, void 0, void 0);
}
function fd(t, e, n) {
	return ad(t, e, n, this);
}
function pd(t) {
	const e = [],
		n = (t && t.children) || dd;
	let r = -1;
	for (; ++r < n.length; ) e[r] = this.one(n[r], r, t);
	return e.join('');
}
function nr(t, e) {
	const n = typeof t == 'string' ? {} : { ...t.colorReplacements },
		r = typeof t == 'string' ? t : t.name;
	for (const [s, o] of Object.entries(e?.colorReplacements || {}))
		typeof o == 'string' ? (n[s] = o) : s === r && Object.assign(n, o);
	return n;
}
function Bt(t, e) {
	return t && (e?.[t?.toLowerCase()] || t);
}
function gd(t) {
	return Array.isArray(t) ? t : [t];
}
async function fa(t) {
	return Promise.resolve(typeof t == 'function' ? t() : t).then((e) => e.default || e);
}
function us(t) {
	return !t || ['plaintext', 'txt', 'text', 'plain'].includes(t);
}
function md(t) {
	return t === 'ansi' || us(t);
}
function ds(t) {
	return t === 'none';
}
function vd(t) {
	return ds(t);
}
function pa(t, e) {
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
function dr(t, e = !1) {
	const n = t.split(/(\r?\n)/g);
	let r = 0;
	const s = [];
	for (let o = 0; o < n.length; o += 2) {
		const a = e ? n[o] + (n[o + 1] || '') : n[o];
		(s.push([a, r]), (r += n[o].length), (r += n[o + 1]?.length || 0));
	}
	return s;
}
function _d(t) {
	const e = dr(t, !0).map(([s]) => s);
	function n(s) {
		if (s === t.length) return { line: e.length - 1, character: e[e.length - 1].length };
		let o = s,
			a = 0;
		for (const i of e) {
			if (o < i.length) break;
			((o -= i.length), a++);
		}
		return { line: a, character: o };
	}
	function r(s, o) {
		let a = 0;
		for (let i = 0; i < s; i++) a += e[i].length;
		return ((a += o), a);
	}
	return { lines: e, indexToPos: n, posToIndex: r };
}
const hs = 'light-dark()',
	yd = ['color', 'background-color'];
function bd(t, e) {
	let n = 0;
	const r = [];
	for (const s of e)
		(s > n && r.push({ ...t, content: t.content.slice(n, s), offset: t.offset + n }), (n = s));
	return (
		n < t.content.length && r.push({ ...t, content: t.content.slice(n), offset: t.offset + n }),
		r
	);
}
function wd(t, e) {
	const n = Array.from(e instanceof Set ? e : new Set(e)).sort((r, s) => r - s);
	return n.length
		? t.map((r) =>
				r.flatMap((s) => {
					const o = n
						.filter((a) => s.offset < a && a < s.offset + s.content.length)
						.map((a) => a - s.offset)
						.sort((a, i) => a - i);
					return o.length ? bd(s, o) : s;
				})
			)
		: t;
}
function Cd(t, e, n, r, s = 'css-vars') {
	const o = { content: t.content, explanation: t.explanation, offset: t.offset },
		a = e.map((u) => rr(t.variants[u])),
		i = new Set(a.flatMap((u) => Object.keys(u))),
		l = {},
		c = (u, d) => {
			const f = d === 'color' ? '' : d === 'background-color' ? '-bg' : `-${d}`;
			return n + e[u] + (d === 'color' ? '' : f);
		};
	return (
		a.forEach((u, d) => {
			for (const f of i) {
				const h = u[f] || 'inherit';
				if (d === 0 && r && yd.includes(f))
					if (r === hs && a.length > 1) {
						const p = e.findIndex((_) => _ === 'light'),
							v = e.findIndex((_) => _ === 'dark');
						if (p === -1 || v === -1)
							throw new Re(
								'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes'
							);
						const b = a[p][f] || 'inherit',
							w = a[v][f] || 'inherit';
						((l[f] = `light-dark(${b}, ${w})`), s === 'css-vars' && (l[c(d, f)] = h));
					} else l[f] = h;
				else s === 'css-vars' && (l[c(d, f)] = h);
			}
		}),
		(o.htmlStyle = l),
		o
	);
}
function rr(t) {
	const e = {};
	if (
		(t.color && (e.color = t.color), t.bgColor && (e['background-color'] = t.bgColor), t.fontStyle)
	) {
		(t.fontStyle & Ue.Italic && (e['font-style'] = 'italic'),
			t.fontStyle & Ue.Bold && (e['font-weight'] = 'bold'));
		const n = [];
		(t.fontStyle & Ue.Underline && n.push('underline'),
			t.fontStyle & Ue.Strikethrough && n.push('line-through'),
			n.length && (e['text-decoration'] = n.join(' ')));
	}
	return e;
}
function Xr(t) {
	return typeof t == 'string'
		? t
		: Object.entries(t)
				.map(([e, n]) => `${e}:${n}`)
				.join(';');
}
const ga = new WeakMap();
function hr(t, e) {
	ga.set(t, e);
}
function In(t) {
	return ga.get(t);
}
class gn {
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
		return new gn(Object.fromEntries(gd(n).map((r) => [r, Wr])), e);
	}
	constructor(...e) {
		if (e.length === 2) {
			const [n, r] = e;
			((this.lang = r), (this._stacks = n));
		} else {
			const [n, r, s] = e;
			((this.lang = r), (this._stacks = { [s]: n }));
		}
	}
	getInternalStack(e = this.theme) {
		return this._stacks[e];
	}
	getScopes(e = this.theme) {
		return kd(this._stacks[e]);
	}
	toJSON() {
		return { lang: this.lang, theme: this.theme, themes: this.themes, scopes: this.getScopes() };
	}
}
function kd(t) {
	const e = [],
		n = new Set();
	function r(s) {
		if (n.has(s)) return;
		n.add(s);
		const o = s?.nameScopesList?.scopeName;
		(o && e.push(o), s.parent && r(s.parent));
	}
	return (r(t), e);
}
function xd(t, e) {
	if (!(t instanceof gn)) throw new Re('Invalid grammar state');
	return t.getInternalStack(e);
}
function Sd() {
	const t = new WeakMap();
	function e(n) {
		if (!t.has(n.meta)) {
			let r = function (a) {
				if (typeof a == 'number') {
					if (a < 0 || a > n.source.length)
						throw new Re(`Invalid decoration offset: ${a}. Code length: ${n.source.length}`);
					return { ...s.indexToPos(a), offset: a };
				} else {
					const i = s.lines[a.line];
					if (i === void 0)
						throw new Re(
							`Invalid decoration position ${JSON.stringify(a)}. Lines length: ${s.lines.length}`
						);
					if (a.character < 0 || a.character > i.length)
						throw new Re(
							`Invalid decoration position ${JSON.stringify(a)}. Line ${a.line} length: ${i.length}`
						);
					return { ...a, offset: s.posToIndex(a.line, a.character) };
				}
			};
			const s = _d(n.source),
				o = (n.options.decorations || []).map((a) => ({ ...a, start: r(a.start), end: r(a.end) }));
			(Ed(o), t.set(n.meta, { decorations: o, converter: s, source: n.source }));
		}
		return t.get(n.meta);
	}
	return {
		name: 'shiki:decorations',
		tokens(n) {
			if (!this.options.decorations?.length) return;
			const s = e(this).decorations.flatMap((a) => [a.start.offset, a.end.offset]);
			return wd(n, s);
		},
		code(n) {
			if (!this.options.decorations?.length) return;
			const r = e(this),
				s = Array.from(n.children).filter((u) => u.type === 'element' && u.tagName === 'span');
			if (s.length !== r.converter.lines.length)
				throw new Re(
					`Number of lines in code element (${s.length}) does not match the number of lines in the source (${r.converter.lines.length}). Failed to apply decorations.`
				);
			function o(u, d, f, h) {
				const p = s[u];
				let v = '',
					b = -1,
					w = -1;
				if (
					(d === 0 && (b = 0),
					f === 0 && (w = 0),
					f === Number.POSITIVE_INFINITY && (w = p.children.length),
					b === -1 || w === -1)
				)
					for (let k = 0; k < p.children.length; k++)
						((v += ma(p.children[k])),
							b === -1 && v.length === d && (b = k + 1),
							w === -1 && v.length === f && (w = k + 1));
				if (b === -1)
					throw new Re(`Failed to find start index for decoration ${JSON.stringify(h.start)}`);
				if (w === -1)
					throw new Re(`Failed to find end index for decoration ${JSON.stringify(h.end)}`);
				const _ = p.children.slice(b, w);
				if (!h.alwaysWrap && _.length === p.children.length) i(p, h, 'line');
				else if (!h.alwaysWrap && _.length === 1 && _[0].type === 'element') i(_[0], h, 'token');
				else {
					const k = { type: 'element', tagName: 'span', properties: {}, children: _ };
					(i(k, h, 'wrapper'), p.children.splice(b, _.length, k));
				}
			}
			function a(u, d) {
				s[u] = i(s[u], d, 'line');
			}
			function i(u, d, f) {
				const h = d.properties || {},
					p = d.transform || ((v) => v);
				return (
					(u.tagName = d.tagName || 'span'),
					(u.properties = { ...u.properties, ...h, class: u.properties.class }),
					d.properties?.class && pa(u, d.properties.class),
					(u = p(u, f) || u),
					u
				);
			}
			const l = [],
				c = r.decorations.sort(
					(u, d) => d.start.offset - u.start.offset || u.end.offset - d.end.offset
				);
			for (const u of c) {
				const { start: d, end: f } = u;
				if (d.line === f.line) o(d.line, d.character, f.character, u);
				else if (d.line < f.line) {
					o(d.line, d.character, Number.POSITIVE_INFINITY, u);
					for (let h = d.line + 1; h < f.line; h++) l.unshift(() => a(h, u));
					o(f.line, 0, f.character, u);
				}
			}
			l.forEach((u) => u());
		}
	};
}
function Ed(t) {
	for (let e = 0; e < t.length; e++) {
		const n = t[e];
		if (n.start.offset > n.end.offset)
			throw new Re(
				`Invalid decoration range: ${JSON.stringify(n.start)} - ${JSON.stringify(n.end)}`
			);
		for (let r = e + 1; r < t.length; r++) {
			const s = t[r],
				o = n.start.offset <= s.start.offset && s.start.offset < n.end.offset,
				a = n.start.offset < s.end.offset && s.end.offset <= n.end.offset,
				i = s.start.offset <= n.start.offset && n.start.offset < s.end.offset,
				l = s.start.offset < n.end.offset && n.end.offset <= s.end.offset;
			if (o || a || i || l) {
				if (
					(o && a) ||
					(i && l) ||
					(i && n.start.offset === n.end.offset) ||
					(a && s.start.offset === s.end.offset)
				)
					continue;
				throw new Re(
					`Decorations ${JSON.stringify(n.start)} and ${JSON.stringify(s.start)} intersect.`
				);
			}
		}
	}
}
function ma(t) {
	return t.type === 'text' ? t.value : t.type === 'element' ? t.children.map(ma).join('') : '';
}
const Ad = [Sd()];
function sr(t) {
	return [...(t.transformers || []), ...Ad];
}
var Xt = [
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
	Ir = {
		1: 'bold',
		2: 'dim',
		3: 'italic',
		4: 'underline',
		7: 'reverse',
		8: 'hidden',
		9: 'strikethrough'
	};
function Pd(t, e) {
	const n = t.indexOf('\x1B', e);
	if (n !== -1 && t[n + 1] === '[') {
		const r = t.indexOf('m', n);
		if (r !== -1)
			return { sequence: t.substring(n + 2, r).split(';'), startPosition: n, position: r + 1 };
	}
	return { position: t.length };
}
function Ys(t) {
	const e = t.shift();
	if (e === '2') {
		const n = t.splice(0, 3).map((r) => Number.parseInt(r));
		return n.length !== 3 || n.some((r) => Number.isNaN(r)) ? void 0 : { type: 'rgb', rgb: n };
	} else if (e === '5') {
		const n = t.shift();
		if (n) return { type: 'table', index: Number(n) };
	}
}
function Id(t) {
	const e = [];
	for (; t.length > 0; ) {
		const n = t.shift();
		if (!n) continue;
		const r = Number.parseInt(n);
		if (!Number.isNaN(r))
			if (r === 0) e.push({ type: 'resetAll' });
			else if (r <= 9) Ir[r] && e.push({ type: 'setDecoration', value: Ir[r] });
			else if (r <= 29) {
				const s = Ir[r - 20];
				s &&
					(e.push({ type: 'resetDecoration', value: s }),
					s === 'dim' && e.push({ type: 'resetDecoration', value: 'bold' }));
			} else if (r <= 37)
				e.push({ type: 'setForegroundColor', value: { type: 'named', name: Xt[r - 30] } });
			else if (r === 38) {
				const s = Ys(t);
				s && e.push({ type: 'setForegroundColor', value: s });
			} else if (r === 39) e.push({ type: 'resetForegroundColor' });
			else if (r <= 47)
				e.push({ type: 'setBackgroundColor', value: { type: 'named', name: Xt[r - 40] } });
			else if (r === 48) {
				const s = Ys(t);
				s && e.push({ type: 'setBackgroundColor', value: s });
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
										value: { type: 'named', name: Xt[r - 90 + 8] }
									})
								: r >= 100 &&
									r <= 107 &&
									e.push({
										type: 'setBackgroundColor',
										value: { type: 'named', name: Xt[r - 100 + 8] }
									});
	}
	return e;
}
function Rd() {
	let t = null,
		e = null,
		n = new Set();
	return {
		parse(r) {
			const s = [];
			let o = 0;
			do {
				const a = Pd(r, o),
					i = a.sequence ? r.substring(o, a.startPosition) : r.substring(o);
				if (
					(i.length > 0 &&
						s.push({ value: i, foreground: t, background: e, decorations: new Set(n) }),
					a.sequence)
				) {
					const l = Id(a.sequence);
					for (const c of l)
						c.type === 'resetAll'
							? ((t = null), (e = null), n.clear())
							: c.type === 'resetForegroundColor'
								? (t = null)
								: c.type === 'resetBackgroundColor'
									? (e = null)
									: c.type === 'resetDecoration' && n.delete(c.value);
					for (const c of l)
						c.type === 'setForegroundColor'
							? (t = c.value)
							: c.type === 'setBackgroundColor'
								? (e = c.value)
								: c.type === 'setDecoration' && n.add(c.value);
				}
				o = a.position;
			} while (o < r.length);
			return s;
		}
	};
}
var $d = {
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
function Nd(t = $d) {
	function e(i) {
		return t[i];
	}
	function n(i) {
		return `#${i.map((l) => Math.max(0, Math.min(l, 255)).toString(16).padStart(2, '0')).join('')}`;
	}
	let r;
	function s() {
		if (r) return r;
		r = [];
		for (let c = 0; c < Xt.length; c++) r.push(e(Xt[c]));
		let i = [0, 95, 135, 175, 215, 255];
		for (let c = 0; c < 6; c++)
			for (let u = 0; u < 6; u++) for (let d = 0; d < 6; d++) r.push(n([i[c], i[u], i[d]]));
		let l = 8;
		for (let c = 0; c < 24; c++, l += 10) r.push(n([l, l, l]));
		return r;
	}
	function o(i) {
		return s()[i];
	}
	function a(i) {
		switch (i.type) {
			case 'named':
				return e(i.name);
			case 'rgb':
				return n(i.rgb);
			case 'table':
				return o(i.index);
		}
	}
	return { value: a };
}
function Ld(t, e, n) {
	const r = nr(t, n),
		s = dr(e),
		o = Nd(
			Object.fromEntries(
				Xt.map((i) => [i, t.colors?.[`terminal.ansi${i[0].toUpperCase()}${i.substring(1)}`]])
			)
		),
		a = Rd();
	return s.map((i) =>
		a.parse(i[0]).map((l) => {
			let c, u;
			(l.decorations.has('reverse')
				? ((c = l.background ? o.value(l.background) : t.bg),
					(u = l.foreground ? o.value(l.foreground) : t.fg))
				: ((c = l.foreground ? o.value(l.foreground) : t.fg),
					(u = l.background ? o.value(l.background) : void 0)),
				(c = Bt(c, r)),
				(u = Bt(u, r)),
				l.decorations.has('dim') && (c = Td(c)));
			let d = Ue.None;
			return (
				l.decorations.has('bold') && (d |= Ue.Bold),
				l.decorations.has('italic') && (d |= Ue.Italic),
				l.decorations.has('underline') && (d |= Ue.Underline),
				l.decorations.has('strikethrough') && (d |= Ue.Strikethrough),
				{ content: l.value, offset: i[1], color: c, bgColor: u, fontStyle: d }
			);
		})
	);
}
function Td(t) {
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
function fs(t, e, n = {}) {
	const { lang: r = 'text', theme: s = t.getLoadedThemes()[0] } = n;
	if (us(r) || ds(s)) return dr(e).map((l) => [{ content: l[0], offset: l[1] }]);
	const { theme: o, colorMap: a } = t.setTheme(s);
	if (r === 'ansi') return Ld(o, e, n);
	const i = t.getLanguage(r);
	if (n.grammarState) {
		if (n.grammarState.lang !== i.name)
			throw new Re(
				`Grammar state language "${n.grammarState.lang}" does not match highlight language "${i.name}"`
			);
		if (!n.grammarState.themes.includes(o.name))
			throw new Re(
				`Grammar state themes "${n.grammarState.themes}" do not contain highlight theme "${o.name}"`
			);
	}
	return Od(e, i, o, a, n);
}
function Md(...t) {
	if (t.length === 2) return In(t[1]);
	const [e, n, r = {}] = t,
		{ lang: s = 'text', theme: o = e.getLoadedThemes()[0] } = r;
	if (us(s) || ds(o)) throw new Re('Plain language does not have grammar state');
	if (s === 'ansi') throw new Re('ANSI language does not have grammar state');
	const { theme: a, colorMap: i } = e.setTheme(o),
		l = e.getLanguage(s);
	return new gn(or(n, l, a, i, r).stateStack, l.name, a.name);
}
function Od(t, e, n, r, s) {
	const o = or(t, e, n, r, s),
		a = new gn(or(t, e, n, r, s).stateStack, e.name, n.name);
	return (hr(o.tokens, a), o.tokens);
}
function or(t, e, n, r, s) {
	const o = nr(n, s),
		{ tokenizeMaxLineLength: a = 0, tokenizeTimeLimit: i = 500 } = s,
		l = dr(t);
	let c = s.grammarState
			? (xd(s.grammarState, n.name) ?? Wr)
			: s.grammarContextCode != null
				? or(s.grammarContextCode, e, n, r, {
						...s,
						grammarState: void 0,
						grammarContextCode: void 0
					}).stateStack
				: Wr,
		u = [];
	const d = [];
	for (let f = 0, h = l.length; f < h; f++) {
		const [p, v] = l[f];
		if (p === '') {
			((u = []), d.push([]));
			continue;
		}
		if (a > 0 && p.length >= a) {
			((u = []), d.push([{ content: p, offset: v, color: '', fontStyle: 0 }]));
			continue;
		}
		let b, w, _;
		s.includeExplanation && ((b = e.tokenizeLine(p, c, i)), (w = b.tokens), (_ = 0));
		const k = e.tokenizeLine2(p, c, i),
			E = k.tokens.length / 2;
		for (let R = 0; R < E; R++) {
			const A = k.tokens[2 * R],
				te = R + 1 < E ? k.tokens[2 * R + 2] : p.length;
			if (A === te) continue;
			const fe = k.tokens[2 * R + 1],
				Le = Bt(r[fn.getForeground(fe)], o),
				it = fn.getFontStyle(fe),
				Te = { content: p.substring(A, te), offset: v + A, color: Le, fontStyle: it };
			if (s.includeExplanation) {
				const Me = [];
				if (s.includeExplanation !== 'scopeName')
					for (const Oe of n.settings) {
						let De;
						switch (typeof Oe.scope) {
							case 'string':
								De = Oe.scope.split(/,/).map((ct) => ct.trim());
								break;
							case 'object':
								De = Oe.scope;
								break;
							default:
								continue;
						}
						Me.push({ settings: Oe, selectors: De.map((ct) => ct.split(/ /)) });
					}
				Te.explanation = [];
				let lt = 0;
				for (; A + lt < te; ) {
					const Oe = w[_],
						De = p.substring(Oe.startIndex, Oe.endIndex);
					((lt += De.length),
						Te.explanation.push({
							content: De,
							scopes: s.includeExplanation === 'scopeName' ? Dd(Oe.scopes) : Gd(Me, Oe.scopes)
						}),
						(_ += 1));
				}
			}
			u.push(Te);
		}
		(d.push(u), (u = []), (c = k.ruleStack));
	}
	return { tokens: d, stateStack: c };
}
function Dd(t) {
	return t.map((e) => ({ scopeName: e }));
}
function Gd(t, e) {
	const n = [];
	for (let r = 0, s = e.length; r < s; r++) {
		const o = e[r];
		n[r] = { scopeName: o, themeMatches: Bd(t, o, e.slice(0, r)) };
	}
	return n;
}
function eo(t, e) {
	return t === e || (e.substring(0, t.length) === t && e[t.length] === '.');
}
function Fd(t, e, n) {
	if (!eo(t[t.length - 1], e)) return !1;
	let r = t.length - 2,
		s = n.length - 1;
	for (; r >= 0 && s >= 0; ) (eo(t[r], n[s]) && (r -= 1), (s -= 1));
	return r === -1;
}
function Bd(t, e, n) {
	const r = [];
	for (const { selectors: s, settings: o } of t)
		for (const a of s)
			if (Fd(a, e, n)) {
				r.push(o);
				break;
			}
	return r;
}
function va(t, e, n) {
	const r = Object.entries(n.themes)
			.filter((l) => l[1])
			.map((l) => ({ color: l[0], theme: l[1] })),
		s = r.map((l) => {
			const c = fs(t, e, { ...n, theme: l.theme }),
				u = In(c),
				d = typeof l.theme == 'string' ? l.theme : l.theme.name;
			return { tokens: c, state: u, theme: d };
		}),
		o = jd(...s.map((l) => l.tokens)),
		a = o[0].map((l, c) =>
			l.map((u, d) => {
				const f = { content: u.content, variants: {}, offset: u.offset };
				return (
					'includeExplanation' in n && n.includeExplanation && (f.explanation = u.explanation),
					o.forEach((h, p) => {
						const { content: v, explanation: b, offset: w, ..._ } = h[c][d];
						f.variants[r[p].color] = _;
					}),
					f
				);
			})
		),
		i = s[0].state
			? new gn(
					Object.fromEntries(s.map((l) => [l.theme, l.state?.getInternalStack(l.theme)])),
					s[0].state.lang
				)
			: void 0;
	return (i && hr(a, i), a);
}
function jd(...t) {
	const e = t.map(() => []),
		n = t.length;
	for (let r = 0; r < t[0].length; r++) {
		const s = t.map((l) => l[r]),
			o = e.map(() => []);
		e.forEach((l, c) => l.push(o[c]));
		const a = s.map(() => 0),
			i = s.map((l) => l[0]);
		for (; i.every((l) => l); ) {
			const l = Math.min(...i.map((c) => c.content.length));
			for (let c = 0; c < n; c++) {
				const u = i[c];
				u.content.length === l
					? (o[c].push(u), (a[c] += 1), (i[c] = s[c][a[c]]))
					: (o[c].push({ ...u, content: u.content.slice(0, l) }),
						(i[c] = { ...u, content: u.content.slice(l), offset: u.offset + l }));
			}
		}
	}
	return e;
}
function ar(t, e, n) {
	let r, s, o, a, i, l;
	if ('themes' in n) {
		const {
				defaultColor: c = 'light',
				cssVariablePrefix: u = '--shiki-',
				colorsRendering: d = 'css-vars'
			} = n,
			f = Object.entries(n.themes)
				.filter((w) => w[1])
				.map((w) => ({ color: w[0], theme: w[1] }))
				.sort((w, _) => (w.color === c ? -1 : _.color === c ? 1 : 0));
		if (f.length === 0) throw new Re('`themes` option must not be empty');
		const h = va(t, e, n);
		if (((l = In(h)), c && hs !== c && !f.find((w) => w.color === c)))
			throw new Re(`\`themes\` option must contain the defaultColor key \`${c}\``);
		const p = f.map((w) => t.getTheme(w.theme)),
			v = f.map((w) => w.color);
		((o = h.map((w) => w.map((_) => Cd(_, v, u, c, d)))), l && hr(o, l));
		const b = f.map((w) => nr(w.theme, n));
		((s = to(f, p, b, u, c, 'fg', d)),
			(r = to(f, p, b, u, c, 'bg', d)),
			(a = `shiki-themes ${p.map((w) => w.name).join(' ')}`),
			(i = c ? void 0 : [s, r].join(';')));
	} else if ('theme' in n) {
		const c = nr(n.theme, n);
		o = fs(t, e, n);
		const u = t.getTheme(n.theme);
		((r = Bt(u.bg, c)), (s = Bt(u.fg, c)), (a = u.name), (l = In(o)));
	} else throw new Re('Invalid options, either `theme` or `themes` must be provided');
	return { tokens: o, fg: s, bg: r, themeName: a, rootStyle: i, grammarState: l };
}
function to(t, e, n, r, s, o, a) {
	return t
		.map((i, l) => {
			const c = Bt(e[l][o], n[l]) || 'inherit',
				u = `${r + i.color}${o === 'bg' ? '-bg' : ''}:${c}`;
			if (l === 0 && s) {
				if (s === hs && t.length > 1) {
					const d = t.findIndex((v) => v.color === 'light'),
						f = t.findIndex((v) => v.color === 'dark');
					if (d === -1 || f === -1)
						throw new Re(
							'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes'
						);
					const h = Bt(e[d][o], n[d]) || 'inherit',
						p = Bt(e[f][o], n[f]) || 'inherit';
					return `light-dark(${h}, ${p});${u}`;
				}
				return c;
			}
			return a === 'css-vars' ? u : null;
		})
		.filter((i) => !!i)
		.join(';');
}
function ir(
	t,
	e,
	n,
	r = {
		meta: {},
		options: n,
		codeToHast: (s, o) => ir(t, s, o),
		codeToTokens: (s, o) => ar(t, s, o)
	}
) {
	let s = e;
	for (const p of sr(n)) s = p.preprocess?.call(r, s, n) || s;
	let { tokens: o, fg: a, bg: i, themeName: l, rootStyle: c, grammarState: u } = ar(t, s, n);
	const { mergeWhitespaces: d = !0, mergeSameStyleTokens: f = !1 } = n;
	(d === !0 ? (o = zd(o)) : d === 'never' && (o = Wd(o)), f && (o = Vd(o)));
	const h = {
		...r,
		get source() {
			return s;
		}
	};
	for (const p of sr(n)) o = p.tokens?.call(h, o) || o;
	return Ud(o, { ...n, fg: a, bg: i, themeName: l, rootStyle: c }, h, u);
}
function Ud(t, e, n, r = In(t)) {
	const s = sr(e),
		o = [],
		a = { type: 'root', children: [] },
		{ structure: i = 'classic', tabindex: l = '0' } = e;
	let c = {
			type: 'element',
			tagName: 'pre',
			properties: {
				class: `shiki ${e.themeName || ''}`,
				style: e.rootStyle || `background-color:${e.bg};color:${e.fg}`,
				...(l !== !1 && l != null ? { tabindex: l.toString() } : {}),
				...Object.fromEntries(
					Array.from(Object.entries(e.meta || {})).filter(([p]) => !p.startsWith('_'))
				)
			},
			children: []
		},
		u = { type: 'element', tagName: 'code', properties: {}, children: o };
	const d = [],
		f = {
			...n,
			structure: i,
			addClassToHast: pa,
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
				return a;
			},
			get pre() {
				return c;
			},
			get code() {
				return u;
			},
			get lines() {
				return d;
			}
		};
	if (
		(t.forEach((p, v) => {
			v &&
				(i === 'inline'
					? a.children.push({ type: 'element', tagName: 'br', properties: {}, children: [] })
					: i === 'classic' &&
						o.push({
							type: 'text',
							value: `
`
						}));
			let b = { type: 'element', tagName: 'span', properties: { class: 'line' }, children: [] },
				w = 0;
			for (const _ of p) {
				let k = {
					type: 'element',
					tagName: 'span',
					properties: { ..._.htmlAttrs },
					children: [{ type: 'text', value: _.content }]
				};
				const E = Xr(_.htmlStyle || rr(_));
				E && (k.properties.style = E);
				for (const R of s) k = R?.span?.call(f, k, v + 1, w, b, _) || k;
				(i === 'inline' ? a.children.push(k) : i === 'classic' && b.children.push(k),
					(w += _.content.length));
			}
			if (i === 'classic') {
				for (const _ of s) b = _?.line?.call(f, b, v + 1) || b;
				(d.push(b), o.push(b));
			}
		}),
		i === 'classic')
	) {
		for (const p of s) u = p?.code?.call(f, u) || u;
		c.children.push(u);
		for (const p of s) c = p?.pre?.call(f, c) || c;
		a.children.push(c);
	}
	let h = a;
	for (const p of s) h = p?.root?.call(f, h) || h;
	return (r && hr(h, r), h);
}
function zd(t) {
	return t.map((e) => {
		const n = [];
		let r = '',
			s = 0;
		return (
			e.forEach((o, a) => {
				const l = !(o.fontStyle && (o.fontStyle & Ue.Underline || o.fontStyle & Ue.Strikethrough));
				l && o.content.match(/^\s+$/) && e[a + 1]
					? (s || (s = o.offset), (r += o.content))
					: r
						? (l
								? n.push({ ...o, offset: s, content: r + o.content })
								: n.push({ content: r, offset: s }, o),
							(s = 0),
							(r = ''))
						: n.push(o);
			}),
			n
		);
	});
}
function Wd(t) {
	return t.map((e) =>
		e.flatMap((n) => {
			if (n.content.match(/^\s+$/)) return n;
			const r = n.content.match(/^(\s*)(.*?)(\s*)$/);
			if (!r) return n;
			const [, s, o, a] = r;
			if (!s && !a) return n;
			const i = [{ ...n, offset: n.offset + s.length, content: o }];
			return (
				s && i.unshift({ content: s, offset: n.offset }),
				a && i.push({ content: a, offset: n.offset + s.length + o.length }),
				i
			);
		})
	);
}
function Vd(t) {
	return t.map((e) => {
		const n = [];
		for (const r of e) {
			if (n.length === 0) {
				n.push({ ...r });
				continue;
			}
			const s = n[n.length - 1],
				o = Xr(s.htmlStyle || rr(s)),
				a = Xr(r.htmlStyle || rr(r)),
				i = s.fontStyle && (s.fontStyle & Ue.Underline || s.fontStyle & Ue.Strikethrough),
				l = r.fontStyle && (r.fontStyle & Ue.Underline || r.fontStyle & Ue.Strikethrough);
			!i && !l && o === a ? (s.content += r.content) : n.push({ ...r });
		}
		return n;
	});
}
const Hd = hd;
function qd(t, e, n) {
	const r = {
		meta: {},
		options: n,
		codeToHast: (o, a) => ir(t, o, a),
		codeToTokens: (o, a) => ar(t, o, a)
	};
	let s = Hd(ir(t, e, n, r));
	for (const o of sr(n)) s = o.postprocess?.call(r, s, n) || s;
	return s;
}
const no = { light: '#333333', dark: '#bbbbbb' },
	ro = { light: '#fffffe', dark: '#1e1e1e' },
	so = '__shiki_resolved';
function ps(t) {
	if (t?.[so]) return t;
	const e = { ...t };
	(e.tokenColors && !e.settings && ((e.settings = e.tokenColors), delete e.tokenColors),
		(e.type ||= 'dark'),
		(e.colorReplacements = { ...e.colorReplacements }),
		(e.settings ||= []));
	let { bg: n, fg: r } = e;
	if (!n || !r) {
		const i = e.settings ? e.settings.find((l) => !l.name && !l.scope) : void 0;
		(i?.settings?.foreground && (r = i.settings.foreground),
			i?.settings?.background && (n = i.settings.background),
			!r && e?.colors?.['editor.foreground'] && (r = e.colors['editor.foreground']),
			!n && e?.colors?.['editor.background'] && (n = e.colors['editor.background']),
			r || (r = e.type === 'light' ? no.light : no.dark),
			n || (n = e.type === 'light' ? ro.light : ro.dark),
			(e.fg = r),
			(e.bg = n));
	}
	(e.settings[0] && e.settings[0].settings && !e.settings[0].scope) ||
		e.settings.unshift({ settings: { foreground: e.fg, background: e.bg } });
	let s = 0;
	const o = new Map();
	function a(i) {
		if (o.has(i)) return o.get(i);
		s += 1;
		const l = `#${s.toString(16).padStart(8, '0').toLowerCase()}`;
		return e.colorReplacements?.[`#${l}`] ? a(i) : (o.set(i, l), l);
	}
	e.settings = e.settings.map((i) => {
		const l = i.settings?.foreground && !i.settings.foreground.startsWith('#'),
			c = i.settings?.background && !i.settings.background.startsWith('#');
		if (!l && !c) return i;
		const u = { ...i, settings: { ...i.settings } };
		if (l) {
			const d = a(i.settings.foreground);
			((e.colorReplacements[d] = i.settings.foreground), (u.settings.foreground = d));
		}
		if (c) {
			const d = a(i.settings.background);
			((e.colorReplacements[d] = i.settings.background), (u.settings.background = d));
		}
		return u;
	});
	for (const i of Object.keys(e.colors || {}))
		if (
			(i === 'editor.foreground' || i === 'editor.background' || i.startsWith('terminal.ansi')) &&
			!e.colors[i]?.startsWith('#')
		) {
			const l = a(e.colors[i]);
			((e.colorReplacements[l] = e.colors[i]), (e.colors[i] = l));
		}
	return (Object.defineProperty(e, so, { enumerable: !1, writable: !1, value: !0 }), e);
}
async function _a(t) {
	return Array.from(
		new Set(
			(
				await Promise.all(
					t
						.filter((e) => !md(e))
						.map(async (e) => await fa(e).then((n) => (Array.isArray(n) ? n : [n])))
				)
			).flat()
		)
	);
}
async function ya(t) {
	return (await Promise.all(t.map(async (n) => (vd(n) ? null : ps(await fa(n)))))).filter(
		(n) => !!n
	);
}
let Kd = 3;
function Xd(t, e = 3) {
	e > Kd || console.trace(`[SHIKI DEPRECATE]: ${t}`);
}
class un extends Error {
	constructor(e) {
		(super(e), (this.name = 'ShikiError'));
	}
}
class Zd extends Jc {
	constructor(e, n, r, s = {}) {
		(super(e),
			(this._resolver = e),
			(this._themes = n),
			(this._langs = r),
			(this._alias = s),
			this._themes.map((o) => this.loadTheme(o)),
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
		const n = ps(e);
		return (n.name && (this._resolvedThemes.set(n.name, n), (this._loadedThemesCache = null)), n);
	}
	getLoadedThemes() {
		return (
			this._loadedThemesCache || (this._loadedThemesCache = [...this._resolvedThemes.keys()]),
			this._loadedThemesCache
		);
	}
	setTheme(e) {
		let n = this._textmateThemeCache.get(e);
		(n || ((n = Qn.createFromRawTheme(e)), this._textmateThemeCache.set(e, n)),
			this._syncRegistry.setTheme(n));
	}
	getGrammar(e) {
		if (this._alias[e]) {
			const n = new Set([e]);
			for (; this._alias[e]; ) {
				if (((e = this._alias[e]), n.has(e)))
					throw new un(`Circular alias \`${Array.from(n).join(' -> ')} -> ${e}\``);
				n.add(e);
			}
		}
		return this._resolvedGrammars.get(e);
	}
	loadLanguage(e) {
		if (this.getGrammar(e.name)) return;
		const n = new Set(
			[...this._langMap.values()].filter((o) => o.embeddedLangsLazy?.includes(e.name))
		);
		this._resolver.addLanguage(e);
		const r = {
			balancedBracketSelectors: e.balancedBracketSelectors || ['*'],
			unbalancedBracketSelectors: e.unbalancedBracketSelectors || []
		};
		this._syncRegistry._rawGrammars.set(e.scopeName, e);
		const s = this.loadGrammarWithConfiguration(e.scopeName, 1, r);
		if (
			((s.name = e.name),
			this._resolvedGrammars.set(e.name, s),
			e.aliases &&
				e.aliases.forEach((o) => {
					this._alias[o] = e.name;
				}),
			(this._loadedLanguagesCache = null),
			n.size)
		)
			for (const o of n)
				(this._resolvedGrammars.delete(o.name),
					(this._loadedLanguagesCache = null),
					this._syncRegistry?._injectionGrammars?.delete(o.scopeName),
					this._syncRegistry?._grammars?.delete(o.scopeName),
					this.loadLanguage(this._langMap.get(o.name)));
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
		for (const s of e) this.resolveEmbeddedLanguages(s);
		const n = Array.from(this._langGraph.entries()),
			r = n.filter(([s, o]) => !o);
		if (r.length) {
			const s = n
				.filter(([o, a]) => a && a.embeddedLangs?.some((i) => r.map(([l]) => l).includes(i)))
				.filter((o) => !r.includes(o));
			throw new un(
				`Missing languages ${r.map(([o]) => `\`${o}\``).join(', ')}, required by ${s.map(([o]) => `\`${o}\``).join(', ')}`
			);
		}
		for (const [s, o] of n) this._resolver.addLanguage(o);
		for (const [s, o] of n) this.loadLanguage(o);
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
class Qd {
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
		for (let s = 1; s <= n.length; s++) {
			const o = n.slice(0, s).join('.');
			r = [...r, ...(this._injections.get(o) || [])];
		}
		return r;
	}
}
let wn = 0;
function Jd(t) {
	((wn += 1),
		t.warnings !== !1 &&
			wn >= 10 &&
			wn % 10 === 0 &&
			console.warn(
				`[Shiki] ${wn} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`
			));
	let e = !1;
	if (!t.engine) throw new un('`engine` option is required for synchronous mode');
	const n = (t.langs || []).flat(1),
		r = (t.themes || []).flat(1).map(ps),
		s = new Qd(t.engine, n),
		o = new Zd(s, r, n, t.langAlias);
	let a;
	function i(_) {
		b();
		const k = o.getGrammar(typeof _ == 'string' ? _ : _.name);
		if (!k) throw new un(`Language \`${_}\` not found, you may need to load it first`);
		return k;
	}
	function l(_) {
		if (_ === 'none') return { bg: '', fg: '', name: 'none', settings: [], type: 'dark' };
		b();
		const k = o.getTheme(_);
		if (!k) throw new un(`Theme \`${_}\` not found, you may need to load it first`);
		return k;
	}
	function c(_) {
		b();
		const k = l(_);
		a !== _ && (o.setTheme(k), (a = _));
		const E = o.getColorMap();
		return { theme: k, colorMap: E };
	}
	function u() {
		return (b(), o.getLoadedThemes());
	}
	function d() {
		return (b(), o.getLoadedLanguages());
	}
	function f(..._) {
		(b(), o.loadLanguages(_.flat(1)));
	}
	async function h(..._) {
		return f(await _a(_));
	}
	function p(..._) {
		b();
		for (const k of _.flat(1)) o.loadTheme(k);
	}
	async function v(..._) {
		return (b(), p(await ya(_)));
	}
	function b() {
		if (e) throw new un('Shiki instance has been disposed');
	}
	function w() {
		e || ((e = !0), o.dispose(), (wn -= 1));
	}
	return {
		setTheme: c,
		getTheme: l,
		getLanguage: i,
		getLoadedThemes: u,
		getLoadedLanguages: d,
		loadLanguage: h,
		loadLanguageSync: f,
		loadTheme: v,
		loadThemeSync: p,
		dispose: w,
		[Symbol.dispose]: w
	};
}
async function Yd(t) {
	t.engine ||
		Xd(
			'`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.'
		);
	const [e, n, r] = await Promise.all([ya(t.themes || []), _a(t.langs || []), t.engine]);
	return Jd({ ...t, themes: e, langs: n, engine: r });
}
async function eh(t) {
	const e = await Yd(t);
	return {
		getLastGrammarState: (...n) => Md(e, ...n),
		codeToTokensBase: (n, r) => fs(e, n, r),
		codeToTokensWithThemes: (n, r) => va(e, n, r),
		codeToTokens: (n, r) => ar(e, n, r),
		codeToHast: (n, r) => ir(e, n, r),
		codeToHtml: (n, r) => qd(e, n, r),
		getBundledLanguages: () => ({}),
		getBundledThemes: () => ({}),
		...e,
		getInternalContext: () => e
	};
}
function mn(t) {
	if ([...t].length !== 1) throw new Error(`Expected "${t}" to be a single code point`);
	return t.codePointAt(0);
}
function th(t, e, n) {
	return (t.has(e) || t.set(e, n), t.get(e));
}
const gs = new Set([
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
	$e = String.raw;
function vn(t, e) {
	if (t == null) throw new Error(e ?? 'Value expected');
	return t;
}
const ba = $e`\[\^?`,
	wa = `c.? | C(?:-.?)?|${$e`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${$e`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${$e`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${$e`o\{[^\}]*\}?`}|${$e`\d{1,3}`}`,
	ms = /[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/,
	zn = new RegExp(
		$e`
  \\ (?:
    ${wa}
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
  | (?:${ms.source})+
  | ${ba}
  | .
`.replace(/\s+/g, ''),
		'gsu'
	),
	Rr = new RegExp(
		$e`
  \\ (?:
    ${wa}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${ba}
  | &&
  | .
`.replace(/\s+/g, ''),
		'gsu'
	);
function nh(t, e = {}) {
	const n = { flags: '', ...e, rules: { captureGroup: !1, singleline: !1, ...e.rules } };
	if (typeof t != 'string') throw new Error('String expected as pattern');
	const r = wh(n.flags),
		s = [r.extended],
		o = {
			captureGroup: n.rules.captureGroup,
			getCurrentModX() {
				return s.at(-1);
			},
			numOpenGroups: 0,
			popModX() {
				s.pop();
			},
			pushModX(d) {
				s.push(d);
			},
			replaceCurrentModX(d) {
				s[s.length - 1] = d;
			},
			singleline: n.rules.singleline
		};
	let a = [],
		i;
	for (zn.lastIndex = 0; (i = zn.exec(t)); ) {
		const d = rh(o, t, i[0], zn.lastIndex);
		(d.tokens ? a.push(...d.tokens) : d.token && a.push(d.token),
			d.lastIndex !== void 0 && (zn.lastIndex = d.lastIndex));
	}
	const l = [];
	let c = 0;
	(a
		.filter((d) => d.type === 'GroupOpen')
		.forEach((d) => {
			d.kind === 'capturing' ? (d.number = ++c) : d.raw === '(' && l.push(d);
		}),
		c ||
			l.forEach((d, f) => {
				((d.kind = 'capturing'), (d.number = f + 1));
			}));
	const u = c || l.length;
	return { tokens: a.map((d) => (d.type === 'EscapedNumber' ? kh(d, u) : d)).flat(), flags: r };
}
function rh(t, e, n, r) {
	const [s, o] = n;
	if (n === '[' || n === '[^') {
		const a = sh(e, n, r);
		return { tokens: a.tokens, lastIndex: a.lastIndex };
	}
	if (s === '\\') {
		if ('AbBGyYzZ'.includes(o)) return { token: oo(n, n) };
		if (/^\\g[<']/.test(n)) {
			if (!/^\\g(?:<[^>]+>|'[^']+')$/.test(n)) throw new Error(`Invalid group name "${n}"`);
			return { token: ph(n) };
		}
		if (/^\\k[<']/.test(n)) {
			if (!/^\\k(?:<[^>]+>|'[^']+')$/.test(n)) throw new Error(`Invalid group name "${n}"`);
			return { token: ka(n) };
		}
		if (o === 'K') return { token: xa('keep', n) };
		if (o === 'N' || o === 'R') return { token: Zt('newline', n, { negate: o === 'N' }) };
		if (o === 'O') return { token: Zt('any', n) };
		if (o === 'X') return { token: Zt('text_segment', n) };
		const a = Ca(n, { inCharClass: !1 });
		return Array.isArray(a) ? { tokens: a } : { token: a };
	}
	if (s === '(') {
		if (o === '*') return { token: _h(n) };
		if (n === '(?{') throw new Error(`Unsupported callout "${n}"`);
		if (n.startsWith('(?#')) {
			if (e[r] !== ')') throw new Error('Unclosed comment group "(?#"');
			return { lastIndex: r + 1 };
		}
		if (/^\(\?[-imx]+[:)]$/.test(n)) return { token: vh(n, t) };
		if (
			(t.pushModX(t.getCurrentModX()),
			t.numOpenGroups++,
			(n === '(' && !t.captureGroup) || n === '(?:')
		)
			return { token: ln('group', n) };
		if (n === '(?>') return { token: ln('atomic', n) };
		if (n === '(?=' || n === '(?!' || n === '(?<=' || n === '(?<!')
			return {
				token: ln(n[2] === '<' ? 'lookbehind' : 'lookahead', n, { negate: n.endsWith('!') })
			};
		if (
			(n === '(' && t.captureGroup) ||
			(n.startsWith('(?<') && n.endsWith('>')) ||
			(n.startsWith("(?'") && n.endsWith("'"))
		)
			return { token: ln('capturing', n, { ...(n !== '(' && { name: n.slice(3, -1) }) }) };
		if (n.startsWith('(?~')) {
			if (n === '(?~|') throw new Error(`Unsupported absence function kind "${n}"`);
			return { token: ln('absence_repeater', n) };
		}
		throw n === '(?('
			? new Error(`Unsupported conditional "${n}"`)
			: new Error(`Invalid or unsupported group option "${n}"`);
	}
	if (n === ')') {
		if ((t.popModX(), t.numOpenGroups--, t.numOpenGroups < 0)) throw new Error('Unmatched ")"');
		return { token: dh(n) };
	}
	if (t.getCurrentModX()) {
		if (n === '#') {
			const a = e.indexOf(
				`
`,
				r
			);
			return { lastIndex: a === -1 ? e.length : a };
		}
		if (/^\s$/.test(n)) {
			const a = /\s+/y;
			return ((a.lastIndex = r), { lastIndex: a.exec(e) ? a.lastIndex : r });
		}
	}
	if (n === '.') return { token: Zt('dot', n) };
	if (n === '^' || n === '$') {
		const a = t.singleline ? { '^': $e`\A`, $: $e`\Z` }[n] : n;
		return { token: oo(a, n) };
	}
	return n === '|' ? { token: ah(n) } : ms.test(n) ? { tokens: xh(n) } : { token: Nt(mn(n), n) };
}
function sh(t, e, n) {
	const r = [ao(e[1] === '^', e)];
	let s = 1,
		o;
	for (Rr.lastIndex = n; (o = Rr.exec(t)); ) {
		const a = o[0];
		if (a[0] === '[' && a[1] !== ':') (s++, r.push(ao(a[1] === '^', a)));
		else if (a === ']') {
			if (r.at(-1).type === 'CharacterClassOpen') r.push(Nt(93, a));
			else if ((s--, r.push(ih(a)), !s)) break;
		} else {
			const i = oh(a);
			Array.isArray(i) ? r.push(...i) : r.push(i);
		}
	}
	return { tokens: r, lastIndex: Rr.lastIndex || t.length };
}
function oh(t) {
	if (t[0] === '\\') return Ca(t, { inCharClass: !0 });
	if (t[0] === '[') {
		const e = /\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(t);
		if (!e || !gs.has(e.groups.name)) throw new Error(`Invalid POSIX class "${t}"`);
		return Zt('posix', t, { value: e.groups.name, negate: !!e.groups.negate });
	}
	return t === '-' ? lh(t) : t === '&&' ? ch(t) : Nt(mn(t), t);
}
function Ca(t, { inCharClass: e }) {
	const n = t[1];
	if (n === 'c' || n === 'C') return mh(t);
	if ('dDhHsSwW'.includes(n)) return yh(t);
	if (t.startsWith($e`\o{`))
		throw new Error(`Incomplete, invalid, or unsupported octal code point "${t}"`);
	if (/^\\[pP]\{/.test(t)) {
		if (t.length === 3) throw new Error(`Incomplete or invalid Unicode property "${t}"`);
		return bh(t);
	}
	if (new RegExp('^\\\\x[89A-Fa-f]\\p{AHex}', 'u').test(t))
		try {
			const r = t
					.split(/\\x/)
					.slice(1)
					.map((a) => parseInt(a, 16)),
				s = new TextDecoder('utf-8', { ignoreBOM: !0, fatal: !0 }).decode(new Uint8Array(r)),
				o = new TextEncoder();
			return [...s].map((a) => {
				const i = [...o.encode(a)].map((l) => `\\x${l.toString(16)}`).join('');
				return Nt(mn(a), i);
			});
		} catch {
			throw new Error(`Multibyte code "${t}" incomplete or invalid in Oniguruma`);
		}
	if (n === 'u' || n === 'x') return Nt(Ch(t), t);
	if (io.has(n)) return Nt(io.get(n), t);
	if (/\d/.test(n)) return uh(e, t);
	if (t === '\\') throw new Error($e`Incomplete escape "\"`);
	if (n === 'M') throw new Error(`Unsupported meta "${t}"`);
	if ([...t].length === 2) return Nt(t.codePointAt(1), t);
	throw new Error(`Unexpected escape "${t}"`);
}
function ah(t) {
	return { type: 'Alternator', raw: t };
}
function oo(t, e) {
	return { type: 'Assertion', kind: t, raw: e };
}
function ka(t) {
	return { type: 'Backreference', raw: t };
}
function Nt(t, e) {
	return { type: 'Character', value: t, raw: e };
}
function ih(t) {
	return { type: 'CharacterClassClose', raw: t };
}
function lh(t) {
	return { type: 'CharacterClassHyphen', raw: t };
}
function ch(t) {
	return { type: 'CharacterClassIntersector', raw: t };
}
function ao(t, e) {
	return { type: 'CharacterClassOpen', negate: t, raw: e };
}
function Zt(t, e, n = {}) {
	return { type: 'CharacterSet', kind: t, ...n, raw: e };
}
function xa(t, e, n = {}) {
	return t === 'keep'
		? { type: 'Directive', kind: t, raw: e }
		: { type: 'Directive', kind: t, flags: vn(n.flags), raw: e };
}
function uh(t, e) {
	return { type: 'EscapedNumber', inCharClass: t, raw: e };
}
function dh(t) {
	return { type: 'GroupClose', raw: t };
}
function ln(t, e, n = {}) {
	return { type: 'GroupOpen', kind: t, ...n, raw: e };
}
function hh(t, e, n, r) {
	return { type: 'NamedCallout', kind: t, tag: e, arguments: n, raw: r };
}
function fh(t, e, n, r) {
	return { type: 'Quantifier', kind: t, min: e, max: n, raw: r };
}
function ph(t) {
	return { type: 'Subroutine', raw: t };
}
const gh = new Set(['COUNT', 'CMP', 'ERROR', 'FAIL', 'MAX', 'MISMATCH', 'SKIP', 'TOTAL_COUNT']),
	io = new Map([
		['a', 7],
		['b', 8],
		['e', 27],
		['f', 12],
		['n', 10],
		['r', 13],
		['t', 9],
		['v', 11]
	]);
function mh(t) {
	const e = t[1] === 'c' ? t[2] : t[3];
	if (!e || !/[A-Za-z]/.test(e)) throw new Error(`Unsupported control character "${t}"`);
	return Nt(mn(e.toUpperCase()) - 64, t);
}
function vh(t, e) {
	let { on: n, off: r } = /^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(t).groups;
	r ??= '';
	const s = (e.getCurrentModX() || n.includes('x')) && !r.includes('x'),
		o = co(n),
		a = co(r),
		i = {};
	if ((o && (i.enable = o), a && (i.disable = a), t.endsWith(')')))
		return (e.replaceCurrentModX(s), xa('flags', t, { flags: i }));
	if (t.endsWith(':'))
		return (e.pushModX(s), e.numOpenGroups++, ln('group', t, { ...((o || a) && { flags: i }) }));
	throw new Error(`Unexpected flag modifier "${t}"`);
}
function _h(t) {
	const e =
		/\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(t);
	if (!e) throw new Error(`Incomplete or invalid named callout "${t}"`);
	const { name: n, tag: r, args: s } = e.groups;
	if (!n) throw new Error(`Invalid named callout "${t}"`);
	if (r === '') throw new Error(`Named callout tag with empty value not allowed "${t}"`);
	const o = s
			? s
					.split(',')
					.filter((u) => u !== '')
					.map((u) => (/^[+-]?\d+$/.test(u) ? +u : u))
			: [],
		[a, i, l] = o,
		c = gh.has(n) ? n.toLowerCase() : 'custom';
	switch (c) {
		case 'fail':
		case 'mismatch':
		case 'skip':
			if (o.length > 0) throw new Error(`Named callout arguments not allowed "${o}"`);
			break;
		case 'error':
			if (o.length > 1) throw new Error(`Named callout allows only one argument "${o}"`);
			if (typeof a == 'string') throw new Error(`Named callout argument must be a number "${a}"`);
			break;
		case 'max':
			if (!o.length || o.length > 2)
				throw new Error(`Named callout must have one or two arguments "${o}"`);
			if (typeof a == 'string' && !/^[A-Za-z_]\w*$/.test(a))
				throw new Error(`Named callout argument one must be a tag or number "${a}"`);
			if (o.length === 2 && (typeof i == 'number' || !/^[<>X]$/.test(i)))
				throw new Error(`Named callout optional argument two must be '<', '>', or 'X' "${i}"`);
			break;
		case 'count':
		case 'total_count':
			if (o.length > 1) throw new Error(`Named callout allows only one argument "${o}"`);
			if (o.length === 1 && (typeof a == 'number' || !/^[<>X]$/.test(a)))
				throw new Error(`Named callout optional argument must be '<', '>', or 'X' "${a}"`);
			break;
		case 'cmp':
			if (o.length !== 3) throw new Error(`Named callout must have three arguments "${o}"`);
			if (typeof a == 'string' && !/^[A-Za-z_]\w*$/.test(a))
				throw new Error(`Named callout argument one must be a tag or number "${a}"`);
			if (typeof i == 'number' || !/^(?:[<>!=]=|[<>])$/.test(i))
				throw new Error(
					`Named callout argument two must be '==', '!=', '>', '<', '>=', or '<=' "${i}"`
				);
			if (typeof l == 'string' && !/^[A-Za-z_]\w*$/.test(l))
				throw new Error(`Named callout argument three must be a tag or number "${l}"`);
			break;
		case 'custom':
			throw new Error(`Undefined callout name "${n}"`);
		default:
			throw new Error(`Unexpected named callout kind "${c}"`);
	}
	return hh(c, r ?? null, s?.split(',') ?? null, t);
}
function lo(t) {
	let e = null,
		n,
		r;
	if (t[0] === '{') {
		const { minStr: s, maxStr: o } = /^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(t).groups,
			a = 1e5;
		if (+s > a || (o && +o > a)) throw new Error('Quantifier value unsupported in Oniguruma');
		if (
			((n = +s),
			(r = o === void 0 ? +s : o === '' ? 1 / 0 : +o),
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
	return fh(e, n, r, t);
}
function yh(t) {
	const e = t[1].toLowerCase();
	return Zt({ d: 'digit', h: 'hex', s: 'space', w: 'word' }[e], t, { negate: t[1] !== e });
}
function bh(t) {
	const { p: e, neg: n, value: r } = /^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(t).groups;
	return Zt('property', t, { value: r, negate: (e === 'P' && !n) || (e === 'p' && !!n) });
}
function co(t) {
	const e = {};
	return (
		t.includes('i') && (e.ignoreCase = !0),
		t.includes('m') && (e.dotAll = !0),
		t.includes('x') && (e.extended = !0),
		Object.keys(e).length ? e : null
	);
}
function wh(t) {
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
			if (!/^y{[gw]}/.test(t.slice(n))) throw new Error('Invalid or unspecified flag "y" mode');
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
function Ch(t) {
	if (
		new RegExp('^(?:\\\\u(?!\\p{AHex}{4})|\\\\x(?!\\p{AHex}{1,2}|\\{\\p{AHex}{1,8}\\}))', 'u').test(
			t
		)
	)
		throw new Error(`Incomplete or invalid escape "${t}"`);
	const e =
		t[2] === '{'
			? new RegExp('^\\\\x\\{\\s*(?<hex>\\p{AHex}+)', 'u').exec(t).groups.hex
			: t.slice(2);
	return parseInt(e, 16);
}
function kh(t, e) {
	const { raw: n, inCharClass: r } = t,
		s = n.slice(1);
	if (!r && ((s !== '0' && s.length === 1) || (s[0] !== '0' && +s <= e))) return [ka(n)];
	const o = [],
		a = s.match(/^[0-7]+|\d/g);
	for (let i = 0; i < a.length; i++) {
		const l = a[i];
		let c;
		if (i === 0 && l !== '8' && l !== '9') {
			if (((c = parseInt(l, 8)), c > 127))
				throw new Error($e`Octal encoded byte above 177 unsupported "${n}"`);
		} else c = mn(l);
		o.push(Nt(c, (i === 0 ? '\\' : '') + l));
	}
	return o;
}
function xh(t) {
	const e = [],
		n = new RegExp(ms, 'gy');
	let r;
	for (; (r = n.exec(t)); ) {
		const s = r[0];
		if (s[0] === '{') {
			const o = /^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(s);
			if (o) {
				const { min: a, max: i } = o.groups;
				if (+a > +i && s.endsWith('?')) {
					(n.lastIndex--, e.push(lo(s.slice(0, -1))));
					continue;
				}
			}
		}
		e.push(lo(s));
	}
	return e;
}
function Sa(t, e) {
	if (!Array.isArray(t.body)) throw new Error('Expected node with body array');
	if (t.body.length !== 1) return !1;
	const n = t.body[0];
	return !e || Object.keys(e).every((r) => e[r] === n[r]);
}
function Sh(t) {
	return Eh.has(t.type);
}
const Eh = new Set([
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
function Ea(t, e = {}) {
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
		r = nh(t, {
			flags: n.flags,
			rules: { captureGroup: n.rules.captureGroup, singleline: n.rules.singleline }
		}),
		s = (f, h) => {
			const p = r.tokens[o.nextIndex];
			switch (((o.parent = f), o.nextIndex++, p.type)) {
				case 'Alternator':
					return Qt();
				case 'Assertion':
					return Ah(p);
				case 'Backreference':
					return Ph(p, o);
				case 'Character':
					return fr(p.value, { useLastValid: !!h.isCheckingRangeEnd });
				case 'CharacterClassHyphen':
					return Ih(p, o, h);
				case 'CharacterClassOpen':
					return Rh(p, o, h);
				case 'CharacterSet':
					return $h(p, o);
				case 'Directive':
					return Dh(p.kind, { flags: p.flags });
				case 'GroupOpen':
					return Nh(p, o, h);
				case 'NamedCallout':
					return Fh(p.kind, p.tag, p.arguments);
				case 'Quantifier':
					return Lh(p, o);
				case 'Subroutine':
					return Th(p, o);
				default:
					throw new Error(`Unexpected token type "${p.type}"`);
			}
		},
		o = {
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
			walk: s
		},
		a = jh(Gh(r.flags));
	let i = a.body[0];
	for (; o.nextIndex < r.tokens.length; ) {
		const f = s(i, {});
		f.type === 'Alternative' ? (a.body.push(f), (i = f)) : i.body.push(f);
	}
	const { capturingGroups: l, hasNumberedRef: c, namedGroupsByName: u, subroutines: d } = o;
	if (c && u.size && !n.rules.captureGroup)
		throw new Error('Numbered backref/subroutine not allowed when using named capture');
	for (const { ref: f } of d)
		if (typeof f == 'number') {
			if (f > l.length) throw new Error("Subroutine uses a group number that's not defined");
			f && (l[f - 1].isSubroutined = !0);
		} else if (u.has(f)) {
			if (u.get(f).length > 1)
				throw new Error($e`Subroutine uses a duplicate group name "\g<${f}>"`);
			u.get(f)[0].isSubroutined = !0;
		} else throw new Error($e`Subroutine uses a group name that's not defined "\g<${f}>"`);
	return a;
}
function Ah({ kind: t }) {
	return Zr(
		vn(
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
		{ negate: t === $e`\B` || t === $e`\Y` }
	);
}
function Ph({ raw: t }, e) {
	const n = /^\\k[<']/.test(t),
		r = n ? t.slice(3, -1) : t.slice(1),
		s = (o, a = !1) => {
			const i = e.capturingGroups.length;
			let l = !1;
			if (o > i)
				if (e.skipBackrefValidation) l = !0;
				else throw new Error(`Not enough capturing groups defined to the left "${t}"`);
			return ((e.hasNumberedRef = !0), Qr(a ? i + 1 - o : o, { orphan: l }));
		};
	if (n) {
		const o = /^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(r);
		if (o) return s(+o.groups.num, !!o.groups.sign);
		if (/[-+]/.test(r)) throw new Error(`Invalid backref name "${t}"`);
		if (!e.namedGroupsByName.has(r)) throw new Error(`Group name not defined to the left "${t}"`);
		return Qr(r);
	}
	return s(+r);
}
function Ih(t, e, n) {
	const { tokens: r, walk: s } = e,
		o = e.parent,
		a = o.body.at(-1),
		i = r[e.nextIndex];
	if (
		!n.isCheckingRangeEnd &&
		a &&
		a.type !== 'CharacterClass' &&
		a.type !== 'CharacterClassRange' &&
		i &&
		i.type !== 'CharacterClassOpen' &&
		i.type !== 'CharacterClassClose' &&
		i.type !== 'CharacterClassIntersector'
	) {
		const l = s(o, { ...n, isCheckingRangeEnd: !0 });
		if (a.type === 'Character' && l.type === 'Character') return (o.body.pop(), Oh(a, l));
		throw new Error('Invalid character class range');
	}
	return fr(mn('-'));
}
function Rh({ negate: t }, e, n) {
	const { tokens: r, walk: s } = e,
		o = r[e.nextIndex],
		a = [Xn()];
	let i = fo(o);
	for (; i.type !== 'CharacterClassClose'; ) {
		if (i.type === 'CharacterClassIntersector') (a.push(Xn()), e.nextIndex++);
		else {
			const c = a.at(-1);
			c.body.push(s(c, n));
		}
		i = fo(r[e.nextIndex], o);
	}
	const l = Xn({ negate: t });
	return (
		a.length === 1
			? (l.body = a[0].body)
			: ((l.kind = 'intersection'), (l.body = a.map((c) => (c.body.length === 1 ? c.body[0] : c)))),
		e.nextIndex++,
		l
	);
}
function $h({ kind: t, negate: e, value: n }, r) {
	const {
		normalizeUnknownPropertyNames: s,
		skipPropertyNameValidation: o,
		unicodePropertyMap: a
	} = r;
	if (t === 'property') {
		const i = pr(n);
		if (gs.has(i) && !a?.has(i)) ((t = 'posix'), (n = i));
		else
			return cn(n, {
				negate: e,
				normalizeUnknownPropertyNames: s,
				skipPropertyNameValidation: o,
				unicodePropertyMap: a
			});
	}
	return t === 'posix' ? Bh(n, { negate: e }) : Jr(t, { negate: e });
}
function Nh(t, e, n) {
	const {
			tokens: r,
			capturingGroups: s,
			namedGroupsByName: o,
			skipLookbehindValidation: a,
			walk: i
		} = e,
		l = Uh(t),
		c = l.type === 'AbsenceFunction',
		u = ho(l),
		d = u && l.negate;
	if (
		(l.type === 'CapturingGroup' && (s.push(l), l.name && th(o, l.name, []).push(l)),
		c && n.isInAbsenceFunction)
	)
		throw new Error('Nested absence function not supported by Oniguruma');
	let f = po(r[e.nextIndex]);
	for (; f.type !== 'GroupClose'; ) {
		if (f.type === 'Alternator') (l.body.push(Qt()), e.nextIndex++);
		else {
			const h = l.body.at(-1),
				p = i(h, {
					...n,
					isInAbsenceFunction: n.isInAbsenceFunction || c,
					isInLookbehind: n.isInLookbehind || u,
					isInNegLookbehind: n.isInNegLookbehind || d
				});
			if ((h.body.push(p), (u || n.isInLookbehind) && !a)) {
				const v = 'Lookbehind includes a pattern not allowed by Oniguruma';
				if (d || n.isInNegLookbehind) {
					if (uo(p) || p.type === 'CapturingGroup') throw new Error(v);
				} else if (uo(p) || (ho(p) && p.negate)) throw new Error(v);
			}
		}
		f = po(r[e.nextIndex]);
	}
	return (e.nextIndex++, l);
}
function Lh({ kind: t, min: e, max: n }, r) {
	const s = r.parent,
		o = s.body.at(-1);
	if (!o || !Sh(o)) throw new Error('Quantifier requires a repeatable token');
	const a = Pa(t, e, n, o);
	return (s.body.pop(), a);
}
function Th({ raw: t }, e) {
	const { capturingGroups: n, subroutines: r } = e;
	let s = t.slice(3, -1);
	const o = /^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(s);
	if (o) {
		const i = +o.groups.num,
			l = n.length;
		if (
			((e.hasNumberedRef = !0), (s = { '': i, '+': l + i, '-': l + 1 - i }[o.groups.sign]), s < 1)
		)
			throw new Error('Invalid subroutine number');
	} else s === '0' && (s = 0);
	const a = Ia(s);
	return (r.push(a), a);
}
function Mh(t, e) {
	return { type: 'AbsenceFunction', kind: t, body: Ln(e?.body) };
}
function Qt(t) {
	return { type: 'Alternative', body: Ra(t?.body) };
}
function Zr(t, e) {
	const n = { type: 'Assertion', kind: t };
	return ((t === 'word_boundary' || t === 'text_segment_boundary') && (n.negate = !!e?.negate), n);
}
function Qr(t, e) {
	const n = !!e?.orphan;
	return { type: 'Backreference', ref: t, ...(n && { orphan: n }) };
}
function Aa(t, e) {
	const n = { name: void 0, isSubroutined: !1, ...e };
	if (n.name !== void 0 && !zh(n.name))
		throw new Error(`Group name "${n.name}" invalid in Oniguruma`);
	return {
		type: 'CapturingGroup',
		number: t,
		...(n.name && { name: n.name }),
		...(n.isSubroutined && { isSubroutined: n.isSubroutined }),
		body: Ln(e?.body)
	};
}
function fr(t, e) {
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
function Xn(t) {
	const e = { kind: 'union', negate: !1, ...t };
	return { type: 'CharacterClass', kind: e.kind, negate: e.negate, body: Ra(t?.body) };
}
function Oh(t, e) {
	if (e.value < t.value) throw new Error('Character class range out of order');
	return { type: 'CharacterClassRange', min: t, max: e };
}
function Jr(t, e) {
	const n = !!e?.negate,
		r = { type: 'CharacterSet', kind: t };
	return (
		(t === 'digit' || t === 'hex' || t === 'newline' || t === 'space' || t === 'word') &&
			(r.negate = n),
		(t === 'text_segment' || (t === 'newline' && !n)) && (r.variableLength = !0),
		r
	);
}
function Dh(t, e = {}) {
	if (t === 'keep') return { type: 'Directive', kind: t };
	if (t === 'flags') return { type: 'Directive', kind: t, flags: vn(e.flags) };
	throw new Error(`Unexpected directive kind "${t}"`);
}
function Gh(t) {
	return { type: 'Flags', ...t };
}
function Ct(t) {
	const e = t?.atomic,
		n = t?.flags;
	if (e && n) throw new Error('Atomic group cannot have flags');
	return { type: 'Group', ...(e && { atomic: e }), ...(n && { flags: n }), body: Ln(t?.body) };
}
function Kt(t) {
	const e = { behind: !1, negate: !1, ...t };
	return {
		type: 'LookaroundAssertion',
		kind: e.behind ? 'lookbehind' : 'lookahead',
		negate: e.negate,
		body: Ln(t?.body)
	};
}
function Fh(t, e, n) {
	return { type: 'NamedCallout', kind: t, tag: e, arguments: n };
}
function Bh(t, e) {
	const n = !!e?.negate;
	if (!gs.has(t)) throw new Error(`Invalid POSIX class "${t}"`);
	return { type: 'CharacterSet', kind: 'posix', value: t, negate: n };
}
function Pa(t, e, n, r) {
	if (e > n) throw new Error('Invalid reversed quantifier range');
	return { type: 'Quantifier', kind: t, min: e, max: n, body: r };
}
function jh(t, e) {
	return { type: 'Regex', body: Ln(e?.body), flags: t };
}
function Ia(t) {
	return { type: 'Subroutine', ref: t };
}
function cn(t, e) {
	const n = {
		negate: !1,
		normalizeUnknownPropertyNames: !1,
		skipPropertyNameValidation: !1,
		unicodePropertyMap: null,
		...e
	};
	let r = n.unicodePropertyMap?.get(pr(t));
	if (!r) {
		if (n.normalizeUnknownPropertyNames) r = Wh(t);
		else if (n.unicodePropertyMap && !n.skipPropertyNameValidation)
			throw new Error($e`Invalid Unicode property "\p{${t}}"`);
	}
	return { type: 'CharacterSet', kind: 'property', value: r ?? t, negate: n.negate };
}
function Uh({ flags: t, kind: e, name: n, negate: r, number: s }) {
	switch (e) {
		case 'absence_repeater':
			return Mh('repeater');
		case 'atomic':
			return Ct({ atomic: !0 });
		case 'capturing':
			return Aa(s, { name: n });
		case 'group':
			return Ct({ flags: t });
		case 'lookahead':
		case 'lookbehind':
			return Kt({ behind: e === 'lookbehind', negate: r });
		default:
			throw new Error(`Unexpected group kind "${e}"`);
	}
}
function Ln(t) {
	if (t === void 0) t = [Qt()];
	else if (!Array.isArray(t) || !t.length || !t.every((e) => e.type === 'Alternative'))
		throw new Error('Invalid body; expected array of one or more Alternative nodes');
	return t;
}
function Ra(t) {
	if (t === void 0) t = [];
	else if (!Array.isArray(t) || !t.every((e) => !!e.type))
		throw new Error('Invalid body; expected array of nodes');
	return t;
}
function uo(t) {
	return t.type === 'LookaroundAssertion' && t.kind === 'lookahead';
}
function ho(t) {
	return t.type === 'LookaroundAssertion' && t.kind === 'lookbehind';
}
function zh(t) {
	return /^[\p{Alpha}\p{Pc}][^)]*$/u.test(t);
}
function Wh(t) {
	return t
		.trim()
		.replace(/[- _]+/g, '_')
		.replace(/[A-Z][a-z]+(?=[A-Z])/g, '$&_')
		.replace(/[A-Za-z]+/g, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase());
}
function pr(t) {
	return t.replace(/[- _]+/g, '').toLowerCase();
}
function fo(t, e) {
	return vn(
		t,
		`${e?.type === 'Character' && e.value === 93 ? 'Empty' : 'Unclosed'} character class`
	);
}
function po(t) {
	return vn(t, 'Unclosed group');
}
function Sn(t, e, n = null) {
	function r(o, a) {
		for (let i = 0; i < o.length; i++) {
			const l = s(o[i], a, i, o);
			i = Math.max(-1, i + l);
		}
	}
	function s(o, a = null, i = null, l = null) {
		let c = 0,
			u = !1;
		const d = {
				node: o,
				parent: a,
				key: i,
				container: l,
				root: t,
				remove() {
					(Wn(l).splice(Math.max(0, on(i) + c), 1), c--, (u = !0));
				},
				removeAllNextSiblings() {
					return Wn(l).splice(on(i) + 1);
				},
				removeAllPrevSiblings() {
					const w = on(i) + c;
					return ((c -= w), Wn(l).splice(0, Math.max(0, w)));
				},
				replaceWith(w, _ = {}) {
					const k = !!_.traverse;
					(l ? (l[Math.max(0, on(i) + c)] = w) : (vn(a, "Can't replace root node")[i] = w),
						k && s(w, a, i, l),
						(u = !0));
				},
				replaceWithMultiple(w, _ = {}) {
					const k = !!_.traverse;
					if ((Wn(l).splice(Math.max(0, on(i) + c), 1, ...w), (c += w.length - 1), k)) {
						let E = 0;
						for (let R = 0; R < w.length; R++) E += s(w[R], a, on(i) + R + E, l);
					}
					u = !0;
				},
				skip() {
					u = !0;
				}
			},
			{ type: f } = o,
			h = e['*'],
			p = e[f],
			v = typeof h == 'function' ? h : h?.enter,
			b = typeof p == 'function' ? p : p?.enter;
		if ((v?.(d, n), b?.(d, n), !u))
			switch (f) {
				case 'AbsenceFunction':
				case 'CapturingGroup':
				case 'Group':
					r(o.body, o);
					break;
				case 'Alternative':
				case 'CharacterClass':
					r(o.body, o);
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
					(s(o.min, o, 'min'), s(o.max, o, 'max'));
					break;
				case 'LookaroundAssertion':
					r(o.body, o);
					break;
				case 'Quantifier':
					s(o.body, o, 'body');
					break;
				case 'Regex':
					(r(o.body, o), s(o.flags, o, 'flags'));
					break;
				default:
					throw new Error(`Unexpected node type "${f}"`);
			}
		return (p?.exit?.(d, n), h?.exit?.(d, n), c);
	}
	return (s(t), t);
}
function Wn(t) {
	if (!Array.isArray(t)) throw new Error('Container expected');
	return t;
}
function on(t) {
	if (typeof t != 'number') throw new Error('Numeric key expected');
	return t;
}
const Vh = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`;
function Hh(t, e) {
	for (let n = 0; n < t.length; n++) t[n] >= e && t[n]++;
}
function qh(t, e, n, r) {
	return t.slice(0, e) + r + t.slice(e + n.length);
}
const gt = Object.freeze({ DEFAULT: 'DEFAULT', CHAR_CLASS: 'CHAR_CLASS' });
function vs(t, e, n, r) {
	const s = new RegExp(String.raw`${e}|(?<$skip>\[\^?|\\?.)`, 'gsu'),
		o = [!1];
	let a = 0,
		i = '';
	for (const l of t.matchAll(s)) {
		const {
			0: c,
			groups: { $skip: u }
		} = l;
		if (!u && (!r || (r === gt.DEFAULT) == !a)) {
			n instanceof Function
				? (i += n(l, { context: a ? gt.CHAR_CLASS : gt.DEFAULT, negated: o[o.length - 1] }))
				: (i += n);
			continue;
		}
		(c[0] === '[' ? (a++, o.push(c[1] === '^')) : c === ']' && a && (a--, o.pop()), (i += c));
	}
	return i;
}
function $a(t, e, n, r) {
	vs(t, e, n, r);
}
function Kh(t, e, n = 0, r) {
	if (!new RegExp(e, 'su').test(t)) return null;
	const s = new RegExp(`${e}|(?<$skip>\\\\?.)`, 'gsu');
	s.lastIndex = n;
	let o = 0,
		a;
	for (; (a = s.exec(t)); ) {
		const {
			0: i,
			groups: { $skip: l }
		} = a;
		if (!l && (!r || (r === gt.DEFAULT) == !o)) return a;
		(i === '[' ? o++ : i === ']' && o && o--, s.lastIndex == a.index && s.lastIndex++);
	}
	return null;
}
function Vn(t, e, n) {
	return !!Kh(t, e, 0, n);
}
function Xh(t, e) {
	const n = /\\?./gsu;
	n.lastIndex = e;
	let r = t.length,
		s = 0,
		o = 1,
		a;
	for (; (a = n.exec(t)); ) {
		const [i] = a;
		if (i === '[') s++;
		else if (s) i === ']' && s--;
		else if (i === '(') o++;
		else if (i === ')' && (o--, !o)) {
			r = a.index;
			break;
		}
	}
	return t.slice(e, r);
}
const go = new RegExp(
	String.raw`(?<noncapturingStart>${Vh})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`,
	'gsu'
);
function Zh(t, e) {
	const n = e?.hiddenCaptures ?? [];
	let r = e?.captureTransfers ?? new Map();
	if (!/\(\?>/.test(t)) return { pattern: t, captureTransfers: r, hiddenCaptures: n };
	const s = '(?>',
		o = '(?:(?=(',
		a = [0],
		i = [];
	let l = 0,
		c = 0,
		u = NaN,
		d;
	do {
		d = !1;
		let f = 0,
			h = 0,
			p = !1,
			v;
		for (go.lastIndex = Number.isNaN(u) ? 0 : u + o.length; (v = go.exec(t)); ) {
			const {
				0: b,
				index: w,
				groups: { capturingStart: _, noncapturingStart: k }
			} = v;
			if (b === '[') f++;
			else if (f) b === ']' && f--;
			else if (b === s && !p) ((u = w), (p = !0));
			else if (p && k) h++;
			else if (_) p ? h++ : (l++, a.push(l + c));
			else if (b === ')' && p) {
				if (!h) {
					c++;
					const E = l + c;
					if (
						((t = `${t.slice(0, u)}${o}${t.slice(u + s.length, w)}))<$$${E}>)${t.slice(w + 1)}`),
						(d = !0),
						i.push(E),
						Hh(n, E),
						r.size)
					) {
						const R = new Map();
						(r.forEach((A, te) => {
							R.set(
								te >= E ? te + 1 : te,
								A.map((fe) => (fe >= E ? fe + 1 : fe))
							);
						}),
							(r = R));
					}
					break;
				}
				h--;
			}
		}
	} while (d);
	return (
		n.push(...i),
		(t = vs(
			t,
			String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`,
			({ 0: f, groups: { backrefNum: h, wrappedBackrefNum: p } }) => {
				if (h) {
					const v = +h;
					if (v > a.length - 1) throw new Error(`Backref "${f}" greater than number of captures`);
					return `\\${a[v]}`;
				}
				return `\\${p}`;
			},
			gt.DEFAULT
		)),
		{ pattern: t, captureTransfers: r, hiddenCaptures: n }
	);
}
const Na = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`,
	$r = new RegExp(
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
| (?<qBase>${Na})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ''),
		'gsu'
	);
function Qh(t) {
	if (!new RegExp(`${Na}\\+`).test(t)) return { pattern: t };
	const e = [];
	let n = null,
		r = null,
		s = '',
		o = 0,
		a;
	for ($r.lastIndex = 0; (a = $r.exec(t)); ) {
		const {
			0: i,
			index: l,
			groups: { qBase: c, qMod: u, invalidQ: d }
		} = a;
		if (i === '[') (o || (r = l), o++);
		else if (i === ']') o ? o-- : (r = null);
		else if (!o)
			if (u === '+' && s && !s.startsWith('(')) {
				if (d) throw new Error(`Invalid quantifier "${i}"`);
				let f = -1;
				if (/^\{\d+\}$/.test(c)) t = qh(t, l + c.length, u, '');
				else {
					if (s === ')' || s === ']') {
						const h = s === ')' ? n : r;
						if (h === null) throw new Error(`Invalid unmatched "${s}"`);
						t = `${t.slice(0, h)}(?>${t.slice(h, l)}${c})${t.slice(l + i.length)}`;
					} else t = `${t.slice(0, l - s.length)}(?>${s}${c})${t.slice(l + i.length)}`;
					f += 4;
				}
				$r.lastIndex += f;
			} else i[0] === '(' ? e.push(l) : i === ')' && (n = e.length ? e.pop() : null);
		s = i;
	}
	return { pattern: t };
}
const ft = String.raw,
	Jh = ft`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`,
	Yr = ft`\(\?R=(?<rDepth>[^\)]+)\)|${Jh}`,
	gr = ft`\(\?<(?![=!])(?<captureName>[^>]+)>`,
	La = ft`${gr}|(?<unnamed>\()(?!\?)`,
	Ht = new RegExp(ft`${gr}|${Yr}|\(\?|\\?.`, 'gsu'),
	Nr = 'Cannot use multiple overlapping recursions';
function Yh(t, e) {
	const { hiddenCaptures: n, mode: r } = { hiddenCaptures: [], mode: 'plugin', ...e };
	let s = e?.captureTransfers ?? new Map();
	if (!new RegExp(Yr, 'su').test(t)) return { pattern: t, captureTransfers: s, hiddenCaptures: n };
	if (r === 'plugin' && Vn(t, ft`\(\?\(DEFINE\)`, gt.DEFAULT))
		throw new Error('DEFINE groups cannot be used with recursion');
	const o = [],
		a = Vn(t, ft`\\[1-9]`, gt.DEFAULT),
		i = new Map(),
		l = [];
	let c = !1,
		u = 0,
		d = 0,
		f;
	for (Ht.lastIndex = 0; (f = Ht.exec(t)); ) {
		const {
			0: h,
			groups: { captureName: p, rDepth: v, gRNameOrNum: b, gRDepth: w }
		} = f;
		if (h === '[') u++;
		else if (u) h === ']' && u--;
		else if (v) {
			if ((mo(v), c)) throw new Error(Nr);
			if (a)
				throw new Error(
					`${r === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with global recursion`
				);
			const _ = t.slice(0, f.index),
				k = t.slice(Ht.lastIndex);
			if (Vn(k, Yr, gt.DEFAULT)) throw new Error(Nr);
			const E = +v - 1;
			((t = vo(_, k, E, !1, n, o, d)), (s = yo(s, _, E, o.length, 0, d)));
			break;
		} else if (b) {
			mo(w);
			let _ = !1;
			for (const Me of l)
				if (Me.name === b || Me.num === +b) {
					if (((_ = !0), Me.hasRecursedWithin)) throw new Error(Nr);
					break;
				}
			if (!_)
				throw new Error(
					ft`Recursive \g cannot be used outside the referenced group "${r === 'external' ? b : ft`\g<${b}&R=${w}>`}"`
				);
			const k = i.get(b),
				E = Xh(t, k);
			if (a && Vn(E, ft`${gr}|\((?!\?)`, gt.DEFAULT))
				throw new Error(
					`${r === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with recursion of capturing groups`
				);
			const R = t.slice(k, f.index),
				A = E.slice(R.length + h.length),
				te = o.length,
				fe = +w - 1,
				Le = vo(R, A, fe, !0, n, o, d);
			s = yo(s, R, fe, o.length - te, te, d);
			const it = t.slice(0, k),
				Te = t.slice(k + E.length);
			((t = `${it}${Le}${Te}`),
				(Ht.lastIndex += Le.length - h.length - R.length - A.length),
				l.forEach((Me) => (Me.hasRecursedWithin = !0)),
				(c = !0));
		} else if (p)
			(d++, i.set(String(d), Ht.lastIndex), i.set(p, Ht.lastIndex), l.push({ num: d, name: p }));
		else if (h[0] === '(') {
			const _ = h === '(';
			(_ && (d++, i.set(String(d), Ht.lastIndex)), l.push(_ ? { num: d } : {}));
		} else h === ')' && l.pop();
	}
	return (n.push(...o), { pattern: t, captureTransfers: s, hiddenCaptures: n });
}
function mo(t) {
	const e = `Max depth must be integer between 2 and 100; used ${t}`;
	if (!/^[1-9]\d*$/.test(t)) throw new Error(e);
	if (((t = +t), t < 2 || t > 100)) throw new Error(e);
}
function vo(t, e, n, r, s, o, a) {
	const i = new Set();
	r &&
		$a(
			t + e,
			gr,
			({ groups: { captureName: c } }) => {
				i.add(c);
			},
			gt.DEFAULT
		);
	const l = [n, r ? i : null, s, o, a];
	return `${t}${_o(`(?:${t}`, 'forward', ...l)}(?:)${_o(`${e})`, 'backward', ...l)}${e}`;
}
function _o(t, e, n, r, s, o, a) {
	const l = (u) => (e === 'forward' ? u + 2 : n - u + 2 - 1);
	let c = '';
	for (let u = 0; u < n; u++) {
		const d = l(u);
		c += vs(
			t,
			ft`${La}|\\k<(?<backref>[^>]+)>`,
			({ 0: f, groups: { captureName: h, unnamed: p, backref: v } }) => {
				if (v && r && !r.has(v)) return f;
				const b = `_$${d}`;
				if (p || h) {
					const w = a + o.length + 1;
					return (o.push(w), ef(s, w), p ? f : `(?<${h}${b}>`);
				}
				return ft`\k<${v}${b}>`;
			},
			gt.DEFAULT
		);
	}
	return c;
}
function ef(t, e) {
	for (let n = 0; n < t.length; n++) t[n] >= e && t[n]++;
}
function yo(t, e, n, r, s, o) {
	if (t.size && r) {
		let a = 0;
		$a(e, La, () => a++, gt.DEFAULT);
		const i = o - a + s,
			l = new Map();
		return (
			t.forEach((c, u) => {
				const d = (r - a * n) / n,
					f = a * n,
					h = u > i + a ? u + r : u,
					p = [];
				for (const v of c)
					if (v <= i) p.push(v);
					else if (v > i + a + d) p.push(v + r);
					else if (v <= i + a) for (let b = 0; b <= n; b++) p.push(v + a * b);
					else for (let b = 0; b <= n; b++) p.push(v + f + d * b);
				l.set(h, p);
			}),
			l
		);
	}
	return t;
}
var Ce = String.fromCodePoint,
	F = String.raw,
	Lt = {
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
Lt.bugFlagVLiteralHyphenIsRange = Lt.unicodeSets
	? (() => {
			try {
				new RegExp(F`[\d\-a]`, 'v');
			} catch {
				return !0;
			}
			return !1;
		})()
	: !1;
Lt.bugNestedClassIgnoresNegation = Lt.unicodeSets && new RegExp('[[^a]]', 'v').test('a');
function lr(t, { enable: e, disable: n }) {
	return {
		dotAll: !n?.dotAll && !!(e?.dotAll || t.dotAll),
		ignoreCase: !n?.ignoreCase && !!(e?.ignoreCase || t.ignoreCase)
	};
}
function Rn(t, e, n) {
	return (t.has(e) || t.set(e, n), t.get(e));
}
function es(t, e) {
	return bo[t] >= bo[e];
}
function tf(t, e) {
	if (t == null) throw new Error(e ?? 'Value expected');
	return t;
}
var bo = { ES2025: 2025, ES2024: 2024, ES2018: 2018 },
	nf = { auto: 'auto', ES2025: 'ES2025', ES2024: 'ES2024', ES2018: 'ES2018' };
function Ta(t = {}) {
	if ({}.toString.call(t) !== '[object Object]') throw new Error('Unexpected options');
	if (t.target !== void 0 && !nf[t.target]) throw new Error(`Unexpected target "${t.target}"`);
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
			(e.target = Lt.flagGroups ? 'ES2025' : Lt.unicodeSets ? 'ES2024' : 'ES2018'),
		e
	);
}
var rf = '[	-\r ]',
	sf = new Set([Ce(304), Ce(305)]),
	Rt = F`[\p{L}\p{M}\p{N}\p{Pc}]`;
function Ma(t) {
	if (sf.has(t)) return [t];
	const e = new Set(),
		n = t.toLowerCase(),
		r = n.toUpperCase(),
		s = lf.get(n),
		o = of.get(n),
		a = af.get(n);
	return (
		[...r].length === 1 && e.add(r),
		a && e.add(a),
		s && e.add(s),
		e.add(n),
		o && e.add(o),
		[...e]
	);
}
var _s = new Map(
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
			.map((t) => [pr(t), t])
	),
	of = new Map([
		['s', Ce(383)],
		[Ce(383), 's']
	]),
	af = new Map([
		[Ce(223), Ce(7838)],
		[Ce(107), Ce(8490)],
		[Ce(229), Ce(8491)],
		[Ce(969), Ce(8486)]
	]),
	lf = new Map([
		Gt(453),
		Gt(456),
		Gt(459),
		Gt(498),
		...Lr(8072, 8079),
		...Lr(8088, 8095),
		...Lr(8104, 8111),
		Gt(8124),
		Gt(8140),
		Gt(8188)
	]),
	cf = new Map([
		['alnum', F`[\p{Alpha}\p{Nd}]`],
		['alpha', F`\p{Alpha}`],
		['ascii', F`\p{ASCII}`],
		['blank', F`[\p{Zs}\t]`],
		['cntrl', F`\p{Cc}`],
		['digit', F`\p{Nd}`],
		['graph', F`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
		['lower', F`\p{Lower}`],
		['print', F`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
		['punct', F`[\p{P}\p{S}]`],
		['space', F`\p{space}`],
		['upper', F`\p{Upper}`],
		['word', F`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
		['xdigit', F`\p{AHex}`]
	]);
function uf(t, e) {
	const n = [];
	for (let r = t; r <= e; r++) n.push(r);
	return n;
}
function Gt(t) {
	const e = Ce(t);
	return [e.toLowerCase(), e];
}
function Lr(t, e) {
	return uf(t, e).map((n) => Gt(n));
}
var Oa = new Set([
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
function df(t, e) {
	const n = {
		accuracy: 'default',
		asciiWordBoundaries: !1,
		avoidSubclass: !1,
		bestEffortTarget: 'ES2025',
		...e
	};
	Da(t);
	const r = {
		accuracy: n.accuracy,
		asciiWordBoundaries: n.asciiWordBoundaries,
		avoidSubclass: n.avoidSubclass,
		flagDirectivesByAlt: new Map(),
		jsGroupNameMap: new Map(),
		minTargetEs2024: es(n.bestEffortTarget, 'ES2024'),
		passedLookbehind: !1,
		strategy: null,
		subroutineRefMap: new Map(),
		supportedGNodes: new Set(),
		digitIsAscii: t.flags.digitIsAscii,
		spaceIsAscii: t.flags.spaceIsAscii,
		wordIsAscii: t.flags.wordIsAscii
	};
	Sn(t, hf, r);
	const s = { dotAll: t.flags.dotAll, ignoreCase: t.flags.ignoreCase },
		o = {
			currentFlags: s,
			prevFlags: null,
			globalFlags: s,
			groupOriginByCopy: new Map(),
			groupsByName: new Map(),
			multiplexCapturesToLeftByRef: new Map(),
			openRefs: new Map(),
			reffedNodesByReferencer: new Map(),
			subroutineRefMap: r.subroutineRefMap
		};
	Sn(t, ff, o);
	const a = {
		groupsByName: o.groupsByName,
		highestOrphanBackref: 0,
		numCapturesToLeft: 0,
		reffedNodesByReferencer: o.reffedNodesByReferencer
	};
	return (Sn(t, pf, a), (t._originMap = o.groupOriginByCopy), (t._strategy = r.strategy), t);
}
var hf = {
		AbsenceFunction({ node: t, parent: e, replaceWith: n }) {
			const { body: r, kind: s } = t;
			if (s === 'repeater') {
				const o = Ct();
				o.body[0].body.push(Kt({ negate: !0, body: r }), cn('Any'));
				const a = Ct();
				(a.body[0].body.push(Pa('greedy', 0, 1 / 0, o)), n(ge(a, e), { traverse: !0 }));
			} else throw new Error('Unsupported absence function "(?~|"');
		},
		Alternative: {
			enter({ node: t, parent: e, key: n }, { flagDirectivesByAlt: r }) {
				const s = t.body.filter((o) => o.kind === 'flags');
				for (let o = n + 1; o < e.body.length; o++) {
					const a = e.body[o];
					Rn(r, a, []).push(...s);
				}
			},
			exit({ node: t }, { flagDirectivesByAlt: e }) {
				if (e.get(t)?.length) {
					const n = Fa(e.get(t));
					if (n) {
						const r = Ct({ flags: n });
						((r.body[0].body = t.body), (t.body = [ge(r, t)]));
					}
				}
			}
		},
		Assertion({ node: t, parent: e, key: n, container: r, root: s, remove: o, replaceWith: a }, i) {
			const { kind: l, negate: c } = t,
				{ asciiWordBoundaries: u, avoidSubclass: d, supportedGNodes: f, wordIsAscii: h } = i;
			if (l === 'text_segment_boundary')
				throw new Error(`Unsupported text segment boundary "\\${c ? 'Y' : 'y'}"`);
			if (l === 'line_end')
				a(ge(Kt({ body: [Qt({ body: [Zr('string_end')] }), Qt({ body: [fr(10)] })] }), e));
			else if (l === 'line_start')
				a(ge($t(F`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: !0 }), e));
			else if (l === 'search_start')
				if (f.has(t)) ((s.flags.sticky = !0), o());
				else {
					const p = r[n - 1];
					if (p && bf(p)) a(ge(Kt({ negate: !0 }), e));
					else {
						if (d) throw new Error(F`Uses "\G" in a way that requires a subclass`);
						(a(Ft(Zr('string_start'), e)), (i.strategy = 'clip_search'));
					}
				}
			else if (!(l === 'string_end' || l === 'string_start'))
				if (l === 'string_end_newline') a(ge($t(F`(?=\n?\z)`), e));
				else if (l === 'word_boundary') {
					if (!h && !u) {
						const p = `(?:(?<=${Rt})(?!${Rt})|(?<!${Rt})(?=${Rt}))`,
							v = `(?:(?<=${Rt})(?=${Rt})|(?<!${Rt})(?!${Rt}))`;
						a(ge($t(c ? v : p), e));
					}
				} else throw new Error(`Unexpected assertion kind "${l}"`);
		},
		Backreference({ node: t }, { jsGroupNameMap: e }) {
			let { ref: n } = t;
			typeof n == 'string' && !Mr(n) && ((n = Tr(n, e)), (t.ref = n));
		},
		CapturingGroup({ node: t }, { jsGroupNameMap: e, subroutineRefMap: n }) {
			let { name: r } = t;
			(r && !Mr(r) && ((r = Tr(r, e)), (t.name = r)), n.set(t.number, t), r && n.set(r, t));
		},
		CharacterClassRange({ node: t, parent: e, replaceWith: n }) {
			if (e.kind === 'intersection') {
				const r = Xn({ body: [t] });
				n(ge(r, e), { traverse: !0 });
			}
		},
		CharacterSet(
			{ node: t, parent: e, replaceWith: n },
			{ accuracy: r, minTargetEs2024: s, digitIsAscii: o, spaceIsAscii: a, wordIsAscii: i }
		) {
			const { kind: l, negate: c, value: u } = t;
			if (o && (l === 'digit' || u === 'digit')) {
				n(Ft(Jr('digit', { negate: c }), e));
				return;
			}
			if (a && (l === 'space' || u === 'space')) {
				n(ge(Or($t(rf), c), e));
				return;
			}
			if (i && (l === 'word' || u === 'word')) {
				n(Ft(Jr('word', { negate: c }), e));
				return;
			}
			if (l === 'any') n(Ft(cn('Any'), e));
			else if (l === 'digit') n(Ft(cn('Nd', { negate: c }), e));
			else if (l !== 'dot')
				if (l === 'text_segment') {
					if (r === 'strict') throw new Error(F`Use of "\X" requires non-strict accuracy`);
					const d = '\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?',
						f = F`\p{RI}{2}|${d}(?:\u200D${d})*`;
					n(
						ge(
							$t(F`(?>\r\n|${s ? F`\p{RGI_Emoji}` : f}|\P{M}\p{M}*)`, {
								skipPropertyNameValidation: !0
							}),
							e
						)
					);
				} else if (l === 'hex') n(Ft(cn('AHex', { negate: c }), e));
				else if (l === 'newline')
					n(
						ge(
							$t(
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
				else if (l === 'posix')
					if (!s && (u === 'graph' || u === 'print')) {
						if (r === 'strict')
							throw new Error(
								`POSIX class "${u}" requires min target ES2024 or non-strict accuracy`
							);
						let d = { graph: '!-~', print: ' -~' }[u];
						(c && (d = `\0-${Ce(d.codePointAt(0) - 1)}${Ce(d.codePointAt(2) + 1)}-􏿿`),
							n(ge($t(`[${d}]`), e)));
					} else n(ge(Or($t(cf.get(u)), c), e));
				else if (l === 'property') _s.has(pr(u)) || (t.key = 'sc');
				else if (l === 'space') n(Ft(cn('space', { negate: c }), e));
				else if (l === 'word') n(ge(Or($t(Rt), c), e));
				else throw new Error(`Unexpected character set kind "${l}"`);
		},
		Directive({
			node: t,
			parent: e,
			root: n,
			remove: r,
			replaceWith: s,
			removeAllPrevSiblings: o,
			removeAllNextSiblings: a
		}) {
			const { kind: i, flags: l } = t;
			if (i === 'flags')
				if (!l.enable && !l.disable) r();
				else {
					const c = Ct({ flags: l });
					((c.body[0].body = a()), s(ge(c, e), { traverse: !0 }));
				}
			else if (i === 'keep') {
				const c = n.body[0],
					d =
						n.body.length === 1 && Sa(c, { type: 'Group' }) && c.body[0].body.length === 1
							? c.body[0]
							: n;
				if (e.parent !== d || d.body.length > 1)
					throw new Error(F`Uses "\K" in a way that's unsupported`);
				const f = Kt({ behind: !0 });
				((f.body[0].body = o()), s(ge(f, e)));
			} else throw new Error(`Unexpected directive kind "${i}"`);
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
				Object.assign(t, { global: !1, hasIndices: !1, multiline: !1, sticky: t.sticky ?? !1 }),
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
			if (r === 'fail') n(ge(Kt({ negate: !0 }), e));
			else throw new Error(`Unsupported named callout "(*${r.toUpperCase()}"`);
		},
		Quantifier({ node: t }) {
			if (t.body.type === 'Quantifier') {
				const e = Ct();
				(e.body[0].body.push(t.body), (t.body = ge(e, t)));
			}
		},
		Regex: {
			enter({ node: t }, { supportedGNodes: e }) {
				const n = [];
				let r = !1,
					s = !1;
				for (const o of t.body)
					if (o.body.length === 1 && o.body[0].kind === 'search_start') o.body.pop();
					else {
						const a = ja(o.body);
						a ? ((r = !0), Array.isArray(a) ? n.push(...a) : n.push(a)) : (s = !0);
					}
				r && !s && n.forEach((o) => e.add(o));
			},
			exit(t, { accuracy: e, passedLookbehind: n, strategy: r }) {
				if (e === 'strict' && n && r)
					throw new Error(F`Uses "\G" in a way that requires non-strict accuracy`);
			}
		},
		Subroutine({ node: t }, { jsGroupNameMap: e }) {
			let { ref: n } = t;
			typeof n == 'string' && !Mr(n) && ((n = Tr(n, e)), (t.ref = n));
		}
	},
	ff = {
		Backreference({ node: t }, { multiplexCapturesToLeftByRef: e, reffedNodesByReferencer: n }) {
			const { orphan: r, ref: s } = t;
			r || n.set(t, [...e.get(s).map(({ node: o }) => o)]);
		},
		CapturingGroup: {
			enter(
				{ node: t, parent: e, replaceWith: n, skip: r },
				{
					groupOriginByCopy: s,
					groupsByName: o,
					multiplexCapturesToLeftByRef: a,
					openRefs: i,
					reffedNodesByReferencer: l
				}
			) {
				const c = s.get(t);
				if (c && i.has(t.number)) {
					const d = Ft(wo(t.number), e);
					(l.set(d, i.get(t.number)), n(d));
					return;
				}
				(i.set(t.number, t), a.set(t.number, []), t.name && Rn(a, t.name, []));
				const u = a.get(t.name ?? t.number);
				for (let d = 0; d < u.length; d++) {
					const f = u[d];
					if (c === f.node || (c && c === f.origin) || t === f.origin) {
						u.splice(d, 1);
						break;
					}
				}
				if (
					(a.get(t.number).push({ node: t, origin: c }),
					t.name && a.get(t.name).push({ node: t, origin: c }),
					t.name)
				) {
					const d = Rn(o, t.name, new Map());
					let f = !1;
					if (c) f = !0;
					else
						for (const h of d.values())
							if (!h.hasDuplicateNameToRemove) {
								f = !0;
								break;
							}
					o.get(t.name).set(t, { node: t, hasDuplicateNameToRemove: f });
				}
			},
			exit({ node: t }, { openRefs: e }) {
				e.delete(t.number);
			}
		},
		Group: {
			enter({ node: t }, e) {
				((e.prevFlags = e.currentFlags), t.flags && (e.currentFlags = lr(e.currentFlags, t.flags)));
			},
			exit(t, e) {
				e.currentFlags = e.prevFlags;
			}
		},
		Subroutine({ node: t, parent: e, replaceWith: n }, r) {
			const { isRecursive: s, ref: o } = t;
			if (s) {
				let u = e;
				for (
					;
					(u = u.parent) && !(u.type === 'CapturingGroup' && (u.name === o || u.number === o));

				);
				r.reffedNodesByReferencer.set(t, u);
				return;
			}
			const a = r.subroutineRefMap.get(o),
				i = o === 0,
				l = i ? wo(0) : Ga(a, r.groupOriginByCopy, null);
			let c = l;
			if (!i) {
				const u = Fa(vf(a, (f) => f.type === 'Group' && !!f.flags)),
					d = u ? lr(r.globalFlags, u) : r.globalFlags;
				gf(d, r.currentFlags) || ((c = Ct({ flags: _f(d) })), c.body[0].body.push(l));
			}
			n(ge(c, e), { traverse: !i });
		}
	},
	pf = {
		Backreference({ node: t, parent: e, replaceWith: n }, r) {
			if (t.orphan) {
				r.highestOrphanBackref = Math.max(r.highestOrphanBackref, t.ref);
				return;
			}
			const o = r.reffedNodesByReferencer.get(t).filter((a) => mf(a, t));
			if (!o.length) n(ge(Kt({ negate: !0 }), e));
			else if (o.length > 1) {
				const a = Ct({ atomic: !0, body: o.reverse().map((i) => Qt({ body: [Qr(i.number)] })) });
				n(ge(a, e));
			} else t.ref = o[0].number;
		},
		CapturingGroup({ node: t }, e) {
			((t.number = ++e.numCapturesToLeft),
				t.name && e.groupsByName.get(t.name).get(t).hasDuplicateNameToRemove && delete t.name);
		},
		Regex: {
			exit({ node: t }, e) {
				const n = Math.max(e.highestOrphanBackref - e.numCapturesToLeft, 0);
				for (let r = 0; r < n; r++) {
					const s = Aa();
					t.body.at(-1).body.push(s);
				}
			}
		},
		Subroutine({ node: t }, e) {
			!t.isRecursive || t.ref === 0 || (t.ref = e.reffedNodesByReferencer.get(t).number);
		}
	};
function Da(t) {
	Sn(t, {
		'*'({ node: e, parent: n }) {
			e.parent = n;
		}
	});
}
function gf(t, e) {
	return t.dotAll === e.dotAll && t.ignoreCase === e.ignoreCase;
}
function mf(t, e) {
	let n = e;
	do {
		if (n.type === 'Regex') return !1;
		if (n.type === 'Alternative') continue;
		if (n === t) return !1;
		const r = Ba(n.parent);
		for (const s of r) {
			if (s === n) break;
			if (s === t || Ua(s, t)) return !0;
		}
	} while ((n = n.parent));
	throw new Error('Unexpected path');
}
function Ga(t, e, n, r) {
	const s = Array.isArray(t) ? [] : {};
	for (const [o, a] of Object.entries(t))
		o === 'parent'
			? (s.parent = Array.isArray(n) ? r : n)
			: a && typeof a == 'object'
				? (s[o] = Ga(a, e, s, n))
				: (o === 'type' && a === 'CapturingGroup' && e.set(s, e.get(t) ?? t), (s[o] = a));
	return s;
}
function wo(t) {
	const e = Ia(t);
	return ((e.isRecursive = !0), e);
}
function vf(t, e) {
	const n = [];
	for (; (t = t.parent); ) (!e || e(t)) && n.push(t);
	return n;
}
function Tr(t, e) {
	if (e.has(t)) return e.get(t);
	const n = `$${e.size}_${t.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/gu, '_')}`;
	return (e.set(t, n), n);
}
function Fa(t) {
	const e = ['dotAll', 'ignoreCase'],
		n = { enable: {}, disable: {} };
	return (
		t.forEach(({ flags: r }) => {
			e.forEach((s) => {
				(r.enable?.[s] && (delete n.disable[s], (n.enable[s] = !0)),
					r.disable?.[s] && (n.disable[s] = !0));
			});
		}),
		Object.keys(n.enable).length || delete n.enable,
		Object.keys(n.disable).length || delete n.disable,
		n.enable || n.disable ? n : null
	);
}
function _f({ dotAll: t, ignoreCase: e }) {
	const n = {};
	return (
		(t || e) && ((n.enable = {}), t && (n.enable.dotAll = !0), e && (n.enable.ignoreCase = !0)),
		(!t || !e) &&
			((n.disable = {}), !t && (n.disable.dotAll = !0), !e && (n.disable.ignoreCase = !0)),
		n
	);
}
function Ba(t) {
	if (!t) throw new Error('Node expected');
	const { body: e } = t;
	return Array.isArray(e) ? e : e ? [e] : null;
}
function ja(t) {
	const e = t.find((n) => n.kind === 'search_start' || wf(n, { negate: !1 }) || !yf(n));
	if (!e) return null;
	if (e.kind === 'search_start') return e;
	if (e.type === 'LookaroundAssertion') return e.body[0].body[0];
	if (e.type === 'CapturingGroup' || e.type === 'Group') {
		const n = [];
		for (const r of e.body) {
			const s = ja(r.body);
			if (!s) return null;
			Array.isArray(s) ? n.push(...s) : n.push(s);
		}
		return n;
	}
	return null;
}
function Ua(t, e) {
	const n = Ba(t) ?? [];
	for (const r of n) if (r === e || Ua(r, e)) return !0;
	return !1;
}
function yf({ type: t }) {
	return t === 'Assertion' || t === 'Directive' || t === 'LookaroundAssertion';
}
function bf(t) {
	const e = ['Character', 'CharacterClass', 'CharacterSet'];
	return e.includes(t.type) || (t.type === 'Quantifier' && t.min && e.includes(t.body.type));
}
function wf(t, e) {
	const n = { negate: null, ...e };
	return (
		t.type === 'LookaroundAssertion' &&
		(n.negate === null || t.negate === n.negate) &&
		t.body.length === 1 &&
		Sa(t.body[0], { type: 'Assertion', kind: 'search_start' })
	);
}
function Mr(t) {
	return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(t);
}
function $t(t, e) {
	const r = Ea(t, { ...e, unicodePropertyMap: _s }).body;
	return r.length > 1 || r[0].body.length > 1 ? Ct({ body: r }) : r[0].body[0];
}
function Or(t, e) {
	return ((t.negate = e), t);
}
function Ft(t, e) {
	return ((t.parent = e), t);
}
function ge(t, e) {
	return (Da(t), (t.parent = e), t);
}
function Cf(t, e) {
	const n = Ta(e),
		r = es(n.target, 'ES2024'),
		s = es(n.target, 'ES2025'),
		o = n.rules.recursionLimit;
	if (!Number.isInteger(o) || o < 2 || o > 20) throw new Error('Invalid recursionLimit; use 2-20');
	let a = null,
		i = null;
	if (!s) {
		const h = [t.flags.ignoreCase];
		Sn(t, kf, {
			getCurrentModI: () => h.at(-1),
			popModI() {
				h.pop();
			},
			pushModI(p) {
				h.push(p);
			},
			setHasCasedChar() {
				h.at(-1) ? (a = !0) : (i = !0);
			}
		});
	}
	const l = { dotAll: t.flags.dotAll, ignoreCase: !!((t.flags.ignoreCase || a) && !i) };
	let c = t;
	const u = {
		accuracy: n.accuracy,
		appliedGlobalFlags: l,
		captureMap: new Map(),
		currentFlags: { dotAll: t.flags.dotAll, ignoreCase: t.flags.ignoreCase },
		inCharClass: !1,
		lastNode: c,
		originMap: t._originMap,
		recursionLimit: o,
		useAppliedIgnoreCase: !!(!s && a && i),
		useFlagMods: s,
		useFlagV: r,
		verbose: n.verbose
	};
	function d(h) {
		return ((u.lastNode = c), (c = h), tf(xf[h.type], `Unexpected node type "${h.type}"`)(h, u, d));
	}
	const f = { pattern: t.body.map(d).join('|'), flags: d(t.flags), options: { ...t.options } };
	return (
		r ||
			(delete f.options.force.v, (f.options.disable.v = !0), (f.options.unicodeSetsPlugin = null)),
		(f._captureTransfers = new Map()),
		(f._hiddenCaptures = []),
		u.captureMap.forEach((h, p) => {
			(h.hidden && f._hiddenCaptures.push(p),
				h.transferTo && Rn(f._captureTransfers, h.transferTo, []).push(p));
		}),
		f
	);
}
var kf = {
		'*': {
			enter({ node: t }, e) {
				if (ko(t)) {
					const n = e.getCurrentModI();
					e.pushModI(t.flags ? lr({ ignoreCase: n }, t.flags).ignoreCase : n);
				}
			},
			exit({ node: t }, e) {
				ko(t) && e.popModI();
			}
		},
		Backreference(t, e) {
			e.setHasCasedChar();
		},
		Character({ node: t }, e) {
			ys(Ce(t.value)) && e.setHasCasedChar();
		},
		CharacterClassRange({ node: t, skip: e }, n) {
			(e(), za(t, { firstOnly: !0 }).length && n.setHasCasedChar());
		},
		CharacterSet({ node: t }, e) {
			t.kind === 'property' && Oa.has(t.value) && e.setHasCasedChar();
		}
	},
	xf = {
		Alternative({ body: t }, e, n) {
			return t.map(n).join('');
		},
		Assertion({ kind: t, negate: e }) {
			if (t === 'string_end') return '$';
			if (t === 'string_start') return '^';
			if (t === 'word_boundary') return e ? F`\B` : F`\b`;
			throw new Error(`Unexpected assertion kind "${t}"`);
		},
		Backreference({ ref: t }, e) {
			if (typeof t != 'number') throw new Error('Unexpected named backref in transformed AST');
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
			const { body: r, name: s, number: o } = t,
				a = { ignoreCase: e.currentFlags.ignoreCase },
				i = e.originMap.get(t);
			return (
				i && ((a.hidden = !0), o > i.number && (a.transferTo = i.number)),
				e.captureMap.set(o, a),
				`(${s ? `?<${s}>` : ''}${r.map(n).join('|')})`
			);
		},
		Character({ value: t }, e) {
			const n = Ce(t),
				r = an(t, {
					escDigit: e.lastNode.type === 'Backreference',
					inCharClass: e.inCharClass,
					useFlagV: e.useFlagV
				});
			if (r !== n) return r;
			if (e.useAppliedIgnoreCase && e.currentFlags.ignoreCase && ys(n)) {
				const s = Ma(n);
				return e.inCharClass ? s.join('') : s.length > 1 ? `[${s.join('')}]` : s[0];
			}
			return n;
		},
		CharacterClass(t, e, n) {
			const { kind: r, negate: s, parent: o } = t;
			let { body: a } = t;
			if (r === 'intersection' && !e.useFlagV)
				throw new Error('Use of class intersection requires min target ES2024');
			Lt.bugFlagVLiteralHyphenIsRange &&
				e.useFlagV &&
				a.some(xo) &&
				(a = [fr(45), ...a.filter((c) => !xo(c))]);
			const i = () => `[${s ? '^' : ''}${a.map(n).join(r === 'intersection' ? '&&' : '')}]`;
			if (!e.inCharClass) {
				if ((!e.useFlagV || Lt.bugNestedClassIgnoresNegation) && !s) {
					const u = a.filter((d) => d.type === 'CharacterClass' && d.kind === 'union' && d.negate);
					if (u.length) {
						const d = Ct(),
							f = d.body[0];
						return (
							(d.parent = o),
							(f.parent = d),
							(a = a.filter((h) => !u.includes(h))),
							(t.body = a),
							a.length ? ((t.parent = f), f.body.push(t)) : d.body.pop(),
							u.forEach((h) => {
								const p = Qt({ body: [h] });
								((h.parent = p), (p.parent = d), d.body.push(p));
							}),
							n(d)
						);
					}
				}
				e.inCharClass = !0;
				const c = i();
				return ((e.inCharClass = !1), c);
			}
			const l = a[0];
			if (
				r === 'union' &&
				!s &&
				l &&
				(((!e.useFlagV || !e.verbose) &&
					o.kind === 'union' &&
					!(Lt.bugFlagVLiteralHyphenIsRange && e.useFlagV)) ||
					(!e.verbose &&
						o.kind === 'intersection' &&
						a.length === 1 &&
						l.type !== 'CharacterClassRange'))
			)
				return a.map(n).join('');
			if (!e.useFlagV && o.type === 'CharacterClass')
				throw new Error('Use of nested character class requires min target ES2024');
			return i();
		},
		CharacterClassRange(t, e) {
			const n = t.min.value,
				r = t.max.value,
				s = { escDigit: !1, inCharClass: !0, useFlagV: e.useFlagV },
				o = an(n, s),
				a = an(r, s),
				i = new Set();
			if (e.useAppliedIgnoreCase && e.currentFlags.ignoreCase) {
				const l = za(t);
				If(l).forEach((u) => {
					i.add(Array.isArray(u) ? `${an(u[0], s)}-${an(u[1], s)}` : an(u, s));
				});
			}
			return `${o}-${a}${[...i].join('')}`;
		},
		CharacterSet({ kind: t, negate: e, value: n, key: r }, s) {
			if (t === 'dot')
				return s.currentFlags.dotAll
					? s.appliedGlobalFlags.dotAll || s.useFlagMods
						? '.'
						: '[^]'
					: F`[^\n]`;
			if (t === 'digit') return e ? F`\D` : F`\d`;
			if (t === 'property') {
				if (s.useAppliedIgnoreCase && s.currentFlags.ignoreCase && Oa.has(n))
					throw new Error(
						`Unicode property "${n}" can't be case-insensitive when other chars have specific case`
					);
				return `${e ? F`\P` : F`\p`}{${r ? `${r}=` : ''}${n}}`;
			}
			if (t === 'word') return e ? F`\W` : F`\w`;
			throw new Error(`Unexpected character set kind "${t}"`);
		},
		Flags(t, e) {
			return (
				(e.appliedGlobalFlags.ignoreCase ? 'i' : '') + (t.dotAll ? 's' : '') + (t.sticky ? 'y' : '')
			);
		},
		Group({ atomic: t, body: e, flags: n, parent: r }, s, o) {
			const a = s.currentFlags;
			n && (s.currentFlags = lr(a, n));
			const i = e.map(o).join('|'),
				l =
					!s.verbose && e.length === 1 && r.type !== 'Quantifier' && !t && (!s.useFlagMods || !n)
						? i
						: `(?${Rf(t, n, s.useFlagMods)}${i})`;
			return ((s.currentFlags = a), l);
		},
		LookaroundAssertion({ body: t, kind: e, negate: n }, r, s) {
			return `(?${`${e === 'lookahead' ? '' : '<'}${n ? '!' : '='}`}${t.map(s).join('|')})`;
		},
		Quantifier(t, e, n) {
			return n(t.body) + $f(t);
		},
		Subroutine({ isRecursive: t, ref: e }, n) {
			if (!t) throw new Error('Unexpected non-recursive subroutine in transformed AST');
			const r = n.recursionLimit;
			return e === 0 ? `(?R=${r})` : F`\g<${e}&R=${r}>`;
		}
	},
	Sf = new Set(['$', '(', ')', '*', '+', '.', '?', '[', '\\', ']', '^', '{', '|', '}']),
	Ef = new Set(['-', '\\', ']', '^', '[']),
	Af = new Set([
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
	Co = new Map([
		[9, F`\t`],
		[10, F`\n`],
		[11, F`\v`],
		[12, F`\f`],
		[13, F`\r`],
		[8232, F`\u2028`],
		[8233, F`\u2029`],
		[65279, F`\uFEFF`]
	]),
	Pf = new RegExp('^\\p{Cased}$', 'u');
function ys(t) {
	return Pf.test(t);
}
function za(t, e) {
	const n = !!e?.firstOnly,
		r = t.min.value,
		s = t.max.value,
		o = [];
	if ((r < 65 && (s === 65535 || s >= 131071)) || (r === 65536 && s >= 131071)) return o;
	for (let a = r; a <= s; a++) {
		const i = Ce(a);
		if (!ys(i)) continue;
		const l = Ma(i).filter((c) => {
			const u = c.codePointAt(0);
			return u < r || u > s;
		});
		if (l.length && (o.push(...l), n)) break;
	}
	return o;
}
function an(t, { escDigit: e, inCharClass: n, useFlagV: r }) {
	if (Co.has(t)) return Co.get(t);
	if (t < 32 || (t > 126 && t < 160) || t > 262143 || (e && Nf(t)))
		return t > 255
			? `\\u{${t.toString(16).toUpperCase()}}`
			: `\\x${t.toString(16).toUpperCase().padStart(2, '0')}`;
	const s = n ? (r ? Af : Ef) : Sf,
		o = Ce(t);
	return (s.has(o) ? '\\' : '') + o;
}
function If(t) {
	const e = t.map((s) => s.codePointAt(0)).sort((s, o) => s - o),
		n = [];
	let r = null;
	for (let s = 0; s < e.length; s++)
		e[s + 1] === e[s] + 1
			? (r ??= e[s])
			: r === null
				? n.push(e[s])
				: (n.push([r, e[s]]), (r = null));
	return n;
}
function Rf(t, e, n) {
	if (t) return '>';
	let r = '';
	if (e && n) {
		const { enable: s, disable: o } = e;
		r =
			(s?.ignoreCase ? 'i' : '') +
			(s?.dotAll ? 's' : '') +
			(o ? '-' : '') +
			(o?.ignoreCase ? 'i' : '') +
			(o?.dotAll ? 's' : '');
	}
	return `${r}:`;
}
function $f({ kind: t, max: e, min: n }) {
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
function ko({ type: t }) {
	return t === 'CapturingGroup' || t === 'Group' || t === 'LookaroundAssertion';
}
function Nf(t) {
	return t > 47 && t < 58;
}
function xo({ type: t, value: e }) {
	return t === 'Character' && e === 45;
}
var Lf = class ts extends RegExp {
	#e = new Map();
	#t = null;
	#n;
	#r = null;
	#s = null;
	rawOptions = {};
	get source() {
		return this.#n || '(?:)';
	}
	constructor(e, n, r) {
		const s = !!r?.lazyCompile;
		if (e instanceof RegExp) {
			if (r) throw new Error('Cannot provide options when copying a regexp');
			const o = e;
			(super(o, n),
				(this.#n = o.source),
				o instanceof ts &&
					((this.#e = o.#e), (this.#r = o.#r), (this.#s = o.#s), (this.rawOptions = o.rawOptions)));
		} else {
			const o = { hiddenCaptures: [], strategy: null, transfers: [], ...r };
			(super(s ? '' : e, n),
				(this.#n = e),
				(this.#e = Mf(o.hiddenCaptures, o.transfers)),
				(this.#s = o.strategy),
				(this.rawOptions = r ?? {}));
		}
		s || (this.#t = this);
	}
	exec(e) {
		if (!this.#t) {
			const { lazyCompile: s, ...o } = this.rawOptions;
			this.#t = new ts(this.#n, this.flags, o);
		}
		const n = this.global || this.sticky,
			r = this.lastIndex;
		if (this.#s === 'clip_search' && n && r) {
			this.lastIndex = 0;
			const s = this.#o(e.slice(r));
			return (s && (Tf(s, r, e, this.hasIndices), (this.lastIndex += r)), s);
		}
		return this.#o(e);
	}
	#o(e) {
		this.#t.lastIndex = this.lastIndex;
		const n = super.exec.call(this.#t, e);
		if (((this.lastIndex = this.#t.lastIndex), !n || !this.#e.size)) return n;
		const r = [...n];
		n.length = 1;
		let s;
		this.hasIndices && ((s = [...n.indices]), (n.indices.length = 1));
		const o = [0];
		for (let a = 1; a < r.length; a++) {
			const { hidden: i, transferTo: l } = this.#e.get(a) ?? {};
			if (
				(i
					? o.push(null)
					: (o.push(n.length), n.push(r[a]), this.hasIndices && n.indices.push(s[a])),
				l && r[a] !== void 0)
			) {
				const c = o[l];
				if (!c) throw new Error(`Invalid capture transfer to "${c}"`);
				if (((n[c] = r[a]), this.hasIndices && (n.indices[c] = s[a]), n.groups)) {
					this.#r || (this.#r = Of(this.source));
					const u = this.#r.get(l);
					u && ((n.groups[u] = r[a]), this.hasIndices && (n.indices.groups[u] = s[a]));
				}
			}
		}
		return n;
	}
};
function Tf(t, e, n, r) {
	if (((t.index += e), (t.input = n), r)) {
		const s = t.indices;
		for (let a = 0; a < s.length; a++) {
			const i = s[a];
			i && (s[a] = [i[0] + e, i[1] + e]);
		}
		const o = s.groups;
		o &&
			Object.keys(o).forEach((a) => {
				const i = o[a];
				i && (o[a] = [i[0] + e, i[1] + e]);
			});
	}
}
function Mf(t, e) {
	const n = new Map();
	for (const r of t) n.set(r, { hidden: !0 });
	for (const [r, s] of e) for (const o of s) Rn(n, o, {}).transferTo = r;
	return n;
}
function Of(t) {
	const e = /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu,
		n = new Map();
	let r = 0,
		s = 0,
		o;
	for (; (o = e.exec(t)); ) {
		const {
			0: a,
			groups: { capture: i, name: l }
		} = o;
		a === '[' ? r++ : r ? a === ']' && r-- : i && (s++, l && n.set(s, l));
	}
	return n;
}
function Df(t, e) {
	const n = Gf(t, e);
	return n.options ? new Lf(n.pattern, n.flags, n.options) : new RegExp(n.pattern, n.flags);
}
function Gf(t, e) {
	const n = Ta(e),
		r = Ea(t, {
			flags: n.flags,
			normalizeUnknownPropertyNames: !0,
			rules: { captureGroup: n.rules.captureGroup, singleline: n.rules.singleline },
			skipBackrefValidation: n.rules.allowOrphanBackrefs,
			unicodePropertyMap: _s
		}),
		s = df(r, {
			accuracy: n.accuracy,
			asciiWordBoundaries: n.rules.asciiWordBoundaries,
			avoidSubclass: n.avoidSubclass,
			bestEffortTarget: n.target
		}),
		o = Cf(s, n),
		a = Yh(o.pattern, {
			captureTransfers: o._captureTransfers,
			hiddenCaptures: o._hiddenCaptures,
			mode: 'external'
		}),
		i = Qh(a.pattern),
		l = Zh(i.pattern, { captureTransfers: a.captureTransfers, hiddenCaptures: a.hiddenCaptures }),
		c = {
			pattern: l.pattern,
			flags: `${n.hasIndices ? 'd' : ''}${n.global ? 'g' : ''}${o.flags}${o.options.disable.v ? 'u' : 'v'}`
		};
	if (n.avoidSubclass) {
		if (n.lazyCompileLength !== 1 / 0) throw new Error('Lazy compilation requires subclass');
	} else {
		const u = l.hiddenCaptures.sort((p, v) => p - v),
			d = Array.from(l.captureTransfers),
			f = s._strategy,
			h = c.pattern.length >= n.lazyCompileLength;
		(u.length || d.length || f || h) &&
			(c.options = {
				...(u.length && { hiddenCaptures: u }),
				...(d.length && { transfers: d }),
				...(f && { strategy: f }),
				...(h && { lazyCompile: h })
			});
	}
	return c;
}
const So = 4294967295;
class Ff {
	constructor(e, n = {}) {
		((this.patterns = e), (this.options = n));
		const { forgiving: r = !1, cache: s, regexConstructor: o } = n;
		if (!o) throw new Error('Option `regexConstructor` is not provided');
		this.regexps = e.map((a) => {
			if (typeof a != 'string') return a;
			const i = s?.get(a);
			if (i) {
				if (i instanceof RegExp) return i;
				if (r) return null;
				throw i;
			}
			try {
				const l = o(a);
				return (s?.set(a, l), l);
			} catch (l) {
				if ((s?.set(a, l), r)) return null;
				throw l;
			}
		});
	}
	regexps;
	findNextMatchSync(e, n, r) {
		const s = typeof e == 'string' ? e : e.content,
			o = [];
		function a(i, l, c = 0) {
			return {
				index: i,
				captureIndices: l.indices.map((u) =>
					u == null
						? { start: So, end: So, length: 0 }
						: { start: u[0] + c, end: u[1] + c, length: u[1] - u[0] }
				)
			};
		}
		for (let i = 0; i < this.regexps.length; i++) {
			const l = this.regexps[i];
			if (l)
				try {
					l.lastIndex = n;
					const c = l.exec(s);
					if (!c) continue;
					if (c.index === n) return a(i, c, 0);
					o.push([i, c, 0]);
				} catch (c) {
					if (this.options.forgiving) continue;
					throw c;
				}
		}
		if (o.length) {
			const i = Math.min(...o.map((l) => l[1].index));
			for (const [l, c, u] of o) if (c.index === i) return a(l, c, u);
		}
		return null;
	}
}
function Bf(t, e) {
	return Df(t, {
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
function jf(t = {}) {
	const e = Object.assign({ target: 'auto', cache: new Map() }, t);
	return (
		(e.regexConstructor ||= (n) => Bf(n, { target: e.target })),
		{
			createScanner(n) {
				return new Ff(n, e);
			},
			createString(n) {
				return { content: n };
			}
		}
	);
}
const Wa = {
		bash: () => Q(() => import('./Yzrsuije.js'), [], import.meta.url),
		diff: () => Q(() => import('./D97Zzqfu.js'), [], import.meta.url),
		javascript: () => Q(() => import('./BMMyXqK5.js'), [], import.meta.url),
		json: () => Q(() => import('./Cp-IABpG.js'), [], import.meta.url),
		svelte: () => Q(() => import('./C9GXV3gB.js'), __vite__mapDeps([0, 1, 2, 3]), import.meta.url),
		typescript: () => Q(() => import('./DlfHMoPT.js'), [], import.meta.url),
		python: () => Q(() => import('./B6aJPvgy.js'), [], import.meta.url),
		php: () =>
			Q(() => import('./BKs5yQvz.js'), __vite__mapDeps([4, 5, 1, 3, 6, 7, 8, 9]), import.meta.url),
		hcl: () => Q(() => import('./BWvSN4gD.js'), [], import.meta.url),
		yaml: () => Q(() => import('./Buea-lGh.js'), [], import.meta.url),
		rust: () => Q(() => import('./B1yitclQ.js'), [], import.meta.url),
		go: () => Q(() => import('./Dn2_MT6a.js'), [], import.meta.url),
		c: () => Q(() => import('./BIGW1oBm.js'), [], import.meta.url),
		java: () => Q(() => import('./CylS5w8V.js'), [], import.meta.url),
		cpp: () => Q(() => import('./Ck_RvX-X.js'), __vite__mapDeps([10, 11, 8]), import.meta.url),
		csharp: () => Q(() => import('./CHadp7IV.js'), [], import.meta.url),
		html: () => Q(() => import('./JhPuU2gP.js'), __vite__mapDeps([5, 1, 3]), import.meta.url),
		css: () => Q(() => import('./DPfMkruS.js'), [], import.meta.url),
		xml: () => Q(() => import('./BGJmEYvX.js'), __vite__mapDeps([6, 7]), import.meta.url),
		markdown: () => Q(() => import('./B_HjzqPZ.js'), [], import.meta.url),
		sql: () => Q(() => import('./BLtJtn59.js'), [], import.meta.url),
		kotlin: () => Q(() => import('./BdnUsdx6.js'), [], import.meta.url),
		swift: () => Q(() => import('./fve9TYiY.js'), [], import.meta.url),
		scss: () => Q(() => import('./2EtD6e53.js'), __vite__mapDeps([12, 3]), import.meta.url),
		vue: () =>
			Q(() => import('./QfhU5h_1.js'), __vite__mapDeps([13, 3, 1, 2, 9, 5]), import.meta.url),
		ruby: () =>
			Q(
				() => import('./Da1o7VXg.js'),
				__vite__mapDeps([14, 5, 1, 3, 6, 7, 8, 2, 10, 11, 15, 16]),
				import.meta.url
			),
		less: () => Q(() => import('./B1dDrJ26.js'), [], import.meta.url),
		toml: () => Q(() => import('./vGWfd6FD.js'), [], import.meta.url),
		ini: () => Q(() => import('./BEwlwnbL.js'), [], import.meta.url),
		dockerfile: () => Q(() => import('./BcOcwvcX.js'), [], import.meta.url),
		dotenv: () => Q(() => import('./Da5cRb03.js'), [], import.meta.url)
	},
	ns = Object.keys(Wa);
ns.includes('text') || ns.push('text');
const Uf = ns,
	zf = eh({
		themes: [
			Q(() => import('./D7oLnXFd.js'), [], import.meta.url),
			Q(() => import('./Cuk6v7N8.js'), [], import.meta.url)
		],
		langs: Object.entries(Wa).map(([t, e]) => e),
		engine: jf()
	});
class Wf {
	constructor(e, n) {
		((this.opts = e),
			(this.overflow = n),
			zf.then((r) => {
				this.highlighter = r;
			}));
	}
	#e = Ye(null);
	get highlighter() {
		return g(this.#e);
	}
	set highlighter(e) {
		L(this.#e, e, !0);
	}
	highlight(e) {
		return this.highlighter?.codeToHtml(e, {
			lang: this.opts.lang.current,
			themes: { light: 'github-light-default', dark: 'github-dark-default' },
			transformers: [
				{
					pre: (n) => (
						(n.properties.style = ''),
						this.opts.hideLines.current || (n.properties.class += ' line-numbers'),
						n
					),
					line: (n, r) => (
						Vf(r, this.opts.highlight.current) &&
							(n.properties.class = `${n.properties.class} line--highlighted`),
						n
					)
				}
			]
		});
	}
	get code() {
		return this.opts.code.current;
	}
	#t = $(() => this.highlight(this.code));
	get highlighted() {
		return g(this.#t);
	}
	set highlighted(e) {
		L(this.#t, e);
	}
}
function Vf(t, e) {
	if (!e) return !1;
	let n = !1;
	for (const r of e) {
		if (typeof r == 'number') {
			if (t === r) {
				n = !0;
				break;
			}
			continue;
		}
		if (r[0] <= t && t <= r[1]) {
			n = !0;
			break;
		}
	}
	return n;
}
class Hf {
	constructor(e) {
		this.root = e;
	}
	get code() {
		return this.root.opts.code.current;
	}
}
const qf = new Go('code-overflow-state'),
	Va = new Go('code-root-state');
function Kf(t) {
	let e;
	try {
		e = qf.get();
	} catch {}
	return Va.set(new Wf(t, e));
}
function Xf() {
	return new Hf(Va.get());
}
var Zf = I('<div><!> <!></div>');
function Qf(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = S(e, 'variant', 3, 'default'),
		s = S(e, 'lang', 3, 'typescript'),
		o = S(e, 'hideLines', 3, !1),
		a = S(e, 'highlight', 19, () => []),
		i = V(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'variant',
			'lang',
			'code',
			'class',
			'hideLines',
			'highlight',
			'children'
		]);
	const l = Kf({
		code: K.with(() => e.code),
		hideLines: K.with(() => o()),
		highlight: K.with(() => a()),
		lang: K.with(() => s())
	});
	var c = Zf();
	_e(c, (f) => ({ ...i, class: f }), [() => os('p-3', op({ variant: r() }), e.class)]);
	var u = G(c);
	vl(u, () => l.highlighted);
	var d = q(u, 2);
	(W(d, () => e.children ?? J),
		M(c),
		xt(
			c,
			(f) => n(f),
			() => n()
		),
		m(t, c),
		D());
}
class Jf {
	#e = Ye();
	delay;
	timeout = void 0;
	constructor({ delay: e = 500 } = {}) {
		this.delay = e;
	}
	async copy(e) {
		this.timeout && (L(this.#e, void 0), clearTimeout(this.timeout));
		try {
			(await navigator.clipboard.writeText(e),
				L(this.#e, 'success'),
				(this.timeout = setTimeout(() => {
					L(this.#e, void 0);
				}, this.delay)));
		} catch {
			(L(this.#e, 'failure'),
				(this.timeout = setTimeout(() => {
					L(this.#e, void 0);
				}, this.delay)));
		}
		return g(this.#e);
	}
	get copied() {
		return g(this.#e) === 'success';
	}
	get status() {
		return g(this.#e);
	}
}
var Yf = I('<div><!> <span class="sr-only">Copied</span></div>'),
	ep = I('<div><!> <span class="sr-only">Failed to copy</span></div>'),
	tp = I('<div><!> <span class="sr-only">Copy</span></div>'),
	np = I('<!> <!>', 1);
function rp(t, e) {
	O(e, !0);
	const n = 500,
		r = new Jf();
	{
		let s = $(() => (e.children ? 'default' : 'icon')),
			o = $(() => os('flex items-center gap-2', e.class));
		Cn(t, {
			variant: 'ghost',
			get size() {
				return g(s);
			},
			get class() {
				return g(o);
			},
			type: 'button',
			name: 'copy',
			onclick: async () => {
				await r.copy(e.text);
			},
			children: (a, i) => {
				var l = np(),
					c = y(l);
				{
					var u = (h) => {
							var p = Yf(),
								v = G(p);
							(Mo(v, { tabindex: -1 }),
								qe(2),
								M(p),
								_r(
									1,
									p,
									() => yr,
									() => ({ duration: n, start: 0.85 })
								),
								m(h, p));
						},
						d = (h) => {
							var p = x(),
								v = y(p);
							{
								var b = (_) => {
										var k = ep(),
											E = G(k);
										(To(E, { tabindex: -1 }),
											qe(2),
											M(k),
											_r(
												1,
												k,
												() => yr,
												() => ({ duration: n, start: 0.85 })
											),
											m(_, k));
									},
									w = (_) => {
										var k = tp(),
											E = G(k);
										(Oo(E, { tabindex: -1 }),
											qe(2),
											M(k),
											_r(
												1,
												k,
												() => yr,
												() => ({ duration: n, start: 0.85 })
											),
											m(_, k));
									};
								H(
									v,
									(_) => {
										r.status === 'failure' ? _(b) : _(w, !1);
									},
									!0
								);
							}
							m(h, p);
						};
					H(c, (h) => {
						r.status === 'success' ? h(u) : h(d, !1);
					});
				}
				var f = q(c, 2);
				(W(f, () => e.children ?? J), m(a, l));
			},
			$$slots: { default: !0 }
		});
	}
	D();
}
function sp(t, e) {
	O(e, !0);
	const n = Xf();
	{
		let r = $(() => os('absolute top-2 right-2', e.class));
		rp(t, {
			get class() {
				return g(r);
			},
			get text() {
				return n.code;
			}
		});
	}
	D();
}
const op = Ro({
	base: 'not-prose relative h-full overflow-auto rounded-lg border',
	variants: {
		variant: { default: 'border-border bg-card', secondary: 'bg-secondary/50 border-transparent' }
	}
});
function ap(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'portalProps', 'class']);
	var s = x(),
		o = y(s);
	(P(
		o,
		() => Lo,
		(a, i) => {
			i(
				a,
				re(() => e.portalProps, {
					children: (l, c) => {
						var u = x(),
							d = y(u);
						{
							let f = $(() =>
								ce(
									'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--bits-context-menu-content-available-height) min-w-[8rem] origin-(--bits-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
									e.class
								)
							);
							P(
								d,
								() => Vl,
								(h, p) => {
									p(
										h,
										re(
											{
												'data-slot': 'context-menu-content',
												get class() {
													return g(f);
												}
											},
											() => r,
											{
												get ref() {
													return n();
												},
												set ref(v) {
													n(v);
												}
											}
										)
									);
								}
							);
						}
						m(l, u);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		m(t, s),
		D());
}
function ip(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = S(e, 'variant', 3, 'default'),
		s = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'inset', 'variant']);
	var o = x(),
		a = y(o);
	{
		let i = $(() =>
			ce(
				"data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-highlighted:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				e.class
			)
		);
		P(
			a,
			() => Ki,
			(l, c) => {
				c(
					l,
					re(
						{
							'data-slot': 'context-menu-item',
							get 'data-inset'() {
								return e.inset;
							},
							get 'data-variant'() {
								return r();
							},
							get class() {
								return g(i);
							}
						},
						() => s,
						{
							get ref() {
								return n();
							},
							set ref(u) {
								n(u);
							}
						}
					)
				);
			}
		);
	}
	(m(t, o), D());
}
function lp(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	var s = x(),
		o = y(s);
	(P(
		o,
		() => ql,
		(a, i) => {
			i(
				a,
				re({ 'data-slot': 'context-menu-trigger' }, () => r, {
					get ref() {
						return n();
					},
					set ref(l) {
						n(l);
					}
				})
			);
		}
	),
		m(t, s),
		D());
}
const cp = Ul;
var up = I(
	'<div data-slot="table-container" class="relative w-full overflow-x-auto"><table><!></table></div>'
);
function dp(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = up(),
		o = G(s);
	_e(o, (i) => ({ 'data-slot': 'table', class: i, ...r }), [
		() => ce('w-full caption-bottom text-sm', e.class)
	]);
	var a = G(o);
	(W(a, () => e.children ?? J),
		M(o),
		xt(
			o,
			(i) => n(i),
			() => n()
		),
		M(s),
		m(t, s),
		D());
}
var hp = I('<tbody><!></tbody>');
function fp(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = hp();
	_e(s, (a) => ({ 'data-slot': 'table-body', class: a, ...r }), [
		() => ce('[&_tr:last-child]:border-0', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
var pp = I('<td><!></td>');
function Et(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = pp();
	_e(s, (a) => ({ 'data-slot': 'table-cell', class: a, ...r }), [
		() => ce('p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
var gp = I('<th><!></th>');
function Eo(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = gp();
	_e(s, (a) => ({ 'data-slot': 'table-head', class: a, ...r }), [
		() =>
			ce(
				'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0',
				e.class
			)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
var mp = I('<thead><!></thead>');
function vp(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = mp();
	_e(s, (a) => ({ 'data-slot': 'table-header', class: a, ...r }), [
		() => ce('[&_tr]:border-b', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
var _p = I('<tr><!></tr>');
function Zn(t, e) {
	O(e, !0);
	let n = S(e, 'ref', 15, null),
		r = V(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var s = _p();
	_e(s, (a) => ({ 'data-slot': 'table-row', class: a, ...r }), [
		() => ce('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', e.class)
	]);
	var o = G(s);
	(W(o, () => e.children ?? J),
		M(s),
		xt(
			s,
			(a) => n(a),
			() => n()
		),
		m(t, s),
		D());
}
const yp = [
		'.html',
		'.htm',
		'.css',
		'.scss',
		'.sass',
		'.less',
		'.js',
		'.mjs',
		'.cjs',
		'.ts',
		'.tsx',
		'.jsx',
		'.vue',
		'.svelte',
		'.php',
		'.py',
		'.rb',
		'.java',
		'.go',
		'.rs',
		'.c',
		'.cpp',
		'.cs',
		'.swift',
		'.kt',
		'.env',
		'.json',
		'.jsonc',
		'.xml',
		'.yaml',
		'.yml',
		'.toml',
		'.ini',
		'.env',
		'.md',
		'.sql',
		'.sh',
		'.hcl',
		'.tf'
	],
	Ha = ['Dockerfile', 'Taskfile', 'Makefile', 'Caddyfile', '.env'];
function qa(t) {
	const e = t.lastIndexOf('.');
	return e === -1 || e === 0 || e === t.length - 1 ? t : t.substring(e + 1);
}
function Ao(t) {
	return yp.includes(`.${qa(t)}`) || Ha.includes(t);
}
function bp(t) {
	const e = qa(t.key);
	if (e === t.key)
		for (const n of Ha) {
			const r = Uf.find((s) => s === n.toLowerCase());
			if (r) return r;
		}
	switch (e) {
		case 'js':
		case 'mjs':
		case 'cjs':
			return 'javascript';
		case 'ts':
		case 'tsx':
			return 'typescript';
		case 'py':
			return 'python';
		case 'java':
			return 'java';
		case 'c':
			return 'c';
		case 'cpp':
			return 'cpp';
		case 'cs':
			return 'csharp';
		case 'go':
			return 'go';
		case 'rs':
			return 'rust';
		case 'php':
			return 'php';
		case 'html':
		case 'htm':
			return 'html';
		case 'css':
			return 'css';
		case 'json':
		case 'jsonc':
			return 'json';
		case 'xml':
			return 'xml';
		case 'yaml':
		case 'yml':
			return 'yaml';
		case 'md':
			return 'markdown';
		case 'sql':
			return 'sql';
		case 'sh':
			return 'bash';
		case 'rb':
			return 'ruby';
		case 'swift':
			return 'swift';
		case 'kt':
			return 'kotlin';
		case 'vue':
			return 'vue';
		case 'svelte':
			return 'svelte';
		case 'scss':
		case 'sass':
			return 'scss';
		case 'less':
			return 'less';
		case 'toml':
			return 'toml';
		case 'ini':
			return 'ini';
		case 'env':
			return 'dotenv';
		case 'hcl':
		case 'tf':
			return 'hcl';
		default:
			return 'text';
	}
}
const Po = (t) => {
	var e = x(),
		n = y(e);
	(P(
		n,
		() => Zn,
		(r, s) => {
			s(r, {
				children: (o, a) => {
					var i = x(),
						l = y(i);
					(P(
						l,
						() => Et,
						(c, u) => {
							u(c, {
								colspan: 12,
								class: 'h-24 text-center',
								children: (d, f) => {
									qe();
									var h = wt('No results.');
									m(d, h);
								},
								$$slots: { default: !0 }
							});
						}
					),
						m(o, i));
				},
				$$slots: { default: !0 }
			});
		}
	),
		m(t, e));
};
var wp = I('<!> ', 1),
	Cp = I('<!> <span class="sr-only">Open menu</span>', 1),
	kp = I('<div class="flex w-full items-center justify-end"><!></div>'),
	xp = I('<!> <!> <!>', 1),
	Sp = I('<!> <a> </a>', 1),
	Ep = (t, e, n) => e(g(n)),
	Ap = I('<span class="text-xs"> </span>'),
	Pp = I('<div><!></div>'),
	Ip = I('<button class="flex items-center gap-2"><!> <div><p> </p></div> <!></button>'),
	Rp = I('<div class="flex items-center gap-2"><!></div>'),
	$p = I('<!> <!>', 1),
	Np = I('<p> </p>'),
	Lp = I('<!> <span class="sr-only">Open menu</span>', 1),
	Tp = I('<!> ', 1),
	Mp = I('<!> <!>', 1),
	Op = I('<div class="flex w-full items-center justify-end"><!></div>'),
	Dp = I('<!> <!> <!> <!> <!> <!>', 1),
	Gp = I('<!> ', 1),
	Fp = I('<div class="w-full"><!></div>'),
	Bp = I('<div class="ml-auto max-w-xl"><div class="flex items-center gap-2 pb-5"></div></div>'),
	jp = I('<div class="flex w-full items-center gap-2 pb-5"><!></div>'),
	Up = I('<!> <!>', 1),
	zp = I('<!> <!>', 1),
	Wp = I('<!> <!>', 1),
	Vp = I('<li> </li>'),
	Hp = I('<!> <!>', 1),
	qp = I('<!> <div class="prose"><ul></ul></div> <!>', 1),
	Kp = I('<span> </span> <!>', 1),
	Xp = I('<!> <!>', 1),
	Zp = I('Open in new tab <!>', 1),
	Qp = I('<img class="h-full max-w-full rounded-md object-contain"/>'),
	Jp = I(
		'<div class="flex justify-between gap-5"><!> <div class="pr-5"><!></div></div> <div class="flex h-[50vh] w-full items-center justify-center overflow-hidden"><!></div>',
		1
	),
	Yp = I('<!>   <div class="overflow-hidden rounded-lg border"><!></div> <!> <!>', 1);
function Ig(t, e) {
	O(e, !0);
	const [n, r] = ai(),
		s = () => ws(al, '$uploadedItems', n),
		o = () => ws(il, '$uploadingItems', n),
		a = (N, Y = J) => {
			var oe = x(),
				me = y(oe);
			(Ot(
				me,
				17,
				() => fe,
				Dt,
				(X, ue) => {
					var j = x();
					const be = $(() => g(ue).icon);
					var Ge = y(j);
					(P(
						Ge,
						() => ip,
						(st, Ze) => {
							Ze(st, {
								onclick: () => g(ue).action(Y()),
								get disabled() {
									return g(ue).disabled;
								},
								children: (we, xe) => {
									var Se = wp(),
										Ee = y(Se);
									P(
										Ee,
										() => g(be),
										(he, ie) => {
											ie(he, {});
										}
									);
									var se = q(Ee);
									(Be(() => He(se, ` ${g(ue).title ?? ''}`)), m(we, Se));
								},
								$$slots: { default: !0 }
							});
						}
					),
						m(X, j));
				}
			),
				m(N, oe));
		},
		i = (N) => {
			var Y = x(),
				oe = y(Y);
			(Ot(
				oe,
				17,
				() => Array(tt),
				Dt,
				(me, X) => {
					var ue = x(),
						j = y(ue);
					(P(
						j,
						() => Zn,
						(be, Ge) => {
							Ge(be, {
								children: (st, Ze) => {
									var we = xp(),
										xe = y(we);
									P(
										xe,
										() => Et,
										(se, he) => {
											he(se, {
												colspan: 1,
												children: (ie, We) => {
													Cr(ie, { disabled: !0 });
												},
												$$slots: { default: !0 }
											});
										}
									);
									var Se = q(xe, 2);
									P(
										Se,
										() => Et,
										(se, he) => {
											he(se, {
												colspan: 10,
												class: 'text-center',
												children: (ie, We) => {
													Xl(ie, { class: 'h-[30px] w-full rounded-sm' });
												},
												$$slots: { default: !0 }
											});
										}
									);
									var Ee = q(Se, 2);
									(P(
										Ee,
										() => Et,
										(se, he) => {
											he(se, {
												colspan: 1,
												class: 'w-4',
												children: (ie, We) => {
													var ae = kp(),
														ee = G(ae);
													(Cn(ee, {
														variant: 'ghost',
														size: 'icon',
														disabled: !0,
														children: (ne, de) => {
															var T = Cp(),
																U = y(T);
															(Is(U, {}), qe(2), m(ne, T));
														},
														$$slots: { default: !0 }
													}),
														M(ae),
														m(ie, ae));
												},
												$$slots: { default: !0 }
											});
										}
									),
										m(st, we));
								},
								$$slots: { default: !0 }
							});
						}
					),
						m(me, ue));
				}
			),
				m(N, Y));
		},
		l = (N, Y = J) => {
			var oe = x();
			const me = $(() => Ao(Y().key)),
				X = $(() => ct(Y())),
				ue = $(() => !g(X) && Y().size === 0 && !s()[Y().key]),
				j = $(() => s()[Y().key] ?? Y());
			var be = y(oe);
			(P(
				be,
				() => Zn,
				(Ge, st) => {
					st(Ge, {
						children: (Ze, we) => {
							var xe = Dp(),
								Se = y(xe);
							P(
								Se,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										class: 'w-4',
										children: (ne, de) => {
											{
												let T = $(() => De(g(j)));
												Cr(ne, {
													get checked() {
														return g(T);
													},
													onCheckedChange: (U) => {
														((g(h)[g(j).key] = U),
															e.data.list.filter((Z) => g(h)[Z.key] === !0).length > 1
																? L(p, !1)
																: L(p, !0));
													}
												});
											}
										},
										$$slots: { default: !0 }
									});
								}
							);
							var Ee = q(Se, 2);
							P(
								Ee,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										colspan: 7,
										children: (ne, de) => {
											var T = x(),
												U = y(T);
											(P(
												U,
												() => cp,
												(z, Z) => {
													Z(z, {
														children: (pe, Fe) => {
															var Ae = $p(),
																Pe = y(Ae);
															P(
																Pe,
																() => lp,
																(ot, ut) => {
																	ut(ot, {
																		style: 'display: contents;',
																		children: (Ie, Pt) => {
																			var dt = Rp(),
																				Tt = G(dt);
																			{
																				var Mt = (vt) => {
																						var _t = Sp();
																						const yt = $(() => g(j).key.replace('/', ''));
																						var Yt = y(_t);
																						{
																							let It = $(() => ce(ye, 'text-indigo-600'));
																							ol(Yt, {
																								get class() {
																									return g(It);
																								},
																								fill: '#1447e6'
																							});
																						}
																						var jt = q(Yt, 2),
																							Ut = G(jt, !0);
																						(M(jt),
																							Be(
																								(It) => {
																									(Fn(jt, 'href', It), He(Ut, g(yt)));
																								},
																								[
																									() =>
																										ml('/browse/[...path]', {
																											path: Vt.params.path
																												? [Vt.params.path, g(yt)]
																												: [g(yt)]
																										})
																								]
																							),
																							m(vt, _t));
																					},
																					Qe = (vt) => {
																						var _t = Ip();
																						_t.__click = [Ep, Te, j];
																						var yt = G(_t);
																						{
																							var Yt = (Je) => {
																									var bt = Pp(),
																										_n = G(bt);
																									{
																										var yn = (Ve) => {
																												var Wt = Ap(),
																													en = G(Wt);
																												(M(Wt),
																													Be(
																														(bn) => He(en, `${bn ?? ''}%`),
																														[() => Math.round(o()[g(j).key] ?? 0)]
																													),
																													m(Ve, Wt));
																											},
																											zt = (Ve) => {
																												To(Ve, { class: 'h-4 w-4 text-red-600' });
																											};
																										H(_n, (Ve) => {
																											o()[g(j).key] && !Number.isNaN(o()[g(j).key])
																												? Ve(yn)
																												: Ve(zt, !1);
																										});
																									}
																									(M(bt), m(Je, bt));
																								},
																								jt = (Je) => {
																									var bt = x(),
																										_n = y(bt);
																									{
																										var yn = (Ve) => {
																												var Wt = x(),
																													en = y(Wt);
																												{
																													var bn = (tn) => {
																															{
																																let On = $(() =>
																																	ce(ye, 'text-red-600')
																																);
																																xl(tn, {
																																	get class() {
																																		return g(On);
																																	}
																																});
																															}
																														},
																														Xa = (tn) => {
																															var On = x(),
																																Za = y(On);
																															{
																																var Qa = (nn) => {
																																		{
																																			let Dn = $(() =>
																																				ce(ye, 'text-pink-400')
																																			);
																																			kl(nn, {
																																				get class() {
																																					return g(Dn);
																																				}
																																			});
																																		}
																																	},
																																	Ja = (nn) => {
																																		var Dn = x(),
																																			Ya = y(Dn);
																																		{
																																			var ei = (rn) => {
																																					{
																																						let Gn = $(() =>
																																							ce(
																																								ye,
																																								'text-orange-400'
																																							)
																																						);
																																						Cl(rn, {
																																							get class() {
																																								return g(Gn);
																																							}
																																						});
																																					}
																																				},
																																				ti = (rn) => {
																																					var Gn = x(),
																																						ni = y(Gn);
																																					{
																																						var ri = (sn) => {
																																								{
																																									let oi = $(() =>
																																										ce(
																																											ye,
																																											'text-green-400'
																																										)
																																									);
																																									wl(sn, {
																																										get class() {
																																											return g(oi);
																																										}
																																									});
																																								}
																																							},
																																							si = (sn) => {
																																								Ls(sn, {
																																									class: ye
																																								});
																																							};
																																						H(
																																							ni,
																																							(sn) => {
																																								g(me)
																																									? sn(ri)
																																									: sn(si, !1);
																																							},
																																							!0
																																						);
																																					}
																																					m(rn, Gn);
																																				};
																																			H(
																																				Ya,
																																				(rn) => {
																																					g(
																																						j
																																					).contentType.startsWith(
																																						'image'
																																					)
																																						? rn(ei)
																																						: rn(ti, !1);
																																				},
																																				!0
																																			);
																																		}
																																		m(nn, Dn);
																																	};
																																H(
																																	Za,
																																	(nn) => {
																																		g(j).contentType.startsWith(
																																			'audio'
																																		)
																																			? nn(Qa)
																																			: nn(Ja, !1);
																																	},
																																	!0
																																);
																															}
																															m(tn, On);
																														};
																													H(en, (tn) => {
																														g(j).contentType.includes(
																															'application/pdf'
																														)
																															? tn(bn)
																															: tn(Xa, !1);
																													});
																												}
																												m(Ve, Wt);
																											},
																											zt = (Ve) => {
																												Ls(Ve, { class: ye });
																											};
																										H(
																											_n,
																											(Ve) => {
																												g(j).contentType ? Ve(yn) : Ve(zt, !1);
																											},
																											!0
																										);
																									}
																									m(Je, bt);
																								};
																							H(yt, (Je) => {
																								g(ue) ? Je(Yt) : Je(jt, !1);
																							});
																						}
																						var Ut = q(yt, 2),
																							It = G(Ut),
																							Tn = G(It, !0);
																						(M(It), M(Ut));
																						var Mn = q(Ut, 2);
																						{
																							var mr = (Je) => {
																								var bt = x(),
																									_n = y(bt);
																								{
																									var yn = (zt) => {
																										wr(zt, {
																											variant: 'outline',
																											class: 'text-muted-foreground px-1.5 text-xs',
																											children: (Ve, Wt) => {
																												qe();
																												var en = wt();
																												(Be(
																													(bn) => He(en, bn),
																													[
																														() =>
																															hl(
																																Number.parseFloat(
																																	g(j).metadata.musicduration
																																)
																															)
																													]
																												),
																													m(Ve, en));
																											},
																											$$slots: { default: !0 }
																										});
																									};
																									H(_n, (zt) => {
																										g(j).metadata.musicduration && zt(yn);
																									});
																								}
																								m(Je, bt);
																							};
																							H(Mn, (Je) => {
																								g(j).metadata?.category === 'music' && Je(mr);
																							});
																						}
																						(M(_t),
																							Be(
																								(Je) => {
																									((_t.disabled = g(ue)),
																										Fn(It, 'title', g(j).key),
																										mi(It, 1, Je),
																										He(Tn, g(j).key));
																								},
																								[
																									() =>
																										gi(
																											ce(
																												'max-w-72 truncate',
																												g(ue)
																													? 'text-gray-500 dark:text-gray-300'
																													: ''
																											)
																										)
																								]
																							),
																							m(vt, _t));
																					};
																				H(Tt, (vt) => {
																					g(X) ? vt(Mt) : vt(Qe, !1);
																				});
																			}
																			(M(dt), m(Ie, dt));
																		},
																		$$slots: { default: !0 }
																	});
																}
															);
															var mt = q(Pe, 2);
															(P(
																mt,
																() => ap,
																(ot, ut) => {
																	ut(ot, {
																		class: 'w-52',
																		children: (Ie, Pt) => {
																			a(Ie, () => g(j));
																		},
																		$$slots: { default: !0 }
																	});
																}
															),
																m(pe, Ae));
														},
														$$slots: { default: !0 }
													});
												}
											),
												m(ne, T));
										},
										$$slots: { default: !0 }
									});
								}
							);
							var se = q(Ee, 2);
							P(
								se,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										colspan: 1,
										class: 'w-32',
										children: (ne, de) => {
											wr(ne, {
												variant: 'outline',
												class: 'text-muted-foreground px-1.5',
												children: (T, U) => {
													qe();
													var z = wt();
													(Be(
														(Z) => He(z, Z),
														[
															() =>
																g(j).metadata?.category ? ul(g(j).metadata.category) : 'No category'
														]
													),
														m(T, z));
												},
												$$slots: { default: !0 }
											});
										},
										$$slots: { default: !0 }
									});
								}
							);
							var he = q(se, 2);
							P(
								he,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										colspan: 1,
										class: 'w-32',
										children: (ne, de) => {
											var T = Np(),
												U = G(T, !0);
											(M(T), Be((z) => He(U, z), [() => Ts(g(j).size) ?? '-']), m(ne, T));
										},
										$$slots: { default: !0 }
									});
								}
							);
							var ie = q(he, 2);
							P(
								ie,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										colspan: 1,
										class: 'w-32',
										children: (ne, de) => {
											var T = x(),
												U = y(T);
											{
												var z = (Z) => {
													var pe = wt();
													(Be((Fe) => He(pe, Fe), [() => dl(g(j).lastModified)]), m(Z, pe));
												};
												H(U, (Z) => {
													g(j).lastModified && Z(z);
												});
											}
											m(ne, T);
										},
										$$slots: { default: !0 }
									});
								}
							);
							var We = q(ie, 2);
							(P(
								We,
								() => Et,
								(ae, ee) => {
									ee(ae, {
										colspan: 1,
										class: 'w-4',
										children: (ne, de) => {
											var T = Op(),
												U = G(T);
											(P(
												U,
												() => tl,
												(z, Z) => {
													Z(z, {
														children: (pe, Fe) => {
															var Ae = Mp(),
																Pe = y(Ae);
															{
																const ot = (ut, Ie) => {
																	Cn(
																		ut,
																		re({ variant: 'ghost', size: 'icon' }, () => Ie?.().props, {
																			children: (dt, Tt) => {
																				var Mt = Lp(),
																					Qe = y(Mt);
																				(Is(Qe, {}), qe(2), m(dt, Mt));
																			},
																			$$slots: { default: !0 }
																		})
																	);
																};
																P(
																	Pe,
																	() => nl,
																	(ut, Ie) => {
																		Ie(ut, {
																			class:
																				'data-[state=open]:bg-muted text-muted-foreground flex size-8',
																			child: ot,
																			$$slots: { child: !0 }
																		});
																	}
																);
															}
															var mt = q(Pe, 2);
															(P(
																mt,
																() => rl,
																(ot, ut) => {
																	ut(ot, {
																		align: 'end',
																		children: (Ie, Pt) => {
																			var dt = x(),
																				Tt = y(dt);
																			(Ot(
																				Tt,
																				17,
																				() => fe,
																				Dt,
																				(Mt, Qe) => {
																					var vt = x();
																					const _t = $(() => g(Qe).icon);
																					var yt = y(vt);
																					(P(
																						yt,
																						() => sl,
																						(Yt, jt) => {
																							jt(Yt, {
																								onclick: () => g(Qe).action(g(j)),
																								get disabled() {
																									return g(Qe).disabled;
																								},
																								children: (Ut, It) => {
																									var Tn = Tp(),
																										Mn = y(Tn);
																									P(
																										Mn,
																										() => g(_t),
																										(Je, bt) => {
																											bt(Je, {});
																										}
																									);
																									var mr = q(Mn);
																									(Be(() => He(mr, ` ${g(Qe).title ?? ''}`)),
																										m(Ut, Tn));
																								},
																								$$slots: { default: !0 }
																							});
																						}
																					),
																						m(Mt, vt));
																				}
																			),
																				m(Ie, dt));
																		},
																		$$slots: { default: !0 }
																	});
																}
															),
																m(pe, Ae));
														},
														$$slots: { default: !0 }
													});
												}
											),
												M(T),
												m(ne, T));
										},
										$$slots: { default: !0 }
									});
								}
							),
								m(Ze, xe));
						},
						$$slots: { default: !0 }
					});
				}
			),
				m(N, oe));
		};
	let c = Ye(!1),
		u = Ye(!1),
		d = Ye(!1),
		f = Ye(!1),
		h = Ye(xs({})),
		p = Ye(!1),
		v = Ye(''),
		b = Ye(void 0),
		w = Ye(!1),
		_ = Ye(xs([])),
		k = Ye(!1),
		E = Ye(null);
	async function R() {
		(L(
			_,
			e.data.list.filter((N) => N.key.toLowerCase().includes(g(v))),
			!0
		),
			L(w, !1));
	}
	const A = () => {
		if (g(v) === '') {
			(L(_, [], !0), L(w, !1));
			return;
		}
		(L(w, !0),
			clearTimeout(g(b)),
			L(
				b,
				setTimeout(async () => {
					await R();
				}, 750),
				!0
			));
	};
	async function te() {
		if (Object.keys(g(h)).length === 0) return;
		const N = [];
		for (const Y of Object.keys(g(h))) {
			L(f, !0);
			const oe = Vt.params.path ? `${Vt.params.path}/${Y}` : Y;
			if (oe.endsWith('/')) {
				const me = vr
					.DELETE('/api/v1/storage/objects/folder', {
						params: { query: { path: oe.slice(0, -1) } }
					})
					.then(async ({ error: X }) => {
						if (X) throw (console.error(X), L(f, !1), X);
						(L(d, !1), L(f, !1));
					});
				N.push(me);
			} else {
				const me = vr
					.DELETE('/api/v1/storage/objects/item', { params: { query: { item: oe } } })
					.then(async ({ error: X }) => {
						if (X) throw (console.error(X), L(f, !1), X);
						(L(d, !1), L(f, !1));
					});
				N.push(me);
			}
		}
		br.promise(
			Promise.all(N).finally(async () => {
				(L(h, {}, !0), await vi());
			}),
			{ loading: 'Deleting items', success: 'Items deleted', error: 'Failed to delete items' }
		);
	}
	const fe = [
			{ title: 'Rename', icon: El, action: () => [], disabled: !0 },
			{ title: 'Move', icon: Ms, action: () => [], disabled: !0 },
			{ title: 'Duplicate', icon: Oo, action: () => [], disabled: !0 },
			{ title: 'Star', icon: Rs, action: () => [], disabled: !0 },
			{ title: 'Share', icon: Os, action: () => [], disabled: !0 },
			{
				title: 'Delete',
				icon: $s,
				action: async (N) => {
					(L(p, !0), L(h, {}, !0), (g(h)[N.key] = !0), L(d, !0));
				}
			}
		],
		Le = [
			{ title: 'Move', icon: Ms, variant: 'outline', action: () => [] },
			{ title: 'Star', icon: Rs, variant: 'outline', action: () => [] },
			{ title: 'Share', icon: Os, variant: 'outline', action: () => [] },
			{
				title: 'Delete',
				icon: $s,
				variant: 'destructive',
				action: async () => {
					(L(p, !1), L(d, !0));
				}
			}
		],
		it = [
			{ title: 'Name', colSpan: 7 },
			{ title: 'Category', colSpan: 1 },
			{ title: 'Size', colSpan: 1 },
			{ title: 'Last Modified', colSpan: 1 },
			{ title: 'Actions', colSpan: 1, class: 'w-4 text-right' }
		];
	async function Te(N) {
		return br.promise(Me(N), { loading: `Opening "${N.key}"`, error: `Failed to open "${N.key}"` });
	}
	async function Me(N) {
		Cs(Ns, null);
		const Y = Vt.params.path ? `${Vt.params.path}/${N.key}` : N.key,
			{ data: oe, error: me } = await vr.GET('/api/v1/storage/objects/url', {
				params: { query: { item: Y } }
			});
		if (me) throw (console.error(me), me);
		const X = `${Vt.url.origin}/p?url=${oe}`;
		if (Ao(N.key)) {
			const j = await fetch(X);
			if (!j.ok) {
				br.error('Failed to open code file.', { description: j.statusText });
				return;
			}
			const be = await j.text();
			(L(E, { item: N, src: X, content: be, type: 'code', language: bp(N) }, !0), L(k, !0));
			return;
		}
		if (N.contentType?.startsWith('image')) {
			(L(E, { item: N, src: X, type: 'image' }, !0), L(k, !0));
			return;
		}
		if (N.contentType?.startsWith('audio')) {
			Cs(Ns, { title: N.key, source: X });
			return;
		}
		const ue = window.open(X, '_blank');
		ue && ue.focus();
	}
	function lt(N) {
		(L(p, !1),
			e.data.list.forEach((Y) => {
				g(h)[Y.key] = N;
			}));
	}
	hi(() => {
		(L(c, e.data.count > 0 && e.data.list.every((N) => g(h)[N.key]), !0),
			L(u, e.data.count > 0 && e.data.list.some((N) => g(h)[N.key] === !0) && !g(c), !0),
			e.data.count === 0 && L(h, {}, !0));
	});
	let Oe = $(() => (g(u) || g(c)) && !g(p));
	function De(N) {
		return g(h)[N.key] || !1;
	}
	function ct(N) {
		return N.key.endsWith('/');
	}
	const ye = 'h-5 w-5',
		tt = 20;
	var Ne = Yp(),
		Ke = y(Ne);
	{
		var Xe = (N) => {
				var Y = Bp(),
					oe = G(Y);
				(Ot(
					oe,
					21,
					() => Le,
					Dt,
					(me, X) => {
						var ue = Fp();
						const j = $(() => g(X).icon);
						var be = G(ue);
						(Cn(be, {
							get variant() {
								return g(X).variant;
							},
							onclick: () => g(X).action(),
							class: 'w-full text-xs',
							children: (Ge, st) => {
								var Ze = Gp(),
									we = y(Ze);
								P(
									we,
									() => g(j),
									(Se, Ee) => {
										Ee(Se, { class: 'h-5 w-4' });
									}
								);
								var xe = q(we);
								(Be(() => He(xe, ` ${g(X).title ?? ''}`)), m(Ge, Ze));
							},
							$$slots: { default: !0 }
						}),
							M(ue),
							m(me, ue));
					}
				),
					M(oe),
					M(Y),
					m(N, Y));
			},
			ze = (N) => {
				var Y = jp(),
					oe = G(Y);
				(el(oe, {
					type: 'search',
					placeholder: 'Search',
					onkeyup: () => {
						A();
					},
					get value() {
						return g(v);
					},
					set value(me) {
						L(v, me, !0);
					}
				}),
					M(Y),
					m(N, Y));
			};
		H(Ke, (N) => {
			g(Oe) ? N(Xe) : N(ze, !1);
		});
	}
	var nt = q(Ke, 2),
		rt = G(nt);
	(P(
		rt,
		() => dp,
		(N, Y) => {
			Y(N, {
				children: (oe, me) => {
					var X = zp(),
						ue = y(X);
					P(
						ue,
						() => vp,
						(be, Ge) => {
							Ge(be, {
								class: 'bg-muted sticky top-0 z-10',
								children: (st, Ze) => {
									var we = x(),
										xe = y(we);
									(P(
										xe,
										() => Zn,
										(Se, Ee) => {
											Ee(Se, {
												children: (se, he) => {
													var ie = Up(),
														We = y(ie);
													P(
														We,
														() => Eo,
														(ee, ne) => {
															ne(ee, {
																colspan: 1,
																class: 'w-4',
																children: (de, T) => {
																	Cr(de, {
																		onCheckedChange: (U) => lt(U),
																		get checked() {
																			return g(c);
																		},
																		get indeterminate() {
																			return g(u);
																		},
																		set indeterminate(U) {
																			L(u, U, !0);
																		}
																	});
																},
																$$slots: { default: !0 }
															});
														}
													);
													var ae = q(We, 2);
													(Ot(
														ae,
														17,
														() => it,
														Dt,
														(ee, ne) => {
															var de = x(),
																T = y(de);
															{
																let U = $(() => ce(g(ne).class));
																P(
																	T,
																	() => Eo,
																	(z, Z) => {
																		Z(z, {
																			get colspan() {
																				return g(ne).colSpan;
																			},
																			get class() {
																				return g(U);
																			},
																			children: (pe, Fe) => {
																				qe();
																				var Ae = wt();
																				(Be(() => He(Ae, g(ne).title)), m(pe, Ae));
																			},
																			$$slots: { default: !0 }
																		});
																	}
																);
															}
															m(ee, de);
														}
													),
														m(se, ie));
												},
												$$slots: { default: !0 }
											});
										}
									),
										m(st, we));
								},
								$$slots: { default: !0 }
							});
						}
					);
					var j = q(ue, 2);
					(P(
						j,
						() => fp,
						(be, Ge) => {
							Ge(be, {
								children: (st, Ze) => {
									var we = x(),
										xe = y(we);
									{
										var Se = (se) => {
												i(se);
											},
											Ee = (se) => {
												var he = x(),
													ie = y(he);
												{
													var We = (ee) => {
															var ne = x(),
																de = y(ne);
															{
																var T = (z) => {
																		var Z = x(),
																			pe = y(Z);
																		(Ot(
																			pe,
																			17,
																			() => g(_),
																			Dt,
																			(Fe, Ae) => {
																				l(Fe, () => g(Ae));
																			}
																		),
																			m(z, Z));
																	},
																	U = (z) => {
																		Po(z);
																	};
																H(de, (z) => {
																	g(_).length > 0 ? z(T) : z(U, !1);
																});
															}
															m(ee, ne);
														},
														ae = (ee) => {
															var ne = x(),
																de = y(ne);
															{
																var T = (z) => {
																		var Z = x(),
																			pe = y(Z);
																		(Ot(
																			pe,
																			17,
																			() => e.data.list,
																			Dt,
																			(Fe, Ae) => {
																				l(Fe, () => g(Ae));
																			}
																		),
																			m(z, Z));
																	},
																	U = (z) => {
																		Po(z);
																	};
																H(
																	de,
																	(z) => {
																		e.data.count > 0 ? z(T) : z(U, !1);
																	},
																	!0
																);
															}
															m(ee, ne);
														};
													H(
														ie,
														(ee) => {
															g(v) ? ee(We) : ee(ae, !1);
														},
														!0
													);
												}
												m(se, he);
											};
										H(xe, (se) => {
											g(w) ? se(Se) : se(Ee, !1);
										});
									}
									m(st, we);
								},
								$$slots: { default: !0 }
							});
						}
					),
						m(oe, X));
				},
				$$slots: { default: !0 }
			});
		}
	),
		M(nt));
	var bs = q(nt, 2);
	P(
		bs,
		() => ic,
		(N, Y) => {
			Y(N, {
				get open() {
					return g(d);
				},
				set open(oe) {
					L(d, oe, !0);
				},
				children: (oe, me) => {
					var X = x(),
						ue = y(X);
					(P(
						ue,
						() => ec,
						(j, be) => {
							be(j, {
								class: 'max-h-[70%] overflow-y-auto pb-16',
								children: (Ge, st) => {
									var Ze = qp(),
										we = y(Ze);
									P(
										we,
										() => oc,
										(se, he) => {
											he(se, {
												children: (ie, We) => {
													var ae = Wp(),
														ee = y(ae);
													P(
														ee,
														() => ac,
														(de, T) => {
															T(de, {
																children: (U, z) => {
																	qe();
																	var Z = wt('Are you absolutely sure?');
																	m(U, Z);
																},
																$$slots: { default: !0 }
															});
														}
													);
													var ne = q(ee, 2);
													(P(
														ne,
														() => tc,
														(de, T) => {
															T(de, {
																children: (U, z) => {
																	qe();
																	var Z =
																		wt(`This action cannot be undone. This will permanently delete the following items from your
				storage device.`);
																	m(U, Z);
																},
																$$slots: { default: !0 }
															});
														}
													),
														m(ie, ae));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var xe = q(we, 2),
										Se = G(xe);
									(Ot(
										Se,
										21,
										() => Object.keys(g(h)),
										Dt,
										(se, he) => {
											var ie = Vp(),
												We = G(ie, !0);
											(M(ie), Be(() => He(We, g(he))), m(se, ie));
										}
									),
										M(Se),
										M(xe));
									var Ee = q(xe, 2);
									(P(
										Ee,
										() => rc,
										(se, he) => {
											he(se, {
												class: 'fixed bottom-5 w-full px-10',
												children: (ie, We) => {
													var ae = Hp(),
														ee = y(ae);
													P(
														ee,
														() => Ql,
														(de, T) => {
															T(de, {
																children: (U, z) => {
																	qe();
																	var Z = wt('Cancel');
																	m(U, Z);
																},
																$$slots: { default: !0 }
															});
														}
													);
													var ne = q(ee, 2);
													(P(
														ne,
														() => Zl,
														(de, T) => {
															T(de, {
																onclick: () => te(),
																get disabled() {
																	return g(f);
																},
																class: 'bg-red-600',
																children: (U, z) => {
																	var Z = x(),
																		pe = y(Z);
																	{
																		var Fe = (Pe) => {
																				gl(Pe, {});
																			},
																			Ae = (Pe) => {
																				var mt = wt('Continue');
																				m(Pe, mt);
																			};
																		H(pe, (Pe) => {
																			g(f) ? Pe(Fe) : Pe(Ae, !1);
																		});
																	}
																	m(U, Z);
																},
																$$slots: { default: !0 }
															});
														}
													),
														m(ie, ae));
												},
												$$slots: { default: !0 }
											});
										}
									),
										m(Ge, Ze));
								},
								$$slots: { default: !0 }
							});
						}
					),
						m(oe, X));
				},
				$$slots: { default: !0 }
			});
		}
	);
	var Ka = q(bs, 2);
	(P(
		Ka,
		() => Yi,
		(N, Y) => {
			Y(N, {
				get open() {
					return g(k);
				},
				set open(oe) {
					L(k, oe, !0);
				},
				children: (oe, me) => {
					var X = x(),
						ue = y(X);
					{
						var j = (be) => {
							var Ge = x(),
								st = y(Ge);
							(P(
								st,
								() => Xi,
								(Ze, we) => {
									we(Ze, {
										class: 'max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl',
										children: (xe, Se) => {
											var Ee = Jp(),
												se = y(Ee),
												he = G(se);
											P(
												he,
												() => Zi,
												(T, U) => {
													U(T, {
														children: (z, Z) => {
															var pe = Xp(),
																Fe = y(pe);
															P(
																Fe,
																() => Qi,
																(Pe, mt) => {
																	mt(Pe, {
																		children: (ot, ut) => {
																			qe();
																			var Ie = wt();
																			(Be(() => He(Ie, g(E).item.key)), m(ot, Ie));
																		},
																		$$slots: { default: !0 }
																	});
																}
															);
															var Ae = q(Fe, 2);
															(P(
																Ae,
																() => Ji,
																(Pe, mt) => {
																	mt(Pe, {
																		class: 'flex items-center gap-2',
																		children: (ot, ut) => {
																			var Ie = Kp(),
																				Pt = y(Ie),
																				dt = G(Pt, !0);
																			M(Pt);
																			var Tt = q(Pt, 2);
																			{
																				var Mt = (Qe) => {
																					wr(Qe, {
																						variant: 'outline',
																						class: 'text-xs',
																						children: (vt, _t) => {
																							qe();
																							var yt = wt();
																							(Be(() => He(yt, g(E).language)), m(vt, yt));
																						},
																						$$slots: { default: !0 }
																					});
																				};
																				H(Tt, (Qe) => {
																					g(E).language && Qe(Mt);
																				});
																			}
																			(Be((Qe) => He(dt, Qe), [() => Ts(g(E).item.size) ?? '-']),
																				m(ot, Ie));
																		},
																		$$slots: { default: !0 }
																	});
																}
															),
																m(z, pe));
														},
														$$slots: { default: !0 }
													});
												}
											);
											var ie = q(he, 2),
												We = G(ie);
											(Cn(We, {
												type: 'button',
												variant: 'outline',
												size: 'sm',
												get href() {
													return g(E).src;
												},
												target: '_blank',
												children: (T, U) => {
													qe();
													var z = Zp(),
														Z = q(y(z));
													(bl(Z, {}), m(T, z));
												},
												$$slots: { default: !0 }
											}),
												M(ie),
												M(se));
											var ae = q(se, 2),
												ee = G(ae);
											{
												var ne = (T) => {
														var U = Qp();
														(Be(() => {
															(Fn(U, 'src', g(E).src), Fn(U, 'alt', g(E).item.key));
														}),
															m(T, U));
													},
													de = (T) => {
														var U = x(),
															z = y(U);
														{
															var Z = (pe) => {
																var Fe = x(),
																	Ae = y(Fe);
																(P(
																	Ae,
																	() => Qf,
																	(Pe, mt) => {
																		mt(Pe, {
																			get lang() {
																				return g(E).language;
																			},
																			class: 'w-full',
																			get code() {
																				return g(E).content;
																			},
																			children: (ot, ut) => {
																				var Ie = x(),
																					Pt = y(Ie);
																				(P(
																					Pt,
																					() => sp,
																					(dt, Tt) => {
																						Tt(dt, {});
																					}
																				),
																					m(ot, Ie));
																			},
																			$$slots: { default: !0 }
																		});
																	}
																),
																	m(pe, Fe));
															};
															H(
																z,
																(pe) => {
																	g(E).type === 'code' && g(E).language && g(E).content && pe(Z);
																},
																!0
															);
														}
														m(T, U);
													};
												H(ee, (T) => {
													g(E).type === 'image' ? T(ne) : T(de, !1);
												});
											}
											(M(ae), m(xe, Ee));
										},
										$$slots: { default: !0 }
									});
								}
							),
								m(be, Ge));
						};
						H(ue, (be) => {
							g(E) && be(j);
						});
					}
					m(oe, X);
				},
				$$slots: { default: !0 }
			});
		}
	),
		m(t, Ne),
		D(),
		r());
}
fi(['click']);
export { Ig as F };
