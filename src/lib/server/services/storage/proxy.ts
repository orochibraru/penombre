/**
 * HTTP responses for the file proxy route: thumbnails, raw bytes (with range
 * and ETag support) and plain metadata, chosen by the request's flags.
 */

import { and, eq } from "drizzle-orm";
import { dev } from "$app/environment";
import { Logger } from "$lib/logger";
import { files } from "$lib/server/db/schema";
import {
	FileOrFolderNotFoundError,
	UnauthorizedError,
} from "$lib/server/errors";
import type { ObjectItem } from "$lib/server/schema";
import type { StorageContext } from "./context";
import { generateETag } from "./mappers";
import type { ThumbnailService } from "./thumbnails";

const proxyLogger = new Logger("FileProxyService");

export interface FileProxyRequest {
	itemName: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: "small" | "medium" | "large";
	ifNoneMatch?: string;
	rangeHeader?: string;
}

export class ProxyService {
	constructor(
		private readonly ctx: StorageContext,
		private readonly thumbnails: ThumbnailService,
		/** Passed in by StorageService so the proxy stays independent of file operations */
		private readonly getFileItem: (path: string) => Promise<ObjectItem>,
	) {}

	async handleThumbnailRequest(
		itemName: string,
		size: "small" | "medium" | "large" = "medium",
		ifNoneMatch?: string,
	): Promise<Response | null> {
		proxyLogger.debug(`Fetching thumbnail for: ${itemName}`);
		const thumbSize = size === "small" ? 100 : size === "medium" ? 200 : 300;
		const thumbData = await this.thumbnails.getThumbnail(itemName, thumbSize);

		if (!thumbData) {
			proxyLogger.debug(
				`Thumbnail generation failed, falling back to raw for: ${itemName}`,
			);
			return null;
		}

		const etag = generateETag({
			size: thumbData.buffer.length,
			mtime: Date.now(),
		});

		if (ifNoneMatch === etag) {
			return new Response(null, { status: 304 });
		}

		return new Response(new Uint8Array(thumbData.buffer), {
			headers: {
				"Content-Type": thumbData.contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
				"Content-Length": thumbData.buffer.length.toString(),
				ETag: etag,
			},
			status: 200,
		});
	}

	async handleRawFile(
		itemName: string,
		ifNoneMatch?: string,
		rangeHeader?: string,
	): Promise<Response> {
		proxyLogger.debug(`Fetching raw file data for: ${itemName}`);

		const [file] = await this.ctx.db
			.select()
			.from(files)
			.where(
				and(eq(files.path, itemName), eq(files.ownerId, this.ctx.user.id)),
			);

		if (!file) {
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		const etag = generateETag({
			size: file.size,
			mtime: file.updatedAt.getTime(),
		});

		if (ifNoneMatch === etag && !dev) {
			proxyLogger.debug("ETag match, returning 304 Not Modified");
			return new Response(null, {
				status: 304,
				headers: { ETag: etag, "Cache-Control": "public, max-age=3600" },
			});
		}

		if (rangeHeader) {
			proxyLogger.debug("Generating range headers for partial content");
			const size = file.size;
			const parts = rangeHeader.replace(/bytes=/, "").split("-");
			const start = Number(parts[0]);
			const end = parts[1] ? Number(parts[1]) : size - 1;

			if (Number.isNaN(start)) {
				throw new Error("Invalid range");
			}

			const stream = await this.ctx.driver.getObjectStream(
				itemName,
				start,
				end,
			);

			return new Response(stream, {
				status: 206,
				headers: {
					"Content-Type": file.contentType,
					"Content-Range": `bytes ${start}-${end}/${size}`,
					"Content-Length": String(end - start + 1),
					"Accept-Ranges": "bytes",
					ETag: etag,
				},
			});
		}

		proxyLogger.debug("Returning full file response");
		const stream = await this.ctx.driver.getObjectStream(itemName);
		const encodedName = encodeURIComponent(file.name);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": file.contentType,
				"Accept-Ranges": "bytes",
				"Content-Length": String(file.size),
				"Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
				ETag: etag,
			},
		});
	}

	async handleMetadata(itemName: string): Promise<ObjectItem> {
		proxyLogger.debug(`Fetching file metadata for: ${itemName}`);
		const file = await this.getFileItem(itemName);
		if (file.metadata.owner !== this.ctx.user.id) {
			proxyLogger.debug(
				`Unauthorized access attempt by user: ${this.ctx.user.id}`,
			);
			throw new UnauthorizedError("Unauthorized");
		}
		return file;
	}

	async handleProxyRequest(
		req: FileProxyRequest,
	): Promise<Response | ObjectItem> {
		const { itemName, raw, thumbnail, size, ifNoneMatch, rangeHeader } = req;

		if (thumbnail) {
			const thumbResponse = await this.handleThumbnailRequest(
				itemName,
				size,
				ifNoneMatch,
			);
			if (thumbResponse) {
				return thumbResponse;
			}
		}

		if (raw || thumbnail) {
			return this.handleRawFile(itemName, ifNoneMatch, rangeHeader);
		}

		return this.handleMetadata(itemName);
	}
}
