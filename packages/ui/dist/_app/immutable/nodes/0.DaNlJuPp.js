import { a as en, b as nn } from '../chunks/1HBmZ_db.js';
import {
	p as Ot,
	o as v,
	q as d,
	a,
	b as Lt,
	f as Y,
	t as V,
	G as gt,
	x as Bt,
	u as e,
	v as h,
	c as rt,
	r as p,
	ab as an,
	aa as Le,
	ac as on,
	J as H,
	ak as We,
	z as _t,
	I as c,
	A as Xt,
	af as ht,
	F as Ne,
	ax as qt,
	U as rn,
	be as sn
} from '../chunks/BW6z9EX9.js';
import { k as Ye, o as ie, p as ln, e as cn, s as te } from '../chunks/DzGRxXYC.js';
import { s as it } from '../chunks/BC_1JO3s.js';
import {
	a as dn,
	m as ee,
	t as ne,
	d as He,
	l as je,
	b as Re,
	c as ae,
	e as Fe,
	f as un,
	g as fn,
	h as mn,
	i as Ke,
	s as vn,
	j as gn,
	k as hn
} from '../chunks/Cr4zCD4i.js';
import { o as Ae } from '../chunks/BHHl-vxW.js';
import { i as _ } from '../chunks/ClaijROu.js';
import { p as x, s as Se, r as _n } from '../chunks/Cic-IlSQ.js';
import {
	b as D,
	e as Ee,
	c as xt,
	s as It,
	f as re,
	a as yn,
	S as bn
} from '../chunks/BPMCz5tT.js';
import { h as wn } from '../chunks/Cu73ScE0.js';
import { b as Ge } from '../chunks/Bo6bj8hH.js';
import {
	t as W,
	c as wt,
	S as xn,
	r as In,
	l as Tn,
	a as Cn,
	f as Sn
} from '../chunks/DCEYseD3.js';
import { c as Pt } from '../chunks/C-vcVqpF.js';
import '../chunks/U1J4c8t1.js';
import { c as Mn } from '../chunks/DzxQehGt.js';
import { n as Me } from '../chunks/PJJQOX3K.js';
import { t as Bn } from '../chunks/Dy9FI1NM.js';
const En = !1,
	qa = Object.freeze(
		Object.defineProperty({ __proto__: null, ssr: En }, Symbol.toStringTag, { value: 'Module' })
	);
var Dn = Y('<meta name="theme-color"/>');
function An(n, t) {
	Ot(t, !0);
	var o = v(),
		l = d(o);
	{
		var u = (f) => {
			var I = Dn();
			(V(() => D(I, 'content', t.themeColors.dark)), a(f, I));
		};
		_(l, (f) => {
			t.themeColors && f(u);
		});
	}
	(a(n, o), Lt());
}
var kn = Y('<meta name="theme-color"/>'),
	Pn = Y('<!> <!>', 1);
function On(n, t) {
	Ot(t, !0);
	let o = x(t, 'trueNonce', 3, '');
	(Ye((l) => {
		var u = Pn(),
			f = d(u);
		{
			var I = (A) => {
				var C = kn();
				(V(() => D(C, 'content', t.themeColors.dark)), a(A, C));
			};
			_(f, (A) => {
				t.themeColors && A(I);
			});
		}
		var P = gt(f, 2);
		(wn(
			P,
			() =>
				`<script${o() ? ` nonce=${o()}` : ''}>(` +
				dn.toString() +
				')(' +
				JSON.stringify(t.initConfig) +
				');<\/script>'
		),
			a(l, u));
	}),
		Lt());
}
function Ln(n, t) {
	Ot(t, !0);
	let o = x(t, 'track', 3, !0),
		l = x(t, 'defaultMode', 3, 'system'),
		u = x(t, 'disableTransitions', 3, !0),
		f = x(t, 'darkClassNames', 19, () => ['dark']),
		I = x(t, 'lightClassNames', 19, () => []),
		P = x(t, 'defaultTheme', 3, ''),
		A = x(t, 'nonce', 3, ''),
		C = x(t, 'themeStorageKey', 3, 'mode-watcher-theme'),
		O = x(t, 'modeStorageKey', 3, 'mode-watcher-mode'),
		st = x(t, 'disableHeadScriptInjection', 3, !1),
		lt = x(t, 'synchronousModeChanges', 3, !1);
	((ee.current = O()),
		(ne.current = C()),
		(He.current = f()),
		(je.current = I()),
		(Re.current = u()),
		(ae.current = t.themeColors),
		(Fe.current = lt()),
		Bt(() => {
			Fe.current = lt();
		}),
		Bt(() => {
			Re.current = u();
		}),
		Bt(() => {
			ae.current = t.themeColors;
		}),
		Bt(() => {
			He.current = f();
		}),
		Bt(() => {
			je.current = I();
		}),
		Bt(() => {
			ee.current = O();
		}),
		Bt(() => {
			ne.current = C();
		}),
		Bt(() => {
			(un.current, ee.current, ne.current, fn.current);
		}),
		Ae(() => {
			(Ke.tracking(o()), Ke.query());
			const X = localStorage.getItem(ee.current);
			vn(gn(X) ? X : l());
			const Rt = localStorage.getItem(ne.current);
			hn(Rt || P());
		}));
	const ut = mn({
			defaultMode: l(),
			themeColors: t.themeColors,
			darkClassNames: f(),
			lightClassNames: I(),
			defaultTheme: P(),
			modeStorageKey: O(),
			themeStorageKey: C()
		}),
		G = h(() => (typeof window > 'u' ? A() : ''));
	var $ = v(),
		Tt = d($);
	{
		var J = (X) => {
				An(X, {
					get themeColors() {
						return ae.current;
					}
				});
			},
			tt = (X) => {
				On(X, {
					get trueNonce() {
						return e(G);
					},
					get initConfig() {
						return ut;
					},
					get themeColors() {
						return ae.current;
					}
				});
			};
		_(Tt, (X) => {
			st() ? X(J) : X(tt, !1);
		});
	}
	(a(n, $), Lt());
}
const Nn = Array(12).fill(0);
var Hn = Y('<div class="sonner-loading-bar"></div>'),
	jn = Y('<div><div class="sonner-spinner"></div></div>');
