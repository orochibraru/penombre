import { Hono } from "hono";
import type { CustomRouter } from "$lib/server/api-types";
import type { UserPreferencesData } from "$lib/server/db/schema";
import {
	getUserPreferences,
	updateUserPreferences,
} from "$lib/server/dto/preferences";

const preferencesRouter = new Hono<CustomRouter>()
	/**
	 * GET /preferences - Get current user's preferences
	 */
	.get("/", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const preferences = await getUserPreferences(user.id);
		return c.json(preferences);
	})
	/**
	 * PUT /preferences - Update user preferences
	 */
	.put("/", async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const body = await c.req.json<Partial<UserPreferencesData>>();

		// Validate incoming data
		const validLayouts = ["grid", "list"];
		const validSortColumns = ["name", "size", "updatedAt", null];
		const validSortDirections = ["asc", "desc"];

		const updates: Partial<UserPreferencesData> = {};

		if (body.layout && validLayouts.includes(body.layout)) {
			updates.layout = body.layout;
		}
		if (body.sortColumn !== undefined) {
			if (
				body.sortColumn === null ||
				validSortColumns.includes(body.sortColumn)
			) {
				updates.sortColumn = body.sortColumn;
			}
		}
		if (
			body.sortDirection &&
			validSortDirections.includes(body.sortDirection)
		) {
			updates.sortDirection = body.sortDirection;
		}

		const preferences = await updateUserPreferences(user.id, updates);
		return c.json(preferences);
	});

export default preferencesRouter;
