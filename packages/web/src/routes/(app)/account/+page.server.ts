import { fail } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

export const load = () => {};

export const actions = {
	updateAccount: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (!name || !email) {
			return fail(400, { error: "Name and email are required" });
		}

		// Here you would typically update the user's account details in your database
		console.log("Updating account with name:", name, "and email:", email);

		try {
			const res = await auth.api.updateUser({
				body: {
					name: String(name),
				},
				headers: request.headers,
			});

			if (!res.status) {
				return fail(500, { error: "Failed to update account details" });
			}

			return { success: true };
		} catch (error) {
			console.error("Error updating account details:", error);
			return fail(500, {
				error: "An unexpected error occurred while updating account details",
			});
		}
	},
};
