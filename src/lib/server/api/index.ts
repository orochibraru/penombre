import { auth } from '$lib/server/services/auth';
import { authMacro, OpenAPI } from '$lib/server/api/auth';
import { filesRouter } from '$lib/server/api/routers/storage';
import { db, dbUrl } from '$lib/server/db';
import { StorageService } from '$lib/server/services/storage';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Logger } from '$lib/logger';
import { sql } from 'drizzle-orm';
import { Elysia } from 'elysia';
import packageJson from '../../../../package.json';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { internalServerErrorSchema, pongSchema } from '$lib/server/api/schemas';

const logger = new Logger('API');

export const router = new Elysia()
	.use(cors())
	.use(authMacro)
	.group('/api/v1', (app) => {
		return app
			.get(
				'/ping',
				async () => {
					try {
						await db.execute(sql`select 1`);
					} catch {
						const err = `Database service is unreachable at ${dbUrl}`;
						logger.error(err);
						throw new Error(err);
					}

					const storageConfig = StorageService.getConfig();

					const client = new S3Client(storageConfig);

					try {
						await client.send(new ListBucketsCommand());
					} catch {
						const err = `Storage service is unreachable at ${storageConfig.endpoint}`;
						logger.error(err);
						logger.error(storageConfig);
						throw new Error(err);
					}

					return 'PONG!';
				},
				{
					detail: {
						tags: ['General'],
						summary: 'Healthcheck',
						description: 'Should respond "PONG!"'
					},
					response: {
						200: pongSchema,
						500: internalServerErrorSchema
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
					{ name: 'General', description: 'Utility' },
					{ name: 'Storage', description: 'Storage Operations' },
					{ name: 'Better Auth', description: 'Auth' }
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
