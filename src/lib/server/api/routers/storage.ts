import { authMacro } from '$lib/server/api/auth';
import {
	createdSchema,
	internalServerErrorSchema,
	notFoundSchema,
	unauthorizedSchema
} from '$lib/server/api/schemas';
import {
	S3BucketSchema,
	S3ObjectList,
	S3ObjectSchema,
	StorageService
} from '$lib/server/services/storage';
import { Logger } from '$lib/logger';
import { Elysia, t } from 'elysia';

const logger = new Logger('FilesRouter');

const UploadSchema = t.File();

const CreateFolderSchema = t.String();

export const filesRouter = new Elysia({
	detail: {
		tags: ['Storage']
	}
})
	.model({
		UploadObject: UploadSchema,
		CreateFolder: CreateFolderSchema,
		Object: S3ObjectSchema,
		ObjectList: S3ObjectList,
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
								return status(500, 'Failed to list objects');
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
					.get(
						'/recent',
						async ({ status, user }) => {
							const storage = new StorageService(user);
							try {
								const objects = await storage.listRecentObjects();
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
								403: unauthorizedSchema,
								404: notFoundSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.post(
						'/',
						async ({ status, body, user }) => {
							const storage = new StorageService(user);
							try {
								await storage.upload(body);
								return 'Uploaded';
							} catch (e) {
								logger.error('Failed to upload object', e);
								return status(500, 'Failed to upload object');
							}
						},
						{
							auth: true,
							parse: 'multipart/form-data',
							detail: {
								summary: 'Upload an object',
								description: 'Uploads a single object'
							},
							body: 'UploadObject',
							response: {
								201: createdSchema,
								403: unauthorizedSchema,
								404: notFoundSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.post(
						'/folder',
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
								404: notFoundSchema,
								500: internalServerErrorSchema
							}
						}
					)
					.group('/:folder', (app) => {
						return app
							.derive(async ({ params, status }) => {
								logger.debug(`Folder ${params.folder}`);
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
