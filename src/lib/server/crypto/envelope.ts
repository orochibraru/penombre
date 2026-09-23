/**
 * Penombre's sealed file format, v1. Mirrors `internal/envelope` in Go, and
 * `tests/fixtures/envelope-v1.json` holds vectors both must reproduce.
 *
 * 76-byte header (magic + version, key id, wrap nonce, file key wrapped by the
 * instance key with bytes 0..15 as AAD), then AES-256-GCM chunks of 64 KiB
 * whose nonce is the chunk index plus a last-chunk flag against truncation.
 */

import {
	createCipheriv,
	createDecipheriv,
	createHmac,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";

export const HEADER_SIZE = 76;
export const CHUNK_SIZE = 64 * 1024;
export const TAG_SIZE = 16;
export const KEY_SIZE = 32;
const SEALED_CHUNK = CHUNK_SIZE + TAG_SIZE;
const MAGIC = Buffer.from("PNMBENC\x01", "latin1");

export interface Keyring {
	/** Seals new bytes. Absent: nothing is sealed, sealed files still open. */
	current?: Buffer;
	/** Retired keys, read-only. */
	previous: Buffer[];
}

export class CorruptEnvelopeError extends Error {
	constructor() {
		super("Sealed file is corrupt or truncated");
	}
}

export class KeyMissingError extends Error {
	constructor(readonly keyId: string) {
		super(`Sealed with key ${keyId}, not loaded (set ENCRYPTION_KEY)`);
	}
}

export function keyId(kek: Buffer): Buffer {
	return createHmac("sha256", kek)
		.update("penombre/key-id/v1")
		.digest()
		.subarray(0, 8);
}

/** The key matching `id`, and whether it is the current one. */
function findKey(
	keyring: Keyring,
	id: Uint8Array,
): { kek: Buffer; current: boolean } | undefined {
	const matches = (kek: Buffer) => timingSafeEqual(keyId(kek), id);
	if (keyring.current && matches(keyring.current)) {
		return { kek: keyring.current, current: true };
	}
	const old = keyring.previous.find(matches);
	return old ? { kek: old, current: false } : undefined;
}

export function isSealed(prefix: Uint8Array): boolean {
	return (
		prefix.byteLength >= MAGIC.length &&
		MAGIC.equals(prefix.subarray(0, MAGIC.length))
	);
}

export function sealedSize(plain: number): number {
	return (
		HEADER_SIZE + plain + TAG_SIZE * Math.max(1, Math.ceil(plain / CHUNK_SIZE))
	);
}

export function plainSize(sealed: number): number {
	const n = sealed - HEADER_SIZE;
	const chunks = Math.ceil(n / SEALED_CHUNK);
	if (n < TAG_SIZE || n - (chunks - 1) * SEALED_CHUNK < TAG_SIZE) {
		throw new CorruptEnvelopeError();
	}
	return n - TAG_SIZE * chunks;
}

export function sealHeader(
	kek: Buffer,
	dek: Buffer,
	nonce: Buffer = randomBytes(12),
): Buffer {
	const aad = Buffer.concat([MAGIC, keyId(kek)]);
	const cipher = createCipheriv("aes-256-gcm", kek, nonce);
	cipher.setAAD(aad);
	const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
	return Buffer.concat([aad, nonce, wrapped, cipher.getAuthTag()]);
}

/** The file key inside a header, and whether the current key wrapped it. */
export function openHeader(
	keyring: Keyring,
	header: Uint8Array,
): { dek: Buffer; current: boolean } {
	const h = Buffer.from(header.buffer, header.byteOffset, header.byteLength);
	if (h.length < HEADER_SIZE || !isSealed(h)) {
		throw new CorruptEnvelopeError();
	}
	const found = findKey(keyring, h.subarray(8, 16));
	if (!found) {
		throw new KeyMissingError(h.subarray(8, 16).toString("hex"));
	}
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			found.kek,
			h.subarray(16, 28),
		);
		decipher.setAAD(h.subarray(0, 16));
		decipher.setAuthTag(h.subarray(60, HEADER_SIZE));
		const dek = Buffer.concat([
			decipher.update(h.subarray(28, 60)),
			decipher.final(),
		]);
		return { dek, current: found.current };
	} catch {
		throw new CorruptEnvelopeError();
	}
}

function chunkNonce(index: number, last: boolean): Buffer {
	const nonce = Buffer.alloc(12);
	nonce.writeBigUInt64BE(BigInt(index), 3);
	nonce[11] = last ? 1 : 0;
	return nonce;
}

function sealChunk(
	dek: Buffer,
	index: number,
	last: boolean,
	plain: Uint8Array,
): Buffer {
	const cipher = createCipheriv("aes-256-gcm", dek, chunkNonce(index, last));
	return Buffer.concat([
		cipher.update(plain),
		cipher.final(),
		cipher.getAuthTag(),
	]);
}

function openChunk(
	dek: Buffer,
	index: number,
	last: boolean,
	sealed: Uint8Array,
): Buffer {
	if (sealed.byteLength < TAG_SIZE) {
		throw new CorruptEnvelopeError();
	}
	const body = sealed.subarray(0, sealed.byteLength - TAG_SIZE);
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			dek,
			chunkNonce(index, last),
		);
		decipher.setAuthTag(sealed.subarray(sealed.byteLength - TAG_SIZE));
		return Buffer.concat([decipher.update(body), decipher.final()]);
	} catch {
		throw new CorruptEnvelopeError();
	}
}

