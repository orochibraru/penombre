import { FileCategoryEnum } from "$lib/file-helpers";
import type { FileCategory, FileContentType } from "$lib/server/schema";
import fileTypesData from "./file-types.json";

interface FileTypesMapping {
	contentTypes: Record<string, FileContentType>;
	categories: Record<string, FileCategory>;
}

/**
 * Service for determining file content types and categories based on file extensions.
 */
export class ContentTypeService {
	private readonly contentTypes: Record<string, FileContentType>;
	private readonly categories: Record<string, FileCategory>;

	constructor() {
		const fileTypes = fileTypesData as FileTypesMapping;
		this.contentTypes = fileTypes.contentTypes;
		this.categories = fileTypes.categories;
	}

	/**
	 * Determines the MIME type of a file based on its extension.
	 */
	determineContentType(key: string): FileContentType {
		const extension = key.split(".").pop()?.toLowerCase();
		if (!extension) {
			return "application/octet-stream";
		}
		console.debug("Searching content type for", extension);
		return this.contentTypes[extension] || "application/octet-stream";
	}

	/**
	 * Determines the category of a file based on its extension.
	 */
	determineCategory(key: string): FileCategory {
		const extension = key.split(".").pop()?.toLowerCase();
		if (!extension) {
			return FileCategoryEnum.UNKNOWN;
		}
		return this.categories[extension] || FileCategoryEnum.UNKNOWN;
	}
}
