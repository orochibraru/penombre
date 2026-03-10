import { expoClient } from "@better-auth/expo/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/lib/api";

export const authClient = createAuthClient({
	baseURL: API_BASE, // Base URL of your Better Auth backend.
	basePath: "/api/v1/auth", // Base path for auth routes, should match the server configuration.
	plugins: [
		genericOAuthClient(),
		adminClient(),
		passkeyClient(),
		expoClient({
			scheme: "opendrive",
			storagePrefix: "opendrive",
			storage: SecureStore,
		}),
	],
});
