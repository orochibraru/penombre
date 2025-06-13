import { authMiddleware } from '$lib/server/api/middleware';
import { filesRouter } from '$lib/server/api/routers/files';
import { bearer } from '@elysiajs/bearer';
import { cors } from '@elysiajs/cors';
import { serverTiming } from '@elysiajs/server-timing';
import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import packageJson from '../../../../package.json';

export const router = new Elysia({ prefix: '/api/v1' })
    .use(cors())
    .use(serverTiming())
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
    .use(bearer())
    .derive(async ({ bearer, request, error }) => {
        const { success, user } = await authMiddleware(request, bearer);
        if (!success) {
            return error(401);
        }
        return {
            user
        };
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
                    title: 'Janus API',
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
