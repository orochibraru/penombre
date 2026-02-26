/** Utility helpers shared across the mobile app */

/**
 * Format bytes into a human-readable string (e.g. "1.5 MB").
 */
export function readableFileSize(bytes?: number): string {
	if (bytes == null || bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const size = bytes / 1024 ** i;
	return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format a date string into a locale-friendly short format.
 */
export function prettyDate(date?: string): string {
	if (!date) return "";
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format a date string into a relative time (e.g. "2 hours ago").
 */
export function relativeTime(date?: string): string {
	if (!date) return "";
	const now = Date.now();
	const then = new Date(date).getTime();
	const diff = now - then;

	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "just now";

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;

	return prettyDate(date);
}

/**
 * Check if an item is a folder.
 */
export function isFolder(type: string): boolean {
	return type === "folder";
}

/**
 * Get a display-friendly content type label.
 */
export function contentTypeLabel(contentType: string): string {
	const map: Record<string, string> = {
		"application/pdf": "PDF",
		"image/jpeg": "JPEG",
		"image/png": "PNG",
		"image/gif": "GIF",
		"image/webp": "WebP",
		"video/mp4": "MP4",
		"audio/mpeg": "MP3",
		"audio/flac": "FLAC",
		"text/plain": "Text",
		"application/json": "JSON",
		"application/zip": "ZIP",
	};
	return map[contentType] ?? contentType.split("/").pop()?.toUpperCase() ?? "";
}

/**
 * Get the SF Symbol name for a file category.
 */
export function categoryIcon(category: string): string {
	const icons: Record<string, string> = {
		MUSIC: "music.note",
		DOCUMENTS: "doc.text",
		IMAGES: "photo",
		"3D": "cube",
		VIDEO: "film",
		CODE: "chevron.left.forwardslash.chevron.right",
		ARCHIVES: "archivebox",
		UNKNOWN: "doc",
	};
	return icons[category] ?? "doc";
}

/**
 * Get the SF Symbol name for a file's content type.
 */
export function fileIcon(
	type: "file" | "folder",
	contentType?: string,
): string {
	if (type === "folder") return "folder.fill";

	if (!contentType) return "doc";

	if (contentType.startsWith("image/")) return "photo";
	if (contentType.startsWith("video/")) return "film";
	if (contentType.startsWith("audio/")) return "music.note";
	if (contentType === "application/pdf") return "doc.text";
	if (contentType.startsWith("text/")) return "doc.plaintext";
	if (
		contentType.includes("zip") ||
		contentType.includes("archive") ||
		contentType.includes("compressed")
	)
		return "archivebox";

	return "doc";
}
