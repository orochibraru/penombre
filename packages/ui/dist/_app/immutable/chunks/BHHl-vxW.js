import {
	a2 as a,
	z as d,
	a3 as i,
	a4 as b,
	w as e,
	a5 as g,
	a6 as f,
	a7 as v,
	A as c,
	a8 as y,
	a9 as h,
	aa as x,
	ab as C,
	ac as S,
	ad as k,
	ae as w
} from './BW6z9EX9.js';
import { h as A, m as j, u as z } from './DzGRxXYC.js';
import { c as D } from './BC_1JO3s.js';
function E() {
	return (i === null && b(), (i.ac ??= new AbortController()).signal);
}
function _(t) {
	(e === null && a(),
		v && e.l !== null
			? r(e).m.push(t)
			: d(() => {
					const n = c(t);
					if (typeof n == 'function') return n;
				}));
}
function M(t) {
	(e === null && a(), _(() => () => c(t)));
}
function O(t, n, { bubbles: s = !1, cancelable: l = !1 } = {}) {
	return new CustomEvent(t, { detail: n, bubbles: s, cancelable: l });
}
function P() {
	const t = e;
	return (
		t === null && a(),
		(n, s, l) => {
			const o = t.s.$$events?.[n];
			if (o) {
				const p = g(o) ? o.slice() : [o],
					u = O(n, s, l);
				for (const m of p) m.call(t.x, u);
				return !u.defaultPrevented;
			}
			return !0;
		}
	);
}
function U(t) {
	(e === null && a(), e.l === null && f(), r(e).b.push(t));
}
function $(t) {
	(e === null && a(), e.l === null && f(), r(e).a.push(t));
}
function r(t) {
	var n = t.l;
	return (n.u ??= { a: [], b: [], m: [] });
}
const B = Object.freeze(
	Object.defineProperty(
		{
			__proto__: null,
			afterUpdate: $,
			beforeUpdate: U,
			createEventDispatcher: P,
			createRawSnippet: D,
			flushSync: y,
			getAbortSignal: E,
			getAllContexts: h,
			getContext: x,
			hasContext: C,
			hydrate: A,
			mount: j,
			onDestroy: M,
			onMount: _,
			setContext: S,
			settled: k,
			tick: w,
			unmount: z,
			untrack: c
		},
		Symbol.toStringTag,
		{ value: 'Module' }
	)
);
export { M as a, _ as o, B as s };
