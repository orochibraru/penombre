import type { User } from "better-auth";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";

export async function getUserById(userId: string): Promise<User | null> {
	const match = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	const hasAny = match.length > 0;
	if (!hasAny) {
		return null;
	}

	const [userRecord] = match;
	return userRecord ?? null;
}
