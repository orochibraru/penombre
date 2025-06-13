import { route } from '$lib/ROUTES';
import { AuthService } from '$lib/auth';
import type { User } from '$lib/auth-utils';
import { impersonatingParam } from '$lib/rbac';

export const publicPaths = ['/api/v1/docs', '/api/v1/ping'];

let user: User | undefined = undefined;

export async function authMiddleware(
    request: Request,
    bearer: string
): Promise<{ success: boolean; user?: User; auth: AuthService }> {
    const impersonate = request.headers.get(`x-${impersonatingParam}`);
    const auth = new AuthService({
        url: new URL(request.url),
        callBackPath: route('/auth/sign-in'),
        impersonating: impersonate === 'true'
    });

    await auth.init();

    if (user) {
        auth.user = user;
        return { success: true, user, auth };
    }

    const uri = new URL(request.url);
    let bypass = false;

    for (const publicPath of publicPaths) {
        if (uri.pathname.startsWith(publicPath)) {
            bypass = true;
        }
    }

    if (bypass) {
        return { success: true, user: undefined, auth };
    }

    if (!bearer) {
        return { success: false, user: undefined, auth };
    }

    const jwtValid = await auth.verifyJwt(bearer);

    if (!jwtValid) {
        return { success: false, user: undefined, auth };
    }

    user = await auth.getUserInfo(bearer);

    return { success: true, user, auth };
}
