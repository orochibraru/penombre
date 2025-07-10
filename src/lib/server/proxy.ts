import type { Handle } from '@sveltejs/kit';
import { Logger } from '$lib/logger';

const logger = new Logger('Service::Proxy');

/**
 * Options for the proxy handle.
 */
interface ProxyOptions {
	/**
	 * Enable debug logging to the console.
	 * @default false
	 */
	debug?: boolean;
	/**
	 * Change the origin of the host header to the target URL.
	 * @default true
	 */
	changeOrigin?: boolean;
}

/**
 * A SvelteKit handle that proxies requests to a different server.
 *
 * @param proxy - An object where keys are path prefixes to match and values are the target URLs to proxy to.
 * @param options - Configuration options for the proxy.
 * @returns A SvelteKit `Handle` function.
 */
export function proxyHandle(
	proxy: { [key: string]: string },
	options: ProxyOptions = { changeOrigin: true }
): Handle {
	return async ({ event, resolve }) => {
		const { url, request } = event;
		const { pathname, search } = url;

		/**
		 * Find the first matching path.
		 */
		const matchingProxy = Object.keys(proxy).find((proxyPath) => pathname.match(proxyPath));

		if (matchingProxy) {
			const proxyTarget = proxy[matchingProxy];

			/**
			 * Collect request headers.
			 */
			const requestHeaders = new Headers(request.headers);
			if (options.changeOrigin) {
				requestHeaders.delete('host');
			}

			if (options.debug) {
				logger.debug(`Proxy: ${proxyTarget}${pathname}`, requestHeaders);
			}

			/**
			 * Fetch data from the remote server.
			 */
			try {
				const response = await fetch(`${proxyTarget}${pathname}${search}`, {
					redirect: 'manual',
					method: request.method,
					headers: requestHeaders,
					body: request.body
					// duplex: 'half', // Required for request body
				});

				/**
				 * Clean up response headers.
				 */
				const responseHeaders = new Headers(response.headers);
				responseHeaders.delete('content-encoding');

				if (options.debug) {
					logger.debug(`Proxy response (${response.status}) headers:`, responseHeaders);
				}

				/**
				 * Return the response from the remote server.
				 */
				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: responseHeaders
				});
			} catch (error) {
				logger.error(error);
				// You might want to return a proper error response here
				return new Response('Proxy error', { status: 500 });
			}
		}

		/**
		 * Proceed without proxying.
		 */
		return await resolve(event);
	};
}
