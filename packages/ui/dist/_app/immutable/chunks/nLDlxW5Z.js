import { a as K, s as L } from './1HBmZ_db.js';
import { o as M } from './BHHl-vxW.js';
import {
	p as N,
	f as o,
	t as h,
	a,
	b as R,
	c as f,
	r as m,
	G as c,
	K as E,
	F as S,
	u as T,
	v as Y,
	q as y,
	o as A
} from './BW6z9EX9.js';
import { s as b } from './DzGRxXYC.js';
import { i as x } from './ClaijROu.js';
import { c as C, s as J } from './BPMCz5tT.js';
import { p as Q } from './Cic-IlSQ.js';
import { p as e } from './PJJQOX3K.js';
import { B as V } from './B00PyzgL.js';
import { r as W } from './Dd5NUPG5.js';
import { t as X } from './Dy9FI1NM.js';
import { c as Z } from './Bvsacp8G.js';
var tt = o(
		'<p class="text-lg">The page you are looking for does not exist. Please check the URL and try again.</p>'
	),
	rt = o('<p class="text-2xl text-gray-800">Not found.</p> <!>', 1),
	at = o(
		`<p class="text-2xl text-gray-800">You don't have access.</p> <p class="text-lg">Unauthorized</p>`,
		1
	),
	et = o('<p class="max-w-3xl overflow-x-auto text-lg"> </p>'),
	st = o(
		`<p class="text-lg">Please contact the site administrator if you think this shouldn't happen.</p>`
	),
	ot = o('<p class="text-2xl text-gray-800">Oops! Something went wrong.</p> <!>', 1),
	lt = o('<p class="text-muted-foreground max-w-[700px] text-center text-lg"> </p>'),
	pt = o(
		'<div><div class="flex flex-col gap-5 p-5 text-center"><h1 class="text-center text-[5rem] font-bold text-gray-700"> </h1> <!> <!></div> <!></div>'
	);
function bt(I, k) {
	N(k, !0);
	const [it, P] = K(),
		$ = Q(k, 'normalHeight', 3, !1);
	M(() => {
		L(X, 'Oops');
	});
	var u = pt(),
		g = f(u),
		d = f(g),
		B = f(d, !0);
	m(d);
	var w = c(d, 2);
	{
		var G = (t) => {
				var r = rt(),
					l = c(y(r), 2);
				{
					var i = (n) => {
						var s = tt();
						a(n, s);
					};
					x(l, (n) => {
						n(i, !1);
					});
				}
				a(t, r);
			},
			H = (t) => {
				var r = A(),
					l = y(r);
				{
					var i = (s) => {
							var _ = at();
							(E(2), a(s, _));
						},
						n = (s) => {
							var _ = ot(),
								q = c(y(_), 2);
							{
								var z = (p) => {
										var v = et(),
											F = f(v, !0);
										(m(v), h(() => b(F, e.error?.message)), a(p, v));
									},
									D = (p) => {
										var v = st();
										a(p, v);
									};
								x(q, (p) => {
									e.status === 403 || e.status === 401 ? p(z) : p(D, !1);
								});
							}
							a(s, _);
						};
					x(
						l,
						(s) => {
							e.status >= 401 && e.status <= 403 ? s(i) : s(n, !1);
						},
						!0
					);
				}
				a(t, r);
			};
		x(w, (t) => {
			e.status === 404 ? t(G) : t(H, !1);
		});
	}
	var O = c(w, 2);
	{
		var U = (t) => {
			var r = lt(),
				l = f(r);
			(m(r), h(() => b(l, `Error ID: ${e.error.errorId ?? ''}`)), a(t, r));
		};
		x(O, (t) => {
			e.error?.errorId && e.status === 500 && t(U);
		});
	}
	m(g);
	var j = c(g, 2);
	{
		let t = Y(() => W('/'));
		V(j, {
			get href() {
				return T(t);
			},
			children: (r, l) => {
				E();
				var i = S('Go back home');
				a(r, i);
			},
			$$slots: { default: !0 }
		});
	}
	(m(u),
		h(
			(t) => {
				(J(u, 1, t), b(B, e.status ?? 500));
			},
			[
				() =>
					C(Z('flex flex-col items-center justify-center gap-2 p-5', $() ? 'h-full' : 'h-screen'))
			]
		),
		a(I, u),
		R(),
		P());
}
export { bt as E };
