import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Readable } from "node:stream";

// ---------------------------------------------------------------------------
// Mock @aws-sdk/client-s3 before importing the driver
// ---------------------------------------------------------------------------

const mockSend = mock(async (_cmd: unknown) => ({}));

class MockS3Client {
	send = mockSend;
}

class MockGetObjectCommand {
	constructor(public readonly input: unknown) {}
}
class MockHeadObjectCommand {
	constructor(public readonly input: unknown) {}
}
class MockPutObjectCommand {
	constructor(public readonly input: unknown) {}
}
class MockDeleteObjectCommand {
	constructor(public readonly input: unknown) {}
}
class MockDeleteObjectsCommand {
	constructor(public readonly input: unknown) {}
}
class MockCopyObjectCommand {
	constructor(public readonly input: unknown) {}
}
class MockListObjectsV2Command {
	constructor(public readonly input: unknown) {}
}

mock.module("@aws-sdk/client-s3", () => ({
	S3Client: MockS3Client,
	GetObjectCommand: MockGetObjectCommand,
	HeadObjectCommand: MockHeadObjectCommand,
	PutObjectCommand: MockPutObjectCommand,
	DeleteObjectCommand: MockDeleteObjectCommand,
	DeleteObjectsCommand: MockDeleteObjectsCommand,
	CopyObjectCommand: MockCopyObjectCommand,
	ListObjectsV2Command: MockListObjectsV2Command,
}));

const { S3StorageDriver } = await import("./s3");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_CONFIG = {
	region: "us-east-1",
	bucket: "test-bucket",
	accessKeyId: "key",
	secretAccessKey: "secret",
	userPrefix: "user-1",
};

function makeDriver(overrides = {}) {
	return new S3StorageDriver({ ...BASE_CONFIG, ...overrides });
}

function mockNodeReadable(content: string): Readable {
	return Readable.from([Buffer.from(content)]);
}

