import { e as l } from '../chunks/KjYeVjkE.js';
import { l as p } from '../chunks/StNmv4ud.js';
import { r as n } from '../chunks/Dd5NUPG5.js';
import { s as c, a as f } from '../chunks/1HBmZ_db.js';
import { p as m, z as u, f as h, a as d, b as _, c as b, r as g } from '../chunks/BW6z9EX9.js';
import { F as v } from '../chunks/COBx9nLw.js';
import { t as y } from '../chunks/Dy9FI1NM.js';
const w = async ({ params: o }) => {
		const { data: r, err: s } = await p(o.path);
		if (s) return l(s.code, s.message);
		const e = o.path.split('/'),
			t = [],
			a = [];
		t.push({ title: 'My Drive', href: n('/browse') });
		for (const i of e)
			(t.push({ title: i, href: n('/browse/[...path]', { path: [...a, i] }) }), a.push(i));
		return { files: r, title: e[e.length - 1], folders: e, crumbs: t };
	},
	P = Object.freeze(
		Object.defineProperty({ __proto__: null, load: w }, Symbol.toStringTag, { value: 'Module' })
	);
var F = h('<section><!></section>');
function T(o, r) {
	m(r, !0);
	const [s, e] = f();
	u(() => {
		c(y, r.data.title ?? 'My Drive');
	});
	var t = F(),
		a = b(t);
	(v(a, {
		get data() {
			return r.data.files;
		}
	}),
		g(t),
		d(o, t),
		_(),
		e());
}
export { T as component, P as universal };
