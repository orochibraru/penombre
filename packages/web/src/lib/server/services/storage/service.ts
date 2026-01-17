import { ListingOperations } from "./listing";

/**
 * Main storage service that combines all operations.
 *
 * Inheritance chain:
 * - StorageServiceBase (base utilities)
 * - FileOperations (file CRUD)
 * - FolderOperations (folder CRUD)
 * - ListingOperations (listing, search, filters)
 * - StorageService (final concrete class)
 */
export class StorageService extends ListingOperations {}
