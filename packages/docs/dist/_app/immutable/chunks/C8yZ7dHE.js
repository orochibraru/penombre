import {
	p as S,
	h as C,
	a as T,
	w as y,
	x as r,
	y as p,
	b,
	c as U,
	f as W,
	o as N,
	q as X,
	d as s,
	z as j,
	A as J,
	s as I,
	r as i,
	B as O,
	t as K,
	e as Q,
	u as q,
	v as V,
	C as f,
	O as Y,
	T as Z,
	D as $,
	L as ee,
	I as te
} from './ZGPguNnN.js';
import { c as A } from './BBPflcbS.js';
var ae = W(
		'<div><div class="flex items-start gap-3"><!> <div class="flex-1"><div class="mb-1 font-semibold"> </div> <div class="[&amp;>p]:mb-2 last:[&amp;>p]:mb-0"><!></div></div></div></div>'
	),
	re = W('<blockquote><!></blockquote>');
function oe(B, n) {
	S(n, !0);
	let g = X(n, ['$$slots', '$$events', '$$legacy', 'class', 'children']),
		m = p('');
	function L(a) {
		const e = a.toLowerCase();
		return e.includes('[!note]')
			? 'note'
			: e.includes('[!tip]')
				? 'tip'
				: e.includes('[!important]')
					? 'important'
					: e.includes('[!warning]')
						? 'warning'
						: e.includes('[!caution]')
							? 'caution'
							: null;
	}
	const P = {
		note: {
			icon: te,
			label: 'Note',
			class: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
		},
		tip: {
			icon: ee,
			label: 'Tip',
			class: 'border-l-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100'
		},
		important: {
			icon: $,
			label: 'Important',
			class: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100'
		},
		warning: {
			icon: Z,
			label: 'Warning',
			class: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100'
		},
		caution: {
			icon: Y,
			label: 'Caution',
			class: 'border-l-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100'
		}
	};
	let c = p(null),
		d = p(null);
	function z(a) {
		const e = document.createTreeWalker(a, NodeFilter.SHOW_TEXT, null);
		let t;
		for (t = e.nextNode(); t; )
			(t.textContent &&
				(t.textContent = t.textContent.replace(
					/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
					''
				)),
				(t = e.nextNode()));
	}
	function _(a) {
		(f(m, a.textContent || '', !0),
			f(c, L(r(m)), !0),
			f(d, r(c) ? P[r(c)] : null, !0),
			r(c) && z(a));
	}
	var x = C(),
		E = T(x);
	{
		var M = (a) => {
				const e = J(() => r(d).icon);
				var t = ae();
				N(t, (l) => ({ class: l, ...g }), [
					() => A('mt-6 rounded-sm border-l-2 p-4 not-italic', r(d).class, n.class)
				]);
				var o = s(t),
					k = s(o);
				j(
					k,
					() => r(e),
					(l, u) => {
						u(l, { class: 'mt-0.5 size-5 shrink-0' });
					}
				);
				var h = I(k, 2),
					v = s(h),
					D = s(v, !0);
				i(v);
				var w = I(v, 2),
					F = s(w);
				{
					var G = (l) => {
						var u = C(),
							H = T(u);
						(q(H, () => n.children), b(l, u));
					};
					y(F, (l) => {
						n.children && l(G);
					});
				}
				(i(w), i(h), i(o), i(t), O(t, (l) => _?.(l)), K(() => Q(D, r(d).label)), b(a, t));
			},
			R = (a) => {
				var e = re();
				N(e, (o) => ({ ...g, class: o }), [
					() =>
						A(
							'bg-muted border-l-primary mt-6 rounded-sm border-l-2 p-5 italic',
							n.class
						)
				]);
				var t = s(e);
				(q(t, () => n.children ?? V), i(e), O(e, (o) => _?.(o)), b(a, e));
			};
		y(E, (a) => {
			r(c) && r(d) ? a(M) : a(R, !1);
		});
	}
	(b(B, x), U());
}
export { oe as B };
