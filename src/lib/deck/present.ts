/** What a key does while presenting. */
export type KeyAction =
	| { index: number; typed: string }
	| { exit: true }
	| { fullscreen: true }
	| null;

const NEXT = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "n", "N"]);
const PREVIOUS = new Set([
	"ArrowLeft",
	"ArrowUp",
	"PageUp",
	"Backspace",
	"p",
	"P",
]);

/**
 * Arrows, space and the page keys step; Home and End jump to the ends; a
 * number then Enter jumps to that slide, as in PowerPoint.
 */
export function slideKey(
	key: string,
	index: number,
	count: number,
	typed: string,
): KeyAction {
	const clamp = (to: number) => Math.min(Math.max(0, to), count - 1);
	if (/^\d$/.test(key)) {
		return { index, typed: `${typed}${key}`.slice(-4) };
	}
	if (key === "Enter") {
		return {
			index: typed ? clamp(Number(typed) - 1) : clamp(index + 1),
			typed: "",
		};
	}
	if (NEXT.has(key)) {
		return { index: clamp(index + 1), typed: "" };
	}
	if (PREVIOUS.has(key)) {
		return { index: clamp(index - 1), typed: "" };
	}
	if (key === "Home" || key === "End") {
		return { index: key === "Home" ? 0 : count - 1, typed: "" };
	}
	if (key === "Escape") {
		return { exit: true };
	}
	return key === "f" || key === "F" ? { fullscreen: true } : null;
}

/** Between the presenter view and the audience window it opened. */
export type DeckMessage =
	| { type: "hello" }
	| { type: "state"; markdown: string; index: number }
	| { type: "go"; index: number };

export function deckChannel(id: string): BroadcastChannel {
	return new BroadcastChannel(`penombre-deck:${id}`);
}

export function post(
	channel: BroadcastChannel | undefined,
	message: DeckMessage,
) {
	// oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel has no target origin
	channel?.postMessage(message);
}

/** Messages are same-origin, but still checked before anything trusts them. */
export function readMessage(data: unknown): DeckMessage | null {
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
		typeof message.markdown === "string"
	) {
		return { type: "state", markdown: message.markdown, index };
	}
	return null;
}

/** `m:ss`, or `h:mm:ss` past the hour. */
export function clock(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const rest = String(seconds % 60).padStart(2, "0");
	return hours > 0
		? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
		: `${minutes}:${rest}`;
}
