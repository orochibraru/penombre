import { api } from "#lib/api/index.js";
import { PRESENCE_INTERVAL_MS } from "#lib/editor/presence.js";

export interface Present {
	userId: string;
	name: string;
	mode: "viewing" | "editing";
}

/**
 * Who else has this file open, kept fresh by a heartbeat every 15 seconds.
 *
 * Paused while the tab is hidden (nobody is looking, and the server forgets
 * a silent visitor on its own), resumed at once when it shows again, and
 * cleared on the way out.
 */
export class Presence {
	others = $state.raw<Present[]>([]);
	private timer: ReturnType<typeof setTimeout> | undefined;
	private stopped = false;

	constructor(
		private readonly fileId: string,
		private readonly mode: () => "viewing" | "editing",
		private readonly onBeat?: (others: Present[]) => void,
	) {}

	beat = async (): Promise<void> => {
		clearTimeout(this.timer);
		if (this.stopped || document.hidden) {
			return;
		}
		const answer = await api
			.POST("/api/v1/files/{fileId}/presence", {
				params: { path: { fileId: this.fileId } },
				body: { mode: this.mode() },
			})
			.catch(() => null);
		if (this.stopped) {
			return;
		}
		this.others = answer?.data?.data ?? [];
		this.onBeat?.(this.others);
		this.timer = setTimeout(() => void this.beat(), PRESENCE_INTERVAL_MS);
	};

	private readonly leave = (): void => {
		void api
			.DELETE("/api/v1/files/{fileId}/presence", {
				params: { path: { fileId: this.fileId } },
				// Outlives the page it was sent from.
				keepalive: true,
			})
			.catch(() => undefined);
	};

	private readonly onVisibility = (): void => {
		if (document.hidden) {
			clearTimeout(this.timer);
		} else {
			void this.beat();
		}
	};

	/** Starts beating; the returned function stops and leaves. */
	start(): () => void {
		document.addEventListener("visibilitychange", this.onVisibility);
		window.addEventListener("pagehide", this.leave);
		void this.beat();
		return () => {
			this.stopped = true;
			clearTimeout(this.timer);
			document.removeEventListener("visibilitychange", this.onVisibility);
			window.removeEventListener("pagehide", this.leave);
			this.leave();
		};
	}
}
