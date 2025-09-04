import './1HBmZ_db.js';
import {
	h as o,
	d as p,
	i as v,
	av as A,
	L as T,
	M as z,
	O as M,
	aw as R,
	l as F,
	n as G,
	N as I,
	_ as w,
	s as y,
	e as L,
	R as O,
	a0 as P,
	au as j,
	p as q,
	ax as B,
	a as N,
	b as D,
	c as V,
	G as H,
	af as J,
	r as K,
	o as Q,
	q as U,
	u as g,
	v as X,
	ay as Y
} from './BW6z9EX9.js';
import { s as Z } from './BC_1JO3s.js';
import { a as E, e as $, i as ee } from './BPMCz5tT.js';
import { i as te, a as x } from './DzGRxXYC.js';
import { p as c, r as ae } from './Cic-IlSQ.js';
function se(u, t, m, n, _, k) {
	let h = o;
	o && p();
	var i,
		r,
		e = null;
	o && v.nodeType === A && ((e = v), p());
	var f = o ? v : u,
		s;
	(T(() => {
		const a = t() || null;
		var l = m || a === 'svg' ? R : null;
		a !== i &&
			(s &&
				(a === null
					? O(s, () => {
							((s = null), (r = null));
						})
					: a === r
						? P(s)
						: (j(s), x(!1))),
			a &&
				a !== r &&
				(s = M(() => {
					if (
						((e = o ? e : l ? document.createElementNS(l, a) : document.createElement(a)),
						F(e, e),
						n)
					) {
						o && te(a) && e.append(document.createComment(''));
						var d = o ? G(e) : e.appendChild(I());
						(o && (d === null ? w(!1) : y(d)), n(e, d));
					}
					((L.nodes_end = e), f.before(e));
				})),
			(i = a),
			i && (r = i),
			x(!0));
	}, z),
		h && (w(!0), y(f)));
}
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
 */ const re = {
	xmlns: 'http://www.w3.org/2000/svg',
	width: 24,
	height: 24,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	'stroke-width': 2,
	'stroke-linecap': 'round',
	'stroke-linejoin': 'round'
};
var oe = B('<svg><!><!></svg>');
function me(u, t) {
	q(t, !0);
	const m = c(t, 'color', 3, 'currentColor'),
		n = c(t, 'size', 3, 24),
		_ = c(t, 'strokeWidth', 3, 2),
		k = c(t, 'absoluteStrokeWidth', 3, !1),
		h = c(t, 'iconNode', 19, () => []),
		i = ae(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'name',
			'color',
			'size',
			'strokeWidth',
			'absoluteStrokeWidth',
			'iconNode',
			'children'
		]);
	var r = oe();
	E(
		r,
		(s) => ({
			...re,
			...i,
			width: n(),
			height: n(),
			stroke: m(),
			'stroke-width': s,
			class: ['lucide-icon lucide', t.name && `lucide-${t.name}`, t.class]
		}),
		[() => (k() ? (Number(_()) * 24) / Number(n()) : _())]
	);
	var e = V(r);
	$(e, 17, h, ee, (s, a) => {
		var l = X(() => Y(g(a), 2));
		let d = () => g(l)[0],
			S = () => g(l)[1];
		var b = Q(),
			C = U(b);
		(se(C, d, !0, (W, ne) => {
			E(W, () => ({ ...S() }));
		}),
			N(s, b));
	});
	var f = H(e);
	(Z(f, () => t.children ?? J), K(r), N(u, r), D());
}
export { me as I, se as e };
