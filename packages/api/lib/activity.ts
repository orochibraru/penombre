import { db } from "@lib/db";
import { activity } from "@lib/db/schema";
import { logger } from "@lib/logger";
import type { NewActivity } from "@lib/schema";
import { desc, eq } from "drizzle-orm";

export async function registerActivity(params: NewActivity): Promise<void> {
	try {
		await db.transaction(async (tx) => {
			const prepared = tx
				.insert(activity)
				.values({
					userId: params.userId,
					action: params.action,
					message: params.message,
					link: params.link,
					level: params.level,
				})
				.prepare("insert-activity-transaction");

			const result = await prepared.execute();
			return result;
		});
	} catch (error) {
		logger.error("Failed to save activity:", error);
		throw error;
	}
}

export async function getUserActivities(userId: string) {
	const activities = await db
		.select()
		.from(activity)
		.where(eq(activity.userId, userId))
		.orderBy(desc(activity.createdAt));
	return activities;
}

export async function listAllActivities() {
	const activities = await db
		.select()
		.from(activity)
		.orderBy(desc(activity.createdAt));
	return activities;
}
