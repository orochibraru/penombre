import {
	ArchiveRestoreIcon,
	CopyIcon,
	DownloadIcon,
	ExternalLinkIcon,
	FolderInputIcon,
	MessageSquareTextIcon,
	PencilLineIcon,
	ShareIcon,
	StarIcon,
	StarOffIcon,
	TrashIcon,
} from "@lucide/svelte";
import type { MediaQuery } from "svelte/reactivity";
import { toast } from "svelte-sonner";
import { dev } from "$app/environment";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { api, type ObjectItem, type ObjectList } from "$lib/api";
import type { SupportedLanguage } from "$lib/components/ui/code/shiki";
import { kindForName } from "$lib/documents";
import { determineCodeFileLanguage } from "$lib/file-utils";
import * as m from "$lib/paraglide/messages.js";
import { itemAction } from "$lib/store/actions";
import { playableMusic } from "$lib/store/music";
import { getObjectUrl } from "$lib/url";
import type {
	ItemActionGroup,
	MultipleItemsAction,
	SortColumn,
	SortDirection,
} from "$lib/utils";
import { peaksUrl } from "./file-links";

export { handleOpenItemInNewTab, newTabUrl, peaksUrl } from "./file-links";

// ================================
// Types
// ================================

export type FileToView = {
	item: ObjectItem;
	src: string;
	/** "notes" opens the dialog with only the thread — used for audio, which
	 *  plays in the global player rather than inside the dialog. */
	type: "image" | "code" | "pdf" | "video" | "notes";
	content?: string;
	language?: SupportedLanguage;
} | null;

export interface WrapperState {
	allSelected: boolean;
	indeterminate: boolean;
	confirmDeleteOpen: boolean;
	confirmRestoreOpen: boolean;
	restoringItem: boolean;
	deletingItem: boolean;
	checkedItems: Record<string, string | false>;
	isSingleItemAction: boolean;
	searchValue: string;
	searchResults: ObjectItem[];
	actionsContextOpen: boolean;
	actionableItem: ObjectItem | undefined;
	viewFileOpen: boolean;
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	fileToView: FileToView;
	loading: boolean;
}

// ================================
// API Promise Builders
// ================================

export function getDeleteFolderPromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const folderId =
		itemPath.slice(0, -1).split("/").pop() || itemPath.slice(0, -1);
	const parentId = itemPath.slice(0, -1).includes("/")
		? itemPath.slice(0, -1).split("/").slice(0, -1).join("/")
		: undefined;

	return api
		.DELETE("/api/v1/storage/folder/{path}", {
			params: { path: { path: folderId } },
			body: { parentFolderId: parentId },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to delete folder");
			}
			callbacks.onSuccess();
		});
}

export function getTrashFolderPromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const folderId =
		itemPath.slice(0, -1).split("/").pop() || itemPath.slice(0, -1);
	const parentId = itemPath.slice(0, -1).includes("/")
		? itemPath.slice(0, -1).split("/").slice(0, -1).join("/")
		: undefined;

	return api
		.PUT("/api/v1/storage/folder/{path}", {
			params: { path: { path: folderId } },
			body: { isTrashed: true, parentFolderId: parentId },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to move folder to trash");
			}
			callbacks.onSuccess();
		});
}

export function getDeleteForeverPromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	return api
		.DELETE("/api/v1/storage/file/{id}", {
			params: { path: { id: encodeURIComponent(itemPath) } },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to delete file");
			}
			callbacks.onSuccess();
		});
}

export function getTrashFilePromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const fileName = itemPath.includes("/")
		? (itemPath.split("/").pop() ?? itemPath)
		: itemPath;
	const folder = itemPath.includes("/")
		? itemPath.split("/").slice(0, -1).join("/")
		: undefined;

	return api
		.PUT("/api/v1/storage/file/{id}", {
			params: { path: { id: encodeURIComponent(fileName) }, query: { folder } },
			body: { isTrashed: true },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to trash file");
			}
			callbacks.onSuccess();
		});
}

