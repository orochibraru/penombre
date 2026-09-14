import { type Readable, writable } from "svelte/store";
import { api } from "$lib/api";
import { m } from "$lib/paraglide/messages.js";
import { secondsToMinutes } from "$lib/utils";

export interface FileNote {
	id: string;
	userId: string;
	authorName: string | null;
	body: string;
	timestampSeconds: number | null;
	createdAt: string;
}

/**
 * Notes per file id.
 *
 * Shared rather than owned by the thread panel: every player marks the
 * timestamped ones on its waveform, so they have to be readable without the
 * panel being open — and writing one there has to move the markers at once.
 */
const notes = writable<Record<string, FileNote[]>>({});

export const fileNotes: Readable<Record<string, FileNote[]>> = {
	subscribe: notes.subscribe,
};

export function setFileNotes(fileId: string, list: FileNote[]): void {
	notes.update((all) => ({ ...all, [fileId]: list }));
}

/** Null on failure; the caller decides whether that is worth a toast. */
export async function loadFileNotes(
	fileId: string,
): Promise<FileNote[] | null> {
	const { data, error } = await api.GET("/api/v1/files/{fileId}/notes", {
		params: { path: { fileId } },
	});
	if (error) {
		return null;
	}
	const list = (data?.data ?? []) as FileNote[];
	setFileNotes(fileId, list);
	return list;
}

/** A note drawn on a waveform. `at` is its 0–1 position along the track. */
export interface NoteMarker {
	id: string;
	at: number;
	seconds: number;
	body: string;
	caption: string;
}

export function noteMarkers(
	list: FileNote[] | undefined,
	duration: number,
): NoteMarker[] {
	const placeable = list && Number.isFinite(duration) && duration > 0;
	if (!placeable) {
		return [];
	}
	return list
		.filter((note) => note.timestampSeconds !== null)
		.map((note) => {
			const seconds = note.timestampSeconds ?? 0;
			return {
				id: note.id,
				at: Math.min(1, seconds / duration),
				seconds,
				body: note.body,
				caption: `${secondsToMinutes(seconds)} · ${note.authorName ?? m.unknown()}`,
			};
		});
}
