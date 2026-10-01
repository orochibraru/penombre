import { toast } from "svelte-sonner";
import { api } from "#lib/api/index.js";
import {
	type CommentAnchor,
	type CommentNote,
	type Thread,
	threads,
} from "#lib/editor/comments.js";
import { m } from "#lib/paraglide/messages.js";

/**
 * An office file's comment threads, shared by the panel and the editor: the
 * panel lists and writes them, the editor marks where they point and asks
 * for new ones.
 *
 * Comments are the file's notes that are not about a moment in a track, so
 * a timestamped note never shows here and a comment never on a waveform.
 */
export class Comments {
	notes = $state.raw<CommentNote[]>([]);
	/** A comment being written, and what it will point at. */
	draft = $state.raw<CommentAnchor | null>(null);
	/** The thread in focus, in the panel and in the text. */
	active = $state<string | null>(null);
	/** Threads whose text the editor could not find. */
	detached = $state.raw<ReadonlySet<string>>(new Set());
	/** Asks the editor to bring a thread's anchor into view. */
	reveal = $state.raw<{ id: string; seq: number } | null>(null);
	panelOpen = $state(false);
	showResolved = $state(false);

	readonly all: Thread[] = $derived(
		threads(this.notes.filter((note) => note.anchor || note.parentId)),
	);
	readonly unresolved = $derived(
		this.all.filter((thread) => !thread.root.resolvedAt),
	);
	readonly resolved = $derived(
		this.all.filter((thread) => thread.root.resolvedAt),
	);

	constructor(readonly fileId: string) {}

	private get path() {
		return { params: { path: { fileId: this.fileId } } };
	}

	async refresh(): Promise<void> {
		const { data, error } = await api
			.GET("/api/v1/files/{fileId}/notes", this.path)
			.catch(() => ({ data: undefined, error: true }));
		if (!error && data?.data) {
			this.notes = data.data as CommentNote[];
		}
	}

	/** Opens the panel on a new comment about `anchor`. */
	start = (anchor: CommentAnchor): void => {
		this.draft = anchor;
		this.active = null;
		this.panelOpen = true;
	};

	select = (id: string | null): void => {
		this.active = id;
		if (id) {
			this.reveal = { id, seq: (this.reveal?.seq ?? 0) + 1 };
		}
	};

	/** Selected in the editor: followed only while the panel is showing. */
	follow = (id: string): void => {
		if (this.panelOpen && id !== this.active) {
			this.active = id;
		}
	};

	/** Opens the panel on a thread, from a marker in the editor. */
	open = (id: string): void => {
		this.panelOpen = true;
		this.showResolved = this.resolved.some((thread) => thread.root.id === id);
		this.active = id;
	};

	private upsert(note: CommentNote): void {
		const known = this.notes.some((each) => each.id === note.id);
		this.notes = known
			? this.notes.map((each) => (each.id === note.id ? note : each))
			: [...this.notes, note];
	}

	private async post(body: {
		body: string;
		anchor?: CommentAnchor;
		parentId?: string;
	}): Promise<CommentNote | null> {
		const { data, error } = await api
			.POST("/api/v1/files/{fileId}/notes", { ...this.path, body })
			.catch(() => ({ data: undefined, error: true }));
		if (error || !data?.data) {
			toast.error(m.shell_comment_error());
			return null;
		}
		const note = data.data as CommentNote;
		this.upsert(note);
		return note;
	}

	async submit(body: string): Promise<boolean> {
		const anchor = this.draft;
		if (!anchor) {
			return false;
		}
		const note = await this.post({ body, anchor });
		if (note) {
			this.draft = null;
			this.select(note.id);
		}
		return note !== null;
	}

	async reply(rootId: string, body: string): Promise<boolean> {
		return (await this.post({ body, parentId: rootId })) !== null;
	}

	private async patch(
		id: string,
		body: { body?: string; resolved?: boolean },
	): Promise<boolean> {
		const { data, error } = await api
			.PATCH("/api/v1/files/{fileId}/notes/{noteId}", {
				params: { path: { fileId: this.fileId, noteId: id } },
				body,
			})
			.catch(() => ({ data: undefined, error: true }));
		if (error || !data?.data) {
			toast.error(m.shell_comment_error());
			return false;
		}
		this.upsert(data.data as CommentNote);
		return true;
	}

	resolve = (id: string, resolved: boolean): Promise<boolean> =>
		this.patch(id, { resolved });

	edit = (id: string, body: string): Promise<boolean> =>
		this.patch(id, { body });

	async remove(id: string): Promise<void> {
		const { error } = await api
			.DELETE("/api/v1/files/{fileId}/notes/{noteId}", {
				params: { path: { fileId: this.fileId, noteId: id } },
			})
			.catch(() => ({ error: true }));
		if (error) {
			toast.error(m.shell_comment_error());
			return;
		}
		// A thread goes with its replies, as it did on the server.
		this.notes = this.notes.filter(
			(note) => note.id !== id && note.parentId !== id,
		);
		if (this.active === id) {
			this.active = null;
		}
	}
}
