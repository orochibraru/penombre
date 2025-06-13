import { awsParams } from '$lib/aws';
import { impersonatingParam } from '$lib/rbac';
import type { API } from '$lib/server/api/server';
import { treaty } from '@elysiajs/eden';
import { Log } from '@kitql/helpers';

const logger = new Log('API Client');

export function getApiClient(url: URL, locals: App.Locals) {
    const headers = new Headers();
    if (locals.awsEnvironment) {
        headers.append(awsParams.environmentHeader, locals.awsEnvironment);
    }

    if (locals.impersonating === true) {
        headers.append(`x-${impersonatingParam}`, 'true');
    }

    headers.append('Authorization', `Bearer ${locals.bearerToken}`);
    headers.append('Cache-Control', 'max-age=3600, must-revalidate');

    const controller = new AbortController();

    const cancelRequest = setTimeout(() => {
        logger.info('Aborting request.');
        controller.abort();
    }, 10000);

    const client = treaty<API>(url.origin, {
        headers,
        fetch: {
            signal: controller.signal
        }
    });

    clearTimeout(cancelRequest);

    return client;
}
