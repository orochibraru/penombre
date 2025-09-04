import { aS as D, u as W, aT as Y, U as k, A as F, aU as U, V as H } from './BW6z9EX9.js';
function B(a) {
	let u = 0,
		s = Y(0),
		n;
	return () => {
		D() &&
			(W(s),
			k(
				() => (
					u === 0 && (n = F(() => a(() => U(s)))),
					(u += 1),
					() => {
						H(() => {
							((u -= 1), u === 0 && (n?.(), (n = void 0)));
						});
					}
				)
			));
	};
}
function V(a) {
	return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, 'default') ? a.default : a;
}
var E = {},
	O,
	M;
function x() {
	if (M) return O;
	M = 1;
	var a = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,
		u = /\n/g,
		s = /^\s*/,
		n = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,
		d = /^:\s*/,
		o = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,
		R = /^[;\s]*/,
		g = /^\s+|\s+$/g,
		v = `
`,
		_ = '/',
		l = '*',
		f = '',
		G = 'comment',
		X = 'declaration';
	O = function (t, p) {
		if (typeof t != 'string') throw new TypeError('First argument must be a string');
		if (!t) return [];
		p = p || {};
		var h = 1,
			c = 1;
		function A(e) {
			var r = e.match(u);
			r && (h += r.length);
			var i = e.lastIndexOf(v);
			c = ~i ? e.length - i : c + e.length;
		}
		function S() {
			var e = { line: h, column: c };
			return function (r) {
				return ((r.position = new P(e)), w(), r);
			};
		}
		function P(e) {
			((this.start = e), (this.end = { line: h, column: c }), (this.source = p.source));
		}
		P.prototype.content = t;
		function I(e) {
			var r = new Error(p.source + ':' + h + ':' + c + ': ' + e);
			if (
				((r.reason = e),
				(r.filename = p.source),
				(r.line = h),
				(r.column = c),
				(r.source = t),
				!p.silent)
			)
				throw r;
		}
		function m(e) {
			var r = e.exec(t);
			if (r) {
				var i = r[0];
				return (A(i), (t = t.slice(i.length)), r);
			}
		}
		function w() {
			m(s);
		}
		function b(e) {
			var r;
			for (e = e || []; (r = j()); ) r !== !1 && e.push(r);
			return e;
		}
		function j() {
			var e = S();
			if (!(_ != t.charAt(0) || l != t.charAt(1))) {
				for (var r = 2; f != t.charAt(r) && (l != t.charAt(r) || _ != t.charAt(r + 1)); ) ++r;
				if (((r += 2), f === t.charAt(r - 1))) return I('End of comment missing');
				var i = t.slice(2, r - 2);
				return ((c += 2), A(i), (t = t.slice(r)), (c += 2), e({ type: G, comment: i }));
			}
		}
		function L() {
			var e = S(),
				r = m(n);
			if (r) {
				if ((j(), !m(d))) return I("property missing ':'");
				var i = m(o),
					y = e({ type: X, property: T(r[0].replace(a, f)), value: i ? T(i[0].replace(a, f)) : f });
				return (m(R), y);
			}
		}
		function q() {
			var e = [];
			b(e);
			for (var r; (r = L()); ) r !== !1 && (e.push(r), b(e));
			return e;
		}
		return (w(), q());
	};
	function T(t) {
		return t ? t.replace(g, f) : f;
	}
	return O;
}
var N;
function z() {
	if (N) return E;
	N = 1;
	var a =
		(E && E.__importDefault) ||
		function (n) {
			return n && n.__esModule ? n : { default: n };
		};
	(Object.defineProperty(E, '__esModule', { value: !0 }), (E.default = s));
	var u = a(x());
	function s(n, d) {
		var o = null;
		if (!n || typeof n != 'string') return o;
		var R = (0, u.default)(n),
			g = typeof d == 'function';
		return (
			R.forEach(function (v) {
				if (v.type === 'declaration') {
					var _ = v.property,
						l = v.value;
					g ? d(_, l, v) : l && ((o = o || {}), (o[_] = l));
				}
			}),
			o
		);
	}
	return E;
}
var K = z();
const C = V(K),
	J = C.default || C;
export { B as c, V as g, J as p };
