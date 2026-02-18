import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { Logger } from "$lib/logger";
import type { CustomRouter } from "$lib/server/api-types";
import { auth } from "$lib/server/auth";
import { activityRouter } from "$lib/server/routes/activity";
import preferencesRouter from "$lib/server/routes/preferences";
import { foldersRouter, objectsRouter } from "$lib/server/routes/storage";

const logger = new Logger("API");

// Build the router with method chaining for proper type inference
const app = new Hono<CustomRouter>()
	// Debug logging for all requests
	.use("*", async (c, next) => {
		logger.debug("HONO", "Request received", {
			method: c.req.method,
			path: c.req.path,
			url: c.req.url,
		});
		await next();
		logger.debug("HONO", "Request completed", {
			method: c.req.method,
			path: c.req.path,
			status: c.res.status,
		});
	})
	// Enable compression (gzip/brotli) for all routes EXCEPT multipart uploads
	.use("*", async (c, next) => {
		const contentType = c.req.header("content-type") || "";
		if (contentType.includes("multipart/form-data")) {
			logger.debug("HONO", "Skipping compression for multipart request");
			await next();
			return;
		}
		return compress()(c, next);
	})
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
		logger.debug("SESSION", "Getting session...", { path: c.req.path });
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		logger.debug("SESSION", "Session check complete", {
			hasSession: !!session,
		});
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