beforeEach(() => {
	mockSend.mockClear();
	mockSend.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// readObject
// ---------------------------------------------------------------------------

describe("readObject", () => {
	test("reads object body and returns ArrayBuffer", async () => {
		const content = "hello s3";
		mockSend.mockResolvedValueOnce({ Body: mockNodeReadable(content) });

		const driver = makeDriver();
		const result = await driver.readObject("file.txt");
		expect(new TextDecoder().decode(result)).toBe(content);
	});

	test("sends GetObjectCommand with correct bucket and key", async () => {
		mockSend.mockResolvedValueOnce({ Body: mockNodeReadable("x") });
		const driver = makeDriver();
		await driver.readObject("some/file.txt");

		const cmd = mockSend.mock.calls[0]?.[0] as MockGetObjectCommand;
		expect(cmd).toBeInstanceOf(MockGetObjectCommand);
		expect(cmd.input).toMatchObject({
			Bucket: "test-bucket",
			Key: "user-1/some/file.txt",
		});
	});

	test("throws when Body is missing", async () => {
		mockSend.mockResolvedValueOnce({ Body: undefined });
		const driver = makeDriver();
		await expect(driver.readObject("missing.txt")).rejects.toThrow(
			"Empty S3 response body",
		);
	});
});

// ---------------------------------------------------------------------------
// getObjectSize
// ---------------------------------------------------------------------------

describe("getObjectSize", () => {
	test("returns ContentLength from HeadObject", async () => {
		mockSend.mockResolvedValueOnce({ ContentLength: 1234 });
		const driver = makeDriver();
		expect(await driver.getObjectSize("file.txt")).toBe(1234);
	});

	test("returns 0 when ContentLength is missing", async () => {
		mockSend.mockResolvedValueOnce({});
		const driver = makeDriver();
		expect(await driver.getObjectSize("file.txt")).toBe(0);
	});

	test("sends HeadObjectCommand with correct key", async () => {
		mockSend.mockResolvedValueOnce({ ContentLength: 0 });
		const driver = makeDriver();
		await driver.getObjectSize("data/img.png");

		const cmd = mockSend.mock.calls[0]?.[0] as MockHeadObjectCommand;
		expect(cmd).toBeInstanceOf(MockHeadObjectCommand);
		expect(cmd.input).toMatchObject({
			Bucket: "test-bucket",
			Key: "user-1/data/img.png",
		});
	});
});

// ---------------------------------------------------------------------------
// writeObject
// ---------------------------------------------------------------------------

describe("writeObject", () => {
	test("sends PutObjectCommand with Uint8Array", async () => {
		const driver = makeDriver();
		const data = new TextEncoder().encode("write me");
		await driver.writeObject("out.txt", data);

		const cmd = mockSend.mock.calls[0]?.[0] as MockPutObjectCommand;
		expect(cmd).toBeInstanceOf(MockPutObjectCommand);
		expect(cmd.input).toMatchObject({
			Bucket: "test-bucket",
			Key: "user-1/out.txt",
		});
	});

	test("sends PutObjectCommand with Blob", async () => {
		const driver = makeDriver();
		const blob = new Blob(["blob"]);
		await driver.writeObject("blob.txt", blob);

		const cmd = mockSend.mock.calls[0]?.[0] as MockPutObjectCommand;
		expect(cmd).toBeInstanceOf(MockPutObjectCommand);
	});

	test("sends PutObjectCommand with ArrayBuffer", async () => {
		const driver = makeDriver();
		const buf = new TextEncoder().encode("ab").buffer;
		await driver.writeObject("ab.txt", buf);

		const cmd = mockSend.mock.calls[0]?.[0] as MockPutObjectCommand;
		expect(cmd).toBeInstanceOf(MockPutObjectCommand);
	});
});

// ---------------------------------------------------------------------------
// deleteObject
// ---------------------------------------------------------------------------

describe("deleteObject", () => {
	test("sends DeleteObjectCommand with correct key", async () => {
		const driver = makeDriver();
		await driver.deleteObject("to-delete.txt");

		const cmd = mockSend.mock.calls[0]?.[0] as MockDeleteObjectCommand;
		expect(cmd).toBeInstanceOf(MockDeleteObjectCommand);
		expect(cmd.input).toMatchObject({
			Bucket: "test-bucket",
			Key: "user-1/to-delete.txt",
		});
	});
});

// ---------------------------------------------------------------------------
// deleteObjectsByPrefix
// ---------------------------------------------------------------------------

describe("deleteObjectsByPrefix", () => {
	test("lists and deletes objects under a prefix", async () => {
		mockSend
			.mockResolvedValueOnce({
				Contents: [
					{ Key: "user-1/folder/a.txt" },
					{ Key: "user-1/folder/b.txt" },
				],
				IsTruncated: false,
			})
			.mockResolvedValueOnce({});

		const driver = makeDriver();
		await driver.deleteObjectsByPrefix("folder/");

		expect(mockSend).toHaveBeenCalledTimes(2);
		const deleteCmd = mockSend.mock.calls[1]?.[0] as MockDeleteObjectsCommand;
		expect(deleteCmd).toBeInstanceOf(MockDeleteObjectsCommand);
	});

	test("uses userPrefix/ when prefix is empty", async () => {
		mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });

		const driver = makeDriver();
		await driver.deleteObjectsByPrefix("");

		const listCmd = mockSend.mock.calls[0]?.[0] as MockListObjectsV2Command;
		expect(listCmd).toBeInstanceOf(MockListObjectsV2Command);
		expect((listCmd.input as { Prefix: string }).Prefix).toBe("user-1/");
	});

	test("handles empty listing (nothing to delete)", async () => {
		mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
		const driver = makeDriver();
		await expect(
			driver.deleteObjectsByPrefix("empty/"),
		).resolves.toBeUndefined();
		expect(mockSend).toHaveBeenCalledTimes(1);
	});

	test("paginates when IsTruncated is true", async () => {
		mockSend
			.mockResolvedValueOnce({
				Contents: [{ Key: "user-1/folder/a.txt" }],
				IsTruncated: true,
				NextContinuationToken: "token1",
			})
			.mockResolvedValueOnce({}) // DeleteObjects for first page
			.mockResolvedValueOnce({
				Contents: [{ Key: "user-1/folder/b.txt" }],
				IsTruncated: false,
			})
			.mockResolvedValueOnce({}); // DeleteObjects for second page

		const driver = makeDriver();
		await driver.deleteObjectsByPrefix("folder/");
		// 2 lists + 2 deletes
		expect(mockSend).toHaveBeenCalledTimes(4);
	});
});

// ---------------------------------------------------------------------------
// copyObject
// ---------------------------------------------------------------------------

describe("copyObject", () => {
	test("sends CopyObjectCommand with correct source and destination", async () => {
		const driver = makeDriver();
		await driver.copyObject("src/file.txt", "dst/file.txt");

		const cmd = mockSend.mock.calls[0]?.[0] as MockCopyObjectCommand;
		expect(cmd).toBeInstanceOf(MockCopyObjectCommand);
		expect(cmd.input).toMatchObject({
			Bucket: "test-bucket",
			CopySource: "test-bucket/user-1/src/file.txt",
			Key: "user-1/dst/file.txt",
		});
	});
});

// ---------------------------------------------------------------------------
// objectExists
// ---------------------------------------------------------------------------

