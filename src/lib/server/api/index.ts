import { Logger } from '$lib/logger';
import { authMacro, OpenAPI } from '$lib/server/api/auth';
import { storageRouter } from '$lib/server/api/routers/storage';
import { internalServerErrorSchema, pongSchema } from '$lib/server/api/schemas';
import { db, dbUrl } from '$lib/server/db';
import { auth } from '$lib/server/services/auth';
import { StorageService } from '$lib/server/services/storage';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { sql } from 'drizzle-orm';
import { Elysia } from 'elysia';
import packageJson from '../../../../package.json';

const logger = new Logger('API::Root');

export const router = new Elysia()
	.use(cors())
	.use(authMacro)
	.onError(({ code, error }) => {
		if (error instanceof Error) {
			logger.error(`An error occured in the API, code: ${code.toString()}`, error.cause);
		} else {
			logger.error(`An error occured in the API, code: ${code.toString()}. Cause:`, error);
		}
	})
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
			.use(storageRouter);
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
