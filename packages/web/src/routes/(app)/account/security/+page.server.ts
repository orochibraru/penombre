import { auth } from "$lib/server/auth";

export const actions = {
	changePassword: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const newPasswordConfirm = formData.get("newPasswordConfirm");

		if (
			typeof currentPassword !== "string" ||
			typeof newPassword !== "string" ||
			typeof newPasswordConfirm !== "string"
		) {
			return { success: false, error: "Invalid form submission." };
		}

		if (newPassword !== newPasswordConfirm) {
			return { success: false, error: "New passwords do not match." };
		}

		try {
			await auth.api.changePassword({
				headers: request.headers,
				body: {
					currentPassword,
					newPassword,
				},
			});
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message || "Failed to change password.",
			};
		}
	},
};
