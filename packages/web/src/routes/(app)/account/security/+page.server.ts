import { auth } from "$lib/server/auth";

export const load = async ({ request }) => {
	const apiKeys = await auth.api.listApiKeys({
		headers: request.headers,
	});
	console.log("API Keys:", apiKeys);
	return {
		apiKeys,
	};
};

export const actions = {
	createApiKey: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		if (typeof name !== "string" || !name.trim()) {
			return { success: false, error: "API key name is required." };
		}
		try {
			const newApiKey = await auth.api.createApiKey({
				headers: request.headers,
				body: {
					name,
				},
			});
			return { success: true, apiKey: newApiKey.key };
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message || "Failed to create API key.",
			};
		}
	},
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
