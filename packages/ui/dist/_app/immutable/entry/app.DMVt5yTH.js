const __vite__mapDeps = (
	i,
	m = __vite__mapDeps,
	d = m.f ||
		(m.f = [
			'../nodes/0.DaNlJuPp.js',
			'../chunks/1HBmZ_db.js',
			'../chunks/BW6z9EX9.js',
			'../chunks/DzGRxXYC.js',
			'../chunks/BC_1JO3s.js',
			'../chunks/Cr4zCD4i.js',
			'../chunks/DzxQehGt.js',
			'../chunks/CNPipu-G.js',
			'../chunks/BHHl-vxW.js',
			'../chunks/ClaijROu.js',
			'../chunks/Cic-IlSQ.js',
			'../chunks/BPMCz5tT.js',
			'../chunks/Cu73ScE0.js',
			'../chunks/Bo6bj8hH.js',
			'../chunks/DCEYseD3.js',
			'../chunks/C-vcVqpF.js',
			'../chunks/U1J4c8t1.js',
			'../chunks/PJJQOX3K.js',
			'../chunks/Dufayr-D.js',
			'../chunks/CYgJF_JY.js',
			'../chunks/Dy9FI1NM.js',
			'../assets/0.BVpN4KIK.css',
			'../nodes/1.kmgR-KYq.js',
			'../chunks/nLDlxW5Z.js',
			'../chunks/B00PyzgL.js',
			'../chunks/Bvsacp8G.js',
			'../chunks/ByM4i_p0.js',
			'../chunks/C9yuXBdp.js',
			'../chunks/Dd5NUPG5.js',
			'../nodes/2.DoUhlRs0.js',
			'../chunks/B52X6CO-.js',
			'../chunks/KjYeVjkE.js',
			'../chunks/DxtMK8if.js',
			'../chunks/BzLloq76.js',
			'../chunks/BLduGpSf.js',
			'../chunks/BZM4qE7v.js',
			'../chunks/VBxAmJ30.js',
			'../chunks/D9Z9MdNV.js',
			'../chunks/StNmv4ud.js',
			'../chunks/-Zrx4PIN.js',
			'../nodes/3.tVC32nU-.js',
			'../nodes/4.DLBcwMm_.js',
			'../nodes/5.kmgR-KYq.js',
			'../nodes/6.CWC2bzls.js',
			'../chunks/CPMQ46A3.js',
			'../nodes/7.BA8AjWQQ.js',
			'../nodes/8.QfeRxHp-.js',
			'../chunks/COBx9nLw.js',
			'../chunks/D-Y8D09J.js',
			'../nodes/9.BeuUcoFd.js',
			'../nodes/10.ZfHlLAGl.js',
			'../nodes/11.T1GJVRJg.js',
			'../nodes/12.Cx4oL50c.js',
			'../nodes/13.B9vrjspO.js',
			'../nodes/14.Ce5qw2wG.js',
			'../nodes/15._yR29oj1.js',
			'../nodes/16.C4xFhI4G.js',
			'../nodes/17.DYIOduzh.js',
			'../nodes/18.CTZWHjqt.js',
			'../chunks/Duew6H7Z.js',
			'../nodes/19.SKBPCEP7.js',
			'../nodes/20.DT1rIwNP.js'
		])
) => i.map((i) => d[i]);
import { _ as a } from '../chunks/D9Z9MdNV.js';
import {
	I as T,
	ar as Z,
	u as m,
	a8 as $,
	az as tt,
	aA as rt,
	p as et,
	x as at,
	z as ot,
	J as k,
	ae as st,
	f as G,
	q as f,
	G as it,
	a as d,
	b as nt,
	o as p,
	v as A,
	c as _t,
	r as mt,
	F as ut,
	t as ct
} from '../chunks/BW6z9EX9.js';
import { h as dt, m as lt, u as ft, s as vt } from '../chunks/DzGRxXYC.js';
import '../chunks/1HBmZ_db.js';
import { o as ht } from '../chunks/BHHl-vxW.js';
import { i as y } from '../chunks/ClaijROu.js';
import { c as I } from '../chunks/C-vcVqpF.js';
import { b as L } from '../chunks/Bo6bj8hH.js';
import { p as D } from '../chunks/Cic-IlSQ.js';
function pt(s) {
	return class extends gt {
		constructor(t) {
			super({ component: s, ...t });
		}
	};
}
class gt {
	#r;
	#t;
	constructor(t) {
		var r = new Map(),
			i = (o, e) => {
				var u = rt(e, !1, !1);
				return (r.set(o, u), u);
			};
		const n = new Proxy(
			{ ...(t.props || {}), $$events: {} },
			{
				get(o, e) {
					return m(r.get(e) ?? i(e, Reflect.get(o, e)));
				},
				has(o, e) {
					return e === Z ? !0 : (m(r.get(e) ?? i(e, Reflect.get(o, e))), Reflect.has(o, e));
				},
				set(o, e, u) {
					return (T(r.get(e) ?? i(e, u), u), Reflect.set(o, e, u));
				}
			}
		);
		((this.#t = (t.hydrate ? dt : lt)(t.component, {
			target: t.target,
			anchor: t.anchor,
			props: n,
			context: t.context,
			intro: t.intro ?? !1,
			recover: t.recover
		})),
			(!t?.props?.$$host || t.sync === !1) && $(),
			(this.#r = n.$$events));
		for (const o of Object.keys(this.#t))
			o === '$set' ||
				o === '$destroy' ||
				o === '$on' ||
				tt(this, o, {
					get() {
						return this.#t[o];
					},
					set(e) {
						this.#t[o] = e;
					},
					enumerable: !0
				});
		((this.#t.$set = (o) => {
			Object.assign(n, o);
		}),
			(this.#t.$destroy = () => {
				ft(this.#t);
			}));
	}
	$set(t) {
		this.#t.$set(t);
	}
	$on(t, r) {
		this.#r[t] = this.#r[t] || [];
		const i = (...n) => r.call(this, ...n);
		return (
			this.#r[t].push(i),
			() => {
				this.#r[t] = this.#r[t].filter((n) => n !== i);
			}
		);
	}
	$destroy() {
		this.#t.$destroy();
	}
}
function Et(s) {
	var t = '',
		r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		i = r.length;
	for (let n = 0; n < s; n++) t += r.charAt(Math.floor(Math.random() * i));
	return t;
}
const Pt = ({ error: s, event: t, message: r }) => {
		const i = Et(24);
		return (
			console.error('An error occurred on the client side:', s, t, r),
			{ message: 'Whoops!', errorId: i }
		);
	},
	St = {};
var Rt = G(
		'<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>'
	),
	Ot = G('<!> <!>', 1);
function At(s, t) {
	et(t, !0);
	let r = D(t, 'components', 23, () => []),
		i = D(t, 'data_0', 3, null),
		n = D(t, 'data_1', 3, null),
		o = D(t, 'data_2', 3, null);
	(at(() => t.stores.page.set(t.page)),
		ot(() => {
			(t.stores, t.page, t.constructors, r(), t.form, i(), n(), o(), t.stores.page.notify());
		}));
	let e = k(!1),
		u = k(!1),
		j = k(null);
	ht(() => {
		const _ = t.stores.page.subscribe(() => {
			m(e) &&
				(T(u, !0),
				st().then(() => {
					T(j, document.title || 'untitled page', !0);
				}));
		});
		return (T(e, !0), _);
	});
	const q = A(() => t.constructors[2]);
	var C = Ot(),
		M = f(C);
	{
		var F = (_) => {
				var c = p();
				const g = A(() => t.constructors[0]);
				var E = f(c);
				(I(
					E,
					() => m(g),
					(l, v) => {
						L(
							v(l, {
								get data() {
									return i();
								},
								get form() {
									return t.form;
								},
								get params() {
									return t.page.params;
								},
								children: (P, yt) => {
									var S = p(),
										B = f(S);
									{
										var H = (h) => {
												var R = p();
												const V = A(() => t.constructors[1]);
												var b = f(R);
												(I(
													b,
													() => m(V),
													(x, w) => {
														L(
															w(x, {
																get data() {
																	return n();
																},
																get form() {
																	return t.form;
																},
																get params() {
																	return t.page.params;
																},
																children: (O, Dt) => {
																	var z = p(),
																		N = f(z);
																	(I(
																		N,
																		() => m(q),
																		(Q, U) => {
																			L(
																				U(Q, {
																					get data() {
																						return o();
																					},
																					get form() {
																						return t.form;
																					},
																					get params() {
																						return t.page.params;
																					}
																				}),
																				(X) => (r()[2] = X),
																				() => r()?.[2]
																			);
																		}
																	),
																		d(O, z));
																},
																$$slots: { default: !0 }
															}),
															(O) => (r()[1] = O),
															() => r()?.[1]
														);
													}
												),
													d(h, R));
											},
											K = (h) => {
												var R = p();
												const V = A(() => t.constructors[1]);
												var b = f(R);
												(I(
													b,
													() => m(V),
													(x, w) => {
														L(
															w(x, {
																get data() {
																	return n();
																},
																get form() {
																	return t.form;
																},
																get params() {
																	return t.page.params;
																}
															}),
															(O) => (r()[1] = O),
															() => r()?.[1]
														);
													}
												),
													d(h, R));
											};
										y(B, (h) => {
											t.constructors[2] ? h(H) : h(K, !1);
										});
									}
									d(P, S);
								},
								$$slots: { default: !0 }
							}),
							(P) => (r()[0] = P),
							() => r()?.[0]
						);
					}
				),
					d(_, c));
			},
			J = (_) => {
				var c = p();
				const g = A(() => t.constructors[0]);
				var E = f(c);
				(I(
					E,
					() => m(g),
					(l, v) => {
						L(
							v(l, {
								get data() {
									return i();
								},
								get form() {
									return t.form;
								},
								get params() {
									return t.page.params;
								}
							}),
							(P) => (r()[0] = P),
							() => r()?.[0]
						);
					}
				),
					d(_, c));
			};
		y(M, (_) => {
			t.constructors[1] ? _(F) : _(J, !1);
		});
	}
	var W = it(M, 2);
	{
		var Y = (_) => {
			var c = Rt(),
				g = _t(c);
			{
				var E = (l) => {
					var v = ut();
					(ct(() => vt(v, m(j))), d(l, v));
				};
				y(g, (l) => {
					m(u) && l(E);
				});
			}
			(mt(c), d(_, c));
		};
		y(W, (_) => {
			m(e) && _(Y);
		});
	}
	(d(s, C), nt());
}
const zt = pt(At),
	Gt = [
		() =>
			a(
				() => import('../nodes/0.DaNlJuPp.js'),
				__vite__mapDeps([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/1.kmgR-KYq.js'),
				__vite__mapDeps([
					22, 1, 2, 16, 23, 8, 3, 4, 9, 11, 10, 17, 18, 19, 24, 13, 25, 26, 27, 28, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/2.DoUhlRs0.js'),
				__vite__mapDeps([
					29, 30, 31, 19, 1, 2, 16, 18, 8, 3, 4, 6, 32, 33, 34, 25, 11, 28, 9, 15, 10, 17, 24, 13,
					26, 27, 35, 36, 14, 37, 38, 39, 7, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/3.tVC32nU-.js'),
				__vite__mapDeps([
					40, 1, 2, 16, 23, 8, 3, 4, 9, 11, 10, 17, 18, 19, 24, 13, 25, 26, 27, 28, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/4.DLBcwMm_.js'),
				__vite__mapDeps([41, 1, 2, 4, 11, 3, 28, 10, 27]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/5.kmgR-KYq.js'),
				__vite__mapDeps([
					42, 1, 2, 16, 23, 8, 3, 4, 9, 11, 10, 17, 18, 19, 24, 13, 25, 26, 27, 28, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/6.CWC2bzls.js'),
				__vite__mapDeps([43, 31, 19, 28, 1, 2, 16, 44, 10, 25, 11, 3, 26, 4, 27]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/7.BA8AjWQQ.js'),
				__vite__mapDeps([45, 1, 2, 3, 20]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/8.QfeRxHp-.js'),
				__vite__mapDeps([
					46, 31, 19, 38, 33, 34, 25, 11, 2, 3, 1, 47, 9, 15, 10, 18, 8, 4, 17, 24, 13, 26, 27, 36,
					6, 35, 16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/9.BeuUcoFd.js'),
				__vite__mapDeps([
					49, 31, 19, 38, 33, 34, 25, 11, 2, 3, 28, 1, 47, 9, 15, 10, 18, 8, 4, 17, 24, 13, 26, 27,
					36, 6, 35, 16, 39, 48, 37, 44, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/10.ZfHlLAGl.js'),
				__vite__mapDeps([
					50, 31, 19, 38, 33, 34, 25, 11, 2, 3, 1, 47, 9, 15, 10, 18, 8, 4, 17, 24, 13, 26, 27, 36,
					6, 35, 16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/11.T1GJVRJg.js'),
				__vite__mapDeps([
					51, 31, 19, 38, 33, 34, 25, 11, 2, 3, 1, 47, 9, 15, 10, 18, 8, 4, 17, 24, 13, 26, 27, 36,
					6, 35, 16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/12.Cx4oL50c.js'),
				__vite__mapDeps([52, 1, 2, 16, 3, 11, 39, 5, 6, 7, 15, 10, 25, 4, 9, 36, 48, 27, 20]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/13.B9vrjspO.js'),
				__vite__mapDeps([
					53, 1, 2, 47, 3, 9, 11, 15, 10, 18, 8, 4, 19, 17, 33, 34, 25, 24, 13, 26, 27, 36, 6, 35,
					16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/14.Ce5qw2wG.js'),
				__vite__mapDeps([
					54, 1, 2, 47, 3, 9, 11, 15, 10, 18, 8, 4, 19, 17, 33, 34, 25, 24, 13, 26, 27, 36, 6, 35,
					16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/15._yR29oj1.js'),
				__vite__mapDeps([55, 1, 2, 16, 20]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/16.C4xFhI4G.js'),
				__vite__mapDeps([
					56, 31, 19, 38, 33, 34, 25, 11, 2, 3, 1, 47, 9, 15, 10, 18, 8, 4, 17, 24, 13, 26, 27, 36,
					6, 35, 16, 39, 48, 37, 44, 28, 14, 12, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/17.DYIOduzh.js'),
				__vite__mapDeps([57, 1, 2, 16, 8, 3, 4, 39, 18, 19, 44, 10, 25, 11, 26, 27]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/18.CTZWHjqt.js'),
				__vite__mapDeps([58, 1, 2, 8, 3, 4, 9, 15, 11, 34, 25, 59, 10, 27, 13, 24, 26, 28, 20]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/19.SKBPCEP7.js'),
				__vite__mapDeps([
					60, 31, 19, 32, 33, 34, 25, 11, 2, 3, 28, 1, 9, 15, 18, 8, 4, 59, 10, 27, 13, 24, 26, 20
				]),
				import.meta.url
			),
		() =>
			a(
				() => import('../nodes/20.DT1rIwNP.js'),
				__vite__mapDeps([
					61, 1, 2, 16, 23, 8, 3, 4, 9, 11, 10, 17, 18, 19, 24, 13, 25, 26, 27, 28, 20
				]),
				import.meta.url
			)
	],
	qt = [],
	Ft = {
		'/(app)': [6, [2], [3]],
		'/(app)/account': [7, [2], [3]],
		'/auth/callback': [17, [4], [5]],
		'/auth/error': [18, [4], [5]],
		'/auth/sign-in': [19, [4], [5]],
		'/(app)/browse': [8, [2], [3]],
		'/(app)/browse/[...path]': [9, [2], [3]],
		'/(app)/categories/[category]': [10, [2], [3]],
		'/error': [20],
		'/(app)/recent': [11, [2], [3]],
		'/(app)/settings': [12, [2], [3]],
		'/(app)/shared': [13, [2], [3]],
		'/(app)/starred': [14, [2], [3]],
		'/(app)/sync': [15, [2], [3]],
		'/(app)/trash': [16, [2], [3]]
	},
	It = {
		handleError:
			Pt ||
			(({ error: s }) => {
				console.error(s);
			}),
		init: void 0,
		reroute: () => {},
		transport: {}
	},
	Lt = Object.fromEntries(Object.entries(It.transport).map(([s, t]) => [s, t.decode])),
	Jt = !1,
	Wt = (s, t) => Lt[s](t);
export {
	Wt as decode,
	Lt as decoders,
	Ft as dictionary,
	Jt as hash,
	It as hooks,
	St as matchers,
	Gt as nodes,
	zt as root,
	qt as server_loads
};
