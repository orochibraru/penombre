import { RbacOperations } from '$lib/auth';
import { authMiddleware } from '$lib/server/api/middleware';
import {
    internalServerErrorSchema,
    notFoundSchema,
    unauthorizedSchema
} from '$lib/server/api/schemas';
import bearer from '@elysiajs/bearer';
import { Log } from '@kitql/helpers';
import { Elysia, type Static, t } from 'elysia';

const logger = new Log('PoolsRouter');

export const fileListSchema = t.Object({
    Id: t.Optional(t.String({ default: 'region-pool-id' })),
    Name: t.Optional(t.String({ default: 'example-user-pool' })),
    CreationDate: t.Optional(t.Date({ default: new Date() })),
    LastModifiedDate: t.Optional(t.Date({ default: new Date() })),
    LambdaConfig: t.Optional(
        t.Object({
            PostAuthentication: t.Optional(t.String({ default: 'arn:some-arn' })),
            PreTokenGeneration: t.Optional(t.String({ default: 'arn:some-arn' })),
            PreTokenGenerationConfig: t.Optional(
                t.Object({
                    LambdaArn: t.Optional(t.String({ default: 'arn:some-arn' })),
                    LambdaVersion: t.Optional(t.String({ default: 'V1_0' }))
                })
            )
        })
    )
});
export type FileList = Static<typeof fileListSchema>;

export const fileDetailsSchema = t.Object({
    Id: t.Optional(t.String({ default: 'region-pool-id' })),
    Name: t.Optional(t.String({ default: 'example-user-pool' })),
    CreationDate: t.Optional(t.Date({ default: new Date() })),
    LastModifiedDate: t.Optional(t.Date({ default: new Date() })),
    LambdaConfig: t.Optional(
        t.Object({
            PostAuthentication: t.Optional(t.String({ default: 'arn:some-arn' })),
            PreTokenGeneration: t.Optional(t.String({ default: 'arn:some-arn' })),
            PreTokenGenerationConfig: t.Optional(
                t.Object({
                    LambdaArn: t.Optional(t.String({ default: 'arn:some-arn' })),
                    LambdaVersion: t.Optional(t.String({ default: 'V1_0' }))
                })
            )
        })
    ),
    UserPoolTags: t.Optional(t.Record(t.String(), t.String())),
    EstimatedNumberOfUsers: t.Optional(t.Numeric()),
    Domain: t.Optional(t.String()),
    EmailVerificationSubject: t.Optional(t.String()),
    EmailVerificationMessage: t.Optional(t.String()),
    Arn: t.Optional(t.String()),
    SmsVerificationMessage: t.Optional(t.String()),
    Policies: t.Optional(t.Unknown()),
    SchemaAttributes: t.Optional(t.Unknown()),
    AutoVerifiedAttributes: t.Optional(t.Unknown()),
    AliasAttributes: t.Optional(t.Unknown()),
    UsernameAttributes: t.Optional(t.Unknown()),

    VerificationMessageTemplate: t.Optional(t.Unknown()),

    SmsAuthenticationMessage: t.Optional(t.Unknown()),
    UserAttributeUpdateSettings: t.Optional(t.Unknown()),
    DeviceConfiguration: t.Optional(t.Unknown()),
    EmailConfiguration: t.Optional(t.Unknown()),
    SmsConfiguration: t.Optional(t.Unknown()),
    SmsConfigurationFailure: t.Optional(t.Unknown()),
    EmailConfigurationFailure: t.Optional(t.Unknown()),
    CustomDomain: t.Optional(t.Unknown()),
    AdminCreateUserConfig: t.Optional(t.Unknown()),
    UserPoolAddOns: t.Optional(t.Unknown()),
    UsernameConfiguration: t.Optional(t.Unknown()),
    AccountRecoverySetting: t.Optional(t.Unknown())
});

export type FileDetails = Static<typeof fileDetailsSchema>;

