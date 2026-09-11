import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";
import { resolve } from "$app/paths";
import type { Pathname } from "$app/types";
import type { ObjectItem, ObjectList } from "$lib/api";
import type { ButtonVariant } from "$lib/components/ui/button";
import { m } from "$lib/paraglide/messages.js";

/**
 * A version of clsx that uses tailwind-merge to merge classes.
 *
 * This is needed because clsx does not support Tailwind's special syntax for
 * merging classes, such as `hover:text-blue-500 dark:hover:text-blue-300`.
 *
 * @param {ClassValue[]} inputs - The classes to merge.
 * @returns {string} - The merged classes.
 *
 * @example
 * cn("text-blue-500", "hover:text-blue-300", "dark:hover:text-blue-600") // "text-blue-500 hover:text-blue-300 dark:hover:text-blue-600"
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Takes a kebab-cased string and converts it to a more human-readable form.
 *
 * @param {string} name - The kebab-cased string to convert.
 * @returns {string} - The more human-readable string.
 *
 * @example
 * prettierName("hello-world") // "Hello World"
 * prettierName("my-other-app") // "My Other App"
 */
export function prettierName(name?: string): string {
	if (!name) {
		return "";
	}
	let nameSplit = name.split("-");
	nameSplit = nameSplit.map(
		(name) => name.charAt(0).toUpperCase() + name.slice(1),
	);
	return nameSplit.join(" ");
}

export function toSnake(input: string) {
	return input.replaceAll(" ", "-").toLowerCase();
}

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} val - The string to capitalize.
 * @returns {string} - The string with the first letter capitalized.
 *
 * @example
 * capitalizeFirstLetter("hello") // "Hello"
 */
export function capitalizeFirstLetter(val: string): string {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: unknown }
	? Omit<T, "child">
	: T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: unknown }
	? Omit<T, "children">
	: T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};

