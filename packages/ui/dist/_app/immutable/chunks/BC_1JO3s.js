import {
	L as c,
	h as f,
	d as _,
	m as d,
	l,
	at as u,
	M as h,
	O as m,
	af as v,
	au as y,
	i as o,
	n as g
} from './BW6z9EX9.js';
function E(r, n, ...s) {
	var t = r,
		e = v,
		a;
	(c(() => {
		e !== (e = n()) && (a && (y(a), (a = null)), (a = m(() => e(t, ...s))));
	}, h),
		f && (t = o));
}
function R(r) {
	return (n, ...s) => {
		var t = r(...s),
			e;
		if (f) ((e = o), _());
		else {
			var a = t.render().trim(),
				p = d(a);
			((e = g(p)), n.before(e));
		}
		const i = t.setup?.(e);
		(l(e, e), typeof i == 'function' && u(i));
	};
}
export { R as c, E as s };
