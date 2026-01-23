import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import type { CustomRouter } from "$lib/server/api-types";
import { auth } from "$lib/server/auth";
import { activityRouter } from "$lib/server/routes/activity";
import preferencesRouter from "$lib/server/routes/preferences";
import { foldersRouter, objectsRouter } from "$lib/server/routes/storage";

// Build the router with method chaining for proper type inference
const app = new Hono<CustomRouter>()
	// Enable compression (gzip/brotli) for all routes - 60-80% size reduction
	.use("*", compress())
	.use(
		"/auth/*",
		cors({
			origin: "http://localhost:5173",
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.use("*", async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			c.set("user", null);
			c.set("session", null);
			await next();
			return;
		}
		c.set("user", session.user);
		c.set("session", session.session);

		await next();
	})
	.on(["POST", "GET", "OPTIONS"], "/auth/*", (c) => {
		return auth.handler(c.req.raw);
	})
	.on(["GET", "HEAD"], "/health", (c) => {
		return c.json({ status: "ok" });
	})
	.route("/activity", activityRouter)
	.route("/preferences", preferencesRouter)
	.route("/storage/folders", foldersRouter)
	.route("/storage/objects", objectsRouter);

export const api = new Hono<CustomRouter>().route("/api", app);

// Export the app type for RPC client
export type AppType = typeof app;
