import { f as $, a as d, n as e, s as a, g as i, b as r, j as L } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as j, P as _ } from './CXunQUVT.js';
import { A as m } from './Bva6-POL.js';
import { H as g } from './CMbTFn8B.js';
import { U as C } from './B2E1dnfA.js';
import { L as y } from './EJ1QvGwo.js';
import { S as P } from './Bqu0--pl.js';
const Y = { title: 'Analytics', description: 'Analytics notice for Opendrive' },
	{ title: at, description: st } = Y;
var E = $(
		'By default Opendrive sends a heartbeat to our analytics server once every 24 hours. Seeing how many active Opendrive instances are out there genuinely motivates our team to keep developing and maintaining the project. The instance count is also displayed on the <!>.',
		1
	),
	N = $('<!>: A random UUID (not linked to any personal information)', 1),
	V = $('<!>: Your Opendrive version', 1),
	q = $('<!>: When your instance was first/last seen', 1),
	z = $('<!> <!> <!>', 1),
	F = $(
		'We do not log or store IP addresses, user agents, or any other potentially identifiable information. The source code of the <!> is open source.',
		1
	),
	G = $(
		'Analytics can be disabled at any time by setting the environment variable <!> to <!>. When disabled, no data is sent to our servers.',
		1
	),
	J = $(
		'Aggregated instance counts are displayed on our homepage. The API is publicly accessible, the docs can be found in the <!>.',
		1
	),
	K = $('<!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function nt(T) {
	j(T, {
		children: (U, M) => {
			var b = K(),
				x = d(b);
			_(x, {
				children: (o, c) => {
					e();
					var t = E(),
						s = a(d(t));
					(m(s, {
						href: 'https://pocket-id.org',
						children: (l, h) => {
							e();
							var n = i('Opendrive website');
							r(l, n);
						},
						$$slots: { default: !0 }
					}),
						e(),
						r(o, t));
				},
				$$slots: { default: !0 }
			});
			var A = a(x, 2);
			g(A, {
				id: 'what-we-collect',
				children: (o, c) => {
					e();
					var t = i('What We Collect');
					r(o, t);
				},
				$$slots: { default: !0 }
			});
			var O = a(A, 2);
			_(O, {
				children: (o, c) => {
					e();
					var t = i('Only minimal, non-identifiable data is collected:');
					r(o, t);
				},
				$$slots: { default: !0 }
			});
			var I = a(O, 2);
			C(I, {
				children: (o, c) => {
					var t = z(),
						s = d(t);
					y(s, {
						children: (n, B) => {
							var v = N(),
								u = d(v);
							(P(u, {
								children: (p, D) => {
									e();
									var f = i('Instance ID');
									r(p, f);
								},
								$$slots: { default: !0 }
							}),
								e(),
								r(n, v));
						},
						$$slots: { default: !0 }
					});
					var l = a(s, 2);
					y(l, {
						children: (n, B) => {
							var v = V(),
								u = d(v);
							(P(u, {
								children: (p, D) => {
									e();
									var f = i('Version');
									r(p, f);
								},
								$$slots: { default: !0 }
							}),
								e(),
								r(n, v));
						},
						$$slots: { default: !0 }
					});
					var h = a(l, 2);
					(y(h, {
						children: (n, B) => {
							var v = q(),
								u = d(v);
							(P(u, {
								children: (p, D) => {
									e();
									var f = i('Heartbeat timestamps');
									r(p, f);
								},
								$$slots: { default: !0 }
							}),
								e(),
								r(n, v));
						},
						$$slots: { default: !0 }
					}),
						r(o, t));
				},
				$$slots: { default: !0 }
			});
			var S = a(I, 2);
			_(S, {
				children: (o, c) => {
					e();
					var t = F(),
						s = a(d(t));
					(m(s, {
						href: 'https://github.com/pocket-id/analytics',
						children: (l, h) => {
							e();
							var n = i('analytics server');
							r(l, n);
						},
						$$slots: { default: !0 }
					}),
						e(),
						r(o, t));
				},
				$$slots: { default: !0 }
			});
			var k = a(S, 2);
			g(k, {
				id: 'opting-out',
				children: (o, c) => {
					e();
					var t = i('Opting Out');
					r(o, t);
				},
				$$slots: { default: !0 }
			});
			var w = a(k, 2);
			_(w, {
				children: (o, c) => {
					e();
					var t = G(),
						s = a(d(t));
					L(s, () => '<code>ANALYTICS_DISABLED</code>');
					var l = a(s, 2);
					(L(l, () => '<code>true</code>'), e(), r(o, t));
				},
				$$slots: { default: !0 }
			});
			var W = a(w, 2);
			g(W, {
				id: 'public-statistics',
				children: (o, c) => {
					e();
					var t = i('Public Statistics');
					r(o, t);
				},
				$$slots: { default: !0 }
			});
			var H = a(W, 2);
			(_(H, {
				children: (o, c) => {
					e();
					var t = J(),
						s = a(d(t));
					(m(s, {
						href: 'https://github.com/pocket-id/analytics',
						children: (l, h) => {
							e();
							var n = i('analytics server repository');
							r(l, n);
						},
						$$slots: { default: !0 }
					}),
						e(),
						r(o, t));
				},
				$$slots: { default: !0 }
			}),
				r(U, b));
		}
	});
}
export { nt as default, Y as metadata };
