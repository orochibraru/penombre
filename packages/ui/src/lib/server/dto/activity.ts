import { desc, eq } from "drizzle-orm";
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { activity } from "$lib/server/db/schema";
import type { NewActivity } from "$lib/server/schema";

const logger = new Logger("ActivityService");

export async function registerActivity(params: NewActivity): Promise<void> {
	const db = getDb();
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
	const db = getDb();
	const activities = await db
		.select()
		.from(activity)
		.where(eq(activity.userId, userId))
		.orderBy(desc(activity.createdAt));
	return activities;
}

export async function listAllActivities() {
	const db = getDb();
	const activities = await db
		.select()
		.from(activity)
		.orderBy(desc(activity.createdAt));
	return activities;
}
