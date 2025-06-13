import { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from "$env/static/private";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./server/db/index";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    socialProviders: {
        github: {
            clientId: OAUTH_CLIENT_ID as string,
            clientSecret: OAUTH_CLIENT_SECRET as string,
        },
    },
});
