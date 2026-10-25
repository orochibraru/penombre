<script lang="ts">
	import type { SheetState } from "./state.svelte.js";
	import { anchorTop } from "./view.js";

	/**
	 * The sheet's pictures, placed like the charts by their anchor cell so
	 * they scroll with the cells, under the frozen header like them. Shown
	 * only: clicks go through to the cells, and the file keeps them as they
	 * are.
	 */
	const {
		sheet,
		gutter,
		rowHeight,
	}: { sheet: SheetState; gutter: number; rowHeight: number } = $props();

	const colLeft = (col: number) => {
		let x = gutter;
		for (let c = 0; c < col; c++) {
			x += sheet.widthOf(c);
		}
		return x;
	};
</script>

{#each sheet.pictures as picture (picture.id)}
	{@const { anchor } = picture}
	<img
		src={picture.src}
		alt={picture.name ?? ""}
		draggable="false"
		class="pointer-events-none absolute z-6 max-w-none object-fill"
		style="left: {colLeft(anchor.col) + anchor.x}px; top: {anchorTop(
			sheet,
			anchor,
			rowHeight,
		)}px; width: {anchor.width}px; height: {anchor.height}px"
	/>
{/each}
