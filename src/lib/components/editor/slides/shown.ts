import type { Deck } from "#lib/slides/model.js";
import { rawLabel } from "./labels.js";

/** The slides a presentation shows: every one not hidden, or all when all are. */
export function shownSlides(deck: Deck): number[] {
	const shown = deck.slides.flatMap((slide, index) =>
		slide.hidden ? [] : [index],
	);
	return shown.length > 0 ? shown : deck.slides.map((_slide, index) => index);
}

export const labelOf = rawLabel;

/** Between the presenter view and the audience window it opened. */
export type SlidesMessage =
	| { type: "hello" }
	| { type: "state"; deck: string; index: number }
	| { type: "go"; index: number };

export function slidesChannel(id: string): BroadcastChannel {
	return new BroadcastChannel(`penombre-slides:${id}`);
}

export function send(
	channel: BroadcastChannel | undefined,
	message: SlidesMessage,
): void {
	// oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel has no target origin
	channel?.postMessage(message);
}

/** Messages are same-origin, but still checked before anything trusts them. */
export function readSlidesMessage(data: unknown): SlidesMessage | null {
	if (typeof data !== "object" || data === null) {
		return null;
	}
	const message = data as Record<string, unknown>;
	const index = Number.isInteger(message.index) ? Number(message.index) : -1;
	if (message.type === "hello") {
		return { type: "hello" };
	}
	if (message.type === "go" && index >= 0) {
		return { type: "go", index };
	}
	if (
		message.type === "state" &&
		index >= 0 &&
		typeof message.deck === "string"
	) {
		return { type: "state", deck: message.deck, index };
	}
	return null;
}
