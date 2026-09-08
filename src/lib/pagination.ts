import { page as pageState } from "$app/state";

export interface PaginationParams {
	page: number;
	limit: number;
}

export const PaginationDefaults: PaginationParams = {
	limit: 20,
	page: 1,
};

interface INewPagination {
	url: URL;
	limit?: number;
	page?: number;
}

interface IGetTotalPages {
	count: number;
}

export class PaginationHelper {
	url: URL;
	limit = PaginationDefaults.limit;
	page = PaginationDefaults.page;

	constructor({ url, limit, page }: INewPagination) {
		this.url = url;
		this.limit = limit ?? PaginationDefaults.limit;
		this.page = page ?? PaginationDefaults.page;
	}

	/**
	 * Gets the current pagination page from the URL.
	 * @returns
	 */
	public get(): PaginationParams {
		const pageParam = this.url.searchParams.get("page") ?? "";
		const limitParam = this.url.searchParams.get("limit") ?? "";
		this.page = pageParam === "" ? PaginationDefaults.page : Number(pageParam);

		this.limit =
			limitParam === "" ? PaginationDefaults.limit : Number(limitParam);

		return { page: this.page, limit: this.limit };
	}

	public set({ limit, page }: PaginationParams) {
		this.limit = limit;
		this.page = page;

		this.url.searchParams.set("page", page.toString());
		this.url.searchParams.set("limit", limit.toString());

		pageState.url.searchParams.set("page", page.toString());
		pageState.url.searchParams.set("limit", limit.toString());
	}

	/**
	 * Calculates the total number of pages based on the count of items and the
	 * current limit.
	 * @param {IGetTotalPages} options
	 * @returns {number} The total number of pages.
	 */
	public getPageCount({ count }: IGetTotalPages): number {
		return Math.ceil(count / this.limit);
	}
}
