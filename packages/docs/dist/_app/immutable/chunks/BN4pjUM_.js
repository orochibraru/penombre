import { f as $, a as n, n as s, s as o, g as c, b as t, j as l, h as P } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as ae, P as u } from './CXunQUVT.js';
import { S as y } from './Bqu0--pl.js';
import { H as S } from './CMbTFn8B.js';
import { P as T } from './DZj8j_ml.js';
import { B as ee } from './C8yZ7dHE.js';
import { U as oe } from './B2E1dnfA.js';
import { L as D } from './EJ1QvGwo.js';
import { A as ne } from './Bva6-POL.js';
const de = {
		title: 'Container Security Hardening',
		description: 'Secure your Opendrive deployment with distroless containers and hardening'
	},
	{ title: He, description: Ee } = de;
var le = $(
		'By default, the Opendrive container starts as the root user, which is used to set permissions on the file system before dropping its privileges and starting the main process. This is done for convenience, while still running the Opendrive binary as non-root. If you prefer, you can run the Opendrive container as a <!> user entirely and even ensure it uses a <!>.',
		1
	),
	ie = $(
		'Additionally, you can also switch to a <!> container, which is leaner and has a smaller potential attack surface.',
		1
	),
	ce = $(
		'Make sure that the Opendrive data volume is writable by the chosen user. This is the volume/folder mounted in the container at <!>.',
		1
	),
	ue = $(
		'For example, if running the container as user <!> and group <!>, use a command similar to this to change the owner of the data folder:',
		1
	),
	$e = $('<!>: Add the <!> flags to the <!> command.', 1),
	ve = $('<!>: Set these options in the <!> service:', 1),
	he = $('<!> <!>', 1),
	pe = $('<!> <!> <!> <!>', 1),
	fe = $('<!> <!>', 1),
	_e = $('To use distroless container, append <!> to the container image, for example:', 1),
	me = $('You can also use a specific version (such as <!>) or branch (<!>).', 1),
	ge = $(
		'Note that distroless containers are non-root by default. You will need to <!> as described in the <!> section.',
		1
	),
	Pe = $(
		`[!NOTE]
Distroless containers do not include a shell, so you will not be able to enter into the container (e.g. with <!>) for debugging purposes.`,
		1
	),
	ye = $(
		"This <!> includes a full example of using Opendrive's distroless containers, with non-root user and a read-only root filesystem.",
		1
	),
	xe = $('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1);
function Le(re) {
	ae(re, {
		children: (te, ke) => {
			var A = xe(),
				H = n(A);
			u(H, {
				children: (r, d) => {
					s();
					var e = le(),
						a = o(n(e));
					y(a, {
						children: (v, m) => {
							s();
							var h = c('non-root');
							t(v, h);
						},
						$$slots: { default: !0 }
					});
					var i = o(a, 2);
					(y(i, {
						children: (v, m) => {
							s();
							var h = c('read-only root file system');
							t(v, h);
						},
						$$slots: { default: !0 }
					}),
						s(),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var E = o(H, 2);
			u(E, {
				children: (r, d) => {
					s();
					var e = ie(),
						a = o(n(e));
					(y(a, {
						children: (i, v) => {
							s();
							var m = c('distroless');
							t(i, m);
						},
						$$slots: { default: !0 }
					}),
						s(),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var L = o(E, 2);
			S(L, {
				id: 'system-requirements',
				children: (r, d) => {
					s();
					var e = c('System requirements');
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var N = o(L, 2);
			u(N, {
				children: (r, d) => {
					s();
					var e = ce(),
						a = o(n(e));
					(l(a, () => '<code>/app/data</code>'), s(), t(r, e));
				},
				$$slots: { default: !0 }
			});
			var j = o(N, 2);
			u(j, {
				children: (r, d) => {
					s();
					var e = ue(),
						a = o(n(e));
					l(a, () => '<code>1000</code>');
					var i = o(a, 2);
					(l(i, () => '<code>1000</code>'), s(), t(r, e));
				},
				$$slots: { default: !0 }
			});
			var I = o(j, 2);
			T(I, {
				children: (r, d) => {
					var e = P(),
						a = n(e);
					(l(
						a,
						() => `<code class="language-sh"># Set the owner to user 1000 and group 1000
chown -R 1000:1000 ./data
# Set permissions on all folders to 0700
find ./data -type d -exec chmod 0700 &#123;&#125; ;
# Set permissions on all files to 0600
find ./data -type f -exec chmod 0600 &#123;&#125; ;
</code>`
					),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var M = o(I, 2);
			ee(M, {
				children: (r, d) => {
					u(r, {
						children: (e, a) => {
							s();
							var i = c(`[!NOTE]
Alternatively, you can start up the regular (non-distroless) Opendrive container with the default configuration once (where it starts as root before dropping privileges), and it will create the directories and set permissions automatically.`);
							t(e, i);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var U = o(M, 2);
			S(U, {
				id: 'container-configuration',
				children: (r, d) => {
					s();
					var e = c('Container configuration');
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var Y = o(U, 2);
			u(Y, {
				children: (r, d) => {
					s();
					var e = c(
						'To run the container as non-root and with a read-only root file system, use one of the options below.'
					);
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var F = o(Y, 2);
			oe(F, {
				children: (r, d) => {
					var e = fe(),
						a = n(e);
					D(a, {
						children: (v, m) => {
							u(v, {
								children: (h, C) => {
									var x = $e(),
										k = n(x);
									y(k, {
										children: (w, p) => {
											s();
											var _ = c('Docker CLI');
											t(w, _);
										},
										$$slots: { default: !0 }
									});
									var O = o(k, 2);
									l(O, () => '<code>--user 1000:1000 --read-only</code>');
									var f = o(O, 2);
									(l(f, () => '<code>docker run</code>'), s(), t(h, x));
								},
								$$slots: { default: !0 }
							});
						},
						$$slots: { default: !0 }
					});
					var i = o(a, 2);
					(D(i, {
						children: (v, m) => {
							var h = pe(),
								C = n(h);
							u(C, {
								children: (f, w) => {
									var p = ve(),
										_ = n(p);
									y(_, {
										children: (b, Z) => {
											s();
											var g = c('Docker Compose');
											t(b, g);
										},
										$$slots: { default: !0 }
									});
									var q = o(_, 2);
									(l(q, () => '<code>pocket-id</code>'), s(), t(f, p));
								},
								$$slots: { default: !0 }
							});
							var x = o(C, 2);
							oe(x, {
								children: (f, w) => {
									var p = he(),
										_ = n(p);
									D(_, {
										children: (b, Z) => {
											var g = P(),
												B = n(g);
											(l(B, () => '<code>read_only: true</code>'), t(b, g));
										},
										$$slots: { default: !0 }
									});
									var q = o(_, 2);
									(D(q, {
										children: (b, Z) => {
											var g = P(),
												B = n(g);
											(l(B, () => '<code>user: "1000:1000"</code>'), t(b, g));
										},
										$$slots: { default: !0 }
									}),
										t(f, p));
								},
								$$slots: { default: !0 }
							});
							var k = o(x, 2);
							u(k, {
								children: (f, w) => {
									s();
									var p = c('Example:');
									t(f, p);
								},
								$$slots: { default: !0 }
							});
							var O = o(k, 2);
							(T(O, {
								children: (f, w) => {
									var p = P(),
										_ = n(p);
									(l(
										_,
										() => `<code class="language-yaml">services:
    pocket-id:
        # ...
        read_only: true
        user: '1000:1000'
</code>`
									),
										t(f, p));
								},
								$$slots: { default: !0 }
							}),
								t(v, h));
						},
						$$slots: { default: !0 }
					}),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var R = o(F, 2);
			S(R, {
				id: 'distroless-container',
				children: (r, d) => {
					s();
					var e = c('Distroless container');
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var z = o(R, 2);
			u(z, {
				children: (r, d) => {
					s();
					var e = c(
						'Distroless containers are based on a minimal image, which includes "just enough" to run Opendrive. These images are leaner, resulting in faster pulls, and because they do not include a shell or other system libraries, they also have a reduced potential attack surface.'
					);
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var G = o(z, 2);
			u(G, {
				children: (r, d) => {
					s();
					var e = _e(),
						a = o(n(e));
					(l(a, () => '<code>-distroless</code>'), s(), t(r, e));
				},
				$$slots: { default: !0 }
			});
			var J = o(G, 2);
			T(J, {
				children: (r, d) => {
					var e = P(),
						a = n(e);
					(l(
						a,
						() => `<code>ghcr.io/pocket-id/pocket-id:v1-distroless
</code>`
					),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var K = o(J, 2);
			u(K, {
				children: (r, d) => {
					s();
					var e = me(),
						a = o(n(e));
					l(a, () => '<code>v1.x.x-distroless</code>');
					var i = o(a, 2);
					(l(i, () => '<code>v1.x-distroless</code>'), s(), t(r, e));
				},
				$$slots: { default: !0 }
			});
			var Q = o(K, 2);
			u(Q, {
				children: (r, d) => {
					s();
					var e = ge(),
						a = o(n(e));
					y(a, {
						children: (v, m) => {
							s();
							var h = c('set permissions on the mountpoints');
							t(v, h);
						},
						$$slots: { default: !0 }
					});
					var i = o(a, 2);
					(ne(i, {
						href: '#system-requirements',
						children: (v, m) => {
							s();
							var h = c('System requirements');
							t(v, h);
						},
						$$slots: { default: !0 }
					}),
						s(),
						t(r, e));
				},
				$$slots: { default: !0 }
			});
			var V = o(Q, 2);
			ee(V, {
				children: (r, d) => {
					u(r, {
						children: (e, a) => {
							s();
							var i = Pe(),
								v = o(n(i));
							(l(v, () => '<code>docker exec</code>'), s(), t(e, i));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var W = o(V, 2);
			S(W, {
				id: 'docker-compose',
				children: (r, d) => {
					s();
					var e = c('Docker Compose');
					t(r, e);
				},
				$$slots: { default: !0 }
			});
			var X = o(W, 2);
			u(X, {
				children: (r, d) => {
					s();
					var e = ye(),
						a = o(n(e));
					(l(a, () => '<code>docker-compose.yml</code>'), s(), t(r, e));
				},
				$$slots: { default: !0 }
			});
			var se = o(X, 2);
			(T(se, {
				children: (r, d) => {
					var e = P(),
						a = n(e);
					(l(
						a,
						() => `<code class="language-yaml">services:
    pocket-id:
        image: ghcr.io/pocket-id/pocket-id:v1-distroless
        restart: unless-stopped
        env_file: .env
        ports:
            - 1411:1411
        volumes:
            - './data:/app/data'
        read_only: true
        user: '1000:1000'
        # Optional healthcheck
        healthcheck:
            test: ['CMD', '/app/pocket-id', 'healthcheck']
            interval: 1m30s
            timeout: 5s
            retries: 2
            start_period: 10s
</code>`
					),
						t(r, e));
				},
				$$slots: { default: !0 }
			}),
				t(te, A));
		}
	});
}
export { Le as default, de as metadata };