export function prettyDate(date: Date | string) {
	return new Date(date).toLocaleString(navigator.language, {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const registeredUuids: string[] = [];

export function generateUuid() {
	const generated = uuidv4();

	if (registeredUuids.find((id) => id === generated)) {
		return uuidv4();
	}

	registeredUuids.push(generated);

	return generated;
}

export function readableFileSize(bytes: number, si = false, dp = 1) {
	if (Number.isNaN(bytes)) {
		return "-";
	}

	if (bytes === 0) {
		return "0 B";
	}
	const thresh = si ? 1000 : 1024;

	if (Math.abs(bytes) < thresh) {
		return `${bytes} B`;
	}

	const units = si
		? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		: ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
	let u = -1;
	const r = 10 ** dp;
	let size = bytes;

	do {
		size /= thresh;
		++u;
	} while (
		Math.round(Math.abs(size) * r) / r >= thresh &&
		u < units.length - 1
	);

	return `${size.toFixed(dp)} ${units[u]}`;
}

export function secondsToMinutes(seconds: number) {
	return new Date(seconds * 1000).toISOString().slice(14, 19);
}

export type AugmentedItem = ObjectItem & {
	checked: boolean;
};

export type AugmentedList = AugmentedItem[];

export interface IHttpError {
	body: {
		message: string;
	};
	status: number;
}

export class HttpError {
	public body: IHttpError["body"];
	public status: number;

	constructor(err: IHttpError) {
		this.body = err.body;
		this.status = err.status;
	}
}

export function getCookie(name: string): string | undefined {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()?.split(";").shift();
	}
}

export function isFolderItem(item: ObjectItem) {
	return item.key.endsWith("/");
}

export interface MultipleItemsAction {
	title: string;
	/** Tailwind colour classes for the icon — see `ItemAction.iconClass`. */
	iconClass?: string;
	// biome-ignore lint/suspicious/noExplicitAny: Lucide icon component type is complex
	icon: any;
	action: () => void;
	variant: ButtonVariant;
}

export interface ItemAction {
	title: string | ((item: ObjectItem) => string);
	// biome-ignore lint/suspicious/noExplicitAny: Lucide icon component type is complex
	icon: any;
	action: (item: ObjectItem) => void;
	variant?: "default" | "destructive";
	/**
	 * Tailwind colour classes for the icon.
	 *
	 * The menu is used by muscle memory far more than it is read, and a column
	 * of identical grey glyphs gives nothing to aim at. Colour is decoration
	 * only — the label still carries the meaning.
	 */
	iconClass?: string;
	disabled?: boolean;
	fileOnly?: boolean;
	folderOnly?: boolean;
	/** Set to true when title/icon are functions that need the item to resolve */
	dynamic?: boolean;
}

export interface ItemActionGroup {
	actions: ItemAction[];
}

export type SortColumn = "name" | "size" | "updatedAt" | null;
export type SortDirection = "asc" | "desc";

export interface SharedFileDisplayProps {
	handleOpenItem: (item: ObjectItem) => void;
	files: ObjectList;
	actionableItem: ObjectItem | undefined;
	actionsContextOpen: boolean;
	checkedItems: Record<string, string | false>;
	allSelected: boolean;
	indeterminate: boolean;
	itemActions: ItemActionGroup[];
	loading: boolean;
	searchValue: string;
	searchResults: ObjectItem[];
	onDrop?: (files: File[]) => void;
	onUpload?: () => void;
	onCreateFolder?: () => void;
	sortColumn?: SortColumn;
	sortDirection?: SortDirection;
	draggedItem?: ObjectItem | undefined;
	dropTargetKey?: string | undefined;
	onDragStart?: (item: ObjectItem) => void;
	onDragEnd?: () => void;
	onDropOnFolder?: (targetFolder: string) => void;
}

/**
 * Drop-target key for the `..` row. Folder keys always end in `/`
 * (see `isFolderItem`), so this can't collide with a real row's key, and
 * `resolveDropDestination` maps it to a path before anything reaches the API.
 */
export const PARENT_KEY = "..";

/**
 * Parent of the folder currently being browsed, or `undefined` when there is
 * none to go up to: at the drive root, and on every listing that isn't
 * `/browse/[...path]` (recent, starred, categories, trash), where `path` is
 * unset. Callers use `undefined` to decide whether to render the `..` row.
 */
export function resolveParentPath(
	currentPath: string | undefined,
): string | undefined {
	if (!currentPath) {
		return undefined;
	}
	return currentPath.split("/").slice(0, -1).join("/");
}

/** Where `/browse` lives for a given parent path ("" is the drive root) */
export function parentHref(parentPath: string) {
	return parentPath
		? resolve("/(app)/browse/[...path]", { path: parentPath })
		: resolve("/(app)/browse");
}

/**
 * Absolute destination for a drop on a row of the current listing: either the
 * `..` row (the parent) or a folder row (a child of the current folder).
 */
export function resolveDropDestination(
	folderKey: string,
	currentPath: string | undefined,
): string {
	if (folderKey === PARENT_KEY) {
		return resolveParentPath(currentPath) ?? "";
	}
	const key = folderKey.replace(/\/$/, "");
	return currentPath ? `${currentPath}/${key}` : key;
}

export interface BreadCrumb {
	title: string;
	href: Pathname;
}

export function stripFolders(filePath: string): string {
	if (!filePath) {
		return "";
	}

	// Find the index of the last occurrence of either a forward slash or a backslash.
	const lastSlashIndex = Math.max(
		filePath.lastIndexOf("/"),
		filePath.lastIndexOf("\\"),
	);

	// If a separator is found, return the part of the string after it.
	// Otherwise, the string is just a filename, so return it as is.
	return filePath.slice(lastSlashIndex + 1);
}

export function shouldDisplayAction({
	action,
	item,
}: {
	action: ItemAction;
	item: ObjectItem;
}) {
	const isFolder = isFolderItem(item);
	if (isFolder && action.fileOnly) {
		return false;
	}

	if (!isFolder && action.folderOnly) {
		return false;
	}

	return true;
}

export enum ItemStatus {
	UPLOADING = "uploading",
	JUST_UPLOADED = "uploaded",
	VALIDATED = "validated",
	ERROR = "error",
}

export function buildOriginUrl(url: URL): URL {
	return new URL(`${url.protocol}//${url.host}`);
}

/**
 * Detect if we're running in a server-side context (SSR).
 */
export function isServerSide(): boolean {
	return typeof window === "undefined";
}

/**
 * Get the base URL for API calls.
 * In browser, uses current origin. In SSR, uses the provided URL's origin.
 */
export function getBaseUrl(url: URL): string {
	const baseUrl = buildOriginUrl(url);
	let stringUrl = baseUrl.toString();
	if (stringUrl.endsWith("/")) {
		// Strip trailing slash if present
		stringUrl = stringUrl.slice(0, -1);
	}
	return stringUrl;
}
/**
 * Get the icon type for a file based on its content type.
 * Returns the icon type that should be displayed for the file.
 */
export function getFileIconType(
	contentType?: string,
):
	| "word"
	| "excel"
	| "powerpoint"
	| "gdoc"
	| "gsheet"
	| "gslide"
	| "pdf"
	| "code"
	| "archive"
	| "default" {
	if (!contentType) {
		return "default";
	}

	// Microsoft Office
	if (
		contentType === "application/msword" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return "word";
	}
	if (
		contentType === "application/vnd.ms-excel" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return "excel";
	}
	if (
		contentType === "application/vnd.ms-powerpoint" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.presentationml.presentation"
	) {
		return "powerpoint";
	}

	// Google Suite
	if (contentType === "application/vnd.google-apps.document") {
		return "gdoc";
	}
	if (contentType === "application/vnd.google-apps.spreadsheet") {
		return "gsheet";
	}
	if (contentType === "application/vnd.google-apps.presentation") {
		return "gslide";
	}

	// PDF
	if (contentType === "application/pdf") {
		return "pdf";
	}

	// Code files
	if (
		contentType === "application/json" ||
		contentType === "application/xml" ||
		contentType === "application/javascript" ||
		contentType === "text/plain" ||
		contentType === "text/html" ||
		contentType === "text/css" ||
		contentType === "text/yaml"
	) {
		return "code";
	}

	// Archives
	if (
		contentType === "application/zip" ||
		contentType === "application/vnd.rar" ||
		contentType === "application/x-7z-compressed" ||
		contentType === "application/x-tar" ||
		contentType === "application/gzip"
	) {
		return "archive";
	}

	return "default";
}
/**
 * Gets the appropriate document type for icon display based on content type.
 * Used to show specific icons for different document types.
 */
export function getDocumentType(
	contentType?: string,
):
	| "word"
	| "excel"
	| "powerpoint"
	| "pdf"
	| "gdoc"
	| "gsheet"
	| "gslide"
	| null {
	if (!contentType) {
		return null;
	}

	// Office Word formats
	if (
		contentType === "application/msword" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return "word";
	}

	// Office Excel formats
	if (
		contentType === "application/vnd.ms-excel" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return "excel";
	}

	// Office PowerPoint formats
	if (
		contentType === "application/vnd.ms-powerpoint" ||
		contentType ===
			"application/vnd.openxmlformats-officedocument.presentationml.presentation"
	) {
		return "powerpoint";
	}

	// PDF
	if (contentType === "application/pdf") {
		return "pdf";
	}

	// Google Suite
	if (contentType === "application/vnd.google-apps.document") {
		return "gdoc";
	}

	if (contentType === "application/vnd.google-apps.spreadsheet") {
		return "gsheet";
	}

	if (contentType === "application/vnd.google-apps.presentation") {
		return "gslide";
	}

	return null;
}

/**
 * "1 file · 12 KB" / "3 files · 1.2 MB".
 *
 * Paraglide's variant syntax is more ceremony than two keys and a ternary
 * for the one case we have; every locale here pluralises on `count === 1`.
 */
export function filesCountLabel(count: number, size: string): string {
	return count === 1
		? m.storage_files_count_one({ count: String(count), size })
		: m.storage_files_count({ count: String(count), size });
}

/** "1 user on this instance" / "4 users on this instance". */
export function usersCountLabel(count: number): string {
	return count === 1
		? m.admin_users_count_one({ count: String(count) })
		: m.admin_users_count({ count: String(count) });
}

/** "1 download" / "12 downloads". */
export function downloadsCountLabel(count: number): string {
	return count === 1
		? m.share_download_count_one({ count: String(count) })
		: m.share_download_count({ count: String(count) });
}

/** "Trash holds 1 file (2 KB)" / "Trash holds 4 files (8 MB)". */
export function trashHoldsLabel(count: number, size: string): string {
	return count === 1
		? m.storage_trash_holds_one({ count: String(count), size })
		: m.storage_trash_holds({ count: String(count), size });
}

/**
 * A random identifier that works outside a secure context.
 *
 * `crypto.randomUUID()` is secure-context only: on a self-hosted instance
 * reached over plain HTTP at a LAN address it is simply `undefined`, and
 * calling it takes down whatever component asked for an id. `getRandomValues`
 * has no such restriction; `Math.random` is the last resort, which is fine
 * because nothing here is a security boundary — these are keys in a local
 * queue, not tokens.
 */
export function randomId(): string {
	if (typeof crypto !== "undefined") {
		if (typeof crypto.randomUUID === "function") {
			return crypto.randomUUID();
		}
		if (typeof crypto.getRandomValues === "function") {
			const bytes = crypto.getRandomValues(new Uint8Array(16));
			return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
		}
	}
	return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Toggle browser full screen for `element`.
 *
 * iOS Safari implements none of the Fullscreen API on anything but a
 * `<video>`, and only under a webkit name, so the video is the fallback
 * target when the standard call is unavailable.
 */
export function toggleFullscreen(
	element: HTMLElement | null,
	video?: HTMLVideoElement | null,
): void {
	if (document.fullscreenElement) {
		void document.exitFullscreen();
		return;
	}
	if (element?.requestFullscreen) {
		void element.requestFullscreen();
		return;
	}
	(
		video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
	)?.webkitEnterFullscreen?.();
}
