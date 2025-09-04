import {
	at as f,
	az as c,
	af as o,
	aA as l,
	aB as b,
	aC as _,
	u as d,
	I as p
} from './BW6z9EX9.js';
let r = !1,
	u = Symbol();
function m(e, n, t) {
	const s = (t[n] ??= { store: null, source: l(void 0), unsubscribe: o });
	if (s.store !== e && !(u in t))
		if ((s.unsubscribe(), (s.store = e ?? null), e == null))
			((s.source.v = void 0), (s.unsubscribe = o));
		else {
			var i = !0;
			((s.unsubscribe = b(e, (a) => {
				i ? (s.source.v = a) : p(s.source, a);
			})),
				(i = !1));
		}
	return e && u in t ? _(e) : d(s.source);
}
function w(e, n) {
	return (e.set(n), n);
}
function y() {
	const e = {};
	function n() {
		f(() => {
			for (var t in e) e[t].unsubscribe();
			c(e, u, { enumerable: !1, value: !0 });
		});
	}
	return [e, n];
}
function I(e, n, t) {
	return (e.set(t), n);
}
function S(e) {
	var n = r;
	try {
		return ((r = !1), [e(), r]);
	} finally {
		r = n;
	}
}
const v = '5';
typeof window < 'u' && ((window.__svelte ??= {}).v ??= new Set()).add(v);
export { y as a, m as b, S as c, I as d, w as s };
