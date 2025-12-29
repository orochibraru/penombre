import { Hono } from "hono";
import { type AuthType, auth } from "$lib/server/auth";
import { activityRouter } from "$lib/server/routes/activity";

const router = new Hono<{ Bindings: AuthType }>({
	strict: false,
});
router.route("/activity", activityRouter);
router.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

export const api = new Hono().route("/api", router);
