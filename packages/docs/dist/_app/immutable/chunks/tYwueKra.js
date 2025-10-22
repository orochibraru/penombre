import {
	f as c,
	a as s,
	n as r,
	g as $,
	b as t,
	s as e,
	j as u,
	h as F,
	d as V,
	r as E
} from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as Ie, P as S } from './CXunQUVT.js';
import { H as R } from './CMbTFn8B.js';
import { A as W } from './Bva6-POL.js';
import { U as Ne } from './B2E1dnfA.js';
import { L as A } from './EJ1QvGwo.js';
import { O as U } from './eLU9aUh4.js';
import { P as B } from './DZj8j_ml.js';
import { T as He, a as j, b as M, c as g } from './DpdLr4Qt.js';
const Re = {
		title: 'Documentation',
		description: 'Contribute to improving the Opendrive website or documentation'
	},
	{ title: Kt, description: Xt } = Re;
var De = c('All markdown pages are under <!>. Velite (see <!>) defines collections:', 1),
	Me = c('<!> (overview)', 1),
	Ve = c('<!> <!> <!> <!> <!> <!> <!> <!> <!> <!>', 1),
	Ee = c('Each file is parsed and exported via <!>. The dynamic loader: <!>.', 1),
	Ue = c('URL = <!> + file path without <!> (e.g. <!> → <!>).', 1),
	We = c('Pick the correct folder that matches a collection pattern (e.g. <!>).', 1),
	Be = c('Create <!>.', 1),
	Ge = c('<!> <!> <!>', 1),
	Le = c('Run <!> – Velite auto-detects the file. No manual array updates needed.', 1),
	qe = c('<!> <!> <!>', 1),
	Ke = c('<!> <!> <!>', 1),
	Xe = c('<!> <!> <!>', 1),
	ze = c('relative path without <!>', 1),
	Je = c('<!> <!> <!>', 1),
	Qe = c('joins segments (<!>)', 1),
	Ye = c('<!> <!> <!>', 1),
	Ze = c('<!> <!> <!>', 1),
	et = c('path split on <!>', 1),
	tt = c('<!> <!> <!>', 1),
	rt = c('<!> <!> <!>', 1),
	ot = c('default <!>', 1),
	at = c('<!> <!> <!>', 1),
	st = c('<!> <!> <!>', 1),
	dt = c('<thead><!></thead> <tbody><!><!><!><!><!><!><!><!><!></tbody>', 1),
	lt = c('<!> is injected automatically (used for page outline).', 1),
	nt = c(
		'Sidebar &#x26; neighbor links are generated from the Velite collections (see <!>). Ordering inside a section:',
		1
	),
	$t = c('<!> (ascending) if present', 1),
	it = c('<!> alphabetical', 1),
	vt = c('<!> <!>', 1),
	ct = c(
		'Set <!>. The file remains buildable but can be filtered from listings (logic may hide unpublished).',
		1
	),
	_t = c('Place under <!>:', 1),
	ut = c('Always provide <!>.', 1),
	ft = c('<!> <!>', 1),
	pt = c('<!> <!>', 1),
	ht = c('Add <!> frontmatter', 1),
	mt = c('<!> <!>', 1),
	gt = c('Add / adjust <!>', 1),
	Pt = c('<!> <!>', 1),
	xt = c('Add at least one level-2 <!>', 1),
	bt = c('<!> <!>', 1),
	wt = c('Remove or set <!>', 1),
	kt = c('<!> <!>', 1),
	yt = c('<thead><!></thead> <tbody><!><!><!><!><!></tbody>', 1),
	Tt = c('<input type="checkbox" disabled/> File created in correct folder', 1),
	Ot = c('<input type="checkbox" disabled/> Frontmatter with title &#x26; description', 1),
	Ct = c('<input type="checkbox" disabled/> Optional <!> set (if ordering matters)', 1),
	At = c('<input type="checkbox" disabled/> Page builds (<!>)', 1),
	Nt = c('<input type="checkbox" disabled/> Headings structured (<!>, <!>) for TOC', 1),
	Ht = c('<input type="checkbox" disabled/> Images (if any) in <!> with alt text', 1),
	St = c('<!> <!> <!> <!> <!> <!>', 1),
	jt = c('Commit using Conventional Commits (<!>).', 1),
	Ft = c('<!> <!> <!>', 1),
	It = c(
		'<!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <pre><code>```bash\ndocker compose up -d\n```</code></pre> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>',
		1
	);
