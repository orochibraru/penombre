import { f as c, a as v, n as e, g as l, b as t, s as r, j as F } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as W, P as y } from './CXunQUVT.js';
import { O as b } from './eLU9aUh4.js';
import { L as k } from './EJ1QvGwo.js';
import { A as J } from './Bva6-POL.js';
import { H as X } from './CMbTFn8B.js';
import { B as S } from './C8yZ7dHE.js';
import { H as T } from './CTN7MPTR.js';
import { S as h } from './Bqu0--pl.js';
const Z = {
		title: 'User Management',
		description: 'Learn how to manage users and set up passkeys in Opendrive'
	},
	{ title: He, description: Be } = Z;
var ee = c('Sync users from an <!> source.', 1),
	te = c('<!> <!>', 1),
	re = c('<!> <!>', 1),
	oe = c('Navigate to the <!> page in the Opendrive admin dashboard.', 1),
	se = c('Click the <!> on the right side of the user row.', 1),
	ae = c('Click <!>.', 1),
	le = c('Select an <!> for the link.', 1),
	ne = c('Click <!> and send it to the user to allow them to set up their new passkey.', 1),
	de = c('<!> <!> <!> <!> <!> <!>', 1),
	$e = c('Navigate to the <!> section in the Opendrive admin dashboard.', 1),
	ie = c('Expand the <!> section and enable the <!> option.', 1),
	ue = c('Instruct the user to navigate to Opendrive, e.g., <!>.', 1),
	ve = c('Have the user click on the <!> link at the bottom of the page.', 1),
	ce = c(
		'Have the user enter their email associated with their Opendrive account and click <!>.',
		1
	),
	_e = c('The user will receive an email with a <!> link to set up their passkey.', 1),
	pe = c('<!> <!> <!> <!> <!> <!>', 1),
	he = c(
		'Since Opendrive <!>, an admin can create a Signup Token Link with a customizable expiry date and use limit. Users can use this link to create their account and initial passkey.',
		1
	),
	fe = c('Goto <!> > <!>', 1),
	me = c('Change the dropdown value to <!>', 1),
	Pe = c('Goto <!> > <!> dropdown > <!>', 1),
	ge = c('<!> <!> <!>', 1),
	xe = c('Goto <!> > <!> dropdown > <!>', 1),
	ke = c('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function Ge(K) {
	W(K, {
		children: (Q, we) => {
			var A = ke(),
				C = v(A);
			y(C, {
				children: (n, w) => {
					e();
					var s = l('Creating users in Opendrive can be handled in two ways:');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var U = r(C, 2);
			b(U, {
				children: (n, w) => {
					var s = te(),
						m = v(s);
					k(m, {
						children: (p, i) => {
							e();
							var P = l('Manually create users via the admin interface.');
							t(p, P);
						},
						$$slots: { default: !0 }
					});
					var _ = r(m, 2);
					(k(_, {
						children: (p, i) => {
							e();
							var P = ee(),
								f = r(v(P));
							(J(f, {
								href: '/docs/configuration/ldap',
								children: (a, u) => {
									e();
									var o = l('LDAP');
									t(a, o);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(p, P));
						},
						$$slots: { default: !0 }
					}),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var L = r(U, 2);
			y(L, {
				children: (n, w) => {
					e();
					var s = l(
						'Once users have been created using one of the methods above, follow the steps below to help configure passkeys for them.'
					);
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var E = r(L, 2);
			X(E, {
				id: 'setting-up-user-passkeys',
				children: (n, w) => {
					e();
					var s = l('Setting Up User Passkeys');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var H = r(E, 2);
			S(H, {
				children: (n, w) => {
					var s = re(),
						m = v(s);
					y(m, {
						children: (p, i) => {
							e();
							var P = l(`[!TIP]
As the admin, you cannot add passkeys for users; end users must configure them on their own.`);
							t(p, P);
						},
						$$slots: { default: !0 }
					});
					var _ = r(m, 2);
					(y(_, {
						children: (p, i) => {
							e();
							var P = l(
								'Passkeys can be stored in services like Bitwarden, LastPass, iCloud, or even locally on certain devices using platform authenticators.'
							);
							t(p, P);
						},
						$$slots: { default: !0 }
					}),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var B = r(H, 2);
			T(B, {
				id: 'login-code',
				children: (n, w) => {
					e();
					var s = l('Login Code');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var G = r(B, 2);
			b(G, {
				children: (n, w) => {
					var s = de(),
						m = v(s);
					k(m, {
						children: (a, u) => {
							e();
							var o = oe(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Users');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var _ = r(m, 2);
					k(_, {
						children: (a, u) => {
							e();
							var o = l('Locate the user you want to set up a passkey for.');
							t(a, o);
						},
						$$slots: { default: !0 }
					});
					var p = r(_, 2);
					k(p, {
						children: (a, u) => {
							e();
							var o = se(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('three dots');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var i = r(p, 2);
					k(i, {
						children: (a, u) => {
							e();
							var o = ae(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Login Code');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var P = r(i, 2);
					k(P, {
						children: (a, u) => {
							e();
							var o = le(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Expiration Time');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var f = r(P, 2);
					(k(f, {
						children: (a, u) => {
							e();
							var o = ne(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Generate Link');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					}),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var M = r(G, 2);
			T(M, {
				id: 'one-time-access-email',
				children: (n, w) => {
					e();
					var s = l('One-Time Access Email');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var q = r(M, 2);
			S(q, {
				children: (n, w) => {
					y(n, {
						children: (s, m) => {
							h(s, {
								children: (_, p) => {
									e();
									var i = l(
										'This method requires a valid SMTP server set up in Opendrive.'
									);
									t(_, i);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var D = r(q, 2);
			S(D, {
				children: (n, w) => {
					y(n, {
						children: (s, m) => {
							h(s, {
								children: (_, p) => {
									e();
									var i = l(
										"Allowing users to sign in with a link sent to their email significantly reduces security, as anyone with access to the user's email can gain entry."
									);
									t(_, i);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var I = r(D, 2);
			b(I, {
				children: (n, w) => {
					var s = pe(),
						m = v(s);
					k(m, {
						children: (a, u) => {
							e();
							var o = $e(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Application Configuration');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var _ = r(m, 2);
					k(_, {
						children: (a, u) => {
							e();
							var o = ie(),
								d = r(v(o));
							h(d, {
								children: (x, g) => {
									e();
									var O = l('Email');
									t(x, O);
								},
								$$slots: { default: !0 }
							});
							var $ = r(d, 2);
							(h($, {
								children: (x, g) => {
									e();
									var O = l('Email One-Time Access');
									t(x, O);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var p = r(_, 2);
					k(p, {
						children: (a, u) => {
							e();
							var o = ue(),
								d = r(v(o));
							(F(d, () => '<code>https://id.example.com</code>'), e(), t(a, o));
						},
						$$slots: { default: !0 }
					});
					var i = r(p, 2);
					k(i, {
						children: (a, u) => {
							e();
							var o = ve(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l("Don't have access to your passkey?");
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var P = r(i, 2);
					k(P, {
						children: (a, u) => {
							e();
							var o = ce(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('Submit');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					});
					var f = r(P, 2);
					(k(f, {
						children: (a, u) => {
							e();
							var o = _e(),
								d = r(v(o));
							(h(d, {
								children: ($, x) => {
									e();
									var g = l('One-Time Access');
									t($, g);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(a, o));
						},
						$$slots: { default: !0 }
					}),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var N = r(I, 2);
			T(N, {
				id: 'signup-tokens',
				children: (n, w) => {
					e();
					var s = l('Signup Tokens');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var j = r(N, 2);
			y(j, {
				children: (n, w) => {
					e();
					var s = he(),
						m = r(v(s));
					(J(m, {
						href: 'https://github.com/pocket-id/pocket-id/pull/672',
						children: (_, p) => {
							e();
							var i = l('v1.5.0+');
							t(_, i);
						},
						$$slots: { default: !0 }
					}),
						e(),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var z = r(j, 2);
			y(z, {
				children: (n, w) => {
					e();
					var s = l('To enable this functionality:');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var V = r(z, 2);
			b(V, {
				children: (n, w) => {
					var s = ge(),
						m = v(s);
					k(m, {
						children: (i, P) => {
							e();
							var f = fe(),
								a = r(v(f));
							h(a, {
								children: (o, d) => {
									e();
									var $ = l('Application Configuration');
									t(o, $);
								},
								$$slots: { default: !0 }
							});
							var u = r(a, 2);
							(h(u, {
								children: (o, d) => {
									e();
									var $ = l('Enable User Signups');
									t(o, $);
								},
								$$slots: { default: !0 }
							}),
								t(i, f));
						},
						$$slots: { default: !0 }
					});
					var _ = r(m, 2);
					k(_, {
						children: (i, P) => {
							e();
							var f = me(),
								a = r(v(f));
							(F(a, () => '<code>Signup with token</code>'), t(i, f));
						},
						$$slots: { default: !0 }
					});
					var p = r(_, 2);
					(k(p, {
						children: (i, P) => {
							e();
							var f = Pe(),
								a = r(v(f));
							h(a, {
								children: (d, $) => {
									e();
									var x = l('Users');
									t(d, x);
								},
								$$slots: { default: !0 }
							});
							var u = r(a, 2);
							h(u, {
								children: (d, $) => {
									e();
									var x = l('Add User');
									t(d, x);
								},
								$$slots: { default: !0 }
							});
							var o = r(u, 2);
							(h(o, {
								children: (d, $) => {
									e();
									var x = l('Create Signup Token');
									t(d, x);
								},
								$$slots: { default: !0 }
							}),
								t(i, f));
						},
						$$slots: { default: !0 }
					}),
						t(n, s));
				},
				$$slots: { default: !0 }
			});
			var Y = r(V, 2);
			y(Y, {
				children: (n, w) => {
					e();
					var s = l('You can also view existing tokens and revoke them:');
					t(n, s);
				},
				$$slots: { default: !0 }
			});
			var R = r(Y, 2);
			(b(R, {
				children: (n, w) => {
					k(n, {
						children: (s, m) => {
							e();
							var _ = xe(),
								p = r(v(_));
							h(p, {
								children: (f, a) => {
									e();
									var u = l('Users');
									t(f, u);
								},
								$$slots: { default: !0 }
							});
							var i = r(p, 2);
							h(i, {
								children: (f, a) => {
									e();
									var u = l('Add User');
									t(f, u);
								},
								$$slots: { default: !0 }
							});
							var P = r(i, 2);
							(h(P, {
								children: (f, a) => {
									e();
									var u = l('View Active Signup Tokens');
									t(f, u);
								},
								$$slots: { default: !0 }
							}),
								t(s, _));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			}),
				t(Q, A));
		}
	});
}
export { Ge as default, Z as metadata };
