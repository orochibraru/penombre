import { f as c, a as s, n as r, g as d, b as e, s as o, h as O, j as x } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as xe, P as f } from './CXunQUVT.js';
import { H as z } from './CMbTFn8B.js';
import { A as I } from './Bva6-POL.js';
import { H } from './CTN7MPTR.js';
import { O as U } from './eLU9aUh4.js';
import { L as y } from './EJ1QvGwo.js';
import { P as T } from './DZj8j_ml.js';
import { U as B } from './B2E1dnfA.js';
import { B as ke } from './C8yZ7dHE.js';
import { S as ye } from './Bqu0--pl.js';
const we = {
		title: 'Installation',
		description: 'Get Opendrive running quickly with Docker or standalone installation'
	},
	{ title: mt, description: gt } = we;
var Se = c(
		'Opendrive requires a <!>, meaning it must be served over HTTPS. This is necessary because Opendrive uses the <!>.',
		1
	),
	Ie = c(
		'You can use a reverse proxy like <!> or <!> to serve Opendrive over HTTPS. Alternatively, you can use a service like <!> to provide HTTPS for your domain.',
		1
	),
	Oe = c('Download the <!> and <!> file:', 1),
	Ae = c('<!> <!>', 1),
	Te = c(
		'Edit the <!> file so that it fits your needs. See the <!> section for more information.',
		1
	),
	Ce = c('Run <!>', 1),
	He = c('<!> <!> <!>', 1),
	qe = c('You can now sign in with the admin account on <!>.', 1),
	Re = c('Download the latest binary from the <!>.', 1),
	ze = c('Example: <!>', 1),
	Be = c('<!> <!>', 1),
	De = c('<!> <!> <!> <!> <!>', 1),
	Ee = c('<!> <!>', 1),
	Ne = c('Download the <!> file:', 1),
	Ue = c('<!> <!>', 1),
	Le = c(
		'Edit the <!> file so that it fits your needs. See the <!> section for more information.',
		1
	),
	Me = c('<!> <!>', 1),
	Ye = c('<!> <!> <!> <!> <!>', 1),
	je = c('You can now sign in with the admin account on <!>.', 1),
	Ge = c('Run the <!> as root in your Proxmox shell.', 1),
	We = c('<!> <!>', 1),
	Fe = c('A Helm chart maintained by @hobit44 is available <!>.', 1),
	Ve = c('<!> <!>', 1),
	Ke = c(
		`A pocket-id module is available in NixOS Unstable.
It can be enabled by adding the following to your <!>:`,
		1
	),
	Xe = c('For further configuration of the module, see the available <!>.', 1),
	Je = c('<!> >= 22', 1),
	Qe = c('<!> >= 1.24', 1),
	Ze = c('<!> <!> <!>', 1),
	et = c('<!> <!>', 1),
	tt = c(
		'Edit the <!> file so that it fits your needs. See the <!> section for more information.',
		1
	),
	ot = c('<!> <!> <!>', 1),
	rt = c('You can now sign in with the admin account on <!>.', 1),
	at = c(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <div class="artifacthub-widget" data-url="https://artifacthub.io/packages/helm/anza-labs/pocket-id" data-theme="light" data-header="true" data-stars="true" data-responsive="false"><blockquote><p lang="en" dir="ltr"><b>pocket-id</b>: _pocket-id_ is a simple and easy-to-use OIDC provider that allows users to authenticate with their passkeys to your services.</p>&mdash; Open in <a href="https://artifacthub.io/packages/helm/anza-labs/pocket-id">Artifact Hub</a></blockquote></div> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function Pt(ge) {
	xe(ge, {
		children: (Pe, st) => {
			var L = at(),
				M = s(L);
			z(M, {
				id: 'before-you-start',
				children: (a, h) => {
					r();
					var t = d('Before you start');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var Y = o(M, 2);
			f(Y, {
				children: (a, h) => {
					r();
					var t = Se(),
						l = o(s(t));
					I(l, {
						href: 'https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts',
						children: (g, i) => {
							r();
							var _ = d('secure context');
							e(g, _);
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					(I(p, {
						href: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API',
						children: (g, i) => {
							r();
							var _ = d('WebAuthn API');
							e(g, _);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var j = o(Y, 2);
			f(j, {
				children: (a, h) => {
					r();
					var t = Ie(),
						l = o(s(t));
					I(l, {
						href: 'https://caddyserver.com/',
						children: (i, _) => {
							r();
							var n = d('Caddy');
							e(i, n);
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					I(p, {
						href: 'https://www.nginx.com/',
						children: (i, _) => {
							r();
							var n = d('NGINX');
							e(i, n);
						},
						$$slots: { default: !0 }
					});
					var g = o(p, 2);
					(I(g, {
						href: 'https://www.cloudflare.com/',
						children: (i, _) => {
							r();
							var n = d('Cloudflare');
							e(i, n);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var G = o(j, 2);
			z(G, {
				id: 'installation-methods',
				children: (a, h) => {
					r();
					var t = d('Installation Methods');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var W = o(G, 2);
			H(W, {
				id: 'installation-with-docker-recommended',
				children: (a, h) => {
					r();
					var t = d('Installation with Docker (recommended)');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var F = o(W, 2);
			U(F, {
				children: (a, h) => {
					var t = He(),
						l = s(t);
					y(l, {
						children: (i, _) => {
							var n = Ae(),
								k = s(n);
							f(k, {
								children: (u, P) => {
									r();
									var v = Oe(),
										w = o(s(v));
									I(w, {
										href: 'https://raw.githubusercontent.com/pocket-id/pocket-id/main/docker-compose.yml',
										children: (b, C) => {
											var S = O(),
												A = s(S);
											(x(A, () => '<code>docker-compose.yml</code>'),
												e(b, S));
										},
										$$slots: { default: !0 }
									});
									var m = o(w, 2);
									(I(m, {
										href: 'https://raw.githubusercontent.com/pocket-id/pocket-id/main/.env.example',
										children: (b, C) => {
											var S = O(),
												A = s(S);
											(x(A, () => '<code>.env</code>'), e(b, S));
										},
										$$slots: { default: !0 }
									}),
										r(),
										e(u, v));
								},
								$$slots: { default: !0 }
							});
							var $ = o(k, 2);
							(T($, {
								children: (u, P) => {
									var v = O(),
										w = s(v);
									(x(
										w,
										() => `<code class="language-bash"> curl -O https://raw.githubusercontent.com/pocket-id/pocket-id/main/docker-compose.yml

 curl -o .env https://raw.githubusercontent.com/pocket-id/pocket-id/main/.env.example
</code>`
									),
										e(u, v));
								},
								$$slots: { default: !0 }
							}),
								e(i, n));
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					y(p, {
						children: (i, _) => {
							f(i, {
								children: (n, k) => {
									r();
									var $ = Te(),
										u = o(s($));
									x(u, () => '<code>.env</code>');
									var P = o(u, 2);
									(I(P, {
										href: '/docs/configuration/environment-variables',
										children: (v, w) => {
											r();
											var m = d('environment variables');
											e(v, m);
										},
										$$slots: { default: !0 }
									}),
										r(),
										e(n, $));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var g = o(p, 2);
					(y(g, {
						children: (i, _) => {
							f(i, {
								children: (n, k) => {
									r();
									var $ = Ce(),
										u = o(s($));
									(x(u, () => '<code>docker compose up -d</code>'), e(n, $));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var V = o(F, 2);
			f(V, {
				children: (a, h) => {
					r();
					var t = qe(),
						l = o(s(t));
					(x(l, () => '<code>https://&lt;your-app-url>/setup</code>'), r(), e(a, t));
				},
				$$slots: { default: !0 }
			});
			var K = o(V, 2);
			H(K, {
				id: 'stand-alone-installation',
				children: (a, h) => {
					r();
					var t = d('Stand-alone Installation');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var X = o(K, 2);
			U(X, {
				children: (a, h) => {
					var t = Ye(),
						l = s(t);
					y(l, {
						children: (n, k) => {
							var $ = De(),
								u = s($);
							f(u, {
								children: (b, C) => {
									r();
									var S = Re(),
										A = o(s(S));
									(I(A, {
										href: 'https://github.com/pocket-id/pocket-id/releases/latest',
										children: (D, R) => {
											r();
											var E = d('releases page');
											e(D, E);
										},
										$$slots: { default: !0 }
									}),
										r(),
										e(b, S));
								},
								$$slots: { default: !0 }
							});
							var P = o(u, 2);
							f(P, {
								children: (b, C) => {
									r();
									var S = d(
										'Make sure to download the correct version for your operating system. The binary names follow this pattern:'
									);
									e(b, S);
								},
								$$slots: { default: !0 }
							});
							var v = o(P, 2);
							B(v, {
								children: (b, C) => {
									var S = Be(),
										A = s(S);
									y(A, {
										children: (R, E) => {
											var q = O(),
												N = s(q);
											(x(
												N,
												() =>
													'<code>pocket-id-&lt;operating-system>-&lt;architecture></code>'
											),
												e(R, q));
										},
										$$slots: { default: !0 }
									});
									var D = o(A, 2);
									(y(D, {
										children: (R, E) => {
											r();
											var q = ze(),
												N = o(s(q));
											(x(N, () => '<code>pocket-id-linux-amd64</code>'),
												e(R, q));
										},
										$$slots: { default: !0 }
									}),
										e(b, S));
								},
								$$slots: { default: !0 }
							});
							var w = o(v, 2);
							f(w, {
								children: (b, C) => {
									r();
									var S = d(
										'You can use curl to download the binary directly. For example, for Linux on AMD64 architecture:'
									);
									e(b, S);
								},
								$$slots: { default: !0 }
							});
							var m = o(w, 2);
							(T(m, {
								children: (b, C) => {
									var S = O(),
										A = s(S);
									(x(
										A,
										() => `<code class="language-bash">curl -L -o pocket-id-linux-amd64 https://github.com/pocket-id/pocket-id/releases/latest/download/pocket-id-linux-amd64
</code>`
									),
										e(b, S));
								},
								$$slots: { default: !0 }
							}),
								e(n, $));
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					y(p, {
						children: (n, k) => {
							var $ = Ee(),
								u = s($);
							f(u, {
								children: (v, w) => {
									r();
									var m = d('Rename the binary and make it executable:');
									e(v, m);
								},
								$$slots: { default: !0 }
							});
							var P = o(u, 2);
							(T(P, {
								children: (v, w) => {
									var m = O(),
										b = s(m);
									(x(
										b,
										() => `<code class="language-bash">mv pocket-id-&lt;operating-system>-&lt;architecture> pocket-id
chmod +x pocket-id
</code>`
									),
										e(v, m));
								},
								$$slots: { default: !0 }
							}),
								e(n, $));
						},
						$$slots: { default: !0 }
					});
					var g = o(p, 2);
					y(g, {
						children: (n, k) => {
							var $ = Ue(),
								u = s($);
							f(u, {
								children: (v, w) => {
									r();
									var m = Ne(),
										b = o(s(m));
									(x(b, () => '<code>.env</code>'), r(), e(v, m));
								},
								$$slots: { default: !0 }
							});
							var P = o(u, 2);
							(T(P, {
								children: (v, w) => {
									var m = O(),
										b = s(m);
									(x(
										b,
										() => `<code class="language-bash">curl -o .env https://raw.githubusercontent.com/pocket-id/pocket-id/main/.env.example
</code>`
									),
										e(v, m));
								},
								$$slots: { default: !0 }
							}),
								e(n, $));
						},
						$$slots: { default: !0 }
					});
					var i = o(g, 2);
					y(i, {
						children: (n, k) => {
							f(n, {
								children: ($, u) => {
									r();
									var P = Le(),
										v = o(s(P));
									x(v, () => '<code>.env</code>');
									var w = o(v, 2);
									(I(w, {
										href: '/docs/configuration/environment-variables',
										children: (m, b) => {
											r();
											var C = d('environment variables');
											e(m, C);
										},
										$$slots: { default: !0 }
									}),
										r(),
										e($, P));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var _ = o(i, 2);
					(y(_, {
						children: (n, k) => {
							var $ = Me(),
								u = s($);
							f(u, {
								children: (v, w) => {
									r();
									var m = d('Run the binary:');
									e(v, m);
								},
								$$slots: { default: !0 }
							});
							var P = o(u, 2);
							(T(P, {
								children: (v, w) => {
									var m = O(),
										b = s(m);
									(x(
										b,
										() => `<code class="language-bash">./pocket-id
</code>`
									),
										e(v, m));
								},
								$$slots: { default: !0 }
							}),
								e(n, $));
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var J = o(X, 2);
			f(J, {
				children: (a, h) => {
					r();
					var t = je(),
						l = o(s(t));
					(x(l, () => '<code>https://&lt;your-app-url>/setup</code>'), r(), e(a, t));
				},
				$$slots: { default: !0 }
			});
			var Q = o(J, 2);
			z(Q, {
				id: 'community-installation-methods',
				children: (a, h) => {
					r();
					var t = d('Community Installation Methods');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var Z = o(Q, 2);
			ke(Z, {
				children: (a, h) => {
					f(a, {
						children: (t, l) => {
							r();
							var p = d(`[!IMPORTANT]
These installation methods are not officially supported, and services may not work as expected.`);
							e(t, p);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ee = o(Z, 2);
			H(ee, {
				id: 'proxmox',
				children: (a, h) => {
					r();
					var t = d('Proxmox');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var te = o(ee, 2);
			f(te, {
				children: (a, h) => {
					r();
					var t = Ge(),
						l = o(s(t));
					(I(l, {
						href: 'https://community-scripts.github.io/ProxmoxVE/scripts?id=pocketid',
						children: (p, g) => {
							r();
							var i = d('helper script');
							e(p, i);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var oe = o(te, 2);
			f(oe, {
				children: (a, h) => {
					ye(a, {
						children: (t, l) => {
							r();
							var p = d('Configuration Paths');
							e(t, p);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var re = o(oe, 2);
			B(re, {
				children: (a, h) => {
					var t = We(),
						l = s(t);
					y(l, {
						children: (g, i) => {
							r();
							var _ = d('/opt/pocket-id/backend/.env');
							e(g, _);
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					(y(p, {
						children: (g, i) => {
							r();
							var _ = d('/opt/pocket-id/frontend/.env');
							e(g, _);
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var ae = o(re, 2);
			T(ae, {
				children: (a, h) => {
					var t = O(),
						l = s(t);
					(x(
						l,
						() => `<code class="language-bash">bash -c "$(wget -qLO - https://github.com/community-scripts/ProxmoxVE/raw/main/ct/pocketid.sh)"
</code>`
					),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var se = o(ae, 2);
			H(se, {
				id: 'unraid',
				children: (a, h) => {
					r();
					var t = d('Unraid');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var le = o(se, 2);
			f(le, {
				children: (a, h) => {
					r();
					var t = d('Opendrive is available as a template on the Community Apps store.');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var ne = o(le, 2);
			H(ne, {
				id: 'kubernetes-helm-chart',
				children: (a, h) => {
					r();
					var t = d('Kubernetes Helm Chart');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var de = o(ne, 2);
			B(de, {
				children: (a, h) => {
					var t = Ve(),
						l = s(t);
					y(l, {
						children: (g, i) => {
							r();
							var _ = Fe(),
								n = o(s(_));
							(I(n, {
								href: 'https://github.com/hobbit44/pocket-id-helm',
								children: (k, $) => {
									r();
									var u = d('here');
									e(k, u);
								},
								$$slots: { default: !0 }
							}),
								r(),
								e(g, _));
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					(y(p, {
						children: (g, i) => {
							r();
							var _ = d('A Helm chart maintained by anza-labs:');
							e(g, _);
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var ie = o(de, 4);
			H(ie, {
				id: 'nixos',
				children: (a, h) => {
					r();
					var t = d('NixOS');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var $e = o(ie, 2);
			f($e, {
				children: (a, h) => {
					r();
					var t = Ke(),
						l = o(s(t));
					(x(l, () => '<code>configuration.nix</code>'), r(), e(a, t));
				},
				$$slots: { default: !0 }
			});
			var ce = o($e, 2);
			T(ce, {
				children: (a, h) => {
					var t = O(),
						l = s(t);
					(x(
						l,
						() => `<code class="language-nix">    services.pocket-id.enable = true;
</code>`
					),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var ue = o(ce, 2);
			f(ue, {
				children: (a, h) => {
					r();
					var t = Xe(),
						l = o(s(t));
					(I(l, {
						href: 'https://search.nixos.org/options?channel=unstable&from=0&size=50&sort=relevance&type=packages&query=pocket-id',
						children: (p, g) => {
							r();
							var i = d('settings');
							e(p, i);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var ve = o(ue, 2);
			z(ve, {
				id: 'installation-from-source',
				children: (a, h) => {
					r();
					var t = d('Installation from Source');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var he = o(ve, 2);
			f(he, {
				children: (a, h) => {
					r();
					var t = d(
						"It's not recommended to install Opendrive from source unless you know what you're doing. The following instructions are provided for advanced users who want to customize or contribute to the project."
					);
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var pe = o(he, 2);
			f(pe, {
				children: (a, h) => {
					r();
					var t = d('Required tools:');
					e(a, t);
				},
				$$slots: { default: !0 }
			});
			var _e = o(pe, 2);
			B(_e, {
				children: (a, h) => {
					var t = Ze(),
						l = s(t);
					y(l, {
						children: (i, _) => {
							var n = Je(),
								k = s(n);
							(I(k, {
								href: 'https://nodejs.org/en/download/',
								children: ($, u) => {
									r();
									var P = d('Node.js');
									e($, P);
								},
								$$slots: { default: !0 }
							}),
								r(),
								e(i, n));
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					y(p, {
						children: (i, _) => {
							var n = Qe(),
								k = s(n);
							(I(k, {
								href: 'https://golang.org/doc/install',
								children: ($, u) => {
									r();
									var P = d('Go');
									e($, P);
								},
								$$slots: { default: !0 }
							}),
								r(),
								e(i, n));
						},
						$$slots: { default: !0 }
					});
					var g = o(p, 2);
					(y(g, {
						children: (i, _) => {
							I(i, {
								href: 'https://git-scm.com/downloads',
								children: (n, k) => {
									r();
									var $ = d('Git');
									e(n, $);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var fe = o(_e, 2);
			U(fe, {
				children: (a, h) => {
					var t = ot(),
						l = s(t);
					y(l, {
						children: (i, _) => {
							var n = et(),
								k = s(n);
							f(k, {
								children: (u, P) => {
									r();
									var v = d('Run the following commands:');
									e(u, v);
								},
								$$slots: { default: !0 }
							});
							var $ = o(k, 2);
							(T($, {
								children: (u, P) => {
									var v = O(),
										w = s(v);
									(x(
										w,
										() => `<code class="language-bash"># Clone the repo
git clone https://github.com/pocket-id/pocket-id
cd pocket-id

# Checkout latest version
git fetch --tags &amp;&amp; git checkout $(git describe --tags &#96;git rev-list --tags --max-count=1&#96;)

# Build the frontend
pnpm --filter pocket-id-frontend install
pnpm --filter pocket-id-frontend build

# Build the backend
cd ../backend/cmd
go build -o ../../pocket-id

# Create the .env file
cd ../../
cp .env.example .env
</code>`
									),
										e(u, v));
								},
								$$slots: { default: !0 }
							}),
								e(i, n));
						},
						$$slots: { default: !0 }
					});
					var p = o(l, 2);
					y(p, {
						children: (i, _) => {
							f(i, {
								children: (n, k) => {
									r();
									var $ = tt(),
										u = o(s($));
									x(u, () => '<code>.env</code>');
									var P = o(u, 2);
									(I(P, {
										href: '/docs/configuration/environment-variables',
										children: (v, w) => {
											r();
											var m = d('environment variables');
											e(v, m);
										},
										$$slots: { default: !0 }
									}),
										r(),
										e(n, $));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var g = o(p, 2);
					(y(g, {
						children: (i, _) => {
							f(i, {
								children: (n, k) => {
									r();
									var $ = d('Run the binary:');
									e(n, $);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var me = o(fe, 2);
			T(me, {
				children: (a, h) => {
					var t = O(),
						l = s(t);
					(x(
						l,
						() => `<code class="language-bash">./pocket-id
</code>`
					),
						e(a, t));
				},
				$$slots: { default: !0 }
			});
			var be = o(me, 2);
			(f(be, {
				children: (a, h) => {
					r();
					var t = rt(),
						l = o(s(t));
					(x(l, () => '<code>https://&lt;your-app-url>/setup</code>'), r(), e(a, t));
				},
				$$slots: { default: !0 }
			}),
				e(Pe, L));
		}
	});
}
export { Pt as default, we as metadata };
