import { Elysia, t } from 'elysia';
import { Logger } from '$lib/logger';
import { authMacro } from '$lib/server/api/auth';
import {
	BareBonesFileSchema,
	badRequestErrorSchema,
	createdSchema,
	deletedSchema,
	internalServerErrorSchema,
	notFoundSchema,
	UploadedFileSchema,
	unauthorizedSchema
} from '$lib/server/api/schemas';
import {
	allowedFileCategories,
	type FileCategories,
	ObjectUrlSchema,
	S3BucketSchema,
	S3ObjectListSchema,
	S3ObjectSchema,
	StorageService
} from '$lib/server/services/storage';

const logger = new Logger('API::Storage');

const UploadSchema = t.Object({
	file: BareBonesFileSchema,
	folder: t.Optional(t.String())
});

const CreateFolderSchema = t.String();

export const storageRouter = new Elysia({
	detail: {
		tags: ['Storage']
	}
})
	.model({
		UploadObject: UploadSchema,
		UploadedResponse: UploadedFileSchema,
		ObjectUrl: ObjectUrlSchema,
		CreateFolder: CreateFolderSchema,
		Object: S3ObjectSchema,
		ObjectList: S3ObjectListSchema,
		Bucket: S3BucketSchema,
		BucketList: t.Array(S3BucketSchema)
	})
	.group('/storage', (app) =>
		app

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
							500: internalServerErrorSchema
						}
					}
				);
			})
			.group('/objects', (app) => {
				return app
					.get(
						'/',
						async ({ status, user, query }) => {
							const storage = new StorageService(user);
							const folder = query.folder ?? '';

							if (query.folder) {
								const exists = await storage.itemExists(query.folder);
								if (!exists) {
									return status(404, `Folder ${query.folder} does not exist.`);
								}
							}

							try {
								const objects = await storage.listObjects({ folderPath: folder });
								return objects;
							} catch (e) {
								logger.error('Failed to list objects', e);
								return status(500, 'Failed to list objects');
							}
						},
						{
							auth: true,
							query: t.Optional(
								t.Object({
									folder: t.Optional(t.String())
								})
							),
							storage: true,
							detail: {
								summary: 'List objects',
								description: 'Fetches all objects'
							},
							response: {
								200: 'ObjectList',
								404: notFoundSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.get(
						'/:category',
						async ({ status, user, params }) => {
							const storage = new StorageService(user);

							if (!allowedFileCategories.includes(params.category)) {
								return status(400, { message: `Invalid category ${params.category}` });
							}

							try {
								const objects = await storage.listWithoutFolders({
									category: params.category as FileCategories
								});
								return objects;
							} catch (e) {
								logger.error('Failed to list recent objects', e);
								return status(500, 'Failed to list recent objects');
							}
						},
						{
							auth: true,
							storage: true,
							detail: {
								summary: 'List recent objects',
								description: 'Fetches all recent objects'
							},
							response: {
								200: 'ObjectList',
								400: badRequestErrorSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.get(
						'/url',
						async ({ status, user, query }) => {
							const storage = new StorageService(user);

							try {
								const url = await storage.createPresignedUrl({
									item: query.item,
									proxyurl: query.proxyurl
								});
								return url;
							} catch (e) {
								logger.error('Failed to get presigned url', e);
								return status(500, 'Failed to get presigned url');
							}
						},
						{
							auth: true,
							storage: true,
							query: t.Object({
								item: t.String(),
								proxyurl: t.String()
							}),
							detail: {
								summary: 'Get an item url',
								description: 'Fetches a presigned url for an item.'
							},
							response: {
								200: 'ObjectUrl',
								400: badRequestErrorSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.get(
						'/object',
						async ({ status, user, query }) => {
							const storage = new StorageService(user);

							try {
								const object = await storage.getObject(query);
								return object;
							} catch (e) {
								logger.error(`Failed to get object ${query.key} (folder: ${query.folder})`, e);
								return status(500, `Failed to get object ${query.key} (folder: ${query.folder})`);
							}
						},
						{
							auth: true,
							storage: true,
							query: t.Object({
								key: t.String(),
								folder: t.Optional(t.String())
							}),
							detail: {
								summary: 'Get an item url',
								description: 'Fetches a presigned url for an item.'
							},
							response: {
								200: 'Object',
								400: badRequestErrorSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.post(
						'/',
						async ({ status, body, query, user }) => {
							const storage = new StorageService(user);
							try {
								const res = await storage.upload(body.file, query.proxyurl, body.folder);
								return res;
							} catch (e) {
								logger.error('Failed to upload object', e);
								return status(500, 'Failed to upload object');
							}
						},
						{
							auth: true,
							detail: {
								summary: 'Upload an object',
								description: 'Uploads a single object'
							},
							body: 'UploadObject',
							query: t.Object({
								proxyurl: t.String()
							}),
							response: {
								201: UploadedFileSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.delete(
						'/',
						async ({ status, user, query }) => {
							const storage = new StorageService(user);
							try {
								await storage.deleteItem(query.item);
								return 'Deleted';
							} catch (e) {
								logger.error('Failed to upload object', e);
								return status(500, 'Failed to upload object');
							}
						},
						{
							auth: true,
							query: t.Object({
								item: t.String()
							}),
							detail: {
								summary: 'Delete a folder',
								description: 'Deletes a folder and all of its contents.'
							},
							response: {
								203: deletedSchema,
								403: unauthorizedSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.group('/folder', (app) => {
						return app.post(
							'/',
							async ({ status, body, user }) => {
								const storage = new StorageService(user);
								try {
									await storage.createFolder(body);
									return 'Created';
								} catch (e) {
									logger.error('Failed to upload object', e);
									return status(500, 'Failed to upload object');
								}
							},
							{
								auth: true,
								body: 'CreateFolder',
								detail: {
									summary: 'Create a folder',
									description: 'Creates a single folder'
								},
								response: {
									201: createdSchema,
									403: unauthorizedSchema,
									500: internalServerErrorSchema
								}
							}
						);
					});
			})
	);
