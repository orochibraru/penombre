import {
	f as p,
	a,
	n as _,
	s as o,
	j as n,
	b as e,
	g as m,
	d as re,
	r as oe,
	h as c
} from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as nr, P as V } from './CXunQUVT.js';
import { T as be, a as y, b as Z, c as d } from './DpdLr4Qt.js';
import { A as ee } from './Bva6-POL.js';
import { H as me } from './CTN7MPTR.js';
import { S as ge } from './Bqu0--pl.js';
import { B as $r } from './C8yZ7dHE.js';
import { P as Ae } from './DZj8j_ml.js';
import { O as _r } from './eLU9aUh4.js';
import { L as ae } from './EJ1QvGwo.js';
import { H as or } from './CMbTFn8B.js';
import { U as tr } from './B2E1dnfA.js';
const vr = {
		title: 'Environment Variables',
		description: 'Complete reference for all Opendrive configuration options'
	},
	{ title: wt, description: kt } = vr;
var cr = p(
		'Below are all the environment variables supported by Opendrive. These should be configured in your <!> file.',
		1
	),
	ur = p('<!> <!> <!> <!>', 1),
	ir = p('<!> <!> <!> <!>', 1),
	fr = p('<!> <!> <!> <!>', 1),
	hr = p(
		'License Key for the GeoLite2 Database. The license key is required to retrieve the geographical location of IP addresses in the audit log. If the key is not provided, IP locations will be marked as "unknown." You can obtain a license key for free <!>.',
		1
	),
	pr = p('<!> <!> <!> <!>', 1),
	Pr = p(
		'Alternative to passing the License Key for GeoLite2 Database with the <!> variable, set to the path of a file containing the key. <em>This can be used with Docker secrets too.</em>',
		1
	),
	mr = p('<!> <!> <!> <!>', 1),
	gr = p('<!> and <!>', 1),
	Er = p(
		'The user and group ID of the user who should run Opendrive inside the Docker container and owns the files that are mounted with the volume. You can get the <!> and <!> of your user on your host machine by using the command <!>. For more information see <!>.',
		1
	),
	Tr = p('<!> <!> <!> <!>', 1),
	br = p('The database provider you want to use. Currently <!> and <!> are supported.', 1),
	Ar = p('<!> <!> <!> <!>', 1),
	Ir = p(
		'Specifies the connection string used to connect to the database.<br/>See the <!> section below for more details.',
		1
	),
	Sr = p('<!> <!> <!> <!>', 1),
	yr = p(
		'Alternative to passing the database connection string with the <!> variable, set to the path of a file containing the value. <em>This can be used with Docker secrets too.</em>',
		1
	),
	Lr = p('<!> <!> <!> <!>', 1),
	xr = p('<!> <!> <!> <!>', 1),
	Dr = p('How verbose the logs should be. Valid values: <!>, <!>, <!>, <!>', 1),
	Or = p('<!> <!> <!> <!>', 1),
	Rr = p(
		'Location where to store the private keys: <!> (default) or <!> (requires an encryption key).',
		1
	),
	Nr = p('<!> <!> <!> <!>', 1),
	Ur = p(
		"Key used to encrypt data, including the private keys. It's recommended to use a random sequence of characters, for example generated with <!><br/>See the <!> section below for more details.",
		1
	),
	wr = p('<!> <!> <!> <!>', 1),
	kr = p(
		'Alternative to passing the encryption key with the <!> variable, set to the path of a file containing a random encryption key. <em>This can be used with Docker secrets too.</em>',
		1
	),
	Cr = p('<!> <!> <!> <!>', 1),
	Mr = p('When <!> is <!>, this is the path where the private keys are stored.', 1),
	Br = p('<!> <!> <!> <!>', 1),
	Gr = p('<!> <!> <!> <!>', 1),
	Fr = p('<!> <!> <!> <!>', 1),
	Yr = p('<!> <!> <!> <!>', 1),
	Wr = p('<!> <!> <!> <!>', 1),
	Kr = p('<!> <!> <!> <!>', 1),
	Hr = p(
		'The Unix socket path on which Opendrive should listen. When set, the server will use a Unix socket instead of TCP, and the <!>/<!> parameters are ignored.',
		1
	),
	Vr = p('<!> <!> <!> <!>', 1),
	qr = p('The Unix socket mode. Only takes effect when <!> is set.', 1),
	Xr = p('<!> <!> <!> <!>', 1),
	jr = p('<!> <!> <!> <!>', 1),
	Qr = p('See <!>.', 1),
	zr = p('<!> <!> <!> <!>', 1),
	Jr = p(
		'Disable heartbeat that gets sent every 24 hours to count how many Opendrive instances are running. Read more <!>.',
		1
	),
	Zr = p('<!> <!> <!> <!>', 1),
	eo = p(
		"Sets the base URL of all URLs that need to be accessible from other clients in <!>. This can be useful if <!> isn't accessible by your OIDC clients.",
		1
	),
	ro = p('<!> <!> <!> <!>', 1),
	oo = p(
		'<thead><!></thead> <tbody><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!></tbody>',
		1
	),
	to = p('The <!> environmental variable configures how Opendrive connects to the database.', 1),
	ao = p(
		'When using <!> (<!>, the default), this contains the path to the database, which by default is <!>. Opendrive automatically adds some parameters to the database path, turning it into a connection string like <!> - you can pass a full connection string if you need to customize the parameters.',
		1
	),
	so = p(
		`[!CAUTION]
We <!> storing the SQLite database inside a networked filesystem, such as a NFS or SMB share. However, if you absolutely must, and are <!>, you need to modify <!> and disable journaling, by setting <!>. Note that this is not a recommended or supported scenario by the SQLite developers, and you should ensure to have proper backups for your database.`,
		1
	),
	lo = p('When using <!> (<!>), the connection string is a DSN as supported by libpq:', 1),
	no = p(
		'We recommend setting an encryption key so Opendrive can encrypt sensitive data, such as the token signing keys. Additionally, providing an encryption key is required when you want to store the token signing keys in the database (<!>).',
		1
	),
	$o = p('Set its value in the <!> variable directly', 1),
	_o = p(
		'Save it to a file mounted inside the container and set <!> to its path (the file is treated as binary). This also works with Docker Secrets.',
		1
	),
	vo = p('<!> <!>', 1),
	co = p(
		'To enable environment variable overrides, set <!> to <!>. When <!> is set to true, Opendrive will use values from the environment variables. If a variable is not set, the system will fall back to its default values.',
		1
	),
	uo = p('<!> <!> <!>', 1),
	io = p('<!> <!> <!>', 1),
	fo = p('<!> <!> <!>', 1),
	ho = p('<!> <!> <!>', 1),
	po = p('<!> <!> <!>', 1),
	Po = p('Whether the user signup functionality is enabled. Valid Values: <!>, <!>, <!>', 1),
	mo = p('<!> <!> <!>', 1),
	go = p('Assign these custom claims automatically to new users upon signup. Example: <!>', 1),
	Eo = p('<!> <!> <!>', 1),
	To = p('Assign these groups automatically to new users upon signup. Example: <!>', 1),
	bo = p('<!> <!> <!>', 1),
	Ao = p('<!> <!> <!>', 1),
	Io = p('<!> <!> <!>', 1),
	So = p('<!> <!> <!>', 1),
	yo = p('<!> <!> <!>', 1),
	Lo = p('Sender email address for outgoing emails. Format: <!>', 1),
	xo = p('<!> <!> <!>', 1),
	Do = p('<!> <!> <!>', 1),
	Oo = p('<!> <!> <!>', 1),
	Ro = p(
		'Alternative to <!> variable, set to the path of a file containing the SMTP password. <em>This can be used with Docker secrets too.</em>',
		1
	),
	No = p('<!> <!> <!>', 1),
	Uo = p('Which TLS Option to use. Valid values are: <!>, <!> and <!>.', 1),
	wo = p('<!> <!> <!>', 1),
	ko = p('<!> <!> <!>', 1),
	Co = p('<!> <!> <!>', 1),
	Mo = p('<!> <!> <!>', 1),
	Bo = p('<!> <!> <!>', 1),
	Go = p('<!> <!> <!>', 1),
	Fo = p('<!> <!> <!>', 1),
	Yo = p('<!> <!> <!>', 1),
	Wo = p('<!> <!> <!>', 1),
	Ko = p('<!> <!> <!>', 1),
	Ho = p(
		'Alternative to <!> variable, set to the path of a file containing the LDAP bind password. <em>This can be used with Docker secrets too.</em>',
		1
	),
	Vo = p('<!> <!> <!>', 1),
	qo = p('<!> <!> <!>', 1),
	Xo = p('<!> <!> <!>', 1),
	jo = p('<!> <!> <!>', 1),
	Qo = p('<!> <!> <!>', 1),
	zo = p('<!> <!> <!>', 1),
	Jo = p('<!> <!> <!>', 1),
	Zo = p('<!> <!> <!>', 1),
	et = p('<!> <!> <!>', 1),
	rt = p('<!> <!> <!>', 1),
	ot = p('<!> <!> <!>', 1),
	tt = p('<!> <!> <!>', 1),
	at = p('<!> <!> <!>', 1),
	st = p('<!> <!> <!>', 1),
	dt = p('<!> <!> <!>', 1),
	lt = p('<!> <!> <!>', 1),
	nt = p(
		'<thead><!></thead> <tbody><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!><!></tbody>',
		1
	),
	$t = p('<!> <!>', 1),
	_t = p('<!> <!> <!>', 1),
	vt = p('<!> <!> <!>', 1),
	ct = p('<!> <!> <!>', 1),
	ut = p('<thead><!></thead> <tbody><!><!></tbody>', 1),
	it = p(
		'The behavior of the log, trace, and metric exporters can be controlled using the <!> environment variables. These are documented in the <!>.',
		1
	),
	ft = p(
		"If you want to enable the <!> endpoint for Prometheus metrics scraping instead of using OTLP metrics pushing, you'll need to also set:",
		1
	),
	ht = p(
		'This will start a <!> HTTP server with just the metrics endpoint. It is by default bound to:',
		1
	),
	pt = p('<!>: <!>', 1),
	Pt = p('<!>: <!>', 1),
	mt = p('<!> <!>', 1),
	gt = p(
		'<!> <!> <div class="env-var-table"><!></div> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function Ct(ar) {
	nr(ar, {
		children: (sr, Et) => {
			var Ie = gt(),
				Se = a(Ie);
			V(Se, {
				children: (L, w) => {
					_();
					var S = cr(),
						O = o(a(S));
					(n(O, () => '<code>.env </code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var ye = o(Se, 2);
			V(ye, {
				children: (L, w) => {
					_();
					var S = m(
						'Be cautious when modifying environment variables that are not recommended to change.'
					);
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Ee = o(ye, 2),
				dr = re(Ee);
			(be(dr, {
				children: (L, w) => {
					var S = oo(),
						O = a(S),
						B = re(O);
					(y(B, {
						children: (x, C) => {
							var T = ur(),
								b = a(T);
							Z(b, {
								children: (l, P) => {
									_();
									var t = m('Variable');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							Z(A, {
								children: (l, P) => {
									_();
									var t = m('Default Value');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							Z(I, {
								children: (l, P) => {
									_();
									var t = m('Recommended to change');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(Z(D, {
								children: (l, P) => {
									_();
									var t = m('Description');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					}),
						oe(O));
					var N = o(O, 2),
						F = re(N);
					y(F, {
						children: (x, C) => {
							var T = ir(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>APP_URL</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>http://localhost:1411</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('The URL where you will access the app.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var U = o(F);
					y(U, {
						children: (x, C) => {
							var T = fr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>TRUST_PROXY</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>false</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('Whether the app is behind a reverse proxy.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var G = o(U);
					y(G, {
						children: (x, C) => {
							var T = pr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>MAXMIND_LICENSE_KEY</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = hr(),
										v = o(a(t));
									(ee(v, {
										href: 'https://www.maxmind.com/en/geolite2/signup',
										children: (k, Q) => {
											_();
											var q = m('here');
											e(k, q);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var W = o(G);
					y(W, {
						children: (x, C) => {
							var T = mr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>MAXMIND_LICENSE_KEY_FILE</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Pr(),
										v = o(a(t));
									(n(v, () => '<code>MAXMIND_LICENSE_KEY</code>'), _(2), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var H = o(W);
					y(H, {
						children: (x, C) => {
							var T = Tr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = gr(),
										v = a(t);
									n(v, () => '<code>PUID</code>');
									var k = o(v, 2);
									(n(k, () => '<code>PGID</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>1000</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Er(),
										v = o(a(t));
									n(v, () => '<code>PUID</code>');
									var k = o(v, 2);
									n(k, () => '<code>GUID</code>');
									var Q = o(k, 2);
									n(Q, () => '<code>id</code>');
									var q = o(Q, 2);
									(ee(q, {
										href: 'https://docs.linuxserver.io/general/understanding-puid-and-pgid/#using-the-variables',
										children: (te, rr) => {
											_();
											var g = m('this article');
											e(te, g);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var K = o(H);
					y(K, {
						children: (x, C) => {
							var T = Ar(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>DB_PROVIDER</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>sqlite</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = br(),
										v = o(a(t));
									n(v, () => '<code>sqlite</code>');
									var k = o(v, 2);
									(n(k, () => '<code>postgres</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var X = o(K);
					y(X, {
						children: (x, C) => {
							var T = Sr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>DB_CONNECTION_STRING</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>data/pocket-id.db</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Ir(),
										v = o(a(t), 3);
									(ee(v, {
										href: '#database-connection-string',
										children: (k, Q) => {
											_();
											var q = m('Database connection string');
											e(k, q);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var J = o(X);
					y(J, {
						children: (x, C) => {
							var T = Lr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>DB_CONNECTION_STRING_FILE</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = yr(),
										v = o(a(t));
									(n(v, () => '<code>DB_CONNECTION_STRING</code>'),
										_(2),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var Y = o(J);
					y(Y, {
						children: (x, C) => {
							var T = xr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>UPLOAD_PATH</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>data/uploads</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('The path where the uploaded files are stored.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var j = o(Y);
					y(j, {
						children: (x, C) => {
							var T = Or(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>LOG_LEVEL</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>info</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Dr(),
										v = o(a(t));
									n(v, () => '<code>debug</code>');
									var k = o(v, 2);
									n(k, () => '<code>info</code>');
									var Q = o(k, 2);
									n(Q, () => '<code>warn</code>');
									var q = o(Q, 2);
									(n(q, () => '<code>error</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var M = o(j);
					y(M, {
						children: (x, C) => {
							var T = Nr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>KEYS_STORAGE</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>file</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Rr(),
										v = o(a(t));
									n(v, () => '<code>file</code>');
									var k = o(v, 2);
									(n(k, () => '<code>database</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var z = o(M);
					y(z, {
						children: (x, C) => {
							var T = wr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>ENCRYPTION_KEY</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Ur(),
										v = o(a(t));
									n(v, () => '<code>openssl rand -base64 32</code>');
									var k = o(v, 3);
									(ee(k, {
										href: '#encryption-keys',
										children: (Q, q) => {
											_();
											var te = m('Encryption keys');
											e(Q, te);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var se = o(z);
					y(se, {
						children: (x, C) => {
							var T = Cr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>ENCRYPTION_KEY_FILE</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('yes');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = kr(),
										v = o(a(t));
									(n(v, () => '<code>ENCRYPTION_KEY</code>'), _(2), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var de = o(se);
					y(de, {
						children: (x, C) => {
							var T = Br(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>KEYS_PATH</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>data/keys</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Mr(),
										v = o(a(t));
									n(v, () => '<code>KEYS_STORAGE</code>');
									var k = o(v, 2);
									(n(k, () => '<code>file</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var le = o(de);
					y(le, {
						children: (x, C) => {
							var T = Gr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>GEOLITE_DB_PATH</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>data/GeoLite2-City.mmdb</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m(
										'The path where the GeoLite2 database should be stored.'
									);
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var ne = o(le);
					y(ne, {
						children: (x, C) => {
							var T = Fr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>GEOLITE_DB_URL</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(
										v,
										() =>
											'<code>https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&amp;license_key=%s&amp;suffix=tar.gz</code>'
									),
										e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m(
										'The custom download URL for the Geolite DB (default value should be fine for most users.)'
									);
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var $e = o(ne);
					y($e, {
						children: (x, C) => {
							var T = Yr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>PORT</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>1411</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('The port on which Opendrive should listen.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var _e = o($e);
					y(_e, {
						children: (x, C) => {
							var T = Wr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>HOST</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>0.0.0.0</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('The address on which Opendrive should listen.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var ve = o(_e);
					y(ve, {
						children: (x, C) => {
							var T = Kr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>LOG_JSON</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>false</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m('If true, emit logs formatted as JSON.');
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var ce = o(ve);
					y(ce, {
						children: (x, C) => {
							var T = Vr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>UNIX_SOCKET</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Hr(),
										v = o(a(t));
									n(v, () => '<code>PORT</code>');
									var k = o(v, 2);
									(n(k, () => '<code>HOST</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var ue = o(ce);
					y(ue, {
						children: (x, C) => {
							var T = Xr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>UNIX_SOCKET_MODE</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = qr(),
										v = o(a(t));
									(n(v, () => '<code>UNIX_SOCKET</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var ie = o(ue);
					y(ie, {
						children: (x, C) => {
							var T = jr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>LOCAL_IPV6_RANGES</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = m(
										'User configured local IPv6 ranges for the audit log.'
									);
									e(l, t);
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var fe = o(ie);
					y(fe, {
						children: (x, C) => {
							var T = zr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>UI_CONFIG_DISABLED</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>false</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Qr(),
										v = o(a(t));
									(ee(v, {
										href: '#overriding-the-ui-configuration',
										children: (k, Q) => {
											_();
											var q = m('Overriding the UI configuration');
											e(k, q);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var he = o(fe);
					y(he, {
						children: (x, C) => {
							var T = Zr(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>ANALYTICS_DISABLED</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>false</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = Jr(),
										v = o(a(t));
									(ee(v, {
										href: '/docs/configuration/analytics',
										children: (k, Q) => {
											_();
											var q = m('about analytics');
											e(k, q);
										},
										$$slots: { default: !0 }
									}),
										_(),
										e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					});
					var Pe = o(he);
					(y(Pe, {
						children: (x, C) => {
							var T = ro(),
								b = a(T);
							d(b, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>INTERNAL_APP_URL</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var A = o(b, 2);
							d(A, {
								children: (l, P) => {
									var t = c(),
										v = a(t);
									(n(v, () => '<code>-</code>'), e(l, t));
								},
								$$slots: { default: !0 }
							});
							var I = o(A, 2);
							d(I, {
								children: (l, P) => {
									_();
									var t = m('no');
									e(l, t);
								},
								$$slots: { default: !0 }
							});
							var D = o(I, 2);
							(d(D, {
								children: (l, P) => {
									_();
									var t = eo(),
										v = o(a(t));
									n(v, () => '<code>/well-known/ openid-configuration</code>');
									var k = o(v, 2);
									(n(k, () => '<code>APP_URL</code>'), _(), e(l, t));
								},
								$$slots: { default: !0 }
							}),
								e(x, T));
						},
						$$slots: { default: !0 }
					}),
						oe(N),
						e(L, S));
				},
				$$slots: { default: !0 }
			}),
				oe(Ee));
			var Le = o(Ee, 2);
			me(Le, {
				id: 'database-connection-string',
				children: (L, w) => {
					_();
					var S = m('Database connection string');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var xe = o(Le, 2);
			V(xe, {
				children: (L, w) => {
					_();
					var S = to(),
						O = o(a(S));
					(n(O, () => '<code>DB_CONNECTION_STRING</code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var De = o(xe, 2);
			V(De, {
				children: (L, w) => {
					_();
					var S = ao(),
						O = o(a(S));
					ge(O, {
						children: (U, G) => {
							_();
							var W = m('SQLite');
							e(U, W);
						},
						$$slots: { default: !0 }
					});
					var B = o(O, 2);
					n(B, () => '<code>DB_PROVIDER=sqlite</code>');
					var N = o(B, 2);
					n(N, () => '<code>data/pocket-id.db</code>');
					var F = o(N, 2);
					(n(
						F,
						() =>
							'<code>file:data/pocket-id.db?_pragma=journal_mode(WAL)&amp;_pragma=busy_timeout(2500)&amp;_txlock=immediate&amp;_pragma=foreign_keys(1)</code>'
					),
						_(),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Oe = o(De, 2);
			$r(Oe, {
				children: (L, w) => {
					V(L, {
						children: (S, O) => {
							_();
							var B = so(),
								N = o(a(B));
							ge(N, {
								children: (W, H) => {
									_();
									var K = m('do NOT recommend');
									e(W, K);
								},
								$$slots: { default: !0 }
							});
							var F = o(N, 2);
							ee(F, {
								href: 'https://www.sqlite.org/useovernet.html',
								children: (W, H) => {
									_();
									var K = m('aware of the risks');
									e(W, K);
								},
								$$slots: { default: !0 }
							});
							var U = o(F, 2);
							n(U, () => '<code>DB_CONNECTION_STRING</code>');
							var G = o(U, 2);
							(n(G, () => '<code>_journal_mode=DELETE</code>'), _(), e(S, B));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Re = o(Oe, 2);
			V(Re, {
				children: (L, w) => {
					_();
					var S = lo(),
						O = o(a(S));
					ge(O, {
						children: (N, F) => {
							_();
							var U = m('PostgreSQL');
							e(N, U);
						},
						$$slots: { default: !0 }
					});
					var B = o(O, 2);
					(n(B, () => '<code>DB_PROVIDER=postgres</code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Ne = o(Re, 2);
			Ae(Ne, {
				children: (L, w) => {
					var S = c(),
						O = a(S);
					(n(
						O,
						() => `<code>Format:
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&amp;...]

Example:
postgres://pocketid:123456@localhost:5432/pocketid
</code>`
					),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Ue = o(Ne, 2);
			me(Ue, {
				id: 'encryption-keys',
				children: (L, w) => {
					_();
					var S = m('Encryption keys');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var we = o(Ue, 2);
			V(we, {
				children: (L, w) => {
					_();
					var S = no(),
						O = o(a(S));
					(n(O, () => '<code>KEYS_STORAGE=database</code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var ke = o(we, 2);
			V(ke, {
				children: (L, w) => {
					_();
					var S = m(
						'A good encryption key is a 32-characters-long random string. You can generate one using tools like OpenSSL:'
					);
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Ce = o(ke, 2);
			Ae(Ce, {
				children: (L, w) => {
					var S = c(),
						O = a(S);
					(n(
						O,
						() => `<code class="language-sh">openssl rand -base64 32
</code>`
					),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Me = o(Ce, 2);
			V(Me, {
				children: (L, w) => {
					_();
					var S = m('You can pass the encryption key to Opendrive in two ways:');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Be = o(Me, 2);
			_r(Be, {
				children: (L, w) => {
					var S = vo(),
						O = a(S);
					ae(O, {
						children: (N, F) => {
							_();
							var U = $o(),
								G = o(a(U));
							(n(G, () => '<code>ENCRYPTION_KEY</code>'), _(), e(N, U));
						},
						$$slots: { default: !0 }
					});
					var B = o(O, 2);
					(ae(B, {
						children: (N, F) => {
							_();
							var U = _o(),
								G = o(a(U));
							(n(G, () => '<code>ENCRYPTION_KEY_FILE</code>'), _(), e(N, U));
						},
						$$slots: { default: !0 }
					}),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Ge = o(Be, 2);
			or(Ge, {
				id: 'overriding-the-ui-configuration',
				children: (L, w) => {
					_();
					var S = m('Overriding the UI configuration');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Fe = o(Ge, 2);
			V(Fe, {
				children: (L, w) => {
					_();
					var S = m(
						'You can change additional settings directly in the Opendrive UI. However, if you prefer to configure them via environment variables, you can do so by setting the following variables.'
					);
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Ye = o(Fe, 2);
			V(Ye, {
				children: (L, w) => {
					_();
					var S = co(),
						O = o(a(S));
					n(O, () => '<code>UI_CONFIG_DISABLED</code>');
					var B = o(O, 2);
					n(B, () => '<code>true</code>');
					var N = o(B, 2);
					(n(N, () => '<code>UI_CONFIG_DISABLED</code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var We = o(Ye, 2);
			be(We, {
				children: (L, w) => {
					var S = nt(),
						O = a(S),
						B = re(O);
					(y(B, {
						children: (g, R) => {
							var u = uo(),
								i = a(u);
							Z(i, {
								children: (s, h) => {
									_();
									var r = m('Variable');
									e(s, r);
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							Z(f, {
								children: (s, h) => {
									_();
									var r = m('Default Value');
									e(s, r);
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(Z(E, {
								children: (s, h) => {
									_();
									var r = m('Description');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					}),
						oe(O));
					var N = o(O, 2),
						F = re(N);
					y(F, {
						children: (g, R) => {
							var u = io(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>APP_NAME</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>Opendrive</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('The name of the app.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var U = o(F);
					y(U, {
						children: (g, R) => {
							var u = fo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SESSION_DURATION</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>60</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'The duration of a session in minutes before the user has to sign in again.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var G = o(U);
					y(G, {
						children: (g, R) => {
							var u = ho(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>EMAILS_VERIFIED</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										"Whether the user's email should be marked as verified for the OIDC clients."
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var W = o(G);
					y(W, {
						children: (g, R) => {
							var u = po(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>ALLOW_OWN_ACCOUNT_EDIT</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>true</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Whether the users should be able to edit their own account details.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var H = o(W);
					y(H, {
						children: (g, R) => {
							var u = mo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>ALLOW_USER_SIGNUPS</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>disabled</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = Po(),
										$ = o(a(r));
									n($, () => '<code>disabled</code>');
									var pe = o($, 2);
									n(pe, () => '<code>withToken</code>');
									var Te = o(pe, 2);
									(n(Te, () => '<code>open</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var K = o(H);
					y(K, {
						children: (g, R) => {
							var u = Eo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SIGNUP_DEFAULT_CUSTOM_CLAIMS</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>[]</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = go(),
										$ = o(a(r));
									(n(
										$,
										() =>
											'<code>[&#123;"key":"claim1","value":"value1"&#125;,&#123;"key":"claim2","value":"value2"&#125;]</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var X = o(K);
					y(X, {
						children: (g, R) => {
							var u = bo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SIGNUP_DEFAULT_USER_GROUP_IDS</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>[]</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = To(),
										$ = o(a(r));
									(n(
										$,
										() =>
											'<code>["a3888f2b-4c00-4b23-9c85-a3c8d685eb1f"]</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var J = o(X);
					y(J, {
						children: (g, R) => {
							var u = Ao(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>DISABLE_ANIMATIONS</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('Turn off all animations throughout the Admin UI.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var Y = o(J);
					y(Y, {
						children: (g, R) => {
							var u = Io(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>ACCENT_COLOR</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>default</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'A custom accent color for the UI. Accepts any valid CSS color value such as hex, RGB or HSL.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var j = o(Y);
					y(j, {
						children: (g, R) => {
							var u = So(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_HOST</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('SMTP server hostname.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var M = o(j);
					y(M, {
						children: (g, R) => {
							var u = yo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_PORT</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('SMTP server port.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var z = o(M);
					y(z, {
						children: (g, R) => {
							var u = xo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_FROM</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = Lo(),
										$ = o(a(r));
									(n($, () => '<code>user@example.com</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var se = o(z);
					y(se, {
						children: (g, R) => {
							var u = Do(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_USER</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('SMTP username for authentication.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var de = o(se);
					y(de, {
						children: (g, R) => {
							var u = Oo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_PASSWORD</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('SMTP password for authentication.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var le = o(de);
					y(le, {
						children: (g, R) => {
							var u = No(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_PASSWORD_FILE</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = Ro(),
										$ = o(a(r));
									(n($, () => '<code>SMTP_PASSWORD_FILE</code>'), _(2), e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var ne = o(le);
					y(ne, {
						children: (g, R) => {
							var u = wo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_TLS</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>none</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = Uo(),
										$ = o(a(r));
									n($, () => '<code>none</code>');
									var pe = o($, 2);
									n(pe, () => '<code>starttls</code>');
									var Te = o(pe, 2);
									(n(Te, () => '<code>tls</code>'), _(), e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var $e = o(ne);
					y($e, {
						children: (g, R) => {
							var u = ko(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>SMTP_SKIP_CERT_VERIFY</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Whether to skip SMTP certificate verification. This can be useful for self-signed certificates.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var _e = o($e);
					y(_e, {
						children: (g, R) => {
							var u = Co(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>EMAIL_LOGIN_NOTIFICATION_ENABLED</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Send an email to the user when they log in from a new device.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var ve = o(_e);
					y(ve, {
						children: (g, R) => {
							var u = Mo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n(
										$,
										() => '<code>EMAIL_ONE_TIME_ACCESS_AS_ADMIN_ENABLED</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Allows an admin to send a login code to the user via email.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var ce = o(ve);
					y(ce, {
						children: (g, R) => {
							var u = Bo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>EMAIL_API_KEY_EXPIRATION_ENABLED</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Send an email to the user when their API key is about to expire.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var ue = o(ce);
					y(ue, {
						children: (g, R) => {
							var u = Go(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n(
										$,
										() =>
											'<code>EMAIL_ONE_TIME_ACCESS_AS_UNAUTHENTICATED_ENABLED</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										"Allows users to bypass passkeys by requesting a login code sent to their email. This reduces the security significantly as anyone with access to the user's email can gain entry."
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var ie = o(ue);
					y(ie, {
						children: (g, R) => {
							var u = Fo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ENABLED</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('Whether LDAP authentication is enabled.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var fe = o(ie);
					y(fe, {
						children: (g, R) => {
							var u = Yo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_URL</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP server URL.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var he = o(fe);
					y(he, {
						children: (g, R) => {
							var u = Wo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_BIND_DN</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP bind distinguished name (DN).');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var Pe = o(he);
					y(Pe, {
						children: (g, R) => {
							var u = Ko(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_BIND_PASSWORD</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP bind password.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var x = o(Pe);
					y(x, {
						children: (g, R) => {
							var u = Vo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_BIND_PASSWORD_FILE</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = Ho(),
										$ = o(a(r));
									(n($, () => '<code>LDAP_BIND_PASSWORD_FILE</code>'),
										_(2),
										e(s, r));
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var C = o(x);
					y(C, {
						children: (g, R) => {
							var u = qo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_BASE</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP search base DN.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var T = o(C);
					y(T, {
						children: (g, R) => {
							var u = Xo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_USER_SEARCH_FILTER</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>(objectClass=person)</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP user search filter.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var b = o(T);
					y(b, {
						children: (g, R) => {
							var u = jo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_USER_GROUP_SEARCH_FILTER</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>(objectClass=groupOfNames)</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('The Search filter to use to search/sync groups.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var A = o(b);
					y(A, {
						children: (g, R) => {
							var u = Qo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_SKIP_CERT_VERIFY</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Whether to skip LDAP certificate verification. This can be useful for self-signed certificates.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var I = o(A);
					y(I, {
						children: (g, R) => {
							var u = zo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_SOFT_DELETE_USERS</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>false</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'When enabled, users removed from LDAP will be disabled rather than deleted from the system.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var D = o(I);
					y(D, {
						children: (g, R) => {
							var u = Jo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n(
										$,
										() => '<code>LDAP_ATTRIBUTE_USER_UNIQUE_IDENTIFIER</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'LDAP attribute for user unique identifier. The value of this attribute should never change.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var l = o(D);
					y(l, {
						children: (g, R) => {
							var u = Zo(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_USER_USERNAME</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for user username.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var P = o(l);
					y(P, {
						children: (g, R) => {
							var u = et(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_USER_EMAIL</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for user email.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var t = o(P);
					y(t, {
						children: (g, R) => {
							var u = rt(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_USER_FIRST_NAME</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for user first name.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var v = o(t);
					y(v, {
						children: (g, R) => {
							var u = ot(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_USER_LAST_NAME</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for user last name.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var k = o(v);
					y(k, {
						children: (g, R) => {
							var u = tt(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_USER_PROFILE_PICTURE</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for the profile picture of a user.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var Q = o(k);
					y(Q, {
						children: (g, R) => {
							var u = at(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_GROUP_MEMBER</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>member</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'LDAP attribute to use for querying members of a group.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var q = o(Q);
					y(q, {
						children: (g, R) => {
							var u = st(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n(
										$,
										() => '<code>LDAP_ATTRIBUTE_GROUP_UNIQUE_IDENTIFIER</code>'
									),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'LDAP attribute for group unique identifier. The value of this attribute should never change.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var te = o(q);
					y(te, {
						children: (g, R) => {
							var u = dt(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_GROUP_NAME</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m('LDAP attribute for group name.');
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					});
					var rr = o(te);
					(y(rr, {
						children: (g, R) => {
							var u = lt(),
								i = a(u);
							d(i, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>LDAP_ATTRIBUTE_ADMIN_GROUP</code>'),
										e(s, r));
								},
								$$slots: { default: !0 }
							});
							var f = o(i, 2);
							d(f, {
								children: (s, h) => {
									var r = c(),
										$ = a(r);
									(n($, () => '<code>-</code>'), e(s, r));
								},
								$$slots: { default: !0 }
							});
							var E = o(f, 2);
							(d(E, {
								children: (s, h) => {
									_();
									var r = m(
										'Name of the admin group. Members of this group will have Admin Privileges in Opendrive.'
									);
									e(s, r);
								},
								$$slots: { default: !0 }
							}),
								e(g, u));
						},
						$$slots: { default: !0 }
					}),
						oe(N),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Ke = o(We, 2);
			or(Ke, {
				id: 'observability',
				children: (L, w) => {
					_();
					var S = m('Observability');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var He = o(Ke, 2);
			V(He, {
				children: (L, w) => {
					_();
					var S = m(
						'Opendrive offers multiple options for observability, including logs, metrics, and traces.'
					);
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Ve = o(He, 2);
			V(Ve, {
				children: (L, w) => {
					_();
					var S = m('You can configure Opendrive to emit metrics and traces.');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var qe = o(Ve, 2);
			tr(qe, {
				children: (L, w) => {
					var S = $t(),
						O = a(S);
					ae(O, {
						children: (N, F) => {
							_();
							var U = m('Both can be sent to an OpenTelemetry collector.');
							e(N, U);
						},
						$$slots: { default: !0 }
					});
					var B = o(O, 2);
					(ae(B, {
						children: (N, F) => {
							_();
							var U = m(
								'For metrics, you can also configure Opendrive to expose them on a Prometheus-compatible endpoint.'
							);
							e(N, U);
						},
						$$slots: { default: !0 }
					}),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Xe = o(qe, 2);
			be(Xe, {
				children: (L, w) => {
					var S = ut(),
						O = a(S),
						B = re(O);
					(y(B, {
						children: (G, W) => {
							var H = _t(),
								K = a(H);
							Z(K, {
								children: (Y, j) => {
									_();
									var M = m('Variable');
									e(Y, M);
								},
								$$slots: { default: !0 }
							});
							var X = o(K, 2);
							Z(X, {
								children: (Y, j) => {
									_();
									var M = m('Default Value');
									e(Y, M);
								},
								$$slots: { default: !0 }
							});
							var J = o(X, 2);
							(Z(J, {
								children: (Y, j) => {
									_();
									var M = m('Description');
									e(Y, M);
								},
								$$slots: { default: !0 }
							}),
								e(G, H));
						},
						$$slots: { default: !0 }
					}),
						oe(O));
					var N = o(O, 2),
						F = re(N);
					y(F, {
						children: (G, W) => {
							var H = vt(),
								K = a(H);
							d(K, {
								children: (Y, j) => {
									var M = c(),
										z = a(M);
									(n(z, () => '<code>TRACING_ENABLED</code>'), e(Y, M));
								},
								$$slots: { default: !0 }
							});
							var X = o(K, 2);
							d(X, {
								children: (Y, j) => {
									var M = c(),
										z = a(M);
									(n(z, () => '<code>false</code>'), e(Y, M));
								},
								$$slots: { default: !0 }
							});
							var J = o(X, 2);
							(d(J, {
								children: (Y, j) => {
									_();
									var M = m('Enables tracing support');
									e(Y, M);
								},
								$$slots: { default: !0 }
							}),
								e(G, H));
						},
						$$slots: { default: !0 }
					});
					var U = o(F);
					(y(U, {
						children: (G, W) => {
							var H = ct(),
								K = a(H);
							d(K, {
								children: (Y, j) => {
									var M = c(),
										z = a(M);
									(n(z, () => '<code>METRICS_ENABLED</code>'), e(Y, M));
								},
								$$slots: { default: !0 }
							});
							var X = o(K, 2);
							d(X, {
								children: (Y, j) => {
									var M = c(),
										z = a(M);
									(n(z, () => '<code>false</code>'), e(Y, M));
								},
								$$slots: { default: !0 }
							});
							var J = o(X, 2);
							(d(J, {
								children: (Y, j) => {
									_();
									var M = m('Enables metrics support');
									e(Y, M);
								},
								$$slots: { default: !0 }
							}),
								e(G, H));
						},
						$$slots: { default: !0 }
					}),
						oe(N),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var je = o(Xe, 2);
			me(je, {
				id: 'using-opentelemetry-for-logs-metrics-and-traces',
				children: (L, w) => {
					_();
					var S = m('Using OpenTelemetry for logs, metrics, and traces');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Qe = o(je, 2);
			V(Qe, {
				children: (L, w) => {
					_();
					var S = it(),
						O = o(a(S));
					n(O, () => '<code>OTEL_*</code>');
					var B = o(O, 2);
					(ee(B, {
						href: 'https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/',
						children: (N, F) => {
							_();
							var U = m('OpenTelemetry SDK environment variables documentation');
							e(N, U);
						},
						$$slots: { default: !0 }
					}),
						_(),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var ze = o(Qe, 2);
			me(ze, {
				id: 'using-prometheus-for-metrics',
				children: (L, w) => {
					_();
					var S = m('Using Prometheus for metrics');
					e(L, S);
				},
				$$slots: { default: !0 }
			});
			var Je = o(ze, 2);
			V(Je, {
				children: (L, w) => {
					_();
					var S = ft(),
						O = o(a(S));
					(n(O, () => '<code>/metrics</code>'), _(), e(L, S));
				},
				$$slots: { default: !0 }
			});
			var Ze = o(Je, 2);
			Ae(Ze, {
				children: (L, w) => {
					var S = c(),
						O = a(S);
					(n(
						O,
						() => `<code>OTEL_METRICS_EXPORTER=prometheus
</code>`
					),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var er = o(Ze, 2);
			V(er, {
				children: (L, w) => {
					_();
					var S = ht(),
						O = o(a(S));
					(ge(O, {
						children: (B, N) => {
							_();
							var F = m('second');
							e(B, F);
						},
						$$slots: { default: !0 }
					}),
						_(),
						e(L, S));
				},
				$$slots: { default: !0 }
			});
			var lr = o(er, 2);
			(tr(lr, {
				children: (L, w) => {
					var S = mt(),
						O = a(S);
					ae(O, {
						children: (N, F) => {
							var U = pt(),
								G = a(U);
							n(G, () => '<code>OTEL_EXPORTER_PROMETHEUS_HOST</code>');
							var W = o(G, 2);
							(n(W, () => '<code>localhost</code>'), e(N, U));
						},
						$$slots: { default: !0 }
					});
					var B = o(O, 2);
					(ae(B, {
						children: (N, F) => {
							var U = Pt(),
								G = a(U);
							n(G, () => '<code>OTEL_EXPORTER_PROMETHEUS_PORT</code>');
							var W = o(G, 2);
							(n(W, () => '<code>9464</code>'), e(N, U));
						},
						$$slots: { default: !0 }
					}),
						e(L, S));
				},
				$$slots: { default: !0 }
			}),
				e(sr, Ie));
		}
	});
}
export { Ct as default, vr as metadata };
