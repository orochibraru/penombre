import { isSimpleMode } from "#lib/server/config.js";

/**
 * An account with no personal drive: it reaches only the shared drives it is
 * a member of. Simple mode already gives everyone the one shared drive, so
 * the flag means nothing there.
 */
export function isDriveOnly(
	user: { id: string; driveOnly?: boolean | null } | null | undefined,
): boolean {
	return !!user?.driveOnly && !isSimpleMode();
}
