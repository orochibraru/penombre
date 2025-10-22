import { f as $, a as l, n as t, g as i, b as o, s as e, h as xe, j as m } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as ke, P as h } from './CXunQUVT.js';
import { H as A } from './CMbTFn8B.js';
import { U as E } from './B2E1dnfA.js';
import { L as p } from './EJ1QvGwo.js';
import { A as T } from './Bva6-POL.js';
import { P as Ce } from './DZj8j_ml.js';
import { S as G } from './Bqu0--pl.js';
import { H } from './CTN7MPTR.js';
import { H as N } from './bcMIrzCO.js';
import { O as W } from './eLU9aUh4.js';
const Te = {
		title: 'Contributing',
		description: 'Learn how to contribute to the Opendrive project'
	},
	{ title: Ct, description: Tt } = Te;
var Se = $('The pull request naming follows the <!>:', 1),
	je = $('Where <!> can be:', 1),
	Ie = $('<!> - is a new feature', 1),
	qe = $('<!> - documentation only changes', 1),
	Oe = $('<!> - a bug fix', 1),
	De = $('<!> - code change that neither fixes a bug nor adds a feature', 1),
	Ge = $('<!> <!> <!> <!>', 1),
	He = $('<!> <!> <!> <!> <!> <!>', 1),
	We = $('You run <!> to format the code', 1),
	Ye = $('<!> <!> <!>', 1),
	Be = $(
		"If you use <!> in VS Code, you don't need to install anything manually, just follow the steps below.",
		1
	),
	Ve = $('Make sure you have <!> extension installed', 1),
	Fe = $(
		"If the auto prompt does not work, hit <!> and select <!>, then select the pocket-id repo root folder and it'll open in container.",
		1
	),
	Le = $('<!> <!> <!> <!>', 1),
	Ae = $('<!> >= 22', 1),
	Ee = $('<!> >= 1.24', 1),
	Ne = $('<!> <!> <!>', 1),
	Re = $('The backend is built with <!> and written in Go. To set it up, follow these steps:', 1),
	Ue = $('Open the <!> folder', 1),
	Ke = $('Copy the <!> file to <!> and edit the variables as needed', 1),
	Me = $('Start the backend with <!>', 1),
	ze = $('<!> <!> <!>', 1),
	Je = $(
		'The frontend is built with <!> and written in TypeScript. To set it up, follow these steps:',
		1
	),
	Qe = $('Open the <!> project folder', 1),
	Xe = $('Copy the <!> file to <!> and edit the variables as needed', 1),
	Ze = $('Install the dependencies with <!>', 1),
	et = $('Start the frontend with <!>', 1),
	tt = $('<!> <!> <!> <!>', 1),
	ot = $(
		"You're all set! The application is now listening on <!>. The backend gets proxied trough the frontend in development mode.",
		1
	),
	rt = $('We are using <!> for end-to-end testing.', 1),
	st = $(
		'If you are contributing to a new feature please ensure that you add tests for it. The tests are located in the <!> folder at the root of the project.',
		1
	),
	at = $('Install the dependencies from the root of the project <!>', 1),
	nt = $('Visit the setup folder by running <!>', 1),
	lt = $('Start the test environment by running <!>', 1),
	dt = $('Go back to the test folder by running <!>', 1),
	$t = $('Run the tests with <!> or from the root project folder <!>', 1),
	it = $('<!> <!> <!> <!> <!>', 1),
	ut = $(
		'If you make any changes to the application, you have to rebuild the test environment by running <!> again.',
		1
	),
	vt = $(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function St(be) {
	ke(be, {
		children: (we, ct) => {
			var R = vt(),
				U = l(R);
			h(U, {
				children: (s, c) => {
					t();
					var r = i(
						'We are happy that you want to contribute to Opendrive and help to make it better! All contributions are welcome, including issues, suggestions, pull requests and more.'
					);
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var K = e(U, 2);
			A(K, {
				id: 'getting-started',
				children: (s, c) => {
					t();
					var r = i('Getting started');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var M = e(K, 2);
			h(M, {
				children: (s, c) => {
					t();
					var r = i(
						"You've found a bug, have suggestion or something else, just create an issue on GitHub and we can get in touch."
					);
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var z = e(M, 2);
			A(z, {
				id: 'submit-a-pull-request',
				children: (s, c) => {
					t();
					var r = i('Submit a Pull Request');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var J = e(z, 2);
			h(J, {
				children: (s, c) => {
					t();
					var r = i('Before you submit the pull request for review please ensure that');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var Q = e(J, 2);
			E(Q, {
				children: (s, c) => {
					var r = Ye(),
						v = l(r);
					p(v, {
						children: (u, _) => {
							var n = He(),
								a = l(n);
							h(a, {
								children: (y, O) => {
									t();
									var b = Se(),
										C = e(l(b));
									(T(C, {
										href: 'https://www.conventionalcommits.org',
										children: (D, B) => {
											t();
											var V = i('Conventional Commits specification');
											o(D, V);
										},
										$$slots: { default: !0 }
									}),
										t(),
										o(y, b));
								},
								$$slots: { default: !0 }
							});
							var d = e(a, 2);
							h(d, {
								children: (y, O) => {
									var b = xe(),
										C = l(b);
									(m(
										C,
										() =>
											'<code>&lt;type>[optional scope]: &lt;description></code>'
									),
										o(y, b));
								},
								$$slots: { default: !0 }
							});
							var x = e(d, 2);
							h(x, {
								children: (y, O) => {
									t();
									var b = i('example:');
									o(y, b);
								},
								$$slots: { default: !0 }
							});
							var g = e(x, 2);
							Ce(g, {
								children: (y, O) => {
									var b = xe(),
										C = l(b);
									(m(
										C,
										() => `<code>fix: hide global audit log switch for non admin users
</code>`
									),
										o(y, b));
								},
								$$slots: { default: !0 }
							});
							var w = e(g, 2);
							h(w, {
								children: (y, O) => {
									t();
									var b = je(),
										C = e(l(b));
									(m(C, () => '<code>TYPE</code>'), t(), o(y, b));
								},
								$$slots: { default: !0 }
							});
							var Y = e(w, 2);
							(E(Y, {
								children: (y, O) => {
									var b = Ge(),
										C = l(b);
									p(C, {
										children: (S, F) => {
											var k = Ie(),
												j = l(k);
											(G(j, {
												children: (I, L) => {
													t();
													var q = i('feat');
													o(I, q);
												},
												$$slots: { default: !0 }
											}),
												t(),
												o(S, k));
										},
										$$slots: { default: !0 }
									});
									var D = e(C, 2);
									p(D, {
										children: (S, F) => {
											var k = qe(),
												j = l(k);
											(G(j, {
												children: (I, L) => {
													t();
													var q = i('doc');
													o(I, q);
												},
												$$slots: { default: !0 }
											}),
												t(),
												o(S, k));
										},
										$$slots: { default: !0 }
									});
									var B = e(D, 2);
									p(B, {
										children: (S, F) => {
											var k = Oe(),
												j = l(k);
											(G(j, {
												children: (I, L) => {
													t();
													var q = i('fix');
													o(I, q);
												},
												$$slots: { default: !0 }
											}),
												t(),
												o(S, k));
										},
										$$slots: { default: !0 }
									});
									var V = e(B, 2);
									(p(V, {
										children: (S, F) => {
											var k = De(),
												j = l(k);
											(G(j, {
												children: (I, L) => {
													t();
													var q = i('refactor');
													o(I, q);
												},
												$$slots: { default: !0 }
											}),
												t(),
												o(S, k));
										},
										$$slots: { default: !0 }
									}),
										o(y, b));
								},
								$$slots: { default: !0 }
							}),
								o(u, n));
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (u, _) => {
							h(u, {
								children: (n, a) => {
									t();
									var d = i('Your pull request has a detailed description');
									o(n, d);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					(p(P, {
						children: (u, _) => {
							h(u, {
								children: (n, a) => {
									t();
									var d = We(),
										x = e(l(d));
									(m(x, () => '<code>pnpm format</code>'), t(), o(n, d));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var X = e(Q, 2);
			A(X, {
				id: 'development-environment',
				children: (s, c) => {
					t();
					var r = i('Development Environment');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var Z = e(X, 2);
			h(Z, {
				children: (s, c) => {
					t();
					var r = i(
						'Opendrive consists of a frontend and backend. In production the frontend gets statically served by the backend, but in development they run as separate processes to enable hot reloading.'
					);
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var ee = e(Z, 2);
			h(ee, {
				children: (s, c) => {
					t();
					var r = i('There are two ways to get the development environment setup:');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var te = e(ee, 2);
			H(te, {
				id: '1-install-required-tools',
				children: (s, c) => {
					t();
					var r = i('1. Install required tools');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var oe = e(te, 2);
			N(oe, {
				id: 'with-dev-containers',
				children: (s, c) => {
					t();
					var r = i('With Dev Containers');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var re = e(oe, 2);
			h(re, {
				children: (s, c) => {
					t();
					var r = Be(),
						v = e(l(r));
					(T(v, {
						href: 'https://code.visualstudio.com/docs/remote/containers',
						children: (f, P) => {
							t();
							var u = i('Dev Containers');
							o(f, u);
						},
						$$slots: { default: !0 }
					}),
						t(),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var se = e(re, 2);
			W(se, {
				children: (s, c) => {
					var r = Le(),
						v = l(r);
					p(v, {
						children: (_, n) => {
							t();
							var a = Ve(),
								d = e(l(a));
							(T(d, {
								href: 'https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers',
								children: (x, g) => {
									t();
									var w = i('Dev Containers');
									o(x, w);
								},
								$$slots: { default: !0 }
							}),
								t(),
								o(_, a));
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (_, n) => {
							t();
							var a = i('Clone and open the repo in VS Code');
							o(_, a);
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					p(P, {
						children: (_, n) => {
							t();
							var a = i(
								'VS Code will detect .devcontainer and will prompt you to open the folder in devcontainer'
							);
							o(_, a);
						},
						$$slots: { default: !0 }
					});
					var u = e(P, 2);
					(p(u, {
						children: (_, n) => {
							t();
							var a = Fe(),
								d = e(l(a));
							m(d, () => '<code>F1</code>');
							var x = e(d, 2);
							(m(x, () => '<code>Dev Containers: Open Folder in Container.</code>'),
								t(),
								o(_, a));
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var ae = e(se, 2);
			N(ae, {
				id: 'without-dev-containers',
				children: (s, c) => {
					t();
					var r = i('Without Dev Containers');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var ne = e(ae, 2);
			h(ne, {
				children: (s, c) => {
					t();
					var r = i(
						"If you don't use Dev Containers, you need to install the following tools manually:"
					);
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var le = e(ne, 2);
			E(le, {
				children: (s, c) => {
					var r = Ne(),
						v = l(r);
					p(v, {
						children: (u, _) => {
							var n = Ae(),
								a = l(n);
							(T(a, {
								href: 'https://nodejs.org/en/download/',
								children: (d, x) => {
									t();
									var g = i('Node.js');
									o(d, g);
								},
								$$slots: { default: !0 }
							}),
								t(),
								o(u, n));
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (u, _) => {
							var n = Ee(),
								a = l(n);
							(T(a, {
								href: 'https://golang.org/doc/install',
								children: (d, x) => {
									t();
									var g = i('Go');
									o(d, g);
								},
								$$slots: { default: !0 }
							}),
								t(),
								o(u, n));
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					(p(P, {
						children: (u, _) => {
							T(u, {
								href: 'https://git-scm.com/downloads',
								children: (n, a) => {
									t();
									var d = i('Git');
									o(n, d);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var de = e(le, 2);
			H(de, {
				id: '2-setup',
				children: (s, c) => {
					t();
					var r = i('2. Setup');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var $e = e(de, 2);
			N($e, {
				id: 'backend',
				children: (s, c) => {
					t();
					var r = i('Backend');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var ie = e($e, 2);
			h(ie, {
				children: (s, c) => {
					t();
					var r = Re(),
						v = e(l(r));
					(T(v, {
						href: 'https://gin-gonic.com',
						children: (f, P) => {
							t();
							var u = i('Gin');
							o(f, u);
						},
						$$slots: { default: !0 }
					}),
						t(),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var ue = e(ie, 2);
			W(ue, {
				children: (s, c) => {
					var r = ze(),
						v = l(r);
					p(v, {
						children: (u, _) => {
							t();
							var n = Ue(),
								a = e(l(n));
							(m(a, () => '<code>backend</code>'), t(), o(u, n));
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (u, _) => {
							t();
							var n = Ke(),
								a = e(l(n));
							m(a, () => '<code>.env.development-example</code>');
							var d = e(a, 2);
							(m(d, () => '<code>.env</code>'), t(), o(u, n));
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					(p(P, {
						children: (u, _) => {
							t();
							var n = Me(),
								a = e(l(n));
							(m(a, () => '<code>go run -tags exclude_frontend ./cmd</code>'),
								o(u, n));
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var ve = e(ue, 2);
			H(ve, {
				id: 'frontend',
				children: (s, c) => {
					t();
					var r = i('Frontend');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var ce = e(ve, 2);
			h(ce, {
				children: (s, c) => {
					t();
					var r = Je(),
						v = e(l(r));
					(T(v, {
						href: 'https://kit.svelte.dev',
						children: (f, P) => {
							t();
							var u = i('SvelteKit');
							o(f, u);
						},
						$$slots: { default: !0 }
					}),
						t(),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var _e = e(ce, 2);
			W(_e, {
				children: (s, c) => {
					var r = tt(),
						v = l(r);
					p(v, {
						children: (_, n) => {
							t();
							var a = Qe(),
								d = e(l(a));
							(m(d, () => '<code>pocket-id</code>'), t(), o(_, a));
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (_, n) => {
							t();
							var a = Xe(),
								d = e(l(a));
							m(d, () => '<code>frontend/.env.development-example</code>');
							var x = e(d, 2);
							(m(x, () => '<code>frontend/.env</code>'), t(), o(_, a));
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					p(P, {
						children: (_, n) => {
							t();
							var a = Ze(),
								d = e(l(a));
							(m(d, () => '<code>pnpm install</code>'), o(_, a));
						},
						$$slots: { default: !0 }
					});
					var u = e(P, 2);
					(p(u, {
						children: (_, n) => {
							t();
							var a = et(),
								d = e(l(a));
							(m(d, () => '<code>pnpm dev</code>'), o(_, a));
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var pe = e(_e, 2);
			h(pe, {
				children: (s, c) => {
					t();
					var r = ot(),
						v = e(l(r));
					(m(v, () => '<code>localhost:3000</code>'), t(), o(s, r));
				},
				$$slots: { default: !0 }
			});
			var fe = e(pe, 2);
			H(fe, {
				id: 'testing',
				children: (s, c) => {
					t();
					var r = i('Testing');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var he = e(fe, 2);
			h(he, {
				children: (s, c) => {
					t();
					var r = rt(),
						v = e(l(r));
					(T(v, {
						href: 'https://playwright.dev',
						children: (f, P) => {
							t();
							var u = i('Playwright');
							o(f, u);
						},
						$$slots: { default: !0 }
					}),
						t(),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var me = e(he, 2);
			h(me, {
				children: (s, c) => {
					t();
					var r = st(),
						v = e(l(r));
					(m(v, () => '<code>tests</code>'), t(), o(s, r));
				},
				$$slots: { default: !0 }
			});
			var ge = e(me, 2);
			h(ge, {
				children: (s, c) => {
					t();
					var r = i('The tests can be run like this:');
					o(s, r);
				},
				$$slots: { default: !0 }
			});
			var Pe = e(ge, 2);
			W(Pe, {
				children: (s, c) => {
					var r = it(),
						v = l(r);
					p(v, {
						children: (n, a) => {
							h(n, {
								children: (d, x) => {
									t();
									var g = at(),
										w = e(l(g));
									(m(w, () => '<code>pnpm install</code>'), o(d, g));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var f = e(v, 2);
					p(f, {
						children: (n, a) => {
							h(n, {
								children: (d, x) => {
									t();
									var g = nt(),
										w = e(l(g));
									(m(w, () => '<code>cd tests/setup</code>'), o(d, g));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var P = e(f, 2);
					p(P, {
						children: (n, a) => {
							h(n, {
								children: (d, x) => {
									t();
									var g = lt(),
										w = e(l(g));
									(m(w, () => '<code>docker compose up -d --build</code>'),
										o(d, g));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var u = e(P, 2);
					p(u, {
						children: (n, a) => {
							h(n, {
								children: (d, x) => {
									t();
									var g = dt(),
										w = e(l(g));
									(m(w, () => '<code>cd ..</code>'), o(d, g));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var _ = e(u, 2);
					(p(_, {
						children: (n, a) => {
							h(n, {
								children: (d, x) => {
									t();
									var g = $t(),
										w = e(l(g));
									m(w, () => '<code>pnpm dlx playwright test</code>');
									var Y = e(w, 2);
									(m(Y, () => '<code>pnpm test</code>'), o(d, g));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						o(s, r));
				},
				$$slots: { default: !0 }
			});
			var ye = e(Pe, 2);
			(h(ye, {
				children: (s, c) => {
					t();
					var r = ut(),
						v = e(l(r));
					(m(v, () => '<code>docker compose up -d --build</code>'), t(), o(s, r));
				},
				$$slots: { default: !0 }
			}),
				o(we, R));
		}
	});
}
export { St as default, Te as metadata };
