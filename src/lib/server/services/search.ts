/**
 * One search over every place the caller can browse: their own drive, the
 * shared drives they belong to and the mounted volumes. Each place is its own
 * storage service, so each is scoped exactly as browsing it would be.
 */

import { Logger } from "#lib/logger.js";
import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { getVolumes } from "#lib/server/config.js";
import type { ObjectItem } from "#lib/server/schema.js";
import { driveStorage, drivesService } from "#lib/server/services/drives.js";
import { compareSearchRelevance } from "#lib/server/services/storage/mappers.js";
import { StorageService } from "#lib/server/services/storage/service.js";
import { volumeStorage } from "#lib/server/services/storage-for.js";

const logger = new Logger("Search");

export interface Place {
	kind: "personal" | "drive" | "volume";
	/** A drive's id or a volume's name; none for the personal drive. */
	id?: string;
	name: string;
}

export type Found = ObjectItem & { place: Place };

type User = NonNullable<App.Locals["user"]>;

/** Every place the caller can browse, each opened as its own service. */
export async function places(
	user: User,
	owner: User,
): Promise<{ place: Place; open: () => Promise<StorageService> }[]> {
	const drives = await drivesService.listForUser(user.id);
	const own = !isDriveOnly(user);
	return [
		...(own
			? [
					{
						place: { kind: "personal", name: "My Drive" } as Place,
						open: () => Promise.resolve(new StorageService(owner)),
					},
				]
			: []),
		...drives.map((drive) => ({
			place: { kind: "drive", id: drive.id, name: drive.name } as Place,
			open: async () => {
				const access = await drivesService.requireAccess(drive.id, user.id);
				return driveStorage(access.drive, access.role, user);
			},
		})),
		...(own ? getVolumes() : []).map((volume) => ({
			place: {
				kind: "volume",
				id: volume.name,
				name: volume.label ?? volume.name,
			} as Place,
			open: () => volumeStorage(volume, user),
		})),
	];
}

export async function searchEverywhere(
	user: User,
	owner: User,
	query: string,
	limit = 50,
): Promise<{ list: Found[]; total: number }> {
	const term = query.toLowerCase().trim();
	if (!term) {
		return { list: [], total: 0 };
	}
	// All at once, and one place that cannot be read (a mount gone away)
	// leaves the others' results standing.
	const settled = await Promise.allSettled(
		(await places(user, owner)).map(async ({ place, open }) => {
			const found = await (await open()).searchFiles(term, limit);
			return {
				total: found.total,
				list: found.list.map((item) => ({ ...item, place })),
			};
		}),
	);
	const list: Found[] = [];
	let total = 0;
	for (const result of settled) {
		if (result.status === "fulfilled") {
			list.push(...result.value.list);
			total += result.value.total;
		} else {
			logger.warn("A place could not be searched:", result.reason);
		}
	}
	list.sort((a, b) => compareSearchRelevance(a, b, term));
	return { list: list.slice(0, limit), total };
}
