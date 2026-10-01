/**
 * A picture file as the `src` the document editor stores: a data URL in a
 * format Word, a PDF and every browser can all draw.
 */

/** Kept as they are when small: every format we write draws them. */
const KEPT = new Set(["image/png", "image/jpeg", "image/gif"]);
const SMALL = 512 * 1024;
/** A phone photo is megabytes of base64; this is what a page can show. */
const MAX_SIDE = 1600;

function read(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/** Through an `<img>`, which unlike `createImageBitmap` also decodes SVG. */
function load(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error(`Cannot decode ${file.type || "this file"}`));
		};
		image.src = url;
	});
}

export async function embedPicture(file: File): Promise<string> {
	if (file.size <= SMALL && KEPT.has(file.type)) {
		return read(file);
	}
	// WebP, SVG, BMP…: redrawn as PNG. A big photo: scaled, as JPEG.
	const image = await load(file);
	const width = image.naturalWidth || 800;
	const height = image.naturalHeight || 600;
	const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));
	canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
	const photo = file.size > SMALL && file.type !== "image/png";
	return photo
		? canvas.toDataURL("image/jpeg", 0.85)
		: canvas.toDataURL("image/png");
}