describe("objectExists", () => {
	test("returns true when HeadObject succeeds", async () => {
		mockSend.mockResolvedValueOnce({ ContentLength: 100 });
		const driver = makeDriver();
		expect(await driver.objectExists("exists.txt")).toBe(true);
	});

	test("returns false when HeadObject returns 404", async () => {
		mockSend.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });
		const driver = makeDriver();
		expect(await driver.objectExists("missing.txt")).toBe(false);
	});

	test("returns false when HeadObject throws NotFound", async () => {
		mockSend.mockRejectedValueOnce({ name: "NotFound" });
		const driver = makeDriver();
		expect(await driver.objectExists("missing.txt")).toBe(false);
	});

	test("rethrows unexpected errors", async () => {
		mockSend.mockRejectedValueOnce(new Error("network error"));
		const driver = makeDriver();
		await expect(driver.objectExists("file.txt")).rejects.toThrow(
			"network error",
		);
	});
});

// ---------------------------------------------------------------------------
// listObjectKeys
// ---------------------------------------------------------------------------

describe("listObjectKeys", () => {
	test("returns relative keys stripped of userPrefix", async () => {
		mockSend.mockResolvedValueOnce({
			Contents: [{ Key: "user-1/a/b.txt" }, { Key: "user-1/c.txt" }],
			IsTruncated: false,
		});

		const driver = makeDriver();
		const keys = await driver.listObjectKeys();
		expect(keys.sort()).toEqual(["a/b.txt", "c.txt"].sort());
	});

	test("uses keyed prefix when provided", async () => {
		mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
		const driver = makeDriver();
		await driver.listObjectKeys("sub/");

		const cmd = mockSend.mock.calls[0]?.[0] as MockListObjectsV2Command;
		expect((cmd.input as { Prefix: string }).Prefix).toBe("user-1/sub/");
	});

	test("paginates through all pages", async () => {
		mockSend
			.mockResolvedValueOnce({
				Contents: [{ Key: "user-1/a.txt" }],
				IsTruncated: true,
				NextContinuationToken: "tok",
			})
			.mockResolvedValueOnce({
				Contents: [{ Key: "user-1/b.txt" }],
				IsTruncated: false,
			});

		const driver = makeDriver();
		const keys = await driver.listObjectKeys();
		expect(keys.sort()).toEqual(["a.txt", "b.txt"].sort());
	});

	test("returns empty array when no objects exist", async () => {
		mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
		const driver = makeDriver();
		expect(await driver.listObjectKeys()).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// ensureRootExists
// ---------------------------------------------------------------------------

describe("ensureRootExists", () => {
	test("is a no-op and does not call S3", async () => {
		const driver = makeDriver();
		await driver.ensureRootExists();
		expect(mockSend).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// getObjectStream
// ---------------------------------------------------------------------------

describe("getObjectStream", () => {
	test("returns a ReadableStream", async () => {
		mockSend.mockResolvedValueOnce({ Body: mockNodeReadable("streamed") });
		const driver = makeDriver();
		const stream = await driver.getObjectStream("file.txt");
		expect(stream).toBeInstanceOf(ReadableStream);
	});

	test("sends range header when rangeStart is provided", async () => {
		mockSend.mockResolvedValueOnce({ Body: mockNodeReadable("") });
		const driver = makeDriver();
		await driver.getObjectStream("file.txt", 10, 99);

		const cmd = mockSend.mock.calls[0]?.[0] as MockGetObjectCommand;
		expect((cmd.input as { Range: string }).Range).toBe("bytes=10-99");
	});

	test("sends open-ended range when rangeEnd is undefined", async () => {
		mockSend.mockResolvedValueOnce({ Body: mockNodeReadable("") });
		const driver = makeDriver();
		await driver.getObjectStream("file.txt", 5);

		const cmd = mockSend.mock.calls[0]?.[0] as MockGetObjectCommand;
		expect((cmd.input as { Range: string }).Range).toBe("bytes=5-");
	});
});

// ---------------------------------------------------------------------------
// S3 key construction (s3Key)
// ---------------------------------------------------------------------------

describe("s3Key construction", () => {
	test("constructs key with userPrefix for non-empty key", async () => {
		mockSend.mockResolvedValueOnce({ ContentLength: 0 });
		const driver = makeDriver({ userPrefix: "user-99" });
		await driver.getObjectSize("docs/report.pdf");

		const cmd = mockSend.mock.calls[0]?.[0] as MockHeadObjectCommand;
		expect((cmd.input as { Key: string }).Key).toBe("user-99/docs/report.pdf");
	});

	test("uses just userPrefix when key is empty", async () => {
		mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
		const driver = makeDriver({ userPrefix: "user-99" });
		await driver.listObjectKeys("");

		const cmd = mockSend.mock.calls[0]?.[0] as MockListObjectsV2Command;
		// Empty prefix falls back to `userPrefix/`
		expect((cmd.input as { Prefix: string }).Prefix).toBe("user-99/");
	});
});
