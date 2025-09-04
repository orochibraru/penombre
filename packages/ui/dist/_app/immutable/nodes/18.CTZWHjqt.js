import { s as K, a as M } from '../chunks/1HBmZ_db.js';
import { o as O } from '../chunks/BHHl-vxW.js';
import {
	p as j,
	f as h,
	t as E,
	a as r,
	b as z,
	F as i,
	u as v,
	v as D,
	G as l,
	c as u,
	I as H,
	J as L,
	q as N,
	K as w,
	r as d
} from '../chunks/BW6z9EX9.js';
import { s as Q } from '../chunks/DzGRxXYC.js';
import { i as R } from '../chunks/ClaijROu.js';
import { c as _ } from '../chunks/C-vcVqpF.js';
import { c as S, s as U } from '../chunks/BPMCz5tT.js';
import { g as V } from '../chunks/BLduGpSf.js';
import { C as W, A as X, a as Y, b as Z } from '../chunks/Duew6H7Z.js';
import { B as tt } from '../chunks/B00PyzgL.js';
import { r as rt } from '../chunks/Dd5NUPG5.js';
import { t as et } from '../chunks/Dy9FI1NM.js';
import { c as st } from '../chunks/Bvsacp8G.js';
var at = h('<p><!></p>'),
	ot = h('<!> <!> <!>', 1),
	it = h(
		'<form><div class="flex flex-col items-center gap-2 text-center"><h1 class="text-2xl font-bold">Oops!</h1></div> <div><!> <!></div></form>'
	);
function At(B, C) {
	j(C, !0);
	const [lt, T] = M();
	K(et, 'Authentication Error');
	let n = L('');
	O(() => {
		const t = V();
		H(n, t || '', !0);
	});
	var a = it(),
		$ = l(u(a), 2),
		x = u($);
	_(
		x,
		() => Z,
		(t, c) => {
			c(t, {
				variant: 'destructive',
				class: 'mb-5',
				children: (g, A) => {
					var b = ot(),
						P = N(b);
					W(P, {});
					var y = l(P, 2);
					_(
						y,
						() => X,
						(f, m) => {
							m(f, {
								children: (p, F) => {
									w();
									var s = i('There was an error signing you in');
									r(p, s);
								},
								$$slots: { default: !0 }
							});
						}
					);
					var q = l(y, 2);
					(_(
						q,
						() => Y,
						(f, m) => {
							m(f, {
								children: (p, F) => {
									var s = at(),
										G = u(s);
									{
										var I = (e) => {
												var o = i();
												(E(() => Q(o, v(n))), r(e, o));
											},
											J = (e) => {
												var o = i(
													'Please verify that the configuration is correct and that you have access.'
												);
												r(e, o);
											};
										R(G, (e) => {
											v(n) ? e(I) : e(J, !1);
										});
									}
									(d(s), r(p, s));
								},
								$$slots: { default: !0 }
							});
						}
					),
						r(g, b));
				},
				$$slots: { default: !0 }
			});
		}
	);
	var k = l(x, 2);
	{
		let t = D(() => rt('/auth/sign-in'));
		tt(k, {
			class: 'w-full',
			variant: 'destructive',
			get href() {
				return v(t);
			},
			children: (c, g) => {
				w();
				var A = i('Try Again');
				r(c, A);
			},
			$$slots: { default: !0 }
		});
	}
	(d($), d(a), E((t) => U(a, 1, t), [() => S(st('flex flex-col gap-6'))]), r(B, a), z(), T());
}
export { At as component };
