/** Longest side a picture keeps once it is stored inside the file. */
const MAX_SIDE = 1600;

function readAsDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/**
 * A picture as a `data:image/*` URL, so the deck stays one portable file.
 * A phone photo is scaled to what a slide can show first.
 */
export async function embedImage(file: File): Promise<string> {
	if (file.size <= 512 * 1024 || file.type === "image/svg+xml") {
		return readAsDataUrl(file);
	}
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", 0.85);
}
