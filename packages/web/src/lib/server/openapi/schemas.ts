import {
	batchFileSchema,
	directoryListSchema,
	fileCategorySchema,
	fileContentTypeSchema,
	fileMetadataSchema,
	folderItemSchema,
	folderListSchema,
	newFileSchema,
	objectItemSchema,
	objectListSchema,
	updateFileSchema,
	uploadResultSchema,
} from "$lib/server/schema";
import { registry } from "./registry";

// Register shared Zod schemas as named OpenAPI components.
// These appear in the spec under #/components/schemas/{Name}
// and can be referenced via $ref in route definitions.

registry.registerSchema("ObjectList", objectListSchema);
registry.registerSchema("ObjectItem", objectItemSchema);
registry.registerSchema("FileMetadata", fileMetadataSchema);
registry.registerSchema("UploadResult", uploadResultSchema);
registry.registerSchema("FolderItem", folderItemSchema);
registry.registerSchema("FolderList", folderListSchema);
registry.registerSchema("FileCategory", fileCategorySchema);
registry.registerSchema("FileContentType", fileContentTypeSchema);
registry.registerSchema("NewFile", newFileSchema);
registry.registerSchema("BatchFile", batchFileSchema);
registry.registerSchema("UpdateFile", updateFileSchema);
registry.registerSchema("DirectoryList", directoryListSchema);
