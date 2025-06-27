import { auth } from '$lib/auth';
import { apiBasePath } from '$lib/auth-client';
import Elysia from 'elysia';

export const betterAuth = new Elysia({ name: 'better-auth' }).mount(auth.handler).macro({
	auth: {
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({
				headers
			});

			if (!session) return status(401);

			return session;
		}
	}
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => {
	if (!_schema) {
		_schema = auth.api.generateOpenAPISchema();
	}
	return _schema;
};

export const OpenAPI = {
	getPaths: (prefix = apiBasePath) =>
		getSchema().then(({ paths }) => {
			const reference: typeof paths = Object.create(null);

			for (const path of Object.keys(paths)) {
				const key = prefix + path;
				reference[key] = paths[path];

				for (const method of Object.keys(paths[path])) {
					// biome-ignore lint/suspicious/noExplicitAny: This needs to be like this.
					const operation = (reference[key] as any)[method];

					operation.tags = ['Better Auth'];
				}
			}

			return reference;
			// biome-ignore lint/suspicious/noExplicitAny: This needs to be like this.
		}) as Promise<any>,
	// biome-ignore lint/suspicious/noExplicitAny: This needs to be like this.
	components: getSchema().then(({ components }) => components) as Promise<any>
} as const;
