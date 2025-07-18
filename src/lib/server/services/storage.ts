import {
	type _Object,
	type CommonPrefix,
	CreateBucketCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { User } from 'better-auth';
import { type Static, t } from 'elysia';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { isCodeItem } from '$lib/file-utils';
import { Logger } from '$lib/logger';
import type { BareBonesFileSchema, UploadedFileSchema } from '$lib/server/api/schemas';
import { toSnake } from '$lib/utils';

const logger = new Logger('Service::Storage');

export type FileCategories = 'music' | 'documents' | 'images' | 'recent' | 'code' | 'trash';
export type BarebonesFile = Static<typeof BareBonesFileSchema>;
export const allowedFileCategories = ['music', 'documents', 'images', 'recent', 'code', 'trash'];

/**
 * Represents the owner of an S3 object.
 */
const S3OwnerSchema = t.Object({
	DisplayName: t.Optional(t.String()),
	ID: t.Optional(t.String())
});

/**
 * A comprehensive Typebox schema for an Amazon S3 bucket object.
 * This schema includes the most common properties returned by the S3 API when listing or getting an object.
 */
export const S3ObjectSchema = t.Object({
	/** The unique identifier for the object within the bucket. */
	Key: t.String({ description: 'The key (or name) of the object.' }),

	/** The date and time the object was last modified. */
	LastModified: t.Optional(
		t.Date({ description: 'The date the object was last modified.', default: new Date() })
	),

	/** The entity tag is a hash of the object. */
	ETag: t.Optional(t.String({ description: 'The entity tag is a hash of the object.' })),

	/** The size of the object in bytes. */
	Size: t.Optional(t.Number({ description: 'Size in bytes of the object.' })),

	/** The class of storage used to store the object. */
	StorageClass: t.Optional(t.String({ description: 'The storage class of the object.' })),

	/** The owner of the object. */
	Owner: t.Optional(S3OwnerSchema),

	/** The content type of the object */
	ContentType: t.Optional(t.String()),

	/** A map of metadata stored with the object. */
	Metadata: t.Optional(t.Record(t.String(), t.String()))
});

export const S3BucketSchema = t.Object({
	/** The unique name of the S3 bucket. */
	Name: t.String({
		description: 'The name of the Amazon S3 bucket.'
	}),

	/** The date and time the bucket was created. */
	CreationDate: t.Date({
		description: 'The date the bucket was created.',
		default: new Date()
	})
});

export const S3ObjectListSchema = t.Object({
	count: t.Number(),
	list: t.Array(S3ObjectSchema)
});

export const ObjectUrlSchema = t.String();

/**
 * Retrieves the base URL for the MinIO server, which is used for accessing
 * storage resources. The URL is determined based on the current environment
 * (development or production) to ensure correct routing to the MinIO instance.
 * @returns {string} The base URL for the MinIO server.
 */
export function getMinioUrl(): string {
	const prodUrl = env.MINIO_URL ?? 'http://minio:9000';
	const devUrl = env.MINIO_URL ?? 'http://0.0.0.0:9000';
	return dev ? devUrl : prodUrl;
}

export type ObjectItem = Static<typeof S3ObjectSchema>;
export type ObjectList = Static<typeof S3ObjectListSchema>;
export type Bucket = Static<typeof S3BucketSchema>;
export type ObjectUrl = Static<typeof ObjectUrlSchema>;
export type UploadResult = Static<typeof UploadedFileSchema>;

export class StorageService extends S3Client {
	private user: User;
	public bucket: string;
	public serverUrl: string;

	/**
	 * Retrieves the configuration settings for the S3 client.
	 *
	 * Determines the server URL based on the environment (development or production)
	 * and returns an S3 client configuration object with predefined region, credentials,
	 * and other settings.
	 *
	 * @returns {S3ClientConfig} The configuration object for the S3 client.
	 */
	static getConfig(): S3ClientConfig {
		return {
			region: 'us-east-1',
			credentials: {
				accessKeyId: 'opendrive',
				secretAccessKey: 'opendrive'
			},
			forcePathStyle: true,
			endpoint: getMinioUrl(),
			disableHostPrefix: true
		};
	}

	/**
	 * Initializes a new instance of the StorageService class.
	 *
	 * Sets up the S3 client configuration and initializes user-specific properties,
	 * including the user's bucket name and server URL.
	 *
	 * @param {User} user - The user for whom the storage service is being initialized.
	 */
	constructor(user: User) {
		const config = StorageService.getConfig();
		super(config);

		this.user = user;
		this.bucket = this.getUserBucketName();
		this.serverUrl = config.endpoint?.toString() ?? '';
	}

	/**
	 * Creates a new bucket in the configured S3 storage.
	 *
	 * The bucket is created with the name derived from the user's name.
	 * The bucket is created with the "private" ACL.
	 *
	 * @throws {Error} If the bucket could not be created.
	 */
	public async createUserBucket() {
		logger.info(`Creating user bucket ${this.bucket}...`);

		const cmd = new CreateBucketCommand({
			Bucket: this.bucket,
			ACL: 'private'
		});

		try {
			await this.send(cmd);
			logger.info('User bucket created.');
		} catch (e) {
			logger.error('Failed to create user bucket');
			throw e;
		}
	}

	/**
	 * Checks if the user's bucket exists.
	 *
	 * This function retrieves all the buckets in the S3 account and checks if a bucket with the current user's bucket name exists.
	 *
	 * @returns A promise that resolves to a boolean indicating whether the user's bucket exists.
	 */

	public async userBucketExists(): Promise<boolean> {
		const buckets = await this.listBuckets();
		const match = buckets.find((bucket) => bucket.Name === this.bucket);
		return !!match;
	}

	/**
	 * Lists all buckets in the S3 account.
	 *
	 * @returns The list of buckets.
	 */
	public async listBuckets() {
		const cmd = new ListBucketsCommand();
		const res = await this.send(cmd);
		return res.Buckets ?? [];
	}

	/**
	 * Ensures that the user's bucket exists in the S3 account.
	 *
	 * Checks if the user's bucket exists. If it does not, it creates it.
	 */
	public async ensureUserBucket() {
		if (!(await this.userBucketExists())) {
			await this.createUserBucket();
		}
	}

	/**
	 * Generates and returns the user's bucket name in snake_case format.
	 *
	 * The bucket name is derived from the user's name by converting it to snake_case.
	 *
	 * @returns {string} The snake_case version of the user's name, used as the bucket name.
	 */

	public getUserBucketName(): string {
		return toSnake(this.user.name);
	}

	/**
	 * Creates a new folder in the user's bucket.
	 *
	 * Creates a new folder with the given name in the user's bucket.
	 * The folder is created with no content.
	 *
	 * @param name The name of the folder to create.
	 * @throws {Error} If the folder could not be created.
	 */
	public async createFolder(name: string) {
		logger.info(`Creating folder ${name}...`);

		const newName = await this.incrementItemName(name);

		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Key: `${newName}/`
		});
		try {
			await this.send(cmd);
			logger.info('Folder created.');
		} catch (e) {
			logger.error(`Failed to create folder ${name}`);
			throw e;
		}
	}

	/**
	 * Determines the category of a file based on its MIME type.
	 *
	 * This method evaluates the `File` object's `type` property (MIME type) to
	 * assign it to a predefined category such as "images", "music", or "documents".
	 * The categorization is based on common MIME type prefixes.
	 * @param {File} file - The `File` object for which to determine the category.
	 */
	private determineCategory(file: BarebonesFile) {
		let category: FileCategories | null = null;
		if (isCodeItem(file.name)) {
			category = 'code';
		}
		if (file.type.startsWith('image')) {
			category = 'images';
		}

		if (file.type.startsWith('audio')) {
			category = 'music';
		}

		if (file.type === 'application/pdf') {
			category = 'documents';
		}

		return category;
	}

	public async parseFileBody(file: File) {
		const browserStream = file.stream();
		const reader = browserStream.getReader();
		const chunks: Uint8Array[] = [];
		let done = false;
		while (!done) {
			const { value, done: doneReading } = await reader.read();
			if (value) chunks.push(value);
			done = doneReading;
		}
		const contents = Buffer.concat(chunks);
		return contents;
	}

	/**
	 * Uploads a file to S3.
	 *
	 * This function performs several operations:
	 *  1. Parses audio metadata if the file is an audio file.
	 *  2. Determines the full path for the file within the S3 bucket, including handling root folders.
	 *  3. Increments the file name if a file with the same name already exists.
	 *  4. Reads the file content into a buffer.
	 *  5. Uploads the file to the S3 bucket with appropriate metadata, including file category and audio-specific information.
	 * @param {File} file - The file to upload.
	 *
	 * @throws {Error} If there is an error uploading the file.
	 */
	public async upload(
		file: BarebonesFile,
		proxyurl: string,
		rootFolder?: string
	): Promise<UploadResult> {
		const category = this.determineCategory(file) ?? '';
		const fullPath = rootFolder !== '' ? `${rootFolder}/${file.name}` : file.name;
		const finalName = await this.incrementItemName(fullPath);

		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Key: finalName,
			ContentType: file.type,
			Metadata: {
				Category: category,
				MusicTrackNumber: file.metadata?.common.track.no?.toString() ?? '',
				MusicTrackArtist: file.metadata?.common.track.of?.toString() ?? '',
				MusicSampleRate: file.metadata?.format.sampleRate?.toString() ?? '',
				MusicBitRate: file.metadata?.format.bitrate?.toString() ?? '',
				MusicCodec: file.metadata?.format.codec?.toString() ?? '',
				MusicLossLess: file.metadata?.format.lossless?.toString() ?? '',
				MusicDuration: file.metadata?.format.duration?.toString() ?? ''
			}
		});

		try {
			await this.send(cmd);
			let presignedUrl = await getSignedUrl(this, cmd, { expiresIn: 3600 });
			presignedUrl = presignedUrl.replace(getMinioUrl(), proxyurl);

			return { file, finalName, presignedUrl };
		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	/**
	 * Checks if a folder exists in the user's bucket.
	 *
	 * @param {string} itemPath - The path to the item (file or folder) to check for existence.
	 * The method decodes the URI component to handle special characters correctly.
	 * A folder is considered to exist if there are any objects inside it or any subfolders.
	 * @returns {Promise<boolean>} - A promise that resolves to a boolean: `true` if the folder exists (i.e., contains objects or subfolders), `false` otherwise.
	 * If an error occurs during the existence check (e.g., bucket not found), the promise resolves to `false`.
	 */
	public async itemExists(itemPath: string): Promise<boolean> {
		const item = decodeURIComponent(itemPath);
		try {
			const command = new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: item,
				MaxKeys: 1 // We only need to know if at least one object exists
			});

			const response = await this.send(command);

			// A folder exists if there are objects inside it (Contents) or subfolders (CommonPrefixes)
			const hasContents = response.Contents ? response.Contents.length > 0 : false;
			const hasSubfolders = response.CommonPrefixes ? response.CommonPrefixes.length > 0 : false;

			return hasContents || hasSubfolders;
		} catch (error) {
			logger.error('Error checking for S3 folder existence:', error);
			// In case of an error (e.g., bucket not found), we can treat the folder as not existing
			return false;
		}
	}

	/**
	 * Generates a presigned URL for downloading an item from the user's bucket.
	 *
	 * @param {object} options - An object containing the parameters for generating the presigned URL.
	 * @param {string} options.item - The path to the item (object key) for which to generate the presigned URL.
	 * @param {string} options.hostname - The hostname to use in the presigned URL. This is used to replace the MinIO internal URL with an external-facing URL.
	 * @param {number} [options.expiresIn=3600] - The number of seconds the presigned URL should be valid for. Defaults to 3600 seconds (1 hour).
	 * @returns {Promise<string>} - A promise that resolves to a string containing the presigned URL for the specified item.
	 */
	public async createPresignedUrl({
		item,
		proxyurl,
		expiresIn = 3600
	}: {
		item: string;
		proxyurl: string;
		expiresIn?: number;
	}): Promise<string> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucket,
				Key: item
			});

			let url = await getSignedUrl(this, command, { expiresIn });
			url = url.replace(getMinioUrl(), proxyurl);
			return url;
		} catch (error) {
			console.error('Error creating presigned URL:', error);
			throw error;
		}
	}

	/**
	 * Given a filename, finds an available filename by incrementing the number
	 * in parentheses at the end of the filename (if present) to avoid naming conflicts.
	 *
	 * @param {string} originalName - The original filename for which to find an available name.
	 * This name can include a path, filename, and extension.
	 *
	 * @returns {Promise<string>} - A promise that resolves to an available filename.
	 * If the original filename does not exist, the original filename is returned.
	 * If the original filename exists, the method attempts to find a new available name
	 * by incrementing a counter within parentheses appended to the filename.
	 *
	 * For example:
	 * - If "photo.jpg" exists, it will try "photo (1).jpg", "photo (2).jpg", and so on.
	 * - If the input is "folder/photo.jpg" and "folder/photo.jpg" exists,
	 * it will try "folder/photo (1).jpg", "folder/photo (2).jpg", and so on.
	 *
	 * The method separates the path, filename, and extension of the original name,
	 * then iteratively checks for file existence with an incrementing counter until
	 * an available name is found.
	 */
	public async incrementItemName(originalName: string): Promise<string> {
		const originalFileExists = await this.itemExists(originalName);

		if (!originalFileExists) {
			return originalName; // The original name is available, so we can use it
		}

		logger.info(`Original filename '${originalName}' exists. Finding an available name...`);

		// Separate the path, filename, and extension
		const lastSlashIndex = originalName.lastIndexOf('/');
		const dir = lastSlashIndex === -1 ? '' : originalName.substring(0, lastSlashIndex + 1);
		const fullFileName =
			lastSlashIndex === -1 ? originalName : originalName.substring(lastSlashIndex + 1);

		const dotIndex = fullFileName.lastIndexOf('.');
		const name = dotIndex === -1 ? fullFileName : fullFileName.substring(0, dotIndex);
		const ext = dotIndex === -1 ? '' : fullFileName.substring(dotIndex);

		let counter = 1;
		while (true) {
			// Construct the new filename, e.g., "photo (1).jpg"
			const newFilePath = `${dir}${name} (${counter})${ext}`;

			const newFileExists = await this.itemExists(newFilePath);

			if (!newFileExists) {
				logger.debug(`Found available filename: '${newFilePath}'`);
				return newFilePath; // This filename is available
			}

			// If the new name also exists, increment the counter and try again
			counter++;
		}
	}

	/**
	 * Base method to list objects in the user's bucket, with optional filtering by a given folder
	 * and control over the depth of listing.
	 *
	 * This method retrieves objects from S3 in batches of 1,000 (the maximum allowed by S3 API),
	 * and it can paginate through results using a continuation token. It can also simulate a
	 * directory structure by using a delimiter to limit the depth of the listing (i.e., list only
	 * objects directly within the specified folder, not its subfolders).
	 *
	 * @param folderPath The folder to list objects from.
	 * @param disableDepthLimit If true, the Delimiter parameter is not set, and all objects are returned without depth limit.
	 * @returns A promise that resolves to a list of objects and its count.
	 */
	private async listObjectsBase({
		folderPath = '',
		disableDepthLimit = false
	}: {
		folderPath: string;
		disableDepthLimit?: boolean;
	}): Promise<ObjectList> {
		const folder = folderPath !== '' ? `${decodeURIComponent(folderPath)}/` : '';
		let allObjects: ObjectItem[] = [];
		let isTruncated = true;
		let continuationToken: string | undefined;

		logger.info(
			`Listing ${folder === '' ? 'root ' : ''}objects ${folder === '' ? '' : `in folder: "${folder}"`}`
		);

		// The ListObjectsV2 operation returns a maximum of 1,000 objects per call.
		// To retrieve all objects, we need to paginate through the results.
		while (isTruncated) {
			const cmd = new ListObjectsV2Command({
				Bucket: this.bucket,
				ContinuationToken: continuationToken,
				Prefix: folder !== '' ? folder : undefined,
				Delimiter: disableDepthLimit ? undefined : '/'
			});

			const response = await this.send(cmd);
			// Get the prefixes of the top-level folders
			const folders = response.CommonPrefixes?.map((prefix: CommonPrefix) => prefix) || [];

			const folderList: ObjectItem[] = [];
			for (const folder of folders) {
				folderList.push({
					Key: folder.Prefix as string
				});
			}

			if (folderList.length > 0) {
				allObjects = allObjects.concat(folderList);
			}

			if (response.Contents) {
				allObjects = allObjects.concat(response.Contents as ObjectItem[]);
			}

			isTruncated = response.IsTruncated ?? false;
			continuationToken = response.NextContinuationToken;
		}

		// Return the 5 most recent files
		return { list: allObjects, count: allObjects.length };
	}

	/**
	 * Retrieves metadata for multiple S3 objects within the user's bucket.
	 *
	 * This method takes a list of objects, each represented by an `ObjectItem`
	 * (which should at least contain a `Key` property indicating the object's
	 * storage key), and fetches detailed metadata for each object from S3. This
	 * metadata includes properties like `LastModified`, `ContentLength`,
	 * `ContentType`, and any custom `Metadata` associated with the object.
	 *
	 * For folder objects (indicated by keys ending with '/'), only the key is returned, as there's no specific metadata to fetch.
	 *
	 * @param {ObjectItem[]} objects The objects whose metadata should be retrieved.
	 * @returns {Promise<ObjectItem[]>} A promise that resolves to an array of objects with their metadata.
	 */
	public async getObjectsMetadata(objects: ObjectItem[]): Promise<ObjectItem[]> {
		const metadataPromises = objects.map(async (obj) => {
			if (obj.Key.endsWith('/')) {
				return {
					Key: obj.Key
				};
			}
			const headCommand = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: obj.Key
			});
			const headResponse = await this.send(headCommand);

			// Combine the key with its metadata
			return {
				Key: obj.Key,
				Metadata: headResponse.Metadata,
				LastModified: headResponse.LastModified,
				ContentLength: headResponse.ContentLength,
				ContentType: headResponse.ContentType,
				Size: obj.Size,
				ETag: headResponse.ETag
			};
		});

		// 3. Execute all metadata requests concurrently and filter out any nulls
		const results = await Promise.all(metadataPromises);

		return results;
	}

	private isFolder(object: ObjectItem) {
		return object.Key.endsWith('/');
	}

	/**
	 * This method is designed to list objects within a specified folder or the entire bucket if no folder is specified.
	 * It handles URI decoding for folder paths, filters out the folder itself from the results,
	 * and maps the object keys to exclude the folder prefix for objects within the specified folder.
	 * It also retrieves metadata for each object and sorts the results by name.
	 *
	 * The key steps include:
	 * 1. Decoding the folder path to handle URI-encoded characters.
	 * 2. Calling `listObjectsBase` to get a list of objects (or prefixes, in the case of folders) in the specified folder.
	 * 3. Filtering and mapping the objects to exclude the folder itself and adjust the object keys.
	 * 4. Retrieving detailed metadata for each object using `getObjectsMetadata`.
	 * 5. Sorting the objects by name in ascending order.
	 *
	 * If an error occurs during the process, it is caught and logged, and the error is re-thrown.
	 *
	 * @param {object} params - An object containing the parameters for listing objects.
	 * @param {string} [params.folderPath=''] - The path of the folder to list objects from. Defaults to the root of the bucket if not specified.
	 * @returns {Promise<ObjectList>} A promise that resolves to a list of objects and its count.
	 */
	public async listObjects({ folderPath = '' }: { folderPath: string }): Promise<ObjectList> {
		const folder = decodeURIComponent(folderPath);

		try {
			// The ListObjectsV2 operation returns a maximum of 1,000 objects per call.
			// To retrieve all objects, we need to paginate through the results.
			const { list } = await this.listObjectsBase({ folderPath: folder });

			// Remove parent
			let filteredObjects = list.filter((obj) => {
				if (folder !== '') {
					if (this.isFolder(obj)) {
						return obj.Key !== `${folder}/`;
					}

					return obj.Key.startsWith(`${folder}/`);
				}

				return obj;
			});

			filteredObjects = filteredObjects.map((obj) => {
				if (folder !== '') {
					if (this.isFolder(obj)) {
						obj.Key = obj.Key.replace(`${folder}/`, '');
					}
				}

				return obj;
			});

			const results = await this.getObjectsMetadata(filteredObjects);

			// Sort the objects by Name descending order
			filteredObjects = results.sort((a, b) => {
				if (!a.Key || !b.Key) {
					return 0;
				}

				if (a.Key < b.Key) {
					return -1;
				}

				if (a.Key > b.Key) {
					return 1;
				}
				return 0;
			});

			filteredObjects = filteredObjects.map((obj) => {
				if (folder !== '') {
					if (!this.isFolder(obj)) {
						obj.Key = obj.Key.replace(`${folder}/`, '');
					}
				}
				return obj;
			});

			const folders = filteredObjects.filter((obj) => obj.Key.endsWith('/'));
			const files = filteredObjects.filter((obj) => !obj.Key.endsWith('/'));

			filteredObjects = [...folders, ...files];

			// Return the 5 most recent files
			return { list: filteredObjects, count: filteredObjects.length };
		} catch (error) {
			logger.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}

	/**
	 * Lists all objects in the user's bucket regardless of their folder structure,
	 * and returns the 5 most recent ones.
	 * * This method is designed to retrieve a flat list of all files within the bucket,
	 * excluding any folder "placeholders" (objects with keys ending in '/').
	 * It also supports filtering the results by a specified file category.
	 *
	 * The key steps include:
	 * 1. Retrieving all objects from the bucket, paginating through results as necessary.
	 * 2. Filtering out folder placeholders and mapping the remaining objects to `ObjectItem` format.
	 * 3. Optionally filtering the objects by a given category based on their metadata.
	 * 4. For the 'recent' category, sorting the objects by their last modified date in descending order.
	 * 5. Returning a list of the files along with their count.
	 *
	 * @returns {Promise<ObjectList>} A promise that resolves to a list of objects and its count.
	 */
	public async listWithoutFolders({ category }: { category?: FileCategories }): Promise<{
		list: ObjectItem[];
		count: number;
	}> {
		let allFiles: ObjectItem[] = [];
		let continuationToken: string | undefined;

		try {
			do {
				const command = new ListObjectsV2Command({
					Bucket: this.bucket,
					ContinuationToken: continuationToken
				});

				const response = await this.send(command);

				if (response.Contents) {
					// Filter out folder placeholders (keys ending in /) and map to the key string
					const files = response.Contents.filter((obj: _Object) => !obj.Key?.endsWith('/')).map(
						(obj: _Object) => obj as ObjectItem
					);

					allFiles.push(...files);
				}

				// The token for the next page is in the response
				continuationToken = response.NextContinuationToken;
			} while (continuationToken); // Loop until there are no more pages

			// Get Meta
			allFiles = await this.getObjectsMetadata(allFiles);

			if (category && category !== 'recent') {
				allFiles = allFiles.filter((file) => {
					const cat = file.Metadata?.category;
					if (cat) {
						return cat === category;
					}
				});
			}

			if (category && category === 'recent') {
				allFiles = allFiles.sort((a, b) => {
					if (!a.LastModified || !b.LastModified) {
						return 0;
					}

					return new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime();
				});
			}

			return { list: allFiles, count: allFiles.length };
		} catch (error) {
			console.error('Error listing all files:', error);
			throw error;
		}
	}

	public async getObject({ key, folder }: { key: string; folder?: string }) {
		try {
			const { list } = await this.listObjects({ folderPath: folder ?? '' });

			const object = list.find((item) => item.Key === key);
			if (!object) {
				throw new Error(`Object ${key} not found (folder: ${folder})`);
			}
			return object;
		} catch (error) {
			console.error('Error getting object:', error);
			throw error;
		}
	}

	/**
	 * Deletes a folder and all of its contents from the user's bucket.
	 *
	 * @param itemPath The path to the folder to delete.
	 * @returns A promise that resolves when the folder and all of its contents have been deleted.
	 */
	public async deleteItem(itemPath: string): Promise<void> {
		const item = decodeURIComponent(itemPath);
		logger.info(`Starting deletion for folder: s3://${this.bucket}/${item}`);

		let continuationToken: string | undefined;

		do {
			// List objects with the given prefix
			const listCommand = new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: item,
				ContinuationToken: continuationToken
			});

			const listResponse = await this.send(listCommand);

			if (!listResponse.Contents || listResponse.Contents.length === 0) {
				logger.warn('Folder is empty or does not exist. No objects to delete.');
				// If you also have a zero-byte object representing the folder itself, delete it
				// await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: prefix }));
				return;
			}

			// Prepare the list of objects for deletion
			const objectsToDelete = listResponse.Contents.map((obj: _Object) => ({
				Key: obj.Key
			}));

			// Execute the batch delete command
			const deleteCommand = new DeleteObjectsCommand({
				Bucket: this.bucket,
				Delete: {
					Objects: objectsToDelete,
					Quiet: false
				}
			});

			const deleteResponse = await this.send(deleteCommand);

			logger.info('Deleted:', deleteResponse.Deleted);

			if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
				logger.info('Error deleting some objects:');
				deleteResponse.Errors.forEach((error) => logger.info(`- ${error.Key}: ${error.Message}`));
				throw new Error('Failed to delete all objects in the folder.');
			}

			if (deleteResponse.Deleted) {
				logger.info(`Successfully deleted ${deleteResponse.Deleted.length} objects.`);
			}

			// Check if there are more objects to list and delete
			continuationToken = listResponse.NextContinuationToken;
		} while (continuationToken);

		logger.info(`Folder s3://${this.bucket}/${item} and all its contents have been deleted.`);
	}
}
