import {
	t as u,
	h as l,
	d as o,
	e as g,
	g as y,
	i as h,
	C as p,
	j as w,
	k as O,
	H as R,
	l as m,
	s as b,
	m as C,
	n as f
} from './BW6z9EX9.js';
function T(c, v, i = !1, _ = !1, E = !1) {
	var n = c,
		t = '';
	u(() => {
		var s = g;
		if (t === (t = v() ?? '')) {
			l && o();
			return;
		}
		if (
			(s.nodes_start !== null &&
				(y(s.nodes_start, s.nodes_end), (s.nodes_start = s.nodes_end = null)),
			t !== '')
		) {
			if (l) {
				h.data;
				for (var e = o(), d = e; e !== null && (e.nodeType !== p || e.data !== ''); )
					((d = e), (e = w(e)));
				if (e === null) throw (O(), R);
				(m(h, d), (n = b(e)));
				return;
			}
			var r = t + '';
			i ? (r = `<svg>${r}</svg>`) : _ && (r = `<math>${r}</math>`);
			var a = C(r);
			if (((i || _) && (a = f(a)), m(f(a), a.lastChild), i || _)) for (; f(a); ) n.before(f(a));
			else n.before(a);
		}
	});
}
export { T as h };
