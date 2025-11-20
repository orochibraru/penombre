declare module "bun" {
	interface Env {
		ENV: "development" | "production" | "test";
		DATABASE_URL: string;
		BETTER_AUTH_SECRET: string;
	}
}
