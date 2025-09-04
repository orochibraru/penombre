import { T as t, U as T, A as b, V as h, W as k } from './BW6z9EX9.js';
function u(r, i) {
	return r === i || r?.[k] === i;
}
function c(r = {}, i, a, A) {
	return (
		t(() => {
			var f, s;
			return (
				T(() => {
					((f = s),
						(s = []),
						b(() => {
							r !== a(...s) && (i(r, ...s), f && u(a(...f), r) && i(null, ...f));
						}));
				}),
				() => {
					h(() => {
						s && u(a(...s), r) && i(null, ...s);
					});
				}
			);
		}),
		r
	);
}
export { c as b };
