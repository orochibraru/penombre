import {
	ag as S,
	ah as x,
	ai as A,
	u as P,
	E as y,
	aj as D,
	ak as L,
	I as T,
	al as j,
	e as B,
	am as Y,
	an as K,
	A as M,
	a7 as N,
	ao as U,
	ap as q,
	aq as d,
	W as w,
	ar as O,
	as as $
} from './BW6z9EX9.js';
import { c as z } from './1HBmZ_db.js';
const C = {
	get(e, r) {
		if (!e.exclude.includes(r)) return e.props[r];
	},
	set(e, r) {
		return !1;
	},
	getOwnPropertyDescriptor(e, r) {
		if (!e.exclude.includes(r) && r in e.props)
			return { enumerable: !0, configurable: !0, value: e.props[r] };
	},
	has(e, r) {
		return e.exclude.includes(r) ? !1 : r in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((r) => !e.exclude.includes(r));
	}
};
function F(e, r, t) {
	return new Proxy({ props: e, exclude: r }, C);
}
const G = {
	get(e, r) {
		let t = e.props.length;
		for (; t--; ) {
			let n = e.props[t];
			if ((d(n) && (n = n()), typeof n == 'object' && n !== null && r in n)) return n[r];
		}
	},
	set(e, r, t) {
		let n = e.props.length;
		for (; n--; ) {
			let i = e.props[n];
			d(i) && (i = i());
			const u = S(i, r);
			if (u && u.set) return (u.set(t), !0);
		}
		return !1;
	},
	getOwnPropertyDescriptor(e, r) {
		let t = e.props.length;
		for (; t--; ) {
			let n = e.props[t];
			if ((d(n) && (n = n()), typeof n == 'object' && n !== null && r in n)) {
				const i = S(n, r);
				return (i && !i.configurable && (i.configurable = !0), i);
			}
		}
	},
	has(e, r) {
		if (r === w || r === O) return !1;
		for (let t of e.props) if ((d(t) && (t = t()), t != null && r in t)) return !0;
		return !1;
	},
	ownKeys(e) {
		const r = [];
		for (let t of e.props)
			if ((d(t) && (t = t()), !!t)) {
				for (const n in t) r.includes(n) || r.push(n);
				for (const n of Object.getOwnPropertySymbols(t)) r.includes(n) || r.push(n);
			}
		return r;
	}
};
function H(...e) {
	return new Proxy({ props: e }, G);
}
function J(e, r, t, n) {
	var i = !N || (t & U) !== 0,
		u = (t & K) !== 0,
		I = (t & $) !== 0,
		a = n,
		_ = !0,
		h = () => (_ && ((_ = !1), (a = I ? M(n) : n)), a),
		o;
	if (u) {
		var m = w in e || O in e;
		o = S(e, r)?.set ?? (m && r in e ? (s) => (e[r] = s) : void 0);
	}
	var l,
		g = !1;
	(u ? ([l, g] = z(() => e[r])) : (l = e[r]),
		l === void 0 && n !== void 0 && ((l = h()), o && (i && x(), o(l))));
	var f;
	if (
		(i
			? (f = () => {
					var s = e[r];
					return s === void 0 ? h() : ((_ = !0), s);
				})
			: (f = () => {
					var s = e[r];
					return (s !== void 0 && (a = void 0), s === void 0 ? a : s);
				}),
		i && (t & A) === 0)
	)
		return f;
	if (o) {
		var E = e.$$legacy;
		return function (s, p) {
			return arguments.length > 0 ? ((!i || !p || E || g) && o(p ? f() : s), s) : f();
		};
	}
	var v = !1,
		c = ((t & q) !== 0 ? y : D)(() => ((v = !1), f()));
	u && P(c);
	var R = B;
	return function (s, p) {
		if (arguments.length > 0) {
			const b = p ? P(c) : i && u ? L(s) : s;
			return (T(c, b), (v = !0), a !== void 0 && (a = b), s);
		}
		return (j && v) || (R.f & Y) !== 0 ? c.v : P(c);
	};
}
export { J as p, F as r, H as s };
