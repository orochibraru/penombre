function Y(a) {
	return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, 'default') ? a.default : a;
}
var E, P;
function D() {
	if (P) return E;
	P = 1;
	var a = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,
		d = /\n/g,
		O = /^\s*/,
		T = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,
		w = /^:\s*/,
		I = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,
		S = /^[;\s]*/,
		N = /^\s+|\s+$/g,
		G = `
`,
		f = '/',
		s = '*',
		c = '',
		M = 'comment',
		X = 'declaration';
	E = function (e, o) {
		if (typeof e != 'string') throw new TypeError('First argument must be a string');
		if (!e) return [];
		o = o || {};
		var u = 1,
			i = 1;
		function p(n) {
			var r = n.match(d);
			r && (u += r.length);
			var t = n.lastIndexOf(G);
			i = ~t ? n.length - t : i + n.length;
		}
		function h() {
			var n = { line: u, column: i };
			return function (r) {
				return ((r.position = new m(n)), _(), r);
			};
		}
		function m(n) {
			((this.start = n), (this.end = { line: u, column: i }), (this.source = o.source));
		}
		m.prototype.content = e;
		function R(n) {
			var r = new Error(o.source + ':' + u + ':' + i + ': ' + n);
			if (
				((r.reason = n),
				(r.filename = o.source),
				(r.line = u),
				(r.column = i),
				(r.source = e),
				!o.silent)
			)
				throw r;
		}
		function v(n) {
			var r = n.exec(e);
			if (r) {
				var t = r[0];
				return (p(t), (e = e.slice(t.length)), r);
			}
		}
		function _() {
			v(O);
		}
		function g(n) {
			var r;
			for (n = n || []; (r = A()); ) r !== !1 && n.push(r);
			return n;
		}
		function A() {
			var n = h();
			if (!(f != e.charAt(0) || s != e.charAt(1))) {
				for (var r = 2; c != e.charAt(r) && (s != e.charAt(r) || f != e.charAt(r + 1)); )
					++r;
				if (((r += 2), c === e.charAt(r - 1))) return R('End of comment missing');
				var t = e.slice(2, r - 2);
				return ((i += 2), p(t), (e = e.slice(r)), (i += 2), n({ type: M, comment: t }));
			}
		}
		function C() {
			var n = h(),
				r = v(T);
			if (r) {
				if ((A(), !v(w))) return R("property missing ':'");
				var t = v(I),
					W = n({
						type: X,
						property: l(r[0].replace(a, c)),
						value: t ? l(t[0].replace(a, c)) : c
					});
				return (v(S), W);
			}
		}
		function L() {
			var n = [];
			g(n);
			for (var r; (r = C()); ) r !== !1 && (n.push(r), g(n));
			return n;
		}
		return (_(), L());
	};
	function l(e) {
		return e ? e.replace(N, c) : c;
	}
	return E;
}
var F = D();
const b = Y(F);
export { Y as g, b as p };
