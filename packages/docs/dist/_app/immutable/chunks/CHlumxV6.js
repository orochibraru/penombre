import { f as l, a as $, n as r, b as e, s as t, g as c, j as y } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as Pe, P as k } from './CXunQUVT.js';
import { U as A } from './B2E1dnfA.js';
import { L as m } from './EJ1QvGwo.js';
import { H as W } from './CMbTFn8B.js';
import { A as D } from './Bva6-POL.js';
import { B as S } from './C8yZ7dHE.js';
import { S as O } from './Bqu0--pl.js';
import { H as fe } from './CTN7MPTR.js';
import { O as ye } from './eLU9aUh4.js';
const ke = {
		title: 'OIDC Client Authentication',
		description:
			'Learn how to authenticate OIDC clients in Opendrive using client secrets and federated credentials.'
	},
	{ title: At, description: Dt } = ke;
var Ie = l(
		'In the context of OAuth2 / OpenID Connect, "Clients" refers to applications that request access to protected resources. In Opendrive, they are configured in the <em>OIDC Clients</em> section in the <em>Settings</em> portal.',
		1
	),
	xe = l('<!> <!>', 1),
	be = l(
		`When using OAuth2 with flows such as the "authorization code flow", the most common one for confidential (non-public) clients, in the last step your application exchanges an authorization code for an access token by invoking Opendrive's <!> endpoint, and including its client ID and secret in the request.`,
		1
	),
	we = l(
		'Just like with all secrets, however, managing the client secret correctly can be hard. In fact, <!> includes "secret leakage" in the second position. In practice, managing secrets, especially shared ones, is hard, and even seasoned DevOps professionals can sometimes make mistakes.',
		1
	),
	Ce = l(
		'With Federated Client Credentials, OIDC clients can authenticate themselves (e.g. during the exchange of the authorization code for an access token when invoking the <!> endpoint) using JWT tokens signed by third-party Identity Providers (IdP).',
		1
	),
	Oe = l(
		`[!NOTE]
Support for Federated Client Credentials in Opendrive is based on <!>`,
		1
	),
	Ae = l('<!> <!> <!> <!>', 1),
	De = l(
		'You will need an external IdP that can authenticate your application by issuing JWT tokens, for example: <!>',
		1
	),
	Te = l(
		'Your application must support using JWTs for client authentication, as per <!>. You will need to ensure that your application can obtain a JWT from the external IdP in an appropriate way (see below for some examples), and that you use that token as client assertion during the OAuth2 token exchange.',
		1
	),
	Se = l('<!> <!>', 1),
	We = l(
		`[!TIP]
To use Federated Client Credentials during the OAuth2 token exchange, your application will need to invoke the <!> endpoint as per usual (including <!> and the other parameters). However, instead of including a <!>, you need to pass these two options:`,
		1
	),
	Ue = l('<!> (this is a constant value)', 1),
	je = l('<!> replacing <!> with the token issued by the external IdP', 1),
	Ke = l('<!> <!>', 1),
	Me = l('<!> <!>', 1),
	ze = l(
		'When editing a client in Opendrive (in the <em>OIDC Clients</em> section in the <em>Settings</em> page), you can configure Federated Client Credentials for the client.',
		1
	),
	Fe = l(
		`[!TIP]
Federated Client Credentials may be hidden under <em>Advanced Options</em> by default.`,
		1
	),
	Je = l(
		'<!> (required): Must map to the value of the <!> claim in the JWT tokens issued by the external IdP.',
		1
	),
	Re = l(
		'<!> (optional): Must map to the value of the <!> claim in the JWT tokens.<br/> If empty, this defaults to the public URL of Opendrive.',
		1
	),
	Ee = l(
		'<!> (optional): Must map to the value of the <!> claim in the JWT tokens.<br/> If empty, this defaults to the ID of the OIDC client in Opendrive (the UUID).',
		1
	),
	Le = l(
		'<!> (optional): URL where the JWKS (JSON Web Key Set) document can be retrieved.<br/> If empty, this defaults to <!>.',
		1
	),
	He = l('<!> <!>', 1),
	qe = l('<!> <!> <!> <!>', 1),
	Ve = l(
		"<!>: Value of the Kubernetes' API server's issuer (this is generally passed as the value of the <!> flag for <!>).",
		1
	),
	Be = l(
		'<!>: Value of the <!> option specified when creating the Service Account for the Pod. While you can set this to any value, a good option is to use the public URL of Opendrive.',
		1
	),
	Ne = l(
		'<!>: The value is in the format <!>. E.g. for a <em>ServiceAccount</em> resource named <!> in the namespace <!>, the value is <!>.',
		1
	),
	Ye = l(
		'<!> (optional): The URL where the JWKS of the Kubernetes API server can be retrieved from. The default value is <!>.',
		1
	),
	Ge = l('<!> <!> <!> <!>', 1),
	Qe = l('Kubernetes docs: <!>', 1),
	Xe = l('Projected Volumes for <!>', 1),
	Ze = l('Kubernetes docs: <!>', 1),
	et = l('<!> <!>', 1),
	tt = l('For workloads running on Azure Kubernetes Service, you may want to use <!>', 1),
	rt = l(
		'Assign an identity to your application, such as a System-assigned or User-assigned Identity. <!> are specific to each service being used. <!>',
		1
	),
	ot = l(
		'Configure the Entra ID app with Federated credentials for the Managed Identity created for your resource (<!>)',
		1
	),
	at = l('<!> <!>', 1),
	st = l('Create an application in Microsoft Entra ID (<!>) <!>', 1),
	nt = l('<!> <!>', 1),
	lt = l('<!>: <!> where <!> is the UUID of your Microsoft Entra ID tenant', 1),
	dt = l('<!>: The client ID of the Entra ID application created above', 1),
	it = l(
		'<!>: The object ID of the managed identity (note: this is the <em>object</em> (or <em>principal</em>) ID, not a client ID)',
		1
	),
	ct = l('<!>: Constant value <!>', 1),
	ut = l('<!> <!> <!> <!>', 1),
	$t = l('Inside your application, you can <!> from the Managed Identity by:', 1),
	vt = l(
		'Recommended: using one of the Azure SDKs to get a token from Managed Identity, with the requested <em>resource</em> as the client ID of the Entra ID application. SDKs work on all Azure services automatically.',
		1
	),
	ht = l(
		'Manually invoking the endpoint metadata service. The endpoint can be different depending on the Azure service; in the case of an Azure Virtual Machine, the URL is <!> (where <!> is the client ID of the Entra ID application); make sure to also set the HTTP header <!> in the request.',
		1
	),
	ft = l('<!> <!>', 1),
	pt = l(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function Tt(pe) {
	Pe(pe, {
		children: (_e, _t) => {
			var U = pt(),
				j = $(U);
			k(j, {
				children: (a, p) => {
					r();
					var o = Ie();
					(r(4), e(a, o));
				},
				$$slots: { default: !0 }
			});
			var K = t(j, 2);
			k(K, {
				children: (a, p) => {
					r();
					var o = c('Typically OIDC Clients have a set of credentials that include:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var M = t(K, 2);
			A(M, {
				children: (a, p) => {
					var o = xe(),
						v = $(o);
					m(v, {
						children: (h, I) => {
							r();
							var s = c(
								'Client ID: in Opendrive, this is a UUID that identifies the client (application)'
							);
							e(h, s);
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(m(P, {
						children: (h, I) => {
							r();
							var s = c(
								'Client Secret: a shared secret, which in Opendrive is a randomly-generated sequence of characters'
							);
							e(h, s);
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var z = t(M, 2);
			k(z, {
				children: (a, p) => {
					r();
					var o = be(),
						v = t($(o));
					(y(v, () => '<code>/token</code>'), r(), e(a, o));
				},
				$$slots: { default: !0 }
			});
			var F = t(z, 2);
			W(F, {
				id: 'shared-secrets-and-security',
				children: (a, p) => {
					r();
					var o = c('Shared secrets and security');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var J = t(F, 2);
			k(J, {
				children: (a, p) => {
					r();
					var o = c(
						`Client secrets are a kind of "shared secret", which means it is known to both the client (your application) and Opendrive. It's a very important secret that must be protected.`
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var R = t(J, 2);
			k(R, {
				children: (a, p) => {
					r();
					var o = we(),
						v = t($(o));
					(D(v, {
						href: 'https://owasp.org/www-project-non-human-identities-top-10/2025/top-10-2025/',
						children: (P, h) => {
							r();
							var I = c(`OWASP's 2025 list of "Top 10 Non-Human Identities Risks"`);
							e(P, I);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var E = t(R, 2);
			k(E, {
				children: (a, p) => {
					r();
					var o = c(
						'Thankfully, OAuth2 includes alternatives to shared secrets for authenticating clients (applications). This is supported in Opendrive starting with version 1.3.0, with Federated Client Credentials.'
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var L = t(E, 2);
			W(L, {
				id: 'using-federated-client-credentials',
				children: (a, p) => {
					r();
					var o = c('Using Federated Client Credentials');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var H = t(L, 2);
			k(H, {
				children: (a, p) => {
					r();
					var o = Ce(),
						v = t($(o));
					(y(v, () => '<code>/token</code>'), r(), e(a, o));
				},
				$$slots: { default: !0 }
			});
			var q = t(H, 2);
			S(q, {
				children: (a, p) => {
					k(a, {
						children: (o, v) => {
							r();
							var P = Oe(),
								h = t($(P));
							(D(h, {
								href: 'https://datatracker.ietf.org/doc/html/rfc7523',
								children: (I, s) => {
									r();
									var f = c('RFC 7523');
									e(I, f);
								},
								$$slots: { default: !0 }
							}),
								e(o, P));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var V = t(q, 2);
			k(V, {
				children: (a, p) => {
					r();
					var o = c('To use Federated Client Credentials:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var B = t(V, 2);
			A(B, {
				children: (a, p) => {
					var o = Se(),
						v = $(o);
					m(v, {
						children: (h, I) => {
							r();
							var s = De(),
								f = t($(s));
							(A(f, {
								children: (n, d) => {
									var u = Ae(),
										i = $(u);
									m(i, {
										children: (x, w) => {
											r();
											var C = c(
												'On apps running on Kubernetes, you can use service account tokens that are issued by the Kubernetes API server'
											);
											e(x, C);
										},
										$$slots: { default: !0 }
									});
									var _ = t(i, 2);
									m(_, {
										children: (x, w) => {
											r();
											var C = c(
												'On cloud providers like AWS, Microsoft Azure, GCP, etc, you can use tokens issued by the cloud platform itself (e.g. AWS IAM Roles, Microsoft Entra Workload ID / Managed Identity, etc)'
											);
											e(x, C);
										},
										$$slots: { default: !0 }
									});
									var g = t(_, 2);
									m(g, {
										children: (x, w) => {
											D(x, {
												href: 'https://spiffe.io/',
												children: (C, T) => {
													r();
													var he = c('SPIFFE/SPIRE');
													e(C, he);
												},
												$$slots: { default: !0 }
											});
										},
										$$slots: { default: !0 }
									});
									var b = t(g, 2);
									(m(b, {
										children: (x, w) => {
											r();
											var C = c('Any other OIDC-compliant IdP');
											e(x, C);
										},
										$$slots: { default: !0 }
									}),
										e(n, u));
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(m(P, {
						children: (h, I) => {
							r();
							var s = Te(),
								f = t($(s));
							(D(f, {
								href: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.2',
								children: (n, d) => {
									r();
									var u = c('RFC 7523 section 2.2');
									e(n, u);
								},
								$$slots: { default: !0 }
							}),
								r(),
								e(h, s));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var N = t(B, 2);
			S(N, {
				children: (a, p) => {
					var o = Me(),
						v = $(o);
					k(v, {
						children: (h, I) => {
							r();
							var s = We(),
								f = t($(s));
							y(f, () => '<code>/token</code>');
							var n = t(f, 2);
							y(n, () => '<code>grant_type=authorization_code</code>');
							var d = t(n, 2);
							(y(d, () => '<code>client_secret</code>'), r(), e(h, s));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(A(P, {
						children: (h, I) => {
							var s = Ke(),
								f = $(s);
							m(f, {
								children: (d, u) => {
									var i = Ue(),
										_ = $(i);
									(y(
										_,
										() =>
											'<code>client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer</code>'
									),
										r(),
										e(d, i));
								},
								$$slots: { default: !0 }
							});
							var n = t(f, 2);
							(m(n, {
								children: (d, u) => {
									var i = je(),
										_ = $(i);
									y(_, () => '<code>client_assertion=&lt;jwt-token></code>');
									var g = t(_, 2);
									(y(g, () => '<code>&lt;jwt-token></code>'), r(), e(d, i));
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var Y = t(N, 2);
			W(Y, {
				id: 'configuring-a-client-for-federated-client-credentials-in-opendrive',
				children: (a, p) => {
					r();
					var o = c('Configuring a client for Federated Client Credentials in Opendrive');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var G = t(Y, 2);
			k(G, {
				children: (a, p) => {
					r();
					var o = ze();
					(r(4), e(a, o));
				},
				$$slots: { default: !0 }
			});
			var Q = t(G, 2);
			S(Q, {
				children: (a, p) => {
					k(a, {
						children: (o, v) => {
							r();
							var P = Fe();
							(r(2), e(o, P));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var X = t(Q, 2);
			k(X, {
				children: (a, p) => {
					r();
					var o = c('Each identity allows specifying:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var Z = t(X, 2);
			A(Z, {
				children: (a, p) => {
					var o = qe(),
						v = $(o);
					m(v, {
						children: (s, f) => {
							k(s, {
								children: (n, d) => {
									var u = Je(),
										i = $(u);
									O(i, {
										children: (g, b) => {
											r();
											var x = c('Issuer');
											e(g, x);
										},
										$$slots: { default: !0 }
									});
									var _ = t(i, 2);
									(y(_, () => '<code>iss</code>'), r(), e(n, u));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					m(P, {
						children: (s, f) => {
							k(s, {
								children: (n, d) => {
									var u = Re(),
										i = $(u);
									O(i, {
										children: (g, b) => {
											r();
											var x = c('Audience');
											e(g, x);
										},
										$$slots: { default: !0 }
									});
									var _ = t(i, 2);
									(y(_, () => '<code>aud</code>'), r(3), e(n, u));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var h = t(P, 2);
					m(h, {
						children: (s, f) => {
							k(s, {
								children: (n, d) => {
									var u = Ee(),
										i = $(u);
									O(i, {
										children: (g, b) => {
											r();
											var x = c('Subject');
											e(g, x);
										},
										$$slots: { default: !0 }
									});
									var _ = t(i, 2);
									(y(_, () => '<code>sub</code>'), r(3), e(n, u));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var I = t(h, 2);
					(m(I, {
						children: (s, f) => {
							var n = He(),
								d = $(n);
							k(d, {
								children: (i, _) => {
									var g = Le(),
										b = $(g);
									O(b, {
										children: (w, C) => {
											r();
											var T = c('JWKS URL');
											e(w, T);
										},
										$$slots: { default: !0 }
									});
									var x = t(b, 4);
									(y(x, () => '<code>&lt;issuer>/.well-known/jwks.json</code>'),
										r(),
										e(i, g));
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							(S(u, {
								children: (i, _) => {
									k(i, {
										children: (g, b) => {
											r();
											var x = c(`[!NOTE]
While HTTP URLs are accepted, using HTTPS is strongly recommended for security.`);
											e(g, x);
										},
										$$slots: { default: !0 }
									});
								},
								$$slots: { default: !0 }
							}),
								e(s, n));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var ee = t(Z, 2);
			fe(ee, {
				id: 'kubernetes-service-account-tokens',
				children: (a, p) => {
					r();
					var o = c('Kubernetes Service Account Tokens');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var te = t(ee, 2);
			k(te, {
				children: (a, p) => {
					r();
					var o = c(
						'Using Kubernetes 1.21 or higher, you can use Projected Token Volumes to have the Kubernetes API server issue a token for the audience of your choice, and make it available to your app as projected volume.'
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var re = t(te, 2);
			k(re, {
				children: (a, p) => {
					r();
					var o = c('Configuration values for using Kubernetes are:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var oe = t(re, 2);
			A(oe, {
				children: (a, p) => {
					var o = Ge(),
						v = $(o);
					m(v, {
						children: (s, f) => {
							var n = Ve(),
								d = $(n);
							O(d, {
								children: (_, g) => {
									r();
									var b = c('Issuer');
									e(_, b);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							y(u, () => '<code>--service-account-issuer</code>');
							var i = t(u, 2);
							(y(i, () => '<code>kube-apiserver</code>'), r(), e(s, n));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					m(P, {
						children: (s, f) => {
							var n = Be(),
								d = $(n);
							O(d, {
								children: (i, _) => {
									r();
									var g = c('Audience');
									e(i, g);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							(y(u, () => '<code>audience</code>'), r(), e(s, n));
						},
						$$slots: { default: !0 }
					});
					var h = t(P, 2);
					m(h, {
						children: (s, f) => {
							var n = Ne(),
								d = $(n);
							O(d, {
								children: (b, x) => {
									r();
									var w = c('Subject');
									e(b, w);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							y(
								u,
								() =>
									'<code>system:serviceaccount:&lt;namespace>:&lt;service-account-name></code>'
							);
							var i = t(u, 4);
							y(i, () => '<code>my-sa</code>');
							var _ = t(i, 2);
							y(_, () => '<code>myappns</code>');
							var g = t(_, 2);
							(y(g, () => '<code>system:serviceaccount:myappns:my-sa</code>'),
								r(),
								e(s, n));
						},
						$$slots: { default: !0 }
					});
					var I = t(h, 2);
					(m(I, {
						children: (s, f) => {
							var n = Ye(),
								d = $(n);
							O(d, {
								children: (i, _) => {
									r();
									var g = c('JWKS URL');
									e(i, g);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							(y(u, () => '<code>&lt;issuer>/.well-known/jwks.json</code>'),
								r(),
								e(s, n));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var ae = t(oe, 2);
			k(ae, {
				children: (a, p) => {
					r();
					var o = c(
						'Inside your application, you can obtain a JWT token to use as client assertion by reading the file where the projected token volume is mounted.'
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var se = t(ae, 2);
			k(se, {
				children: (a, p) => {
					r();
					var o = c('Additional resources:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var ne = t(se, 2);
			A(ne, {
				children: (a, p) => {
					var o = et(),
						v = $(o);
					m(v, {
						children: (h, I) => {
							r();
							var s = Qe(),
								f = t($(s));
							(D(f, {
								href: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/',
								children: (n, d) => {
									r();
									var u = c('Configure Service Accounts for Pods');
									e(n, u);
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(m(P, {
						children: (h, I) => {
							r();
							var s = Ze(),
								f = t($(s));
							(D(f, {
								href: 'https://kubernetes.io/docs/concepts/storage/projected-volumes/#serviceaccounttoken',
								children: (n, d) => {
									r();
									var u = Xe(),
										i = t($(u));
									(y(i, () => '<code>serviceAccountToken</code>'), e(n, u));
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var le = t(ne, 2);
			fe(le, {
				id: 'microsoft-azure',
				children: (a, p) => {
					r();
					var o = c('Microsoft Azure');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var de = t(le, 2);
			k(de, {
				children: (a, p) => {
					r();
					var o = c(
						'On Microsoft Azure, you can use Microsoft Entra Workload ID (e.g. Managed Identity or Workload Identity) to federate with Opendrive.'
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var ie = t(de, 2);
			k(ie, {
				children: (a, p) => {
					r();
					var o = c('Set up steps for Azure:');
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var ce = t(ie, 2);
			ye(ce, {
				children: (a, p) => {
					var o = nt(),
						v = $(o);
					m(v, {
						children: (h, I) => {
							r();
							var s = rt(),
								f = t($(s));
							D(f, {
								href: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview',
								children: (d, u) => {
									r();
									var i = c('Instructions');
									e(d, i);
								},
								$$slots: { default: !0 }
							});
							var n = t(f, 2);
							(A(n, {
								children: (d, u) => {
									m(d, {
										children: (i, _) => {
											r();
											var g = tt(),
												b = t($(g));
											(D(b, {
												href: 'https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview',
												children: (x, w) => {
													r();
													var C = c('Workload Identity');
													e(x, C);
												},
												$$slots: { default: !0 }
											}),
												e(i, g));
										},
										$$slots: { default: !0 }
									});
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(m(P, {
						children: (h, I) => {
							r();
							var s = st(),
								f = t($(s));
							D(f, {
								href: 'https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app',
								children: (d, u) => {
									r();
									var i = c('docs');
									e(d, i);
								},
								$$slots: { default: !0 }
							});
							var n = t(f, 2);
							(A(n, {
								children: (d, u) => {
									var i = at(),
										_ = $(i);
									m(_, {
										children: (b, x) => {
											r();
											var w = c(
												'Take note of the client ID of this app, which will be a UUID'
											);
											e(b, w);
										},
										$$slots: { default: !0 }
									});
									var g = t(_, 2);
									(m(g, {
										children: (b, x) => {
											r();
											var w = ot(),
												C = t($(w));
											(D(C, {
												href: 'https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation',
												children: (T, he) => {
													r();
													var ge = c('docs');
													e(T, ge);
												},
												$$slots: { default: !0 }
											}),
												r(),
												e(b, w));
										},
										$$slots: { default: !0 }
									}),
										e(d, i));
								},
								$$slots: { default: !0 }
							}),
								e(h, s));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var ue = t(ce, 2);
			k(ue, {
				children: (a, p) => {
					r();
					var o = c(
						'Configuration values for Federated Client Credentials in Opendrive:'
					);
					e(a, o);
				},
				$$slots: { default: !0 }
			});
			var $e = t(ue, 2);
			A($e, {
				children: (a, p) => {
					var o = ut(),
						v = $(o);
					m(v, {
						children: (s, f) => {
							var n = lt(),
								d = $(n);
							O(d, {
								children: (_, g) => {
									r();
									var b = c('Issuer');
									e(_, b);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							y(u, () => '<code>https://sts.windows.net/&lt;tenant-id>/</code>');
							var i = t(u, 2);
							(y(i, () => '<code>&lt;tenant-id></code>'), r(), e(s, n));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					m(P, {
						children: (s, f) => {
							var n = dt(),
								d = $(n);
							(O(d, {
								children: (u, i) => {
									r();
									var _ = c('Audience');
									e(u, _);
								},
								$$slots: { default: !0 }
							}),
								r(),
								e(s, n));
						},
						$$slots: { default: !0 }
					});
					var h = t(P, 2);
					m(h, {
						children: (s, f) => {
							var n = it(),
								d = $(n);
							(O(d, {
								children: (u, i) => {
									r();
									var _ = c('Subject');
									e(u, _);
								},
								$$slots: { default: !0 }
							}),
								r(5),
								e(s, n));
						},
						$$slots: { default: !0 }
					});
					var I = t(h, 2);
					(m(I, {
						children: (s, f) => {
							var n = ct(),
								d = $(n);
							O(d, {
								children: (i, _) => {
									r();
									var g = c('JWKS URL');
									e(i, g);
								},
								$$slots: { default: !0 }
							});
							var u = t(d, 2);
							(y(
								u,
								() =>
									'<code>https://login.microsoftonline.com/common/discovery/keys</code>'
							),
								e(s, n));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var ve = t($e, 2);
			k(ve, {
				children: (a, p) => {
					r();
					var o = $t(),
						v = t($(o));
					(D(v, {
						href: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token',
						children: (P, h) => {
							r();
							var I = c('obtain a token');
							e(P, I);
						},
						$$slots: { default: !0 }
					}),
						r(),
						e(a, o));
				},
				$$slots: { default: !0 }
			});
			var me = t(ve, 2);
			(A(me, {
				children: (a, p) => {
					var o = ft(),
						v = $(o);
					m(v, {
						children: (h, I) => {
							r();
							var s = vt();
							(r(2), e(h, s));
						},
						$$slots: { default: !0 }
					});
					var P = t(v, 2);
					(m(P, {
						children: (h, I) => {
							r();
							var s = ht(),
								f = t($(s));
							y(
								f,
								() =>
									'<code>http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&amp;resource=&lt;client-id></code>'
							);
							var n = t(f, 2);
							y(n, () => '<code>&lt;client-id></code>');
							var d = t(n, 2);
							(y(d, () => '<code>Metadata:true</code>'), r(), e(h, s));
						},
						$$slots: { default: !0 }
					}),
						e(a, o));
				},
				$$slots: { default: !0 }
			}),
				e(_e, U));
		}
	});
}
export { Tt as default, ke as metadata };
