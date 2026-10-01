import type { ImageElement, Placeholder } from "#lib/slides/model.js";

/** Longest side a picture keeps once it is inside the deck. */
const MAX_SIDE = 1600;

export interface Picture {
	src: string;
	width: number;
	height: number;
}

/**
 * A picture scaled to what a slide can show and re-encoded as PNG or JPEG,
 * the two formats every presentation program reads. SVG is rasterised:
 * PowerPoint needs a bitmap beside one anyway.
 */
export async function readPicture(file: Blob): Promise<Picture> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const transparent = /png|gif|webp|svg/.test(file.type);
	return {
		src: transparent
			? canvas.toDataURL("image/png")
			: canvas.toDataURL("image/jpeg", 0.85),
		width: canvas.width,
		height: canvas.height,
	};
}

/** A picture filling `area` (a picture placeholder), cropped rather than stretched. */
export function coverPicture(
	picture: Picture,
	area: { x: number; y: number; w: number; h: number },
	id: string,
	placeholder?: Placeholder,
): ImageElement {
	const ratio = picture.width / picture.height;
	const target = area.w / area.h;
	const crop = { l: 0, t: 0, r: 0, b: 0 };
	if (ratio > target) {
		const cut = Math.round(((1 - target / ratio) / 2) * 100_000);
		crop.l = cut;
		crop.r = cut;
	} else if (ratio < target) {
		const cut = Math.round(((1 - ratio / target) / 2) * 100_000);
		crop.t = cut;
		crop.b = cut;
	}
	return {
		kind: "image",
		id,
		name: `Picture ${id}`,
		...area,
		src: picture.src,
		crop: crop.l || crop.t ? crop : undefined,
		placeholder,
	};
}

/** A picture placed at its own shape, centred and no bigger than `room`. */
export function placePicture(
	picture: Picture,
	slide: { w: number; h: number },
	id: string,
	at?: [number, number],
): ImageElement {
	const room = { w: slide.w * 0.6, h: slide.h * 0.6 };
	const scale = Math.min(room.w / picture.width, room.h / picture.height);
	const w = Math.round(picture.width * scale);
	const h = Math.round(picture.height * scale);
	const [cx, cy] = at ?? [slide.w / 2, slide.h / 2];
	return {
		kind: "image",
		id,
		name: `Picture ${id}`,
		x: Math.round(cx - w / 2),
		y: Math.round(cy - h / 2),
		w,
		h,
		src: picture.src,
	};
}
