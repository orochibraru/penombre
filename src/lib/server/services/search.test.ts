import { afterEach, describe, expect, type Mock, spyOn, test } from "bun:test";

import * as config from "#lib/server/config.js";
import type { ObjectItem } from "#lib/server/schema.js";
import * as drives from "#lib/server/services/drives.js";
import * as storageFor from "#lib/server/services/storage-for.js";
import { StorageService } from "#lib/server/services/storage/service.js";

import { places, searchEverywhere } from "./search";

type User = NonNullable<App.Locals["user"]>;

const ada = { id: "ada", name: "Ada", email: "ada@x.test" } as User;
const owner = { id: "owner", name: "Owner", email: "owner@x.test" } as User;
const team = { id: "d1", name: "Team", ownerId: "owner" };
const media = { name: "media", label: "Media", path: "/mnt/media" };
const archive = { name: "archive", path: "/mnt/archive" };

const restorers: (() => void)[] = [];

function watch<T extends { mockRestore(): void }>(spy: T): T {
	restorers.push(() => spy.mockRestore());
	return spy;
}

/**
 * test.setup's mocks are shared by every suite, and `mockRestore` on one
 * wipes it: swap its behaviour for this test, then put back what it had.
 */
function override<T extends (...args: never[]) => unknown>(
	fn: T,
	implementation: (...args: Parameters<T>) => unknown,
): Mock<T> {
	const mocked = fn as unknown as Mock<T>;
	const previous = mocked.getMockImplementation();
	// A `mockReturnValue` leaves no implementation behind, only its value.
	const value = previous ? undefined : mocked(...([] as Parameters<T>));
	mocked.mockClear();
	mocked.mockImplementation(implementation as unknown as T);
	restorers.push(() => {
		if (previous) {
			mocked.mockImplementation(previous);
		} else {
			mocked.mockReturnValue(value as ReturnType<T>);
		}
	});
	return mocked;
}

afterEach(() => {
	for (const restore of restorers.splice(0).toReversed()) {
		restore();
	}
});

function item(name: string, type: "file" | "folder" = "file"): ObjectItem {
	return { key: name, type, metadata: { id: name, name } } as ObjectItem;
}

/** Each place answers its own hits, or fails. Returns where it searched. */
function placesAnswering(
	answers: Record<string, ObjectItem[] | Error>,
): string[] {
	const opened: string[] = [];
	const search = (where: string) => (term: string) => {
		opened.push(where);
		const answer = answers[where] ?? [];
		if (answer instanceof Error) {
			return Promise.reject(answer);
		}
		expect(term).toBe(term.toLowerCase().trim());
		return Promise.resolve({ list: answer, total: answer.length });
	};
	watch(spyOn(drives.drivesService, "listForUser")).mockResolvedValue([
		{ id: "d1", name: "Team", role: "editor", owner: false },
	]);
	watch(spyOn(drives.drivesService, "requireAccess")).mockResolvedValue({
		drive: team,
		role: "editor",
	} as never);
	watch(spyOn(drives, "driveStorage")).mockResolvedValue({
		searchFiles: search("drive"),
	} as never);
	watch(spyOn(storageFor, "volumeStorage")).mockImplementation(
		async (volume: { name: string }) =>
			({ searchFiles: search(volume.name) }) as never,
	);
	override(config.getVolumes, () => [media]);
	watch(spyOn(StorageService.prototype, "searchFiles")).mockImplementation(
		search("personal") as never,
	);
	return opened;
}

