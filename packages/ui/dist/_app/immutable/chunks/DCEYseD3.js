import {
	e as q,
	M as z,
	aD as L,
	aE as W,
	T as D,
	A as k,
	aF as G,
	aq as J,
	V as K,
	af as w,
	aG as V,
	aH as Q,
	J as O,
	ak as R,
	u as F,
	I as j,
	v as X
} from './BW6z9EX9.js';
import { b as Y, w as B } from './DzGRxXYC.js';
const Z = () => performance.now(),
	_ = { tick: (e) => requestAnimationFrame(e), now: () => Z(), tasks: new Set() };
function H() {
	const e = _.now();
	(_.tasks.forEach((t) => {
		t.c(e) || (_.tasks.delete(t), t.f());
	}),
		_.tasks.size !== 0 && _.tick(H));
}
function tt(e) {
	let t;
	return (
		_.tasks.size === 0 && _.tick(H),
		{
			promise: new Promise((s) => {
				_.tasks.add((t = { c: e, f: s }));
			}),
			abort() {
				_.tasks.delete(t);
			}
		}
	);
}
function x(e, t) {
	B(() => {
		e.dispatchEvent(new CustomEvent(t));
	});
}
function st(e) {
	if (e === 'float') return 'cssFloat';
	if (e === 'offset') return 'cssOffset';
	if (e.startsWith('--')) return e;
	const t = e.split('-');
	return t.length === 1
		? t[0]
		: t[0] +
				t
					.slice(1)
					.map((s) => s[0].toUpperCase() + s.slice(1))
					.join('');
}
function M(e) {
	const t = {},
		s = e.split(';');
	for (const r of s) {
		const [o, i] = r.split(':');
		if (!o || i === void 0) break;
		const n = st(o.trim());
		t[n] = i.trim();
	}
	return t;
}
const et = (e) => e;
function dt(e, t, s, r) {
	var o = (e & V) !== 0,
		i = (e & Q) !== 0,
		n = o && i,
		a = (e & G) !== 0,
		m = n ? 'both' : o ? 'in' : 'out',
		u,
		f = t.inert,
		$ = t.style.overflow,
		h,
		g;
	function y() {
		return B(() => (u ??= s()(t, r?.() ?? {}, { direction: m })));
	}
	var d = {
			is_global: a,
			in() {
				if (((t.inert = f), !o)) {
					(g?.abort(), g?.reset?.());
					return;
				}
				(i || h?.abort(),
					x(t, 'introstart'),
					(h = E(t, y(), g, 1, () => {
						(x(t, 'introend'), h?.abort(), (h = u = void 0), (t.style.overflow = $));
					})));
			},
			out(b) {
				if (!i) {
					(b?.(), (u = void 0));
					return;
				}
				((t.inert = !0),
					x(t, 'outrostart'),
					(g = E(t, y(), h, 0, () => {
						(x(t, 'outroend'), b?.());
					})));
			},
			stop: () => {
				(h?.abort(), g?.abort());
			}
		},
		v = q;
	if (((v.transitions ??= []).push(d), o && Y)) {
		var c = a;
		if (!c) {
			for (var p = v.parent; p && (p.f & z) !== 0; ) for (; (p = p.parent) && (p.f & L) === 0; );
			c = !p || (p.f & W) !== 0;
		}
		c &&
			D(() => {
				k(() => d.in());
			});
	}
}
function E(e, t, s, r, o) {
	var i = r === 1;
	if (J(t)) {
		var n,
			a = !1;
		return (
			K(() => {
				if (!a) {
					var v = t({ direction: i ? 'in' : 'out' });
					n = E(e, v, s, r, o);
				}
			}),
			{
				abort: () => {
					((a = !0), n?.abort());
				},
				deactivate: () => n.deactivate(),
				reset: () => n.reset(),
				t: () => n.t()
			}
		);
	}
	if ((s?.deactivate(), !t?.duration))
		return (o(), { abort: w, deactivate: w, reset: w, t: () => r });
	const { delay: m = 0, css: u, tick: f, easing: $ = et } = t;
	var h = [];
	if (i && s === void 0 && (f && f(0, 1), u)) {
		var g = M(u(0, 1));
		h.push(g, g);
	}
	var y = () => 1 - r,
		d = e.animate(h, { duration: m, fill: 'forwards' });
	return (
		(d.onfinish = () => {
			d.cancel();
			var v = s?.t() ?? 1 - r;
			s?.abort();
			var c = r - v,
				p = t.duration * Math.abs(c),
				b = [];
			if (p > 0) {
				var S = !1;
				if (u)
					for (var C = Math.ceil(p / 16.666666666666668), I = 0; I <= C; I += 1) {
						var A = v + c * $(I / C),
							N = M(u(A, 1 - A));
						(b.push(N), (S ||= N.overflow === 'hidden'));
					}
				(S && (e.style.overflow = 'hidden'),
					(y = () => {
						var T = d.currentTime;
						return v + c * $(T / p);
					}),
					f &&
						tt(() => {
							if (d.playState !== 'running') return !1;
							var T = y();
							return (f(T, 1 - T), !0);
						}));
			}
			((d = e.animate(b, { duration: p, fill: 'forwards' })),
				(d.onfinish = () => {
					((y = () => r), f?.(r, 1 - r), o());
				}));
		}),
		{
			abort: () => {
				d && (d.cancel(), (d.effect = null), (d.onfinish = w));
			},
			deactivate: () => {
				o = w;
			},
			reset: () => {
				r === 0 && f?.(1, 0);
			},
			t: () => y()
		}
	);
}
function ht(...e) {
	return e.filter(Boolean).join(' ');
}
const rt = typeof document < 'u';
let P = 0;
class it {
	#t = O(R([]));
	get toasts() {
		return F(this.#t);
	}
	set toasts(t) {
		j(this.#t, t, !0);
	}
	#s = O(R([]));
	get heights() {
		return F(this.#s);
	}
	set heights(t) {
		j(this.#s, t, !0);
	}
	#e = (t) => {
		const s = this.toasts.findIndex((r) => r.id === t);
		return s === -1 ? null : s;
	};
	addToast = (t) => {
		rt && this.toasts.unshift(t);
	};
	updateToast = ({ id: t, data: s, type: r, message: o }) => {
		const i = this.toasts.findIndex((a) => a.id === t),
			n = this.toasts[i];
		this.toasts[i] = { ...n, ...s, id: t, title: o, type: r, updated: !0 };
	};
	create = (t) => {
		const { message: s, ...r } = t,
			o = typeof t?.id == 'number' || (t.id && t.id?.length > 0) ? t.id : P++,
			i = t.dismissable === void 0 ? !0 : t.dismissable,
			n = t.type === void 0 ? 'default' : t.type;
		return (
			k(() => {
				this.toasts.find((m) => m.id === o)
					? this.updateToast({ id: o, data: t, type: n, message: s, dismissable: i })
					: this.addToast({ ...r, id: o, title: s, dismissable: i, type: n });
			}),
			o
		);
	};
	dismiss = (t) => (
		k(() => {
			if (t === void 0) {
				this.toasts = this.toasts.map((r) => ({ ...r, dismiss: !0 }));
				return;
			}
			const s = this.toasts.findIndex((r) => r.id === t);
			this.toasts[s] && (this.toasts[s] = { ...this.toasts[s], dismiss: !0 });
		}),
		t
	);
	remove = (t) => {
		if (t === void 0) {
			this.toasts = [];
			return;
		}
		const s = this.#e(t);
		if (s !== null) return (this.toasts.splice(s, 1), t);
	};
	message = (t, s) => this.create({ ...s, type: 'default', message: t });
	error = (t, s) => this.create({ ...s, type: 'error', message: t });
	success = (t, s) => this.create({ ...s, type: 'success', message: t });
	info = (t, s) => this.create({ ...s, type: 'info', message: t });
	warning = (t, s) => this.create({ ...s, type: 'warning', message: t });
	loading = (t, s) => this.create({ ...s, type: 'loading', message: t });
	promise = (t, s) => {
		if (!s) return;
		let r;
		s.loading !== void 0 &&
			(r = this.create({
				...s,
				promise: t,
				type: 'loading',
				message: typeof s.loading == 'string' ? s.loading : s.loading()
			}));
		const o = t instanceof Promise ? t : t();
		let i = r !== void 0;
		return (
			o
				.then((n) => {
					if (typeof n == 'object' && n && 'ok' in n && typeof n.ok == 'boolean' && !n.ok) {
						i = !1;
						const a = nt(n);
						this.create({ id: r, type: 'error', message: a });
					} else if (s.success !== void 0) {
						i = !1;
						const a = typeof s.success == 'function' ? s.success(n) : s.success;
						this.create({ id: r, type: 'success', message: a });
					}
				})
				.catch((n) => {
					if (s.error !== void 0) {
						i = !1;
						const a = typeof s.error == 'function' ? s.error(n) : s.error;
						this.create({ id: r, type: 'error', message: a });
					}
				})
				.finally(() => {
					(i && (this.dismiss(r), (r = void 0)), s.finally?.());
				}),
			r
		);
	};
	custom = (t, s) => {
		const r = s?.id || P++;
		return (this.create({ component: t, id: r, ...s }), r);
	};
	removeHeight = (t) => {
		this.heights = this.heights.filter((s) => s.toastId !== t);
	};
	setHeight = (t) => {
		const s = this.#e(t.toastId);
		if (s === null) {
			this.heights.push(t);
			return;
		}
		this.heights[s] = t;
	};
	reset = () => {
		((this.toasts = []), (this.heights = []));
	};
}
function nt(e) {
	return e && typeof e == 'object' && 'status' in e
		? `HTTP error! Status: ${e.status}`
		: `Error! ${e}`;
}
const l = new it();
function ot(e, t) {
	return l.create({ message: e, ...t });
}
class pt {
	#t = X(() => l.toasts.filter((t) => !t.dismiss));
	get toasts() {
		return F(this.#t);
	}
}
const at = ot,
	lt = Object.assign(at, {
		success: l.success,
		info: l.info,
		warning: l.warning,
		error: l.error,
		custom: l.custom,
		message: l.message,
		promise: l.promise,
		dismiss: l.dismiss,
		loading: l.loading,
		getActiveToasts: () => l.toasts.filter((e) => !e.dismiss)
	}),
	ct = (e) => e;
function U(e) {
	const t = e - 1;
	return t * t * t + 1;
}
function gt(e, { delay: t = 0, duration: s = 400, easing: r = ct } = {}) {
	const o = +getComputedStyle(e).opacity;
	return { delay: t, duration: s, easing: r, css: (i) => `opacity: ${i * o}` };
}
function vt(e, { delay: t = 0, duration: s = 400, easing: r = U, axis: o = 'y' } = {}) {
	const i = getComputedStyle(e),
		n = +i.opacity,
		a = o === 'y' ? 'height' : 'width',
		m = parseFloat(i[a]),
		u = o === 'y' ? ['top', 'bottom'] : ['left', 'right'],
		f = u.map((c) => `${c[0].toUpperCase()}${c.slice(1)}`),
		$ = parseFloat(i[`padding${f[0]}`]),
		h = parseFloat(i[`padding${f[1]}`]),
		g = parseFloat(i[`margin${f[0]}`]),
		y = parseFloat(i[`margin${f[1]}`]),
		d = parseFloat(i[`border${f[0]}Width`]),
		v = parseFloat(i[`border${f[1]}Width`]);
	return {
		delay: t,
		duration: s,
		easing: r,
		css: (c) =>
			`overflow: hidden;opacity: ${Math.min(c * 20, 1) * n};${a}: ${c * m}px;padding-${u[0]}: ${c * $}px;padding-${u[1]}: ${c * h}px;margin-${u[0]}: ${c * g}px;margin-${u[1]}: ${c * y}px;border-${u[0]}-width: ${c * d}px;border-${u[1]}-width: ${c * v}px;min-${a}: 0`
	};
}
function mt(
	e,
	{ delay: t = 0, duration: s = 400, easing: r = U, start: o = 0, opacity: i = 0 } = {}
) {
	const n = getComputedStyle(e),
		a = +n.opacity,
		m = n.transform === 'none' ? '' : n.transform,
		u = 1 - o,
		f = a * (1 - i);
	return {
		delay: t,
		duration: s,
		easing: r,
		css: ($, h) => `
			transform: ${m} scale(${1 - u * h});
			opacity: ${a - f * h}
		`
	};
}
export { pt as S, dt as a, lt as b, ht as c, vt as d, gt as f, tt as l, _ as r, mt as s, l as t };
