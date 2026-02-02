import { createHash } from "node:crypto";
import { dev } from "$app/environment";
import { Logger } from "$lib/logger";
import { FileOrFolderNotFoundError } from "$lib/server/errors";
import type { ObjectItem } from "$lib/server/schema";
import type { StorageService } from "$lib/server/services/storage";

const logger = new Logger("FileProxyService");

export interface FileProxyRequest {
	itemName: string;
	raw?: boolean;
	thumbnail?: boolean;
	size?: "small" | "medium" | "large";
	ifNoneMatch?: string;
	rangeHeader?: string;
}

export interface INewFileProxyService {
	storageService: StorageService;
	userId: string;
}

export class FileProxyService {
	private storageService: StorageService;
	private userId: string;

	constructor(props: INewFileProxyService) {
		this.storageService = props.storageService;
		this.userId = props.userId;
	}

	/**
	 * Generate ETag from file metadata for conditional requests.
	 */
	private generateETag(data: { size: number; mtime: number }): string {
		const hash = createHash("md5")
			.update(`${data.size}-${data.mtime}`)
			.digest("hex");
		return `"${hash}"`;
	}

	/**
	 * Handle thumbnail requests with caching
	 */
	async handleThumbnail(
		itemName: string,
		size: "small" | "medium" | "large" = "medium",
		ifNoneMatch?: string,
	): Promise<Response | null> {
		logger.debug(`Fetching thumbnail for: ${itemName}`);

		const thumbSize = size === "small" ? 100 : size === "medium" ? 200 : 300;
		const thumbData = await this.storageService.getThumbnail(
			itemName,
			thumbSize,
		);

		if (!thumbData) {
			logger.debug(
				`Thumbnail generation failed, falling back to raw for: ${itemName}`,
			);
			return null;
		}

		const etag = this.generateETag({
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

	/**
	 * Handle raw file requests with range support and caching
	 */
	async handleRawFile(
		itemName: string,
		ifNoneMatch?: string,
		rangeHeader?: string,
	): Promise<Response> {
		logger.debug(`Fetching raw file data for: ${itemName}`);

		const fileData = await this.storageService.getRawFileData(itemName);
		if (!fileData) {
			logger.debug(`File not found: ${itemName}`);
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		logger.debug(`Raw file data retrieved for: ${itemName}`);
		logger.debug(`Checking ownership for user: ${this.userId}`);

		if (fileData.meta.metadata.owner !== this.userId) {
			logger.debug(`Unauthorized access attempt by user: ${this.userId}`);
			throw new Error("Unauthorized");
		}

		logger.debug(`User authorized: ${this.userId}, preparing file response`);

		const etag = this.generateETag({
			size: fileData.file.size,
			mtime: fileData.file.lastModified,
		});

		// Check ETag for 304 Not Modified
		if (ifNoneMatch === etag && !dev) {
			logger.debug("ETag match, returning 304 Not Modified");
			return new Response(null, {
				status: 304,
				headers: {
					ETag: etag,
					"Cache-Control": "public, max-age=3600",
				},
			});
		}

		// Handle range requests
		if (rangeHeader) {
			logger.debug("Generating range headers for partial content");
			// Note: In actual use, headers should be passed from request
			const { chunk, headers: newHeaders } =
				this.storageService.generateRangeHeaders({
					file: fileData.file,
					object: fileData.meta,
					headers: { range: rangeHeader },
				});

			newHeaders.set("ETag", etag);
			logger.debug("Returning partial content response with status 206");
			return new Response(chunk, {
				status: 206,
				headers: newHeaders,
			});
		}

		// Full file response
		logger.debug("Returning full file response with status 200");
		const newHeaders = this.storageService.generateRawFileHeaders({
			file: fileData.file,
			object: fileData.meta,
		});

		logger.debug("headers");
		for (const header of newHeaders) {
			logger.debug(header);
		}

		newHeaders.set("ETag", etag);

		const buffer = await fileData.file.arrayBuffer();
		logger.debug(
			"File response prepared, sending response with display name from metadata",
		);

		return new Response(buffer, {
			headers: newHeaders,
			status: 200,
		});
	}

	/**
	 * Handle metadata-only file requests
	 */
	async handleMetadata(itemName: string): Promise<ObjectItem> {
		logger.debug(`Fetching file metadata for: ${itemName}`);

		const file = await this.storageService.getFile(itemName);
		if (!file) {
			logger.debug(`File not found: ${itemName}`);
			throw new FileOrFolderNotFoundError(`File not found: ${itemName}`);
		}

		logger.debug("Checking file ownership");
		if (file.metadata.owner !== this.userId) {
			logger.debug(`Unauthorized access attempt by user: ${this.userId}`);
			throw new Error("Unauthorized");
		}

		logger.debug("File metadata retrieved successfully");
		return file;
	}

	/**
	 * Main proxy handler - routes request to appropriate handler
	 */
	async handleRequest(req: FileProxyRequest): Promise<Response | ObjectItem> {
		const { itemName, raw, thumbnail, size, ifNoneMatch, rangeHeader } = req;

		// Handle thumbnail requests
		if (thumbnail) {
			const thumbResponse = await this.handleThumbnail(
				itemName,
				size,
				ifNoneMatch,
			);
			if (thumbResponse) {
				return thumbResponse;
			}
			// Fall through to raw file if thumbnail fails
		}

		// Handle raw file requests
		if (raw || thumbnail) {
			return this.handleRawFile(itemName, ifNoneMatch, rangeHeader);
		}

		// Handle metadata-only requests
		return this.handleMetadata(itemName);
	}
}
