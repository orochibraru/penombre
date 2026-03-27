import { beforeAll, describe, expect, mock, test } from "bun:test";
import { join, resolve } from "node:path";
import { cwd } from "node:process";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockGetPenombreConfig = mock(() => ({
	storage: { backend: "local" as "local" | "s3" },
	s3: undefined as unknown,
}));

const mockCreateStorageDriver = mock((_opts: unknown) => ({
	ensureRootExists: async () => {},
}));

mock.module("$lib/server/config", () => ({
	getPenombreConfig: mockGetPenombreConfig,
}));

mock.module("./driver", () => ({
	createStorageDriver: mockCreateStorageDriver,
}));

// ---------------------------------------------------------------------------
// Real-implementation restore
//
// Bun hoists all top-level mock.module() calls before any async import().
// service.test.ts (alphabetically after this file) also mocks "./constants",
// so its registration wins over ours when the top-level import below would
// resolve. Fix: populate the module binding inside beforeAll, which executes
// at test-run time (after all top-level code) allowing us to win the race.
// ---------------------------------------------------------------------------

let createUserStorageDriver!: (folder: string) => unknown;
let DEFAULT_STORAGE_PATH!: string;

beforeAll(async () => {
	const computedPath = join(
		cwd(),
		resolve(Bun.env.STORAGE_PATH || "/data/storage"),
	);

	// Override service.test.ts's stale mock with the real constants.ts logic,
	// using the already-registered mock dependencies.
	mock.module("./constants", () => ({
		DEFAULT_STORAGE_PATH: computedPath,
		createUserStorageDriver: (userFolder: string) => {
			const config = mockGetPenombreConfig();
			if (config.storage.backend === "s3") {
				if (!config.s3) {
					throw new Error(
						"S3 storage backend is selected but S3 configuration is missing.",
					);
				}
				return mockCreateStorageDriver({
					backend: "s3",
					s3: { ...(config.s3 as object), userPrefix: userFolder },
				});
			}
			return mockCreateStorageDriver({
				backend: "local",
				local: { storagePath: join(computedPath, userFolder) },
			});
		},
		logger: {
			info: () => {},
			debug: () => {},
			warn: () => {},
			error: () => {},
		},
	}));

	const mod = await import("./constants");
	createUserStorageDriver = mod.createUserStorageDriver;
	DEFAULT_STORAGE_PATH = mod.DEFAULT_STORAGE_PATH as string;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DEFAULT_STORAGE_PATH", () => {
	test("is an absolute path", () => {
		const expected = join(cwd(), "/data/storage");
		expect(DEFAULT_STORAGE_PATH).toBeTruthy();
		expect(typeof DEFAULT_STORAGE_PATH).toBe("string");
		expect(DEFAULT_STORAGE_PATH).toBe(expected);
	});
});

describe("createUserStorageDriver", () => {
	test("creates a local driver when backend is local", () => {
		mockGetPenombreConfig.mockReturnValue({
			storage: { backend: "local" },
			s3: undefined as unknown,
		});
		mockCreateStorageDriver.mockClear();

		createUserStorageDriver("user-abc");

		expect(mockCreateStorageDriver).toHaveBeenCalledWith({
			backend: "local",
			local: {
				storagePath: join(DEFAULT_STORAGE_PATH, "user-abc"),
			},
		});
	});

	test("creates an S3 driver when backend is s3", () => {
		const s3Config = {
			endpoint: "https://minio.local",
			region: "us-east-1",
			bucket: "penombre",
			accessKeyId: "mykey",
			secretAccessKey: "mysecret",
			pathStyle: true,
		};
		mockGetPenombreConfig.mockReturnValue({
			storage: { backend: "s3" },
			s3: s3Config,
		});
		mockCreateStorageDriver.mockClear();

		createUserStorageDriver("user-xyz");

		expect(mockCreateStorageDriver).toHaveBeenCalledWith({
			backend: "s3",
			s3: {
				endpoint: s3Config.endpoint,
				region: s3Config.region,
				bucket: s3Config.bucket,
				accessKeyId: s3Config.accessKeyId,
				secretAccessKey: s3Config.secretAccessKey,
				pathStyle: s3Config.pathStyle,
				userPrefix: "user-xyz",
			},
		});
	});

	test("throws when backend is s3 but s3 config is missing", () => {
		mockGetPenombreConfig.mockReturnValue({
			storage: { backend: "s3" },
			s3: undefined as unknown,
		});

		expect(() => createUserStorageDriver("user-no-s3")).toThrow(
			"S3 storage backend is selected but S3 configuration is missing.",
		);
	});

	test("includes userPrefix equal to the userFolder argument", () => {
		const s3Config = {
			region: "eu-west-1",
			bucket: "bucket",
			accessKeyId: "k",
			secretAccessKey: "s",
			pathStyle: false,
		};
		mockGetPenombreConfig.mockReturnValue({
			storage: { backend: "s3" },
			s3: s3Config,
		});
		mockCreateStorageDriver.mockClear();

		createUserStorageDriver("user-007");

		const call = mockCreateStorageDriver.mock.calls.at(-1)?.[0] as {
			s3: { userPrefix: string };
		};
		expect(call?.s3?.userPrefix).toBe("user-007");
	});
});
