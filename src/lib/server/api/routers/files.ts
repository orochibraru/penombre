import {
	internalServerErrorSchema,
	notFoundSchema,
	unauthorizedSchema
} from '$lib/server/api/schemas';
import { Log } from '@kitql/helpers';
import { Elysia, type Static, t } from 'elysia';

const logger = new Log('FilesRouter');

export const fileSummarySchema = t.Object({
	id: t.String({ default: 'random-uuid' }),
	name: t.String({ default: 'file-name' }),
	creationDate: t.Date({ default: new Date() }),
	lastModifiedDate: t.Date({ default: new Date() })
});
export type FileList = Static<typeof fileSummarySchema>[];

export const fileDetailsSchema = t.Object({
	id: t.String({ default: 'random-uuid' }),
	name: t.String({ default: 'folder-name' }),
	size: t.Number({ default: '123' }),
	creationDate: t.Date({ default: new Date() }),
	lastModifiedDate: t.Date({ default: new Date() })
});

export type FileDetails = Static<typeof fileDetailsSchema>;

export const folderDetailsSchema = t.Object({
	id: t.String({ default: 'random-uuid' }),
	name: t.String({ default: 'folder-name' }),
	creationDate: t.Date({ default: new Date() }),
	lastModifiedDate: t.Date({ default: new Date() })
});

export type FolderDetails = Static<typeof folderDetailsSchema>;

export const folderFilesSummarySchema = t.Object({
	id: t.String({ default: 'random-uuid' }),
	name: t.String({ default: 'folder-name' }),
	creationDate: t.Date({ default: new Date() }),
	lastModifiedDate: t.Date({ default: new Date() })
});

export type FolderFilesSummary = Static<typeof folderFilesSummarySchema>;

export const createFileSchema = t.Object({
	name: t.String({ minLength: 3 })
});

export type CreateFileSchema = Static<typeof createFileSchema>;

export const filesRouter = new Elysia({
	detail: {
		tags: ['Files']
	}
}).group('/files', (app) =>
	app
		.model({
			File: fileSummarySchema,
			FileList: t.Array(fileSummarySchema),
			FileDetails: fileDetailsSchema,
			CreateFile: createFileSchema,
			FolderFilesSummary: folderFilesSummarySchema,
			FolderDetails: folderDetailsSchema
		})
		.get(
			'/',
			async ({ error }) => {
				try {
					const objs: FileList = [
						{
							id: '1',
							name: 'test',
							creationDate: new Date(),
							lastModifiedDate: new Date()
						},
						{
							id: '2',
							name: 'test 2',
							creationDate: new Date(),
							lastModifiedDate: new Date()
						}
					];
					return objs;
				} catch (e) {
					logger.error('Failed to list files', e);
					return error(500, undefined);
				}
			},
			{
				detail: {
					summary: 'List Files',
					description: 'Fetches all files'
				},
				response: {
					200: 'FileList',
					403: unauthorizedSchema,
					404: notFoundSchema,
					500: internalServerErrorSchema
				}
			}
		)
		.post(
			'/',
			async ({ params, error, body }) => {
				try {
					const file: CreateFileSchema = {
						name: body.name
					};

					return file;
				} catch (e) {
					logger.error(`Failed to create file ${body.name}`, e);
					return error(500, undefined);
				}
			},
			{
				detail: {
					summary: 'Create a file',
					description: 'Creates a single file'
				},
				body: 'CreateFile',
				response: {
					200: 'FileDetails',
					403: unauthorizedSchema,
					404: notFoundSchema,
					500: internalServerErrorSchema
				}
			}
		)
		.group('/:id', (app) => {
			return app
				.derive(async ({ params, error }) => {
					console.debug(`Folder id ${params.id}`);
					if (!params.id) {
						return error(404, undefined);
					}
				})
				.get(
					'/',
					async ({ params, error }) => {
						try {
							return 'Files in dir';
						} catch (e) {
							logger.error(`Failed to get files in dir #${params.id}`, e);
							return error(500, undefined);
						}
					},
					{
						detail: {
							summary: 'Get files in a dir',
							description: 'Fetches files in a dir'
						},
						response: {
							200: 'FolderDetails',
							403: unauthorizedSchema,
							404: notFoundSchema,
							500: internalServerErrorSchema
						}
					}
				);
		})
);