describe("places", () => {
	test("lists the personal drive, every drive and every volume", async () => {
		watch(spyOn(drives.drivesService, "listForUser")).mockResolvedValue([
			{ id: "d1", name: "Team", role: "viewer", owner: false },
		]);
		override(config.getVolumes, () => [media, archive]);

		const found = await places(ada, owner);

		expect(found.map((entry) => entry.place)).toEqual([
			{ kind: "personal", name: "My Drive" },
			{ kind: "drive", id: "d1", name: "Team" },
			{ kind: "volume", id: "media", name: "Media" },
			{ kind: "volume", id: "archive", name: "archive" },
		]);
	});

	test("a drive-only account has neither a personal drive nor volumes", async () => {
		watch(spyOn(drives.drivesService, "listForUser")).mockResolvedValue([
			{ id: "d1", name: "Team", role: "viewer", owner: false },
		]);
		override(config.getVolumes, () => [media]);

		const found = await places({ ...ada, driveOnly: true } as User, owner);

		expect(found.map((entry) => entry.place.kind)).toEqual(["drive"]);
	});

	test("a drive is opened with the caller's role on it, as the caller", async () => {
		watch(spyOn(drives.drivesService, "listForUser")).mockResolvedValue([
			{ id: "d1", name: "Team", role: "viewer", owner: false },
		]);
		const requireAccess = watch(
			spyOn(drives.drivesService, "requireAccess"),
		).mockResolvedValue({ drive: team, role: "viewer" } as never);
		const driveStorage = watch(spyOn(drives, "driveStorage")).mockResolvedValue(
			"drive service" as never,
		);
		override(config.getVolumes, () => []);

		const [, drive] = await places(ada, owner);

		expect(await drive?.open()).toBe("drive service" as never);
		expect(requireAccess).toHaveBeenCalledWith("d1", "ada");
		expect(driveStorage).toHaveBeenCalledWith(team, "viewer", ada);
	});

	test("the personal drive is the storage owner's, a volume the caller's", async () => {
		watch(spyOn(drives.drivesService, "listForUser")).mockResolvedValue([]);
		override(config.getVolumes, () => [media]);
		const volumeStorage = watch(
			spyOn(storageFor, "volumeStorage"),
		).mockResolvedValue("volume service" as never);

		const [personal, volume] = await places(ada, owner);

		const service = (await personal?.open()) as unknown as {
			user: User;
		};
		expect(service).toBeInstanceOf(StorageService);
		expect(service.user).toBe(owner);
		expect(await volume?.open()).toBe("volume service" as never);
		expect(volumeStorage).toHaveBeenCalledWith(media, ada);
	});
});

describe("searchEverywhere", () => {
	test("a blank query searches nowhere", async () => {
		const listForUser = watch(spyOn(drives.drivesService, "listForUser"));
		expect(await searchEverywhere(ada, owner, "   ")).toEqual({
			list: [],
			total: 0,
		});
		expect(listForUser).not.toHaveBeenCalled();
	});

	test("merges every place's hits, tagged with their place, best first", async () => {
		const opened = placesAnswering({
			personal: [item("notes about mix.txt")],
			drive: [item("mix")],
			media: [item("mix stems", "folder")],
		});

		const { list, total } = await searchEverywhere(ada, owner, "  MIX ");

		expect(opened.toSorted()).toEqual(["drive", "media", "personal"]);
		expect(total).toBe(3);
		expect(
			list.map((found) => [found.metadata.name, found.place.kind]),
		).toEqual([
			["mix", "drive"],
			["mix stems", "volume"],
			["notes about mix.txt", "personal"],
		]);
	});

	test("one place that cannot be read leaves the others' results", async () => {
		placesAnswering({
			personal: [item("take.wav")],
			media: new Error("mount gone"),
		});

		const { list, total } = await searchEverywhere(ada, owner, "take");

		expect(list.map((found) => found.metadata.name)).toEqual(["take.wav"]);
		expect(total).toBe(1);
	});

	test("keeps the limit across places while counting every hit", async () => {
		placesAnswering({
			personal: [item("a1"), item("a2")],
			drive: [item("a3")],
			media: [item("a4")],
		});

		const { list, total } = await searchEverywhere(ada, owner, "a", 2);

		expect(list.map((found) => found.metadata.name)).toEqual(["a1", "a2"]);
		expect(total).toBe(4);
	});
});
