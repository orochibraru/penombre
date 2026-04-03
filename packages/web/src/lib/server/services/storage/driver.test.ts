import { describe, expect, mock, test } from "bun:test";
import type { S3DriverConfig } from "$lib/server/services/storage/driver";
import { LocalStorageDriver } from "$lib/server/services/storage/drivers/local";
import { S3StorageDriver } from "$lib/server/services/storage/drivers/s3";

// Re-establish the real factory using the actual driver classes.
//
// constants.test.ts (alphabetically before this file) mocks "./driver" with a
// dummy, which would make all tests here receive `{ ensureRootExists: ... }`.
// By calling mock.module("./driver", ...) here we override that stale mock.
// Crucially we do NOT mock the sub-driver modules, so local.test.ts / s3.test.ts
// are unaffected by this file.
mock.module("./driver", () => ({
	createStorageDriver: (config: {
		backend: string;
		local?: { storagePath: string };
		s3?: S3DriverConfig;
	}) => {
		if (config.backend === "local") {
			// @ts-expect-error test file
			return new LocalStorageDriver(config.local.storagePath);
		}
		if (config.backend === "s3") {
			if (!config.s3) {
				throw new Error("Missing S3 config");
			}
			return new S3StorageDriver(config.s3);
		}
		throw new Error(`Unsupported backend: ${config.backend}`);
	},
}));

const { createStorageDriver } = await import("./driver");

describe("createStorageDriver", () => {
	test("returns a LocalStorageDriver for local backend", () => {
		const driver = createStorageDriver({
			backend: "local",
			local: { storagePath: "/tmp/test" },
		});
		expect(driver).toBeInstanceOf(LocalStorageDriver);
		// biome-ignore lint/suspicious/noExplicitAny: test access
		expect((driver as any).storagePath).toBe("/tmp/test");
	});

	test("returns an S3StorageDriver for s3 backend", () => {
		const s3Config = {
			region: "us-east-1",
			bucket: "my-bucket",
			accessKeyId: "key",
			secretAccessKey: "secret",
			userPrefix: "user-1",
		};
		const driver = createStorageDriver({ backend: "s3", s3: s3Config });
		expect(driver).toBeInstanceOf(S3StorageDriver);
	});

	test("passes storagePath to LocalStorageDriver", () => {
		const driver = createStorageDriver({
			backend: "local",
			local: { storagePath: "/data/user-abc" },
		});
		// biome-ignore lint/suspicious/noExplicitAny: test access
		expect((driver as any).storagePath).toBe("/data/user-abc");
	});

	test("passes full s3 config to S3StorageDriver", () => {
		const s3Config = {
			endpoint: "https://minio.local",
			region: "eu-west-1",
			bucket: "penombre",
			accessKeyId: "access",
			secretAccessKey: "secret",
			pathStyle: true,
			userPrefix: "user-42",
		};
		const driver = createStorageDriver({ backend: "s3", s3: s3Config });
		expect(driver).toBeInstanceOf(S3StorageDriver);
		// Verify the bucket and userPrefix were wired into the driver
		// biome-ignore lint/suspicious/noExplicitAny: test access
		expect((driver as any).bucket).toBe("penombre");
		// biome-ignore lint/suspicious/noExplicitAny: test access
		expect((driver as any).userPrefix).toBe("user-42");
	});
});
