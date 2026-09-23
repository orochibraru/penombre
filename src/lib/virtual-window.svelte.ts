/**
 * Window-scroll virtualization for a page-level list: only the rows near the
 * viewport stay in the DOM. Same fixed-height + spacer technique as
 * `sheet-editor.svelte`, but driven by the page's own scroll instead of a
 * boxed `overflow-auto` container; file listings scroll with the page, not
 * a fixed-height box (see CLAUDE.md: "nothing between the header and the
 * bottom bar scrolls, so `window.scrollY` is the page's position").
 *
 * `rowHeight` is a function, not a number, so a caller whose row height
 * itself depends on layout (the grid's tiles scale with column width) can
 * hand in a reactive getter instead of a constant.
 */
export function createWindowVirtualizer(options: {
	count: () => number;
	rowHeight: () => number;
	overscan?: number;
}) {
	const overscan = options.overscan ?? 4;
	let containerTop = $state(0);
	let scrollY = $state(0);
	let viewportHeight = $state(0);
	let containerEl: HTMLElement | null = null;

	function measure() {
		if (containerEl) {
			containerTop = containerEl.getBoundingClientRect().top + window.scrollY;
		}
	}

	/** Called from the component's `bind:this` once the container mounts. */
	function bind(el: HTMLElement | null) {
		containerEl = el;
		measure();
	}

	function onScroll() {
		scrollY = window.scrollY;
	}

	function onResize() {
		viewportHeight = window.innerHeight;
		measure();
	}

	const rowHeight = $derived(Math.max(1, options.rowHeight()));
	const relativeScroll = $derived(Math.max(0, scrollY - containerTop));
	// Before the first real measurement (SSR, first paint) assume a tall-ish
	// viewport so nothing near the top renders empty.
	const windowHeight = $derived(viewportHeight || 900);
	const count = $derived(Math.max(0, options.count()));
	const first = $derived(
		Math.max(0, Math.floor(relativeScroll / rowHeight) - overscan),
	);
	const last = $derived(
		Math.min(
			count,
			Math.ceil((relativeScroll + windowHeight) / rowHeight) + overscan,
		),
	);
	const padTop = $derived(first * rowHeight);
	const padBottom = $derived((count - last) * rowHeight);

	return {
		bind,
		onScroll,
		onResize,
		measure,
		get first() {
			return first;
		},
		get last() {
			return last;
		},
		get padTop() {
			return padTop;
		},
		get padBottom() {
			return padBottom;
		},
	};
}
