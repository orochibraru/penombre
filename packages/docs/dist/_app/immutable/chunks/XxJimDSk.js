import {
	p as h,
	k as s,
	h as o,
	a as d,
	l as p,
	m,
	o as x,
	q as y,
	u as w,
	v as _,
	b as c,
	c as k
} from './ZGPguNnN.js';
import { r as B, c as V } from './BBPflcbS.js';
const j = B({
	base: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
	variants: {
		variant: {
			default:
				'bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent',
			secondary:
				'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent',
			destructive:
				'bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white',
			outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
		}
	},
	defaultVariants: { variant: 'default' }
});
function P(v, e) {
	h(e, !0);
	let a = s(e, 'ref', 15, null),
		f = s(e, 'variant', 3, 'default'),
		u = y(e, [
			'$$slots',
			'$$events',
			'$$legacy',
			'ref',
			'href',
			'class',
			'variant',
			'children'
		]);
	var t = o(),
		l = d(t);
	(p(
		l,
		() => (e.href ? 'a' : 'span'),
		!1,
		(i, g) => {
			(m(
				i,
				(r) => a(r),
				() => a()
			),
				x(i, (r) => ({ 'data-slot': 'badge', href: e.href, class: r, ...u }), [
					() => V(j({ variant: f() }), e.class)
				]));
			var n = o(),
				b = d(n);
			(w(b, () => e.children ?? _), c(g, n));
		}
	),
		c(v, t),
		k());
}
export { P as B };
