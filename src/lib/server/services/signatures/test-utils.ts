import { crc32, deflateSync } from "node:zlib";

/** A real PNG, RGBA, filled with one colour: what a canvas hands back. */
export function pngDataUrl(width = 40, height = 16): string {
	const chunk = (type: string, data: Uint8Array) => {
		const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
		const out = Buffer.alloc(body.length + 8);
		out.writeUInt32BE(data.length, 0);
		body.copy(out, 4);
		out.writeUInt32BE(crc32(body), body.length + 4);
		return out;
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const row = Buffer.alloc(1 + width * 4, 0x40);
	row[0] = 0;
	const raw = Buffer.concat(Array.from({ length: height }, () => row));
	const png = Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw)),
		chunk("IEND", new Uint8Array()),
	]);
	return `data:image/png;base64,${png.toString("base64")}`;
}
