import { toast } from "svelte-sonner";
import * as m from "#lib/paraglide/messages.js";

/**
 * Plays, and answers whether playback started; the rejection never escapes.
 * `AbortError` (a new source or a pause got there first) and
 * `NotAllowedError` (autoplay refused) are ordinary and silent. Anything else
 * is a file this browser cannot play, which the person is told.
 */
export async function playMedia(
	media: HTMLMediaElement | null | undefined,
): Promise<boolean> {
	if (!media) {
		return false;
	}
	try {
		await media.play();
		return true;
	} catch (error) {
		const name = error instanceof Error ? error.name : "";
		if (name !== "AbortError" && name !== "NotAllowedError") {
			toast.error(m.player_unplayable());
		}
		return false;
	}
}
