import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	CHUNK_SIZE,
	isSealed,
	sealedSize,
} from "#lib/server/crypto/envelope.js";

import { EncryptedStorageDriver } from "./encrypted";
import { LocalStorageDriver } from "./local";

const root = mkdtempSync(join(tmpdir(), "penombre-encrypted-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const keys = { current: Buffer.alloc(32, 7), previous: [] };

function driver(encrypt: boolean, keyring = keys) {
	return new EncryptedStorageDriver(
		new LocalStorageDriver(root),
		root,
		keyring,
		encrypt,
	);
}

function pattern(n: number): Uint8Array {
	return Uint8Array.from({ length: n }, (_, i) => i % 251);
}

async function text(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

describe("EncryptedStorageDriver", () => {
	test("seals on write and reads back plaintext", async () => {
		const plain = pattern(2 * CHUNK_SIZE + 3);
		await driver(true).writeObject("a/sealed.bin", plain);
		const onDisk = readFileSync(join(root, "a/sealed.bin"));
		expect(isSealed(onDisk)).toBe(true);
		expect(onDisk.length).toBe(sealedSize(plain.length));
		// No stage file is left beside it.
		expect(readdirSync(join(root, "a"))).toEqual(["sealed.bin"]);

		const d = driver(true);
		expect(new Uint8Array(await d.readObject("a/sealed.bin"))).toEqual(plain);
		expect(await d.getObjectSize("a/sealed.bin")).toBe(plain.length);
		expect(await text(await d.getObjectStream("a/sealed.bin"))).toEqual(plain);
		const start = CHUNK_SIZE - 2;
		const end = CHUNK_SIZE + 5;
		expect(
			await text(await d.getObjectStream("a/sealed.bin", start, end)),
		).toEqual(plain.subarray(start, end + 1));
	});

	test("a stream is sealed as it arrives", async () => {
		const plain = pattern(CHUNK_SIZE + 1);
		await driver(true).writeObject("streamed", new Blob([plain]).stream());
		expect(new Uint8Array(await driver(false).readObject("streamed"))).toEqual(
			plain,
		);
	});

	test("plaintext passes through, and reads sniff whatever the flag says", async () => {
		await driver(false).writeObject(
			"plain.txt",
			new TextEncoder().encode("hi"),
		);
		expect(readFileSync(join(root, "plain.txt"), "utf8")).toBe("hi");
		const d = driver(true);
		expect(await d.getObjectSize("plain.txt")).toBe(2);
		expect(new TextDecoder().decode(await d.readObject("plain.txt"))).toBe(
			"hi",
		);
		expect(
			new TextDecoder().decode(
				await text(await d.getObjectStream("plain.txt")),
			),
		).toBe("hi");
	});

	test("copying a plaintext file into an encrypted root seals the copy", async () => {
		await driver(false).writeObject("src.txt", new TextEncoder().encode("x"));
		await driver(true).copyObject("src.txt", "dest.txt");
		expect(isSealed(readFileSync(join(root, "dest.txt")))).toBe(true);
		await driver(true).copyObject("dest.txt", "raw.txt");
		expect(readFileSync(join(root, "raw.txt"))).toEqual(
			readFileSync(join(root, "dest.txt")),
		);
	});

	test("a sealed file without its key fails loudly", async () => {
		await driver(true).writeObject("locked", new Uint8Array([1]));
		await expect(
			driver(false, { current: undefined, previous: [] }).readObject("locked"),
		).rejects.toThrow("not loaded");
	});

	test("an empty write is still a sealed file", async () => {
		await driver(true).writeObject("empty", new Uint8Array());
		expect(readFileSync(join(root, "empty")).length).toBe(sealedSize(0));
		expect(await driver(true).getObjectSize("empty")).toBe(0);
	});
});

describe("EncryptedStorageDriver writes", () => {
	test("a blob is sealed like bytes", async () => {
		const plain = pattern(CHUNK_SIZE + 9);
		await driver(true).writeObject("blob.bin", new Blob([plain]));
		expect(isSealed(readFileSync(join(root, "blob.bin")))).toBe(true);
		expect(new Uint8Array(await driver(true).readObject("blob.bin"))).toEqual(
			plain,
		);
	});

	test("a failed write leaves neither the file nor its stage", async () => {
		await mkdir(join(root, "failing"), { recursive: true });
		const broken = new ReadableStream<Uint8Array>({
			pull(controller) {
				controller.error(new Error("source went away"));
			},
		});
		await expect(
			driver(true).writeObject("failing/out.bin", broken),
		).rejects.toThrow("source went away");
		expect(readdirSync(join(root, "failing"))).toEqual([]);
	});

	test("without a key, an encrypted root writes plaintext", async () => {
		await driver(true, { current: undefined, previous: [] }).writeObject(
			"unkeyed.txt",
			new TextEncoder().encode("open"),
		);
		expect(readFileSync(join(root, "unkeyed.txt"), "utf8")).toBe("open");
	});
});

describe("EncryptedStorageDriver passes the rest through", () => {
	test("a link of a sealed file is the same sealed bytes", async () => {
		await driver(true).writeObject("linked/src", new TextEncoder().encode("s"));
		await driver(true).linkObject("linked/src", "linked/dest");
		expect(readFileSync(join(root, "linked/dest"))).toEqual(
			readFileSync(join(root, "linked/src")),
		);
		expect(
			new TextDecoder().decode(await driver(false).readObject("linked/dest")),
		).toBe("s");
	});

	test("existence, listing and deletion reach the inner driver", async () => {
		const d = driver(true);
		await d.ensureRootExists();
		await d.writeObject("listed/a", new Uint8Array([1]));
		await d.writeObject("listed/b", new Uint8Array([2]));
		await d.writeObject("listed/c", new Uint8Array([3]));
		expect(await d.objectExists("listed/a")).toBe(true);
		expect((await d.listObjectKeys("listed")).toSorted()).toEqual([
			"listed/a",
			"listed/b",
			"listed/c",
		]);

		await d.deleteObject("listed/a");
		expect(await d.objectExists("listed/a")).toBe(false);
		await d.deleteObjectsByPrefix("listed/");
		expect(await d.objectExists("listed/b")).toBe(false);
		expect(await d.objectExists("listed/c")).toBe(false);
	});

	test("disk space is the inner driver's", () => {
		const inner = new LocalStorageDriver(root);
		spyOn(inner, "getAvailableDiskSpace").mockReturnValue(1234);
		expect(
			new EncryptedStorageDriver(
				inner,
				root,
				keys,
				true,
			).getAvailableDiskSpace(),
		).toBe(1234);
	});
});
