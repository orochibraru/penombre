/**
 * What the person opening a file in an editor may do there, read from the
 * storage service that reached it: a view-only share, a drive viewer and a
 * read-only mount all build a read-only one. Never taken from the client;
 * the save routes refuse on their own anyway.
 */
export function editorAccess(
	service: { readOnly: boolean },
	url: URL,
): { canWrite: boolean; canShare: boolean } {
	const canWrite = !service.readOnly;
	// Something shared with you is not yours to share on.
	return { canWrite, canShare: canWrite && !url.searchParams.has("share") };
}
