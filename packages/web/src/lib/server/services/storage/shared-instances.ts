/**
 * Shared singleton instances of storage utility services.
 * These instances are created once and reused across the application
 * to avoid unnecessary instantiation overhead.
 */

import { BulkDownloadService } from "./bulk-download";
import { CacheManager } from "./cache";
import { ContentTypeService } from "./content-type";
import { ThumbnailService } from "./thumbnails";

// Create singleton instances
export const contentTypeService = new ContentTypeService();
export const cacheManager = new CacheManager();
export const thumbnailService = new ThumbnailService();
export const bulkDownloadService = new BulkDownloadService();
