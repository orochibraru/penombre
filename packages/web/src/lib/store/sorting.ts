import { type Writable, writable } from "svelte/store";
import type { SortColumn, SortDirection } from "$lib/utils";

export type SortPreference = {
	column: SortColumn;
	direction: SortDirection;
};

const defaultSortPreference: SortPreference = {
	column: "name",
	direction: "asc",
};

export const sortPreferenceStore: Writable<SortPreference> = writable(
	defaultSortPreference,
);

export function loadSortPreference(): SortPreference {
	if (typeof localStorage === "undefined") {
		return defaultSortPreference;
	}

	const stored = localStorage.getItem("sortPreference");
	if (!stored) {
		return defaultSortPreference;
	}

	try {
		const parsed = JSON.parse(stored) as Partial<SortPreference>;
		const validColumns: SortColumn[] = ["name", "size", "updatedAt", null];
		const validDirections: SortDirection[] = ["asc", "desc"];

		if (
			parsed.column !== undefined &&
			validColumns.includes(parsed.column) &&
			parsed.direction &&
			validDirections.includes(parsed.direction)
		) {
			return {
				column: parsed.column,
				direction: parsed.direction,
			};
		}
	} catch {
		// Invalid JSON, return default
	}

	return defaultSortPreference;
}

export function saveSortPreference(preference: SortPreference): void {
	if (typeof localStorage === "undefined") {
		return;
	}
	localStorage.setItem("sortPreference", JSON.stringify(preference));
}
