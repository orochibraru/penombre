import { z } from "zod";
import { defineRoute } from "$lib/server/openapi";

/**
 * Shared drive route definitions: the drives themselves and who is on them.
 *
 * Their *contents* are not here — a drive's files go through the ordinary
 * `/api/v1/storage/**` routes with `?drive=<id>`.
 */

const roleSchema = z.enum(["manager", "editor", "viewer"]);

const driveSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: roleSchema,
	owner: z.boolean(),
});

const memberSchema = z.object({
	userId: z.string(),
	name: z.string(),
	email: z.string(),
	image: z.string().nullable(),
	role: roleSchema,
	owner: z.boolean(),
});

export const listDrives = defineRoute({
	method: "get",
	path: "/api/v1/drives",
	summary: "List shared drives",
	description: "Every drive the caller owns or is a member of",
	tags: ["Drives"],
	response: z.array(driveSchema),
	errors: [500],
});

export const createDrive = defineRoute({
	method: "post",
	path: "/api/v1/drives",
	summary: "Create a shared drive",
	description: "The creator owns the drive and manages it",
	tags: ["Drives"],
	body: z.object({ name: z.string().min(1).max(120) }),
	response: driveSchema,
	errors: [400, 500],
});

export const renameDrive = defineRoute({
	method: "put",
	path: "/api/v1/drives/{id}",
	summary: "Rename a shared drive",
	tags: ["Drives"],
	params: z.object({ id: z.string() }),
	body: z.object({ name: z.string().min(1).max(120) }),
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
});

export const deleteDrive = defineRoute({
	method: "delete",
	path: "/api/v1/drives/{id}",
	summary: "Delete a shared drive",
	description: "Owner only. Deletes the drive and everything in it.",
	tags: ["Drives"],
	params: z.object({ id: z.string() }),
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
});

export const listDriveMembers = defineRoute({
	method: "get",
	path: "/api/v1/drives/{id}/members",
	summary: "List a drive's members",
	tags: ["Drives"],
	params: z.object({ id: z.string() }),
	response: z.array(memberSchema),
	errors: [403, 404, 500],
});

export const addDriveMembers = defineRoute({
	method: "post",
	path: "/api/v1/drives/{id}/members",
	summary: "Add members, or change their role",
	description:
		"Managers only. Users already on the drive are moved to the new role.",
	tags: ["Drives"],
	params: z.object({ id: z.string() }),
	body: z.object({
		userIds: z.array(z.string().min(1)).min(1),
		role: roleSchema.default("editor"),
	}),
	response: z.object({ added: z.array(z.string()) }),
	errors: [400, 403, 404, 500],
});

export const removeDriveMember = defineRoute({
	method: "delete",
	path: "/api/v1/drives/{id}/members/{userId}",
	summary: "Remove a member",
	description: "Managers only, except that anyone may remove themselves",
	tags: ["Drives"],
	params: z.object({ id: z.string(), userId: z.string() }),
	response: z.object({ message: z.string() }),
	errors: [403, 404, 500],
});
