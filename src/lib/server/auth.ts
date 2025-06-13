import { env } from '$env/dynamic/private';
import type { User } from '$lib/auth-utils';
import { ADMIN_USERS, RbacOperations, adminOnlyOperations } from '$lib/rbac';
import { generateNonce } from '$lib/utils';
import { Log, green } from '@kitql/helpers';
import { type JSONWebKeySet, createLocalJWKSet, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import {
    type TokenEndpointResponse,
    calculatePKCECodeChallenge,
    randomPKCECodeVerifier
} from 'openid-client';

export const authCookieName = 'auth-cookie';
export const authRefreshCookieName = 'auth-refresh-cookie';
export const authStorageCookieName = 'auth-storage-cookie';
export const defaultEndpoints = {
    token: 'oauth2/token',
    authorize: 'oauth2/authorize',
    openidConfig: '.well-known/openid-configuration'
};

export const defaultCallbackPath = '/auth/sign-in';

export enum GrantTypes {
    RefreshToken = 'refresh_token',
    AuthorizationCode = 'authorization_code',
    ClientCredentials = 'client_credentials'
}

export enum ResponseTypes {
    Code = 'code'
}

export enum Scopes {
    OpenID = 'openid'
}

export enum CodeChallengeMethods {
    S256 = 'S256'
}

export { ADMIN_USERS, adminOnlyOperations, RbacOperations };

const logger = new Log('Auth');

export type AuthStorage = {
    state: string;
    nonce: string;
    codeVerifier: string;
};

interface IAuth {
    callBackPath: string;
    url?: URL;
    clientId?: string;
    issuerUrl?: string;
    clientSecret?: string;
    debug?: boolean;
    impersonating?: boolean;
}

export type OpenIdConfig = {
    authorization_endpoint: string;
    end_session_endpoint: string;
    id_token_signing_alg_values_supported: string[];
    issuer: string;
    jwks_uri: string;
    response_types_supported: string[];
    revocation_endpoint: string;
    scopes_supported: string[];
    subject_types_supported: string[];
    token_endpoint: string;
    token_endpoint_auth_methods_supported: string[];
    userinfo_endpoint: string;
};

export type JWKs = JSONWebKeySet;

export const AUTH_COOKIE_NAME = 'auth_token';

export class AuthService {
    private clientId: string;
    private clientSecret: string;
    private issuerUrl: URL;
    private callbackUri: string;
    private debug?: boolean;
    private jwks?: JWKs;
    public url: URL;
    public user?: User;
    public openIdConfig?: OpenIdConfig;
    public impersonating: boolean;
    public initalized: boolean;

    /**
     * Create an instance of AuthService.
     *
     * @param {IAuth} options
     * @param {URL} options.url The base URL of the service.
     * @param {string} [options.callBackPath] The path that will be called after redirecting from the authorization server.
     * @param {string} [options.clientId] The client ID of the service.
     * @param {string} [options.clientSecret] The client secret of the service.
     * @param {string} [options.issuerUrl] The URL of the authorization server.
     * @param {boolean} [options.debug] Whether to log debug information.
     */
    constructor({
        url,
        callBackPath,
        clientId,
        clientSecret,
        issuerUrl,
        debug,
        impersonating
    }: IAuth) {
        const maybeClientId = clientId ?? env.OAUTH_CLIENT_ID;
        const maybeClientSecret = clientSecret ?? env.OAUTH_CLIENT_SECRET;
        const maybeIssuerUrl = issuerUrl ?? env.OAUTH_ISSUER_URL;

        if (!maybeClientId) {
            throw new Error('Could not find a client ID');
        }

        if (!maybeClientSecret) {
            throw new Error('Could not find a client Secret');
        }

        if (!maybeIssuerUrl) {
            throw new Error('Could not find an Issuer URL');
        }

        this.clientId = maybeClientId;
        this.clientSecret = maybeClientSecret;
        this.issuerUrl = new URL(maybeIssuerUrl);
        this.url = url ?? new URL('http://localhost');
        this.callbackUri = this.url.origin + (callBackPath ?? defaultCallbackPath);
        this.debug = debug ?? false;
        this.impersonating = impersonating ?? false;
        this.initalized = false;
    }

    /**
     * Initialize the Auth Service by calling setConfig and calculating the code verifier
     * and challenge. The config is then printed to the console if debug is enabled.
     */
    public async init() {
        this.openIdConfig = await this.fetchOpenIdConfig();
        this.jwks = await this.fetchJwks();

        if (this.debug) {
            logger.info(this.openIdConfig);
        }

        this.initalized = true;
    }

    /**
     * Verify a JWT token.
     *
     * @param token - The JWT token to verify.
     * @returns true if the token is valid, false otherwise.
     */
    public async verifyJwt(token?: string) {
        if (!token) {
            return false;
        }

        try {
            if (this.debug) {
                logger.info('Creating remote JWK Set');
            }

            if (!this.jwks) {
                throw new Error('JWKS are not generated yet.');
            }

            const JWKS = createLocalJWKSet(this.jwks);

            if (this.debug) {
                logger.info('Verifying JWT...');
            }
            await jwtVerify(token, JWKS);

            if (this.debug) {
                logger.info('JWT is valid.');
            }
            return true;
        } catch (e) {
            if (this.debug) {
                logger.error('JWT is invalid!');
            }
            return false;
        }
    }

    public setUrl(url: URL) {
        this.url = url;
    }

    /**
     * Determines if the current user has permission to perform the specified operation.
     * Admin-only operations require the user to have admin privileges.
     *
     * @param operation - The operation to check for permission.
     * @returns A boolean indicating whether the user can perform the operation.
     */

    public can(operation: RbacOperations) {
        if (adminOnlyOperations.includes(operation)) {
            return this.isAdmin();
        }

        if (this.user) {
            return true;
        }

        return false;
    }

    /**
     * Check if the given user is an admin user.
     * If the user is not given, the currently signed in user is used.
     * @param user - The user to check, or undefined to check the currently signed in user
     * @returns A boolean indicating whether the user is an admin
     */
    public isAdmin(user?: string) {
        return this.impersonating
            ? false
            : ADMIN_USERS.includes(user ? user : (this.user?.preferred_username ?? ''));
    }

    /**
     * Generate the redirect URI using the openid-client library.
     * @returns a URL for the authorization_endpoint with the appropriate parameters.
     */
    public async getRedirectUrl(): Promise<{ url: URL; storage: AuthStorage }> {
        if (this.debug) {
            logger.info('Getting redirect URI');
        }

        // Always regenerate state for security
        const state = nanoid(48);
        const codeVerifier = randomPKCECodeVerifier();
        const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
        const nonce = await generateNonce();

        const params = new URLSearchParams({
            client_id: this.clientId,
            scope: Scopes.OpenID,
            response_type: ResponseTypes.Code,
            redirect_uri: this.callbackUri,
            code_challenge: codeChallenge,
            code_challenge_method: CodeChallengeMethods.S256,
            code_verifier: codeVerifier,
            nonce: nonce,
            state: state
        });

        if (!this.openIdConfig) {
            throw new Error('OpenID config not generated yet.');
        }

        const url = new URL(`${this.openIdConfig.authorization_endpoint}?${params.toString()}`);

        return {
            url,
            storage: {
                state,
                codeVerifier,
                nonce
            }
        };
    }

    /**
     * Perform an authorization code grant using the code provided
     * from the authorization_endpoint redirect.
     * @param url The URL that the authorization_endpoint redirected to.
     * @returns A Promise that resolves with the access token response.
     */
    public async callback(url: URL, storage: AuthStorage) {
        if (this.debug) {
            logger.info('Getting authorization code grant');
        }

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!state) {
            throw new Error('No state found in URL.');
        }

        if (!code) {
            throw new Error('No code found in URL.');
        }

        if (state !== storage.state) {
            if (this.debug) {
                logger.info(state, storage.state);
            }
            throw new Error('State mismatch.');
        }

        const params = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            state: state,
            code: code,
            code_verifier: storage.codeVerifier,
            redirect_uri: this.callbackUri,
            nonce: storage.nonce,
            grant_type: GrantTypes.AuthorizationCode
        };

        if (!this.openIdConfig) {
            throw new Error('OpenID config not generated yet.');
        }

        const fetchUrl = this.openIdConfig.token_endpoint;
        logger.info(`${green('POST')} ${fetchUrl}`);

        try {
            const req = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(params)
            });

            if (!req.ok) {
                const text = await req.text();
                throw new Error(`${req.status} - ${text}`);
            }

            const res: TokenEndpointResponse = await req.json();

            return res;
        } catch (e) {
            logger.error(e);
            throw e;
        }
    }

    /**
     * Use the refresh token to get a new access token and ID token.
     * @param refreshToken The refresh token.
     * @returns A Promise that resolves with the new access token and ID token, or undefined if the refresh fails.
     */
    public async refresh(refreshToken: string): Promise<TokenEndpointResponse | undefined> {
        const params = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: GrantTypes.RefreshToken,
            redirect_uri: this.callbackUri,
            refresh_token: refreshToken
        };

        if (!this.openIdConfig) {
            throw new Error('OpenID config not generated yet.');
        }

        const fetchUrl = this.openIdConfig.token_endpoint;
        logger.info(`${green('POST')} ${fetchUrl}`);

        try {
            const req = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(params)
            });

            if (!req.ok) {
                logger.error(await req.text());
                return;
            }

            const res = await req.json();
            return res;
        } catch (e) {
            logger.error('Failed to refresh token');
            logger.error(e);
            return;
        }
    }

    /**
     * Use the access token from the authorization code grant to get the user's
     * information. This is a helper method that wraps openid-client's fetchUserInfo.
     * @param accessToken The access token from the authorization code grant.
     * @returns A Promise that resolves with the user's information.
     */
    public async getUserInfo(accessToken: string): Promise<User | undefined> {
        if (this.debug) {
            logger.info('Getting user info');
        }

        if (!this.openIdConfig) {
            throw new Error('OpenID config not generated yet.');
        }

        const url = this.openIdConfig.userinfo_endpoint;
        logger.info(`${green('GET')} ${url}`);

        const req = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-amz-json-1.1'
            },
            method: 'GET'
        });

        if (!req.ok) {
            logger.error('Failed to fetch user info');
            throw new Error(await req.text());
        }

        this.user = await req.json();

        return this.user;
    }

    /**
     * Fetch the OpenID configuration from the issuer.
     * @returns A Promise that resolves with the OpenID configuration.
     */
    public async fetchOpenIdConfig(): Promise<OpenIdConfig> {
        const req = await fetch(`${this.issuerUrl}/${defaultEndpoints.openidConfig}`);
        if (!req.ok) {
            const text = await req.text();
            throw new Error(text);
        }

        const res = await req.json();
        return res;
    }

    /**
     * Fetch the JSON Web Key Set (JWKS) from the OpenID Connect Issuer.
     * The JWKS is used to verify the signature of the ID token.
     * @returns A Promise that resolves with the JSON Web Key Set.
     */
    public async fetchJwks(): Promise<JWKs> {
        const req = await fetch(`${this.openIdConfig?.jwks_uri}`);
        if (!req.ok) {
            const text = await req.text();
            throw new Error(text);
        }

        const res = await req.json();
        return res;
    }
}
