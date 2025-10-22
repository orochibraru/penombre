const __vite__mapDeps = (
	i,
	m = __vite__mapDeps,
	d = m.f ||
		(m.f = [
			'../nodes/0.DijrdNxN.js',
			'../chunks/ZGPguNnN.js',
			'../chunks/CU2VXAWn.js',
			'../chunks/C00SH7Uv.js',
			'../chunks/L9BR-Aao.js',
			'../chunks/CCs0m0T5.js',
			'../chunks/XxJimDSk.js',
			'../chunks/BBPflcbS.js',
			'../chunks/PPVm8Dsz.js',
			'../chunks/BqRgMCoP.js',
			'../chunks/D0iwhpLH.js',
			'../chunks/BT0mVCPM.js',
			'../chunks/BzFm6CDa.js',
			'../assets/0.CryZGMdl.css',
			'../nodes/1.CX0M1yj8.js',
			'../nodes/2.C2XPHAgj.js',
			'../nodes/3.eN4P--c2.js',
			'../nodes/4.BQtT4yPf.js',
			'../chunks/9l8Gxslx.js',
			'../nodes/5.D9gOV9X1.js',
			'../nodes/6.VqCZGGNE.js'
		])
) => i.map((i) => d[i]);
import { _ as m } from '../chunks/PPVm8Dsz.js';
import {
	p as Z,
	k as y,
	M as $,
	N as tt,
	P as et,
	x as a,
	y as T,
	C as V,
	Q as rt,
	f as Q,
	a as u,
	w as O,
	s as at,
	b as o,
	c as ot,
	h as l,
	z as E,
	m as P,
	A as b,
	d as st,
	r as nt,
	g as it,
	t as _t,
	e as mt,
	R as ut
} from '../chunks/ZGPguNnN.js';
const bt = {};
var ct = Q(
		'<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>'
	),
	dt = Q('<!> <!>', 1);
function lt(s, t) {
	Z(t, !0);
	let r = y(t, 'components', 23, () => []),
		R = y(t, 'data_0', 3, null),
		p = y(t, 'data_1', 3, null),
		w = y(t, 'data_2', 3, null);
	($(() => t.stores.page.set(t.page)),
		tt(() => {
			(t.stores, t.page, t.constructors, r(), t.form, R(), p(), w(), t.stores.page.notify());
		}));
	let A = T(!1),
		k = T(!1),
		C = T(null);
	et(() => {
		const e = t.stores.page.subscribe(() => {
			a(A) &&
				(V(k, !0),
				rt().then(() => {
					V(C, document.title || 'untitled page', !0);
				}));
		});
		return (V(A, !0), e);
	});
	const q = b(() => t.constructors[2]);
	var j = dt(),
		M = u(j);
	{
		var B = (e) => {
				const n = b(() => t.constructors[0]);
				var i = l(),
					f = u(i);
				(E(
					f,
					() => a(n),
					(_, c) => {
						P(
							c(_, {
								get data() {
									return R();
								},
								get form() {
									return t.form;
								},
								get params() {
									return t.page.params;
								},
								children: (v, gt) => {
									var z = l(),
										J = u(z);
									{
										var K = (d) => {
												const x = b(() => t.constructors[1]);
												var g = l(),
													D = u(g);
												(E(
													D,
													() => a(x),
													(I, L) => {
														P(
															L(I, {
																get data() {
																	return p();
																},
																get form() {
																	return t.form;
																},
																get params() {
																	return t.page.params;
																},
																children: (h, ht) => {
																	var N = l(),
																		U = u(N);
																	(E(
																		U,
																		() => a(q),
																		(W, X) => {
																			P(
																				X(W, {
																					get data() {
																						return w();
																					},
																					get form() {
																						return t.form;
																					},
																					get params() {
																						return t
																							.page
																							.params;
																					}
																				}),
																				(Y) => (r()[2] = Y),
																				() => r()?.[2]
																			);
																		}
																	),
																		o(h, N));
																},
																$$slots: { default: !0 }
															}),
															(h) => (r()[1] = h),
															() => r()?.[1]
														);
													}
												),
													o(d, g));
											},
											S = (d) => {
												const x = b(() => t.constructors[1]);
												var g = l(),
													D = u(g);
												(E(
													D,
													() => a(x),
													(I, L) => {
														P(
															L(I, {
																get data() {
																	return p();
																},
																get form() {
																	return t.form;
																},
																get params() {
																	return t.page.params;
																}
															}),
															(h) => (r()[1] = h),
															() => r()?.[1]
														);
													}
												),
													o(d, g));
											};
										O(J, (d) => {
											t.constructors[2] ? d(K) : d(S, !1);
										});
									}
									o(v, z);
								},
								$$slots: { default: !0 }
							}),
							(v) => (r()[0] = v),
							() => r()?.[0]
						);
					}
				),
					o(e, i));
			},
			F = (e) => {
				const n = b(() => t.constructors[0]);
				var i = l(),
					f = u(i);
				(E(
					f,
					() => a(n),
					(_, c) => {
						P(
							c(_, {
								get data() {
									return R();
								},
								get form() {
									return t.form;
								},
								get params() {
									return t.page.params;
								}
							}),
							(v) => (r()[0] = v),
							() => r()?.[0]
						);
					}
				),
					o(e, i));
			};
		O(M, (e) => {
			t.constructors[1] ? e(B) : e(F, !1);
		});
	}
	var G = at(M, 2);
	{
		var H = (e) => {
			var n = ct(),
				i = st(n);
			{
				var f = (_) => {
					var c = it();
					(_t(() => mt(c, a(C))), o(_, c));
				};
				O(i, (_) => {
					a(k) && _(f);
				});
			}
			(nt(n), o(e, n));
		};
		O(G, (e) => {
			a(A) && e(H);
		});
	}
	(o(s, j), ot());
}
const yt = ut(lt),
	Ot = [
		() =>
			m(
				() => import('../nodes/0.DijrdNxN.js'),
				__vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/1.CX0M1yj8.js'),
				__vite__mapDeps([14, 1, 12, 11, 9, 10]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/2.C2XPHAgj.js'),
				__vite__mapDeps([15, 1, 11, 9, 10, 7, 8, 3, 4, 2, 5]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/3.eN4P--c2.js'),
				__vite__mapDeps([16, 1, 7, 8, 6]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/4.BQtT4yPf.js'),
				__vite__mapDeps([17, 8, 18, 10, 1, 7]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/5.D9gOV9X1.js'),
				__vite__mapDeps([19, 5, 8, 18, 10, 1]),
				import.meta.url
			),
		() =>
			m(
				() => import('../nodes/6.VqCZGGNE.js'),
				__vite__mapDeps([20, 1, 12, 11, 9, 10, 7, 8]),
				import.meta.url
			)
	],
	Rt = [],
	pt = { '/': [3], '/changelog': [4], '/docs/[...slug]': [5, [2]], '/error': [6] },
	ft = {
		handleError: ({ error: s }) => {
			console.error(s);
		},
		reroute: () => {},
		transport: {}
	},
	vt = Object.fromEntries(Object.entries(ft.transport).map(([s, t]) => [s, t.decode])),
	At = !1,
	xt = (s, t) => vt[s](t);
export {
	xt as decode,
	vt as decoders,
	pt as dictionary,
	At as hash,
	ft as hooks,
	bt as matchers,
	Ot as nodes,
	yt as root,
	Rt as server_loads
};
