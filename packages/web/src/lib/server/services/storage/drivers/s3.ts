import { Readable } from "node:stream";
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Logger } from "$lib/logger";
import type { S3DriverConfig, StorageDriver } from "../driver";

const logger = new Logger("S3StorageDriver");

export class S3StorageDriver implements StorageDriver {
	private readonly client: S3Client;
	private readonly bucket: string;
	private readonly userPrefix: string;

	constructor(config: S3DriverConfig) {
		this.client = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			...(config.endpoint && { endpoint: config.endpoint }),
			...(config.pathStyle !== undefined && {
				forcePathStyle: config.pathStyle,
			}),
		});
		this.bucket = config.bucket;
		this.userPrefix = config.userPrefix;
	}

	/** Converts a user-relative key to a full S3 object key. */
	private s3Key(key: string): string {
		return key ? `${this.userPrefix}/${key}` : this.userPrefix;
	}

	async readObject(key: string): Promise<ArrayBuffer> {
		const response = await this.client.send(
			new GetObjectCommand({ Bucket: this.bucket, Key: this.s3Key(key) }),
		);
		if (!response.Body)
			throw new Error(`Empty S3 response body for key: ${key}`);
		const body = response.Body as unknown as Readable;
		const chunks: Buffer[] = [];
		for await (const chunk of body) {
			chunks.push(
				Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array),
			);
		}
		const buf = Buffer.concat(chunks);
		return buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		) as ArrayBuffer;
	}

	async getObjectStream(
		key: string,
		rangeStart?: number,
		rangeEnd?: number,
	): Promise<ReadableStream<Uint8Array>> {
		const range =
			rangeStart !== undefined
				? `bytes=${rangeStart}-${rangeEnd ?? ""}`
				: undefined;

		const response = await this.client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: this.s3Key(key),
				...(range && { Range: range }),
			}),
		);
		if (!response.Body)
			throw new Error(`Empty S3 response body for key: ${key}`);
		const body = response.Body as unknown as Readable;
		return Readable.toWeb(body) as unknown as ReadableStream<Uint8Array>;
	}

	async getObjectSize(key: string): Promise<number> {
		const response = await this.client.send(
			new HeadObjectCommand({ Bucket: this.bucket, Key: this.s3Key(key) }),
		);
		return response.ContentLength ?? 0;
	}

	async writeObject(
		key: string,
		data: ArrayBuffer | Uint8Array | Blob,
	): Promise<void> {
		let body: Buffer;
		if (data instanceof Blob) {
			body = Buffer.from(await data.arrayBuffer());
		} else if (data instanceof ArrayBuffer) {
			body = Buffer.from(data);
		} else {
			body = Buffer.from(data);
		}

		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: this.s3Key(key),
				Body: body,
				ContentLength: body.byteLength,
			}),
		);
	}

	async deleteObject(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({ Bucket: this.bucket, Key: this.s3Key(key) }),
		);
	}

	async deleteObjectsByPrefix(prefix: string): Promise<void> {
		const s3Prefix = prefix ? this.s3Key(prefix) : `${this.userPrefix}/`;
		let continuationToken: string | undefined;

		do {
			const response = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.bucket,
					Prefix: s3Prefix,
					ContinuationToken: continuationToken,
				}),
			);

			const objects = response.Contents ?? [];
			if (objects.length === 0) break;

			// S3 DeleteObjects supports up to 1000 keys per request
			for (let i = 0; i < objects.length; i += 1000) {
				const batch = objects.slice(i, i + 1000);
				await this.client.send(
					new DeleteObjectsCommand({
						Bucket: this.bucket,
						Delete: {
							Objects: batch.map((obj) => ({ Key: obj.Key ?? "" })),
							Quiet: true,
						},
					}),
				);
			}

			continuationToken = response.IsTruncated
				? response.NextContinuationToken
				: undefined;
		} while (continuationToken);
	}

	async copyObject(src: string, dest: string): Promise<void> {
		await this.client.send(
			new CopyObjectCommand({
				Bucket: this.bucket,
				CopySource: `${this.bucket}/${this.s3Key(src)}`,
				Key: this.s3Key(dest),
			}),
		);
	}

	async objectExists(key: string): Promise<boolean> {
		try {
			await this.client.send(
				new HeadObjectCommand({ Bucket: this.bucket, Key: this.s3Key(key) }),
			);
			return true;
		} catch (error: unknown) {
			const awsError = error as {
				$metadata?: { httpStatusCode?: number };
				name?: string;
			};
			if (
				awsError.$metadata?.httpStatusCode === 404 ||
				awsError.name === "NotFound"
			) {
				return false;
			}
			throw error;
		}
	}

	async listObjectKeys(prefix?: string): Promise<string[]> {
		const s3Prefix = prefix ? this.s3Key(prefix) : `${this.userPrefix}/`;
		const userRootPrefix = `${this.userPrefix}/`;
		const keys: string[] = [];
		let continuationToken: string | undefined;

		do {
			const response = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.bucket,
					Prefix: s3Prefix,
					ContinuationToken: continuationToken,
				}),
			);

			for (const obj of response.Contents ?? []) {
				if (obj.Key) {
					keys.push(obj.Key.slice(userRootPrefix.length));
				}
			}

			continuationToken = response.IsTruncated
				? response.NextContinuationToken
				: undefined;
		} while (continuationToken);

		logger.debug(`Listed ${keys.length} keys under prefix "${s3Prefix}"`);
		return keys;
	}

	/** No-op for S3 — buckets must be created externally. */
	async ensureRootExists(): Promise<void> {}
}
