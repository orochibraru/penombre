/**
 * The client's view of a shared drive.
 *
 * Kept out of the components so the page, the sidebar and the members dialog
 * all speak of a role the same way — the server's `DriveRole` is the same
 * three values, checked at the API boundary.
 */

export type DriveRole = "manager" | "editor" | "viewer";

export interface DriveSummary {
	id: string;
	name: string;
	role: DriveRole;
	/** Owners are managers who may also delete the drive. */
	owner: boolean;
}