export async function getRestoreFolderPromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const folderId =
		itemPath.slice(0, -1).split("/").pop() || itemPath.slice(0, -1);
	const parentId = itemPath.slice(0, -1).includes("/")
		? itemPath.slice(0, -1).split("/").slice(0, -1).join("/")
		: undefined;

	const { error } = await api.PUT("/api/v1/storage/folder/{path}", {
		params: { path: { path: folderId } },
		body: { isTrashed: false, parentFolderId: parentId },
	});
	if (error) {
		callbacks.onError();
		throw new Error("Failed to restore folder");
	}
	callbacks.onSuccess();
}

export function getRestoreFilePromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const fileName = itemPath.includes("/")
		? (itemPath.split("/").pop() ?? itemPath)
		: itemPath;
	const folder = itemPath.includes("/")
		? itemPath.split("/").slice(0, -1).join("/")
		: undefined;

	return api
		.PUT("/api/v1/storage/file/{id}", {
			params: { path: { id: encodeURIComponent(fileName) }, query: { folder } },
			body: { isTrashed: false },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to restore file");
			}
			callbacks.onSuccess();
		});
}

export function getDuplicateFilePromise(
	itemPath: string,
	callbacks: { onSuccess: () => void; onError: () => void },
): Promise<void> {
	const fileName = itemPath.includes("/")
		? (itemPath.split("/").pop() ?? itemPath)
		: itemPath;
	const folder = itemPath.includes("/")
		? itemPath.split("/").slice(0, -1).join("/")
		: undefined;

	const fullPath = folder ? `${folder}/${fileName}` : fileName;

	return api
		.POST("/api/v1/storage/file/{id}/duplicate", {
			params: { path: { id: encodeURIComponent(fullPath) } },
		})
		.then(({ error }) => {
			if (error) {
				callbacks.onError();
				throw new Error("Failed to duplicate file");
			}
			callbacks.onSuccess();
		});
}

// ================================
// Item Actions Factory
// ================================

export function createTrashActions(handlers: {
	onDeletePermanently: (item: ObjectItem) => void;
	onRestore: (item: ObjectItem) => void;
}): ItemActionGroup[] {
	return [
		{
			actions: [
				{
					title: "Delete permanently",
					icon: TrashIcon,
					iconClass: "text-destructive",
					action: handlers.onDeletePermanently,
					disabled: false,
				},
				{
					title: "Restore",
					icon: ArchiveRestoreIcon,
					action: handlers.onRestore,
					disabled: false,
				},
			],
		},
	];
}

export function createMainActions(handlers: {
	onDownload: (item: ObjectItem) => void;
	onOpenInNewTab: (item: ObjectItem) => void;
	onRename: (item: ObjectItem) => void;
	onMove: (item: ObjectItem) => void;
	onDuplicate: (item: ObjectItem) => void;
	onStar: (item: ObjectItem) => void;
	onShare: (item: ObjectItem) => void;
	onNotes: (item: ObjectItem) => void;
	onMoveToTrash: (item: ObjectItem) => void;
}): ItemActionGroup[] {
	return [
		{
			actions: [
				{
					title: "Download",
					icon: DownloadIcon,
					action: handlers.onDownload,
					// Works for both files and folders (folders download as zip)
				},
				{
					title: "Open in new tab",
					icon: ExternalLinkIcon,
					action: handlers.onOpenInNewTab,
					fileOnly: true,
				},
				{
					title: "Notes",
					icon: MessageSquareTextIcon,
					action: handlers.onNotes,
					fileOnly: true,
				},
				{
					title: "Share",
					icon: ShareIcon,
					action: handlers.onShare,
				},
			],
		},
		{
			actions: [
				{
					title: "Rename",
					icon: PencilLineIcon,
					action: handlers.onRename,
				},
				{
					title: "Move",
					icon: FolderInputIcon,
					action: handlers.onMove,
				},
				{
					title: "Duplicate",
					icon: CopyIcon,
					action: handlers.onDuplicate,
					fileOnly: true,
				},
				{
					title: (item: ObjectItem) =>
						item.metadata.isStarred ? "Unstar" : "Star",
					icon: (item: ObjectItem) =>
						item.metadata.isStarred ? StarOffIcon : StarIcon,
					action: handlers.onStar,
					disabled: false,
					dynamic: true,
				},
			],
		},
		{
			actions: [
				{
					title: "Move to trash",
					icon: TrashIcon,
					iconClass: "text-destructive",
					action: handlers.onMoveToTrash,
					variant: "destructive",
					disabled: false,
				},
			],
		},
	];
}