export const folderDetailsSchema = t.Object({
    AllowedOAuthFlows: t.Optional(t.Array(t.String())),
    AllowedOAuthFlowsUserPoolClient: t.Optional(t.Boolean()),
    AllowedOAuthScopes: t.Optional(t.Array(t.String({ default: 'openid' }))),
    AuthSessionValidity: t.Optional(t.Numeric()),
    CallbackURLs: t.Optional(t.Array(t.String())),
    ClientId: t.Optional(t.String({ default: 'random-client-id' })),
    ClientName: t.Optional(t.String({ default: 'my-app-client' })),
    ClientSecret: t.Optional(t.String()),
    CreationDate: t.Optional(t.Date({ default: new Date() })),
    EnablePropagateAdditionalUserContextData: t.Optional(t.Boolean()),
    EnableTokenRevocation: t.Optional(t.Boolean()),
    LastModifiedDate: t.Optional(t.Optional(t.Date({ default: new Date() }))),
    LogoutURLs: t.Optional(t.Array(t.String())),
    SupportedIdentityProviders: t.Optional(t.Array(t.String({ default: 'roche' }))),
    RefreshTokenValidity: t.Optional(t.Numeric()),
    IdTokenValidity: t.Optional(t.Numeric()),
    AccessTokenValidity: t.Optional(t.Numeric()),
    ReadAttributes: t.Optional(t.Array(t.String())),
    WriteAttributes: t.Optional(t.Array(t.String())),
    DefaultRedirectURI: t.Optional(t.String()),
    TokenValidityUnits: t.Optional(
        t.Object({
            AccessToken: t.Optional(t.String()),
            IdToken: t.Optional(t.String()),
            RefreshToken: t.Optional(t.String())
        })
    ),
    UserPoolId: t.Optional(t.String({ default: 'region-pool-id' })),
    AnalyticsConfiguration: t.Optional(
        t.Object({
            ApplicationId: t.Optional(t.String()),
            ApplicationArn: t.Optional(t.String()),
            RoleArn: t.Optional(t.String()),
            ExternalId: t.Optional(t.String()),
            UserDataShared: t.Optional(t.Boolean())
        })
    ),
});

export type FolderDetails = Static<typeof folderDetailsSchema>;

export const folderFilesSummarySchema = t.Object({
    ClientId: t.Optional(t.String({ default: 'random-client-id' })),
    ClientName: t.Optional(t.String({ default: 'my-app-client' })),
    UserPoolId: t.Optional(t.String({ default: 'region-pool-id' }))
});

export type FolderFilesSummary = Static<typeof folderFilesSummarySchema>;

export const createFileSchema = t.Object({
    name: t.String({ minLength: 3 }),
    description: t.String({ minLength: 20 }),
    contacts: t.Array(t.String()),
    generateSecret: t.Boolean(),
    scopes: t.Array(t.String()),
    loginUrls: t.Array(t.String()),
    logoutUrls: t.Array(t.String())
});

export type CreateFileSchema = Static<typeof createFileSchema>;

export const filesRouter = new Elysia({
    detail: {
        tags: ['Files']
    }
}).group('/files', (app) =>
    app
        .use(bearer())
        .derive(async ({ request, error, bearer }) => {
            const { success, user, auth } = await authMiddleware(request, bearer);
            if (!success) {
                return error(401);
            }

            return {
                user,
                auth
            };
        })
        .model({
            File: fileListSchema,
            FileList: t.Array(fileListSchema),
            FileDetails: fileDetailsSchema,
            CreateFile: createFileSchema,
            FolderFilesSummary: folderFilesSummarySchema,
            FolderDetails: folderDetailsSchema
        })
        .get(
            '/',
            async ({ auth, error }) => {
                if (!auth.can(RbacOperations.LIST_POOLS)) {
                    return error(403, undefined);
                }

                try {
                    return "file list"
                } catch (e) {
                    logger.error('Failed to list files', e);
                    return error(500, undefined);
                }
            },
            {
                detail: {
                    summary: 'List Files',
                    description: 'Fetches all pools for the selected aws environment',
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
            async ({ params, auth, error, body }) => {
                if (!auth.can(RbacOperations.CREATE_POOL_CLIENT)) {
                    return error(403, undefined);
                }
                try {
                    const client = {
                        ClientName: body.name,
                        GenerateSecret: body.generateSecret,
                        LogoutURLs: body.logoutUrls,
                        CallbackURLs: body.loginUrls,
                        AllowedOAuthScopes: body.scopes,
                    };

                    return client;
                } catch (e) {
                    logger.error(`Failed to create file ${body.name}`, e);
                    return error(500, undefined);
                }
            },
            {
                detail: {
                    summary: 'Create a pool client',
                    description:
                        'Creates a single client for a single pool in the selected aws environment',
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
                    console.debug(`Folder id ${params.id}`)
                    if (!params.id) {
                        return error(404, undefined)
                    }
                })
                .get(
                    '/',
                    async ({ params, auth, error }) => {
                        if (!auth.can(RbacOperations.VIEW_POOL)) {
                            return error(403, undefined);
                        }
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
                            description: 'Fetches files in a dir',
                        },
                        response: {
                            200: 'FolderDetails',
                            403: unauthorizedSchema,
                            404: notFoundSchema,
                            500: internalServerErrorSchema
                        }
                    }
                )
        })
);
