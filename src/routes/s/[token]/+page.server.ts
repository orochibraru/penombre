import { error, fail } from "@sveltejs/kit";
import type { User } from "better-auth";
import { getConfig } from "#lib/server/config.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import type { ObjectItem } from "#lib/server/schema.js";
import {
	ShareService,
	unlockCookieName,
	unlockToken,
} from "#lib/server/services/shares.js";
import { StorageService } from "#lib/server/services/storage/index.js";

const shares = new ShareService();

/** Serving a share runs as its owner — the visitor has no drive of their own. */
function ownerService(ownerId: string) {
	return new StorageService({ id: ownerId } as User);
}

/**
 * Only what an anonymous visitor needs to see or download a file: no owner
 * id, tags, star or trash state.
 */
function toPublicDto(item: ObjectItem) {
	return {
		key: item.key,
		size: item.size ?? 0,
		metadata: {
			id: item.metadata.id,
			name: item.metadata.name ?? "",
			category: item.metadata.category,
			contentType: item.metadata.contentType,
		},
	};
}

export const load = async ({ params, locals, cookies }) => {
	const { token } = params;
	const result = await shares.access(token, {
		viewer: locals.user ?? null,
		unlock: cookies.get(unlockCookieName(token)) ?? null,
	});

	const appName = getConfig().appName;

	if (!result.ok) {
		if (result.reason === "not-found") {
			return error(404, "This link does not exist or has been revoked.");
		}
		// Everything else is a state the page renders rather than an error, so
		// a visitor can type a password or sign in without losing the URL.
		return { appName, state: result.reason, token };
	}

	const { share } = result;
	const service = ownerService(share.ownerId);

	if (share.resourceType === "file") {
		const path = await service.findFileById(share.resourceId);
		if (!path) {
			return error(404, "The shared file is no longer available.");
		}
		const meta = await service.getFile(path);
		if (meta.metadata.isTrashed) {
			// The owner binning it should stop it serving to anyone the link
			// was handed to, the same as it stops listing for the owner.
			return error(404, "The shared file is no longer available.");
		}
		return {
			appName,
			state: "ok" as const,
			token,
			resourceType: "file" as const,
			name: share.resourceName,
			expiresAt: share.expiresAt?.toISOString() ?? null,
			files: [toPublicDto(meta)],
		};
	}

	const folderPath = await service.getFolder(share.resourceId);
	const listing = await service.listFiles(folderPath);
	return {
		appName,
		state: "ok" as const,
		token,
		resourceType: "folder" as const,
		name: share.resourceName,
		expiresAt: share.expiresAt?.toISOString() ?? null,
		files: listing.list
			.filter((item) => !item.metadata.isTrashed)
			.map(toPublicDto),
	};
};

export const actions = {
	unlock: async ({ params, request, cookies, locals, getClientAddress }) => {
		const form = await request.formData();
		const password = form.get("password");
		if (typeof password !== "string" || !password) {
			return fail(400, { error: "Password is required." });
		}

		// IP first, and only: a client posting unique fake tokens must not mint
		// one never-freed cache entry per request, so the token check runs only
		// once the IP check has not already tripped.
		if (
			await isRateLimited(`share-unlock:ip:${getClientAddress()}`, {
				max: 20,
				windowSeconds: 5 * 60,
			})
		) {
			return fail(429, { error: "Too many attempts. Try again later." });
		}

		// Caps a distributed attempt against one share from many IPs, but only
		// once the token names a real share, for the same reason.
		const share = await shares.findByToken(params.token);
		if (
			share &&
			(await isRateLimited(`share-unlock:token:${params.token}`, {
				max: 20,
				windowSeconds: 5 * 60,
			}))
		) {
			return fail(429, { error: "Too many attempts. Try again later." });
		}

		const result = await shares.access(params.token, {
			viewer: locals.user ?? null,
			password,
		});

		if (!result.ok) {
			return fail(401, { error: "Wrong password." });
		}

		// Scoped to this one share's path so the proof can't leak sideways.
		cookies.set(
			unlockCookieName(params.token),
			await unlockToken(result.share),
			{
				path: `/s/${params.token}`,
				httpOnly: true,
				sameSite: "lax",
				secure: !getConfig().origin.startsWith("http://"),
				maxAge: 60 * 60 * 12,
			},
		);

		return { success: true };
	},
};
