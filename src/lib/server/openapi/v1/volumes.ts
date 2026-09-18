import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

/**
 * Mounted volume route definitions.
 * Importing this module registers all volume routes with the OpenAPI registry.
 */

const volumeParams = z.object({ name: z.string().min(1) });

export const scanStatusSchema = z.object({
	scanning: z.boolean(),
	step: z
		.object({
			phase: z.enum(["listing", "folders", "files", "cleanup"]),
			current: z.string().optional(),
			done: z.number(),
			total: z.number(),
		})
		.optional(),
	etaSeconds: z.number().optional(),
});

export const rescanVolume = defineRoute({
	method: "post",
	path: "/api/v1/volumes/{name}/scan",
	summary: "Rescan a mounted volume",
	description:
		"Starts a reconciliation pass now, skipping the cooldown. Does nothing when one is already running.",
	tags: ["Volumes"],
	params: volumeParams,
	body: z.object({
		// `full` re-reads every file's type, duration and thumbnails.
		mode: z.enum(["quick", "full"]).default("quick"),
	}),
	response: z.object({ started: z.boolean() }),
	errors: [404],
});

export const volumeScanEvents = defineRoute({
	method: "get",
	path: "/api/v1/volumes/{name}/scan/events",
	summary: "Follow a volume's scan",
	description:
		"A `text/event-stream` of scan status: the current state at once, then every change until the client disconnects. Each event's data has the response's shape.",
	tags: ["Volumes"],
	params: volumeParams,
	response: scanStatusSchema,
	errors: [404],
});
