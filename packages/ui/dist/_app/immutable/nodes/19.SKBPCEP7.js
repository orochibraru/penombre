import { r as K } from '../chunks/KjYeVjkE.js';
import { g as L, a as M } from '../chunks/DxtMK8if.js';
import { r as N } from '../chunks/Dd5NUPG5.js';
import { s as U, a as E } from '../chunks/1HBmZ_db.js';
import {
	p as H,
	f as l,
	t as C,
	a as e,
	b as Q,
	G as n,
	c as O,
	K as _,
	r as h,
	F as j,
	u as x,
	J as R,
	o as V,
	q as z,
	I as W
} from '../chunks/BW6z9EX9.js';
import { s as X } from '../chunks/DzGRxXYC.js';
import { i as B } from '../chunks/ClaijROu.js';
import { c as Y, s as Z, e as tt, i as et } from '../chunks/BPMCz5tT.js';
import { c as $ } from '../chunks/C-vcVqpF.js';
import { g as at } from '../chunks/Dufayr-D.js';
import { C as rt, A as ot, a as st, b as it } from '../chunks/Duew6H7Z.js';
import { B as nt } from '../chunks/B00PyzgL.js';
import { t as lt } from '../chunks/Dy9FI1NM.js';
import { c as ct, a as dt } from '../chunks/Bvsacp8G.js';
const pt = async () => {
		const { data: c, err: a } = await L();
		if (a) return { providers: [] };
		const { data: b } = await M();
		return b?.session ? K(307, N('/')) : { providers: c ?? [] };
	},
	jt = Object.freeze(
		Object.defineProperty({ __proto__: null, load: pt }, Symbol.toStringTag, { value: 'Module' })
	);
var ft = l('<div class="grid gap-2"></div>'),
	mt = l(
		'<p>Please read <a target="_blank" class="underline" href="https://opendrive.space/docs">the docs</a> to configure an auth provider.</p>'
	),
	vt = l('<!> <!> <!>', 1),
	ut = l(
		'<form><div class="flex flex-col items-center gap-2 text-center"><h1 class="text-2xl font-bold">Access to your account</h1> <p class="text-muted-foreground text-sm text-balance">Choose one of the sign in methods to continue.</p></div> <!> <div class="grid gap-6"><!> <div class="text-center text-sm">Don&apos;t have an account? Too bad.</div></div></form>'
	);
function zt(c, a) {
	H(a, !0);
	const [b, F] = E();
	let P = R(!1);
	U(lt, 'Sign in');
	async function I(t) {
		(W(P, !0), await at(`/api/v1/auth/oauth/${t}/login`));
	}
	var o = ut(),
		S = n(O(o), 2);
	B(S, (t) => {});
	var w = n(S, 2),
		T = O(w);
	{
		var q = (t) => {
				var r = ft();
				(tt(
					r,
					21,
					() => a.data.providers,
					et,
					(d, s) => {
						nt(d, {
							variant: 'outline',
							class: 'w-full',
							get loading() {
								return x(P);
							},
							onclick: () => I(x(s)),
							children: (p, y) => {
								_();
								var f = j();
								(C((i) => X(f, `Sign in with ${i ?? ''}`), [() => dt(x(s))]), e(p, f));
							},
							$$slots: { default: !0 }
						});
					}
				),
					h(r),
					e(t, r));
			},
			D = (t) => {
				var r = V(),
					d = z(r);
				($(
					d,
					() => it,
					(s, p) => {
						p(s, {
							children: (y, f) => {
								var i = vt(),
									A = z(i);
								rt(A, {});
								var k = n(A, 2);
								$(
									k,
									() => ot,
									(m, v) => {
										v(m, {
											children: (u, J) => {
												_();
												var g = j('No providers have been configured for this application.');
												e(u, g);
											},
											$$slots: { default: !0 }
										});
									}
								);
								var G = n(k, 2);
								($(
									G,
									() => st,
									(m, v) => {
										v(m, {
											children: (u, J) => {
												var g = mt();
												e(u, g);
											},
											$$slots: { default: !0 }
										});
									}
								),
									e(y, i));
							},
							$$slots: { default: !0 }
						});
					}
				),
					e(t, r));
			};
		B(T, (t) => {
			a.data.providers && a.data.providers.length > 0 ? t(q) : t(D, !1);
		});
	}
	(_(2), h(w), h(o), C((t) => Z(o, 1, t), [() => Y(ct('flex flex-col gap-6'))]), e(c, o), Q(), F());
}
export { zt as component, jt as universal };
