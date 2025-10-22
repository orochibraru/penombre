import {
	p as o,
	f as i,
	d as n,
	o as d,
	q as v,
	u as h,
	v as f,
	r as c,
	b as u,
	c as b
} from './ZGPguNnN.js';
import { c as g } from './BBPflcbS.js';
var m = i('<div class="my-6 w-full overflow-y-auto"><table><!></table></div>');
function $(r, t) {
	o(t, !0);
	let s = v(t, ['$$slots', '$$events', '$$legacy', 'class', 'children']);
	var e = m(),
		a = n(e);
	d(a, (x) => ({ class: x, ...s }), [
		() => g('relative w-full overflow-hidden border-none text-sm', t.class)
	]);
	var l = n(a);
	(h(l, () => t.children ?? f), c(a), c(e), u(r, e), b());
}
var y = i('<td><!></td>');
function q(r, t) {
	o(t, !0);
	let s = v(t, ['$$slots', '$$events', '$$legacy', 'class', 'children']);
	var e = y();
	d(e, (l) => ({ class: l, ...s }), [
		() =>
			g(
				'px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
				t.class
			)
	]);
	var a = n(e);
	(h(a, () => t.children ?? f), c(e), u(r, e), b());
}
var T = i('<th><!></th>');
function j(r, t) {
	o(t, !0);
	let s = v(t, ['$$slots', '$$events', '$$legacy', 'class', 'children']);
	var e = T();
	d(e, (l) => ({ class: l, ...s }), [
		() =>
			g(
				'px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
				t.class
			)
	]);
	var a = n(e);
	(h(a, () => t.children ?? f), c(e), u(r, e), b());
}
var w = i('<tr><!></tr>');
function k(r, t) {
	o(t, !0);
	let s = v(t, ['$$slots', '$$events', '$$legacy', 'class', 'children']);
	var e = w();
	d(e, (l) => ({ class: l, ...s }), [() => g('last:border-b-none m-0 border-b', t.class)]);
	var a = n(e);
	(h(a, () => t.children ?? f), c(e), u(r, e), b());
}
export { $ as T, k as a, j as b, q as c };
