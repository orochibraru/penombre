import { f as u, a as d, n as o, g as i, b as s, s as r, j as C } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as D, P } from './CXunQUVT.js';
import { O as I } from './eLU9aUh4.js';
import { L as n } from './EJ1QvGwo.js';
const A = {
		title: 'Allowed User Groups',
		description: 'Configure allowed user groups for authentication'
	},
	{ title: q, description: z } = A;
var B = u('Navigate to the <!> section in the Opendrive admin dashboard.', 1),
	G = u('Expand the <!> section.', 1),
	L = u('<!> <!> <!> <!> <!>', 1),
	N = u('<!> <!> <!>', 1);
function F(x) {
	D(x, {
		children: (O, T) => {
			var $ = N(),
				f = d($);
			P(f, {
				children: (l, v) => {
					o();
					var a = i(
						'Opendrive allows you to restrict access to OIDC Clients to specific user groups. This can be useful when you want to restrict access to certain applications to specific users.'
					);
					s(l, a);
				},
				$$slots: { default: !0 }
			});
			var h = r(f, 2);
			P(h, {
				children: (l, v) => {
					o();
					var a = i(
						'By default, all users are allowed to access all OIDC Clients. To restrict access to specific user groups, follow the steps below:'
					);
					s(l, a);
				},
				$$slots: { default: !0 }
			});
			var y = r(h, 2);
			(I(y, {
				children: (l, v) => {
					var a = L(),
						_ = d(a);
					n(_, {
						children: (e, c) => {
							o();
							var t = B(),
								p = r(d(t));
							(C(p, () => '<code>OIDC Clients</code>'), o(), s(e, t));
						},
						$$slots: { default: !0 }
					});
					var m = r(_, 2);
					n(m, {
						children: (e, c) => {
							o();
							var t = i(
								'Click the edit (pencil) icon on the OIDC client you wish to restrict.'
							);
							s(e, t);
						},
						$$slots: { default: !0 }
					});
					var w = r(m, 2);
					n(w, {
						children: (e, c) => {
							o();
							var t = G(),
								p = r(d(t));
							(C(p, () => '<code>Allowed User Groups</code>'), o(), s(e, t));
						},
						$$slots: { default: !0 }
					});
					var g = r(w, 2);
					n(g, {
						children: (e, c) => {
							o();
							var t = i(
								'Select the Group(s) you want to allow access to this OIDC Client and save your changes.'
							);
							s(e, t);
						},
						$$slots: { default: !0 }
					});
					var b = r(g, 2);
					(n(b, {
						children: (e, c) => {
							o();
							var t = i(
								'Now only users in the selected group(s) will be allowed to access that specific client.'
							);
							s(e, t);
						},
						$$slots: { default: !0 }
					}),
						s(l, a));
				},
				$$slots: { default: !0 }
			}),
				s(O, $));
		}
	});
}
export { F as default, A as metadata };
