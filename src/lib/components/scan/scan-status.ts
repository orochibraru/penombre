/** The event data of a scan's `/scan/events` stream. */
export interface ScanStatus {
	scanning: boolean;
	step?: {
		phase: "listing" | "folders" | "files" | "cleanup";
		current?: string;
		done: number;
		total: number;
	};
	etaSeconds?: number;
}
