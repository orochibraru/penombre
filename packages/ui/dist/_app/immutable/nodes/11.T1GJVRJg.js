import { e as s } from '../chunks/KjYeVjkE.js';
import { b as i } from '../chunks/StNmv4ud.js';
import { s as n, a as p } from '../chunks/1HBmZ_db.js';
import { p as l, f as m, a as c, b as f, c as d, r as u } from '../chunks/BW6z9EX9.js';
import { F as _ } from '../chunks/COBx9nLw.js';
import { t as v } from '../chunks/Dy9FI1NM.js';
const b = async () => {
		const { data: t, err: e } = await i();
		return e ? s(e.code, e.message) : { files: t };
	},
	S = Object.freeze(
		Object.defineProperty({ __proto__: null, load: b }, Symbol.toStringTag, { value: 'Module' })
	);
var g = m('<div><!></div>');
function w(t, e) {
	l(e, !0);
	const [h, a] = p();
	n(v, 'Recent');
	var r = g(),
		o = d(r);
	(_(o, {
		get data() {
			return e.data.files;
		}
	}),
		u(r),
		c(t, r),
		f(),
		a());
}
export { w as component, S as universal };
