import { Hono } from "hono";
import { cors } from "hono/cors";
import type { CustomRouter } from "$lib/server/api-types";
import { auth } from "$lib/server/auth";
import { activityRouter } from "$lib/server/routes/activity";

const router = new Hono<CustomRouter>({
	strict: false,
});

router.route("/activity", activityRouter);

router.use(
	"/auth/*",
	cors({
		origin: "http://localhost:5173",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

router.use("*", async (c, next) => {
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
});

router.on(["POST", "GET", "OPTIONS"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

export const api = new Hono<CustomRouter>().route("/api", router);

export type Router = typeof router;
