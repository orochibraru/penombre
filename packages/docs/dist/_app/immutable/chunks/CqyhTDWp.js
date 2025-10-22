import { f as p, a as $, n as e, g as a, b as o, s, j as T } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B, P as m } from './CXunQUVT.js';
import { H as v } from './CMbTFn8B.js';
import { U as E } from './B2E1dnfA.js';
import { L as g } from './EJ1QvGwo.js';
import { O as F } from './eLU9aUh4.js';
import { A as P } from './Bva6-POL.js';
const G = { title: 'Translating', description: 'Help translate Opendrive into your language' },
	{ title: rt, description: ot } = G;
var S = p('Visit our <!>.', 1),
	z = p('Open the <!> source file.', 1),
	I = p('<!> <!> <!> <!>', 1),
	J = p('Is your language missing from Crowdin? You can <!>.', 1),
	V = p(
		'Encountering issues while translating? Join the <!> to seek help and share experiences.',
		1
	),
	Y = p('<!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function st(O) {
	B(O, {
		children: (q, D) => {
			var x = Y(),
				w = $(x);
			m(w, {
				children: (r, l) => {
					e();
					var t = a(
						'Help us make Opendrive accessible in your language by contributing translations.'
					);
					o(r, t);
				},
				$$slots: { default: !0 }
			});
			var b = s(w, 2);
			v(b, {
				id: 'translation-guidelines',
				children: (r, l) => {
					e();
					var t = a('Translation Guidelines');
					o(r, t);
				},
				$$slots: { default: !0 }
			});
			var k = s(b, 2);
			E(k, {
				children: (r, l) => {
					g(r, {
						children: (t, d) => {
							e();
							var i = a('Use informal language for translations');
							o(t, i);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var y = s(k, 2);
			v(y, {
				id: 'getting-started',
				children: (r, l) => {
					e();
					var t = a('Getting Started');
					o(r, t);
				},
				$$slots: { default: !0 }
			});
			var j = s(y, 2);
			F(j, {
				children: (r, l) => {
					var t = I(),
						d = $(t);
					g(d, {
						children: (u, _) => {
							e();
							var n = S(),
								h = s($(n));
							(P(h, {
								href: 'https://crowdin.com/project/pocket-id',
								children: (A, K) => {
									e();
									var N = a('Crowdin project page');
									o(A, N);
								},
								$$slots: { default: !0 }
							}),
								e(),
								o(u, n));
						},
						$$slots: { default: !0 }
					});
					var i = s(d, 2);
					g(i, {
						children: (u, _) => {
							e();
							var n = a('Choose the language you wish to translate into.');
							o(u, n);
						},
						$$slots: { default: !0 }
					});
					var f = s(i, 2);
					g(f, {
						children: (u, _) => {
							e();
							var n = z(),
								h = s($(n));
							(T(h, () => '<code>en-US.json</code>'), e(), o(u, n));
						},
						$$slots: { default: !0 }
					});
					var c = s(f, 2);
					(g(c, {
						children: (u, _) => {
							e();
							var n = a('Now you can start translating the strings.');
							o(u, n);
						},
						$$slots: { default: !0 }
					}),
						o(r, t));
				},
				$$slots: { default: !0 }
			});
			var C = s(j, 2);
			v(C, {
				id: 'adding-a-new-language',
				children: (r, l) => {
					e();
					var t = a('Adding a New Language');
					o(r, t);
				},
				$$slots: { default: !0 }
			});
			var H = s(C, 2);
			m(H, {
				children: (r, l) => {
					e();
					var t = J(),
						d = s($(t));
					(P(d, {
						href: 'https://github.com/pocket-id/pocket-id/issues/new?assignees=&labels=language-request&projects=&template=language-request.yml&title=%F0%9F%8C%90+Language+request%3A+%3Clanguage+name+in+english%3E',
						children: (i, f) => {
							e();
							var c = a('request its addition');
							o(i, c);
						},
						$$slots: { default: !0 }
					}),
						e(),
						o(r, t));
				},
				$$slots: { default: !0 }
			});
			var L = s(H, 2);
			v(L, {
				id: 'need-help',
				children: (r, l) => {
					e();
					var t = a('Need Help?');
					o(r, t);
				},
				$$slots: { default: !0 }
			});
			var U = s(L, 2);
			(m(U, {
				children: (r, l) => {
					e();
					var t = V(),
						d = s($(t));
					(P(d, {
						href: 'https://github.com/pocket-id/pocket-id/discussions/370',
						children: (i, f) => {
							e();
							var c = a('Localization discussion');
							o(i, c);
						},
						$$slots: { default: !0 }
					}),
						e(),
						o(r, t));
				},
				$$slots: { default: !0 }
			}),
				o(q, x));
		}
	});
}
export { st as default, G as metadata };
