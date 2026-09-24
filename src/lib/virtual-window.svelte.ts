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
/**
 * The row under `y`, given each row's start in `offsets` (one entry per row
 * plus the total): the last row starting at or above `y`.
 */
export function rowAtOffset(offsets: ArrayLike<number>, y: number): number {
	let low = 0;
	let high = offsets.length - 1;
	while (low < high) {
		const mid = (low + high + 1) >> 1;
		if ((offsets[mid] ?? 0) <= y) {
			low = mid;
		} else {
			high = mid - 1;
		}
	}
	return low;
}

export function createWindowVirtualizer(options: {
	count: () => number;
	rowHeight: () => number;
	/**
	 * Per-row heights, for a list mixing two kinds of row (a file and its
	 * shorter versions). Offsets are summed once per change of rows, not per
	 * scroll, and the visible range is a binary search over them.
	 */
	heightOf?: (index: number) => number;
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
	/** `offsets[i]` is where row `i` starts; `offsets[count]` is the total. */
	const offsets = $derived.by(() => {
		const heightOf = options.heightOf;
		if (!heightOf) {
			return null;
		}
		const out = new Float64Array(count + 1);
		for (let i = 0; i < count; i++) {
			out[i + 1] = (out[i] ?? 0) + heightOf(i);
		}
		return out;
	});

	function rowAt(y: number): number {
		return offsets ? rowAtOffset(offsets, y) : Math.floor(y / rowHeight);
	}

	const first = $derived(Math.max(0, rowAt(relativeScroll) - overscan));
	const last = $derived(
		Math.min(count, rowAt(relativeScroll + windowHeight) + 1 + overscan),
	);
	const padTop = $derived(offsets ? (offsets[first] ?? 0) : first * rowHeight);
	const padBottom = $derived(
		offsets
			? (offsets[count] ?? 0) - (offsets[last] ?? 0)
			: (count - last) * rowHeight,
	);

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
