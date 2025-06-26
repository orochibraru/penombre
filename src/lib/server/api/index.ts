import { auth } from '$lib/auth';
import { filesRouter } from '$lib/server/api/routers/files';
import { unauthorizedSchema } from '$lib/server/api/schemas';
import { db } from '$lib/server/db';
import { StorageService } from '$lib/server/services/storage';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Log } from '@kitql/helpers';
import { sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import packageJson from '../../../../package.json';

const logger = new Log('API');

const storage = new StorageService();

const betterAuth = new Elysia({ name: 'better-auth' }).mount(auth.handler).macro({
	auth: {
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({
				headers
			});

			if (!session) return status(401);

			return {
				user: session.user,
				session: session.session
			};
		}
	}
});

export const router = new Elysia({ prefix: '/api/v1' })
	.use(cors())
	.use(betterAuth)
	.model({
		User: t.Object({
			id: t.String({ default: '123' }),
			name: t.String({ default: 'John Doe' }),
			email: t.String({ default: 'm@domain.com' }),
			emailVerified: t.Boolean({ default: false }),
			image: t.String({ default: 'http://example.com/image.png' }),
			createdAt: t.Date({ default: new Date() }),
			updatedAt: t.Date({ default: new Date() })
		})
	})
	.get('/user', ({ user }) => user, {
		auth: true,
		detail: {
			tags: ['General'],
			summary: 'User information',
			description: 'User details (if logged in).'
		},
		response: {
			200: 'User',
			401: unauthorizedSchema
		}
	})
	.get(
		'/ping',
		async () => {
			try {
				await db.execute(sql`select 1`);
			} catch {
				logger.error('Database service is unreachable.');
				throw new Error('Database service is unreachable.');
			}

			try {
				await storage.listBuckets();
			} catch {
				logger.error('Storage service is unreachable.');
				throw new Error('Storage service is unreachable.');
			}

			return 'PONG!';
		},
		{
			detail: {
				tags: ['General'],
				summary: 'Healthcheck',
				description: 'Shoudl respond "PONG!"',
				security: [
					{
						bearerAuth: []
					}
				]
			}
		}
	)
	.use(filesRouter)
	.use(
		swagger({
			provider: 'swagger-ui',
			path: '/docs',
			excludeTags: ['default'],
			swaggerOptions: {
				// @ts-expect-error This lib is a bit weird
				url: '/api/v1/docs/json'
			},
			documentation: {
				info: {
					title: 'Opendrive API',
					version: packageJson.version
				},
				tags: [
					{ name: 'General', description: 'Utility endpoints' },
					{ name: 'Files', description: 'User Pool Endpoints' }
				],
				components: {
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
