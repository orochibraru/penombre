import { afterEach, describe, expect, test } from "bun:test";
import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { isSimpleMode } from "#lib/server/config.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { drivesService } from "./drives";
import { storageServiceFor } from "./storage-for";

const guest = { id: "g", driveOnly: true } as never;

function event(query: string) {
	return {
		url: new URL(`https://penombre.test/?${query}`),
		locals: { user: guest },
	} as never;
}

const requireAccess = drivesService.requireAccess;
afterEach(() => {
	drivesService.requireAccess = requireAccess;
});

describe("a drive-only account", () => {
	test("has no drive, volume or share outside its drives", async () => {
		for (const query of ["", "volume=music", "share=s1"]) {
			const refused = await storageServiceFor(guest, event(query)).catch(
				(error: unknown) => error,
			);
			expect(refused).toBeInstanceOf(DriveAccessError);
			expect((refused as DriveAccessError).status).toBe(404);
		}
	});

	test("still reaches a drive it is a member of", async () => {
		drivesService.requireAccess = (async () => ({
			drive: { id: "d1", name: "Team", ownerId: "owner" },
			role: "editor",
		})) as never;
		// Past the guard, into the drive's own storage (whose owner row this
		// test has no database for).
		const result = await storageServiceFor(guest, event("drive=d1")).catch(
			(error: unknown) => error,
		);
		expect((result as Error).message).not.toBe("No personal drive");
	});

	test("means nothing in simple mode, where everyone shares one drive", () => {
		expect(isDriveOnly(guest)).toBe(true);
		(
			isSimpleMode as unknown as { mockReturnValueOnce: (v: boolean) => void }
		).mockReturnValueOnce(true);
		expect(isDriveOnly(guest)).toBe(false);
		expect(isDriveOnly({ id: "u", driveOnly: false })).toBe(false);
	});
});
