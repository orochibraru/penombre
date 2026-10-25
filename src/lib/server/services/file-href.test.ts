import { beforeEach, describe, expect, type Mock, spyOn, test } from "bun:test";

import * as config from "#lib/server/config.js";
import type { Database } from "#lib/server/db/index.js";
import {
	files,
	folders,
	sharedWith,
	sharings,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { drivesService } from "#lib/server/services/drives.js";

import { fileHref } from "./file-href";

let db: Database;
let grant = "";

const doc = {
	id: "f1",
	name: "Plan.docx",
	ownerId: "owner",
	volumeId: null,
	path: "folder1/f1",
};

beforeEach(async () => {
	db = migratedSqlite();
	await db.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "reader", name: "Reader", email: "reader@x.test" },
		{ id: "stranger", name: "Stranger", email: "stranger@x.test" },
	]);
	await db
		.insert(folders)
		.values({ id: "folder1", name: "Docs", ownerId: "owner", path: "folder1" });
	await db.insert(files).values(doc);
	const [sharing] = await db
		.insert(sharings)
		.values({
			ownerId: "owner",
			resourceType: "folder",
			resourceId: "folder1",
			permission: "read",
		})
		.returning();
	const [row] = await db
		.insert(sharedWith)
		.values({ sharingId: sharing?.id ?? "", userId: "reader" })
		.returning();
	grant = row?.id ?? "";
});

describe("fileHref", () => {
	test("the owner opens an office file in its editor", async () => {
		expect(await fileHref(doc, "owner", "owner", db)).toBe("/edit/f1");
	});

	test("anything else opens in the viewer", async () => {
		const track = { ...doc, name: "take.wav" };
		expect(await fileHref(track, "owner", "owner", db)).toBe("/view/f1");
	});

	test("a sharee opens it through the grant on a folder above it", async () => {
		expect(await fileHref(doc, "reader", "reader", db)).toBe(
			`/edit/f1?share=${grant}`,
		);
	});

	test("someone it was never shared with has no way in", async () => {
		expect(await fileHref(doc, "stranger", "stranger", db)).toBeNull();
	});
});

describe("fileHref outside the personal drive", () => {
	const onDrive = { ...doc, volumeId: "drive:team 1", path: "Docs/Plan.docx" };
	const onVolume = { ...doc, name: "take.wav", volumeId: "media" };

	test("a drive member opens it on the drive", async () => {
		const access = spyOn(drivesService, "requireAccess").mockResolvedValue(
			{} as never,
		);
		try {
			expect(await fileHref(onDrive, "reader", "reader", db)).toBe(
				"/edit/f1?drive=team%201",
			);
			expect(access).toHaveBeenCalledWith("team 1", "reader");
		} finally {
			access.mockRestore();
		}
	});

	test("someone off the drive has no way in", async () => {
		const access = spyOn(drivesService, "requireAccess").mockRejectedValue(
			new DriveAccessError(404, "No such drive"),
		);
		try {
			expect(await fileHref(onDrive, "stranger", "stranger", db)).toBeNull();
		} finally {
			access.mockRestore();
		}
	});

	test("a file on a mounted volume opens there while the volume exists", async () => {
		// test.setup's shared mock: `mockRestore` would wipe it, so put it back.
		const getVolume = config.getVolume as unknown as Mock<
			(name: string) => unknown
		>;
		const previous = getVolume.getMockImplementation();
		const value = previous ? undefined : getVolume("media");
		try {
			getVolume.mockImplementation((name) =>
				name === "media" ? { name } : undefined,
			);
			expect(await fileHref(onVolume, "reader", "owner", db)).toBe(
				"/view/f1?volume=media",
			);
			expect(
				await fileHref(
					{ ...onVolume, volumeId: "gone" },
					"reader",
					"owner",
					db,
				),
			).toBeNull();
		} finally {
			if (previous) {
				getVolume.mockImplementation(previous);
			} else {
				getVolume.mockReturnValue(value);
			}
		}
	});

	test("a grant on the file itself is enough at the drive root", async () => {
		const loose = { ...doc, id: "f2", path: "f2" };
		await db.insert(files).values(loose);
		const [sharing] = await db
			.insert(sharings)
			.values({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "f2",
				permission: "read",
			})
			.returning();
		const [row] = await db
			.insert(sharedWith)
			.values({ sharingId: sharing?.id ?? "", userId: "stranger" })
			.returning();
		expect(await fileHref(loose, "stranger", "stranger", db)).toBe(
			`/edit/f2?share=${row?.id}`,
		);
		expect(await fileHref(loose, "reader", "reader", db)).toBeNull();
	});
});
