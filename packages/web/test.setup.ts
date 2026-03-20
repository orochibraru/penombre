import { mock } from "bun:test";

// Mock SvelteKit and environment modules before any imports
const mockAppEnvironment = {
	dev: false,
	building: false,
	browser: false,
};

// Use Bun's mock.module to properly mock SvelteKit modules
mock.module("$app/environment", () => mockAppEnvironment);

mock.module("$env/dynamic/private", () => ({
	env: process.env, // Use actual process.env so tests can manipulate it
}));

mock.module("$app/server", () => ({
	getRequestEvent: () => null,
}));

mock.module("$app/paths", () => ({
	resolve: mock((path: string) => path),
}));

mock.module("$lib/api", () => ({
	api: {
		GET: mock(() => Promise.resolve({ data: null, error: undefined })),
	},
}));

mock.module("$lib/server/auth", () => ({
	auth: {
		api: {
			getSession: mock(() => Promise.resolve(null)),
			updateUser: mock(() => Promise.resolve({ status: true })),
			adminUpdateUser: mock(() => Promise.resolve({})),
			listApiKeys: mock(() => Promise.resolve([])),
			listPasskeys: mock(() => Promise.resolve([])),
			createApiKey: mock(() => Promise.resolve({ key: "mock-key" })),
			changePassword: mock(() => Promise.resolve({})),
			listSessions: mock(() => Promise.resolve([])),
			listUsers: mock(() => Promise.resolve({ users: [] })),
		},
	},
}));

mock.module("$lib/server/config", () => ({
	getPenombreConfig: mock(() => ({
		smtp: undefined,
	})),
}));

mock.module("$lib/server/services/storage", () => ({
	StorageService: {
		getAvailableStorageSize: mock(() => 1073741824),
	},
}));

mock.module("$lib/logger", () => ({
	Logger: class {
		debug() {}
		error() {}
		info() {}
		warn() {}
	},
}));
