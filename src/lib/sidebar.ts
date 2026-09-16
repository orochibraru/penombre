/** Past this many, a sidebar group links to its page for the rest. */
export const SIDEBAR_GROUP_LIMIT = 5;

/**
 * The rows a sidebar group lists, plus how many it left out. The one on screen
 * is always kept, or opening it from the full page would leave nothing
 * highlighted.
 */
export function sidebarItems<T extends { id: string }>(
	items: T[],
	currentId?: string,
): { shown: T[]; hidden: number } {
	if (items.length <= SIDEBAR_GROUP_LIMIT) {
		return { shown: items, hidden: 0 };
	}
	const shown = items.slice(0, SIDEBAR_GROUP_LIMIT);
	const current = items.find((item) => item.id === currentId);
	if (current && !shown.includes(current)) {
		shown.push(current);
	}
	return { shown, hidden: items.length - shown.length };
}
