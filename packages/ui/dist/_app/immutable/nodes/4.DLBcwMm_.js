import '../chunks/1HBmZ_db.js';
import {
	p as f,
	b as p,
	o as x,
	q as b,
	a as u,
	af as y,
	f as j,
	t as k,
	c as e,
	G as m,
	r,
	K as w
} from '../chunks/BW6z9EX9.js';
import { s as g } from '../chunks/BC_1JO3s.js';
import { b as $ } from '../chunks/BPMCz5tT.js';
import { r as z } from '../chunks/Dd5NUPG5.js';
import { s as G, r as I } from '../chunks/Cic-IlSQ.js';
import { I as M } from '../chunks/C9yuXBdp.js';
function N(o, a) {
	f(a, !0);
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
	 */ let s = I(a, ['$$slots', '$$events', '$$legacy']);
	const d = [
		['path', { d: 'M7 2h10' }],
		['path', { d: 'M5 6h14' }],
		['rect', { width: '18', height: '12', x: '3', y: '10', rx: '2' }]
	];
	(M(
		o,
		G({ name: 'gallery-vertical-end' }, () => s, {
			get iconNode() {
				return d;
			},
			children: (t, l) => {
				var i = x(),
					n = b(i);
				(g(n, () => a.children ?? y), u(t, i));
			},
			$$slots: { default: !0 }
		})
	),
		p());
}
var q = j(
	'<div class="grid min-h-svh lg:grid-cols-2"><div class="bg-muted relative hidden lg:block"><img src="/background.png" alt="background" class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"/></div> <div class="flex flex-col gap-4 p-6 md:p-10"><div class="flex justify-center gap-2 md:justify-start"><a class="flex items-center gap-2 font-medium"><div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"><!></div> Opendrive</a></div> <div class="flex flex-1 items-center justify-center"><div class="w-full max-w-lg"><!></div></div></div></div>'
);
function E(o, a) {
	f(a, !0);
	var s = q(),
		d = m(e(s), 2),
		t = e(d),
		l = e(t),
		i = e(l),
		n = e(i);
	(N(n, { class: 'size-4' }), r(i), w(), r(l), r(t));
	var c = m(t, 2),
		v = e(c),
		h = e(v);
	(g(h, () => a.children),
		r(v),
		r(c),
		r(d),
		r(s),
		k((_) => $(l, 'href', _), [() => z('/')]),
		u(o, s),
		p());
}
export { E as component };
