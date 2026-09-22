import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import vectors from "../../../../tests/fixtures/envelope-v1.json" with {
	type: "json",
};
import {
	CHUNK_SIZE,
	HEADER_SIZE,
	isSealed,
	KeyMissingError,
	keyId,
	openHeader,
	openRange,
	openWhole,
	plainSize,
	type SealedSource,
	seal,
	sealedSize,
	sealStream,
	TAG_SIZE,
} from "./envelope";

function pattern(n: number): Buffer {
	const b = Buffer.alloc(n);
	for (let i = 0; i < n; i++) {
		b[i] = i % 251;
	}
	return b;
}

const key = (byte: number) => Buffer.alloc(32, byte);

function source(bytes: Uint8Array): SealedSource {
	return {
		size: bytes.byteLength,
		read: (offset, length) =>
			Promise.resolve(bytes.subarray(offset, offset + length)),
	};
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
	return Buffer.from(await new Response(stream).arrayBuffer());
}

async function sealStreamed(kek: Buffer, plain: Uint8Array): Promise<Buffer> {
	const input = new ReadableStream<Uint8Array>({
		start(controller) {
			// Odd piece sizes, so chunking never depends on how bytes arrive.
			for (let at = 0; at < plain.byteLength; at += 7000) {
				controller.enqueue(plain.subarray(at, at + 7000));
			}
			controller.close();
		},
	});
	return collect(sealStream(kek, input));
}

describe("envelope v1", () => {
	test("reproduces the shared vectors", () => {
		const kek = Buffer.from(vectors.kek, "hex");
		expect(keyId(kek).toString("hex")).toBe(vectors.keyId);
		for (const c of vectors.cases) {
			const sealed = seal(
				kek,
				pattern(c.plain),
				Buffer.from(vectors.dek, "hex"),
				Buffer.from(vectors.nonce, "hex"),
			);
			expect(sealed.length).toBe(c.sealedSize);
			expect(sealedSize(c.plain)).toBe(c.sealedSize);
			expect(createHash("sha256").update(sealed).digest("hex")).toBe(
				c.sealedSha256,
			);
			if (c.sealedHex) {
				expect(sealed.toString("hex")).toBe(c.sealedHex);
			}
			expect(openWhole({ current: kek, previous: [] }, sealed)).toEqual(
				pattern(c.plain),
			);
		}
	});

	test("plainSize inverts sealedSize", () => {
		for (const n of [0, 1, 65_535, 65_536, 65_537, 131_072, 131_073]) {
			expect(plainSize(sealedSize(n))).toBe(n);
		}
		expect(() => plainSize(HEADER_SIZE + TAG_SIZE - 1)).toThrow();
	});

	test("a stream seals to what the whole-buffer path opens", async () => {
		for (const n of [0, 1, CHUNK_SIZE, CHUNK_SIZE + 1, 3 * CHUNK_SIZE]) {
			const sealed = await sealStreamed(key(1), pattern(n));
			expect(sealed.length).toBe(sealedSize(n));
			expect(isSealed(sealed)).toBe(true);
			expect(openWhole({ current: key(1), previous: [] }, sealed)).toEqual(
				pattern(n),
			);
		}
	});

	test("sealing reads only as fast as its consumer", async () => {
		let pulled = 0;
		const input = new ReadableStream<Uint8Array>({
			pull(controller) {
				pulled++;
				controller.enqueue(pattern(1024 * 1024));
			},
		});
		const reader = sealStream(key(1), input).getReader();
		await reader.read();
		await reader.read();
		await Bun.sleep(10);
		expect(pulled).toBeLessThanOrEqual(3);
		await reader.cancel();
	});

	test("every range boundary reads the right bytes", async () => {
		const plain = pattern(3 * CHUNK_SIZE + 5);
		const sealed = seal(key(1), plain);
		const cs = CHUNK_SIZE;
		const edges = [0, 1, cs - 1, cs, cs + 1, 2 * cs, 3 * cs, plain.length - 1];
		for (const start of edges) {
			for (const end of edges.filter((e) => e >= start)) {
				const got = await collect(
					await openRange({ current: key(1), previous: [] }, source(sealed), {
						start,
						end,
					}),
				);
				expect(got).toEqual(plain.subarray(start, end + 1));
			}
		}
	});

	test("a range read pulls only the chunks it needs", async () => {
		const sealed = seal(key(1), pattern(10 * CHUNK_SIZE));
		const reads: number[] = [];
		const counting: SealedSource = {
			size: sealed.length,
			read: (offset, length) => {
				reads.push(offset);
				return Promise.resolve(sealed.subarray(offset, offset + length));
			},
		};
		const stream = await openRange(
			{ current: key(1), previous: [] },
			counting,
			{ start: 5 * CHUNK_SIZE },
		);
		const reader = stream.getReader();
		await reader.read();
		await reader.cancel();
		// Header, the last chunk (truncation check), then only chunk 5.
		expect(reads).toHaveLength(3);
	});

	test("refuses truncation, flipped bytes and unknown keys", async () => {
		const keyring = { current: key(1), previous: [] };
		const sealed = seal(key(1), pattern(2 * CHUNK_SIZE + 10));
		const atBoundary = sealed.subarray(
			0,
			HEADER_SIZE + 2 * (CHUNK_SIZE + TAG_SIZE),
		);
		expect(() => openWhole(keyring, atBoundary)).toThrow();
		await expect(
			openRange(keyring, source(atBoundary), { end: 10 }),
		).rejects.toThrow();
		expect(() => openWhole(keyring, sealed.subarray(0, -1))).toThrow();
		for (const at of [10, 20, 40, HEADER_SIZE + 5, sealed.length - 1]) {
			const flipped = Buffer.from(sealed);
			flipped[at] = (flipped[at] ?? 0) ^ 1;
			expect(() => openWhole(keyring, flipped)).toThrow();
		}
		const other = { current: key(2), previous: [] };
		expect(() => openHeader(other, sealed)).toThrow(KeyMissingError);
		expect(() => openHeader(other, sealed)).toThrow(
			keyId(key(1)).toString("hex"),
		);
	});

	test("a retired key still opens, and says so", () => {
		const sealed = seal(key(1), Buffer.from("x"));
		expect(
			openHeader({ current: key(2), previous: [key(1)] }, sealed).current,
		).toBe(false);
		expect(openWhole({ previous: [key(1)] }, sealed).toString()).toBe("x");
	});
});
