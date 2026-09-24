import { randomUUID } from "node:crypto";
import { mkdir, rename, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import {
	HEADER_SIZE,
	isSealed,
	type Keyring,
	openRange,
	openWhole,
	plainSize,
	sealStream,
} from "#lib/server/crypto/envelope.js";
import type { StorageDriver } from "../driver";

type Data = Parameters<StorageDriver["writeObject"]>[1];

const PIECE = 1024 * 1024;

function toStream(data: Data): ReadableStream<Uint8Array> {
	if (data instanceof ReadableStream) {
		return data;
	}
	if (data instanceof Blob) {
		return data.stream();
	}
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	let offset = 0;
	return new ReadableStream({
		pull(controller) {
			controller.enqueue(bytes.subarray(offset, offset + PIECE));
			offset += PIECE;
			if (offset >= bytes.byteLength) {
				controller.close();
			}
		},
	});
}

/**
 * Seals what it writes when `encrypt` is set, and opens anything sealed it
 * reads whether or not it is: the magic bytes on disk decide, never a flag.
 * Copies stay raw, since the file key travels in each file's header.
 */
export class EncryptedStorageDriver implements StorageDriver {
	constructor(
		private readonly inner: StorageDriver,
		private readonly root: string,
		private readonly keys: Keyring,
		private readonly encrypt: boolean,
	) {}

	private path(key: string): string {
		return join(this.root, key);
	}

	private async sealed(key: string): Promise<boolean> {
		const prefix = await Bun.file(this.path(key)).slice(0, 8).bytes();
		return isSealed(prefix);
	}

	async readObject(key: string): Promise<ArrayBuffer> {
		const bytes = new Uint8Array(await this.inner.readObject(key));
		if (!isSealed(bytes)) {
			return bytes.buffer;
		}
		const plain = openWhole(this.keys, bytes);
		return (
			plain.byteOffset === 0 && plain.byteLength === plain.buffer.byteLength
				? plain.buffer
				: plain.buffer.slice(
						plain.byteOffset,
						plain.byteOffset + plain.byteLength,
					)
		) as ArrayBuffer;
	}

	async getObjectStream(
		key: string,
		rangeStart?: number,
		rangeEnd?: number,
	): Promise<ReadableStream<Uint8Array>> {
		if (!(await this.sealed(key))) {
			return this.inner.getObjectStream(key, rangeStart, rangeEnd);
		}
		const file = Bun.file(this.path(key));
		return openRange(
			this.keys,
			{
				size: file.size,
				read: (offset, length) => file.slice(offset, offset + length).bytes(),
			},
			{ start: rangeStart, end: rangeEnd },
		);
	}

	async getObjectSize(key: string): Promise<number> {
		const size = await this.inner.getObjectSize(key);
		return size >= HEADER_SIZE && (await this.sealed(key))
			? plainSize(size)
			: size;
	}

	/** Staged and renamed in, so a reader never meets a half-sealed file. */
	async writeObject(key: string, data: Data): Promise<void> {
		const current = this.keys.current;
		if (!(this.encrypt && current)) {
			return this.inner.writeObject(key, data);
		}
		const path = this.path(key);
		// A dot-name, so neither the scan nor the migration sweep picks it up.
		const stage = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
		await mkdir(dirname(path), { recursive: true });
		try {
			await Bun.write(stage, new Response(sealStream(current, toStream(data))));
			await rename(stage, path);
		} catch (error) {
			await unlink(stage).catch(() => undefined);
			throw error;
		}
	}

	async copyObject(src: string, dest: string): Promise<void> {
		if (this.encrypt && this.keys.current && !(await this.sealed(src))) {
			return this.writeObject(dest, await this.inner.getObjectStream(src));
		}
		return this.inner.copyObject(src, dest);
	}

	/** Raw: a sealed file carries its own key, so its link is sealed too. */
	linkObject(src: string, dest: string): Promise<void> {
		return this.inner.linkObject(src, dest);
	}

	deleteObject(key: string): Promise<void> {
		return this.inner.deleteObject(key);
	}

	deleteObjectsByPrefix(prefix: string): Promise<void> {
		return this.inner.deleteObjectsByPrefix(prefix);
	}

	objectExists(key: string): Promise<boolean> {
		return this.inner.objectExists(key);
	}

	listObjectKeys(prefix?: string): Promise<string[]> {
		return this.inner.listObjectKeys(prefix);
	}

	ensureRootExists(): Promise<void> {
		return this.inner.ensureRootExists();
	}

	getAvailableDiskSpace(): number {
		return this.inner.getAvailableDiskSpace();
	}
}
