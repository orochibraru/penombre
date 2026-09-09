import { desc, eq } from "drizzle-orm";
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { activity } from "$lib/server/db/schema";
import type { NewActivity } from "$lib/server/schema";

export class ActivityService {
	private readonly db: ReturnType<typeof getDb>;
	private readonly logger: Logger;

	constructor() {
		this.db = getDb();
		this.logger = new Logger("ActivityService");
	}

	async list() {
		try {
			this.logger.debug("Fetching all activities");
			const activities = await this.db
				.select()
				.from(activity)
				.orderBy(desc(activity.createdAt));
			this.logger.debug(`Fetched ${activities.length} activities`);
			return activities;
		} catch (error) {
			this.logger.error("Failed to fetch activities:", error);
			throw error;
		}
	}

	async register(params: NewActivity): Promise<void> {
		try {
			this.logger.debug(
				`Registering activity for user: ${params.userId}, action: ${params.action}`,
			);
			// A single insert is already atomic — no transaction or prepared
			// statement needed, and the plain form works on both dialects
			// (SQLite's driver has no `.execute()` and takes sync callbacks).
			await this.db.insert(activity).values({
				userId: params.userId,
				action: params.action,
				message: params.message,
				link: params.link,
				level: params.level,
			});
			this.logger.debug("Activity registered");
		} catch (error) {
			this.logger.error("Failed to save activity:", error);
			throw error;
		}
	}

	async get(userId: string, limit = 50) {
		try {
			this.logger.debug(`Fetching activities for user: ${userId}`);
			const activities = await this.db
				.select()
				.from(activity)
				.where(eq(activity.userId, userId))
				.orderBy(desc(activity.createdAt))
				.limit(limit);

			this.logger.debug(
				`Fetched ${activities.length} activities for user: ${userId}`,
			);
			return activities;
		} catch (error) {
			this.logger.error("Failed to fetch user activities:", error);
			throw error;
		}
	}
}
