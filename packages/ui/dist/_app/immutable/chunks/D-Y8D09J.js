import './1HBmZ_db.js';
import { p as c, o as b, q as g, u as s, v as h, a as o, b as y, f as u } from './BW6z9EX9.js';
import { i as x } from './ClaijROu.js';
import { r as m, a as n } from './BPMCz5tT.js';
import { m as P, s as k, b as H } from './VBxAmJ30.js';
import { p as S, r as q } from './Cic-IlSQ.js';
import './DzxQehGt.js';
var O = u('<input/>'),
	j = u('<input/>');
function F(l, e) {
	c(e, !0);
	let i = S(e, 'value', 15),
		v = q(e, ['$$slots', '$$events', '$$legacy', 'value']);
	const t = h(() => P(v, { 'aria-hidden': 'true', tabindex: -1, style: k }));
	var p = b(),
		f = g(p);
	{
		var _ = (a) => {
				var r = O();
				(m(r), n(r, () => ({ ...s(t), value: i() })), o(a, r));
			},
			d = (a) => {
				var r = j();
				(m(r), n(r, () => ({ ...s(t) })), H(r, i), o(a, r));
			};
		x(f, (a) => {
			s(t).type === 'checkbox' ? a(_) : a(d, !1);
		});
	}
	(o(l, p), y());
}
export { F as H };
