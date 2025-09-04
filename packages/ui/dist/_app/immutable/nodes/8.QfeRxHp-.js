import { e as s } from '../chunks/KjYeVjkE.js';
import { l as i } from '../chunks/StNmv4ud.js';
import { s as n, a as l } from '../chunks/1HBmZ_db.js';
import { p, f as m, a as c, b as f, c as u, r as d } from '../chunks/BW6z9EX9.js';
import { F as _ } from '../chunks/COBx9nLw.js';
import { t as g } from '../chunks/Dy9FI1NM.js';
const v = async () => {
		const { data: t, err: e } = await i();
		return e ? s(e.code, e.message) : { files: t };
	},
	S = Object.freeze(
		Object.defineProperty({ __proto__: null, load: v }, Symbol.toStringTag, { value: 'Module' })
	);
var b = m('<section><!></section>');
function w(t, e) {
	p(e, !0);
	const [y, o] = l();
	n(g, 'My Drive');
	var r = b(),
		a = u(r);
	(_(a, {
		get data() {
			return e.data.files;
		}
	}),
		d(r),
		c(t, r),
		f(),
		o());
}
export { w as component, S as universal };
