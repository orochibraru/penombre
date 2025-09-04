import { e as u } from '../chunks/KjYeVjkE.js';
import { a as _ } from '../chunks/StNmv4ud.js';
import { s as g, a as h } from '../chunks/1HBmZ_db.js';
import {
	p as b,
	f as l,
	a as o,
	b as y,
	G as i,
	q as $,
	c as n,
	K as T,
	r as m
} from '../chunks/BW6z9EX9.js';
import { F as j } from '../chunks/COBx9nLw.js';
import { B as x } from '../chunks/B00PyzgL.js';
import { t as B } from '../chunks/Dy9FI1NM.js';
import { T as F } from '../chunks/BZM4qE7v.js';
const z = async () => {
		const { data: t, err: r } = await _('trash');
		return r ? u(r.code, r.message) : { files: t };
	},
	D = Object.freeze(
		Object.defineProperty({ __proto__: null, load: z }, Symbol.toStringTag, { value: 'Module' })
	);
var O = l('Empty Trash <!>', 1),
	P = l('<div><div class="mb-3 flex items-center justify-end"><!></div> <!></div>');
function H(t, r) {
	b(r, !0);
	const [S, d] = h();
	g(B, 'Trash');
	var a = P(),
		e = n(a),
		p = n(e);
	(x(p, {
		size: 'sm',
		variant: 'destructive',
		children: (c, q) => {
			T();
			var s = O(),
				v = i($(s));
			(F(v, {}), o(c, s));
		},
		$$slots: { default: !0 }
	}),
		m(e));
	var f = i(e, 2);
	(j(f, {
		get data() {
			return r.data.files;
		}
	}),
		m(a),
		o(t, a),
		y(),
		d());
}
export { H as component, D as universal };
