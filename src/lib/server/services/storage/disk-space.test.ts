import { afterEach, describe, expect, spyOn, test } from "bun:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";

import { availableDiskSpace, diskSpace } from "./disk-space";

const spies: Array<{ mockRestore: () => void }> = [];

afterEach(() => {
	for (const spy of spies.splice(0)) {
		spy.mockRestore();
	}
});

function statfs(result: unknown) {
	spies.push(
		spyOn(fs, "statfsSync").mockImplementation((() => result) as never),
	);
}

function statfsFails() {
	spies.push(
		spyOn(fs, "statfsSync").mockImplementation((() => {
			throw new Error("unsupported");
		}) as never),
	);
}

function df(output: string) {
	spies.push(
		spyOn(Bun, "spawnSync").mockReturnValue({
			stdout: new TextEncoder().encode(output),
		} as never),
	);
}

describe("diskSpace from statfs", () => {
	test("multiplies blocks by the block size", () => {
		statfs({ bsize: 4096, bavail: 10, blocks: 100 });
		expect(diskSpace("/data")).toEqual({ total: 409_600, available: 40_960 });
		expect(availableDiskSpace("/data")).toBe(40_960);
	});

	test("falls back to the fragment size and free blocks", () => {
		statfs({ frsize: 512, bfree: 4 });
		expect(diskSpace("/data")).toEqual({ total: 0, available: 2048 });
	});

	test("reads a real filesystem", () => {
		const space = diskSpace(tmpdir());
		expect(space.total).toBeGreaterThan(0);
		expect(space.available).toBeGreaterThan(0);
		expect(space.available).toBeLessThanOrEqual(space.total);
	});
});

describe("diskSpace from df", () => {
	test("is used when statfs answers nonsense", () => {
		statfs({ bsize: "lots", bavail: 1 });
		df(
			"Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/a 100 40 60 40% /",
		);
		expect(diskSpace("/data")).toEqual({
			total: 100 * 1024,
			available: 60 * 1024,
		});
	});

	test("finds the Available column by name", () => {
		statfsFails();
		df(
			"Filesystem 1024-blocks Used Available Capacity iused ifree %iused Mounted on\n" +
				"/dev/disk 482797652 424357152 22347388 95% 6330354 223473880 3% /",
		);
		expect(diskSpace("/data")).toEqual({
			total: 482_797_652 * 1024,
			available: 22_347_388 * 1024,
		});
	});

	test("counts back from the mount column when nothing says available", () => {
		statfsFails();
		df("Filesystem Size Used Free Capacity Mounted\n/dev/a 50 20 30 40% /");
		expect(diskSpace("/data")).toEqual({
			total: 50 * 1024,
			available: 30 * 1024,
		});
	});

	test("takes the second to last value when no header helps", () => {
		statfsFails();
		df("A B C D E\n/dev/a 50 20 30 /");
		expect(diskSpace("/data")).toEqual({
			total: 50 * 1024,
			available: 30 * 1024,
		});
	});

	test("an unknown size column still reports what is available", () => {
		statfsFails();
		df("Available\n7");
		expect(diskSpace("/data")).toEqual({ total: 0, available: 7 * 1024 });
	});

	test("reads a real filesystem", () => {
		statfsFails();
		expect(diskSpace(tmpdir()).available).toBeGreaterThan(0);
	});
});

describe("diskSpace when nothing answers", () => {
	test("output with no value line is zero", () => {
		statfsFails();
		df("Filesystem Available");
		expect(diskSpace("/data")).toEqual({ total: 0, available: 0 });
	});

	test("an available value that is not a number is zero", () => {
		statfsFails();
		df("Filesystem Available\n/dev/a lots");
		expect(diskSpace("/data")).toEqual({ total: 0, available: 0 });
	});

	test("a df that cannot run is zero", () => {
		statfsFails();
		spies.push(
			spyOn(Bun, "spawnSync").mockImplementation(() => {
				throw new Error("no df");
			}),
		);
		expect(availableDiskSpace("/data")).toBe(0);
	});

	test("a path that does not exist is zero", () => {
		expect(diskSpace("/does/not/exist/anywhere")).toEqual({
			total: 0,
			available: 0,
		});
	});
});
