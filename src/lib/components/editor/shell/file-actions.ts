import type { Snippet } from "svelte";
import type { DocumentKind, ExportFormat } from "#lib/documents.js";
import type { Comments } from "./comments.svelte.js";

/**
 * What the File menu offers, and how. The page builds one for its file and
 * every editor renders it first in its menu bar, so a document, a sheet and
 * a presentation have the same File menu.
 */
export interface FileActions {
	kind: DocumentKind | null;
	exports: readonly ExportFormat[];
	canWrite: boolean;
	canShare: boolean;
	versioning: boolean;
	/**
	 * Downloads and printing need a download manager and a print dialog,
	 * which the mobile app's web view has neither of.
	 */
	downloads: boolean;
	rename: () => void;
	copy: () => void;
	download: () => void;
	exportAs: (format: ExportFormat) => void;
	share: () => void;
	saveVersion: () => void;
	history: () => void;
	/** Documents only; wired by the signatures feature. */
	requestSignatures?: () => void;
	/** Where the document's signature requests stand. */
	signatures?: () => void;
}

/** What an editor hands the File menu: the one thing only it can do. */
export interface EditorMenuContext {
	print?: () => void;
}

/** How autosave is doing, for the header. */
export interface SaveStatus {
	saving: boolean;
	failed: boolean;
	pending: boolean;
	savedAt: Date | null;
}

/**
 * What the shell hands the editor it wraps. The slide editor takes the same
 * three: `menu` first in its menu bar, `readOnly`, and `comments` with slide
 * anchors (`{ kind: "slide", index, id }`).
 */
export interface ShellContext {
	menu: Snippet<[EditorMenuContext]>;
	readOnly: boolean;
	comments: Comments;
}