function zt(Se) {
	Ie(Se, {
		children: (je, Rt) => {
			var G = It(),
				L = s(G);
			S(L, {
				children: (a, h) => {
					r();
					var o = $(
						'This guide explains how to add or edit documentation (SvelteKit + Velite + MDSX).'
					);
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var q = e(L, 2);
			R(q, {
				id: '1-where-docs-live',
				children: (a, h) => {
					r();
					var o = $('1. Where docs live');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var K = e(q, 2);
			S(K, {
				children: (a, h) => {
					r();
					var o = De(),
						_ = e(s(o));
					u(_, () => '<code>docs/</code>');
					var k = e(_, 2);
					(W(k, {
						href: 'https://github.com/pocket-id/website/blob/main/velite.config.js',
						children: (y, b) => {
							var w = F(),
								P = s(w);
							(u(P, () => '<code>velite.config.js</code>'), t(y, w));
						},
						$$slots: { default: !0 }
					}),
						r(),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var X = e(K, 2);
			Ne(X, {
				children: (a, h) => {
					var o = Ve(),
						_ = s(o);
					A(_, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>introduction.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var k = e(_, 2);
					A(k, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>setup/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var y = e(k, 2);
					A(y, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>configuration/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var b = e(y, 2);
					A(b, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>guides/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var w = e(b, 2);
					A(w, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>advanced/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var P = e(w, 2);
					A(P, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>helping-out/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var C = e(P, 2);
					A(C, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>troubleshooting/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var I = e(C, 2);
					A(I, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>api.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var x = e(I, 2);
					A(x, {
						children: (f, T) => {
							var l = Me(),
								v = s(l);
							(u(v, () => '<code>client-examples.md</code>'), r(), t(f, l));
						},
						$$slots: { default: !0 }
					});
					var N = e(x, 2);
					(A(N, {
						children: (f, T) => {
							var l = F(),
								v = s(l);
							(u(v, () => '<code>client-examples/**/*.md</code>'), t(f, l));
						},
						$$slots: { default: !0 }
					}),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var z = e(X, 2);
			S(z, {
				children: (a, h) => {
					r();
					var o = Ee(),
						_ = e(s(o));
					u(_, () => '<code>$docs/index.js</code>');
					var k = e(_, 2);
					(W(k, {
						href: 'https://github.com/pocket-id/website/blob/main/src/lib/docs.ts',
						children: (y, b) => {
							var w = F(),
								P = s(w);
							(u(P, () => '<code>getDoc</code>'), t(y, w));
						},
						$$slots: { default: !0 }
					}),
						r(),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var J = e(z, 2);
			S(J, {
				children: (a, h) => {
					r();
					var o = Ue(),
						_ = e(s(o));
					u(_, () => '<code>/docs/</code>');
					var k = e(_, 2);
					u(k, () => '<code>.md</code>');
					var y = e(k, 2);
					u(y, () => '<code>setup/installation.md</code>');
					var b = e(y, 2);
					(u(b, () => '<code>/docs/setup/installation</code>'), r(), t(a, o));
				},
				$$slots: { default: !0 }
			});
			var Q = e(J, 2);
			R(Q, {
				id: '2-adding-a-new-page',
				children: (a, h) => {
					r();
					var o = $('2. Adding a new page');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var Y = e(Q, 2);
			U(Y, {
				children: (a, h) => {
					var o = Ge(),
						_ = s(o);
					A(_, {
						children: (b, w) => {
							r();
							var P = We(),
								C = e(s(P));
							(u(C, () => '<code>guides/</code>'), r(), t(b, P));
						},
						$$slots: { default: !0 }
					});
					var k = e(_, 2);
					A(k, {
						children: (b, w) => {
							r();
							var P = Be(),
								C = e(s(P));
							(u(C, () => '<code>docs/&lt;section>/&lt;slug>.md</code>'),
								r(),
								t(b, P));
						},
						$$slots: { default: !0 }
					});
					var y = e(k, 2);
					(A(y, {
						children: (b, w) => {
							r();
							var P = $('Add frontmatter:');
							t(b, P);
						},
						$$slots: { default: !0 }
					}),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var Z = e(Y, 2);
			B(Z, {
				children: (a, h) => {
					var o = F(),
						_ = s(o);
					(u(
						_,
						() => `<code class="language-md">---
title: My Feature
description: Short summary
order: 30 # (optional) sort within its section (lower first)
published: true # (optional, default true)
---
</code>`
					),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ee = e(Z, 2);
			U(ee, {
				start: '4',
				children: (a, h) => {
					A(a, {
						children: (o, _) => {
							r();
							var k = Le(),
								y = e(s(k));
							(u(y, () => '<code>pnpm dev</code>'), r(), t(o, k));
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var te = e(ee, 2);
			R(te, {
				id: '3-frontmatter--generated-metadata',
				children: (a, h) => {
					r();
					var o = $('3. Frontmatter & generated metadata');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var re = e(te, 2);
			S(re, {
				children: (a, h) => {
					r();
					var o = $('Velite schema (see config):');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var oe = e(re, 2);
			He(oe, {
				children: (a, h) => {
					var o = dt(),
						_ = s(o),
						k = V(_);
					(j(k, {
						children: (l, v) => {
							var p = qe(),
								i = s(p);
							M(i, {
								children: (n, O) => {
									r();
									var d = $('Field');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							M(m, {
								children: (n, O) => {
									r();
									var d = $('Source');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(M(H, {
								children: (n, O) => {
									r();
									var d = $('Notes');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					}),
						E(_));
					var y = e(_, 2),
						b = V(y);
					j(b, {
						children: (l, v) => {
							var p = Ke(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('title');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('frontmatter');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = $('required');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var w = e(b);
					j(w, {
						children: (l, v) => {
							var p = Xe(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('description');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('frontmatter');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = $('required');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var P = e(w);
					j(P, {
						children: (l, v) => {
							var p = Je(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('path');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('derived');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = ze(),
										D = e(s(d));
									(u(D, () => '<code>.md</code>'), t(n, d));
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var C = e(P);
					j(C, {
						children: (l, v) => {
							var p = Ye(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('slug');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('derived');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = Qe(),
										D = e(s(d));
									(u(D, () => '<code>path</code>'), r(), t(n, d));
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var I = e(C);
					j(I, {
						children: (l, v) => {
							var p = Ze(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('section');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('derived');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = $('first segment');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var x = e(I);
					j(x, {
						children: (l, v) => {
							var p = tt(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('segments');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('derived');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = et(),
										D = e(s(d));
									(u(D, () => '<code>/</code>'), t(n, d));
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var N = e(x);
					j(N, {
						children: (l, v) => {
							var p = rt(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('order');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('frontmatter');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = $('optional numeric sort hint');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var f = e(N);
					j(f, {
						children: (l, v) => {
							var p = at(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('published');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('frontmatter');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = ot(),
										D = e(s(d));
									(u(D, () => '<code>true</code>'), t(n, d));
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					});
					var T = e(f);
					(j(T, {
						children: (l, v) => {
							var p = st(),
								i = s(p);
							g(i, {
								children: (n, O) => {
									r();
									var d = $('toc');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var m = e(i, 2);
							g(m, {
								children: (n, O) => {
									r();
									var d = $('generated');
									t(n, d);
								},
								$$slots: { default: !0 }
							});
							var H = e(m, 2);
							(g(H, {
								children: (n, O) => {
									r();
									var d = $('auto table of contents');
									t(n, d);
								},
								$$slots: { default: !0 }
							}),
								t(l, p));
						},
						$$slots: { default: !0 }
					}),
						E(y),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ae = e(oe, 2);
			S(ae, {
				children: (a, h) => {
					var o = lt(),
						_ = s(o);
					(u(_, () => '<code>toc</code>'), r(), t(a, o));
				},
				$$slots: { default: !0 }
			});
			var se = e(ae, 2);
			R(se, {
				id: '4-navigation',
				children: (a, h) => {
					r();
					var o = $('4. Navigation');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var de = e(se, 2);
			S(de, {
				children: (a, h) => {
					r();
					var o = nt(),
						_ = e(s(o));
					(W(_, {
						href: 'https://github.com/pocket-id/website/blob/main/src/lib/config/docs.ts',
						children: (k, y) => {
							var b = F(),
								w = s(b);
							(u(w, () => '<code>docs.ts</code>'), t(k, b));
						},
						$$slots: { default: !0 }
					}),
						r(),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var le = e(de, 2);
			U(le, {
				children: (a, h) => {
					var o = vt(),
						_ = s(o);
					A(_, {
						children: (y, b) => {
							var w = $t(),
								P = s(w);
							(u(P, () => '<code>order</code>'), r(), t(y, w));
						},
						$$slots: { default: !0 }
					});
					var k = e(_, 2);
					(A(k, {
						children: (y, b) => {
							var w = it(),
								P = s(w);
							(u(P, () => '<code>title</code>'), r(), t(y, w));
						},
						$$slots: { default: !0 }
					}),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ne = e(le, 2);
			S(ne, {
				children: (a, h) => {
					r();
					var o = $(
						'External static links (Demo / Discord) are appended as a Resources group (see same config file).'
					);
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var $e = e(ne, 2);
			R($e, {
				id: '5-hiding-a-page-draft',
				children: (a, h) => {
					r();
					var o = $('5. Hiding a page (draft)');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var ie = e($e, 2);
			S(ie, {
				children: (a, h) => {
					r();
					var o = ct(),
						_ = e(s(o));
					(u(_, () => '<code>published: false</code>'), r(), t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ve = e(ie, 2);
			R(ve, {
				id: '6-callouts-admonitions',
				children: (a, h) => {
					r();
					var o = $('6. Callouts (Admonitions)');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var ce = e(ve, 2);
			B(ce, {
				children: (a, h) => {
					var o = F(),
						_ = s(o);
					(u(
						_,
						() => `<code>> [!NOTE] One-line note

> [!WARNING]
> Multi‑line body starts here.
</code>`
					),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var _e = e(ce, 2);
			S(_e, {
				children: (a, h) => {
					r();
					var o = $('Supported: NOTE, TIP, IMPORTANT, WARNING, CAUTION.');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var ue = e(_e, 2);
			R(ue, {
				id: '7-code-blocks',
				children: (a, h) => {
					r();
					var o = $('7. Code blocks');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var fe = e(ue, 4);
			R(fe, {
				id: '8-images',
				children: (a, h) => {
					r();
					var o = $('8. Images');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var pe = e(fe, 2);
			S(pe, {
				children: (a, h) => {
					r();
					var o = _t(),
						_ = e(s(o));
					(u(_, () => '<code>static/img/...</code>'), r(), t(a, o));
				},
				$$slots: { default: !0 }
			});
			var he = e(pe, 2);
			B(he, {
				children: (a, h) => {
					var o = F(),
						_ = s(o);
					(u(
						_,
						() => `<code class="language-md">&lt;img src="/img/example/flow.png" alt="High level authentication flow" width="600" />
</code>`
					),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var me = e(he, 2);
			S(me, {
				children: (a, h) => {
					r();
					var o = ut(),
						_ = e(s(o));
					(u(_, () => '<code>alt</code>'), r(), t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ge = e(me, 2);
			R(ge, {
				id: '9-tables',
				children: (a, h) => {
					r();
					var o = $('9. Tables');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var Pe = e(ge, 2);
			S(Pe, {
				children: (a, h) => {
					r();
					var o = $('GitHub‑Flavored Markdown is enabled; just write pipe tables.');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var xe = e(Pe, 2);
			R(xe, {
				id: '10-search--toc',
				children: (a, h) => {
					r();
					var o = $('10. Search / TOC');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var be = e(xe, 2);
			S(be, {
				children: (a, h) => {
					r();
					var o = $(
						'TOC is auto; search features (where implemented) index headings & content—no manual config.'
					);
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var we = e(be, 2);
			R(we, {
				id: '11-common-issues',
				children: (a, h) => {
					r();
					var o = $('11. Common issues');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var ke = e(we, 2);
			He(ke, {
				children: (a, h) => {
					var o = yt(),
						_ = s(o),
						k = V(_);
					(j(k, {
						children: (x, N) => {
							var f = ft(),
								T = s(f);
							M(T, {
								children: (v, p) => {
									r();
									var i = $('Issue');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(M(l, {
								children: (v, p) => {
									r();
									var i = $('Fix');
									t(v, i);
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					}),
						E(_));
					var y = e(_, 2),
						b = V(y);
					j(b, {
						children: (x, N) => {
							var f = pt(),
								T = s(f);
							g(T, {
								children: (v, p) => {
									r();
									var i = $('404');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(g(l, {
								children: (v, p) => {
									r();
									var i = $(
										'File path mismatch; confirm filename and collection pattern'
									);
									t(v, i);
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					});
					var w = e(b);
					j(w, {
						children: (x, N) => {
							var f = mt(),
								T = s(f);
							g(T, {
								children: (v, p) => {
									r();
									var i = $('Missing title');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(g(l, {
								children: (v, p) => {
									r();
									var i = ht(),
										m = e(s(i));
									(u(m, () => '<code>title</code>'), r(), t(v, i));
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					});
					var P = e(w);
					j(P, {
						children: (x, N) => {
							var f = Pt(),
								T = s(f);
							g(T, {
								children: (v, p) => {
									r();
									var i = $('Wrong sidebar order');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(g(l, {
								children: (v, p) => {
									r();
									var i = gt(),
										m = e(s(i));
									(u(m, () => '<code>order</code>'), t(v, i));
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					});
					var C = e(P);
					j(C, {
						children: (x, N) => {
							var f = bt(),
								T = s(f);
							g(T, {
								children: (v, p) => {
									r();
									var i = $('TOC empty');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(g(l, {
								children: (v, p) => {
									r();
									var i = xt(),
										m = e(s(i));
									(u(m, () => '<code>## Heading</code>'), t(v, i));
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					});
					var I = e(C);
					(j(I, {
						children: (x, N) => {
							var f = kt(),
								T = s(f);
							g(T, {
								children: (v, p) => {
									r();
									var i = $('Hidden page');
									t(v, i);
								},
								$$slots: { default: !0 }
							});
							var l = e(T, 2);
							(g(l, {
								children: (v, p) => {
									r();
									var i = wt(),
										m = e(s(i));
									(u(m, () => '<code>published: true</code>'), t(v, i));
								},
								$$slots: { default: !0 }
							}),
								t(x, f));
						},
						$$slots: { default: !0 }
					}),
						E(y),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var ye = e(ke, 2);
			R(ye, {
				id: '12-checklist-for-a-new-page',
				children: (a, h) => {
					r();
					var o = $('12. Checklist for a new page');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var Te = e(ye, 2);
			Ne(Te, {
				class: 'contains-task-list',
				children: (a, h) => {
					var o = St(),
						_ = s(o);
					A(_, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = Tt();
							(r(), t(C, x));
						},
						$$slots: { default: !0 }
					});
					var k = e(_, 2);
					A(k, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = Ot();
							(r(), t(C, x));
						},
						$$slots: { default: !0 }
					});
					var y = e(k, 2);
					A(y, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = Ct(),
								N = e(s(x), 2);
							(u(N, () => '<code>order</code>'), r(), t(C, x));
						},
						$$slots: { default: !0 }
					});
					var b = e(y, 2);
					A(b, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = At(),
								N = e(s(x), 2);
							(u(N, () => '<code>pnpm dev</code>'), r(), t(C, x));
						},
						$$slots: { default: !0 }
					});
					var w = e(b, 2);
					A(w, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = Nt(),
								N = e(s(x), 2);
							u(N, () => '<code>##</code>');
							var f = e(N, 2);
							(u(f, () => '<code>###</code>'), r(), t(C, x));
						},
						$$slots: { default: !0 }
					});
					var P = e(w, 2);
					(A(P, {
						class: 'task-list-item',
						children: (C, I) => {
							var x = Ht(),
								N = e(s(x), 2);
							(u(N, () => '<code>static/img/...</code>'), r(), t(C, x));
						},
						$$slots: { default: !0 }
					}),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var Oe = e(Te, 2);
			R(Oe, {
				id: '13-submitting-changes',
				children: (a, h) => {
					r();
					var o = $('13. Submitting changes');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var Ce = e(Oe, 2);
			U(Ce, {
				children: (a, h) => {
					var o = Ft(),
						_ = s(o);
					A(_, {
						children: (b, w) => {
							r();
							var P = $('Branch & make your changes.');
							t(b, P);
						},
						$$slots: { default: !0 }
					});
					var k = e(_, 2);
					A(k, {
						children: (b, w) => {
							r();
							var P = jt(),
								C = e(s(P));
							(u(C, () => '<code>doc: update guides</code>'), r(), t(b, P));
						},
						$$slots: { default: !0 }
					});
					var y = e(k, 2);
					(A(y, {
						children: (b, w) => {
							r();
							var P = $('Open PR.');
							t(b, P);
						},
						$$slots: { default: !0 }
					}),
						t(a, o));
				},
				$$slots: { default: !0 }
			});
			var Ae = e(Ce, 2);
			S(Ae, {
				children: (a, h) => {
					r();
					var o = $('The preview workflow will build docs automatically.');
					t(a, o);
				},
				$$slots: { default: !0 }
			});
			var Fe = e(Ae, 2);
			(S(Fe, {
				children: (a, h) => {
					r();
					var o = $('Happy documenting!');
					t(a, o);
				},
				$$slots: { default: !0 }
			}),
				t(je, G));
		}
	});
}
export { zt as default, Re as metadata };
