import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { toSnake } from '$lib/utils';
import {
	CreateBucketCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig
} from '@aws-sdk/client-s3';
import { Logger } from '$lib/logger';
import type { User } from 'better-auth';
import { type Static, t } from 'elysia';

const logger = new Logger('StorageService');

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

	constructor(user: User) {
		const config = StorageService.getConfig();
		super(config);

		this.user = user;
		this.bucket = this.getUserBucketName();
		this.serverUrl = config.endpoint?.toString() ?? '';
	}

	public async createUserBucket() {
		logger.debug(`Creating user bucket ${this.bucket}...`);

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

	public async createFolder(name: string) {
		logger.debug(`Creating folder ${name}...`);

		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Key: `${name}/`
		});
		try {
			await this.send(cmd);
			logger.debug('Folder created.');
		} catch (e) {
			logger.error(`Failed to create folder ${name}`);
			throw e;
		}
	}

	public async userBucketExists(): Promise<boolean> {
		const buckets = await this.listBuckets();
		const match = buckets.find((bucket) => bucket.Name === this.bucket);
		return !!match;
	}

	public async listBuckets() {
		const cmd = new ListBucketsCommand();
		const res = await this.send(cmd);
		return res.Buckets ?? [];
	}

	public async ensureUserBucket() {
		if (!(await this.userBucketExists())) {
			await this.createUserBucket();
		}
	}

	public getUserBucketName() {
		return toSnake(this.user.name);
	}

	public async upload(file: File) {
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
		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Body: contents,
			Key: file.name,
			ContentType: file.type,
			Metadata: {
				'Content-Type': file.type
			}
		});

		try {
			await this.send(cmd);
		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	public async listObjects({ folder = '' }: { folder: string }): Promise<ObjectList> {
		let allObjects: ObjectItem[] = [];
		let isTruncated = true;
		let continuationToken: string | undefined;

		try {
			// The ListObjectsV2 operation returns a maximum of 1,000 objects per call.
			// To retrieve all objects, we need to paginate through the results.
			while (isTruncated) {
				const cmd = new ListObjectsV2Command({
					Bucket: this.bucket,
					ContinuationToken: continuationToken,
					Prefix: folder
				});

				const response = await this.send(cmd);

				if (response.Contents) {
					allObjects = allObjects.concat(response.Contents as ObjectItem[]);
				}

				isTruncated = response.IsTruncated ?? false;
				continuationToken = response.NextContinuationToken;
			}

			// Sort the objects by Name descending order
			const sortedObjects = allObjects.sort((a, b) => {
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
			return { list: sortedObjects, count: sortedObjects.length };
		} catch (error) {
			logger.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}

	public async listRecentObjects(): Promise<{
		list: ObjectItem[];
		count: number;
	}> {
		let allObjects: ObjectItem[] = [];
		let isTruncated = true;
		let continuationToken: string | undefined;

		try {
			// The ListObjectsV2 operation returns a maximum of 1,000 objects per call.
			// To retrieve all objects, we need to paginate through the results.
			while (isTruncated) {
				const cmd = new ListObjectsV2Command({
					Bucket: this.bucket,
					ContinuationToken: continuationToken
				});

				const response = await this.send(cmd);

				if (response.Contents) {
					allObjects = allObjects.concat(response.Contents as ObjectItem[]);
				}

				isTruncated = response.IsTruncated ?? false;
				continuationToken = response.NextContinuationToken;
			}

			// Sort the objects by LastModified date in descending order
			const sortedObjects = allObjects.sort((a, b) => {
				const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
				const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
				return dateB - dateA;
			});

			// Return the 5 most recent files
			return { list: sortedObjects, count: sortedObjects.length };
		} catch (error) {
			logger.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}
}