/** Seal a whole buffer. `dek` and `nonce` are fixed only by test vectors. */
export function seal(
	kek: Buffer,
	plain: Uint8Array,
	dek: Buffer = randomBytes(KEY_SIZE),
	nonce?: Buffer,
): Buffer {
	const chunks = Math.max(1, Math.ceil(plain.byteLength / CHUNK_SIZE));
	const parts = [sealHeader(kek, dek, nonce)];
	for (let index = 0; index < chunks; index++) {
		parts.push(
			sealChunk(
				dek,
				index,
				index === chunks - 1,
				plain.subarray(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
			),
		);
	}
	return Buffer.concat(parts);
}

/**
 * Seals `source`, re-chunked to 64 KiB, one sealed chunk per pull: a slow
 * writer holds back the reads instead of queueing the whole file sealed.
 */
export function sealStream(
	kek: Buffer,
	source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
	const dek = randomBytes(KEY_SIZE);
	const reader = source.getReader();
	let buffered: Buffer = Buffer.alloc(0);
	let index = 0;
	let done = false;
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(sealHeader(kek, dek));
		},
		async pull(controller) {
			// A full chunk is only known not to be the last once a byte follows it.
			while (!done && buffered.length <= CHUNK_SIZE) {
				const next = await reader.read();
				if (next.done) {
					done = true;
				} else {
					const bytes = Buffer.from(
						next.value.buffer,
						next.value.byteOffset,
						next.value.byteLength,
					);
					buffered =
						buffered.length > 0 ? Buffer.concat([buffered, bytes]) : bytes;
				}
			}
			if (buffered.length > CHUNK_SIZE) {
				controller.enqueue(
					sealChunk(dek, index++, false, buffered.subarray(0, CHUNK_SIZE)),
				);
				buffered = buffered.subarray(CHUNK_SIZE);
				return;
			}
			controller.enqueue(sealChunk(dek, index, true, buffered));
			controller.close();
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
}

/** Where a sealed file's bytes come from, so a range read fetches only what it needs. */
export interface SealedSource {
	size: number;
	read: (offset: number, length: number) => Promise<Uint8Array>;
}

/** Validates the header and the last chunk, which is what catches truncation. */
async function openSource(keyring: Keyring, source: SealedSource) {
	const size = plainSize(source.size);
	const { dek } = openHeader(keyring, await source.read(0, HEADER_SIZE));
	const chunks = Math.max(1, Math.ceil(size / CHUNK_SIZE));
	const chunk = async (index: number) => {
		const last = index === chunks - 1;
		const length = last ? size - index * CHUNK_SIZE + TAG_SIZE : SEALED_CHUNK;
		return openChunk(
			dek,
			index,
			last,
			await source.read(HEADER_SIZE + index * SEALED_CHUNK, length),
		);
	};
	const tail = await chunk(chunks - 1);
	return { size, chunks, chunk, tail };
}

/**
 * Plaintext bytes `start..end` (inclusive) as a pull stream: one chunk is
 * read and opened per pull, so an open-ended tail is never decrypted ahead.
 */
export async function openRange(
	keyring: Keyring,
	source: SealedSource,
	{
		start = 0,
		end,
		onClose = () => undefined,
	}: { start?: number; end?: number; onClose?: () => void } = {},
): Promise<ReadableStream<Uint8Array>> {
	const opened = await openSource(keyring, source);
	const last = Math.min(end ?? opened.size - 1, opened.size - 1);
	let index = Math.floor(start / CHUNK_SIZE);
	const lastIndex = Math.floor(last / CHUNK_SIZE);
	let closed = false;
	const close = () => {
		if (!closed) {
			closed = true;
			onClose();
		}
	};
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			if (start > last || index > lastIndex) {
				controller.close();
				close();
				return;
			}
			try {
				const plain =
					index === opened.chunks - 1 ? opened.tail : await opened.chunk(index);
				const base = index * CHUNK_SIZE;
				controller.enqueue(
					plain.subarray(
						Math.max(0, start - base),
						Math.min(CHUNK_SIZE, last - base + 1),
					),
				);
				index++;
			} catch (error) {
				controller.error(error);
				close();
			}
		},
		cancel() {
			close();
		},
	});
}

export function openWhole(keyring: Keyring, sealed: Uint8Array): Buffer {
	const size = plainSize(sealed.byteLength);
	const { dek } = openHeader(keyring, sealed);
	const chunks = Math.max(1, Math.ceil(size / CHUNK_SIZE));
	// Unpooled, so `.buffer` is exactly the plaintext.
	const plain = Buffer.allocUnsafeSlow(size);
	for (let index = 0; index < chunks; index++) {
		const from = HEADER_SIZE + index * SEALED_CHUNK;
		plain.set(
			openChunk(
				dek,
				index,
				index === chunks - 1,
				sealed.subarray(from, Math.min(from + SEALED_CHUNK, sealed.byteLength)),
			),
			index * CHUNK_SIZE,
		);
	}
	return plain;
}
