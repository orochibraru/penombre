import { e as i } from '../chunks/KjYeVjkE.js';
import { a as n } from '../chunks/StNmv4ud.js';
import { s as c, a as l } from '../chunks/1HBmZ_db.js';
import { p as m, z as f, f as p, a as d, b as u, c as g, r as _ } from '../chunks/BW6z9EX9.js';
import { F as y } from '../chunks/COBx9nLw.js';
import { t as v } from '../chunks/Dy9FI1NM.js';
import { a as b } from '../chunks/Bvsacp8G.js';
const F = async ({ params: t }) => {
		const { data: e, err: a } = await n(t.category);
		return a ? i(a.code, a.message) : { files: e, category: t.category };
	},
	x = Object.freeze(
		Object.defineProperty({ __proto__: null, load: F }, Symbol.toStringTag, { value: 'Module' })
	);
var h = p('<div><!></div>');
function B(t, e) {
	m(e, !0);
	const [a, o] = l();
	f(() => {
		c(v, b(e.data.category ?? 'Unknown Category'));
	});
	var r = h(),
		s = g(r);
	(y(s, {
		get data() {
			return e.data.files;
		}
	}),
		_(r),
		d(t, r),
		u(),
		o());
}
export { B as component, x as universal };
