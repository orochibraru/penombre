import process from "node:process";
export const API_BASE =
	process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
