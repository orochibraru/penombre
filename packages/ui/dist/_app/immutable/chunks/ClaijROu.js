import {
	L as A,
	h as _,
	d as I,
	M as R,
	X as x,
	Y as D,
	Z as F,
	s as L,
	_ as p,
	N as S,
	O as b,
	P as C,
	$ as O,
	Q as P,
	a0 as Y,
	R as Z,
	i as q
} from './BW6z9EX9.js';
function M(T, g, y = !1) {
	_ && I();
	var r = T,
		s = null,
		t = null,
		e = O,
		E = y ? R : 0,
		l = !1;
	const N = (n, a = !0) => {
		((l = !0), o(a, n));
	};
	var f = null;
	function d() {
		f !== null && (f.lastChild.remove(), r.before(f), (f = null));
		var n = e ? s : t,
			a = e ? t : s;
		(n && Y(n),
			a &&
				Z(a, () => {
					e ? (t = null) : (s = null);
				}));
	}
	const o = (n, a) => {
		if (e === (e = n)) return;
		let u = !1;
		if (_) {
			const k = x(r) === D;
			!!e === k && ((r = F()), L(r), p(!1), (u = !0));
		}
		var v = P(),
			i = r;
		if (
			(v && ((f = document.createDocumentFragment()), f.append((i = S()))),
			e ? (s ??= a && b(() => a(i))) : (t ??= a && b(() => a(i))),
			v)
		) {
			var c = C,
				h = e ? s : t,
				m = e ? t : s;
			(h && c.skipped_effects.delete(h), m && c.skipped_effects.add(m), c.add_callback(d));
		} else d();
		u && p(!0);
	};
	(A(() => {
		((l = !1), g(N), l || o(null, null));
	}, E),
		_ && (r = q));
}
export { M as i };