function Rn(n, t) {
	Ot(t, !0);
	var o = jn(),
		l = rt(o);
	(Ee(
		l,
		23,
		() => Nn,
		(u, f) => `spinner-bar-${f}`,
		(u, f) => {
			var I = Hn();
			a(u, I);
		}
	),
		p(l),
		p(o),
		V(
			(u) => {
				(It(o, 1, u), D(o, 'data-visible', t.visible));
			},
			[() => xt(['sonner-loading-wrapper', t.class].filter(Boolean).join(' '))]
		),
		a(n, o),
		Lt());
}
const Fn = typeof window < 'u' ? window : void 0;
function Kn(n) {
	let t = n.activeElement;
	for (; t?.shadowRoot; ) {
		const o = t.shadowRoot.activeElement;
		if (o === t) break;
		t = o;
	}
	return t;
}
class zn {
	#t;
	#e;
	constructor(t = {}) {
		const { window: o = Fn, document: l = o?.document } = t;
		o !== void 0 &&
			((this.#t = l),
			(this.#e = Mn((u) => {
				const f = ie(o, 'focusin', u),
					I = ie(o, 'focusout', u);
				return () => {
					(f(), I());
				};
			})));
	}
	get current() {
		return (this.#e?.(), this.#t ? Kn(this.#t) : null);
	}
}
new zn();
class Un {
	#t;
	#e;
	constructor(t) {
		((this.#t = t), (this.#e = Symbol(t)));
	}
	get key() {
		return this.#e;
	}
	exists() {
		return an(this.#e);
	}
	get() {
		const t = Le(this.#e);
		if (t === void 0) throw new Error(`Context "${this.#t}" not found`);
		return t;
	}
	getOr(t) {
		const o = Le(this.#e);
		return o === void 0 ? t : o;
	}
	set(t) {
		return on(this.#e, t);
	}
}
const Vn = new Un('<Toaster/>');
function se(n) {
	return n.label !== void 0;
}
function Wn() {
	let n = H(We(typeof document < 'u' ? document.hidden : !1));
	return (
		_t(() =>
			ie(document, 'visibilitychange', () => {
				c(n, document.hidden, !0);
			})
		),
		{
			get current() {
				return e(n);
			}
		}
	);
}
const ze = 4e3,
	Yn = 14,
	Gn = 45,
	Zn = 200,
	Xn = 0.05,
	qn = {
		toast: '',
		title: '',
		description: '',
		loader: '',
		closeButton: '',
		cancelButton: '',
		actionButton: '',
		action: '',
		warning: '',
		error: '',
		success: '',
		default: '',
		info: '',
		loading: ''
	};
function Jn(n) {
	const [t, o] = n.split('-'),
		l = [];
	return (t && l.push(t), o && l.push(o), l);
}
function Ue(n) {
	return 1 / (1.5 + Math.abs(n) / 20);
}
var Qn = Y('<div><!></div>'),
	pn = (n, t, o, l, u) => {
		e(t) || !e(o) || (l(), u.toast.onDismiss?.(u.toast));
	},
	$n = Y('<button data-close-button=""><!></button>'),
	ta = Y('<div data-icon=""><!> <!></div>'),
	ea = Y('<div data-description=""><!></div>'),
	na = (n, t, o, l) => {
		se(t.toast.cancel) && e(o) && (t.toast.cancel?.onClick?.(n), l());
	},
	aa = Y('<button data-button="" data-cancel=""> </button>'),
	oa = (n, t, o) => {
		se(t.toast.action) && (t.toast.action?.onClick(n), !n.defaultPrevented && o());
	},
	ra = Y('<button data-button=""> </button>'),
	ia = Y('<!> <div data-content=""><div data-title=""><!></div> <!></div> <!> <!>', 1),
	sa = Y('<li data-sonner-toast=""><!> <!></li>');
function la(n, t) {
	Ot(t, !0);
	const o = (m) => {
		var b = v(),
			S = d(b);
		{
			var k = (M) => {
					var K = Qn(),
						kt = rt(K);
					(it(kt, () => t.loadingIcon),
						p(K),
						V(
							(zt) => {
								(It(K, 1, zt), D(K, 'data-visible', e(E) === 'loading'));
							},
							[() => xt(wt(e(et)?.loader, t.toast?.classes?.loader, 'sonner-loader'))]
						),
						a(M, K));
				},
				N = (M) => {
					{
						let K = h(() => wt(e(et)?.loader, t.toast.classes?.loader)),
							kt = h(() => e(E) === 'loading');
						Rn(M, {
							get class() {
								return e(K);
							},
							get visible() {
								return e(kt);
							}
						});
					}
				};
			_(S, (M) => {
				t.loadingIcon ? M(k) : M(N, !1);
			});
		}
		a(m, b);
	};
	let l = x(t, 'cancelButtonStyle', 3, ''),
		u = x(t, 'actionButtonStyle', 3, ''),
		f = x(t, 'descriptionClass', 3, ''),
		I = x(t, 'unstyled', 3, !1),
		P = x(t, 'defaultRichColors', 3, !1);
	const A = { ...qn };
	let C = H(!1),
		O = H(!1),
		st = H(!1),
		lt = H(!1),
		ut = H(!1),
		G = H(0),
		$ = H(0),
		Tt = t.toast.duration || t.duration || ze,
		J = H(void 0),
		tt = H(null),
		X = H(null);
	const Rt = h(() => t.index === 0),
		le = h(() => t.index + 1 <= t.visibleToasts),
		E = h(() => t.toast.type),
		ft = h(() => t.toast.dismissable !== !1),
		Et = h(() => t.toast.class || ''),
		Ct = h(() => t.toast.descriptionClass || ''),
		mt = h(() => W.heights.findIndex((m) => m.toastId === t.toast.id) || 0),
		Dt = h(() => t.toast.closeButton ?? t.closeButton),
		ce = h(() => t.toast.duration ?? t.duration ?? ze);
	let St = null;
	const Jt = h(() => t.position.split('-')),
		de = h(() => W.heights.reduce((m, b, S) => (S >= e(mt) ? m : m + b.height), 0)),
		ue = Wn(),
		fe = h(() => t.toast.invert || t.invert),
		Ft = h(() => e(E) === 'loading'),
		et = h(() => ({ ...A, ...t.classes })),
		me = h(() => t.toast.title),
		At = h(() => t.toast.description);
	let Kt = H(0),
		Qt = H(0);
	const i = h(() => Math.round(e(mt) * Yn + e(de)));
	_t(() => {
		(e(me), e(At));
		let m;
		t.expanded || t.expandByDefault ? (m = 1) : (m = 1 - t.index * Xn);
		const b = Xt(() => e(J));
		if (b === void 0) return;
		b.style.setProperty('height', 'auto');
		const S = b.offsetHeight,
			k = b.getBoundingClientRect().height,
			N = Math.round((k / m + Number.EPSILON) & 100) / 100;
		b.style.removeProperty('height');
		let M;
		(Math.abs(N - S) < 1 ? (M = N) : (M = S),
			c($, M, !0),
			Xt(() => {
				W.setHeight({ toastId: t.toast.id, height: M });
			}));
	});
	function L() {
		(c(O, !0),
			c(G, e(i), !0),
			W.removeHeight(t.toast.id),
			setTimeout(() => {
				W.remove(t.toast.id);
			}, Zn));
	}
	let nt;
	const yt = h(
		() => (t.toast.promise && e(E) === 'loading') || t.toast.duration === Number.POSITIVE_INFINITY
	);
	function Mt() {
		(c(Kt, new Date().getTime(), !0),
			(nt = setTimeout(() => {
				(t.toast.onAutoClose?.(t.toast), L());
			}, Tt)));
	}
	function ve() {
		if (e(Qt) < e(Kt)) {
			const m = new Date().getTime() - e(Kt);
			Tt = Tt - m;
		}
		c(Qt, new Date().getTime(), !0);
	}
	(_t(() => {
		t.toast.updated && (clearTimeout(nt), (Tt = e(ce)), Mt());
	}),
		_t(
			() => (
				e(yt) || (t.expanded || t.interacting || ue.current ? ve() : Mt()),
				() => clearTimeout(nt)
			)
		),
		Ae(() => {
			c(C, !0);
			const m = e(J)?.getBoundingClientRect().height;
			return (
				c($, m, !0),
				W.setHeight({ toastId: t.toast.id, height: m }),
				() => {
					W.removeHeight(t.toast.id);
				}
			);
		}),
		_t(() => {
			t.toast.delete &&
				Xt(() => {
					(L(), t.toast.onDismiss?.(t.toast));
				});
		}));
	const Pe = (m) => {
			if (e(Ft)) return;
			c(G, e(i), !0);
			const b = m.target;
			(b.setPointerCapture(m.pointerId),
				b.tagName !== 'BUTTON' && (c(st, !0), (St = { x: m.clientX, y: m.clientY })));
		},
		bt = () => {
			if (e(lt) || !e(ft)) return;
			St = null;
			const m = Number(e(J)?.style.getPropertyValue('--swipe-amount-x').replace('px', '') || 0),
				b = Number(e(J)?.style.getPropertyValue('--swipe-amount-y').replace('px', '') || 0),
				S = new Date().getTime() - 0,
				k = e(tt) === 'x' ? m : b,
				N = Math.abs(k) / S;
			if (Math.abs(k) >= Gn || N > 0.11) {
				(c(G, e(i), !0),
					t.toast.onDismiss?.(t.toast),
					e(tt) === 'x' ? c(X, m > 0 ? 'right' : 'left', !0) : c(X, b > 0 ? 'down' : 'up', !0),
					L(),
					c(lt, !0));
				return;
			} else
				(e(J)?.style.setProperty('--swipe-amount-x', '0px'),
					e(J)?.style.setProperty('--swipe-amount-y', '0px'));
			(c(ut, !1), c(st, !1), c(tt, null));
		},
		pt = (m) => {
			if (!St || !e(ft) || (window.getSelection()?.toString().length ?? -1) > 0) return;
			const S = m.clientY - St.y,
				k = m.clientX - St.x,
				N = t.swipeDirections ?? Jn(t.position);
			!e(tt) &&
				(Math.abs(k) > 1 || Math.abs(S) > 1) &&
				c(tt, Math.abs(k) > Math.abs(S) ? 'x' : 'y', !0);
			let M = { x: 0, y: 0 };
			if (e(tt) === 'y') {
				if (N.includes('top') || N.includes('bottom'))
					if ((N.includes('top') && S < 0) || (N.includes('bottom') && S > 0)) M.y = S;
					else {
						const K = S * Ue(S);
						M.y = Math.abs(K) < Math.abs(S) ? K : S;
					}
			} else if (e(tt) === 'x' && (N.includes('left') || N.includes('right')))
				if ((N.includes('left') && k < 0) || (N.includes('right') && k > 0)) M.x = k;
				else {
					const K = k * Ue(k);
					M.x = Math.abs(K) < Math.abs(k) ? K : k;
				}
			((Math.abs(M.x) > 0 || Math.abs(M.y) > 0) && c(ut, !0),
				e(J)?.style.setProperty('--swipe-amount-x', `${M.x}px`),
				e(J)?.style.setProperty('--swipe-amount-y', `${M.y}px`));
		},
		vt = () => {
			(c(st, !1), c(tt, null), (St = null));
		},
		Q = h(() =>
			t.toast.icon
				? t.toast.icon
				: e(E) === 'success'
					? t.successIcon
					: e(E) === 'error'
						? t.errorIcon
						: e(E) === 'warning'
							? t.warningIcon
							: e(E) === 'info'
								? t.infoIcon
								: e(E) === 'loading'
									? t.loadingIcon
									: null
		);
	var y = sa();
	D(y, 'tabindex', 0);
	let $t;
	((y.__pointermove = pt), (y.__pointerup = bt), (y.__pointerdown = Pe));
	var ge = rt(y);
	{
		var he = (m) => {
			var b = $n();
			b.__click = [pn, Ft, ft, L, t];
			var S = rt(b);
			(it(S, () => t.closeIcon ?? ht),
				p(b),
				V(
					(k) => {
						(D(b, 'aria-label', t.closeButtonAriaLabel), D(b, 'data-disabled', e(Ft)), It(b, 1, k));
					},
					[() => xt(wt(e(et)?.closeButton, t.toast?.classes?.closeButton))]
				),
				a(m, b));
		};
		_(ge, (m) => {
			e(Dt) && !t.toast.component && e(E) !== 'loading' && t.closeIcon !== null && m(he);
		});
	}
	var _e = gt(ge, 2);
	{
		var ye = (m) => {
				var b = v();
				const S = h(() => t.toast.component);
				var k = d(b);
				(Pt(
					k,
					() => e(S),
					(N, M) => {
						M(
							N,
							Se(() => t.toast.componentProps, { closeToast: L })
						);
					}
				),
					a(m, b));
			},
			be = (m) => {
				var b = ia(),
					S = d(b);
				{
					var k = (T) => {
						var r = ta(),
							g = rt(r);
						{
							var B = (w) => {
								var z = v(),
									q = d(z);
								{
									var F = (U) => {
											var ot = v(),
												Ut = d(ot);
											(Pt(
												Ut,
												() => t.toast.icon,
												(Vt, Wt) => {
													Wt(Vt, {});
												}
											),
												a(U, ot));
										},
										j = (U) => {
											o(U);
										};
									_(q, (U) => {
										t.toast.icon ? U(F) : U(j, !1);
									});
								}
								a(w, z);
							};
							_(g, (w) => {
								(t.toast.promise || e(E) === 'loading') && w(B);
							});
						}
						var R = gt(g, 2);
						{
							var s = (w) => {
								var z = v(),
									q = d(z);
								{
									var F = (U) => {
											var ot = v(),
												Ut = d(ot);
											(Pt(
												Ut,
												() => t.toast.icon,
												(Vt, Wt) => {
													Wt(Vt, {});
												}
											),
												a(U, ot));
										},
										j = (U) => {
											var ot = v(),
												Ut = d(ot);
											{
												var Vt = (Nt) => {
														var Yt = v(),
															xe = d(Yt);
														(it(xe, () => t.successIcon ?? ht), a(Nt, Yt));
													},
													Wt = (Nt) => {
														var Yt = v(),
															xe = d(Yt);
														{
															var qe = (Ht) => {
																	var Gt = v(),
																		Ie = d(Gt);
																	(it(Ie, () => t.errorIcon ?? ht), a(Ht, Gt));
																},
																Je = (Ht) => {
																	var Gt = v(),
																		Ie = d(Gt);
																	{
																		var Qe = (jt) => {
																				var Zt = v(),
																					Te = d(Zt);
																				(it(Te, () => t.warningIcon ?? ht), a(jt, Zt));
																			},
																			pe = (jt) => {
																				var Zt = v(),
																					Te = d(Zt);
																				{
																					var $e = (Ce) => {
																						var Oe = v(),
																							tn = d(Oe);
																						(it(tn, () => t.infoIcon ?? ht), a(Ce, Oe));
																					};
																					_(
																						Te,
																						(Ce) => {
																							e(E) === 'info' && Ce($e);
																						},
																						!0
																					);
																				}
																				a(jt, Zt);
																			};
																		_(
																			Ie,
																			(jt) => {
																				e(E) === 'warning' ? jt(Qe) : jt(pe, !1);
																			},
																			!0
																		);
																	}
																	a(Ht, Gt);
																};
															_(
																xe,
																(Ht) => {
																	e(E) === 'error' ? Ht(qe) : Ht(Je, !1);
																},
																!0
															);
														}
														a(Nt, Yt);
													};
												_(
													Ut,
													(Nt) => {
														e(E) === 'success' ? Nt(Vt) : Nt(Wt, !1);
													},
													!0
												);
											}
											a(U, ot);
										};
									_(q, (U) => {
										t.toast.icon ? U(F) : U(j, !1);
									});
								}
								a(w, z);
							};
							_(R, (w) => {
								t.toast.type !== 'loading' && w(s);
							});
						}
						(p(r),
							V((w) => It(r, 1, w), [() => xt(wt(e(et)?.icon, t.toast?.classes?.icon))]),
							a(T, r));
					};
					_(S, (T) => {
						(e(E) || t.toast.icon || t.toast.promise) &&
							t.toast.icon !== null &&
							(e(Q) !== null || t.toast.icon) &&
							T(k);
					});
				}
				var N = gt(S, 2),
					M = rt(N),
					K = rt(M);
				{
					var kt = (T) => {
						var r = v(),
							g = d(r);
						{
							var B = (s) => {
									var w = v();
									const z = h(() => t.toast.title);
									var q = d(w);
									(Pt(
										q,
										() => e(z),
										(F, j) => {
											j(
												F,
												Se(() => t.toast.componentProps)
											);
										}
									),
										a(s, w));
								},
								R = (s) => {
									var w = Ne();
									(V(() => te(w, t.toast.title)), a(s, w));
								};
							_(g, (s) => {
								typeof t.toast.title != 'string' ? s(B) : s(R, !1);
							});
						}
						a(T, r);
					};
					_(K, (T) => {
						t.toast.title && T(kt);
					});
				}
				p(M);
				var zt = gt(M, 2);
				{
					var we = (T) => {
						var r = ea(),
							g = rt(r);
						{
							var B = (s) => {
									var w = v();
									const z = h(() => t.toast.description);
									var q = d(w);
									(Pt(
										q,
										() => e(z),
										(F, j) => {
											j(
												F,
												Se(() => t.toast.componentProps)
											);
										}
									),
										a(s, w));
								},
								R = (s) => {
									var w = Ne();
									(V(() => te(w, t.toast.description)), a(s, w));
								};
							_(g, (s) => {
								typeof t.toast.description != 'string' ? s(B) : s(R, !1);
							});
						}
						(p(r),
							V(
								(s) => It(r, 1, s),
								[() => xt(wt(f(), e(Ct), e(et)?.description, t.toast.classes?.description))]
							),
							a(T, r));
					};
					_(zt, (T) => {
						t.toast.description && T(we);
					});
				}
				p(N);
				var at = gt(N, 2);
				{
					var Z = (T) => {
						var r = v(),
							g = d(r);
						{
							var B = (s) => {
									var w = v(),
										z = d(w);
									(Pt(
										z,
										() => t.toast.cancel,
										(q, F) => {
											F(q, {});
										}
									),
										a(s, w));
								},
								R = (s) => {
									var w = v(),
										z = d(w);
									{
										var q = (F) => {
											var j = aa();
											j.__click = [na, t, ft, L];
											var U = rt(j, !0);
											(p(j),
												V(
													(ot) => {
														(re(j, t.toast.cancelButtonStyle ?? l()),
															It(j, 1, ot),
															te(U, t.toast.cancel.label));
													},
													[() => xt(wt(e(et)?.cancelButton, t.toast?.classes?.cancelButton))]
												),
												a(F, j));
										};
										_(
											z,
											(F) => {
												se(t.toast.cancel) && F(q);
											},
											!0
										);
									}
									a(s, w);
								};
							_(g, (s) => {
								typeof t.toast.cancel == 'function' ? s(B) : s(R, !1);
							});
						}
						a(T, r);
					};
					_(at, (T) => {
						t.toast.cancel && T(Z);
					});
				}
				var ct = gt(at, 2);
				{
					var dt = (T) => {
						var r = v(),
							g = d(r);
						{
							var B = (s) => {
									var w = v(),
										z = d(w);
									(Pt(
										z,
										() => t.toast.action,
										(q, F) => {
											F(q, {});
										}
									),
										a(s, w));
								},
								R = (s) => {
									var w = v(),
										z = d(w);
									{
										var q = (F) => {
											var j = ra();
											j.__click = [oa, t, L];
											var U = rt(j, !0);
											(p(j),
												V(
													(ot) => {
														(re(j, t.toast.actionButtonStyle ?? u()),
															It(j, 1, ot),
															te(U, t.toast.action.label));
													},
													[() => xt(wt(e(et)?.actionButton, t.toast?.classes?.actionButton))]
												),
												a(F, j));
										};
										_(
											z,
											(F) => {
												se(t.toast.action) && F(q);
											},
											!0
										);
									}
									a(s, w);
								};
							_(g, (s) => {
								typeof t.toast.action == 'function' ? s(B) : s(R, !1);
							});
						}
						a(T, r);
					};
					_(ct, (T) => {
						t.toast.action && T(dt);
					});
				}
				(V((T) => It(M, 1, T), [() => xt(wt(e(et)?.title, t.toast?.classes?.title))]), a(m, b));
			};
		_(_e, (m) => {
			t.toast.component ? m(ye) : m(be, !1);
		});
	}
	(p(y),
		Ge(
			y,
			(m) => c(J, m),
			() => e(J)
		),
		V(
			(m, b, S, k) => {
				(It(y, 1, m),
					D(y, 'data-rich-colors', t.toast.richColors ?? P()),
					D(y, 'data-styled', !(t.toast.component || t.toast.unstyled || I())),
					D(y, 'data-mounted', e(C)),
					D(y, 'data-promise', b),
					D(y, 'data-swiped', e(ut)),
					D(y, 'data-removed', e(O)),
					D(y, 'data-visible', e(le)),
					D(y, 'data-y-position', e(Jt)[0]),
					D(y, 'data-x-position', e(Jt)[1]),
					D(y, 'data-index', t.index),
					D(y, 'data-front', e(Rt)),
					D(y, 'data-swiping', e(st)),
					D(y, 'data-dismissable', e(ft)),
					D(y, 'data-type', e(E)),
					D(y, 'data-invert', e(fe)),
					D(y, 'data-swipe-out', e(lt)),
					D(y, 'data-swipe-direction', e(X)),
					D(y, 'data-expanded', S),
					($t = re(y, `${t.style} ${t.toast.style}`, $t, k)));
			},
			[
				() =>
					xt(
						wt(
							t.class,
							e(Et),
							e(et)?.toast,
							t.toast?.classes?.toast,
							e(et)?.[e(E)],
							t.toast?.classes?.[e(E)]
						)
					),
				() => !!t.toast.promise,
				() => !!(t.expanded || (t.expandByDefault && e(C))),
				() => ({
					'--index': t.index,
					'--toasts-before': t.index,
					'--z-index': W.toasts.length - t.index,
					'--offset': `${e(O) ? e(G) : e(i)}px`,
					'--initial-height': t.expandByDefault ? 'auto' : `${e($)}px`
				})
			]
		),
		ln('dragend', y, vt),
		a(n, y),
		Lt());
}
cn(['pointermove', 'pointerup', 'pointerdown', 'click']);
var ca = qt(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-success-icon=""><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"></path></svg>'
);
function da(n) {
	var t = ca();
	a(n, t);
}
var ua = qt(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-error-icon=""><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>'
);
function fa(n) {
	var t = ua();
	a(n, t);
}
var ma = qt(
	'<svg viewBox="0 0 64 64" fill="currentColor" height="20" width="20" data-sonner-warning-icon="" xmlns="http://www.w3.org/2000/svg"><path d="M32.427,7.987c2.183,0.124 4,1.165 5.096,3.281l17.936,36.208c1.739,3.66 -0.954,8.585 -5.373,8.656l-36.119,0c-4.022,-0.064 -7.322,-4.631 -5.352,-8.696l18.271,-36.207c0.342,-0.65 0.498,-0.838 0.793,-1.179c1.186,-1.375 2.483,-2.111 4.748,-2.063Zm-0.295,3.997c-0.687,0.034 -1.316,0.419 -1.659,1.017c-6.312,11.979 -12.397,24.081 -18.301,36.267c-0.546,1.225 0.391,2.797 1.762,2.863c12.06,0.195 24.125,0.195 36.185,0c1.325,-0.064 2.321,-1.584 1.769,-2.85c-5.793,-12.184 -11.765,-24.286 -17.966,-36.267c-0.366,-0.651 -0.903,-1.042 -1.79,-1.03Z"></path><path d="M33.631,40.581l-3.348,0l-0.368,-16.449l4.1,0l-0.384,16.449Zm-3.828,5.03c0,-0.609 0.197,-1.113 0.592,-1.514c0.396,-0.4 0.935,-0.601 1.618,-0.601c0.684,0 1.223,0.201 1.618,0.601c0.395,0.401 0.593,0.905 0.593,1.514c0,0.587 -0.193,1.078 -0.577,1.473c-0.385,0.395 -0.929,0.593 -1.634,0.593c-0.705,0 -1.249,-0.198 -1.634,-0.593c-0.384,-0.395 -0.576,-0.886 -0.576,-1.473Z"></path></svg>'
);
function va(n) {
	var t = ma();
	a(n, t);
}
var ga = qt(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-info-icon=""><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"></path></svg>'
);
function ha(n) {
	var t = ga();
	a(n, t);
}
var _a = qt(
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-sonner-close-icon=""><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
);
function ya(n) {
	var t = _a();
	a(n, t);
}
const ba = 3,
	Ze = '24px',
	Xe = '16px',
	wa = 4e3,
	xa = 356,
	Ia = 14,
	Be = 'dark',
	oe = 'light';
function Ta(n, t) {
	const o = {};
	return (
		[n, t].forEach((l, u) => {
			const f = u === 1,
				I = f ? '--mobile-offset' : '--offset',
				P = f ? Xe : Ze;
			function A(C) {
				['top', 'right', 'bottom', 'left'].forEach((O) => {
					o[`${I}-${O}`] = typeof C == 'number' ? `${C}px` : C;
				});
			}
			typeof l == 'number' || typeof l == 'string'
				? A(l)
				: typeof l == 'object'
					? ['top', 'right', 'bottom', 'left'].forEach((C) => {
							const O = l[C];
							O === void 0
								? (o[`${I}-${C}`] = P)
								: (o[`${I}-${C}`] = typeof O == 'number' ? `${O}px` : O);
						})
					: A(P);
		}),
		o
	);
}
var Ca = Y('<ol></ol>'),
	Sa = Y(
		'<section aria-live="polite" aria-relevant="additions text" aria-atomic="false" class="svelte-tppj9g"><!></section>'
	);
function Ma(n, t) {
	Ot(t, !0);
	function o(i) {
		return i !== 'system'
			? i
			: typeof window < 'u' &&
				  window.matchMedia &&
				  window.matchMedia('(prefers-color-scheme: dark)').matches
				? Be
				: oe;
	}
	let l = x(t, 'invert', 3, !1),
		u = x(t, 'position', 3, 'bottom-right'),
		f = x(t, 'hotkey', 19, () => ['altKey', 'KeyT']),
		I = x(t, 'expand', 3, !1),
		P = x(t, 'closeButton', 3, !1),
		A = x(t, 'offset', 3, Ze),
		C = x(t, 'mobileOffset', 3, Xe),
		O = x(t, 'theme', 3, 'light'),
		st = x(t, 'richColors', 3, !1),
		lt = x(t, 'duration', 3, wa),
		ut = x(t, 'visibleToasts', 3, ba),
		G = x(t, 'toastOptions', 19, () => ({})),
		$ = x(t, 'dir', 7, 'auto'),
		Tt = x(t, 'gap', 3, Ia),
		J = x(t, 'containerAriaLabel', 3, 'Notifications'),
		tt = x(t, 'closeButtonAriaLabel', 3, 'Close toast'),
		X = _n(t, [
			'$$slots',
			'$$events',
			'$$legacy',
			'invert',
			'position',
			'hotkey',
			'expand',
			'closeButton',
			'offset',
			'mobileOffset',
			'theme',
			'richColors',
			'duration',
			'visibleToasts',
			'toastOptions',
			'dir',
			'gap',
			'loadingIcon',
			'successIcon',
			'errorIcon',
			'warningIcon',
			'closeIcon',
			'infoIcon',
			'containerAriaLabel',
			'class',
			'closeButtonAriaLabel',
			'onblur',
			'onfocus',
			'onmouseenter',
			'onmousemove',
			'onmouseleave',
			'ondragend',
			'onpointerdown',
			'onpointerup'
		]);
	function Rt() {
		if ($() !== 'auto') return $();
		if (typeof window > 'u' || typeof document > 'u') return 'ltr';
		const i = document.documentElement.getAttribute('dir');
		return i === 'auto' || !i
			? (Xt(() => $(window.getComputedStyle(document.documentElement).direction ?? 'ltr')), $())
			: (Xt(() => $(i)), i);
	}
	const le = h(() =>
		Array.from(
			new Set([u(), ...W.toasts.filter((i) => i.position).map((i) => i.position)].filter(Boolean))
		)
	);
	let E = H(!1),
		ft = H(!1),
		Et = H(We(o(O()))),
		Ct = H(void 0),
		mt = H(null),
		Dt = H(!1);
	const ce = h(() => f().join('+').replace(/Key/g, '').replace(/Digit/g, ''));
	(_t(() => {
		W.toasts.length <= 1 && c(E, !1);
	}),
		_t(() => {
			const i = W.toasts.filter((L) => L.dismiss && !L.delete);
			if (i.length > 0) {
				const L = W.toasts.map((nt) =>
					i.find((Mt) => Mt.id === nt.id) ? { ...nt, delete: !0 } : nt
				);
				W.toasts = L;
			}
		}),
		_t(() => () => {
			e(Ct) && e(mt) && (e(mt).focus({ preventScroll: !0 }), c(mt, null), c(Dt, !1));
		}),
		Ae(
			() => (
				W.reset(),
				ie(document, 'keydown', (L) => {
					(f().every((yt) => L[yt] || L.code === yt) && (c(E, !0), e(Ct)?.focus()),
						L.code === 'Escape' &&
							(document.activeElement === e(Ct) || e(Ct)?.contains(document.activeElement)) &&
							c(E, !1));
				})
			)
		),
		_t(() => {
			if ((O() !== 'system' && c(Et, O()), typeof window < 'u')) {
				O() === 'system' &&
					(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
						? c(Et, Be)
						: c(Et, oe));
				const i = window.matchMedia('(prefers-color-scheme: dark)'),
					L = ({ matches: nt }) => {
						c(Et, nt ? Be : oe, !0);
					};
				'addEventListener' in i ? i.addEventListener('change', L) : i.addListener(L);
			}
		}));
	const St = (i) => {
			(t.onblur?.(i),
				e(Dt) &&
					!i.currentTarget.contains(i.relatedTarget) &&
					(c(Dt, !1), e(mt) && (e(mt).focus({ preventScroll: !0 }), c(mt, null))));
		},
		Jt = (i) => {
			(t.onfocus?.(i),
				!(i.target instanceof HTMLElement && i.target.dataset.dismissable === 'false') &&
					(e(Dt) || (c(Dt, !0), c(mt, i.relatedTarget, !0))));
		},
		de = (i) => {
			(t.onpointerdown?.(i),
				!(i.target instanceof HTMLElement && i.target.dataset.dismissable === 'false') &&
					c(ft, !0));
		},
		ue = (i) => {
			(t.onmouseenter?.(i), c(E, !0));
		},
		fe = (i) => {
			(t.onmouseleave?.(i), e(ft) || c(E, !1));
		},
		Ft = (i) => {
			(t.onmousemove?.(i), c(E, !0));
		},
		et = (i) => {
			(t.ondragend?.(i), c(E, !1));
		},
		me = (i) => {
			(t.onpointerup?.(i), c(ft, !1));
		};
	Vn.set(new xn());
	var At = Sa();
	D(At, 'tabindex', -1);
	var Kt = rt(At);
	{
		var Qt = (i) => {
			var L = v(),
				nt = d(L);
			(Ee(
				nt,
				18,
				() => e(le),
				(yt) => yt,
				(yt, Mt, ve, Pe) => {
					var bt = Ca();
					const pt = h(() => {
							const [Q, y] = Mt.split('-');
							return { y: Q, x: y };
						}),
						vt = h(() => Ta(A(), C()));
					(yn(
						bt,
						(Q, y) => ({
							tabindex: -1,
							dir: Q,
							class: t.class,
							'data-sonner-toaster': !0,
							'data-sonner-theme': e(Et),
							'data-y-position': e(pt).y,
							'data-x-position': e(pt).x,
							style: t.style,
							onblur: St,
							onfocus: Jt,
							onmouseenter: ue,
							onmousemove: Ft,
							onmouseleave: fe,
							ondragend: et,
							onpointerdown: de,
							onpointerup: me,
							...X,
							[bn]: y
						}),
						[
							Rt,
							() => ({
								'--front-toast-height': `${W.heights[0]?.height}px`,
								'--width': `${xa}px`,
								'--gap': `${Tt()}px`,
								'--offset-top': e(vt)['--offset-top'],
								'--offset-right': e(vt)['--offset-right'],
								'--offset-bottom': e(vt)['--offset-bottom'],
								'--offset-left': e(vt)['--offset-left'],
								'--mobile-offset-top': e(vt)['--mobile-offset-top'],
								'--mobile-offset-right': e(vt)['--mobile-offset-right'],
								'--mobile-offset-bottom': e(vt)['--mobile-offset-bottom'],
								'--mobile-offset-left': e(vt)['--mobile-offset-left']
							})
						],
						void 0,
						'svelte-tppj9g'
					),
						Ee(
							bt,
							23,
							() => W.toasts.filter((Q) => (!Q.position && e(ve) === 0) || Q.position === Mt),
							(Q) => Q.id,
							(Q, y, $t, ge) => {
								{
									const he = (at) => {
											var Z = v(),
												ct = d(Z);
											{
												var dt = (r) => {
														var g = v(),
															B = d(g);
														(it(B, () => t.successIcon ?? ht), a(r, g));
													},
													T = (r) => {
														var g = v(),
															B = d(g);
														{
															var R = (s) => {
																da(s);
															};
															_(
																B,
																(s) => {
																	t.successIcon !== null && s(R);
																},
																!0
															);
														}
														a(r, g);
													};
												_(ct, (r) => {
													t.successIcon ? r(dt) : r(T, !1);
												});
											}
											a(at, Z);
										},
										_e = (at) => {
											var Z = v(),
												ct = d(Z);
											{
												var dt = (r) => {
														var g = v(),
															B = d(g);
														(it(B, () => t.errorIcon ?? ht), a(r, g));
													},
													T = (r) => {
														var g = v(),
															B = d(g);
														{
															var R = (s) => {
																fa(s);
															};
															_(
																B,
																(s) => {
																	t.errorIcon !== null && s(R);
																},
																!0
															);
														}
														a(r, g);
													};
												_(ct, (r) => {
													t.errorIcon ? r(dt) : r(T, !1);
												});
											}
											a(at, Z);
										},
										ye = (at) => {
											var Z = v(),
												ct = d(Z);
											{
												var dt = (r) => {
														var g = v(),
															B = d(g);
														(it(B, () => t.warningIcon ?? ht), a(r, g));
													},
													T = (r) => {
														var g = v(),
															B = d(g);
														{
															var R = (s) => {
																va(s);
															};
															_(
																B,
																(s) => {
																	t.warningIcon !== null && s(R);
																},
																!0
															);
														}
														a(r, g);
													};
												_(ct, (r) => {
													t.warningIcon ? r(dt) : r(T, !1);
												});
											}
											a(at, Z);
										},
										be = (at) => {
											var Z = v(),
												ct = d(Z);
											{
												var dt = (r) => {
														var g = v(),
															B = d(g);
														(it(B, () => t.infoIcon ?? ht), a(r, g));
													},
													T = (r) => {
														var g = v(),
															B = d(g);
														{
															var R = (s) => {
																ha(s);
															};
															_(
																B,
																(s) => {
																	t.infoIcon !== null && s(R);
																},
																!0
															);
														}
														a(r, g);
													};
												_(ct, (r) => {
													t.infoIcon ? r(dt) : r(T, !1);
												});
											}
											a(at, Z);
										},
										m = (at) => {
											var Z = v(),
												ct = d(Z);
											{
												var dt = (r) => {
														var g = v(),
															B = d(g);
														(it(B, () => t.closeIcon ?? ht), a(r, g));
													},
													T = (r) => {
														var g = v(),
															B = d(g);
														{
															var R = (s) => {
																ya(s);
															};
															_(
																B,
																(s) => {
																	t.closeIcon !== null && s(R);
																},
																!0
															);
														}
														a(r, g);
													};
												_(ct, (r) => {
													t.closeIcon ? r(dt) : r(T, !1);
												});
											}
											a(at, Z);
										};
									let b = h(() => G()?.duration ?? lt()),
										S = h(() => G()?.class ?? ''),
										k = h(() => G()?.descriptionClass || ''),
										N = h(() => G()?.style ?? ''),
										M = h(() => G().classes || {}),
										K = h(() => G().unstyled ?? !1),
										kt = h(() => G()?.cancelButtonStyle ?? ''),
										zt = h(() => G()?.actionButtonStyle ?? ''),
										we = h(() => G()?.closeButtonAriaLabel ?? tt());
									la(Q, {
										get index() {
											return e($t);
										},
										get toast() {
											return e(y);
										},
										get defaultRichColors() {
											return st();
										},
										get duration() {
											return e(b);
										},
										get class() {
											return e(S);
										},
										get descriptionClass() {
											return e(k);
										},
										get invert() {
											return l();
										},
										get visibleToasts() {
											return ut();
										},
										get closeButton() {
											return P();
										},
										get interacting() {
											return e(ft);
										},
										get position() {
											return Mt;
										},
										get style() {
											return e(N);
										},
										get classes() {
											return e(M);
										},
										get unstyled() {
											return e(K);
										},
										get cancelButtonStyle() {
											return e(kt);
										},
										get actionButtonStyle() {
											return e(zt);
										},
										get closeButtonAriaLabel() {
											return e(we);
										},
										get expandByDefault() {
											return I();
										},
										get expanded() {
											return e(E);
										},
										get loadingIcon() {
											return t.loadingIcon;
										},
										successIcon: he,
										errorIcon: _e,
										warningIcon: ye,
										infoIcon: be,
										closeIcon: m,
										$$slots: {
											successIcon: !0,
											errorIcon: !0,
											warningIcon: !0,
											infoIcon: !0,
											closeIcon: !0
										}
									});
								}
							}
						),
						p(bt),
						Ge(
							bt,
							(Q) => c(Ct, Q),
							() => e(Ct)
						),
						V(() => (bt.dir = bt.dir)),
						a(yt, bt));
				}
			),
				a(i, L));
		};
		_(Kt, (i) => {
			W.toasts.length > 0 && i(Qt);
		});
	}
	(p(At), V(() => D(At, 'aria-label', `${J() ?? ''} ${e(ce) ?? ''}`)), a(n, At), Lt());
}
function Ba(n) {
	return n;
}
function Ea(n) {
	const t = n - 1;
	return t * t * t + 1;
}
function Ve(n) {
	return Object.prototype.toString.call(n) === '[object Date]';
}
function De(n, t) {
	if (n === t || n !== n) return () => n;
	const o = typeof n;
	if (o !== typeof t || Array.isArray(n) !== Array.isArray(t))
		throw new Error('Cannot interpolate values of different type');
	if (Array.isArray(n)) {
		const l = t.map((u, f) => De(n[f], u));
		return (u) => l.map((f) => f(u));
	}
	if (o === 'object') {
		if (!n || !t) throw new Error('Object cannot be null');
		if (Ve(n) && Ve(t)) {
			const f = n.getTime(),
				P = t.getTime() - f;
			return (A) => new Date(f + A * P);
		}
		const l = Object.keys(t),
			u = {};
		return (
			l.forEach((f) => {
				u[f] = De(n[f], t[f]);
			}),
			(f) => {
				const I = {};
				return (
					l.forEach((P) => {
						I[P] = u[P](f);
					}),
					I
				);
			}
		);
	}
	if (o === 'number') {
		const l = t - n;
		return (u) => n + u * l;
	}
	return () => t;
}
class ke {
	#t;
	#e;
	#a;
	#n = null;
	constructor(t, o = {}) {
		((this.#t = H(t)), (this.#e = H(t)), (this.#a = o));
	}
	static of(t, o) {
		const l = new ke(t(), o);
		return (
			rn(() => {
				l.set(t());
			}),
			l
		);
	}
	set(t, o) {
		c(this.#e, t);
		let {
			delay: l = 0,
			duration: u = 400,
			easing: f = Ba,
			interpolate: I = De
		} = { ...this.#a, ...o };
		if (u === 0) return (this.#n?.abort(), c(this.#t, t), Promise.resolve());
		const P = In.now() + l;
		let A,
			C = !1,
			O = this.#n;
		return (
			(this.#n = Tn((st) => {
				if (st < P) return !0;
				if (!C) {
					C = !0;
					const ut = this.#t.v;
					((A = I(ut, t)), typeof u == 'function' && (u = u(ut, t)), O?.abort());
				}
				const lt = st - P;
				return lt > u ? (c(this.#t, t), !1) : (c(this.#t, A(f(lt / u))), !0);
			})),
			this.#n.promise
		);
	}
	get current() {
		return e(this.#t);
	}
	get target() {
		return e(this.#e);
	}
	set target(t) {
		this.set(t);
	}
}
var Da = Y(
	'<div class="fixed top-0 z-50 h-[2px] w-full bg-white transition-all will-change-transform"><div class="bg-primary h-full"></div></div>'
);
function Aa(n, t) {
	Ot(t, !0);
	let o = H(!1);
	const l = new ke(0, { duration: 400, easing: Ea });
	async function u() {
		if (Me) {
			(c(o, !0), (l.target = 0));
			const A = setInterval(() => {
				l.target = l.current + 0.05;
			}, 100);
			(await Me.complete,
				clearInterval(A),
				(l.target = 1),
				setTimeout(() => {
					(c(o, !1), (l.target = 0));
				}, 500));
		}
	}
	_t(() => {
		Me.to && u();
	});
	var f = v(),
		I = d(f);
	{
		var P = (A) => {
			var C = Da(),
				O = rt(C);
			(p(C), V(() => re(O, `width: ${l.current * 100}%`)), Cn(3, C, () => Sn), a(A, C));
		};
		_(I, (A) => {
			e(o) && A(P);
		});
	}
	(a(n, f), Lt());
}
var ka = Y('<!> <!> <!> <!>', 1);
function Ja(n, t) {
	const [o, l] = en(),
		u = () => nn(Bn, '$title', o);
	var f = ka();
	Ye((O) => {
		V(() => (sn.title = `Opendrive - ${u() ?? ''}`));
	});
	var I = d(f);
	Ln(I, {});
	var P = gt(I, 2);
	Aa(P, {});
	var A = gt(P, 2);
	it(A, () => t.children);
	var C = gt(A, 2);
	(Ma(C, { position: 'bottom-right', richColors: !0, closeButton: !0 }), a(n, f), l());
}
export { Ja as component, qa as universal };
