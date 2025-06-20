import { auth } from '$lib/auth';
import { filesRouter } from '$lib/server/api/routers/files';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import packageJson from '../../../../package.json';

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
	.get('/user', ({ user }) => user, {
		auth: true
	})
	.get('/ping', () => 'PONG!', {
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
	})
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
					{ name: 'Pools', description: 'User Pool Endpoints' }
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
