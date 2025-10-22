import { f as $, a as c, n as o, g as n, b as a, s as r, j as f, h as g } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as Pe, P as u } from './CXunQUVT.js';
import { U as we } from './B2E1dnfA.js';
import { L as k } from './EJ1QvGwo.js';
import { A as p } from './Bva6-POL.js';
import { H as b } from './CMbTFn8B.js';
import { H as x } from './CTN7MPTR.js';
import { P } from './DZj8j_ml.js';
import { H as w } from './bcMIrzCO.js';
const ke = { title: 'Proxy Services', description: 'Reverse Proxy Setup Guide for Opendrive' },
	{ title: et, description: tt } = ke;
var be = $('<!> <!> <!> <!>', 1),
	Oe = $(
		'<!> is a lightweight authentication middleware designed specifically for homelabs. Currently it integrates with Traefik, Caddy and Nginx Proxy Manager.',
		1
	),
	Ce = $(
		'Refer to the official <!> for detailed instructions on how to set up Tinyauth with Opendrive.',
		1
	),
	Ae = $('With <!> you can easily protect your services with Opendrive.', 1),
	Ie = $(
		'Create a new OIDC client in Opendrive by navigating to <!>. Now enter <!> as the callback URL. After adding the client, you will obtain the client ID and client secret, which you will need in the next step.',
		1
	),
	Te = $('For additional configuration options, refer to the official <!>.', 1),
	De = $(
		'<!> can be used as either as a standalone reverse proxy much like any of the other reverse proxies, or it can be used as an authentication only middleware.',
		1
	),
	Se = $(
		'To configure OAuth2 Proxy with Opendrive, you have to add the following service to the service that should be proxied. E.g., if <!> should be proxied, you can add the following service to the <!> of Uptime Kuma:',
		1
	),
	He = $(
		'Create a new OIDC client in Opendrive by navigating to <!>. Now enter <!> as the callback URL. After adding the client, you will obtain the client ID and client secret, which you will need in the next step.',
		1
	),
	Re = $(
		'Create a configuration file named <!> in the same directory as your <!> file of the service that should be proxied (e.g. Uptime Kuma). This file will contain the necessary configurations for OAuth2 Proxy to work with Opendrive.',
		1
	),
	Ue = $('Here is the recommend <!> configuration:', 1),
	Le = $('For additional configuration options, refer to the official <!>.', 1),
	Ee = $('You can now access the service through OAuth2 Proxy by visiting <!>.', 1),
	Ke = $('You can visit the official <!> for more information.', 1),
	je = $(
		'<!> does not have built-in support for OIDC, but there are many <!> available that add support.',
		1
	),
	ze = $(
		'<!> works with Opendrive. See the <!> for Opendrive specific instructions, and <!> for more details on how to apply the configuration to a specific endpoint.',
		1
	),
	Fe = $(
		'Traefik Enterprise has an <!> out of the box if you happen to be using that. It is similar to configure.',
		1
	),
	Ne = $(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function ot(ye) {
	Pe(ye, {
		children: (ge, We) => {
			var C = Ne(),
				A = c(C);
			u(A, {
				children: (t, i) => {
					o();
					var e = n(
						"The goal of Opendrive is to function exclusively as an OIDC provider. As such, we don't have a built-in proxy provider. However, most proxies provide some sort of mechanism to support OIDC authentication provider."
					);
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var I = r(A, 2);
			u(I, {
				children: (t, i) => {
					o();
					var e = n(
						"Almost every reverse proxy supports protecting your services with OIDC. For ones not documented here, you should be able to find instructions in the proxy's documentation."
					);
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var T = r(I, 2);
			we(T, {
				children: (t, i) => {
					var e = be(),
						s = c(e);
					k(s, {
						children: (v, _) => {
							p(v, {
								href: '#tinyauth',
								children: (m, O) => {
									o();
									var y = n('Tinyauth');
									a(m, y);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var d = r(s, 2);
					k(d, {
						children: (v, _) => {
							p(v, {
								href: '#caddy',
								children: (m, O) => {
									o();
									var y = n('Caddy');
									a(m, y);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var h = r(d, 2);
					k(h, {
						children: (v, _) => {
							p(v, {
								href: '#oauth2-proxy',
								children: (m, O) => {
									o();
									var y = n('OAuth2 Proxy');
									a(m, y);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var l = r(h, 2);
					(k(l, {
						children: (v, _) => {
							p(v, {
								href: '#traefik',
								children: (m, O) => {
									o();
									var y = n('Traefik');
									a(m, y);
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					}),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var D = r(T, 2);
			u(D, {
				children: (t, i) => {
					o();
					var e = n(
						'We would really appreciate your contributions to this documentation, whether by adding instructions or linking to existing resources for configuring your reverse proxy with Opendrive.'
					);
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var S = r(D, 2);
			b(S, {
				id: 'tinyauth',
				children: (t, i) => {
					o();
					var e = n('Tinyauth');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var H = r(S, 2);
			u(H, {
				children: (t, i) => {
					var e = Oe(),
						s = c(e);
					(p(s, {
						href: 'https://tinyauth.app/',
						children: (d, h) => {
							o();
							var l = n('Tinyauth');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var R = r(H, 2);
			u(R, {
				children: (t, i) => {
					o();
					var e = Ce(),
						s = r(c(e));
					(p(s, {
						href: 'https://tinyauth.app/docs/guides/pocket-id.html',
						children: (d, h) => {
							o();
							var l = n('Tinyauth Opendrive documentation');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var U = r(R, 2);
			b(U, {
				id: 'caddy',
				children: (t, i) => {
					o();
					var e = n('Caddy');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var L = r(U, 2);
			u(L, {
				children: (t, i) => {
					o();
					var e = Ae(),
						s = r(c(e));
					(p(s, {
						href: 'https://github.com/greenpau/caddy-security',
						children: (d, h) => {
							o();
							var l = n('caddy-security');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var E = r(L, 2);
			x(E, {
				id: '1-create-a-new-oidc-client-in-opendrive',
				children: (t, i) => {
					o();
					var e = n('1. Create a new OIDC client in Opendrive.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var K = r(E, 2);
			u(K, {
				children: (t, i) => {
					o();
					var e = Ie(),
						s = r(c(e));
					f(s, () => '<code>https://&lt;your-domain>/settings/admin/oidc-clients</code>');
					var d = r(s, 2);
					(f(
						d,
						() =>
							'<code>https://&lt;domain-of-proxied-service>/caddy-security/oauth2/generic/authorization-code-callback</code>'
					),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var j = r(K, 2);
			x(j, {
				id: '2-install-caddy-security',
				children: (t, i) => {
					o();
					var e = n('2. Install caddy-security');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var z = r(j, 2);
			u(z, {
				children: (t, i) => {
					o();
					var e = n('Run the following command to install caddy-security:');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var F = r(z, 2);
			P(F, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-bash">caddy add-package github.com/greenpau/caddy-security
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var N = r(F, 2);
			x(N, {
				id: '3-create-your-caddyfile',
				children: (t, i) => {
					o();
					var e = n('3. Create your Caddyfile');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var W = r(N, 2);
			P(W, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-bash">&#123;
  	# Port to listen on
	http_port 443

  	# Configure caddy-security.
	order authenticate before respond
	security &#123;
		oauth identity provider generic &#123;
			delay_start 3
			realm generic
			driver generic
			client_id client-id-from-pocket-id # Replace with your own client ID
			client_secret client-secret-from-pocket-id # Replace with your own client secret
			scopes openid email profile
			base_auth_url http://&lt;domain-where-pocket-id-runs> #Replace
			metadata_url http://&lt;domain-where-pocket-id-runs>/.well-known/openid-configuration #Replace
		&#125;

		authentication portal myportal &#123;
			crypto default token lifetime 3600 # Seconds until you have to re-authenticate
			enable identity provider generic
			cookie insecure off # Set to "on" if you're not using HTTPS
			# cookie domain service.example.com - If using multiple clients/portals you have to set the cookie domain for each one so they do not conflict when trying to refresh the session.

			transform user &#123;
				match realm generic
				action add role user
			&#125;
		&#125;

		authorization policy mypolicy &#123;
			set auth url /caddy-security/oauth2/generic
			allow roles user
			inject headers with claims
		&#125;
	&#125;
&#125;

https://&lt;domain-of-your-service> &#123;
	@auth &#123;
		path /caddy-security/*
    &#125;

	route @auth &#123;
		authenticate with myportal
	&#125;

	route /* &#123;
		authorize with mypolicy
		reverse_proxy http://&lt;service-to-be-proxied>:&lt;port> # Replace with your own service
	&#125;
&#125;
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var Y = r(W, 2);
			u(Y, {
				children: (t, i) => {
					o();
					var e = Te(),
						s = r(c(e));
					(p(s, {
						href: 'https://docs.authcrunch.com/docs/intro',
						children: (d, h) => {
							o();
							var l = n('caddy-security documentation');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var B = r(Y, 2);
			x(B, {
				id: '4-start-caddy',
				children: (t, i) => {
					o();
					var e = n('4. Start Caddy');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var G = r(B, 2);
			P(G, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-bash">caddy run --config Caddyfile
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var M = r(G, 2);
			w(M, {
				id: '5-access-the-service',
				children: (t, i) => {
					o();
					var e = n('5. Access the service');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var q = r(M, 2);
			u(q, {
				children: (t, i) => {
					o();
					var e = n('Your service should now be protected by Opendrive.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var J = r(q, 2);
			b(J, {
				id: 'oauth2-proxy',
				children: (t, i) => {
					o();
					var e = n('OAuth2 Proxy');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var Q = r(J, 2);
			u(Q, {
				children: (t, i) => {
					var e = De(),
						s = c(e);
					(p(s, {
						href: 'https://oauth2-proxy.github.io/oauth2-proxy/',
						children: (d, h) => {
							o();
							var l = n('OAuth2 Proxy');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var V = r(Q, 2);
			x(V, {
				id: 'docker-installation',
				children: (t, i) => {
					o();
					var e = n('Docker Installation');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var X = r(V, 2);
			w(X, {
				id: '1-add-oauth2-proxy-to-the-service-that-should-be-proxied',
				children: (t, i) => {
					o();
					var e = n('1. Add OAuth2 proxy to the service that should be proxied.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var Z = r(X, 2);
			u(Z, {
				children: (t, i) => {
					o();
					var e = Se(),
						s = r(c(e));
					p(s, {
						href: 'https://github.com/louislam/uptime-kuma',
						children: (h, l) => {
							o();
							var v = n('Uptime Kuma');
							a(h, v);
						},
						$$slots: { default: !0 }
					});
					var d = r(s, 2);
					(f(d, () => '<code>docker-compose.yml</code>'), o(), a(t, e));
				},
				$$slots: { default: !0 }
			});
			var ee = r(Z, 2);
			P(ee, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-yaml"># Example with Uptime Kuma
# uptime-kuma:
#  image: louislam/uptime-kuma
oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:v7.6.0
    command: --config /oauth2-proxy.cfg
    volumes:
        - './oauth2-proxy.cfg:/oauth2-proxy.cfg'
    ports:
        - 4180:4180
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var te = r(ee, 2);
			w(te, {
				id: '2-create-a-new-oidc-client-in-opendrive',
				children: (t, i) => {
					o();
					var e = n('2. Create a new OIDC client in Opendrive.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var oe = r(te, 2);
			u(oe, {
				children: (t, i) => {
					o();
					var e = He(),
						s = r(c(e));
					f(s, () => '<code>https://&lt;your-domain>/settings/admin/oidc-clients</code>');
					var d = r(s, 2);
					(f(
						d,
						() => '<code>https://&lt;domain-of-proxied-service>/oauth2/callback</code>'
					),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var re = r(oe, 2);
			w(re, {
				id: '3-create-a-configuration-file-for-oauth2-proxy',
				children: (t, i) => {
					o();
					var e = n('3. Create a configuration file for OAuth2 Proxy.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var ae = r(re, 2);
			u(ae, {
				children: (t, i) => {
					o();
					var e = Re(),
						s = r(c(e));
					f(s, () => '<code>oauth2-proxy.cfg</code>');
					var d = r(s, 2);
					(f(d, () => '<code>docker-compose.yml</code>'), o(), a(t, e));
				},
				$$slots: { default: !0 }
			});
			var se = r(ae, 2);
			u(se, {
				children: (t, i) => {
					o();
					var e = Ue(),
						s = r(c(e));
					(f(s, () => '<code>oauth2-proxy.cfg</code>'), o(), a(t, e));
				},
				$$slots: { default: !0 }
			});
			var ie = r(se, 2);
			P(ie, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-cfg"># Replace with your own credentials
client_id="client-id-from-pocket-id"
client_secret="client-secret-from-pocket-id"
oidc_issuer_url="https://&lt;your-pocket-id-domain>"

# Replace with a secure random string
cookie_secret="random-string"

# Upstream servers (e.g http://uptime-kuma:3001)
upstreams="http://&lt;service-to-be-proxied>:&lt;port>"

# Additional Configuration
provider="oidc"
scope = "openid email profile groups"

# If you are using a reverse proxy in front of OAuth2 Proxy
reverse_proxy = true

# Email domains allowed for authentication
email_domains = ["*"]

# If you are using HTTPS
cookie_secure="true"

# With HTTPS use "__Host-" or "__Secure-" prefix, otherwise leave blank
cookie_name="__Host-oauth2-proxy"

# Listen on all interfaces
http_address="0.0.0.0:4180"
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var ne = r(ie, 2);
			u(ne, {
				children: (t, i) => {
					o();
					var e = Le(),
						s = r(c(e));
					(p(s, {
						href: 'https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview',
						children: (d, h) => {
							o();
							var l = n('OAuth2 Proxy documentation');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var de = r(ne, 2);
			w(de, {
				id: '4-start-the-services',
				children: (t, i) => {
					o();
					var e = n('4. Start the services.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var le = r(de, 2);
			u(le, {
				children: (t, i) => {
					o();
					var e = n(
						'After creating the configuration file, you can start the services using Docker Compose:'
					);
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var ce = r(le, 2);
			P(ce, {
				children: (t, i) => {
					var e = g(),
						s = c(e);
					(f(
						s,
						() => `<code class="language-bash">docker compose up -d
</code>`
					),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var ue = r(ce, 2);
			w(ue, {
				id: '5-access-the-service-1',
				children: (t, i) => {
					o();
					var e = n('5. Access the service.');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var he = r(ue, 2);
			u(he, {
				children: (t, i) => {
					o();
					var e = Ee(),
						s = r(c(e));
					(f(s, () => '<code>http://localhost:4180</code>'), o(), a(t, e));
				},
				$$slots: { default: !0 }
			});
			var pe = r(he, 2);
			x(pe, {
				id: 'standalone-installation',
				children: (t, i) => {
					o();
					var e = n('Standalone Installation');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var $e = r(pe, 2);
			u($e, {
				children: (t, i) => {
					o();
					var e = n(
						'Setting up OAuth2 Proxy with Opendrive without Docker is similar to the Docker setup. As the setup depends on your environment, you have to adjust the steps accordingly but is should be similar to the Docker setup.'
					);
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var ve = r($e, 2);
			u(ve, {
				children: (t, i) => {
					o();
					var e = Ke(),
						s = r(c(e));
					(p(s, {
						href: 'https://oauth2-proxy.github.io/oauth2-proxy/installation',
						children: (d, h) => {
							o();
							var l = n('OAuth2 Proxy documentation');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var fe = r(ve, 2);
			b(fe, {
				id: 'traefik',
				children: (t, i) => {
					o();
					var e = n('Traefik');
					a(t, e);
				},
				$$slots: { default: !0 }
			});
			var _e = r(fe, 2);
			u(_e, {
				children: (t, i) => {
					var e = je(),
						s = c(e);
					p(s, {
						href: 'https://traefik.io/traefik/',
						children: (h, l) => {
							o();
							var v = n('Traefik');
							a(h, v);
						},
						$$slots: { default: !0 }
					});
					var d = r(s, 2);
					(p(d, {
						href: 'https://plugins.traefik.io/plugins',
						children: (h, l) => {
							o();
							var v = n('plugins');
							a(h, v);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var me = r(_e, 2);
			u(me, {
				children: (t, i) => {
					var e = ze(),
						s = c(e);
					p(s, {
						href: 'https://plugins.traefik.io/plugins/66b63d12d29fd1c421b503f5/oidc-authentication',
						children: (l, v) => {
							o();
							var _ = n('Traefik OpenID Connect Middleware');
							a(l, _);
						},
						$$slots: { default: !0 }
					});
					var d = r(s, 2);
					p(d, {
						href: 'https://traefik-oidc-auth.sevensolutions.cc/docs/identity-providers/pocket-id',
						children: (l, v) => {
							o();
							var _ = n('Opendrive configuration docs');
							a(l, _);
						},
						$$slots: { default: !0 }
					});
					var h = r(d, 2);
					(p(h, {
						href: 'https://traefik-oidc-auth.sevensolutions.cc/docs/getting-started',
						children: (l, v) => {
							o();
							var _ = n('Getting Started');
							a(l, _);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			});
			var xe = r(me, 2);
			(u(xe, {
				children: (t, i) => {
					o();
					var e = Fe(),
						s = r(c(e));
					(p(s, {
						href: 'https://doc.traefik.io/traefik-enterprise/middlewares/oidc/',
						children: (d, h) => {
							o();
							var l = n('OIDC middleware');
							a(d, l);
						},
						$$slots: { default: !0 }
					}),
						o(),
						a(t, e));
				},
				$$slots: { default: !0 }
			}),
				a(ge, C));
		}
	});
}
export { ot as default, ke as metadata };
