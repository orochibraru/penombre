import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { route } from '$lib/ROUTES';
import type { User } from '$lib/auth-utils';
import { DEFAULT_CACHE_TTL } from '$lib/cache';
import { impersonatingParam } from '$lib/rbac';
import { AuthService, authCookieName, authRefreshCookieName } from '$lib/server/auth';
import { Log, green } from '@kitql/helpers';
import { type Handle, type HandleServerError, error } from '@sveltejs/kit';
import type { Reroute } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import NodeCache from 'node-cache';

const logger = new Log('Hooks');
let killing = false;

let cache: NodeCache | null;
let auth: AuthService | null;

export const init = () => {
    logger.info('Initializing cache...');
    cache = new NodeCache();

    logger.info('Initializing auth...');
    auth = new AuthService({
        callBackPath: route('/auth/sign-in')
    });
};

export const handleError: HandleServerError = ({ error, event }) => {
    const errorId = crypto.randomUUID();

    event.locals.error = error?.toString() ?? '';
    if (error instanceof Error) {
        event.locals.errorStackTrace = error.stack ?? '';
    } else {
        event.locals.errorStackTrace = '';
    }

    event.locals.errorId = errorId;

    const typedError = error as Error;

    logger.error(JSON.stringify(typedError));
    logger.error({
        url: event.request.url,
        message: typedError.message,
        errorId,
        stackTrace: typedError.stack,
        date: new Date().toISOString()
    });

    return {
        message: `An unexpected error occurred: ${typedError.message}`,
        errorId
    };
};

const generalHandler: Handle = async ({ event, resolve }) => {
    if (!cache) {
        return error(500, 'Failed to init cache');
    }
    event.locals.cache = cache;
    logger.info(`${green(event.request.method)} ${event.url.href}`);
    event.locals.cacheBypass = !!env.CACHE_BYPASS;

    return resolve(event);
};


/**
 * Initialize the Auth Service and assign it to the app's locals
 */
const authHandler: Handle = async ({ event, resolve }) => {
    // Bypass for API
    if (event.url.pathname.startsWith('/api')) {
        return resolve(event);
    }

    if (!auth) {
        return error(500, 'Failed to init auth');
    }

    auth.setUrl(event.url);

    if (!auth.initalized) {
        await auth.init();
    }

    event.locals.auth = auth;

    const inFourteenDays = new Date();
    inFourteenDays.setDate(inFourteenDays.getDate() + 14);
    inFourteenDays.setHours(0, 0, 0, 0);

    let accessToken: string = event.cookies.get(authCookieName) ?? 'undefined';
    const authRefreshToken = event.cookies.get(authRefreshCookieName);

    if ((!accessToken || accessToken === 'undefined') && !authRefreshToken) {
        return resolve(event);
    }

    const jwtValid = await auth.verifyJwt(accessToken);

    if (!jwtValid && authRefreshToken) {
        const tokenSet = await auth.refresh(authRefreshToken);

        if (!tokenSet) {
            logger.info('Unable to refresh token');
            return resolve(event);
        }

        if (!tokenSet.access_token) {
            logger.info('Incomplete token set.');
            return resolve(event);
        }

        event.cookies.set(authRefreshCookieName, authRefreshToken, {
            sameSite: 'strict',
            httpOnly: true,
            path: '/',
            secure: !dev,
            expires: inFourteenDays
        });

        event.cookies.set(authCookieName, tokenSet.access_token, {
            sameSite: 'strict',
            httpOnly: true,
            path: '/',
            secure: !dev,
            expires: inFourteenDays
        });

        accessToken = tokenSet.access_token;
    }

    const cachedUser: User | undefined = accessToken ? event.locals.cache.get('user') : undefined;

    let user: User | undefined = cachedUser;
    if (!user && accessToken) {
        const userReq = await auth.getUserInfo(accessToken);
        if (userReq) {
            event.locals.cache.set('user', userReq, DEFAULT_CACHE_TTL);
            user = userReq;
        }
    }

    event.locals.user = user;
    event.locals.bearerToken = accessToken;

    let isAdmin = event.locals.auth.isAdmin(event.locals.user?.preferred_username);

    const impersonation = event.url.searchParams.get(impersonatingParam);
    if (isAdmin) {
        if (impersonation === 'true') {
            event.cookies.set(impersonatingParam, 'true', {
                sameSite: 'lax',
                httpOnly: true,
                path: '/'
            });
        } else if (impersonation === 'false') {
            event.cookies.set(impersonatingParam, 'false', {
                sameSite: 'lax',
                httpOnly: true,
                path: '/'
            });
        }
    }

    const impersonateCookie = event.cookies.get(impersonatingParam);

    event.locals.impersonating = false;

    if (impersonateCookie && impersonateCookie === 'true') {
        isAdmin = false;
        event.locals.impersonating = true;
    }

    event.locals.isAdmin = isAdmin;

    return resolve(event);
};

export const handle: Handle = sequence(
    generalHandler,
    authHandler,
);

function kill(reason: string) {
    if (killing) {
        return;
    }

    killing = true;

    logger.info(`Shutting down, reason: ${reason}.`);

    process.exit(0);
}

process.on('sveltekit:shutdown', (reason) => kill(reason));
process.on('SIGTERM', () => kill('SIGTERM'));
process.on('SIGINT', () => kill('SIGINT'));
