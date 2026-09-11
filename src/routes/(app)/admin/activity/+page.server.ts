import { ActivityService } from "$lib/server/services/activity";

const PAGE_SIZE = 100;

const activityService = new ActivityService();

export const load = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
	const { rows, total } = await activityService.audit(
		PAGE_SIZE,
		(page - 1) * PAGE_SIZE,
	);

	return {
		entries: rows.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
		})),
		page,
		pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		total,
	};
};
