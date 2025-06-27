import { auth } from '$lib/auth';
import { betterAuth, OpenAPI } from '$lib/server/api/auth';
import { filesRouter } from '$lib/server/api/routers/files';
import { db } from '$lib/server/db';
import { StorageService } from '$lib/server/services/storage';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Log } from '@kitql/helpers';
import { sql } from 'drizzle-orm';
import { Elysia } from 'elysia';
import packageJson from '../../../../package.json';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

const logger = new Log('API');

export const router = new Elysia()
	.use(cors())
	.use(betterAuth)
	.group('/api/v1', (app) => {
		return app
			.get(
				'/ping',
				async () => {
					try {
						await db.execute(sql`select 1`);
					} catch {
						logger.error('Database service is unreachable.');
						throw new Error('Database service is unreachable.');
					}

					const client = new S3Client(StorageService.getConfig());

					try {
						await client.send(new ListBucketsCommand());
					} catch {
						logger.error('Storage service is unreachable.');
						logger.error(StorageService.getConfig());
						throw new Error('Storage service is unreachable.');
					}

					return 'PONG!';
				},
				{
					detail: {
						tags: ['General'],
						summary: 'Healthcheck',
						description: 'Should respond "PONG!"'
					}
				}
			)
			.derive(async ({ status, request: { headers } }) => {
				const session = await auth.api.getSession({
					headers
				});

				if (!session) return status(401);
				const storage = new StorageService(session.user);
				return { storage };
			})
			.use(filesRouter);
	})
	.use(
		swagger({
			provider: 'swagger-ui',
			path: '/api/v1/docs',
			excludeTags: ['default'],
			swaggerOptions: {
				// @ts-expect-error This lib is a bit weird
				url: '/api/v1/docs/json'
			},
			documentation: {
				paths: await OpenAPI.getPaths(),
				info: {
					title: 'Opendrive API',
					version: packageJson.version
				},
				tags: [
					{ name: 'General', description: 'Utility endpoints' },
					{ name: 'Files', description: 'File Operations Endpoints' },
					{ name: 'Better Auth', description: 'Auth Endpoints' }
				],
				components: {
					...(await OpenAPI.components),
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT'
						}
					}
				},
				security: [
					{
						bearerAuth: []
					}
				]
			}
		})
	);

export type API = typeof router;

export type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;
