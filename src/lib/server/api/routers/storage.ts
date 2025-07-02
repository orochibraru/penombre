import { authMacro } from '$lib/server/api/auth';
import {
	internalServerErrorSchema,
	notFoundSchema,
	unauthorizedSchema
} from '$lib/server/api/schemas';
import { StorageService } from '$lib/server/services/storage';
import { Log } from '@kitql/helpers';
import { Elysia, type Static, t } from 'elysia';

const logger = new Log('FilesRouter');

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

export type ObjectSchema = Static<typeof S3ObjectSchema>;
export type ObjectList = Static<typeof S3ObjectList>;
export type BucketSchema = Static<typeof S3BucketSchema>;

export const filesRouter = new Elysia({
	detail: {
		tags: ['Storage']
	}
}).group('/storage', (app) =>
	app
		.model({
			Object: S3ObjectSchema,
			ObjectList: S3ObjectList,
			Bucket: S3BucketSchema,
			BucketList: t.Array(S3BucketSchema)
		})
		.use(authMacro)
		.group('/buckets', (app) => {
			return app.get(
				'/',
				async ({ status, user }) => {
					const storage = new StorageService(user);
					try {
						const objs = await storage.listBuckets();
						return objs;
					} catch (e) {
						logger.error('Failed to list objects', e);
						return status(500, undefined);
					}
				},
				{
					auth: true,
					storage: true,
					detail: {
						summary: 'List buckets',
						description: 'Fetches all buckets'
					},
					response: {
						200: 'BucketList',
						403: unauthorizedSchema,
						404: notFoundSchema,
						500: internalServerErrorSchema
					}
				}
			);
		})
		.group('/objects', (app) => {
			return app
				.get(
					'/',
					async ({ status, user }) => {
						const storage = new StorageService(user);
						try {
							const objects = await storage.listObjects({ folder: '' });
							return objects;
						} catch (e) {
							logger.error('Failed to list objects', e);
							return status(500, undefined);
						}
					},
					{
						auth: true,
						storage: true,
						detail: {
							summary: 'List objects',
							description: 'Fetches all objects'
						},
						response: {
							200: 'ObjectList',
							403: unauthorizedSchema,
							404: notFoundSchema,
							500: internalServerErrorSchema
						}
					}
				)
				.post(
					'/',
					async ({ status, body }) => {
						try {
							const file: ObjectSchema = {
								Key: body.Key
							};

							return file;
						} catch (e) {
							logger.error(`Failed to create file ${body.Key}`, e);
							return status(500, undefined);
						}
					},
					{
						detail: {
							summary: 'Create a object',
							description: 'Creates a single object'
						},
						body: 'Object',
						response: {
							200: 'Object',
							403: unauthorizedSchema,
							404: notFoundSchema,
							500: internalServerErrorSchema
						}
					}
				)
				.group('/:folder', (app) => {
					return app
						.derive(async ({ params, status }) => {
							console.debug(`Folder ${params.folder}`);
							if (!params.folder) {
								return status(404, undefined);
							}
						})
						.get(
							'/',
							async ({ params, status, user }) => {
								const storage = new StorageService(user);
								try {
									const objs = await storage.listObjects({ folder: params.folder });
									return objs;
								} catch (e) {
									logger.error('Failed to list objects', e);
									return status(500, undefined);
								}
							},
							{
								auth: true,
								detail: {
									summary: 'Get objects in a dir',
									description: 'Fetches objects in a dir'
								},
								response: {
									200: 'ObjectList',
									403: unauthorizedSchema,
									404: notFoundSchema,
									500: internalServerErrorSchema
								}
							}
						);
				});
		})
);
