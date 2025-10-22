import {
	f as p,
	a as f,
	n as e,
	g as $,
	b as t,
	s as o,
	j as rt,
	d as B,
	r as G
} from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as et, P as ot } from './CXunQUVT.js';
import { H as J } from './CTN7MPTR.js';
import { U as st } from './B2E1dnfA.js';
import { L as w } from './EJ1QvGwo.js';
import { S as V } from './Bqu0--pl.js';
import { O as K } from './eLU9aUh4.js';
import { A as at } from './Bva6-POL.js';
import { T as Q, a as m, b as C, c as n } from './DpdLr4Qt.js';
const lt = {
		title: 'LDAP Integration',
		description: 'Connect Opendrive to your LDAP server for user synchronization'
	},
	{ title: Rt, description: Wt } = lt;
var $t = p('Users or groups synced from LDAP can <!> be edited from the Opendrive Web UI.', 1),
	dt = p('<!> <!>', 1),
	nt = p('Follow the installation guide <!>.', 1),
	ut = p(
		'Once you have signed in with the initial admin account, navigate to the Application Configuration section at <!>.',
		1
	),
	it = p('<!> <!> <!>', 1),
	vt = p('<!> <!> <!>', 1),
	_t = p('<!> <!> <!>', 1),
	ft = p('<!> <!> <!>', 1),
	pt = p('<!> <!> <!>', 1),
	ct = p('<!> <!> <!>', 1),
	ht = p('<!> <!> <!>', 1),
	Pt = p('<!> <!> <!>', 1),
	mt = p('<thead><!></thead> <tbody><!><!><!><!><!><!></tbody>', 1),
	xt = p('<!> <!> <!>', 1),
	gt = p('The LDAP attribute to uniquely identify the user, <!>', 1),
	At = p('<!> <!> <!>', 1),
	bt = p('<!> <!> <!>', 1),
	Dt = p('<!> <!> <!>', 1),
	Lt = p('<!> <!> <!>', 1),
	yt = p('<!> <!> <!>', 1),
	Tt = p('<!> <!> <!>', 1),
	Ut = p('The LDAP attribute to uniquely identify the groups, <!>', 1),
	St = p('<!> <!> <!>', 1),
	Nt = p('<!> <!> <!>', 1),
	Ot = p('<!> <!> <!>', 1),
	wt = p('<thead><!></thead> <tbody><!><!><!><!><!><!><!><!><!></tbody>', 1),
	Ct = p('<!> <!> <!> <!> <!> <!> <br/> <!> <!>', 1);
