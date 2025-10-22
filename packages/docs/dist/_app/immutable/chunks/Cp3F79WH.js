import { f as p, a as h, n as r, g as l, b as o, s } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as H, P as $ } from './CXunQUVT.js';
import { A as f } from './Bva6-POL.js';
import { H as m } from './CMbTFn8B.js';
import { S as A } from './Bqu0--pl.js';
import { U as L } from './B2E1dnfA.js';
import { L as D } from './EJ1QvGwo.js';
const B = {
		title: 'Introduction',
		description: 'Welcome to Opendrive - A simple OIDC provider for passwordless authentication'
	},
	{ title: oe, description: se } = B;
var F = p(
		'The goal of Opendrive is to be a simple and easy-to-use. There are other self-hosted OIDC providers like <!> or <!> but they are often too complex for simple use cases.',
		1
	),
	J = p(
		"Additionally, what makes Opendrive special is that it only supports <!> authentication, which means you don't need a password. Some people might not like this idea at first, but I believe passkeys are the future, and once you try them, you'll love them. For example, you can now use a physical Yubikey to sign in to all your self-hosted services easily and securely.",
		1
	),
	R = p('→ <!>', 1),
	V = p('→ Check out the video from <!> <br/>', 1),
	Y = p(
		' <iframe width="560" height="315" src="https://www.youtube.com/embed/sPUkAm7yDlU?si=nXasArwOzEhZdfF-" title="Tailscale Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>',
		1
	),
	E = p('→ Check out the video from <!> <br/>', 1),
	K = p(
		' <iframe width="560" height="315" src="https://www.youtube.com/embed/QC5IUmu7cgw" title="JimsGarage Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen=""></iframe>',
		1
	),
	Q = p('<!> <!>', 1),
	W = p(
		'<!> <!> <!> <!> <!> <img src="/img/landing/authorize_screenshot.png" width="700" alt="Opendrive authorization screen showing passkey authentication interface"/> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function ae(T) {
	H(T, {
		children: (S, X) => {
			var _ = W(),
				w = h(_);
			$(w, {
				children: (t, i) => {
					r();
					var e = l(
						'Opendrive is a simple OIDC provider that allows users to authenticate with their passkeys to your services.'
					);
					o(t, e);
				},
				$$slots: { default: !0 }
			});
			var y = s(w, 2);
			$(y, {
				children: (t, i) => {
					r();
					var e = F(),
						a = s(h(e));
					f(a, {
						href: 'https://www.keycloak.org/',
						children: (d, u) => {
							r();
							var c = l('Keycloak');
							o(d, c);
						},
						$$slots: { default: !0 }
					});
					var n = s(a, 2);
					(f(n, {
						href: 'https://www.ory.sh/hydra/',
						children: (d, u) => {
							r();
							var c = l('ORY Hydra');
							o(d, c);
						},
						$$slots: { default: !0 }
					}),
						r(),
						o(t, e));
				},
				$$slots: { default: !0 }
			});
			var g = s(y, 2);
			$(g, {
				children: (t, i) => {
					r();
					var e = J(),
						a = s(h(e));
					(f(a, {
						href: 'https://www.passkeys.io/',
						children: (n, d) => {
							r();
							var u = l('passkey');
							o(n, u);
						},
						$$slots: { default: !0 }
					}),
						r(),
						o(t, e));
				},
				$$slots: { default: !0 }
			});
			var P = s(g, 2);
			m(P, {
				id: 'get-to-know-opendrive',
				children: (t, i) => {
					r();
					var e = l('Get to know Opendrive');
					o(t, e);
				},
				$$slots: { default: !0 }
			});
			var k = s(P, 2);
			$(k, {
				children: (t, i) => {
					r();
					var e = R(),
						a = s(h(e));
					(f(a, {
						href: 'https://demo.pocket-id.org',
						children: (n, d) => {
							r();
							var u = l('Try the Demo of Opendrive');
							o(n, u);
						},
						$$slots: { default: !0 }
					}),
						o(t, e));
				},
				$$slots: { default: !0 }
			});
			var b = s(k, 4);
			m(b, {
				id: 'creator-reviews',
				children: (t, i) => {
					r();
					var e = l('Creator Reviews');
					o(t, e);
				},
				$$slots: { default: !0 }
			});
			var x = s(b, 2);
			$(x, {
				children: (t, i) => {
					r();
					var e = V(),
						a = s(h(e));
					(A(a, {
						children: (n, d) => {
							r();
							var u = l('Tailscale');
							o(n, u);
						},
						$$slots: { default: !0 }
					}),
						r(2),
						o(t, e));
				},
				$$slots: { default: !0 }
			});
			var O = s(x, 2);
			$(O, {
				children: (t, i) => {
					r();
					var e = Y();
					(r(), o(t, e));
				},
				$$slots: { default: !0 }
			});
			var I = s(O, 2);
			$(I, {
				children: (t, i) => {
					r();
					var e = E(),
						a = s(h(e));
					(A(a, {
						children: (n, d) => {
							r();
							var u = l("Jim's Garage");
							o(n, u);
						},
						$$slots: { default: !0 }
					}),
						r(2),
						o(t, e));
				},
				$$slots: { default: !0 }
			});
			var C = s(I, 2);
			$(C, {
				children: (t, i) => {
					r();
					var e = K();
					(r(), o(t, e));
				},
				$$slots: { default: !0 }
			});
			var U = s(C, 2);
			m(U, {
				id: 'useful-links',
				children: (t, i) => {
					r();
					var e = l('Useful Links');
					o(t, e);
				},
				$$slots: { default: !0 }
			});
			var z = s(U, 2);
			(L(z, {
				children: (t, i) => {
					var e = Q(),
						a = h(e);
					D(a, {
						children: (d, u) => {
							f(d, {
								href: '/docs/setup/installation',
								children: (c, G) => {
									r();
									var v = l('Installation');
									o(c, v);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var n = s(a, 2);
					(D(n, {
						children: (d, u) => {
							f(d, {
								href: '/docs/guides/proxy-services',
								children: (c, G) => {
									r();
									var v = l('Proxy Services');
									o(c, v);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						o(t, e));
				},
				$$slots: { default: !0 }
			}),
				o(S, _));
		}
	});
}
export { ae as default, B as metadata };
