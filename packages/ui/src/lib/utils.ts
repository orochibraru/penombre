import type { Icon as IconType } from "@lucide/svelte";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";
import { dev } from "$app/environment";
import type { ObjectItem, ObjectList } from "$lib/api";
import type { ButtonVariant } from "$lib/components/ui/button";

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

	registeredUuids.push;

	return generated;
}

export function humanFileSize(bytes: number, si = false, dp = 1) {
	if (!bytes || Number.isNaN(bytes)) {
		return "-";
	}

	if (bytes === 0) {
		return null;
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
	if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export function isFolderItem(item: ObjectItem) {
	return item.key.endsWith("/");
}

export type MultipleItemsAction = {
	title: string;
	icon: typeof IconType;
	action: () => void;
	variant: ButtonVariant;
};

export type ItemAction = {
	title: string;
	icon: typeof IconType;
	action: (item: ObjectItem) => void;
	disabled?: boolean;
	fileOnly?: boolean;
	folderOnly?: boolean;
};

export type ItemActionGroup = {
	actions: ItemAction[];
};

export type SharedFileDisplayProps = {
	handleOpenItem: (item: ObjectItem) => void;
	files: ObjectList;
	actionableItem: ObjectItem | undefined;
	actionsContextOpen: boolean;
	checkedItems: Record<string, boolean>;
	allSelected: boolean;
	indeterminate: boolean;
	itemActions: ItemActionGroup[];
	loading: boolean;
	searchValue: string;
	searchResults: ObjectItem[];
};

export type BreadCrumb = {
	title: string;
	href: string;
};

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
	return filePath.substring(lastSlashIndex + 1);
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
 * In SSR, we should use localhost to avoid deadlock when calling the API.
 */
export function isServerSide(): boolean {
	return typeof window === "undefined";
}

export function getBaseUrl(url: URL): string {
	// In SSR (server-side), ALWAYS use localhost to avoid deadlock
	// The server calling itself via external URL will block forever
	if (isServerSide()) {
		return "http://localhost:8080";
	}

	// In browser, use the current origin (dev or prod)
	const baseUrl: URL = dev
		? new URL("http://localhost:8080")
		: buildOriginUrl(url);

	let stringUrl = baseUrl.toString();
	if (stringUrl.endsWith("/")) {
		// Strip trailing slash if present
		stringUrl = stringUrl.slice(0, -1);
	}
	return stringUrl;
}
