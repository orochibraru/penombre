import { f as p, a as o, n as u, g as c, b as s, s as m, h as x, j as _ } from './ZGPguNnN.js';
import './BzFm6CDa.js';
import { B as h, P as v } from './CXunQUVT.js';
import { P as g } from './DZj8j_ml.js';
const $ = {
		title: 'Nginx Reverse Proxy',
		description: 'Set up Nginx as a reverse proxy for Opendrive'
	},
	{ title: j, description: B } = $;
var y = p('<!> <!>', 1);
function O(i) {
	h(i, {
		children: (n, b) => {
			var t = y(),
				a = o(t);
			v(a, {
				children: (r, d) => {
					u();
					var e = c(
						'To use Nginx as a reverse proxy for Opendrive, update the configuration to increase the header buffer size. This adjustment is necessary because SvelteKit generates larger headers, which may exceed the default buffer limits.'
					);
					s(r, e);
				},
				$$slots: { default: !0 }
			});
			var f = m(a, 2);
			(g(f, {
				children: (r, d) => {
					var e = x(),
						l = o(e);
					(_(
						l,
						() => `<code class="language-conf">proxy_busy_buffers_size   512k;
proxy_buffers   4 512k;
proxy_buffer_size   256k;
</code>`
					),
						s(r, e));
				},
				$$slots: { default: !0 }
			}),
				s(n, t));
		}
	});
}
export { O as default, $ as metadata };
