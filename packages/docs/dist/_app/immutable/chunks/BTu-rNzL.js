import {
	U as ie,
	p as H,
	f as b,
	s as $,
	d as D,
	u as J,
	v as q,
	r as L,
	t as z,
	J as F,
	K as G,
	b as s,
	c as K,
	y as C,
	x as t,
	C as M,
	aj as ce,
	k as A,
	P as de,
	h as j,
	a as y,
	A as B,
	ak as oe,
	w as X,
	e as E,
	a0 as Z,
	al as me,
	z as Y,
	n as P,
	g as O,
	H as ue,
	j as N
} from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as ve, P as pe } from './CXunQUVT.js';
import { t as he } from './BBPflcbS.js';
import { C as se, f as V, P as fe } from './DZj8j_ml.js';
import { O as ge } from './eLU9aUh4.js';
import { L as ee } from './EJ1QvGwo.js';
import { S as te } from './Bqu0--pl.js';
function W(...o) {
	return he(ie(o));
}
var _e = b(
	'<div><div class="border-b border-inherit p-4"><div class="flex items-center gap-2"><div class="size-2 rounded-full bg-[#ef4444]"></div> <div class="size-2 rounded-full bg-[#eab308]"></div> <div class="size-2 rounded-full bg-[#22c55e]"></div></div></div> <div class="p-4"><!></div></div>'
);
function ye(o, e) {
	H(e, !0);
	var a = _e(),
		c = $(D(a), 2),
		l = D(c);
	(J(l, () => e.children ?? q),
		L(c),
		L(a),
		z(
			(i) => G(a, 1, i),
			[
				() =>
					F(
						W(
							'border-border bg-background aspect-video w-full rounded-lg border',
							e.class
						)
					)
			]
		),
		s(o, a),
		K());
}
class xe {
	constructor(e, a) {
		((this.opts = e), (this.loop = a), (this.onComplete = this.onComplete.bind(this)));
	}
	#e = C(ce([]));
	#t;
	play() {
		this.#t = setTimeout(() => {
			t(this.#e).sort((e, a) => e.delay - a.delay);
			for (let e = 0; e < t(this.#e).length; e++)
				t(this.#e)[e].timeout = setTimeout(() => {
					(t(this.#e)[e].play(this.opts.speed),
						e === t(this.#e).length - 1 &&
							(t(this.#e)[e].onComplete = this.onComplete));
				}, t(this.#e)[e].delay);
		}, this.opts.delay);
	}
	onComplete() {
		(this.opts.onComplete?.(), this.loop?.onComplete());
	}
	dispose() {
		clearTimeout(this.#t);
	}
	registerAnimation(e) {
		t(this.#e).push(e);
	}
}
class be {
	constructor(e, a) {
		((this.rootState = e), (this.opts = a), (this.delay = a.delay), e.registerAnimation(this));
	}
	delay;
	timeout;
	#e = C();
	get onComplete() {
		return t(this.#e);
	}
	set onComplete(e) {
		M(this.#e, e, !0);
	}
	play(e) {
		this.opts.play(e);
	}
	dispose() {
		clearTimeout(this.timeout);
	}
}
const ke = new se('Terminal.Loop'),
	ne = new se('Terminal.Root'),
	Ce = (o) => {
		let e;
		try {
			e = ke.get();
		} catch {}
		return ne.set(new xe(o, e));
	},
	re = (o) => new be(ne.get(), o);
function $e(o, e) {
	H(e, !0);
	let a = A(e, 'delay', 3, 0),
		c = A(e, 'speed', 3, 1),
		l = A(e, 'onComplete', 3, () => {});
	const i = Ce({ delay: a(), speed: c(), onComplete: l() });
	de(
		() => (
			i.play(),
			() => {
				i.dispose();
			}
		)
	);
	{
		let m = B(() => W('font-mono text-sm font-light', e.class));
		ye(o, {
			get class() {
				return t(m);
			},
			children: (p, h) => {
				var _ = j(),
					n = y(_);
				(J(n, () => e.children ?? q), s(p, _));
			},
			$$slots: { default: !0 }
		});
	}
	K();
}
var Te = b('<span><span class="text-cyan-400"> </span> <!></span>'),
	we = b('<span data-completed=""><!></span>');
function ae(o, e) {
	H(e, !0);
	const a = ['◒', '◐', '◓', '◑'];
	let c = A(e, 'delay', 3, 0),
		l = A(e, 'duration', 3, 1e3),
		i = C(!1),
		m = C(1),
		p = C(0),
		h = C(!1),
		_ = C(void 0),
		n = C(void 0);
	const f = (g) => {
			(M(i, !0),
				M(m, g, !0),
				M(_, setInterval(R, 75 / t(m)), !0),
				M(
					n,
					setTimeout(
						() => {
							(M(h, !0), I.onComplete?.());
						},
						l() / t(m)
					),
					!0
				));
		},
		R = () => {
			if (t(p) >= a.length - 1) {
				M(p, 0);
				return;
			}
			me(p);
		},
		k = B(() => 300 / t(m)),
		I = re({ delay: c(), play: f });
	oe(() => {
		(I.dispose(), clearInterval(t(_)), clearTimeout(t(n)));
	});
	var T = j(),
		w = y(T);
	{
		var S = (g) => {
				var u = Te(),
					x = D(u),
					d = D(x, !0);
				L(x);
				var r = $(x, 2);
				(J(r, () => e.loadingMessage),
					L(u),
					z(
						(v) => {
							(G(u, 1, v), E(d, a[t(p)]));
						},
						[() => F(W('block', e.class))]
					),
					Z(
						1,
						u,
						() => V,
						() => ({ y: -5, duration: t(k) })
					),
					s(g, u));
			},
			U = (g) => {
				var u = j(),
					x = y(u);
				{
					var d = (r) => {
						var v = we(),
							Q = D(v);
						(J(Q, () => e.completeMessage),
							L(v),
							z((le) => G(v, 1, le), [() => F(W('block', e.class))]),
							Z(
								1,
								v,
								() => V,
								() => ({ y: -5, duration: t(k) })
							),
							s(r, v));
					};
					X(
						x,
						(r) => {
							t(i) && r(d);
						},
						!0
					);
				}
				s(g, u);
			};
		X(w, (g) => {
			t(i) && !t(h) ? g(S) : g(U, !1);
		});
	}
	(s(o, T), K());
}
const Me = (o, { speed: e = 1, delay: a = 0, onComplete: c }) => {
	const l = o.textContent ?? '',
		i = l.length / (e * 0.01);
	return {
		delay: a,
		duration: i,
		tick: (m) => {
			const p = Math.trunc(l.length * m);
			((o.textContent = l.slice(0, p)), o.textContent.length === l.length && c?.());
		}
	};
};
var Pe = b('<span><!></span>');
function Ae(o, e) {
	H(e, !0);
	let a = A(e, 'delay', 3, 0),
		c = C(!1),
		l = C(1);
	const i = (n) => {
			(M(c, !0), M(l, n, !0));
		},
		m = re({ delay: a(), play: i });
	oe(() => m.dispose());
	var p = j(),
		h = y(p);
	{
		var _ = (n) => {
			var f = Pe(),
				R = D(f);
			(J(R, () => e.children ?? q),
				L(f),
				z((k) => G(f, 1, k), [() => F(W('block', e.class))]),
				Z(
					3,
					f,
					() => Me,
					() => ({ speed: t(l) * 2, onComplete: () => m.onComplete?.() })
				),
				s(n, f));
		};
		X(h, (n) => {
			t(c) && n(_);
		});
	}
	(s(o, p), K());
}
var Se = b('<span class="text-green-500"> </span>'),
	De = b(
		'Use the following URL to sign in once: <a class="underline" target="_blank" rel="noopener noreferrer"> </a>',
		1
	),
	Le = b('<!> <!> <!>', 1);
function Re(o, e) {
	let a = A(e, 'user', 3, 'test'),
		c = A(e, 'url', 3, 'http://localhost:3000/lc/YCvmQgrJbX0zEZbh'),
		l = A(e, 'speed', 3, 1),
		i = `❯ pocket-id one-time-access-token ${a()}`;
	const m = 35;
	let p = B(() => Math.ceil((i.length * m) / l())),
		h = B(() => t(p) + 200),
		_ = B(() => t(h) + 1e3);
	var n = j(),
		f = y(n);
	(Y(
		f,
		() => $e,
		(R, k) => {
			k(R, {
				class: 'custom-terminal-style my-5 w-full min-w-0 will-change-transform',
				delay: 250,
				get speed() {
					return l();
				},
				children: (I, T) => {
					var w = Le(),
						S = y(w);
					Y(
						S,
						() => Ae,
						(u, x) => {
							x(u, {
								children: (d, r) => {
									P();
									var v = O();
									(z(() => E(v, i)), s(d, v));
								},
								$$slots: { default: !0 }
							});
						}
					);
					var U = $(S, 2);
					{
						const u = (d) => {
								P();
								var r = O('Generating one-time access token...');
								s(d, r);
							},
							x = (d) => {
								var r = Se(),
									v = D(r);
								(L(r),
									z(() =>
										E(
											v,
											`✔ A one-time access token valid for 1 hour has been created for "${a() ?? ''}".`
										)
									),
									s(d, r));
							};
						Y(
							U,
							() => ae,
							(d, r) => {
								r(d, {
									get delay() {
										return t(h);
									},
									loadingMessage: u,
									completeMessage: x,
									$$slots: { loadingMessage: !0, completeMessage: !0 }
								});
							}
						);
					}
					var g = $(U, 2);
					{
						const u = (d) => {
								P();
								var r = O('Waiting for URL...');
								s(d, r);
							},
							x = (d) => {
								P();
								var r = De(),
									v = $(y(r)),
									Q = D(v, !0);
								(L(v),
									z(() => {
										(ue(v, 'href', c()), E(Q, c()));
									}),
									s(d, r));
							};
						Y(
							g,
							() => ae,
							(d, r) => {
								r(d, {
									get delay() {
										return t(_);
									},
									loadingMessage: u,
									completeMessage: x,
									$$slots: { loadingMessage: !0, completeMessage: !0 }
								});
							}
						);
					}
					s(I, w);
				},
				$$slots: { default: !0 }
			});
		}
	),
		s(o, n));
}
const Ue = { title: 'Account Recovery', description: 'Solutions to account recovery issues' },
	{ title: Ke, description: Qe } = Ue;
var ze = b(
		`<!>: An admin can create a one-time access link for the user in the admin panel under the "Users" tab by clicking on the three dots next to the user's name and selecting "One-time link".`,
		1
	),
	Ie = b(
		'<!>: You can create a one-time access link for a user by running <!>. To execute this script with Docker you have to run the following command:',
		1
	),
	Oe = b('<!> <!>', 1),
	je = b('<!> <!> <!> <!>', 1);
function Xe(o) {
	ve(o, {
		children: (e, a) => {
			var c = je(),
				l = y(c);
			pe(l, {
				children: (h, _) => {
					P();
					var n = O('There are two ways to create a one-time access link for a user:');
					s(h, n);
				},
				$$slots: { default: !0 }
			});
			var i = $(l, 2);
			ge(i, {
				children: (h, _) => {
					var n = Oe(),
						f = y(n);
					ee(f, {
						children: (k, I) => {
							var T = ze(),
								w = y(T);
							(te(w, {
								children: (S, U) => {
									P();
									var g = O('UI');
									s(S, g);
								},
								$$slots: { default: !0 }
							}),
								P(),
								s(k, T));
						},
						$$slots: { default: !0 }
					});
					var R = $(f, 2);
					(ee(R, {
						children: (k, I) => {
							var T = Ie(),
								w = y(T);
							te(w, {
								children: (U, g) => {
									P();
									var u = O('Terminal');
									s(U, u);
								},
								$$slots: { default: !0 }
							});
							var S = $(w, 2);
							(N(
								S,
								() =>
									'<code>pocket-id one-time-access-token &lt;user name or email></code>'
							),
								P(),
								s(k, T));
						},
						$$slots: { default: !0 }
					}),
						s(h, n));
				},
				$$slots: { default: !0 }
			});
			var m = $(i, 2);
			fe(m, {
				children: (h, _) => {
					var n = j(),
						f = y(n);
					(N(
						f,
						() => `<code class="language-bash">docker compose exec pocket-id /app/pocket-id one-time-access-token &lt;user name or email>
</code>`
					),
						s(h, n));
				},
				$$slots: { default: !0 }
			});
			var p = $(m, 2);
			(Re(p, { user: 'test' }), s(e, c));
		}
	});
}
export { Xe as default, Ue as metadata };
