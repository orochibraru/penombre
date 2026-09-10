import type { Share } from "$lib/server/db/schema";

/**
 * Public shape of a share link. Strips `passwordHash` — the API must never
 * hand the hash back, and `ownerId` is implied by who is asking.
 */
export function toShareDto(share: Share) {
	return {
		id: share.id,
		token: share.token,
		resourceType: share.resourceType,
		resourceId: share.resourceId,
		resourceName: share.resourceName,
		hasPassword: share.passwordHash !== null,
		requiresAuth: share.requiresAuth,
		expiresAt: share.expiresAt?.toISOString() ?? null,
		downloadCount: share.downloadCount,
		createdAt: share.createdAt.toISOString(),
	};
}
