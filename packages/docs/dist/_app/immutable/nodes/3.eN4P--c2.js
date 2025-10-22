import {
	p as _,
	a3 as Ct,
	o as A,
	b as l,
	c as y,
	q as M,
	k as R,
	f as h,
	d as o,
	u as T,
	v as j,
	r,
	m as E,
	a4 as xt,
	a5 as kt,
	a6 as Pt,
	a7 as Yt,
	a8 as At,
	a9 as Mt,
	aa as Ot,
	ab as zt,
	ac as Dt,
	ad as Ft,
	P as It,
	F as St,
	w as Bt,
	S as vt,
	t as S,
	$ as Lt,
	a as P,
	ae as ut,
	af as Rt,
	s as v,
	ag as Tt,
	C as jt,
	y as Et,
	n as Y,
	ah as mt,
	ai as x,
	x as s,
	e as B,
	z as gt,
	A as L,
	K as ht,
	J as Gt,
	H as pt,
	g as ft
} from '../chunks/ZGPguNnN.js';
import { c as O, B as H } from '../chunks/BBPflcbS.js';
import { B as Ut } from '../chunks/XxJimDSk.js';
async function Ht() {
	let u = null;
	try {
		const t = await fetch('https://analytics.pocket-id.org/stats');
		if (!t.ok) throw new Error('Failed to fetch instance count');
		u = (await t.json()).total;
	} catch (t) {
		console.error('Error fetching instance count:', t);
	}
	return { instanceCount: u };
}
const xe = Object.freeze(
	Object.defineProperty({ __proto__: null, load: Ht }, Symbol.toStringTag, { value: 'Module' })
);
var qt = Ct(
	'<svg><g stroke-linecap="round"><g transform="translate(11.145277371630073 36.74839942056428) rotate(0 79.30063906887085 0.9091689232315048)"><path d="M-1.15 0.32 C11.9 0.63, 64.54 5.67, 78.54 2.21 C92.54 -1.25, 87.24 -16.24, 82.86 -20.46 C78.48 -24.68, 53.29 -30.73, 52.26 -23.11 C51.23 -15.49, 66.97 22.37, 76.69 25.25 C86.4 28.14, 96.82 -0.58, 110.54 -5.8 C124.26 -11.02, 151.22 -5.98, 159.03 -6.04 M0.45 -0.56 C13.84 -0.08, 66.55 6.8, 80.7 3.71 C94.85 0.61, 90.01 -14.87, 85.35 -19.14 C80.69 -23.4, 54.44 -29.38, 52.74 -21.91 C51.04 -14.43, 65.36 23.23, 75.14 25.72 C84.92 28.21, 97.29 -1.48, 111.42 -6.95 C125.55 -12.43, 151.9 -7.26, 159.9 -7.14" stroke="white" stroke-width="2" fill="none"></path></g><g transform="translate(11.145277371630073 36.74839942056428) rotate(0 79.30063906887085 0.9091689232315048)"><path d="M137.15 -1.16 C144.96 -4.61, 151.62 -6.07, 159.9 -7.14 M137.15 -1.16 C143.85 -2.87, 149.96 -4.97, 159.9 -7.14" stroke="white" stroke-width="2" fill="none"></path></g><g transform="translate(11.145277371630073 36.74839942056428) rotate(0 79.30063906887085 0.9091689232315048)"><path d="M138.63 -17.19 C146.01 -15.51, 152.19 -11.82, 159.9 -7.14 M138.63 -17.19 C144.94 -14.07, 150.61 -11.36, 159.9 -7.14" stroke="white" stroke-width="2" fill="none"></path></g></g><mask></mask></svg>'
);
function Kt(u, t) {
	_(t, !0);
	let e = M(t, ['$$slots', '$$events', '$$legacy', 'class']);
	var m = qt();
	(A(
		m,
		(a) => ({
			version: '1.1',
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 181.0484047549312 72.61928578581296',
			class: a,
			...e
		}),
		[() => O(t.class)]
	),
		l(u, m),
		y());
}
var Jt = h('<div><!></div>');
function Nt(u, t) {
	_(t, !0);
	let e = R(t, 'ref', 15, null),
		m = M(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var a = Jt();
	A(a, (i) => ({ 'data-slot': 'card', class: i, ...m }), [
		() =>
			O(
				'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
				t.class
			)
	]);
	var p = o(a);
	(T(p, () => t.children ?? j),
		r(a),
		E(
			a,
			(i) => e(i),
			() => e()
		),
		l(u, a),
		y());
}
var Vt = h('<div><!></div>');
function Wt(u, t) {
	_(t, !0);
	let e = R(t, 'ref', 15, null),
		m = M(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var a = Vt();
	A(a, (i) => ({ 'data-slot': 'card-content', class: i, ...m }), [() => O('px-6', t.class)]);
	var p = o(a);
	(T(p, () => t.children ?? j),
		r(a),
		E(
			a,
			(i) => e(i),
			() => e()
		),
		l(u, a),
		y());
}
var Qt = h('<p><!></p>');
function Xt(u, t) {
	_(t, !0);
	let e = R(t, 'ref', 15, null),
		m = M(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var a = Qt();
	A(a, (i) => ({ 'data-slot': 'card-description', class: i, ...m }), [
		() => O('text-muted-foreground text-sm', t.class)
	]);
	var p = o(a);
	(T(p, () => t.children ?? j),
		r(a),
		E(
			a,
			(i) => e(i),
			() => e()
		),
		l(u, a),
		y());
}
var Zt = h('<div><!></div>');
function te(u, t) {
	_(t, !0);
	let e = R(t, 'ref', 15, null),
		m = M(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var a = Zt();
	A(a, (i) => ({ 'data-slot': 'card-header', class: i, ...m }), [
		() =>
			O(
				'@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
				t.class
			)
	]);
	var p = o(a);
	(T(p, () => t.children ?? j),
		r(a),
		E(
			a,
			(i) => e(i),
			() => e()
		),
		l(u, a),
		y());
}
var ee = h('<div><!></div>');
function ae(u, t) {
	_(t, !0);
	let e = R(t, 'ref', 15, null),
		m = M(t, ['$$slots', '$$events', '$$legacy', 'ref', 'class', 'children']);
	var a = ee();
	A(a, (i) => ({ 'data-slot': 'card-title', class: i, ...m }), [
		() => O('leading-none font-semibold', t.class)
	]);
	var p = o(a);
	(T(p, () => t.children ?? j),
		r(a),
		E(
			a,
			(i) => e(i),
			() => e()
		),
		l(u, a),
		y());
}
const se = [
		{
			icon: xt,
			title: 'Passwordless Authentication',
			description:
				'Opendrive only supports passwordless authentication, which is easier and more secure than signing in with a password.',
			image: 'auth_screenshot.png'
		},
		{
			icon: kt,
			title: 'Restrict User Groups',
			description:
				'You can select which user groups are allowed to authenticate with your services. Fine-grained access control ensures only authorized users can access your applications.',
			image: 'group_restriction_screenshot.png'
		},
		{
			icon: Pt,
			title: 'LDAP Integration',
			description: 'Sync your users and groups from your LDAP server to Opendrive.',
			image: 'ldap_screenshot.png'
		},
		{
			icon: Yt,
			title: 'REST API',
			description:
				'We have a documented REST API which allows you to create integrations. Build custom workflows and automate user management with our API.',
			image: 'rest_api_screenshot.png'
		},
		{
			icon: At,
			title: 'Flexible User Registration',
			description:
				"The admin can either create users manually, create sign up links, or allow open registration. Choose the registration method that fits your organization's needs.",
			image: 'registration_screenshot.png'
		}
	],
	re = [
		{
			icon: Mt,
			title: 'Login Code',
			description:
				"Create a one-time login code to sign in from a different device when you don't have your passkey available."
		},
		{
			icon: Ot,
			title: '10+ Languages',
			description:
				'The community has translated Opendrive into over 10 languages. More translations are always welcome!'
		},
		{
			icon: zt,
			title: 'Dark & Light Mode',
			description:
				'Opendrive matches your system theme, whether you prefer dark or light mode.'
		},
		{
			icon: Dt,
			title: 'Audit Logs',
			description: 'Comprehensive audit logs for important events, both global and per user.'
		},
		{
			icon: Ft,
			title: 'Mail Notifications',
			description: 'Automatic email notifications for sign-ins from unknown devices.'
		},
		{
			icon: xt,
			title: 'Self-Hosted',
			description:
				'Complete control over your authentication infrastructure with self-hosting.'
		}
	];
var oe = h(
		'<meta name="description" content="A simple and easy-to-use OIDC provider that allows users to authenticate with their passkeys to your services."/>'
	),
	ie = h('<!> Documentation', 1),
	ne = h('<!> Demo', 1),
	le = h(
		'<div class="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400"></div> ',
		1
	),
	de = h(
		'<div class="grid items-center gap-8 md:grid-cols-2"><div><div class="mb-4 flex items-center"><!> <h3 class="mb-0 text-2xl font-bold"> </h3></div> <p class="text-muted-foreground text-lg leading-relaxed"> </p></div> <div><img class="w-full rounded-lg"/></div></div>'
	),
	ce = h('<div class="flex items-center space-x-2"><!> <!></div>'),
	ve = h('<!> <!>', 1),
	ue = h('<!> Read Documentation', 1),
	me = h('<!> View on GitHub', 1),
	ge =
		h(`<div class="bg-background text-foreground min-h-screen"><section class="px-4 py-20"><div class="container mx-auto max-w-4xl text-center"><h1 class="text-foreground mb-6 text-5xl font-bold md:text-7xl">Opendrive</h1> <p class="text-muted-foreground mb-8 text-xl leading-relaxed md:text-2xl">A simple and easy-to-use OIDC provider that allows users to authenticate with their
				passkeys to your services.</p> <div class="flex flex-col justify-center gap-4 sm:flex-row"><!> <!></div> <div><!></div></div></section> <section id="features" class="px-4 pt-20 pb-10"><div class="container mx-auto"><div class="mb-16 text-center"><h2 class="mb-4 text-4xl font-bold">Key Features</h2> <p class="text-muted-foreground mx-auto max-w-2xl text-lg">Everything you need for modern authentication in one simple package</p></div> <div class="mx-auto grid max-w-6xl gap-12"></div></div></section> <section class="px-4 pb-20"><div class="container mx-auto"><div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3"></div></div></section> <section class="py-8"><div class="container mx-auto text-center"><!></div></section> <section class="px-4 py-10"><div class="container mx-auto max-w-3xl text-center"><h2 class="mb-6 text-3xl font-bold md:text-4xl">Ready to get started?</h2> <p class="text-muted-foreground mb-8 text-xl">Deploy Opendrive today and start providing secure, passwordless authentication to
				your users.</p> <div class="flex flex-col justify-center gap-4 sm:flex-row"><!> <!></div></div></section></div>`);
function _e(u, t) {
	_(t, !0);
	let e = Et(!1);
	It(() => {
		requestAnimationFrame(() => {
			jt(e, !0);
		});
	});
	var m = ge();
	St((d) => {
		var n = oe();
		((Lt.title = 'Opendrive - Simple OIDC Provider'), l(d, n));
	});
	var a = o(m),
		p = o(a),
		i = o(p),
		X = v(i, 2),
		G = v(X, 2),
		Z = o(G);
	H(Z, {
		size: 'lg',
		href: '/docs',
		children: (d, n) => {
			var c = ie(),
				g = P(c);
			(ut(g, { class: 'mr-2 h-5 w-5' }), Y(), l(d, c));
		},
		$$slots: { default: !0 }
	});
	var _t = v(Z, 2);
	(H(_t, {
		size: 'lg',
		variant: 'outline',
		href: 'https://demo.pocket-id.org',
		target: '_blank',
		children: (d, n) => {
			var c = ne(),
				g = P(c);
			(Rt(g, { class: 'mr-1 h-5 w-5' }), Y(), l(d, c));
		},
		$$slots: { default: !0 }
	}),
		r(G));
	var q = v(G, 2),
		yt = o(q);
	{
		var $t = (d) => {
			Ut(d, {
				variant: 'outline',
				class: 'mt-6',
				children: (n, c) => {
					var g = le(),
						z = v(P(g));
					(S(() => B(z, ` ${t.data.instanceCount ?? ''} Active Instances`)), l(n, g));
				},
				$$slots: { default: !0 }
			});
		};
		Bt(yt, (d) => {
			t.data.instanceCount && d($t);
		});
	}
	(r(q), r(p), r(a));
	var K = v(a, 2),
		tt = o(K),
		et = o(tt),
		at = v(et, 2);
	(vt(
		at,
		21,
		() => se,
		mt,
		(d, n, c) => {
			const g = L(() => c % 2 === 0),
				z = L(() => s(n).icon);
			var $ = de(),
				w = o($),
				U = o(w),
				D = o(U);
			gt(
				D,
				() => s(z),
				(k, I) => {
					I(k, { class: 'text-foreground mr-3 size-8' });
				}
			);
			var F = v(D, 2),
				W = o(F, !0);
			(r(F), r(U));
			var b = v(U, 2),
				Q = o(b, !0);
			(r(b), r(w));
			var f = v(w, 2),
				C = o(f);
			(r(f),
				r($),
				S(() => {
					(x(
						$,
						`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out ${100 + c * 20}ms;`
					),
						ht(w, 1, Gt(s(g) ? 'md:order-2' : '')),
						B(W, s(n).title),
						B(Q, s(n).description),
						ht(
							f,
							1,
							`bg-card border-border rounded-lg border p-4 ${s(g) ? 'md:order-1' : ''}`
						),
						pt(C, 'src', `/img/landing/${s(n).image ?? ''}`),
						pt(C, 'alt', s(n).title));
				}),
				l(d, $));
		}
	),
		r(at),
		r(tt),
		r(K));
	var J = v(K, 2),
		st = o(J),
		rt = o(st);
	(vt(
		rt,
		21,
		() => re,
		mt,
		(d, n, c) => {
			const g = L(() => s(n).icon);
			{
				let z = L(() => (s(e) ? 'translateY(0)' : 'translateY(30px)')),
					$ = L(() => (s(e) ? 1 : 0));
				Nt(d, {
					class: 'bg-card border-border hover:border-muted-foreground/50 transition-all duration-300',
					get style() {
						return `transform: ${s(z) ?? ''}; opacity: ${s($) ?? ''}; transition: all 0.6s ease-out ${100 + c * 15}ms;`;
					},
					children: (w, U) => {
						var D = ve(),
							F = P(D);
						te(F, {
							children: (b, Q) => {
								var f = ce(),
									C = o(f);
								gt(
									C,
									() => s(g),
									(I, dt) => {
										dt(I, {
											get this() {
												return s(n).icon;
											},
											class: 'text-foreground size-6'
										});
									}
								);
								var k = v(C, 2);
								(ae(k, {
									class: 'text-foreground',
									children: (I, dt) => {
										Y();
										var ct = ft();
										(S(() => B(ct, s(n).title)), l(I, ct));
									},
									$$slots: { default: !0 }
								}),
									r(f),
									l(b, f));
							},
							$$slots: { default: !0 }
						});
						var W = v(F, 2);
						(Wt(W, {
							children: (b, Q) => {
								Xt(b, {
									class: 'text-muted-foreground',
									children: (f, C) => {
										Y();
										var k = ft();
										(S(() => B(k, s(n).description)), l(f, k));
									},
									$$slots: { default: !0 }
								});
							},
							$$slots: { default: !0 }
						}),
							l(w, D));
					},
					$$slots: { default: !0 }
				});
			}
		}
	),
		r(rt),
		r(st),
		r(J));
	var N = v(J, 2),
		ot = o(N),
		wt = o(ot);
	(Kt(wt, { class: 'mx-auto mb-8 h-12 rotate-90 text-gray-400' }), r(ot), r(N));
	var it = v(N, 2),
		V = o(it),
		nt = v(o(V), 4),
		lt = o(nt);
	H(lt, {
		size: 'lg',
		href: '/docs',
		children: (d, n) => {
			var c = ue(),
				g = P(c);
			(ut(g, { class: 'mr-1 h-5 w-5' }), Y(), l(d, c));
		},
		$$slots: { default: !0 }
	});
	var bt = v(lt, 2);
	(H(bt, {
		size: 'lg',
		variant: 'outline',
		href: 'https://github.com/pocket-id/pocket-id',
		target: '_blank',
		children: (d, n) => {
			var c = me(),
				g = P(c);
			(Tt(g, { class: 'mr-1 size-5' }), Y(), l(d, c));
		},
		$$slots: { default: !0 }
	}),
		r(nt),
		r(V),
		r(it),
		r(m),
		S(() => {
			(x(
				i,
				`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 50ms;`
			),
				x(
					X,
					`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 100ms;`
				),
				x(
					G,
					`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 150ms;`
				),
				x(
					q,
					`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 150ms;`
				),
				x(
					et,
					`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 50ms;`
				),
				x(
					V,
					`transform: ${s(e) ? 'translateY(0)' : 'translateY(30px)'}; opacity: ${s(e) ? 1 : 0}; transition: all 0.6s ease-out 150ms;`
				));
		}),
		l(u, m),
		y());
}
export { _e as component, xe as universal };
