import { f as v, a as l, n as s, g as p, b as r, s as a, h as S, j as c } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as U, P as u } from './CXunQUVT.js';
import { B as N } from './C8yZ7dHE.js';
import { P } from './DZj8j_ml.js';
import { U as j } from './B2E1dnfA.js';
import { L as h } from './EJ1QvGwo.js';
const q = {
		title: 'Custom Keys',
		description: 'Configure custom signing keys for enhanced security'
	},
	{ title: ce, description: ve } = q;
var z = v('<!> <!>', 1),
	F = v('You can specify the key algorithm using the <!> flag. Supported values include:', 1),
	M = v('<!>: RSA (PKCS#1 v1.5) with a 2048-bit key and SHA-256 (default)', 1),
	W = v('<!>: RSA (PKCS#1 v1.5) with a 3072-bit key and SHA-384', 1),
	J = v('<!>: RSA (PKCS#1 v1.5) with a 4096-bit key and SHA-512', 1),
	Q = v('<!>: ECDSA with curve P-256 and SHA-256', 1),
	V = v('<!>: ECDSA with curve P-384 and SHA-384', 1),
	X = v('<!>: ECDSA with curve P-521 and SHA-512', 1),
	Z = v('<!>: EdDSA with the curve specified with the <!> flag; supported values: <!>', 1),
	ee = v('<!> <!> <!> <!> <!> <!> <!>', 1),
	te = v('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function $e(T) {
	U(T, {
		children: (Y, re) => {
			var y = te(),
				A = l(y);
			u(A, {
				children: (t, $) => {
					s();
					var e = p(
						'By default, Opendrive generates a RSA-2048 private key upon first startup, which is used to sign all tokens. You can optionally use a key with a different RSA key size (e.g. 3072 or 4096), or even a different algorithm (e.g. ECDSA with P-256, or EdDSA with Ed25519).'
					);
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var w = a(A, 2);
			N(w, {
				children: (t, $) => {
					var e = z(),
						d = l(e);
					u(d, {
						children: (f, k) => {
							s();
							var g = p(`[!IMPORTANT]
Rotating/re-generating the private key will invalidate all tokens signed by Opendrive.`);
							r(f, g);
						},
						$$slots: { default: !0 }
					});
					var _ = a(d, 2);
					(u(_, {
						children: (f, k) => {
							s();
							var g = p(
								'You will need to restart Opendrive for the new key to be picked up. Additionally, you may need to restart all applications that consume tokens issued by Opendrive.'
							);
							r(f, g);
						},
						$$slots: { default: !0 }
					}),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var E = a(w, 2);
			u(E, {
				children: (t, $) => {
					s();
					var e = p(
						'Opendrive include a command that can be used to generate a new key, which replaces the existing one and also allows rotating the private key:'
					);
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var x = a(E, 2);
			P(x, {
				children: (t, $) => {
					var e = S(),
						d = l(e);
					(c(
						d,
						() => `<code class="language-sh">pocket-id key-rotate
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var R = a(x, 2);
			u(R, {
				children: (t, $) => {
					s();
					var e = p('When running in a container, use a command similar to:');
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var C = a(R, 2);
			P(C, {
				children: (t, $) => {
					var e = S(),
						d = l(e);
					(c(
						d,
						() => `<code class="language-sh">docker compose exec pocket-id /app/pocket-id key-rotate
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var b = a(C, 2);
			u(b, {
				children: (t, $) => {
					s();
					var e = F(),
						d = a(l(e));
					(c(d, () => '<code>--alg / -a</code>'), s(), r(t, e));
				},
				$$slots: { default: !0 }
			});
			var D = a(b, 2);
			j(D, {
				children: (t, $) => {
					var e = ee(),
						d = l(e);
					h(d, {
						children: (i, m) => {
							var o = M(),
								n = l(o);
							(c(n, () => '<code>RS256</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var _ = a(d, 2);
					h(_, {
						children: (i, m) => {
							var o = W(),
								n = l(o);
							(c(n, () => '<code>RS384</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var f = a(_, 2);
					h(f, {
						children: (i, m) => {
							var o = J(),
								n = l(o);
							(c(n, () => '<code>RS512</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var k = a(f, 2);
					h(k, {
						children: (i, m) => {
							var o = Q(),
								n = l(o);
							(c(n, () => '<code>ES256</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var g = a(k, 2);
					h(g, {
						children: (i, m) => {
							var o = V(),
								n = l(o);
							(c(n, () => '<code>ES384</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var B = a(g, 2);
					h(B, {
						children: (i, m) => {
							var o = X(),
								n = l(o);
							(c(n, () => '<code>ES512</code>'), s(), r(i, o));
						},
						$$slots: { default: !0 }
					});
					var I = a(B, 2);
					(h(I, {
						children: (i, m) => {
							var o = Z(),
								n = l(o);
							c(n, () => '<code>EdDSA</code>');
							var K = a(n, 2);
							c(K, () => '<code>--crv / -c</code>');
							var L = a(K, 2);
							(c(L, () => '<code>Ed25519</code>'), r(i, o));
						},
						$$slots: { default: !0 }
					}),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var O = a(D, 2);
			u(O, {
				children: (t, $) => {
					s();
					var e = p('For example:');
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var H = a(O, 2);
			P(H, {
				children: (t, $) => {
					var e = S(),
						d = l(e);
					(c(
						d,
						() => `<code class="language-sh"># Generates an ES256 token signing key
pocket-id key-rotate --alg ES256

# Generates an EdDSA token signing key with Ed25519
pocket-id key-rotate --alg EdDSA --crv Ed25519
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var G = a(H, 2);
			(N(G, {
				children: (t, $) => {
					u(t, {
						children: (e, d) => {
							s();
							var _ = p(`[!NOTE]
Note that the private key is used for all OAuth2 clients. If choosing an algorithm different than RS256 (RSA), make sure that your clients support that.`);
							r(e, _);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			}),
				r(Y, y));
		}
	});
}
export { $e as default, q as metadata };
