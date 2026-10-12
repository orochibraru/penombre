import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { driveQuery } from "#lib/server/openapi/v1/storage.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * A PDF's layout and form fields, and its edits written back: what the mobile
 * app overlays on the pages it renders. Coordinates are PDF points in user
 * space (origin bottom left, before the page's rotation).
 */

const rect = z
	.tuple([z.number(), z.number(), z.number(), z.number()])
	.describe("x, y, width, height");
const colour = z
	.tuple([z.number(), z.number(), z.number()])
	.describe("red, green, blue in 0..1");

const pageSchema = z.object({
	x: z.number(),
	y: z.number(),
	width: z.number(),
	height: z.number(),
	rotation: z.union([
		z.literal(0),
		z.literal(90),
		z.literal(180),
		z.literal(270),
	]),
});

const fieldSchema = z.object({
	name: z.string(),
	kind: z.enum([
		"text",
		"checkbox",
		"radio",
		"dropdown",
		"list",
		"button",
		"signature",
	]),
	value: z
		.string()
		.nullable()
		.describe('Text, the chosen option, or "true"/"false" for a checkbox'),
	options: z.array(z.string()),
	readOnly: z.boolean(),
	multiline: z.boolean(),
	widgets: z.array(
		z.object({
			page: z.number(),
			rect,
			option: z.string().nullable().describe("A radio button's own value"),
		}),
	),
});

export const getPdfLayout = defineRoute({
	method: "get",
	path: "/api/v1/storage/file/{id}/pdf",
	summary: "A PDF's pages and form fields",
	description:
		"Each page's crop box and rotation, and every AcroForm field with " +
		"where its widgets sit. `revision` goes back with an edit.",
	tags: ["Storage"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	response: z.object({
		revision: z.string(),
		canWrite: z.boolean(),
		pages: z.array(pageSchema),
		fields: z.array(fieldSchema),
	}),
	errors: [404, 422, 500],
	service: storageServiceFor,
});

const annotationSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("highlight"),
		page: z.number().int().min(0),
		rects: z.array(rect).min(1).max(200),
		color: colour,
	}),
	z.object({
		type: z.literal("ink"),
		page: z.number().int().min(0),
		strokes: z
			.array(z.array(z.number()).min(2).max(20_000))
			.min(1)
			.max(500)
			.describe("Each stroke as flat x, y pairs"),
		color: colour,
		width: z.number().positive().max(48),
	}),
	z.object({
		type: z.literal("note"),
		page: z.number().int().min(0),
		x: z.number(),
		y: z.number(),
		text: z.string().max(5000),
		color: colour,
	}),
]);

export const editPdfFile = defineRoute({
	method: "post",
	path: "/api/v1/storage/file/{id}/pdf",
	summary: "Annotate, fill in or sign a PDF",
	description:
		"Writes highlight, ink and note annotations as PDF annotations, sets " +
		"form fields, and draws signature images into the page. With `base`, " +
		"refused with 409 when the file changed since it was read.",
	tags: ["Storage"],
	params: z.object({ id: z.string() }),
	query: z.object(driveQuery),
	body: z.object({
		base: z
			.string()
			.optional()
			.describe("The revision edited from; 409 when the file changed since"),
		annotations: z.array(annotationSchema).max(500).default([]),
		fields: z.record(z.string(), z.string().max(10_000)).default({}),
		signatures: z
			.array(
				z.object({
					page: z.number().int().min(0),
					rect,
					image: z.string().describe("data:image/png;base64,…"),
				}),
			)
			.max(20)
			.default([]),
	}),
	response: z.object({
		message: z.string(),
		revision: z.string(),
	}),
	errors: [400, 403, 404, 409, 422, 500],
	service: storageServiceFor,
});
