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
import { invalidate } from "$app/navigation";
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

export type WrapperState = {
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
};

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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
		console.error(error);
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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
		.then(async ({ error }) => {
			if (error) {
				console.error(error);
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
					title: "Share",
					icon: ShareIcon,
					action: () => [],
					disabled: true,
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
			action: () => [],
		},
		{
			title: "Share",
			icon: ShareIcon,
			variant: "outline",
			action: () => [],
		},
		{
			title: "Move to Trash",
			icon: TrashIcon,
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

	if (item.metadata.category === "DOCUMENTS") {
		if (isDesktop.current) {
			callbacks.setFileToView({
				item,
				src: finalUrl,
				type: "pdf",
			});
			callbacks.openViewDialog();
			return;
		}
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
// Bulk Operations
// ================================

export async function executeRestoreOperation(
	checkedItems: Record<string, string | false>,
	callbacks: {
		setRestoringItem: (v: boolean) => void;
		setConfirmRestoreOpen: (v: boolean) => void;
		setActionsContextOpen: (v: boolean) => void;
		clearCheckedItems: () => void;
		setActionableItem: (v: ObjectItem | undefined) => void;
	},
): Promise<void> {
	const keys = Object.keys(checkedItems);
	if (keys.length === 0) return;

	const promises: Promise<void>[] = [];
	const count = keys.length;

	callbacks.setActionsContextOpen(false);

	for (const checkedItem of keys) {
		callbacks.setRestoringItem(true);
		const itemPath = page.params.path
			? `${page.params.path}/${checkedItem}`
			: checkedItem;

		if (itemPath.endsWith("/")) {
			promises.push(
				getRestoreFolderPromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmRestoreOpen(false);
						callbacks.setRestoringItem(false);
					},
					onError: () => callbacks.setRestoringItem(false),
				}),
			);
		} else {
			promises.push(
				getRestoreFilePromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmRestoreOpen(false);
						callbacks.setRestoringItem(false);
					},
					onError: () => callbacks.setRestoringItem(false),
				}),
			);
		}
	}

	let failures = 0;

	toast.promise(
		Promise.all(promises)
			.catch(() => {
				failures += 1;
			})
			.finally(async () => {
				callbacks.clearCheckedItems();
				callbacks.setActionsContextOpen(false);
				callbacks.setActionableItem(undefined);
				await invalidate("app:files");
			}),
		{
			loading: m.toast_restoring_items({ count: String(count) }),
			success: m.toast_items_restored({ count: String(count) }),
			error: m.toast_restore_items_error({ count: String(failures) }),
		},
	);
}

export async function executeDeleteOperation(
	checkedItems: Record<string, string | false>,
	isTrash: boolean,
	callbacks: {
		setDeletingItem: (v: boolean) => void;
		setConfirmDeleteOpen: (v: boolean) => void;
		setActionsContextOpen: (v: boolean) => void;
		clearCheckedItems: () => void;
		setActionableItem: (v: ObjectItem | undefined) => void;
	},
): Promise<void> {
	const keys = Object.keys(checkedItems);
	if (keys.length === 0) return;

	const promises: Promise<void>[] = [];
	const amount = keys.length;

	callbacks.setActionsContextOpen(false);

	for (const checkedItem of keys) {
		callbacks.setDeletingItem(true);
		// On trash page, items already contain full paths; otherwise prepend current folder path
		const itemPath =
			isTrash || !page.params.path
				? checkedItem
				: `${page.params.path}/${checkedItem}`;

		const isFolder = itemPath.endsWith("/");

		if (isFolder) {
			if (isTrash) {
				promises.push(
					getDeleteFolderPromise(itemPath, {
						onSuccess: () => {
							callbacks.setConfirmDeleteOpen(false);
							callbacks.setDeletingItem(false);
						},
						onError: () => callbacks.setDeletingItem(false),
					}),
				);
			} else {
				promises.push(
					getTrashFolderPromise(itemPath, {
						onSuccess: () => {
							callbacks.setConfirmDeleteOpen(false);
							callbacks.setDeletingItem(false);
						},
						onError: () => callbacks.setDeletingItem(false),
					}),
				);
			}
			continue;
		}

		if (isTrash) {
			promises.push(
				getDeleteForeverPromise(itemPath, {
					onSuccess: () => {
						callbacks.setConfirmDeleteOpen(false);
						callbacks.setDeletingItem(false);
					},
					onError: () => callbacks.setDeletingItem(false),
				}),
			);
			continue;
		}

		promises.push(
			getTrashFilePromise(itemPath, {
				onSuccess: () => {
					callbacks.setConfirmDeleteOpen(false);
					callbacks.setDeletingItem(false);
				},
				onError: () => callbacks.setDeletingItem(false),
			}),
		);
	}

	let failures = 0;

	toast.promise(
		Promise.all(promises)
			.catch(() => {
				failures += 1;
			})
			.finally(async () => {
				callbacks.clearCheckedItems();
				callbacks.setActionsContextOpen(false);
				callbacks.setActionableItem(undefined);
				await invalidate("app:files");
			}),
		{
			loading: isTrash
				? m.toast_deleting_permanently({ count: String(amount) })
				: m.toast_moving_to_trash({ count: String(amount) }),
			success: isTrash
				? m.toast_items_deleted_permanently({ count: String(amount) })
				: m.toast_items_moved_to_trash({ count: String(amount) }),
			error: isTrash
				? m.toast_delete_permanently_error({ count: String(failures) })
				: m.toast_move_to_trash_error({ count: String(failures) }),
		},
	);
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
