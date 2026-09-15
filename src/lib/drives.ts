/**
 * The client's view of a shared drive.
 *
 * Kept out of the components so the page, the sidebar and the members dialog
 * all speak of a role the same way — the server's `DriveRole` is the same
 * three values, checked at the API boundary.
 */

/**
 * How the API client carries the drive the page is in.
 *
 * A header rather than a query parameter: setting one on an outgoing request
 * is in-place, while changing its URL means rebuilding the `Request`, which
 * turns its body into a stream upload — and Chrome refuses those over plain
 * HTTP/1.1. The server takes either; `?drive=` stays the documented spelling.
 */
export const DRIVE_HEADER = "x-drive";

export type DriveRole = "manager" | "editor" | "viewer";

export interface DriveSummary {
	id: string;
	name: string;
	role: DriveRole;
	/** Owners are managers who may also delete the drive. */
	owner: boolean;
}
