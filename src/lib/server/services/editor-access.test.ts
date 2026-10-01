import { describe, expect, test } from "bun:test";
import { ReadOnlyVolumeError } from "#lib/server/errors.js";
import { Http } from "#lib/server/http.js";
import { driveVolume } from "./drives";
import { editorAccess } from "./editor-access";
import { StorageService } from "./storage/service";

const owner = {
	id: "owner",
	name: "Owner",
	email: "owner@x.test",
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};
const reader = { ...owner, id: "reader", name: "Reader" };
const url = new URL("https://penombre.test/edit/f1");

/** Each built the way `storageServiceFor` builds it for that caller. */
const readOnlyServices = {
	"a read grant": new StorageService(owner, undefined, reader, {
		scope: { kind: "file", fileId: "f1", folderId: null },
		readOnly: true,
	}),
	"a drive viewer": new StorageService(
		owner,
		driveVolume(
			{ id: "d1", name: "Team", ownerId: "owner" } as never,
			"viewer",
		),
		reader,
	),
	"a read-only volume": new StorageService(
		owner,
		{ name: "archive", label: "Archive", path: "/tmp/archive", readOnly: true },
		reader,
	),
};

describe("editor access", () => {
	for (const [who, service] of Object.entries(readOnlyServices)) {
		test(`${who} opens in view mode and cannot save`, () => {
			expect(editorAccess(service, url).canWrite).toBe(false);
			expect(() =>
				service.uploadFileBody("f1", new Uint8Array([1]), { snapshot: false }),
			).toThrow(ReadOnlyVolumeError);
		});
	}

	test("the owner can edit and share", () => {
		expect(editorAccess(new StorageService(owner), url)).toEqual({
			canWrite: true,
			canShare: true,
		});
	});

	test("an editor through a share cannot share it on", () => {
		const shared = new URL("https://penombre.test/edit/f1?share=s1");
		expect(editorAccess({ readOnly: false }, shared)).toEqual({
			canWrite: true,
			canShare: false,
		});
	});

	test("a save route that swallows the refusal still answers 403", () => {
		const response = Http.ServerError("Save error", new ReadOnlyVolumeError());
		expect(response.status).toBe(403);
	});
});
