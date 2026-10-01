/** How often an open editor says it is still there; the server forgets at 40s. */
export const PRESENCE_INTERVAL_MS = 15_000;

/**
 * One colour per person, the same on every screen. Identity colours like the
 * document kinds', not theme colours: they tell people apart.
 */
const COLOURS = [
	"bg-rose-500",
	"bg-amber-500",
	"bg-emerald-500",
	"bg-sky-500",
	"bg-violet-500",
	"bg-fuchsia-500",
	"bg-teal-500",
	"bg-orange-500",
];

export function colourFor(userId: string): string {
	let hash = 0;
	for (const char of userId) {
		hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
	}
	return COLOURS[hash % COLOURS.length] ?? "bg-sky-500";
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const letters =
		parts.length > 1
			? `${parts[0]?.slice(0, 1)}${parts.at(-1)?.slice(0, 1)}`
			: (parts[0]?.slice(0, 2) ?? "");
	return letters.toUpperCase() || "?";
}

/** The first `max` faces, and how many more there are. */
export function faces<T>(
	people: T[],
	max: number,
): { shown: T[]; more: number } {
	const shown = people.length > max ? people.slice(0, max - 1) : people;
	return { shown, more: people.length - shown.length };
}
