import { dev } from '$app/environment';
import { toSnake } from '$lib/utils';
import {
	type _Object,
	CreateBucketCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig
} from '@aws-sdk/client-s3';
import { Log } from '@kitql/helpers';
import type { User } from 'better-auth';

const logger = new Log('StorageService');

export type BucketObject = _Object;

export class StorageService extends S3Client {
	private user: User;
	public bucket: string;

	static getConfig(): S3ClientConfig {
		return {
			region: 'us-east-1',
			credentials: {
				accessKeyId: 'opendrive',
				secretAccessKey: 'opendrive'
			},
			endpoint: dev ? 'http://0.0.0.0:9000' : 'http://minio:9000'
		};
	}

	constructor(user: User) {
		super(StorageService.getConfig());

		this.user = user;
		this.bucket = this.getUserBucketName();
	}

	public async createUserBucket() {
		logger.info('Creating user bucket...');

		const cmd = new CreateBucketCommand({
			Bucket: this.bucket
		});

		try {
			await this.send(cmd);
			logger.success('User bucket created.');
		} catch (e) {
			logger.error('Failed to create user bucket');
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
			Key: file.name
		});

		try {
			await this.send(cmd);
		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	public async listObjects({ folder = '' }: { folder: string }): Promise<{
		list: BucketObject[];
		count: number;
	}> {
		let allObjects: _Object[] = [];
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
					allObjects = allObjects.concat(response.Contents);
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
			console.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}

	public async listRecentObjects(): Promise<{
		list: BucketObject[];
		count: number;
	}> {
		let allObjects: _Object[] = [];
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
					allObjects = allObjects.concat(response.Contents);
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
			console.error('Error listing and sorting S3 objects:', error);
			throw error;
		}
	}
}
