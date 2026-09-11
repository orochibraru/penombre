import type { ObjectItem } from "$lib/api";

/**
 * Range selection shared by the list and grid views.
 *
 * The anchor is module state rather than a prop: only one file view is mounted
 * at a time, and threading it through every layer would touch six components
 * to hold one string. Switching folders resets it, since the keys it refers to
 * are gone.
 */
let anchor = $state<string | null>(null);

/** Whether the shift key was down for the click currently being handled. */
let shiftHeld = $state(false);

export function setShiftHeld(value: boolean) {
	shiftHeld = value;
}

export function clearSelectionAnchor() {
	anchor = null;
}

type Checked = Record<string, string | false>;

const label = (item: ObjectItem) => item.metadata.name || item.key;

/** Set every item between two indices to the same state. */
function setRange(
	items: ObjectItem[],
	bounds: { from: number; to: number },
	checked: boolean,
	checkedItems: Checked,
): void {
	const { from, to } = bounds;
	const [start, end] = from <= to ? [from, to] : [to, from];
	for (let i = start; i <= end; i++) {
		const item = items[i];
		if (item) {
			checkedItems[item.key] = checked ? label(item) : false;
		}
	}
}

/**
 * Apply a click on `key`'s checkbox.
 *
 * With shift held and an anchor set, every item between the two — in the order
 * currently on screen, so it matches what the eye expects after a re-sort — is
 * set to the same state. Otherwise it is a plain toggle and the item becomes
 * the new anchor.
 *
 * Returns the resulting checked state of `key`, so callers can update any
 * derived flags of their own.
 */
export function applySelection(
	items: ObjectItem[],
	key: string,
	checked: boolean,
	checkedItems: Checked,
): boolean {
	const target = items.findIndex((item) => item.key === key);
	const start = anchor ? items.findIndex((item) => item.key === anchor) : -1;

	// A shift-click with no usable anchor degrades to a normal click rather
	// than doing nothing, which is what every file manager does.
	if (shiftHeld && start !== -1 && target !== -1) {
		setRange(items, { from: start, to: target }, checked, checkedItems);
		return checked;
	}

	const item = items[target];
	checkedItems[key] = checked && item ? label(item) : false;
	anchor = checked ? key : null;
	return checked;
}

/** How many of `items` are currently selected. */
export function selectedCount(
	items: ObjectItem[] | undefined,
	checkedItems: Checked,
): number {
	return (items ?? []).filter((item) => !!checkedItems[item.key]).length;
}
