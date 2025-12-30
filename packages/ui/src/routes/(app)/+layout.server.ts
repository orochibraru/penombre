import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { getApiClient } from "$lib/api-client";
import { uploadSchema } from "$lib/schemas/upload";
import type { Activity } from "$lib/server/schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch, locals }) => {
	const client = getApiClient(fetch);

	const res = await client.activity.$get();
	if (!res.ok) {
		throw new Error(`Failed to retrieve user activity: ${res.status}`);
	}

	const activity = (await res.json()) as Activity[];

	if (!locals.user || !locals.session) {
		return error(401, "Unauthorized");
	}

	return {
		user: locals.user,
		session: locals.session,
		activity,
		uploadForm: await superValidate({}, valibot(uploadSchema)),
		authCookie: "123",
	};
};
