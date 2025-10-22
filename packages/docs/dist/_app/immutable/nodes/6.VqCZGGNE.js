import {
	p as F,
	k as G,
	f as s,
	F as J,
	w as f,
	t as k,
	b as a,
	c as K,
	$ as L,
	g as M,
	s as x,
	J as N,
	K as R,
	e as w,
	d as u,
	r as _,
	n as O,
	a as y,
	h as Y
} from '../chunks/ZGPguNnN.js';
import '../chunks/BzFm6CDa.js';
import { p as r } from '../chunks/BT0mVCPM.js';
import { B as q, c as A } from '../chunks/BBPflcbS.js';
const C = !0,
	ot = Object.freeze(
		Object.defineProperty({ __proto__: null, prerender: C }, Symbol.toStringTag, {
			value: 'Module'
		})
	);
var D = s(
		'<p class="text-lg">The page you are looking for does not exist. Please check the URL and try again.</p>'
	),
	I = s('<p class="text-2xl text-gray-800">Not found.</p> <!>', 1),
	Q = s(
		`<p class="text-2xl text-gray-800">You don't have access.</p> <p class="text-lg">Unauthorized</p>`,
		1
	),
	V = s('<p class="max-w-3xl overflow-x-auto text-lg"> </p>'),
	W = s(
		`<p class="text-lg">Please contact the site administrator if you think this shouldn't happen.</p>`
	),
	X = s('<p class="text-2xl text-gray-800">Oops! Something went wrong.</p> <!>', 1),
	Z = s(
		'<div><div class="flex flex-col gap-5 p-5 text-center"><h1 class="text-center text-[5rem] font-bold text-gray-700"> </h1> <!></div> <!></div>'
	);
function tt(g, b) {
	F(b, !0);
	const P = G(b, 'normalHeight', 3, !1);
	var i = Z();
	J((t) => {
		L.title = 'Oops';
	});
	var h = u(i),
		m = u(h),
		j = u(m, !0);
	_(m);
	var H = x(m, 2);
	{
		var S = (t) => {
				var o = I(),
					n = x(y(o), 2);
				{
					var d = (p) => {
						var e = D();
						a(p, e);
					};
					f(n, (p) => {
						p(d, !1);
					});
				}
				a(t, o);
			},
			z = (t) => {
				var o = Y(),
					n = y(o);
				{
					var d = (e) => {
							var v = Q();
							(O(2), a(e, v));
						},
						p = (e) => {
							var v = X(),
								T = x(y(v), 2);
							{
								var U = (l) => {
										var c = V(),
											E = u(c, !0);
										(_(c), k(() => w(E, r.error?.message)), a(l, c));
									},
									$ = (l) => {
										var c = W();
										a(l, c);
									};
								f(T, (l) => {
									r.status === 403 || r.status === 401 ? l(U) : l($, !1);
								});
							}
							a(e, v);
						};
					f(
						n,
						(e) => {
							r.status >= 401 && r.status <= 403 ? e(d) : e(p, !1);
						},
						!0
					);
				}
				a(t, o);
			};
		f(H, (t) => {
			r.status === 404 ? t(S) : t(z, !1);
		});
	}
	_(h);
	var B = x(h, 2);
	(q(B, {
		href: '/',
		children: (t, o) => {
			O();
			var n = M('Go back home');
			a(t, n);
		},
		$$slots: { default: !0 }
	}),
		_(i),
		k(
			(t) => {
				(R(i, 1, t), w(j, r.status ?? 500));
			},
			[
				() =>
					N(
						A(
							'flex flex-col items-center justify-center gap-2 p-5',
							P() ? 'h-full' : 'h-screen'
						)
					)
			]
		),
		a(g, i),
		K());
}
function lt(g) {
	tt(g, { normalHeight: !0 });
}
export { lt as component, ot as universal };