export function createMainMultipleActions(
	handlers: {
		onDownload: () => void;
		onMove: () => void;
		onStar: () => void;
		onShare: () => void;
		onMoveToTrash: () => void;
	},
	selectedCount: number,
): MultipleItemsAction[] {
	return [
		{
			title: "Download",
			icon: DownloadIcon,
			variant: "outline",
			action: handlers.onDownload,
		},
		{
			title: "Move",
			icon: FolderInputIcon,
			variant: "outline",
			action: handlers.onMove,
		},
		{
			title: "Star",
			icon: StarIcon,
			variant: "outline",
			action: handlers.onStar,
		},
		// A share link addresses exactly one resource, so sharing a set of
		// files has no single meaning. Offered only for one, rather than left
		// as a button that does nothing.
		...(selectedCount === 1
			? [
					{
						title: "Share",
						icon: ShareIcon,
						variant: "outline" as const,
						action: handlers.onShare,
					},
				]
			: []),
		{
			title: "Move to Trash",
			icon: TrashIcon,
			iconClass: "text-destructive",
			variant: "destructive",
			action: handlers.onMoveToTrash,
		},
	];
}

export function createTrashMultipleActions(handlers: {
	onRestore: () => void;
	onDeletePermanently: () => void;
}): MultipleItemsAction[] {
	return [
		{
			title: "Restore",
			icon: ArchiveRestoreIcon,
			variant: "outline",
			action: handlers.onRestore,
		},
		{
			title: "Delete permanently",
			icon: TrashIcon,
			iconClass: "text-destructive",
			variant: "destructive",
			action: handlers.onDeletePermanently,
		},
	];
}

// ================================
// File Operations
// ================================

export function handleDownloadItem(
	itemPath: string,
	onComplete?: () => void,
): void {
	const finalUrl = getObjectUrl({
		baseUrl: page.url,
		itemPath,
		raw: true,
	});

	const a = document.createElement("a");
	a.style.display = "none";
	a.href = finalUrl;
	a.download = itemPath;
	document.body.appendChild(a);
	a.target = "_blank";
	a.click();
	window.URL.revokeObjectURL(finalUrl);
	onComplete?.();
	toast.info(m.toast_downloaded_item({ name: itemPath }));
}

export async function handleOpenItem(
	item: ObjectItem,
	isDesktop: MediaQuery,
	callbacks: {
		setFileToView: (file: FileToView) => void;
		openViewDialog: () => void;
	},
): Promise<void> {
	playableMusic.set(null);

	// A document Penombre can edit opens in its editor rather than a preview:
	// opening a spreadsheet to look at a read-only rendering of it is not what
	// anybody means by "open".
	const editable = kindForName(item.metadata.name ?? item.key);
	if (editable && item.metadata.id) {
		await goto(resolve("/(app)/edit/[fileId]", { fileId: item.metadata.id }));
		return;
	}

	const finalUrl = getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		raw: true,
	});

	if (item.metadata.category === "CODE") {
		const codeReq = await fetch(finalUrl);
		if (!codeReq.ok) {
			toast.error(m.toast_open_code_error(), {
				description: codeReq.statusText,
			});
			return;
		}
		const code = await codeReq.text();
		callbacks.setFileToView({
			item,
			src: finalUrl,
			content: code,
			type: "code",
			language: determineCodeFileLanguage(item),
		});
		callbacks.openViewDialog();
		return;
	}

	if (item.metadata.category === "IMAGES") {
		callbacks.setFileToView({
			item,
			src: finalUrl,
			type: "image",
		});
		callbacks.openViewDialog();
		return;
	}

	if (item.metadata.category === "MUSIC") {
		playableMusic.set({
			title: item.metadata.name || item.key,
			source: finalUrl,
			peaks: peaksUrl(item),
			isPlaying: !dev,
			fileId: item.metadata.id,
		});
		return;
	}

	if (item.metadata.category === "DOCUMENTS" && isDesktop.current) {
		callbacks.setFileToView({
			item,
			src: finalUrl,
			type: "pdf",
		});
		callbacks.openViewDialog();
		return;
	}

	if (item.metadata.category === "VIDEO") {
		callbacks.setFileToView({
			item,
			src: finalUrl,
			type: "video",
		});
		callbacks.openViewDialog();
		return;
	}

	const newTab = window.open(finalUrl, "_blank");
	if (newTab) {
		newTab.focus();
	}
}

