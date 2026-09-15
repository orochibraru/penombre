import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";

/**
 * Just enough ZIP to open and rewrite an OOXML package.
 *
 * `archiver` is a writer, and nothing in the tree reads an archive, so the
 * ~150 lines here buy back a dependency that would otherwise be pulled in for
 * the two calls below.
 *
 * Entries keep their original order. That matters: a `.docx` is a ZIP whose
 * first entry is conventionally `[Content_Types].xml`, and some readers —
 * older Word among them — will not open a package that starts elsewhere.
 */
export interface ZipEntry {
	name: string;
	data: Uint8Array;
	/** Kept so a part that was stored uncompressed is written back that way. */
	stored: boolean;
}

const LOCAL_SIGNATURE = 0x04_03_4b_50;
const CENTRAL_SIGNATURE = 0x02_01_4b_50;
const EOCD_SIGNATURE = 0x06_05_4b_50;
const EOCD_SIZE = 22;
/** A ZIP comment is a 16-bit length, so the record is within this of the end. */
const MAX_COMMENT = 0xff_ff;

const STORED = 0;
const DEFLATED = 8;

/** Signals a file that is not a ZIP at all, or one we decline to parse. */
export class NotAnArchiveError extends Error {}

function findEndOfCentralDirectory(view: DataView): number {
	const start = Math.max(0, view.byteLength - EOCD_SIZE - MAX_COMMENT);
	for (let at = view.byteLength - EOCD_SIZE; at >= start; at--) {
		if (view.getUint32(at, true) === EOCD_SIGNATURE) {
			return at;
		}
	}
	throw new NotAnArchiveError("No end-of-central-directory record");
}

/** Read every part of an archive, decompressed, in the order it was written. */
export function readZip(input: ArrayBuffer | Uint8Array): ZipEntry[] {
	const bytes =
		input instanceof Uint8Array ? input : new Uint8Array(input as ArrayBuffer);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	const eocd = findEndOfCentralDirectory(view);
	const count = view.getUint16(eocd + 10, true);
	const directoryOffset = view.getUint32(eocd + 16, true);
	if (directoryOffset === 0xff_ff_ff_ff || count === 0xff_ff) {
		// Zip64. No Office document we are asked to edit is 4GB or 65k parts.
		throw new NotAnArchiveError("Zip64 archives are not supported");
	}

	const entries: ZipEntry[] = [];
	let at = directoryOffset;
	for (let index = 0; index < count; index++) {
		if (view.getUint32(at, true) !== CENTRAL_SIGNATURE) {
			throw new NotAnArchiveError("Malformed central directory");
		}
		const method = view.getUint16(at + 10, true);
		const compressedSize = view.getUint32(at + 20, true);
		const nameLength = view.getUint16(at + 28, true);
		const extraLength = view.getUint16(at + 30, true);
		const commentLength = view.getUint16(at + 32, true);
		const localOffset = view.getUint32(at + 42, true);
		const name = new TextDecoder().decode(
			bytes.subarray(at + 46, at + 46 + nameLength),
		);

		if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) {
			throw new NotAnArchiveError(`Malformed local header for ${name}`);
		}
		// The local header's own name and extra lengths are authoritative:
		// writers routinely put different extra fields in the two places.
		const localNameLength = view.getUint16(localOffset + 26, true);
		const localExtraLength = view.getUint16(localOffset + 28, true);
		const dataStart = localOffset + 30 + localNameLength + localExtraLength;
		const raw = bytes.subarray(dataStart, dataStart + compressedSize);

		if (method !== STORED && method !== DEFLATED) {
			throw new NotAnArchiveError(
				`Unsupported compression method ${method} for ${name}`,
			);
		}
		entries.push({
			name,
			data: method === STORED ? new Uint8Array(raw) : inflateRawSync(raw),
			stored: method === STORED,
		});

		at += 46 + nameLength + extraLength + commentLength;
	}
	return entries;
}

/** Write the parts back out as a ZIP, in the order given. */
export function writeZip(entries: ZipEntry[]): Buffer {
	const locals: Buffer[] = [];
	const central: Buffer[] = [];
	let offset = 0;

	for (const entry of entries) {
		const name = Buffer.from(entry.name, "utf8");
		const body = Buffer.from(
			entry.data.buffer,
			entry.data.byteOffset,
			entry.data.byteLength,
		);
		const compressed = entry.stored ? body : deflateRawSync(body);
		const checksum = crc32(body);

		const local = Buffer.alloc(30);
		local.writeUInt32LE(LOCAL_SIGNATURE, 0);
		local.writeUInt16LE(20, 4); // version needed
		local.writeUInt16LE(0, 6); // flags — no data descriptor, no UTF-8 bit
		local.writeUInt16LE(entry.stored ? STORED : DEFLATED, 8);
		local.writeUInt32LE(0, 10); // mod time and date, zeroed
		local.writeUInt32LE(checksum, 14);
		local.writeUInt32LE(compressed.length, 18);
		local.writeUInt32LE(body.length, 22);
		local.writeUInt16LE(name.length, 26);
		local.writeUInt16LE(0, 28); // extra length
		locals.push(local, name, compressed);

		const header = Buffer.alloc(46);
		header.writeUInt32LE(CENTRAL_SIGNATURE, 0);
		header.writeUInt16LE(20, 4); // version made by
		header.writeUInt16LE(20, 6); // version needed
		header.writeUInt16LE(0, 8);
		header.writeUInt16LE(entry.stored ? STORED : DEFLATED, 10);
		header.writeUInt32LE(0, 12);
		header.writeUInt32LE(checksum, 16);
		header.writeUInt32LE(compressed.length, 20);
		header.writeUInt32LE(body.length, 24);
		header.writeUInt16LE(name.length, 28);
		header.writeUInt32LE(offset, 42);
		central.push(header, name);

		offset += local.length + name.length + compressed.length;
	}

	const directory = Buffer.concat(central);
	const eocd = Buffer.alloc(EOCD_SIZE);
	eocd.writeUInt32LE(EOCD_SIGNATURE, 0);
	eocd.writeUInt16LE(entries.length, 8);
	eocd.writeUInt16LE(entries.length, 10);
	eocd.writeUInt32LE(directory.length, 12);
	eocd.writeUInt32LE(offset, 16);

	return Buffer.concat([...locals, directory, eocd]);
}

/** The named part's bytes decoded as text, or null when it is absent. */
export function partText(entries: ZipEntry[], name: string): string | null {
	const entry = entries.find((candidate) => candidate.name === name);
	return entry ? new TextDecoder().decode(entry.data) : null;
}

/** Replace a part's bytes in place, adding it when the package lacks one. */
export function setPartText(
	entries: ZipEntry[],
	name: string,
	text: string,
): void {
	const data = new TextEncoder().encode(text);
	const existing = entries.find((candidate) => candidate.name === name);
	if (existing) {
		existing.data = data;
	} else {
		entries.push({ name, data, stored: false });
	}
}
