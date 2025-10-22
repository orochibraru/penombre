import {
	p as d,
	f as h,
	o as u,
	q as m,
	x as t,
	A as s,
	d as v,
	u as _,
	v as g,
	r as p,
	b,
	c as x
} from './ZGPguNnN.js';
import { c as A } from './BBPflcbS.js';
var W = h('<a><!></a>');
function y(n, e) {
	d(e, !0);
	let o = m(e, ['$$slots', '$$events', '$$legacy', 'class', 'children', 'href']);
	const a = s(() => e.href?.startsWith('/') || e.href?.startsWith('#')),
		f = s(() => (t(a) ? void 0 : 'noopener noreferrer')),
		i = s(() => (t(a) ? void 0 : '_blank'));
	var r = W();
	u(r, (c) => ({ href: e.href, target: t(i), rel: t(f), class: c, ...o }), [
		() => A('font-medium underline underline-offset-4', e.class)
	]);
	var l = v(r);
	(_(l, () => e.children ?? g), p(r), b(n, r), x());
}
export { y as A };
