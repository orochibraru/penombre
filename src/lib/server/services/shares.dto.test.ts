import { describe, expect, test } from "bun:test";
import type { Share } from "#lib/server/db/schema.js";
import { toShareDto } from "./shares.dto";

const share = {
	id: "s1",
	token: "t",
	ownerId: "u1",
	resourceType: "file",
	resourceId: "f1",
	resourceName: "a.wav",
	passwordHash: "hash",
	requiresAuth: false,
	expiresAt: new Date("2026-01-02T00:00:00Z"),
	downloadCount: 3,
	createdAt: new Date("2026-01-01T00:00:00Z"),
} as Share;

describe("toShareDto", () => {
	test("never hands back the password hash or the owner", () => {
		const dto = toShareDto(share);
		expect(Object.values(dto)).not.toContain("hash");
		expect(dto).not.toHaveProperty("passwordHash");
		expect(dto).not.toHaveProperty("ownerId");
		expect(dto.hasPassword).toBe(true);
		expect(dto.expiresAt).toBe("2026-01-02T00:00:00.000Z");
	});

	test("an open link has no password and no expiry", () => {
		const dto = toShareDto({ ...share, passwordHash: null, expiresAt: null });
		expect(dto.hasPassword).toBe(false);
		expect(dto.expiresAt).toBeNull();
	});
});