// ================================
// Drag-and-drop Move
// ================================

/** Folder a dragged item currently lives in */
export function resolveItemParent(
	item: ObjectItem,
	currentFolder: string,
): string {
	if (item.parentKey) {
		return item.parentKey;
	}
	if (item.key.includes("/")) {
		return item.key.split("/").slice(0, -1).join("/");
	}
	return currentFolder;
}

/** True when a folder is being dropped onto itself or one of its descendants */
export function movesIntoItself(
	fullItemKey: string,
	destinationFolder: string,
): boolean {
	const folderPath = fullItemKey.replace(/\/$/, "");
	return (
		destinationFolder === folderPath ||
		destinationFolder.startsWith(`${folderPath}/`)
	);
}

/** Folders and files move through different endpoints */
export function requestMove(
	item: ObjectItem,
	fullItemKey: string,
	destinationFolder: string,
): Promise<{ error?: unknown; response: Response }> {
	if (item.type !== "folder") {
		return api.POST("/api/v1/storage/file/{id}/move", {
			params: { path: { id: encodeURIComponent(fullItemKey) } },
			body: { destination: destinationFolder },
		});
	}

	const folderId = fullItemKey.split("/").pop() || fullItemKey;
	const parentId = fullItemKey.includes("/")
		? fullItemKey.split("/").slice(0, -1).join("/")
		: undefined;

	return api.POST("/api/v1/storage/folder/{path}/move", {
		params: { path: { path: folderId } },
		body: { parentFolderId: parentId, destination: destinationFolder },
	});
}

// ================================
// Search Helpers
// ================================

export function filterSearchResults(
	data: ObjectList,
	searchValue: string,
): ObjectItem[] {
	if (!data.list || data.list.length === 0) {
		return [];
	}

	return data.list.filter((item) => {
		const display = (item.metadata.name || item.key).toLowerCase();
		return display.includes(searchValue.toLowerCase());
	});
}

// ================================
// Selection Helpers
// ================================

export function computeSelectionState(
	data: ObjectList,
	checkedItems: Record<string, string | false>,
): { allSelected: boolean; indeterminate: boolean } {
	const count = data.count ?? 0;
	const list = data.list ?? [];

	if (count === 0) {
		return { allSelected: false, indeterminate: false };
	}

	const allSelected = list.every((item) => checkedItems[item.key]);
	const someSelected = list.some((item) => !!checkedItems[item.key]);

	return {
		allSelected,
		indeterminate: someSelected && !allSelected,
	};
}

export function selectAllForEmptyTrash(
	data: ObjectList,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const item of data.list ?? []) {
		result[item.key] = item.metadata.name ?? item.key;
	}
	return result;
}

// ================================
// Rename Action Helper
// ================================

export function triggerRenameAction(
	item: ObjectItem,
	closeActionsContext: () => void,
): void {
	closeActionsContext();
	itemAction.set({
		open: true,
		item,
	});
}