function zt(X) {
	et(X, {
		children: (Y, Bt) => {
			var j = Ct(),
				k = f(j);
			ot(k, {
				children: (x, N) => {
					e();
					var h = $(
						'Opendrive can sync users and groups from an LDAP Source (lldap, OpenLDAP, Active Directory, etc.).'
					);
					t(x, h);
				},
				$$slots: { default: !0 }
			});
			var E = o(k, 2);
			J(E, {
				id: 'ldap-sync',
				children: (x, N) => {
					e();
					var h = $('LDAP Sync');
					t(x, h);
				},
				$$slots: { default: !0 }
			});
			var H = o(E, 2);
			st(H, {
				children: (x, N) => {
					var h = dt(),
						A = f(h);
					w(A, {
						children: (L, b) => {
							e();
							var D = $(
								'The LDAP Service will sync on Opendrive startup and every hour once enabled from the Web UI.'
							);
							t(L, D);
						},
						$$slots: { default: !0 }
					});
					var T = o(A, 2);
					(w(T, {
						children: (L, b) => {
							e();
							var D = $t(),
								g = o(f(D));
							(V(g, {
								children: (y, S) => {
									e();
									var O = $('NOT');
									t(y, O);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(L, D));
						},
						$$slots: { default: !0 }
					}),
						t(x, h));
				},
				$$slots: { default: !0 }
			});
			var M = o(H, 2);
			J(M, {
				id: 'generic-ldap-setup',
				children: (x, N) => {
					e();
					var h = $('Generic LDAP Setup');
					t(x, h);
				},
				$$slots: { default: !0 }
			});
			var R = o(M, 2);
			K(R, {
				children: (x, N) => {
					var h = it(),
						A = f(h);
					w(A, {
						children: (b, D) => {
							e();
							var g = nt(),
								y = o(f(g));
							(at(y, {
								href: '/docs/setup/installation',
								children: (S, O) => {
									e();
									var P = $('here');
									t(S, P);
								},
								$$slots: { default: !0 }
							}),
								e(),
								t(b, g));
						},
						$$slots: { default: !0 }
					});
					var T = o(A, 2);
					w(T, {
						children: (b, D) => {
							e();
							var g = ut(),
								y = o(f(g));
							(rt(
								y,
								() =>
									'<code>https://pocket.id/settings/admin/application-configuration</code>'
							),
								e(),
								t(b, g));
						},
						$$slots: { default: !0 }
					});
					var L = o(T, 2);
					(w(L, {
						children: (b, D) => {
							e();
							var g = $('Client Configuration Setup');
							t(b, g);
						},
						$$slots: { default: !0 }
					}),
						t(x, h));
				},
				$$slots: { default: !0 }
			});
			var W = o(R, 2);
			Q(W, {
				children: (x, N) => {
					var h = mt(),
						A = f(h),
						T = B(A);
					(m(T, {
						children: (P, U) => {
							var c = vt(),
								i = f(c);
							C(i, {
								children: (r, d) => {
									e();
									var s = $('LDAP Variable');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							C(v, {
								children: (r, d) => {
									e();
									var s = $('Example Value');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(C(u, {
								children: (r, d) => {
									e();
									var s = $('Description');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					}),
						G(A));
					var L = o(A, 2),
						b = B(L);
					m(b, {
						children: (P, U) => {
							var c = _t(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('LDAP URL');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('ldaps://ldap.mydomain.com:636');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $('The URL with port to connect to LDAP');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					});
					var D = o(b);
					m(D, {
						children: (P, U) => {
							var c = ft(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('LDAP Bind DN');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('cn=admin,ou=users,dc=domain,dc=com');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $(
										'The full DN value for the user with search privileges in LDAP'
									);
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					});
					var g = o(D);
					m(g, {
						children: (P, U) => {
							var c = pt(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('LDAP Bind Password');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('securepassword');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $('The password for the Bind DN account');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					});
					var y = o(g);
					m(y, {
						children: (P, U) => {
							var c = ct(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('LDAP Search Base');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('dc=domain,dc=com');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $('The top-level path to search for users and groups');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					});
					var S = o(y);
					m(S, {
						children: (P, U) => {
							var c = ht(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('User Search Filter');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('(objectClass=person)');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $('The filter to use to search for users from LDAP');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					});
					var O = o(S);
					(m(O, {
						children: (P, U) => {
							var c = Pt(),
								i = f(c);
							n(i, {
								children: (r, d) => {
									e();
									var s = $('User Group Search Filter');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var v = o(i, 2);
							n(v, {
								children: (r, d) => {
									e();
									var s = $('(objectClass=groupOfNames)');
									t(r, s);
								},
								$$slots: { default: !0 }
							});
							var u = o(v, 2);
							(n(u, {
								children: (r, d) => {
									e();
									var s = $('The filter to use to search for groups from LDAP');
									t(r, s);
								},
								$$slots: { default: !0 }
							}),
								t(P, c));
						},
						$$slots: { default: !0 }
					}),
						G(L),
						t(x, h));
				},
				$$slots: { default: !0 }
			});
			var z = o(W, 4);
			K(z, {
				start: '4',
				children: (x, N) => {
					w(x, {
						children: (h, A) => {
							e();
							var T = $('LDAP Attribute Configuration Setup');
							t(h, T);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Z = o(z, 2);
			(Q(Z, {
				children: (x, N) => {
					var h = wt(),
						A = f(h),
						T = B(A);
					(m(T, {
						children: (i, v) => {
							var u = xt(),
								r = f(u);
							C(r, {
								children: (l, _) => {
									e();
									var a = $('LDAP Variable');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							C(d, {
								children: (l, _) => {
									e();
									var a = $('Example Value');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(C(s, {
								children: (l, _) => {
									e();
									var a = $('Description');
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					}),
						G(A));
					var L = o(A, 2),
						b = B(L);
					m(b, {
						children: (i, v) => {
							var u = At(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('User Unique Identifier Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('uuid');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = gt(),
										q = o(f(a));
									(V(q, {
										children: (I, tt) => {
											e();
											var F = $('this should never change');
											t(I, F);
										},
										$$slots: { default: !0 }
									}),
										t(l, a));
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var D = o(b);
					m(D, {
						children: (i, v) => {
							var u = bt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('Username Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('uid');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $('The LDAP attribute to use as the username of users');
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var g = o(D);
					m(g, {
						children: (i, v) => {
							var u = Dt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('User Mail Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('mail');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $('The LDAP attribute to use for the email of users');
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var y = o(g);
					m(y, {
						children: (i, v) => {
							var u = Lt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('User First Name Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('givenName');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $(
										'The LDAP attribute to use for the first name of users'
									);
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var S = o(y);
					m(S, {
						children: (i, v) => {
							var u = yt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('User Last Name Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('sn');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $(
										'The LDAP attribute to use for the last name of users'
									);
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var O = o(S);
					m(O, {
						children: (i, v) => {
							var u = Tt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('Group Members Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('member');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $(
										'The LDAP attribute to use for querying members of a group.'
									);
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var P = o(O);
					m(P, {
						children: (i, v) => {
							var u = St(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('Group Unique Identifier Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('uuid');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = Ut(),
										q = o(f(a));
									(V(q, {
										children: (I, tt) => {
											e();
											var F = $('this should never change');
											t(I, F);
										},
										$$slots: { default: !0 }
									}),
										t(l, a));
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var U = o(P);
					m(U, {
						children: (i, v) => {
							var u = Nt(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('Group Name Attribute');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('uid');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $(
										'The LDAP attribute to use as the name of synced groups'
									);
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					});
					var c = o(U);
					(m(c, {
						children: (i, v) => {
							var u = Ot(),
								r = f(u);
							n(r, {
								children: (l, _) => {
									e();
									var a = $('Admin Group Name');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var d = o(r, 2);
							n(d, {
								children: (l, _) => {
									e();
									var a = $('_pocket_id_admins');
									t(l, a);
								},
								$$slots: { default: !0 }
							});
							var s = o(d, 2);
							(n(s, {
								children: (l, _) => {
									e();
									var a = $(
										'The group name to use for admin permissions for LDAP users'
									);
									t(l, a);
								},
								$$slots: { default: !0 }
							}),
								t(i, u));
						},
						$$slots: { default: !0 }
					}),
						G(L),
						t(x, h));
				},
				$$slots: { default: !0 }
			}),
				t(Y, j));
		}
	});
}
export { zt as default, lt as metadata };
