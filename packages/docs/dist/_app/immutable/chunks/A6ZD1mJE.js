import { f, a as l, n as s, g as n, b as r, s as o, h as _, j as u } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as I, P as b } from './CXunQUVT.js';
import { H as Y } from './CMbTFn8B.js';
import { P as g } from './DZj8j_ml.js';
import { O as y } from './eLU9aUh4.js';
import { L as p } from './EJ1QvGwo.js';
import { A as J } from './Bva6-POL.js';
import { U as N } from './B2E1dnfA.js';
const Q = { title: 'Upgrading', description: 'Keep your Opendrive installation up to date' },
	{ title: ue, description: pe } = Q;
var V = f('<!> <!>', 1),
	W = f('Download the latest binary from the <!>.', 1),
	X = f('Example: <!>', 1),
	Z = f('<!> <!>', 1),
	ee = f('<!> <!> <!> <!>', 1),
	te = f('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function ve(q) {
	I(q, {
		children: (z, re) => {
			var U = te(),
				S = l(U);
			Y(S, {
				id: 'docker',
				children: (t, d) => {
					s();
					var e = n('Docker');
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var j = o(S, 2);
			b(j, {
				children: (t, d) => {
					s();
					var e = n(
						'For upgrading Opendrive when using Docker, you just need to pull the latest image and restart the services:'
					);
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var A = o(j, 2);
			g(A, {
				children: (t, d) => {
					var e = _(),
						a = l(e);
					(u(
						a,
						() => `<code class="language-bash">docker compose pull
docker compose up -d
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var B = o(A, 2);
			Y(B, {
				id: 'stand-alone',
				children: (t, d) => {
					s();
					var e = n('Stand-alone');
					r(t, e);
				},
				$$slots: { default: !0 }
			});
			var F = o(B, 2);
			y(F, {
				children: (t, d) => {
					var e = V(),
						a = l(e);
					p(a, {
						children: (v, P) => {
							s();
							var m = n('Stop Opendrive');
							r(v, m);
						},
						$$slots: { default: !0 }
					});
					var i = o(a, 2);
					(p(i, {
						children: (v, P) => {
							s();
							var m = n('Remove the old binary:');
							r(v, m);
						},
						$$slots: { default: !0 }
					}),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var H = o(F, 2);
			g(H, {
				children: (t, d) => {
					var e = _(),
						a = l(e);
					(u(
						a,
						() => `<code class="language-bash">   rm pocket-id
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var M = o(H, 2);
			y(M, {
				start: '3',
				children: (t, d) => {
					p(t, {
						children: (e, a) => {
							var i = ee(),
								v = l(i);
							b(v, {
								children: (c, w) => {
									s();
									var $ = W(),
										x = o(l($));
									(J(x, {
										href: 'https://github.com/pocket-id/pocket-id/releases/latest',
										children: (O, k) => {
											s();
											var D = n('releases page');
											r(O, D);
										},
										$$slots: { default: !0 }
									}),
										s(),
										r(c, $));
								},
								$$slots: { default: !0 }
							});
							var P = o(v, 2);
							b(P, {
								children: (c, w) => {
									s();
									var $ = n(
										'Make sure to download the correct version for your operating system. The binary names follow this pattern:'
									);
									r(c, $);
								},
								$$slots: { default: !0 }
							});
							var m = o(P, 2);
							N(m, {
								children: (c, w) => {
									var $ = Z(),
										x = l($);
									p(x, {
										children: (k, D) => {
											var h = _(),
												L = l(h);
											(u(
												L,
												() =>
													'<code>pocket-id-&lt;operating-system>-&lt;architecture></code>'
											),
												r(k, h));
										},
										$$slots: { default: !0 }
									});
									var O = o(x, 2);
									(p(O, {
										children: (k, D) => {
											s();
											var h = X(),
												L = o(l(h));
											(u(L, () => '<code>pocket-id-linux-amd64</code>'),
												r(k, h));
										},
										$$slots: { default: !0 }
									}),
										r(c, $));
								},
								$$slots: { default: !0 }
							});
							var G = o(m, 2);
							(b(G, {
								children: (c, w) => {
									s();
									var $ = n(
										'You can use curl to download the binary directly. For example, for Linux on AMD64 architecture:'
									);
									r(c, $);
								},
								$$slots: { default: !0 }
							}),
								r(e, i));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var R = o(M, 2);
			g(R, {
				children: (t, d) => {
					var e = _(),
						a = l(e);
					(u(
						a,
						() => `<code class="language-bash">   curl -L -o pocket-id-linux-amd64 https://github.com/pocket-id/pocket-id/releases/latest/download/pocket-id-linux-amd64
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var E = o(R, 2);
			y(E, {
				start: '4',
				children: (t, d) => {
					p(t, {
						children: (e, a) => {
							s();
							var i = n('Rename the binary and make it executable:');
							r(e, i);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var K = o(E, 2);
			g(K, {
				children: (t, d) => {
					var e = _(),
						a = l(e);
					(u(
						a,
						() => `<code class="language-bash">   mv pocket-id-&lt;operating-system>-&lt;architecture> pocket-id
   chmod +x pocket-id
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			});
			var T = o(K, 2);
			y(T, {
				start: '5',
				children: (t, d) => {
					p(t, {
						children: (e, a) => {
							s();
							var i = n('Start Opendrive again:');
							r(e, i);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var C = o(T, 2);
			(g(C, {
				children: (t, d) => {
					var e = _(),
						a = l(e);
					(u(
						a,
						() => `<code class="language-bash">   ./pocket-id
</code>`
					),
						r(t, e));
				},
				$$slots: { default: !0 }
			}),
				r(z, U));
		}
	});
}
export { ve as default, Q as metadata };
