declare module "bun" {
	interface Env {
		DATABASE_URL: string;
		BETTER_AUTH_SECRET: string;
	}
}
