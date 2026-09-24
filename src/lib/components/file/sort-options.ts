import * as m from "#lib/paraglide/messages.js";
import type { SortColumn, SortDirection } from "#lib/utils.js";

/** The sort menu: a column per group, its two directions as entries. */
export const SORT_GROUPS: Array<{
	column: Exclude<SortColumn, null>;
	label: () => string;
	options: Array<{ direction: SortDirection; label: () => string }>;
}> = [
	{
		column: "name",
		label: m.sort_name,
		options: [
			{ direction: "asc", label: m.sort_name_asc },
			{ direction: "desc", label: m.sort_name_desc },
		],
	},
	{
		column: "size",
		label: m.sort_size,
		options: [
			{ direction: "desc", label: m.sort_size_largest },
			{ direction: "asc", label: m.sort_size_smallest },
		],
	},
	{
		column: "updatedAt",
		label: m.sort_date,
		options: [
			{ direction: "desc", label: m.sort_date_newest },
			{ direction: "asc", label: m.sort_date_oldest },
		],
	},
	{
		column: "type",
		label: m.sort_type,
		options: [
			{ direction: "asc", label: m.sort_type_asc },
			{ direction: "desc", label: m.sort_type_desc },
		],
	},
];
