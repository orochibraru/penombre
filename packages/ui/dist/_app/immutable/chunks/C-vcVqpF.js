import {
	L as u,
	h as l,
	d as m,
	M as _,
	N as p,
	O as h,
	P as v,
	Q as b,
	i as g,
	R as x
} from './BW6z9EX9.js';
function E(i, s, d) {
	l && m();
	var r = i,
		a,
		n,
		e = null,
		t = null;
	function f() {
		(n && (x(n), (n = null)),
			e && (e.lastChild.remove(), r.before(e), (e = null)),
			(n = t),
			(t = null));
	}
	(u(() => {
		if (a !== (a = s())) {
			var c = b();
			if (a) {
				var o = r;
				(c && ((e = document.createDocumentFragment()), e.append((o = p()))),
					(t = h(() => d(o, a))));
			}
			c ? v.add_callback(f) : f();
		}
	}, _),
		l && (r = g));
}
export { E as c };
