import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Logger } from '$lib/logger';
import { toSnake } from '$lib/utils';
import {
	type _Object,
	type CommonPrefix,
	CreateBucketCommand,
	DeleteObjectsCommand,
	HeadObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig
} from '@aws-sdk/client-s3';
import type { User } from 'better-auth';
import { type Static, t } from 'elysia';

const logger = new Logger('Service::Storage');

export type FileCategories = 'music' | 'documents' | 'images' | 'recent' | 'trash';
export const allowedFileCategories = ['music', 'documents', 'images', 'recent', 'trash'];

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

export const S3ObjectList = t.Object({
	count: t.Number(),
	list: t.Array(S3ObjectSchema)
});

export type ObjectItem = Static<typeof S3ObjectSchema>;
export type ObjectList = Static<typeof S3ObjectList>;
export type Bucket = Static<typeof S3BucketSchema>;

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
		const prodUrl = env.MINIO_URL ?? 'http://minio:9000';
		const devUrl = env.MINIO_URL ?? 'http://0.0.0.0:9000';
		const serverUrl = dev ? devUrl : prodUrl;
		return {
			region: 'us-east-1',
			credentials: {
				accessKeyId: 'opendrive',
				secretAccessKey: 'opendrive'
			},
			forcePathStyle: true,
			endpoint: serverUrl,
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

	private determineCategory(file: File) {
		let category: FileCategories | null = null;
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

	/**
	 * Uploads a file to S3.
	 *
	 * @param {File} file The file to upload.
	 *
	 * @throws {Error} If there is an error uploading the file.
	 */
	public async upload(file: File): Promise<void> {
		const browserStream = file.stream();
		const reader = browserStream.getReader();
		const chunks: Uint8Array[] = [];
		let done = false;
		while (!done) {
			const { value, done: doneReading } = await reader.read();
			if (value) chunks.push(value);
			done = doneReading;
		}
		const name = await this.incrementItemName(file.name);
		const contents = Buffer.concat(chunks);
		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Body: contents,
			Key: name,
			ContentType: file.type,
			Metadata: {
				Category: this.determineCategory(file) ?? ''
			}
		});

		try {
			await this.send(cmd);
		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	/**
	 * Checks if a folder exists in the user's bucket.
	 *
	 * A folder is considered to exist if there are any objects inside it (Contents) or subfolders (CommonPrefixes).
	 * If an error occurs during the check (e.g., the bucket does not exist), the method returns false.
	 *
	 * @param folder The name of the folder to check.
	 * @returns A promise that resolves to a boolean indicating whether the folder exists.
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

	public async incrementItemName(originalName: string) {
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
				console.log(`Found available filename: '${newFilePath}'`);
				return newFilePath; // This filename is available
			}

			// If the new name also exists, increment the counter and try again
			counter++;
		}
	}

	/**
	 * Lists all objects in the user's bucket, optionally filtered by a given folder.
	 * The objects are retrieved in batches of 1,000 items and returned as a single list.
	 * If the folder does not exist, an empty list is returned.
	 *
	 * @param folder The folder to list objects from.
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
	 * Retrieves the metadata of multiple objects in the user's bucket.
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

	/**
	 * Lists all objects in the user's bucket, optionally filtered by a given folder.
	 *
	 * @param {string} [folder=''] The folder to list objects from.
	 * @returns {Promise<ObjectList>} A promise that resolves to a list of objects and its count.
	 */
	public async listObjects({ folderPath = '' }: { folderPath: string }): Promise<ObjectList> {
		const folder = decodeURIComponent(folderPath);

		try {
			// The ListObjectsV2 operation returns a maximum of 1,000 objects per call.
			// To retrieve all objects, we need to paginate through the results.
			const { list } = await this.listObjectsBase({ folderPath: folder });

			// Remove parent
			const filteredObjects = list.filter((obj) => {
				if (folder !== '') {
					return obj.Key !== `${folder}/`;
				}

				return obj;
			});

			const mappedObjects = filteredObjects.map((obj) => {
				if (folder !== '') {
					obj.Key = obj.Key.replace(`${folder}/`, '');
				}

				return obj;
			});

			const results = await this.getObjectsMetadata(mappedObjects);

			// Sort the objects by Name descending order
			const sortedObjects = results.sort((a, b) => {
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

			// Return the 5 most recent files
			return { list: sortedObjects, count: filteredObjects.length };
		} catch (error) {
			logger.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}

	/**
	 * Lists all objects in the user's bucket regardless of their folder
	 * and returns the 5 most recent ones.
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
