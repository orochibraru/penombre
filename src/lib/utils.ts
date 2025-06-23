import { browser } from '$app/environment';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
		return '';
	}
	let nameSplit = name.split('-');
	nameSplit = nameSplit.map((name) => name.charAt(0).toUpperCase() + name.slice(1));
	return nameSplit.join(' ');
}

export function toSnake(input: string) {
	return input.replaceAll(' ', '-').toLowerCase();
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
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function prettyDate(date: Date) {
	if (!browser) {
		return date.toLocaleString();
	}
	return date.toLocaleString(navigator.language, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
