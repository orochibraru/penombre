/** Page size for keyset-paginated listings. */
export const LISTING_PAGE_SIZE = 200;
/** The most rows the server returns in one page, whatever `limit` asks. */
export const LISTING_MAX_PAGE_SIZE = 500;

/** A first page's query, in the order the user last chose. */
export function firstPageQuery(preferences?: {
	sortColumn?: "name" | "size" | "updatedAt" | null;
	sortDirection?: "asc" | "desc";
}) {
	return {
		limit: String(LISTING_PAGE_SIZE),
		sort: preferences?.sortColumn ?? "updatedAt",
		dir: preferences?.sortDirection ?? "desc",
	};
}

interface Page<T> {
	list: T[];
	nextCursor: string | null;
}

/** The first `count` rows, over as many capped pages as that takes. */
export async function fetchWindow<T>(
	fetchPage: (cursor: string | null, limit: number) => Promise<Page<T> | null>,
	count: number,
): Promise<Page<T> | null> {
	const list: T[] = [];
	let nextCursor: string | null = null;
	do {
		const page = await fetchPage(
			nextCursor,
			Math.min(count - list.length, LISTING_MAX_PAGE_SIZE),
		);
		if (!page) {
			return null;
		}
		list.push(...page.list);
		nextCursor = page.nextCursor;
	} while (nextCursor !== null && list.length < count);
	return { list, nextCursor };
}
