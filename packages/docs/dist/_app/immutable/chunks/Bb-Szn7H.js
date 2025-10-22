import { f as u, a as l, n as r, g as i, b as s, s as o, j as n, h as L } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as w, P as c } from './CXunQUVT.js';
import { H as $ } from './CMbTFn8B.js';
import { P as R } from './DZj8j_ml.js';
const B = { title: 'Common Issues', description: 'Solutions to frequently encountered problems' },
	{ title: J, description: K } = B;
var E = u('Ensure that the <!> is set correctly to the public URL of the Opendrive instance.', 1),
	H = u('One of the most common issues with OIDC clients is a misconfigured <!>.', 1),
	S = u(
		'If the <!> URL parameter starts with <!> but <!> is expected, the client is the issue. If you can’t resolve the issue on the client side, you can add a secondary callback URL using both <!> and <!> versions.',
		1
	),
	j = u('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function M(A) {
	w(A, {
		children: (I, q) => {
			var p = j(),
				m = l(p);
			$(m, {
				id: 'unable-to-add-a-passkey',
				children: (t, d) => {
					r();
					var e = i('Unable to Add a Passkey');
					s(t, e);
				},
				$$slots: { default: !0 }
			});
			var v = o(m, 2);
			c(v, {
				children: (t, d) => {
					r();
					var e = E(),
						a = o(l(e));
					(n(a, () => '<code>APP_URL</code>'), r(), s(t, e));
				},
				$$slots: { default: !0 }
			});
			var _ = o(v, 2);
			c(_, {
				children: (t, d) => {
					r();
					var e = i('Example:');
					s(t, e);
				},
				$$slots: { default: !0 }
			});
			var h = o(_, 2);
			R(h, {
				children: (t, d) => {
					var e = L(),
						a = l(e);
					(n(
						a,
						() => `<code class="language-ini">APP_URL=https://id.example.com
</code>`
					),
						s(t, e));
				},
				$$slots: { default: !0 }
			});
			var f = o(h, 2);
			$(f, {
				id: 'unable-to-access-the-admin-ui-after-setup',
				children: (t, d) => {
					r();
					var e = i('Unable to Access the Admin UI After Setup');
					s(t, e);
				},
				$$slots: { default: !0 }
			});
			var P = o(f, 2);
			c(P, {
				children: (t, d) => {
					r();
					var e = i('To set up the initial passkey for the admin user, navigate to:');
					s(t, e);
				},
				$$slots: { default: !0 }
			});
			var b = o(P, 2);
			R(b, {
				children: (t, d) => {
					var e = L(),
						a = l(e);
					(n(
						a,
						() => `<code>https://id.example.com/setup
</code>`
					),
						s(t, e));
				},
				$$slots: { default: !0 }
			});
			var g = o(b, 2);
			$(g, {
				id: 'invalid-callback-url',
				children: (t, d) => {
					r();
					var e = i('Invalid Callback URL');
					s(t, e);
				},
				$$slots: { default: !0 }
			});
			var x = o(g, 2);
			c(x, {
				children: (t, d) => {
					r();
					var e = H(),
						a = o(l(e));
					(n(a, () => '<code>Callback URL</code>'), r(), s(t, e));
				},
				$$slots: { default: !0 }
			});
			var C = o(x, 2);
			(c(C, {
				children: (t, d) => {
					r();
					var e = S(),
						a = o(l(e));
					n(a, () => '<code>redirect_uri</code>');
					var U = o(a, 2);
					n(U, () => '<code>http</code>');
					var y = o(U, 2);
					n(y, () => '<code>https</code>');
					var k = o(y, 2);
					n(k, () => '<code>http</code>');
					var O = o(k, 2);
					(n(O, () => '<code>https</code>'), r(), s(t, e));
				},
				$$slots: { default: !0 }
			}),
				s(I, p));
		}
	});
}
export { M as default, B as metadata };
