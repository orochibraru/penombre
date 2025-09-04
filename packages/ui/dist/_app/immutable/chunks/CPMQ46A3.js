import './1HBmZ_db.js';
import { p as u, b as i, u as o, v as h } from './BW6z9EX9.js';
import { p as r } from './Cic-IlSQ.js';
import { c as w } from './Bvsacp8G.js';
import { L as m } from './ByM4i_p0.js';
function v(s, e) {
	u(e, !0);
	const t = r(e, 'size', 3, 5),
		a = r(e, 'class', 3, '');
	function n() {
		switch (t()) {
			case 1:
				return 'h-1 w-1';
			case 2:
				return 'h-2 w-2';
			case 3:
				return 'h-3 w-3';
			case 4:
				return 'h-4 w-4';
			case 5:
				return 'h-5 w-5';
			case 6:
				return 'h-6 w-6';
			case 7:
				return 'h-7 w-7';
			case 8:
				return 'h-8 w-8';
			case 9:
				return 'h-9 w-9';
			case 10:
				return 'h-10 w-10';
			default:
				return 'h-5 w-5';
		}
	}
	{
		let c = h(() => w('animate-spin', n(), a()));
		m(s, {
			get class() {
				return o(c);
			}
		});
	}
	i();
}
export { v as S };
