import {
	canConvert,
	type Prepared,
	prepareRendition,
	type Quality,
	type RenditionHeight,
	renditionUrl,
} from "#lib/renditions.js";

/** What a video element plays: the original, or a rendition once prepared. */
export class VideoSource {
	quality = $state<Quality>("original");
	/** The rendition being rendered, which is not yet what plays. */
	preparing = $state<RenditionHeight | null>(null);
	/** The browser refused the original: its format, not the network. */
	unplayable = $state(false);
	/** This drive renders nothing (its files are sealed). */
	unavailable = $state(false);

	readonly #raw: () => string;
	#abort: AbortController | undefined;

	constructor(raw: () => string) {
		this.#raw = raw;
	}

	get src(): string {
		return this.quality === "original"
			? this.#raw()
			: renditionUrl(this.#raw(), this.quality);
	}

	get convertible(): boolean {
		return !this.unavailable && canConvert(this.#raw());
	}

	/** Another file: nothing known about the last one carries over. */
	reset(): void {
		this.#abort?.abort();
		this.quality = "original";
		this.preparing = null;
		this.unplayable = false;
	}

	/**
	 * Switches once the rendition exists. `before` runs right before the
	 * source changes, which is where a player notes its playhead.
	 */
	async choose(quality: Quality, before?: () => void): Promise<Prepared> {
		this.#abort?.abort();
		this.preparing = null;
		if (quality === "original") {
			before?.();
			this.quality = quality;
			return { status: "ready" };
		}
		const abort = new AbortController();
		this.#abort = abort;
		this.preparing = quality;
		const done = await prepareRendition(this.#raw(), quality, abort.signal);
		if (done.status === "aborted") {
			return done;
		}
		this.preparing = null;
		if (done.status === "ready") {
			before?.();
			this.quality = quality;
		} else if (done.status === "unavailable") {
			this.unavailable = true;
		}
		return done;
	}
}
