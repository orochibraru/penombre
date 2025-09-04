const __vite__mapDeps = (
	i,
	m = __vite__mapDeps,
	d = m.f ||
		(m.f = [
			'./2rs9rTQB.js',
			'./BaL_d8K-.js',
			'./N_uPyclR.js',
			'./BfYWDPRC.js',
			'./Dub_k349.js',
			'./L9gVGbbq.js',
			'./BOW00QWY.js',
			'./DjgOmxM8.js',
			'./B-qE73Xl.js',
			'./CFqLGdWB.js'
		])
) => i.map((i) => d[i]);
import { r as yo, e as bo } from './KjYeVjkE.js';
import { b as pr, a as an, d as vn, s as Da } from './1HBmZ_db.js';
import './U1J4c8t1.js';
import {
	U as Ra,
	N as wo,
	P as _o,
	a as To,
	c as Na,
	e as Xi,
	H as Ao,
	s as ko,
	d as Ba,
	f as So,
	i as sn,
	h as qr,
	j as Po,
	g as za,
	o as Co
} from './Dufayr-D.js';
import {
	T as Io,
	U as La,
	at as $a,
	p as D,
	o as A,
	q as b,
	af as te,
	a as p,
	b as R,
	ae as $n,
	a1 as wt,
	bj as ii,
	aC as or,
	bk as xn,
	z as Ua,
	A as kt,
	v as P,
	u as x,
	I as K,
	bb as ft,
	f as N,
	c as M,
	r as E,
	ax as Eo,
	t as ze,
	J as Le,
	K as Ne,
	F as ot,
	G as Q,
	ak as Mo,
	aj as Oo,
	aa as Fo,
	ac as Do,
	bl as Ro,
	be as No
} from './BW6z9EX9.js';
import { a as Wr } from './BHHl-vxW.js';
import { g as ai } from './DzxQehGt.js';
import { a as Bo } from './DxtMK8if.js';
import { r as it } from './Dd5NUPG5.js';
import { q as ja, r as zo, o as Bt, p as Jr, s as He, k as Lo } from './DzGRxXYC.js';
import { s as F } from './BC_1JO3s.js';
import { i as ce } from './ClaijROu.js';
import { c as B } from './C-vcVqpF.js';
import {
	a as ue,
	b as Ot,
	r as Va,
	c as on,
	s as ln,
	e as cn,
	g as $o,
	i as Uo,
	f as jo
} from './BPMCz5tT.js';
import { s as oe, r as H, p as _ } from './Cic-IlSQ.js';
import { p as at } from './PJJQOX3K.js';
import { a as si } from './BzLloq76.js';
import { B as Dt, b as Vo, c as Xa } from './B00PyzgL.js';
import {
	U as oi,
	u as li,
	V as Xo,
	W as Go,
	Y as Ho,
	Z as Ga,
	_ as Ha,
	i as qa,
	j as Wa,
	k as Qr,
	m as Ka,
	g as Ya,
	$ as Za,
	a0 as qo,
	a1 as Wo,
	a2 as Ko,
	a3 as Yo,
	R as Ja,
	t as Qa,
	v as es,
	w as ts,
	x as rs,
	I as Zo,
	Q as yn,
	L as Gi,
	X as un,
	B as ns,
	G as is,
	H as as,
	J as kr,
	n as Jo,
	o as ci,
	a4 as Qo,
	a5 as el,
	p as tl,
	q as rl,
	a6 as nl,
	N as Hi,
	y as il,
	O as al,
	K as sl,
	z as ol,
	T as ll
} from './BZM4qE7v.js';
import { b as $e } from './Bo6bj8hH.js';
import { c as he } from './Bvsacp8G.js';
import { b as Ut, a as cl, d as ul } from './DCEYseD3.js';
import {
	C as Pr,
	a as _t,
	c as vr,
	w as mr,
	d as pt,
	e as X,
	m as Ve,
	F as tr,
	G as dl,
	B as ui,
	E as fl,
	S as pl,
	p as ss,
	z as ml,
	n as St,
	f as nr,
	h as os,
	o as ls,
	I as cs,
	J as us,
	v as ds,
	A as fs,
	H as ps,
	y as ms,
	D as hl
} from './VBxAmJ30.js';
import { _ as bt } from './D9Z9MdNV.js';
import { u as gl } from './StNmv4ud.js';
import { I as Ue } from './C9yuXBdp.js';
import { i as vl } from './-Zrx4PIN.js';
import { M as xl } from './CNPipu-G.js';
import { t as hs } from './Dy9FI1NM.js';
const yl = !0;
function bl(t, e, r = e) {
	var n,
		i,
		a = () => {
			(cancelAnimationFrame(n), t.paused || (n = requestAnimationFrame(a)));
			var s = t.currentTime;
			i !== s && r((i = s));
		};
	((n = requestAnimationFrame(a)),
		t.addEventListener('timeupdate', a),
		La(() => {
			var s = Number(e());
			i !== s && !isNaN(s) && (t.currentTime = i = s);
		}),
		$a(() => {
			(cancelAnimationFrame(n), t.removeEventListener('timeupdate', a));
		}));
}
function wl(t, e, r = e) {
	var n = e(),
		i = () => {
			n !== t.paused && r((n = t.paused));
		};
	(ja(t, ['play', 'pause', 'canplay'], i, n == null),
		Io(() => {
			(n = !!e()) !== t.paused &&
				(n
					? t.pause()
					: t.play().catch(() => {
							r((n = !0));
						}));
		}));
}
function _l(t, e, r = e) {
	var n = () => {
		r(t.volume);
	};
	(e() == null && n(),
		ja(t, ['volumechange'], n, !1),
		La(() => {
			var i = Number(e());
			i !== t.volume && !isNaN(i) && (t.volume = i);
		}));
}
function Tl(t, e, r, n, i) {
	var a = () => {
		n(r[t]);
	};
	(r.addEventListener(e, a),
		a(),
		(r === document.body || r === window || r === document) &&
			$a(() => {
				r.removeEventListener(e, a);
			}));
}
class bn extends Error {
	constructor(e, r) {
		(super(e), (this.name = 'DevalueError'), (this.path = r.join('')));
	}
}
function qi(t) {
	return Object(t) !== t;
}
const Al = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function kl(t) {
	const e = Object.getPrototypeOf(t);
	return (
		e === Object.prototype || e === null || Object.getOwnPropertyNames(e).sort().join('\0') === Al
	);
}
function Sl(t) {
	return Object.prototype.toString.call(t).slice(8, -1);
}
function Pl(t) {
	switch (t) {
		case '"':
			return '\\"';
		case '<':
			return '\\u003C';
		case '\\':
			return '\\\\';
		case `
`:
			return '\\n';
		case '\r':
			return '\\r';
		case '	':
			return '\\t';
		case '\b':
			return '\\b';
		case '\f':
			return '\\f';
		case '\u2028':
			return '\\u2028';
		case '\u2029':
			return '\\u2029';
		default:
			return t < ' ' ? `\\u${t.charCodeAt(0).toString(16).padStart(4, '0')}` : '';
	}
}
function ur(t) {
	let e = '',
		r = 0;
	const n = t.length;
	for (let i = 0; i < n; i += 1) {
		const a = t[i],
			s = Pl(a);
		s && ((e += t.slice(r, i) + s), (r = i + 1));
	}
	return `"${r === 0 ? t : e + t.slice(r)}"`;
}
function Cl(t) {
	return Object.getOwnPropertySymbols(t).filter(
		(e) => Object.getOwnPropertyDescriptor(t, e).enumerable
	);
}
const Il = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function Wi(t) {
	return Il.test(t) ? '.' + t : '[' + JSON.stringify(t) + ']';
}
function El(t, e) {
	const r = [],
		n = new Map(),
		i = [];
	if (e) for (const l of Object.getOwnPropertyNames(e)) i.push({ key: l, fn: e[l] });
	const a = [];
	let s = 0;
	function o(l) {
		if (typeof l == 'function') throw new bn('Cannot stringify a function', a);
		if (n.has(l)) return n.get(l);
		if (l === void 0) return Ra;
		if (Number.isNaN(l)) return wo;
		if (l === 1 / 0) return _o;
		if (l === -1 / 0) return To;
		if (l === 0 && 1 / l < 0) return Na;
		const d = s++;
		n.set(l, d);
		for (const { key: f, fn: h } of i) {
			const g = h(l);
			if (g) return ((r[d] = `["${f}",${o(g)}]`), d);
		}
		let u = '';
		if (qi(l)) u = wn(l);
		else {
			const f = Sl(l);
			switch (f) {
				case 'Number':
				case 'String':
				case 'Boolean':
					u = `["Object",${wn(l)}]`;
					break;
				case 'BigInt':
					u = `["BigInt",${l}]`;
					break;
				case 'Date':
					u = `["Date","${!isNaN(l.getDate()) ? l.toISOString() : ''}"]`;
					break;
				case 'RegExp':
					const { source: g, flags: w } = l;
					u = w ? `["RegExp",${ur(g)},"${w}"]` : `["RegExp",${ur(g)}]`;
					break;
				case 'Array':
					u = '[';
					for (let v = 0; v < l.length; v += 1)
						(v > 0 && (u += ','), v in l ? (a.push(`[${v}]`), (u += o(l[v])), a.pop()) : (u += Ao));
					u += ']';
					break;
				case 'Set':
					u = '["Set"';
					for (const v of l) u += `,${o(v)}`;
					u += ']';
					break;
				case 'Map':
					u = '["Map"';
					for (const [v, y] of l)
						(a.push(`.get(${qi(v) ? wn(v) : '...'})`), (u += `,${o(v)},${o(y)}`), a.pop());
					u += ']';
					break;
				case 'Int8Array':
				case 'Uint8Array':
				case 'Uint8ClampedArray':
				case 'Int16Array':
				case 'Uint16Array':
				case 'Int32Array':
				case 'Uint32Array':
				case 'Float32Array':
				case 'Float64Array':
				case 'BigInt64Array':
				case 'BigUint64Array': {
					const y = Xi(l.buffer);
					u = '["' + f + '","' + y + '"]';
					break;
				}
				case 'ArrayBuffer': {
					u = `["ArrayBuffer","${Xi(l)}"]`;
					break;
				}
				default:
					if (!kl(l)) throw new bn('Cannot stringify arbitrary non-POJOs', a);
					if (Cl(l).length > 0) throw new bn('Cannot stringify POJOs with symbolic keys', a);
					if (Object.getPrototypeOf(l) === null) {
						u = '["null"';
						for (const v in l) (a.push(Wi(v)), (u += `,${ur(v)},${o(l[v])}`), a.pop());
						u += ']';
					} else {
						u = '{';
						let v = !1;
						for (const y in l)
							(v && (u += ','), (v = !0), a.push(Wi(y)), (u += `${ur(y)}:${o(l[y])}`), a.pop());
						u += '}';
					}
			}
		}
		return ((r[d] = u), d);
	}
	const c = o(t);
	return c < 0 ? `${c}` : `[${r.join(',')}]`;
}
function wn(t) {
	const e = typeof t;
	return e === 'string'
		? ur(t)
		: t instanceof String
			? ur(t.toString())
			: t === void 0
				? Ra.toString()
				: t === 0 && 1 / t < 0
					? Na.toString()
					: e === 'bigint'
						? `["BigInt","${t}"]`
						: String(t);
}
function Ml(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }],
		[
			'path',
			{
				d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'
			}
		]
	];
	(Ue(
		t,
		oe({ name: 'bell' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Ol(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [['path', { d: 'm9 18 6-6-6-6' }]];
	(Ue(
		t,
		oe({ name: 'chevron-right' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Fl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['circle', { cx: '12', cy: '10', r: '3' }],
		['path', { d: 'M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662' }]
	];
	(Ue(
		t,
		oe({ name: 'circle-user' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Dl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M12 2a10 10 0 0 1 7.38 16.75' }],
		['path', { d: 'M12 6v6l4 2' }],
		['path', { d: 'M2.5 8.875a10 10 0 0 0-.5 3' }],
		['path', { d: 'M2.83 16a10 10 0 0 0 2.43 3.4' }],
		['path', { d: 'M4.636 5.235a10 10 0 0 1 .891-.857' }],
		['path', { d: 'M8.644 21.42a10 10 0 0 0 7.631-.38' }]
	];
	(Ue(
		t,
		oe({ name: 'clock-fading' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Ki(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M12 13v8' }],
		['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
		['path', { d: 'm8 17 4-4 4 4' }]
	];
	(Ue(
		t,
		oe({ name: 'cloud-upload' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Rl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'm16 18 6-6-6-6' }],
		['path', { d: 'm8 6-6 6 6 6' }]
	];
	(Ue(
		t,
		oe({ name: 'code' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Nl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M12 10v6' }],
		['path', { d: 'M9 13h6' }],
		[
			'path',
			{
				d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
			}
		]
	];
	(Ue(
		t,
		oe({ name: 'folder-plus' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Bl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		[
			'path',
			{
				d: 'M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5'
			}
		],
		['path', { d: 'M12 10v4h4' }],
		['path', { d: 'm12 14 1.535-1.605a5 5 0 0 1 8 1.5' }],
		['path', { d: 'M22 22v-4h-4' }],
		['path', { d: 'm22 18-1.535 1.605a5 5 0 0 1-8-1.5' }]
	];
	(Ue(
		t,
		oe({ name: 'folder-sync' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function zl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['line', { x1: '22', x2: '2', y1: '12', y2: '12' }],
		[
			'path',
			{
				d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'
			}
		],
		['line', { x1: '6', x2: '6.01', y1: '16', y2: '16' }],
		['line', { x1: '10', x2: '10.01', y1: '16', y2: '16' }]
	];
	(Ue(
		t,
		oe({ name: 'hard-drive' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Ll(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }],
		['circle', { cx: '9', cy: '9', r: '2' }],
		['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }]
	];
	(Ue(
		t,
		oe({ name: 'image' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function $l(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'm16 17 5-5-5-5' }],
		['path', { d: 'M21 12H9' }],
		['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }]
	];
	(Ue(
		t,
		oe({ name: 'log-out' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Ul(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M9 18V5l12-2v13' }],
		['circle', { cx: '6', cy: '18', r: '3' }],
		['circle', { cx: '18', cy: '16', r: '3' }]
	];
	(Ue(
		t,
		oe({ name: 'music' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function jl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
		['path', { d: 'M9 3v18' }]
	];
	(Ue(
		t,
		oe({ name: 'panel-left' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Vl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }],
		['rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }]
	];
	(Ue(
		t,
		oe({ name: 'pause' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Xl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [['polygon', { points: '6 3 20 12 6 21 6 3' }]];
	(Ue(
		t,
		oe({ name: 'play' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Gl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M12 22v-5' }],
		['path', { d: 'M9 8V2' }],
		['path', { d: 'M15 8V2' }],
		['path', { d: 'M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z' }]
	];
	(Ue(
		t,
		oe({ name: 'plug' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Hl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		[
			'path',
			{
				d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'
			}
		],
		['circle', { cx: '12', cy: '12', r: '3' }]
	];
	(Ue(
		t,
		oe({ name: 'settings' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function ql(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M12 3v12' }],
		['path', { d: 'm17 8-5-5-5 5' }],
		['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }]
	];
	(Ue(
		t,
		oe({ name: 'upload' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Wl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
		['path', { d: 'M16 3.128a4 4 0 0 1 0 7.744' }],
		['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
		['circle', { cx: '9', cy: '7', r: '4' }]
	];
	(Ue(
		t,
		oe({ name: 'users' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Kl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		[
			'path',
			{
				d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z'
			}
		],
		['path', { d: 'M16 9a5 5 0 0 1 0 6' }]
	];
	(Ue(
		t,
		oe({ name: 'volume-1' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Yl(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		[
			'path',
			{
				d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z'
			}
		],
		['path', { d: 'M16 9a5 5 0 0 1 0 6' }],
		['path', { d: 'M19.364 18.364a9 9 0 0 0 0-12.728' }]
	];
	(Ue(
		t,
		oe({ name: 'volume-2' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
function Yi(t, e) {
	D(e, !0);
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
	 */ let r = H(e, ['$$slots', '$$events', '$$legacy']);
	const n = [
		[
			'path',
			{
				d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z'
			}
		],
		['line', { x1: '22', x2: '16', y1: '9', y2: '15' }],
		['line', { x1: '16', x2: '22', y1: '9', y2: '15' }]
	];
	(Ue(
		t,
		oe({ name: 'volume-x' }, () => r, {
			get iconNode() {
				return n;
			},
			children: (i, a) => {
				var s = A(),
					o = b(s);
				(F(o, () => e.children ?? te), p(i, s));
			},
			$$slots: { default: !0 }
		})
	),
		R());
}
const gs = () => {
		const t = ko;
		return {
			page: { subscribe: t.page.subscribe },
			navigating: { subscribe: t.navigating.subscribe },
			updated: t.updated
		};
	},
	xr = {
		subscribe(t) {
			return gs().page.subscribe(t);
		}
	},
	Zi = {
		subscribe(t) {
			return gs().navigating.subscribe(t);
		}
	};
function Un(t, e, r) {
	return ((t[e] = r), 'skip');
}
function Zl(t, e) {
	return e.value !== void 0 && typeof e.value != 'object' && e.path.length < t.length;
}
function Mt(t, e, r = {}) {
	r.modifier || (r.modifier = (i) => (Zl(e, i) ? void 0 : i.value));
	const n = Pt(t, e, r.modifier);
	if (n) return r.value === void 0 || r.value(n.value) ? n : void 0;
}
function Pt(t, e, r) {
	if (!e.length) return;
	const n = [e[0]];
	let i = t;
	for (; i && n.length < e.length; ) {
		const s = n[n.length - 1],
			o = r
				? r({
						parent: i,
						key: String(s),
						value: i[s],
						path: n.map((c) => String(c)),
						isLeaf: !1,
						set: (c) => Un(i, s, c)
					})
				: i[s];
		if (o === void 0) return;
		((i = o), n.push(e[n.length]));
	}
	if (!i) return;
	const a = e[e.length - 1];
	return {
		parent: i,
		key: String(a),
		value: i[a],
		path: e.map((s) => String(s)),
		isLeaf: !0,
		set: (s) => Un(i, a, s)
	};
}
function Ft(t, e, r = []) {
	for (const n in t) {
		const i = t[n],
			a = i === null || typeof i != 'object',
			s = { parent: t, key: n, value: i, path: r.concat([n]), isLeaf: a, set: (c) => Un(t, n, c) },
			o = e(s);
		if (o === 'abort') return o;
		if (o === 'skip') continue;
		if (!a) {
			const c = Ft(i, e, s.path);
			if (c === 'abort') return c;
		}
	}
}
function Jl(t, e) {
	return t === e || (t.size === e.size && [...t].every((r) => e.has(r)));
}
function Ji(t, e) {
	const r = new Map();
	function n(o, c) {
		return (
			(o instanceof Date && c instanceof Date && o.getTime() !== c.getTime()) ||
			(o instanceof Set && c instanceof Set && !Jl(o, c)) ||
			(o instanceof File && c instanceof File && o !== c)
		);
	}
	function i(o) {
		return o instanceof Date || o instanceof Set || o instanceof File;
	}
	function a(o, c) {
		const l = c ? Pt(c, o.path) : void 0;
		function d() {
			return (r.set(o.path.join(' '), o.path), 'skip');
		}
		if (i(o.value) && (!i(l?.value) || n(o.value, l.value))) return d();
		o.isLeaf && (!l || o.value !== l.value) && d();
	}
	(Ft(t, (o) => a(o, e)), Ft(e, (o) => a(o, t)));
	const s = Array.from(r.values());
	return (s.sort((o, c) => o.length - c.length), s);
}
function ht(t, e, r) {
	const n = typeof r == 'function';
	for (const i of e) {
		const a = Pt(
			t,
			i,
			({ parent: s, key: o, value: c }) => (
				(c === void 0 || typeof c != 'object') && (s[o] = {}),
				s[o]
			)
		);
		a && (a.parent[a.key] = n ? r(i, a) : r);
	}
}
function jt(t) {
	return t
		.toString()
		.split(/[[\].]+/)
		.filter((e) => e);
}
function br(t) {
	return t.reduce((e, r) => {
		const n = String(r);
		return (
			typeof r == 'number' || /^\d+$/.test(n) ? (e += `[${n}]`) : e ? (e += `.${n}`) : (e += n),
			e
		);
	}, '');
}
function wr(t) {
	const e = {}.toString.call(t).slice(8, -1);
	if (e == 'Set') return new Set([...t].map((r) => wr(r)));
	if (e == 'Map') return new Map([...t].map((r) => [wr(r[0]), wr(r[1])]));
	if (e == 'Date') return new Date(t.getTime());
	if (e == 'RegExp') return RegExp(t.source, t.flags);
	if (e == 'Array' || e == 'Object') {
		const r = e == 'Object' ? Object.create(Object.getPrototypeOf(t)) : [];
		for (const n in t) r[n] = wr(t[n]);
		return r;
	}
	return t;
}
function nt(t) {
	return t && typeof t == 'object' ? wr(t) : t;
}
function rr(t, e) {
	if (typeof t == 'boolean') throw new Ze('Schema property cannot be defined as boolean.', e);
}
const Nr = (t) => {
		if (typeof t == 'object' && t !== null) {
			if (typeof Object.getPrototypeOf == 'function') {
				const e = Object.getPrototypeOf(t);
				return e === Object.prototype || e === null;
			}
			return Object.prototype.toString.call(t) === '[object Object]';
		}
		return !1;
	},
	st = (...t) =>
		t.reduce((e, r) => {
			if (r === void 0) return e;
			if (Array.isArray(r))
				throw new TypeError('Arguments provided to ts-deepmerge must be objects, not arrays.');
			return (
				Object.keys(r).forEach((n) => {
					['__proto__', 'constructor', 'prototype'].includes(n) ||
						(Array.isArray(e[n]) && Array.isArray(r[n])
							? (e[n] = st.options.mergeArrays
									? st.options.uniqueArrayItems
										? Array.from(new Set(e[n].concat(r[n])))
										: [...e[n], ...r[n]]
									: r[n])
							: Nr(e[n]) && Nr(r[n])
								? (e[n] = st(e[n], r[n]))
								: !Nr(e[n]) && Nr(r[n])
									? (e[n] = st(r[n], void 0))
									: (e[n] =
											r[n] === void 0 ? (st.options.allowUndefinedOverrides ? r[n] : e[n]) : r[n]));
				}),
				e
			);
		}, {}),
	jn = { allowUndefinedOverrides: !0, mergeArrays: !0, uniqueArrayItems: !0 };
st.options = jn;
st.withOptions = (t, ...e) => {
	st.options = Object.assign(Object.assign({}, jn), t);
	const r = st(...e);
	return ((st.options = jn), r);
};
const Ql = ['unix-time', 'bigint', 'any', 'symbol', 'set', 'int64'];
function rt(t, e, r) {
	rr(t, r);
	const n = vs(t, r),
		i =
			t.items && n.includes('array')
				? (Array.isArray(t.items) ? t.items : [t.items]).filter((l) => typeof l != 'boolean')
				: void 0,
		a =
			t.additionalProperties && typeof t.additionalProperties == 'object' && n.includes('object')
				? Object.fromEntries(
						Object.entries(t.additionalProperties).filter(([, l]) => typeof l != 'boolean')
					)
				: void 0,
		s =
			t.properties && n.includes('object')
				? Object.fromEntries(Object.entries(t.properties).filter(([, l]) => typeof l != 'boolean'))
				: void 0,
		o = ec(t)?.filter((l) => l.type !== 'null' && l.const !== null),
		c = {
			types: n.filter((l) => l !== 'null'),
			isOptional: e,
			isNullable: n.includes('null'),
			schema: t,
			union: o?.length ? o : void 0,
			array: i,
			properties: s,
			additionalProperties: a,
			required: t.required
		};
	return !t.allOf || !t.allOf.length
		? c
		: {
				...st.withOptions({ allowUndefinedOverrides: !1 }, c, ...t.allOf.map((l) => rt(l, !1, []))),
				schema: t
			};
}
function vs(t, e) {
	rr(t, e);
	let r = t.const === null ? ['null'] : [];
	if (
		(t.type && (r = Array.isArray(t.type) ? t.type : [t.type]),
		t.anyOf && (r = t.anyOf.flatMap((n) => vs(n, e))),
		r.includes('array') && t.uniqueItems)
	) {
		const n = r.findIndex((i) => i != 'array');
		r[n] = 'set';
	} else if (t.format && Ql.includes(t.format)) {
		if ((r.unshift(t.format), t.format == 'unix-time' || t.format == 'int64')) {
			const n = r.findIndex((i) => i == 'integer');
			r.splice(n, 1);
		}
		if (t.format == 'bigint') {
			const n = r.findIndex((i) => i == 'string');
			r.splice(n, 1);
		}
	}
	return (
		t.const && t.const !== null && typeof t.const != 'function' && r.push(typeof t.const),
		Array.from(new Set(r))
	);
}
function ec(t) {
	if (!(!t.anyOf || !t.anyOf.length)) return t.anyOf.filter((e) => typeof e != 'boolean');
}
function xs(t, e = !1, r = []) {
	return lr(t, e, r);
}
function lr(t, e, r) {
	if (!t) throw new Ze('Schema was undefined', r);
	const n = rt(t, e, r);
	if (!n) return;
	let i;
	if ('default' in t)
		if (
			n.types.includes('object') &&
			t.default &&
			typeof t.default == 'object' &&
			!Array.isArray(t.default)
		)
			i = t.default;
		else {
			if (
				n.types.length > 1 &&
				n.types.includes('unix-time') &&
				(n.types.includes('integer') || n.types.includes('number'))
			)
				throw new Ze(
					'Cannot resolve a default value with a union that includes a date and a number/integer.',
					r
				);
			const [l] = n.types;
			return tc(l, t.default);
		}
	let a;
	const s = () =>
		!n.union || n.union.length < 2
			? !1
			: n.union.some((l) => l.enum)
				? !0
				: (a ||
						(a = new Set(
							n.types.map((l) => (['integer', 'unix-time'].includes(l) ? 'number' : l))
						)),
					a.size > 1);
	let o;
	if (!i && n.union) {
		const l = n.union.filter((d) => typeof d != 'boolean' && d.default !== void 0);
		if (l.length == 1) return lr(l[0], e, r);
		if (l.length > 1)
			throw new Ze(
				'Only one default value can exist in a union, or set a default value for the whole union.',
				r
			);
		if (n.isNullable) return null;
		if (n.isOptional) return;
		if (s())
			throw new Ze(
				'Multi-type unions must have a default value, or exactly one of the union types must have.',
				r
			);
		if (n.union.length)
			if (n.types[0] == 'object')
				(o === void 0 && (o = {}),
					(o =
						n.union.length > 1
							? st.withOptions({ allowUndefinedOverrides: !0 }, ...n.union.map((d) => lr(d, e, r)))
							: lr(n.union[0], e, r)));
			else return lr(n.union[0], e, r);
	}
	if (!i) {
		if (n.isNullable) return null;
		if (n.isOptional) return;
	}
	if (n.properties)
		for (const [l, d] of Object.entries(n.properties)) {
			rr(d, [...r, l]);
			const u = i && i[l] !== void 0 ? i[l] : lr(d, !n.required?.includes(l), [...r, l]);
			(o === void 0 && (o = {}), (o[l] = u));
		}
	else if (i) return i;
	if (t.enum) return t.enum[0];
	if ('const' in t) return t.const;
	if (s()) throw new Ze('Default values cannot have more than one type.', r);
	if (n.types.length == 0) return;
	const [c] = n.types;
	return o ?? ys(c, t.enum);
}
function tc(t, e) {
	switch (t) {
		case 'set':
			return Array.isArray(e) ? new Set(e) : e;
		case 'Date':
		case 'date':
		case 'unix-time':
			if (typeof e == 'string' || typeof e == 'number') return new Date(e);
			break;
		case 'bigint':
			if (typeof e == 'string' || typeof e == 'number') return BigInt(e);
			break;
		case 'symbol':
			if (typeof e == 'string' || typeof e == 'number') return Symbol(e);
			break;
	}
	return e;
}
function ys(t, e) {
	switch (t) {
		case 'string':
			return e && e.length > 0 ? e[0] : '';
		case 'number':
		case 'integer':
			return e && e.length > 0 ? e[0] : 0;
		case 'boolean':
			return !1;
		case 'array':
			return [];
		case 'object':
			return {};
		case 'null':
			return null;
		case 'Date':
		case 'date':
		case 'unix-time':
			return;
		case 'int64':
		case 'bigint':
			return BigInt(0);
		case 'set':
			return new Set();
		case 'symbol':
			return Symbol();
		case 'undefined':
		case 'any':
			return;
		default:
			throw new Ze('Schema type or format not supported, requires explicit default value: ' + t);
	}
}
function rc(t, e = []) {
	return _r(t, !1, e);
}
function _r(t, e, r) {
	if (!t) throw new Ze('Schema was undefined', r);
	const n = rt(t, e, r);
	let i = { __types: n.types };
	if (
		(n.union && (i = st(i, ...n.union.map((a) => _r(a, n.isOptional, r)))),
		n.schema.items &&
			typeof n.schema.items == 'object' &&
			!Array.isArray(n.schema.items) &&
			(i.__items = _r(n.schema.items, n.isOptional, r)),
		n.properties)
	)
		for (const [a, s] of Object.entries(n.properties))
			(rr(s, [...r, a]), (i[a] = _r(n.properties[a], !n.required?.includes(a), [...r, a])));
	if (n.additionalProperties && n.types.includes('object')) {
		const a = rt(n.additionalProperties, n.isOptional, r);
		if (a.properties && a.types.includes('object'))
			for (const [s] of Object.entries(a.properties))
				i[s] = _r(a.properties[s], !a.required?.includes(s), [...r, s]);
	}
	return (
		n.isNullable && !i.__types.includes('null') && i.__types.push('null'),
		n.isOptional && !i.__types.includes('undefined') && i.__types.push('undefined'),
		i
	);
}
class Ge extends Error {
	constructor(e) {
		(super(e), Object.setPrototypeOf(this, Ge.prototype));
	}
}
class Ze extends Ge {
	path;
	constructor(e, r) {
		(super((r && r.length ? `[${Array.isArray(r) ? r.join('.') : r}] ` : '') + e),
			(this.path = Array.isArray(r) ? r.join('.') : r),
			Object.setPrototypeOf(this, Ze.prototype));
	}
}
function bs(t, e) {
	const r = {};
	function n(i) {
		if (('_errors' in r || (r._errors = []), !Array.isArray(r._errors)))
			if (typeof r._errors == 'string') r._errors = [r._errors];
			else throw new Ge('Form-level error was not an array.');
		r._errors.push(i.message);
	}
	for (const i of t) {
		if (!i.path || (i.path.length == 1 && !i.path[0])) {
			n(i);
			continue;
		}
		const s =
				!/^\d$/.test(String(i.path[i.path.length - 1])) &&
				Mt(
					e,
					i.path.filter((d) => /\D/.test(String(d)))
				)?.value,
			o = Pt(r, i.path, ({ value: d, parent: u, key: f }) => (d === void 0 && (u[f] = {}), u[f]));
		if (!o) {
			n(i);
			continue;
		}
		const { parent: c, key: l } = o;
		s
			? (l in c || (c[l] = {}),
				'_errors' in c[l] ? c[l]._errors.push(i.message) : (c[l]._errors = [i.message]))
			: l in c
				? c[l].push(i.message)
				: (c[l] = [i.message]);
	}
	return r;
}
function Qi(t, e, r) {
	return r
		? t
		: (Ft(e, (n) => {
				Array.isArray(n.value) && n.set(void 0);
			}),
			Ft(t, (n) => {
				(!Array.isArray(n.value) && n.value !== void 0) || ht(e, [n.path], n.value);
			}),
			e);
}
function nc(t) {
	return ws(t, []);
}
function ws(t, e) {
	return Object.entries(t)
		.filter(([, n]) => n !== void 0)
		.flatMap(([n, i]) => {
			if (Array.isArray(i) && i.length > 0) {
				const a = e.concat([n]);
				return { path: br(a), messages: i };
			} else return ws(t[n], e.concat([n]));
		});
}
function ea(t, e) {
	return t ? st.withOptions({ mergeArrays: !1 }, e, t) : nt(e);
}
function ic(t, e, r, n, i) {
	const a =
			r.additionalProperties && typeof r.additionalProperties == 'object'
				? { __types: rt(r.additionalProperties, !1, []).types }
				: void 0,
		s = rc(r);
	function o(f, h, g) {
		const w = g.__types;
		if (!w.length || w.every((y) => y == 'undefined' || y == 'null' || y == 'any')) return f;
		if (w.length == 1 && w[0] == 'array' && !g.__items) return f;
		const v = ['unix-time', 'Date', 'date'];
		for (const y of w) {
			const k = ys(y, void 0),
				$ = typeof f == typeof k || (v.includes(y) && f instanceof Date);
			if ($ && $ && (f === null) == (k === null)) return f;
			if (g.__items) return o(f, h, g.__items);
		}
		return h === void 0 && w.includes('null') ? null : h;
	}
	function c() {
		return (Ft(e, u), d(), t);
	}
	function l(f, h) {
		ht(t, [f], h);
	}
	function d() {
		for (const f of n) f.path && u({ path: f.path, value: Mt(e, f.path)?.value }, !0);
	}
	function u(f, h = !1) {
		const g = f.path;
		if (!g || !g[0] || (typeof g[0] == 'string' && i?.includes(g[0]))) return;
		const w = Mt(t, g);
		if ((!w && f.value !== void 0) || (w && w.value === void 0)) l(g, f.value);
		else if (w) {
			const v = f.value,
				y = w.value;
			if (v !== void 0 && typeof y == typeof v && (y === null) == (v === null)) return;
			const k = g.filter((O) => /\D/.test(String(O))),
				$ = Pt(s, k, (O) => (O.value && '__items' in O.value ? O.value.__items : O.value));
			if (!$) {
				if (h) return;
				throw new Ze('No types found for defaults', g);
			}
			const ee = $.value ?? a;
			ee && l(g, o(y, v, ee));
		}
	}
	return c();
}
function ta(t) {
	t.flashMessage &&
		Vn(t) &&
		(document.cookie = `flash=; Max-Age=0; Path=${t.flashMessage.cookiePath ?? '/'};`);
}
function Vn(t) {
	return t.flashMessage ? t.syncFlashMessage : !1;
}
function Xn(t) {
	const e = JSON.parse(t);
	return (e.data && (e.data = Ba(e.data, So.decoders)), e);
}
function _n(t) {
	return HTMLElement.prototype.cloneNode.call(t);
}
function ac(t, e = () => {}) {
	const r = async ({ action: i, result: a, reset: s = !0, invalidateAll: o = !0 }) => {
		(a.type === 'success' && (s && HTMLFormElement.prototype.reset.call(t), o && (await sn())),
			(location.origin + location.pathname === i.origin + i.pathname ||
				a.type === 'redirect' ||
				a.type === 'error') &&
				(await qr(a)));
	};
	async function n(i) {
		if (
			(i.submitter?.hasAttribute('formmethod') ? i.submitter.formMethod : _n(t).method) !== 'post'
		)
			return;
		i.preventDefault();
		const s = new URL(
				i.submitter?.hasAttribute('formaction') ? i.submitter.formAction : _n(t).action
			),
			o = i.submitter?.hasAttribute('formenctype') ? i.submitter.formEnctype : _n(t).enctype,
			c = new FormData(t),
			l = i.submitter?.getAttribute('name');
		l && c.append(l, i.submitter?.getAttribute('value') ?? '');
		const d = new AbortController();
		let u = !1;
		const h =
			(await e({
				action: s,
				cancel: () => (u = !0),
				controller: d,
				formData: c,
				formElement: t,
				submitter: i.submitter
			})) ?? r;
		if (u) return;
		let g;
		try {
			const w = new Headers({ accept: 'application/json', 'x-sveltekit-action': 'true' });
			o !== 'multipart/form-data' &&
				w.set(
					'Content-Type',
					/^(:?application\/x-www-form-urlencoded|text\/plain)$/.test(o)
						? o
						: 'application/x-www-form-urlencoded'
				);
			const v = o === 'multipart/form-data' ? c : new URLSearchParams(c),
				y = await fetch(s, {
					method: 'POST',
					headers: w,
					cache: 'no-store',
					body: v,
					signal: d.signal
				});
			((g = Xn(await y.text())), g.type === 'error' && (g.status = y.status));
		} catch (w) {
			if (w?.name === 'AbortError') return;
			g = { type: 'error', error: w };
		}
		await h({
			action: s,
			formData: c,
			formElement: t,
			update: (w) => r({ action: s, result: g, reset: w?.reset, invalidateAll: w?.invalidateAll }),
			result: g
		});
	}
	return (
		HTMLFormElement.prototype.addEventListener.call(t, 'submit', n),
		{
			destroy() {
				HTMLFormElement.prototype.removeEventListener.call(t, 'submit', n);
			}
		}
	);
}
const _s = 'noCustomValidity';
async function ra(t, e) {
	('setCustomValidity' in t && t.setCustomValidity(''), !(_s in t.dataset) && Ts(t, e));
}
function sc(t, e) {
	for (const r of t.querySelectorAll('input,select,textarea,button')) {
		if (('dataset' in r && _s in r.dataset) || !r.name) continue;
		const n = Pt(e, jt(r.name)),
			i = n && typeof n.value == 'object' && '_errors' in n.value ? n.value._errors : n?.value;
		if ((Ts(r, i), i)) return;
	}
}
function Ts(t, e) {
	if (!('setCustomValidity' in t)) return;
	const r =
		e && e.length
			? e.join(`
`)
			: '';
	(t.setCustomValidity(r), r && t.reportValidity());
}
const oc = (t, e = 0) => {
		const r = t.getBoundingClientRect();
		return (
			r.top >= e &&
			r.left >= 0 &&
			r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			r.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	},
	lc = (t, e = 1.125, r = 'smooth') => {
		const a = t.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / (2 * e);
		window.scrollTo({ left: 0, top: a, behavior: r });
	},
	cc = ['checkbox', 'radio', 'range', 'file'];
function na(t) {
	const e =
			!!t &&
			(t instanceof HTMLSelectElement || (t instanceof HTMLInputElement && cc.includes(t.type))),
		r = !!t && t instanceof HTMLSelectElement && t.multiple,
		n = !!t && t instanceof HTMLInputElement && t.type == 'file';
	return { immediate: e, multiple: r, file: n };
}
var tt;
(function (t) {
	((t[(t.Idle = 0)] = 'Idle'),
		(t[(t.Submitting = 1)] = 'Submitting'),
		(t[(t.Delayed = 2)] = 'Delayed'),
		(t[(t.Timeout = 3)] = 'Timeout'));
})(tt || (tt = {}));
const uc = new Set();
function dc(t, e, r) {
	let n = tt.Idle,
		i,
		a;
	const s = uc;
	function o() {
		(c(),
			d(n != tt.Delayed ? tt.Submitting : tt.Delayed),
			(i = window.setTimeout(() => {
				i && n == tt.Submitting && d(tt.Delayed);
			}, r.delayMs)),
			(a = window.setTimeout(() => {
				a && n == tt.Delayed && d(tt.Timeout);
			}, r.timeoutMs)),
			s.add(c));
	}
	function c() {
		(clearTimeout(i), clearTimeout(a), (i = a = 0), s.delete(c), d(tt.Idle));
	}
	function l() {
		(s.forEach((v) => v()), s.clear());
	}
	function d(v) {
		((n = v),
			e.submitting.set(n >= tt.Submitting),
			e.delayed.set(n >= tt.Delayed),
			e.timeout.set(n >= tt.Timeout));
	}
	const u = t;
	function f(v) {
		const y = v.target;
		r.selectErrorText && y.select();
	}
	function h() {
		r.selectErrorText &&
			u.querySelectorAll('input').forEach((v) => {
				v.addEventListener('invalid', f);
			});
	}
	function g() {
		r.selectErrorText &&
			u.querySelectorAll('input').forEach((v) => v.removeEventListener('invalid', f));
	}
	const w = t;
	{
		h();
		const v = (y) => {
			(y.clearAll ? l() : c(), y.cancelled || setTimeout(() => Gn(w, r), 1));
		};
		return (
			Wr(() => {
				(g(), v({ cancelled: !0 }));
			}),
			{
				submitting() {
					o();
				},
				completed: v,
				scrollToFirstError() {
					setTimeout(() => Gn(w, r), 1);
				},
				isSubmitting: () => n === tt.Submitting || n === tt.Delayed
			}
		);
	}
}
const Gn = async (t, e) => {
	if (e.scrollToError == 'off') return;
	const r = e.errorSelector;
	if (!r) return;
	await $n();
	let n;
	if (((n = t.querySelector(r)), !n)) return;
	n = n.querySelector(r) ?? n;
	const i = e.stickyNavbar ? document.querySelector(e.stickyNavbar) : null;
	typeof e.scrollToError != 'string'
		? n.scrollIntoView(e.scrollToError)
		: oc(n, i?.offsetHeight ?? 0) || lc(n, void 0, e.scrollToError);
	function a(o) {
		return typeof e.autoFocusOnError == 'boolean'
			? e.autoFocusOnError
			: !/iPhone|iPad|iPod|Android/i.test(o);
	}
	if (!a(navigator.userAgent)) return;
	let s;
	if (
		((s = n),
		['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(s.tagName) ||
			(s = s.querySelector('input:not([type="hidden"]):not(.flatpickr-input), select, textarea')),
		s)
	)
		try {
			(s.focus({ preventScroll: !0 }), e.selectErrorText && s.tagName == 'INPUT' && s.select());
		} catch {}
};
function fc(t, e, r) {
	const n = Tr(t, e, r),
		i = wt(new DataTransfer().files);
	n.subscribe((s) => {
		const o = new DataTransfer();
		if (Array.isArray(s)) {
			if (s.length && s.every((c) => !c)) {
				n.set([]);
				return;
			}
			s.filter((c) => c instanceof File).forEach((c) => o.items.add(c));
		}
		i.set(o.files);
	});
	const a = {
		subscribe(s) {
			return i.subscribe(s);
		},
		set(s) {
			if (s instanceof FileList) {
				const o = [];
				for (let c = 0; c < s.length; c++) {
					const l = s.item(c);
					l && o.push(l);
				}
				(i.set(s), n.set(o));
			} else {
				const o = new DataTransfer();
				(Array.isArray(s) &&
					s.forEach((c) => {
						c instanceof File && o.items.add(c);
					}),
					i.set(o.files),
					n.set(s));
			}
		},
		update(s) {
			a.set(s(or(n)));
		}
	};
	return a;
}
function en(t, e, r) {
	const n = Pt(
		t,
		e,
		({ parent: i, key: a, value: s }) => (s === void 0 && (i[a] = /\D/.test(a) ? {} : []), i[a])
	);
	if (n) {
		const i = r(n.value);
		n.parent[n.key] = i;
	}
	return t;
}
function pc(t, e, r) {
	const n = t.form,
		i = jt(e),
		a = ii(n, (s) => Pt(s, i)?.value);
	return {
		subscribe(...s) {
			const o = a.subscribe(...s);
			return () => o();
		},
		update(s, o) {
			n.update((c) => en(c, i, s), o ?? r);
		},
		set(s, o) {
			n.update((c) => en(c, i, () => s), o ?? r);
		}
	};
}
function mc(t, e) {
	const r = 'form' in t;
	if (!r && e?.taint !== void 0)
		throw new Ge('If options.taint is set, the whole superForm object must be used as a proxy.');
	return r;
}
function Tr(t, e, r) {
	const n = jt(e);
	if (mc(t, r)) return pc(t, e, r);
	const i = ii(t, (a) => Pt(a, n)?.value);
	return {
		subscribe(...a) {
			const s = i.subscribe(...a);
			return () => s();
		},
		update(a) {
			t.update((s) => en(s, n, a));
		},
		set(a) {
			t.update((s) => en(s, n, () => a));
		}
	};
}
function hc(t, e = []) {
	const r = Hn(t, e);
	if (!r) throw new Ze('No shape could be created for schema.', e);
	return r;
}
function Hn(t, e) {
	rr(t, e);
	const r = rt(t, !1, e);
	if (r.array || r.union) {
		const n = r.array || [],
			i = r.union || [];
		return n.concat(i).reduce(
			(a, s) => {
				const o = Hn(s, e);
				return (o && (a = { ...(a ?? {}), ...o }), a);
			},
			n.length ? {} : void 0
		);
	}
	if (r.properties) {
		const n = {};
		for (const [i, a] of Object.entries(r.properties)) {
			const s = Hn(a, [...e, i]);
			s && (n[i] = s);
		}
		return n;
	}
	return r.types.includes('array') || r.types.includes('object') ? {} : void 0;
}
function qn(t) {
	let e = {};
	const r = Array.isArray(t);
	for (const [n, i] of Object.entries(t))
		!i || typeof i != 'object' || (r ? (e = { ...e, ...qn(i) }) : (e[n] = qn(i)));
	return e;
}
const Br = new WeakMap(),
	ar = new WeakMap(),
	As = (t) => {
		throw t.result.error;
	},
	gc = {
		applyAction: !0,
		invalidateAll: !0,
		resetForm: !0,
		autoFocusOnError: 'detect',
		scrollToError: 'smooth',
		errorSelector: '[aria-invalid="true"],[data-invalid]',
		selectErrorText: !1,
		stickyNavbar: void 0,
		taintedMessage: !1,
		onSubmit: void 0,
		onResult: void 0,
		onUpdate: void 0,
		onUpdated: void 0,
		onError: As,
		dataType: 'form',
		validators: void 0,
		customValidity: !1,
		clearOnSubmit: 'message',
		delayMs: 500,
		timeoutMs: 8e3,
		multipleSubmits: 'prevent',
		SPA: void 0,
		validationMethod: 'auto'
	};
function vc(t) {
	return `Duplicate form id's found: "${t}". Multiple forms will receive the same data. Use the id option to differentiate between them, or if this is intended, set the warnings.duplicateId option to false in superForm to disable this warning. More information: https://superforms.rocks/concepts/multiple-forms`;
}
let ks = !1;
try {
	SUPERFORMS_LEGACY && (ks = !0);
} catch {}
let cr = !1;
try {
	globalThis.STORIES && (cr = !0);
} catch {}
function xc(t, e) {
	let r,
		n = e ?? {},
		i;
	{
		if (
			((n.legacy ?? ks) &&
				(n.resetForm === void 0 && (n.resetForm = !1),
				n.taintedMessage === void 0 && (n.taintedMessage = !0)),
			cr && n.applyAction === void 0 && (n.applyAction = !1),
			typeof n.SPA == 'string' &&
				(n.invalidateAll === void 0 && (n.invalidateAll = !1),
				n.applyAction === void 0 && (n.applyAction = !1)),
			(i = n.validators),
			(n = { ...gc, ...n }),
			(n.SPA === !0 || typeof n.SPA == 'object') &&
				n.validators === void 0 &&
				console.warn(
					'No validators set for superForm in SPA mode. Add a validation adapter to the validators option, or set it to false to disable this warning.'
				),
			!t)
		)
			throw new Ge(
				"No form data sent to superForm. Make sure the output from superValidate is used (usually data.form) and that it's not null or undefined. Alternatively, an object with default values for the form can also be used, but then constraints won't be available."
			);
		(l(t) === !1 &&
			(t = {
				id: n.id ?? Math.random().toString(36).slice(2, 10),
				valid: !1,
				posted: !1,
				errors: {},
				data: t,
				shape: qn(t)
			}),
			(t = t));
		const m = (t.id = n.id ?? t.id),
			T = or(xr) ?? (cr ? {} : void 0);
		if (n.warnings?.duplicateId !== !1)
			if (!Br.has(T)) Br.set(T, new Set([m]));
			else {
				const C = Br.get(T);
				C?.has(m) ? console.warn(vc(m)) : C?.add(m);
			}
		if (
			(ar.has(t) || ar.set(t, t),
			(r = ar.get(t)),
			(t = nt(r)),
			Wr(() => {
				(lt(), ne(), ji());
				for (const C of Object.values(ct)) C.length = 0;
				Br.get(T)?.delete(m);
			}),
			n.dataType !== 'json')
		) {
			const C = (W, ae) => {
				if (!(!ae || typeof ae != 'object')) {
					if (Array.isArray(ae)) ae.length > 0 && C(W, ae[0]);
					else if (!(ae instanceof Date) && !(ae instanceof File) && !(ae instanceof FileList))
						throw new Ge(
							`Object found in form field "${W}". Set the dataType option to "json" and add use:enhance to use nested data structures. More information: https://superforms.rocks/concepts/nested-data`
						);
				}
			};
			for (const [W, ae] of Object.entries(t.data)) C(W, ae);
		}
	}
	const a = {
			formId: t.id,
			form: nt(t.data),
			constraints: t.constraints ?? {},
			posted: t.posted,
			errors: nt(t.errors),
			message: nt(t.message),
			tainted: void 0,
			valid: t.valid,
			submitting: !1,
			shape: t.shape
		},
		s = a,
		o = wt(n.id ?? t.id);
	function c(m) {
		return Object.values(m).filter((C) => l(C) !== !1);
	}
	function l(m) {
		return !m ||
			typeof m != 'object' ||
			!('valid' in m && 'errors' in m && typeof m.valid == 'boolean')
			? !1
			: 'id' in m && typeof m.id == 'string'
				? m.id
				: !1;
	}
	const d = wt(t.data),
		u = {
			subscribe: d.subscribe,
			set: (m, T = {}) => {
				const C = nt(m);
				return (le(C, T.taint ?? !0), d.set(C));
			},
			update: (m, T = {}) =>
				d.update((C) => {
					const W = m(C);
					return (le(W, T.taint ?? !0), W);
				})
		};
	function f() {
		return n.SPA === !0 || typeof n.SPA == 'object';
	}
	function h(m) {
		return m > 400
			? m
			: (typeof n.SPA == 'boolean' || typeof n.SPA == 'string' ? void 0 : n.SPA?.failStatus) || m;
	}
	async function g(m = {}) {
		const T = m.formData ?? s.form;
		let C = {},
			W;
		const ae = m.adapter ?? n.validators;
		if (typeof ae == 'object') {
			if (ae != i && !('jsonSchema' in ae))
				throw new Ge(
					'Client validation adapter found in options.validators. A full adapter must be used when changing validators dynamically, for example "zod" instead of "zodClient".'
				);
			if (((W = await ae.validate(T)), !W.success)) C = bs(W.issues, ae.shape ?? s.shape ?? {});
			else if (m.recheckValidData !== !1) return g({ ...m, recheckValidData: !1 });
		} else W = { success: !0, data: {} };
		const Se = { ...s.form, ...T, ...(W.success ? W.data : {}) };
		return {
			valid: W.success,
			posted: !1,
			errors: C,
			data: Se,
			constraints: s.constraints,
			message: void 0,
			id: s.formId,
			shape: s.shape
		};
	}
	function w(m) {
		if (!n.onChange || !m.paths.length || m.type == 'blur') return;
		let T;
		const C = m.paths.map(br);
		(m.type && m.paths.length == 1 && m.formElement && m.target instanceof Element
			? (T = {
					path: C[0],
					paths: C,
					formElement: m.formElement,
					target: m.target,
					set(W, ae, Se) {
						Tr({ form: u }, W, Se).set(ae);
					},
					get(W) {
						return or(Tr(u, W));
					}
				})
			: (T = {
					paths: C,
					target: void 0,
					set(W, ae, Se) {
						Tr({ form: u }, W, Se).set(ae);
					},
					get(W) {
						return or(Tr(u, W));
					}
				}),
			n.onChange(T));
	}
	async function v(m, T = !1, C) {
		m &&
			(n.validators == 'clear' && Z.update((Se) => (ht(Se, m.paths, void 0), Se)),
			setTimeout(() => w(m)));
		let W = !1;
		if (
			(T ||
				((n.validationMethod == 'onsubmit' ||
					n.validationMethod == 'submit-only' ||
					(n.validationMethod == 'onblur' && m?.type == 'input') ||
					(n.validationMethod == 'oninput' && m?.type == 'blur')) &&
					(W = !0)),
			W || !m || !n.validators || n.validators == 'clear')
		) {
			if (m?.paths) {
				const Se = m?.formElement ?? Je();
				Se && y(Se);
			}
			return;
		}
		const ae = await g({ adapter: C });
		return (
			ae.valid && (m.immediate || m.type != 'input') && u.set(ae.data, { taint: 'ignore' }),
			await $n(),
			k(ae.errors, m, T),
			ae
		);
	}
	function y(m) {
		const T = new Map();
		if (n.customValidity && m)
			for (const C of m.querySelectorAll('[name]')) {
				if (typeof C.name != 'string' || !C.name.length) continue;
				const W = 'validationMessage' in C ? String(C.validationMessage) : '';
				(T.set(C.name, { el: C, message: W }), ra(C, void 0));
			}
		return T;
	}
	async function k(m, T, C) {
		const { type: W, immediate: ae, multiple: Se, paths: ut } = T,
			zt = s.errors,
			Ht = {};
		let Ye = new Map();
		const qe = T.formElement ?? Je();
		(qe && (Ye = y(qe)),
			Ft(m, (je) => {
				if (!Array.isArray(je.value)) return;
				const We = [...je.path];
				We[We.length - 1] == '_errors' && We.pop();
				const ir = We.join('.');
				function dt() {
					if ((ht(Ht, [je.path], je.value), n.customValidity && qt && Ye.has(ir))) {
						const { el: Tt, message: Wt } = Ye.get(ir);
						Wt != je.value && (setTimeout(() => ra(Tt, je.value)), Ye.clear());
					}
				}
				if (C) return dt();
				const Dr = je.path[je.path.length - 1] == '_errors',
					qt =
						je.value &&
						ut.some((Tt) =>
							Dr ? We && Tt && We.length > 0 && We[0] == Tt[0] : ir == Tt.join('.')
						);
				if ((qt && n.validationMethod == 'oninput') || (ae && !Se && qt)) return dt();
				if (Se) {
					const Tt = Mt(or(Z), je.path.slice(0, -1));
					if (Tt?.value && typeof Tt?.value == 'object') {
						for (const Wt of Object.values(Tt.value)) if (Array.isArray(Wt)) return dt();
					}
				}
				const Rt = Mt(zt, je.path);
				if (Rt && Rt.key in Rt.parent) return dt();
				if (Dr) {
					if (n.validationMethod == 'oninput' || (W == 'blur' && we(br(je.path.slice(0, -1)))))
						return dt();
				} else if (W == 'blur' && qt) return dt();
			}),
			Z.set(Ht));
	}
	function $(m, T = {}) {
		return (
			T.keepFiles &&
				Ft(s.form, (C) => {
					if (
						!(C.parent instanceof FileList) &&
						(C.value instanceof File || C.value instanceof FileList)
					) {
						const W = Mt(m, C.path);
						(!W || !(W.key in W.parent)) && ht(m, [C.path], C.value);
					}
				}),
			u.set(m, T)
		);
	}
	function ee(m, T) {
		return m && T && n.resetForm && (n.resetForm === !0 || n.resetForm());
	}
	function O(m = !0) {
		let T = s.form,
			C = s.tainted;
		if (m) {
			const W = vo(s.form);
			T = W.data;
			const ae = W.paths;
			ae.length && ((C = nt(C) ?? {}), ht(C, ae, !1));
		}
		return {
			valid: s.valid,
			posted: s.posted,
			errors: s.errors,
			data: T,
			constraints: s.constraints,
			message: s.message,
			id: s.formId,
			tainted: C,
			shape: s.shape
		};
	}
	async function j(m, T) {
		(m.valid && T && ee(m.valid, T)
			? S({ message: m.message, posted: !0 })
			: Fr({
					form: m,
					untaint: T,
					keepFiles: !0,
					pessimisticUpdate: n.invalidateAll == 'force' || n.invalidateAll == 'pessimistic'
				}),
			ct.onUpdated.length && (await $n()));
		for (const C of ct.onUpdated) C({ form: m });
	}
	function S(m = {}) {
		m.newState && (r.data = { ...r.data, ...m.newState });
		const T = nt(r);
		((T.data = { ...T.data, ...m.data }),
			m.id !== void 0 && (T.id = m.id),
			Fr({
				form: T,
				untaint: !0,
				message: m.message,
				keepFiles: !1,
				posted: m.posted,
				resetted: !0
			}));
	}
	async function L(m) {
		if (m.type == 'error')
			throw new Ge(`ActionResult of type "${m.type}" cannot be passed to update function.`);
		if (m.type == 'redirect') {
			ee(!0, !0) && S({ posted: !0 });
			return;
		}
		if (typeof m.data != 'object')
			throw new Ge('Non-object validation data returned from ActionResult.');
		const T = c(m.data);
		if (!T.length)
			throw new Ge(
				'No form data returned from ActionResult. Make sure you return { form } in the form actions.'
			);
		for (const C of T) C.id === s.formId && (await j(C, m.status >= 200 && m.status < 300));
	}
	const U = wt(a.message),
		z = wt(a.constraints),
		I = wt(a.posted),
		V = wt(a.shape),
		q = wt(t.errors),
		Z = {
			subscribe: q.subscribe,
			set(m, T) {
				return q.set(Qi(m, s.errors, T?.force));
			},
			update(m, T) {
				return q.update((C) => Qi(m(C), s.errors, T?.force));
			},
			clear: () => Z.set({})
		};
	let G = null;
	function re(m) {
		(G &&
		m &&
		Object.keys(m).length == 1 &&
		m.paths?.length &&
		G.target &&
		G.target instanceof HTMLInputElement &&
		G.target.type.toLowerCase() == 'file'
			? (G.paths = m.paths)
			: (G = m),
			setTimeout(() => {
				v(G);
			}, 0));
	}
	function se(m, T, C, W, ae) {
		(G === null && (G = { paths: [] }),
			(G.type = m),
			(G.immediate = T),
			(G.multiple = C),
			(G.formElement = W),
			(G.target = ae));
	}
	function ie() {
		return G?.paths ?? [];
	}
	function ne() {
		G = null;
	}
	const J = {
		defaultMessage: 'Leave page? Changes that you made may not be saved.',
		state: wt(),
		message: n.taintedMessage,
		clean: nt(t.data),
		forceRedirection: !1
	};
	function pe() {
		return n.taintedMessage && !s.submitting && !J.forceRedirection && _e();
	}
	function de(m) {
		if (!pe()) return;
		(m.preventDefault(), (m.returnValue = ''));
		const { taintedMessage: T } = n,
			W = typeof T == 'function' || T === !0 ? J.defaultMessage : T;
		return (((m || window.event).returnValue = W || J.defaultMessage), W);
	}
	async function ve(m) {
		if (!pe()) return;
		const { taintedMessage: T } = n,
			C = typeof T == 'function';
		if ((C && m.cancel(), m.type === 'leave')) return;
		const W = C || T === !0 ? J.defaultMessage : T;
		let ae;
		try {
			ae = C ? await T(m) : window.confirm(W || J.defaultMessage);
		} catch {
			ae = !1;
		}
		if (ae && m.to)
			try {
				((J.forceRedirection = !0), await za(m.to.url, { ...m.to.params }));
				return;
			} finally {
				J.forceRedirection = !1;
			}
		else !ae && !C && m.cancel();
	}
	function fe() {
		n.taintedMessage = J.message;
	}
	function me() {
		return J.state;
	}
	function we(m) {
		if (!s.tainted) return !1;
		if (!m) return !!s.tainted;
		const T = Mt(s.tainted, jt(m));
		return !!T && T.key in T.parent;
	}
	function _e(m) {
		if (!arguments.length) return xe(s.tainted);
		if (typeof m == 'boolean') return m;
		if (typeof m == 'object') return xe(m);
		if (!s.tainted || m === void 0) return !1;
		const T = Mt(s.tainted, jt(m));
		return xe(T?.value);
	}
	function xe(m) {
		if (!m) return !1;
		if (typeof m == 'object') {
			for (const T of Object.values(m)) if (xe(T)) return !0;
		}
		return m === !0;
	}
	function le(m, T) {
		if (T == 'ignore') return;
		const C = Ji(m, s.form),
			W = Ji(m, J.clean).map((ae) => ae.join());
		(C.length &&
			(J.state.update(
				(ae) => (
					ae || (ae = {}),
					ht(ae, C, (Se, ut) => {
						if (!W.includes(Se.join())) return;
						const zt = Pt(m, Se),
							Ht = Pt(J.clean, Se);
						return zt && Ht && zt.value === Ht.value
							? void 0
							: T === !0
								? !0
								: T === 'untaint'
									? void 0
									: ut.value;
					}),
					ae
				)
			),
			re({ paths: C })),
			(T == 'untaint-all' || T == 'untaint-form') && J.state.set(void 0));
	}
	function ke(m, T) {
		(J.state.set(m), T && (J.clean = T));
	}
	const ye = wt(!1),
		Pe = wt(!1),
		Ce = wt(!1),
		De = [
			J.state.subscribe((m) => (a.tainted = nt(m))),
			u.subscribe((m) => (a.form = nt(m))),
			Z.subscribe((m) => (a.errors = nt(m))),
			o.subscribe((m) => (a.formId = m)),
			z.subscribe((m) => (a.constraints = m)),
			I.subscribe((m) => (a.posted = m)),
			U.subscribe((m) => (a.message = m)),
			ye.subscribe((m) => (a.submitting = m)),
			V.subscribe((m) => (a.shape = m))
		];
	function Oe(m) {
		De.push(m);
	}
	function lt() {
		De.forEach((m) => m());
	}
	let Re;
	function Je() {
		return Re;
	}
	function Ke(m) {
		((Re = document.createElement('form')),
			(Re.method = 'POST'),
			(Re.action = m),
			Vi(Re),
			document.body.appendChild(Re));
	}
	function pn(m) {
		Re && (Re.action = m);
	}
	function ji() {
		(Re?.parentElement && Re.remove(), (Re = void 0));
	}
	const mn = ii(Z, (m) => (m ? nc(m) : []));
	n.taintedMessage = void 0;
	function Fr(m) {
		const T = m.form,
			C = m.message ?? T.message;
		if (
			((m.untaint || m.resetted) && ke(typeof m.untaint == 'boolean' ? void 0 : m.untaint, T.data),
			m.pessimisticUpdate || $(T.data, { taint: 'ignore', keepFiles: m.keepFiles }),
			U.set(C),
			m.resetted ? Z.update(() => ({}), { force: !0 }) : Z.set(T.errors),
			o.set(T.id),
			I.set(m.posted ?? T.posted),
			T.constraints && z.set(T.constraints),
			T.shape && V.set(T.shape),
			(a.valid = T.valid),
			n.flashMessage && Vn(n))
		) {
			const W = n.flashMessage.module.getFlash(xr);
			C && or(W) === void 0 && W.set(C);
		}
	}
	const ct = {
		onSubmit: n.onSubmit ? [n.onSubmit] : [],
		onResult: n.onResult ? [n.onResult] : [],
		onUpdate: n.onUpdate ? [n.onUpdate] : [],
		onUpdated: n.onUpdated ? [n.onUpdated] : [],
		onError: n.onError ? [n.onError] : []
	};
	(window.addEventListener('beforeunload', de),
		Wr(() => {
			window.removeEventListener('beforeunload', de);
		}),
		Po(ve),
		Oe(
			xr.subscribe(async (m) => {
				cr && m === void 0 && (m = { status: 200 });
				const T = m.status >= 200 && m.status < 300;
				if (n.applyAction && m.form && typeof m.form == 'object') {
					const C = m.form;
					if (C.type === 'error') return;
					for (const W of c(C)) {
						const ae = ar.has(W);
						W.id !== s.formId || ae || (ar.set(W, W), await j(W, T));
					}
				} else if (n.applyAction !== 'never' && m.data && typeof m.data == 'object')
					for (const C of c(m.data)) {
						const W = ar.has(C);
						if (C.id !== s.formId || W) continue;
						(n.invalidateAll === 'force' || n.invalidateAll === 'pessimistic') && (r.data = C.data);
						const ae = ee(C.valid, !0);
						Fr({ form: C, untaint: T, keepFiles: !ae, resetted: ae });
					}
			})
		),
		typeof n.SPA == 'string' && Ke(n.SPA));
	function Vi(m, T) {
		if (
			(n.SPA !== void 0 && m.method == 'get' && (m.method = 'post'),
			typeof n.SPA == 'string'
				? n.SPA.length && m.action == document.location.href && (m.action = n.SPA)
				: (Re = m),
			T)
		) {
			if (T.onError) {
				if (n.onError === 'apply')
					throw new Ge('options.onError is set to "apply", cannot add any onError events.');
				if (T.onError === 'apply')
					throw new Ge('Cannot add "apply" as onError event in use:enhance.');
				ct.onError.push(T.onError);
			}
			(T.onResult && ct.onResult.push(T.onResult),
				T.onSubmit && ct.onSubmit.push(T.onSubmit),
				T.onUpdate && ct.onUpdate.push(T.onUpdate),
				T.onUpdated && ct.onUpdated.push(T.onUpdated));
		}
		fe();
		let C;
		async function W(Ye) {
			const qe = na(Ye.target);
			(qe.immediate && !qe.file && (await new Promise((je) => setTimeout(je, 0))),
				(C = ie()),
				se('input', qe.immediate, qe.multiple, m, Ye.target ?? void 0));
		}
		async function ae(Ye) {
			if (s.submitting || !C || ie() != C) return;
			const qe = na(Ye.target);
			(qe.immediate && !qe.file && (await new Promise((je) => setTimeout(je, 0))),
				C !== void 0 &&
					(v({
						paths: C,
						immediate: qe.multiple,
						multiple: qe.multiple,
						type: 'blur',
						formElement: m,
						target: Ye.target ?? void 0
					}),
					(C = void 0)));
		}
		(m.addEventListener('focusout', ae),
			m.addEventListener('input', W),
			Wr(() => {
				(m.removeEventListener('focusout', ae), m.removeEventListener('input', W));
			}));
		const Se = dc(m, { submitting: ye, delayed: Pe, timeout: Ce }, n);
		let ut, zt;
		const Ht = ac(m, async (Ye) => {
			let qe,
				je = n.validators;
			const We = {
					...Ye,
					jsonData(Te) {
						if (n.dataType !== 'json')
							throw new Ge("options.dataType must be set to 'json' to use jsonData.");
						qe = Te;
					},
					validators(Te) {
						je = Te;
					},
					customRequest(Te) {
						zt = Te;
					}
				},
				ir = We.cancel;
			let dt = !1;
			function hn(Te) {
				const be = { ...Te, posted: !0 },
					Ee = be.valid ? 200 : h(400),
					Xe = { form: be },
					Qe = be.valid
						? { type: 'success', status: Ee, data: Xe }
						: { type: 'failure', status: Ee, data: Xe };
				setTimeout(() => Wt({ result: Qe }), 0);
			}
			function Dr() {
				switch (n.clearOnSubmit) {
					case 'errors-and-message':
						(Z.clear(), U.set(void 0));
						break;
					case 'errors':
						Z.clear();
						break;
					case 'message':
						U.set(void 0);
						break;
				}
			}
			async function qt(Te, be) {
				if (((Te.status = be), n.onError !== 'apply')) {
					const Ee = { result: Te, message: U, form: t };
					for (const Xe of ct.onError)
						Xe !== 'apply' && (Xe != As || !n.flashMessage?.onError) && (await Xe(Ee));
				}
				(n.flashMessage &&
					n.flashMessage.onError &&
					(await n.flashMessage.onError({
						result: Te,
						flashMessage: n.flashMessage.module.getFlash(xr)
					})),
					n.applyAction &&
						(n.onError == 'apply'
							? await qr(Te)
							: await qr({ type: 'failure', status: h(Te.status), data: Te })));
			}
			function Rt(Te = { resetTimers: !0 }) {
				return (
					(dt = !0),
					Te.resetTimers && Se.isSubmitting() && Se.completed({ cancelled: dt }),
					ir()
				);
			}
			if (((We.cancel = Rt), Se.isSubmitting() && n.multipleSubmits == 'prevent'))
				Rt({ resetTimers: !1 });
			else {
				(Se.isSubmitting() && n.multipleSubmits == 'abort' && ut && ut.abort(),
					Se.submitting(),
					(ut = We.controller));
				for (const Te of ct.onSubmit)
					try {
						await Te(We);
					} catch (be) {
						(Rt(), qt({ type: 'error', error: be }, 500));
					}
			}
			if ((dt && n.flashMessage && ta(n), !dt)) {
				const Te =
					!f() &&
					(m.noValidate ||
						((We.submitter instanceof HTMLButtonElement ||
							We.submitter instanceof HTMLInputElement) &&
							We.submitter.formNoValidate));
				let be;
				const Ee = async () => await g({ adapter: je });
				if ((Dr(), Te || ((be = await Ee()), be.valid || (Rt({ resetTimers: !1 }), hn(be))), !dt)) {
					n.flashMessage &&
						(n.clearOnSubmit == 'errors-and-message' || n.clearOnSubmit == 'message') &&
						Vn(n) &&
						n.flashMessage.module.getFlash(xr).set(void 0);
					const Xe = 'formData' in We ? We.formData : We.data;
					if (((C = void 0), f())) (be || (be = await Ee()), Rt({ resetTimers: !1 }), hn(be));
					else if (n.dataType === 'json') {
						be || (be = await Ee());
						const Qe = nt(qe ?? be.data);
						(Ft(Qe, (Ie) => {
							if (Ie.value instanceof File) {
								const et = '__superform_file_' + br(Ie.path);
								return (Xe.append(et, Ie.value), Ie.set(void 0));
							} else if (
								Array.isArray(Ie.value) &&
								Ie.value.length &&
								Ie.value.every((et) => et instanceof File)
							) {
								const et = '__superform_files_' + br(Ie.path);
								for (const Ct of Ie.value) Xe.append(et, Ct);
								return Ie.set(void 0);
							}
						}),
							Object.keys(Qe).forEach((Ie) => {
								typeof Xe.get(Ie) == 'string' && Xe.delete(Ie);
							}));
						const Kt = n.transport
								? Object.fromEntries(Object.entries(n.transport).map(([Ie, et]) => [Ie, et.encode]))
								: void 0,
							Rr = Tt(El(Qe, Kt), n.jsonChunkSize ?? 5e5);
						for (const Ie of Rr) Xe.append('__superform_json', Ie);
					}
					if (!Xe.has('__superform_id')) {
						const Qe = s.formId;
						Qe !== void 0 && Xe.set('__superform_id', Qe);
					}
					typeof n.SPA == 'string' && pn(n.SPA);
				}
			}
			function Tt(Te, be) {
				const Ee = Math.ceil(Te.length / be),
					Xe = new Array(Ee);
				for (let Qe = 0, Kt = 0; Qe < Ee; ++Qe, Kt += be) Xe[Qe] = Te.substring(Kt, Kt + be);
				return Xe;
			}
			async function Wt(Te) {
				let be = !1;
				ut = null;
				let Ee =
					'type' in Te.result && 'status' in Te.result
						? Te.result
						: {
								type: 'error',
								status: h(parseInt(String(Te.result.status)) || 500),
								error: Te.result.error instanceof Error ? Te.result.error : Te.result
							};
				const Xe = () => (be = !0),
					Qe = { result: Ee, formEl: m, formElement: m, cancel: Xe },
					Kt =
						cr || !f()
							? () => {}
							: Zi.subscribe((Ie) => {
									!Ie || Ie.from?.route.id === Ie.to?.route.id || Xe();
								});
				function Rr(Ie, et, Ct) {
					et.result = { type: 'error', error: Ie, status: h(Ct) };
				}
				for (const Ie of ct.onResult)
					try {
						await Ie(Qe);
					} catch (et) {
						Rr(et, Qe, Math.max(Ee.status ?? 500, 400));
					}
				if (((Ee = Qe.result), !be)) {
					if ((Ee.type === 'success' || Ee.type === 'failure') && Ee.data) {
						const Ie = c(Ee.data);
						if (!Ie.length)
							throw new Ge(
								'No form data returned from ActionResult. Make sure you return { form } in the form actions.'
							);
						for (const et of Ie) {
							if (et.id !== s.formId) continue;
							const Ct = {
								form: et,
								formEl: m,
								formElement: m,
								cancel: () => (be = !0),
								result: Ee
							};
							for (const gn of ct.onUpdate)
								try {
									await gn(Ct);
								} catch (xo) {
									Rr(xo, Ct, Math.max(Ee.status ?? 500, 400));
								}
							((Ee = Ct.result),
								be ||
									(n.customValidity && sc(m, Ct.form.errors),
									ee(Ct.form.valid, Ee.type == 'success') &&
										Ct.formElement
											.querySelectorAll('input[type="file"]')
											.forEach((gn) => (gn.value = ''))));
						}
					}
					be ||
						(Ee.type !== 'error'
							? (Ee.type === 'success' && n.invalidateAll && (await sn()),
								n.applyAction ? await qr(Ee) : await L(Ee))
							: await qt(Ee, Math.max(Ee.status ?? 500, 400)));
				}
				if ((be && n.flashMessage && ta(n), be || Ee.type != 'redirect'))
					Se.completed({ cancelled: be });
				else if (cr) Se.completed({ cancelled: be, clearAll: !0 });
				else {
					const Ie = Zi.subscribe((et) => {
						et ||
							(setTimeout(() => {
								try {
									Ie && Ie();
								} catch {}
							}),
							Se.isSubmitting() && Se.completed({ cancelled: be, clearAll: !0 }));
					});
				}
				Kt();
			}
			if (!dt && zt) {
				ir();
				const Te = await zt(Ye);
				let be;
				(Te instanceof Response
					? (be = Xn(await Te.text()))
					: Te instanceof XMLHttpRequest
						? (be = Xn(Te.responseText))
						: (be = Te),
					be.type === 'error' && (be.status = Te.status),
					Wt({ result: be }));
			}
			return Wt;
		});
		return {
			destroy: () => {
				for (const [Ye, qe] of Object.entries(ct)) ct[Ye] = qe.filter((je) => je === n[Ye]);
				Ht.destroy();
			}
		};
	}
	function vo(m) {
		const T = [];
		if (
			(Ft(m, (W) => {
				if (W.value instanceof File) return (T.push(W.path), 'skip');
				if (Array.isArray(W.value) && W.value.length && W.value.every((ae) => ae instanceof File))
					return (T.push(W.path), 'skip');
			}),
			!T.length)
		)
			return { data: m, paths: T };
		const C = nt(m);
		return (ht(C, T, (W) => Mt(r.data, W)?.value), { data: C, paths: T });
	}
	return {
		form: u,
		formId: o,
		errors: Z,
		message: U,
		constraints: z,
		tainted: me(),
		submitting: xn(ye),
		delayed: xn(Pe),
		timeout: xn(Ce),
		options: n,
		capture: O,
		restore: (m) => {
			Fr({ form: m, untaint: m.tainted ?? !0 });
		},
		async validate(m, T = {}) {
			if (!n.validators) throw new Ge('options.validators must be set to use the validate method.');
			(T.update === void 0 && (T.update = !0),
				T.taint === void 0 && (T.taint = !1),
				typeof T.errors == 'string' && (T.errors = [T.errors]));
			let C;
			const W = jt(m);
			'value' in T
				? T.update === !0 || T.update === 'value'
					? (u.update((ut) => (ht(ut, [W], T.value), ut), { taint: T.taint }), (C = s.form))
					: ((C = nt(s.form)), ht(C, [W], T.value))
				: (C = s.form);
			const ae = await g({ formData: C }),
				Se = Mt(ae.errors, W);
			return (
				Se && Se.value && T.errors && (Se.value = T.errors),
				(T.update === !0 || T.update == 'errors') && Z.update((ut) => (ht(ut, [W], Se?.value), ut)),
				Se?.value
			);
		},
		async validateForm(m = {}) {
			if (!n.validators && !m.schema)
				throw new Ge(
					'options.validators or the schema option must be set to use the validateForm method.'
				);
			const T = m.update ? await v({ paths: [] }, !0, m.schema) : g({ adapter: m.schema }),
				C = Je();
			return (
				m.update &&
					C &&
					setTimeout(() => {
						C && Gn(C, { ...n, scrollToError: m.focusOnError === !1 ? 'off' : n.scrollToError });
					}, 1),
				T || g({ adapter: m.schema })
			);
		},
		allErrors: mn,
		posted: I,
		reset(m) {
			return S({
				message: m?.keepMessage ? s.message : void 0,
				data: m?.data,
				id: m?.id,
				newState: m?.newState
			});
		},
		submit(m) {
			const T = Je() ? Je() : m && m instanceof HTMLElement ? m.closest('form') : void 0;
			if (!T)
				throw new Ge(
					'use:enhance must be added to the form to use submit, or pass a HTMLElement inside the form (or the form itself) as an argument.'
				);
			if (!T.requestSubmit) return T.submit();
			const C =
				m &&
				((m instanceof HTMLButtonElement && m.type == 'submit') ||
					(m instanceof HTMLInputElement && ['submit', 'image'].includes(m.type)));
			T.requestSubmit(C ? m : void 0);
		},
		isTainted: _e,
		enhance: Vi
	};
}
function yc(t) {
	return Kr(rt(t, !1, []), []);
}
function Tn(...t) {
	const e = t.filter((r) => !!r);
	if (e.length) return e.length == 1 ? e[0] : st(...e);
}
function Kr(t, e) {
	if (!t) return;
	let r;
	if (t.union && t.union.length) {
		const n = t.union.map((a) => rt(a, t.isOptional, e)),
			i = n.map((a) => Kr(a, e));
		((r = Tn(r, ...i)),
			r &&
				(t.isNullable || t.isOptional || n.some((a) => a?.isNullable || a?.isOptional)) &&
				delete r.required);
	}
	if (
		(t.array && (r = Tn(r, ...t.array.map((n) => Kr(rt(n, t.isOptional, e), e)))), t.properties)
	) {
		const n = {};
		for (const [i, a] of Object.entries(t.properties)) {
			const s = rt(a, !t.required?.includes(i) || a.default !== void 0, [i]),
				o = Kr(s, [...e, i]);
			typeof o == 'object' && Object.values(o).length > 0 && (n[i] = o);
		}
		r = Tn(r, n);
	}
	return r ?? bc(t);
}
function bc(t) {
	const e = {},
		r = t.schema,
		n = r.type,
		i = r.format;
	if (n == 'integer' && i == 'unix-time') {
		const a = r;
		(a.minimum !== void 0 && (e.min = new Date(a.minimum).toISOString()),
			a.maximum !== void 0 && (e.max = new Date(a.maximum).toISOString()));
	} else if (n == 'string') {
		const a = r,
			s = [
				a.pattern,
				...(a.allOf ? a.allOf.map((o) => (typeof o == 'boolean' ? void 0 : o.pattern)) : [])
			].filter((o) => o !== void 0);
		(s.length > 0 && (e.pattern = s[0]),
			a.minLength !== void 0 && (e.minlength = a.minLength),
			a.maxLength !== void 0 && (e.maxlength = a.maxLength));
	} else if (n == 'number' || n == 'integer') {
		const a = r;
		(a.minimum !== void 0
			? (e.min = a.minimum)
			: a.exclusiveMinimum !== void 0 &&
				(e.min = a.exclusiveMinimum + (n == 'integer' ? 1 : Number.MIN_VALUE)),
			a.maximum !== void 0
				? (e.max = a.maximum)
				: a.exclusiveMaximum !== void 0 &&
					(e.max = a.exclusiveMaximum - (n == 'integer' ? 1 : Number.MIN_VALUE)),
			a.multipleOf !== void 0 && (e.step = a.multipleOf));
	} else if (n == 'array') {
		const a = r;
		(a.minItems !== void 0 && (e.min = a.minItems), a.maxItems !== void 0 && (e.max = a.maxItems));
	}
	return (
		!t.isNullable && !t.isOptional && (e.required = !0),
		Object.keys(e).length > 0 ? e : void 0
	);
}
function wc(t) {
	return _c(Wn(rt(t, !1, []), 0, []));
}
function Wn(t, e, r) {
	if (!t) return '';
	function n() {
		return '  '.repeat(e);
	}
	function i(s) {
		return s
			.map((o) => Wn(rt(o, t?.isOptional ?? !1, r), e + 1, r))
			.filter((o) => o)
			.join('|');
	}
	function a() {
		const s = [];
		return (
			t?.isNullable && s.push('null'),
			t?.isOptional && s.push('undefined'),
			s.length ? '|' + s.join('|') : ''
		);
	}
	if (t.union)
		return (
			`Union {
  ` +
			n() +
			i(t.union) +
			`
` +
			n() +
			'}' +
			a()
		);
	if (t.properties) {
		const s = [];
		for (const [o, c] of Object.entries(t.properties)) {
			const l = rt(c, !t.required?.includes(o) || c.default !== void 0, [o]);
			s.push(o + ': ' + Wn(l, e + 1, r));
		}
		return (
			`Object {
  ` +
			n() +
			s.join(`,
  `) +
			`
` +
			n() +
			'}' +
			a()
		);
	}
	return t.array ? 'Array[' + i(t.array) + ']' + a() : t.types.join('|') + a();
}
function _c(t) {
	let e = 0;
	for (let r = 0, n = t.length; r < n; r++) {
		const i = t.charCodeAt(r);
		((e = (e << 5) - e + i), (e |= 0));
	}
	return (e < 0 && (e = e >>> 0), e.toString(36));
}
function Tc(t, e) {
	if (!t || !('superFormValidationLibrary' in t))
		throw new Ge(
			'Superforms v2 requires a validation adapter for the schema. Import one of your choice from "sveltekit-superforms/adapters" and wrap the schema with it.'
		);
	return (
		e || (e = t.jsonSchema),
		{
			...t,
			constraints: t.constraints ?? yc(e),
			defaults: t.defaults ?? xs(e),
			shape: hc(e),
			id: wc(e)
		}
	);
}
let Ss = !1;
try {
	SUPERFORMS_LEGACY && (Ss = !0);
} catch {}
const ia =
	'FormData parsing failed: Unions are only supported when the dataType option for superForm is set to "json".';
function Ac(t) {
	return (
		new Set(t.map((r) => (['number', 'integer'].includes(r) || r === 'unix-time' ? 'number' : r)))
			.size <= 1
	);
}
function kc(t) {
	if (!t) return !0;
	const e = new Set(
		t.flatMap((r) =>
			r.type
				? Array.isArray(r.type)
					? r.type
					: [r.type]
				: r.const !== void 0
					? [typeof r.const]
					: []
		)
	);
	return e.size <= 1 || (e.size === 2 && e.has('null'));
}
async function Sc(t, e, r) {
	let n;
	return (
		t instanceof FormData
			? (n = di(t, e, r))
			: t instanceof URL || t instanceof URLSearchParams
				? (n = Pc(t, e, r))
				: t instanceof Request
					? (n = await aa(t, e, r))
					: t && typeof t == 'object' && 'request' in t && t.request instanceof Request
						? (n = await aa(t.request, e, r))
						: (n = { id: void 0, data: t, posted: !1 }),
		n
	);
}
async function aa(t, e, r) {
	let n;
	try {
		n = await t.formData();
	} catch (i) {
		if (i instanceof TypeError && i.message.includes('already been consumed')) throw i;
		return { id: void 0, data: void 0, posted: !1 };
	}
	return di(n, e, r);
}
function Pc(t, e, r) {
	t instanceof URL && (t = t.searchParams);
	const n = new FormData();
	for (const [a, s] of t.entries()) n.append(a, s);
	const i = di(n, e, r);
	return ((i.posted = !1), i);
}
function di(t, e, r) {
	function n() {
		if (t.has('__superform_json'))
			try {
				const s =
						r && r.transport
							? Object.fromEntries(Object.entries(r.transport).map(([c, l]) => [c, l.decode]))
							: void 0,
					o = Ba(t.getAll('__superform_json').join('') ?? '', s);
				if (typeof o == 'object') {
					const c = Array.from(t.keys());
					for (const l of c.filter((d) => d.startsWith('__superform_file_'))) {
						const d = jt(l.substring(17));
						ht(o, [d], t.get(l));
					}
					for (const l of c.filter((d) => d.startsWith('__superform_files_'))) {
						const d = jt(l.substring(18)),
							u = t.getAll(l);
						ht(o, [d], Array.from(u));
					}
					return o;
				}
			} catch {}
		return null;
	}
	const i = n(),
		a = t.get('__superform_id')?.toString();
	return i ? { id: a, data: i, posted: !0 } : { id: a, data: Cc(t, e, r), posted: !0 };
}
function Cc(t, e, r) {
	const n = {};
	let i;
	if (r?.strict) i = new Set([...t.keys()].filter((o) => !o.startsWith('__superform_')));
	else {
		let o = [];
		if (e.anyOf) {
			const c = rt(e, !1, []);
			if (c.union?.some((l) => l.type !== 'object'))
				throw new Ze('All form types must be an object if schema is a union.');
			o = c.union?.flatMap((l) => Object.keys(l.properties ?? {})) ?? [];
		}
		i = new Set(
			[
				...o,
				...Object.keys(e.properties ?? {}),
				...(e.additionalProperties ? t.keys() : [])
			].filter((c) => !c.startsWith('__superform_'))
		);
	}
	function a(o, c, l) {
		if (r?.preprocessed && r.preprocessed.includes(o)) return c;
		if (c && typeof c != 'string')
			return (Ss ? r?.allowFiles === !0 : r?.allowFiles !== !1)
				? c.size
					? c
					: l.isNullable
						? null
						: void 0
				: void 0;
		if (l.types.length > 1 && !Ac(l.types)) throw new Ze(ia, o);
		let [d] = l.types;
		return (
			!l.types.length &&
				l.schema.enum &&
				(l.schema.enum.includes(c)
					? (d = 'string')
					: (d = Number.isInteger(parseInt(c, 10)) ? 'integer' : 'string')),
			Ic(o, c, d ?? 'any', l)
		);
	}
	const s = typeof e.additionalProperties == 'object' ? e.additionalProperties : { type: 'string' };
	for (const o of i) {
		const c = e.properties ? e.properties[o] : s;
		rr(c, o);
		const l = rt(c ?? s, !e.required?.includes(o), [o]);
		if (!l || (!l.types.includes('boolean') && !e.additionalProperties && !t.has(o))) continue;
		const d = t.getAll(o);
		if (l.union && l.union.length > 1 && !kc(l.union)) throw new Ze(ia, o);
		if (l.types.includes('array') || l.types.includes('set')) {
			const u = c.items ?? (l.union?.length == 1 ? l.union[0] : void 0);
			if (!u || typeof u == 'boolean' || (Array.isArray(u) && u.length != 1))
				throw new Ze('Arrays must have a single "items" property that defines its type.', o);
			const f = Array.isArray(u) ? u[0] : u;
			rr(f, o);
			const h = rt(f, l.isOptional, [o]);
			if (!h) continue;
			const g = d.length && d.some((v) => v && typeof v != 'string'),
				w = d.map((v) => a(o, v, h));
			(g && w.every((v) => !v) && (w.length = 0),
				(n[o] = l.types.includes('set') ? new Set(w) : w));
		} else n[o] = a(o, d[d.length - 1], l);
	}
	return n;
}
function Ic(t, e, r, n) {
	if (!e) {
		if (r == 'boolean' && n.isOptional && n.schema.default === !0) return !1;
		const a = xs(n.schema, n.isOptional, [t]);
		if (n.schema.enum && a !== null && a !== void 0) return e;
		if (a !== void 0) return a;
		if (n.isNullable) return null;
		if (n.isOptional) return;
	}
	function i() {
		throw new Ze(
			r[0].toUpperCase() +
				r.slice(1) +
				' type found. Set the dataType option to "json" and add use:enhance on the client to use nested data structures. More information: https://superforms.rocks/concepts/nested-data',
			t
		);
	}
	switch (r) {
		case 'string':
		case 'any':
			return e;
		case 'integer':
			return parseInt(e ?? '', 10);
		case 'number':
			return parseFloat(e ?? '');
		case 'boolean':
			return (!!(e != 'false' && e)).valueOf();
		case 'unix-time': {
			const a = new Date(e ?? '');
			return isNaN(a) ? void 0 : a;
		}
		case 'int64':
		case 'bigint':
			return BigInt(e ?? '.');
		case 'symbol':
			return Symbol(String(e));
		case 'set':
		case 'array':
		case 'object':
			return i();
		default:
			throw new Ge('Unsupported schema type for FormData: ' + r);
	}
}
async function Ec(t, e, r) {
	t && 'superFormValidationLibrary' in t && ((r = e), (e = t), (t = void 0));
	const n = e,
		i = r?.defaults ?? n.defaults,
		a = n.jsonSchema,
		s = await Sc(t, a, r),
		o = r?.errors ?? (r?.strict ? !0 : !!s.data),
		c = r?.strict ? (s.data ?? {}) : ea(s.data, i);
	let l;
	s.data || o ? (l = await n.validate(c)) : (l = { success: !1, issues: [] });
	const d = l.success,
		u = d || !o ? {} : bs(l.issues, n.shape),
		f = d ? l.data : ic(r?.strict ? ea(c, i) : c, i, a, l.issues, r?.preprocessed);
	let h;
	if (a.additionalProperties === !1) {
		h = {};
		for (const w of Object.keys(a.properties ?? {})) w in f && (h[w] = f[w]);
	} else h = f;
	const g = { id: s.id ?? r?.id ?? n.id, valid: d, posted: s.posted, errors: u, data: h };
	return (
		s.posted ||
			((g.constraints = n.constraints), Object.keys(n.shape).length && (g.shape = n.shape)),
		g
	);
}
var An, sa;
function Mc() {
	if (sa) return An;
	sa = 1;
	function t(r) {
		return (typeof r != 'object' && typeof r != 'function') || r === null;
	}
	function e() {
		((this.childBranches = new WeakMap()),
			(this.primitiveKeys = new Map()),
			(this.hasValue = !1),
			(this.value = void 0));
	}
	return (
		(e.prototype.has = function (n) {
			var i = t(n) ? this.primitiveKeys.get(n) : n;
			return i ? this.childBranches.has(i) : !1;
		}),
		(e.prototype.get = function (n) {
			var i = t(n) ? this.primitiveKeys.get(n) : n;
			return i ? this.childBranches.get(i) : void 0;
		}),
		(e.prototype.resolveBranch = function (n) {
			if (this.has(n)) return this.get(n);
			var i = new e(),
				a = this.createKey(n);
			return (this.childBranches.set(a, i), i);
		}),
		(e.prototype.setValue = function (n) {
			return ((this.hasValue = !0), (this.value = n));
		}),
		(e.prototype.createKey = function (n) {
			if (t(n)) {
				var i = {};
				return (this.primitiveKeys.set(n, i), i);
			}
			return n;
		}),
		(e.prototype.clear = function () {
			if (arguments.length === 0)
				((this.childBranches = new WeakMap()),
					this.primitiveKeys.clear(),
					(this.hasValue = !1),
					(this.value = void 0));
			else if (arguments.length === 1) {
				var n = arguments[0];
				if (t(n)) {
					var i = this.primitiveKeys.get(n);
					i && (this.childBranches.delete(i), this.primitiveKeys.delete(n));
				} else this.childBranches.delete(n);
			} else {
				var a = arguments[0];
				if (this.has(a)) {
					var s = this.get(a);
					s.clear.apply(s, Array.prototype.slice.call(arguments, 1));
				}
			}
		}),
		(An = function (n) {
			var i = new e();
			function a() {
				var s = Array.prototype.slice.call(arguments),
					o = s.reduce(function (d, u) {
						return d.resolveBranch(u);
					}, i);
				if (o.hasValue) return o.value;
				var c = n.apply(null, s);
				return o.setValue(c);
			}
			return ((a.clear = i.clear.bind(i)), a);
		}),
		An
	);
}
var kn, oa;
function Oc() {
	return (oa || ((oa = 1), (kn = Mc())), kn);
}
var Fc = Oc();
const Dc = ai(Fc),
	Ps = Dc;
var Sn;
function Cs(t) {
	return {
		lang: t?.lang ?? Sn?.lang,
		message: t?.message,
		abortEarly: t?.abortEarly ?? Sn?.abortEarly,
		abortPipeEarly: t?.abortPipeEarly ?? Sn?.abortPipeEarly
	};
}
var Rc;
function Nc(t) {
	return Rc?.get(t);
}
var Bc;
function zc(t) {
	return Bc?.get(t);
}
var Lc;
function $c(t, e) {
	return Lc?.get(t)?.get(e);
}
function Uc(t) {
	const e = typeof t;
	return e === 'string'
		? `"${t}"`
		: e === 'number' || e === 'bigint' || e === 'boolean'
			? `${t}`
			: e === 'object' || e === 'function'
				? ((t && Object.getPrototypeOf(t)?.constructor?.name) ?? 'null')
				: e;
}
function hr(t, e, r, n, i) {
	const a = i && 'input' in i ? i.input : r.value,
		s = i?.expected ?? t.expects ?? null,
		o = i?.received ?? Uc(a),
		c = {
			kind: t.kind,
			type: t.type,
			input: a,
			expected: s,
			received: o,
			message: `Invalid ${e}: ${s ? `Expected ${s} but r` : 'R'}eceived ${o}`,
			requirement: t.requirement,
			path: i?.path,
			issues: i?.issues,
			lang: n.lang,
			abortEarly: n.abortEarly,
			abortPipeEarly: n.abortPipeEarly
		},
		l = t.kind === 'schema',
		d =
			i?.message ??
			t.message ??
			$c(t.reference, c.lang) ??
			(l ? zc(c.lang) : null) ??
			n.message ??
			Nc(c.lang);
	(d !== void 0 && (c.message = typeof d == 'function' ? d(c) : d),
		l && (r.typed = !1),
		r.issues ? r.issues.push(c) : (r.issues = [c]));
}
function Cr(t) {
	return {
		version: 1,
		vendor: 'valibot',
		validate(e) {
			return t['~run']({ value: e }, Cs());
		}
	};
}
function Is(t, e) {
	return {
		kind: 'validation',
		type: 'min_length',
		reference: Is,
		async: !1,
		expects: `>=${t}`,
		requirement: t,
		message: e,
		'~run'(r, n) {
			return (
				r.typed &&
					r.value.length < this.requirement &&
					hr(this, 'length', r, n, { received: `${r.value.length}` }),
				r
			);
		}
	};
}
function jc(t, e, r) {
	return typeof t.fallback == 'function' ? t.fallback(e, r) : t.fallback;
}
function Vc(t, e, r) {
	return typeof t.default == 'function' ? t.default(e, r) : t.default;
}
function Es(t, e) {
	return {
		kind: 'schema',
		type: 'array',
		reference: Es,
		expects: 'Array',
		async: !1,
		item: t,
		message: e,
		get '~standard'() {
			return Cr(this);
		},
		'~run'(r, n) {
			const i = r.value;
			if (Array.isArray(i)) {
				((r.typed = !0), (r.value = []));
				for (let a = 0; a < i.length; a++) {
					const s = i[a],
						o = this.item['~run']({ value: s }, n);
					if (o.issues) {
						const c = { type: 'array', origin: 'value', input: i, key: a, value: s };
						for (const l of o.issues)
							(l.path ? l.path.unshift(c) : (l.path = [c]), r.issues?.push(l));
						if ((r.issues || (r.issues = o.issues), n.abortEarly)) {
							r.typed = !1;
							break;
						}
					}
					(o.typed || (r.typed = !1), r.value.push(o.value));
				}
			} else hr(this, 'type', r, n);
			return r;
		}
	};
}
function Ms(t) {
	return {
		kind: 'schema',
		type: 'file',
		reference: Ms,
		expects: 'File',
		async: !1,
		message: t,
		get '~standard'() {
			return Cr(this);
		},
		'~run'(e, r) {
			return (e.value instanceof File ? (e.typed = !0) : hr(this, 'type', e, r), e);
		}
	};
}
function Os(t, e) {
	return {
		kind: 'schema',
		type: 'object',
		reference: Os,
		expects: 'Object',
		async: !1,
		entries: t,
		message: e,
		get '~standard'() {
			return Cr(this);
		},
		'~run'(r, n) {
			const i = r.value;
			if (i && typeof i == 'object') {
				((r.typed = !0), (r.value = {}));
				for (const a in this.entries) {
					const s = this.entries[a];
					if (
						a in i ||
						((s.type === 'exact_optional' || s.type === 'optional' || s.type === 'nullish') &&
							s.default !== void 0)
					) {
						const o = a in i ? i[a] : Vc(s),
							c = s['~run']({ value: o }, n);
						if (c.issues) {
							const l = { type: 'object', origin: 'value', input: i, key: a, value: o };
							for (const d of c.issues)
								(d.path ? d.path.unshift(l) : (d.path = [l]), r.issues?.push(d));
							if ((r.issues || (r.issues = c.issues), n.abortEarly)) {
								r.typed = !1;
								break;
							}
						}
						(c.typed || (r.typed = !1), (r.value[a] = c.value));
					} else if (s.fallback !== void 0) r.value[a] = jc(s);
					else if (
						s.type !== 'exact_optional' &&
						s.type !== 'optional' &&
						s.type !== 'nullish' &&
						(hr(this, 'key', r, n, {
							input: void 0,
							expected: `"${a}"`,
							path: [{ type: 'object', origin: 'key', input: i, key: a, value: i[a] }]
						}),
						n.abortEarly)
					)
						break;
				}
			} else hr(this, 'type', r, n);
			return r;
		}
	};
}
function Fs(t) {
	return {
		kind: 'schema',
		type: 'string',
		reference: Fs,
		expects: 'string',
		async: !1,
		message: t,
		get '~standard'() {
			return Cr(this);
		},
		'~run'(e, r) {
			return (typeof e.value == 'string' ? (e.typed = !0) : hr(this, 'type', e, r), e);
		}
	};
}
function la(...t) {
	return {
		...t[0],
		pipe: t,
		get '~standard'() {
			return Cr(this);
		},
		'~run'(e, r) {
			for (const n of t)
				if (n.kind !== 'metadata') {
					if (e.issues && (n.kind === 'schema' || n.kind === 'transformation')) {
						e.typed = !1;
						break;
					}
					(!e.issues || (!r.abortEarly && !r.abortPipeEarly)) && (e = n['~run'](e, r));
				}
			return e;
		}
	};
}
async function Xc(t, e, r) {
	const n = await t['~run']({ value: e }, Cs(r));
	return { typed: n.typed, success: !n.issues, output: n.value, issues: n.issues };
}
function Pn(t, e, r) {
	return typeof t.default == 'function' ? t.default(e, r) : t.default;
}
var Gc = '__json_schema_features';
function Hc(t) {
	return t[Gc];
}
function Ds(t, e) {
	const r = Hc(t);
	r && Object.assign(e, r);
}
function gr(t, e, r) {
	if (!e(t)) throw new Error(r.replace('%', String(t)));
	return t;
}
var qc = 'http://json-schema.org/draft-07/schema#';
function Wc(t) {
	return (
		(typeof t == 'number' && !Number.isNaN(t)) ||
		typeof t == 'string' ||
		typeof t == 'boolean' ||
		t === null
	);
}
var Cn = (t) => gr(t, Wc, 'Unsupported literal value type: %');
function Rs(t, e) {
	if (t === e) return !0;
	if (typeof t == 'object' && typeof e == 'object') {
		const r = Object.keys(t),
			n = Object.keys(e);
		return r.length !== n.length ? !1 : r.every((i) => Rs(t[i], e[i]));
	}
	return !1;
}
function dn(t) {
	return (e) => !!e && e.type === t;
}
var Kc = dn('nullish'),
	Yc = dn('optional'),
	Zc = dn('string'),
	ca = dn('never'),
	fi = (t) => `#/definitions/${t}`,
	Yr = {
		any: () => ({}),
		null: () => ({ const: null }),
		literal: ({ literal: t }) => ({ const: Cn(t) }),
		number: () => ({ type: 'number' }),
		string: () => ({ type: 'string' }),
		boolean: () => ({ type: 'boolean' }),
		optional: (t, e) => {
			const r = e(t.wrapped),
				n = Pn(t);
			return (n !== void 0 && (r.default = n), r);
		},
		nullish: (t, e) => {
			const r = { anyOf: [{ const: null }, e(t.wrapped)] },
				n = Pn(t);
			return (n !== void 0 && (r.default = n), r);
		},
		nullable: (t, e) => {
			const r = { anyOf: [{ const: null }, e(t.wrapped)] },
				n = Pn(t);
			return (n !== void 0 && (r.default = n), r);
		},
		picklist: ({ options: t }) => ({ enum: t.map(Cn) }),
		enum: (t) => ({ enum: Object.values(t.enum).map(Cn) }),
		union: ({ options: t }, e) => ({ anyOf: t.map(e) }),
		intersect: ({ options: t }, e) => ({ allOf: t.map(e) }),
		array: ({ item: t }, e) => ({ type: 'array', items: e(t) }),
		tuple_with_rest({ items: t, rest: e }, r) {
			const n = t.length;
			let i,
				a = t.map(r),
				s;
			if (ca(e)) i = n;
			else if (e) {
				const o = r(e);
				a.length === 1 && Rs(a[0], o) ? (a = a[0]) : (s = o);
			}
			return {
				type: 'array',
				items: a,
				...(s && { additionalItems: s }),
				...(n && { minItems: n }),
				...(i && { maxItems: i })
			};
		},
		strict_tuple({ items: t }, e) {
			const r = t.map(e);
			return { type: 'array', items: r, minItems: r.length, maxItems: r.length };
		},
		tuple({ items: t }, e, r) {
			const n = t.map(e);
			return { type: 'array', items: n, minItems: n.length };
		},
		object_with_rest({ entries: t, rest: e }, r, n) {
			const i = {},
				a = [];
			for (const [c, l] of Object.entries(t)) {
				const d = l;
				(!Yc(d) && !Kc(d) && a.push(c), (i[c] = r(d)), Ds(l, i[c]));
			}
			let s;
			e ? (s = ca(e) ? !1 : r(e)) : n.strictObjectTypes && (s = !1);
			const o = { type: 'object', properties: i };
			return (s !== void 0 && (o.additionalProperties = s), a.length && (o.required = a), o);
		},
		object(t, e, r) {
			return Yr.object_with_rest(t, e, r);
		},
		strict_object(t, e, r) {
			return { ...Yr.object_with_rest(t, e, r), additionalProperties: !1 };
		},
		record({ key: t, value: e }, r) {
			return (
				gr(t, Zc, 'Unsupported record key type: %'),
				{ type: 'object', additionalProperties: r(e) }
			);
		},
		lazy(t, e, r) {
			const n = t.getter({}),
				i = r.defNameMap.get(n);
			if (!i) throw new Error('Type inside lazy schema must be provided in the definitions');
			return { $ref: fi(i) };
		},
		date(t, e, r) {
			if (!r.dateStrategy)
				throw new Error('The "dateStrategy" option must be set to handle date validators');
			switch (r.dateStrategy) {
				case 'integer':
					return { type: 'integer', format: 'unix-time' };
				case 'string':
					return { type: 'string', format: 'date-time' };
			}
		},
		undefined(t, e, r) {
			if (!r.undefinedStrategy)
				throw new Error(
					'The "undefinedStrategy" option must be set to handle the `undefined` schema'
				);
			switch (r.undefinedStrategy) {
				case 'any':
					return {};
				case 'null':
					return { type: 'null' };
			}
		},
		bigint(t, e, r) {
			if (!r.bigintStrategy)
				throw new Error('The "bigintStrategy" option must be set to handle `bigint` validators');
			switch (r.bigintStrategy) {
				case 'integer':
					return { type: 'integer', format: 'int64' };
				case 'string':
					return { type: 'string' };
			}
		},
		variant({ options: t }, ...e) {
			return Yr.union({ options: t }, ...e);
		}
	},
	Jc = {
		description: ({ description: t }) => ({ description: t }),
		'@gcornut/to-json-schema/json_schema_metadata': ({ metadata: t }) => t
	};
function In(t, e, r) {
	return (
		gr(
			e,
			() => r.dateStrategy === 'integer',
			`${t} validation is only available with 'integer' date strategy`
		),
		gr(e, (n) => n instanceof Date, `Non-date value used for ${t} validation`),
		e.getTime()
	);
}
var Qc = {
	array: {
		length: ({ requirement: t }) => ({ minItems: t, maxItems: t }),
		min_length: ({ requirement: t }) => ({ minItems: t }),
		max_length: ({ requirement: t }) => ({ maxItems: t })
	},
	string: {
		value: ({ requirement: t }) => ({ const: t }),
		length: ({ requirement: t }) => ({ minLength: t, maxLength: t }),
		min_length: ({ requirement: t }) => ({ minLength: t }),
		max_length: ({ requirement: t }) => ({ maxLength: t }),
		regex: ({ requirement: t }) => ({ pattern: t.source }),
		email: () => ({ format: 'email' }),
		iso_date: () => ({ format: 'date' }),
		iso_timestamp: () => ({ format: 'date-time' }),
		ipv4: () => ({ format: 'ipv4' }),
		ipv6: () => ({ format: 'ipv6' }),
		uuid: () => ({ format: 'uuid' })
	},
	number: {
		value: ({ requirement: t }) => ({ const: t }),
		min_value: ({ requirement: t }) => ({ minimum: t }),
		max_value: ({ requirement: t }) => ({ maximum: t }),
		multiple_of: ({ requirement: t }) => ({ multipleOf: t }),
		integer: () => ({ type: 'integer' })
	},
	boolean: { value: ({ requirement: t }) => ({ const: t }) },
	date: {
		value: ({ requirement: t }, e) => ({ const: In('value', t, e) }),
		min_value: ({ requirement: t }, e) => ({ minimum: In('minValue', t, e) }),
		max_value: ({ requirement: t }, e) => ({ maximum: In('maxValue', t, e) })
	}
};
function Ns(t, e, r) {
	const [n, ...i] = e || [];
	if (!n) return {};
	const a = Ns(t, n?.pipe, r);
	function s(o, c) {
		var l, d, u;
		const f = c.type,
			h =
				((d = (l = r.customValidationConversion) == null ? void 0 : l[t]) == null
					? void 0
					: d[f]) ||
				((u = Qc[t]) == null ? void 0 : u[f]) ||
				Jc[f];
		if (!h && r.ignoreUnknownValidation) return {};
		gr(h, Boolean, `Unsupported valibot validation \`${f}\` for schema \`${t}\``);
		const g = h(c, r);
		return Object.assign(o, g);
	}
	return i.reduce(s, a);
}
function eu(t = {}) {
	const e = new Map();
	for (const [r, n] of Object.entries(t)) e.set(n, r);
	return e;
}
function tu(t) {
	const e = {};
	function r(n) {
		var i;
		const a = t.defNameMap.get(n),
			s = a && fi(a);
		if (s && s in e) return { $ref: s };
		const o = ((i = t.customSchemaConversion) == null ? void 0 : i[n.type]) || Yr[n.type];
		gr(o, Boolean, `Unsupported valibot schema: ${n?.type || n}`);
		let c = o(n, r, t) || {};
		const l = Ns(n.type, n.pipe, t);
		return ((c = { ...c, ...l }), Ds(n, c), s ? ((e[a] = c), { $ref: s }) : c);
	}
	return { definitions: e, converter: r };
}
function ru(t) {
	const { schema: e, definitions: r, ...n } = t,
		i = eu(r),
		{ definitions: a, converter: s } = tu({ defNameMap: i, ...n });
	if (!e && !r) throw new Error('No main schema or definitions provided.');
	r && Object.values(r).forEach(s);
	const o = e && s(e),
		c = e && i.get(e),
		l = { $schema: qc };
	return (
		c ? (l.$ref = fi(c)) : Object.assign(l, o),
		Object.keys(a).length && (l.definitions = a),
		l
	);
}
const nu = {
		strictObjectTypes: !0,
		dateStrategy: 'integer',
		bigintStrategy: 'integer',
		ignoreUnknownValidation: !0,
		customSchemaConversion: {
			custom: () => ({}),
			instance: () => ({}),
			file: () => ({}),
			blob: () => ({})
		}
	},
	iu = (t) => ru({ ...nu, ...t });
async function Bs(t, e, r) {
	const n = await Xc(t, e, r);
	return n.success
		? { data: n.output, success: !0 }
		: {
				issues: n.issues.map(({ message: i, path: a }) => ({
					message: i,
					path: a?.map(({ key: s }) => s)
				})),
				success: !1
			};
}
function au(t, e = {}) {
	return Tc({
		superFormValidationLibrary: 'valibot',
		validate: async (r) => Bs(t, r, e?.config),
		jsonSchema: e?.jsonSchema ?? iu({ schema: t, ...e }),
		defaults: 'defaults' in e ? e.defaults : void 0
	});
}
function su(t, e = {}) {
	return { superFormValidationLibrary: 'valibot', validate: async (r) => Bs(t, r, e?.config) };
}
const ou = Ps(au),
	lu = Ps(su);
new Set('ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789');
const zs = Os({ attachments: la(Es(la(Ms())), Is(1)), rootFolder: Fs() }),
	cu = async () => {
		const { data: t, err: e } = await Bo();
		return e
			? e.code === 401
				? yo(307, it('/auth/sign-in'))
				: bo(e.code, e.message)
			: { user: t.user, session: t.session, uploadForm: await Ec({}, ou(zs)) };
	},
	Bg = Object.freeze(
		Object.defineProperty({ __proto__: null, load: cu }, Symbol.toStringTag, { value: 'Module' })
	);
function pi(t) {
	Ua(() => kt(() => t()));
}
const mi = vr({ component: 'avatar', parts: ['root', 'image', 'fallback'] }),
	hi = new Pr('Avatar.Root');
class gi {
	static create(e) {
		return hi.set(new gi(e));
	}
	opts;
	domContext;
	attachment;
	constructor(e) {
		((this.opts = e),
			(this.domContext = new oi(this.opts.ref)),
			(this.loadImage = this.loadImage.bind(this)),
			(this.attachment = _t(this.opts.ref)));
	}
	loadImage(e, r, n) {
		if (this.opts.loadingStatus.current === 'loaded') return;
		let i;
		const a = new Image();
		return (
			(a.src = e),
			r !== void 0 && (a.crossOrigin = r),
			n && (a.referrerPolicy = n),
			(this.opts.loadingStatus.current = 'loading'),
			(a.onload = () => {
				i = this.domContext.setTimeout(() => {
					this.opts.loadingStatus.current = 'loaded';
				}, this.opts.delayMs.current);
			}),
			(a.onerror = () => {
				this.opts.loadingStatus.current = 'error';
			}),
			() => {
				i && this.domContext.clearTimeout(i);
			}
		);
	}
	#e = P(() => ({
		id: this.opts.id.current,
		[mi.root]: '',
		'data-status': this.opts.loadingStatus.current,
		...this.attachment
	}));
	get props() {
		return x(this.#e);
	}
	set props(e) {
		K(this.#e, e);
	}
}
class vi {
	static create(e) {
		return new vi(e, hi.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.attachment = _t(this.opts.ref)),
			mr.pre([() => this.opts.src.current, () => this.opts.crossOrigin.current], ([n, i]) => {
				if (!n) {
					this.root.opts.loadingStatus.current = 'error';
					return;
				}
				this.root.loadImage(n, i, this.opts.referrerPolicy.current);
			}));
	}
	#e = P(() => ({
		id: this.opts.id.current,
		style: { display: this.root.opts.loadingStatus.current === 'loaded' ? 'block' : 'none' },
		'data-status': this.root.opts.loadingStatus.current,
		[mi.image]: '',
		src: this.opts.src.current,
		crossorigin: this.opts.crossOrigin.current,
		referrerpolicy: this.opts.referrerPolicy.current,
		...this.attachment
	}));
	get props() {
		return x(this.#e);
	}
	set props(e) {
		K(this.#e, e);
	}
}
class xi {
	static create(e) {
		return new xi(e, hi.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e), (this.root = r), (this.attachment = _t(this.opts.ref)));
	}
	#e = P(() => (this.root.opts.loadingStatus.current === 'loaded' ? { display: 'none' } : void 0));
	get style() {
		return x(this.#e);
	}
	set style(e) {
		K(this.#e, e);
	}
	#t = P(() => ({
		style: this.style,
		'data-status': this.root.opts.loadingStatus.current,
		[mi.fallback]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#t);
	}
	set props(e) {
		K(this.#t, e);
	}
}
var uu = N('<div><!></div>');
function du(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'delayMs', 3, 0),
		i = _(e, 'loadingStatus', 15, 'loading'),
		a = _(e, 'id', 19, () => pt(r)),
		s = _(e, 'ref', 15, null),
		o = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'delayMs',
			'loadingStatus',
			'onLoadingStatusChange',
			'child',
			'children',
			'id',
			'ref'
		]);
	const c = gi.create({
			delayMs: X.with(() => n()),
			loadingStatus: X.with(
				() => i(),
				(g) => {
					i() !== g && (i(g), e.onLoadingStatusChange?.(g));
				}
			),
			id: X.with(() => a()),
			ref: X.with(
				() => s(),
				(g) => s(g)
			)
		}),
		l = P(() => Ve(o, c.props));
	var d = A(),
		u = b(d);
	{
		var f = (g) => {
				var w = A(),
					v = b(w);
				(F(
					v,
					() => e.child,
					() => ({ props: x(l) })
				),
					p(g, w));
			},
			h = (g) => {
				var w = uu();
				ue(w, () => ({ ...x(l) }));
				var v = M(w);
				(F(v, () => e.children ?? te), E(w), p(g, w));
			};
		ce(u, (g) => {
			e.child ? g(f) : g(h, !1);
		});
	}
	(p(t, d), R());
}
var fu = N('<img/>');
function pu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = _(e, 'crossorigin', 3, void 0),
		s = _(e, 'referrerpolicy', 3, void 0),
		o = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'src',
			'child',
			'id',
			'ref',
			'crossorigin',
			'referrerpolicy'
		]);
	const c = vi.create({
			src: X.with(() => e.src),
			id: X.with(() => n()),
			ref: X.with(
				() => i(),
				(g) => i(g)
			),
			crossOrigin: X.with(() => a()),
			referrerPolicy: X.with(() => s())
		}),
		l = P(() => Ve(o, c.props));
	var d = A(),
		u = b(d);
	{
		var f = (g) => {
				var w = A(),
					v = b(w);
				(F(
					v,
					() => e.child,
					() => ({ props: x(l) })
				),
					p(g, w));
			},
			h = (g) => {
				var w = fu();
				(ue(w, () => ({ ...x(l), src: e.src })), zo(w), p(g, w));
			};
		ce(u, (g) => {
			e.child ? g(f) : g(h, !1);
		});
	}
	(p(t, d), R());
}
var mu = N('<span><!></span>');
function hu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'children', 'child', 'id', 'ref']);
	const s = xi.create({
			id: X.with(() => n()),
			ref: X.with(
				() => i(),
				(f) => i(f)
			)
		}),
		o = P(() => Ve(a, s.props));
	var c = A(),
		l = b(c);
	{
		var d = (f) => {
				var h = A(),
					g = b(h);
				(F(
					g,
					() => e.child,
					() => ({ props: x(o) })
				),
					p(f, h));
			},
			u = (f) => {
				var h = mu();
				ue(h, () => ({ ...x(o) }));
				var g = M(h);
				(F(g, () => e.children ?? te), E(h), p(f, h));
			};
		ce(l, (f) => {
			e.child ? f(d) : f(u, !1);
		});
	}
	(p(t, c), R());
}
var gu = Eo(
		'<svg viewBox="0 0 30 10" preserveAspectRatio="none" data-arrow=""><polygon points="0,0 30,0 15,10" fill="currentColor"></polygon></svg>'
	),
	vu = N('<span><!></span>');
function xu(t, e) {
	D(e, !0);
	let r = _(e, 'id', 19, li),
		n = _(e, 'width', 3, 10),
		i = _(e, 'height', 3, 5),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'id', 'children', 'child', 'width', 'height']);
	const s = P(() => Ve(a, { id: r() }));
	var o = A(),
		c = b(o);
	{
		var l = (u) => {
				var f = A(),
					h = b(f);
				(F(
					h,
					() => e.child,
					() => ({ props: x(s) })
				),
					p(u, f));
			},
			d = (u) => {
				var f = vu();
				ue(f, () => ({ ...x(s) }));
				var h = M(f);
				{
					var g = (v) => {
							var y = A(),
								k = b(y);
							(F(k, () => e.children ?? te), p(v, y));
						},
						w = (v) => {
							var y = gu();
							(ze(() => {
								(Ot(y, 'width', n()), Ot(y, 'height', i()));
							}),
								p(v, y));
						};
					ce(h, (v) => {
						e.children ? v(g) : v(w, !1);
					});
				}
				(E(f), p(u, f));
			};
		ce(c, (u) => {
			e.child ? u(l) : u(d, !1);
		});
	}
	(p(t, o), R());
}
function yu(t, e) {
	D(e, !0);
	let r = _(e, 'id', 19, li),
		n = _(e, 'ref', 15, null),
		i = H(e, ['$$slots', '$$events', '$$legacy', 'id', 'ref']);
	const a = Xo.create({
			id: X.with(() => r()),
			ref: X.with(
				() => n(),
				(o) => n(o)
			)
		}),
		s = P(() => Ve(i, a.props));
	(xu(
		t,
		oe(() => x(s))
	),
		R());
}
const bu = vr({ component: 'separator', parts: ['root'] });
class yi {
	static create(e) {
		return new yi(e);
	}
	opts;
	attachment;
	constructor(e) {
		((this.opts = e), (this.attachment = _t(e.ref)));
	}
	#e = P(() => ({
		id: this.opts.id.current,
		role: this.opts.decorative.current ? 'none' : 'separator',
		'aria-orientation': ui(this.opts.orientation.current),
		'aria-hidden': dl(this.opts.decorative.current),
		'data-orientation': tr(this.opts.orientation.current),
		[bu.root]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#e);
	}
	set props(e) {
		K(this.#e, e);
	}
}
var wu = N('<div><!></div>');
function _u(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = _(e, 'decorative', 3, !1),
		s = _(e, 'orientation', 3, 'horizontal'),
		o = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'ref',
			'child',
			'children',
			'decorative',
			'orientation'
		]);
	const c = yi.create({
			ref: X.with(
				() => i(),
				(g) => i(g)
			),
			id: X.with(() => n()),
			decorative: X.with(() => a()),
			orientation: X.with(() => s())
		}),
		l = P(() => Ve(o, c.props));
	var d = A(),
		u = b(d);
	{
		var f = (g) => {
				var w = A(),
					v = b(w);
				(F(
					v,
					() => e.child,
					() => ({ props: x(l) })
				),
					p(g, w));
			},
			h = (g) => {
				var w = wu();
				ue(w, () => ({ ...x(l) }));
				var v = M(w);
				(F(v, () => e.children ?? te), E(w), p(g, w));
			};
		ce(u, (g) => {
			e.child ? g(f) : g(h, !1);
		});
	}
	(p(t, d), R());
}
var Tu = N('<div><!></div>');
function Au(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'ref', 15, null),
		i = _(e, 'id', 19, () => pt(r)),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'children', 'child', 'ref', 'id']);
	const s = Go.create({
			id: X.with(() => i()),
			ref: X.with(
				() => n(),
				(f) => n(f)
			)
		}),
		o = P(() => Ve(a, s.props));
	var c = A(),
		l = b(c);
	{
		var d = (f) => {
				var h = A(),
					g = b(h);
				(F(
					g,
					() => e.child,
					() => ({ props: x(o) })
				),
					p(f, h));
			},
			u = (f) => {
				var h = Tu();
				ue(h, () => ({ ...x(o) }));
				var g = M(h);
				(F(g, () => e.children ?? te), E(h), p(f, h));
			};
		ce(l, (f) => {
			e.child ? f(d) : f(u, !1);
		});
	}
	(p(t, c), R());
}
var ku = N('<div><!></div>');
function Su(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'ref', 15, null),
		i = _(e, 'id', 19, () => pt(r)),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'id', 'child', 'children']);
	const s = Ho.create({
			id: X.with(() => i()),
			ref: X.with(
				() => n(),
				(f) => n(f)
			)
		}),
		o = P(() => Ve(a, s.props));
	var c = A(),
		l = b(c);
	{
		var d = (f) => {
				var h = A(),
					g = b(h);
				(F(
					g,
					() => e.child,
					() => ({ props: x(o) })
				),
					p(f, h));
			},
			u = (f) => {
				var h = ku();
				ue(h, () => ({ ...x(o) }));
				var g = M(h);
				(F(g, () => e.children ?? te), E(h), p(f, h));
			};
		ce(l, (f) => {
			e.child ? f(d) : f(u, !1);
		});
	}
	(p(t, c), R());
}
const Kn = vr({ component: 'popover', parts: ['root', 'trigger', 'content', 'close'] }),
	bi = new Pr('Popover.Root');
class wi {
	static create(e) {
		return bi.set(new wi(e));
	}
	opts;
	#e = Le(null);
	get contentNode() {
		return x(this.#e);
	}
	set contentNode(e) {
		K(this.#e, e, !0);
	}
	#t = Le(null);
	get triggerNode() {
		return x(this.#t);
	}
	set triggerNode(e) {
		K(this.#t, e, !0);
	}
	constructor(e) {
		((this.opts = e),
			new Ga({
				ref: X.with(() => this.contentNode),
				open: this.opts.open,
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}));
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	handleClose() {
		this.opts.open.current && (this.opts.open.current = !1);
	}
}
class _i {
	static create(e) {
		return new _i(e, bi.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.attachment = _t(this.opts.ref, (n) => (this.root.triggerNode = n))),
			(this.onclick = this.onclick.bind(this)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	onclick(e) {
		this.opts.disabled.current || (e.button === 0 && this.root.toggleOpen());
	}
	onkeydown(e) {
		this.opts.disabled.current ||
			((e.key === fl || e.key === pl) && (e.preventDefault(), this.root.toggleOpen()));
	}
	#e() {
		if (this.root.opts.open.current && this.root.contentNode?.id) return this.root.contentNode?.id;
	}
	#t = P(() => ({
		id: this.opts.id.current,
		'aria-haspopup': 'dialog',
		'aria-expanded': ml(this.root.opts.open.current),
		'data-state': ss(this.root.opts.open.current),
		'aria-controls': this.#e(),
		[Kn.trigger]: '',
		disabled: this.opts.disabled.current,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		...this.attachment
	}));
	get props() {
		return x(this.#t);
	}
	set props(e) {
		K(this.#t, e);
	}
}
class Ti {
	static create(e) {
		return new Ti(e, bi.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.attachment = _t(this.opts.ref, (n) => (this.root.contentNode = n))));
	}
	onInteractOutside = (e) => {
		(this.opts.onInteractOutside.current(e),
			!(
				e.defaultPrevented ||
				!Ha(e.target) ||
				e.target.closest(Kn.selector('trigger')) === this.root.triggerNode
			) && this.root.handleClose());
	};
	onEscapeKeydown = (e) => {
		(this.opts.onEscapeKeydown.current(e), !e.defaultPrevented && this.root.handleClose());
	};
	onCloseAutoFocus = (e) => {
		(this.opts.onCloseAutoFocus.current(e),
			!e.defaultPrevented && (e.preventDefault(), this.root.triggerNode?.focus()));
	};
	#e = P(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return x(this.#e);
	}
	set snippetProps(e) {
		K(this.#e, e);
	}
	#t = P(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		'data-state': ss(this.root.opts.open.current),
		[Kn.content]: '',
		style: { pointerEvents: 'auto' },
		...this.attachment
	}));
	get props() {
		return x(this.#t);
	}
	set props(e) {
		K(this.#t, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onCloseAutoFocus: this.onCloseAutoFocus
	};
}
var Pu = N('<div><div><!></div></div>'),
	Cu = N('<div><div><!></div></div>');
function Iu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'ref', 15, null),
		i = _(e, 'id', 19, () => pt(r)),
		a = _(e, 'forceMount', 3, !1),
		s = _(e, 'onCloseAutoFocus', 3, St),
		o = _(e, 'onEscapeKeydown', 3, St),
		c = _(e, 'onInteractOutside', 3, St),
		l = _(e, 'trapFocus', 3, !0),
		d = _(e, 'preventScroll', 3, !1),
		u = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'child',
			'children',
			'ref',
			'id',
			'forceMount',
			'onCloseAutoFocus',
			'onEscapeKeydown',
			'onInteractOutside',
			'trapFocus',
			'preventScroll'
		]);
	const f = Ti.create({
			id: X.with(() => i()),
			ref: X.with(
				() => n(),
				(k) => n(k)
			),
			onInteractOutside: X.with(() => c()),
			onEscapeKeydown: X.with(() => o()),
			onCloseAutoFocus: X.with(() => s())
		}),
		h = P(() => Ve(u, f.props));
	var g = A(),
		w = b(g);
	{
		var v = (k) => {
				qa(
					k,
					oe(
						() => x(h),
						() => f.popperProps,
						{
							get ref() {
								return f.opts.ref;
							},
							get enabled() {
								return f.root.opts.open.current;
							},
							get id() {
								return i();
							},
							get trapFocus() {
								return l();
							},
							get preventScroll() {
								return d();
							},
							loop: !0,
							forceMount: !0,
							popper: (ee, O) => {
								let j = () => O?.().props,
									S = () => O?.().wrapperProps;
								var L = A();
								const U = P(() => Ve(j(), { style: Qr('popover') }));
								var z = b(L);
								{
									var I = (q) => {
											var Z = A(),
												G = b(Z);
											{
												let re = P(() => ({ props: x(U), wrapperProps: S(), ...f.snippetProps }));
												F(
													G,
													() => e.child,
													() => x(re)
												);
											}
											p(q, Z);
										},
										V = (q) => {
											var Z = Pu();
											ue(Z, () => ({ ...S() }));
											var G = M(Z);
											ue(G, () => ({ ...x(U) }));
											var re = M(G);
											(F(re, () => e.children ?? te), E(G), E(Z), p(q, Z));
										};
									ce(z, (q) => {
										e.child ? q(I) : q(V, !1);
									});
								}
								p(ee, L);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			y = (k) => {
				var $ = A(),
					ee = b($);
				{
					var O = (j) => {
						Wa(
							j,
							oe(
								() => x(h),
								() => f.popperProps,
								{
									get ref() {
										return f.opts.ref;
									},
									get open() {
										return f.root.opts.open.current;
									},
									get id() {
										return i();
									},
									get trapFocus() {
										return l();
									},
									get preventScroll() {
										return d();
									},
									loop: !0,
									forceMount: !1,
									popper: (L, U) => {
										let z = () => U?.().props,
											I = () => U?.().wrapperProps;
										var V = A();
										const q = P(() => Ve(z(), { style: Qr('popover') }));
										var Z = b(V);
										{
											var G = (se) => {
													var ie = A(),
														ne = b(ie);
													{
														let J = P(() => ({
															props: x(q),
															wrapperProps: I(),
															...f.snippetProps
														}));
														F(
															ne,
															() => e.child,
															() => x(J)
														);
													}
													p(se, ie);
												},
												re = (se) => {
													var ie = Cu();
													ue(ie, () => ({ ...I() }));
													var ne = M(ie);
													ue(ne, () => ({ ...x(q) }));
													var J = M(ne);
													(F(J, () => e.children ?? te), E(ne), E(ie), p(se, ie));
												};
											ce(Z, (se) => {
												e.child ? se(G) : se(re, !1);
											});
										}
										p(L, V);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					ce(
						ee,
						(j) => {
							a() || j(O);
						},
						!0
					);
				}
				p(k, $);
			};
		ce(w, (k) => {
			a() ? k(v) : k(y, !1);
		});
	}
	(p(t, g), R());
}
var Eu = N('<button><!></button>');
function Mu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = _(e, 'type', 3, 'button'),
		s = _(e, 'disabled', 3, !1),
		o = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'ref',
			'type',
			'disabled'
		]);
	const c = _i.create({
			id: X.with(() => n()),
			ref: X.with(
				() => i(),
				(d) => i(d)
			),
			disabled: X.with(() => !!s())
		}),
		l = P(() => Ve(o, c.props, { type: a() }));
	(Ka(t, {
		get id() {
			return n();
		},
		get ref() {
			return c.opts.ref;
		},
		children: (d, u) => {
			var f = A(),
				h = b(f);
			{
				var g = (v) => {
						var y = A(),
							k = b(y);
						(F(
							k,
							() => e.child,
							() => ({ props: x(l) })
						),
							p(v, y));
					},
					w = (v) => {
						var y = Eu();
						ue(y, () => ({ ...x(l) }));
						var k = M(y);
						(F(k, () => e.children ?? te), E(y), p(v, y));
					};
				ce(h, (v) => {
					e.child ? v(g) : v(w, !1);
				});
			}
			p(d, f);
		},
		$$slots: { default: !0 }
	}),
		R());
}
function Ou(t, e) {
	D(e, !0);
	let r = _(e, 'open', 15, !1),
		n = _(e, 'onOpenChange', 3, St),
		i = _(e, 'onOpenChangeComplete', 3, St);
	(wi.create({
		open: X.with(
			() => r(),
			(a) => {
				(r(a), n()(a));
			}
		),
		onOpenChangeComplete: X.with(() => i())
	}),
		Ya(t, {
			children: (a, s) => {
				var o = A(),
					c = b(o);
				(F(c, () => e.children ?? te), p(a, o));
			},
			$$slots: { default: !0 }
		}),
		R());
}
const Fu = vr({ component: 'progress', parts: ['root'] });
class Ai {
	static create(e) {
		return new Ai(e);
	}
	opts;
	attachment;
	constructor(e) {
		((this.opts = e), (this.attachment = _t(this.opts.ref)));
	}
	#e = P(() => ({
		role: 'progressbar',
		value: this.opts.value.current,
		'aria-valuemin': this.opts.min.current,
		'aria-valuemax': this.opts.max.current,
		'aria-valuenow': this.opts.value.current === null ? void 0 : this.opts.value.current,
		'data-value': this.opts.value.current === null ? void 0 : this.opts.value.current,
		'data-state': Du(this.opts.value.current, this.opts.max.current),
		'data-max': this.opts.max.current,
		'data-min': this.opts.min.current,
		'data-indeterminate': this.opts.value.current === null ? '' : void 0,
		[Fu.root]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#e);
	}
	set props(e) {
		K(this.#e, e);
	}
}
function Du(t, e) {
	return t === null ? 'indeterminate' : t === e ? 'loaded' : 'loading';
}
var Ru = N('<div><!></div>');
function Nu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'value', 3, 0),
		i = _(e, 'max', 3, 100),
		a = _(e, 'min', 3, 0),
		s = _(e, 'id', 19, () => pt(r)),
		o = _(e, 'ref', 15, null),
		c = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'child',
			'children',
			'value',
			'max',
			'min',
			'id',
			'ref'
		]);
	const l = Ai.create({
			value: X.with(() => n()),
			max: X.with(() => i()),
			min: X.with(() => a()),
			id: X.with(() => s()),
			ref: X.with(
				() => o(),
				(w) => o(w)
			)
		}),
		d = P(() => Ve(c, l.props));
	var u = A(),
		f = b(u);
	{
		var h = (w) => {
				var v = A(),
					y = b(v);
				(F(
					y,
					() => e.child,
					() => ({ props: x(d) })
				),
					p(w, v));
			},
			g = (w) => {
				var v = Ru();
				ue(v, () => ({ ...x(d) }));
				var y = M(v);
				(F(y, () => e.children ?? te), E(v), p(w, v));
			};
		ce(f, (w) => {
			e.child ? w(h) : w(g, !1);
		});
	}
	(p(t, u), R());
}
function ua(t, e, r) {
	const n = { position: 'absolute' };
	return (
		t === 'lr'
			? ((n.left = `${e}%`), (n.right = `${r}%`))
			: t === 'rl'
				? ((n.right = `${e}%`), (n.left = `${r}%`))
				: t === 'bt'
					? ((n.bottom = `${e}%`), (n.top = `${r}%`))
					: ((n.top = `${e}%`), (n.bottom = `${r}%`)),
		n
	);
}
function Ls(t, e) {
	const r = { position: 'absolute' };
	return (
		t === 'lr'
			? ((r.left = `${e}%`), (r.translate = '-50% 0'))
			: t === 'rl'
				? ((r.right = `${e}%`), (r.translate = '50% 0'))
				: t === 'bt'
					? ((r.bottom = `${e}%`), (r.translate = '0 50%'))
					: ((r.top = `${e}%`), (r.translate = '0 -50%')),
		r
	);
}
function $s(t, e, r) {
	const n = { position: 'absolute' };
	return (
		t === 'lr'
			? ((n.left = `${e}%`), (n.translate = `${r}% 0`))
			: t === 'rl'
				? ((n.right = `${e}%`), (n.translate = `${-r}% 0`))
				: t === 'bt'
					? ((n.bottom = `${e}%`), (n.translate = `0 ${-r}%`))
					: ((n.top = `${e}%`), (n.translate = `0 ${r}%`)),
		n
	);
}
function Bu(t) {
	if (Math.floor(t) === t) return 0;
	const e = t.toString();
	if (e.indexOf('.') !== -1 && e.indexOf('e-') === -1) return e.split('.')[1].length;
	if (e.indexOf('e-') !== -1) {
		const r = e.split('e-');
		return parseInt(r[1], 10);
	}
	return 0;
}
function zu(t, e) {
	const r = Math.pow(10, e);
	return Math.round(t * r) / r;
}
function ki(t, e, r) {
	if (typeof t == 'number') {
		const n = r - e;
		let i = Math.ceil(n / t);
		const a = Bu(t),
			s = Math.pow(10, a),
			o = Math.round(n * s),
			c = Math.round(t * s);
		o % c === 0 && i++;
		const l = [];
		for (let d = 0; d < i; d++) {
			const u = e + d * t,
				f = zu(u, a);
			l.push(f);
		}
		return l;
	}
	return [...new Set(t)].filter((n) => n >= e && n <= r).sort((n, i) => n - i);
}
function Qt(t, e) {
	if (e.length === 0) return t;
	let r = e[0],
		n = Math.abs(t - r);
	for (const i of e) {
		const a = Math.abs(t - i);
		a < n && ((n = a), (r = i));
	}
	return r;
}
function zr(t, e, r) {
	const n = e.indexOf(t);
	return n === -1
		? Qt(t, e)
		: r === 'next'
			? n < e.length - 1
				? e[n + 1]
				: t
			: n > 0
				? e[n - 1]
				: t;
}
function Lu(t, e, r = !0) {
	const [n, i] = t,
		[a, s] = e,
		o = (s - a) / (i - n);
	return (c) => {
		const l = a + o * (c - n);
		return r ? (l > Math.max(a, s) ? Math.max(a, s) : l < Math.min(a, s) ? Math.min(a, s) : l) : l;
	};
}
const Vt = vr({
		component: 'slider',
		parts: ['root', 'thumb', 'range', 'tick', 'tick-label', 'thumb-label']
	}),
	Si = new Pr('Slider.Root');
class Us {
	opts;
	attachment;
	#e = Le(!1);
	get isActive() {
		return x(this.#e);
	}
	set isActive(e) {
		K(this.#e, e, !0);
	}
	#t = P(() =>
		this.opts.orientation.current === 'horizontal'
			? this.opts.dir.current === 'rtl'
				? 'rl'
				: 'lr'
			: this.opts.dir.current === 'rtl'
				? 'tb'
				: 'bt'
	);
	get direction() {
		return x(this.#t);
	}
	set direction(e) {
		K(this.#t, e);
	}
	#r = P(() => ki(this.opts.step.current, this.opts.min.current, this.opts.max.current));
	get normalizedSteps() {
		return x(this.#r);
	}
	set normalizedSteps(e) {
		K(this.#r, e);
	}
	domContext;
	constructor(e) {
		((this.opts = e), (this.attachment = _t(e.ref)), (this.domContext = new oi(this.opts.ref)));
	}
	isThumbActive(e) {
		return this.isActive;
	}
	#n = P(() => {
		if (!this.opts.disabled.current)
			return this.opts.orientation.current === 'horizontal' ? 'pan-y' : 'pan-x';
	});
	getAllThumbs = () => {
		const e = this.opts.ref.current;
		return e ? Array.from(e.querySelectorAll(Vt.selector('thumb'))) : [];
	};
	getThumbScale = () => {
		const e = this.opts.trackPadding?.current;
		if (e !== void 0 && e > 0) return [e, 100 - e];
		if (this.opts.thumbPositioning.current === 'exact') return [0, 100];
		const r = this.opts.orientation.current === 'vertical',
			n = this.getAllThumbs()[0],
			i = r ? n?.offsetHeight : n?.offsetWidth;
		if (i === void 0 || Number.isNaN(i) || i === 0) return [0, 100];
		const a = r ? this.opts.ref.current?.offsetHeight : this.opts.ref.current?.offsetWidth;
		if (a === void 0 || Number.isNaN(a) || a === 0) return [0, 100];
		const s = (i / 2 / a) * 100,
			o = s,
			c = 100 - s;
		return [o, c];
	};
	getPositionFromValue = (e) => {
		const r = this.getThumbScale();
		return Lu([this.opts.min.current, this.opts.max.current], r)(e);
	};
	#i = P(() => ({
		id: this.opts.id.current,
		'data-orientation': tr(this.opts.orientation.current),
		'data-disabled': nr(this.opts.disabled.current),
		style: { touchAction: x(this.#n) },
		[Vt.root]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#i);
	}
	set props(e) {
		K(this.#i, e);
	}
}
class $u extends Us {
	opts;
	isMulti = !1;
	constructor(e) {
		(super(e),
			(this.opts = e),
			pi(() =>
				ls(
					Bt(this.domContext.getDocument(), 'pointerdown', this.handlePointerDown),
					Bt(this.domContext.getDocument(), 'pointerup', this.handlePointerUp),
					Bt(this.domContext.getDocument(), 'pointermove', this.handlePointerMove),
					Bt(this.domContext.getDocument(), 'pointerleave', this.handlePointerUp)
				)
			),
			mr(
				[
					() => this.opts.step.current,
					() => this.opts.min.current,
					() => this.opts.max.current,
					() => this.opts.value.current
				],
				([r, n, i, a]) => {
					const s = ki(r, n, i),
						o = (l) => s.includes(l),
						c = (l) => Qt(l, s);
					o(a) || (this.opts.value.current = c(a));
				}
			));
	}
	isTickValueSelected = (e) => this.opts.value.current === e;
	applyPosition({ clientXY: e, start: r, end: n }) {
		const i = this.opts.min.current,
			a = this.opts.max.current,
			o = ((e - r) / (n - r)) * (a - i) + i;
		if (o < i) this.updateValue(i);
		else if (o > a) this.updateValue(a);
		else {
			const c = this.normalizedSteps,
				l = Qt(o, c);
			this.updateValue(l);
		}
	}
	updateValue = (e) => {
		this.opts.value.current = Qt(e, this.normalizedSteps);
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		(e.preventDefault(), e.stopPropagation());
		const r = this.opts.ref.current,
			n = this.getAllThumbs()[0];
		if (!r || !n) return;
		n.focus();
		const { left: i, right: a, top: s, bottom: o } = r.getBoundingClientRect();
		this.direction === 'lr'
			? this.applyPosition({ clientXY: e.clientX, start: i, end: a })
			: this.direction === 'rl'
				? this.applyPosition({ clientXY: e.clientX, start: a, end: i })
				: this.direction === 'bt'
					? this.applyPosition({ clientXY: e.clientY, start: o, end: s })
					: this.direction === 'tb' &&
						this.applyPosition({ clientXY: e.clientY, start: s, end: o });
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const r = this.opts.ref.current,
			n = this.getAllThumbs()[0];
		if (!n || !r) return;
		const i = e.composedPath()[0] ?? e.target;
		!Za(i) ||
			!r.contains(i) ||
			(e.preventDefault(), n.focus(), (this.isActive = !0), this.handlePointerMove(e));
	};
	handlePointerUp = () => {
		this.opts.disabled.current ||
			(this.isActive && this.opts.onValueCommit.current(kt(() => this.opts.value.current)),
			(this.isActive = !1));
	};
	#e = P(() => {
		const e = this.opts.value.current;
		return Array.from({ length: 1 }, () => {
			const r = e,
				n = this.getPositionFromValue(r),
				i = Ls(this.direction, n);
			return {
				role: 'slider',
				'aria-valuemin': this.opts.min.current,
				'aria-valuemax': this.opts.max.current,
				'aria-valuenow': r,
				'aria-disabled': os(this.opts.disabled.current),
				'aria-orientation': ui(this.opts.orientation.current),
				'data-value': r,
				'data-orientation': tr(this.opts.orientation.current),
				style: i,
				[Vt.thumb]: ''
			};
		});
	});
	get thumbsPropsArr() {
		return x(this.#e);
	}
	set thumbsPropsArr(e) {
		K(this.#e, e);
	}
	#t = P(() => this.thumbsPropsArr.map((e, r) => r));
	get thumbsRenderArr() {
		return x(this.#t);
	}
	set thumbsRenderArr(e) {
		K(this.#t, e);
	}
	#r = P(() => {
		const e = this.normalizedSteps,
			r = this.opts.value.current;
		return e.map((n, i) => {
			const a = this.getPositionFromValue(n),
				s = i === 0,
				o = i === e.length - 1,
				c = s ? 0 : o ? -100 : -50,
				l = $s(this.direction, a, c),
				d = n <= r;
			return {
				'data-disabled': nr(this.opts.disabled.current),
				'data-orientation': tr(this.opts.orientation.current),
				'data-bounded': d ? '' : void 0,
				'data-value': n,
				'data-selected': this.isTickValueSelected(n) ? '' : void 0,
				style: l,
				[Vt.tick]: ''
			};
		});
	});
	get ticksPropsArr() {
		return x(this.#r);
	}
	set ticksPropsArr(e) {
		K(this.#r, e);
	}
	#n = P(() => this.ticksPropsArr.map((e, r) => r));
	get ticksRenderArr() {
		return x(this.#n);
	}
	set ticksRenderArr(e) {
		K(this.#n, e);
	}
	#i = P(() => this.ticksPropsArr.map((e, r) => ({ value: e['data-value'], index: r })));
	get tickItemsArr() {
		return x(this.#i);
	}
	set tickItemsArr(e) {
		K(this.#i, e);
	}
	#s = P(() => [{ value: this.opts.value.current, index: 0 }]);
	get thumbItemsArr() {
		return x(this.#s);
	}
	set thumbItemsArr(e) {
		K(this.#s, e);
	}
	#o = P(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return x(this.#o);
	}
	set snippetProps(e) {
		K(this.#o, e);
	}
}
class Uu extends Us {
	opts;
	isMulti = !0;
	#e = Le(null);
	get activeThumb() {
		return x(this.#e);
	}
	set activeThumb(e) {
		K(this.#e, e, !0);
	}
	#t = Le(0);
	get currentThumbIdx() {
		return x(this.#t);
	}
	set currentThumbIdx(e) {
		K(this.#t, e, !0);
	}
	constructor(e) {
		(super(e),
			(this.opts = e),
			pi(() =>
				ls(
					Bt(this.domContext.getDocument(), 'pointerdown', this.handlePointerDown),
					Bt(this.domContext.getDocument(), 'pointerup', this.handlePointerUp),
					Bt(this.domContext.getDocument(), 'pointermove', this.handlePointerMove),
					Bt(this.domContext.getDocument(), 'pointerleave', this.handlePointerUp)
				)
			),
			mr(
				[
					() => this.opts.step.current,
					() => this.opts.min.current,
					() => this.opts.max.current,
					() => this.opts.value.current
				],
				([r, n, i, a]) => {
					const s = ki(r, n, i),
						o = (l) => s.includes(l),
						c = (l) => Qt(l, s);
					a.some((l) => !o(l)) && (this.opts.value.current = a.map(c));
				}
			));
	}
	isTickValueSelected = (e) => this.opts.value.current.includes(e);
	isThumbActive(e) {
		return this.isActive && this.activeThumb?.idx === e;
	}
	applyPosition({ clientXY: e, activeThumbIdx: r, start: n, end: i }) {
		const a = this.opts.min.current,
			s = this.opts.max.current,
			c = ((e - n) / (i - n)) * (s - a) + a;
		if (c < a) this.updateValue(a, r);
		else if (c > s) this.updateValue(s, r);
		else {
			const l = this.normalizedSteps,
				d = Qt(c, l);
			this.updateValue(d, r);
		}
	}
	#r = (e) => {
		const r = this.getAllThumbs();
		if (!r.length) return;
		for (const s of r) s.blur();
		const n = r.map((s) => {
				if (this.opts.orientation.current === 'horizontal') {
					const { left: o, right: c } = s.getBoundingClientRect();
					return Math.abs(e.clientX - (o + c) / 2);
				} else {
					const { top: o, bottom: c } = s.getBoundingClientRect();
					return Math.abs(e.clientY - (o + c) / 2);
				}
			}),
			i = r[n.indexOf(Math.min(...n))],
			a = r.indexOf(i);
		return { node: i, idx: a };
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		(e.preventDefault(), e.stopPropagation());
		const r = this.opts.ref.current,
			n = this.activeThumb;
		if (!r || !n) return;
		n.node.focus();
		const { left: i, right: a, top: s, bottom: o } = r.getBoundingClientRect(),
			c = this.direction;
		c === 'lr'
			? this.applyPosition({ clientXY: e.clientX, activeThumbIdx: n.idx, start: i, end: a })
			: c === 'rl'
				? this.applyPosition({ clientXY: e.clientX, activeThumbIdx: n.idx, start: a, end: i })
				: c === 'bt'
					? this.applyPosition({ clientXY: e.clientY, activeThumbIdx: n.idx, start: o, end: s })
					: c === 'tb' &&
						this.applyPosition({ clientXY: e.clientY, activeThumbIdx: n.idx, start: s, end: o });
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const r = this.opts.ref.current,
			n = this.#r(e);
		if (!n || !r) return;
		const i = e.composedPath()[0] ?? e.target;
		!Za(i) ||
			!r.contains(i) ||
			(e.preventDefault(),
			(this.activeThumb = n),
			n.node.focus(),
			(this.isActive = !0),
			this.handlePointerMove(e));
	};
	handlePointerUp = () => {
		this.opts.disabled.current ||
			(this.isActive && this.opts.onValueCommit.current(kt(() => this.opts.value.current)),
			(this.isActive = !1));
	};
	getAllThumbs = () => {
		const e = this.opts.ref.current;
		return e ? Array.from(e.querySelectorAll(Vt.selector('thumb'))) : [];
	};
	updateValue = (e, r) => {
		const n = this.opts.value.current;
		if (!n.length) {
			this.opts.value.current.push(e);
			return;
		}
		if (n[r] === e) return;
		const a = [...n];
		if (!qo(r, a)) return;
		const s = a[r] > e ? -1 : 1,
			o = () => {
				const l = r + s;
				((a[r] = a[l]), (a[l] = e));
				const d = this.getAllThumbs();
				d.length && (d[l]?.focus(), (this.activeThumb = { node: d[l], idx: l }));
			};
		if (this.opts.autoSort.current && ((s === -1 && e < a[r - 1]) || (s === 1 && e > a[r + 1]))) {
			(o(), (this.opts.value.current = a));
			return;
		}
		const c = this.normalizedSteps;
		((a[r] = Qt(e, c)), (this.opts.value.current = a));
	};
	#n = P(() => {
		const e = this.opts.value.current;
		return Array.from({ length: e.length || 1 }, (r, n) => {
			const i = kt(() => this.currentThumbIdx);
			i < e.length &&
				kt(() => {
					this.currentThumbIdx = i + 1;
				});
			const a = e[n],
				s = this.getPositionFromValue(a ?? 0),
				o = Ls(this.direction, s);
			return {
				role: 'slider',
				'aria-valuemin': this.opts.min.current,
				'aria-valuemax': this.opts.max.current,
				'aria-valuenow': a,
				'aria-disabled': os(this.opts.disabled.current),
				'aria-orientation': ui(this.opts.orientation.current),
				'data-value': a,
				'data-orientation': tr(this.opts.orientation.current),
				style: o,
				[Vt.thumb]: ''
			};
		});
	});
	get thumbsPropsArr() {
		return x(this.#n);
	}
	set thumbsPropsArr(e) {
		K(this.#n, e);
	}
	#i = P(() => this.thumbsPropsArr.map((e, r) => r));
	get thumbsRenderArr() {
		return x(this.#i);
	}
	set thumbsRenderArr(e) {
		K(this.#i, e);
	}
	#s = P(() => {
		const e = this.normalizedSteps,
			r = this.opts.value.current;
		return e.map((n, i) => {
			const a = this.getPositionFromValue(n),
				s = i === 0,
				o = i === e.length - 1,
				c = s ? 0 : o ? -100 : -50,
				l = $s(this.direction, a, c),
				d = r.length === 1 ? n <= r[0] : r[0] <= n && n <= r[r.length - 1];
			return {
				'data-disabled': nr(this.opts.disabled.current),
				'data-orientation': tr(this.opts.orientation.current),
				'data-bounded': d ? '' : void 0,
				'data-value': n,
				style: l,
				[Vt.tick]: ''
			};
		});
	});
	get ticksPropsArr() {
		return x(this.#s);
	}
	set ticksPropsArr(e) {
		K(this.#s, e);
	}
	#o = P(() => this.ticksPropsArr.map((e, r) => r));
	get ticksRenderArr() {
		return x(this.#o);
	}
	set ticksRenderArr(e) {
		K(this.#o, e);
	}
	#l = P(() => this.ticksPropsArr.map((e, r) => ({ value: e['data-value'], index: r })));
	get tickItemsArr() {
		return x(this.#l);
	}
	set tickItemsArr(e) {
		K(this.#l, e);
	}
	#a = P(() => this.opts.value.current.map((r, n) => ({ value: r, index: n })));
	get thumbItemsArr() {
		return x(this.#a);
	}
	set thumbItemsArr(e) {
		K(this.#a, e);
	}
	#c = P(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return x(this.#c);
	}
	set snippetProps(e) {
		K(this.#c, e);
	}
}
class ju {
	static create(e) {
		const { type: r, ...n } = e,
			i = r === 'single' ? new $u(n) : new Uu(n);
		return Si.set(i);
	}
}
const Vu = [cs, us, ds, fs, ps, ms];
class Pi {
	static create(e) {
		return new Pi(e, Si.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e), (this.root = r), (this.attachment = _t(e.ref)));
	}
	#e = P(() => {
		if (Array.isArray(this.root.opts.value.current)) {
			const e =
					this.root.opts.value.current.length > 1
						? this.root.getPositionFromValue(Math.min(...this.root.opts.value.current) ?? 0)
						: 0,
				r = 100 - this.root.getPositionFromValue(Math.max(...this.root.opts.value.current) ?? 0);
			return { position: 'absolute', ...ua(this.root.direction, e, r) };
		} else {
			const e = this.root.opts.trackPadding?.current,
				r = this.root.opts.value.current,
				n = this.root.opts.max.current,
				i = 0,
				a = e !== void 0 && e > 0 && r === n ? 0 : 100 - this.root.getPositionFromValue(r);
			return { position: 'absolute', ...ua(this.root.direction, i, a) };
		}
	});
	get rangeStyles() {
		return x(this.#e);
	}
	set rangeStyles(e) {
		K(this.#e, e);
	}
	#t = P(() => ({
		id: this.opts.id.current,
		'data-orientation': tr(this.root.opts.orientation.current),
		'data-disabled': nr(this.root.opts.disabled.current),
		style: this.rangeStyles,
		[Vt.range]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#t);
	}
	set props(e) {
		K(this.#t, e);
	}
}
class Ci {
	static create(e) {
		return new Ci(e, Si.get());
	}
	opts;
	root;
	attachment;
	#e = P(() => this.root.opts.disabled.current || this.opts.disabled.current);
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.attachment = _t(e.ref)),
			(this.onkeydown = this.onkeydown.bind(this)));
	}
	#t(e) {
		this.root.isMulti
			? this.root.updateValue(e, this.opts.index.current)
			: this.root.updateValue(e);
	}
	onkeydown(e) {
		if (x(this.#e)) return;
		const r = this.opts.ref.current;
		if (!r) return;
		const n = this.root.getAllThumbs();
		if (!n.length) return;
		const i = n.indexOf(r);
		if ((this.root.isMulti && (this.root.currentThumbIdx = i), !Vu.includes(e.key))) return;
		e.preventDefault();
		const a = this.root.opts.min.current,
			s = this.root.opts.max.current,
			o = this.root.opts.value.current,
			c = Array.isArray(o) ? o[i] : o,
			l = this.root.opts.orientation.current,
			d = this.root.direction,
			u = this.root.normalizedSteps;
		switch (e.key) {
			case ps:
				this.#t(a);
				break;
			case ms:
				this.#t(s);
				break;
			case cs:
				if (l !== 'horizontal') break;
				if (e.metaKey) {
					const f = d === 'rl' ? s : a;
					this.#t(f);
				} else {
					const h = zr(c, u, d === 'rl' ? 'next' : 'prev');
					this.#t(h);
				}
				break;
			case us:
				if (l !== 'horizontal') break;
				if (e.metaKey) {
					const f = d === 'rl' ? a : s;
					this.#t(f);
				} else {
					const h = zr(c, u, d === 'rl' ? 'prev' : 'next');
					this.#t(h);
				}
				break;
			case ds:
				if (e.metaKey) {
					const f = d === 'tb' ? a : s;
					this.#t(f);
				} else {
					const h = zr(c, u, d === 'tb' ? 'prev' : 'next');
					this.#t(h);
				}
				break;
			case fs:
				if (e.metaKey) {
					const f = d === 'tb' ? s : a;
					this.#t(f);
				} else {
					const h = zr(c, u, d === 'tb' ? 'next' : 'prev');
					this.#t(h);
				}
				break;
		}
		this.root.opts.onValueCommit.current(this.root.opts.value.current);
	}
	#r = P(() => ({
		...this.root.thumbsPropsArr[this.opts.index.current],
		id: this.opts.id.current,
		onkeydown: this.onkeydown,
		'data-active': this.root.isThumbActive(this.opts.index.current) ? '' : void 0,
		'data-disabled': nr(this.opts.disabled.current || this.root.opts.disabled.current),
		tabindex: this.opts.disabled.current || this.root.opts.disabled.current ? -1 : 0,
		...this.attachment
	}));
	get props() {
		return x(this.#r);
	}
	set props(e) {
		K(this.#r, e);
	}
}
var Xu = N('<span><!></span>');
function Gu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = _(e, 'value', 15),
		s = _(e, 'onValueChange', 3, St),
		o = _(e, 'onValueCommit', 3, St),
		c = _(e, 'disabled', 3, !1),
		l = _(e, 'step', 3, 1),
		d = _(e, 'dir', 3, 'ltr'),
		u = _(e, 'autoSort', 3, !0),
		f = _(e, 'orientation', 3, 'horizontal'),
		h = _(e, 'thumbPositioning', 3, 'contain'),
		g = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'id',
			'ref',
			'value',
			'type',
			'onValueChange',
			'onValueCommit',
			'disabled',
			'min',
			'max',
			'step',
			'dir',
			'autoSort',
			'orientation',
			'thumbPositioning',
			'trackPadding'
		]);
	const w = P(() => (e.min !== void 0 ? e.min : Array.isArray(l()) ? Math.min(...l()) : 0)),
		v = P(() => (e.max !== void 0 ? e.max : Array.isArray(l()) ? Math.max(...l()) : 100));
	function y() {
		if (a() === void 0) return e.type === 'single' ? x(w) : [];
	}
	(y(),
		mr.pre(
			() => a(),
			() => {
				y();
			}
		));
	const k = ju.create({
			id: X.with(() => n()),
			ref: X.with(
				() => i(),
				(L) => i(L)
			),
			value: X.with(
				() => a(),
				(L) => {
					(a(L), s()(L));
				}
			),
			onValueCommit: X.with(() => o()),
			disabled: X.with(() => c()),
			min: X.with(() => x(w)),
			max: X.with(() => x(v)),
			step: X.with(() => l()),
			dir: X.with(() => d()),
			autoSort: X.with(() => u()),
			orientation: X.with(() => f()),
			thumbPositioning: X.with(() => h()),
			type: e.type,
			trackPadding: X.with(() => e.trackPadding)
		}),
		$ = P(() => Ve(g, k.props));
	var ee = A(),
		O = b(ee);
	{
		var j = (L) => {
				var U = A(),
					z = b(U);
				{
					let I = P(() => ({ props: x($), ...k.snippetProps }));
					F(
						z,
						() => e.child,
						() => x(I)
					);
				}
				p(L, U);
			},
			S = (L) => {
				var U = Xu();
				ue(U, () => ({ ...x($) }));
				var z = M(U);
				(F(
					z,
					() => e.children ?? te,
					() => k.snippetProps
				),
					E(U),
					p(L, U));
			};
		ce(O, (L) => {
			e.child ? L(j) : L(S, !1);
		});
	}
	(p(t, ee), R());
}
var Hu = N('<span><!></span>');
function qu(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'ref', 15, null),
		i = _(e, 'id', 19, () => pt(r)),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'children', 'child', 'ref', 'id']);
	const s = Pi.create({
			id: X.with(() => i()),
			ref: X.with(
				() => n(),
				(f) => n(f)
			)
		}),
		o = P(() => Ve(a, s.props));
	var c = A(),
		l = b(c);
	{
		var d = (f) => {
				var h = A(),
					g = b(h);
				(F(
					g,
					() => e.child,
					() => ({ props: x(o) })
				),
					p(f, h));
			},
			u = (f) => {
				var h = Hu();
				ue(h, () => ({ ...x(o) }));
				var g = M(h);
				(F(g, () => e.children ?? te), E(h), p(f, h));
			};
		ce(l, (f) => {
			e.child ? f(d) : f(u, !1);
		});
	}
	(p(t, c), R());
}
var Wu = N('<span><!></span>');
function Ku(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'ref', 15, null),
		i = _(e, 'id', 19, () => pt(r)),
		a = _(e, 'disabled', 3, !1),
		s = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'children',
			'child',
			'ref',
			'id',
			'index',
			'disabled'
		]);
	const o = Ci.create({
			id: X.with(() => i()),
			ref: X.with(
				() => n(),
				(h) => n(h)
			),
			index: X.with(() => e.index),
			disabled: X.with(() => a())
		}),
		c = P(() => Ve(s, o.props));
	var l = A(),
		d = b(l);
	{
		var u = (h) => {
				var g = A(),
					w = b(g);
				{
					let v = P(() => ({ active: o.root.isThumbActive(o.opts.index.current), props: x(c) }));
					F(
						w,
						() => e.child,
						() => x(v)
					);
				}
				p(h, g);
			},
			f = (h) => {
				var g = Wu();
				ue(g, () => ({ ...x(c) }));
				var w = M(g);
				{
					let v = P(() => ({ active: o.root.isThumbActive(o.opts.index.current) }));
					F(
						w,
						() => e.children ?? te,
						() => x(v)
					);
				}
				(E(g), p(h, g));
			};
		ce(d, (h) => {
			e.child ? h(u) : h(f, !1);
		});
	}
	(p(t, l), R());
}
const Yu = { immediate: !0 };
class Yn {
	#e;
	#t;
	#r;
	#n = null;
	constructor(e, r, n = {}) {
		((this.#r = e),
			(this.#t = r),
			(this.#e = { ...Yu, ...n }),
			(this.stop = this.stop.bind(this)),
			(this.start = this.start.bind(this)),
			this.#e.immediate && yl && this.start(),
			Wo(this.stop));
	}
	#i() {
		this.#n !== null && (window.clearTimeout(this.#n), (this.#n = null));
	}
	stop() {
		this.#i();
	}
	start(...e) {
		(this.#i(),
			(this.#n = window.setTimeout(() => {
				((this.#n = null), this.#r(...e));
			}, this.#t)));
	}
}
const js = vr({ component: 'tooltip', parts: ['content', 'trigger'] }),
	Vs = new Pr('Tooltip.Provider'),
	Ii = new Pr('Tooltip.Root');
class Ei {
	static create(e) {
		return Vs.set(new Ei(e));
	}
	opts;
	#e = Le(!0);
	get isOpenDelayed() {
		return x(this.#e);
	}
	set isOpenDelayed(e) {
		K(this.#e, e, !0);
	}
	isPointerInTransit = X(!1);
	#t;
	#r = Le(null);
	constructor(e) {
		((this.opts = e),
			(this.#t = new Yn(
				() => {
					this.isOpenDelayed = !0;
				},
				this.opts.skipDelayDuration.current,
				{ immediate: !1 }
			)));
	}
	#n = () => {
		this.opts.skipDelayDuration.current !== 0 && this.#t.start();
	};
	#i = () => {
		this.#t.stop();
	};
	onOpen = (e) => {
		(x(this.#r) && x(this.#r) !== e && x(this.#r).handleClose(),
			this.#i(),
			(this.isOpenDelayed = !1),
			K(this.#r, e, !0));
	};
	onClose = (e) => {
		(x(this.#r) === e && K(this.#r, null), this.#n());
	};
	isTooltipOpen = (e) => x(this.#r) === e;
}
class Mi {
	static create(e) {
		return Ii.set(new Mi(e, Vs.get()));
	}
	opts;
	provider;
	#e = P(() => this.opts.delayDuration.current ?? this.provider.opts.delayDuration.current);
	get delayDuration() {
		return x(this.#e);
	}
	set delayDuration(e) {
		K(this.#e, e);
	}
	#t = P(
		() =>
			this.opts.disableHoverableContent.current ??
			this.provider.opts.disableHoverableContent.current
	);
	get disableHoverableContent() {
		return x(this.#t);
	}
	set disableHoverableContent(e) {
		K(this.#t, e);
	}
	#r = P(
		() =>
			this.opts.disableCloseOnTriggerClick.current ??
			this.provider.opts.disableCloseOnTriggerClick.current
	);
	get disableCloseOnTriggerClick() {
		return x(this.#r);
	}
	set disableCloseOnTriggerClick(e) {
		K(this.#r, e);
	}
	#n = P(() => this.opts.disabled.current ?? this.provider.opts.disabled.current);
	get disabled() {
		return x(this.#n);
	}
	set disabled(e) {
		K(this.#n, e);
	}
	#i = P(
		() =>
			this.opts.ignoreNonKeyboardFocus.current ?? this.provider.opts.ignoreNonKeyboardFocus.current
	);
	get ignoreNonKeyboardFocus() {
		return x(this.#i);
	}
	set ignoreNonKeyboardFocus(e) {
		K(this.#i, e);
	}
	#s = Le(null);
	get contentNode() {
		return x(this.#s);
	}
	set contentNode(e) {
		K(this.#s, e, !0);
	}
	#o = Le(null);
	get triggerNode() {
		return x(this.#o);
	}
	set triggerNode(e) {
		K(this.#o, e, !0);
	}
	#l = Le(!1);
	#a;
	#c = P(() =>
		this.opts.open.current ? (x(this.#l) ? 'delayed-open' : 'instant-open') : 'closed'
	);
	get stateAttr() {
		return x(this.#c);
	}
	set stateAttr(e) {
		K(this.#c, e);
	}
	constructor(e, r) {
		((this.opts = e),
			(this.provider = r),
			(this.#a = new Yn(
				() => {
					(K(this.#l, !0), (this.opts.open.current = !0));
				},
				this.delayDuration ?? 0,
				{ immediate: !1 }
			)),
			new Ga({
				open: this.opts.open,
				ref: X.with(() => this.contentNode),
				onComplete: () => {
					this.opts.onOpenChangeComplete.current(this.opts.open.current);
				}
			}),
			mr(
				() => this.delayDuration,
				() => {
					this.delayDuration !== void 0 &&
						(this.#a = new Yn(
							() => {
								(K(this.#l, !0), (this.opts.open.current = !0));
							},
							this.delayDuration,
							{ immediate: !1 }
						));
				}
			),
			mr(
				() => this.opts.open.current,
				(n) => {
					n ? this.provider.onOpen(this) : this.provider.onClose(this);
				}
			));
	}
	handleOpen = () => {
		(this.#a.stop(), K(this.#l, !1), (this.opts.open.current = !0));
	};
	handleClose = () => {
		(this.#a.stop(), (this.opts.open.current = !1));
	};
	#u = () => {
		this.#a.stop();
		const e = !this.provider.isOpenDelayed,
			r = this.delayDuration ?? 0;
		e || r === 0 ? (K(this.#l, r > 0 && e, !0), (this.opts.open.current = !0)) : this.#a.start();
	};
	onTriggerEnter = () => {
		this.#u();
	};
	onTriggerLeave = () => {
		this.disableHoverableContent ? this.handleClose() : this.#a.stop();
	};
}
class Oi {
	static create(e) {
		return new Oi(e, Ii.get());
	}
	opts;
	root;
	attachment;
	#e = X(!1);
	#t = Le(!1);
	#r = P(() => this.opts.disabled.current || this.root.disabled);
	domContext;
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.domContext = new oi(e.ref)),
			(this.attachment = _t(this.opts.ref, (n) => (this.root.triggerNode = n))));
	}
	handlePointerUp = () => {
		this.#e.current = !1;
	};
	#n = () => {
		x(this.#r) || (this.#e.current = !1);
	};
	#i = () => {
		x(this.#r) ||
			((this.#e.current = !0),
			this.domContext.getDocument().addEventListener(
				'pointerup',
				() => {
					this.handlePointerUp();
				},
				{ once: !0 }
			));
	};
	#s = (e) => {
		x(this.#r) ||
			(e.pointerType !== 'touch' &&
				(x(this.#t) ||
					this.root.provider.isPointerInTransit.current ||
					(this.root.onTriggerEnter(), K(this.#t, !0))));
	};
	#o = () => {
		x(this.#r) || (this.root.onTriggerLeave(), K(this.#t, !1));
	};
	#l = (e) => {
		this.#e.current ||
			x(this.#r) ||
			(this.root.ignoreNonKeyboardFocus && !Ko(e.currentTarget)) ||
			this.root.handleOpen();
	};
	#a = () => {
		x(this.#r) || this.root.handleClose();
	};
	#c = () => {
		this.root.disableCloseOnTriggerClick || x(this.#r) || this.root.handleClose();
	};
	#u = P(() => ({
		id: this.opts.id.current,
		'aria-describedby': this.root.opts.open.current ? this.root.contentNode?.id : void 0,
		'data-state': this.root.stateAttr,
		'data-disabled': nr(x(this.#r)),
		'data-delay-duration': `${this.root.delayDuration}`,
		[js.trigger]: '',
		tabindex: x(this.#r) ? void 0 : 0,
		disabled: this.opts.disabled.current,
		onpointerup: this.#n,
		onpointerdown: this.#i,
		onpointermove: this.#s,
		onpointerleave: this.#o,
		onfocus: this.#l,
		onblur: this.#a,
		onclick: this.#c,
		...this.attachment
	}));
	get props() {
		return x(this.#u);
	}
	set props(e) {
		K(this.#u, e);
	}
}
class Fi {
	static create(e) {
		return new Fi(e, Ii.get());
	}
	opts;
	root;
	attachment;
	constructor(e, r) {
		((this.opts = e),
			(this.root = r),
			(this.attachment = _t(this.opts.ref, (n) => (this.root.contentNode = n))),
			new Yo({
				triggerNode: () => this.root.triggerNode,
				contentNode: () => this.root.contentNode,
				enabled: () => this.root.opts.open.current && !this.root.disableHoverableContent,
				onPointerExit: () => {
					this.root.provider.isTooltipOpen(this.root) && this.root.handleClose();
				},
				setIsPointerInTransit: (n) => {
					this.root.provider.isPointerInTransit.current = n;
				},
				transitTimeout: this.root.provider.opts.skipDelayDuration.current
			}),
			pi(() =>
				Bt(window, 'scroll', (n) => {
					const i = n.target;
					i && i.contains(this.root.triggerNode) && this.root.handleClose();
				})
			));
	}
	onInteractOutside = (e) => {
		if (
			Ha(e.target) &&
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
	#e = P(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return x(this.#e);
	}
	set snippetProps(e) {
		K(this.#e, e);
	}
	#t = P(() => ({
		id: this.opts.id.current,
		'data-state': this.root.stateAttr,
		'data-disabled': nr(this.root.disabled),
		style: { pointerEvents: 'auto', outline: 'none' },
		[js.content]: '',
		...this.attachment
	}));
	get props() {
		return x(this.#t);
	}
	set props(e) {
		K(this.#t, e);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onOpenAutoFocus: this.onOpenAutoFocus,
		onCloseAutoFocus: this.onCloseAutoFocus
	};
}
function Zu(t, e) {
	D(e, !0);
	let r = _(e, 'open', 15, !1),
		n = _(e, 'onOpenChange', 3, St),
		i = _(e, 'onOpenChangeComplete', 3, St);
	(Mi.create({
		open: X.with(
			() => r(),
			(a) => {
				(r(a), n()(a));
			}
		),
		delayDuration: X.with(() => e.delayDuration),
		disableCloseOnTriggerClick: X.with(() => e.disableCloseOnTriggerClick),
		disableHoverableContent: X.with(() => e.disableHoverableContent),
		ignoreNonKeyboardFocus: X.with(() => e.ignoreNonKeyboardFocus),
		disabled: X.with(() => e.disabled),
		onOpenChangeComplete: X.with(() => i())
	}),
		Ya(t, {
			tooltip: !0,
			children: (a, s) => {
				var o = A(),
					c = b(o);
				(F(c, () => e.children ?? te), p(a, o));
			},
			$$slots: { default: !0 }
		}),
		R());
}
var Ju = N('<div><div><!></div></div>'),
	Qu = N('<div><div><!></div></div>');
function ed(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'ref', 15, null),
		a = _(e, 'side', 3, 'top'),
		s = _(e, 'sideOffset', 3, 0),
		o = _(e, 'align', 3, 'center'),
		c = _(e, 'avoidCollisions', 3, !0),
		l = _(e, 'arrowPadding', 3, 0),
		d = _(e, 'sticky', 3, 'partial'),
		u = _(e, 'hideWhenDetached', 3, !1),
		f = _(e, 'collisionPadding', 3, 0),
		h = _(e, 'onInteractOutside', 3, St),
		g = _(e, 'onEscapeKeydown', 3, St),
		w = _(e, 'forceMount', 3, !1),
		v = H(e, [
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
			'hideWhenDetached',
			'collisionPadding',
			'onInteractOutside',
			'onEscapeKeydown',
			'forceMount'
		]);
	const y = Fi.create({
			id: X.with(() => n()),
			ref: X.with(
				() => i(),
				(L) => i(L)
			),
			onInteractOutside: X.with(() => h()),
			onEscapeKeydown: X.with(() => g())
		}),
		k = P(() => ({
			side: a(),
			sideOffset: s(),
			align: o(),
			avoidCollisions: c(),
			arrowPadding: l(),
			sticky: d(),
			hideWhenDetached: u(),
			collisionPadding: f()
		})),
		$ = P(() => Ve(v, x(k), y.props));
	var ee = A(),
		O = b(ee);
	{
		var j = (L) => {
				qa(
					L,
					oe(
						() => x($),
						() => y.popperProps,
						{
							get enabled() {
								return y.root.opts.open.current;
							},
							get id() {
								return n();
							},
							trapFocus: !1,
							loop: !1,
							preventScroll: !1,
							forceMount: !0,
							get ref() {
								return y.opts.ref;
							},
							tooltip: !0,
							popper: (z, I) => {
								let V = () => I?.().props,
									q = () => I?.().wrapperProps;
								var Z = A();
								const G = P(() => Ve(V(), { style: Qr('tooltip') }));
								var re = b(Z);
								{
									var se = (ne) => {
											var J = A(),
												pe = b(J);
											{
												let de = P(() => ({ props: x(G), wrapperProps: q(), ...y.snippetProps }));
												F(
													pe,
													() => e.child,
													() => x(de)
												);
											}
											p(ne, J);
										},
										ie = (ne) => {
											var J = Ju();
											ue(J, () => ({ ...q() }));
											var pe = M(J);
											ue(pe, () => ({ ...x(G) }));
											var de = M(pe);
											(F(de, () => e.children ?? te), E(pe), E(J), p(ne, J));
										};
									ce(re, (ne) => {
										e.child ? ne(se) : ne(ie, !1);
									});
								}
								p(z, Z);
							},
							$$slots: { popper: !0 }
						}
					)
				);
			},
			S = (L) => {
				var U = A(),
					z = b(U);
				{
					var I = (V) => {
						Wa(
							V,
							oe(
								() => x($),
								() => y.popperProps,
								{
									get open() {
										return y.root.opts.open.current;
									},
									get id() {
										return n();
									},
									trapFocus: !1,
									loop: !1,
									preventScroll: !1,
									forceMount: !1,
									get ref() {
										return y.opts.ref;
									},
									tooltip: !0,
									popper: (Z, G) => {
										let re = () => G?.().props,
											se = () => G?.().wrapperProps;
										var ie = A();
										const ne = P(() => Ve(re(), { style: Qr('tooltip') }));
										var J = b(ie);
										{
											var pe = (ve) => {
													var fe = A(),
														me = b(fe);
													{
														let we = P(() => ({
															props: x(ne),
															wrapperProps: se(),
															...y.snippetProps
														}));
														F(
															me,
															() => e.child,
															() => x(we)
														);
													}
													p(ve, fe);
												},
												de = (ve) => {
													var fe = Qu();
													ue(fe, () => ({ ...se() }));
													var me = M(fe);
													ue(me, () => ({ ...x(ne) }));
													var we = M(me);
													(F(we, () => e.children ?? te), E(me), E(fe), p(ve, fe));
												};
											ce(J, (ve) => {
												e.child ? ve(pe) : ve(de, !1);
											});
										}
										p(Z, ie);
									},
									$$slots: { popper: !0 }
								}
							)
						);
					};
					ce(
						z,
						(V) => {
							w() || V(I);
						},
						!0
					);
				}
				p(L, U);
			};
		ce(O, (L) => {
			w() ? L(j) : L(S, !1);
		});
	}
	(p(t, ee), R());
}
var td = N('<button><!></button>');
function rd(t, e) {
	const r = ft();
	D(e, !0);
	let n = _(e, 'id', 19, () => pt(r)),
		i = _(e, 'disabled', 3, !1),
		a = _(e, 'type', 3, 'button'),
		s = _(e, 'ref', 15, null),
		o = H(e, [
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
	const c = Oi.create({
			id: X.with(() => n()),
			disabled: X.with(() => i() ?? !1),
			ref: X.with(
				() => s(),
				(d) => s(d)
			)
		}),
		l = P(() => Ve(o, c.props, { type: a() }));
	(Ka(t, {
		get id() {
			return n();
		},
		get ref() {
			return c.opts.ref;
		},
		tooltip: !0,
		children: (d, u) => {
			var f = A(),
				h = b(f);
			{
				var g = (v) => {
						var y = A(),
							k = b(y);
						(F(
							k,
							() => e.child,
							() => ({ props: x(l) })
						),
							p(v, y));
					},
					w = (v) => {
						var y = td();
						ue(y, () => ({ ...x(l) }));
						var k = M(y);
						(F(k, () => e.children ?? te), E(y), p(v, y));
					};
				ce(h, (v) => {
					e.child ? v(g) : v(w, !1);
				});
			}
			p(d, f);
		},
		$$slots: { default: !0 }
	}),
		R());
}
function nd(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	(yu(
		t,
		oe(() => n, {
			get ref() {
				return r();
			},
			set ref(i) {
				r(i);
			}
		})
	),
		R());
}
function id(t, e) {
	D(e, !0);
	let r = _(e, 'delayDuration', 3, 700),
		n = _(e, 'disableCloseOnTriggerClick', 3, !1),
		i = _(e, 'disableHoverableContent', 3, !1),
		a = _(e, 'disabled', 3, !1),
		s = _(e, 'ignoreNonKeyboardFocus', 3, !1),
		o = _(e, 'skipDelayDuration', 3, 300);
	Ei.create({
		delayDuration: X.with(() => r()),
		disableCloseOnTriggerClick: X.with(() => n()),
		disableHoverableContent: X.with(() => i()),
		disabled: X.with(() => a()),
		ignoreNonKeyboardFocus: X.with(() => s()),
		skipDelayDuration: X.with(() => o())
	});
	var c = A(),
		l = b(c);
	(F(l, () => e.children ?? te), p(t, c), R());
}
var ad = N('<div><!></div>');
function Xs(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = ad();
	ue(i, (s) => ({ 'data-slot': 'dialog-footer', class: s, ...n }), [
		() => he('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var sd = N('<!> <!>', 1),
	od = N('<!> <!>', 1),
	ld = N(
		'<!> <form style="display: contents;"><div class="flex flex-col gap-1"><!> <!></div> <!></form>',
		1
	);
function cd(t, e) {
	D(e, !0);
	let r = _(e, 'open', 15, !1);
	const n = 'New Folder';
	let i = '',
		a = Le(n),
		s = Le(!1);
	async function o() {
		K(s, !0);
		const d = at.params.path ? `${at.params.path}/${x(a)}` : x(a),
			u = si
				.POST('/api/v1/storage/objects/folder', { body: { name: d } })
				.then(async ({ error: f }) => {
					if ((K(s, !1), f)) throw (console.error(f), f);
					(r(!1), K(a, n), await sn());
				});
		Ut.promise(u, {
			loading: 'Creating folder',
			success: 'Folder created',
			error: 'Failed to create folder'
		});
	}
	var c = A(),
		l = b(c);
	(B(
		l,
		() => Ja,
		(d, u) => {
			u(d, {
				get open() {
					return r();
				},
				set open(f) {
					r(f);
				},
				children: (f, h) => {
					var g = A(),
						w = b(g);
					(B(
						w,
						() => Qa,
						(v, y) => {
							y(v, {
								children: (k, $) => {
									var ee = ld(),
										O = b(ee);
									B(
										O,
										() => es,
										(I, V) => {
											V(I, {
												children: (q, Z) => {
													var G = sd(),
														re = b(G);
													B(
														re,
														() => ts,
														(ie, ne) => {
															ne(ie, {
																children: (J, pe) => {
																	Ne();
																	var de = ot('Create a new folder');
																	p(J, de);
																},
																$$slots: { default: !0 }
															});
														}
													);
													var se = Q(re, 2);
													(B(
														se,
														() => rs,
														(ie, ne) => {
															ne(ie, {
																children: (J, pe) => {
																	Ne();
																	var de = ot(
																		'This will create a new folder in the current directory.'
																	);
																	p(J, de);
																},
																$$slots: { default: !0 }
															});
														}
													),
														p(q, G));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var j = Q(O, 2),
										S = M(j),
										L = M(S);
									Zo(L, {
										required: !0,
										type: 'text',
										placeholder: 'Folder name',
										class: 'w-full',
										'aria-invalid': i !== '',
										get value() {
											return x(a);
										},
										set value(I) {
											K(a, I, !0);
										}
									});
									var U = Q(L, 2);
									(ce(U, (I) => {}), E(S));
									var z = Q(S, 2);
									(B(
										z,
										() => Xs,
										(I, V) => {
											V(I, {
												children: (q, Z) => {
													var G = od(),
														re = b(G);
													Dt(re, {
														onclick: () => r(!1),
														variant: 'outline',
														type: 'button',
														children: (ie, ne) => {
															Ne();
															var J = ot('Cancel');
															p(ie, J);
														},
														$$slots: { default: !0 }
													});
													var se = Q(re, 2);
													(Dt(se, {
														type: 'submit',
														get loading() {
															return x(s);
														},
														set loading(ie) {
															K(s, ie, !0);
														},
														children: (ie, ne) => {
															Ne();
															var J = ot('Create');
															p(ie, J);
														},
														$$slots: { default: !0 }
													}),
														p(q, G));
												},
												$$slots: { default: !0 }
											});
										}
									),
										E(j),
										Jr('submit', j, async (I) => {
											(I.preventDefault(), await o());
										}),
										p(k, ee));
								},
								$$slots: { default: !0 }
							});
						}
					),
						p(f, g));
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, c),
		R());
}
const ud = 'End-Of-Stream';
class xt extends Error {
	constructor() {
		(super(ud), (this.name = 'EndOfStreamError'));
	}
}
class dd extends Error {
	constructor(e = 'The operation was aborted') {
		(super(e), (this.name = 'AbortError'));
	}
}
class Gs {
	constructor() {
		((this.endOfStream = !1), (this.interrupted = !1), (this.peekQueue = []));
	}
	async peek(e, r = !1) {
		const n = await this.read(e, r);
		return (this.peekQueue.push(e.subarray(0, n)), n);
	}
	async read(e, r = !1) {
		if (e.length === 0) return 0;
		let n = this.readFromPeekBuffer(e);
		if (
			(this.endOfStream || (n += await this.readRemainderFromStream(e.subarray(n), r)),
			n === 0 && !r)
		)
			throw new xt();
		return n;
	}
	readFromPeekBuffer(e) {
		let r = e.length,
			n = 0;
		for (; this.peekQueue.length > 0 && r > 0; ) {
			const i = this.peekQueue.pop();
			if (!i) throw new Error('peekData should be defined');
			const a = Math.min(i.length, r);
			(e.set(i.subarray(0, a), n),
				(n += a),
				(r -= a),
				a < i.length && this.peekQueue.push(i.subarray(a)));
		}
		return n;
	}
	async readRemainderFromStream(e, r) {
		let n = 0;
		for (; n < e.length && !this.endOfStream; ) {
			if (this.interrupted) throw new dd();
			const i = await this.readFromStream(e.subarray(n), r);
			if (i === 0) break;
			n += i;
		}
		if (!r && n < e.length) throw new xt();
		return n;
	}
}
class fd extends Gs {
	constructor(e) {
		(super(), (this.reader = e));
	}
	async abort() {
		return this.close();
	}
	async close() {
		this.reader.releaseLock();
	}
}
class pd extends fd {
	async readFromStream(e, r) {
		if (e.length === 0) return 0;
		const n = await this.reader.read(new Uint8Array(e.length), { min: r ? void 0 : e.length });
		return (n.done && (this.endOfStream = n.done), n.value ? (e.set(n.value), n.value.length) : 0);
	}
}
class da extends Gs {
	constructor(e) {
		(super(), (this.reader = e), (this.buffer = null));
	}
	writeChunk(e, r) {
		const n = Math.min(r.length, e.length);
		return (
			e.set(r.subarray(0, n)),
			n < r.length ? (this.buffer = r.subarray(n)) : (this.buffer = null),
			n
		);
	}
	async readFromStream(e, r) {
		if (e.length === 0) return 0;
		let n = 0;
		for (
			this.buffer && (n += this.writeChunk(e, this.buffer));
			n < e.length && !this.endOfStream;

		) {
			const i = await this.reader.read();
			if (i.done) {
				this.endOfStream = !0;
				break;
			}
			i.value && (n += this.writeChunk(e.subarray(n), i.value));
		}
		if (!r && n === 0 && this.endOfStream) throw new xt();
		return n;
	}
	abort() {
		return ((this.interrupted = !0), this.reader.cancel());
	}
	async close() {
		(await this.abort(), this.reader.releaseLock());
	}
}
function md(t) {
	try {
		const e = t.getReader({ mode: 'byob' });
		return e instanceof ReadableStreamDefaultReader ? new da(e) : new pd(e);
	} catch (e) {
		if (e instanceof TypeError) return new da(t.getReader());
		throw e;
	}
}
class Di {
	constructor(e) {
		((this.numBuffer = new Uint8Array(8)),
			(this.position = 0),
			(this.onClose = e?.onClose),
			e?.abortSignal &&
				e.abortSignal.addEventListener('abort', () => {
					this.abort();
				}));
	}
	async readToken(e, r = this.position) {
		const n = new Uint8Array(e.len);
		if ((await this.readBuffer(n, { position: r })) < e.len) throw new xt();
		return e.get(n, 0);
	}
	async peekToken(e, r = this.position) {
		const n = new Uint8Array(e.len);
		if ((await this.peekBuffer(n, { position: r })) < e.len) throw new xt();
		return e.get(n, 0);
	}
	async readNumber(e) {
		if ((await this.readBuffer(this.numBuffer, { length: e.len })) < e.len) throw new xt();
		return e.get(this.numBuffer, 0);
	}
	async peekNumber(e) {
		if ((await this.peekBuffer(this.numBuffer, { length: e.len })) < e.len) throw new xt();
		return e.get(this.numBuffer, 0);
	}
	async ignore(e) {
		if (this.fileInfo.size !== void 0) {
			const r = this.fileInfo.size - this.position;
			if (e > r) return ((this.position += r), r);
		}
		return ((this.position += e), e);
	}
	async close() {
		(await this.abort(), await this.onClose?.());
	}
	normalizeOptions(e, r) {
		if (!this.supportsRandomAccess() && r && r.position !== void 0 && r.position < this.position)
			throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
		return { mayBeLess: !1, offset: 0, length: e.length, position: this.position, ...r };
	}
	abort() {
		return Promise.resolve();
	}
}
const hd = 256e3;
class gd extends Di {
	constructor(e, r) {
		(super(r), (this.streamReader = e), (this.fileInfo = r?.fileInfo ?? {}));
	}
	async readBuffer(e, r) {
		const n = this.normalizeOptions(e, r),
			i = n.position - this.position;
		if (i > 0) return (await this.ignore(i), this.readBuffer(e, r));
		if (i < 0)
			throw new Error('`options.position` must be equal or greater than `tokenizer.position`');
		if (n.length === 0) return 0;
		const a = await this.streamReader.read(e.subarray(0, n.length), n.mayBeLess);
		if (((this.position += a), (!r || !r.mayBeLess) && a < n.length)) throw new xt();
		return a;
	}
	async peekBuffer(e, r) {
		const n = this.normalizeOptions(e, r);
		let i = 0;
		if (n.position) {
			const a = n.position - this.position;
			if (a > 0) {
				const s = new Uint8Array(n.length + a);
				return (
					(i = await this.peekBuffer(s, { mayBeLess: n.mayBeLess })),
					e.set(s.subarray(a)),
					i - a
				);
			}
			if (a < 0) throw new Error('Cannot peek from a negative offset in a stream');
		}
		if (n.length > 0) {
			try {
				i = await this.streamReader.peek(e.subarray(0, n.length), n.mayBeLess);
			} catch (a) {
				if (r?.mayBeLess && a instanceof xt) return 0;
				throw a;
			}
			if (!n.mayBeLess && i < n.length) throw new xt();
		}
		return i;
	}
	async ignore(e) {
		const r = Math.min(hd, e),
			n = new Uint8Array(r);
		let i = 0;
		for (; i < e; ) {
			const a = e - i,
				s = await this.readBuffer(n, { length: Math.min(r, a) });
			if (s < 0) return s;
			i += s;
		}
		return i;
	}
	abort() {
		return this.streamReader.abort();
	}
	async close() {
		return this.streamReader.close();
	}
	supportsRandomAccess() {
		return !1;
	}
}
class vd extends Di {
	constructor(e, r) {
		(super(r), (this.uint8Array = e), (this.fileInfo = { ...(r?.fileInfo ?? {}), size: e.length }));
	}
	async readBuffer(e, r) {
		r?.position && (this.position = r.position);
		const n = await this.peekBuffer(e, r);
		return ((this.position += n), n);
	}
	async peekBuffer(e, r) {
		const n = this.normalizeOptions(e, r),
			i = Math.min(this.uint8Array.length - n.position, n.length);
		if (!n.mayBeLess && i < n.length) throw new xt();
		return (e.set(this.uint8Array.subarray(n.position, n.position + i)), i);
	}
	close() {
		return super.close();
	}
	supportsRandomAccess() {
		return !0;
	}
	setPosition(e) {
		this.position = e;
	}
}
class xd extends Di {
	constructor(e, r) {
		(super(r),
			(this.blob = e),
			(this.fileInfo = { ...(r?.fileInfo ?? {}), size: e.size, mimeType: e.type }));
	}
	async readBuffer(e, r) {
		r?.position && (this.position = r.position);
		const n = await this.peekBuffer(e, r);
		return ((this.position += n), n);
	}
	async peekBuffer(e, r) {
		const n = this.normalizeOptions(e, r),
			i = Math.min(this.blob.size - n.position, n.length);
		if (!n.mayBeLess && i < n.length) throw new xt();
		const a = await this.blob.slice(n.position, n.position + i).arrayBuffer();
		return (e.set(new Uint8Array(a)), i);
	}
	close() {
		return super.close();
	}
	supportsRandomAccess() {
		return !0;
	}
	setPosition(e) {
		this.position = e;
	}
}
function yd(t, e) {
	const r = md(t),
		n = e ?? {},
		i = n.onClose;
	return (
		(n.onClose = async () => {
			if ((await r.close(), i)) return i();
		}),
		new gd(r, n)
	);
}
function Zn(t, e) {
	return new vd(t, e);
}
function bd(t, e) {
	return new xd(t, e);
}
var Lr = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */ var fa;
function wd() {
	return (
		fa ||
			((fa = 1),
			(Lr.read = function (t, e, r, n, i) {
				var a,
					s,
					o = i * 8 - n - 1,
					c = (1 << o) - 1,
					l = c >> 1,
					d = -7,
					u = r ? i - 1 : 0,
					f = r ? -1 : 1,
					h = t[e + u];
				for (
					u += f, a = h & ((1 << -d) - 1), h >>= -d, d += o;
					d > 0;
					a = a * 256 + t[e + u], u += f, d -= 8
				);
				for (
					s = a & ((1 << -d) - 1), a >>= -d, d += n;
					d > 0;
					s = s * 256 + t[e + u], u += f, d -= 8
				);
				if (a === 0) a = 1 - l;
				else {
					if (a === c) return s ? NaN : (h ? -1 : 1) * (1 / 0);
					((s = s + Math.pow(2, n)), (a = a - l));
				}
				return (h ? -1 : 1) * s * Math.pow(2, a - n);
			}),
			(Lr.write = function (t, e, r, n, i, a) {
				var s,
					o,
					c,
					l = a * 8 - i - 1,
					d = (1 << l) - 1,
					u = d >> 1,
					f = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
					h = n ? 0 : a - 1,
					g = n ? 1 : -1,
					w = e < 0 || (e === 0 && 1 / e < 0) ? 1 : 0;
				for (
					e = Math.abs(e),
						isNaN(e) || e === 1 / 0
							? ((o = isNaN(e) ? 1 : 0), (s = d))
							: ((s = Math.floor(Math.log(e) / Math.LN2)),
								e * (c = Math.pow(2, -s)) < 1 && (s--, (c *= 2)),
								s + u >= 1 ? (e += f / c) : (e += f * Math.pow(2, 1 - u)),
								e * c >= 2 && (s++, (c /= 2)),
								s + u >= d
									? ((o = 0), (s = d))
									: s + u >= 1
										? ((o = (e * c - 1) * Math.pow(2, i)), (s = s + u))
										: ((o = e * Math.pow(2, u - 1) * Math.pow(2, i)), (s = 0)));
					i >= 8;
					t[r + h] = o & 255, h += g, o /= 256, i -= 8
				);
				for (s = (s << i) | o, l += i; l > 0; t[r + h] = s & 255, h += g, s /= 256, l -= 8);
				t[r + h - g] |= w * 128;
			})),
		Lr
	);
}
var Gt = wd();
function ge(t) {
	return new DataView(t.buffer, t.byteOffset);
}
const er = {
		len: 1,
		get(t, e) {
			return ge(t).getUint8(e);
		},
		put(t, e, r) {
			return (ge(t).setUint8(e, r), e + 1);
		}
	},
	Me = {
		len: 2,
		get(t, e) {
			return ge(t).getUint16(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setUint16(e, r, !0), e + 2);
		}
	},
	Jt = {
		len: 2,
		get(t, e) {
			return ge(t).getUint16(e);
		},
		put(t, e, r) {
			return (ge(t).setUint16(e, r), e + 2);
		}
	},
	Hs = {
		len: 3,
		get(t, e) {
			const r = ge(t);
			return r.getUint8(e) + (r.getUint16(e + 1, !0) << 8);
		},
		put(t, e, r) {
			const n = ge(t);
			return (n.setUint8(e, r & 255), n.setUint16(e + 1, r >> 8, !0), e + 3);
		}
	},
	qs = {
		len: 3,
		get(t, e) {
			const r = ge(t);
			return (r.getUint16(e) << 8) + r.getUint8(e + 2);
		},
		put(t, e, r) {
			const n = ge(t);
			return (n.setUint16(e, r >> 8), n.setUint8(e + 2, r & 255), e + 3);
		}
	},
	Ae = {
		len: 4,
		get(t, e) {
			return ge(t).getUint32(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setUint32(e, r, !0), e + 4);
		}
	},
	tn = {
		len: 4,
		get(t, e) {
			return ge(t).getUint32(e);
		},
		put(t, e, r) {
			return (ge(t).setUint32(e, r), e + 4);
		}
	},
	Jn = {
		len: 1,
		get(t, e) {
			return ge(t).getInt8(e);
		},
		put(t, e, r) {
			return (ge(t).setInt8(e, r), e + 1);
		}
	},
	_d = {
		len: 2,
		get(t, e) {
			return ge(t).getInt16(e);
		},
		put(t, e, r) {
			return (ge(t).setInt16(e, r), e + 2);
		}
	},
	Td = {
		len: 2,
		get(t, e) {
			return ge(t).getInt16(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setInt16(e, r, !0), e + 2);
		}
	},
	Ad = {
		len: 3,
		get(t, e) {
			const r = Hs.get(t, e);
			return r > 8388607 ? r - 16777216 : r;
		},
		put(t, e, r) {
			const n = ge(t);
			return (n.setUint8(e, r & 255), n.setUint16(e + 1, r >> 8, !0), e + 3);
		}
	},
	kd = {
		len: 3,
		get(t, e) {
			const r = qs.get(t, e);
			return r > 8388607 ? r - 16777216 : r;
		},
		put(t, e, r) {
			const n = ge(t);
			return (n.setUint16(e, r >> 8), n.setUint8(e + 2, r & 255), e + 3);
		}
	},
	Ws = {
		len: 4,
		get(t, e) {
			return ge(t).getInt32(e);
		},
		put(t, e, r) {
			return (ge(t).setInt32(e, r), e + 4);
		}
	},
	Sd = {
		len: 4,
		get(t, e) {
			return ge(t).getInt32(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setInt32(e, r, !0), e + 4);
		}
	},
	Ks = {
		len: 8,
		get(t, e) {
			return ge(t).getBigUint64(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setBigUint64(e, r, !0), e + 8);
		}
	},
	Pd = {
		len: 8,
		get(t, e) {
			return ge(t).getBigInt64(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setBigInt64(e, r, !0), e + 8);
		}
	},
	Cd = {
		len: 8,
		get(t, e) {
			return ge(t).getBigUint64(e);
		},
		put(t, e, r) {
			return (ge(t).setBigUint64(e, r), e + 8);
		}
	},
	Id = {
		len: 8,
		get(t, e) {
			return ge(t).getBigInt64(e);
		},
		put(t, e, r) {
			return (ge(t).setBigInt64(e, r), e + 8);
		}
	},
	Ed = {
		len: 2,
		get(t, e) {
			return Gt.read(t, e, !1, 10, this.len);
		},
		put(t, e, r) {
			return (Gt.write(t, r, e, !1, 10, this.len), e + this.len);
		}
	},
	Md = {
		len: 2,
		get(t, e) {
			return Gt.read(t, e, !0, 10, this.len);
		},
		put(t, e, r) {
			return (Gt.write(t, r, e, !0, 10, this.len), e + this.len);
		}
	},
	Od = {
		len: 4,
		get(t, e) {
			return ge(t).getFloat32(e);
		},
		put(t, e, r) {
			return (ge(t).setFloat32(e, r), e + 4);
		}
	},
	Fd = {
		len: 4,
		get(t, e) {
			return ge(t).getFloat32(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setFloat32(e, r, !0), e + 4);
		}
	},
	Dd = {
		len: 8,
		get(t, e) {
			return ge(t).getFloat64(e);
		},
		put(t, e, r) {
			return (ge(t).setFloat64(e, r), e + 8);
		}
	},
	Rd = {
		len: 8,
		get(t, e) {
			return ge(t).getFloat64(e, !0);
		},
		put(t, e, r) {
			return (ge(t).setFloat64(e, r, !0), e + 8);
		}
	},
	Nd = {
		len: 10,
		get(t, e) {
			return Gt.read(t, e, !1, 63, this.len);
		},
		put(t, e, r) {
			return (Gt.write(t, r, e, !1, 63, this.len), e + this.len);
		}
	},
	Bd = {
		len: 10,
		get(t, e) {
			return Gt.read(t, e, !0, 63, this.len);
		},
		put(t, e, r) {
			return (Gt.write(t, r, e, !0, 63, this.len), e + this.len);
		}
	};
class zd {
	constructor(e) {
		this.len = e;
	}
	get(e, r) {}
}
class Ys {
	constructor(e) {
		this.len = e;
	}
	get(e, r) {
		return e.subarray(r, r + this.len);
	}
}
class Be {
	constructor(e, r) {
		if (((this.len = e), r && r.toLowerCase() === 'windows-1252'))
			this.decoder = Be.decodeWindows1252;
		else {
			const n = new TextDecoder(r);
			this.decoder = (i) => n.decode(i);
		}
	}
	get(e, r = 0) {
		const n = e.subarray(r, r + this.len);
		return this.decoder(n);
	}
	static decodeWindows1252(e) {
		let r = '';
		for (let n = 0; n < e.length; n++) {
			const i = e[n];
			r += i < 128 || i >= 160 ? String.fromCharCode(i) : Be.win1252Map[i - 128];
		}
		return r;
	}
}
Be.win1252Map = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
class Ld extends Be {
	constructor(e) {
		super(e, 'windows-1252');
	}
}
const zg = Object.freeze(
	Object.defineProperty(
		{
			__proto__: null,
			AnsiStringType: Ld,
			Float16_BE: Ed,
			Float16_LE: Md,
			Float32_BE: Od,
			Float32_LE: Fd,
			Float64_BE: Dd,
			Float64_LE: Rd,
			Float80_BE: Nd,
			Float80_LE: Bd,
			INT16_BE: _d,
			INT16_LE: Td,
			INT24_BE: kd,
			INT24_LE: Ad,
			INT32_BE: Ws,
			INT32_LE: Sd,
			INT64_BE: Id,
			INT64_LE: Pd,
			INT8: Jn,
			IgnoreType: zd,
			StringType: Be,
			UINT16_BE: Jt,
			UINT16_LE: Me,
			UINT24_BE: qs,
			UINT24_LE: Hs,
			UINT32_BE: tn,
			UINT32_LE: Ae,
			UINT64_BE: Cd,
			UINT64_LE: Ks,
			UINT8: er,
			Uint8ArrayType: Ys
		},
		Symbol.toStringTag,
		{ value: 'Module' }
	)
);
var vt = Uint8Array,
	dr = Uint16Array,
	$d = Int32Array,
	Zs = new vt([
		0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0
	]),
	Js = new vt([
		0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13,
		13, 0, 0
	]),
	Ud = new vt([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]),
	Qs = function (t, e) {
		for (var r = new dr(31), n = 0; n < 31; ++n) r[n] = e += 1 << t[n - 1];
		for (var i = new $d(r[30]), n = 1; n < 30; ++n)
			for (var a = r[n]; a < r[n + 1]; ++a) i[a] = ((a - r[n]) << 5) | n;
		return { b: r, r: i };
	},
	eo = Qs(Zs, 2),
	to = eo.b,
	jd = eo.r;
((to[28] = 258), (jd[258] = 28));
var Vd = Qs(Js, 0),
	Xd = Vd.b,
	Qn = new dr(32768);
for (var Fe = 0; Fe < 32768; ++Fe) {
	var Lt = ((Fe & 43690) >> 1) | ((Fe & 21845) << 1);
	((Lt = ((Lt & 52428) >> 2) | ((Lt & 13107) << 2)),
		(Lt = ((Lt & 61680) >> 4) | ((Lt & 3855) << 4)),
		(Qn[Fe] = (((Lt & 65280) >> 8) | ((Lt & 255) << 8)) >> 1));
}
var Sr = function (t, e, r) {
		for (var n = t.length, i = 0, a = new dr(e); i < n; ++i) t[i] && ++a[t[i] - 1];
		var s = new dr(e);
		for (i = 1; i < e; ++i) s[i] = (s[i - 1] + a[i - 1]) << 1;
		var o;
		if (r) {
			o = new dr(1 << e);
			var c = 15 - e;
			for (i = 0; i < n; ++i)
				if (t[i])
					for (
						var l = (i << 4) | t[i], d = e - t[i], u = s[t[i] - 1]++ << d, f = u | ((1 << d) - 1);
						u <= f;
						++u
					)
						o[Qn[u] >> c] = l;
		} else for (o = new dr(n), i = 0; i < n; ++i) t[i] && (o[i] = Qn[s[t[i] - 1]++] >> (15 - t[i]));
		return o;
	},
	Ir = new vt(288);
for (var Fe = 0; Fe < 144; ++Fe) Ir[Fe] = 8;
for (var Fe = 144; Fe < 256; ++Fe) Ir[Fe] = 9;
for (var Fe = 256; Fe < 280; ++Fe) Ir[Fe] = 7;
for (var Fe = 280; Fe < 288; ++Fe) Ir[Fe] = 8;
var ro = new vt(32);
for (var Fe = 0; Fe < 32; ++Fe) ro[Fe] = 5;
var Gd = Sr(Ir, 9, 1),
	Hd = Sr(ro, 5, 1),
	En = function (t) {
		for (var e = t[0], r = 1; r < t.length; ++r) t[r] > e && (e = t[r]);
		return e;
	},
	At = function (t, e, r) {
		var n = (e / 8) | 0;
		return ((t[n] | (t[n + 1] << 8)) >> (e & 7)) & r;
	},
	Mn = function (t, e) {
		var r = (e / 8) | 0;
		return (t[r] | (t[r + 1] << 8) | (t[r + 2] << 16)) >> (e & 7);
	},
	qd = function (t) {
		return ((t + 7) / 8) | 0;
	},
	Wd = function (t, e, r) {
		return ((r == null || r > t.length) && (r = t.length), new vt(t.subarray(e, r)));
	},
	Kd = [
		'unexpected EOF',
		'invalid block type',
		'invalid length/literal',
		'invalid distance',
		'stream finished',
		'no stream handler',
		,
		'no callback',
		'invalid UTF-8 data',
		'extra field too long',
		'date not in range 1980-2099',
		'filename too long',
		'stream finishing',
		'invalid zip data'
	],
	gt = function (t, e, r) {
		var n = new Error(e || Kd[t]);
		if (((n.code = t), Error.captureStackTrace && Error.captureStackTrace(n, gt), !r)) throw n;
		return n;
	},
	Ri = function (t, e, r, n) {
		var i = t.length,
			a = 0;
		if (!i || (e.f && !e.l)) return r || new vt(0);
		var s = !r,
			o = s || e.i != 2,
			c = e.i;
		s && (r = new vt(i * 3));
		var l = function (ye) {
				var Pe = r.length;
				if (ye > Pe) {
					var Ce = new vt(Math.max(Pe * 2, ye));
					(Ce.set(r), (r = Ce));
				}
			},
			d = e.f || 0,
			u = e.p || 0,
			f = e.b || 0,
			h = e.l,
			g = e.d,
			w = e.m,
			v = e.n,
			y = i * 8;
		do {
			if (!h) {
				d = At(t, u, 1);
				var k = At(t, u + 1, 3);
				if (((u += 3), k))
					if (k == 1) ((h = Gd), (g = Hd), (w = 9), (v = 5));
					else if (k == 2) {
						var j = At(t, u, 31) + 257,
							S = At(t, u + 10, 15) + 4,
							L = j + At(t, u + 5, 31) + 1;
						u += 14;
						for (var U = new vt(L), z = new vt(19), I = 0; I < S; ++I)
							z[Ud[I]] = At(t, u + I * 3, 7);
						u += S * 3;
						for (var V = En(z), q = (1 << V) - 1, Z = Sr(z, V, 1), I = 0; I < L; ) {
							var G = Z[At(t, u, q)];
							u += G & 15;
							var $ = G >> 4;
							if ($ < 16) U[I++] = $;
							else {
								var re = 0,
									se = 0;
								for (
									$ == 16
										? ((se = 3 + At(t, u, 3)), (u += 2), (re = U[I - 1]))
										: $ == 17
											? ((se = 3 + At(t, u, 7)), (u += 3))
											: $ == 18 && ((se = 11 + At(t, u, 127)), (u += 7));
									se--;

								)
									U[I++] = re;
							}
						}
						var ie = U.subarray(0, j),
							ne = U.subarray(j);
						((w = En(ie)), (v = En(ne)), (h = Sr(ie, w, 1)), (g = Sr(ne, v, 1)));
					} else gt(1);
				else {
					var $ = qd(u) + 4,
						ee = t[$ - 4] | (t[$ - 3] << 8),
						O = $ + ee;
					if (O > i) {
						c && gt(0);
						break;
					}
					(o && l(f + ee),
						r.set(t.subarray($, O), f),
						(e.b = f += ee),
						(e.p = u = O * 8),
						(e.f = d));
					continue;
				}
				if (u > y) {
					c && gt(0);
					break;
				}
			}
			o && l(f + 131072);
			for (var J = (1 << w) - 1, pe = (1 << v) - 1, de = u; ; de = u) {
				var re = h[Mn(t, u) & J],
					ve = re >> 4;
				if (((u += re & 15), u > y)) {
					c && gt(0);
					break;
				}
				if ((re || gt(2), ve < 256)) r[f++] = ve;
				else if (ve == 256) {
					((de = u), (h = null));
					break;
				} else {
					var fe = ve - 254;
					if (ve > 264) {
						var I = ve - 257,
							me = Zs[I];
						((fe = At(t, u, (1 << me) - 1) + to[I]), (u += me));
					}
					var we = g[Mn(t, u) & pe],
						_e = we >> 4;
					(we || gt(3), (u += we & 15));
					var ne = Xd[_e];
					if (_e > 3) {
						var me = Js[_e];
						((ne += Mn(t, u) & ((1 << me) - 1)), (u += me));
					}
					if (u > y) {
						c && gt(0);
						break;
					}
					o && l(f + 131072);
					var xe = f + fe;
					if (f < ne) {
						var le = a - ne,
							ke = Math.min(ne, xe);
						for (le + f < 0 && gt(3); f < ke; ++f) r[f] = n[le + f];
					}
					for (; f < xe; ++f) r[f] = r[f - ne];
				}
			}
			((e.l = h),
				(e.p = de),
				(e.b = f),
				(e.f = d),
				h && ((d = 1), (e.m = w), (e.d = g), (e.n = v)));
		} while (!d);
		return f != r.length && s ? Wd(r, 0, f) : r.subarray(0, f);
	},
	Yd = new vt(0),
	Zd = function (t) {
		(t[0] != 31 || t[1] != 139 || t[2] != 8) && gt(6, 'invalid gzip data');
		var e = t[3],
			r = 10;
		e & 4 && (r += (t[10] | (t[11] << 8)) + 2);
		for (var n = ((e >> 3) & 1) + ((e >> 4) & 1); n > 0; n -= !t[r++]);
		return r + (e & 2);
	},
	Jd = function (t) {
		var e = t.length;
		return (t[e - 4] | (t[e - 3] << 8) | (t[e - 2] << 16) | (t[e - 1] << 24)) >>> 0;
	},
	Qd = function (t, e) {
		return (
			((t[0] & 15) != 8 || t[0] >> 4 > 7 || ((t[0] << 8) | t[1]) % 31) &&
				gt(6, 'invalid zlib data'),
			((t[1] >> 5) & 1) == 1 &&
				gt(6, 'invalid zlib data: ' + (t[1] & 32 ? 'need' : 'unexpected') + ' dictionary'),
			((t[1] >> 3) & 4) + 2
		);
	};
function ef(t, e) {
	return Ri(t, { i: 2 }, e, e);
}
function tf(t, e) {
	var r = Zd(t);
	return (
		r + 8 > t.length && gt(6, 'invalid gzip data'),
		Ri(t.subarray(r, -8), { i: 2 }, new vt(Jd(t)), e)
	);
}
function rf(t, e) {
	return Ri(t.subarray(Qd(t), -4), { i: 2 }, e, e);
}
function nf(t, e) {
	return t[0] == 31 && t[1] == 139 && t[2] == 8
		? tf(t, e)
		: (t[0] & 15) != 8 || t[0] >> 4 > 7 || ((t[0] << 8) | t[1]) % 31
			? ef(t, e)
			: rf(t, e);
}
var af = typeof TextDecoder < 'u' && new TextDecoder(),
	sf = 0;
try {
	(af.decode(Yd, { stream: !0 }), (sf = 1));
} catch {}
var $r = { exports: {} },
	On,
	pa;
function of() {
	if (pa) return On;
	pa = 1;
	var t = 1e3,
		e = t * 60,
		r = e * 60,
		n = r * 24,
		i = n * 7,
		a = n * 365.25;
	On = function (d, u) {
		u = u || {};
		var f = typeof d;
		if (f === 'string' && d.length > 0) return s(d);
		if (f === 'number' && isFinite(d)) return u.long ? c(d) : o(d);
		throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(d));
	};
	function s(d) {
		if (((d = String(d)), !(d.length > 100))) {
			var u =
				/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
					d
				);
			if (u) {
				var f = parseFloat(u[1]),
					h = (u[2] || 'ms').toLowerCase();
				switch (h) {
					case 'years':
					case 'year':
					case 'yrs':
					case 'yr':
					case 'y':
						return f * a;
					case 'weeks':
					case 'week':
					case 'w':
						return f * i;
					case 'days':
					case 'day':
					case 'd':
						return f * n;
					case 'hours':
					case 'hour':
					case 'hrs':
					case 'hr':
					case 'h':
						return f * r;
					case 'minutes':
					case 'minute':
					case 'mins':
					case 'min':
					case 'm':
						return f * e;
					case 'seconds':
					case 'second':
					case 'secs':
					case 'sec':
					case 's':
						return f * t;
					case 'milliseconds':
					case 'millisecond':
					case 'msecs':
					case 'msec':
					case 'ms':
						return f;
					default:
						return;
				}
			}
		}
	}
	function o(d) {
		var u = Math.abs(d);
		return u >= n
			? Math.round(d / n) + 'd'
			: u >= r
				? Math.round(d / r) + 'h'
				: u >= e
					? Math.round(d / e) + 'm'
					: u >= t
						? Math.round(d / t) + 's'
						: d + 'ms';
	}
	function c(d) {
		var u = Math.abs(d);
		return u >= n
			? l(d, u, n, 'day')
			: u >= r
				? l(d, u, r, 'hour')
				: u >= e
					? l(d, u, e, 'minute')
					: u >= t
						? l(d, u, t, 'second')
						: d + ' ms';
	}
	function l(d, u, f, h) {
		var g = u >= f * 1.5;
		return Math.round(d / f) + ' ' + h + (g ? 's' : '');
	}
	return On;
}
var Fn, ma;
function lf() {
	if (ma) return Fn;
	ma = 1;
	function t(e) {
		((n.debug = n),
			(n.default = n),
			(n.coerce = l),
			(n.disable = o),
			(n.enable = a),
			(n.enabled = c),
			(n.humanize = of()),
			(n.destroy = d),
			Object.keys(e).forEach((u) => {
				n[u] = e[u];
			}),
			(n.names = []),
			(n.skips = []),
			(n.formatters = {}));
		function r(u) {
			let f = 0;
			for (let h = 0; h < u.length; h++) ((f = (f << 5) - f + u.charCodeAt(h)), (f |= 0));
			return n.colors[Math.abs(f) % n.colors.length];
		}
		n.selectColor = r;
		function n(u) {
			let f,
				h = null,
				g,
				w;
			function v(...y) {
				if (!v.enabled) return;
				const k = v,
					$ = Number(new Date()),
					ee = $ - (f || $);
				((k.diff = ee),
					(k.prev = f),
					(k.curr = $),
					(f = $),
					(y[0] = n.coerce(y[0])),
					typeof y[0] != 'string' && y.unshift('%O'));
				let O = 0;
				((y[0] = y[0].replace(/%([a-zA-Z%])/g, (S, L) => {
					if (S === '%%') return '%';
					O++;
					const U = n.formatters[L];
					if (typeof U == 'function') {
						const z = y[O];
						((S = U.call(k, z)), y.splice(O, 1), O--);
					}
					return S;
				})),
					n.formatArgs.call(k, y),
					(k.log || n.log).apply(k, y));
			}
			return (
				(v.namespace = u),
				(v.useColors = n.useColors()),
				(v.color = n.selectColor(u)),
				(v.extend = i),
				(v.destroy = n.destroy),
				Object.defineProperty(v, 'enabled', {
					enumerable: !0,
					configurable: !1,
					get: () =>
						h !== null ? h : (g !== n.namespaces && ((g = n.namespaces), (w = n.enabled(u))), w),
					set: (y) => {
						h = y;
					}
				}),
				typeof n.init == 'function' && n.init(v),
				v
			);
		}
		function i(u, f) {
			const h = n(this.namespace + (typeof f > 'u' ? ':' : f) + u);
			return ((h.log = this.log), h);
		}
		function a(u) {
			(n.save(u), (n.namespaces = u), (n.names = []), (n.skips = []));
			const f = (typeof u == 'string' ? u : '')
				.trim()
				.replace(/\s+/g, ',')
				.split(',')
				.filter(Boolean);
			for (const h of f) h[0] === '-' ? n.skips.push(h.slice(1)) : n.names.push(h);
		}
		function s(u, f) {
			let h = 0,
				g = 0,
				w = -1,
				v = 0;
			for (; h < u.length; )
				if (g < f.length && (f[g] === u[h] || f[g] === '*'))
					f[g] === '*' ? ((w = g), (v = h), g++) : (h++, g++);
				else if (w !== -1) ((g = w + 1), v++, (h = v));
				else return !1;
			for (; g < f.length && f[g] === '*'; ) g++;
			return g === f.length;
		}
		function o() {
			const u = [...n.names, ...n.skips.map((f) => '-' + f)].join(',');
			return (n.enable(''), u);
		}
		function c(u) {
			for (const f of n.skips) if (s(u, f)) return !1;
			for (const f of n.names) if (s(u, f)) return !0;
			return !1;
		}
		function l(u) {
			return u instanceof Error ? u.stack || u.message : u;
		}
		function d() {
			console.warn(
				'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
			);
		}
		return (n.enable(n.load()), n);
	}
	return ((Fn = t), Fn);
}
var ha;
function cf() {
	return (
		ha ||
			((ha = 1),
			(function (t, e) {
				var r = {};
				((e.formatArgs = i),
					(e.save = a),
					(e.load = s),
					(e.useColors = n),
					(e.storage = o()),
					(e.destroy = (() => {
						let l = !1;
						return () => {
							l ||
								((l = !0),
								console.warn(
									'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
								));
						};
					})()),
					(e.colors = [
						'#0000CC',
						'#0000FF',
						'#0033CC',
						'#0033FF',
						'#0066CC',
						'#0066FF',
						'#0099CC',
						'#0099FF',
						'#00CC00',
						'#00CC33',
						'#00CC66',
						'#00CC99',
						'#00CCCC',
						'#00CCFF',
						'#3300CC',
						'#3300FF',
						'#3333CC',
						'#3333FF',
						'#3366CC',
						'#3366FF',
						'#3399CC',
						'#3399FF',
						'#33CC00',
						'#33CC33',
						'#33CC66',
						'#33CC99',
						'#33CCCC',
						'#33CCFF',
						'#6600CC',
						'#6600FF',
						'#6633CC',
						'#6633FF',
						'#66CC00',
						'#66CC33',
						'#9900CC',
						'#9900FF',
						'#9933CC',
						'#9933FF',
						'#99CC00',
						'#99CC33',
						'#CC0000',
						'#CC0033',
						'#CC0066',
						'#CC0099',
						'#CC00CC',
						'#CC00FF',
						'#CC3300',
						'#CC3333',
						'#CC3366',
						'#CC3399',
						'#CC33CC',
						'#CC33FF',
						'#CC6600',
						'#CC6633',
						'#CC9900',
						'#CC9933',
						'#CCCC00',
						'#CCCC33',
						'#FF0000',
						'#FF0033',
						'#FF0066',
						'#FF0099',
						'#FF00CC',
						'#FF00FF',
						'#FF3300',
						'#FF3333',
						'#FF3366',
						'#FF3399',
						'#FF33CC',
						'#FF33FF',
						'#FF6600',
						'#FF6633',
						'#FF9900',
						'#FF9933',
						'#FFCC00',
						'#FFCC33'
					]));
				function n() {
					if (
						typeof window < 'u' &&
						window.process &&
						(window.process.type === 'renderer' || window.process.__nwjs)
					)
						return !0;
					if (
						typeof navigator < 'u' &&
						navigator.userAgent &&
						navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
					)
						return !1;
					let l;
					return (
						(typeof document < 'u' &&
							document.documentElement &&
							document.documentElement.style &&
							document.documentElement.style.WebkitAppearance) ||
						(typeof window < 'u' &&
							window.console &&
							(window.console.firebug || (window.console.exception && window.console.table))) ||
						(typeof navigator < 'u' &&
							navigator.userAgent &&
							(l = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) &&
							parseInt(l[1], 10) >= 31) ||
						(typeof navigator < 'u' &&
							navigator.userAgent &&
							navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
					);
				}
				function i(l) {
					if (
						((l[0] =
							(this.useColors ? '%c' : '') +
							this.namespace +
							(this.useColors ? ' %c' : ' ') +
							l[0] +
							(this.useColors ? '%c ' : ' ') +
							'+' +
							t.exports.humanize(this.diff)),
						!this.useColors)
					)
						return;
					const d = 'color: ' + this.color;
					l.splice(1, 0, d, 'color: inherit');
					let u = 0,
						f = 0;
					(l[0].replace(/%[a-zA-Z%]/g, (h) => {
						h !== '%%' && (u++, h === '%c' && (f = u));
					}),
						l.splice(f, 0, d));
				}
				e.log = console.debug || console.log || (() => {});
				function a(l) {
					try {
						l ? e.storage.setItem('debug', l) : e.storage.removeItem('debug');
					} catch {}
				}
				function s() {
					let l;
					try {
						l = e.storage.getItem('debug') || e.storage.getItem('DEBUG');
					} catch {}
					return (!l && typeof process < 'u' && 'env' in process && (l = r.DEBUG), l);
				}
				function o() {
					try {
						return localStorage;
					} catch {}
				}
				t.exports = lf()(e);
				const { formatters: c } = t.exports;
				c.j = function (l) {
					try {
						return JSON.stringify(l);
					} catch (d) {
						return '[UnexpectedJSONParseError]: ' + d.message;
					}
				};
			})($r, $r.exports)),
		$r.exports
	);
}
var uf = cf();
const Er = ai(uf),
	fr = {
		LocalFileHeader: 67324752,
		DataDescriptor: 134695760,
		CentralFileHeader: 33639248,
		EndOfCentralDirectory: 101010256
	},
	ga = {
		get(t) {
			return (
				Me.get(t, 6),
				{ signature: Ae.get(t, 0), compressedSize: Ae.get(t, 8), uncompressedSize: Ae.get(t, 12) }
			);
		},
		len: 16
	},
	df = {
		get(t) {
			const e = Me.get(t, 6);
			return {
				signature: Ae.get(t, 0),
				minVersion: Me.get(t, 4),
				dataDescriptor: !!(e & 8),
				compressedMethod: Me.get(t, 8),
				compressedSize: Ae.get(t, 18),
				uncompressedSize: Ae.get(t, 22),
				filenameLength: Me.get(t, 26),
				extraFieldLength: Me.get(t, 28),
				filename: null
			};
		},
		len: 30
	},
	ff = {
		get(t) {
			return {
				signature: Ae.get(t, 0),
				nrOfThisDisk: Me.get(t, 4),
				nrOfThisDiskWithTheStart: Me.get(t, 6),
				nrOfEntriesOnThisDisk: Me.get(t, 8),
				nrOfEntriesOfSize: Me.get(t, 10),
				sizeOfCd: Ae.get(t, 12),
				offsetOfStartOfCd: Ae.get(t, 16),
				zipFileCommentLength: Me.get(t, 20)
			};
		},
		len: 22
	},
	pf = {
		get(t) {
			const e = Me.get(t, 8);
			return {
				signature: Ae.get(t, 0),
				minVersion: Me.get(t, 6),
				dataDescriptor: !!(e & 8),
				compressedMethod: Me.get(t, 10),
				compressedSize: Ae.get(t, 20),
				uncompressedSize: Ae.get(t, 24),
				filenameLength: Me.get(t, 28),
				extraFieldLength: Me.get(t, 30),
				fileCommentLength: Me.get(t, 32),
				relativeOffsetOfLocalHeader: Ae.get(t, 42),
				filename: null
			};
		},
		len: 46
	};
function no(t) {
	const e = new Uint8Array(Ae.len);
	return (Ae.put(e, 0, t), e);
}
const It = Er('tokenizer:inflate'),
	Dn = 256 * 1024,
	mf = no(fr.DataDescriptor),
	Ur = no(fr.EndOfCentralDirectory);
class hf {
	constructor(e) {
		((this.tokenizer = e), (this.syncBuffer = new Uint8Array(Dn)));
	}
	async isZip() {
		return (await this.peekSignature()) === fr.LocalFileHeader;
	}
	peekSignature() {
		return this.tokenizer.peekToken(Ae);
	}
	async findEndOfCentralDirectoryLocator() {
		const e = this.tokenizer,
			r = Math.min(16 * 1024, e.fileInfo.size),
			n = this.syncBuffer.subarray(0, r);
		await this.tokenizer.readBuffer(n, { position: e.fileInfo.size - r });
		for (let i = n.length - 4; i >= 0; i--)
			if (n[i] === Ur[0] && n[i + 1] === Ur[1] && n[i + 2] === Ur[2] && n[i + 3] === Ur[3])
				return e.fileInfo.size - r + i;
		return -1;
	}
	async readCentralDirectory() {
		if (!this.tokenizer.supportsRandomAccess()) {
			It('Cannot reading central-directory without random-read support');
			return;
		}
		It('Reading central-directory...');
		const e = this.tokenizer.position,
			r = await this.findEndOfCentralDirectoryLocator();
		if (r > 0) {
			It('Central-directory 32-bit signature found');
			const n = await this.tokenizer.readToken(ff, r),
				i = [];
			this.tokenizer.setPosition(n.offsetOfStartOfCd);
			for (let a = 0; a < n.nrOfEntriesOfSize; ++a) {
				const s = await this.tokenizer.readToken(pf);
				if (s.signature !== fr.CentralFileHeader)
					throw new Error('Expected Central-File-Header signature');
				((s.filename = await this.tokenizer.readToken(new Be(s.filenameLength, 'utf-8'))),
					await this.tokenizer.ignore(s.extraFieldLength),
					await this.tokenizer.ignore(s.fileCommentLength),
					i.push(s),
					It(
						`Add central-directory file-entry: n=${a + 1}/${i.length}: filename=${i[a].filename}`
					));
			}
			return (this.tokenizer.setPosition(e), i);
		}
		this.tokenizer.setPosition(e);
	}
	async unzip(e) {
		const r = await this.readCentralDirectory();
		if (r) return this.iterateOverCentralDirectory(r, e);
		let n = !1;
		do {
			const i = await this.readLocalFileHeader();
			if (!i) break;
			const a = e(i);
			n = !!a.stop;
			let s;
			if (
				(await this.tokenizer.ignore(i.extraFieldLength),
				i.dataDescriptor && i.compressedSize === 0)
			) {
				const o = [];
				let c = Dn;
				It('Compressed-file-size unknown, scanning for next data-descriptor-signature....');
				let l = -1;
				for (; l < 0 && c === Dn; ) {
					((c = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: !0 })),
						(l = gf(this.syncBuffer.subarray(0, c), mf)));
					const d = l >= 0 ? l : c;
					if (a.handler) {
						const u = new Uint8Array(d);
						(await this.tokenizer.readBuffer(u), o.push(u));
					} else await this.tokenizer.ignore(d);
				}
				(It(`Found data-descriptor-signature at pos=${this.tokenizer.position}`),
					a.handler && (await this.inflate(i, vf(o), a.handler)));
			} else
				a.handler
					? (It(`Reading compressed-file-data: ${i.compressedSize} bytes`),
						(s = new Uint8Array(i.compressedSize)),
						await this.tokenizer.readBuffer(s),
						await this.inflate(i, s, a.handler))
					: (It(`Ignoring compressed-file-data: ${i.compressedSize} bytes`),
						await this.tokenizer.ignore(i.compressedSize));
			if (
				(It(`Reading data-descriptor at pos=${this.tokenizer.position}`),
				i.dataDescriptor && (await this.tokenizer.readToken(ga)).signature !== 134695760)
			)
				throw new Error(
					`Expected data-descriptor-signature at position ${this.tokenizer.position - ga.len}`
				);
		} while (!n);
	}
	async iterateOverCentralDirectory(e, r) {
		for (const n of e) {
			const i = r(n);
			if (i.handler) {
				this.tokenizer.setPosition(n.relativeOffsetOfLocalHeader);
				const a = await this.readLocalFileHeader();
				if (a) {
					await this.tokenizer.ignore(a.extraFieldLength);
					const s = new Uint8Array(n.compressedSize);
					(await this.tokenizer.readBuffer(s), await this.inflate(a, s, i.handler));
				}
			}
			if (i.stop) break;
		}
	}
	inflate(e, r, n) {
		if (e.compressedMethod === 0) return n(r);
		It(`Decompress filename=${e.filename}, compressed-size=${r.length}`);
		const i = nf(r);
		return n(i);
	}
	async readLocalFileHeader() {
		const e = await this.tokenizer.peekToken(Ae);
		if (e === fr.LocalFileHeader) {
			const r = await this.tokenizer.readToken(df);
			return ((r.filename = await this.tokenizer.readToken(new Be(r.filenameLength, 'utf-8'))), r);
		}
		if (e === fr.CentralFileHeader) return !1;
		throw e === 3759263696 ? new Error('Encrypted ZIP') : new Error('Unexpected signature');
	}
}
function gf(t, e) {
	const r = t.length,
		n = e.length;
	if (n > r) return -1;
	for (let i = 0; i <= r - n; i++) {
		let a = !0;
		for (let s = 0; s < n; s++)
			if (t[i + s] !== e[s]) {
				a = !1;
				break;
			}
		if (a) return i;
	}
	return -1;
}
function vf(t) {
	const e = t.reduce((i, a) => i + a.length, 0),
		r = new Uint8Array(e);
	let n = 0;
	for (const i of t) (r.set(i, n), (n += i.length));
	return r;
}
const xf = Object.prototype.toString,
	yf = '[object Uint8Array]',
	bf = '[object ArrayBuffer]';
function io(t, e, r) {
	return t ? (t.constructor === e ? !0 : xf.call(t) === r) : !1;
}
function ao(t) {
	return io(t, Uint8Array, yf);
}
function wf(t) {
	return io(t, ArrayBuffer, bf);
}
function _f(t) {
	return ao(t) || wf(t);
}
function Tf(t) {
	if (!ao(t)) throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof t}\``);
}
function Af(t) {
	if (!_f(t))
		throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof t}\``);
}
const va = { utf8: new globalThis.TextDecoder('utf8') };
function so(t, e = 'utf8') {
	return (Af(t), (va[e] ??= new globalThis.TextDecoder(e)), va[e].decode(t));
}
function oo(t) {
	if (typeof t != 'string') throw new TypeError(`Expected \`string\`, got \`${typeof t}\``);
}
const kf = new globalThis.TextEncoder();
function Sf(t) {
	return (oo(t), kf.encode(t));
}
const Pf = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, '0'));
function Lg(t) {
	Tf(t);
	let e = '';
	for (let r = 0; r < t.length; r++) e += Pf[t[r]];
	return e;
}
const xa = {
	0: 0,
	1: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6,
	7: 7,
	8: 8,
	9: 9,
	a: 10,
	b: 11,
	c: 12,
	d: 13,
	e: 14,
	f: 15,
	A: 10,
	B: 11,
	C: 12,
	D: 13,
	E: 14,
	F: 15
};
function $g(t) {
	if ((oo(t), t.length % 2 !== 0)) throw new Error('Invalid Hex string length.');
	const e = t.length / 2,
		r = new Uint8Array(e);
	for (let n = 0; n < e; n++) {
		const i = xa[t[n * 2]],
			a = xa[t[n * 2 + 1]];
		if (i === void 0 || a === void 0)
			throw new Error(`Invalid Hex character encountered at position ${n * 2}`);
		r[n] = (i << 4) | a;
	}
	return r;
}
function ya(t) {
	const { byteLength: e } = t;
	if (e === 6) return t.getUint16(0) * 2 ** 32 + t.getUint32(2);
	if (e === 5) return t.getUint8(0) * 2 ** 32 + t.getUint32(1);
	if (e === 4) return t.getUint32(0);
	if (e === 3) return t.getUint8(0) * 2 ** 16 + t.getUint16(1);
	if (e === 2) return t.getUint16(0);
	if (e === 1) return t.getUint8(0);
}
function Cf(t) {
	return [...t].map((e) => e.charCodeAt(0));
}
function If(t, e = 0) {
	const r = Number.parseInt(new Be(6).get(t, 148).replace(/\0.*$/, '').trim(), 8);
	if (Number.isNaN(r)) return !1;
	let n = 8 * 32;
	for (let i = e; i < e + 148; i++) n += t[i];
	for (let i = e + 156; i < e + 512; i++) n += t[i];
	return r === n;
}
const Ef = {
		get: (t, e) => (t[e + 3] & 127) | (t[e + 2] << 7) | (t[e + 1] << 14) | (t[e] << 21),
		len: 4
	},
	Mf = [
		'jpg',
		'png',
		'apng',
		'gif',
		'webp',
		'flif',
		'xcf',
		'cr2',
		'cr3',
		'orf',
		'arw',
		'dng',
		'nef',
		'rw2',
		'raf',
		'tif',
		'bmp',
		'icns',
		'jxr',
		'psd',
		'indd',
		'zip',
		'tar',
		'rar',
		'gz',
		'bz2',
		'7z',
		'dmg',
		'mp4',
		'mid',
		'mkv',
		'webm',
		'mov',
		'avi',
		'mpg',
		'mp2',
		'mp3',
		'm4a',
		'oga',
		'ogg',
		'ogv',
		'opus',
		'flac',
		'wav',
		'spx',
		'amr',
		'pdf',
		'epub',
		'elf',
		'macho',
		'exe',
		'swf',
		'rtf',
		'wasm',
		'woff',
		'woff2',
		'eot',
		'ttf',
		'otf',
		'ttc',
		'ico',
		'flv',
		'ps',
		'xz',
		'sqlite',
		'nes',
		'crx',
		'xpi',
		'cab',
		'deb',
		'ar',
		'rpm',
		'Z',
		'lz',
		'cfb',
		'mxf',
		'mts',
		'blend',
		'bpg',
		'docx',
		'pptx',
		'xlsx',
		'3gp',
		'3g2',
		'j2c',
		'jp2',
		'jpm',
		'jpx',
		'mj2',
		'aif',
		'qcp',
		'odt',
		'ods',
		'odp',
		'xml',
		'mobi',
		'heic',
		'cur',
		'ktx',
		'ape',
		'wv',
		'dcm',
		'ics',
		'glb',
		'pcap',
		'dsf',
		'lnk',
		'alias',
		'voc',
		'ac3',
		'm4v',
		'm4p',
		'm4b',
		'f4v',
		'f4p',
		'f4b',
		'f4a',
		'mie',
		'asf',
		'ogm',
		'ogx',
		'mpc',
		'arrow',
		'shp',
		'aac',
		'mp1',
		'it',
		's3m',
		'xm',
		'skp',
		'avif',
		'eps',
		'lzh',
		'pgp',
		'asar',
		'stl',
		'chm',
		'3mf',
		'zst',
		'jxl',
		'vcf',
		'jls',
		'pst',
		'dwg',
		'parquet',
		'class',
		'arj',
		'cpio',
		'ace',
		'avro',
		'icc',
		'fbx',
		'vsdx',
		'vtt',
		'apk',
		'drc',
		'lz4',
		'potx',
		'xltx',
		'dotx',
		'xltm',
		'ott',
		'ots',
		'otp',
		'odg',
		'otg',
		'xlsm',
		'docm',
		'dotm',
		'potm',
		'pptm',
		'jar',
		'rm',
		'ppsm',
		'ppsx'
	],
	Of = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/flif',
		'image/x-xcf',
		'image/x-canon-cr2',
		'image/x-canon-cr3',
		'image/tiff',
		'image/bmp',
		'image/vnd.ms-photo',
		'image/vnd.adobe.photoshop',
		'application/x-indesign',
		'application/epub+zip',
		'application/x-xpinstall',
		'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
		'application/vnd.oasis.opendocument.text',
		'application/vnd.oasis.opendocument.spreadsheet',
		'application/vnd.oasis.opendocument.presentation',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
		'application/zip',
		'application/x-tar',
		'application/x-rar-compressed',
		'application/gzip',
		'application/x-bzip2',
		'application/x-7z-compressed',
		'application/x-apple-diskimage',
		'application/vnd.apache.arrow.file',
		'video/mp4',
		'audio/midi',
		'video/matroska',
		'video/webm',
		'video/quicktime',
		'video/vnd.avi',
		'audio/wav',
		'audio/qcelp',
		'audio/x-ms-asf',
		'video/x-ms-asf',
		'application/vnd.ms-asf',
		'video/mpeg',
		'video/3gpp',
		'audio/mpeg',
		'audio/mp4',
		'video/ogg',
		'audio/ogg',
		'audio/ogg; codecs=opus',
		'application/ogg',
		'audio/flac',
		'audio/ape',
		'audio/wavpack',
		'audio/amr',
		'application/pdf',
		'application/x-elf',
		'application/x-mach-binary',
		'application/x-msdownload',
		'application/x-shockwave-flash',
		'application/rtf',
		'application/wasm',
		'font/woff',
		'font/woff2',
		'application/vnd.ms-fontobject',
		'font/ttf',
		'font/otf',
		'font/collection',
		'image/x-icon',
		'video/x-flv',
		'application/postscript',
		'application/eps',
		'application/x-xz',
		'application/x-sqlite3',
		'application/x-nintendo-nes-rom',
		'application/x-google-chrome-extension',
		'application/vnd.ms-cab-compressed',
		'application/x-deb',
		'application/x-unix-archive',
		'application/x-rpm',
		'application/x-compress',
		'application/x-lzip',
		'application/x-cfb',
		'application/x-mie',
		'application/mxf',
		'video/mp2t',
		'application/x-blender',
		'image/bpg',
		'image/j2c',
		'image/jp2',
		'image/jpx',
		'image/jpm',
		'image/mj2',
		'audio/aiff',
		'application/xml',
		'application/x-mobipocket-ebook',
		'image/heif',
		'image/heif-sequence',
		'image/heic',
		'image/heic-sequence',
		'image/icns',
		'image/ktx',
		'application/dicom',
		'audio/x-musepack',
		'text/calendar',
		'text/vcard',
		'text/vtt',
		'model/gltf-binary',
		'application/vnd.tcpdump.pcap',
		'audio/x-dsf',
		'application/x.ms.shortcut',
		'application/x.apple.alias',
		'audio/x-voc',
		'audio/vnd.dolby.dd-raw',
		'audio/x-m4a',
		'image/apng',
		'image/x-olympus-orf',
		'image/x-sony-arw',
		'image/x-adobe-dng',
		'image/x-nikon-nef',
		'image/x-panasonic-rw2',
		'image/x-fujifilm-raf',
		'video/x-m4v',
		'video/3gpp2',
		'application/x-esri-shape',
		'audio/aac',
		'audio/x-it',
		'audio/x-s3m',
		'audio/x-xm',
		'video/MP1S',
		'video/MP2P',
		'application/vnd.sketchup.skp',
		'image/avif',
		'application/x-lzh-compressed',
		'application/pgp-encrypted',
		'application/x-asar',
		'model/stl',
		'application/vnd.ms-htmlhelp',
		'model/3mf',
		'image/jxl',
		'application/zstd',
		'image/jls',
		'application/vnd.ms-outlook',
		'image/vnd.dwg',
		'application/vnd.apache.parquet',
		'application/java-vm',
		'application/x-arj',
		'application/x-cpio',
		'application/x-ace-compressed',
		'application/avro',
		'application/vnd.iccprofile',
		'application/x.autodesk.fbx',
		'application/vnd.visio',
		'application/vnd.android.package-archive',
		'application/vnd.google.draco',
		'application/x-lz4',
		'application/vnd.openxmlformats-officedocument.presentationml.template',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
		'application/vnd.ms-excel.template.macroenabled.12',
		'application/vnd.oasis.opendocument.text-template',
		'application/vnd.oasis.opendocument.spreadsheet-template',
		'application/vnd.oasis.opendocument.presentation-template',
		'application/vnd.oasis.opendocument.graphics',
		'application/vnd.oasis.opendocument.graphics-template',
		'application/vnd.ms-excel.sheet.macroenabled.12',
		'application/vnd.ms-word.document.macroenabled.12',
		'application/vnd.ms-word.template.macroenabled.12',
		'application/vnd.ms-powerpoint.template.macroenabled.12',
		'application/vnd.ms-powerpoint.presentation.macroenabled.12',
		'application/java-archive',
		'application/vnd.rn-realmedia'
	],
	Rn = 4100;
async function lo(t, e) {
	return new Ff(e).fromBuffer(t);
}
function Nn(t) {
	switch (((t = t.toLowerCase()), t)) {
		case 'application/epub+zip':
			return { ext: 'epub', mime: t };
		case 'application/vnd.oasis.opendocument.text':
			return { ext: 'odt', mime: t };
		case 'application/vnd.oasis.opendocument.text-template':
			return { ext: 'ott', mime: t };
		case 'application/vnd.oasis.opendocument.spreadsheet':
			return { ext: 'ods', mime: t };
		case 'application/vnd.oasis.opendocument.spreadsheet-template':
			return { ext: 'ots', mime: t };
		case 'application/vnd.oasis.opendocument.presentation':
			return { ext: 'odp', mime: t };
		case 'application/vnd.oasis.opendocument.presentation-template':
			return { ext: 'otp', mime: t };
		case 'application/vnd.oasis.opendocument.graphics':
			return { ext: 'odg', mime: t };
		case 'application/vnd.oasis.opendocument.graphics-template':
			return { ext: 'otg', mime: t };
		case 'application/vnd.openxmlformats-officedocument.presentationml.slideshow':
			return { ext: 'ppsx', mime: t };
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			return { ext: 'xlsx', mime: t };
		case 'application/vnd.ms-excel.sheet.macroenabled':
			return { ext: 'xlsm', mime: 'application/vnd.ms-excel.sheet.macroenabled.12' };
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.template':
			return { ext: 'xltx', mime: t };
		case 'application/vnd.ms-excel.template.macroenabled':
			return { ext: 'xltm', mime: 'application/vnd.ms-excel.template.macroenabled.12' };
		case 'application/vnd.ms-powerpoint.slideshow.macroenabled':
			return { ext: 'ppsm', mime: 'application/vnd.ms-powerpoint.slideshow.macroenabled.12' };
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			return { ext: 'docx', mime: t };
		case 'application/vnd.ms-word.document.macroenabled':
			return { ext: 'docm', mime: 'application/vnd.ms-word.document.macroenabled.12' };
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
			return { ext: 'dotx', mime: t };
		case 'application/vnd.ms-word.template.macroenabledtemplate':
			return { ext: 'dotm', mime: 'application/vnd.ms-word.template.macroenabled.12' };
		case 'application/vnd.openxmlformats-officedocument.presentationml.template':
			return { ext: 'potx', mime: t };
		case 'application/vnd.ms-powerpoint.template.macroenabled':
			return { ext: 'potm', mime: 'application/vnd.ms-powerpoint.template.macroenabled.12' };
		case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
			return { ext: 'pptx', mime: t };
		case 'application/vnd.ms-powerpoint.presentation.macroenabled':
			return { ext: 'pptm', mime: 'application/vnd.ms-powerpoint.presentation.macroenabled.12' };
		case 'application/vnd.ms-visio.drawing':
			return { ext: 'vsdx', mime: 'application/vnd.visio' };
		case 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml':
			return { ext: '3mf', mime: 'model/3mf' };
	}
}
function Et(t, e, r) {
	r = { offset: 0, ...r };
	for (const [n, i] of e.entries())
		if (r.mask) {
			if (i !== (r.mask[n] & t[n + r.offset])) return !1;
		} else if (i !== t[n + r.offset]) return !1;
	return !0;
}
class Ff {
	constructor(e) {
		((this.options = { mpegOffsetTolerance: 0, ...e }),
			(this.detectors = [
				...(e?.customDetectors ?? []),
				{ id: 'core', detect: this.detectConfident },
				{ id: 'core.imprecise', detect: this.detectImprecise }
			]),
			(this.tokenizerOptions = { abortSignal: e?.signal }));
	}
	async fromTokenizer(e) {
		const r = e.position;
		for (const n of this.detectors) {
			const i = await n.detect(e);
			if (i) return i;
			if (r !== e.position) return;
		}
	}
	async fromBuffer(e) {
		if (!(e instanceof Uint8Array || e instanceof ArrayBuffer))
			throw new TypeError(
				`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``
			);
		const r = e instanceof Uint8Array ? e : new Uint8Array(e);
		if (r?.length > 1) return this.fromTokenizer(Zn(r, this.tokenizerOptions));
	}
	async fromBlob(e) {
		return this.fromStream(e.stream());
	}
	async fromStream(e) {
		const r = await yd(e, this.tokenizerOptions);
		try {
			return await this.fromTokenizer(r);
		} finally {
			await r.close();
		}
	}
	async toDetectionStream(e, r) {
		const { sampleSize: n = Rn } = r;
		let i, a;
		const s = e.getReader({ mode: 'byob' });
		try {
			const { value: l, done: d } = await s.read(new Uint8Array(n));
			if (((a = l), !d && l))
				try {
					i = await this.fromBuffer(l.subarray(0, n));
				} catch (u) {
					if (!(u instanceof xt)) throw u;
					i = void 0;
				}
			a = l;
		} finally {
			s.releaseLock();
		}
		const o = new TransformStream({
				async start(l) {
					l.enqueue(a);
				},
				transform(l, d) {
					d.enqueue(l);
				}
			}),
			c = e.pipeThrough(o);
		return ((c.fileType = i), c);
	}
	check(e, r) {
		return Et(this.buffer, e, r);
	}
	checkString(e, r) {
		return this.check(Cf(e), r);
	}
	detectConfident = async (e) => {
		if (
			((this.buffer = new Uint8Array(Rn)),
			e.fileInfo.size === void 0 && (e.fileInfo.size = Number.MAX_SAFE_INTEGER),
			(this.tokenizer = e),
			await e.peekBuffer(this.buffer, { length: 12, mayBeLess: !0 }),
			this.check([66, 77]))
		)
			return { ext: 'bmp', mime: 'image/bmp' };
		if (this.check([11, 119])) return { ext: 'ac3', mime: 'audio/vnd.dolby.dd-raw' };
		if (this.check([120, 1])) return { ext: 'dmg', mime: 'application/x-apple-diskimage' };
		if (this.check([77, 90])) return { ext: 'exe', mime: 'application/x-msdownload' };
		if (this.check([37, 33]))
			return (
				await e.peekBuffer(this.buffer, { length: 24, mayBeLess: !0 }),
				this.checkString('PS-Adobe-', { offset: 2 }) && this.checkString(' EPSF-', { offset: 14 })
					? { ext: 'eps', mime: 'application/eps' }
					: { ext: 'ps', mime: 'application/postscript' }
			);
		if (this.check([31, 160]) || this.check([31, 157]))
			return { ext: 'Z', mime: 'application/x-compress' };
		if (this.check([199, 113])) return { ext: 'cpio', mime: 'application/x-cpio' };
		if (this.check([96, 234])) return { ext: 'arj', mime: 'application/x-arj' };
		if (this.check([239, 187, 191])) return (this.tokenizer.ignore(3), this.detectConfident(e));
		if (this.check([71, 73, 70])) return { ext: 'gif', mime: 'image/gif' };
		if (this.check([73, 73, 188])) return { ext: 'jxr', mime: 'image/vnd.ms-photo' };
		if (this.check([31, 139, 8])) return { ext: 'gz', mime: 'application/gzip' };
		if (this.check([66, 90, 104])) return { ext: 'bz2', mime: 'application/x-bzip2' };
		if (this.checkString('ID3')) {
			await e.ignore(6);
			const r = await e.readToken(Ef);
			return e.position + r > e.fileInfo.size
				? { ext: 'mp3', mime: 'audio/mpeg' }
				: (await e.ignore(r), this.fromTokenizer(e));
		}
		if (this.checkString('MP+')) return { ext: 'mpc', mime: 'audio/x-musepack' };
		if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 }))
			return { ext: 'swf', mime: 'application/x-shockwave-flash' };
		if (this.check([255, 216, 255]))
			return this.check([247], { offset: 3 })
				? { ext: 'jls', mime: 'image/jls' }
				: { ext: 'jpg', mime: 'image/jpeg' };
		if (this.check([79, 98, 106, 1])) return { ext: 'avro', mime: 'application/avro' };
		if (this.checkString('FLIF')) return { ext: 'flif', mime: 'image/flif' };
		if (this.checkString('8BPS')) return { ext: 'psd', mime: 'image/vnd.adobe.photoshop' };
		if (this.checkString('MPCK')) return { ext: 'mpc', mime: 'audio/x-musepack' };
		if (this.checkString('FORM')) return { ext: 'aif', mime: 'audio/aiff' };
		if (this.checkString('icns', { offset: 0 })) return { ext: 'icns', mime: 'image/icns' };
		if (this.check([80, 75, 3, 4])) {
			let r;
			return (
				await new hf(e).unzip((n) => {
					switch (n.filename) {
						case 'META-INF/mozilla.rsa':
							return ((r = { ext: 'xpi', mime: 'application/x-xpinstall' }), { stop: !0 });
						case 'META-INF/MANIFEST.MF':
							return ((r = { ext: 'jar', mime: 'application/java-archive' }), { stop: !0 });
						case 'mimetype':
							return {
								async handler(i) {
									const a = new TextDecoder('utf-8').decode(i).trim();
									r = Nn(a);
								},
								stop: !0
							};
						case '[Content_Types].xml':
							return {
								async handler(i) {
									let a = new TextDecoder('utf-8').decode(i);
									const s = a.indexOf('.main+xml"');
									if (s === -1) {
										const o = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
										a.includes(`ContentType="${o}"`) && (r = Nn(o));
									} else {
										a = a.slice(0, Math.max(0, s));
										const o = a.lastIndexOf('"'),
											c = a.slice(Math.max(0, o + 1));
										r = Nn(c);
									}
								},
								stop: !0
							};
						default:
							return /classes\d*\.dex/.test(n.filename)
								? ((r = { ext: 'apk', mime: 'application/vnd.android.package-archive' }),
									{ stop: !0 })
								: {};
					}
				}),
				r ?? { ext: 'zip', mime: 'application/zip' }
			);
		}
		if (this.checkString('OggS')) {
			await e.ignore(28);
			const r = new Uint8Array(8);
			return (
				await e.readBuffer(r),
				Et(r, [79, 112, 117, 115, 72, 101, 97, 100])
					? { ext: 'opus', mime: 'audio/ogg; codecs=opus' }
					: Et(r, [128, 116, 104, 101, 111, 114, 97])
						? { ext: 'ogv', mime: 'video/ogg' }
						: Et(r, [1, 118, 105, 100, 101, 111, 0])
							? { ext: 'ogm', mime: 'video/ogg' }
							: Et(r, [127, 70, 76, 65, 67])
								? { ext: 'oga', mime: 'audio/ogg' }
								: Et(r, [83, 112, 101, 101, 120, 32, 32])
									? { ext: 'spx', mime: 'audio/ogg' }
									: Et(r, [1, 118, 111, 114, 98, 105, 115])
										? { ext: 'ogg', mime: 'audio/ogg' }
										: { ext: 'ogx', mime: 'application/ogg' }
			);
		}
		if (
			this.check([80, 75]) &&
			(this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) &&
			(this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8)
		)
			return { ext: 'zip', mime: 'application/zip' };
		if (this.checkString('MThd')) return { ext: 'mid', mime: 'audio/midi' };
		if (
			this.checkString('wOFF') &&
			(this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString('OTTO', { offset: 4 }))
		)
			return { ext: 'woff', mime: 'font/woff' };
		if (
			this.checkString('wOF2') &&
			(this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString('OTTO', { offset: 4 }))
		)
			return { ext: 'woff2', mime: 'font/woff2' };
		if (this.check([212, 195, 178, 161]) || this.check([161, 178, 195, 212]))
			return { ext: 'pcap', mime: 'application/vnd.tcpdump.pcap' };
		if (this.checkString('DSD ')) return { ext: 'dsf', mime: 'audio/x-dsf' };
		if (this.checkString('LZIP')) return { ext: 'lz', mime: 'application/x-lzip' };
		if (this.checkString('fLaC')) return { ext: 'flac', mime: 'audio/flac' };
		if (this.check([66, 80, 71, 251])) return { ext: 'bpg', mime: 'image/bpg' };
		if (this.checkString('wvpk')) return { ext: 'wv', mime: 'audio/wavpack' };
		if (this.checkString('%PDF')) return { ext: 'pdf', mime: 'application/pdf' };
		if (this.check([0, 97, 115, 109])) return { ext: 'wasm', mime: 'application/wasm' };
		if (this.check([73, 73])) {
			const r = await this.readTiffHeader(!1);
			if (r) return r;
		}
		if (this.check([77, 77])) {
			const r = await this.readTiffHeader(!0);
			if (r) return r;
		}
		if (this.checkString('MAC ')) return { ext: 'ape', mime: 'audio/ape' };
		if (this.check([26, 69, 223, 163])) {
			async function r() {
				const o = await e.peekNumber(er);
				let c = 128,
					l = 0;
				for (; (o & c) === 0 && c !== 0; ) (++l, (c >>= 1));
				const d = new Uint8Array(l + 1);
				return (await e.readBuffer(d), d);
			}
			async function n() {
				const o = await r(),
					c = await r();
				c[0] ^= 128 >> (c.length - 1);
				const l = Math.min(6, c.length),
					d = new DataView(o.buffer),
					u = new DataView(c.buffer, c.length - l, l);
				return { id: ya(d), len: ya(u) };
			}
			async function i(o) {
				for (; o > 0; ) {
					const c = await n();
					if (c.id === 17026) return (await e.readToken(new Be(c.len))).replaceAll(/\00.*$/g, '');
					(await e.ignore(c.len), --o);
				}
			}
			const a = await n();
			switch (await i(a.len)) {
				case 'webm':
					return { ext: 'webm', mime: 'video/webm' };
				case 'matroska':
					return { ext: 'mkv', mime: 'video/matroska' };
				default:
					return;
			}
		}
		if (this.checkString('SQLi')) return { ext: 'sqlite', mime: 'application/x-sqlite3' };
		if (this.check([78, 69, 83, 26])) return { ext: 'nes', mime: 'application/x-nintendo-nes-rom' };
		if (this.checkString('Cr24'))
			return { ext: 'crx', mime: 'application/x-google-chrome-extension' };
		if (this.checkString('MSCF') || this.checkString('ISc('))
			return { ext: 'cab', mime: 'application/vnd.ms-cab-compressed' };
		if (this.check([237, 171, 238, 219])) return { ext: 'rpm', mime: 'application/x-rpm' };
		if (this.check([197, 208, 211, 198])) return { ext: 'eps', mime: 'application/eps' };
		if (this.check([40, 181, 47, 253])) return { ext: 'zst', mime: 'application/zstd' };
		if (this.check([127, 69, 76, 70])) return { ext: 'elf', mime: 'application/x-elf' };
		if (this.check([33, 66, 68, 78])) return { ext: 'pst', mime: 'application/vnd.ms-outlook' };
		if (this.checkString('PAR1') || this.checkString('PARE'))
			return { ext: 'parquet', mime: 'application/vnd.apache.parquet' };
		if (this.checkString('ttcf')) return { ext: 'ttc', mime: 'font/collection' };
		if (this.check([207, 250, 237, 254]))
			return { ext: 'macho', mime: 'application/x-mach-binary' };
		if (this.check([4, 34, 77, 24])) return { ext: 'lz4', mime: 'application/x-lz4' };
		if (this.check([79, 84, 84, 79, 0])) return { ext: 'otf', mime: 'font/otf' };
		if (this.checkString('#!AMR')) return { ext: 'amr', mime: 'audio/amr' };
		if (this.checkString('{\\rtf')) return { ext: 'rtf', mime: 'application/rtf' };
		if (this.check([70, 76, 86, 1])) return { ext: 'flv', mime: 'video/x-flv' };
		if (this.checkString('IMPM')) return { ext: 'it', mime: 'audio/x-it' };
		if (
			this.checkString('-lh0-', { offset: 2 }) ||
			this.checkString('-lh1-', { offset: 2 }) ||
			this.checkString('-lh2-', { offset: 2 }) ||
			this.checkString('-lh3-', { offset: 2 }) ||
			this.checkString('-lh4-', { offset: 2 }) ||
			this.checkString('-lh5-', { offset: 2 }) ||
			this.checkString('-lh6-', { offset: 2 }) ||
			this.checkString('-lh7-', { offset: 2 }) ||
			this.checkString('-lzs-', { offset: 2 }) ||
			this.checkString('-lz4-', { offset: 2 }) ||
			this.checkString('-lz5-', { offset: 2 }) ||
			this.checkString('-lhd-', { offset: 2 })
		)
			return { ext: 'lzh', mime: 'application/x-lzh-compressed' };
		if (this.check([0, 0, 1, 186])) {
			if (this.check([33], { offset: 4, mask: [241] })) return { ext: 'mpg', mime: 'video/MP1S' };
			if (this.check([68], { offset: 4, mask: [196] })) return { ext: 'mpg', mime: 'video/MP2P' };
		}
		if (this.checkString('ITSF')) return { ext: 'chm', mime: 'application/vnd.ms-htmlhelp' };
		if (this.check([202, 254, 186, 190])) return { ext: 'class', mime: 'application/java-vm' };
		if (this.checkString('.RMF')) return { ext: 'rm', mime: 'application/vnd.rn-realmedia' };
		if (this.checkString('DRACO')) return { ext: 'drc', mime: 'application/vnd.google.draco' };
		if (this.check([253, 55, 122, 88, 90, 0])) return { ext: 'xz', mime: 'application/x-xz' };
		if (this.checkString('<?xml ')) return { ext: 'xml', mime: 'application/xml' };
		if (this.check([55, 122, 188, 175, 39, 28]))
			return { ext: '7z', mime: 'application/x-7z-compressed' };
		if (this.check([82, 97, 114, 33, 26, 7]) && (this.buffer[6] === 0 || this.buffer[6] === 1))
			return { ext: 'rar', mime: 'application/x-rar-compressed' };
		if (this.checkString('solid ')) return { ext: 'stl', mime: 'model/stl' };
		if (this.checkString('AC')) {
			const r = new Be(4, 'latin1').get(this.buffer, 2);
			if (r.match('^d*') && r >= 1e3 && r <= 1050) return { ext: 'dwg', mime: 'image/vnd.dwg' };
		}
		if (this.checkString('070707')) return { ext: 'cpio', mime: 'application/x-cpio' };
		if (this.checkString('BLENDER')) return { ext: 'blend', mime: 'application/x-blender' };
		if (this.checkString('!<arch>'))
			return (
				await e.ignore(8),
				(await e.readToken(new Be(13, 'ascii'))) === 'debian-binary'
					? { ext: 'deb', mime: 'application/x-deb' }
					: { ext: 'ar', mime: 'application/x-unix-archive' }
			);
		if (
			this.checkString('WEBVTT') &&
			[
				`
`,
				'\r',
				'	',
				' ',
				'\0'
			].some((r) => this.checkString(r, { offset: 6 }))
		)
			return { ext: 'vtt', mime: 'text/vtt' };
		if (this.check([137, 80, 78, 71, 13, 10, 26, 10])) {
			await e.ignore(8);
			async function r() {
				return { length: await e.readToken(Ws), type: await e.readToken(new Be(4, 'latin1')) };
			}
			do {
				const n = await r();
				if (n.length < 0) return;
				switch (n.type) {
					case 'IDAT':
						return { ext: 'png', mime: 'image/png' };
					case 'acTL':
						return { ext: 'apng', mime: 'image/apng' };
					default:
						await e.ignore(n.length + 4);
				}
			} while (e.position + 8 < e.fileInfo.size);
			return { ext: 'png', mime: 'image/png' };
		}
		if (this.check([65, 82, 82, 79, 87, 49, 0, 0]))
			return { ext: 'arrow', mime: 'application/vnd.apache.arrow.file' };
		if (this.check([103, 108, 84, 70, 2, 0, 0, 0]))
			return { ext: 'glb', mime: 'model/gltf-binary' };
		if (
			this.check([102, 114, 101, 101], { offset: 4 }) ||
			this.check([109, 100, 97, 116], { offset: 4 }) ||
			this.check([109, 111, 111, 118], { offset: 4 }) ||
			this.check([119, 105, 100, 101], { offset: 4 })
		)
			return { ext: 'mov', mime: 'video/quicktime' };
		if (this.check([73, 73, 82, 79, 8, 0, 0, 0, 24]))
			return { ext: 'orf', mime: 'image/x-olympus-orf' };
		if (this.checkString('gimp xcf ')) return { ext: 'xcf', mime: 'image/x-xcf' };
		if (this.checkString('ftyp', { offset: 4 }) && (this.buffer[8] & 96) !== 0) {
			const r = new Be(4, 'latin1').get(this.buffer, 8).replace('\0', ' ').trim();
			switch (r) {
				case 'avif':
				case 'avis':
					return { ext: 'avif', mime: 'image/avif' };
				case 'mif1':
					return { ext: 'heic', mime: 'image/heif' };
				case 'msf1':
					return { ext: 'heic', mime: 'image/heif-sequence' };
				case 'heic':
				case 'heix':
					return { ext: 'heic', mime: 'image/heic' };
				case 'hevc':
				case 'hevx':
					return { ext: 'heic', mime: 'image/heic-sequence' };
				case 'qt':
					return { ext: 'mov', mime: 'video/quicktime' };
				case 'M4V':
				case 'M4VH':
				case 'M4VP':
					return { ext: 'm4v', mime: 'video/x-m4v' };
				case 'M4P':
					return { ext: 'm4p', mime: 'video/mp4' };
				case 'M4B':
					return { ext: 'm4b', mime: 'audio/mp4' };
				case 'M4A':
					return { ext: 'm4a', mime: 'audio/x-m4a' };
				case 'F4V':
					return { ext: 'f4v', mime: 'video/mp4' };
				case 'F4P':
					return { ext: 'f4p', mime: 'video/mp4' };
				case 'F4A':
					return { ext: 'f4a', mime: 'audio/mp4' };
				case 'F4B':
					return { ext: 'f4b', mime: 'audio/mp4' };
				case 'crx':
					return { ext: 'cr3', mime: 'image/x-canon-cr3' };
				default:
					return r.startsWith('3g')
						? r.startsWith('3g2')
							? { ext: '3g2', mime: 'video/3gpp2' }
							: { ext: '3gp', mime: 'video/3gpp' }
						: { ext: 'mp4', mime: 'video/mp4' };
			}
		}
		if (this.check([82, 73, 70, 70])) {
			if (this.checkString('WEBP', { offset: 8 })) return { ext: 'webp', mime: 'image/webp' };
			if (this.check([65, 86, 73], { offset: 8 })) return { ext: 'avi', mime: 'video/vnd.avi' };
			if (this.check([87, 65, 86, 69], { offset: 8 })) return { ext: 'wav', mime: 'audio/wav' };
			if (this.check([81, 76, 67, 77], { offset: 8 })) return { ext: 'qcp', mime: 'audio/qcelp' };
		}
		if (this.check([73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216]))
			return { ext: 'rw2', mime: 'image/x-panasonic-rw2' };
		if (this.check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
			async function r() {
				const n = new Uint8Array(16);
				return (await e.readBuffer(n), { id: n, size: Number(await e.readToken(Ks)) });
			}
			for (await e.ignore(30); e.position + 24 < e.fileInfo.size; ) {
				const n = await r();
				let i = n.size - 24;
				if (Et(n.id, [145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101])) {
					const a = new Uint8Array(16);
					if (
						((i -= await e.readBuffer(a)),
						Et(a, [64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
					)
						return { ext: 'asf', mime: 'audio/x-ms-asf' };
					if (Et(a, [192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
						return { ext: 'asf', mime: 'video/x-ms-asf' };
					break;
				}
				await e.ignore(i);
			}
			return { ext: 'asf', mime: 'application/vnd.ms-asf' };
		}
		if (this.check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]))
			return { ext: 'ktx', mime: 'image/ktx' };
		if (
			(this.check([126, 16, 4]) || this.check([126, 24, 4])) &&
			this.check([48, 77, 73, 69], { offset: 4 })
		)
			return { ext: 'mie', mime: 'application/x-mie' };
		if (this.check([39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { offset: 2 }))
			return { ext: 'shp', mime: 'application/x-esri-shape' };
		if (this.check([255, 79, 255, 81])) return { ext: 'j2c', mime: 'image/j2c' };
		if (this.check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10]))
			switch ((await e.ignore(20), await e.readToken(new Be(4, 'ascii')))) {
				case 'jp2 ':
					return { ext: 'jp2', mime: 'image/jp2' };
				case 'jpx ':
					return { ext: 'jpx', mime: 'image/jpx' };
				case 'jpm ':
					return { ext: 'jpm', mime: 'image/jpm' };
				case 'mjp2':
					return { ext: 'mj2', mime: 'image/mj2' };
				default:
					return;
			}
		if (this.check([255, 10]) || this.check([0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10]))
			return { ext: 'jxl', mime: 'image/jxl' };
		if (this.check([254, 255]))
			return this.check([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], { offset: 2 })
				? { ext: 'xml', mime: 'application/xml' }
				: void 0;
		if (this.check([208, 207, 17, 224, 161, 177, 26, 225]))
			return { ext: 'cfb', mime: 'application/x-cfb' };
		if (
			(await e.peekBuffer(this.buffer, { length: Math.min(256, e.fileInfo.size), mayBeLess: !0 }),
			this.check([97, 99, 115, 112], { offset: 36 }))
		)
			return { ext: 'icc', mime: 'application/vnd.iccprofile' };
		if (this.checkString('**ACE', { offset: 7 }) && this.checkString('**', { offset: 12 }))
			return { ext: 'ace', mime: 'application/x-ace-compressed' };
		if (this.checkString('BEGIN:')) {
			if (this.checkString('VCARD', { offset: 6 })) return { ext: 'vcf', mime: 'text/vcard' };
			if (this.checkString('VCALENDAR', { offset: 6 }))
				return { ext: 'ics', mime: 'text/calendar' };
		}
		if (this.checkString('FUJIFILMCCD-RAW')) return { ext: 'raf', mime: 'image/x-fujifilm-raf' };
		if (this.checkString('Extended Module:')) return { ext: 'xm', mime: 'audio/x-xm' };
		if (this.checkString('Creative Voice File')) return { ext: 'voc', mime: 'audio/x-voc' };
		if (this.check([4, 0, 0, 0]) && this.buffer.length >= 16) {
			const r = new DataView(this.buffer.buffer).getUint32(12, !0);
			if (r > 12 && this.buffer.length >= r + 16)
				try {
					const n = new TextDecoder().decode(this.buffer.subarray(16, r + 16));
					if (JSON.parse(n).files) return { ext: 'asar', mime: 'application/x-asar' };
				} catch {}
		}
		if (this.check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2]))
			return { ext: 'mxf', mime: 'application/mxf' };
		if (this.checkString('SCRM', { offset: 44 })) return { ext: 's3m', mime: 'audio/x-s3m' };
		if (this.check([71]) && this.check([71], { offset: 188 }))
			return { ext: 'mts', mime: 'video/mp2t' };
		if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 }))
			return { ext: 'mts', mime: 'video/mp2t' };
		if (this.check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 }))
			return { ext: 'mobi', mime: 'application/x-mobipocket-ebook' };
		if (this.check([68, 73, 67, 77], { offset: 128 }))
			return { ext: 'dcm', mime: 'application/dicom' };
		if (this.check([76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]))
			return { ext: 'lnk', mime: 'application/x.ms.shortcut' };
		if (this.check([98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0]))
			return { ext: 'alias', mime: 'application/x.apple.alias' };
		if (this.checkString('Kaydara FBX Binary  \0'))
			return { ext: 'fbx', mime: 'application/x.autodesk.fbx' };
		if (
			this.check([76, 80], { offset: 34 }) &&
			(this.check([0, 0, 1], { offset: 8 }) ||
				this.check([1, 0, 2], { offset: 8 }) ||
				this.check([2, 0, 2], { offset: 8 }))
		)
			return { ext: 'eot', mime: 'application/vnd.ms-fontobject' };
		if (this.check([6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29]))
			return { ext: 'indd', mime: 'application/x-indesign' };
		if (
			(await e.peekBuffer(this.buffer, { length: Math.min(512, e.fileInfo.size), mayBeLess: !0 }),
			(this.checkString('ustar', { offset: 257 }) &&
				(this.checkString('\0', { offset: 262 }) || this.checkString(' ', { offset: 262 }))) ||
				(this.check([0, 0, 0, 0, 0, 0], { offset: 257 }) && If(this.buffer)))
		)
			return { ext: 'tar', mime: 'application/x-tar' };
		if (this.check([255, 254]))
			return this.check([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], { offset: 2 })
				? { ext: 'xml', mime: 'application/xml' }
				: this.check(
							[
								255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0,
								111, 0, 100, 0, 101, 0, 108, 0
							],
							{ offset: 2 }
					  )
					? { ext: 'skp', mime: 'application/vnd.sketchup.skp' }
					: void 0;
		if (this.checkString('-----BEGIN PGP MESSAGE-----'))
			return { ext: 'pgp', mime: 'application/pgp-encrypted' };
	};
	detectImprecise = async (e) => {
		if (
			((this.buffer = new Uint8Array(Rn)),
			await e.peekBuffer(this.buffer, { length: Math.min(8, e.fileInfo.size), mayBeLess: !0 }),
			this.check([0, 0, 1, 186]) || this.check([0, 0, 1, 179]))
		)
			return { ext: 'mpg', mime: 'video/mpeg' };
		if (this.check([0, 1, 0, 0, 0])) return { ext: 'ttf', mime: 'font/ttf' };
		if (this.check([0, 0, 1, 0])) return { ext: 'ico', mime: 'image/x-icon' };
		if (this.check([0, 0, 2, 0])) return { ext: 'cur', mime: 'image/x-icon' };
		if (
			(await e.peekBuffer(this.buffer, {
				length: Math.min(2 + this.options.mpegOffsetTolerance, e.fileInfo.size),
				mayBeLess: !0
			}),
			this.buffer.length >= 2 + this.options.mpegOffsetTolerance)
		)
			for (let r = 0; r <= this.options.mpegOffsetTolerance; ++r) {
				const n = this.scanMpeg(r);
				if (n) return n;
			}
	};
	async readTiffTag(e) {
		const r = await this.tokenizer.readToken(e ? Jt : Me);
		switch ((this.tokenizer.ignore(10), r)) {
			case 50341:
				return { ext: 'arw', mime: 'image/x-sony-arw' };
			case 50706:
				return { ext: 'dng', mime: 'image/x-adobe-dng' };
		}
	}
	async readTiffIFD(e) {
		const r = await this.tokenizer.readToken(e ? Jt : Me);
		for (let n = 0; n < r; ++n) {
			const i = await this.readTiffTag(e);
			if (i) return i;
		}
	}
	async readTiffHeader(e) {
		const r = (e ? Jt : Me).get(this.buffer, 2),
			n = (e ? tn : Ae).get(this.buffer, 4);
		if (r === 42) {
			if (n >= 6) {
				if (this.checkString('CR', { offset: 8 })) return { ext: 'cr2', mime: 'image/x-canon-cr2' };
				if (n >= 8) {
					const a = (e ? Jt : Me).get(this.buffer, 8),
						s = (e ? Jt : Me).get(this.buffer, 10);
					if ((a === 28 && s === 254) || (a === 31 && s === 11))
						return { ext: 'nef', mime: 'image/x-nikon-nef' };
				}
			}
			return (
				await this.tokenizer.ignore(n),
				(await this.readTiffIFD(e)) ?? { ext: 'tif', mime: 'image/tiff' }
			);
		}
		if (r === 43) return { ext: 'tif', mime: 'image/tiff' };
	}
	scanMpeg(e) {
		if (this.check([255, 224], { offset: e, mask: [255, 224] })) {
			if (this.check([16], { offset: e + 1, mask: [22] }))
				return this.check([8], { offset: e + 1, mask: [8] })
					? { ext: 'aac', mime: 'audio/aac' }
					: { ext: 'aac', mime: 'audio/aac' };
			if (this.check([2], { offset: e + 1, mask: [6] })) return { ext: 'mp3', mime: 'audio/mpeg' };
			if (this.check([4], { offset: e + 1, mask: [6] })) return { ext: 'mp2', mime: 'audio/mpeg' };
			if (this.check([6], { offset: e + 1, mask: [6] })) return { ext: 'mp1', mime: 'audio/mpeg' };
		}
	}
}
new Set(Mf);
new Set(Of);
var jr = {};
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */ var ba;
function Df() {
	if (ba) return jr;
	ba = 1;
	var t =
			/; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g,
		e = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/,
		r = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/,
		n = /\\([\u000b\u0020-\u00ff])/g,
		i = /([\\"])/g,
		a = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
	((jr.format = s), (jr.parse = o));
	function s(u) {
		if (!u || typeof u != 'object') throw new TypeError('argument obj is required');
		var f = u.parameters,
			h = u.type;
		if (!h || !a.test(h)) throw new TypeError('invalid type');
		var g = h;
		if (f && typeof f == 'object')
			for (var w, v = Object.keys(f).sort(), y = 0; y < v.length; y++) {
				if (((w = v[y]), !r.test(w))) throw new TypeError('invalid parameter name');
				g += '; ' + w + '=' + l(f[w]);
			}
		return g;
	}
	function o(u) {
		if (!u) throw new TypeError('argument string is required');
		var f = typeof u == 'object' ? c(u) : u;
		if (typeof f != 'string') throw new TypeError('argument string is required to be a string');
		var h = f.indexOf(';'),
			g = h !== -1 ? f.slice(0, h).trim() : f.trim();
		if (!a.test(g)) throw new TypeError('invalid media type');
		var w = new d(g.toLowerCase());
		if (h !== -1) {
			var v, y, k;
			for (t.lastIndex = h; (y = t.exec(f)); ) {
				if (y.index !== h) throw new TypeError('invalid parameter format');
				((h += y[0].length),
					(v = y[1].toLowerCase()),
					(k = y[2]),
					k.charCodeAt(0) === 34 &&
						((k = k.slice(1, -1)), k.indexOf('\\') !== -1 && (k = k.replace(n, '$1'))),
					(w.parameters[v] = k));
			}
			if (h !== f.length) throw new TypeError('invalid parameter format');
		}
		return w;
	}
	function c(u) {
		var f;
		if (
			(typeof u.getHeader == 'function'
				? (f = u.getHeader('content-type'))
				: typeof u.headers == 'object' && (f = u.headers && u.headers['content-type']),
			typeof f != 'string')
		)
			throw new TypeError('content-type header is missing from object');
		return f;
	}
	function l(u) {
		var f = String(u);
		if (r.test(f)) return f;
		if (f.length > 0 && !e.test(f)) throw new TypeError('invalid parameter value');
		return '"' + f.replace(i, '\\$1') + '"';
	}
	function d(u) {
		((this.parameters = Object.create(null)), (this.type = u));
	}
	return jr;
}
var Rf = Df();
const Nf = ai(Rf);
var yr = {};
/*!
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */ var wa;
function Bf() {
	if (wa) return yr;
	wa = 1;
	var t = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/,
		e = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/,
		r = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
	((yr.format = n), (yr.parse = a), (yr.test = i));
	function n(o) {
		if (!o || typeof o != 'object') throw new TypeError('argument obj is required');
		var c = o.subtype,
			l = o.suffix,
			d = o.type;
		if (!d || !e.test(d)) throw new TypeError('invalid type');
		if (!c || !t.test(c)) throw new TypeError('invalid subtype');
		var u = d + '/' + c;
		if (l) {
			if (!e.test(l)) throw new TypeError('invalid suffix');
			u += '+' + l;
		}
		return u;
	}
	function i(o) {
		if (!o) throw new TypeError('argument string is required');
		if (typeof o != 'string') throw new TypeError('argument string is required to be a string');
		return r.test(o.toLowerCase());
	}
	function a(o) {
		if (!o) throw new TypeError('argument string is required');
		if (typeof o != 'string') throw new TypeError('argument string is required to be a string');
		var c = r.exec(o.toLowerCase());
		if (!c) throw new TypeError('invalid media type');
		var l = c[1],
			d = c[2],
			u,
			f = d.lastIndexOf('+');
		return (f !== -1 && ((u = d.substr(f + 1)), (d = d.substr(0, f))), new s(l, d, u));
	}
	function s(o, c, l) {
		((this.type = o), (this.subtype = c), (this.suffix = l));
	}
	return yr;
}
var zf = Bf();
const Ug = {
		10: 'shot',
		20: 'scene',
		30: 'track',
		40: 'part',
		50: 'album',
		60: 'edition',
		70: 'collection'
	},
	Nt = { video: 1, audio: 2, complex: 3, logo: 4, subtitle: 17, button: 18, control: 32 },
	Lf = {
		[Nt.video]: 'video',
		[Nt.audio]: 'audio',
		[Nt.complex]: 'complex',
		[Nt.logo]: 'logo',
		[Nt.subtitle]: 'subtitle',
		[Nt.button]: 'button',
		[Nt.control]: 'control'
	},
	Mr = (t) =>
		class extends Error {
			constructor(r) {
				(super(r), (this.name = t));
			}
		};
class $f extends Mr('CouldNotDetermineFileTypeError') {}
class Uf extends Mr('UnsupportedFileTypeError') {}
class jf extends Mr('UnexpectedFileContentError') {
	constructor(e, r) {
		(super(r), (this.fileType = e));
	}
	toString() {
		return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
	}
}
class Ni extends Mr('FieldDecodingError') {}
class co extends Mr('InternalParserError') {}
const Vf = (t) =>
	class extends jf {
		constructor(e) {
			super(t, e);
		}
	};
function Ar(t, e, r) {
	return (t[e] & (1 << r)) !== 0;
}
function _a(t, e, r, n) {
	let i = e;
	if (n === 'utf-16le') {
		for (; t[i] !== 0 || t[i + 1] !== 0; ) {
			if (i >= r) return r;
			i += 2;
		}
		return i;
	}
	for (; t[i] !== 0; ) {
		if (i >= r) return r;
		i++;
	}
	return i;
}
function Xf(t) {
	const e = t.indexOf('\0');
	return e === -1 ? t : t.substr(0, e);
}
function Gf(t) {
	const e = t.length;
	if ((e & 1) !== 0) throw new Ni('Buffer length must be even');
	for (let r = 0; r < e; r += 2) {
		const n = t[r];
		((t[r] = t[r + 1]), (t[r + 1] = n));
	}
	return t;
}
function ei(t, e) {
	if (t[0] === 255 && t[1] === 254) return ei(t.subarray(2), e);
	if (e === 'utf-16le' && t[0] === 254 && t[1] === 255) {
		if ((t.length & 1) !== 0)
			throw new Ni('Expected even number of octets for 16-bit unicode string');
		return ei(Gf(t), e);
	}
	return new Be(t.length, e).get(t, 0);
}
function Vg(t) {
	return ((t = t.replace(/^\x00+/g, '')), (t = t.replace(/\x00+$/g, '')), t);
}
function uo(t, e, r, n) {
	const i = e + ~~(r / 8),
		a = r % 8;
	let s = t[i];
	s &= 255 >> a;
	const o = 8 - a,
		c = n - o;
	return (c < 0 ? (s >>= 8 - a - n) : c > 0 && ((s <<= c), (s |= uo(t, e, r + o, c))), s);
}
function Xg(t, e, r) {
	return uo(t, e, r, 1) === 1;
}
function Hf(t) {
	const e = [];
	for (let r = 0, n = t.length; r < n; r++) {
		const i = Number(t.charCodeAt(r)).toString(16);
		e.push(i.length === 1 ? `0${i}` : i);
	}
	return e.join(' ');
}
function qf(t) {
	return 10 * Math.log10(t);
}
function Wf(t) {
	return 10 ** (t / 10);
}
function Kf(t) {
	const e = t.split(' ').map((r) => r.trim().toLowerCase());
	if (e.length >= 1) {
		const r = Number.parseFloat(e[0]);
		return e.length === 2 && e[1] === 'db' ? { dB: r, ratio: Wf(r) } : { dB: qf(r), ratio: r };
	}
}
const Gg = {
		0: 'Other',
		1: "32x32 pixels 'file icon' (PNG only)",
		2: 'Other file icon',
		3: 'Cover (front)',
		4: 'Cover (back)',
		5: 'Leaflet page',
		6: 'Media (e.g. label side of CD)',
		7: 'Lead artist/lead performer/soloist',
		8: 'Artist/performer',
		9: 'Conductor',
		10: 'Band/Orchestra',
		11: 'Composer',
		12: 'Lyricist/text writer',
		13: 'Recording Location',
		14: 'During recording',
		15: 'During performance',
		16: 'Movie/video screen capture',
		17: 'A bright coloured fish',
		18: 'Illustration',
		19: 'Band/artist logotype',
		20: 'Publisher/Studio logotype'
	},
	Yf = { lyrics: 1 },
	Zf = { milliseconds: 2 },
	Jf = {
		get: (t, e) => (t[e + 3] & 127) | (t[e + 2] << 7) | (t[e + 1] << 14) | (t[e] << 21),
		len: 4
	},
	Hg = {
		len: 10,
		get: (t, e) => ({
			fileIdentifier: new Be(3, 'ascii').get(t, e),
			version: { major: Jn.get(t, e + 3), revision: Jn.get(t, e + 4) },
			flags: {
				unsynchronisation: Ar(t, e + 5, 7),
				isExtendedHeader: Ar(t, e + 5, 6),
				expIndicator: Ar(t, e + 5, 5),
				footer: Ar(t, e + 5, 4)
			},
			size: Jf.get(t, e + 6)
		})
	},
	qg = {
		len: 10,
		get: (t, e) => ({
			size: tn.get(t, e),
			extendedFlags: Jt.get(t, e + 4),
			sizeOfPadding: tn.get(t, e + 6),
			crcDataPresent: Ar(t, e + 4, 31)
		})
	},
	Qf = {
		len: 1,
		get: (t, e) => {
			switch (t[e]) {
				case 0:
					return { encoding: 'latin1' };
				case 1:
					return { encoding: 'utf-16le', bom: !0 };
				case 2:
					return { encoding: 'utf-16le', bom: !1 };
				case 3:
					return { encoding: 'utf8', bom: !1 };
				default:
					return { encoding: 'utf8', bom: !1 };
			}
		}
	},
	ep = {
		len: 4,
		get: (t, e) => ({ encoding: Qf.get(t, e), language: new Be(3, 'latin1').get(t, e + 1) })
	},
	Wg = {
		len: 6,
		get: (t, e) => {
			const r = ep.get(t, e);
			return {
				encoding: r.encoding,
				language: r.language,
				timeStampFormat: er.get(t, e + 4),
				contentType: er.get(t, e + 5)
			};
		}
	},
	Y = { multiple: !1 },
	rn = {
		year: Y,
		track: Y,
		disk: Y,
		title: Y,
		artist: Y,
		artists: { multiple: !0, unique: !0 },
		albumartist: Y,
		album: Y,
		date: Y,
		originaldate: Y,
		originalyear: Y,
		releasedate: Y,
		comment: { multiple: !0, unique: !1 },
		genre: { multiple: !0, unique: !0 },
		picture: { multiple: !0, unique: !0 },
		composer: { multiple: !0, unique: !0 },
		lyrics: { multiple: !0, unique: !1 },
		albumsort: { multiple: !1, unique: !0 },
		titlesort: { multiple: !1, unique: !0 },
		work: { multiple: !1, unique: !0 },
		artistsort: { multiple: !1, unique: !0 },
		albumartistsort: { multiple: !1, unique: !0 },
		composersort: { multiple: !1, unique: !0 },
		lyricist: { multiple: !0, unique: !0 },
		writer: { multiple: !0, unique: !0 },
		conductor: { multiple: !0, unique: !0 },
		remixer: { multiple: !0, unique: !0 },
		arranger: { multiple: !0, unique: !0 },
		engineer: { multiple: !0, unique: !0 },
		producer: { multiple: !0, unique: !0 },
		technician: { multiple: !0, unique: !0 },
		djmixer: { multiple: !0, unique: !0 },
		mixer: { multiple: !0, unique: !0 },
		label: { multiple: !0, unique: !0 },
		grouping: Y,
		subtitle: { multiple: !0 },
		discsubtitle: Y,
		totaltracks: Y,
		totaldiscs: Y,
		compilation: Y,
		rating: { multiple: !0 },
		bpm: Y,
		mood: Y,
		media: Y,
		catalognumber: { multiple: !0, unique: !0 },
		tvShow: Y,
		tvShowSort: Y,
		tvSeason: Y,
		tvEpisode: Y,
		tvEpisodeId: Y,
		tvNetwork: Y,
		podcast: Y,
		podcasturl: Y,
		releasestatus: Y,
		releasetype: { multiple: !0 },
		releasecountry: Y,
		script: Y,
		language: Y,
		copyright: Y,
		license: Y,
		encodedby: Y,
		encodersettings: Y,
		gapless: Y,
		barcode: Y,
		isrc: { multiple: !0 },
		asin: Y,
		musicbrainz_recordingid: Y,
		musicbrainz_trackid: Y,
		musicbrainz_albumid: Y,
		musicbrainz_artistid: { multiple: !0 },
		musicbrainz_albumartistid: { multiple: !0 },
		musicbrainz_releasegroupid: Y,
		musicbrainz_workid: Y,
		musicbrainz_trmid: Y,
		musicbrainz_discid: Y,
		acoustid_id: Y,
		acoustid_fingerprint: Y,
		musicip_puid: Y,
		musicip_fingerprint: Y,
		website: Y,
		'performer:instrument': { multiple: !0, unique: !0 },
		averageLevel: Y,
		peakLevel: Y,
		notes: { multiple: !0, unique: !1 },
		key: Y,
		originalalbum: Y,
		originalartist: Y,
		discogs_artist_id: { multiple: !0, unique: !0 },
		discogs_release_id: Y,
		discogs_label_id: Y,
		discogs_master_release_id: Y,
		discogs_votes: Y,
		discogs_rating: Y,
		replaygain_track_peak: Y,
		replaygain_track_gain: Y,
		replaygain_album_peak: Y,
		replaygain_album_gain: Y,
		replaygain_track_minmax: Y,
		replaygain_album_minmax: Y,
		replaygain_undo: Y,
		description: { multiple: !0 },
		longDescription: Y,
		category: { multiple: !0 },
		hdVideo: Y,
		keywords: { multiple: !0 },
		movement: Y,
		movementIndex: Y,
		movementTotal: Y,
		podcastId: Y,
		showMovement: Y,
		stik: Y
	};
function tp(t) {
	return rn[t] && !rn[t].multiple;
}
function rp(t) {
	return !rn[t].multiple || rn[t].unique || !1;
}
class yt {
	static toIntOrNull(e) {
		const r = Number.parseInt(e, 10);
		return Number.isNaN(r) ? null : r;
	}
	static normalizeTrack(e) {
		const r = e.toString().split('/');
		return { no: Number.parseInt(r[0], 10) || null, of: Number.parseInt(r[1], 10) || null };
	}
	constructor(e, r) {
		((this.tagTypes = e), (this.tagMap = r));
	}
	mapGenericTag(e, r) {
		((e = { id: e.id, value: e.value }), this.postMap(e, r));
		const n = this.getCommonName(e.id);
		return n ? { id: n, value: e.value } : null;
	}
	getCommonName(e) {
		return this.tagMap[e];
	}
	postMap(e, r) {}
}
yt.maxRatingScore = 1;
const np = {
	title: 'title',
	artist: 'artist',
	album: 'album',
	year: 'year',
	comment: 'comment',
	track: 'track',
	genre: 'genre'
};
class ip extends yt {
	constructor() {
		super(['ID3v1'], np);
	}
}
class Or extends yt {
	constructor(e, r) {
		const n = {};
		for (const i of Object.keys(r)) n[i.toUpperCase()] = r[i];
		super(e, n);
	}
	getCommonName(e) {
		return this.tagMap[e.toUpperCase()];
	}
}
const ap = {
	TIT2: 'title',
	TPE1: 'artist',
	'TXXX:Artists': 'artists',
	TPE2: 'albumartist',
	TALB: 'album',
	TDRV: 'date',
	TORY: 'originalyear',
	TPOS: 'disk',
	TCON: 'genre',
	APIC: 'picture',
	TCOM: 'composer',
	USLT: 'lyrics',
	TSOA: 'albumsort',
	TSOT: 'titlesort',
	TOAL: 'originalalbum',
	TSOP: 'artistsort',
	TSO2: 'albumartistsort',
	TSOC: 'composersort',
	TEXT: 'lyricist',
	'TXXX:Writer': 'writer',
	TPE3: 'conductor',
	TPE4: 'remixer',
	'IPLS:arranger': 'arranger',
	'IPLS:engineer': 'engineer',
	'IPLS:producer': 'producer',
	'IPLS:DJ-mix': 'djmixer',
	'IPLS:mix': 'mixer',
	TPUB: 'label',
	TIT1: 'grouping',
	TIT3: 'subtitle',
	TRCK: 'track',
	TCMP: 'compilation',
	POPM: 'rating',
	TBPM: 'bpm',
	TMED: 'media',
	'TXXX:CATALOGNUMBER': 'catalognumber',
	'TXXX:MusicBrainz Album Status': 'releasestatus',
	'TXXX:MusicBrainz Album Type': 'releasetype',
	'TXXX:MusicBrainz Album Release Country': 'releasecountry',
	'TXXX:RELEASECOUNTRY': 'releasecountry',
	'TXXX:SCRIPT': 'script',
	TLAN: 'language',
	TCOP: 'copyright',
	WCOP: 'license',
	TENC: 'encodedby',
	TSSE: 'encodersettings',
	'TXXX:BARCODE': 'barcode',
	'TXXX:ISRC': 'isrc',
	TSRC: 'isrc',
	'TXXX:ASIN': 'asin',
	'TXXX:originalyear': 'originalyear',
	'UFID:http://musicbrainz.org': 'musicbrainz_recordingid',
	'TXXX:MusicBrainz Release Track Id': 'musicbrainz_trackid',
	'TXXX:MusicBrainz Album Id': 'musicbrainz_albumid',
	'TXXX:MusicBrainz Artist Id': 'musicbrainz_artistid',
	'TXXX:MusicBrainz Album Artist Id': 'musicbrainz_albumartistid',
	'TXXX:MusicBrainz Release Group Id': 'musicbrainz_releasegroupid',
	'TXXX:MusicBrainz Work Id': 'musicbrainz_workid',
	'TXXX:MusicBrainz TRM Id': 'musicbrainz_trmid',
	'TXXX:MusicBrainz Disc Id': 'musicbrainz_discid',
	'TXXX:ACOUSTID_ID': 'acoustid_id',
	'TXXX:Acoustid Id': 'acoustid_id',
	'TXXX:Acoustid Fingerprint': 'acoustid_fingerprint',
	'TXXX:MusicIP PUID': 'musicip_puid',
	'TXXX:MusicMagic Fingerprint': 'musicip_fingerprint',
	WOAR: 'website',
	TDRC: 'date',
	TYER: 'year',
	TDOR: 'originaldate',
	'TIPL:arranger': 'arranger',
	'TIPL:engineer': 'engineer',
	'TIPL:producer': 'producer',
	'TIPL:DJ-mix': 'djmixer',
	'TIPL:mix': 'mixer',
	TMOO: 'mood',
	SYLT: 'lyrics',
	TSST: 'discsubtitle',
	TKEY: 'key',
	COMM: 'comment',
	TOPE: 'originalartist',
	'PRIV:AverageLevel': 'averageLevel',
	'PRIV:PeakLevel': 'peakLevel',
	'TXXX:DISCOGS_ARTIST_ID': 'discogs_artist_id',
	'TXXX:DISCOGS_ARTISTS': 'artists',
	'TXXX:DISCOGS_ARTIST_NAME': 'artists',
	'TXXX:DISCOGS_ALBUM_ARTISTS': 'albumartist',
	'TXXX:DISCOGS_CATALOG': 'catalognumber',
	'TXXX:DISCOGS_COUNTRY': 'releasecountry',
	'TXXX:DISCOGS_DATE': 'originaldate',
	'TXXX:DISCOGS_LABEL': 'label',
	'TXXX:DISCOGS_LABEL_ID': 'discogs_label_id',
	'TXXX:DISCOGS_MASTER_RELEASE_ID': 'discogs_master_release_id',
	'TXXX:DISCOGS_RATING': 'discogs_rating',
	'TXXX:DISCOGS_RELEASED': 'date',
	'TXXX:DISCOGS_RELEASE_ID': 'discogs_release_id',
	'TXXX:DISCOGS_VOTES': 'discogs_votes',
	'TXXX:CATALOGID': 'catalognumber',
	'TXXX:STYLE': 'genre',
	'TXXX:REPLAYGAIN_TRACK_PEAK': 'replaygain_track_peak',
	'TXXX:REPLAYGAIN_TRACK_GAIN': 'replaygain_track_gain',
	'TXXX:REPLAYGAIN_ALBUM_PEAK': 'replaygain_album_peak',
	'TXXX:REPLAYGAIN_ALBUM_GAIN': 'replaygain_album_gain',
	'TXXX:MP3GAIN_MINMAX': 'replaygain_track_minmax',
	'TXXX:MP3GAIN_ALBUM_MINMAX': 'replaygain_album_minmax',
	'TXXX:MP3GAIN_UNDO': 'replaygain_undo',
	MVNM: 'movement',
	MVIN: 'movementIndex',
	PCST: 'podcast',
	TCAT: 'category',
	TDES: 'description',
	TDRL: 'releasedate',
	TGID: 'podcastId',
	TKWD: 'keywords',
	WFED: 'podcasturl',
	GRP1: 'grouping'
};
class Bi extends Or {
	static toRating(e) {
		return {
			source: e.email,
			rating: e.rating > 0 ? ((e.rating - 1) / 254) * yt.maxRatingScore : void 0
		};
	}
	constructor() {
		super(['ID3v2.3', 'ID3v2.4'], ap);
	}
	postMap(e, r) {
		switch (e.id) {
			case 'UFID':
				{
					const n = e.value;
					n.owner_identifier === 'http://musicbrainz.org' &&
						((e.id += `:${n.owner_identifier}`), (e.value = ei(n.identifier, 'latin1')));
				}
				break;
			case 'PRIV':
				{
					const n = e.value;
					switch (n.owner_identifier) {
						case 'AverageLevel':
						case 'PeakValue':
							((e.id += `:${n.owner_identifier}`),
								(e.value = n.data.length === 4 ? Ae.get(n.data, 0) : null),
								e.value === null && r.addWarning('Failed to parse PRIV:PeakValue'));
							break;
						default:
							r.addWarning(`Unknown PRIV owner-identifier: ${n.data}`);
					}
				}
				break;
			case 'POPM':
				e.value = Bi.toRating(e.value);
				break;
		}
	}
}
const sp = {
	Title: 'title',
	Author: 'artist',
	'WM/AlbumArtist': 'albumartist',
	'WM/AlbumTitle': 'album',
	'WM/Year': 'date',
	'WM/OriginalReleaseTime': 'originaldate',
	'WM/OriginalReleaseYear': 'originalyear',
	Description: 'comment',
	'WM/TrackNumber': 'track',
	'WM/PartOfSet': 'disk',
	'WM/Genre': 'genre',
	'WM/Composer': 'composer',
	'WM/Lyrics': 'lyrics',
	'WM/AlbumSortOrder': 'albumsort',
	'WM/TitleSortOrder': 'titlesort',
	'WM/ArtistSortOrder': 'artistsort',
	'WM/AlbumArtistSortOrder': 'albumartistsort',
	'WM/ComposerSortOrder': 'composersort',
	'WM/Writer': 'lyricist',
	'WM/Conductor': 'conductor',
	'WM/ModifiedBy': 'remixer',
	'WM/Engineer': 'engineer',
	'WM/Producer': 'producer',
	'WM/DJMixer': 'djmixer',
	'WM/Mixer': 'mixer',
	'WM/Publisher': 'label',
	'WM/ContentGroupDescription': 'grouping',
	'WM/SubTitle': 'subtitle',
	'WM/SetSubTitle': 'discsubtitle',
	'WM/IsCompilation': 'compilation',
	'WM/SharedUserRating': 'rating',
	'WM/BeatsPerMinute': 'bpm',
	'WM/Mood': 'mood',
	'WM/Media': 'media',
	'WM/CatalogNo': 'catalognumber',
	'MusicBrainz/Album Status': 'releasestatus',
	'MusicBrainz/Album Type': 'releasetype',
	'MusicBrainz/Album Release Country': 'releasecountry',
	'WM/Script': 'script',
	'WM/Language': 'language',
	Copyright: 'copyright',
	LICENSE: 'license',
	'WM/EncodedBy': 'encodedby',
	'WM/EncodingSettings': 'encodersettings',
	'WM/Barcode': 'barcode',
	'WM/ISRC': 'isrc',
	'MusicBrainz/Track Id': 'musicbrainz_recordingid',
	'MusicBrainz/Release Track Id': 'musicbrainz_trackid',
	'MusicBrainz/Album Id': 'musicbrainz_albumid',
	'MusicBrainz/Artist Id': 'musicbrainz_artistid',
	'MusicBrainz/Album Artist Id': 'musicbrainz_albumartistid',
	'MusicBrainz/Release Group Id': 'musicbrainz_releasegroupid',
	'MusicBrainz/Work Id': 'musicbrainz_workid',
	'MusicBrainz/TRM Id': 'musicbrainz_trmid',
	'MusicBrainz/Disc Id': 'musicbrainz_discid',
	'Acoustid/Id': 'acoustid_id',
	'Acoustid/Fingerprint': 'acoustid_fingerprint',
	'MusicIP/PUID': 'musicip_puid',
	'WM/ARTISTS': 'artists',
	'WM/InitialKey': 'key',
	ASIN: 'asin',
	'WM/Work': 'work',
	'WM/AuthorURL': 'website',
	'WM/Picture': 'picture'
};
class zi extends yt {
	static toRating(e) {
		return { rating: Number.parseFloat(e + 1) / 5 };
	}
	constructor() {
		super(['asf'], sp);
	}
	postMap(e) {
		switch (e.id) {
			case 'WM/SharedUserRating': {
				const r = e.id.split(':');
				((e.value = zi.toRating(e.value)), (e.id = r[0]));
				break;
			}
		}
	}
}
const op = {
	TT2: 'title',
	TP1: 'artist',
	TP2: 'albumartist',
	TAL: 'album',
	TYE: 'year',
	COM: 'comment',
	TRK: 'track',
	TPA: 'disk',
	TCO: 'genre',
	PIC: 'picture',
	TCM: 'composer',
	TOR: 'originaldate',
	TOT: 'originalalbum',
	TXT: 'lyricist',
	TP3: 'conductor',
	TPB: 'label',
	TT1: 'grouping',
	TT3: 'subtitle',
	TLA: 'language',
	TCR: 'copyright',
	WCP: 'license',
	TEN: 'encodedby',
	TSS: 'encodersettings',
	WAR: 'website',
	PCS: 'podcast',
	TCP: 'compilation',
	TDR: 'date',
	TS2: 'albumartistsort',
	TSA: 'albumsort',
	TSC: 'composersort',
	TSP: 'artistsort',
	TST: 'titlesort',
	WFD: 'podcasturl',
	TBP: 'bpm'
};
class lp extends Or {
	constructor() {
		super(['ID3v2.2'], op);
	}
}
const cp = {
	Title: 'title',
	Artist: 'artist',
	Artists: 'artists',
	'Album Artist': 'albumartist',
	Album: 'album',
	Year: 'date',
	Originalyear: 'originalyear',
	Originaldate: 'originaldate',
	Releasedate: 'releasedate',
	Comment: 'comment',
	Track: 'track',
	Disc: 'disk',
	DISCNUMBER: 'disk',
	Genre: 'genre',
	'Cover Art (Front)': 'picture',
	'Cover Art (Back)': 'picture',
	Composer: 'composer',
	Lyrics: 'lyrics',
	ALBUMSORT: 'albumsort',
	TITLESORT: 'titlesort',
	WORK: 'work',
	ARTISTSORT: 'artistsort',
	ALBUMARTISTSORT: 'albumartistsort',
	COMPOSERSORT: 'composersort',
	Lyricist: 'lyricist',
	Writer: 'writer',
	Conductor: 'conductor',
	MixArtist: 'remixer',
	Arranger: 'arranger',
	Engineer: 'engineer',
	Producer: 'producer',
	DJMixer: 'djmixer',
	Mixer: 'mixer',
	Label: 'label',
	Grouping: 'grouping',
	Subtitle: 'subtitle',
	DiscSubtitle: 'discsubtitle',
	Compilation: 'compilation',
	BPM: 'bpm',
	Mood: 'mood',
	Media: 'media',
	CatalogNumber: 'catalognumber',
	MUSICBRAINZ_ALBUMSTATUS: 'releasestatus',
	MUSICBRAINZ_ALBUMTYPE: 'releasetype',
	RELEASECOUNTRY: 'releasecountry',
	Script: 'script',
	Language: 'language',
	Copyright: 'copyright',
	LICENSE: 'license',
	EncodedBy: 'encodedby',
	EncoderSettings: 'encodersettings',
	Barcode: 'barcode',
	ISRC: 'isrc',
	ASIN: 'asin',
	musicbrainz_trackid: 'musicbrainz_recordingid',
	musicbrainz_releasetrackid: 'musicbrainz_trackid',
	MUSICBRAINZ_ALBUMID: 'musicbrainz_albumid',
	MUSICBRAINZ_ARTISTID: 'musicbrainz_artistid',
	MUSICBRAINZ_ALBUMARTISTID: 'musicbrainz_albumartistid',
	MUSICBRAINZ_RELEASEGROUPID: 'musicbrainz_releasegroupid',
	MUSICBRAINZ_WORKID: 'musicbrainz_workid',
	MUSICBRAINZ_TRMID: 'musicbrainz_trmid',
	MUSICBRAINZ_DISCID: 'musicbrainz_discid',
	Acoustid_Id: 'acoustid_id',
	ACOUSTID_FINGERPRINT: 'acoustid_fingerprint',
	MUSICIP_PUID: 'musicip_puid',
	Weblink: 'website',
	REPLAYGAIN_TRACK_GAIN: 'replaygain_track_gain',
	REPLAYGAIN_TRACK_PEAK: 'replaygain_track_peak',
	MP3GAIN_MINMAX: 'replaygain_track_minmax',
	MP3GAIN_UNDO: 'replaygain_undo'
};
class up extends Or {
	constructor() {
		super(['APEv2'], cp);
	}
}
const dp = {
		'©nam': 'title',
		'©ART': 'artist',
		aART: 'albumartist',
		'----:com.apple.iTunes:Band': 'albumartist',
		'©alb': 'album',
		'©day': 'date',
		'©cmt': 'comment',
		'©com': 'comment',
		trkn: 'track',
		disk: 'disk',
		'©gen': 'genre',
		covr: 'picture',
		'©wrt': 'composer',
		'©lyr': 'lyrics',
		soal: 'albumsort',
		sonm: 'titlesort',
		soar: 'artistsort',
		soaa: 'albumartistsort',
		soco: 'composersort',
		'----:com.apple.iTunes:LYRICIST': 'lyricist',
		'----:com.apple.iTunes:CONDUCTOR': 'conductor',
		'----:com.apple.iTunes:REMIXER': 'remixer',
		'----:com.apple.iTunes:ENGINEER': 'engineer',
		'----:com.apple.iTunes:PRODUCER': 'producer',
		'----:com.apple.iTunes:DJMIXER': 'djmixer',
		'----:com.apple.iTunes:MIXER': 'mixer',
		'----:com.apple.iTunes:LABEL': 'label',
		'©grp': 'grouping',
		'----:com.apple.iTunes:SUBTITLE': 'subtitle',
		'----:com.apple.iTunes:DISCSUBTITLE': 'discsubtitle',
		cpil: 'compilation',
		tmpo: 'bpm',
		'----:com.apple.iTunes:MOOD': 'mood',
		'----:com.apple.iTunes:MEDIA': 'media',
		'----:com.apple.iTunes:CATALOGNUMBER': 'catalognumber',
		tvsh: 'tvShow',
		tvsn: 'tvSeason',
		tves: 'tvEpisode',
		sosn: 'tvShowSort',
		tven: 'tvEpisodeId',
		tvnn: 'tvNetwork',
		pcst: 'podcast',
		purl: 'podcasturl',
		'----:com.apple.iTunes:MusicBrainz Album Status': 'releasestatus',
		'----:com.apple.iTunes:MusicBrainz Album Type': 'releasetype',
		'----:com.apple.iTunes:MusicBrainz Album Release Country': 'releasecountry',
		'----:com.apple.iTunes:SCRIPT': 'script',
		'----:com.apple.iTunes:LANGUAGE': 'language',
		cprt: 'copyright',
		'©cpy': 'copyright',
		'----:com.apple.iTunes:LICENSE': 'license',
		'©too': 'encodedby',
		pgap: 'gapless',
		'----:com.apple.iTunes:BARCODE': 'barcode',
		'----:com.apple.iTunes:ISRC': 'isrc',
		'----:com.apple.iTunes:ASIN': 'asin',
		'----:com.apple.iTunes:NOTES': 'comment',
		'----:com.apple.iTunes:MusicBrainz Track Id': 'musicbrainz_recordingid',
		'----:com.apple.iTunes:MusicBrainz Release Track Id': 'musicbrainz_trackid',
		'----:com.apple.iTunes:MusicBrainz Album Id': 'musicbrainz_albumid',
		'----:com.apple.iTunes:MusicBrainz Artist Id': 'musicbrainz_artistid',
		'----:com.apple.iTunes:MusicBrainz Album Artist Id': 'musicbrainz_albumartistid',
		'----:com.apple.iTunes:MusicBrainz Release Group Id': 'musicbrainz_releasegroupid',
		'----:com.apple.iTunes:MusicBrainz Work Id': 'musicbrainz_workid',
		'----:com.apple.iTunes:MusicBrainz TRM Id': 'musicbrainz_trmid',
		'----:com.apple.iTunes:MusicBrainz Disc Id': 'musicbrainz_discid',
		'----:com.apple.iTunes:Acoustid Id': 'acoustid_id',
		'----:com.apple.iTunes:Acoustid Fingerprint': 'acoustid_fingerprint',
		'----:com.apple.iTunes:MusicIP PUID': 'musicip_puid',
		'----:com.apple.iTunes:fingerprint': 'musicip_fingerprint',
		'----:com.apple.iTunes:replaygain_track_gain': 'replaygain_track_gain',
		'----:com.apple.iTunes:replaygain_track_peak': 'replaygain_track_peak',
		'----:com.apple.iTunes:replaygain_album_gain': 'replaygain_album_gain',
		'----:com.apple.iTunes:replaygain_album_peak': 'replaygain_album_peak',
		'----:com.apple.iTunes:replaygain_track_minmax': 'replaygain_track_minmax',
		'----:com.apple.iTunes:replaygain_album_minmax': 'replaygain_album_minmax',
		'----:com.apple.iTunes:replaygain_undo': 'replaygain_undo',
		gnre: 'genre',
		'----:com.apple.iTunes:ALBUMARTISTSORT': 'albumartistsort',
		'----:com.apple.iTunes:ARTISTS': 'artists',
		'----:com.apple.iTunes:ORIGINALDATE': 'originaldate',
		'----:com.apple.iTunes:ORIGINALYEAR': 'originalyear',
		'----:com.apple.iTunes:RELEASEDATE': 'releasedate',
		desc: 'description',
		ldes: 'longDescription',
		'©mvn': 'movement',
		'©mvi': 'movementIndex',
		'©mvc': 'movementTotal',
		'©wrk': 'work',
		catg: 'category',
		egid: 'podcastId',
		hdvd: 'hdVideo',
		keyw: 'keywords',
		shwm: 'showMovement',
		stik: 'stik',
		rate: 'rating'
	},
	fp = 'iTunes';
class Ta extends Or {
	constructor() {
		super([fp], dp);
	}
	postMap(e, r) {
		switch (e.id) {
			case 'rate':
				e.value = { source: void 0, rating: Number.parseFloat(e.value) / 100 };
				break;
		}
	}
}
const pp = {
	TITLE: 'title',
	ARTIST: 'artist',
	ARTISTS: 'artists',
	ALBUMARTIST: 'albumartist',
	'ALBUM ARTIST': 'albumartist',
	ALBUM: 'album',
	DATE: 'date',
	ORIGINALDATE: 'originaldate',
	ORIGINALYEAR: 'originalyear',
	RELEASEDATE: 'releasedate',
	COMMENT: 'comment',
	TRACKNUMBER: 'track',
	DISCNUMBER: 'disk',
	GENRE: 'genre',
	METADATA_BLOCK_PICTURE: 'picture',
	COMPOSER: 'composer',
	LYRICS: 'lyrics',
	ALBUMSORT: 'albumsort',
	TITLESORT: 'titlesort',
	WORK: 'work',
	ARTISTSORT: 'artistsort',
	ALBUMARTISTSORT: 'albumartistsort',
	COMPOSERSORT: 'composersort',
	LYRICIST: 'lyricist',
	WRITER: 'writer',
	CONDUCTOR: 'conductor',
	REMIXER: 'remixer',
	ARRANGER: 'arranger',
	ENGINEER: 'engineer',
	PRODUCER: 'producer',
	DJMIXER: 'djmixer',
	MIXER: 'mixer',
	LABEL: 'label',
	GROUPING: 'grouping',
	SUBTITLE: 'subtitle',
	DISCSUBTITLE: 'discsubtitle',
	TRACKTOTAL: 'totaltracks',
	DISCTOTAL: 'totaldiscs',
	COMPILATION: 'compilation',
	RATING: 'rating',
	BPM: 'bpm',
	KEY: 'key',
	MOOD: 'mood',
	MEDIA: 'media',
	CATALOGNUMBER: 'catalognumber',
	RELEASESTATUS: 'releasestatus',
	RELEASETYPE: 'releasetype',
	RELEASECOUNTRY: 'releasecountry',
	SCRIPT: 'script',
	LANGUAGE: 'language',
	COPYRIGHT: 'copyright',
	LICENSE: 'license',
	ENCODEDBY: 'encodedby',
	ENCODERSETTINGS: 'encodersettings',
	BARCODE: 'barcode',
	ISRC: 'isrc',
	ASIN: 'asin',
	MUSICBRAINZ_TRACKID: 'musicbrainz_recordingid',
	MUSICBRAINZ_RELEASETRACKID: 'musicbrainz_trackid',
	MUSICBRAINZ_ALBUMID: 'musicbrainz_albumid',
	MUSICBRAINZ_ARTISTID: 'musicbrainz_artistid',
	MUSICBRAINZ_ALBUMARTISTID: 'musicbrainz_albumartistid',
	MUSICBRAINZ_RELEASEGROUPID: 'musicbrainz_releasegroupid',
	MUSICBRAINZ_WORKID: 'musicbrainz_workid',
	MUSICBRAINZ_TRMID: 'musicbrainz_trmid',
	MUSICBRAINZ_DISCID: 'musicbrainz_discid',
	ACOUSTID_ID: 'acoustid_id',
	ACOUSTID_ID_FINGERPRINT: 'acoustid_fingerprint',
	MUSICIP_PUID: 'musicip_puid',
	WEBSITE: 'website',
	NOTES: 'notes',
	TOTALTRACKS: 'totaltracks',
	TOTALDISCS: 'totaldiscs',
	DISCOGS_ARTIST_ID: 'discogs_artist_id',
	DISCOGS_ARTISTS: 'artists',
	DISCOGS_ARTIST_NAME: 'artists',
	DISCOGS_ALBUM_ARTISTS: 'albumartist',
	DISCOGS_CATALOG: 'catalognumber',
	DISCOGS_COUNTRY: 'releasecountry',
	DISCOGS_DATE: 'originaldate',
	DISCOGS_LABEL: 'label',
	DISCOGS_LABEL_ID: 'discogs_label_id',
	DISCOGS_MASTER_RELEASE_ID: 'discogs_master_release_id',
	DISCOGS_RATING: 'discogs_rating',
	DISCOGS_RELEASED: 'date',
	DISCOGS_RELEASE_ID: 'discogs_release_id',
	DISCOGS_VOTES: 'discogs_votes',
	CATALOGID: 'catalognumber',
	STYLE: 'genre',
	REPLAYGAIN_TRACK_GAIN: 'replaygain_track_gain',
	REPLAYGAIN_TRACK_PEAK: 'replaygain_track_peak',
	REPLAYGAIN_ALBUM_GAIN: 'replaygain_album_gain',
	REPLAYGAIN_ALBUM_PEAK: 'replaygain_album_peak',
	REPLAYGAIN_MINMAX: 'replaygain_track_minmax',
	REPLAYGAIN_ALBUM_MINMAX: 'replaygain_album_minmax',
	REPLAYGAIN_UNDO: 'replaygain_undo'
};
class nn extends yt {
	static toRating(e, r, n) {
		return {
			source: e ? e.toLowerCase() : void 0,
			rating: (Number.parseFloat(r) / n) * yt.maxRatingScore
		};
	}
	constructor() {
		super(['vorbis'], pp);
	}
	postMap(e) {
		if (e.id === 'RATING') e.value = nn.toRating(void 0, e.value, 100);
		else if (e.id.indexOf('RATING:') === 0) {
			const r = e.id.split(':');
			((e.value = nn.toRating(r[1], e.value, 1)), (e.id = r[0]));
		}
	}
}
const mp = {
	IART: 'artist',
	ICRD: 'date',
	INAM: 'title',
	TITL: 'title',
	IPRD: 'album',
	ITRK: 'track',
	IPRT: 'track',
	COMM: 'comment',
	ICMT: 'comment',
	ICNT: 'releasecountry',
	GNRE: 'genre',
	IWRI: 'writer',
	RATE: 'rating',
	YEAR: 'year',
	ISFT: 'encodedby',
	CODE: 'encodedby',
	TURL: 'website',
	IGNR: 'genre',
	IENG: 'engineer',
	ITCH: 'technician',
	IMED: 'media',
	IRPD: 'album'
};
class hp extends yt {
	constructor() {
		super(['exif'], mp);
	}
}
const gp = {
	'segment:title': 'title',
	'album:ARTIST': 'albumartist',
	'album:ARTISTSORT': 'albumartistsort',
	'album:TITLE': 'album',
	'album:DATE_RECORDED': 'originaldate',
	'album:DATE_RELEASED': 'releasedate',
	'album:PART_NUMBER': 'disk',
	'album:TOTAL_PARTS': 'totaltracks',
	'track:ARTIST': 'artist',
	'track:ARTISTSORT': 'artistsort',
	'track:TITLE': 'title',
	'track:PART_NUMBER': 'track',
	'track:MUSICBRAINZ_TRACKID': 'musicbrainz_recordingid',
	'track:MUSICBRAINZ_ALBUMID': 'musicbrainz_albumid',
	'track:MUSICBRAINZ_ARTISTID': 'musicbrainz_artistid',
	'track:PUBLISHER': 'label',
	'track:GENRE': 'genre',
	'track:ENCODER': 'encodedby',
	'track:ENCODER_OPTIONS': 'encodersettings',
	'edition:TOTAL_PARTS': 'totaldiscs',
	picture: 'picture'
};
class vp extends Or {
	constructor() {
		super(['matroska'], gp);
	}
}
const xp = { NAME: 'title', AUTH: 'artist', '(c) ': 'copyright', ANNO: 'comment' };
class yp extends yt {
	constructor() {
		super(['AIFF'], xp);
	}
}
class bp {
	constructor() {
		((this.tagMappers = {}),
			[
				new ip(),
				new lp(),
				new Bi(),
				new Ta(),
				new Ta(),
				new nn(),
				new up(),
				new zi(),
				new hp(),
				new vp(),
				new yp()
			].forEach((e) => {
				this.registerTagMapper(e);
			}));
	}
	mapTag(e, r, n) {
		if (this.tagMappers[e]) return this.tagMappers[e].mapGenericTag(r, n);
		throw new co(`No generic tag mapper defined for tag-format: ${e}`);
	}
	registerTagMapper(e) {
		for (const r of e.tagTypes) this.tagMappers[r] = e;
	}
}
function wp(t) {
	const e = t.split(`
`),
		r = [],
		n = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
	for (const i of e) {
		const a = i.match(n);
		if (a) {
			const s = Number.parseInt(a[1], 10),
				o = Number.parseInt(a[2], 10),
				c = a[3];
			let l;
			c.length === 3 ? (l = Number.parseInt(c, 10)) : (l = Number.parseInt(c, 10) * 10);
			const d = (s * 60 + o) * 1e3 + l,
				u = i.replace(n, '').trim();
			r.push({ timestamp: d, text: u });
		}
	}
	return { contentType: Yf.lyrics, timeStampFormat: Zf.milliseconds, syncText: r };
}
const Yt = Er('music-metadata:collector'),
	_p = [
		'matroska',
		'APEv2',
		'vorbis',
		'ID3v2.4',
		'ID3v2.3',
		'ID3v2.2',
		'exif',
		'asf',
		'iTunes',
		'AIFF',
		'ID3v1'
	];
class Tp {
	constructor(e) {
		((this.format = { tagTypes: [], trackInfo: [] }),
			(this.native = {}),
			(this.common = {
				track: { no: null, of: null },
				disk: { no: null, of: null },
				movementIndex: { no: null, of: null }
			}),
			(this.quality = { warnings: [] }),
			(this.commonOrigin = {}),
			(this.originPriority = {}),
			(this.tagMapper = new bp()),
			(this.opts = e));
		let r = 1;
		for (const n of _p) this.originPriority[n] = r++;
		((this.originPriority.artificial = 500), (this.originPriority.id3v1 = 600));
	}
	hasAny() {
		return Object.keys(this.native).length > 0;
	}
	addStreamInfo(e) {
		(Yt(`streamInfo: type=${e.type ? Lf[e.type] : '?'}, codec=${e.codecName}`),
			this.format.trackInfo.push(e));
	}
	setFormat(e, r) {
		(Yt(`format: ${e} = ${r}`),
			(this.format[e] = r),
			this.opts?.observer &&
				this.opts.observer({ metadata: this, tag: { type: 'format', id: e, value: r } }));
	}
	setAudioOnly() {
		(this.setFormat('hasAudio', !0), this.setFormat('hasVideo', !1));
	}
	async addTag(e, r, n) {
		(Yt(`tag ${e}.${r} = ${n}`),
			this.native[e] || (this.format.tagTypes.push(e), (this.native[e] = [])),
			this.native[e].push({ id: r, value: n }),
			await this.toCommon(e, r, n));
	}
	addWarning(e) {
		this.quality.warnings.push({ message: e });
	}
	async postMap(e, r) {
		switch (r.id) {
			case 'artist':
				if (this.commonOrigin.artist === this.originPriority[e])
					return this.postMap('artificial', { id: 'artists', value: r.value });
				this.common.artists || this.setGenericTag('artificial', { id: 'artists', value: r.value });
				break;
			case 'artists':
				if (
					(!this.common.artist || this.commonOrigin.artist === this.originPriority.artificial) &&
					(!this.common.artists || this.common.artists.indexOf(r.value) === -1)
				) {
					const n = (this.common.artists || []).concat([r.value]),
						a = { id: 'artist', value: Ap(n) };
					this.setGenericTag('artificial', a);
				}
				break;
			case 'picture':
				return this.postFixPicture(r.value).then((n) => {
					n !== null && ((r.value = n), this.setGenericTag(e, r));
				});
			case 'totaltracks':
				this.common.track.of = yt.toIntOrNull(r.value);
				return;
			case 'totaldiscs':
				this.common.disk.of = yt.toIntOrNull(r.value);
				return;
			case 'movementTotal':
				this.common.movementIndex.of = yt.toIntOrNull(r.value);
				return;
			case 'track':
			case 'disk':
			case 'movementIndex': {
				const n = this.common[r.id].of;
				((this.common[r.id] = yt.normalizeTrack(r.value)),
					(this.common[r.id].of = n ?? this.common[r.id].of));
				return;
			}
			case 'bpm':
			case 'year':
			case 'originalyear':
				r.value = Number.parseInt(r.value, 10);
				break;
			case 'date': {
				const n = Number.parseInt(r.value.substr(0, 4), 10);
				Number.isNaN(n) || (this.common.year = n);
				break;
			}
			case 'discogs_label_id':
			case 'discogs_release_id':
			case 'discogs_master_release_id':
			case 'discogs_artist_id':
			case 'discogs_votes':
				r.value = typeof r.value == 'string' ? Number.parseInt(r.value, 10) : r.value;
				break;
			case 'replaygain_track_gain':
			case 'replaygain_track_peak':
			case 'replaygain_album_gain':
			case 'replaygain_album_peak':
				r.value = Kf(r.value);
				break;
			case 'replaygain_track_minmax':
				r.value = r.value.split(',').map((n) => Number.parseInt(n, 10));
				break;
			case 'replaygain_undo': {
				const n = r.value.split(',').map((i) => Number.parseInt(i, 10));
				r.value = { leftChannel: n[0], rightChannel: n[1] };
				break;
			}
			case 'gapless':
			case 'compilation':
			case 'podcast':
			case 'showMovement':
				r.value = r.value === '1' || r.value === 1;
				break;
			case 'isrc': {
				const n = this.common[r.id];
				if (n && n.indexOf(r.value) !== -1) return;
				break;
			}
			case 'comment':
				(typeof r.value == 'string' && (r.value = { text: r.value }),
					r.value.descriptor === 'iTunPGAP' &&
						this.setGenericTag(e, { id: 'gapless', value: r.value.text === '1' }));
				break;
			case 'lyrics':
				typeof r.value == 'string' && (r.value = wp(r.value));
				break;
		}
		r.value !== null && this.setGenericTag(e, r);
	}
	toCommonMetadata() {
		return { format: this.format, native: this.native, quality: this.quality, common: this.common };
	}
	async postFixPicture(e) {
		if (e.data && e.data.length > 0) {
			if (!e.format) {
				const r = await lo(Uint8Array.from(e.data));
				if (r) e.format = r.mime;
				else return null;
			}
			switch (((e.format = e.format.toLocaleLowerCase()), e.format)) {
				case 'image/jpg':
					e.format = 'image/jpeg';
			}
			return e;
		}
		return (this.addWarning('Empty picture tag found'), null);
	}
	async toCommon(e, r, n) {
		const i = { id: r, value: n },
			a = this.tagMapper.mapTag(e, i, this);
		a && (await this.postMap(e, a));
	}
	setGenericTag(e, r) {
		Yt(`common.${r.id} = ${r.value}`);
		const n = this.commonOrigin[r.id] || 1e3,
			i = this.originPriority[e];
		if (tp(r.id))
			if (i <= n) ((this.common[r.id] = r.value), (this.commonOrigin[r.id] = i));
			else return Yt(`Ignore native tag (singleton): ${e}.${r.id} = ${r.value}`);
		else if (i === n)
			!rp(r.id) || this.common[r.id].indexOf(r.value) === -1
				? this.common[r.id].push(r.value)
				: Yt(`Ignore duplicate value: ${e}.${r.id} = ${r.value}`);
		else if (i < n) ((this.common[r.id] = [r.value]), (this.commonOrigin[r.id] = i));
		else return Yt(`Ignore native tag (list): ${e}.${r.id} = ${r.value}`);
		this.opts?.observer &&
			this.opts.observer({ metadata: this, tag: { type: 'common', id: r.id, value: r.value } });
	}
}
function Ap(t) {
	return t.length > 2
		? `${t.slice(0, t.length - 1).join(', ')} & ${t[t.length - 1]}`
		: t.join(' & ');
}
const kp = {
		parserType: 'mpeg',
		extensions: ['.mp2', '.mp3', '.m2a', '.aac', 'aacp'],
		mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/aacs', 'audio/aacp'],
		async load() {
			return (
				await bt(
					async () => {
						const { MpegParser: t } = await import('./2rs9rTQB.js');
						return { MpegParser: t };
					},
					__vite__mapDeps([0, 1, 2]),
					import.meta.url
				)
			).MpegParser;
		}
	},
	Sp = {
		parserType: 'apev2',
		extensions: ['.ape'],
		mimeTypes: ['audio/ape', 'audio/monkeys-audio'],
		async load() {
			return (
				await bt(
					async () => {
						const { APEv2Parser: t } = await Promise.resolve().then(() => Xp);
						return { APEv2Parser: t };
					},
					void 0,
					import.meta.url
				)
			).APEv2Parser;
		}
	},
	Pp = {
		parserType: 'asf',
		extensions: ['.asf'],
		mimeTypes: [
			'audio/ms-wma',
			'video/ms-wmv',
			'audio/ms-asf',
			'video/ms-asf',
			'application/vnd.ms-asf'
		],
		async load() {
			return (
				await bt(
					async () => {
						const { AsfParser: t } = await import('./DHrFvkCN.js');
						return { AsfParser: t };
					},
					[],
					import.meta.url
				)
			).AsfParser;
		}
	},
	Cp = {
		parserType: 'dsdiff',
		extensions: ['.dff'],
		mimeTypes: ['audio/dsf', 'audio/dsd'],
		async load() {
			return (
				await bt(
					async () => {
						const { DsdiffParser: t } = await import('./BfYWDPRC.js');
						return { DsdiffParser: t };
					},
					__vite__mapDeps([3, 2]),
					import.meta.url
				)
			).DsdiffParser;
		}
	},
	Ip = {
		parserType: 'aiff',
		extensions: ['.aif', 'aiff', 'aifc'],
		mimeTypes: ['audio/aiff', 'audio/aif', 'audio/aifc', 'application/aiff'],
		async load() {
			return (
				await bt(
					async () => {
						const { AIFFParser: t } = await import('./Dub_k349.js');
						return { AIFFParser: t };
					},
					__vite__mapDeps([4, 2]),
					import.meta.url
				)
			).AIFFParser;
		}
	},
	Ep = {
		parserType: 'dsf',
		extensions: ['.dsf'],
		mimeTypes: ['audio/dsf'],
		async load() {
			return (
				await bt(
					async () => {
						const { DsfParser: t } = await import('./L9gVGbbq.js');
						return { DsfParser: t };
					},
					__vite__mapDeps([5, 1, 2]),
					import.meta.url
				)
			).DsfParser;
		}
	},
	Mp = {
		parserType: 'flac',
		extensions: ['.flac'],
		mimeTypes: ['audio/flac'],
		async load() {
			return (
				await bt(
					async () => {
						const { FlacParser: t } = await import('./BOW00QWY.js').then((e) => e.d);
						return { FlacParser: t };
					},
					__vite__mapDeps([6, 1, 2]),
					import.meta.url
				)
			).FlacParser;
		}
	},
	Op = {
		parserType: 'matroska',
		extensions: ['.mka', '.mkv', '.mk3d', '.mks', 'webm'],
		mimeTypes: ['audio/matroska', 'video/matroska', 'audio/webm', 'video/webm'],
		async load() {
			return (
				await bt(
					async () => {
						const { MatroskaParser: t } = await import('./Bo9cViY5.js');
						return { MatroskaParser: t };
					},
					[],
					import.meta.url
				)
			).MatroskaParser;
		}
	},
	Fp = {
		parserType: 'mp4',
		extensions: ['.mp4', '.m4a', '.m4b', '.m4pa', 'm4v', 'm4r', '3gp'],
		mimeTypes: ['audio/mp4', 'audio/m4a', 'video/m4v', 'video/mp4'],
		async load() {
			return (
				await bt(
					async () => {
						const { MP4Parser: t } = await import('./DgIoF-Eo.js');
						return { MP4Parser: t };
					},
					[],
					import.meta.url
				)
			).MP4Parser;
		}
	},
	Dp = {
		parserType: 'musepack',
		extensions: ['.mpc'],
		mimeTypes: ['audio/musepack'],
		async load() {
			return (
				await bt(
					async () => {
						const { MusepackParser: t } = await import('./DjgOmxM8.js');
						return { MusepackParser: t };
					},
					__vite__mapDeps([7, 1, 2]),
					import.meta.url
				)
			).MusepackParser;
		}
	},
	Rp = {
		parserType: 'ogg',
		extensions: ['.ogg', '.ogv', '.oga', '.ogm', '.ogx', '.opus', '.spx'],
		mimeTypes: ['audio/ogg', 'audio/opus', 'audio/speex', 'video/ogg'],
		async load() {
			return (
				await bt(
					async () => {
						const { OggParser: t } = await import('./B-qE73Xl.js');
						return { OggParser: t };
					},
					__vite__mapDeps([8, 6, 1, 2]),
					import.meta.url
				)
			).OggParser;
		}
	},
	Np = {
		parserType: 'wavpack',
		extensions: ['.wv', '.wvp'],
		mimeTypes: ['audio/wavpack'],
		async load() {
			return (
				await bt(
					async () => {
						const { WavPackParser: t } = await import('./CAuBqprL.js');
						return { WavPackParser: t };
					},
					[],
					import.meta.url
				)
			).WavPackParser;
		}
	},
	Bp = {
		parserType: 'riff',
		extensions: ['.wav', 'wave', '.bwf'],
		mimeTypes: ['audio/vnd.wave', 'audio/wav', 'audio/wave'],
		async load() {
			return (
				await bt(
					async () => {
						const { WaveParser: t } = await import('./CFqLGdWB.js');
						return { WaveParser: t };
					},
					__vite__mapDeps([9, 2]),
					import.meta.url
				)
			).WaveParser;
		}
	},
	Zt = Er('music-metadata:parser:factory');
function zp(t) {
	const e = Nf.parse(t),
		r = zf.parse(e.type);
	return { type: r.type, subtype: r.subtype, suffix: r.suffix, parameters: e.parameters };
}
class Lp {
	constructor() {
		((this.parsers = []),
			[Mp, kp, Sp, Fp, Op, Bp, Rp, Pp, Ip, Np, Dp, Ep, Cp].forEach((e) => this.registerParser(e)));
	}
	registerParser(e) {
		this.parsers.push(e);
	}
	async parse(e, r, n) {
		if (
			(e.supportsRandomAccess()
				? (Zt('tokenizer supports random-access, scanning for appending headers'), await Yp(e, n))
				: Zt('tokenizer does not support random-access, cannot scan for appending headers'),
			!r)
		) {
			const o = new Uint8Array(4100);
			if (
				(e.fileInfo.mimeType && (r = this.findLoaderForContentType(e.fileInfo.mimeType)),
				!r && e.fileInfo.path && (r = this.findLoaderForExtension(e.fileInfo.path)),
				!r)
			) {
				(Zt('Guess parser on content...'), await e.peekBuffer(o, { mayBeLess: !0 }));
				const c = await lo(o, { mpegOffsetTolerance: 10 });
				if (!c || !c.mime) throw new $f('Failed to determine audio format');
				if (
					(Zt(`Guessed file type is mime=${c.mime}, extension=${c.ext}`),
					(r = this.findLoaderForContentType(c.mime)),
					!r)
				)
					throw new Uf(`Guessed MIME-type not supported: ${c.mime}`);
			}
		}
		Zt(`Loading ${r.parserType} parser...`);
		const i = new Tp(n),
			a = await r.load(),
			s = new a(i, e, n ?? {});
		return (
			Zt(`Parser ${r.parserType} loaded`),
			await s.parse(),
			i.format.trackInfo &&
				(i.format.hasAudio === void 0 &&
					i.setFormat('hasAudio', !!i.format.trackInfo.find((o) => o.type === Nt.audio)),
				i.format.hasVideo === void 0 &&
					i.setFormat('hasVideo', !!i.format.trackInfo.find((o) => o.type === Nt.video))),
			i.toCommonMetadata()
		);
	}
	findLoaderForExtension(e) {
		if (!e) return;
		const r = $p(e).toLocaleLowerCase() || e;
		return this.parsers.find((n) => n.extensions.indexOf(r) !== -1);
	}
	findLoaderForContentType(e) {
		let r;
		if (!e) return;
		try {
			r = zp(e);
		} catch {
			Zt(`Invalid HTTP Content-Type header value: ${e}`);
			return;
		}
		const n = r.subtype.indexOf('x-') === 0 ? r.subtype.substring(2) : r.subtype;
		return this.parsers.find((i) => i.mimeTypes.find((a) => a.indexOf(`${r.type}/${n}`) !== -1));
	}
	getSupportedMimeTypes() {
		const e = new Set();
		return (
			this.parsers.forEach((r) => {
				r.mimeTypes.forEach((n) => {
					(e.add(n), e.add(n.replace('/', '/x-')));
				});
			}),
			Array.from(e)
		);
	}
}
function $p(t) {
	const e = t.lastIndexOf('.');
	return e === -1 ? '' : t.slice(e);
}
class fo {
	constructor(e, r, n) {
		((this.metadata = e), (this.tokenizer = r), (this.options = n));
	}
}
const Up = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/,
	po = {
		len: 4,
		get: (t, e) => {
			const r = so(t.slice(e, e + po.len), 'latin1');
			if (!r.match(Up)) throw new Ni(`FourCC contains invalid characters: ${Hf(r)} "${r}"`);
			return r;
		},
		put: (t, e, r) => {
			const n = Sf(r);
			if (n.length !== 4) throw new co('Invalid length');
			return (t.set(n, e), e + 4);
		}
	},
	Vr = { text_utf8: 0, binary: 1, external_info: 2, reserved: 3 },
	Aa = {
		len: 52,
		get: (t, e) => ({
			ID: po.get(t, e),
			version: Ae.get(t, e + 4) / 1e3,
			descriptorBytes: Ae.get(t, e + 8),
			headerBytes: Ae.get(t, e + 12),
			seekTableBytes: Ae.get(t, e + 16),
			headerDataBytes: Ae.get(t, e + 20),
			apeFrameDataBytes: Ae.get(t, e + 24),
			apeFrameDataBytesHigh: Ae.get(t, e + 28),
			terminatingDataBytes: Ae.get(t, e + 32),
			fileMD5: new Ys(16).get(t, e + 36)
		})
	},
	jp = {
		len: 24,
		get: (t, e) => ({
			compressionLevel: Me.get(t, e),
			formatFlags: Me.get(t, e + 2),
			blocksPerFrame: Ae.get(t, e + 4),
			finalFrameBlocks: Ae.get(t, e + 8),
			totalFrames: Ae.get(t, e + 12),
			bitsPerSample: Me.get(t, e + 16),
			channel: Me.get(t, e + 18),
			sampleRate: Ae.get(t, e + 20)
		})
	},
	mt = {
		len: 32,
		get: (t, e) => ({
			ID: new Be(8, 'ascii').get(t, e),
			version: Ae.get(t, e + 8),
			size: Ae.get(t, e + 12),
			fields: Ae.get(t, e + 16),
			flags: mo(Ae.get(t, e + 20))
		})
	},
	Bn = { len: 8, get: (t, e) => ({ size: Ae.get(t, e), flags: mo(Ae.get(t, e + 4)) }) };
function mo(t) {
	return {
		containsHeader: Xr(t, 31),
		containsFooter: Xr(t, 30),
		isHeader: Xr(t, 29),
		readOnly: Xr(t, 0),
		dataType: (t & 6) >> 1
	};
}
function Xr(t, e) {
	return (t & (1 << e)) !== 0;
}
const $t = Er('music-metadata:parser:APEv2'),
	ka = 'APEv2',
	Sa = 'APETAGEX';
class Zr extends Vf('APEv2') {}
function Vp(t, e, r) {
	return new Xt(t, e, r).tryParseApeHeader();
}
class Xt extends fo {
	constructor() {
		(super(...arguments), (this.ape = {}));
	}
	static calculateDuration(e) {
		let r = e.totalFrames > 1 ? e.blocksPerFrame * (e.totalFrames - 1) : 0;
		return ((r += e.finalFrameBlocks), r / e.sampleRate);
	}
	static async findApeFooterOffset(e, r) {
		const n = new Uint8Array(mt.len),
			i = e.position;
		if (r <= mt.len) {
			$t(`Offset is too small to read APE footer: offset=${r}`);
			return;
		}
		if (r > mt.len) {
			(await e.readBuffer(n, { position: r - mt.len }), e.setPosition(i));
			const a = mt.get(n, 0);
			if (a.ID === 'APETAGEX')
				return (
					a.flags.isHeader
						? $t(`APE Header found at offset=${r - mt.len}`)
						: ($t(`APE Footer found at offset=${r - mt.len}`), (r -= a.size)),
					{ footer: a, offset: r }
				);
		}
	}
	static parseTagFooter(e, r, n) {
		const i = mt.get(r, r.length - mt.len);
		if (i.ID !== Sa) throw new Zr('Unexpected APEv2 Footer ID preamble value');
		return (Zn(r), new Xt(e, Zn(r), n).parseTags(i));
	}
	async tryParseApeHeader() {
		if (
			this.tokenizer.fileInfo.size &&
			this.tokenizer.fileInfo.size - this.tokenizer.position < mt.len
		) {
			$t('No APEv2 header found, end-of-file reached');
			return;
		}
		const e = await this.tokenizer.peekToken(mt);
		if (e.ID === Sa) return (await this.tokenizer.ignore(mt.len), this.parseTags(e));
		if (
			($t(`APEv2 header not found at offset=${this.tokenizer.position}`),
			this.tokenizer.fileInfo.size)
		) {
			const r = this.tokenizer.fileInfo.size - this.tokenizer.position,
				n = new Uint8Array(r);
			return (
				await this.tokenizer.readBuffer(n),
				Xt.parseTagFooter(this.metadata, n, this.options)
			);
		}
	}
	async parse() {
		const e = await this.tokenizer.readToken(Aa);
		if (e.ID !== 'MAC ') throw new Zr('Unexpected descriptor ID');
		this.ape.descriptor = e;
		const r = e.descriptorBytes - Aa.len,
			n = await (r > 0 ? this.parseDescriptorExpansion(r) : this.parseHeader());
		return (
			this.metadata.setAudioOnly(),
			await this.tokenizer.ignore(n.forwardBytes),
			this.tryParseApeHeader()
		);
	}
	async parseTags(e) {
		const r = new Uint8Array(256);
		let n = e.size - mt.len;
		$t(`Parse APE tags at offset=${this.tokenizer.position}, size=${n}`);
		for (let i = 0; i < e.fields; i++) {
			if (n < Bn.len) {
				this.metadata.addWarning(
					`APEv2 Tag-header: ${e.fields - i} items remaining, but no more tag data to read.`
				);
				break;
			}
			const a = await this.tokenizer.readToken(Bn);
			((n -= Bn.len + a.size),
				await this.tokenizer.peekBuffer(r, { length: Math.min(r.length, n) }));
			let s = _a(r, 0, r.length);
			const o = await this.tokenizer.readToken(new Be(s, 'ascii'));
			switch ((await this.tokenizer.ignore(1), (n -= o.length + 1), a.flags.dataType)) {
				case Vr.text_utf8: {
					const l = (await this.tokenizer.readToken(new Be(a.size, 'utf8'))).split(/\x00/g);
					await Promise.all(l.map((d) => this.metadata.addTag(ka, o, d)));
					break;
				}
				case Vr.binary:
					if (this.options.skipCovers) await this.tokenizer.ignore(a.size);
					else {
						const c = new Uint8Array(a.size);
						(await this.tokenizer.readBuffer(c), (s = _a(c, 0, c.length)));
						const l = so(c.slice(0, s)),
							d = c.slice(s + 1);
						await this.metadata.addTag(ka, o, { description: l, data: d });
					}
					break;
				case Vr.external_info:
					($t(`Ignore external info ${o}`), await this.tokenizer.ignore(a.size));
					break;
				case Vr.reserved:
					($t(`Ignore external info ${o}`),
						this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${o}"`),
						await this.tokenizer.ignore(a.size));
					break;
			}
		}
	}
	async parseDescriptorExpansion(e) {
		return (await this.tokenizer.ignore(e), this.parseHeader());
	}
	async parseHeader() {
		const e = await this.tokenizer.readToken(jp);
		if (
			(this.metadata.setFormat('lossless', !0),
			this.metadata.setFormat('container', "Monkey's Audio"),
			this.metadata.setFormat('bitsPerSample', e.bitsPerSample),
			this.metadata.setFormat('sampleRate', e.sampleRate),
			this.metadata.setFormat('numberOfChannels', e.channel),
			this.metadata.setFormat('duration', Xt.calculateDuration(e)),
			!this.ape.descriptor)
		)
			throw new Zr('Missing APE descriptor');
		return {
			forwardBytes:
				this.ape.descriptor.seekTableBytes +
				this.ape.descriptor.headerDataBytes +
				this.ape.descriptor.apeFrameDataBytes +
				this.ape.descriptor.terminatingDataBytes
		};
	}
}
const Xp = Object.freeze(
		Object.defineProperty(
			{ __proto__: null, APEv2Parser: Xt, ApeContentError: Zr, tryParseApeHeader: Vp },
			Symbol.toStringTag,
			{ value: 'Module' }
		)
	),
	Gr = Er('music-metadata:parser:ID3v1'),
	Pa = [
		'Blues',
		'Classic Rock',
		'Country',
		'Dance',
		'Disco',
		'Funk',
		'Grunge',
		'Hip-Hop',
		'Jazz',
		'Metal',
		'New Age',
		'Oldies',
		'Other',
		'Pop',
		'R&B',
		'Rap',
		'Reggae',
		'Rock',
		'Techno',
		'Industrial',
		'Alternative',
		'Ska',
		'Death Metal',
		'Pranks',
		'Soundtrack',
		'Euro-Techno',
		'Ambient',
		'Trip-Hop',
		'Vocal',
		'Jazz+Funk',
		'Fusion',
		'Trance',
		'Classical',
		'Instrumental',
		'Acid',
		'House',
		'Game',
		'Sound Clip',
		'Gospel',
		'Noise',
		'Alt. Rock',
		'Bass',
		'Soul',
		'Punk',
		'Space',
		'Meditative',
		'Instrumental Pop',
		'Instrumental Rock',
		'Ethnic',
		'Gothic',
		'Darkwave',
		'Techno-Industrial',
		'Electronic',
		'Pop-Folk',
		'Eurodance',
		'Dream',
		'Southern Rock',
		'Comedy',
		'Cult',
		'Gangsta Rap',
		'Top 40',
		'Christian Rap',
		'Pop/Funk',
		'Jungle',
		'Native American',
		'Cabaret',
		'New Wave',
		'Psychedelic',
		'Rave',
		'Showtunes',
		'Trailer',
		'Lo-Fi',
		'Tribal',
		'Acid Punk',
		'Acid Jazz',
		'Polka',
		'Retro',
		'Musical',
		'Rock & Roll',
		'Hard Rock',
		'Folk',
		'Folk/Rock',
		'National Folk',
		'Swing',
		'Fast-Fusion',
		'Bebob',
		'Latin',
		'Revival',
		'Celtic',
		'Bluegrass',
		'Avantgarde',
		'Gothic Rock',
		'Progressive Rock',
		'Psychedelic Rock',
		'Symphonic Rock',
		'Slow Rock',
		'Big Band',
		'Chorus',
		'Easy Listening',
		'Acoustic',
		'Humour',
		'Speech',
		'Chanson',
		'Opera',
		'Chamber Music',
		'Sonata',
		'Symphony',
		'Booty Bass',
		'Primus',
		'Porn Groove',
		'Satire',
		'Slow Jam',
		'Club',
		'Tango',
		'Samba',
		'Folklore',
		'Ballad',
		'Power Ballad',
		'Rhythmic Soul',
		'Freestyle',
		'Duet',
		'Punk Rock',
		'Drum Solo',
		'A Cappella',
		'Euro-House',
		'Dance Hall',
		'Goa',
		'Drum & Bass',
		'Club-House',
		'Hardcore',
		'Terror',
		'Indie',
		'BritPop',
		'Negerpunk',
		'Polsk Punk',
		'Beat',
		'Christian Gangsta Rap',
		'Heavy Metal',
		'Black Metal',
		'Crossover',
		'Contemporary Christian',
		'Christian Rock',
		'Merengue',
		'Salsa',
		'Thrash Metal',
		'Anime',
		'JPop',
		'Synthpop',
		'Abstract',
		'Art Rock',
		'Baroque',
		'Bhangra',
		'Big Beat',
		'Breakbeat',
		'Chillout',
		'Downtempo',
		'Dub',
		'EBM',
		'Eclectic',
		'Electro',
		'Electroclash',
		'Emo',
		'Experimental',
		'Garage',
		'Global',
		'IDM',
		'Illbient',
		'Industro-Goth',
		'Jam Band',
		'Krautrock',
		'Leftfield',
		'Lounge',
		'Math Rock',
		'New Romantic',
		'Nu-Breakz',
		'Post-Punk',
		'Post-Rock',
		'Psytrance',
		'Shoegaze',
		'Space Rock',
		'Trop Rock',
		'World Music',
		'Neoclassical',
		'Audiobook',
		'Audio Theatre',
		'Neue Deutsche Welle',
		'Podcast',
		'Indie Rock',
		'G-Funk',
		'Dubstep',
		'Garage Rock',
		'Psybient'
	],
	Hr = {
		len: 128,
		get: (t, e) => {
			const r = new sr(3).get(t, e);
			return r === 'TAG'
				? {
						header: r,
						title: new sr(30).get(t, e + 3),
						artist: new sr(30).get(t, e + 33),
						album: new sr(30).get(t, e + 63),
						year: new sr(4).get(t, e + 93),
						comment: new sr(28).get(t, e + 97),
						zeroByte: er.get(t, e + 127),
						track: er.get(t, e + 126),
						genre: er.get(t, e + 127)
					}
				: null;
		}
	};
class sr {
	constructor(e) {
		((this.len = e), (this.stringType = new Be(e, 'latin1')));
	}
	get(e, r) {
		let n = this.stringType.get(e, r);
		return ((n = Xf(n)), (n = n.trim()), n.length > 0 ? n : void 0);
	}
}
class ho extends fo {
	constructor(e, r, n) {
		(super(e, r, n), (this.apeHeader = n.apeHeader));
	}
	static getGenre(e) {
		if (e < Pa.length) return Pa[e];
	}
	async parse() {
		if (!this.tokenizer.fileInfo.size) {
			Gr('Skip checking for ID3v1 because the file-size is unknown');
			return;
		}
		this.apeHeader &&
			(this.tokenizer.ignore(this.apeHeader.offset - this.tokenizer.position),
			await new Xt(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer));
		const e = this.tokenizer.fileInfo.size - Hr.len;
		if (this.tokenizer.position > e) {
			Gr('Already consumed the last 128 bytes');
			return;
		}
		const r = await this.tokenizer.readToken(Hr, e);
		if (r) {
			Gr('ID3v1 header found at: pos=%s', this.tokenizer.fileInfo.size - Hr.len);
			const n = ['title', 'artist', 'album', 'comment', 'track', 'year'];
			for (const a of n) r[a] && r[a] !== '' && (await this.addTag(a, r[a]));
			const i = ho.getGenre(r.genre);
			i && (await this.addTag('genre', i));
		} else Gr('ID3v1 header not found at: pos=%s', this.tokenizer.fileInfo.size - Hr.len);
	}
	async addTag(e, r) {
		await this.metadata.addTag('ID3v1', e, r);
	}
}
async function Gp(t) {
	if (t.fileInfo.size >= 128) {
		const e = new Uint8Array(3),
			r = t.position;
		return (
			await t.readBuffer(e, { position: t.fileInfo.size - 128 }),
			t.setPosition(r),
			new TextDecoder('latin1').decode(e) === 'TAG'
		);
	}
	return !1;
}
const Hp = 'LYRICS200';
async function qp(t) {
	const e = t.fileInfo.size;
	if (e >= 143) {
		const r = new Uint8Array(15),
			n = t.position;
		(await t.readBuffer(r, { position: e - 143 }), t.setPosition(n));
		const i = new TextDecoder('latin1').decode(r);
		if (i.slice(6) === Hp) return Number.parseInt(i.slice(0, 6), 10) + 15;
	}
	return 0;
}
async function Wp(t, e = {}) {
	const r = bd(t);
	try {
		return await Kp(r, e);
	} finally {
		await r.close();
	}
}
function Kp(t, e) {
	return new Lp().parse(t, void 0, e);
}
async function Yp(t, e = {}) {
	let r = t.fileInfo.size;
	if (await Gp(t)) {
		r -= 128;
		const n = await qp(t);
		r -= n;
	}
	e.apeHeader = await Xt.findApeFooterOffset(t, r);
}
var Zp = N('<span> </span>'),
	Jp = N('<span> </span>'),
	Qp = N('<span> </span>'),
	em = N('<span class="text-muted-foreground/75 text-sm"><!> <!> <!></span>'),
	tm = N(
		`<div class="flex flex-col place-items-center justify-center gap-2"><div class="border-border text-muted-foreground flex size-14 place-items-center justify-center rounded-full border border-dashed"><!></div> <div class="flex flex-col gap-0.5 text-center"><span class="text-muted-foreground font-medium">Drag 'n' drop files here, or click to select files</span> <!></div></div>`
	),
	rm = N('<label><!> <input/></label>');
function nm(t, e) {
	D(e, !0);
	let r = _(e, 'id', 19, li),
		n = _(e, 'disabled', 3, !1),
		i = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'id',
			'children',
			'maxFiles',
			'maxFileSize',
			'fileCount',
			'disabled',
			'onUpload',
			'onFileRejected',
			'accept',
			'class'
		]);
	e.maxFiles !== void 0 &&
		e.fileCount === void 0 &&
		console.warn(
			'Make sure to provide FileDropZone with `fileCount` when using the `maxFiles` prompt'
		);
	let a = Le(!1);
	const s = async (v) => {
			if (n() || !x(d)) return;
			v.preventDefault();
			const y = Array.from(v.dataTransfer?.files ?? []);
			await l(y);
		},
		o = async (v) => {
			if (n()) return;
			const y = v.currentTarget.files;
			y && (await l(Array.from(y)), (v.target.value = ''));
		},
		c = (v, y) => {
			if (e.maxFileSize !== void 0 && v.size > e.maxFileSize) return 'Maximum file size exceeded';
			if (e.maxFiles !== void 0 && y > e.maxFiles) return 'Maximum files uploaded';
			if (!e.accept) return;
			const k = e.accept.split(',').map((j) => j.trim().toLowerCase()),
				$ = v.type.toLowerCase(),
				ee = v.name.toLowerCase();
			if (
				!k.some((j) => {
					if ($.startsWith('.')) return ee.endsWith(j);
					if (j.endsWith('/*')) {
						const S = j.slice(0, j.indexOf('/*'));
						return $.startsWith(`${S}/`);
					}
					return $ === j;
				})
			)
				return 'File type not allowed';
		},
		l = async (v) => {
			K(a, !0);
			const y = [];
			if (v && v.length > 0)
				for (let k = 0; k < v.length; k++) {
					const $ = v[k],
						ee = c($, (e.fileCount ?? 0) + k + 1);
					if (ee) {
						e.onFileRejected?.({ file: $, reason: ee });
						continue;
					}
					y.push($);
				}
			(await e.onUpload(y), K(a, !1));
		},
		d = P(
			() =>
				!n() &&
				!x(a) &&
				!(e.maxFiles !== void 0 && e.fileCount !== void 0 && e.fileCount >= e.maxFiles)
		);
	var u = rm(),
		f = M(u);
	{
		var h = (v) => {
				var y = A(),
					k = b(y);
				(F(k, () => e.children), p(v, y));
			},
			g = (v) => {
				var y = tm(),
					k = M(y),
					$ = M(k);
				(ql($, { class: 'size-7' }), E(k));
				var ee = Q(k, 2),
					O = Q(M(ee), 2);
				{
					var j = (S) => {
						var L = em(),
							U = M(L);
						{
							var z = (G) => {
								var re = Zp(),
									se = M(re);
								(E(re), ze(() => He(se, `You can upload ${e.maxFiles ?? ''} files`)), p(G, re));
							};
							ce(U, (G) => {
								e.maxFiles && G(z);
							});
						}
						var I = Q(U, 2);
						{
							var V = (G) => {
								var re = Jp(),
									se = M(re);
								(E(re),
									ze((ie) => He(se, `(up to ${ie ?? ''} each)`), [() => ti(e.maxFileSize)]),
									p(G, re));
							};
							ce(I, (G) => {
								e.maxFiles && e.maxFileSize && G(V);
							});
						}
						var q = Q(I, 2);
						{
							var Z = (G) => {
								var re = Qp(),
									se = M(re);
								(E(re),
									ze((ie) => He(se, `Maximum size ${ie ?? ''}`), [() => ti(e.maxFileSize)]),
									p(G, re));
							};
							ce(q, (G) => {
								e.maxFileSize && !e.maxFiles && G(Z);
							});
						}
						(E(L), p(S, L));
					};
					ce(O, (S) => {
						(e.maxFiles || e.maxFileSize) && S(j);
					});
				}
				(E(ee), E(y), p(v, y));
			};
		ce(f, (v) => {
			e.children ? v(h) : v(g, !1);
		});
	}
	var w = Q(f, 2);
	(Va(w),
		ue(w, () => ({
			...i,
			disabled: !x(d),
			id: r(),
			accept: e.accept,
			multiple: e.maxFiles === void 0 || e.maxFiles - (e.fileCount ?? 0) > 1,
			type: 'file',
			onchange: o,
			class: 'hidden'
		})),
		E(u),
		ze(
			(v) => {
				(Ot(u, 'for', r()), Ot(u, 'aria-disabled', !x(d)), ln(u, 1, v));
			},
			[
				() =>
					on(
						he(
							'border-border hover:bg-accent/25 flex h-48 w-full place-items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all hover:cursor-pointer aria-disabled:opacity-50 aria-disabled:hover:cursor-not-allowed',
							e.class
						)
					)
			]
		),
		Jr('dragover', u, (v) => v.preventDefault()),
		Jr('drop', u, s),
		p(t, u),
		R());
}
const ti = (t) =>
		t < ri
			? `${t.toFixed(0)} B`
			: t < ni
				? `${(t / ri).toFixed(0)} KB`
				: t < Ca
					? `${(t / ni).toFixed(0)} MB`
					: `${(t / Ca).toFixed(0)} GB`,
	ri = 1024,
	ni = 1024 * ri,
	Ca = 1024 * ni;
var im = N('<!> <!>', 1),
	am = N(
		'<div><div><div class="flex flex-col"><div class="flex items-center gap-2"><span class="text-sm"> </span></div> <span class="text-muted-foreground text-xs"> </span></div> <div class="flex items-center gap-2"><!></div></div></div>'
	),
	sm = N('Upload <!>', 1),
	om = N(
		'<!> <form method="POST" enctype="multipart/form-data" class="flex max-h-[50vh] w-full flex-col gap-2 overflow-y-auto px-5"><fieldset><input type="hidden" name="rootFolder"/> <!> <input name="attachments" type="file" class="hidden"/> <div class="mb-5 flex flex-col gap-3"></div> <!></fieldset></form>',
		1
	);
function lm(t, e) {
	D(e, !0);
	const [r, n] = an(),
		i = () => pr(u, '$files', r),
		a = () => pr(yn, '$uploadingItems', r),
		s = () => pr(Gi, '$uploadedItems', r),
		o = 10;
	let c = _(e, 'open', 15, !1),
		l = _(e, 'loading', 15, !1);
	const d = xc(at.data.uploadForm, { validators: lu(zs) }),
		u = fc(d, 'attachments'),
		f = async (O) => {
			u.set([...Array.from(i()), ...O]);
		};
	function h(O) {
		u.set([...Array.from(i()).slice(0, O), ...Array.from(i()).slice(O + 1)]);
	}
	const g = async ({ reason: O, file: j }) => {
		Ut.error(`${j.name} failed to upload.`, { description: O });
	};
	let w = Mo([]);
	function v(O) {
		return O.replace(`${at.params.path}/`, '');
	}
	async function y(O) {
		const j = [];
		for (const S of O)
			try {
				const L = new Promise((U) => {
					const z = new XMLHttpRequest(),
						I = `${at.url.origin}/p?url=${S.data.presignedUrl}`;
					(z.open('PUT', I), z.setRequestHeader('Content-Type', S.file.type));
					for (const V in S.data.metadata)
						S.data.metadata[V] &&
							z.setRequestHeader(`x-amz-meta-${V.toLowerCase()}`, S.data.metadata[V]);
					((z.upload.onprogress = (V) => {
						if (V.lengthComputable) {
							const q = (V.loaded / V.total) * 100;
							vn(yn, (kt(a)[v(S.data.finalName)] = q), kt(a));
						}
					}),
						(z.onload = () => {
							z.status >= 200 && z.status < 300
								? U(!0)
								: (console.error(
										`Upload failed for ${S.data.finalName}. Status: ${z.status}, Response: ${z.responseText}`
									),
									w.push({ error: z.responseText || 'Upload failed.', ...S }),
									U(!1));
						}),
						(z.onerror = () => {
							(console.error(`Network error during upload for ${S.data.finalName}`),
								w.push({ error: z.responseText || 'Network error', ...S }),
								U(!1));
						}),
						(z.onabort = () => {
							(console.log(`Upload aborted for ${S.data.finalName}`),
								w.push({ error: z.responseText || 'Request aborted', ...S }),
								U(!1));
						}),
						z.send(S.file));
				})
					.then(async (U) => {
						if (U === !1) {
							delete a()[v(S.data.finalName)];
							return;
						}
						const z = at.params.path
								? `${at.params.path}/${v(S.data.finalName)}`
								: v(S.data.finalName),
							{ data: I } = await si.GET('/api/v1/storage/objects/item', {
								params: { query: { item: z } }
							});
						if (I?.size && I.size > 0) {
							((I.key = v(I.key)), vn(Gi, (kt(s)[v(S.data.finalName)] = I), kt(s)));
							const V = Array.from(i()).indexOf(S.file);
							V > -1 && h(V);
						}
					})
					.catch(() => {
						delete a()[v(S.data.finalName)];
					});
				j.push(L);
			} catch {
				(Ut.error(`Upload failed for ${v(S.data.finalName)}.`), delete a()[v(S.data.finalName)]);
			}
		for (; j.length; ) await Promise.all(j.splice(0, o));
	}
	async function k() {
		l(!0);
		const O = [],
			j = [];
		for (const L of i()) {
			const U = L.type.startsWith('audio/');
			let z = new Map();
			if (U) {
				const q = await Wp(L);
				for (const Z of Object.keys(q)) {
					const G = q[Z];
					z.set(Z, G);
				}
			}
			const I = { key: L.name, type: L.type, folder: at.params.path ?? '', metadata: z },
				V = await gl(I)
					.then((q) => {
						if (!q.data) throw new Error('No data returned from upload endpoint');
						const Z = {
							data: {
								finalName: q.data.finalName,
								presignedUrl: q.data.presignedUrl,
								metadata: q.data.metadata
							},
							file: L
						};
						return (O.push(Z), vn(yn, (kt(a)[v(Z.data.finalName)] = 1), kt(a)), q);
					})
					.catch((q) => {
						throw (console.error(q), Ut.error('Failed to schedule files for upload.'), l(!1), q);
					});
			j.push(V);
		}
		const S = Promise.all(j).finally(async () => {
			(c(!1),
				await sn(),
				u.set([]),
				y(O).finally(() => {
					(l(!1),
						w.length > 0
							? (console.error(w), Ut.error('Failed to upload some items'))
							: Ut.success('Successfully uploaded all items'));
				}));
		});
		Ut.promise(S, {
			loading: 'Queuing files for upload',
			success: 'Files queued for upload',
			error: 'Failed to queue files for upload'
		});
	}
	var $ = A(),
		ee = b($);
	(B(
		ee,
		() => Ja,
		(O, j) => {
			j(O, {
				get open() {
					return c();
				},
				set open(S) {
					c(S);
				},
				children: (S, L) => {
					var U = A(),
						z = b(U);
					(B(
						z,
						() => Qa,
						(I, V) => {
							V(I, {
								class: 'max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl',
								children: (q, Z) => {
									var G = om(),
										re = b(G);
									B(
										re,
										() => es,
										(fe, me) => {
											me(fe, {
												children: (we, _e) => {
													var xe = im(),
														le = b(xe);
													B(
														le,
														() => ts,
														(ye, Pe) => {
															Pe(ye, {
																children: (Ce, De) => {
																	Ne();
																	var Oe = ot('Upload new files');
																	p(Ce, Oe);
																},
																$$slots: { default: !0 }
															});
														}
													);
													var ke = Q(le, 2);
													(B(
														ke,
														() => rs,
														(ye, Pe) => {
															Pe(ye, {
																children: (Ce, De) => {
																	Ne();
																	var Oe = ot(
																		"Drag n' Drop or click to select the files you want to upload."
																	);
																	p(Ce, Oe);
																},
																$$slots: { default: !0 }
															});
														}
													),
														p(we, xe));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var se = Q(re, 2),
										ie = M(se),
										ne = M(ie);
									Va(ne);
									var J = Q(ne, 2);
									nm(J, {
										onUpload: f,
										onFileRejected: g,
										get fileCount() {
											return i().length;
										},
										class: 'mb-5'
									});
									var pe = Q(J, 2),
										de = Q(pe, 2);
									(cn(
										de,
										7,
										() => Array.from(i()),
										(fe) => fe.name,
										(fe, me, we) => {
											var _e = am(),
												xe = M(_e),
												le = M(xe),
												ke = M(le),
												ye = M(ke),
												Pe = M(ye, !0);
											(E(ye), E(ke));
											var Ce = Q(ke, 2),
												De = M(Ce, !0);
											(E(Ce), E(le));
											var Oe = Q(le, 2),
												lt = M(Oe);
											(Dt(lt, {
												variant: 'outline',
												size: 'icon',
												onclick: () => {
													h(x(we));
												},
												children: (Re, Je) => {
													un(Re, {});
												},
												$$slots: { default: !0 }
											}),
												E(Oe),
												E(xe),
												E(_e),
												ze(
													(Re, Je) => {
														(ln(xe, 1, Re), He(Pe, x(me).name), He(De, Je));
													},
													[
														() =>
															on(
																he(
																	'flex place-items-center justify-between gap-3 rounded-xl border p-3'
																)
															),
														() => ti(x(me).size)
													]
												),
												p(fe, _e));
										}
									),
										E(de));
									var ve = Q(de, 2);
									(B(
										ve,
										() => Xs,
										(fe, me) => {
											me(fe, {
												class: 'fixed bottom-0 left-0 w-full border-t bg-white p-5',
												children: (we, _e) => {
													{
														let xe = P(() => i().length === 0);
														Dt(we, {
															type: 'button',
															class: 'w-full',
															get loading() {
																return l();
															},
															get disabled() {
																return x(xe);
															},
															onclick: () => k(),
															children: (le, ke) => {
																Ne();
																var ye = sm(),
																	Pe = Q(b(ye));
																{
																	var Ce = (De) => {
																		var Oe = ot();
																		(ze(() => He(Oe, `${i().length ?? ''} files`)), p(De, Oe));
																	};
																	ce(Pe, (De) => {
																		i().length > 0 && De(Ce);
																	});
																}
																p(le, ye);
															},
															$$slots: { default: !0 }
														});
													}
												},
												$$slots: { default: !0 }
											});
										}
									),
										E(ie),
										E(se),
										ze(() => {
											((ie.disabled = l()), $o(ne, at.params.path));
										}),
										hl(pe, i, (fe) => Da(u, fe)),
										p(q, G));
								},
								$$slots: { default: !0 }
							});
						}
					),
						p(S, U));
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, $),
		R(),
		n());
}
function cm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	var i = A(),
		a = b(i);
	(B(
		a,
		() => Au,
		(s, o) => {
			o(
				s,
				oe({ 'data-slot': 'dropdown-menu-group' }, () => n, {
					get ref() {
						return r();
					},
					set ref(c) {
						r(c);
					}
				})
			);
		}
	),
		p(t, i),
		R());
}
var um = N('<div><!></div>');
function dm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'inset', 'children']);
	var i = um();
	ue(i, (s) => ({ 'data-slot': 'dropdown-menu-label', 'data-inset': e.inset, class: s, ...n }), [
		() => he('px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
function fm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('bg-border -mx-1 my-1 h-px', e.class));
		B(
			a,
			() => Su,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'dropdown-menu-separator',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
const zn = (t, e) => {
	let r = () => e?.().title,
		n = () => e?.().summary;
	var i = pm(),
		a = M(i),
		s = M(a),
		o = M(s, !0);
	E(s);
	var c = Q(s, 2),
		l = M(c, !0);
	(E(c), E(a));
	var d = Q(a, 2);
	(un(d, { class: 'ml-auto' }),
		E(i),
		ze(() => {
			(He(o, r()), He(l, n()));
		}),
		p(t, i));
};
var pm = N(
		'<div class="flex items-center justify-between gap-5"><div><p class="text-sm"> </p> <p class="text-muted-foreground text-xs"> </p></div> <!></div>'
	),
	mm = N('<!> <span class="sr-only">Show Notifications</span>', 1),
	hm = N('<!> <!> <!>', 1),
	gm = N('<!> <!>', 1);
function vm(t, e) {
	(D(e, !1),
		vl(),
		ns(t, {
			children: (r, n) => {
				var i = gm(),
					a = b(i);
				{
					let o = Oo(() => Vo({ variant: 'outline', size: 'icon' }));
					is(a, {
						get class() {
							return x(o);
						},
						title: 'Show notifications',
						children: (c, l) => {
							var d = mm(),
								u = b(d);
							(Ml(u, { class: 'h-[1.2rem] w-[1.2rem]' }), Ne(2), p(c, d));
						},
						$$slots: { default: !0 }
					});
				}
				var s = Q(a, 2);
				(as(s, {
					align: 'end',
					children: (o, c) => {
						var l = hm(),
							d = b(l);
						kr(d, {
							children: (h, g) => {
								zn(h, () => ({
									title: 'Alert 1',
									summary: 'An example of what a notification can be'
								}));
							},
							$$slots: { default: !0 }
						});
						var u = Q(d, 2);
						kr(u, {
							children: (h, g) => {
								zn(h, () => ({
									title: 'Alert 2',
									summary: 'An example of what a notification can be'
								}));
							},
							$$slots: { default: !0 }
						});
						var f = Q(u, 2);
						(kr(f, {
							children: (h, g) => {
								zn(h, () => ({
									title: 'Alert 3',
									summary: 'An example of what a notification can be'
								}));
							},
							$$slots: { default: !0 }
						}),
							p(o, l));
					},
					$$slots: { default: !0 }
				}),
					p(r, i));
			},
			$$slots: { default: !0 }
		}),
		R());
}
var xm = N('<nav><!></nav>');
function ym(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = xm();
	ue(i, () => ({ 'data-slot': 'breadcrumb', class: e.class, 'aria-label': 'breadcrumb', ...n }));
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var bm = N('<li><!></li>');
function Ia(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = bm();
	ue(i, (s) => ({ 'data-slot': 'breadcrumb-item', class: s, ...n }), [
		() => he('text-foreground inline-flex items-center gap-1.5 text-base', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var wm = N('<a><!></a>');
function Ea(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'href', 3, void 0),
		i = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'href', 'child', 'children']);
	const a = P(() => ({
		'data-slot': 'breadcrumb-link',
		class: he('hover:text-foreground transition-colors', e.class),
		href: n(),
		...i
	}));
	var s = A(),
		o = b(s);
	{
		var c = (d) => {
				var u = A(),
					f = b(u);
				(F(
					f,
					() => e.child,
					() => ({ props: x(a) })
				),
					p(d, u));
			},
			l = (d) => {
				var u = wm();
				ue(u, () => ({ ...x(a) }));
				var f = M(u);
				(F(f, () => e.children ?? te),
					E(u),
					$e(
						u,
						(h) => r(h),
						() => r()
					),
					p(d, u));
			};
		ce(o, (d) => {
			e.child ? d(c) : d(l, !1);
		});
	}
	(p(t, s), R());
}
var _m = N('<ol><!></ol>');
function Tm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = _m();
	ue(i, (s) => ({ 'data-slot': 'breadcrumb-list', class: s, ...n }), [
		() =>
			he(
				'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
				e.class
			)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var Am = N('<li><!></li>');
function km(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = Am();
	ue(
		i,
		(c) => ({
			'data-slot': 'breadcrumb-separator',
			role: 'presentation',
			'aria-hidden': 'true',
			class: c,
			...n
		}),
		[() => he('[&>svg]:size-3.5', e.class)]
	);
	var a = M(i);
	{
		var s = (c) => {
				var l = A(),
					d = b(l);
				(F(d, () => e.children ?? te), p(c, l));
			},
			o = (c) => {
				Ol(c, {});
			};
		ce(a, (c) => {
			e.children ? c(s) : c(o, !1);
		});
	}
	(E(i),
		$e(
			i,
			(c) => r(c),
			() => r()
		),
		p(t, i),
		R());
}
function Sm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() =>
			he(
				'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
				e.class
			)
		);
		B(
			a,
			() => _u,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'separator',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
const Pm = 768;
class Cm extends xl {
	constructor(e = Pm) {
		super(`max-width: ${e - 1}px`);
	}
}
const Im = 'sidebar:state',
	Em = 60 * 60 * 24 * 7,
	Mm = '16rem',
	Om = '18rem',
	Fm = '3rem',
	Dm = 'b';
class Rm {
	props;
	#e = P(() => this.props.open());
	get open() {
		return x(this.#e);
	}
	set open(e) {
		K(this.#e, e);
	}
	#t = Le(!1);
	get openMobile() {
		return x(this.#t);
	}
	set openMobile(e) {
		K(this.#t, e, !0);
	}
	setOpen;
	#r;
	#n = P(() => (this.open ? 'expanded' : 'collapsed'));
	get state() {
		return x(this.#n);
	}
	set state(e) {
		K(this.#n, e);
	}
	constructor(e) {
		((this.setOpen = e.setOpen), (this.#r = new Cm()), (this.props = e));
	}
	get isMobile() {
		return this.#r.current;
	}
	handleShortcutKeydown = (e) => {
		e.key === Dm && (e.metaKey || e.ctrlKey) && (e.preventDefault(), this.toggle());
	};
	setOpenMobile = (e) => {
		this.openMobile = e;
	};
	toggle = () =>
		this.#r.current
			? ((this.openMobile = !this.openMobile), this.openMobile)
			: this.setOpen(!this.open);
}
const go = 'scn-sidebar';
function Nm(t) {
	return Do(Symbol.for(go), new Rm(t));
}
function fn() {
	return Fo(Symbol.for(go));
}
function Bm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() =>
			he(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				e.class
			)
		);
		B(
			a,
			() => Jo,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'sheet-overlay',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
const zm = Xa({
	base: 'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
	variants: {
		side: {
			top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
			bottom:
				'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
			left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
			right:
				'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm'
		}
	},
	defaultVariants: { side: 'right' }
});
var Lm = N('<!> <span class="sr-only">Close</span>', 1),
	$m = N('<!> <!>', 1),
	Um = N('<!> <!>', 1);
function jm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'side', 3, 'right'),
		i = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'side',
			'portalProps',
			'children'
		]);
	var a = A(),
		s = b(a);
	(B(
		s,
		() => ci,
		(o, c) => {
			c(
				o,
				oe(() => e.portalProps, {
					children: (l, d) => {
						var u = Um(),
							f = b(u);
						Bm(f, {});
						var h = Q(f, 2);
						{
							let g = P(() => he(zm({ side: n() }), e.class));
							B(
								h,
								() => Qo,
								(w, v) => {
									v(
										w,
										oe(
											{
												'data-slot': 'sheet-content',
												get class() {
													return x(g);
												}
											},
											() => i,
											{
												get ref() {
													return r();
												},
												set ref(y) {
													r(y);
												},
												children: (y, k) => {
													var $ = $m(),
														ee = b($);
													F(ee, () => e.children ?? te);
													var O = Q(ee, 2);
													(B(
														O,
														() => el,
														(j, S) => {
															S(j, {
																class:
																	'ring-offset-background focus-visible:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none',
																children: (L, U) => {
																	var z = Lm(),
																		I = b(z);
																	(un(I, { class: 'size-4' }), Ne(2), p(L, z));
																},
																$$slots: { default: !0 }
															});
														}
													),
														p(y, $));
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							);
						}
						p(l, u);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		p(t, a),
		R());
}
function Vm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('text-muted-foreground text-sm', e.class));
		B(
			a,
			() => tl,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'sheet-description',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
var Xm = N('<div><!></div>');
function Gm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = Xm();
	ue(i, (s) => ({ 'data-slot': 'sheet-header', class: s, ...n }), [
		() => he('flex flex-col gap-1.5 p-4', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
function Hm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('text-foreground font-semibold', e.class));
		B(
			a,
			() => rl,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'sheet-title',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
const qm = nl;
var Wm = N('<div><!></div>'),
	Km = N('<!> <!>', 1),
	Ym = N('<!> <div class="flex h-full w-full flex-col"><!></div>', 1),
	Zm = N(
		'<div class="text-sidebar-foreground group peer hidden md:block" data-slot="sidebar"><div data-slot="sidebar-gap"></div> <div><div data-sidebar="sidebar" data-slot="sidebar-inner" class="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"><!></div></div></div>'
	);
function Jm(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'side', 3, 'left'),
		i = _(e, 'variant', 3, 'sidebar'),
		a = _(e, 'collapsible', 3, 'offcanvas'),
		s = H(e, [
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
	const o = fn();
	var c = A(),
		l = b(c);
	{
		var d = (f) => {
				var h = Wm();
				ue(h, (w) => ({ class: w, ...s }), [
					() =>
						he(
							'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
							e.class
						)
				]);
				var g = M(h);
				(F(g, () => e.children ?? te),
					E(h),
					$e(
						h,
						(w) => r(w),
						() => r()
					),
					p(f, h));
			},
			u = (f) => {
				var h = A(),
					g = b(h);
				{
					var w = (y) => {
							var k = A(),
								$ = b(k),
								ee = () => o.openMobile,
								O = (j) => o.setOpenMobile(j);
							(B(
								$,
								() => qm,
								(j, S) => {
									S(
										j,
										oe(
											{
												get open() {
													return ee();
												},
												set open(L) {
													O(L);
												}
											},
											() => s,
											{
												children: (L, U) => {
													var z = A(),
														I = b(z);
													(B(
														I,
														() => jm,
														(V, q) => {
															q(V, {
																'data-sidebar': 'sidebar',
																'data-slot': 'sidebar',
																'data-mobile': 'true',
																class:
																	'bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden',
																get style() {
																	return `--sidebar-width: ${Om};`;
																},
																get side() {
																	return n();
																},
																children: (Z, G) => {
																	var re = Ym(),
																		se = b(re);
																	B(
																		se,
																		() => Gm,
																		(J, pe) => {
																			pe(J, {
																				class: 'sr-only',
																				children: (de, ve) => {
																					var fe = Km(),
																						me = b(fe);
																					B(
																						me,
																						() => Hm,
																						(_e, xe) => {
																							xe(_e, {
																								children: (le, ke) => {
																									Ne();
																									var ye = ot('Sidebar');
																									p(le, ye);
																								},
																								$$slots: { default: !0 }
																							});
																						}
																					);
																					var we = Q(me, 2);
																					(B(
																						we,
																						() => Vm,
																						(_e, xe) => {
																							xe(_e, {
																								children: (le, ke) => {
																									Ne();
																									var ye = ot('Displays the mobile sidebar.');
																									p(le, ye);
																								},
																								$$slots: { default: !0 }
																							});
																						}
																					),
																						p(de, fe));
																				},
																				$$slots: { default: !0 }
																			});
																		}
																	);
																	var ie = Q(se, 2),
																		ne = M(ie);
																	(F(ne, () => e.children ?? te), E(ie), p(Z, re));
																},
																$$slots: { default: !0 }
															});
														}
													),
														p(L, z));
												},
												$$slots: { default: !0 }
											}
										)
									);
								}
							),
								p(y, k));
						},
						v = (y) => {
							var k = Zm(),
								$ = M(k),
								ee = Q($, 2);
							ue(ee, (S) => ({ 'data-slot': 'sidebar-container', class: S, ...s }), [
								() =>
									he(
										'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transform-gpu transition-[left,right,width]  duration-200 ease-linear md:flex',
										n() === 'left'
											? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
											: 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
										i() === 'floating' || i() === 'inset'
											? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
											: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
										e.class
									)
							]);
							var O = M(ee),
								j = M(O);
							(F(j, () => e.children ?? te),
								E(O),
								E(ee),
								E(k),
								$e(
									k,
									(S) => r(S),
									() => r()
								),
								ze(
									(S) => {
										(Ot(k, 'data-state', o.state),
											Ot(k, 'data-collapsible', o.state === 'collapsed' ? a() : ''),
											Ot(k, 'data-variant', i()),
											Ot(k, 'data-side', n()),
											ln($, 1, S));
									},
									[
										() =>
											on(
												he(
													'relative w-(--sidebar-width) transform-gpu bg-transparent transition-[width] duration-200 ease-linear',
													'group-data-[collapsible=offcanvas]:w-0',
													'group-data-[side=right]:rotate-180',
													i() === 'floating' || i() === 'inset'
														? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
														: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
												)
											)
									]
								),
								p(y, k));
						};
					ce(
						g,
						(y) => {
							o.isMobile ? y(w) : y(v, !1);
						},
						!0
					);
				}
				p(f, h);
			};
		ce(l, (f) => {
			a() === 'none' ? f(d) : f(u, !1);
		});
	}
	(p(t, c), R());
}
var Qm = N('<div><!></div>');
function eh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = Qm();
	ue(i, (s) => ({ 'data-slot': 'sidebar-content', 'data-sidebar': 'content', class: s, ...n }), [
		() =>
			he(
				'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
				e.class
			)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var th = N('<div><!></div>');
function rh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = th();
	ue(i, (s) => ({ 'data-slot': 'sidebar-footer', 'data-sidebar': 'footer', class: s, ...n }), [
		() => he('flex flex-col gap-2 p-2', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var nh = N('<div><!></div>');
function ih(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = nh();
	ue(i, (s) => ({ 'data-slot': 'sidebar-group', 'data-sidebar': 'group', class: s, ...n }), [
		() => he('relative flex w-full min-w-0 flex-col p-2', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var ah = N('<div><!></div>');
function sh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = ah();
	ue(
		i,
		(s) => ({
			'data-slot': 'sidebar-group-content',
			'data-sidebar': 'group-content',
			class: s,
			...n
		}),
		[() => he('w-full text-sm', e.class)]
	);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var oh = N('<div><!></div>');
function lh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'children', 'child', 'class']);
	const i = P(() => ({
		class: he(
			'text-sidebar-foreground/70 ring-sidebar-ring outline-hidden flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
			'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
			e.class
		),
		'data-slot': 'sidebar-group-label',
		'data-sidebar': 'group-label',
		...n
	}));
	var a = A(),
		s = b(a);
	{
		var o = (l) => {
				var d = A(),
					u = b(d);
				(F(
					u,
					() => e.child,
					() => ({ props: x(i) })
				),
					p(l, d));
			},
			c = (l) => {
				var d = oh();
				ue(d, () => ({ ...x(i) }));
				var u = M(d);
				(F(u, () => e.children ?? te),
					E(d),
					$e(
						d,
						(f) => r(f),
						() => r()
					),
					p(l, d));
			};
		ce(s, (l) => {
			e.child ? l(o) : l(c, !1);
		});
	}
	(p(t, a), R());
}
var ch = N('<div><!></div>');
function uh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = ch();
	ue(i, (s) => ({ 'data-slot': 'sidebar-header', 'data-sidebar': 'header', class: s, ...n }), [
		() => he('flex flex-col gap-2 p-2', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var dh = N('<main><!></main>');
function fh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = dh();
	ue(i, (s) => ({ 'data-slot': 'sidebar-inset', class: s, ...n }), [
		() =>
			he(
				'bg-background relative flex w-full flex-1 flex-col',
				'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
				e.class
			)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var ph = N('<ul><!></ul>');
function Li(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = ph();
	ue(i, (s) => ({ 'data-slot': 'sidebar-menu', 'data-sidebar': 'menu', class: s, ...n }), [
		() => he('flex w-full min-w-0 flex-col gap-1', e.class)
	]);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var mh = N('<div></div>'),
	hh = N('<!> <!>', 1);
function gh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'sideOffset', 3, 0),
		i = _(e, 'side', 3, 'top'),
		a = H(e, [
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
	var s = A(),
		o = b(s);
	(B(
		o,
		() => ci,
		(c, l) => {
			l(c, {
				children: (d, u) => {
					var f = A(),
						h = b(f);
					{
						let g = P(() =>
							he(
								'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--bits-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
								e.class
							)
						);
						B(
							h,
							() => ed,
							(w, v) => {
								v(
									w,
									oe(
										{
											'data-slot': 'tooltip-content',
											get sideOffset() {
												return n();
											},
											get side() {
												return i();
											},
											get class() {
												return x(g);
											}
										},
										() => a,
										{
											get ref() {
												return r();
											},
											set ref(y) {
												r(y);
											},
											children: (y, k) => {
												var $ = hh(),
													ee = b($);
												F(ee, () => e.children ?? te);
												var O = Q(ee, 2);
												{
													const j = (S, L) => {
														let U = () => L?.().props;
														var z = mh();
														(ue(z, (I) => ({ class: I, ...U() }), [
															() =>
																he(
																	'bg-primary z-50 size-2.5 rotate-45 rounded-[2px]',
																	'data-[side=top]:translate-x-1/2 data-[side=top]:translate-y-[calc(-50%_+_2px)]',
																	'data-[side=bottom]:translate-x-1/2 data-[side=bottom]:-translate-y-[calc(-50%_+_1px)]',
																	'data-[side=right]:translate-x-[calc(50%_+_2px)] data-[side=right]:translate-y-1/2',
																	'data-[side=left]:translate-y-[calc(50%_-_3px)]',
																	e.arrowClasses
																)
														]),
															p(S, z));
													};
													B(
														O,
														() => nd,
														(S, L) => {
															L(S, { child: j, $$slots: { child: !0 } });
														}
													);
												}
												p(y, $);
											},
											$$slots: { default: !0 }
										}
									)
								);
							}
						);
					}
					p(d, f);
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, s),
		R());
}
function vh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref']);
	var i = A(),
		a = b(i);
	(B(
		a,
		() => rd,
		(s, o) => {
			o(
				s,
				oe({ 'data-slot': 'tooltip-trigger' }, () => n, {
					get ref() {
						return r();
					},
					set ref(c) {
						r(c);
					}
				})
			);
		}
	),
		p(t, i),
		R());
}
const xh = Zu,
	yh = id,
	bh = Xa({
		base: 'peer/menu-button outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium data-[active=true]:text-primary [&>span:last-child]:truncate [&>svg]:shrink-0',
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
var wh = N('<button><!></button>'),
	_h = N('<!> <!>', 1);
function $i(t, e) {
	D(e, !0);
	const r = (g, w) => {
		let v = () => w?.().props;
		var y = A();
		const k = P(() => Ve(x(l), v()));
		var $ = b(y);
		{
			var ee = (j) => {
					var S = A(),
						L = b(S);
					(F(
						L,
						() => e.child,
						() => ({ props: x(k) })
					),
						p(j, S));
				},
				O = (j) => {
					var S = wh();
					ue(S, () => ({ ...x(k) }));
					var L = M(S);
					(F(L, () => e.children ?? te),
						E(S),
						$e(
							S,
							(U) => n(U),
							() => n()
						),
						p(j, S));
				};
			ce($, (j) => {
				e.child ? j(ee) : j(O, !1);
			});
		}
		p(g, y);
	};
	let n = _(e, 'ref', 15, null),
		i = _(e, 'variant', 3, 'default'),
		a = _(e, 'size', 3, 'default'),
		s = _(e, 'isActive', 3, !1),
		o = H(e, [
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
	const c = fn(),
		l = P(() => ({
			class: he(bh({ variant: i(), size: a() }), e.class),
			'data-slot': 'sidebar-menu-button',
			'data-sidebar': 'menu-button',
			'data-size': a(),
			'data-active': s(),
			...o
		}));
	var d = A(),
		u = b(d);
	{
		var f = (g) => {
				r(g, () => ({}));
			},
			h = (g) => {
				var w = A(),
					v = b(w);
				(B(
					v,
					() => xh,
					(y, k) => {
						k(y, {
							children: ($, ee) => {
								var O = _h(),
									j = b(O);
								{
									const L = (U, z) => {
										let I = () => z?.().props;
										r(U, () => ({ props: I() }));
									};
									B(
										j,
										() => vh,
										(U, z) => {
											z(U, { child: L, $$slots: { child: !0 } });
										}
									);
								}
								var S = Q(j, 2);
								{
									let L = P(() => c.state !== 'collapsed' || c.isMobile);
									B(
										S,
										() => gh,
										(U, z) => {
											z(
												U,
												oe(
													{
														side: 'right',
														align: 'center',
														get hidden() {
															return x(L);
														}
													},
													() => e.tooltipContentProps,
													{
														children: (I, V) => {
															var q = A(),
																Z = b(q);
															{
																var G = (se) => {
																		var ie = ot();
																		(ze(() => He(ie, e.tooltipContent)), p(se, ie));
																	},
																	re = (se) => {
																		var ie = A(),
																			ne = b(ie);
																		{
																			var J = (pe) => {
																				var de = A(),
																					ve = b(de);
																				(F(ve, () => e.tooltipContent), p(pe, de));
																			};
																			ce(
																				ne,
																				(pe) => {
																					e.tooltipContent && pe(J);
																				},
																				!0
																			);
																		}
																		p(se, ie);
																	};
																ce(Z, (se) => {
																	typeof e.tooltipContent == 'string' ? se(G) : se(re, !1);
																});
															}
															p(I, q);
														},
														$$slots: { default: !0 }
													}
												)
											);
										}
									);
								}
								p($, O);
							},
							$$slots: { default: !0 }
						});
					}
				),
					p(g, w));
			};
		ce(u, (g) => {
			e.tooltipContent ? g(h, !1) : g(f);
		});
	}
	(p(t, d), R());
}
var Th = N('<li><!></li>');
function Ui(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var i = Th();
	ue(
		i,
		(s) => ({ 'data-slot': 'sidebar-menu-item', 'data-sidebar': 'menu-item', class: s, ...n }),
		[() => he('group/menu-item relative', e.class)]
	);
	var a = M(i);
	(F(a, () => e.children ?? te),
		E(i),
		$e(
			i,
			(s) => r(s),
			() => r()
		),
		p(t, i),
		R());
}
var Ah = N('<div><!></div>');
function kh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'open', 15, !0),
		i = _(e, 'onOpenChange', 3, () => {}),
		a = H(e, [
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
	const s = Nm({
		open: () => n(),
		setOpen: (l) => {
			(n(l), i()(l), (document.cookie = `${Im}=${n()}; path=/; max-age=${Em}`));
		}
	});
	Co(() => {
		s.setOpenMobile(!1);
	});
	var o = A();
	Jr('keydown', Ro, function (...l) {
		s.handleShortcutKeydown?.apply(this, l);
	});
	var c = b(o);
	(B(
		c,
		() => yh,
		(l, d) => {
			d(l, {
				delayDuration: 0,
				children: (u, f) => {
					var h = Ah();
					ue(
						h,
						(w) => ({
							'data-slot': 'sidebar-wrapper',
							style: `--sidebar-width: ${Mm}; --sidebar-width-icon: ${Fm}; ${e.style ?? ''}`,
							class: w,
							...a
						}),
						[
							() =>
								he(
									'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
									e.class
								)
						]
					);
					var g = M(h);
					(F(g, () => e.children ?? te),
						E(h),
						$e(
							h,
							(w) => r(w),
							() => r()
						),
						p(u, h));
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, o),
		R());
}
var Sh = N('<button><!> <span class="sr-only">Toggle Sidebar</span></button>');
function Ph(t, e) {
	(D(e, !0), _(e, 'ref', 11, null));
	let r = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'onclick']);
	const n = fn();
	var i = Sh(),
		a = (o) => {
			(e.onclick?.(o), n.toggle());
		};
	ue(
		i,
		(o) => ({
			'data-sidebar': 'trigger',
			'data-slot': 'sidebar-trigger',
			variant: 'ghost',
			size: 'icon',
			class: o,
			type: 'button',
			onclick: a,
			...r
		}),
		[() => he('size-5', e.class)]
	);
	var s = M(i);
	(jl(s, { class: 'h-5 w-5' }), Ne(2), E(i), p(t, i), R());
}
var Ch = N('<!> <!>', 1),
	Ih = N('<!> <span class="hidden md:block">New Folder</span>', 1),
	Eh = N('<!> <span class="hidden md:block">Upload</span>', 1),
	Mh = N('<!> <span class="hidden md:block">Uploading</span>', 1),
	Oh = N(
		'<header class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"><div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6"><!> <!> <!> <div class="ml-auto flex items-center gap-2"><!> <div class="flex items-center gap-2"><!> <!></div></div></div></header> <!> <!>',
		1
	);
function Fh(t, e) {
	D(e, !0);
	const [r, n] = an(),
		i = () => pr(hs, '$title', r);
	let a = Le(!1),
		s = _(e, 'newFolderOpen', 15, !1),
		o = _(e, 'uploadOpen', 15, !1);
	var c = Oh(),
		l = b(c),
		d = M(l),
		u = M(d);
	B(
		u,
		() => Ph,
		(O, j) => {
			j(O, { class: '-ml-1' });
		}
	);
	var f = Q(u, 2);
	Sm(f, { orientation: 'vertical', class: 'mx-2 data-[orientation=vertical]:h-4' });
	var h = Q(f, 2);
	B(
		h,
		() => ym,
		(O, j) => {
			j(O, {
				children: (S, L) => {
					var U = A(),
						z = b(U);
					(B(
						z,
						() => Tm,
						(I, V) => {
							V(I, {
								children: (q, Z) => {
									var G = A(),
										re = b(G);
									{
										var se = (ne) => {
												var J = A(),
													pe = b(J);
												(cn(
													pe,
													17,
													() => at.data.crumbs,
													Uo,
													(de, ve) => {
														var fe = Ch();
														const me = P(() => at.data.crumbs.indexOf(x(ve)));
														var we = b(fe);
														{
															var _e = (le) => {
																var ke = A(),
																	ye = b(ke);
																(B(
																	ye,
																	() => km,
																	(Pe, Ce) => {
																		Ce(Pe, {});
																	}
																),
																	p(le, ke));
															};
															ce(we, (le) => {
																x(me) !== at.data.crumbs.length && x(me) !== 0 && le(_e);
															});
														}
														var xe = Q(we, 2);
														(B(
															xe,
															() => Ia,
															(le, ke) => {
																ke(le, {
																	children: (ye, Pe) => {
																		var Ce = A(),
																			De = b(Ce);
																		(B(
																			De,
																			() => Ea,
																			(Oe, lt) => {
																				lt(Oe, {
																					get href() {
																						return x(ve).href;
																					},
																					children: (Re, Je) => {
																						Ne();
																						var Ke = ot();
																						(ze(() => He(Ke, x(ve).title)), p(Re, Ke));
																					},
																					$$slots: { default: !0 }
																				});
																			}
																		),
																			p(ye, Ce));
																	},
																	$$slots: { default: !0 }
																});
															}
														),
															p(de, fe));
													}
												),
													p(ne, J));
											},
											ie = (ne) => {
												var J = A(),
													pe = b(J);
												(B(
													pe,
													() => Ia,
													(de, ve) => {
														ve(de, {
															children: (fe, me) => {
																var we = A(),
																	_e = b(we);
																(B(
																	_e,
																	() => Ea,
																	(xe, le) => {
																		le(xe, {
																			children: (ke, ye) => {
																				Ne();
																				var Pe = ot();
																				(ze(() => He(Pe, i())), p(ke, Pe));
																			},
																			$$slots: { default: !0 }
																		});
																	}
																),
																	p(fe, we));
															},
															$$slots: { default: !0 }
														});
													}
												),
													p(ne, J));
											};
										ce(re, (ne) => {
											at.data.crumbs ? ne(se) : ne(ie, !1);
										});
									}
									p(q, G);
								},
								$$slots: { default: !0 }
							});
						}
					),
						p(S, U));
				},
				$$slots: { default: !0 }
			});
		}
	);
	var g = Q(h, 2),
		w = M(g);
	vm(w, {});
	var v = Q(w, 2),
		y = M(v);
	Dt(y, {
		variant: 'outline',
		type: 'button',
		onclick: () => {
			s(!0);
		},
		children: (O, j) => {
			var S = Ih(),
				L = b(S);
			(Nl(L, { class: 'h-[1.2rem] w-[1.2rem]' }), Ne(2), p(O, S));
		},
		$$slots: { default: !0 }
	});
	var k = Q(y, 2);
	(Dt(k, {
		variant: 'default',
		type: 'button',
		get loading() {
			return x(a);
		},
		onclick: () => {
			o(!0);
		},
		children: (O, j) => {
			var S = A(),
				L = b(S);
			{
				var U = (I) => {
						var V = Eh(),
							q = b(V);
						(Ki(q, { class: 'h-[1.2rem] w-[1.2rem]' }), Ne(2), p(I, V));
					},
					z = (I) => {
						var V = Mh(),
							q = b(V);
						(Ki(q, { class: 'h-[1.2rem] w-[1.2rem] lg:hidden' }), Ne(2), p(I, V));
					};
				ce(L, (I) => {
					x(a) ? I(z, !1) : I(U);
				});
			}
			p(O, S);
		},
		$$slots: { default: !0 }
	}),
		E(v),
		E(g),
		E(d),
		E(l));
	var $ = Q(l, 2);
	cd($, {
		get open() {
			return s();
		},
		set open(O) {
			s(O);
		}
	});
	var ee = Q($, 2);
	(lm(ee, {
		get open() {
			return o();
		},
		set open(O) {
			o(O);
		},
		get loading() {
			return x(a);
		},
		set loading(O) {
			K(a, O, !0);
		}
	}),
		p(t, c),
		R(),
		n());
}
var Dh = N(
	'<div class="bottom-drawer lg:bottom-drawer-lg bg-sidebar/50 fixed right-5 bottom-5 rounded-xl border p-3 backdrop-blur-sm"><div class="mb-2 flex items-center justify-between"><p class="font-medium"> </p> <!></div> <div class="overflow-x-auto"><!></div></div>'
);
function Rh(t, e) {
	D(e, !0);
	let r = _(e, 'open', 15, !1),
		n = _(e, 'showCloseButton', 3, !0);
	var i = A(),
		a = b(i);
	{
		var s = (o) => {
			var c = Dh(),
				l = M(c),
				d = M(l),
				u = M(d, !0);
			E(d);
			var f = Q(d, 2);
			{
				var h = (v) => {
					Dt(v, {
						variant: 'ghost',
						title: 'Close',
						onclick: () => {
							if (e.callback) return e.callback();
							r(!1);
						},
						children: (y, k) => {
							un(y, {});
						},
						$$slots: { default: !0 }
					});
				};
				ce(f, (v) => {
					n() && v(h);
				});
			}
			E(l);
			var g = Q(l, 2),
				w = M(g);
			(F(w, () => e.children), E(g), E(c), ze(() => He(u, e.title)), cl(3, c, () => ul), p(o, c));
		};
		ce(a, (o) => {
			r() && o(s);
		});
	}
	(p(t, i), R());
}
function Nh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'sideOffset', 3, 4),
		i = _(e, 'align', 3, 'center'),
		a = H(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'class',
			'sideOffset',
			'align',
			'portalProps'
		]);
	var s = A(),
		o = b(s);
	(B(
		o,
		() => ci,
		(c, l) => {
			l(
				c,
				oe(() => e.portalProps, {
					children: (d, u) => {
						var f = A(),
							h = b(f);
						{
							let g = P(() =>
								he(
									'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--bits-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
									e.class
								)
							);
							B(
								h,
								() => Iu,
								(w, v) => {
									v(
										w,
										oe(
											{
												'data-slot': 'popover-content',
												get sideOffset() {
													return n();
												},
												get align() {
													return i();
												},
												get class() {
													return x(g);
												}
											},
											() => a,
											{
												get ref() {
													return r();
												},
												set ref(y) {
													r(y);
												}
											}
										)
									);
								}
							);
						}
						p(d, f);
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		p(t, s),
		R());
}
function Bh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('', e.class));
		B(
			a,
			() => Mu,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'popover-trigger',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
const zh = Ou;
var Lh = N(
	'<div data-slot="progress-indicator" class="bg-primary h-full w-full flex-1 transition-all"></div>'
);
function $h(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'max', 3, 100),
		i = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'max', 'value']);
	var a = A(),
		s = b(a);
	{
		let o = P(() => he('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', e.class));
		B(
			s,
			() => Nu,
			(c, l) => {
				l(
					c,
					oe(
						{
							'data-slot': 'progress',
							get class() {
								return x(o);
							},
							get value() {
								return e.value;
							},
							get max() {
								return n();
							}
						},
						() => i,
						{
							get ref() {
								return r();
							},
							set ref(d) {
								r(d);
							},
							children: (d, u) => {
								var f = Lh();
								(ze(() =>
									jo(f, `transform: translateX(-${100 - (100 * (e.value ?? 0)) / (n() ?? 1)}%)`)
								),
									p(d, f));
							},
							$$slots: { default: !0 }
						}
					)
				);
			}
		);
	}
	(p(t, a), R());
}
var Uh = N('<span data-slot="slider-track"><!></span> <!>', 1);
function jh(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = _(e, 'value', 15),
		i = _(e, 'orientation', 3, 'horizontal'),
		a = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'value', 'orientation', 'class']);
	var s = A(),
		o = b(s);
	{
		const c = (d, u) => {
			let f = () => u?.().thumbs;
			var h = Uh(),
				g = b(h),
				w = M(g);
			{
				let y = P(() =>
					he(
						'bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
					)
				);
				B(
					w,
					() => qu,
					(k, $) => {
						$(k, {
							'data-slot': 'slider-range',
							get class() {
								return x(y);
							}
						});
					}
				);
			}
			E(g);
			var v = Q(g, 2);
			(cn(
				v,
				16,
				f,
				(y) => y,
				(y, k) => {
					var $ = A(),
						ee = b($);
					(B(
						ee,
						() => Ku,
						(O, j) => {
							j(O, {
								'data-slot': 'slider-thumb',
								get index() {
									return k;
								},
								class:
									'border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50'
							});
						}
					),
						p(y, $));
				}
			),
				ze(
					(y) => {
						(Ot(g, 'data-orientation', i()), ln(g, 1, y));
					},
					[
						() =>
							on(
								he(
									'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5'
								)
							)
					]
				),
				p(d, h));
		};
		let l = P(() =>
			he(
				'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
				e.class
			)
		);
		B(
			o,
			() => Gu,
			(d, u) => {
				u(
					d,
					oe(
						{
							'data-slot': 'slider',
							get orientation() {
								return i();
							},
							get class() {
								return x(l);
							}
						},
						() => a,
						{
							get ref() {
								return r();
							},
							set ref(f) {
								r(f);
							},
							get value() {
								return n();
							},
							set value(f) {
								n(f);
							},
							children: c,
							$$slots: { default: !0 }
						}
					)
				);
			}
		);
	}
	(p(t, s), R());
}
var Vh = N('<!> <!>', 1),
	Xh = N(
		'<div class="flex w-full items-center gap-2"><div class="flex items-center justify-between gap-2"><!> <p class="text-xs text-nowrap"> </p></div> <!> <!></div> <audio id="music-player" class="sr-only w-full rounded-none" playsinline=""></audio>',
		1
	);
function Gh(t, e) {
	D(e, !0);
	const [r, n] = an(),
		i = () => pr(Hi, '$playableMusic', r);
	function a() {
		Da(Hi, null);
	}
	let s,
		o = Le(!1),
		c = Le(0),
		l = Le(0),
		d = Le(1);
	Ua(() => {
		const h = i();
		s && h?.source
			? s.src !== h.source &&
				((s.src = h.source),
				s.load(),
				s.play().catch((g) => {
					(console.error('Autoplay was prevented:', g), K(o, !0));
				}))
			: s && (s.pause(), (s.src = ''), K(c, 0), K(l, 0), K(o, !0));
	});
	const u = (h) => {
		if (Number.isNaN(h)) return '00:00';
		const g = Math.floor(h / 60),
			w = Math.floor(h % 60);
		return `${g.toString().padStart(2, '0')}:${w.toString().padStart(2, '0')}`;
	};
	function f(h) {
		const { left: g, width: w } = h.currentTarget.getBoundingClientRect(),
			y = (h.clientX - g) / w;
		Number.isNaN(x(l)) || K(c, y * x(l));
	}
	{
		let h = P(() => i() !== null),
			g = P(() => i()?.title ?? '');
		Rh(t, {
			get open() {
				return x(h);
			},
			get title() {
				return x(g);
			},
			callback: () => a(),
			children: (w, v) => {
				var y = Xh(),
					k = b(y),
					$ = M(k),
					ee = M($);
				{
					var O = (V) => {
							Dt(V, {
								onclick: () => s?.play(),
								title: 'Play',
								children: (q, Z) => {
									Xl(q, {});
								},
								$$slots: { default: !0 }
							});
						},
						j = (V) => {
							Dt(V, {
								onclick: () => s?.pause(),
								title: 'Pause',
								children: (q, Z) => {
									Vl(q, {});
								},
								$$slots: { default: !0 }
							});
						};
					ce(ee, (V) => {
						x(o) ? V(O) : V(j, !1);
					});
				}
				var S = Q(ee, 2),
					L = M(S);
				(E(S), E($));
				var U = Q($, 2);
				$h(U, {
					get value() {
						return x(c);
					},
					get max() {
						return x(l);
					},
					class: 'w-full cursor-pointer',
					onclick: f
				});
				var z = Q(U, 2);
				(B(
					z,
					() => zh,
					(V, q) => {
						q(V, {
							children: (Z, G) => {
								var re = Vh(),
									se = b(re);
								B(
									se,
									() => Bh,
									(ne, J) => {
										J(ne, {
											title: 'Change Volume',
											children: (pe, de) => {
												Dt(pe, {
													variant: 'outline',
													children: (ve, fe) => {
														var me = A(),
															we = b(me);
														{
															var _e = (le) => {
																	Yl(le, {});
																},
																xe = (le) => {
																	var ke = A(),
																		ye = b(ke);
																	{
																		var Pe = (De) => {
																				Kl(De, {});
																			},
																			Ce = (De) => {
																				var Oe = A(),
																					lt = b(Oe);
																				{
																					var Re = (Ke) => {
																							Yi(Ke, {});
																						},
																						Je = (Ke) => {
																							Yi(Ke, {});
																						};
																					ce(
																						lt,
																						(Ke) => {
																							x(d) === 0 ? Ke(Re) : Ke(Je, !1);
																						},
																						!0
																					);
																				}
																				p(De, Oe);
																			};
																		ce(
																			ye,
																			(De) => {
																				x(d) > 0 && x(d) < 1 ? De(Pe) : De(Ce, !1);
																			},
																			!0
																		);
																	}
																	p(le, ke);
																};
															ce(we, (le) => {
																x(d) === 1 ? le(_e) : le(xe, !1);
															});
														}
														p(ve, me);
													},
													$$slots: { default: !0 }
												});
											},
											$$slots: { default: !0 }
										});
									}
								);
								var ie = Q(se, 2);
								(B(
									ie,
									() => Nh,
									(ne, J) => {
										J(ne, {
											class: 'w-10',
											children: (pe, de) => {
												jh(pe, {
													type: 'single',
													orientation: 'vertical',
													max: 1,
													step: 0.01,
													get value() {
														return x(d);
													},
													set value(ve) {
														K(d, ve, !0);
													}
												});
											},
											$$slots: { default: !0 }
										});
									}
								),
									p(Z, re));
							},
							$$slots: { default: !0 }
						});
					}
				),
					E(k));
				var I = Q(k, 2);
				($e(
					I,
					(V) => (s = V),
					() => s
				),
					ze(
						(V, q) => {
							(He(L, `${V ?? ''} / ${q ?? ''}`), Ot(I, 'title', i()?.title));
						},
						[() => u(x(c)), () => u(x(l))]
					),
					wl(
						I,
						() => x(o),
						(V) => K(o, V)
					),
					bl(
						I,
						() => x(c),
						(V) => K(c, V)
					),
					Tl('duration', 'durationchange', I, (V) => K(l, V)),
					_l(
						I,
						() => x(d),
						(V) => K(d, V)
					),
					p(w, y));
			},
			$$slots: { default: !0 }
		});
	}
	(R(), n());
}
var Hh = N('<a><!> <span> </span></a>'),
	qh = N('<!> <!>', 1);
function Ln(t, e) {
	D(e, !0);
	let r = H(e, ['$$slots', '$$events', '$$legacy', 'title', 'items']);
	function n(s) {
		return !!((at.url.pathname === '/' && s.url === '/') || at.url.pathname.startsWith(s.url));
	}
	var i = A(),
		a = b(i);
	(B(
		a,
		() => ih,
		(s, o) => {
			o(
				s,
				oe(() => r, {
					children: (c, l) => {
						var d = qh(),
							u = b(d);
						B(
							u,
							() => lh,
							(h, g) => {
								g(h, {
									children: (w, v) => {
										Ne();
										var y = ot();
										(ze(() => He(y, e.title)), p(w, y));
									},
									$$slots: { default: !0 }
								});
							}
						);
						var f = Q(u, 2);
						(B(
							f,
							() => sh,
							(h, g) => {
								g(h, {
									children: (w, v) => {
										var y = A(),
											k = b(y);
										(B(
											k,
											() => Li,
											($, ee) => {
												ee($, {
													children: (O, j) => {
														var S = A(),
															L = b(S);
														{
															var U = (z) => {
																var I = A(),
																	V = b(I);
																(cn(
																	V,
																	17,
																	() => e.items,
																	(q) => q.title,
																	(q, Z) => {
																		var G = A();
																		const re = P(() => x(Z).icon);
																		var se = b(G);
																		(B(
																			se,
																			() => Ui,
																			(ie, ne) => {
																				ne(ie, {
																					children: (J, pe) => {
																						var de = A(),
																							ve = b(de);
																						{
																							const fe = (we, _e) => {
																								let xe = () => _e?.().props;
																								var le = Hh();
																								ue(
																									le,
																									(Ce) => ({
																										href: x(Z).url,
																										...xe(),
																										class: Ce,
																										title: x(Z).title
																									}),
																									[
																										() =>
																											he(
																												xe().class,
																												x(Z).accentColor === 'indigo'
																													? 'data-[active=true]:text-indigo-500'
																													: '',
																												x(Z).accentColor === 'orange'
																													? 'data-[active=true]:text-orange-500'
																													: '',
																												x(Z).accentColor === 'pink'
																													? 'data-[active=true]:text-pink-500'
																													: '',
																												x(Z).accentColor === 'green'
																													? 'data-[active=true]:text-green-500'
																													: ''
																											)
																									]
																								);
																								var ke = M(le);
																								{
																									let Ce = P(() =>
																										he(
																											'h-4.5 w-4.5',
																											x(Z).accentColor === 'indigo'
																												? 'text-indigo-500'
																												: '',
																											x(Z).accentColor === 'orange'
																												? 'text-orange-500'
																												: '',
																											x(Z).accentColor === 'pink'
																												? 'text-pink-500'
																												: '',
																											x(Z).accentColor === 'green'
																												? 'text-green-500'
																												: ''
																										)
																									);
																									B(
																										ke,
																										() => x(re),
																										(De, Oe) => {
																											Oe(De, {
																												get class() {
																													return x(Ce);
																												}
																											});
																										}
																									);
																								}
																								var ye = Q(ke, 2),
																									Pe = M(ye, !0);
																								(E(ye),
																									E(le),
																									ze(() => He(Pe, x(Z).title)),
																									p(we, le));
																							};
																							let me = P(() => n(x(Z)));
																							B(
																								ve,
																								() => $i,
																								(we, _e) => {
																									_e(we, {
																										get isActive() {
																											return x(me);
																										},
																										child: fe,
																										$$slots: { child: !0 }
																									});
																								}
																							);
																						}
																						p(J, de);
																					},
																					$$slots: { default: !0 }
																				});
																			}
																		),
																			p(q, G));
																	}
																),
																	p(z, I));
															};
															ce(L, (z) => {
																e.items && e.items.length > 0 && z(U);
															});
														}
														p(O, S);
													},
													$$slots: { default: !0 }
												});
											}
										),
											p(w, y));
									},
									$$slots: { default: !0 }
								});
							}
						),
							p(c, d));
					},
					$$slots: { default: !0 }
				})
			);
		}
	),
		p(t, i),
		R());
}
function Ma(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('relative flex size-8 shrink-0 overflow-hidden rounded-full', e.class));
		B(
			a,
			() => du,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'avatar',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
function Oa(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() =>
			he('bg-muted flex size-full items-center justify-center rounded-full', e.class)
		);
		B(
			a,
			() => hu,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'avatar-fallback',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
function Fa(t, e) {
	D(e, !0);
	let r = _(e, 'ref', 15, null),
		n = H(e, ['$$slots', '$$events', '$$legacy', 'ref', 'class']);
	var i = A(),
		a = b(i);
	{
		let s = P(() => he('aspect-square size-full', e.class));
		B(
			a,
			() => pu,
			(o, c) => {
				c(
					o,
					oe(
						{
							'data-slot': 'avatar-image',
							get class() {
								return x(s);
							}
						},
						() => n,
						{
							get ref() {
								return r();
							},
							set ref(l) {
								r(l);
							}
						}
					)
				);
			}
		);
	}
	(p(t, i), R());
}
var Wh = N('<!> <!>', 1),
	Kh = N(
		'<!> <div class="grid flex-1 text-left text-sm leading-tight"><span class="truncate font-medium"> </span> <span class="text-muted-foreground truncate text-xs"> </span></div> <!>',
		1
	),
	Yh = N('<!> <!>', 1),
	Zh = N(
		'<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"><!> <div class="grid flex-1 text-left text-sm leading-tight"><span class="truncate font-medium"> </span> <span class="text-muted-foreground truncate text-xs"> </span></div></div>'
	),
	Jh = N('<a><!> <span>Account</span></a>'),
	Qh = N('<!> Sign out', 1),
	eg = N('<!> <!> <!> <!>', 1),
	tg = N('<!> <!>', 1);
function rg(t, e) {
	D(e, !0);
	const r = fn();
	async function n() {
		const { error: o } = await si.POST('/api/v1/auth/sign-out');
		return o ? (console.error(o), !1) : (await za(it('/auth/sign-in'), { invalidateAll: !0 }), !0);
	}
	async function i() {
		Ut.promise(n, {
			loading: 'Signing you out',
			success: 'You were signed out',
			error: 'Failed to sign you out'
		});
	}
	var a = A(),
		s = b(a);
	(B(
		s,
		() => Li,
		(o, c) => {
			c(o, {
				children: (l, d) => {
					var u = A(),
						f = b(u);
					(B(
						f,
						() => Ui,
						(h, g) => {
							g(h, {
								children: (w, v) => {
									var y = A(),
										k = b(y);
									(B(
										k,
										() => ns,
										($, ee) => {
											ee($, {
												children: (O, j) => {
													var S = tg(),
														L = b(S);
													{
														const z = (I, V) => {
															let q = () => V?.().props;
															var Z = A(),
																G = b(Z);
															(B(
																G,
																() => $i,
																(re, se) => {
																	se(
																		re,
																		oe(q, {
																			size: 'lg',
																			class:
																				'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border',
																			children: (ie, ne) => {
																				var J = Kh(),
																					pe = b(J);
																				B(
																					pe,
																					() => Ma,
																					(xe, le) => {
																						le(xe, {
																							class: 'size-8 rounded-lg',
																							children: (ke, ye) => {
																								var Pe = Wh(),
																									Ce = b(Pe);
																								B(
																									Ce,
																									() => Fa,
																									(Oe, lt) => {
																										lt(Oe, {
																											get src() {
																												return e.user.image;
																											},
																											get alt() {
																												return e.user.name;
																											}
																										});
																									}
																								);
																								var De = Q(Ce, 2);
																								(B(
																									De,
																									() => Oa,
																									(Oe, lt) => {
																										lt(Oe, {
																											class: 'rounded-lg',
																											children: (Re, Je) => {
																												Ne();
																												var Ke = ot('NB');
																												p(Re, Ke);
																											},
																											$$slots: { default: !0 }
																										});
																									}
																								),
																									p(ke, Pe));
																							},
																							$$slots: { default: !0 }
																						});
																					}
																				);
																				var de = Q(pe, 2),
																					ve = M(de),
																					fe = M(ve, !0);
																				E(ve);
																				var me = Q(ve, 2),
																					we = M(me, !0);
																				(E(me), E(de));
																				var _e = Q(de, 2);
																				(il(_e, { class: 'ml-auto size-4' }),
																					ze(() => {
																						(He(fe, e.user.name), He(we, e.user.email));
																					}),
																					p(ie, J));
																			},
																			$$slots: { default: !0 }
																		})
																	);
																}
															),
																p(I, Z));
														};
														B(
															L,
															() => is,
															(I, V) => {
																V(I, { child: z, $$slots: { child: !0 } });
															}
														);
													}
													var U = Q(L, 2);
													{
														let z = P(() => (r.isMobile ? 'bottom' : 'right'));
														B(
															U,
															() => as,
															(I, V) => {
																V(I, {
																	class:
																		'w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg',
																	get side() {
																		return x(z);
																	},
																	align: 'end',
																	sideOffset: 4,
																	children: (q, Z) => {
																		var G = eg(),
																			re = b(G);
																		B(
																			re,
																			() => dm,
																			(J, pe) => {
																				pe(J, {
																					class: 'p-0 font-normal',
																					children: (de, ve) => {
																						var fe = Zh(),
																							me = M(fe);
																						B(
																							me,
																							() => Ma,
																							(ye, Pe) => {
																								Pe(ye, {
																									class: 'size-8 rounded-lg',
																									children: (Ce, De) => {
																										var Oe = Yh(),
																											lt = b(Oe);
																										B(
																											lt,
																											() => Fa,
																											(Je, Ke) => {
																												Ke(Je, {
																													get src() {
																														return e.user.image;
																													},
																													get alt() {
																														return e.user.name;
																													}
																												});
																											}
																										);
																										var Re = Q(lt, 2);
																										(B(
																											Re,
																											() => Oa,
																											(Je, Ke) => {
																												Ke(Je, {
																													class: 'rounded-lg',
																													children: (pn, ji) => {
																														Ne();
																														var mn = ot('CN');
																														p(pn, mn);
																													},
																													$$slots: { default: !0 }
																												});
																											}
																										),
																											p(Ce, Oe));
																									},
																									$$slots: { default: !0 }
																								});
																							}
																						);
																						var we = Q(me, 2),
																							_e = M(we),
																							xe = M(_e, !0);
																						E(_e);
																						var le = Q(_e, 2),
																							ke = M(le, !0);
																						(E(le),
																							E(we),
																							E(fe),
																							ze(() => {
																								(He(xe, e.user.name), He(ke, e.user.email));
																							}),
																							p(de, fe));
																					},
																					$$slots: { default: !0 }
																				});
																			}
																		);
																		var se = Q(re, 2);
																		B(
																			se,
																			() => fm,
																			(J, pe) => {
																				pe(J, {});
																			}
																		);
																		var ie = Q(se, 2);
																		B(
																			ie,
																			() => cm,
																			(J, pe) => {
																				pe(J, {
																					children: (de, ve) => {
																						var fe = A(),
																							me = b(fe);
																						{
																							const we = (_e, xe) => {
																								let le = () => xe?.().props;
																								var ke = Jh();
																								ue(ke, (Pe) => ({ href: Pe, ...le() }), [
																									() => it('/account')
																								]);
																								var ye = M(ke);
																								(Fl(ye, {}), Ne(2), E(ke), p(_e, ke));
																							};
																							B(
																								me,
																								() => kr,
																								(_e, xe) => {
																									xe(_e, { child: we, $$slots: { child: !0 } });
																								}
																							);
																						}
																						p(de, fe);
																					},
																					$$slots: { default: !0 }
																				});
																			}
																		);
																		var ne = Q(ie, 2);
																		(B(
																			ne,
																			() => kr,
																			(J, pe) => {
																				pe(J, {
																					onclick: () => i(),
																					children: (de, ve) => {
																						var fe = Qh(),
																							me = b(fe);
																						($l(me, {}), Ne(), p(de, fe));
																					},
																					$$slots: { default: !0 }
																				});
																			}
																		),
																			p(q, G));
																	},
																	$$slots: { default: !0 }
																});
															}
														);
													}
													p(O, S);
												},
												$$slots: { default: !0 }
											});
										}
									),
										p(w, y));
								},
								$$slots: { default: !0 }
							});
						}
					),
						p(l, u));
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, a),
		R());
}
var ng = N('<a><!> <span class="text-base font-semibold">Opendrive.</span></a>'),
	ig = N('<!> <!> <!>', 1),
	ag = N('<!> <!> <!>', 1),
	sg = N(
		'<!> <div class="flex flex-1 flex-col pb-26"><div class="main-container @container/main flex flex-1 flex-col gap-5 p-5"><!></div></div> <!>',
		1
	),
	og = N('<!> <!>', 1);
function Kg(t, e) {
	D(e, !0);
	const [r, n] = an(),
		i = () => pr(hs, '$title', r);
	let a = Le(!1),
		s = Le(!1);
	const o = {
		general: [
			{ title: 'My Drive', url: it('/browse'), icon: sl },
			{ title: 'Recent', url: it('/recent'), icon: Dl },
			{ title: 'Starred', url: it('/starred'), icon: ol },
			{ title: 'Shared', url: it('/shared'), icon: Wl },
			{ title: 'Trash', url: it('/trash'), icon: ll }
		],
		categories: [
			{
				title: 'Music',
				url: it('/categories/[category]', { category: 'music' }),
				icon: Ul,
				accentColor: 'pink'
			},
			{
				title: 'Documents',
				url: it('/categories/[category]', { category: 'documents' }),
				icon: al,
				accentColor: 'indigo'
			},
			{
				title: 'Images',
				url: it('/categories/[category]', { category: 'images' }),
				icon: Ll,
				accentColor: 'orange'
			},
			{
				title: 'Code',
				url: it('/categories/[category]', { category: 'code' }),
				icon: Rl,
				accentColor: 'green'
			}
		],
		help: [
			{ title: 'Settings', url: it('/settings'), icon: Hl },
			{ title: 'Sync', url: it('/sync'), icon: Bl },
			{ title: 'API', url: '/docs/index.html', icon: Gl }
		]
	};
	var c = A();
	Lo((d) => {
		ze(() => (No.title = `Opendrive - ${i() ?? ''}`));
	});
	var l = b(c);
	(B(
		l,
		() => kh,
		(d, u) => {
			u(d, {
				style:
					'--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);',
				children: (f, h) => {
					var g = og(),
						w = b(g);
					B(
						w,
						() => Jm,
						(y, k) => {
							k(y, {
								collapsible: 'icon',
								variant: 'inset',
								children: ($, ee) => {
									var O = ag(),
										j = b(O);
									B(
										j,
										() => uh,
										(U, z) => {
											z(U, {
												children: (I, V) => {
													var q = A(),
														Z = b(q);
													(B(
														Z,
														() => Li,
														(G, re) => {
															re(G, {
																children: (se, ie) => {
																	var ne = A(),
																		J = b(ne);
																	(B(
																		J,
																		() => Ui,
																		(pe, de) => {
																			de(pe, {
																				children: (ve, fe) => {
																					var me = A(),
																						we = b(me);
																					{
																						const _e = (xe, le) => {
																							let ke = () => le?.().props;
																							var ye = ng();
																							ue(ye, (Ce) => ({ href: Ce, ...ke() }), [
																								() => it('/')
																							]);
																							var Pe = M(ye);
																							(zl(Pe, { class: '!size-5' }),
																								Ne(2),
																								E(ye),
																								p(xe, ye));
																						};
																						B(
																							we,
																							() => $i,
																							(xe, le) => {
																								le(xe, {
																									class: 'data-[slot=sidebar-menu-button]:!p-1.5',
																									child: _e,
																									$$slots: { child: !0 }
																								});
																							}
																						);
																					}
																					p(ve, me);
																				},
																				$$slots: { default: !0 }
																			});
																		}
																	),
																		p(se, ne));
																},
																$$slots: { default: !0 }
															});
														}
													),
														p(I, q));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var S = Q(j, 2);
									B(
										S,
										() => eh,
										(U, z) => {
											z(U, {
												children: (I, V) => {
													var q = ig(),
														Z = b(q);
													Ln(Z, {
														title: 'General',
														get items() {
															return o.general;
														}
													});
													var G = Q(Z, 2);
													Ln(G, {
														title: 'Categories',
														get items() {
															return o.categories;
														}
													});
													var re = Q(G, 2);
													(Ln(re, {
														title: 'Help',
														get items() {
															return o.help;
														},
														class: 'mt-auto'
													}),
														p(I, q));
												},
												$$slots: { default: !0 }
											});
										}
									);
									var L = Q(S, 2);
									(B(
										L,
										() => rh,
										(U, z) => {
											z(U, {
												children: (I, V) => {
													var q = A(),
														Z = b(q);
													{
														var G = (re) => {
															rg(re, {
																get user() {
																	return e.data.user;
																}
															});
														};
														ce(Z, (re) => {
															e.data.user && re(G);
														});
													}
													p(I, q);
												},
												$$slots: { default: !0 }
											});
										}
									),
										p($, O));
								},
								$$slots: { default: !0 }
							});
						}
					);
					var v = Q(w, 2);
					(B(
						v,
						() => fh,
						(y, k) => {
							k(y, {
								children: ($, ee) => {
									var O = sg(),
										j = b(O);
									Fh(j, {
										get newFolderOpen() {
											return x(a);
										},
										set newFolderOpen(I) {
											K(a, I, !0);
										},
										get uploadOpen() {
											return x(s);
										},
										set uploadOpen(I) {
											K(s, I, !0);
										}
									});
									var S = Q(j, 2),
										L = M(S),
										U = M(L);
									(F(U, () => e.children), E(L), E(S));
									var z = Q(S, 2);
									(Gh(z, {}), p($, O));
								},
								$$slots: { default: !0 }
							});
						}
					),
						p(f, g));
				},
				$$slots: { default: !0 }
			});
		}
	),
		p(t, c),
		R(),
		n());
}
export {
	Gg as A,
	fo as B,
	Jn as C,
	Cd as D,
	xt as E,
	po as F,
	Pa as G,
	_d as H,
	Hg as I,
	zg as J,
	so as K,
	Nt as L,
	uo as M,
	Xg as N,
	Vg as O,
	$g as P,
	Dd as Q,
	Od as R,
	Be as S,
	Qf as T,
	Ys as U,
	Ug as V,
	Xf as W,
	Kg as X,
	Bg as _,
	ho as a,
	Id as b,
	Ae as c,
	Jt as d,
	er as e,
	Zn as f,
	tn as g,
	Ks as h,
	Er as i,
	Pd as j,
	Sd as k,
	ei as l,
	Vf as m,
	_a as n,
	ep as o,
	Wg as p,
	Ar as q,
	qg as r,
	Jf as s,
	qs as t,
	Me as u,
	Vp as v,
	Hs as w,
	Lg as x,
	Ws as y,
	kd as z
};
