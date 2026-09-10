import {
	ArchiveRestoreIcon,
	CopyIcon,
	DownloadIcon,
	ExternalLinkIcon,
	FolderInputIcon,
	PencilLineIcon,
	ShareIcon,
	StarIcon,
	StarOffIcon,
	TrashIcon,
} from "@lucide/svelte";
import type { MediaQuery } from "svelte/reactivity";
import { toast } from "svelte-sonner";
import { dev } from "$app/environment";
import { page } from "$app/state";
import { api, type ObjectItem, type ObjectList } from "$lib/api";
import type { SupportedLanguage } from "$lib/components/ui/code/shiki";
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

// ================================
// Types
// ================================

export type FileToView = {
	item: ObjectItem;
	src: string;
	type: "image" | "code" | "pdf" | "video";
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
					iconClass: "text-emerald-600 dark:text-emerald-400",
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
	onMoveToTrash: (item: ObjectItem) => void;
}): ItemActionGroup[] {
	return [
		{
			actions: [
				{
					title: "Download",
					icon: DownloadIcon,
					iconClass: "text-sky-600 dark:text-sky-400",
					action: handlers.onDownload,
					// Works for both files and folders (folders download as zip)
				},
				{
					title: "Open in new tab",
					icon: ExternalLinkIcon,
					iconClass: "text-slate-500 dark:text-slate-400",
					action: handlers.onOpenInNewTab,
					fileOnly: true,
				},
				{
					title: "Share",
					icon: ShareIcon,
					iconClass: "text-violet-600 dark:text-violet-400",
					action: handlers.onShare,
				},
			],
		},
		{
			actions: [
				{
					title: "Rename",
					icon: PencilLineIcon,
					iconClass: "text-amber-600 dark:text-amber-400",
					action: handlers.onRename,
				},
				{
					title: "Move",
					icon: FolderInputIcon,
					iconClass: "text-indigo-600 dark:text-indigo-400",
					action: handlers.onMove,
				},
				{
					title: "Duplicate",
					icon: CopyIcon,
					iconClass: "text-teal-600 dark:text-teal-400",
					action: handlers.onDuplicate,
					fileOnly: true,
				},
				{
					title: (item: ObjectItem) =>
						item.metadata.isStarred ? "Unstar" : "Star",
					icon: (item: ObjectItem) =>
						item.metadata.isStarred ? StarOffIcon : StarIcon,
					iconClass: "text-yellow-500",
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

export function createMainMultipleActions(handlers: {
	onDownload: () => void;
	onMove: () => void;
	onMoveToTrash: () => void;
}): MultipleItemsAction[] {
	return [
		{
			title: "Download",
			icon: DownloadIcon,
			iconClass: "text-sky-600 dark:text-sky-400",
			variant: "outline",
			action: handlers.onDownload,
		},
		{
			title: "Move",
			icon: FolderInputIcon,
			iconClass: "text-indigo-600 dark:text-indigo-400",
			variant: "outline",
			action: handlers.onMove,
		},
		{
			title: "Star",
			icon: StarIcon,
			iconClass: "text-yellow-500",
			variant: "outline",
			action: () => [],
		},
		{
			title: "Share",
			icon: ShareIcon,
			iconClass: "text-violet-600 dark:text-violet-400",
			variant: "outline",
			action: () => [],
		},
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
			iconClass: "text-emerald-600 dark:text-emerald-400",
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

export function handleOpenItemInNewTab(item: ObjectItem): void {
	const finalUrl = getObjectUrl({
		baseUrl: page.url,
		itemPath: item.key,
		raw: true,
	});
	window.open(finalUrl);
}

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
			isPlaying: !dev,
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
