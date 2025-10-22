import {
	f as $,
	a,
	n as o,
	g as u,
	b as r,
	s as e,
	j as n,
	d as Oe,
	r as Ce,
	h as S
} from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as Ee, P as E } from './CXunQUVT.js';
import { B as Ae } from './C8yZ7dHE.js';
import { H as ke } from './CMbTFn8B.js';
import { H } from './CTN7MPTR.js';
import { U as B } from './B2E1dnfA.js';
import { L as I } from './EJ1QvGwo.js';
import { S as L } from './Bqu0--pl.js';
import { T as Be, a as A, b as V, c as D } from './DpdLr4Qt.js';
import { A as G } from './Bva6-POL.js';
import { H as we } from './bcMIrzCO.js';
import { O as U } from './eLU9aUh4.js';
import { P as Y } from './DZj8j_ml.js';
const Le = {
		title: 'Migrate to v1.0',
		description: 'Migrate from previous versions to Opendrive v1.0'
	},
	{ title: Xr, description: Zr } = Le;
var Ge = $('<!>: The default port for Opendrive has changed from <!> to <!>.', 1),
	Ue = $(
		'<!>: As Caddy has been removed and the frontend is now served directly by the backend, you no longer need to set <!> or <!>. Instead, you must use the new <!> environment variable to specify the port on which Opendrive listens.',
		1
	),
	He = $('<!> <!>', 1),
	Ye = $('<!> <!> <!>', 1),
	Me = $('<!> <!> <!>', 1),
	Qe = $('<!> <!> <!>', 1),
	Ve = $('<!> <!> <!>', 1),
	qe = $('Use new <!> variable', 1),
	We = $('<!> <!> <!>', 1),
	je = $('Use new <!> variable', 1),
	Fe = $('<!> <!> <!>', 1),
	Ke = $('Variable renamed. See <!>', 1),
	ze = $('<!> <!> <!>', 1),
	Je = $('Now uses connection string format. See <!>', 1),
	Xe = $('<!> <!> <!>', 1),
	Ze = $('<!> <!> <!>', 1),
	er = $('<thead><!></thead> <tbody><!><!><!><!><!><!><!><!></tbody>', 1),
	rr = $('The <!> environment variable has been removed (<!> since <!>)', 1),
	tr = $('Old: <!>', 1),
	or = $('New: <!>', 1),
	ar = $('<!> <!>', 1),
	sr = $('You must now use the <!> with SQLite connection string format: <!>', 1),
	dr = $('<!> <!>', 1),
	lr = $('<!> has been removed (<!> since <!>)', 1),
	nr = $('Old: <!>', 1),
	$r = $('New: <!>', 1),
	vr = $('<!> <!>', 1),
	ir = $(
		'You must now use the <!>. The PostgreSQL connection string format remains the same: <!>',
		1
	),
	_r = $('<!> <!>', 1),
	cr = $("There are no actions required if you haven't disabled Caddy with <!>.", 1),
	ur = $(
		'This releases removes the integrated Caddy server, which was used for reverse proxying and serving the frontend. <!>',
		1
	),
	hr = $('Path mappings to <!> and <!> are no longer necessary', 1),
	fr = $(
		'Your reverse proxy should now point directly to Opendrive on port 1411 (or the port set with the <!> variable)',
		1
	),
	pr = $('<!> <!>', 1),
	mr = $('<!>: Update the internal port to <!>', 1),
	gr = $('<!>: Update the target path for the volume to <!>', 1),
	Pr = $('<!>: Change the port in the healthcheck to <!>', 1),
	br = $('<!> <!> <!>', 1),
	yr = $('Adapt your <!> for the new version: <!>', 1),
	xr = $('Adapt the environment variables <!> in your <!> file.', 1),
	Nr = $('<!> <!>', 1),
	Tr = $('<!> <!>', 1),
	Or = $('Download the latest binary from the <!>.', 1),
	Cr = $('Example: <!>', 1),
	kr = $('<!> <!>', 1),
	wr = $('<!> <!> <!> <!>', 1),
	Ir = $(
		"If you haven't edited the default paths where data is stored, like <!>, <!>, <!> and <!> everything is stored in the <!> directory. Because of that you have to move the <!> directory to the same folder as the new binary.",
		1
	),
	Dr = $(
		'Copy the <!> directory from the old Opendrive installation to the same folder as the new binary:',
		1
	),
	Sr = $('<!> <!>', 1),
	Rr = $(
		'Create a <!> file in the same directory as the binary. Previously you had two <!> files, one in the <!> directory and one in the <!> directory.',
		1
	),
	Er = $(
		'You have to merge these two files into one <!> file in the same directory as the binary. Make sure to also adapt the environment variables like <!>',
		1
	),
	Ar = $('<!> <!>', 1),
	Br = $(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function et(Ie) {
	Ee(Ie, {
		children: (De, Lr) => {
			var q = Br(),
				W = a(q);
			Ae(W, {
				children: (d, x) => {
					E(d, {
						children: (t, h) => {
							o();
							var O = u(`[!WARNING]
v1.0 is a major release that includes breaking changes. Please read this migration guide carefully before upgrading.`);
							r(t, O);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var j = e(W, 2);
			E(j, {
				children: (d, x) => {
					o();
					var t = u(
						'We hate breaking changes as much as you do, but we decided to bundle them all into the v1.0 release to make future upgrades easier. This guide will help you understand the changes and how to migrate your existing Opendrive installation.'
					);
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var F = e(j, 2);
			ke(F, {
				id: 'breaking-changes',
				children: (d, x) => {
					o();
					var t = u('Breaking Changes');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var K = e(F, 2);
			H(K, {
				id: 'port',
				children: (d, x) => {
					o();
					var t = u('Port');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var z = e(K, 2);
			B(z, {
				children: (d, x) => {
					var t = He(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							var v = Ge(),
								P = a(v);
							L(P, {
								children: (m, T) => {
									o();
									var N = u('Default Port Change');
									r(m, N);
								},
								$$slots: { default: !0 }
							});
							var _ = e(P, 2);
							n(_, () => '<code>80</code>');
							var b = e(_, 2);
							(n(b, () => '<code>1411</code>'), o(), r(p, v));
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							var v = Ue(),
								P = a(v);
							L(P, {
								children: (T, N) => {
									o();
									var g = u('New Port Variable');
									r(T, g);
								},
								$$slots: { default: !0 }
							});
							var _ = e(P, 2);
							n(_, () => '<code>CADDY_PORT</code>');
							var b = e(_, 2);
							n(b, () => '<code>BACKEND_PORT</code>');
							var m = e(b, 2);
							(n(m, () => '<code>PORT</code>'), o(), r(p, v));
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var J = e(z, 2);
			H(J, {
				id: 'environment-variables',
				children: (d, x) => {
					o();
					var t = u('Environment Variables');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var X = e(J, 2);
			Be(X, {
				children: (d, x) => {
					var t = er(),
						h = a(t),
						O = Oe(h);
					(A(O, {
						children: (g, C) => {
							var c = Ye(),
								i = a(c);
							V(i, {
								children: (l, w) => {
									o();
									var s = u('Previous Variable');
									r(l, s);
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							V(f, {
								children: (l, w) => {
									o();
									var s = u('New Variable');
									r(l, s);
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(V(R, {
								children: (l, w) => {
									o();
									var s = u('Notes');
									r(l, s);
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					}),
						Ce(h));
					var p = e(h, 2),
						k = Oe(p);
					A(k, {
						children: (g, C) => {
							var c = Me(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>PUBLIC_APP_URL</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>APP_URL</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = u('Variable renamed');
									r(l, s);
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var v = e(k);
					A(v, {
						children: (g, C) => {
							var c = Qe(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>PUBLIC_UI_CONFIG_DISABLED</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>UI_CONFIG_DISABLED</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = u('Variable renamed');
									r(l, s);
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var P = e(v);
					A(P, {
						children: (g, C) => {
							var c = Ve(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>CADDY_DISABLED</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									o();
									var s = u('Removed');
									r(l, s);
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = u('Not necessary anymore');
									r(l, s);
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var _ = e(P);
					A(_, {
						children: (g, C) => {
							var c = We(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>CADDY_PORT</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>PORT</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = qe(),
										y = e(a(s));
									(n(y, () => '<code>PORT</code>'), o(), r(l, s));
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var b = e(_);
					A(b, {
						children: (g, C) => {
							var c = Fe(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>BACKEND_PORT</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>PORT</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = je(),
										y = e(a(s));
									(n(y, () => '<code>PORT</code>'), o(), r(l, s));
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var m = e(b);
					A(m, {
						children: (g, C) => {
							var c = ze(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>POSTGRES_CONNECTION_STRING</code>'),
										r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>DB_CONNECTION_STRING</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = Ke(),
										y = e(a(s));
									(G(y, {
										href: '#database-configuration',
										children: (M, Re) => {
											o();
											var Q = u('Database Configuration');
											r(M, Q);
										},
										$$slots: { default: !0 }
									}),
										r(l, s));
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var T = e(m);
					A(T, {
						children: (g, C) => {
							var c = Xe(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>SQLITE_DB_PATH</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>DB_CONNECTION_STRING</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = Je(),
										y = e(a(s));
									(G(y, {
										href: '#database-configuration',
										children: (M, Re) => {
											o();
											var Q = u('Database Configuration');
											r(M, Q);
										},
										$$slots: { default: !0 }
									}),
										r(l, s));
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					});
					var N = e(T);
					(A(N, {
						children: (g, C) => {
							var c = Ze(),
								i = a(c);
							D(i, {
								children: (l, w) => {
									var s = S(),
										y = a(s);
									(n(y, () => '<code>INTERNAL_BACKEND_URL</code>'), r(l, s));
								},
								$$slots: { default: !0 }
							});
							var f = e(i, 2);
							D(f, {
								children: (l, w) => {
									o();
									var s = u('Removed');
									r(l, s);
								},
								$$slots: { default: !0 }
							});
							var R = e(f, 2);
							(D(R, {
								children: (l, w) => {
									o();
									var s = u('Not necessary anymore');
									r(l, s);
								},
								$$slots: { default: !0 }
							}),
								r(g, c));
						},
						$$slots: { default: !0 }
					}),
						Ce(p),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var Z = e(X, 2);
			H(Z, {
				id: 'database-configuration',
				children: (d, x) => {
					o();
					var t = u('Database Configuration');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var ee = e(Z, 2);
			we(ee, {
				id: 'sqlite-configuration',
				children: (d, x) => {
					o();
					var t = u('SQLite Configuration');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var re = e(ee, 2);
			B(re, {
				children: (d, x) => {
					var t = dr(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							o();
							var v = rr(),
								P = e(a(v));
							n(P, () => '<code>SQLITE_DB_PATH</code>');
							var _ = e(P, 2);
							L(_, {
								children: (m, T) => {
									o();
									var N = u('deprecated');
									r(m, N);
								},
								$$slots: { default: !0 }
							});
							var b = e(_, 2);
							(G(b, {
								href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.45.0',
								children: (m, T) => {
									o();
									var N = u('v0.45.0');
									r(m, N);
								},
								$$slots: { default: !0 }
							}),
								o(),
								r(p, v));
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							o();
							var v = sr(),
								P = e(a(v));
							n(P, () => '<code>DB_CONNECTION_STRING</code>');
							var _ = e(P, 2);
							(B(_, {
								children: (b, m) => {
									var T = ar(),
										N = a(T);
									I(N, {
										children: (C, c) => {
											o();
											var i = tr(),
												f = e(a(i));
											(n(
												f,
												() =>
													'<code>SQLITE_DB_PATH=data/pocket-id.db</code>'
											),
												r(C, i));
										},
										$$slots: { default: !0 }
									});
									var g = e(N, 2);
									(I(g, {
										children: (C, c) => {
											o();
											var i = or(),
												f = e(a(i));
											(n(
												f,
												() =>
													'<code>DB_CONNECTION_STRING=file:data/pocket-id.db?_pragma=journal_mode(WAL)&amp;_pragma=busy_timeout(2500)&amp;_txlock=immediate</code>'
											),
												r(C, i));
										},
										$$slots: { default: !0 }
									}),
										r(b, T));
								},
								$$slots: { default: !0 }
							}),
								r(p, v));
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var te = e(re, 2);
			we(te, {
				id: 'postgresql-connection',
				children: (d, x) => {
					o();
					var t = u('PostgreSQL Connection');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var oe = e(te, 2);
			B(oe, {
				children: (d, x) => {
					var t = _r(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							var v = lr(),
								P = a(v);
							n(P, () => '<code>POSTGRES_CONNECTION_STRING</code>');
							var _ = e(P, 2);
							L(_, {
								children: (m, T) => {
									o();
									var N = u('deprecated');
									r(m, N);
								},
								$$slots: { default: !0 }
							});
							var b = e(_, 2);
							(G(b, {
								href: 'https://github.com/pocket-id/pocket-id/releases/tag/v0.45.0',
								children: (m, T) => {
									o();
									var N = u('v0.45.0');
									r(m, N);
								},
								$$slots: { default: !0 }
							}),
								o(),
								r(p, v));
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							o();
							var v = ir(),
								P = e(a(v));
							n(P, () => '<code>DB_CONNECTION_STRING</code>');
							var _ = e(P, 2);
							(B(_, {
								children: (b, m) => {
									var T = vr(),
										N = a(T);
									I(N, {
										children: (C, c) => {
											o();
											var i = nr(),
												f = e(a(i));
											(n(
												f,
												() =>
													'<code>POSTGRES_CONNECTION_STRING=postgresql://username:password@host:port/database</code>'
											),
												r(C, i));
										},
										$$slots: { default: !0 }
									});
									var g = e(N, 2);
									(I(g, {
										children: (C, c) => {
											o();
											var i = $r(),
												f = e(a(i));
											(n(
												f,
												() =>
													'<code>DB_CONNECTION_STRING=postgresql://username:password@host:port/database</code>'
											),
												r(C, i));
										},
										$$slots: { default: !0 }
									}),
										r(b, T));
								},
								$$slots: { default: !0 }
							}),
								r(p, v));
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var ae = e(oe, 2);
			H(ae, {
				id: 'reverse-proxy-configuration',
				children: (d, x) => {
					o();
					var t = u('Reverse Proxy Configuration');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var se = e(ae, 2);
			E(se, {
				children: (d, x) => {
					o();
					var t = ur(),
						h = e(a(t));
					(L(h, {
						children: (O, p) => {
							o();
							var k = cr(),
								v = e(a(k));
							(n(v, () => '<code>CADDY_DISABLED=true</code>'), o(), r(O, k));
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var de = e(se, 2);
			E(de, {
				children: (d, x) => {
					o();
					var t = u(
						'If you previously disabled Caddy, you likely had path mappings in your reverse proxy configuration. With v1.0:'
					);
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var le = e(de, 2);
			B(le, {
				children: (d, x) => {
					var t = pr(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							o();
							var v = hr(),
								P = e(a(v));
							n(P, () => '<code>/api/</code>');
							var _ = e(P, 2);
							(n(_, () => '<code>/.well-known</code>'), o(), r(p, v));
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							o();
							var v = fr(),
								P = e(a(v));
							(n(P, () => '<code>PORT</code>'), o(), r(p, v));
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var ne = e(le, 2);
			ke(ne, {
				id: 'migration-steps',
				children: (d, x) => {
					o();
					var t = u('Migration Steps');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var $e = e(ne, 2);
			E($e, {
				children: (d, x) => {
					o();
					var t = u(
						'Follow the following steps to migrate from previous versions to v1.0.'
					);
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var ve = e($e, 2);
			H(ve, {
				id: 'docker',
				children: (d, x) => {
					o();
					var t = u('Docker');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var ie = e(ve, 2);
			U(ie, {
				children: (d, x) => {
					I(d, {
						children: (t, h) => {
							o();
							var O = yr(),
								p = e(a(O));
							n(p, () => '<code>docker-compose.yml</code>');
							var k = e(p, 2);
							(B(k, {
								children: (v, P) => {
									var _ = br(),
										b = a(_);
									I(b, {
										children: (N, g) => {
											var C = mr(),
												c = a(C);
											L(c, {
												children: (f, R) => {
													o();
													var l = u('Change the port');
													r(f, l);
												},
												$$slots: { default: !0 }
											});
											var i = e(c, 2);
											(n(i, () => '<code>1411</code>'), r(N, C));
										},
										$$slots: { default: !0 }
									});
									var m = e(b, 2);
									I(m, {
										children: (N, g) => {
											var C = gr(),
												c = a(C);
											L(c, {
												children: (f, R) => {
													o();
													var l = u('Change the volume path');
													r(f, l);
												},
												$$slots: { default: !0 }
											});
											var i = e(c, 2);
											(n(i, () => '<code>/app/data</code>'), r(N, C));
										},
										$$slots: { default: !0 }
									});
									var T = e(m, 2);
									(I(T, {
										children: (N, g) => {
											var C = Pr(),
												c = a(C);
											L(c, {
												children: (f, R) => {
													o();
													var l = u('Update the healthcheck');
													r(f, l);
												},
												$$slots: { default: !0 }
											});
											var i = e(c, 2);
											(n(i, () => '<code>1411</code>'), r(N, C));
										},
										$$slots: { default: !0 }
									}),
										r(v, _));
								},
								$$slots: { default: !0 }
							}),
								r(t, O));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var _e = e(ie, 2);
			Y(_e, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-yaml">services:
    pocket-id:
        image: ghcr.io/pocket-id/pocket-id:latest
        ports:
            - '1411:1411' # Change the port
        volumes:
            - ./data:/app/data # Update the volume path
        healthcheck:
            test: 'curl -f http://localhost:1411/healthz' # Update the port in the healthcheck
            interval: 1m30s
            timeout: 5s
            retries: 2
            start_period: 10s
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var ce = e(_e, 2);
			U(ce, {
				start: '2',
				children: (d, x) => {
					var t = Nr(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							o();
							var v = xr(),
								P = e(a(v));
							G(P, {
								href: '#environment-variables',
								children: (b, m) => {
									o();
									var T = u('mentioned above');
									r(b, T);
								},
								$$slots: { default: !0 }
							});
							var _ = e(P, 2);
							(n(_, () => '<code>.env</code>'), o(), r(p, v));
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							o();
							var v = u('Apply the changes by running:');
							r(p, v);
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var ue = e(ce, 2);
			Y(ue, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-bash">   docker compose up -d
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var he = e(ue, 2);
			H(he, {
				id: 'standalone',
				children: (d, x) => {
					o();
					var t = u('Standalone');
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var fe = e(he, 2);
			E(fe, {
				children: (d, x) => {
					o();
					var t =
						u(`While you still can build Opendrive from source, it's now much easier to install and upgrade Opendrive by using the prebuilt binaries.
To migrate from previous versions to v1.0 and use the prebuilt binaries, follow these steps:`);
					r(d, t);
				},
				$$slots: { default: !0 }
			});
			var pe = e(fe, 2);
			U(pe, {
				children: (d, x) => {
					var t = Tr(),
						h = a(t);
					I(h, {
						children: (p, k) => {
							o();
							var v = u("Stop Opendrive if it's currently running.");
							r(p, v);
						},
						$$slots: { default: !0 }
					});
					var O = e(h, 2);
					(I(O, {
						children: (p, k) => {
							o();
							var v = u(
								'Create a backup of the folder that contains your Opendrive installation.'
							);
							r(p, v);
						},
						$$slots: { default: !0 }
					}),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var me = e(pe, 2);
			Y(me, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-bash">   cp -r /path/to/pocket-id /path/to/pocket-id-old
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var ge = e(me, 2);
			U(ge, {
				start: '3',
				children: (d, x) => {
					I(d, {
						children: (t, h) => {
							var O = wr(),
								p = a(O);
							E(p, {
								children: (_, b) => {
									o();
									var m = Or(),
										T = e(a(m));
									(G(T, {
										href: 'https://github.com/pocket-id/pocket-id/releases/latest',
										children: (N, g) => {
											o();
											var C = u('releases page');
											r(N, C);
										},
										$$slots: { default: !0 }
									}),
										o(),
										r(_, m));
								},
								$$slots: { default: !0 }
							});
							var k = e(p, 2);
							E(k, {
								children: (_, b) => {
									o();
									var m = u(
										'Make sure to download the correct version for your operating system. The binary names follow this pattern:'
									);
									r(_, m);
								},
								$$slots: { default: !0 }
							});
							var v = e(k, 2);
							B(v, {
								children: (_, b) => {
									var m = kr(),
										T = a(m);
									I(T, {
										children: (g, C) => {
											var c = S(),
												i = a(c);
											(n(
												i,
												() =>
													'<code>pocket-id-&lt;operating-system>-&lt;architecture></code>'
											),
												r(g, c));
										},
										$$slots: { default: !0 }
									});
									var N = e(T, 2);
									(I(N, {
										children: (g, C) => {
											o();
											var c = Cr(),
												i = e(a(c));
											(n(i, () => '<code>pocket-id-linux-amd64</code>'),
												r(g, c));
										},
										$$slots: { default: !0 }
									}),
										r(_, m));
								},
								$$slots: { default: !0 }
							});
							var P = e(v, 2);
							(E(P, {
								children: (_, b) => {
									o();
									var m = u(
										'You can use curl to download the binary directly. For example, for Linux on AMD64 architecture:'
									);
									r(_, m);
								},
								$$slots: { default: !0 }
							}),
								r(t, O));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Pe = e(ge, 2);
			Y(Pe, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-bash">   curl -L -o pocket-id-linux-amd64 https://github.com/pocket-id/pocket-id/releases/latest/download/pocket-id-linux-amd64
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var be = e(Pe, 2);
			U(be, {
				start: '4',
				children: (d, x) => {
					I(d, {
						children: (t, h) => {
							o();
							var O = u('Rename the binary and make it executable:');
							r(t, O);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var ye = e(be, 2);
			Y(ye, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-bash">   mv pocket-id-&lt;operating-system>-&lt;architecture> pocket-id
   chmod +x pocket-id
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var xe = e(ye, 2);
			U(xe, {
				start: '5',
				children: (d, x) => {
					I(d, {
						children: (t, h) => {
							var O = Sr(),
								p = a(O);
							E(p, {
								children: (v, P) => {
									o();
									var _ = Ir(),
										b = e(a(_));
									n(b, () => '<code>UPLOAD_PATH</code>');
									var m = e(b, 2);
									n(m, () => '<code>DB_CONNECTION_STRING</code>');
									var T = e(m, 2);
									n(T, () => '<code>GEOLITE_DB_PATH</code>');
									var N = e(T, 2);
									n(N, () => '<code>KEYS_PATH</code>');
									var g = e(N, 2);
									n(g, () => '<code>data</code>');
									var C = e(g, 2);
									(n(C, () => '<code>data</code>'), o(), r(v, _));
								},
								$$slots: { default: !0 }
							});
							var k = e(p, 2);
							(E(k, {
								children: (v, P) => {
									o();
									var _ = Dr(),
										b = e(a(_));
									(n(b, () => '<code>data</code>'), o(), r(v, _));
								},
								$$slots: { default: !0 }
							}),
								r(t, O));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Ne = e(xe, 2);
			Y(Ne, {
				children: (d, x) => {
					var t = S(),
						h = a(t);
					(n(
						h,
						() => `<code class="language-bash">   cp -r /path/to/pocket-id-old/data /path/to/pocket-id/data
</code>`
					),
						r(d, t));
				},
				$$slots: { default: !0 }
			});
			var Te = e(Ne, 2);
			U(Te, {
				start: '6',
				children: (d, x) => {
					I(d, {
						children: (t, h) => {
							var O = Ar(),
								p = a(O);
							E(p, {
								children: (v, P) => {
									o();
									var _ = Rr(),
										b = e(a(_));
									n(b, () => '<code>.env</code>');
									var m = e(b, 2);
									n(m, () => '<code>.env</code>');
									var T = e(m, 2);
									n(T, () => '<code>frontend</code>');
									var N = e(T, 2);
									(n(N, () => '<code>backend</code>'), o(), r(v, _));
								},
								$$slots: { default: !0 }
							});
							var k = e(p, 2);
							(E(k, {
								children: (v, P) => {
									o();
									var _ = Er(),
										b = e(a(_));
									n(b, () => '<code>.env</code>');
									var m = e(b, 2);
									(G(m, {
										href: '#environment-variables',
										children: (T, N) => {
											o();
											var g = u('mentioned above');
											r(T, g);
										},
										$$slots: { default: !0 }
									}),
										r(v, _));
								},
								$$slots: { default: !0 }
							}),
								r(t, O));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Se = e(Te, 2);
			(E(Se, {
				children: (d, x) => {
					o();
					var t = u(
						"Enjoy Opendrive v1.0! We're grateful for your ongoing support and contributions that made this milestone release possible."
					);
					r(d, t);
				},
				$$slots: { default: !0 }
			}),
				r(De, q));
		}
	});
}
export { et as default, Le as metadata };
